import { api } from "../../../config/axios";
import type { ApiResponse } from "../../../types/profile.type";

export interface UpdateLessonProgressDto {
  courseId: string;
  careerPathId?: string;
  progress: number; // 0-100
  lastPositionSec: number;
  totalSeconds: number;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
}

export interface LessonProgress {
  id: string;
  lessonId: string;
  courseId: string;
  userId: string;
  progress: number;
  lastPositionSec: number;
  totalSeconds: number;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResumeLearningResponse {
  courseId: string;
  lessonId: string;
  careerPathId?: string;
  lastPositionSec: number;
}

export const progressApi = {
  // Lesson Progress
  getLessonSync: async (lessonId: string): Promise<ApiResponse<LessonProgress>> => {
    const response = await api.get(`/progress/lesson-progress/${lessonId}/sync`);
    return response.data;
  },

  updateLessonProgress: async (lessonId: string, payload: UpdateLessonProgressDto): Promise<ApiResponse<LessonProgress>> => {
    const response = await api.patch(`/progress/lesson-progress/${lessonId}`, payload);
    return response.data;
  },

  pauseLesson: async (lessonId: string): Promise<ApiResponse<LessonProgress>> => {
    const response = await api.patch(`/progress/lesson-progress/${lessonId}/pause`);
    return response.data;
  },

  resumeLesson: async (lessonId: string): Promise<ApiResponse<LessonProgress>> => {
    const response = await api.patch(`/progress/lesson-progress/${lessonId}/resume`);
    return response.data;
  },

  completeLesson: async (lessonId: string): Promise<ApiResponse<LessonProgress>> => {
    const response = await api.patch(`/progress/lesson-progress/${lessonId}/complete`);
    return response.data;
  },

  // Course Progress
  getCourseProgress: async (courseId: string): Promise<ApiResponse<any>> => {
    const response = await api.get(`/progress/course-progress/${courseId}`);
    return response.data;
  },

  getCareerPathProgress: async (careerPathId: string): Promise<ApiResponse<any>> => {
    const response = await api.get(`/progress/career-path-progress/${careerPathId}`);
    return response.data;
  },

  updateCourseProgress: async (courseId: string, payload: { progress: number; status: string }): Promise<ApiResponse<any>> => {
    const response = await api.patch(`/progress/course-progress/${courseId}`, payload);
    return response.data;
  },

  completeCourse: async (courseId: string): Promise<ApiResponse<any>> => {
    const response = await api.patch(`/progress/course-progress/${courseId}/complete`);
    return response.data;
  },

  // Resume Learning
  getResumeLearning: async (): Promise<ApiResponse<ResumeLearningResponse>> => {
    const response = await api.get(`/progress/resume`);
    return response.data;
  },

  getCourseResume: async (courseId: string): Promise<ApiResponse<ResumeLearningResponse>> => {
    const response = await api.get(`/progress/resume/course/${courseId}`);
    return response.data;
  },

  getCareerPathResume: async (careerPathId: string): Promise<ApiResponse<ResumeLearningResponse>> => {
    const response = await api.get(`/progress/resume/career-path/${careerPathId}`);
    return response.data;
  },

  recoverLearningState: async (): Promise<ApiResponse<any>> => {
    const response = await api.get(`/progress/resume/recover`);
    return response.data;
  },

  // Dashboard
  getDashboard: async (): Promise<any> => {
    const response = await api.get(`/progress/dashboard`);
    return response.data?.data;
  }
};
