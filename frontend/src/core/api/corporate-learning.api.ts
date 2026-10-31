import { api } from "../../config/axios";

// TypeScript types for the APIs based on backend
export type CorporateContentType = "CAREER_PATH" | "COURSE" | "LESSON";
export type CorporateAssignmentScope = "GLOBAL" | "USER" | "DEPARTMENT";
export type CorporateAssignmentRequirement = "MANDATORY" | "OPTIONAL";

export interface CreateCorporateLearningAssignmentInput {
  contentType: CorporateContentType;
  contentId: string;
  scope: CorporateAssignmentScope;
  userIds?: string[];
  departmentIds?: string[];
  requirement?: CorporateAssignmentRequirement;
  dueDate?: string;
  notifyUsers?: boolean;
}

export interface BulkCorporateLearningAssignmentInput {
  items: Array<{
    contentType: CorporateContentType;
    contentId: string;
    requirement?: CorporateAssignmentRequirement;
    dueDate?: string;
  }>;
  scope: CorporateAssignmentScope;
  userIds?: string[];
  departmentIds?: string[];
  notifyUsers?: boolean;
}

export const getAvailableCoursesApi = async (tenantId: string, params: any = {}) => {
  const res = await api.get(`/tenants/${tenantId}/corporate-learning/available-courses`, { params });
  const data = res.data?.data || res.data;
  return data?.items || (Array.isArray(data) ? data : []);
};

export const getAvailableLessonsApi = async (tenantId: string, params: any = {}) => {
  const res = await api.get(`/tenants/${tenantId}/corporate-learning/available-lessons`, { params });
  const data = res.data?.data || res.data;
  return data?.items || (Array.isArray(data) ? data : []);
};

export const getAvailableCareerPathsApi = async (tenantId: string, params: any = {}) => {
  const res = await api.get(`/tenants/${tenantId}/corporate-learning/available-career-paths`, { params });
  const data = res.data?.data || res.data;
  return data?.items || (Array.isArray(data) ? data : []);
};

export const bulkAssignCorporateLearningApi = async (
  tenantId: string,
  data: BulkCorporateLearningAssignmentInput
) => {
  const res = await api.post(`/tenants/${tenantId}/corporate-learning/assignments/bulk`, data);
  return res.data?.data || res.data;
};

export const getAssignedContentApi = async (tenantId: string, userId: string) => {
  const res = await api.get(`/tenants/${tenantId}/corporate-learning/users/${userId}/assigned-content`);
  return res.data?.data || res.data;
};

export const getAssignmentReportApi = async (tenantId: string, params: any = {}) => {
  const res = await api.get(`/tenants/${tenantId}/corporate-learning/reports/assignments`, { params });
  return res.data?.data || res.data;
};

export const updateCorporateLearningAssignmentApi = async (
  tenantId: string,
  assignmentId: string,
  data: {
    dueDate?: string | null;
    requirement?: CorporateAssignmentRequirement;
    notifyUsers?: boolean;
    scope?: "USER" | "DEPARTMENT" | "ALL_USERS";
    departmentId?: string;
    addedUserIds?: string[];
    removedUserIds?: string[];
    userIds?: string[];
  }
) => {
  const res = await api.patch(`/tenants/${tenantId}/corporate-learning/assignments/${assignmentId}`, data);
  return res.data?.data || res.data;
};

export const deleteCorporateLearningAssignmentApi = async (tenantId: string, assignmentId: string) => {
  const res = await api.delete(`/tenants/${tenantId}/corporate-learning/assignments/${assignmentId}`);
  return res.data?.data || res.data;
};

export interface AssignedLearningItem {
  id: string;
  title: string;
  type: "course" | "career-path";
  dueDate?: string | null;
  requirement?: string;
  isCompleted: boolean;
  completedAt?: string | null;
  progress?: number;
  status?: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  thumbnailUrl?: string | null;
  completedLessons?: number;
  totalLessons?: number;
  completedCourses?: number;
  totalCourses?: number;
  lastAccessedAt?: string | null;
  startedAt?: string | null;
}

export interface UserDashboardStats {
  assignedCoursesCount: number;
  completedCount: number;
  hoursLearned: number;
  totalSpentTimeSecs: number;
  enrolledCourseIds?: string[];
  enrolledCareerPathIds?: string[];
  assignedItems?: AssignedLearningItem[];
  inProgressItems?: AssignedLearningItem[];
  notStartedItems?: AssignedLearningItem[];
}

export const getUserDashboardStatsApi = async (
  tenantId?: string,
  userId?: string
): Promise<UserDashboardStats> => {
  if (tenantId && userId) {
    try {
      const res = await api.get(
        `/tenants/${tenantId}/corporate-learning/users/${userId}/dashboard-stats`
      );
      return res.data?.data || res.data;
    } catch (e) {
      console.warn("Falling back to /dashboard/user-stats", e);
    }
  }
  const res = await api.get(`/dashboard/user-stats`);
  return res.data?.data || res.data;
};