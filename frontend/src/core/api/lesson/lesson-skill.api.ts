// src/core/api/lesson/lesson-skill.api.ts

import { api } from "../../../config/axios";

export interface LessonSkill {
  id?: string;
  lessonId?: string;
  skillId?: string;
  [key: string]: any;
}

export const getLessonSkillsApi =
  async (
    lessonId: string
  ): Promise<LessonSkill[]> => {
    const res = await api.get(
      `/lessons/${lessonId}/skills`
    );

    return (
      res.data?.skills ||
      res.data?.data ||
      []
    );
  };

export const getLessonSkillByIdApi =
  async (
    lessonId: string,
    skillId: string
  ): Promise<LessonSkill> => {
    const res = await api.get(
      `/lessons/${lessonId}/skills/${skillId}`
    );

    return (
      res.data?.skill ||
      res.data?.data ||
      res.data
    );
  };

export const createLessonSkillApi =
  async (
    lessonId: string,
    payload: Partial<LessonSkill>
  ): Promise<LessonSkill> => {
    const res = await api.post(
      `/lessons/${lessonId}/skills`,
      payload
    );

    return (
      res.data?.skill ||
      res.data?.data ||
      res.data
    );
  };

export const updateLessonSkillApi =
  async (
    lessonId: string,
    skillId: string,
    payload: Partial<LessonSkill>
  ): Promise<LessonSkill> => {
    const res = await api.put(
      `/lessons/${lessonId}/skills/${skillId}`,
      payload
    );

    return (
      res.data?.skill ||
      res.data?.data ||
      res.data
    );
  };

export const deleteLessonSkillApi =
  async (
    lessonId: string,
    skillId: string
  ) => {
    const res = await api.delete(
      `/lessons/${lessonId}/skills/${skillId}`
    );

    return res.data;
  };