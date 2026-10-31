import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminLearningPathsApi } from "../../core/api/admin-learning-paths/adminLearningPaths.api";
import {
  publishCareerPathApi,
  unpublishCareerPathApi,
  deleteCareerPathApi,
} from "../../core/api/career-path/career-path.api";

export const adminLearningPathsKeys = {
  all: ["admin-learning-paths"] as const,
  lists: () => [...adminLearningPathsKeys.all, "list"] as const,
  list: (params?: any) => [...adminLearningPathsKeys.lists(), params] as const,
  details: () => [...adminLearningPathsKeys.all, "detail"] as const,
  detail: (id: string) => [...adminLearningPathsKeys.details(), id] as const,
  stats: () => [...adminLearningPathsKeys.all, "stats"] as const,
};

export const useAdminLearningPaths = (params?: any) => {
  return useQuery({
    queryKey: adminLearningPathsKeys.list(params),
    queryFn: () => adminLearningPathsApi.getLearningPaths(params),
    placeholderData: (prev) => prev,
  });
};

export const useAdminLearningPath = (id: string) => {
  return useQuery({
    queryKey: adminLearningPathsKeys.detail(id),
    queryFn: () => adminLearningPathsApi.getLearningPath(id),
    enabled: !!id,
  });
};

export const useLearningPathStatistics = () => {
  return useQuery({
    queryKey: adminLearningPathsKeys.stats(),
    queryFn: () => adminLearningPathsApi.getLearningPathStatistics(),
  });
};

export const useAdminLearningPathMutations = () => {
  const queryClient = useQueryClient();

  const publishMutation = useMutation({
    mutationFn: publishCareerPathApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminLearningPathsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: adminLearningPathsKeys.stats() });
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: unpublishCareerPathApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminLearningPathsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: adminLearningPathsKeys.stats() });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCareerPathApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminLearningPathsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: adminLearningPathsKeys.stats() });
    },
  });

  return {
    publishMutation,
    unpublishMutation,
    deleteMutation,
  };
};
