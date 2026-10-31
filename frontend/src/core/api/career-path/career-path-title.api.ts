import { api } from "../../../config/axios";

/* -------------------------------------------------------------------------- */
/* Query Keys */
/* -------------------------------------------------------------------------- */

export const careerPathTitleKeys = {
  all: ["career-path-title"] as const,

  details: () => [...careerPathTitleKeys.all, "detail"] as const,

  detail: (careerPathId: string) =>
    [...careerPathTitleKeys.details(), careerPathId] as const,
};

/* -------------------------------------------------------------------------- */
/* Types */
/* -------------------------------------------------------------------------- */

export interface CareerPathTitle {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface CareerPathTitleResponse {
  success: boolean;
  message?: string;
  data: CareerPathTitle;
}

export interface UpdateCareerPathTitlePayload {
  title: string;
}

/* -------------------------------------------------------------------------- */
/* API */
/* -------------------------------------------------------------------------- */

export const getCareerPathTitleApi = async (
  careerPathId: string
): Promise<CareerPathTitleResponse> => {
  const { data } = await api.get(`/career-paths/${careerPathId}`);
  return data;
};

export const updateCareerPathTitleApi = async ({
  careerPathId,
  data,
}: {
  careerPathId: string;
  data: UpdateCareerPathTitlePayload;
}): Promise<CareerPathTitleResponse> => {
  const res = await api.patch(`/career-paths/${careerPathId}`, data);
  return res.data;
};

export const deleteCareerPathTitleApi = async (
  careerPathId: string
): Promise<{ success: boolean; message: string }> => {
  const { data } = await api.delete(`/career-paths/${careerPathId}`);
  return data;
};