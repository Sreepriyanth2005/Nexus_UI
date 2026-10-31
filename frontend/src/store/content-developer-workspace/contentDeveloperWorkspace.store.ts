import { create } from "zustand";

interface WorkspaceState {
  activeTab: "My courses" | "Feedback";
  search: string;
  sort: string;
  sortBy: string; // Compatibility alias
  selectedStatus: string;
  selectedType: string;
  page: number;

  setActiveTab: (tab: "My courses" | "Feedback") => void;
  setTab: (tab: "My courses" | "Feedback") => void; // Alias
  setSearch: (search: string) => void;
  setSort: (sort: string) => void;
  setSortBy: (sortBy: string) => void; // Compatibility alias
  setFilter: (key: "selectedStatus" | "selectedType", value: string) => void;
  setPage: (page: number) => void;
  reset: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  activeTab: "My courses",
  search: "",
  sort: "Newest",
  sortBy: "Newest",
  selectedStatus: "all",
  selectedType: "all",
  page: 1,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setTab: (tab) => set({ activeTab: tab }),
  setSearch: (search) => set({ search, page: 1 }),
  setSort: (sort) => set({ sort, sortBy: sort }),
  setSortBy: (sortBy) => set({ sort: sortBy, sortBy }),
  setFilter: (key, value) => set({ [key]: value, page: 1 }),
  setPage: (page) => set({ page }),
  reset: () =>
    set({
      activeTab: "My courses",
      search: "",
      sort: "Newest",
      sortBy: "Newest",
      selectedStatus: "all",
      selectedType: "all",
      page: 1,
    }),
}));

