import { create } from "zustand";

interface SmeDashboardState {
  activeFilter: string;
  page: number;
  pageSize: number;
  selectedReview: string | null;
  search: string;

  setFilter: (filter: string) => void;
  setPage: (page: number) => void;
  setSelectedReview: (reviewId: string | null) => void;
  setSearch: (search: string) => void;
  reset: () => void;
}

export const useSmeDashboardStore = create<SmeDashboardState>((set) => ({
  activeFilter: "all",
  page: 1,
  pageSize: 10,
  selectedReview: null,
  search: "",

  setFilter: (activeFilter) => set({ activeFilter, page: 1 }),
  setPage: (page) => set({ page }),
  setSelectedReview: (selectedReview) => set({ selectedReview }),
  setSearch: (search) => set({ search, page: 1 }),
  reset: () =>
    set({
      activeFilter: "all",
      page: 1,
      pageSize: 10,
      selectedReview: null,
      search: "",
    }),
}));
