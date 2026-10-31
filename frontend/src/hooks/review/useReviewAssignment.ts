// src/hooks/review/useReviewAssignment.ts

import {
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";

import {
    getReviewAssignmentApi,
    getReviewAssignmentsApi,
    assignReviewerApi,
    reassignReviewerApi,
    removeReviewAssignmentApi,
    getMyAssignedReviewsApi,
    getReviewAssignmentHistoryApi,
} from "../../core/api/review/review-assignment.api";

import type {
    AssignReviewerDto,
} from "../../types/review.types";

/* -------------------------------------------------------------------------- */
/*                                   KEYS                                     */
/* -------------------------------------------------------------------------- */

export const reviewAssignmentKeys = {

    all: ["review-assignments"] as const,

    lists: () =>
        [...reviewAssignmentKeys.all, "list"] as const,

    list: () =>
        [...reviewAssignmentKeys.lists()] as const,

    details: () =>
        [...reviewAssignmentKeys.all, "detail"] as const,

    detail: (reviewId: string) =>
        [...reviewAssignmentKeys.details(), reviewId] as const,

    history: (reviewId: string) =>
        [...reviewAssignmentKeys.all, "history", reviewId] as const,

    my: () =>
        [...reviewAssignmentKeys.all, "my"] as const,

};

/* -------------------------------------------------------------------------- */
/*                           GET ASSIGNMENT                                   */
/* -------------------------------------------------------------------------- */

export const useReviewAssignment = (
    reviewId: string
) =>
    useQuery({
        queryKey: reviewAssignmentKeys.detail(reviewId),
        queryFn: () =>
            getReviewAssignmentApi(reviewId),
        enabled: !!reviewId,
    });

/* -------------------------------------------------------------------------- */
/*                         GET ALL ASSIGNMENTS                                */
/* -------------------------------------------------------------------------- */

export const useReviewAssignments = () =>
    useQuery({
        queryKey: reviewAssignmentKeys.list(),
        queryFn: getReviewAssignmentsApi,
    });

/* -------------------------------------------------------------------------- */
/*                        GET MY ASSIGNED REVIEWS                             */
/* -------------------------------------------------------------------------- */

export const useMyAssignedReviews = () =>
    useQuery({
        queryKey: reviewAssignmentKeys.my(),
        queryFn: getMyAssignedReviewsApi,
    });

/* -------------------------------------------------------------------------- */
/*                     GET ASSIGNMENT HISTORY                                 */
/* -------------------------------------------------------------------------- */

export const useReviewAssignmentHistory = (
    reviewId: string
) =>
    useQuery({
        queryKey: reviewAssignmentKeys.history(reviewId),
        queryFn: () =>
            getReviewAssignmentHistoryApi(reviewId),
        enabled: !!reviewId,
    });

/* -------------------------------------------------------------------------- */
/*                           ASSIGN REVIEWER                                  */
/* -------------------------------------------------------------------------- */

export const useAssignReviewer = () => {

    const queryClient = useQueryClient();

    return useMutation({

        mutationFn: ({
            reviewId,
            payload,
        }: {
            reviewId: string;
            payload: AssignReviewerDto;
        }) =>
            assignReviewerApi(
                reviewId,
                payload
            ),

        onSuccess: (_, variables) => {

            queryClient.invalidateQueries({
                queryKey: reviewAssignmentKeys.list(),
            });

            queryClient.invalidateQueries({
                queryKey: reviewAssignmentKeys.detail(
                    variables.reviewId
                ),
            });

        },

    });

};

/* -------------------------------------------------------------------------- */
/*                          REASSIGN REVIEWER                                 */
/* -------------------------------------------------------------------------- */

export const useReassignReviewer = () => {

    const queryClient = useQueryClient();

    return useMutation({

        mutationFn: ({
            reviewId,
            payload,
        }: {
            reviewId: string;
            payload: AssignReviewerDto;
        }) =>
            reassignReviewerApi(
                reviewId,
                payload
            ),

        onSuccess: (_, variables) => {

            queryClient.invalidateQueries({
                queryKey: reviewAssignmentKeys.list(),
            });

            queryClient.invalidateQueries({
                queryKey: reviewAssignmentKeys.detail(
                    variables.reviewId
                ),
            });

        },

    });

};

/* -------------------------------------------------------------------------- */
/*                        REMOVE ASSIGNMENT                                   */
/* -------------------------------------------------------------------------- */

export const useRemoveReviewAssignment = () => {

    const queryClient = useQueryClient();

    return useMutation({

        mutationFn: (
            reviewId: string
        ) =>
            removeReviewAssignmentApi(
                reviewId
            ),

        onSuccess: () => {

            queryClient.invalidateQueries({
                queryKey: reviewAssignmentKeys.list(),
            });

        },

    });

};