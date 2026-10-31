// src/hooks/lesson/useLessonWorkflow.ts

import {
  useMutation,
} from "@tanstack/react-query";

import {
  submitLessonApi,
  reviewLessonApi,
  approveLessonApi,
  rejectLessonApi,
  publishLessonApi,
  unpublishLessonApi,
  archiveLessonApi,
} from "../../core/api/lesson/lesson-workflow.api";

export const useLessonWorkflow = (
  lessonId: string
) => {
  const submitMutation =
    useMutation({
      mutationFn: (payload?: { reviewerId?: string; comment?: string }) =>
        submitLessonApi(
          lessonId,
          payload
        ),
    });

  const reviewMutation =
    useMutation({
      mutationFn: (
        payload?: any
      ) =>
        reviewLessonApi(
          lessonId,
          payload
        ),
    });

  const approveMutation =
    useMutation({
      mutationFn: () =>
        approveLessonApi(
          lessonId
        ),
    });

  const rejectMutation =
    useMutation({
      mutationFn: (
        payload?: any
      ) =>
        rejectLessonApi(
          lessonId,
          payload
        ),
    });

  const publishMutation =
    useMutation({
      mutationFn: (publishedById: string) =>
        publishLessonApi(
          lessonId,
          publishedById
        ),
    });

  const unpublishMutation =
    useMutation({
      mutationFn: (unpublishedById: string) =>
        unpublishLessonApi(
          lessonId,
          unpublishedById
        ),
    });

  const archiveMutation =
    useMutation({
      mutationFn: () =>
        archiveLessonApi(
          lessonId
        ),
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