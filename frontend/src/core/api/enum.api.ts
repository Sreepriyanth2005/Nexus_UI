import { api } from "../../config/axios";

export type EnumResponse<T = string> = {
  success: boolean;
  data: T[];
};

export const getLessonTypes = async (): Promise<string[]> => {
  const { data } = await api.get<EnumResponse>("/enums/lesson-types");
  return data.data;
};

export const getLessonStatuses = async (): Promise<string[]> => {
  const { data } = await api.get<EnumResponse>("/enums/lesson-statuses");
  return data.data;
};

export const getCourseStatuses = async (): Promise<string[]> => {
  const { data } = await api.get<EnumResponse>("/enums/course-statuses");
  return data.data;
};

export const getDifficultyLevels = async (): Promise<string[]> => {
  const { data } = await api.get<EnumResponse>("/enums/difficulty-levels");
  return data.data;
};

export const getCareerPathStatuses = async (): Promise<string[]> => {
  const { data } = await api.get<EnumResponse>("/enums/career-path-statuses");
  return data.data;
};

export const getVisibilities = async (): Promise<string[]> => {
  const { data } = await api.get<EnumResponse>("/enums/visibilities");
  return data.data;
};

export const getPreviewAccessType = async (): Promise<string[]> => {
  const { data } = await api.get<EnumResponse>("/enums/previewstatus");
  return data.data;
};