// src/hooks/lesson/useLessonAttachments.ts

import {
  useMutation,
  useQuery,
} from "@tanstack/react-query";

import {
  getLessonAttachmentsApi,
  createLessonAttachmentApi,
  deleteLessonAttachmentApi,
} from "../../core/api/lesson/lesson-attachment.api";

import {
  useLessonAttachmentStore,
} from "../../store/lesson/lessonAttachmentStore";

export const useLessonAttachments =
  (
    lessonId: string
  ) => {
    const {
      attachments,
      setAttachments,
      addAttachment,
      deleteAttachment,
    } =
      useLessonAttachmentStore();

    const query =
      useQuery({
        queryKey: [
          "lesson-attachments",
          lessonId,
        ],

        enabled:
          !!lessonId,

        queryFn:
          async () => {
            const data =
              await getLessonAttachmentsApi(
                lessonId
              );

            setAttachments(
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
          createLessonAttachmentApi(
            lessonId,
            payload
          ),

        onSuccess: (
          data
        ) =>
          addAttachment(
            data
          ),
      });

    const deleteMutation =
      useMutation({
        mutationFn: (
          attachmentId: string
        ) =>
          deleteLessonAttachmentApi(
            lessonId,
            attachmentId
          ),

        onSuccess: (
          _,
          attachmentId
        ) =>
          deleteAttachment(
            attachmentId
          ),
      });

    return {
      attachments,
      query,
      createMutation,
      deleteMutation,
    };
  };