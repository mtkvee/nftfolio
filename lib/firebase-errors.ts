import { FirebaseError } from "firebase/app";

const FIREBASE_ERROR_MESSAGES: Record<string, string> = {
  "auth/popup-closed-by-user": "Google sign-in was cancelled before it finished.",
  "auth/popup-blocked": "Your browser blocked the sign-in popup. Allow popups and try again.",
  "auth/network-request-failed": "Network issue while talking to Firebase. Check your connection and try again.",
  "auth/too-many-requests": "Too many authentication attempts. Try again in a moment.",
  "firestore/permission-denied": "You do not have permission to access this NFT data.",
  "firestore/unavailable": "Firestore is temporarily unavailable. Try again in a moment.",
  "firestore/deadline-exceeded": "The request took too long. Please try again.",
  "firestore/not-found": "This NFT record could not be found.",
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
