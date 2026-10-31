// src/api/review/review.api.ts

import { api } from "../../../config/axios";

import type {
    Review,
    ReviewListResponse,
    ReviewQueryParams,
    CreateReviewDto,
    UpdateReviewDto,
    SubmitReviewDto,
    ApproveReviewDto,
    RejectReviewDto,
    RequestChangesDto,
    PublishReviewDto,
} from "../../../types/review.types";

/* -------------------------------------------------------------------------- */
/*                                  LIST                                      */
/* -------------------------------------------------------------------------- */

export const getReviewsApi = async (
    params?: ReviewQueryParams
): Promise<ReviewListResponse> => {

    const { data } = await api.get(
        "/reviews",
        {
            params,
        }
    );

    return data;

};



/* -------------------------------------------------------------------------- */
/*                                GET BY ENTITY                               */
/* -------------------------------------------------------------------------- */

export const getReviewByEntityApi = async (
    entityType: string,
    entityId: string
): Promise<Review> => {

    const { data } = await api.get(
        `/reviews/${entityType}/${entityId}`
    );

    return data?.data || data;

};

/* -------------------------------------------------------------------------- */
/*                                  CREATE                                    */
/* -------------------------------------------------------------------------- */

export const createReviewApi = async (
    payload: CreateReviewDto
): Promise<Review> => {

    const { data } = await api.post(
        "/reviews",
        payload
    );

    return data;

};

/* -------------------------------------------------------------------------- */
/*                                  UPDATE                                    */
/* -------------------------------------------------------------------------- */

export const updateReviewApi = async (
    id: string,
    payload: UpdateReviewDto
): Promise<Review> => {

    const { data } = await api.patch(
        `/reviews/${id}`,
        payload
    );

    return data;

};

/* -------------------------------------------------------------------------- */
/*                                  DELETE                                    */
/* -------------------------------------------------------------------------- */

export const deleteReviewApi = async (
    id: string
): Promise<void> => {

    await api.delete(
        `/reviews/${id}`
    );

};

/* -------------------------------------------------------------------------- */
/*                                 SUBMIT                                     */
/* -------------------------------------------------------------------------- */

export const submitReviewApi = async (
    entityType: string,
    entityId: string,
    payload?: SubmitReviewDto
): Promise<Review> => {

    const { data } = await api.post(
        `/reviews/${entityType}/${entityId}/submit`,
        payload
    );

    return data;

};

/* -------------------------------------------------------------------------- */
/*                                 APPROVE/PUBLISH                            */
/* -------------------------------------------------------------------------- */

export const approveReviewApi = async (
    entityType: string,
    entityId: string,
    payload?: ApproveReviewDto
): Promise<Review> => {
    
    const { data } = await api.post(
        `/reviews/${entityType}/${entityId}/approve`,
        payload
    );

    return data;

};

/* -------------------------------------------------------------------------- */
/*                                  REJECT                                    */
/* -------------------------------------------------------------------------- */

export const rejectReviewApi = async (
    entityType: string,
    entityId: string,
    payload: RejectReviewDto
): Promise<Review> => {

    const { data } = await api.post(
        `/reviews/${entityType}/${entityId}/reject`,
        payload
    );

    return data;

};

/* -------------------------------------------------------------------------- */
/*                           REQUEST CHANGES                                  */
/* -------------------------------------------------------------------------- */

export const requestChangesApi = async (
    entityType: string,
    entityId: string,
    payload: RequestChangesDto
): Promise<Review> => {

    const { data } = await api.post(
        `/reviews/${entityType}/${entityId}/reject`,
        payload
    );

    return data;

};

/* -------------------------------------------------------------------------- */
/*                                 PUBLISH                                    */
/* -------------------------------------------------------------------------- */

export const publishReviewApi = async (
    entityType: string,
    entityId: string,
    payload?: PublishReviewDto
): Promise<Review> => {

    const { data } = await api.post(
        `/reviews/${entityType}/${entityId}/publish`,
        payload
    );

    return data;

};

/* -------------------------------------------------------------------------- */
/*                               MY REVIEWS                                   */
/* -------------------------------------------------------------------------- */

export const getMyReviewsApi = async (): Promise<Review[]> => {

    const { data } = await api.get(
        "/reviews/my"
    );

    return data;

};

/* -------------------------------------------------------------------------- */
/*                           PENDING REVIEWS                                  */
/* -------------------------------------------------------------------------- */

export const getPendingReviewsApi = async (): Promise<Review[]> => {

    const { data } = await api.get(
        "/reviews/pending"
    );

    return data;

};

/* -------------------------------------------------------------------------- */
/*                          COMPLETED REVIEWS                                 */
/* -------------------------------------------------------------------------- */

export const getCompletedReviewsApi = async (): Promise<Review[]> => {

    const { data } = await api.get(
        "/reviews/completed"
    );

    return data;

};

/* -------------------------------------------------------------------------- */
/*                           ASSIGN REVIEWER                                  */
/* -------------------------------------------------------------------------- */

export const assignReviewerApi = async (
    entityType: string,
    entityId: string,
    reviewerId: string
): Promise<Review> => {

    const { data } = await api.post(
        `/reviews/${entityType}/${entityId}/reassign`,
        {
            newReviewerId: reviewerId,
        }
    );

    return data;

};

/* -------------------------------------------------------------------------- */
/*                           REASSIGN REVIEWER                                */
/* -------------------------------------------------------------------------- */

export const reassignReviewerApi = async (
    reviewId: string,
    reviewerId: string
): Promise<Review> => {

    const { data } = await api.post(
        `/reviews/${reviewId}/reassign`,
        {
            reviewerId,
        }
    );

    return data;

};

/* -------------------------------------------------------------------------- */
/*                            REVIEW HISTORY                                  */
/* -------------------------------------------------------------------------- */

export const getReviewHistoryApi = async (
    entityType: string,
    entityId: string
) => {

    const { data } = await api.get(
        `/reviews/${entityType}/${entityId}/history`
    );

    return data;

};
export const resolveReviewApi = async (
    entityType: string,
    entityId: string,
    payload: import("../../../types/review.types").ResolveReviewDto
): Promise<Review> => {
    const { data } = await api.post(
        `/reviews/${entityType}/${entityId}/resolve`,
        payload
    );
    return data;
};
