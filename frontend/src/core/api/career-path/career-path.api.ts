// src/core/api/career-path/career-paths.api.ts

import { api } from "../../../config/axios";



/* ----------------------------- Query Keys ----------------------------- */

export const careerPathKeys = {
  all: ["career-paths"] as const,
  lists: () => [...careerPathKeys.all, "list"] as const,
  list: (params?: any) => [...careerPathKeys.lists(), params] as const,
  details: () => [...careerPathKeys.all, "detail"] as const,
  detail: (id: string) => [...careerPathKeys.details(), id] as const,
};

/* ----------------------------- Types ----------------------------- */

export interface CareerPath {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  status: string;
  visibility: string;
  createdAt: string;
  updatedAt: string;
  courses?: any[];
}

export interface CareerPathListResponse {
  success: boolean;
  message: string;
  data: CareerPath[];
  total: number;
}

export interface CareerPathResponse {
  success: boolean;
  message: string;
  data: CareerPath;
}

export interface CareerPathListParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  createdById?: string;
  visibility?: string;
  difficulty?: string;
  status?: string;
}

/* ----------------------------- API ----------------------------- */

export const getCareerPathsApi = async (
  params?: CareerPathListParams
): Promise<CareerPathListResponse> => {
  const res = await api.get("/career-paths", { params });
  return res.data;
};

export const getMyCareerPathsApi = async (
  userId: string,
  params?: CareerPathListParams
): Promise<CareerPathListResponse> => {
  const res = await api.get("/career-paths", { params: { ...params, createdById: userId } });
  return res.data;
};


export const getAllCareerPathsApi = async (
  params?: CareerPathListParams
): Promise<CareerPathListResponse> => {
  const res = await api.get("/career-paths/all", { params });
  return res.data;
};

export const getCareerPathApi = async (
  id: string
): Promise<CareerPathResponse> => {
  const res = await api.get(`/career-paths/${id}`);
  return res.data;
};

export const createCareerPathApi = async (data: any) => {
  const res = await api.post("/career-paths", data);
  return res.data;
};

export const updateCareerPathApi = async ({
  id,
  data,
}: {
  id: string;
  data: any;
}) => {
  const res = await api.put(`/career-paths/${id}`, data);
  return res.data;
};

export const deleteCareerPathApi = async (id: string) => {
  const res = await api.delete(`/career-paths/${id}`);
  return res.data;
};

export const publishCareerPathApi = async ({
  id,
  publishedById,
}: {
  id: string;
  publishedById: string;
}) => {
  const res = await api.patch(`/career-paths/${id}/publish`, {
    publishedById,
  });

  return res.data;
};

export const unpublishCareerPathApi = async (id: string) => {
  const res = await api.patch(`/career-paths/${id}/unpublish`);
  return res.data;
};

export const enrollCareerPathApi = async (careerPathId: string) => {
  const res = await api.post(`/career-paths/${careerPathId}/enroll`);
  return res.data;
};

export const unenrollCareerPathApi = async (careerPathId: string) => {
  const res = await api.delete(`/career-paths/${careerPathId}/enroll`);
  return res.data;
};

export const getEnrolledCareerPathsApi = async () => {
  const res = await api.get(`/career-paths/me/enrolled`);
  return res.data;
};

export const submitCareerPathForReviewApi = async ({
  careerPathId,
  reviewerId,
  comment,
}: {
  careerPathId: string;
  reviewerId?: string;
  comment?: string;
}) => {
  const res = await api.post(`/career-paths/${careerPathId}/submit`, {
    reviewerId,
    comment,
  });
  return res.data;
};

export const regenerateCareerPathShareTokenApi = async (id: string) => {
  const res = await api.post(`/career-paths/${id}/share-token`);
  return res.data;
};

export const getCareerPathByShareTokenApi = async (token: string) => {
  const res = await api.get(`/career-paths/share/${token}`);
  return res.data;
};

