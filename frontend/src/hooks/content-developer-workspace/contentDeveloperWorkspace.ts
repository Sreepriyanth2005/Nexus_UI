import { useQuery } from "@tanstack/react-query";
import { contentDeveloperWorkspaceApi } from "../../core/api/content-developer-workspace/contentDeveloperWorkspace.api";

export const workspaceKeys = {
  all: ["workspace"] as const,
  dashboard: () => [...workspaceKeys.all, "dashboard"] as const,
  stats: () => [...workspaceKeys.all, "stats"] as const,
  courses: () => [...workspaceKeys.all, "courses"] as const,
  careerPaths: () => [...workspaceKeys.all, "careerPaths"] as const,
  lessons: () => [...workspaceKeys.all, "lessons"] as const,
  activities: () => [...workspaceKeys.all, "activities"] as const,
};

export const useWorkspaceDashboard = () => {
  return useQuery({
    queryKey: workspaceKeys.dashboard(),
    queryFn: () => contentDeveloperWorkspaceApi.getWorkspaceDashboard(),
  });
};

export const useWorkspaceStatistics = () => {
  return useQuery({
    queryKey: workspaceKeys.stats(),
    queryFn: () => contentDeveloperWorkspaceApi.getWorkspaceStatistics(),
  });
};

export const useWorkspaceCourses = () => {
  return useQuery({
    queryKey: workspaceKeys.courses(),
    queryFn: () => contentDeveloperWorkspaceApi.getWorkspaceCourses(),
  });
};

export const useWorkspaceCareerPaths = () => {
  return useQuery({
    queryKey: workspaceKeys.careerPaths(),
    queryFn: () => contentDeveloperWorkspaceApi.getWorkspaceCareerPaths(),
  });
};

export const useWorkspaceLessons = () => {
  return useQuery({
    queryKey: workspaceKeys.lessons(),
    queryFn: () => contentDeveloperWorkspaceApi.getWorkspaceLessons(),
  });
};

export const useRecentActivities = () => {
  return useQuery({
    queryKey: workspaceKeys.activities(),
    queryFn: () => contentDeveloperWorkspaceApi.getRecentActivities(),
  });
};

