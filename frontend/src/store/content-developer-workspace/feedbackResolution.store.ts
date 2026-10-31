import { create } from "zustand";

interface FeedbackResolutionState {
  expandedFeedbackId: string | null;
  selectedFilter: "all" | "required" | "suggestions" | "resolved";
  replyDrafts: Record<string, string>;
  submittingReply: boolean;
  resolvingFeedback: boolean;

  setExpandedFeedback: (cardId: string | null) => void;
  setReplyDraft: (cardId: string, text: string) => void;
  clearReplyDraft: (cardId: string) => void;
  setFilter: (filter: "all" | "required" | "suggestions" | "resolved") => void;
  setSubmittingReply: (submitting: boolean) => void;
  setResolvingFeedback: (resolving: boolean) => void;
  reset: () => void;
}

export const useFeedbackResolutionStore = create<FeedbackResolutionState>((set) => ({
  expandedFeedbackId: null,
  selectedFilter: "all",
  replyDrafts: {},
  submittingReply: false,
  resolvingFeedback: false,

  setExpandedFeedback: (cardId) => set({ expandedFeedbackId: cardId }),
  setReplyDraft: (cardId, text) =>
    set((state) => ({
      replyDrafts: { ...state.replyDrafts, [cardId]: text },
    })),
  clearReplyDraft: (cardId) =>
    set((state) => {
      const updatedDrafts = { ...state.replyDrafts };
      delete updatedDrafts[cardId];
      return { replyDrafts: updatedDrafts };
    }),
  setFilter: (filter) => set({ selectedFilter: filter }),
  setSubmittingReply: (submittingReply) => set({ submittingReply }),
  setResolvingFeedback: (resolvingFeedback) => set({ resolvingFeedback }),
  reset: () =>
    set({
      expandedFeedbackId: null,
      selectedFilter: "all",
      replyDrafts: {},
      submittingReply: false,
      resolvingFeedback: false,
    }),
}));
