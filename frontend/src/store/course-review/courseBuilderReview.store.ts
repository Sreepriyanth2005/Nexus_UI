import { create } from "zustand";

interface CourseBuilderReviewState {
  acknowledgedWarnings: Record<string, boolean>;
  submissionDialogOpen: boolean;
  submitting: boolean;
  selectedReviewer: string;
  
  toggleAcknowledgement: (warningId: string) => void;
  setReviewer: (reviewer: string) => void;
  setSubmitting: (submitting: boolean) => void;
  setSubmissionDialogOpen: (isOpen: boolean) => void;
  reset: () => void;
}

export const useCourseBuilderReviewStore = create<CourseBuilderReviewState>()((set) => ({
  acknowledgedWarnings: {},
  submissionDialogOpen: false,
  submitting: false,
  selectedReviewer: "",

  toggleAcknowledgement: (warningId: string) => {
    set((state) => ({
      acknowledgedWarnings: {
        ...state.acknowledgedWarnings,
        [warningId]: !state.acknowledgedWarnings[warningId],
      },
    }));
  },

  setReviewer: (reviewer: string) => set({ selectedReviewer: reviewer }),
  setSubmitting: (submitting: boolean) => set({ submitting }),
  setSubmissionDialogOpen: (isOpen: boolean) => set({ submissionDialogOpen: isOpen }),
  reset: () => set({
    acknowledgedWarnings: {},
    submissionDialogOpen: false,
    submitting: false,
    selectedReviewer: "",
  }),
}));
