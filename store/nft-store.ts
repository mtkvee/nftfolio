"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { NFTFilter, NFTRecord } from "@/types/nft";
import { demoNFTs } from "@/utils/demo-data";

interface NFTStoreState {
  nfts: NFTRecord[];
  filter: NFTFilter;
  search: string;
  hasHydrated: boolean;
  addNFT: (record: NFTRecord) => void;
  updateNFT: (id: string, record: NFTRecord) => void;
  deleteNFT: (id: string) => void;
  setFilter: (filter: NFTFilter) => void;
  setSearch: (search: string) => void;
  setHasHydrated: (value: boolean) => void;
}

export const useNFTStore = create<NFTStoreState>()(
  persist(
    (set) => ({
      nfts: demoNFTs,
      filter: "all",
      search: "",
      hasHydrated: false,
      addNFT: (record) =>
        set((state) => ({
          nfts: [record, ...state.nfts]
        })),
      updateNFT: (id, record) =>
        set((state) => ({
          nfts: state.nfts.map((item) => (item.id === id ? record : item))
        })),
      deleteNFT: (id) =>
        set((state) => ({
          nfts: state.nfts.filter((item) => item.id !== id)
        })),
      setFilter: (filter) => set({ filter }),
      setSearch: (search) => set({ search }),
      setHasHydrated: (value) => set({ hasHydrated: value })
    }),
    {
      name: "flipfolio-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        nfts: state.nfts,
        filter: state.filter,
        search: state.search
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      }
    }
  )
);
