"use client";

import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import { faTrashCan } from "@fortawesome/free-regular-svg-icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { AuthPrompt } from "@/components/auth-prompt";
import { NFTFormModal } from "@/components/nft-form-modal";
import { useAuth } from "@/hooks/use-auth";
import { useNFTStore } from "@/store/nft-store";
import {
  calculateHoldingDuration,
  calculateProfitLoss,
  calculateROI,
  formatDate,
  formatHoldingDuration,
  formatPrice
} from "@/utils/calculations";

interface NFTDetailsPageProps {
  nftId: string;
}

export function NFTDetailsPage({ nftId }: NFTDetailsPageProps) {
  const router = useRouter();
  const {
    user,
    isLoading: isAuthLoading,
    error: authError,
    signInWithGoogle,
    clearError: clearAuthError
  } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const {
    nfts,
    deleteNFT,
    isInitialized,
    fetchNFTs,
    resetNFTs,
    currentUserId,
    isLoading,
    error
  } = useNFTStore();

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (!user) {
      resetNFTs();
      return;
    }

    if (!isInitialized || currentUserId !== user.uid) {
      void fetchNFTs(user.uid);
    }
  }, [currentUserId, fetchNFTs, isAuthLoading, isInitialized, resetNFTs, user]);

  const record = useMemo(
    () => nfts.find((item) => item.id === nftId) ?? null,
    [nftId, nfts]
  );

  if (isAuthLoading || (user && isLoading && !isInitialized)) {
    return (
      <main className="min-h-screen bg-white px-4 py-5 text-gray-900 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <section className="surface-card rounded-lg p-10 text-center text-gray-500">
            Loading NFT details...
          </section>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-white px-4 py-5 text-gray-900 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-5">
          <div>
            <Link
              href="/"
              aria-label="Back to Gallery"
              title="Back to Gallery"
              className="inline-flex text-gray-500 transition hover:text-black"
              style={{ fontSize: "1.25rem" }}
            >
              <FontAwesomeIcon icon={faArrowLeft} />
            </Link>
          </div>
          {authError ? (
            <section className="surface-card rounded-lg px-4 py-3 text-sm text-rose-600">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span>{authError}</span>
                <button
                  type="button"
                  onClick={clearAuthError}
                  className="self-start rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Dismiss
                </button>
              </div>
            </section>
          ) : null}
          <AuthPrompt
            onSignIn={() => void signInWithGoogle()}
            title="Sign in to view this NFT record."
            message="NFT details are tied to your Google account. Sign in to load your portfolio securely."
          />
        </div>
      </main>
    );
  }

  if (!record) {
    return (
      <main className="min-h-screen bg-white px-4 py-5 text-gray-900 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <section className="surface-card rounded-lg p-10 text-center">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-gray-400">
              {error ? "Load Error" : "NFT Not Found"}
            </p>
            <h1 className="mt-3 text-2xl font-semibold text-gray-900">
              {error ? error : "This NFT record is unavailable."}
            </h1>
            <div className="mt-6">
              <Link
                href="/"
                aria-label="Back to Gallery"
                title="Back to Gallery"
                className="inline-flex text-gray-500 transition hover:text-black"
                style={{ fontSize: "1.25rem" }}
              >
                <FontAwesomeIcon icon={faArrowLeft} />
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const profit = calculateProfitLoss(record.buyPrice, record.sellPrice);
  const roi = calculateROI(record.buyPrice, record.sellPrice);
  const holdingDays = calculateHoldingDuration(record.buyDate, record.sellDate);
  const sellPriceValue = formatPrice(record.sellPrice);
  const profitValue = formatPrice(profit);
  const roiValue = typeof roi === "number" ? `${roi.toFixed(1)}%` : "--";
  const profitTone =
    typeof profit !== "number"
      ? "text-gray-400"
      : profit >= 0
        ? "text-emerald-600"
        : "text-rose-500";

  const detailRows = [
    { label: "Buy Price", value: formatPrice(record.buyPrice), valueClass: "text-gray-900" },
    {
      label: "Sell Price",
      value: sellPriceValue,
      valueClass: sellPriceValue === "--" ? "text-gray-400" : "text-gray-900"
    },
    {
      label: "Profit / Loss",
      value: profitValue,
      valueClass: profitValue === "--" ? "text-gray-400" : profitTone
    },
    {
      label: "ROI",
      value: roiValue,
      valueClass: roiValue === "--" ? "text-gray-400" : profitTone
    },
    {
      label: "Holding Duration",
      value: formatHoldingDuration(holdingDays),
      valueClass: "text-gray-900"
    },
    {
      label: "Trade Window",
      value: `${formatDate(record.buyDate)}${record.sellDate ? ` - ${formatDate(record.sellDate)}` : " - Today"}`,
      valueClass: "text-gray-900"
    },
    {
      label: "Notes",
      value: record.notes || "--",
      valueClass: record.notes ? "text-gray-900" : "text-gray-400"
    }
  ];

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      await deleteNFT(user.uid, record.id);
      router.push("/");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <main className="min-h-screen bg-white px-4 py-5 text-gray-900 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-5">
          <div>
            <Link
              href="/"
              aria-label="Back to Gallery"
              title="Back to Gallery"
              className="inline-flex text-gray-500 transition hover:text-black"
              style={{ fontSize: "1.25rem" }}
            >
              <FontAwesomeIcon icon={faArrowLeft} />
            </Link>
          </div>

          <section className="surface-card rounded-lg p-5 sm:p-6">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={record.image}
                  alt={record.name}
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="flex flex-col gap-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <span
                      className={clsx(
                        "inline-flex rounded-md border px-2 py-0.5 text-xs font-medium capitalize",
                        record.status === "sold"
                          ? "border-green-200 bg-green-50 text-green-600"
                          : "border-blue-200 bg-blue-50 text-blue-600"
                      )}
                    >
                      {record.status}
                    </span>
                    <h1 className="mt-3 text-3xl font-semibold text-gray-900">
                      {record.name}
                    </h1>
                    <p className="mt-2 text-base text-gray-500">{record.collection}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      title="Edit"
                      onClick={() => setIsModalOpen(true)}
                      className="text-base text-gray-500 transition hover:text-black"
                    >
                      <FontAwesomeIcon icon={faPenToSquare} />
                    </button>
                    <button
                      type="button"
                      title="Delete"
                      onClick={() => setIsDeleteDialogOpen(true)}
                      className="text-base text-gray-500 transition hover:text-rose-500"
                    >
                      <FontAwesomeIcon icon={faTrashCan} />
                    </button>
                  </div>
                </div>

                <section className="rounded-lg border border-gray-200 bg-white">
                  <div className="border-b border-gray-200 px-4 py-3">
                    <h2 className="text-sm font-semibold text-gray-900">Trade Details</h2>
                  </div>
                  <dl className="divide-y divide-gray-200">
                    {detailRows.map((row) => (
                      <div
                        key={row.label}
                        className="grid gap-2 px-4 py-3 sm:grid-cols-[160px_minmax(0,1fr)] sm:items-start"
                      >
                        <dt className="text-sm text-gray-400">{row.label}</dt>
                        <dd className={clsx("text-sm font-medium", row.valueClass)}>
                          {row.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
              </div>
            </div>
          </section>
        </div>

        <NFTFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialValues={record}
        />
      </main>

      {isDeleteDialogOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/55 p-4 backdrop-blur-[6px]">
          <div className="surface-card w-full max-w-xs rounded-lg p-4">
            <h2 className="text-center text-base font-medium text-gray-900">
              Are you sure to delete?
            </h2>
            <div
              className="my-3 text-center text-sm text-gray-500"
              style={{ fontSize: "0.85rem" }}
            >
              This action cannot be undone.
            </div>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteDialogOpen(false)}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
