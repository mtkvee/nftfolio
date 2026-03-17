"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { User } from "firebase/auth";
import {
  signInWithGoogle as firebaseSignInWithGoogle,
  signOut as firebaseSignOut,
  subscribeToAuthChanges
} from "@/lib/auth";
import { initializeOptionalAppCheck } from "@/lib/firebase";
import { getUserFacingError } from "@/lib/firebase-errors";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeOptionalAppCheck();

    const unsubscribe = subscribeToAuthChanges((nextUser) => {
      setUser(nextUser);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    setError(null);

    try {
      await firebaseSignInWithGoogle();
    } catch (nextError) {
      setError(
        getUserFacingError(nextError, "Unable to sign in with Google right now.")
      );
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

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      error,
      signInWithGoogle,
      signOut,
      clearError: () => setError(null)
    }),
    [error, isLoading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}
