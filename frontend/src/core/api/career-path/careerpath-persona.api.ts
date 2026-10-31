import { api } from "../../../config/axios";

export const createCareerPathPersonaApi =
  async (
    careerPathId: string,
    data: any
  ) => {
    const res = await api.post(
      `/career-paths/${careerPathId}/personas`,
      data
    );

    return (
      res.data?.persona ||
      res.data?.data ||
      res.data
    );
  };

export const getCareerPathPersonaApi =
  async (
    careerPathId: string,
    personaId: string
  ) => {
    const res = await api.get(
      `/career-paths/${careerPathId}/personas/${personaId}`
    );

    return (
      res.data?.persona ||
      res.data?.data ||
      res.data
    );
  };

export const updateCareerPathPersonaApi =
  async (
    careerPathId: string,
    personaId: string,
    data: any
  ) => {
    const res = await api.put(
      `/career-paths/${careerPathId}/personas/${personaId}`,
      data
    );

    return (
      res.data?.persona ||
      res.data?.data ||
      res.data
    );
  };

export const deleteCareerPathPersonaApi =
  async (
    careerPathId: string,
    personaId: string
  ) => {
    const res = await api.delete(
      `/career-paths/${careerPathId}/personas/${personaId}`
    );

    return res.data;
  };