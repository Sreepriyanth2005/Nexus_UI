// src/core/api/review/review-assignment.api.ts

import { api } from "../../../config/axios";

import type {
    ReviewAssignment,
    AssignReviewerDto,
} from "../../../types/review.types";

/* -------------------------------------------------------------------------- */
/*                           GET REVIEW ASSIGNMENT                            */
/* -------------------------------------------------------------------------- */

export const getReviewAssignmentApi = async (
    reviewId: string
): Promise<ReviewAssignment> => {
    const { data } = await api.get(
        `/reviews/${reviewId}/assignment`
    );

    return data.data;
};

/* -------------------------------------------------------------------------- */
/*                          GET REVIEW ASSIGNMENTS                            */
/* -------------------------------------------------------------------------- */

export const getReviewAssignmentsApi = async (): Promise<
    ReviewAssignment[]
> => {
    const { data } = await api.get(
        "/review-assignments"
    );

    return data.data;
};

/* -------------------------------------------------------------------------- */
/*                           ASSIGN REVIEWER                                  */
/* -------------------------------------------------------------------------- */

export const assignReviewerApi = async (
    reviewId: string,
    payload: AssignReviewerDto
): Promise<ReviewAssignment> => {
    const { data } = await api.post(
        `/reviews/${reviewId}/assign`,
        payload
    );

    return data.data;
};

/* -------------------------------------------------------------------------- */
/*                          REASSIGN REVIEWER                                 */
/* -------------------------------------------------------------------------- */

export const reassignReviewerApi = async (
    reviewId: string,
    payload: AssignReviewerDto
): Promise<ReviewAssignment> => {
    const { data } = await api.patch(
        `/reviews/${reviewId}/assign`,
        payload
    );

    return data.data;
};

/* -------------------------------------------------------------------------- */
/*                          REMOVE ASSIGNMENT                                 */
/* -------------------------------------------------------------------------- */

export const removeReviewAssignmentApi = async (
    reviewId: string
): Promise<void> => {
    await api.delete(
        `/reviews/${reviewId}/assign`
    );
};

/* -------------------------------------------------------------------------- */
/*                        MY ASSIGNED REVIEWS                                 */
/* -------------------------------------------------------------------------- */

export const getMyAssignedReviewsApi = async () => {
    const { data } = await api.get(
        "/review-assignments/my"
    );

    return data.data;
};

/* -------------------------------------------------------------------------- */
/*                      REVIEWER ASSIGNMENT HISTORY                           */
/* -------------------------------------------------------------------------- */

export const getReviewAssignmentHistoryApi = async (
    reviewId: string
) => {
    const { data } = await api.get(
        `/reviews/${reviewId}/assignment/history`
    );

    return data.data;
};