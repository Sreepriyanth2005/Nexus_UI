import { useQuery } from "@tanstack/react-query";
import { smeDashboardApi } from "../../core/api/review-queue/smeDashboard.api";

export const smeDashboardKeys = {
  all: ["smeDashboard"] as const,
  stats: (reviewerId: string) => [...smeDashboardKeys.all, "stats", reviewerId] as const,
  queue: (reviewerId: string) => [...smeDashboardKeys.all, "queue", reviewerId] as const,
  recentlyReviewed: (reviewerId: string) => [...smeDashboardKeys.all, "recentlyReviewed", reviewerId] as const,
};

export const useDashboardStatistics = (reviewerId: string) => {
  return useQuery({
    queryKey: smeDashboardKeys.stats(reviewerId),
    queryFn: () => smeDashboardApi.getDashboardStatistics(reviewerId),
    enabled: !!reviewerId,
  });
};

export const useAssignedReviewQueue = (reviewerId: string) => {
  return useQuery({
    queryKey: smeDashboardKeys.queue(reviewerId),
    queryFn: () => smeDashboardApi.getAssignedReviewQueue(reviewerId),
    enabled: !!reviewerId,
  });
};

export const useRecentlyReviewed = (reviewerId: string) => {
  return useQuery({
    queryKey: smeDashboardKeys.recentlyReviewed(reviewerId),
    queryFn: () => smeDashboardApi.getRecentlyReviewed(reviewerId),
    enabled: !!reviewerId,
  });
};
