"use client";

import { create } from "zustand";
import {
  createNFT,
  deleteNFT,
  getUserNFTs,
  updateNFT
} from "@/lib/nfts";
import { getUserFacingError } from "@/lib/firebase-errors";
import { NFTCreateInput, NFTFilter, NFTUpdateInput, NFTRecord } from "@/types/nft";

interface NFTStoreState {
  nfts: NFTRecord[];
  filter: NFTFilter;
  search: string;
  currentUserId: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  fetchNFTs: (userId: string) => Promise<void>;
  addNFT: (userId: string, record: NFTCreateInput) => Promise<void>;
  updateNFT: (userId: string, id: string, record: NFTUpdateInput) => Promise<void>;
  deleteNFT: (userId: string, id: string) => Promise<void>;
  resetNFTs: () => void;
  setFilter: (filter: NFTFilter) => void;
  setSearch: (search: string) => void;
  clearError: () => void;
}

export const useNFTStore = create<NFTStoreState>()((set, get) => ({
  nfts: [],
  filter: "all",
  search: "",
  currentUserId: null,
  isLoading: false,
  isInitialized: false,
  error: null,
  fetchNFTs: async (userId) => {
    if (!userId) {
      return;
    }

    if (get().isLoading && get().currentUserId === userId) {
      return;
    }

    set({ isLoading: true, error: null, currentUserId: userId });

    try {
      const nfts = await getUserNFTs(userId);
      set({ nfts, isLoading: false, isInitialized: true, currentUserId: userId });
    } catch (error) {
      set({
        nfts: [],
        isLoading: false,
        isInitialized: true,
        currentUserId: userId,
        error: getUserFacingError(error, "Unable to load your NFT portfolio right now.")
      });
    }
  },
  addNFT: async (userId, record) => {
    set({ isLoading: true, error: null, currentUserId: userId });

    try {
      await createNFT(userId, record);
      const nfts = await getUserNFTs(userId);
      set({ nfts, isLoading: false, isInitialized: true, currentUserId: userId });
    } catch (error) {
      const message = getUserFacingError(error, "Unable to save this NFT right now.");
      set({ isLoading: false, currentUserId: userId, error: message });
      throw new Error(message);
    }
  },
  updateNFT: async (userId, id, record) => {
    set({ isLoading: true, error: null, currentUserId: userId });

    try {
      await updateNFT(userId, id, record);
      const nfts = await getUserNFTs(userId);
      set({ nfts, isLoading: false, isInitialized: true, currentUserId: userId });
    } catch (error) {
      const message = getUserFacingError(error, "Unable to update this NFT right now.");
      set({ isLoading: false, currentUserId: userId, error: message });
      throw new Error(message);
    }
  },
  deleteNFT: async (userId, id) => {
    set({ isLoading: true, error: null, currentUserId: userId });

    try {
      await deleteNFT(userId, id);
      const nfts = await getUserNFTs(userId);
      set({ nfts, isLoading: false, isInitialized: true, currentUserId: userId });
    } catch (error) {
      const message = getUserFacingError(error, "Unable to delete this NFT right now.");
      set({ isLoading: false, currentUserId: userId, error: message });
      throw new Error(message);
    }
  },
  resetNFTs: () =>
    set({
      nfts: [],
      currentUserId: null,
      isLoading: false,
      isInitialized: false,
      error: null
    }),
  setFilter: (filter) => set({ filter }),
  setSearch: (search) => set({ search }),
  clearError: () => set({ error: null })
}));
