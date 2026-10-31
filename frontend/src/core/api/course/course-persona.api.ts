// src/core/api/course/course-persona.api.ts

import { api } from "../../../config/axios";

export const getCoursePersonasApi =
  async (
    courseId: string
  ) => {
    const res = await api.get(
      `/courses/${courseId}/personas`
    );

    return (
      res.data?.personas ||
      res.data?.data ||
      []
    );
  };

export const getCoursePersonaByIdApi =
  async (
    courseId: string,
    personaId: string
  ) => {
    const res = await api.get(
      `/courses/${courseId}/personas/${personaId}`
    );

    return (
      res.data?.persona ||
      res.data?.data ||
      res.data
    );
  };

export const createCoursePersonaApi =
  async (
    courseId: string,
    data: any
  ) => {
    const res = await api.post(
      `/courses/${courseId}/personas`,
      data
    );

    return (
      res.data?.persona ||
      res.data?.data ||
      res.data
    );
  };

export const updateCoursePersonaApi =
  async (
    courseId: string,
    personaId: string,
    data: any
  ) => {
    const res = await api.put(
      `/courses/${courseId}/personas/${personaId}`,
      data
    );

    return (
      res.data?.persona ||
      res.data?.data ||
      res.data
    );
  };

export const deleteCoursePersonaApi =
  async (
    courseId: string,
    personaId: string
  ) => {
    const res = await api.delete(
      `/courses/${courseId}/personas/${personaId}`
    );

    return res.data;
  };