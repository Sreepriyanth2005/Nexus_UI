import { contentDeveloperDashboardApi } from "./contentDeveloperDashboard.api";
import {
  WorkspaceCourseDto,
  WorkspaceStatisticsDto,
  RecentActivityDto,
  WorkspaceDashboardDto,
} from "./contentDeveloperWorkspace.types";

/**
 * Legacy API facade re-routed to 100% real database/API methods in contentDeveloperDashboardApi
 */
export const contentDeveloperWorkspaceApi = {
  getWorkspaceCourses: (userId?: string): Promise<WorkspaceCourseDto[]> =>
    contentDeveloperDashboardApi.getContentDeveloperCourses(userId),

  getWorkspaceCareerPaths: (userId?: string): Promise<WorkspaceCourseDto[]> =>
    contentDeveloperDashboardApi.getContentDeveloperCareerPaths(userId),

  getWorkspaceLessons: (userId?: string): Promise<WorkspaceCourseDto[]> =>
    contentDeveloperDashboardApi.getContentDeveloperLessons(userId),

  getUnifiedItems: (userId?: string): Promise<WorkspaceCourseDto[]> =>
    contentDeveloperDashboardApi.getUnifiedItems(userId),

  getWorkspaceStatistics: (userId?: string): Promise<WorkspaceStatisticsDto> =>
    contentDeveloperDashboardApi.getWorkspaceStatistics(userId),

  getRecentActivities: (userId?: string): Promise<RecentActivityDto[]> =>
    contentDeveloperDashboardApi.getWorkspaceDashboardFeedback(userId),

  getWorkspaceDashboard: async (userId?: string): Promise<WorkspaceDashboardDto> => {
    return contentDeveloperDashboardApi.getWorkspaceDashboard(userId);
  },
};
