"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCog,
  faArrowRightFromBracket,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { AuthUser } from "@/lib/auth";

interface HeaderProps {
  onAdd: () => void;
  user: AuthUser | null;
  onSignOut: () => Promise<void> | void;
}

export function Header({ onAdd, user, onSignOut }: HeaderProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMenuOpen]);

  const handleSignOut = async () => {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    setIsMenuOpen(false);

    try {
      await Promise.resolve(onSignOut());
      router.replace("/");
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleAccountClick = () => {
    setIsMenuOpen(false);
    router.push("/account");
  };

  return (
    <header className="surface-card rounded-lg px-5 py-5 sm:px-6 sm:py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 text-center sm:text-left">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-gray-400">
            NFT Trade Journal
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            NFTfolio
          </h1>
        </div>

        {user ? (
          <div className="flex items-center gap-3 sm:shrink-0 sm:items-center">
            <div className="relative shrink-0 sm:order-2" ref={menuRef}>
              <button
                type="button"
                aria-label="Open settings menu"
                aria-haspopup="menu"
                aria-expanded={isMenuOpen}
                onClick={() => setIsMenuOpen((current) => !current)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSigningOut}
              >
                <FontAwesomeIcon icon={faCog} className="text-base" />
              </button>

              {isMenuOpen ? (
                <div
                  role="menu"
                  aria-label="Settings menu"
                  className="absolute left-0 top-[calc(100%+0.5rem)] z-20 min-w-[148px] rounded-lg border border-gray-200 bg-white p-1 sm:left-auto sm:right-0"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleAccountClick}
                    className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-50"
                  >
                    <FontAwesomeIcon icon={faUser} className="me-1 text-base" />
                    Account
                  </button>
                  <div className="my-1 border-t border-gray-200" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => void handleSignOut()}
                    className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-red-50 hover:text-red-500"
                  >
                    <FontAwesomeIcon
                      icon={faArrowRightFromBracket}
                      className="me-1 text-base"
                    />
                    {isSigningOut ? "Signing out..." : "Sign out"}
                  </button>
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={onAdd}
              className="inline-flex h-11 flex-1 items-center justify-center rounded-lg bg-black px-5 text-sm font-medium text-white transition hover:bg-gray-800 sm:order-1 sm:w-auto sm:flex-none"
              style={{ borderRadius: "30px" }}
            >
              Add NFT
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
