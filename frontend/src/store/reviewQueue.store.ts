// src/store/reviewQueue.store.ts

import { create } from "zustand";

export type ReviewTab = "pending" | "approved" | "rejected";

interface ReviewQueueUiState {
  activeTab: ReviewTab;
  search: string;
  sort: string;
  page: number;
  pageSize: number;

  setTab: (tab: ReviewTab) => void;
  setSearch: (search: string) => void;
  setSort: (sort: string) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  reset: () => void;
}

export const useReviewQueueStore = create<ReviewQueueUiState>((set) => ({
  activeTab: "pending",
  search: "",
  sort: "",
  page: 1,
  pageSize: 10,

  setTab: (activeTab) => set({ activeTab, page: 1 }),
  setSearch: (search) => set({ search, page: 1 }),
  setSort: (sort) => set({ sort }),
  setPage: (page) => set({ page }),
  setPageSize: (pageSize) => set({ pageSize, page: 1 }),
  reset: () => set({
    activeTab: "pending",
    search: "",
    sort: "",
    page: 1,
    pageSize: 10,
  }),
}));
