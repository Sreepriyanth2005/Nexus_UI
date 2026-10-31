// src/core/api/review-queue/reviewQueue.api.ts

import { api } from "../../../config/axios";
import { ReviewQueueDto, ReviewQueueItem, ReviewQueueStatistics } from "./reviewQueue.types";

const detailsCache = new Map<string, Promise<{ title: string; type: string; typeTag: string; lessonsDetail: string }>>();

function fetchEntityDetailsCached(entityType: string, entityId: string): Promise<{ title: string; type: string; typeTag: string; lessonsDetail: string }> {
  const cacheKey = `${entityType}:${entityId}`;
  if (detailsCache.has(cacheKey)) {
    return detailsCache.get(cacheKey)!;
  }

  let promise: Promise<{ title: string; type: string; typeTag: string; lessonsDetail: string }>;

  if (entityType === "COURSE") {
    promise = Promise.all([
      api.get(`/courses/${entityId}`).then(res => res.data?.data || res.data),
      api.get(`/courses/${entityId}/lessons`).then(res => res.data?.lessons || res.data?.data || [])
    ]).then(([course, lessons]) => {
      return {
        title: course?.title || "Unknown Course",
        type: "Course",
        typeTag: course?.publishType || "KMP",
        lessonsDetail: `${lessons.length || 0} · ${course?.duration || 0} min`,
      };
    }).catch(err => {
      console.error(`Failed to fetch details for course ${entityId}:`, err);
      return { title: "Unknown Course", type: "Course", typeTag: "KMP", lessonsDetail: "0 · 0 min" };
    });
  } else if (entityType === "LESSON") {
    promise = api.get(`/lessons/${entityId}`).then(res => {
      const lesson = res.data?.data || res.data;
      return {
        title: lesson?.title || "Unknown Lesson",
        type: "Lesson",
        typeTag: lesson?.isStandalone ? "Standalone" : "Attached",
        lessonsDetail: `1 · ${lesson?.duration || 0} min`,
      };
    }).catch(err => {
      console.error(`Failed to fetch details for lesson ${entityId}:`, err);
      return { title: "Unknown Lesson", type: "Lesson", typeTag: "Standalone", lessonsDetail: "1 · 0 min" };
    });
  } else if (entityType === "CAREER_PATH") {
    promise = api.get(`/career-paths/${entityId}`).then(res => {
      const cp = res.data?.data || res.data;
      return {
        title: cp?.title || "Unknown Career Path",
        type: "Career Path",
        typeTag: cp?.difficulty || "CDMP",
        lessonsDetail: `0 · ${cp?.estimatedDuration || 0} min`,
      };
    }).catch(err => {
      console.error(`Failed to fetch details for career path ${entityId}:`, err);
      return { title: "Unknown Career Path", type: "Career Path", typeTag: "CDMP", lessonsDetail: "0 · 0 min" };
    });
  } else {
    promise = Promise.resolve({
      title: "Unknown Entity",
      type: entityType,
      typeTag: "",
      lessonsDetail: "",
    });
  }

  detailsCache.set(cacheKey, promise);
  return promise;
}

export async function mapReviewQueueToViewModel(rawItems: ReviewQueueDto[]): Promise<ReviewQueueItem[]> {
  return Promise.all(
    rawItems.map(async (item) => {
      const details = await fetchEntityDetailsCached(item.entityType, item.entityId);

      const dateObj = new Date(item.submittedAt);
      const submittedDate = dateObj.toISOString().split("T")[0];
      const timestamp = dateObj.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" }) + " GST";

      const firstName = item.submittedBy?.firstName || "";
      const lastName = item.submittedBy?.lastName || "";
      const submittedBy = `${firstName} ${lastName}`.trim() || item.submittedBy?.email || "Unknown Submitter";

      let waitTime = "Approved";
      if (item.status === "PENDING") {
        const diffMs = Date.now() - dateObj.getTime();
        const diffHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
        const diffDays = Math.floor(diffHours / 24);
        if (diffHours < 24) {
          waitTime = `${diffHours}h`;
        } else {
          waitTime = `${diffDays}d`;
        }
      } else if (item.status === "REJECTED") {
        waitTime = "Rejected";
      }

      return {
        id: item.entityId,
        reviewId: item.id,
        submittedDate,
        timestamp,
        submittedBy,
        title: details.title,
        type: details.type,
        typeTag: details.typeTag,
        lessonsDetail: details.lessonsDetail,
        waitTime,
      };
    })
  );
}

export const reviewQueueApi = {
  async getReviewQueue(
    reviewerId: string,
    status?: string,
    page: number = 1,
    limit: number = 100
  ): Promise<{ data: ReviewQueueDto[]; total: number }> {
    const res = await api.get(`/reviews/reviewer/${reviewerId}/queue`, {
      params: { status: status?.toUpperCase(), page, limit }
    });
    return {
      data: res.data?.data || [],
      total: res.data?.total || 0,
    };
  },

  async getPendingReviews(reviewerId: string): Promise<ReviewQueueItem[]> {
    const res = await this.getReviewQueue(reviewerId, "PENDING", 1, 100);
    return mapReviewQueueToViewModel(res.data);
  },

  async getApprovedReviews(reviewerId: string): Promise<ReviewQueueItem[]> {
    const res = await this.getReviewQueue(reviewerId, "APPROVED", 1, 100);
    return mapReviewQueueToViewModel(res.data);
  },

  async getRejectedReviews(reviewerId: string): Promise<ReviewQueueItem[]> {
    const res = await this.getReviewQueue(reviewerId, "REJECTED", 1, 100);
    return mapReviewQueueToViewModel(res.data);
  },

  async getReviewStatistics(reviewerId: string): Promise<ReviewQueueStatistics> {
    const res = await this.getReviewQueue(reviewerId, undefined, 1, 100);
    const rawItems = res.data;

    let pendingCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;

    for (const item of rawItems) {
      if (item.status === "PENDING") pendingCount++;
      else if (item.status === "APPROVED") approvedCount++;
      else if (item.status === "REJECTED") rejectedCount++;
    }

    return { pendingCount, approvedCount, rejectedCount };
  }
};
