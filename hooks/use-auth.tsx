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
const AUTH_INIT_TIMEOUT_MS = 5000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    console.info("[auth] init started");

    // Auth loading must resolve independently of Firestore so the app can fall
    // back to the signed-out UI even if auth bootstrapping stalls in production.
    const timeoutId = window.setTimeout(() => {
      if (!isMounted) {
        return;
      }

      console.warn("[auth] timeout fallback triggered");
      setIsLoading(false);
      setIsSigningIn(false);
      setError((currentError) =>
        currentError ?? "We could not confirm your session. You can still sign in manually."
      );
    }, AUTH_INIT_TIMEOUT_MS);

    const configError = getFirebaseConfigError();

    if (configError) {
      console.error("[auth] init error", configError);
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
    } catch (nextError) {
      console.error("[auth] init error", nextError);
      window.clearTimeout(timeoutId);
      setError(
        getUserFacingError(nextError, "Unable to start Firebase authentication.")
      );
      setIsLoading(false);
      setIsSigningIn(false);

      return () => {
        isMounted = false;
      };
    }

    const unsubscribe = subscribeToAuthChanges(
      (nextUser) => {
        if (!isMounted) {
          return;
        }

        window.clearTimeout(timeoutId);
        console.info(`[auth] resolved with ${nextUser ? "user" : "null"}`);
        setUser(nextUser);
        setError(null);
        setIsLoading(false);
        setIsSigningIn(false);
      },
      (nextError) => {
        if (!isMounted) {
          return;
        }

        window.clearTimeout(timeoutId);
        console.error("[auth] init error", nextError);
        setUser(null);
        setError(
          getUserFacingError(nextError, "Unable to start Firebase authentication.")
        );
        setIsLoading(false);
        setIsSigningIn(false);
      }
    );

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
