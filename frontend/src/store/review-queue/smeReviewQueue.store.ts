// src/store/review-queue/smeReviewQueue.store.ts

import { create } from "zustand";

export type ReviewTab = "pending" | "in_progress" | "reviewed";

interface SmeReviewQueueUiState {
  activeTab: ReviewTab;
  page: number;
  limit: number;
  sortBy: string;
  search: string;

  setTab: (tab: ReviewTab) => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setSort: (sortBy: string) => void;
  setSearch: (search: string) => void;
  reset: () => void;
}

export const useSmeReviewQueueStore = create<SmeReviewQueueUiState>((set) => ({
  activeTab: "pending",
  page: 1,
  limit: 10,
  sortBy: "",
  search: "",

  setTab: (activeTab) => set({ activeTab, page: 1 }),
  setPage: (page) => set({ page }),
  setLimit: (limit) => set({ limit, page: 1 }),
  setSort: (sortBy) => set({ sortBy }),
  setSearch: (search) => set({ search, page: 1 }),
  reset: () =>
    set({
      activeTab: "pending",
      page: 1,
      limit: 10,
      sortBy: "",
      search: "",
    }),
}));
