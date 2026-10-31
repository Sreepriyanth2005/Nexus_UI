import { create } from "zustand";

interface CourseDetailsState {
  activeTab: "Notes" | "Transcript" | "Resources";
  selectedLessonId: string | null;
  expandedModuleId: string | null;
  isSidebarOpen: boolean;
  previewVideo: string | null;
  setActiveTab: (tab: "Notes" | "Transcript" | "Resources") => void;
  setSelectedLessonId: (id: string | null) => void;
  toggleModule: (id: string) => void;
  setSidebarOpen: (open: boolean) => void;
  setPreviewVideo: (video: string | null) => void;
  reset: () => void;
}

export const useCourseDetailsStore = create<CourseDetailsState>((set) => ({
  activeTab: "Notes",
  selectedLessonId: null,
  expandedModuleId: null,
  isSidebarOpen: false,
  previewVideo: null,

  setActiveTab: (tab) => set({ activeTab: tab }),

  setSelectedLessonId: (id) => set({ selectedLessonId: id }),

  toggleModule: (id) =>
    set((state) => ({
      expandedModuleId: state.expandedModuleId === id ? null : id,
    })),

  setSidebarOpen: (open) => set({ isSidebarOpen: open }),

  setPreviewVideo: (video) => set({ previewVideo: video }),

  reset: () =>
    set({
      activeTab: "Notes",
      selectedLessonId: null,
      expandedModuleId: null,
      isSidebarOpen: false,
      previewVideo: null,
    }),
}));
