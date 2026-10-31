// src/core/api/lesson/lesson-persona.api.ts

import { api } from "../../../config/axios";

export interface LessonPersona {
  id?: string;
  lessonId?: string;
  personaId?: string;
  [key: string]: any;
}

export const getLessonPersonasApi =
  async (
    lessonId: string
  ): Promise<LessonPersona[]> => {
    const res = await api.get(
      `/lessons/${lessonId}/personas`
    );

    return (
      res.data?.personas ||
      res.data?.data ||
      []
    );
  };

export const getLessonPersonaByIdApi =
  async (
    lessonId: string,
    personaId: string
  ): Promise<LessonPersona> => {
    const res = await api.get(
      `/lessons/${lessonId}/personas/${personaId}`
    );

    return (
      res.data?.persona ||
      res.data?.data ||
      res.data
    );
  };

export const createLessonPersonaApi =
  async (
    lessonId: string,
    payload: Partial<LessonPersona>
  ): Promise<LessonPersona> => {
    const res = await api.post(
      `/lessons/${lessonId}/personas`,
      payload
    );

    return (
      res.data?.persona ||
      res.data?.data ||
      res.data
    );
  };

export const updateLessonPersonaApi =
  async (
    lessonId: string,
    personaId: string,
    payload: Partial<LessonPersona>
  ): Promise<LessonPersona> => {
    const res = await api.put(
      `/lessons/${lessonId}/personas/${personaId}`,
      payload
    );

    return (
      res.data?.persona ||
      res.data?.data ||
      res.data
    );
  };

export const deleteLessonPersonaApi =
  async (
    lessonId: string,
    personaId: string
  ) => {
    const res = await api.delete(
      `/lessons/${lessonId}/personas/${personaId}`
    );

    return res.data;
  };