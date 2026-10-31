import { create } from "zustand";

interface InternalUserUiState {
  search: string;
  roleFilters: string[];
  statusFilters: string[];
  tenantFilter: string;
  dateJoinedFilter: string;
  lastActiveFilter: string[];
  page: number;
  pageSize: number;
  selectedUsers: string[];
  filterPanelOpen: boolean;
  sortOrder: "asc" | "desc" | "";

  setSearch: (search: string) => void;
  toggleRole: (role: string) => void;
  toggleStatus: (status: string) => void;
  setStatusFilter: (status: string | null) => void;
  setTenant: (tenantId: string) => void;
  setDateJoined: (dateJoined: string) => void;
  toggleLastActive: (lastActive: string) => void;
  toggleFilterPanel: () => void;
  setSort: (sortOrder: "asc" | "desc" | "") => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  toggleSelection: (userId: string) => void;
  toggleAllSelection: (userIds: string[]) => void;
  clearSelection: () => void;
  reset: () => void;
}

export const useInternalUserUiStore = create<InternalUserUiState>((set) => ({
  search: "",
  roleFilters: [],
  statusFilters: [],
  tenantFilter: "",
  dateJoinedFilter: "",
  lastActiveFilter: [],
  page: 1,
  pageSize: 10,
  selectedUsers: [],
  filterPanelOpen: false,
  sortOrder: "",

  setSearch: (search) => set({ search, page: 1 }),
  toggleRole: (role) =>
    set((state) => ({
      roleFilters: state.roleFilters.includes(role)
        ? state.roleFilters.filter((r) => r !== role)
        : [...state.roleFilters, role],
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
  setTenant: (tenantFilter) => set({ tenantFilter, page: 1 }),
  setDateJoined: (dateJoinedFilter) => set({ dateJoinedFilter, page: 1 }),
  toggleLastActive: (lastActive) =>
    set((state) => ({
      lastActiveFilter: state.lastActiveFilter.includes(lastActive)
        ? state.lastActiveFilter.filter((l) => l !== lastActive)
        : [...state.lastActiveFilter, lastActive],
      page: 1,
    })),
  toggleFilterPanel: () => set((state) => ({ filterPanelOpen: !state.filterPanelOpen })),
  setSort: (sortOrder) => set({ sortOrder }),
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
      roleFilters: [],
      statusFilters: [],
      tenantFilter: "",
      dateJoinedFilter: "",
      lastActiveFilter: [],
      page: 1,
      pageSize: 10,
      selectedUsers: [],
      filterPanelOpen: false,
      sortOrder: "",
    }),
}));
