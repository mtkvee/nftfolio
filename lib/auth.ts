import { FirebaseError } from "firebase/app";
import {
  User,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile
} from "firebase/auth";
import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp
} from "firebase/firestore";
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

export async function signOut(): Promise<void> {
  try {
    await firebaseSignOut(getFirebaseAuth());
  } catch (error) {
    throw new Error(getUserFacingError(error, "Unable to sign out right now."));
  }
}
