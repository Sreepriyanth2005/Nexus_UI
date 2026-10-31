import { useQuery } from "@tanstack/react-query";

import { contentDeveloperDashboardApi } from "../../core/api/content-developer-workspace/contentDeveloperDashboard.api";

export const developerDashboardKeys = {
  all: ["developerDashboard"] as const,

  courses: (userId?: string) =>
    [...developerDashboardKeys.all, "courses", userId] as const,

  lessons: (userId?: string) =>
    [...developerDashboardKeys.all, "lessons", userId] as const,

  careerPaths: (userId?: string) =>
    [...developerDashboardKeys.all, "careerPaths", userId] as const,

  statistics: (userId?: string) =>
    [...developerDashboardKeys.all, "statistics", userId] as const,

  dashboard: (userId?: string) =>
    [...developerDashboardKeys.all, "dashboard", userId] as const,

  reviewInbox: (entityType: string, entityId: string) =>
    [
      ...developerDashboardKeys.all,
      "reviewInbox",
      entityType,
      entityId,
    ] as const,
};

// Content Developer workspace: staleTime: 0 + refetchOnMount: "always" is intentional.
// CD must always see the latest content status (drafts, review state, etc.) on mount.
export const useDeveloperCourses = (userId?: string) => {
  return useQuery({
    queryKey: developerDashboardKeys.courses(userId),
    queryFn: () =>
      contentDeveloperDashboardApi.getContentDeveloperCourses(userId),
    enabled: !!userId,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    retry: 1,
  });
};

export const useDeveloperLessons = (userId?: string) => {
  return useQuery({
    queryKey: developerDashboardKeys.lessons(userId),
    queryFn: () =>
      contentDeveloperDashboardApi.getContentDeveloperLessons(userId),
    enabled: !!userId,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    retry: 1,
  });
};

export const useDeveloperCareerPaths = (userId?: string) => {
  return useQuery({
    queryKey: developerDashboardKeys.careerPaths(userId),
    queryFn: () =>
      contentDeveloperDashboardApi.getContentDeveloperCareerPaths(userId),
    enabled: !!userId,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    retry: 1,
  });
};

export const useDeveloperReviewInbox = (
  entityType: string,
  entityId: string
) => {
  return useQuery({
    queryKey: developerDashboardKeys.reviewInbox(entityType, entityId),
    queryFn: () =>
      contentDeveloperDashboardApi.getDeveloperReviewInbox(
        entityType,
        entityId
      ),
    enabled: !!entityType && !!entityId,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    retry: 1,
  });
};

export const useWorkspaceStatistics = (userId?: string) => {
  return useQuery({
    queryKey: developerDashboardKeys.statistics(userId),
    queryFn: () =>
      contentDeveloperDashboardApi.getWorkspaceStatistics(userId),
    enabled: !!userId,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    retry: 1,
  });
};

export const useWorkspaceDashboard = (userId?: string) => {
  return useQuery({
    queryKey: developerDashboardKeys.dashboard(userId),
    queryFn: () => contentDeveloperDashboardApi.getWorkspaceDashboard(userId),
    enabled: !!userId,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    retry: 1,
  });
};
