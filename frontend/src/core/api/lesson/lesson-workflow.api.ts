// src/core/api/lesson/lesson-workflow.api.ts

import { api } from "../../../config/axios";

export const submitLessonApi = async (
  lessonId: string,
  payload?: { reviewerId?: string; comment?: string; submissionNotes?: string; submissionRemarks?: string }
) => {
  const res = await api.post(
    `/lessons/${lessonId}/submit`,
    payload
  );

  return res.data;
};

export const reviewLessonApi =
  async (
    lessonId: string,
    payload?: any
  ) => {
    const res = await api.post(
      `/lessons/${lessonId}/review`,
      payload
    );

    return res.data;
  };

export const approveLessonApi =
  async (
    lessonId: string
  ) => {
    const res = await api.post(
      `/lessons/${lessonId}/approve`
    );

    return res.data;
  };

export const rejectLessonApi =
  async (
    lessonId: string,
    payload?: any
  ) => {
    const res = await api.post(
      `/lessons/${lessonId}/reject`,
      payload
    );

    return res.data;
  };

export const publishLessonApi =
  async (
    lessonId: string,
    publishedById: string
  ) => {
    const res = await api.post(
      `/lessons/${lessonId}/publish`,
      { publishedById }
    );

    return res.data;
  };

export const unpublishLessonApi =
  async (
    lessonId: string,
    unpublishedById: string
  ) => {
    const res = await api.post(
      `/lessons/${lessonId}/unpublish`,
      { unpublishedById }
    );

    return res.data;
  };

export const archiveLessonApi =
  async (
    lessonId: string
  ) => {
    const res = await api.post(
      `/lessons/${lessonId}/archive`
    );

    return res.data;
  };