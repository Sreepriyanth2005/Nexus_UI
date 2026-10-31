import { api } from "../../../config/axios";

export interface ReorderLessonPayload {
  lessonId: string;
  sequenceOrder: number;
}

export interface ReorderLessonsInput {
  lessons: ReorderLessonPayload[];
}

export interface CreateCourseLessonInput {
  title: string;
  ownerId: string;
  language?: string;
  description?: string;
  lessonType?: string;
  contentAssetId?: string;
  transcriptAssetId?: string;
  sequenceOrder?: number;
  duration?: number;
  isStandalone?: boolean;
  assessmentRequired?: boolean;
  subjectId?: string;
  prerequisiteLessonId?: string;
  videoThreshold?: number;
}

export type UpdateCourseLessonInput = Partial<CreateCourseLessonInput>;

export interface CourseLessonResponse {
  id: string;
  title: string;
  [key: string]: any;
}

export const assignLessonToCourseApi = async (
  courseId: string,
  data: CreateCourseLessonInput
): Promise<CourseLessonResponse> => {
  const res = await api.post(`/courses/${courseId}/lessons`, data);
  return res.data?.data || res.data;
};

export const getCourseLessonsApi = async (
  courseId: string
): Promise<CourseLessonResponse[]> => {
  const res = await api.get(`/courses/${courseId}/lessons`);
  return res.data?.data || res.data || [];
};

export const reorderLessonsApi = async (
  courseId: string,
  data: ReorderLessonsInput
): Promise<any> => {
  const res = await api.put(`/courses/${courseId}/lessons/reorder`, data);
  return res.data;
};

export const updateLessonApi = async (
  courseId: string,
  lessonId: string,
  data: UpdateCourseLessonInput
): Promise<CourseLessonResponse> => {
  const res = await api.put(`/courses/${courseId}/lessons/${lessonId}`, data);
  return res.data?.data || res.data;
};

export const deleteLessonFromCourseApi = async (
  courseId: string,
  lessonId: string
): Promise<any> => {
  const res = await api.delete(`/courses/${courseId}/lessons/${lessonId}`);
  return res.data;
};
