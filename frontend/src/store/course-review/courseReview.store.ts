import { create } from "zustand";

interface CourseReviewUiState {
  selectedLessonId: string | null;
  activeTab: "pending" | "approved" | "rejected";
  commentDraft: string;
  commentKind: "Required" | "Suggestion" | "Resolved";
  expandedSections: string[];
  reviewFilter: "all" | "open" | "resolved";
  playbackPosition: number;
  sidebarCollapsed: boolean;

  setSelectedLessonId: (lessonId: string | null) => void;
  setActiveTab: (tab: "pending" | "approved" | "rejected") => void;
  setCommentDraft: (commentDraft: string) => void;
  setCommentKind: (commentKind: "Required" | "Suggestion" | "Resolved") => void;
  toggleSection: (section: string) => void;
  setReviewFilter: (filter: "all" | "open" | "resolved") => void;
  setPlaybackPosition: (pos: number) => void;
  toggleSidebar: () => void;
  reset: () => void;
}

export const useCourseReviewUiStore = create<CourseReviewUiState>((set) => ({
  selectedLessonId: null,
  activeTab: "pending",
  commentDraft: "",
  commentKind: "Suggestion",
  expandedSections: [],
  reviewFilter: "all",
  playbackPosition: 0,
  sidebarCollapsed: false,

  setSelectedLessonId: (selectedLessonId) => set({ selectedLessonId }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setCommentDraft: (commentDraft) => set({ commentDraft }),
  setCommentKind: (commentKind) => set({ commentKind }),
  toggleSection: (section) =>
    set((state) => ({
      expandedSections: state.expandedSections.includes(section)
        ? state.expandedSections.filter((s) => s !== section)
        : [...state.expandedSections, section],
    })),
  setReviewFilter: (reviewFilter) => set({ reviewFilter }),
  setPlaybackPosition: (playbackPosition) => set({ playbackPosition }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  reset: () =>
    set({
      selectedLessonId: null,
      activeTab: "pending",
      commentDraft: "",
      commentKind: "Suggestion",
      expandedSections: [],
      reviewFilter: "all",
      playbackPosition: 0,
      sidebarCollapsed: false,
    }),
}));
