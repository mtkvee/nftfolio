"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState
} from "react";
import {
  AuthUser,
  createAccount,
  signInWithUsernameAndPassword,
  signOut as firebaseSignOut,
  subscribeToAuthChanges
} from "@/lib/auth";
import {
  getFirebaseConfigError,
  initializeOptionalAppCheck
} from "@/lib/firebase";
import { getUserFacingError } from "@/lib/firebase-errors";

interface AuthActionState {
  ok: boolean;
  error?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isCompletingSignup: boolean;
  isSubmitting: boolean;
  error: string | null;
  notice: string | null;
  signIn: (username: string, password: string) => Promise<AuthActionState>;
  createAccount: (email: string, username: string, password: string) => Promise<AuthActionState>;
  signOut: () => Promise<void>;
  clearError: () => void;
  clearNotice: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const AUTH_INIT_TIMEOUT_MS = 5000;
const ACCOUNT_CREATED_NOTICE = "Account created successfully. Please log in.";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isCompletingSignup, setIsCompletingSignup] = useState(false);
  const isCompletingSignupRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    console.info("[auth] init started");

    const timeoutId = window.setTimeout(() => {
      if (!isMounted) {
        return;
      }

      console.warn("[auth] timeout fallback triggered");
      setIsLoading(false);
      setIsSubmitting(false);
      setError((currentError) =>
        currentError ?? "We could not confirm your session. You can still log in manually."
      );
    }, AUTH_INIT_TIMEOUT_MS);

    const configError = getFirebaseConfigError();

    if (configError) {
      console.error("[auth] init error", configError);
      window.clearTimeout(timeoutId);
      setError("Firebase is not configured correctly for this environment.");
      setIsLoading(false);
      setIsSubmitting(false);

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
      setIsSubmitting(false);

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

        if (isCompletingSignupRef.current) {
          if (nextUser) {
            return;
          }

          isCompletingSignupRef.current = false;
          setIsCompletingSignup(false);
          setUser(null);
          setError(null);
          setNotice(ACCOUNT_CREATED_NOTICE);
          setIsLoading(false);
          setIsSubmitting(false);
          return;
        }

        setUser(nextUser);
        setError(null);
        setIsLoading(false);
        setIsSubmitting(false);
      },
      (nextError) => {
        if (!isMounted) {
          return;
        }

        window.clearTimeout(timeoutId);
        console.error("[auth] init error", nextError);
        isCompletingSignupRef.current = false;
        setIsCompletingSignup(false);
        setUser(null);
        setError(
          getUserFacingError(nextError, "Unable to start Firebase authentication.")
        );
        setIsLoading(false);
        setIsSubmitting(false);
      }
    );

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  const signIn = async (
    username: string,
    password: string
  ): Promise<AuthActionState> => {
    if (isSubmitting) {
      return { ok: false, error: "Authentication is already in progress." };
    }

    setError(null);
    setNotice(null);
    setIsSubmitting(true);

    const result = await signInWithUsernameAndPassword(username, password);

    if (!result.ok) {
      const message = result.error ?? "Invalid username or password";
      setError(message);
      setIsSubmitting(false);
      return { ok: false, error: message };
    }

    return { ok: true };
  };

  const handleCreateAccount = async (
    email: string,
    username: string,
    password: string
  ): Promise<AuthActionState> => {
    if (isSubmitting) {
      return { ok: false, error: "Authentication is already in progress." };
    }

    setError(null);
    setNotice(null);
    setIsSubmitting(true);
    setIsCompletingSignup(true);
    isCompletingSignupRef.current = true;

    const result = await createAccount(email, username, password);

    if (!result.ok) {
      isCompletingSignupRef.current = false;
      setIsCompletingSignup(false);
      const message = result.error ?? "Unable to create this account right now.";
      setError(message);
      setIsSubmitting(false);
      return { ok: false, error: message };
    }

    return { ok: true };
  };

  const signOut = async () => {
    setError(null);
    setNotice(null);

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
        isCompletingSignup,
        isSubmitting,
        error,
        notice,
        signIn,
        createAccount: handleCreateAccount,
        signOut,
        clearError: () => setError(null),
        clearNotice: () => setNotice(null)
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
