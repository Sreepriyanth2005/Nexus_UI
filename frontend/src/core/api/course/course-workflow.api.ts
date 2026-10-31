// src/core/api/course/course-workflow.api.ts

import { api } from "../../../config/axios";

export const submitCourseApi = async (
  courseId: string,
  payload?: { reviewerId?: string; comment?: string }
) => {
  const res = await api.post(
    `/courses/${courseId}/submit`,
    payload
  );

  return res.data?.data || res.data;
};


export const reviewCourseApi = async (
  courseId: string,
  data?: any
) => {
  const res = await api.post(
    `/courses/${courseId}/review`,
    data
  );

  return res.data?.data || res.data;
};

export const approveCourseApi = async (
  courseId: string
) => {
  const res = await api.post(
    `/courses/${courseId}/approve`
  );

  return res.data?.data || res.data;
};

export const rejectCourseApi = async (
  courseId: string,
  data?: any
) => {
  const res = await api.post(
    `/courses/${courseId}/reject`,
    data
  );

  return res.data?.data || res.data;
};

export const publishCourseApi = async (
  courseId: string,
  publishedById: string
) => {
  const res = await api.post(
    `/courses/${courseId}/publish`,
    { publishedById }
  );

  return res.data?.data || res.data;
};

export const unpublishCourseApi = async (
  courseId: string,
  unpublishedById: string
) => {
  const res = await api.post(
    `/courses/${courseId}/unpublish`,
    { unpublishedById }
  );

  return res.data?.data || res.data;
};

export const archiveCourseApi = async (
  courseId: string
) => {
  const res = await api.post(
    `/courses/${courseId}/archive`
  );

  return res.data?.data || res.data;
};