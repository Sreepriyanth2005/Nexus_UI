// src/hooks/lesson/useLesson.ts

import {useMutation,useQuery,useQueryClient,} from "@tanstack/react-query";
import {
  createLessonApi,
  updateLessonApi,
  getLessonApi,
  getLessonsApi,
  getMyLessonsApi,
  publishLessonApi,
  unpublishLessonApi,
  archiveLessonApi,
  deleteLessonApi,
  getLessonVersionsApi,
  createLessonVersionApi,
} from "../../core/api/lesson/lesson.api";

export const lessonKeys = {all: ["lessons"],

  list: (params?: Record<string, any>) => ["lessons", params],
  detail: (lessonId: string) => ["lesson", lessonId],
  versions: (lessonId: string) => ["lesson-versions",lessonId,],};

export const useLessons = (params?: Record<string, any>) =>
  useQuery({
    queryKey:lessonKeys.list(params),
    queryFn: () =>
      getLessonsApi(params),
  });

export const useMyLessons = (userId?: string, params?: Record<string, any>) =>
  useQuery({
    queryKey: [...lessonKeys.list(params), "my-lessons", userId],
    queryFn: () => getMyLessonsApi(userId!, params),
    enabled: !!userId,
  });

export const useLesson = (lessonId?: string) =>
  useQuery({
    queryKey:lessonKeys.detail(lessonId || ""),
    enabled: !!lessonId,
    queryFn: () =>getLessonApi(lessonId as string),
  });


export const useCreateLesson =() => {
    const qc =useQueryClient();
    return useMutation({
      mutationFn:createLessonApi,
      onSuccess: () => {
        qc.invalidateQueries({
          queryKey:lessonKeys.all,
        });
      },
    });
  };


export const useUpdateLesson =() => {
    const qc =useQueryClient();
    return useMutation({
      mutationFn: ({lessonId,data,
      }: {lessonId: string;data: any;}) =>
        updateLessonApi(lessonId,data),
      onSuccess: (_,variables) => {
        qc.invalidateQueries({
          queryKey:lessonKeys.all,
        });
        qc.invalidateQueries({
          queryKey:lessonKeys.detail(variables.lessonId),
        });
      },
    });
  };

export const usePublishLesson =() => {const qc =
      useQueryClient();
    return useMutation({
      mutationFn: ({lessonId,publishedById,}: 
        {lessonId: string;publishedById: string;}) =>
        publishLessonApi(
          lessonId,
          publishedById
        ),
      onSuccess: () => {
        qc.invalidateQueries({
          queryKey:lessonKeys.all,
        });
      },
    });
  };


export const useUnpublishLesson =() => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: ({
        lessonId,
        unpublishedById,
      }: {
        lessonId: string;
        unpublishedById: string;
      }) =>
        unpublishLessonApi(lessonId,unpublishedById),
      onSuccess: () => {
        qc.invalidateQueries({
          queryKey:lessonKeys.all,
        });
      },
    });
  };

export const useArchiveLesson =() => {
    const qc =useQueryClient();
    return useMutation({
      mutationFn:archiveLessonApi,
      onSuccess: () => {
        qc.invalidateQueries({
          queryKey:lessonKeys.all,
        });
      },
    });
  };


export const useDeleteLesson =() => {
    const qc =useQueryClient();

    return useMutation({
      mutationFn:
        deleteLessonApi,
      onSuccess: () => {
        qc.invalidateQueries({
          queryKey:lessonKeys.all,
        });
      },
    });
  };


export const useLessonVersions =(lessonId?: string) =>
    useQuery({
      enabled: !!lessonId,
      queryKey:lessonKeys.versions(lessonId || ""),
      queryFn: () =>
        getLessonVersionsApi(
          lessonId as string
        ),
    });

export const useCreateLessonVersion =() => {
    const qc =useQueryClient();
    return useMutation({
      mutationFn: ({
        lessonId,
        data,
      }: {
        lessonId: string;
        data: any;
      }) =>
        createLessonVersionApi(lessonId,data),
      onSuccess: (_,variables) => {
        qc.invalidateQueries({
          queryKey:lessonKeys.versions(
              variables.lessonId
            ),
        });
      },
    });
  };