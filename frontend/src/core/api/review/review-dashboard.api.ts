import { api } from "../../../config/axios";

import type {
  ReviewDashboard,
  ReviewStatistics,
} from "../../../types/review.types";

/* -------------------------------------------------------------------------- */
/*                              RESPONSE HELPER                               */
/* -------------------------------------------------------------------------- */

const unwrap = <T>(response: any): T => {
  return response.data?.data ?? response.data;
};

/* -------------------------------------------------------------------------- */
/*                           DASHBOARD SUMMARY                                */
/* -------------------------------------------------------------------------- */

export const getReviewDashboardApi = async (): Promise<ReviewDashboard> => {
  const response = await api.get("/review/dashboard");
  return unwrap<ReviewDashboard>(response);
};

/* -------------------------------------------------------------------------- */
/*                             DASHBOARD STATS                                */
/* -------------------------------------------------------------------------- */

export const getReviewStatisticsApi = async (): Promise<ReviewStatistics> => {
  const response = await api.get("/review/statistics");
  return unwrap<ReviewStatistics>(response);
};

export const getAuthorContentStatsApi = async (): Promise<{
  published: number;
  draft: number;
  inReview: number;
  rejected: number;
  archived: number;
  approved: number;
  submitted: number;
  reviewRejected: number;
}> => {
  const response = await api.get("/review/author-stats");
  return unwrap(response);
};