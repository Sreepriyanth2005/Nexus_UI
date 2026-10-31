// src/hooks/review/useReviewFeedback.ts

import {
    useQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";

import {
    getReviewFeedbackApi,
    createReviewFeedbackApi,
    updateReviewFeedbackApi,
    deleteReviewFeedbackApi,
    resolveReviewFeedbackApi,
} from "../../core/api/review/review-feedback.api";

import type {
    CreateFeedbackDto,
    UpdateFeedbackDto,
    ResolveFeedbackDto,
} from "../../types/review.types";

/* -------------------------------------------------------------------------- */
/*                                   KEYS                                     */
/* -------------------------------------------------------------------------- */

export const reviewFeedbackKeys = {
    all: ["review-feedback"] as const,

    review: (reviewId: string) =>
        [...reviewFeedbackKeys.all, reviewId] as const,
};

/* -------------------------------------------------------------------------- */
/*                              GET FEEDBACK                                  */
/* -------------------------------------------------------------------------- */

export const useReviewFeedback = (
    reviewId: string
) => {

    return useQuery({
        queryKey: reviewFeedbackKeys.review(reviewId),
        queryFn: () => getReviewFeedbackApi(reviewId),
        enabled: !!reviewId,
    });

};

/* -------------------------------------------------------------------------- */
/*                            CREATE FEEDBACK                                 */
/* -------------------------------------------------------------------------- */

export const useCreateReviewFeedback = (
    reviewId: string
) => {

    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateFeedbackDto) =>
            createReviewFeedbackApi(
                reviewId,
                payload
            ),

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: reviewFeedbackKeys.review(reviewId),
            });
        },
    });

};

/* -------------------------------------------------------------------------- */
/*                            UPDATE FEEDBACK                                 */
/* -------------------------------------------------------------------------- */

export const useUpdateReviewFeedback = (
    reviewId: string
) => {

    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            feedbackId,
            payload,
        }: {
            feedbackId: string;
            payload: UpdateFeedbackDto;
        }) =>
            updateReviewFeedbackApi(
                feedbackId,
                payload
            ),

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: reviewFeedbackKeys.review(reviewId),
            });
        },
    });

};

/* -------------------------------------------------------------------------- */
/*                            DELETE FEEDBACK                                 */
/* -------------------------------------------------------------------------- */

export const useDeleteReviewFeedback = (
    reviewId: string
) => {

    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (feedbackId: string) =>
            deleteReviewFeedbackApi(feedbackId),

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: reviewFeedbackKeys.review(reviewId),
            });
        },
    });

};

/* -------------------------------------------------------------------------- */
/*                           RESOLVE FEEDBACK                                 */
/* -------------------------------------------------------------------------- */

export const useResolveReviewFeedback = (
    reviewId: string
) => {

    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            feedbackId,
            payload,
        }: {
            feedbackId: string;
            payload: ResolveFeedbackDto;
        }) =>
            resolveReviewFeedbackApi(
                feedbackId,
                payload
            ),

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: reviewFeedbackKeys.review(reviewId),
            });
        },
    });

};