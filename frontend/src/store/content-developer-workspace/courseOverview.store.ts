import { create } from "zustand";

interface CourseOverviewState {
  selectedLesson: string | null;
  expandedLesson: string | null;
  activeSidebarCard: string | null;
  previewMode: boolean;

  setSelectedLesson: (lessonId: string | null) => void;
  setExpandedLesson: (lessonId: string | null) => void;
  setActiveSidebarCard: (cardId: string | null) => void;
  setPreviewMode: (mode: boolean) => void;
  reset: () => void;
}

export const useCourseOverviewStore = create<CourseOverviewState>((set) => ({
  selectedLesson: null,
  expandedLesson: null,
  activeSidebarCard: null,
  previewMode: false,

  setSelectedLesson: (lessonId) => set({ selectedLesson: lessonId }),
  setExpandedLesson: (lessonId) => set({ expandedLesson: lessonId }),
  setActiveSidebarCard: (cardId) => set({ activeSidebarCard: cardId }),
  setPreviewMode: (previewMode) => set({ previewMode }),
  reset: () =>
    set({
      selectedLesson: null,
      expandedLesson: null,
      activeSidebarCard: null,
      previewMode: false,
    }),
}));
