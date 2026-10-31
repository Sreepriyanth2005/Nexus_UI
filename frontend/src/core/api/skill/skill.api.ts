// src/core/api/skill/skill.api.ts

import { api } from "../../../config/axios";

export interface Skill {
  id?: string;
  name: string;
  description?: string;
}

export const getSkillsApi =
  async (): Promise<Skill[]> => {
    const res = await api.get(
      "/skills"
    );

    return (
      res.data?.skills ||
      res.data?.data ||
      []
    );
  };

export const getSkillByIdApi =
  async (
    skillId: string
  ): Promise<Skill> => {
    const res = await api.get(
      `/skills/${skillId}`
    );

    return (
      res.data?.skill ||
      res.data?.data ||
      res.data
    );
  };

export const createSkillApi =
  async (
    data: Partial<Skill>
  ) => {
    const res = await api.post(
      "/skills",
      data
    );

    return (
      res.data?.skill ||
      res.data?.data ||
      res.data
    );
  };

export const updateSkillApi =
  async (
    skillId: string,
    data: Partial<Skill>
  ) => {
    const res = await api.put(
      `/skills/${skillId}`,
      data
    );

    return (
      res.data?.skill ||
      res.data?.data ||
      res.data
    );
  };

export const deleteSkillApi =
  async (
    skillId: string
  ) => {
    const res = await api.delete(
      `/skills/${skillId}`
    );

    return res.data;
  };