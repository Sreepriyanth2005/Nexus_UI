import { create } from "zustand";

interface CourseStore {
  selectedCourseId?: string;

  filters: {
    page: number;
    limit: number;
    search: string;
  };

  setSelectedCourseId: (
    id?: string
  ) => void;

  setFilters: (
    filters: Partial<CourseStore["filters"]>
  ) => void;

  reset: () => void;
}

const initialFilters = {
  page: 1,
  limit: 10,
  search: "",
};

export const useCourseStore =
  create<CourseStore>((set) => ({
    selectedCourseId: undefined,

    filters: initialFilters,

    setSelectedCourseId: (id) =>
      set({
        selectedCourseId: id,
      }),

    setFilters: (filters) =>
      set((state) => ({
        filters: {
          ...state.filters,
          ...filters,
        },
      })),

    reset: () =>
      set({
        selectedCourseId: undefined,
        filters: initialFilters,
      }),
  }));