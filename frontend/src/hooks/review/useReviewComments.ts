// src/hooks/review/useReviewComments.ts

import {
    useQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";

import {
    getReviewCommentsApi,
    createReviewCommentApi,
    updateReviewCommentApi,
    deleteReviewCommentApi,
    replyReviewCommentApi,
} from "../../core/api/review/review-comment.api";

import type {
    CreateCommentDto,
    UpdateCommentDto,
    ReplyCommentDto,
} from "../../types/review.types";

/* -------------------------------------------------------------------------- */
/*                                  KEYS                                      */
/* -------------------------------------------------------------------------- */

export const reviewCommentKeys = {
    all: ["review-comments"] as const,

    review: (reviewId: string) =>
        [...reviewCommentKeys.all, reviewId] as const,
};

/* -------------------------------------------------------------------------- */
/*                              GET COMMENTS                                  */
/* -------------------------------------------------------------------------- */

export const useReviewComments = (
    reviewId: string,
    entityType: string = "course"
) => {

    return useQuery({
        queryKey: [...reviewCommentKeys.review(reviewId), entityType],
        queryFn: () => getReviewCommentsApi(reviewId, entityType),
        enabled: !!reviewId,
    });

};

/* -------------------------------------------------------------------------- */
/*                             CREATE COMMENT                                 */
/* -------------------------------------------------------------------------- */

export const useCreateReviewComment = (
    reviewId: string
) => {

    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (
            payload: CreateCommentDto
        ) =>
            createReviewCommentApi(payload),

        onSuccess: () => {

            queryClient.invalidateQueries({
                queryKey: reviewCommentKeys.review(reviewId),
            });

        },
    });

};

/* -------------------------------------------------------------------------- */
/*                              UPDATE COMMENT                                */
/* -------------------------------------------------------------------------- */

export const useUpdateReviewComment = (
    reviewId: string
) => {

    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            commentId,
            payload,
        }: {
            commentId: string;
            payload: UpdateCommentDto;
        }) =>
            updateReviewCommentApi(
                commentId,
                payload
            ),

        onSuccess: () => {

            queryClient.invalidateQueries({
                queryKey: reviewCommentKeys.review(reviewId),
            });

        },
    });

};

/* -------------------------------------------------------------------------- */
/*                              DELETE COMMENT                                */
/* -------------------------------------------------------------------------- */

export const useDeleteReviewComment = (
    reviewId: string
) => {

    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (
            commentId: string
        ) =>
            deleteReviewCommentApi(commentId),

        onSuccess: () => {

            queryClient.invalidateQueries({
                queryKey: reviewCommentKeys.review(reviewId),
            });

        },
    });

};

/* -------------------------------------------------------------------------- */
/*                               REPLY COMMENT                                */
/* -------------------------------------------------------------------------- */

export const useReplyReviewComment = (
    reviewId: string
) => {

    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            commentId,
            payload,
        }: {
            commentId: string;
            payload: ReplyCommentDto;
        }) =>
            replyReviewCommentApi(
                commentId,
                payload.message
            ),

        onSuccess: () => {

            queryClient.invalidateQueries({
                queryKey: reviewCommentKeys.review(reviewId),
            });

        },
    });

};