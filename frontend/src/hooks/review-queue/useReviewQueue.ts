// src/hooks/review-queue/useReviewQueue.ts

import { useQuery } from "@tanstack/react-query";
import { reviewQueueApi, mapReviewQueueToViewModel } from "../../core/api/review-queue/reviewQueue.api";

export const useReviewQueue = (reviewerId: string, status?: string) => {
  return useQuery({
    queryKey: ["review-queue", reviewerId, status],
    queryFn: async () => {
      const res = await reviewQueueApi.getReviewQueue(reviewerId, status, 1, 100);
      return mapReviewQueueToViewModel(res.data);
    },
    enabled: !!reviewerId,
  });
};

export const usePendingReviews = (reviewerId: string) => {
  return useQuery({
    queryKey: ["review-queue-pending", reviewerId],
    queryFn: () => reviewQueueApi.getPendingReviews(reviewerId),
    enabled: !!reviewerId,
  });
};

export const useApprovedReviews = (reviewerId: string) => {
  return useQuery({
    queryKey: ["review-queue-approved", reviewerId],
    queryFn: () => reviewQueueApi.getApprovedReviews(reviewerId),
    enabled: !!reviewerId,
  });
};

export const useRejectedReviews = (reviewerId: string) => {
  return useQuery({
    queryKey: ["review-queue-rejected", reviewerId],
    queryFn: () => reviewQueueApi.getRejectedReviews(reviewerId),
    enabled: !!reviewerId,
  });
};

export const useReviewQueueStatistics = (reviewerId: string) => {
  return useQuery({
    queryKey: ["review-queue-statistics", reviewerId],
    queryFn: () => reviewQueueApi.getReviewStatistics(reviewerId),
    enabled: !!reviewerId,
  });
};
