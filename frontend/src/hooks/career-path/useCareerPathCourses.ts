// src/hooks/career-path/useCareerPathCourses.ts

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getCareerPathCoursesApi,
  createCareerPathCourseApi,
  updateCareerPathCourseApi,
  deleteCareerPathCourseApi,
  reorderCareerPathCourseApi,
} from "../../core/api/career-path/careerpath-course.api";

import {
  useCareerPathCourseStore,
} from "../../store/career-path/careerPathCourseStore";

export const useCareerPathCourses =
  (
    careerPathId: string
  ) => {
    const queryClient =
      useQueryClient();

    const {
      courses,
      setCourses,
      addCourse,
      updateCourse,
      deleteCourse,
    } =
      useCareerPathCourseStore();

    const query =
      useQuery({
        queryKey: [
          "career-path-courses",
          careerPathId,
        ],

        enabled:
          !!careerPathId,

        queryFn:
          async () => {
            const data =
              await getCareerPathCoursesApi(
                careerPathId
              );

            setCourses(data);

            return data;
          },
      });

    const createMutation =
      useMutation({
        mutationFn: (
          payload: any
        ) =>
          createCareerPathCourseApi(
            careerPathId,
            payload
          ),

        onSuccess: (
          data
        ) => {
          addCourse(data);
        },
      });

    const updateMutation =
      useMutation({
        mutationFn: ({
          courseId,
          payload,
        }: any) =>
          updateCareerPathCourseApi(
            careerPathId,
            courseId,
            payload
          ),

        onSuccess: (
          data
        ) =>
          updateCourse(
            data
          ),
      });

    const deleteMutation =
      useMutation({
        mutationFn: (
          courseId: string
        ) =>
          deleteCareerPathCourseApi(
            careerPathId,
            courseId
          ),

        onSuccess: (
          _,
          courseId
        ) =>
          deleteCourse(
            courseId
          ),
      });

   const reorderMutation =
  useMutation<
    any,
    Error,
    { courseIds: string[] } | string[]
  >({
    mutationFn: (
      payload
    ) =>
      reorderCareerPathCourseApi(
        careerPathId,
        Array.isArray(payload) ? payload : (payload as any).courseIds || []
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          "career-path-courses",
          careerPathId,
        ],
      });
    },
  });

    return {
      courses,
      query,
      createMutation,
      updateMutation,
      deleteMutation,
      reorderMutation,
    };
  };