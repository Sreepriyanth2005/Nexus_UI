// src/core/api/review-queue/smeDashboard.api.ts

import { reviewQueueApi, mapReviewQueueToViewModel } from "./reviewQueue.api";
import { smeReviewProgressService } from "../../services/smeReviewProgress.service";
import {
  DashboardStatistic,
  AssignedReviewQueueItem,
  RecentlyReviewedItem,
} from "../../../types/smeDashboard.types";

// -----------------------------------------------------------------------------
// Helper: Relative Time
// -----------------------------------------------------------------------------
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();

  if (isNaN(date.getTime())) return "Unknown";

  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMs < 0 || diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "1d ago";

  return `${diffDays}d ago`;
}

// -----------------------------------------------------------------------------
// SME Dashboard API
// -----------------------------------------------------------------------------
export const smeDashboardApi = {
  /**
   * Dashboard Statistics
   */
  async getDashboardStatistics(
    reviewerId: string
  ): Promise<DashboardStatistic[]> {
    const res = await reviewQueueApi.getReviewQueue(
      reviewerId,
      undefined,
      1,
      100
    );

    const rawItems = res.data;

    let pendingCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;

    rawItems.forEach((item) => {
      switch (item.status) {
        case "PENDING":
          pendingCount++;
          break;

        case "APPROVED":
          approvedCount++;
          break;

        case "REJECTED":
          rejectedCount++;
          break;
      }
    });

    // Real active in-progress reviews count
    const inProgressIds = smeReviewProgressService.getInProgressList();
    const inProgressCount = rawItems.filter(
      (item) => item.status === "PENDING" && inProgressIds.includes(item.id)
    ).length;

    // Real average turnaround calculation
    const resolved = rawItems.filter(
      (item) =>
        (item.status === "APPROVED" || item.status === "REJECTED") &&
        item.submittedAt &&
        item.reviewedAt
    );
    let avgTurnaroundValue = "0";
    if (resolved.length > 0) {
      const totalDays = resolved.reduce((acc, item) => {
        const diff =
          new Date(item.reviewedAt!).getTime() -
          new Date(item.submittedAt).getTime();
        return acc + Math.max(0, diff / (1000 * 60 * 60 * 24));
      }, 0);
      avgTurnaroundValue = (totalDays / resolved.length).toFixed(1);
    }

    return [
      {
        label: "Awaiting Review",
        value: String(pendingCount),
        accent: true,
      },
      {
        label: "In Progress",
        value: String(inProgressCount),
      },
      {
        label: "Approved (All-Time)",
        value: String(approvedCount),
      },
      {
        label: "Avg Turnaround",
        value: avgTurnaroundValue,
        unit: "days",
      },
      {
        label: "SLA Target",
        value: "3",
        unit: "days",
      },
    ];
  },

  /**
   * Pending Queue
   */
  async getAssignedReviewQueue(
    reviewerId: string
  ): Promise<AssignedReviewQueueItem[]> {
    const pendingItems = await reviewQueueApi.getPendingReviews(reviewerId);

    return pendingItems.map(
      (item): AssignedReviewQueueItem => {
        const waitDays = parseInt(item.waitTime) || 0;

        let priority: "High" | "Medium" | "Normal" = "Normal";

        if (waitDays >= 5) {
          priority = "High";
        } else if (waitDays >= 2) {
          priority = "Medium";
        }

        return {
          id: item.id,
          course: item.title,
          submittedBy: item.submittedBy,
          domain: item.typeTag || "",
          waiting:
            item.waitTime === "Approved" ||
            item.waitTime === "Rejected"
              ? "1 day"
              : `${item.waitTime} waiting`,
          priority,
          type: item.type || "course",
        };
      }
    );
  },

  /**
   * Recently Reviewed
   */
  async getRecentlyReviewed(
    reviewerId: string
  ): Promise<RecentlyReviewedItem[]> {
    try {
      const res = await reviewQueueApi.getReviewQueue(
        reviewerId,
        undefined,
        1,
        100
      );

      const rawItems = res.data;

      const reviewed = rawItems.filter(
        (item) =>
          item.status === "APPROVED" ||
          item.status === "REJECTED"
      );

      const mapped = await Promise.all(
        reviewed.slice(0, 4).map(async (item) => {
          const [mappedItem] = await mapReviewQueueToViewModel([item]);

          return {
            title: mappedItem.title,
            reviewer: mappedItem.submittedBy,
            status:
              item.status === "APPROVED"
                ? ("Approved" as const)
                : ("Rejected" as const),
            time: formatRelativeTime(
              item.reviewedAt || item.submittedAt
            ),
            dot:
              item.status === "APPROVED"
                ? ("green" as const)
                : ("red" as const),
          };
        })
      );

      return mapped;
    } catch (error) {
      console.warn("Could not load recently reviewed logs", error);
      return [];
    }
  },
};