import { create } from "zustand";

interface MemberLearningFilters {
  careerPath: string[];
  difficulty: string[];
  duration: string[];
  price: string[];
}

interface MemberLearningStore {
  activeTab: string;
  search: string;
  sortBy: string;
  page: number;
  limit: number;
  filters: MemberLearningFilters;
  setActiveTab: (tab: string) => void;
  setSearch: (search: string) => void;
  setSortBy: (sortBy: string) => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  toggleFilter: (
    type: keyof MemberLearningFilters,
    value: string
  ) => void;
  clearFilters: () => void;
  resetStore: () => void;
}

const initialFilters: MemberLearningFilters = {
  careerPath: [],
  difficulty: [],
  duration: [],
  price: [],
};

export const useMemberLearningStore = create<MemberLearningStore>((set) => ({
  activeTab: "All courses",
  search: "",
  sortBy: "Newest",
  page: 1,
  limit: 4, // show 4 items by default (fits 4-column grid)
  filters: initialFilters,

  setActiveTab: (tab) =>
    set(() => ({
      activeTab: tab,
      page: 1, // reset page when tab changes
    })),

  setSearch: (search) =>
    set(() => ({
      search,
      page: 1, // reset page when search changes
    })),

  setSortBy: (sortBy) =>
    set(() => ({
      sortBy,
      page: 1, // reset page when sort changes
    })),

  setPage: (page) =>
    set(() => ({
      page,
    })),

  setLimit: (limit) =>
    set(() => ({
      limit,
    })),

  toggleFilter: (type, value) =>
    set((state) => {
      const currentFilters = state.filters[type];
      const isSelected = currentFilters.includes(value);
      const nextFilters = isSelected
        ? currentFilters.filter((v) => v !== value)
        : [...currentFilters, value];

      return {
        filters: {
          ...state.filters,
          [type]: nextFilters,
        },
        page: 1, // reset page when filters change
      };
    }),

  clearFilters: () =>
    set(() => ({
      filters: initialFilters,
      page: 1,
    })),

  resetStore: () =>
    set(() => ({
      activeTab: "All courses",
      search: "",
      sortBy: "Newest",
      page: 1,
      limit: 4,
      filters: initialFilters,
    })),
}));
