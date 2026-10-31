import { api } from "../../../config/axios";

export const createCareerPathTagApi =
  async (
    careerPathId: string,
    data: any
  ) => {
    const res = await api.post(
      `/career-paths/${careerPathId}/tags`,
      data
    );

    return (
      res.data?.tag ||
      res.data?.data ||
      res.data
    );
  };

export const getCareerPathTagApi =
  async (
    careerPathId: string,
    tagId: string
  ) => {
    const res = await api.get(
      `/career-paths/${careerPathId}/tag/${tagId}`
    );

    return (
      res.data?.tag ||
      res.data?.data ||
      res.data
    );
  };

export const updateCareerPathTagApi =
  async (
    careerPathId: string,
    tagId: string,
    data: any
  ) => {
    const res = await api.put(
      `/career-paths/${careerPathId}/tag/${tagId}`,
      data
    );

    return (
      res.data?.tag ||
      res.data?.data ||
      res.data
    );
  };

export const deleteCareerPathTagApi =
  async (
    careerPathId: string,
    tagId: string
  ) => {
    const res = await api.delete(
      `/career-paths/${careerPathId}/tag/${tagId}`
    );

    return res.data;
  };