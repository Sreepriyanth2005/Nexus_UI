// src/hooks/review-queue/useSmeReviewQueue.ts

import { useQuery } from "@tanstack/react-query";
import { smeReviewQueueApi, mapReviewQueueViewModel } from "../../core/api/review-queue/smeReviewQueue.api";

export const useReviewQueue = (reviewerId: string, status?: string, page: number = 1, limit: number = 100) => {
  return useQuery({
    queryKey: ["sme-review-queue", reviewerId, status, page, limit],
    queryFn: async () => {
      const res = await smeReviewQueueApi.getReviewQueue(reviewerId, status, page, limit);
      const items = await mapReviewQueueViewModel(res.data);
      return {
        items,
        total: res.total,
      };
    },
    enabled: !!reviewerId,
  });
};

export const useReviewQueueStatistics = (reviewerId: string) => {
  return useQuery({
    queryKey: ["sme-review-queue-statistics", reviewerId],
    queryFn: () => smeReviewQueueApi.getReviewQueueStatistics(reviewerId),
    enabled: !!reviewerId,
  });
};
