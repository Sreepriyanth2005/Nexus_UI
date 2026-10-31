import { api } from "../../../config/axios";
import {
  AdminCourseListResponse,
  AdminCourseDetailResponse,
  AdminCourseAllResponse,
  AdminCourseQueryParams,
  AdminCourseDto,
  AdminCourseViewModel,
  AdminCourseStatistics,
} from "./adminCoursesApi.types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a human-readable author name from the nested owner relation.
 */
const resolveAuthorName = (course: AdminCourseDto): string => {
  if (course.owner?.profile) {
    const { firstName, lastName } = course.owner.profile;
    if (firstName || lastName) {
      return [firstName, lastName].filter(Boolean).join(" ");
    }
  }
  return course.owner?.email ?? "null";
};

/**
 * Format the visibility field for display.
 */
const resolveVisibility = (course: AdminCourseDto): string => {
  if (course.visibility === "TENANT_ONLY" && course.tenant?.name) {
    return `Tenant: ${course.tenant.name}`;
  }
  return course.visibility === "PUBLIC_CATALOG" ? "Public" : course.visibility;
};

/**
 * Build a relative time label from an ISO date string.
 */
const formatRelativeTime = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  return date.toLocaleDateString();
};

// ---------------------------------------------------------------------------
// Mapper
// ---------------------------------------------------------------------------

export const mapCourseToViewModel = (course: any): AdminCourseViewModel => ({
  id: course.id,
  title: course.title,
  description: course.fullDescription || course.description || "",
  shortDescription: course.shortDescription ?? "",
  authorName: resolveAuthorName(course),
  authorRole: (course.owner as any)?.roles?.[0]?.role?.name || "Instructor",
  authorId: course.ownerId || course.owner?.id,
  category: course.category?.name ?? "Uncategorised",
  difficulty: course.difficulty || course.level || "INTERMEDIATE",
  status: course.status,
  visibility: resolveVisibility(course),
  courseType: course.isStandalone !== false ? "Standalone" : "Career path",
  domain: course.category?.name ?? "-",
  enrollmentCount: String(course.enrolledCount ?? "-"),
  updatedAt: course.updatedAt ? formatRelativeTime(course.updatedAt) : "Recently",
  thumbnailUrl: course.thumbnailAsset?.url ?? course.thumbnailUrl ?? null,
  lessonCount: course.courseLessons?.length ?? course.lessonCount ?? 0,
  lessons: course.courseLessons?.map((cl: any) => cl.lesson) ?? [],
  tags: course.tags?.map((t: any) => t?.tag?.name || t?.name || (typeof t === "string" ? t : ""))?.filter(Boolean) ?? [],
  priceTier: course.priceTier || "FREE",
});

/**
 * Compute statistics from a full course list.
 */
export const computeCourseStatistics = (courses: AdminCourseDto[]): AdminCourseStatistics => ({
  published: courses.filter((c) => c.status === "PUBLISHED").length,
  inReview: 0, // Backend has no "IN_REVIEW" status — kept as 0
  draft: courses.filter((c) => c.status === "DRAFT").length,
  archived: courses.filter((c) => c.status === "ARCHIVED").length,
  approved: courses.filter((c) => c.status === "APPROVED").length,
  submitted: courses.filter((c) => c.status === "SUBMITTED").length,
  rejected: courses.filter((c) => c.status === "REJECTED").length,
});

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export const adminCoursesApi = {
  /**
   * Paginated list with server-side search, filtering, and sorting.
   * Endpoint: GET /courses
   */
  getList: async (params?: AdminCourseQueryParams): Promise<AdminCourseListResponse> => {
    const { data } = await api.get<AdminCourseListResponse>("/courses", { params });
    return data;
  },

  /**
   * Get every standalone course (no pagination).
   * Useful for computing global statistics.
   * Endpoint: GET /courses/all
   */
  getAll: async (): Promise<AdminCourseAllResponse> => {
    const { data } = await api.get<AdminCourseAllResponse>("/courses/all");
    return data;
  },

  /**
   * Get a single course by ID.
   * Endpoint: GET /courses/:courseId
   */
  getById: async (courseId: string): Promise<AdminCourseDetailResponse> => {
    const { data } = await api.get<AdminCourseDetailResponse>(`/courses/${courseId}`);
    return data;
  },
};
