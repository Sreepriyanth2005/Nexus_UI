// src/hooks/course/useCourseLessons.ts

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getCourseLessonsApi,
  createCourseLessonApi,
  updateCourseLessonApi,
  deleteCourseLessonApi,
} from "../../core/api/course/course-lesson.api";

import {
  CourseLesson,
  useCourseLessonStore,
} from "../../store/course/courseLessonStore";

export const useCourseLessons = (courseId?: string) => {
  const queryClient = useQueryClient();

  const {
    lessons,
    setLessons,
    addLesson,
    updateLesson,
    deleteLesson,
  } = useCourseLessonStore();

  const query = useQuery({
    queryKey: ["course-lessons", courseId],
    enabled: !!courseId,

    queryFn: async () => {
      const data = await getCourseLessonsApi(courseId!);

      setLessons(data);

      return data;
    },
  });

  const createMutation = useMutation<
    CourseLesson,
    Error,
    Partial<CourseLesson>
  >({
    mutationFn: async (payload) => {
      if (!courseId) {
        throw new Error("Course ID is required.");
      }

      return createCourseLessonApi(courseId, payload);
    },

    onSuccess: (data) => {
      addLesson(data);

      if (courseId) {
        queryClient.invalidateQueries({
          queryKey: ["course-lessons", courseId],
        });
      }
    },

    onError: (error) => {
      console.error("Create lesson failed:", error);
    },
  });

  const updateMutation = useMutation<
    CourseLesson,
    Error,
    {
      lessonId: string;
      payload: Partial<CourseLesson>;
    }
  >({
    mutationFn: async ({ lessonId, payload }) => {
      if (!courseId) {
        throw new Error("Course ID is required.");
      }

      return updateCourseLessonApi(courseId, lessonId, payload);
    },

    onSuccess: (data) => {
      updateLesson(data);

      if (courseId) {
        queryClient.invalidateQueries({
          queryKey: ["course-lessons", courseId],
        });
      }
    },

    onError: (error) => {
      console.error("Update lesson failed:", error);
    },
  });

  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: async (lessonId) => {
      if (!courseId) {
        throw new Error("Course ID is required.");
      }

      return deleteCourseLessonApi(courseId, lessonId);
    },

    onSuccess: (_, lessonId) => {
      deleteLesson(lessonId);

      if (courseId) {
        queryClient.invalidateQueries({
          queryKey: ["course-lessons", courseId],
        });
      }
    },

    onError: (error) => {
      console.error("Delete lesson failed:", error);
    },
  });

  return {
    lessons,
    query,
    createMutation,
    updateMutation,
    deleteMutation,

    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};