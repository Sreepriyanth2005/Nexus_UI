// src/hooks/lesson/useLessonTranscript.ts

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createLessonTranscript,
  getLessonTranscript,
  updateLessonTranscript,
  deleteLessonTranscript,
} from "../../core/api/lesson/lesson-transcript.api";

import {
  useLessonTranscriptStore,
} from "../../store/lesson/lessonTranscriptStore";

export const LESSON_TRANSCRIPT_QUERY_KEY =
  "lesson-transcript";

/* -----------------------------------------
 * GET TRANSCRIPT
 * ---------------------------------------*/
export const useLessonTranscript = (
  lessonId?: string
) => {
  const {
    addTranscript,
  } =
    useLessonTranscriptStore();

  return useQuery({
    queryKey: [
      LESSON_TRANSCRIPT_QUERY_KEY,
      lessonId,
    ],

    queryFn: async () => {
      const data =
        await getLessonTranscript(
          lessonId!
        );

      addTranscript(data);

      return data;
    },

    enabled: !!lessonId,
  });
};

/* -----------------------------------------
 * CREATE TRANSCRIPT
 * ---------------------------------------*/
export const useCreateLessonTranscript =
  () => {
    const queryClient =
      useQueryClient();

    const {
      addTranscript,
    } =
      useLessonTranscriptStore();

    return useMutation({
      mutationFn: ({
        lessonId,
        transcriptAssetId,
      }: {
        lessonId: string;
        transcriptAssetId: string;
      }) =>
        createLessonTranscript(
          lessonId,
          transcriptAssetId
        ),

      onSuccess: (
        data,
        variables
      ) => {
        addTranscript(data);

        queryClient.invalidateQueries({
          queryKey: [
            LESSON_TRANSCRIPT_QUERY_KEY,
            variables.lessonId,
          ],
        });
      },
    });
  };

/* -----------------------------------------
 * UPDATE TRANSCRIPT
 * ---------------------------------------*/
export const useUpdateLessonTranscript =
  () => {
    const queryClient =
      useQueryClient();

    const {
      updateTranscript,
    } =
      useLessonTranscriptStore();

    return useMutation({
      mutationFn: ({
        lessonId,
        transcriptAssetId,
      }: {
        lessonId: string;
        transcriptAssetId: string;
      }) =>
        updateLessonTranscript(
          lessonId,
          transcriptAssetId
        ),

      onSuccess: (
        data,
        variables
      ) => {
        updateTranscript(data);

        queryClient.invalidateQueries({
          queryKey: [
            LESSON_TRANSCRIPT_QUERY_KEY,
            variables.lessonId,
          ],
        });
      },
    });
  };

/* -----------------------------------------
 * DELETE TRANSCRIPT
 * ---------------------------------------*/
export const useDeleteLessonTranscript =
  () => {
    const queryClient =
      useQueryClient();

    const {
      deleteTranscript,
    } =
      useLessonTranscriptStore();

    return useMutation({
      mutationFn: (
        lessonId: string
      ) =>
        deleteLessonTranscript(
          lessonId
        ),

      onSuccess: (
        _,
        lessonId
      ) => {
        deleteTranscript(
          lessonId
        );

        queryClient.invalidateQueries({
          queryKey: [
            LESSON_TRANSCRIPT_QUERY_KEY,
            lessonId,
          ],
        });
      },
    });
  };