import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCourseReview,
  getCourse,
  getCourseLessons,
  getReviewComments,
  getReviewHistory,
  approveCourseReview,
  requestCourseChanges,
  submitReviewComment,
  ReviewComment,
} from "../../core/api/course-review/courseReview.api";

export const useCourseReviewDetails = (courseId: string) => {
  return useQuery({
    queryKey: ["course-review-status", courseId],
    queryFn: () => getCourseReview(courseId),
    enabled: !!courseId,
  });
};

export const useCourseDetailsQuery = (courseId: string) => {
  return useQuery({
    queryKey: ["course-details", courseId],
    queryFn: () => getCourse(courseId),
    enabled: !!courseId,
  });
};

export const useCourseLessonsQuery = (courseId: string) => {
  return useQuery({
    queryKey: ["course-lessons", courseId],
    queryFn: () => getCourseLessons(courseId),
    enabled: !!courseId,
  });
};

export const useReviewCommentsQuery = (courseId: string) => {
  return useQuery({
    queryKey: ["course-review-comments", courseId],
    queryFn: () => getReviewComments(courseId),
    enabled: !!courseId,
  });
};

export const useReviewHistoryQuery = (courseId: string) => {
  return useQuery({
    queryKey: ["course-review-history", courseId],
    queryFn: () => getReviewHistory(courseId),
    enabled: !!courseId,
  });
};

export const useApproveReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      courseId,
      reviewerId,
      comment,
    }: {
      courseId: string;
      reviewerId: string;
      comment?: string;
    }) => approveCourseReview(courseId, reviewerId, comment),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["course-review-status", variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ["course-review-history", variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ["course-review-comments", variables.courseId] });
    },
  });
};

export const useRequestChanges = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      courseId,
      reviewerId,
      comment,
    }: {
      courseId: string;
      reviewerId: string;
      comment: string;
    }) => requestCourseChanges(courseId, reviewerId, comment),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["course-review-status", variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ["course-review-history", variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ["course-review-comments", variables.courseId] });
    },
  });
};

export const useSubmitReviewComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      courseId,
      commentData,
    }: {
      courseId: string;
      commentData: Partial<ReviewComment>;
    }) => submitReviewComment(courseId, commentData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["course-review-comments", variables.courseId] });
    },
  });
};
