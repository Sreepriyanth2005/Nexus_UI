import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  assignLessonToCourseApi,
  getCourseLessonsApi,
  reorderLessonsApi,
  updateLessonApi,
  deleteLessonFromCourseApi,
  ReorderLessonsInput,
  CreateCourseLessonInput,
  UpdateCourseLessonInput
} from "../../core/api/Reorder/ReorderLessons.api";

export const useCourseLessons = (courseId: string) =>
  useQuery({
    queryKey: ["course-lessons", courseId],
    queryFn: () => getCourseLessonsApi(courseId),
    enabled: !!courseId,
  });

export const useAssignLessonToCourse = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      courseId,
      data,
    }: {
      courseId: string;
      data: CreateCourseLessonInput;
    }) => assignLessonToCourseApi(courseId, data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({
        queryKey: ["course-lessons", variables.courseId],
      });
    },
  });
};

export const useReorderLessons = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      courseId,
      data,
    }: {
      courseId: string;
      data: ReorderLessonsInput;
    }) => reorderLessonsApi(courseId, data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({
        queryKey: ["course-lessons", variables.courseId],
      });
    },
  });
};

export const useUpdateLesson = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      courseId,
      lessonId,
      data,
    }: {
      courseId: string;
      lessonId: string;
      data: UpdateCourseLessonInput;
    }) => updateLessonApi(courseId, lessonId, data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({
        queryKey: ["course-lessons", variables.courseId],
      });
    },
  });
};

export const useDeleteLessonFromCourse = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      courseId,
      lessonId,
    }: {
      courseId: string;
      lessonId: string;
    }) => deleteLessonFromCourseApi(courseId, lessonId),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({
        queryKey: ["course-lessons", variables.courseId],
      });
    },
  });
};
