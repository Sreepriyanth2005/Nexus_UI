// src/api/review/review-feedback.api.ts

import { api } from "../../../config/axios";

import type {
    ReviewFeedback,
    CreateFeedbackDto,
    UpdateFeedbackDto,
    ResolveFeedbackDto,
} from "../../../types/review.types";

/* -------------------------------------------------------------------------- */
/*                             GET REVIEW FEEDBACK                            */
/* -------------------------------------------------------------------------- */

export const getReviewFeedbackApi = async (
    reviewId: string
): Promise<ReviewFeedback[]> => {

    const { data } = await api.get(
        `/reviews/${reviewId}/feedback`
    );

    return data;

};

/* -------------------------------------------------------------------------- */
/*                            GET FEEDBACK BY ID                              */
/* -------------------------------------------------------------------------- */

export const getReviewFeedbackByIdApi = async (
    feedbackId: string
): Promise<ReviewFeedback> => {

    const { data } = await api.get(
        `/review-feedback/${feedbackId}`
    );

    return data;

};

/* -------------------------------------------------------------------------- */
/*                              CREATE FEEDBACK                               */
/* -------------------------------------------------------------------------- */

export const createReviewFeedbackApi = async (
    reviewId: string,
    payload: CreateFeedbackDto
): Promise<ReviewFeedback> => {

    const { data } = await api.post(
        `/reviews/${reviewId}/feedback`,
        payload
    );

    return data;

};

/* -------------------------------------------------------------------------- */
/*                              UPDATE FEEDBACK                               */
/* -------------------------------------------------------------------------- */

export const updateReviewFeedbackApi = async (
    feedbackId: string,
    payload: UpdateFeedbackDto
): Promise<ReviewFeedback> => {

    const { data } = await api.patch(
        `/review-feedback/${feedbackId}`,
        payload
    );

    return data;

};

/* -------------------------------------------------------------------------- */
/*                              DELETE FEEDBACK                               */
/* -------------------------------------------------------------------------- */

export const deleteReviewFeedbackApi = async (
    feedbackId: string
): Promise<void> => {

    await api.delete(
        `/review-feedback/${feedbackId}`
    );

};

/* -------------------------------------------------------------------------- */
/*                             RESOLVE FEEDBACK                               */
/* -------------------------------------------------------------------------- */

export const resolveReviewFeedbackApi = async (
    feedbackId: string,
    payload: ResolveFeedbackDto
): Promise<ReviewFeedback> => {

    const { data } = await api.post(
        `/review-feedback/${feedbackId}/resolve`,
        payload
    );

    return data;

};

/* -------------------------------------------------------------------------- */
/*                            REOPEN FEEDBACK                                 */
/* -------------------------------------------------------------------------- */

export const reopenReviewFeedbackApi = async (
    feedbackId: string
): Promise<ReviewFeedback> => {

    const { data } = await api.post(
        `/review-feedback/${feedbackId}/reopen`
    );

    return data;

};

/* -------------------------------------------------------------------------- */
/*                         REVIEW FEEDBACK SUMMARY                            */
/* -------------------------------------------------------------------------- */

export const getReviewFeedbackSummaryApi = async (
    reviewId: string
) => {

    const { data } = await api.get(
        `/reviews/${reviewId}/feedback/summary`
    );

    return data;

};

/* -------------------------------------------------------------------------- */
/*                      REQUIRED FEEDBACK ONLY                                */
/* -------------------------------------------------------------------------- */

export const getRequiredFeedbackApi = async (
    reviewId: string
): Promise<ReviewFeedback[]> => {

    const { data } = await api.get(
        `/reviews/${reviewId}/feedback/required`
    );

    return data;

};

/* -------------------------------------------------------------------------- */
/*                     UNRESOLVED FEEDBACK ONLY                               */
/* -------------------------------------------------------------------------- */

export const getUnresolvedFeedbackApi = async (
    reviewId: string
): Promise<ReviewFeedback[]> => {

    const { data } = await api.get(
        `/reviews/${reviewId}/feedback/unresolved`
    );

    return data;

};

/* -------------------------------------------------------------------------- */
/*                        RESOLVED FEEDBACK ONLY                              */
/* -------------------------------------------------------------------------- */

export const getResolvedFeedbackApi = async (
    reviewId: string
): Promise<ReviewFeedback[]> => {

    const { data } = await api.get(
        `/reviews/${reviewId}/feedback/resolved`
    );

    return data;

};