// src/hooks/course/useCourseSubjects.ts

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  assignCourseSubjectsApi,
  getCourseSubjectsApi,
  replaceCourseSubjectsApi,
  removeCourseSubjectApi,
} from "../../core/api/course/course-subject.api";

import {
  useCourseSubjectStore,
} from "../../store/course/courseSubjectStore";

export const useCourseSubjects = (
  courseId: string
) => {
  const queryClient =
    useQueryClient();

  const {
    subjects,
    setSubjects,
    removeSubject,
  } =
    useCourseSubjectStore();

  const query =
    useQuery({
      queryKey: [
        "course-subjects",
        courseId,
      ],

      enabled:
        !!courseId,

      queryFn:
        async () => {
          const data =
            await getCourseSubjectsApi(
              courseId
            );

          setSubjects(
            data
          );

          return data;
        },
    });

  const assignMutation =
    useMutation({
      mutationFn: (
        payload: any
      ) =>
        assignCourseSubjectsApi(
          courseId,
          payload
        ),

      onSuccess: () => {
        queryClient.invalidateQueries(
          {
            queryKey: [
              "course-subjects",
              courseId,
            ],
          }
        );
      },
    });

  const replaceMutation =
    useMutation({
      mutationFn: (
        payload: any
      ) =>
        replaceCourseSubjectsApi(
          courseId,
          payload
        ),

      onSuccess: () => {
        queryClient.invalidateQueries(
          {
            queryKey: [
              "course-subjects",
              courseId,
            ],
          }
        );
      },
    });

  const removeMutation =
    useMutation({
      mutationFn: (
        subjectId: string
      ) =>
        removeCourseSubjectApi(
          courseId,
          subjectId
        ),

      onSuccess: (
        _,
        subjectId
      ) => {
        removeSubject(
          subjectId
        );
      },
    });

  return {
    subjects,
    query,
    assignMutation,
    replaceMutation,
    removeMutation,
  };
};