import { create } from "zustand";

interface CourseCompletedState {
  selectedCourseId: string | null;
  selectedCertificateId: string | null;
  isShareModalOpen: boolean;
  setSelectedCourseId: (id: string | null) => void;
  setSelectedCertificateId: (id: string | null) => void;
  setShareModalOpen: (open: boolean) => void;
  reset: () => void;
}

export const useCourseCompletedStore = create<CourseCompletedState>((set) => ({
  selectedCourseId: null,
  selectedCertificateId: null,
  isShareModalOpen: false,

  setSelectedCourseId: (id) => set({ selectedCourseId: id }),
  setSelectedCertificateId: (id) => set({ selectedCertificateId: id }),
  setShareModalOpen: (open) => set({ isShareModalOpen: open }),

  reset: () => set({
    selectedCourseId: null,
    selectedCertificateId: null,
    isShareModalOpen: false,
  }),
}));
