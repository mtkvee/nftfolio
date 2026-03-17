"use client";

import { useEffect, useMemo, useState } from "react";
import { AuthPrompt } from "@/components/auth-prompt";
import { EmptyState } from "@/components/empty-state";
import { FilterTabs } from "@/components/filter-tabs";
import { Header } from "@/components/header";
import { NFTFormModal } from "@/components/nft-form-modal";
import { NFTGrid } from "@/components/nft-grid";
import { SearchBar } from "@/components/search-bar";
import { SummaryCards } from "@/components/summary-cards";
import { useAuth } from "@/hooks/use-auth";
import { useNFTStore } from "@/store/nft-store";
import { NFTRecord } from "@/types/nft";

export function AppShell() {
  const [selectedNFT, setSelectedNFT] = useState<NFTRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    user,
    isLoading: isAuthLoading,
    isCompletingSignup,
    isSubmitting,
    error: authError,
    notice: authNotice,
    signIn,
    createAccount,
    signOut,
    clearError: clearAuthError,
    clearNotice: clearAuthNotice,
  } = useAuth();
  const {
    nfts,
    filter,
    search,
    setFilter,
    setSearch,
    deleteNFT,
    fetchNFTs,
    resetNFTs,
    isLoading,
    isInitialized,
    currentUserId,
    error,
    clearError,
  } = useNFTStore();

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (!user || isCompletingSignup) {
      resetNFTs();
      return;
    }

    if (!isInitialized || currentUserId !== user.uid) {
      void fetchNFTs(user.uid);
    }
  }, [
    currentUserId,
    fetchNFTs,
    isAuthLoading,
    isCompletingSignup,
    isInitialized,
    resetNFTs,
    user,
  ]);

  const isPortfolioLoading =
    Boolean(user) && !isCompletingSignup && isLoading && !isInitialized;

  const filteredNFTs = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    return nfts.filter((record) => {
      const matchesFilter = filter === "all" ? true : record.status === filter;
      const matchesSearch =
        normalized.length === 0
          ? true
          : `${record.name} ${record.collection}`
              .toLowerCase()
              .includes(normalized);

      return matchesFilter && matchesSearch;
    });
  }, [filter, nfts, search]);

  const openCreateModal = () => {
    if (!user || isCompletingSignup) {
      return;
    }

    setSelectedNFT(null);
    setIsModalOpen(true);
  };

  const openEditModal = (record: NFTRecord) => {
    setSelectedNFT(record);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedNFT(null);
    setIsModalOpen(false);
  };

  return (
    <main className="min-h-screen bg-white px-4 py-5 text-gray-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <Header
          onAdd={openCreateModal}
          user={user && !isCompletingSignup ? user : null}
          onSignOut={signOut}
        />

        {isAuthLoading ? (
          <div className="flex min-h-[220px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
          </div>
        ) : !user || isCompletingSignup ? (
          <AuthPrompt
            onLogIn={signIn}
            onCreateAccount={createAccount}
            isSubmitting={isSubmitting}
            error={authError}
            notice={authNotice}
            clearError={clearAuthError}
            clearNotice={clearAuthNotice}
          />
        ) : (
          <>
            <SummaryCards records={nfts} isLoaded={isInitialized} />

            <section className="surface-card rounded-lg p-3.5 sm:p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <FilterTabs activeFilter={filter} onChange={setFilter} />
                <SearchBar value={search} onChange={setSearch} />
              </div>
            </section>

            {error ? (
              <section className="surface-card rounded-lg px-4 py-3 text-sm text-rose-600">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span>{error}</span>
                  <button
                    type="button"
                    onClick={clearError}
                    className="self-start rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    Dismiss
                  </button>
                </div>
              </section>
            ) : null}

            {isPortfolioLoading ? (
              <div className="flex min-h-[220px] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
              </div>
            ) : filteredNFTs.length === 0 ? (
              <EmptyState
                onAdd={openCreateModal}
                hasAnyNFTs={nfts.length > 0}
              />
            ) : (
              <NFTGrid
                records={filteredNFTs}
                onEdit={openEditModal}
                onDelete={(id) =>
                  user ? deleteNFT(user.uid, id) : Promise.resolve()
                }
              />
            )}
          </>
        )}
      </div>

      <NFTFormModal
        isOpen={isModalOpen && !!user && !isCompletingSignup}
        onClose={closeModal}
        initialValues={selectedNFT}
      />
    </main>
  );
}
