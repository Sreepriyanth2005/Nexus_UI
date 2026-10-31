// src/core/api/course/course-subject.api.ts

import { api } from "../../../config/axios";

export const assignCourseSubjectsApi =
  async (
    courseId: string,
    data: any
  ) => {
    const res = await api.post(
      `/courses/${courseId}/subjects`,
      data
    );

    return res.data;
  };

export const getCourseSubjectsApi =
  async (
    courseId: string
  ) => {
    const res = await api.get(
      `/courses/${courseId}/subjects`
    );

    return (
      res.data?.subjects ||
      res.data?.data ||
      []
    );
  };

export const replaceCourseSubjectsApi =
  async (
    courseId: string,
    data: any
  ) => {
    const res = await api.put(
      `/courses/${courseId}/subjects`,
      data
    );

    return res.data;
  };

export const removeCourseSubjectApi =
  async (
    courseId: string,
    subjectId: string
  ) => {
    const res = await api.delete(
      `/courses/${courseId}/subjects/${subjectId}`
    );

    return res.data;
  };