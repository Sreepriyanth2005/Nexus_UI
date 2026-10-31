// src/core/api/subject/subject.api.ts

import { api } from "../../config/axios";

export interface Subject {
  id?: string;
  name: string;
  description?: string;
}

export const getSubjectsApi =
  async (): Promise<Subject[]> => {
    const res = await api.get(
      "/subjects"
    );

    return (
      res.data?.subjects ||
      res.data?.data ||
      []
    );
  };

export const getSubjectByIdApi =
  async (
    subjectId: string
  ): Promise<Subject> => {
    const res = await api.get(
      `/subjects/${subjectId}`
    );

    return (
      res.data?.subject ||
      res.data?.data ||
      res.data
    );
  };

export const createSubjectApi =
  async (
    data: Partial<Subject>
  ) => {
    const res = await api.post(
      "/subjects",
      data
    );

    return (
      res.data?.subject ||
      res.data?.data ||
      res.data
    );
  };

export const updateSubjectApi =
  async (
    subjectId: string,
    data: Partial<Subject>
  ) => {
    const res = await api.put(
      `/subjects/${subjectId}`,
      data
    );

    return (
      res.data?.subject ||
      res.data?.data ||
      res.data
    );
  };

export const deleteSubjectApi =
  async (
    subjectId: string
  ) => {
    const res = await api.delete(
      `/subjects/${subjectId}`
    );

    return res.data;
  };