// src/core/api/lesson/lesson-attachment.api.ts

import { api } from "../../../config/axios";

export interface LessonAttachment {
  id?: string;
  lessonId?: string;
  [key: string]: any;
}

export const getLessonAttachmentsApi =
  async (
    lessonId: string
  ): Promise<
    LessonAttachment[]
  > => {
    const res =
      await api.get(
        `/lessons/${lessonId}/attachments`
      );

    return (
      res.data?.attachments ||
      res.data?.data ||
      []
    );
  };

export const createLessonAttachmentApi =
  async (
    lessonId: string,
    payload: any
  ): Promise<LessonAttachment> => {
    const res =
      await api.post(
        `/lessons/${lessonId}/attachments`,
        payload
      );

    return (
      res.data?.attachment ||
      res.data?.data ||
      res.data
    );
  };

export const deleteLessonAttachmentApi =
  async (
    lessonId: string,
    attachmentId: string
  ) => {
    const res =
      await api.delete(
        `/lessons/${lessonId}/attachments/${attachmentId}`
      );

    return res.data;
  };