// src/core/api/lesson/lesson-content.api.ts

import { api } from "../../../config/axios";

export const getLessonContentApi =
  async (
    lessonId: string
  ) => {
    const res =
      await api.get(
        `/lessons/${lessonId}/content`
      );

    return (
      res.data?.content ||
      res.data?.data ||
      res.data
    );
  };

export const createLessonContentApi =
  async (
    lessonId: string,
    payload: any
  ) => {
    const res =
      await api.post(
        `/lessons/${lessonId}/content`,
        payload
      );

    return (
      res.data?.content ||
      res.data?.data ||
      res.data
    );
  };

export const updateLessonContentApi =
  async (
    lessonId: string,
    payload: any
  ) => {
    const res =
      await api.put(
        `/lessons/${lessonId}/content`,
        payload
      );

    return (
      res.data?.content ||
      res.data?.data ||
      res.data
    );
  };

export const deleteLessonContentApi =
  async (
    lessonId: string
  ) => {
    const res =
      await api.delete(
        `/lessons/${lessonId}/content`
      );

    return res.data;
  };