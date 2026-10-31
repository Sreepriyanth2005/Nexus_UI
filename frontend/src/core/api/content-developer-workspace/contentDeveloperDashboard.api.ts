import { api } from "../../../config/axios";
import { courseApi } from "../course/course.api";
import { getLessonsApi } from "../lesson/lesson.api";
import { getCareerPathsApi } from "../career-path/career-path.api";
import { useUserStore } from "../../../store/user.store";
import {
  WorkspaceCourseDto,
  WorkspaceStatisticsDto,
  RecentActivityDto,
} from "./contentDeveloperWorkspace.types";

// Status mapping dictionary matching backend statuses
const statusMap: Record<
  string,
  {
    status: "changes" | "review" | "draft" | "published";
    label: string;
    action: "view-feedback" | "view" | "edit" | "none";
  }
> = {
  DRAFT: { status: "draft", label: "Draft", action: "edit" },
  SUBMITTED: { status: "review", label: "In SME review", action: "view" },
  UNDER_REVIEW: { status: "review", label: "In SME review", action: "view" },
  REVIEW_PENDING: { status: "review", label: "In SME review", action: "view" },
  UNDER_SME_REVIEW: { status: "review", label: "In SME review", action: "view" },
  APPROVED: { status: "review", label: "Approved", action: "view" },
  PUBLISHED: { status: "published", label: "Published", action: "view" },
  REJECTED: { status: "changes", label: "Changes requested", action: "view-feedback" },
  CHANGES_REQUESTED: { status: "changes", label: "Changes requested", action: "view-feedback" },
  ARCHIVED: { status: "draft", label: "Archived", action: "none" },
};

// Helper for formatting relative time
export function formatRelativeTime(dateString?: string | null): string {
  if (!dateString) return "Recently";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);

  if (isNaN(date.getTime())) return "Recently";
  if (diffMs < 0 || diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  if (diffMonths === 1) return "1 month ago";
  return `${diffMonths} months ago`;
}

export function readThumbnailUrl(item: any): string | undefined {
  const candidate = (
    item?.thumbnailAsset?.fileUrl ||
    item?.thumbnailAsset?.signedUrl ||
    item?.thumbnailAsset?.url ||
    item?.coverImageAsset?.fileUrl ||
    item?.coverImageAsset?.signedUrl ||
    item?.coverImageAsset?.url ||
    item?.contentAsset?.fileUrl ||
    item?.contentAsset?.url ||
    item?.courseAssets?.find?.((a: any) => a.assetRole === "THUMBNAIL" || a.assetRole === "COVER")?.asset?.fileUrl ||
    item?.courseAssets?.find?.((a: any) => a.assetRole === "THUMBNAIL" || a.assetRole === "COVER")?.asset?.url ||
    item?.pathAssets?.[0]?.asset?.fileUrl ||
    item?.pathAssets?.[0]?.asset?.url ||
    item?.lessonAssets?.find?.((a: any) => a.assetRole === "THUMBNAIL")?.asset?.fileUrl ||
    item?.lessonAssets?.find?.((a: any) => a.assetRole === "THUMBNAIL")?.asset?.url ||
    item?.thumbnailUrl ||
    item?.coverImageUrl ||
    item?.coverImage ||
    undefined
  );

  if (typeof candidate === "string" && candidate.trim()) {
    const trimmed = candidate.trim();
    // Only accept valid external, signed, blob, or API URLs — never raw storage paths like "thumbnails" or "cover"
    if (
      trimmed.startsWith("http://") ||
      trimmed.startsWith("https://") ||
      trimmed.startsWith("blob:") ||
      trimmed.startsWith("data:") ||
      trimmed.startsWith("/api/")
    ) {
      return trimmed;
    }
  }

  return undefined;
}

export function readAuthorName(item: any): string | undefined {
  if (item?.authorName && typeof item.authorName === "string" && item.authorName.trim()) {
    return item.authorName.trim();
  }
  if (typeof item?.author === "string" && item.author.trim()) {
    return item.author.trim();
  }
  return "Nexus Academy";
}

export function readDurationMinutes(item: any): number | undefined {
  const value = item?.durationMinutes ?? item?.duration ?? item?.estimatedDuration;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export const contentDeveloperDashboardApi = {
  getContentDeveloperCourses: async (userId?: string): Promise<WorkspaceCourseDto[]> => {
    const effectiveUserId = userId || useUserStore.getState().user?.id;
    try {
      const coursesRes = await courseApi.list({ ...(effectiveUserId ? { ownerId: effectiveUserId } : {}), limit: 100 } as any);
      const rawList = Array.isArray(coursesRes?.data)
        ? coursesRes.data
        : Array.isArray((coursesRes as any)?.data?.data)
          ? (coursesRes as any).data.data
          : Array.isArray((coursesRes as any)?.items)
            ? (coursesRes as any).items
            : [];

      const courses = rawList.map((c: any) => {
        const statusUpper = (c.status || "DRAFT").toUpperCase();
        const mapping = statusMap[statusUpper] || {
          status: "draft" as const,
          label: "Draft",
          action: "edit" as const,
        };
        const ratingVal = c.averageRating ?? c.rating;
        return {
          id: c.id,
          name: c.title || c.courseTitle || "Untitled Course",
          type: "Course" as const,
          status: mapping.status,
          statusLabel: mapping.label,
          lastEdited: formatRelativeTime(c.updatedAt || c.createdAt),
          action: mapping.action,
          thumbnailUrl: readThumbnailUrl(c),
          durationMinutes: readDurationMinutes(c),
          level: c.difficulty || c.difficultyLevel,
          authorName: readAuthorName(c),
          enrollmentCount: c.enrollmentCount ?? c._count?.enrollments ?? 0,
          rating: ratingVal !== undefined && ratingVal !== null && !isNaN(Number(ratingVal)) ? Number(ratingVal) : undefined,
        };
      });
      return courses;
    } catch {
      return [];
    }
  },

  getContentDeveloperLessons: async (userId?: string): Promise<WorkspaceCourseDto[]> => {
    const effectiveUserId = userId || useUserStore.getState().user?.id;
    try {
      const lessonsRes = await getLessonsApi({ ...(effectiveUserId ? { ownerId: effectiveUserId } : {}), limit: 100 } as any);
      const lessonResponse = lessonsRes?.data ?? lessonsRes;
      const lessonItems = Array.isArray(lessonResponse)
        ? lessonResponse
        : Array.isArray(lessonResponse?.data)
          ? lessonResponse.data
          : Array.isArray(lessonResponse?.items)
            ? lessonResponse.items
            : [];

      const lessons = lessonItems.map((l: any) => {
        const statusUpper = (l.status || "DRAFT").toUpperCase();
        const mapping = statusMap[statusUpper] || {
          status: "draft" as const,
          label: "Draft",
          action: "edit" as const,
        };
        const ratingVal = l.averageRating ?? l.rating;
        return {
          id: l.id,
          name: l.title || l.lessonTitle || "Untitled Lesson",
          type: "Standalone Lesson" as const,
          status: mapping.status,
          statusLabel: mapping.label,
          lastEdited: formatRelativeTime(l.updatedAt || l.createdAt),
          action: mapping.action,
          thumbnailUrl: readThumbnailUrl(l),
          durationMinutes: readDurationMinutes(l),
          level: l.difficulty || l.difficultyLevel,
          authorName: readAuthorName(l),
          enrollmentCount: l.enrollmentCount ?? l._count?.enrollments ?? 0,
          rating: ratingVal !== undefined && ratingVal !== null && !isNaN(Number(ratingVal)) ? Number(ratingVal) : undefined,
        };
      });
      return lessons;
    } catch {
      return [];
    }
  },

  getContentDeveloperCareerPaths: async (userId?: string): Promise<WorkspaceCourseDto[]> => {
    const effectiveUserId = userId || useUserStore.getState().user?.id;
    try {
      const careerPathsRes = await getCareerPathsApi({ ...(effectiveUserId ? { createdById: effectiveUserId } : {}), limit: 100 } as any);
      const rawList = Array.isArray(careerPathsRes?.data)
        ? careerPathsRes.data
        : Array.isArray((careerPathsRes as any)?.data?.data)
          ? (careerPathsRes as any).data.data
          : Array.isArray(careerPathsRes)
            ? careerPathsRes
            : [];

      const careerPaths = rawList.map((cp: any) => {
        const statusUpper = (cp.status || "DRAFT").toUpperCase();
        const mapping = statusMap[statusUpper] || {
          status: "draft" as const,
          label: "Draft",
          action: "edit" as const,
        };
        const ratingVal = cp.averageRating ?? cp.rating;
        return {
          id: cp.id,
          name: cp.title || cp.careerPathTitle || "Untitled Career Path",
          type: "Career Path" as const,
          status: mapping.status,
          statusLabel: mapping.label,
          lastEdited: formatRelativeTime(cp.updatedAt || cp.createdAt),
          action: mapping.action,
          thumbnailUrl: readThumbnailUrl(cp),
          durationMinutes: readDurationMinutes(cp),
          level: cp.difficulty || cp.difficultyLevel,
          authorName: readAuthorName(cp),
          enrollmentCount: cp.enrollmentCount ?? cp._count?.enrollments ?? 0,
          rating: ratingVal !== undefined && ratingVal !== null && !isNaN(Number(ratingVal)) ? Number(ratingVal) : undefined,
        };
      });
      return careerPaths;
    } catch {
      return [];
    }
  },

  getDeveloperReviewInbox: async (
    entityType: string,
    entityId: string
  ) => {
    try {
      const res = await api.get(`/reviews/${entityType}/${entityId}/history`);
      return res.data?.data ?? null;
    } catch {
      return null;
    }
  },

  getUnifiedItems: async (userId?: string): Promise<WorkspaceCourseDto[]> => {
    const [courses, careerPaths, lessons] = await Promise.all([
      contentDeveloperDashboardApi.getContentDeveloperCourses(userId),
      contentDeveloperDashboardApi.getContentDeveloperCareerPaths(userId),
      contentDeveloperDashboardApi.getContentDeveloperLessons(userId),
    ]);
    return [...careerPaths, ...courses, ...lessons];
  },

  getWorkspaceStatistics: async (userId?: string): Promise<WorkspaceStatisticsDto> => {
    const list = await contentDeveloperDashboardApi.getUnifiedItems(userId);
    const stats: WorkspaceStatisticsDto = {
      draft: 0,
      smeReview: 0,
      published: 0,
      changesRequested: 0,
    };
    list.forEach((item) => {
      if (item.status === "draft") stats.draft++;
      else if (item.status === "review") stats.smeReview++;
      else if (item.status === "published") stats.published++;
      else if (item.status === "changes") stats.changesRequested++;
    });
    return stats;
  },

  getWorkspaceDashboardFeedback: async (userId?: string, predefinedItems?: WorkspaceCourseDto[]): Promise<RecentActivityDto[]> => {
    const items = predefinedItems || await contentDeveloperDashboardApi.getUnifiedItems(userId);
    const activities: RecentActivityDto[] = [];

    // Changes requested (REJECTED)
    const changesRequested = items.filter((c) => c.status === "changes");
    for (const item of changesRequested.slice(0, 2)) {
      const typeParam = item.type === "Standalone Lesson" 
        ? "lesson" 
        : item.type === "Career Path" 
          ? "career-path" 
          : "course";

      const history = await contentDeveloperDashboardApi.getDeveloperReviewInbox(typeParam, item.id);
      const latestReview = history?.reviews?.[0];

      activities.push({
        id: `act-cr-${item.id}`,
        title: item.name,
        detail: latestReview?.comment || `Reviewer requested changes on ${item.name}`,
        time: latestReview?.reviewedAt 
          ? formatRelativeTime(latestReview.reviewedAt) 
          : item.lastEdited,
        dotColor: "bg-red-500",
        actionLabel: "Open",
      });
    }

    // Pending reviews (UNDER_REVIEW / SUBMITTED)
    const pendingReviews = items.filter((c) => c.status === "review");
    for (const item of pendingReviews.slice(0, 2)) {
      const typeParam = item.type === "Standalone Lesson" 
        ? "lesson" 
        : item.type === "Career Path" 
          ? "career-path" 
          : "course";

      const history = await contentDeveloperDashboardApi.getDeveloperReviewInbox(typeParam, item.id);
      const latestReview = history?.reviews?.[0];

      activities.push({
        id: `act-pr-${item.id}`,
        title: item.name,
        detail: latestReview?.comment || `Submitted ${item.name} for SME review`,
        time: latestReview?.submittedAt 
          ? formatRelativeTime(latestReview.submittedAt) 
          : item.lastEdited,
        dotColor: "bg-amber-500",
        actionLabel: "View",
      });
    }

    // Recent drafts
    const recentDrafts = items.filter((c) => c.status === "draft");
    for (const item of recentDrafts.slice(0, 2)) {
      activities.push({
        id: `act-draft-${item.id}`,
        title: item.name,
        detail: `Draft in progress: ${item.name}`,
        time: item.lastEdited,
        dotColor: "bg-gray-400",
        actionLabel: "Edit",
      });
    }

    // Published
    const publishedItems = items.filter((c) => c.status === "published");
    for (const item of publishedItems.slice(0, 2)) {
      activities.push({
        id: `act-pub-${item.id}`,
        title: item.name,
        detail: `${item.name} was published`,
        time: item.lastEdited,
        dotColor: "bg-emerald-500",
        actionLabel: "View",
      });
    }

    return activities.slice(0, 5);
  },

  getWorkspaceDashboard: async (userId?: string) => {
    try {
      const res = await api.get("/dashboard/content-developer");
      const data = res.data?.data;
      if (data) {
        const mappedCourses: WorkspaceCourseDto[] = (data.items || []).map((item: any) => {
          const statusUpper = String(item.status || "DRAFT").toUpperCase();
          const mapping = statusMap[statusUpper] || {
            status: "draft" as const,
            label: "Draft",
            action: "edit" as const,
          };
          return {
            id: item.id,
            name: item.name || "Untitled",
            type: item.type,
            status: mapping.status,
            statusLabel: mapping.label,
            lastEdited: formatRelativeTime(item.lastEdited || item.createdAt),
            action: mapping.action,
            thumbnailUrl: item.thumbnailUrl,
            durationMinutes: item.durationMinutes,
            level: item.level,
            authorName: item.authorName || "Nexus Academy",
            enrollmentCount: item.enrollmentCount || 0,
            rating: item.rating,
          };
        });

        return {
          courses: mappedCourses,
          statistics: data.statistics,
          engagement: data.engagement,
          feedbackInbox: data.feedbackInbox || [],
          recentActivity: data.recentActivity || [],
          learnerReactions: data.learnerReactions || [],
        };
      }
    } catch {
      // Fallback
    }

    const courses = await contentDeveloperDashboardApi.getUnifiedItems(userId);
    const recentFeedback = await contentDeveloperDashboardApi.getWorkspaceDashboardFeedback(userId, courses);
    
    return {
      courses,
      recentFeedback,
      statistics: undefined,
      engagement: undefined,
      feedbackInbox: [],
      learnerReactions: [],
    };
  },
};


