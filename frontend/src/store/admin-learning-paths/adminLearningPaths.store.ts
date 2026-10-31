import { create } from "zustand";

interface AdminLearningPathsStore {
  // Filters / Search / Pagination
  search: string;
  selectedStatus: string;
  selectedCategory: string;
  selectedVisibility: string;
  sort: string;
  page: number;
  pageSize: number;
  selectedLearningPaths: string[];

  // Actions
  setSearch: (search: string) => void;
  setStatus: (status: string) => void;
  setCategory: (categoryId: string) => void;
  setVisibility: (visibility: string) => void;
  setSort: (sort: string) => void;
  setPage: (page: number) => void;
  toggleSelection: (id: string) => void;
  clearFilters: () => void;
  reset: () => void;
}

const initialFilters = {
  search: "",
  selectedStatus: "all",
  selectedCategory: "all",
  selectedVisibility: "all",
  sort: "Newest",
  page: 1,
  pageSize: 10,
  selectedLearningPaths: [],
};

export const useAdminLearningPathsStore = create<AdminLearningPathsStore>((set) => ({
  ...initialFilters,

  setSearch: (search) => set({ search, page: 1 }),
  setStatus: (selectedStatus) => set({ selectedStatus, page: 1 }),
  setCategory: (selectedCategory) => set({ selectedCategory, page: 1 }),
  setVisibility: (selectedVisibility) => set({ selectedVisibility, page: 1 }),
  setSort: (sort) => set({ sort }),
  setPage: (page) => set({ page }),
  toggleSelection: (id) =>
    set((state) => {
      const isSelected = state.selectedLearningPaths.includes(id);
      return {
        selectedLearningPaths: isSelected
          ? state.selectedLearningPaths.filter((x) => x !== id)
          : [...state.selectedLearningPaths, id],
      };
    }),
  clearFilters: () =>
    set({
      search: "",
      selectedStatus: "all",
      selectedCategory: "all",
      selectedVisibility: "all",
      page: 1,
    }),
  reset: () => set(initialFilters),
}));
