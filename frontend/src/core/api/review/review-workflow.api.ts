// src/api/review/review-workflow.api.ts

import { api } from "../../../config/axios";

import type {
    ReviewWorkflow,
    Review,
} from "../../../types/review.types";

/* -------------------------------------------------------------------------- */
/*                           WORKFLOW DASHBOARD                               */
/* -------------------------------------------------------------------------- */

export const getWorkflowApi = async (): Promise<ReviewWorkflow[]> => {

    const { data } = await api.get(
        "/review-workflow"
    );

    return data;

};

/* -------------------------------------------------------------------------- */
/*                             PENDING TASKS                                  */
/* -------------------------------------------------------------------------- */

export const getPendingWorkflowApi = async (): Promise<ReviewWorkflow[]> => {

    const { data } = await api.get(
        "/review-workflow/pending"
    );

    return data;

};

/* -------------------------------------------------------------------------- */
/*                             MY TASKS                                       */
/* -------------------------------------------------------------------------- */

export const getMyWorkflowApi = async (): Promise<ReviewWorkflow[]> => {

    const { data } = await api.get(
        "/review-workflow/my-tasks"
    );

    return data;

};

/* -------------------------------------------------------------------------- */
/*                            WORKFLOW HISTORY                                */
/* -------------------------------------------------------------------------- */

export const getWorkflowHistoryApi = async (
    reviewId: string
): Promise<ReviewWorkflow[]> => {

    const { data } = await api.get(
        `/review-workflow/${reviewId}/history`
    );

    return data;

};

/* -------------------------------------------------------------------------- */
/*                             START REVIEW                                   */
/* -------------------------------------------------------------------------- */

export const startWorkflowApi = async (
    reviewId: string
): Promise<Review> => {

    const { data } = await api.post(
        `/review-workflow/${reviewId}/start`
    );

    return data;

};

/* -------------------------------------------------------------------------- */
/*                             ASSIGN REVIEWER                                */
/* -------------------------------------------------------------------------- */

export const assignWorkflowApi = async (
    reviewId: string,
    reviewerId: string
): Promise<Review> => {

    const { data } = await api.post(
        `/review-workflow/${reviewId}/assign`,
        {
            reviewerId,
        }
    );

    return data;

};

/* -------------------------------------------------------------------------- */
/*                          REASSIGN REVIEWER                                 */
/* -------------------------------------------------------------------------- */

export const reassignWorkflowApi = async (
    reviewId: string,
    reviewerId: string
): Promise<Review> => {

    const { data } = await api.post(
        `/review-workflow/${reviewId}/reassign`,
        {
            reviewerId,
        }
    );

    return data;

};

/* -------------------------------------------------------------------------- */
/*                           SUBMIT FOR REVIEW                                */
/* -------------------------------------------------------------------------- */

export const submitWorkflowApi = async (
    reviewId: string,
    remarks?: string
): Promise<Review> => {

    const { data } = await api.post(
        `/review-workflow/${reviewId}/submit`,
        {
            remarks,
        }
    );

    return data;

};

/* -------------------------------------------------------------------------- */
/*                               APPROVE                                      */
/* -------------------------------------------------------------------------- */

export const approveWorkflowApi = async (
    reviewId: string,
    remarks?: string
): Promise<Review> => {

    const { data } = await api.post(
        `/review-workflow/${reviewId}/approve`,
        {
            remarks,
        }
    );

    return data;

};

export const rejectWorkflowApi = async (
    reviewId: string,
    remarks?: string,
    items?: { issueDescription: string; elementId?: string }[]
): Promise<Review> => {
    const { data } = await api.post(
        `/review-workflow/${reviewId}/reject`,
        {
            remarks,
            items
        }
    );
    return data;
};

/* -------------------------------------------------------------------------- */
/*                               RESOLVE                                      */
/* -------------------------------------------------------------------------- */

export const resolveWorkflowApi = async (
    reviewId: string,
    items: { itemId: string; developerReply?: string }[]
): Promise<Review> => {
    const { data } = await api.post(
        `/review-workflow/${reviewId}/resolve`,
        {
            items
        }
    );
    return data;
};

/* -------------------------------------------------------------------------- */
/*                          REQUEST CHANGES                                   */
/* -------------------------------------------------------------------------- */

export const requestChangesWorkflowApi = async (
    reviewId: string,
    remarks: string
): Promise<Review> => {

    const { data } = await api.post(
        `/review-workflow/${reviewId}/request-changes`,
        {
            remarks,
        }
    );

    return data;

};

/* -------------------------------------------------------------------------- */
/*                                PUBLISH                                     */
/* -------------------------------------------------------------------------- */

export const publishWorkflowApi = async (
    reviewId: string
): Promise<Review> => {

    const { data } = await api.post(
        `/review-workflow/${reviewId}/publish`
    );

    return data;

};

/* -------------------------------------------------------------------------- */
/*                               UNPUBLISH                                    */
/* -------------------------------------------------------------------------- */

export const unpublishWorkflowApi = async (
    reviewId: string
): Promise<Review> => {

    const { data } = await api.post(
        `/review-workflow/${reviewId}/unpublish`
    );

    return data;

};

/* -------------------------------------------------------------------------- */
/*                              CANCEL REVIEW                                 */
/* -------------------------------------------------------------------------- */

export const cancelWorkflowApi = async (
    reviewId: string
): Promise<Review> => {

    const { data } = await api.post(
        `/review-workflow/${reviewId}/cancel`
    );

    return data;

};

/* -------------------------------------------------------------------------- */
/*                              REOPEN REVIEW                                 */
/* -------------------------------------------------------------------------- */

export const reopenWorkflowApi = async (
    reviewId: string
): Promise<Review> => {

    const { data } = await api.post(
        `/review-workflow/${reviewId}/reopen`
    );

    return data;

};