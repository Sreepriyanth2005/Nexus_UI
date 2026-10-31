// src/core/api/course/course-skill.api.ts

import { api } from "../../../config/axios";

export const getCourseSkillsApi =
  async (
    courseId: string
  ) => {
    const res = await api.get(
      `/courses/${courseId}/skills`
    );

    return (
      res.data?.skills ||
      res.data?.data ||
      []
    );
  };

export const getCourseSkillByIdApi =
  async (
    courseId: string,
    skillId: string
  ) => {
    const res = await api.get(
      `/courses/${courseId}/skills/${skillId}`
    );

    return (
      res.data?.skill ||
      res.data?.data ||
      res.data
    );
  };

export const createCourseSkillApi =
  async (
    courseId: string,
    data: any
  ) => {
    const res = await api.post(
      `/courses/${courseId}/skills`,
      data
    );

    return (
      res.data?.skill ||
      res.data?.data ||
      res.data
    );
  };

export const updateCourseSkillApi =
  async (
    courseId: string,
    skillId: string,
    data: any
  ) => {
    const res = await api.put(
      `/courses/${courseId}/skills/${skillId}`,
      data
    );

    return (
      res.data?.skill ||
      res.data?.data ||
      res.data
    );
  };

export const deleteCourseSkillApi =
  async (
    courseId: string,
    skillId: string
  ) => {
    const res = await api.delete(
      `/courses/${courseId}/skills/${skillId}`
    );

    return res.data;
  };