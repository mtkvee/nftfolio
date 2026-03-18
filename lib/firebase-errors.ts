import { FirebaseError } from "firebase/app";

const FIREBASE_ERROR_MESSAGES: Record<string, string> = {
  "auth/email-already-in-use": "Username already taken.",
  "auth/invalid-credential": "Invalid username or password.",
  "auth/invalid-email": "This username format is not allowed.",
  "auth/missing-password": "Password is required.",
  "auth/network-request-failed": "Network issue while talking to Firebase. Check your connection and try again.",
  "auth/operation-not-allowed": "Email/password authentication is not enabled in Firebase yet.",
  "auth/too-many-requests": "Too many authentication attempts. Try again in a moment.",
  "auth/requires-recent-login": "For security, sign in again before changing this account setting.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/weak-password": "Password must be at least 6 characters.",
  "firestore/permission-denied": "You do not have permission to access this NFT data.",
  "firestore/unavailable": "Firestore is temporarily unavailable. Try again in a moment.",
  "firestore/deadline-exceeded": "The request took too long. Please try again.",
  "firestore/not-found": "This record could not be found.",
  "firestore/failed-precondition": "Firestore is not fully configured for this request yet."
};

export function getUserFacingError(error: unknown, fallback: string): string {
  if (error instanceof FirebaseError) {
    return FIREBASE_ERROR_MESSAGES[error.code] ?? fallback;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}
