import { create } from "zustand";
import { CourseStatus, DifficultyLevel, CourseVisibility } from "../../core/api/admin-courses/adminCoursesApi.types";

// ---------------------------------------------------------------------------
// Filter state
// ---------------------------------------------------------------------------

interface AdminCourseFiltersState {
  status?: CourseStatus;
  difficulty?: DifficultyLevel;
  visibility?: CourseVisibility;
  categoryId?: string;
}

// ---------------------------------------------------------------------------
// Store interface
// ---------------------------------------------------------------------------

interface AdminCoursesStore {
  // Filter / Search / Pagination state
  filters: AdminCourseFiltersState;
  search: string;
  page: number;
  limit: number;
  sortBy: "createdAt" | "updatedAt" | "title";
  sortOrder: "asc" | "desc";

  // Selection state
  selectedIds: Set<string>;

  // Actions — filters
  setFilter: <K extends keyof AdminCourseFiltersState>(
    key: K,
    value: AdminCourseFiltersState[K]
  ) => void;
  setSearch: (search: string) => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setSortBy: (sortBy: AdminCoursesStore["sortBy"]) => void;
  setSortOrder: (order: "asc" | "desc") => void;
  resetFilters: () => void;

  // Actions — selection
  toggleSelect: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const initialFilters: AdminCourseFiltersState = {
  status: undefined,
  difficulty: undefined,
  visibility: undefined,
  categoryId: undefined,
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAdminCoursesStore = create<AdminCoursesStore>((set) => ({
  filters: initialFilters,
  search: "",
  page: 1,
  limit: 10,
  sortBy: "updatedAt",
  sortOrder: "desc",
  selectedIds: new Set<string>(),

  setFilter: (key, value) =>
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: value,
      },
      page: 1,
    })),

  setSearch: (search) =>
    set(() => ({
      search,
      page: 1,
    })),

  setPage: (page) =>
    set(() => ({
      page,
    })),

  setLimit: (limit) =>
    set(() => ({
      limit,
      page: 1,
    })),

  setSortBy: (sortBy) =>
    set(() => ({
      sortBy,
      page: 1,
    })),

  setSortOrder: (sortOrder) =>
    set(() => ({
      sortOrder,
    })),

  resetFilters: () =>
    set(() => ({
      filters: initialFilters,
      search: "",
      page: 1,
      sortBy: "updatedAt" as const,
      sortOrder: "desc" as const,
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
