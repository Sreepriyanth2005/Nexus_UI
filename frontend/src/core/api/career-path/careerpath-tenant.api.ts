import { api } from "../../../config/axios";

export const getCareerPathTenantApi =
  async (
    careerPathId: string
  ) => {
    const res = await api.get(
      `/career-paths/${careerPathId}/tenant`
    );

    return (
      res.data?.tenant ||
      res.data?.data ||
      res.data
    );
  };

export const assignCareerPathTenantApi =
  async (
    careerPathId: string,
    data: any
  ) => {
    const res = await api.put(
      `/career-paths/${careerPathId}/tenant`,
      data
    );

    return (
      res.data?.tenant ||
      res.data?.data ||
      res.data
    );
  };

export const removeCareerPathTenantApi =
  async (
    careerPathId: string
  ) => {
    const res = await api.delete(
      `/career-paths/${careerPathId}/tenant`
    );

    return res.data;
  };