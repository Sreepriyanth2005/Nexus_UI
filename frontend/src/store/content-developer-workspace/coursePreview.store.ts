import { create } from "zustand";

interface CoursePreviewState {
  expandedLessonIds: Record<string, boolean>;
  selectedLesson: string | null;
  previewMode: boolean;
  activeTab: string;

  toggleLesson: (lessonId: string) => void;
  setSelectedLesson: (lessonId: string | null) => void;
  setPreviewMode: (mode: boolean) => void;
  setActiveTab: (tab: string) => void;
  reset: () => void;
}

export const useCoursePreviewStore = create<CoursePreviewState>((set) => ({
  expandedLessonIds: {},
  selectedLesson: null,
  previewMode: true,
  activeTab: "overview",

  toggleLesson: (lessonId) =>
    set((state) => ({
      expandedLessonIds: {
        ...state.expandedLessonIds,
        [lessonId]: !state.expandedLessonIds[lessonId],
      },
    })),
  setSelectedLesson: (lessonId) => set({ selectedLesson: lessonId }),
  setPreviewMode: (previewMode) => set({ previewMode }),
  setActiveTab: (activeTab) => set({ activeTab }),
  reset: () =>
    set({
      expandedLessonIds: {},
      selectedLesson: null,
      previewMode: true,
      activeTab: "overview",
    }),
}));
