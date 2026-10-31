// src/core/api/course/course-lesson.api.ts

import { api } from "../../../config/axios";

export interface CourseLesson {
  id?: string;
  title?: string;
  description?: string;
  [key: string]: any;
}

export const getCourseLessonsApi =
  async (
    courseId: string
  ): Promise<CourseLesson[]> => {
    const res = await api.get(
      `/courses/${courseId}/lessons`
    );

    return (
      res.data?.lessons ||
      res.data?.data ||
      []
    );
  };

export const createCourseLessonApi =
  async (
    courseId: string,
    data: Partial<CourseLesson>
  ): Promise<CourseLesson> => {
    const res = await api.post(
      `/courses/${courseId}/lessons`,
      data
    );

    return (
      res.data?.lesson ||
      res.data?.data ||
      res.data
    );
  };

export const updateCourseLessonApi =
  async (
    courseId: string,
    lessonId: string,
    data: Partial<CourseLesson>
  ): Promise<CourseLesson> => {
    const res = await api.put(
      `/courses/${courseId}/lessons/${lessonId}`,
      data
    );

    return (
      res.data?.lesson ||
      res.data?.data ||
      res.data
    );
  };

export const deleteCourseLessonApi =
  async (
    courseId: string,
    lessonId: string
  ) => {
    const res = await api.delete(
      `/courses/${courseId}/lessons/${lessonId}`
    );

    return res.data;
  };