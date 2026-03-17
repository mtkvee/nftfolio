"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";
import { User } from "firebase/auth";
import {
  signInWithGoogle as firebaseSignInWithGoogle,
  signOut as firebaseSignOut,
  subscribeToAuthChanges
} from "@/lib/auth";
import {
  getFirebaseConfigError,
  initializeOptionalAppCheck
} from "@/lib/firebase";
import { getUserFacingError } from "@/lib/firebase-errors";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isSigningIn: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const AUTH_INIT_TIMEOUT_MS = 8000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: () => void = () => {};

    console.info("[auth] init started");

    // The auth layer must always leave loading, even if Firebase init fails or
    // the auth observer never resolves in production.
    const timeoutId = window.setTimeout(() => {
      if (!isMounted) {
        return;
      }

      console.warn("[auth] init timed out");
      setIsLoading(false);
      setIsSigningIn(false);
      setError((currentError) =>
        currentError ?? "We could not confirm your session. You can still sign in manually."
      );
    }, AUTH_INIT_TIMEOUT_MS);

    const configError = getFirebaseConfigError();

    if (configError) {
      console.error("[auth] init failed", configError);
      window.clearTimeout(timeoutId);
      setError("Firebase is not configured correctly for this environment.");
      setIsLoading(false);
      setIsSigningIn(false);

      return () => {
        isMounted = false;
      };
    }

    try {
      initializeOptionalAppCheck();
      unsubscribe = subscribeToAuthChanges((nextUser) => {
        if (!isMounted) {
          return;
        }

        window.clearTimeout(timeoutId);
        console.info(`[auth] state resolved: ${nextUser ? "user" : "null"}`);
        setUser(nextUser);
        setError(null);
        setIsLoading(false);
        setIsSigningIn(false);
      });
    } catch (nextError) {
      console.error("[auth] init failed", nextError);
      window.clearTimeout(timeoutId);

      if (isMounted) {
        setError(
          getUserFacingError(nextError, "Unable to start Firebase authentication.")
        );
        setIsLoading(false);
        setIsSigningIn(false);
      }
    }

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    if (isSigningIn) {
      return;
    }

    setError(null);
    setIsSigningIn(true);

    try {
      await firebaseSignInWithGoogle();
    } catch (nextError) {
      setError(
        getUserFacingError(nextError, "Unable to sign in with Google right now.")
      );
      setIsSigningIn(false);
      throw nextError;
    }
  };

  const signOut = async () => {
    setError(null);

    try {
      await firebaseSignOut();
    } catch (nextError) {
      setError(getUserFacingError(nextError, "Unable to sign out right now."));
      throw nextError;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isSigningIn,
        error,
        signInWithGoogle,
        signOut,
        clearError: () => setError(null)
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}
