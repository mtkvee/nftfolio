"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeftLong } from "@fortawesome/free-solid-svg-icons";

export function AccountSettingsPage() {
  const router = useRouter();
  const {
    user,
    isLoading,
    updateUsername,
    updatePassword,
    deleteAccount,
    clearError,
    clearNotice,
  } = useAuth();
  const [username, setUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [dangerMessage, setDangerMessage] = useState<string | null>(null);
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  useEffect(() => {
    clearError();
    clearNotice();
  }, [clearError, clearNotice]);

  useEffect(() => {
    if (user) {
      setUsername(user.username);
    }
  }, [user]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/");
    }
  }, [isLoading, router, user]);

  if (isLoading || !user) {
    return (
      <main className="min-h-screen bg-white px-4 py-5 text-gray-900 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[220px] w-full max-w-5xl items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
        </div>
      </main>
    );
  }

  const handleSaveUsername = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setProfileMessage(null);
    setIsSavingUsername(true);

    const result = await updateUsername(username);

    setProfileMessage(
      result.ok
        ? "Username updated."
        : (result.error ?? "Unable to update your username right now."),
    );
    setIsSavingUsername(false);
  };

  const handleUpdatePassword = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordMessage("New password must match confirm password.");
      return;
    }

    setIsUpdatingPassword(true);
    const result = await updatePassword(currentPassword, newPassword);

    if (result.ok) {
      setPasswordMessage("Password updated.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setPasswordMessage(
        result.error ?? "Unable to update your password right now.",
      );
    }

    setIsUpdatingPassword(false);
  };

  const handleDeleteAccount = async () => {
    if (isDeletingAccount) {
      return;
    }

    setDangerMessage(null);
    setIsDeletingAccount(true);

    const result = await deleteAccount();

    if (!result.ok) {
      setDangerMessage(
        result.error ?? "Unable to delete your account right now.",
      );
      setIsDeletingAccount(false);
      return;
    }

    router.replace("/");
  };

  return (
    <main className="min-h-screen bg-white px-4 py-5 text-gray-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <section className="surface-card rounded-lg px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-gray-400">
                Account
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                Account Settings
              </h1>
            </div>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              <FontAwesomeIcon icon={faArrowLeftLong} className="text-base" />
            </Link>
          </div>
        </section>

        <section className="surface-card rounded-lg p-5 sm:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-gray-900">
              User Information
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Update your visible username. Your email stays read-only.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSaveUsername}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
              <div className="min-w-0 w-full">
                <span className="mb-2 block text-sm font-medium text-gray-500">
                  Email
                </span>
                <input
                  value={user.email}
                  readOnly
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-500 outline-none"
                />
              </div>
              <div className="min-w-0 w-full">
                <span className="mb-2 block text-sm font-medium text-gray-500">
                  Username
                </span>
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 outline-none transition focus:border-gray-300"
                />
              </div>
            </div>

            {profileMessage ? (
              <p
                className={`text-sm ${profileMessage === "Username updated." ? "text-emerald-600" : "text-rose-600"}`}
              >
                {profileMessage}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={isSavingUsername}
              className="rounded-lg bg-black px-3 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSavingUsername ? "Saving..." : "Save"}
            </button>
          </form>
        </section>

        <section className="surface-card rounded-lg p-5 sm:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-gray-900">
              Change Password
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Use your current password to set a new one.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleUpdatePassword}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
              <div className="min-w-0 w-full">
                <span className="mb-2 block text-sm font-medium text-gray-500">
                  Current password
                </span>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 outline-none transition focus:border-gray-300"
                />
              </div>
              <div className="min-w-0 w-full">
                <span className="mb-2 block text-sm font-medium text-gray-500">
                  New password
                </span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 outline-none transition focus:border-gray-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
              <div className="min-w-0 w-full">
                <span className="mb-2 block text-sm font-medium text-gray-500">
                  Confirm new password
                </span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 outline-none transition focus:border-gray-300"
                />
              </div>
              <div className="hidden md:block" />
            </div>

            {passwordMessage ? (
              <p
                className={`text-sm ${passwordMessage === "Password updated." ? "text-emerald-600" : "text-rose-600"}`}
              >
                {passwordMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="rounded-lg bg-black px-3 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isUpdatingPassword ? "Updating..." : "Update"}
            </button>
          </form>
        </section>

        <section className="surface-card rounded-lg border-rose-200 p-5 sm:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-gray-900">Danger Zone</h2>
            <p className="mt-1 text-sm text-gray-500">
              Delete your account and all portfolio data permanently.
            </p>
          </div>

          {dangerMessage ? (
            <p className="mb-4 text-sm text-rose-600">{dangerMessage}</p>
          ) : null}

          <button
            type="button"
            onClick={() => setIsDeleteDialogOpen(true)}
            className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-rose-700"
          >
            Delete Forever
          </button>
        </section>
      </div>

      {isDeleteDialogOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="surface-card w-full max-w-md rounded-lg p-5">
            <h2 className="text-center text-base font-medium text-gray-900">
              Delete account?
            </h2>
            <p className="mt-3 text-center text-sm text-gray-500">
              Are you sure? This will permanently delete your account and all
              data.
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteDialogOpen(false)}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                disabled={isDeletingAccount}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteAccount()}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isDeletingAccount}
              >
                {isDeletingAccount ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
