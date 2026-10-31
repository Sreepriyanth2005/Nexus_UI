import { useQuery } from "@tanstack/react-query";
import {
  courseApi,
  CourseResource,
  courseKeys,
} from "../../core/api/course/course.api";

export const useCourseResources = (courseId?: string) => {
  const query = useQuery({
    queryKey: courseKeys.resources(courseId || ""),
    enabled: !!courseId,
    queryFn: async () => {
      if (!courseId) return [];
      const response = await courseApi.getResources(courseId);
      const resData = response.data;
      
      if (Array.isArray(resData)) {
        return resData as CourseResource[];
      }
      if (resData && "resources" in resData && Array.isArray(resData.resources)) {
        return resData.resources as CourseResource[];
      }
      if (resData && "data" in resData) {
        const inner = (resData as any).data;
        if (Array.isArray(inner)) return inner as CourseResource[];
        if (inner && Array.isArray(inner.resources)) return inner.resources as CourseResource[];
      }
      return [] as CourseResource[];
    },
  });

  return {
    resources: query.data || [],
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

export default useCourseResources;
