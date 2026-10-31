// src/hooks/review/useReview.ts

import {
    useQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";

import {
    getReviewsApi,
    getReviewByEntityApi,
    createReviewApi,
    updateReviewApi,
    deleteReviewApi,
    submitReviewApi,
    approveReviewApi,
    rejectReviewApi,
    requestChangesApi,
    publishReviewApi,
    assignReviewerApi,
} from "../../core/api/review/review.api";

import { useAuthStore } from "../../core/auth/auth.store";
import { useUserStore } from "../../store/user.store";

import type {
    ReviewQueryParams,
    CreateReviewDto,
    UpdateReviewDto,
    SubmitReviewDto,
    ApproveReviewDto,
    RejectReviewDto,
    RequestChangesDto,
    PublishReviewDto,
    AssignReviewerDto,
} from "../../types/review.types";

/* -------------------------------------------------------------------------- */
/*                                  KEYS                                      */
/* -------------------------------------------------------------------------- */

export const reviewKeys = {
    all: ["reviews"] as const,

    lists: () => [...reviewKeys.all, "list"] as const,

    list: (params?: ReviewQueryParams) =>
        [...reviewKeys.lists(), params] as const,

    details: () => [...reviewKeys.all, "detail"] as const,

    detail: (entityType: string, entityId: string) =>
        [...reviewKeys.details(), entityType, entityId] as const,
};

/* -------------------------------------------------------------------------- */
/*                               GET REVIEWS                                  */
/* -------------------------------------------------------------------------- */

export const useReviews = (
    params?: ReviewQueryParams
) =>
    useQuery({
        queryKey: reviewKeys.list(params),
        queryFn: () => getReviewsApi(params),
    });

/* -------------------------------------------------------------------------- */
/*                               GET REVIEW                                   */
/* -------------------------------------------------------------------------- */

export const useReview = (
    entityType: string,
    entityId: string
) =>
    useQuery({
        queryKey: reviewKeys.detail(entityType, entityId),
        queryFn: () => getReviewByEntityApi(entityType, entityId),
        enabled: !!entityId && !!entityType,
    });

/* -------------------------------------------------------------------------- */
/*                             CREATE REVIEW                                  */
/* -------------------------------------------------------------------------- */

export const useCreateReview = () => {

    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (
            payload: CreateReviewDto
        ) => createReviewApi(payload),

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: reviewKeys.lists(),
            });
        },
    });

};

/* -------------------------------------------------------------------------- */
/*                              UPDATE REVIEW                                 */
/* -------------------------------------------------------------------------- */

export const useUpdateReview = () => {

    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            reviewId,
            entityType,
            entityId,
            payload,
        }: {
            reviewId: string;
            entityType: string;
            entityId: string;
            payload: UpdateReviewDto;
        }) =>
            updateReviewApi(
                reviewId,
                payload
            ),

        onSuccess: (_, variables) => {

            queryClient.invalidateQueries({
                queryKey: reviewKeys.lists(),
            });

            queryClient.invalidateQueries({
                queryKey: reviewKeys.detail(
                    variables.entityType,
                    variables.entityId
                ),
            });

        },
    });

};

/* -------------------------------------------------------------------------- */
/*                              DELETE REVIEW                                 */
/* -------------------------------------------------------------------------- */

export const useDeleteReview = () => {

    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            reviewId,
            entityType,
            entityId,
        }: {
            reviewId: string;
            entityType: string;
            entityId: string;
        }) =>
            deleteReviewApi(reviewId),

        onSuccess: (_, variables) => {

            queryClient.invalidateQueries({
                queryKey: reviewKeys.lists(),
            });

            queryClient.invalidateQueries({
                queryKey: reviewKeys.detail(
                    variables.entityType,
                    variables.entityId
                ),
            });

        },
    });

};

/* -------------------------------------------------------------------------- */
/*                              SUBMIT REVIEW                                 */
/* -------------------------------------------------------------------------- */

export const useSubmitReview = () => {

    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            entityType,
            entityId,
            payload,
        }: {
            entityType: string;
            entityId: string;
            payload: SubmitReviewDto;
        }) =>
            submitReviewApi(
                entityType,
                entityId,
                payload
            ),

        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: reviewKeys.detail(
                    variables.entityType,
                    variables.entityId
                ),
            });
        },
    });

};

/* -------------------------------------------------------------------------- */
/*                             APPROVE REVIEW                                 */
/* -------------------------------------------------------------------------- */

export const useApproveReview = () => {

    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            entityType,
            entityId,
            payload,
        }: {
            entityType: string;
            entityId: string;
            payload: ApproveReviewDto;
        }) => {
            const userId = useUserStore.getState().user?.id ?? "";
            return approveReviewApi(
                entityType,
                entityId,
                {
                    ...payload,
                    reviewerId: userId,
                }
            );
        },

        onSuccess: (_, variables) => {

            queryClient.invalidateQueries({
                queryKey: reviewKeys.lists(),
            });

            queryClient.invalidateQueries({
                queryKey: reviewKeys.detail(
                    variables.entityType,
                    variables.entityId
                ),
            });

        },
    });

};

/* -------------------------------------------------------------------------- */
/*                              REJECT REVIEW                                 */
/* -------------------------------------------------------------------------- */

export const useRejectReview = () => {

    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            entityType,
            entityId,
            payload,
        }: {
            entityType: string;
            entityId: string;
            payload: RejectReviewDto;
        }) => {
            const userId = useUserStore.getState().user?.id ?? "";
            return rejectReviewApi(
                entityType,
                entityId,
                {
                    ...payload,
                    reviewerId: userId,
                }
            );
        },

        onSuccess: (_, variables) => {

            queryClient.invalidateQueries({
                queryKey: reviewKeys.lists(),
            });

            queryClient.invalidateQueries({
                queryKey: reviewKeys.detail(
                    variables.entityType,
                    variables.entityId
                ),
            });

        },
    });

};

/* -------------------------------------------------------------------------- */
/*                          REQUEST CHANGES                                   */
/* -------------------------------------------------------------------------- */

export const useRequestChanges = () => {

    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            entityType,
            entityId,
            payload,
        }: {
            entityType: string;
            entityId: string;
            payload: RequestChangesDto;
        }) => {
            const userId = useUserStore.getState().user?.id ?? "";
            return requestChangesApi(
                entityType,
                entityId,
                {
                    ...payload,
                    reviewerId: userId,
                }
            );
        },

        onSuccess: (_, variables) => {

            queryClient.invalidateQueries({
                queryKey: reviewKeys.lists(),
            });

            queryClient.invalidateQueries({
                queryKey: reviewKeys.detail(
                    variables.entityType,
                    variables.entityId
                ),
            });

        },
    });

};

/* -------------------------------------------------------------------------- */
/*                             PUBLISH REVIEW                                 */
/* -------------------------------------------------------------------------- */

export const usePublishReview = () => {

    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            entityType,
            entityId,
            payload,
        }: {
            entityType: string;
            entityId: string;
            payload: PublishReviewDto;
        }) => {
            // Fetch the current review to check its status
            const review = await getReviewByEntityApi(entityType, entityId);
            if (review.status === 'UNDER_REVIEW') {
                throw new Error("Content cannot be published from status 'UNDER_REVIEW'. Submit it for review and use approve to publish reviewed content.");
            }
            const userId = useUserStore.getState().user?.id ?? "";
            return publishReviewApi(
                entityType,
                entityId,
                {
                    ...payload,
                    publishedById: userId,
                }
            );
        },

        onSuccess: (_, variables) => {

            queryClient.invalidateQueries({
                queryKey: reviewKeys.lists(),
            });

            queryClient.invalidateQueries({
                queryKey: reviewKeys.detail(
                    variables.entityType,
                    variables.entityId
                ),
            });

        },
    });

};

/* -------------------------------------------------------------------------- */
/*                            ASSIGN REVIEWER                                 */
/* -------------------------------------------------------------------------- */

export const useAssignReviewer = () => {

    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            entityType,
            entityId,
            payload,
        }: {
            entityType: string;
            entityId: string;
            payload: AssignReviewerDto;
        }) =>
            assignReviewerApi(
                entityType,
                entityId,
                payload.reviewerId
            ),

        onSuccess: (_, variables) => {

            queryClient.invalidateQueries({
                queryKey: reviewKeys.lists(),
            });

            queryClient.invalidateQueries({
                queryKey: reviewKeys.detail(
                    variables.entityType,
                    variables.entityId
                ),
            });

        },
    });

};