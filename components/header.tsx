"use client";

import { useState } from "react";
import { User } from "firebase/auth";

interface HeaderProps {
  onAdd: () => void;
  user: User | null;
  onSignOut: () => Promise<void> | void;
}

export function Header({ onAdd, user, onSignOut }: HeaderProps) {
  const [isSignOutDialogOpen, setIsSignOutDialogOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);

    try {
      await Promise.resolve(onSignOut());
      setIsSignOutDialogOpen(false);
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <>
      <header className="surface-card rounded-lg px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex items-start justify-between gap-4 sm:items-center">
          <div className="min-w-0">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-gray-400">
              NFT Trade Journal
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              NFTfolio
            </h1>
          </div>

          {user ? (
            <div className="flex shrink-0 items-center gap-3">
              <button
                type="button"
                onClick={onAdd}
                className="inline-flex h-11 items-center justify-center rounded-lg bg-black px-5 text-sm font-medium text-white transition hover:bg-gray-800"
              >
                Add NFT
              </button>
              <button
                type="button"
                onClick={() => setIsSignOutDialogOpen(true)}
                className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Sign out
              </button>
            </div>
          ) : null}
        </div>
      </header>

      {isSignOutDialogOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/55 p-4 backdrop-blur-[6px]">
          <div className="surface-card w-full max-w-xs rounded-lg p-4">
            <h2 className="text-center text-base font-medium text-gray-900">Sign out?</h2>
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsSignOutDialogOpen(false)}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSigningOut ? "Signing out..." : "Sign out"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
