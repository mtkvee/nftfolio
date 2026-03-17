import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import {
  AppCheck,
  initializeAppCheck,
  ReCaptchaV3Provider
} from "firebase/app-check";
import { Auth, getAuth } from "firebase/auth";
import { Firestore, getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const appCheckSiteKey = process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY;
let appCheckInstance: AppCheck | null = null;

export function getMissingFirebaseEnvVars(): string[] {
  return Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);
}

export function getFirebaseConfigError(): string | null {
  const missingEnvVars = getMissingFirebaseEnvVars();

  if (missingEnvVars.length === 0) {
    return null;
  }

  return `Missing Firebase environment variables: ${missingEnvVars.join(", ")}`;
}

export function getFirebaseApp(): FirebaseApp {
  const configError = getFirebaseConfigError();

  if (configError) {
    throw new Error(configError);
  }

  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
}

export function getFirestoreDb(): Firestore {
  return getFirestore(getFirebaseApp());
}

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}

export function initializeOptionalAppCheck(): AppCheck | null {
  if (typeof window === "undefined" || !appCheckSiteKey) {
    return null;
  }

  if (appCheckInstance) {
    return appCheckInstance;
  }

  // App Check is optional in development. Add NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY
  // when you are ready to enforce attestation in production.
  appCheckInstance = initializeAppCheck(getFirebaseApp(), {
    provider: new ReCaptchaV3Provider(appCheckSiteKey),
    isTokenAutoRefreshEnabled: true
  });

  return appCheckInstance;
}
