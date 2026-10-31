// src/store/review/review.store.ts

import { create } from "zustand";

import type {
    Review,
    ReviewFilter,
    ReviewWorkflow,
    ReviewComment,
    ReviewFeedback,
} from "../../types/review.types";

interface ReviewStore {
    /* -------------------------------------------------------------------------- */
    /* UI STATE                                                                   */
    /* -------------------------------------------------------------------------- */

    selectedReview?: Review;
    selectedWorkflow?: ReviewWorkflow;

    comments: ReviewComment[];
    feedback: ReviewFeedback[];

    filters: ReviewFilter;

    loading: boolean;

    /* -------------------------------------------------------------------------- */
    /* ACTIONS                                                                    */
    /* -------------------------------------------------------------------------- */

    setSelectedReview: (review?: Review) => void;
    setSelectedWorkflow: (workflow?: ReviewWorkflow) => void;

    setComments: (comments: ReviewComment[]) => void;
    setFeedback: (feedback: ReviewFeedback[]) => void;

    setFilters: (filters: Partial<ReviewFilter>) => void;
    resetFilters: () => void;

    setLoading: (loading: boolean) => void;

    clear: () => void;
}

const defaultFilters: ReviewFilter = {
    page: 1,
    limit: 10,
};

export const useReviewStore = create<ReviewStore>((set) => ({
    /* -------------------------------------------------------------------------- */
    /* STATE                                                                      */
    /* -------------------------------------------------------------------------- */

    selectedReview: undefined,
    selectedWorkflow: undefined,

    comments: [],
    feedback: [],

    filters: defaultFilters,

    loading: false,

    /* -------------------------------------------------------------------------- */
    /* ACTIONS                                                                    */
    /* -------------------------------------------------------------------------- */

    setSelectedReview: (review) =>
        set({
            selectedReview: review,
        }),

    setSelectedWorkflow: (workflow) =>
        set({
            selectedWorkflow: workflow,
        }),

    setComments: (comments) =>
        set({
            comments,
        }),

    setFeedback: (feedback) =>
        set({
            feedback,
        }),

    setFilters: (filters) =>
        set((state) => ({
            filters: {
                ...state.filters,
                ...filters,
            },
        })),

    resetFilters: () =>
        set({
            filters: defaultFilters,
        }),

    setLoading: (loading) =>
        set({
            loading,
        }),

    clear: () =>
        set({
            selectedReview: undefined,
            selectedWorkflow: undefined,
            comments: [],
            feedback: [],
            filters: defaultFilters,
            loading: false,
        }),
}));