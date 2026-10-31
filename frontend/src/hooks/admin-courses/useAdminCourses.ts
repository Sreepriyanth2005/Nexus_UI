import { useQuery } from "@tanstack/react-query";
import { adminCoursesApi, computeCourseStatistics, mapCourseToViewModel } from "../../core/api/admin-courses/adminCoursesApi";
import { AdminCourseQueryParams } from "../../core/api/admin-courses/adminCoursesApi.types";

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const adminCourseKeys = {
  all: ["adminCourses"] as const,
  lists: () => [...adminCourseKeys.all, "list"] as const,
  list: (params?: AdminCourseQueryParams) =>
    [...adminCourseKeys.lists(), params] as const,
  allCourses: () => [...adminCourseKeys.all, "allCourses"] as const,
  details: () => [...adminCourseKeys.all, "detail"] as const,
  detail: (id: string) => [...adminCourseKeys.details(), id] as const,
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/**
 * Fetch paginated course list for the admin table.
 * Supports server-side search, filtering, sorting, and pagination.
 */
export const useAdminCourses = (params?: AdminCourseQueryParams) => {
  return useQuery({
    queryKey: adminCourseKeys.list(params),
    queryFn: () => adminCoursesApi.getList(params),
    select: (response) => ({
      courses: response.data.map(mapCourseToViewModel),
      total: response.total,
      page: response.page,
      limit: response.limit,
      totalPages: response.totalPages,
    }),
  });
};

/**
 * Fetch all courses (unpaginated) — used for global statistics.
 * Uses a longer stale time since stats don't change frequently.
 */
export const useAdminCourseStats = () => {
  return useQuery({
    queryKey: adminCourseKeys.allCourses(),
    queryFn: () => adminCoursesApi.getAll(),
    select: (response) => computeCourseStatistics(response.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Fetch a single course by ID (for detail view).
 */
export const useAdminCourseById = (courseId: string, enabled = true) => {
  return useQuery({
    queryKey: adminCourseKeys.detail(courseId),
    queryFn: () => adminCoursesApi.getById(courseId),
    enabled: enabled && !!courseId,
  });
};
