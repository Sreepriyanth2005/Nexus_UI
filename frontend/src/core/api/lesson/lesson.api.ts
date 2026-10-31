// src/api/lesson/lesson.api.ts

import { api } from "../../../config/axios";


export const createLessonApi = (data: any) =>
  api
    .post("/lessons", data).then((res) => res.data);


export const updateLessonApi = (lessonId: string, data: any) =>
  api
    .put(`/lessons/${lessonId}`, data)
    .then((res) => res.data);


export const getLessonApi = (lessonId: string) =>
  api
    .get(`/lessons/${lessonId}`)
    .then((res) => res.data);


export const getLessonsApi = (params?: Record<string, any>) =>
  api
    .get("/lessons", { params })
    .then((res) => res.data);


export const getMyLessonsApi = (userId: string, params?: Record<string, any>) =>
  api
    .get("/lessons", { params: { ...params, ownerId: userId } })
    .then((res) => res.data);


export const publishLessonApi = (lessonId: string, publishedById: string) =>
  api
    .patch(`/lessons/${lessonId}/publish`,
      {
        publishedById,
      }
    )
    .then((res) => res.data);


export const unpublishLessonApi = (lessonId: string, unpublishedById: string) =>
  api
    .patch(
      `/lessons/${lessonId}/unpublish`,
      {
        unpublishedById,
      }
    )
    .then((res) => res.data);


export const archiveLessonApi = (lessonId: string) =>
  api
    .patch(
      `/lessons/${lessonId}/archive`
    )
    .then((res) => res.data);


export const deleteLessonApi = (lessonId: string) =>
  api
    .delete(`/lessons/${lessonId}`)
    .then((res) => res.data);


export const getLessonVersionsApi = (lessonId: string) =>
  api
    .get(
      `/lessons/${lessonId}/versions`
    )
    .then((res) => res.data);


export const createLessonVersionApi = (lessonId: string, data: { changedBy?: string; changeSummary?: string; }) =>
  api
    .post(
      `/lessons/${lessonId}/version`,
      data
    )
    .then((res) => res.data);

export const regenerateLessonShareTokenApi = (lessonId: string) =>
  api.post(`/lessons/${lessonId}/share-token`).then((res) => res.data);

export const getLessonByShareTokenApi = (token: string) =>
  api.get(`/lessons/share/${token}`).then((res) => res.data);