import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  isLearningContentVisible,
  memberLearningApi,
} from "../../core/api/member-learning/memberLearningApi";
import { progressApi } from "../../core/api/progress/progress.api";

export const memberLearningKeys = {
  all: ["memberLearning"] as const,
  lists: () => [...memberLearningKeys.all, "list"] as const,
  list: (
    userId: string,
    activeTab: string,
    filters: any,
    search: string,
    sortBy: string,
    page: number,
    limit: number
  ) =>
    [
      ...memberLearningKeys.lists(),
      { userId, activeTab, filters, search, sortBy, page, limit },
    ] as const,
  stats: (userId: string) => [...memberLearningKeys.all, "stats", userId] as const,
  dashboard: (userId: string) => [...memberLearningKeys.all, "dashboard", userId] as const,
};

export const useMemberLearningCourses = (
  userId: string,
  activeTab: string,
  filters: any,
  search: string,
  sortBy: string,
  page: number,
  limit: number,
  enabled = true,
  role?: string,
  tenantId?: string
) => {
  const query = useQuery({
    queryKey: ["memberLearning", "raw", userId, tenantId, role],
    queryFn: () => memberLearningApi.getRawLearningData(userId, role, tenantId),
    enabled: enabled && !!userId,
    staleTime: 30 * 1000, // 30 seconds cache for fast updates
  });

  const filteredData = useMemo(() => {
    if (!query.data) return undefined;
    
    // First, filter by visibility and role
    const visibilityFilteredData = query.data.filter((item: any) =>
      isLearningContentVisible(item, role, tenantId)
    );

    return memberLearningApi.filterLearningData(
      visibilityFilteredData,
      activeTab,
      filters,
      search,
      sortBy,
      page,
      limit
    );
  }, [query.data, activeTab, filters, search, sortBy, page, limit, role, tenantId]);

  return {
    ...query,
    data: filteredData,
    rawData: query.data,
  };
};

export const useEnrollCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) => memberLearningApi.enrollInCourse(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberLearningKeys.all });
    },
  });
};

export const useCourseProgress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, progress }: { courseId: string; progress: number }) =>
      memberLearningApi.updateCourseProgress(courseId, progress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberLearningKeys.all });
    },
  });
};

export const useWishlist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entityId, entityType }: { entityId: string; entityType?: string }) => 
      memberLearningApi.toggleWishlist(entityId, entityType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberLearningKeys.all });
    },
  });
};

export const useLearningStatistics = (userId: string, enabled = true) => {
  return useQuery({
    queryKey: memberLearningKeys.stats(userId),
    queryFn: () => memberLearningApi.getLearningStatistics(userId),
    enabled: enabled && !!userId,
  });
};

export const useCompletedCourses = (userId: string, enabled = true) => {
  return useQuery({
    queryKey: ["completedCourses", userId],
    queryFn: () => memberLearningApi.getCompletedCertificates(userId),
    enabled: enabled && !!userId,
  });
};

export const useProgressDashboard = (userId: string, enabled = true) => {
  return useQuery({
    queryKey: memberLearningKeys.dashboard(userId),
    queryFn: () => progressApi.getDashboard(),
    enabled: enabled && !!userId,
  });
};
