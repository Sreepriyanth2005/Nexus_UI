import { create } from "zustand";

interface TenantUserUiState {
  search: string;
  personaFilters: string[];
  statusFilters: string[];
  page: number;
  pageSize: number;
  selectedUsers: string[];
  sortBy: string;
  sortOrder: "asc" | "desc" | "";

  setSearch: (search: string) => void;
  togglePersona: (persona: string) => void;
  toggleStatus: (status: string) => void;
  setStatusFilter: (status: string | null) => void;
  setSort: (sortBy: string, sortOrder: "asc" | "desc" | "") => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  toggleSelection: (userId: string) => void;
  toggleAllSelection: (userIds: string[]) => void;
  clearSelection: () => void;
  reset: () => void;
}

export const useTenantUserUiStore = create<TenantUserUiState>((set) => ({
  search: "",
  personaFilters: [],
  statusFilters: [],
  page: 1,
  pageSize: 10,
  selectedUsers: [],
  sortBy: "",
  sortOrder: "",

  setSearch: (search) => set({ search, page: 1 }),
  togglePersona: (persona) =>
    set((state) => ({
      personaFilters: state.personaFilters.includes(persona)
        ? state.personaFilters.filter((p) => p !== persona)
        : [...state.personaFilters, persona],
      page: 1,
    })),
  toggleStatus: (status) =>
    set((state) => ({
      statusFilters: state.statusFilters.includes(status)
        ? state.statusFilters.filter((s) => s !== status)
        : [...state.statusFilters, status],
      page: 1,
    })),
  setStatusFilter: (status) =>
    set({
      statusFilters: status ? [status] : [],
      page: 1,
    }),
  setSort: (sortBy, sortOrder) => set({ sortBy, sortOrder }),
  setPage: (page) => set({ page }),
  setPageSize: (pageSize) => set({ pageSize, page: 1 }),
  toggleSelection: (userId) =>
    set((state) => ({
      selectedUsers: state.selectedUsers.includes(userId)
        ? state.selectedUsers.filter((id) => id !== userId)
        : [...state.selectedUsers, userId],
    })),
  toggleAllSelection: (userIds) =>
    set((state) => {
      const allSelected = userIds.every((id) => state.selectedUsers.includes(id));
      return {
        selectedUsers: allSelected
          ? state.selectedUsers.filter((id) => !userIds.includes(id))
          : [...new Set([...state.selectedUsers, ...userIds])],
      };
    }),
  clearSelection: () => set({ selectedUsers: [] }),
  reset: () =>
    set({
      search: "",
      personaFilters: [],
      statusFilters: [],
      page: 1,
      pageSize: 10,
      selectedUsers: [],
      sortBy: "",
      sortOrder: "",
    }),
}));
