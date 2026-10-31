import { create } from "zustand";

interface AdminLearningPathUiState {
  selectedCourses: { id: string; title: string }[];
  selectedPersonas: string[];
  searchCourse: string;
  selectedDifficulty: string;
  selectedVisibility: string;
  selectedStatus: string;
  isDirty: boolean;

  setCourses: (courses: { id: string; title: string }[]) => void;
  addCourse: (course: { id: string; title: string }) => void;
  removeCourse: (courseId: string) => void;
  reorderCourses: (dragIndex: number, hoverIndex: number) => void;
  setPersonas: (personas: string[]) => void;
  setStatus: (status: string) => void;
  setVisibility: (visibility: string) => void;
  setDifficulty: (difficulty: string) => void;
  setSearchCourse: (searchCourse: string) => void;
  markDirty: (isDirty: boolean) => void;
  reset: () => void;
}

export const useAdminLearningPathUiStore = create<AdminLearningPathUiState>((set) => ({
  selectedCourses: [],
  selectedPersonas: [],
  searchCourse: "",
  selectedDifficulty: "Beginner",
  selectedVisibility: "Public",
  selectedStatus: "Draft",
  isDirty: false,

  setCourses: (selectedCourses) => set({ selectedCourses }),
  addCourse: (course) =>
    set((state) => {
      if (state.selectedCourses.some((c) => c.id === course.id)) return {};
      return {
        selectedCourses: [...state.selectedCourses, course],
        isDirty: true,
      };
    }),
  removeCourse: (courseId) =>
    set((state) => ({
      selectedCourses: state.selectedCourses.filter((c) => c.id !== courseId),
      isDirty: true,
    })),
  reorderCourses: (dragIndex, hoverIndex) =>
    set((state) => {
      const courses = [...state.selectedCourses];
      const [dragged] = courses.splice(dragIndex, 1);
      courses.splice(hoverIndex, 0, dragged);
      return {
        selectedCourses: courses,
        isDirty: true,
      };
    }),
  setPersonas: (selectedPersonas) => set({ selectedPersonas, isDirty: true }),
  setStatus: (selectedStatus) => set({ selectedStatus, isDirty: true }),
  setVisibility: (selectedVisibility) => set({ selectedVisibility, isDirty: true }),
  setDifficulty: (selectedDifficulty) => set({ selectedDifficulty, isDirty: true }),
  setSearchCourse: (searchCourse) => set({ searchCourse }),
  markDirty: (isDirty) => set({ isDirty }),
  reset: () =>
    set({
      selectedCourses: [],
      selectedPersonas: [],
      searchCourse: "",
      selectedDifficulty: "Beginner",
      selectedVisibility: "Public",
      selectedStatus: "Draft",
      isDirty: false,
    }),
}));
