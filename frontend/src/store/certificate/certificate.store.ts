import { create } from "zustand";

interface CertificateFiltersState {
  status?: "ACTIVE" | "REVOKED";
  careerPath?: string;
  tenantId?: string;
  dateRangeStart?: string;
  dateRangeEnd?: string;
  dateRange?: string;
}

interface CertificateStore {
  filters: CertificateFiltersState;
  search: string;
  page: number;
  limit: number;
  selectedIds: Set<string>;
  setFilter: <K extends keyof CertificateFiltersState>(
    key: K,
    value: CertificateFiltersState[K]
  ) => void;
  setSearch: (search: string) => void;
  setPage: (page: number) => void;
  resetFilters: () => void;
  toggleSelect: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
}

const initialFilters: CertificateFiltersState = {
  status: undefined,
  careerPath: undefined,
  tenantId: undefined,
  dateRangeStart: undefined,
  dateRangeEnd: undefined,
  dateRange: undefined,
};

export const useCertificateStore = create<CertificateStore>((set) => ({
  filters: initialFilters,
  search: "",
  page: 1,
  limit: 10,
  selectedIds: new Set<string>(),

  setFilter: (key, value) =>
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: value,
      },
      page: 1, // Reset page on filter change
    })),

  setSearch: (search) =>
    set(() => ({
      search,
      page: 1, // Reset page on search change
    })),

  setPage: (page) =>
    set(() => ({
      page,
    })),

  resetFilters: () =>
    set(() => ({
      filters: initialFilters,
      search: "",
      page: 1,
    })),

  toggleSelect: (id) =>
    set((state) => {
      const nextSelected = new Set(state.selectedIds);
      if (nextSelected.has(id)) {
        nextSelected.delete(id);
      } else {
        nextSelected.add(id);
      }
      return { selectedIds: nextSelected };
    }),

  selectAll: (ids) =>
    set((state) => {
      const nextSelected = new Set(state.selectedIds);
      const allSelected = ids.every((id) => nextSelected.has(id));
      if (allSelected) {
        ids.forEach((id) => nextSelected.delete(id));
      } else {
        ids.forEach((id) => nextSelected.add(id));
      }
      return { selectedIds: nextSelected };
    }),

  clearSelection: () =>
    set(() => ({
      selectedIds: new Set<string>(),
    })),
}));
