import { useQuery } from "@tanstack/react-query";

import {
  getReviewDashboardApi,
  getReviewStatisticsApi,
  getAuthorContentStatsApi,
} from "../../core/api/review/review-dashboard.api";

/* -------------------------------------------------------------------------- */
/*                                   KEYS                                     */
/* -------------------------------------------------------------------------- */

export const reviewDashboardKeys = {
  all: ["review-dashboard"] as const,

  dashboard: () =>
    [...reviewDashboardKeys.all, "dashboard"] as const,

  statistics: () =>
    [...reviewDashboardKeys.all, "statistics"] as const,
};

/* -------------------------------------------------------------------------- */
/*                               QUERY CONFIG                                 */
/* -------------------------------------------------------------------------- */

const defaultQueryOptions = {
  staleTime: 1000 * 60, // 1 minute
  gcTime: 1000 * 60 * 5, // 5 minutes
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  retry: 1,
};

/* -------------------------------------------------------------------------- */
/*                              DASHBOARD                                     */
/* -------------------------------------------------------------------------- */

export const useReviewDashboard = () =>
  useQuery({
    queryKey: reviewDashboardKeys.dashboard(),
    queryFn: getReviewDashboardApi,
    ...defaultQueryOptions,
  });

/* -------------------------------------------------------------------------- */
/*                              STATISTICS                                    */
/* -------------------------------------------------------------------------- */

export const useReviewStatistics = () =>
  useQuery({
    queryKey: reviewDashboardKeys.statistics(),
    queryFn: getReviewStatisticsApi,
    ...defaultQueryOptions,
  });

export const useAuthorContentStats = () =>
  useQuery({
    queryKey: [...reviewDashboardKeys.all, "author-stats"] as const,
    queryFn: getAuthorContentStatsApi,
    ...defaultQueryOptions,
  });