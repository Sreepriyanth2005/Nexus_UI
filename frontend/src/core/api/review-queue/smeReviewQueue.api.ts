// src/core/api/review-queue/smeReviewQueue.api.ts

import { api } from "../../../config/axios";
import { ReviewQueueDto, ReviewQueueItem } from "./reviewQueue.types";

export interface SmeReviewQueueStatistics {
  pending: number;
  approved: number;
  rejected: number;
  approvedThisMonth: number;
}

let subjectsList: { id: string; name: string }[] = [];
let subjectsPromise: Promise<any> | null = null;

function ensureSubjectsFetched() {
  if (subjectsList.length > 0) return Promise.resolve(subjectsList);
  if (subjectsPromise) return subjectsPromise;

  subjectsPromise = api.get("/subjects")
    .then((res) => {
      const data = res.data?.data || res.data || [];
      subjectsList = data;
      return subjectsList;
    })
    .catch((err) => {
      console.error("Failed to fetch subjects:", err);
      return [];
    });
  return subjectsPromise;
}

function formatVisibility(vis?: string): string {
  if (!vis) return "Public";
  const v = vis.toUpperCase();
  if (v === "PUBLIC" || v === "PUBLIC_CATALOG") return "Public";
  if (v === "TENANT" || v === "TENANT_ONLY" || v === "PRIVATE") return "Tenant";
  if (v === "PUBLIC_AND_TENANT" || v === "PUBLIC_TENANT") return "Public & Tenant";
  return vis;
}

const detailsCache = new Map<string, Promise<{
  title: string;
  type: string;
  typeTag: string;
  lessonsDetail: string;
  duration: string;
  visibility: string;
  subjectId: string;
  subjectName: string;
}>>();

function fetchEntityDetailsCached(
  entityType: string,
  entityId: string
): Promise<{
  title: string;
  type: string;
  typeTag: string;
  lessonsDetail: string;
  duration: string;
  visibility: string;
  subjectId: string;
  subjectName: string;
  thumbnailAssetId?: string;
}> {
  const cacheKey = `${entityType}:${entityId}`;
  if (detailsCache.has(cacheKey)) {
    return detailsCache.get(cacheKey)!;
  }

  let promise: Promise<{
    title: string;
    type: string;
    typeTag: string;
    lessonsDetail: string;
    duration: string;
    visibility: string;
    subjectId: string;
    subjectName: string;
    thumbnailAssetId?: string;
  }>;

  if (entityType === "COURSE") {
    promise = Promise.all([
      api.get(`/courses/${entityId}`).then((res) => res.data?.data || res.data),
      api.get(`/courses/${entityId}/lessons`).then((res) => res.data?.lessons || res.data?.data || []),
      ensureSubjectsFetched(),
    ])
      .then(([course, lessons, subjects]) => {
        const subId = course?.subjectId || course?.subjects?.[0]?.subjectId || (course?.subjects?.[0] && (typeof course.subjects[0] === 'string' ? course.subjects[0] : course.subjects[0].id));
        const subObj = subjects.find((s: any) => s.id === subId);
        const subjectName = course?.subject?.name || subObj?.name || "";

        return {
          title: course?.title || "Unknown Course",
          type: "Course",
          typeTag: course?.publishType || "",
          lessonsDetail: `${lessons.length || 0} · ${course?.duration || 0} min`,
          duration: course?.duration ? `${course.duration} min` : "0 min",
          visibility: formatVisibility(course?.visibility),
          subjectId: subId || "",
          subjectName,
          thumbnailAssetId: course?.thumbnailAssetId,
        };
      })
      .catch((err) => {
        if (err.response?.status === 403) {
          console.warn(`Permission denied (403) for course ${entityId}. Falling back to default values.`);
        } else {
          console.error(`Failed to fetch details for course ${entityId}:`, err);
        }
        return {
          title: "Unknown Course",
          type: "Course",
          typeTag: "",
          lessonsDetail: "0 · 0 min",
          duration: "0 min",
          visibility: "Public",
          subjectId: "",
          subjectName: "",
        };
      });
  } else if (entityType === "LESSON") {
    promise = Promise.all([
      api.get(`/lessons/${entityId}`).then((res) => res.data?.data || res.data),
      ensureSubjectsFetched(),
    ])
      .then(([lesson, subjects]) => {
        const subId = lesson?.subjectId || lesson?.categoryId;
        const subObj = subjects.find((s: any) => s.id === subId);
        const subjectName = lesson?.subject?.name || subObj?.name || "";

        return {
          title: lesson?.title || "Unknown Lesson",
          type: "Lesson",
          typeTag: lesson?.isStandalone ? "Standalone" : "Attached",
          lessonsDetail: `1 · ${lesson?.duration || 0} min`,
          duration: lesson?.duration ? `${lesson.duration} min` : "0 min",
          visibility: formatVisibility(lesson?.visibility),
          subjectId: subId || "",
          subjectName,
          thumbnailAssetId: lesson?.thumbnailAssetId,
        };
      })
      .catch((err) => {
        if (err.response?.status === 403) {
          console.warn(`Permission denied (403) for lesson ${entityId}. Falling back to default values.`);
        } else {
          console.error(`Failed to fetch details for lesson ${entityId}:`, err);
        }
        return {
          title: "Unknown Lesson",
          type: "Lesson",
          typeTag: "Standalone",
          lessonsDetail: "1 · 0 min",
          duration: "0 min",
          visibility: "Public",
          subjectId: "",
          subjectName: "",
        };
      });
  } else if (entityType === "CAREER_PATH") {
    promise = Promise.all([
      api.get(`/career-paths/${entityId}`).then((res) => res.data?.data || res.data),
      ensureSubjectsFetched(),
    ])
      .then(([cp, subjects]) => {
        const subId = cp?.subjectId;
        const subObj = subjects.find((s: any) => s.id === subId);
        const subjectName = cp?.subject?.name || subObj?.name || "";

        return {
          title: cp?.title || "Unknown Career Path",
          type: "Career Path",
          typeTag: cp?.difficulty || "",
          lessonsDetail: `0 · ${cp?.estimatedDuration || 0} min`,
          duration: cp?.estimatedDuration ? `${cp.estimatedDuration} min` : "0 min",
          visibility: formatVisibility(cp?.visibility),
          subjectId: subId || "",
          subjectName,
          thumbnailAssetId: cp?.thumbnailAssetId,
        };
      })
      .catch((err) => {
        if (err.response?.status === 403) {
          console.warn(`Permission denied (403) for career path ${entityId}. Falling back to default values.`);
        } else {
          console.error(`Failed to fetch details for career path ${entityId}:`, err);
        }
        return {
          title: "Unknown Career Path",
          type: "Career Path",
          typeTag: "",
          lessonsDetail: "0 · 0 min",
          duration: "0 min",
          visibility: "Public",
          subjectId: "",
          subjectName: "",
        };
      });
  } else {
    promise = Promise.resolve({
      title: "Unknown Entity",
      type: entityType,
      typeTag: "",
      lessonsDetail: "",
      duration: "0h",
      visibility: "Public",
      subjectId: "",
      subjectName: "",
    });
  }

  detailsCache.set(cacheKey, promise);
  return promise;
}

export async function mapReviewQueueViewModel(rawItems: ReviewQueueDto[]): Promise<ReviewQueueItem[]> {
  return Promise.all(
    rawItems.map(async (item) => {
      const details = await fetchEntityDetailsCached(item.entityType, item.entityId);

      const dateObj = new Date(item.submittedAt);
      const submittedDate = dateObj.toISOString().split("T")[0];
      const timestamp =
        dateObj.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" }) + " GST";

      const dueDateObj = new Date(item.submittedAt);
      dueDateObj.setDate(dueDateObj.getDate() + 3); // 3 days SLA target
      const dueDate = dueDateObj.toISOString().split("T")[0];

      const firstName = item.submittedBy?.firstName || "";
      const lastName = item.submittedBy?.lastName || "";
      const submittedBy = `${firstName} ${lastName}`.trim() || item.submittedBy?.email || "Unknown Submitter";

      const approverFirst = item.resolvedBy?.firstName || "";
      const approverLast = item.resolvedBy?.lastName || "";
      const approverRole = item.resolvedBy?.role ? ` (${item.resolvedBy.role})` : "";
      const approverName = `${approverFirst} ${approverLast}`.trim();
      const approvedBy = approverName ? `${approverName}${approverRole}` : (item.resolvedBy?.email ? `${item.resolvedBy.email}${approverRole}` : submittedBy);

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

      let approvedDate = undefined;
      if (item.reviewedAt) {
        approvedDate = new Date(item.reviewedAt).toISOString().split("T")[0];
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
        duration: details.duration,
        visibility: details.visibility,
        subject: details.subjectName,
        dueDate,
        waitTime,
        approvedDate,
        approvedBy,
        thumbnailAssetId: details.thumbnailAssetId,
        comment: item.comment || undefined,
        status: item.status,
        rawStatus: item.status,
        submittedAt: item.submittedAt,
        reviewedAt: item.reviewedAt || null,
        reviewerName: approvedBy,
        submitterName: submittedBy,
        rawDto: item,
      };
    })
  );
}

export const smeReviewQueueApi = {
  async getReviewQueue(
    reviewerId: string,
    status?: string,
    page: number = 1,
    limit: number = 100
  ): Promise<{ data: ReviewQueueDto[]; total: number }> {
    // Backend endpoint mapping fix
    const res = await api.get(`/reviews/reviewer/${reviewerId}/queue`, {
      params: { status: status?.toUpperCase(), page, limit },
    });

    // Deduplicate by entityId, keeping the most recent (assuming sort by submittedAt desc)
    let rawItems: ReviewQueueDto[] = res.data?.data || [];
    rawItems.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

    const uniqueMap = new Map<string, ReviewQueueDto>();
    for (const item of rawItems) {
      if (!uniqueMap.has(item.entityId)) {
        uniqueMap.set(item.entityId, item);
      }
    }
    const uniqueItems = Array.from(uniqueMap.values());

    return {
      data: uniqueItems,
      total: res.data?.total || uniqueItems.length,
    };
  },

  async getReviewQueueStatistics(reviewerId: string): Promise<SmeReviewQueueStatistics> {
    // Fetch a large page to get status counts
    const res = await this.getReviewQueue(reviewerId, undefined, 1, 100);
    const rawItems = res.data;

    let pending = 0;
    let approved = 0;
    let rejected = 0;
    let approvedThisMonth = 0;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    for (const item of rawItems) {
      if (item.status === "PENDING") {
        pending++;
      } else if (item.status === "APPROVED") {
        approved++;
        const reviewDate = item.reviewedAt ? new Date(item.reviewedAt) : null;
        if (reviewDate && reviewDate.getFullYear() === currentYear && reviewDate.getMonth() === currentMonth) {
          approvedThisMonth++;
        }
      } else if (item.status === "REJECTED") {
        rejected++;
      }
    }

    return {
      pending,
      approved,
      rejected,
      approvedThisMonth,
    };
  },
};
