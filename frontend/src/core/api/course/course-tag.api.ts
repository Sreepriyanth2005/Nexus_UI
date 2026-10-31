// src/core/api/course/course-tag.api.ts

import { api } from "../../../config/axios";

export const getCourseTagsApi =
  async (
    courseId: string
  ) => {
    const res = await api.get(
      `/courses/${courseId}/tags`
    );

    return (
      res.data?.tags ||
      res.data?.data ||
      []
    );
  };

export const getCourseTagByIdApi =
  async (
    courseId: string,
    tagId: string
  ) => {
    const res = await api.get(
      `/courses/${courseId}/tags/${tagId}`
    );

    return (
      res.data?.tag ||
      res.data?.data ||
      res.data
    );
  };

export const createCourseTagApi =
  async (
    courseId: string,
    data: any
  ) => {
    const res = await api.post(
      `/courses/${courseId}/tags`,
      data
    );

    return (
      res.data?.tag ||
      res.data?.data ||
      res.data
    );
  };

export const updateCourseTagApi =
  async (
    courseId: string,
    tagId: string,
    data: any
  ) => {
    const res = await api.put(
      `/courses/${courseId}/tags/${tagId}`,
      data
    );

    return (
      res.data?.tag ||
      res.data?.data ||
      res.data
    );
  };

export const deleteCourseTagApi =
  async (
    courseId: string,
    tagId: string
  ) => {
    const res = await api.delete(
      `/courses/${courseId}/tags/${tagId}`
    );

    return res.data;
  };