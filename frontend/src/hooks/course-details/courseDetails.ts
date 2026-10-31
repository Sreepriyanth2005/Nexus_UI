import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { courseDetailsApi } from "../../core/api/course-details/courseDetails.api";
import { courseApi } from "../../core/api/course/course.api";

export const courseDetailsKeys = {
  all: ["courseDetails"] as const,
  details: (courseId: string) =>
    [...courseDetailsKeys.all, "detail", courseId] as const,
  lessons: (courseId: string) =>
    [...courseDetailsKeys.all, "lessons", courseId] as const,
  stats: (courseId: string) =>
    [...courseDetailsKeys.all, "stats", courseId] as const,
  reviews: (courseId: string) =>
    [...courseDetailsKeys.all, "reviews", courseId] as const,
  related: (courseId: string) =>
    [...courseDetailsKeys.all, "related", courseId] as const,
  enrolled: ["enrolledCourses"] as const,
};

export const useCourseDetails = (courseId: string, enabled = true) => {
  return useQuery({
    queryKey: courseDetailsKeys.details(courseId),
    queryFn: () => courseDetailsApi.getCourseDetails(courseId),
    enabled: enabled && !!courseId,
  });
};

export const useEnrolledCourses = (enabled = true) => {
  return useQuery({
    queryKey: courseDetailsKeys.enrolled,
    queryFn: async () => {
      const res = await courseApi.getEnrolledCourses();
      return res.data?.data || [];
    },
    enabled,
  });
};

export const useEnrollCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (courseId: string) => courseApi.enroll(courseId),
    onSuccess: (_, courseId) => {
      queryClient.invalidateQueries({
        queryKey: ["enrolledCourses"],
      });
      queryClient.invalidateQueries({
        queryKey: ["course", courseId],
      });
      queryClient.invalidateQueries({
        queryKey: courseDetailsKeys.details(courseId),
      });
    },
  });
};

export const useCourseLessons = (courseId: string, enabled = true) => {
  return useQuery({
    queryKey: courseDetailsKeys.lessons(courseId),
    queryFn: () => courseDetailsApi.getCourseLessons(courseId),
    enabled: enabled && !!courseId,
  });
};

export const useCourseStatistics = (courseId: string, enabled = true) => {
  return useQuery({
    queryKey: courseDetailsKeys.stats(courseId),
    queryFn: () => courseDetailsApi.getCourseStatistics(courseId),
    enabled: enabled && !!courseId,
  });
};

export const useCourseReviews = (courseId: string, enabled = true) => {
  return useQuery({
    queryKey: courseDetailsKeys.reviews(courseId),
    queryFn: () => courseDetailsApi.getCourseReviews(courseId),
    enabled: enabled && !!courseId,
  });
};

export const useRelatedCourses = (courseId: string, enabled = true) => {
  return useQuery({
    queryKey: courseDetailsKeys.related(courseId),
    queryFn: () => courseDetailsApi.getRelatedCourses(courseId),
    enabled: enabled && !!courseId,
  });
};

export const useMonthlyCourseEnrollments = (enabled = true) => {
  return useQuery({
    queryKey: ["monthlyCourseEnrollments"],
    queryFn: () => courseApi.getMonthlyEnrollmentCounts(),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
};

export const useEnrollmentCount = (id: string, type?: string, enabled = true) => {
  return useQuery({
    queryKey: ["enrollment-count", type, id],
    queryFn: () => courseApi.getEnrollmentCount(id, type),
    enabled: enabled && !!id,
  });
};


