// src/api/review/review-comment.api.ts

import { api } from "../../../config/axios";

import type {
    ReviewComment,
    CreateCommentDto,
    UpdateCommentDto,
} from "../../../types/review.types";
/* -------------------------------------------------------------------------- */
/*                               GET COMMENTS                                 */
/* -------------------------------------------------------------------------- */

export const getReviewCommentsApi = async (
  reviewId: string,
  entityType: string = "course"
): Promise<ReviewComment[]> => {
  try {
    const { data } = await api.get(`/reviews/${entityType}/${reviewId}/history`);
    
    // Map workflowLog to comments format
    if (data?.data?.workflowLog) {
      return data.data.workflowLog
        .filter((log: any) => log.comment && log.comment.trim() !== "")
        .map((log: any) => ({
          id: log.id,
          commentId: log.id,
          reviewId: reviewId,
          userId: log.actorId,
          user: log.actor,
          message: log.comment,
          type: log.toStatus === "REJECTED" ? "Required" : "Suggestion",
          resolved: log.toStatus === "APPROVED",
          createdAt: log.createdAt,
          updatedAt: log.createdAt,
        }));
    }
    return [];
  } catch (error) {
    console.error("Error fetching review comments from history:", error);
    return [];
  }
};

/* -------------------------------------------------------------------------- */
/*                              GET COMMENT                                   */
/* -------------------------------------------------------------------------- */

export const getReviewCommentApi = async (
  commentId: string
): Promise<ReviewComment> => {
  const { data } = await api.get(
    `/review-comments/${commentId}`
  );

  return data.data;
};

/* -------------------------------------------------------------------------- */
/*                             CREATE COMMENT                                 */
/* -------------------------------------------------------------------------- */
export const createReviewCommentApi = async (
    payload: CreateCommentDto
): Promise<ReviewComment> => {
    const { data } = await api.post(
        "/review-comments",
        payload
    );

    return data.data;
};

/* -------------------------------------------------------------------------- */
/*                              UPDATE COMMENT                                */
/* -------------------------------------------------------------------------- */

export const updateReviewCommentApi = async (
    commentId: string,
    payload: UpdateCommentDto
): Promise<ReviewComment> => {
    const { data } = await api.patch(
        `/review-comments/${commentId}`,
        payload
    );

    return data.data;
};

/* -------------------------------------------------------------------------- */
/*                              DELETE COMMENT                                */
/* -------------------------------------------------------------------------- */

export const deleteReviewCommentApi = async (
  commentId: string
): Promise<void> => {
  await api.delete(
    `/review-comments/${commentId}`
  );
};

/* -------------------------------------------------------------------------- */
/*                               RESOLVE COMMENT                              */
/* -------------------------------------------------------------------------- */

export const resolveReviewCommentApi = async (
  commentId: string
): Promise<ReviewComment> => {
  const { data } = await api.post(
    `/review-comments/${commentId}/resolve`
  );

  return data.data;
};

/* -------------------------------------------------------------------------- */
/*                              REOPEN COMMENT                                */
/* -------------------------------------------------------------------------- */

export const reopenReviewCommentApi = async (
  commentId: string
): Promise<ReviewComment> => {
  const { data } = await api.post(
    `/review-comments/${commentId}/reopen`
  );

  return data.data;
};

/* -------------------------------------------------------------------------- */
/*                                COMMENT REPLY                               */
/* -------------------------------------------------------------------------- */

export const replyReviewCommentApi = async (
  commentId: string,
  message: string
): Promise<ReviewComment> => {
  const { data } = await api.post(
    `/review-comments/${commentId}/reply`,
    {
      message,
    }
  );

  return data.data;
};

/* -------------------------------------------------------------------------- */
/*                             COMMENT HISTORY                                */
/* -------------------------------------------------------------------------- */

export const getReviewCommentHistoryApi = async (
  commentId: string
) => {
  const { data } = await api.get(
    `/review-comments/${commentId}/history`
  );

  return data.data;
};

/* -------------------------------------------------------------------------- */
/*                          COMMENTS BY ENTITY                                */
/* -------------------------------------------------------------------------- */

export const getEntityReviewCommentsApi = async (
  entityType: string,
  entityId: string
): Promise<ReviewComment[]> => {
  const { data } = await api.get(
    `/review-comments/entity/${entityType}/${entityId}`
  );

  return data.data;
};