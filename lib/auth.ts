import {
  GoogleAuthProvider,
  User,
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signOut as firebaseSignOut
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { getUserFacingError } from "@/lib/firebase-errors";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

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

export function subscribeToAuthChanges(
  callback: (user: User | null) => void
): () => void {
  void ensureAuthPersistence();
  return onAuthStateChanged(getFirebaseAuth(), callback);
}

export async function signInWithGoogle(): Promise<void> {
  try {
    await ensureAuthPersistence();
    await signInWithPopup(getFirebaseAuth(), googleProvider);
  } catch (error) {
    throw new Error(
      getUserFacingError(error, "Unable to sign in with Google right now.")
    );
  }
}

export async function signOut(): Promise<void> {
  try {
    await firebaseSignOut(getFirebaseAuth());
  } catch (error) {
    throw new Error(getUserFacingError(error, "Unable to sign out right now."));
  }
}
