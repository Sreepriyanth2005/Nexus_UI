// src/core/api/lesson/lesson-tag.api.ts

import { api } from "../../../config/axios";

export interface LessonTag {
  id?: string;
  lessonId?: string;
  tagId?: string;
  [key: string]: any;
}

export const getLessonTagsApi =
  async (
    lessonId: string
  ): Promise<LessonTag[]> => {
    const res = await api.get(
      `/lessons/${lessonId}/tags`
    );

    return (
      res.data?.tags ||
      res.data?.data ||
      []
    );
  };

export const getLessonTagByIdApi =
  async (
    lessonId: string,
    tagId: string
  ): Promise<LessonTag> => {
    const res = await api.get(
      `/lessons/${lessonId}/tags/${tagId}`
    );

    return (
      res.data?.tag ||
      res.data?.data ||
      res.data
    );
  };

export const createLessonTagApi =
  async (
    lessonId: string,
    payload: Partial<LessonTag>
  ): Promise<LessonTag> => {
    const res = await api.post(
      `/lessons/${lessonId}/tags`,
      payload
    );

    return (
      res.data?.tag ||
      res.data?.data ||
      res.data
    );
  };

export const updateLessonTagApi =
  async (
    lessonId: string,
    tagId: string,
    payload: Partial<LessonTag>
  ): Promise<LessonTag> => {
    const res = await api.put(
      `/lessons/${lessonId}/tags/${tagId}`,
      payload
    );

    return (
      res.data?.tag ||
      res.data?.data ||
      res.data
    );
  };

export const deleteLessonTagApi =
  async (
    lessonId: string,
    tagId: string
  ) => {
    const res = await api.delete(
      `/lessons/${lessonId}/tags/${tagId}`
    );

    return res.data;
  };