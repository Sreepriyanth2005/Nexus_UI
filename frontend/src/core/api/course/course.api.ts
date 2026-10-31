


import { api } from "../../../config/axios";

// Types
export interface Course {
  id: string;
  title: string;
  fullDescription: string;
}

// Enrolled course progress shape returned by GET /courses/me/enrolled
export interface EnrolledCourseProgress {
  userId: string;
  courseId: string;
  progress: number | null;
  completed: boolean | null;
  completedAt: string | null;
  lastLessonId: string | null;
  completedLessons: number;
  lastAccessedAt: string | null;
  startedAt: string | null;
  status: string;
  totalLessons: number;
}

export interface EnrolledCourseItem {
  id: string;
  tenantId: string | null;
  userId: string | null;
  courseId: string | null;
  enrolledAt: string;
  updatedAt: string;
  type: string | null;
  careerPathId: string | null;
  lessonId: string | null;
  course: Course | null;
  progress: EnrolledCourseProgress | null;
}

export interface CourseListResponse {
  success: boolean;
  data: Course[];
  total: number;
  page: number;
  limit: number;
}

export interface CourseResponse {
  id: string;
  success: boolean;
  data: Course;
}

export interface CourseListParams {
  page?: number;
  limit?: number;
  search?: string;
  ownerId?: string;
  categoryId?: string;
  status?: string;
  isStandalone?: boolean | string;
  isNewRelease?: boolean | string;
  isTrending?: boolean | string;
  tenantId?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  [key: string]: any;
}



export interface CreateCoursePayload {
  ownerId: string;
  categoryId: string;
  subcategoryId?: string;
  subjectIds?: string[];

  publishType: string;

  title: string;
  subtitle?: string;
  tagline?: string;

  fullDescription: string;
  shortDescription?: string;

  difficulty: string;
  duration: number;

  learningObjectives: unknown;
  learningOutcomes: unknown;

  targetAudience: string[];
  prerequisites?: string[];

  language: string;
  priceTier: string;

  assessmentRequired: boolean;
  videoThreshold: number;
  notifyOnUpdate: boolean;

  visibility: string;

  isStandalone: boolean;

  slug: string;
  status: string;

  tenantIds: string[];
  skillIds: string[];
  tagIds: string[];
  personaIds: string[];

  courseThumbnail?: File;
  coursePreview?: File;

  lessons?: unknown[];
}
export interface CourseResource {
  id: string;
  title: string;
  url: string;
  type?: string;
}

export const courseKeys = {
  all: ["courses"] as const,
  lists: () => [...courseKeys.all, "list"] as const,
  list: (params?: CourseListParams) => [...courseKeys.lists(), params] as const,
  details: () => [...courseKeys.all, "detail"] as const,
  detail: (id: string) => [...courseKeys.details(), id] as const,
  resources: (id: string) => [...courseKeys.detail(id), "resources"] as const,
};

//API

export const courseApi = {
  create(payload: FormData) {
    return api.post<CourseResponse>("/courses", payload);
  },

  list(params?: CourseListParams) {
    return api.get<CourseListResponse>("/courses", {
      params,
    });
  },

  getAll() {
    return api.get<{ success: boolean; data: any[] }>("/courses/all");
  },

  getMyCourses(userId: string, params?: CourseListParams) {
    return api.get<CourseListResponse>("/courses", {
      params: { ...params, ownerId: userId },
    });
  },

  getById(id: string) {
    return api.get<CourseResponse>(`/courses/${id}`);
  },

  update(id: string, payload: FormData) {
    return api.patch<CourseResponse>(
      `/courses/${id}`,
      payload
    );
  },

  delete(id: string) {
    return api.delete(`/courses/${id}`);
  },

  publish(id: string) {
    return api.post(`/courses/${id}/publish`);
  },

  unpublish(id: string) {
    return api.post(`/courses/${id}/unpublish`);
  },

  regenerateShareToken(id: string) {
    return api.post(`/courses/${id}/share-token`);
  },

  getByShareToken(token: string) {
    return api.get(`/courses/share/${token}`);
  },

  enroll(courseId: string) {
    return api.post<{ success: boolean; message: string; data: any }>(`/courses/${courseId}/enroll`);
  },

  getEnrolledCourses() {
    return api.get<{ success: boolean; data: any[] }>("/courses/me/enrolled");
  },

  getResources(courseId: string) {
    return api.get<{ success: boolean; data: CourseResource[] }>(`/courses/${courseId}/resources`);
  },

  // Admin: fetch a specific user's enrollments (enrollment table joined with course/career-path + progress tables)
  getAdminUserEnrollmentsWithProgress(userId: string) {
    return api.get<{ success: boolean; data: any[] }>(`/enrollments/user/${userId}`);
  },

  // Admin: fetch course_progress table rows for a specific user
  getAdminCourseProgress(userId: string) {
    return api.get<{ success: boolean; data: any[] }>(`/progress/course-progress/user/${userId}`);
  },

  // Admin: fetch careerpath_progress table rows for a specific user
  getAdminCareerPathProgress(userId: string) {
    return api.get<{ success: boolean; data: any[] }>(`/progress/career-path-progress/user/${userId}`);
  },

  // Fetch monthly enrollment metrics per course from the database
  getMonthlyEnrollmentCounts: async (): Promise<Record<string, number>> => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const fromDate = startOfMonth.toISOString();
    const map: Record<string, number> = {};

    try {
      // Check discovery metrics which groups enrollments table by courseId for this month
      const res = await api.get<{ success: boolean; data?: { topCoursesByEnrollment?: any[] } }>(
        "/courses/progress/metrics/discovery",
        { params: { fromDate } }
      );
      const top = res?.data?.data?.topCoursesByEnrollment || [];
      if (Array.isArray(top) && top.length > 0) {
        top.forEach((item: any) => {
          if (item.courseId) {
            map[item.courseId] = Number(item._count?.id ?? item.count ?? 0);
          }
        });
      }
    } catch (e) {
      console.warn("Could not fetch discovery metrics for enrollments:", e);
    }

    return map;
  },

  // Fetch real-time count of records in enrollments DB table for this course or career path
  getEnrollmentCount: async (id: string, type?: string): Promise<number> => {
    try {
      const res = await api.get<{ success: boolean; data: { count: number } }>("/enrollments/count", {
        params: { id, type }
      });
      return res.data?.data?.count ?? 0;
    } catch (e) {
      console.warn("Could not fetch enrollment count:", e);
      return 0;
    }
  },
};