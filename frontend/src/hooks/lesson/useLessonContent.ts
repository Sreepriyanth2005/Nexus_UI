// src/hooks/lesson/useLessonContent.ts

import {
  useMutation,
  useQuery,
} from "@tanstack/react-query";

import {
  getLessonContentApi,
  createLessonContentApi,
  updateLessonContentApi,
  deleteLessonContentApi,
} from "../../core/api/lesson/lesson-content.api";

import {
  useLessonContentStore,
} from "../../store/lesson/lessonContentStore";

export const useLessonContent =
  (
    lessonId: string
  ) => {
    const {
      content,
      setContent,
      clearContent,
    } =
      useLessonContentStore();

    const query =
      useQuery({
        queryKey: [
          "lesson-content",
          lessonId,
        ],

        enabled:
          !!lessonId,

        queryFn:
          async () => {
            const data =
              await getLessonContentApi(
                lessonId
              );

            setContent(
              data
            );

            return data;
          },
      });

    const createMutation =
      useMutation({
        mutationFn: (
          payload: any
        ) =>
          createLessonContentApi(
            lessonId,
            payload
          ),

        onSuccess: (
          data
        ) =>
          setContent(
            data
          ),
      });

    const updateMutation =
      useMutation({
        mutationFn: (
          payload: any
        ) =>
          updateLessonContentApi(
            lessonId,
            payload
          ),

        onSuccess: (
          data
        ) =>
          setContent(
            data
          ),
      });

    const deleteMutation =
      useMutation({
        mutationFn: () =>
          deleteLessonContentApi(
            lessonId
          ),

        onSuccess: () =>
          clearContent(),
      });

    return {
      content,
      query,
      createMutation,
      updateMutation,
      deleteMutation,
    };
  };