import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCourseReviewSummary, submitCourseForReview, publishCourseDirectly } from "../../core/api/course-review/courseBuilderReview.api";

export const useCourseReviewSummary = (
  entityId: string,
  publishType: "career-path" | "standalone-course" | "standalone-lesson"
) => {
  return useQuery({
    queryKey: ["course-review-summary", entityId, publishType],
    queryFn: () => getCourseReviewSummary(entityId, publishType),
    enabled: !!entityId,
  });
};

export const useSubmitCourseForReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      entityId,
      publishType,
      submittedById,
      reviewerId,
      comment,
    }: {
      entityId: string;
      publishType: "career-path" | "standalone-course" | "standalone-lesson";
      submittedById: string;
      reviewerId: string;
      comment?: string;
    }) => submitCourseForReview(entityId, publishType, { submittedById, reviewerId, comment }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["course-review-summary", variables.entityId, variables.publishType] });
      queryClient.invalidateQueries({ queryKey: ["course", variables.entityId] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["careerPath", variables.entityId] });
      queryClient.invalidateQueries({ queryKey: ["lesson", variables.entityId] });
    },
  });
};

export const usePublishEntity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      entityId,
      publishType,
      publishedById,
      comment,
    }: {
      entityId: string;
      publishType: "career-path" | "standalone-course" | "standalone-lesson";
      publishedById: string;
      comment?: string;
    }) => publishCourseDirectly(entityId, publishType, { publishedById, comment }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["course-review-summary", variables.entityId, variables.publishType] });
      queryClient.invalidateQueries({ queryKey: ["course", variables.entityId] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["careerPath", variables.entityId] });
      queryClient.invalidateQueries({ queryKey: ["lesson", variables.entityId] });
    },
  });
};
