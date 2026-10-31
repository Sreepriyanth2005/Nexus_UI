import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  feedbackResolutionApi,
  CompletenessResultDto,
  LearnerQADto,
} from "../../core/api/content-developer-workspace/feedbackResolution.api";
import { api } from "../../config/axios";
import { developerDashboardKeys } from "./useContentDeveloperDashboard";
import { careerPathKeys } from "../../core/api/career-path/career-path.api";

export type FeedbackEntityType =
  | "course"
  | "career-path"
  | "lesson";

export const feedbackKeys = {
  all: ["feedback"] as const,

  list: (entityType: FeedbackEntityType, entityId: string) =>
    [...feedbackKeys.all, "list", entityType, entityId] as const,

  header: (entityType: FeedbackEntityType, entityId: string) =>
    [...feedbackKeys.all, "header", entityType, entityId] as const,

  summary: (entityType: FeedbackEntityType, entityId: string) =>
    [...feedbackKeys.all, "summary", entityType, entityId] as const,

  completeness: (entityType: FeedbackEntityType, entityId: string) =>
    [...feedbackKeys.all, "completeness", entityType, entityId] as const,

  learnerQA: (entityType: FeedbackEntityType, entityId: string) =>
    [...feedbackKeys.all, "learnerQA", entityType, entityId] as const,

  latestEntity: () => [...feedbackKeys.all, "latestEntity"] as const,
};

/* -------------------------------------------------------------------------- */
/* Queries */
/* -------------------------------------------------------------------------- */

export const useLatestReviewableEntity = (userId?: string) => {
  return useQuery({
    queryKey: [...feedbackKeys.latestEntity(), userId],
    queryFn: () => feedbackResolutionApi.getLatestEntity(userId),
    staleTime: 60_000,
    enabled: !!userId,
  });
};

export const useCourseFeedback = (
  entityType: FeedbackEntityType,
  entityId: string
) => {
  return useQuery({
    queryKey: feedbackKeys.list(entityType, entityId),
    queryFn: () =>
      feedbackResolutionApi.getFeedback(entityType, entityId),
    enabled: !!entityId,
  });
};

export const useFeedbackHeaderDetails = (
  entityType: FeedbackEntityType,
  entityId: string
) => {
  return useQuery({
    queryKey: feedbackKeys.header(entityType, entityId),
    queryFn: () =>
      feedbackResolutionApi.getHeaderDetails(entityType, entityId),
    enabled: !!entityId,
  });
};

export const useFeedbackSummary = (
  entityType: FeedbackEntityType,
  entityId: string
) => {
  return useQuery({
    queryKey: feedbackKeys.summary(entityType, entityId),
    queryFn: () =>
      feedbackResolutionApi.getFeedbackSummary(entityType, entityId),
    enabled: !!entityId,
  });
};

export const useCompletenessEngine = (
  entityType: FeedbackEntityType,
  entityId: string
) => {
  return useQuery<CompletenessResultDto>({
    queryKey: feedbackKeys.completeness(entityType, entityId),
    queryFn: () =>
      feedbackResolutionApi.getCompleteness(entityType, entityId),
    enabled: !!entityId,
  });
};

export const useLearnerQA = (
  entityType: FeedbackEntityType,
  entityId: string
) => {
  return useQuery<LearnerQADto[]>({
    queryKey: feedbackKeys.learnerQA(entityType, entityId),
    queryFn: () =>
      feedbackResolutionApi.getLearnerQA(entityType, entityId),
    enabled: !!entityId,
  });
};

// ── Real review by entity ──────────────────────────────────────────────────
export interface EntityReview {
  id: string;
  entityType: string;
  entityId: string;
  reviewerId: string;
  submittedById: string;
  status: string; // DRAFT | PENDING | APPROVED | REJECTED | CHANGES_REQUESTED | PUBLISHED | ARCHIVED
  comment: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  publishedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const useEntityReview = (
  entityType: FeedbackEntityType,
  entityId: string
) => {
  return useQuery<EntityReview | null>({
    queryKey: ["entityReview", entityType, entityId],
    queryFn: async () => {
      try {
        const res = await api.get(`/reviews/${entityType}/${entityId}`);
        return (res.data?.data ?? null) as EntityReview | null;
      } catch {
        return null;
      }
    },
    enabled: !!entityId,
    staleTime: 30_000,
  });
};

/* -------------------------------------------------------------------------- */
/* Reply */
/* -------------------------------------------------------------------------- */

export const useReplyToFeedback = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      entityType: FeedbackEntityType;
      entityId: string;
      cardId: string;
      message: string;
    }) =>
      feedbackResolutionApi.replyToFeedback(
        payload.entityType,
        payload.entityId,
        payload.cardId,
        payload.message
      ),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: feedbackKeys.list(
          variables.entityType,
          variables.entityId
        ),
      });

      queryClient.invalidateQueries({
        queryKey: feedbackKeys.summary(
          variables.entityType,
          variables.entityId
        ),
      });
    },
  });
};

/* -------------------------------------------------------------------------- */
/* Resolve */
/* -------------------------------------------------------------------------- */

export const useResolveFeedback = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      entityType: FeedbackEntityType;
      entityId: string;
      cardId: string;
      developerReply?: string;
    }) =>
      feedbackResolutionApi.markFeedbackResolved(
        payload.entityType,
        payload.entityId,
        payload.cardId,
        payload.developerReply
      ),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: feedbackKeys.list(
          variables.entityType,
          variables.entityId
        ),
      });

      queryClient.invalidateQueries({
        queryKey: feedbackKeys.summary(
          variables.entityType,
          variables.entityId
        ),
      });

      queryClient.invalidateQueries({
        queryKey: feedbackKeys.completeness(
          variables.entityType,
          variables.entityId
        ),
      });

      queryClient.invalidateQueries({
        queryKey: developerDashboardKeys.all,
      });
    },
  });
};

/* -------------------------------------------------------------------------- */
/* Resubmit */
/* -------------------------------------------------------------------------- */

export const useResubmitCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      entityType: FeedbackEntityType;
      entityId: string;
      submittedById?: string;
      reviewerId?: string;
      comment?: string;
    }) =>
      feedbackResolutionApi.resubmitForReview(
        payload.entityType,
        payload.entityId,
        {
          submittedById: payload.submittedById,
          reviewerId: payload.reviewerId,
          comment: payload.comment,
        }
      ),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: developerDashboardKeys.all,
      });

      queryClient.invalidateQueries({
        queryKey: careerPathKeys.all,
      });

      queryClient.invalidateQueries({
        queryKey: ["courses"],
      });

      queryClient.invalidateQueries({
        queryKey: ["lessons"],
      });

      queryClient.invalidateQueries({
        queryKey: ["courseOverview"],
      });

      queryClient.invalidateQueries({
        queryKey: ["careerPathOverview"],
      });

      queryClient.invalidateQueries({
        queryKey: ["lessonOverview"],
      });

      queryClient.invalidateQueries({
        queryKey: feedbackKeys.list(
          variables.entityType,
          variables.entityId
        ),
      });

      queryClient.invalidateQueries({
        queryKey: feedbackKeys.summary(
          variables.entityType,
          variables.entityId
        ),
      });

      queryClient.invalidateQueries({
        queryKey: feedbackKeys.header(
          variables.entityType,
          variables.entityId
        ),
      });

      queryClient.invalidateQueries({
        queryKey: feedbackKeys.completeness(
          variables.entityType,
          variables.entityId
        ),
      });
    },
  });
};