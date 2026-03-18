import { FirebaseError } from "firebase/app";
import {
  EmailAuthProvider,
  User,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  reauthenticateWithCredential,
  setPersistence,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updatePassword as firebaseUpdatePassword,
  updateProfile
} from "firebase/auth";
import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp
} from "firebase/firestore";
import { deleteAllUserNFTs } from "@/lib/nfts";
import { getFirebaseAuth, getFirestoreDb } from "@/lib/firebase";
import { getUserFacingError } from "@/lib/firebase-errors";

const USERS_COLLECTION = "users";
const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 20;
const USERNAME_PATTERN = /^[a-z0-9._-]+$/;

export interface AuthUser {
  uid: string;
  username: string;
  email: string;
}

export interface AuthActionResult {
  ok: boolean;
  error?: string;
}

let persistencePromise: Promise<void> | null = null;

function ensureAuthPersistence(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (!persistencePromise) {
    persistencePromise = setPersistence(
      getFirebaseAuth(),
      browserLocalPersistence
    ).then(() => undefined);
  }

  return persistencePromise;
}

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function getUsernameValidationError(value: string): string | null {
  const username = normalizeUsername(value);

  if (!username) {
    return "Username is required.";
  }

  if (username.length < USERNAME_MIN_LENGTH) {
    return `Username must be at least ${USERNAME_MIN_LENGTH} characters.`;
  }

  if (username.length > USERNAME_MAX_LENGTH) {
    return `Username must be ${USERNAME_MAX_LENGTH} characters or fewer.`;
  }

  if (!USERNAME_PATTERN.test(username)) {
    return "Username can only use lowercase letters, numbers, dots, hyphens, and underscores.";
  }

  return null;
}

function getEmailValidationError(value: string): string | null {
  const email = normalizeEmail(value);

  if (!email) {
    return "Email is required.";
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email)) {
    return "Enter a valid email address.";
  }

  return null;
}

function mapAuthUser(user: User | null): AuthUser | null {
  if (!user || !user.email) {
    return null;
  }

  return {
    uid: user.uid,
    username: normalizeUsername(user.displayName || user.email.split("@")[0]),
    email: user.email
  };
}

function isPermissionDeniedError(error: unknown): boolean {
  return error instanceof FirebaseError && error.code === "firestore/permission-denied";
}

function getCurrentAuthUserOrError(): { user: User | null; error?: string } {
  const currentUser = getFirebaseAuth().currentUser;

  if (!currentUser || !currentUser.email) {
    return { user: null, error: "Sign in to manage your account." };
  }

  return { user: currentUser };
}

export function subscribeToAuthChanges(
  onStateChange: (user: AuthUser | null) => void,
  onError?: (error: Error) => void
): () => void {
  let unsubscribe: () => void = () => {};
  let isActive = true;

  void ensureAuthPersistence()
    .then(() => {
      if (!isActive) {
        return;
      }

      unsubscribe = onAuthStateChanged(
        getFirebaseAuth(),
        (user) => onStateChange(mapAuthUser(user)),
        (error) => {
          onError?.(
            new Error(
              getUserFacingError(error, "Unable to observe Firebase authentication.")
            )
          );
        }
      );
    })
    .catch((error) => {
      onError?.(
        new Error(
          getUserFacingError(error, "Unable to start Firebase authentication.")
        )
      );
    });

  return () => {
    isActive = false;
    unsubscribe();
  };
}

async function getUserRecordByUsername(username: string) {
  const db = getFirestoreDb();
  const snapshot = await getDoc(doc(db, USERS_COLLECTION, username));

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data() as { uid?: string; username?: string; email?: string };

  return {
    uid: String(data.uid ?? ""),
    username: String(data.username ?? ""),
    email: String(data.email ?? "")
  };
}

export async function signInWithUsernameAndPassword(
  usernameInput: string,
  password: string
): Promise<AuthActionResult> {
  const username = normalizeUsername(usernameInput);
  const usernameError = getUsernameValidationError(username);

  if (usernameError) {
    return { ok: false, error: usernameError };
  }

  if (!password.trim()) {
    return { ok: false, error: "Password is required." };
  }

  try {
    const userRecord = await getUserRecordByUsername(username);

    if (!userRecord?.email) {
      return { ok: false, error: "Invalid username or password" };
    }

    await ensureAuthPersistence();
    await signInWithEmailAndPassword(getFirebaseAuth(), userRecord.email, password);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: getUserFacingError(error, "Invalid username or password")
    };
  }
}

export async function createAccount(
  emailInput: string,
  usernameInput: string,
  password: string
): Promise<AuthActionResult> {
  const email = normalizeEmail(emailInput);
  const username = normalizeUsername(usernameInput);
  const emailError = getEmailValidationError(email);
  const usernameError = getUsernameValidationError(username);

  if (emailError) {
    return { ok: false, error: emailError };
  }

  if (usernameError) {
    return { ok: false, error: usernameError };
  }

  if (!password.trim()) {
    return { ok: false, error: "Password is required." };
  }

  if (password.trim().length < 6) {
    return { ok: false, error: "Password must be at least 6 characters." };
  }

  try {
    const existingUser = await getUserRecordByUsername(username);

    if (existingUser) {
      return { ok: false, error: "Username already taken" };
    }
  } catch (error) {
    console.error("[auth] username lookup failed", error);
    return {
      ok: false,
      error: isPermissionDeniedError(error)
        ? "Username lookup is blocked by Firestore rules right now."
        : "Unable to check username availability right now."
    };
  }

  let createdUser: User | null = null;

  try {
    await ensureAuthPersistence();
    const credential = await createUserWithEmailAndPassword(
      getFirebaseAuth(),
      email,
      password
    );
    createdUser = credential.user;

    await updateProfile(createdUser, { displayName: username });

    const db = getFirestoreDb();
    await runTransaction(db, async (transaction) => {
      const userRef = doc(db, USERS_COLLECTION, username);
      const existingUser = await transaction.get(userRef);

      if (existingUser.exists()) {
        throw new Error("Username already taken");
      }

      transaction.set(userRef, {
        uid: createdUser!.uid,
        username,
        email,
        createdAt: serverTimestamp()
      });
    });

    await firebaseSignOut(getFirebaseAuth());
    return { ok: true };
  } catch (error) {
    if (createdUser) {
      try {
        await deleteUser(createdUser);
      } catch (cleanupError) {
        console.error("[auth] cleanup after failed account creation failed", cleanupError);
        await firebaseSignOut(getFirebaseAuth());
      }
    }

    if (error instanceof Error && error.message === "Username already taken") {
      return { ok: false, error: error.message };
    }

    console.error("[auth] account creation failed", error);
    return {
      ok: false,
      error: isPermissionDeniedError(error)
        ? "Account creation is blocked by Firestore rules right now."
        : getUserFacingError(error, "Unable to create this account right now.")
    };
  }
}

export async function updateUsername(usernameInput: string): Promise<AuthActionResult> {
  const { user: currentUser, error } = getCurrentAuthUserOrError();

  if (!currentUser || error) {
    return { ok: false, error };
  }

  const nextUsername = normalizeUsername(usernameInput);
  const usernameError = getUsernameValidationError(nextUsername);

  if (usernameError) {
    return { ok: false, error: usernameError };
  }

  const currentUsername = normalizeUsername(currentUser.displayName || "");

  if (!currentUsername) {
    return { ok: false, error: "Current username could not be determined." };
  }

  if (nextUsername === currentUsername) {
    return { ok: true };
  }

  try {
    const db = getFirestoreDb();

    await runTransaction(db, async (transaction) => {
      const currentUserRef = doc(db, USERS_COLLECTION, currentUsername);
      const nextUserRef = doc(db, USERS_COLLECTION, nextUsername);
      const [currentUserSnapshot, nextUserSnapshot] = await Promise.all([
        transaction.get(currentUserRef),
        transaction.get(nextUserRef)
      ]);

      if (!currentUserSnapshot.exists()) {
        throw new Error("Current account profile could not be found.");
      }

      const currentUserData = currentUserSnapshot.data() as {
        uid?: string;
        username?: string;
        email?: string;
        createdAt?: unknown;
      };

      if (String(currentUserData.uid ?? "") !== currentUser.uid) {
        throw new Error("You do not have access to this account.");
      }

      if (nextUserSnapshot.exists()) {
        throw new Error("Username already taken");
      }

      transaction.set(nextUserRef, {
        uid: currentUser.uid,
        username: nextUsername,
        email: currentUser.email,
        createdAt: currentUserData.createdAt ?? serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      transaction.delete(currentUserRef);
    });

    await updateProfile(currentUser, { displayName: nextUsername });
    return { ok: true };
  } catch (error) {
    console.error("[auth] username update failed", error);
    return {
      ok: false,
      error: getUserFacingError(error, "Unable to update your username right now.")
    };
  }
}

export async function changePassword(
  currentPassword: string,
  nextPassword: string
): Promise<AuthActionResult> {
  const { user: currentUser, error } = getCurrentAuthUserOrError();

  if (!currentUser || error) {
    return { ok: false, error };
  }

  if (!currentPassword.trim()) {
    return { ok: false, error: "Current password is required." };
  }

  if (!nextPassword.trim()) {
    return { ok: false, error: "New password is required." };
  }

  if (nextPassword.trim().length < 6) {
    return { ok: false, error: "Password must be at least 6 characters." };
  }

  try {
    const credential = EmailAuthProvider.credential(
      currentUser.email!,
      currentPassword
    );
    await reauthenticateWithCredential(currentUser, credential);
    await firebaseUpdatePassword(currentUser, nextPassword);
    return { ok: true };
  } catch (error) {
    console.error("[auth] password update failed", error);
    return {
      ok: false,
      error: getUserFacingError(error, "Unable to update your password right now.")
    };
  }
}

export async function deleteAccountAndData(): Promise<AuthActionResult> {
  const { user: currentUser, error } = getCurrentAuthUserOrError();

  if (!currentUser || error) {
    return { ok: false, error };
  }

  const username = normalizeUsername(currentUser.displayName || "");

  try {
    await deleteAllUserNFTs(currentUser.uid);

    if (username) {
      const db = getFirestoreDb();
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, USERS_COLLECTION, username);
        const snapshot = await transaction.get(userRef);

        if (!snapshot.exists()) {
          return;
        }

        const data = snapshot.data() as { uid?: string };

        if (String(data.uid ?? "") !== currentUser.uid) {
          throw new Error("You do not have access to this account.");
        }

        transaction.delete(userRef);
      });
    }

    await deleteUser(currentUser);
    return { ok: true };
  } catch (error) {
    console.error("[auth] account deletion failed", error);
    return {
      ok: false,
      error: getUserFacingError(
        error,
        "Unable to delete your account right now. Try signing in again first."
      )
    };
  }
}

export async function signOut(): Promise<void> {
  try {
    await firebaseSignOut(getFirebaseAuth());
  } catch (error) {
    throw new Error(getUserFacingError(error, "Unable to sign out right now."));
  }
}
