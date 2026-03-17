"use client";

import { faArrowLeft, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";

type AuthScreen = "login" | "create";

interface AuthActionResult {
  ok: boolean;
  error?: string;
}

interface AuthPromptProps {
  onLogIn: (username: string, password: string) => Promise<AuthActionResult>;
  onCreateAccount: (
    email: string,
    username: string,
    password: string,
  ) => Promise<AuthActionResult>;
  isSubmitting?: boolean;
  error?: string | null;
  notice?: string | null;
  clearError?: () => void;
  clearNotice?: () => void;
  title?: string;
  message?: string;
}

export function AuthPrompt({
  onLogIn,
  onCreateAccount,
  isSubmitting = false,
  error = null,
  notice = null,
  clearError,
  clearNotice,
  title = "Log in to manage your NFT portfolio.",
  message = "",
}: AuthPromptProps) {
  const [screen, setScreen] = useState<AuthScreen>("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const clearMessages = () => {
    if (error) {
      clearError?.();
    }

    if (notice) {
      clearNotice?.();
    }
  };

  const switchScreen = (nextScreen: AuthScreen) => {
    clearMessages();
    setScreen(nextScreen);
  };

  const handleLogIn = async () => {
    await onLogIn(username, password);
  };

  const handleCreateAccount = async () => {
    const result = await onCreateAccount(email, username, password);

    if (!result.ok) {
      return;
    }

    setPassword("");
    setScreen("login");
  };

  return (
    <section className="surface-card flex min-h-[360px] flex-col items-center justify-center rounded-lg px-6 py-12 text-center">
      <h2 className="text-2xl font-semibold text-gray-900">
        {screen === "login" ? title : "Create your NFTfolio account."}
      </h2>
      <p className="mt-3 max-w-md text-sm leading-6 text-gray-500">
        {screen === "login" ? message : ""}
      </p>

      <div className="mt-6 flex w-full max-w-sm flex-col gap-3 text-left">
        {screen === "create" ? (
          <label>
            <span className="mb-2 block text-sm font-medium text-gray-500">
              Email
            </span>
            <input
              value={email}
              onChange={(event) => {
                clearMessages();
                setEmail(event.target.value);
              }}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-gray-300"
              placeholder="username@mail.com"
              autoComplete="email"
            />
          </label>
        ) : null}

        <label>
          <span className="mb-2 block text-sm font-medium text-gray-500">
            Username
          </span>
          <input
            value={username}
            onChange={(event) => {
              clearMessages();
              setUsername(event.target.value);
            }}
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-gray-300"
            placeholder="username"
            autoComplete="username"
          />
        </label>

        <label>
          <span className="mb-2 block text-sm font-medium text-gray-500">
            Password
          </span>
          <input
            type="password"
            value={password}
            onChange={(event) => {
              clearMessages();
              setPassword(event.target.value);
            }}
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-gray-300"
            placeholder="Your password"
            autoComplete={
              screen === "login" ? "current-password" : "new-password"
            }
          />
        </label>

        {notice && screen === "login" ? (
          <p className="text-sm text-emerald-600">{notice}</p>
        ) : null}
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}

        {screen === "login" ? (
          <>
            <button
              type="button"
              onClick={() => void handleLogIn()}
              disabled={isSubmitting}
              className="mt-1 inline-flex items-center justify-center gap-2 rounded-lg bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <span
                  aria-hidden="true"
                  className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white"
                />
              ) : null}
              <span>{isSubmitting ? "" : "Log in"}</span>
            </button>
            <button
              type="button"
              onClick={() => switchScreen("create")}
              className="text-sm text-gray-500 transition hover:text-gray-900"
            >
              Create account
              <FontAwesomeIcon icon={faArrowRight} className="ms-1" />
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => void handleCreateAccount()}
              disabled={isSubmitting}
              className="mt-1 inline-flex items-center justify-center gap-2 rounded-lg bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <span
                  aria-hidden="true"
                  className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white"
                />
              ) : null}
              <span>{isSubmitting ? "" : "Create account"}</span>
            </button>
            <button
              type="button"
              onClick={() => switchScreen("login")}
              className="text-sm text-gray-500 transition hover:text-gray-900"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="me-1" />
              Back to login
            </button>
          </>
        )}
      </div>
    </section>
  );
}
