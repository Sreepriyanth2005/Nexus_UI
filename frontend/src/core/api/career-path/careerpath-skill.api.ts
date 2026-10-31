import { api } from "../../../config/axios";

export const getCareerPathSkillsApi =
  async (
    careerPathId: string
  ) => {
    const res = await api.get(
      `/career-paths/${careerPathId}/skills`
    );

    return (
      res.data?.skills ||
      res.data?.data ||
      []
    );
  };

export const getCareerPathSkillApi =
  async (
    careerPathId: string,
    skillId: string
  ) => {
    const res = await api.get(
      `/career-paths/${careerPathId}/skills/${skillId}`
    );

    return (
      res.data?.skill ||
      res.data?.data ||
      res.data
    );
  };

export const createCareerPathSkillApi =
  async (
    careerPathId: string,
    data: any
  ) => {
    const res = await api.post(
      `/career-paths/${careerPathId}/skills`,
      data
    );

    return (
      res.data?.skill ||
      res.data?.data ||
      res.data
    );
  };

export const updateCareerPathSkillApi =
  async (
    careerPathId: string,
    skillId: string,
    data: any
  ) => {
    const res = await api.put(
      `/career-paths/${careerPathId}/skills/${skillId}`,
      data
    );

    return (
      res.data?.skill ||
      res.data?.data ||
      res.data
    );
  };

export const deleteCareerPathSkillApi =
  async (
    careerPathId: string,
    skillId: string
  ) => {
    const res = await api.delete(
      `/career-paths/${careerPathId}/skills/${skillId}`
    );

    return res.data;
  };