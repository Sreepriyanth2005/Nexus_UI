import { useQuery } from "@tanstack/react-query";
import { courseOverviewApi } from "../../core/api/content-developer-workspace/courseOverview.api";

export const courseOverviewKeys = {
  all: ["contentOverview"] as const,

  course: (id: string) =>
    [...courseOverviewKeys.all, "course", id] as const,

  careerPath: (id: string) =>
    [...courseOverviewKeys.all, "careerPath", id] as const,

  lesson: (id: string) =>
    [...courseOverviewKeys.all, "lesson", id] as const,

  lessons: (id: string) =>
    [...courseOverviewKeys.all, "lessons", id] as const,

  reviewSummary: (entityType: string, id: string) =>
    [...courseOverviewKeys.all, "reviewSummary", entityType, id] as const,
};

/* -------------------------------------------------------------------------- */
/* Course */
/* -------------------------------------------------------------------------- */

export const useCourseOverview = (courseId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: courseOverviewKeys.course(courseId),
    queryFn: () => courseOverviewApi.getCourseOverview(courseId),
    enabled: options?.enabled !== undefined ? (options.enabled && !!courseId) : !!courseId,
  });
};

export const useCourseLessons = (courseId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: courseOverviewKeys.lessons(courseId),
    queryFn: () => courseOverviewApi.getCourseLessons(courseId),
    enabled: options?.enabled !== undefined ? (options.enabled && !!courseId) : !!courseId,
  });
};

/* -------------------------------------------------------------------------- */
/* Career Path */
/* -------------------------------------------------------------------------- */

export const useCareerPathOverview = (careerPathId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: courseOverviewKeys.careerPath(careerPathId),
    queryFn: () =>
      courseOverviewApi.getCareerPathOverview(careerPathId),
    enabled: options?.enabled !== undefined ? (options.enabled && !!careerPathId) : !!careerPathId,
  });
};

/* -------------------------------------------------------------------------- */
/* Lesson */
/* -------------------------------------------------------------------------- */

export const useLessonOverview = (lessonId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: courseOverviewKeys.lesson(lessonId),
    queryFn: () =>
      courseOverviewApi.getLessonOverview(lessonId),
    enabled: options?.enabled !== undefined ? (options.enabled && !!lessonId) : !!lessonId,
  });
};

/* -------------------------------------------------------------------------- */
/* Review Summary (Common) */
/* -------------------------------------------------------------------------- */

export const useCourseReviewSummary = (
  entityType: "course" | "career-path" | "lesson",
  id: string,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: courseOverviewKeys.reviewSummary(entityType, id),
    queryFn: () =>
      courseOverviewApi.getReviewSummary(entityType, id),
    enabled: options?.enabled !== undefined ? (options.enabled && !!id) : !!id,
  });
};