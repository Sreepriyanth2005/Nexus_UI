// src/hooks/course/useCourseWorkflow.ts

import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  submitCourseApi,
  reviewCourseApi,
  approveCourseApi,
  rejectCourseApi,
  publishCourseApi,
  unpublishCourseApi,
  archiveCourseApi,
} from "../../core/api/course/course-workflow.api";
import { developerDashboardKeys } from "../content-developer-workspace/useContentDeveloperDashboard";
import { careerPathKeys } from "../../core/api/career-path/career-path.api";

export const useCourseWorkflow = (
  courseId: string
) => {
  const queryClient =
    useQueryClient();

  const refreshCourseData = () => {
    queryClient.invalidateQueries({
      queryKey: ["courses"],
    });

    queryClient.invalidateQueries({
      queryKey: [
        "course",
        courseId,
      ],
    });

    queryClient.invalidateQueries({
      queryKey: developerDashboardKeys.all,
    });

    queryClient.invalidateQueries({
      queryKey: careerPathKeys.all,
    });
  };

  const submitMutation =
    useMutation({
      mutationFn: (payload?: { reviewerId?: string; comment?: string }) =>
        submitCourseApi(
          courseId,
          payload
        ),

      onSuccess: refreshCourseData,
    });


  const reviewMutation =
    useMutation({
      mutationFn: (
        payload?: any
      ) =>
        reviewCourseApi(
          courseId,
          payload
        ),

      onSuccess: refreshCourseData,
    });

  const approveMutation =
    useMutation({
      mutationFn: () =>
        approveCourseApi(courseId),

      onSuccess: refreshCourseData,
    });

  const rejectMutation =
    useMutation({
      mutationFn: (
        payload?: any
      ) =>
        rejectCourseApi(
          courseId,
          payload
        ),

      onSuccess: refreshCourseData,
    });

  const publishMutation =
    useMutation({
      mutationFn: (publishedById: string) =>
        publishCourseApi(courseId, publishedById),

      onSuccess: refreshCourseData,
    });

  const unpublishMutation =
    useMutation({
      mutationFn: (unpublishedById: string) =>
        unpublishCourseApi(courseId, unpublishedById),

      onSuccess: refreshCourseData,
    });

  const archiveMutation =
    useMutation({
      mutationFn: () =>
        archiveCourseApi(courseId),

      onSuccess: refreshCourseData,
    });

  return {
    submitMutation,
    reviewMutation,
    approveMutation,
    rejectMutation,
    publishMutation,
    unpublishMutation,
    archiveMutation,
  };
};