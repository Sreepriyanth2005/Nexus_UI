import { useQuery } from "@tanstack/react-query";
import { coursePreviewApi } from "../../core/api/content-developer-workspace/coursePreview.api";

export const coursePreviewKeys = {
  all: ["coursePreview"] as const,
  details: (id: string) => [...coursePreviewKeys.all, "details", id] as const,
  lessons: (id: string) => [...coursePreviewKeys.all, "lessons", id] as const,
  reviews: (id: string) => [...coursePreviewKeys.all, "reviews", id] as const,
};

export const useCoursePreview = (courseId: string) => {
  return useQuery({
    queryKey: coursePreviewKeys.details(courseId),
    queryFn: () => coursePreviewApi.getCoursePreview(courseId),
    enabled: !!courseId,
  });
};

export const useCourseLessons = (courseId: string) => {
  return useQuery({
    queryKey: coursePreviewKeys.lessons(courseId),
    queryFn: () => coursePreviewApi.getCourseLessons(courseId),
    enabled: !!courseId,
  });
};

export const useCourseReviews = (courseId: string) => {
  return useQuery({
    queryKey: coursePreviewKeys.reviews(courseId),
    queryFn: () => coursePreviewApi.getCourseReviews(courseId),
    enabled: !!courseId,
  });
};
