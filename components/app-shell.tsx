"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { FilterTabs } from "@/components/filter-tabs";
import { Header } from "@/components/header";
import { NFTFormModal } from "@/components/nft-form-modal";
import { NFTGrid } from "@/components/nft-grid";
import { SearchBar } from "@/components/search-bar";
import { SummaryCards } from "@/components/summary-cards";
import { useNFTStore } from "@/store/nft-store";
import { NFTRecord } from "@/types/nft";

export function AppShell() {
  const [selectedNFT, setSelectedNFT] = useState<NFTRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { nfts, filter, search, setFilter, setSearch, deleteNFT, hasHydrated } =
    useNFTStore();

  const filteredNFTs = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    return nfts.filter((record) => {
      const matchesFilter = filter === "all" ? true : record.status === filter;
      const matchesSearch =
        normalized.length === 0
          ? true
          : `${record.name} ${record.collection}`.toLowerCase().includes(normalized);

      return matchesFilter && matchesSearch;
    });
  }, [filter, nfts, search]);

  const openCreateModal = () => {
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
        <Header onAdd={openCreateModal} />
        <SummaryCards records={nfts} isHydrated={hasHydrated} />

        <section className="surface-card rounded-lg p-3.5 sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <FilterTabs activeFilter={filter} onChange={setFilter} />
            <SearchBar value={search} onChange={setSearch} />
          </div>
        </section>

        {!hasHydrated ? (
          <section className="surface-card rounded-lg p-10 text-center text-gray-500">
            Syncing your portfolio...
          </section>
        ) : filteredNFTs.length === 0 ? (
          <EmptyState onAdd={openCreateModal} hasAnyNFTs={nfts.length > 0} />
        ) : (
          <NFTGrid
            records={filteredNFTs}
            onEdit={openEditModal}
            onDelete={deleteNFT}
          />
        )}
      </div>

      <NFTFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        initialValues={selectedNFT}
      />
    </main>
  );
}
