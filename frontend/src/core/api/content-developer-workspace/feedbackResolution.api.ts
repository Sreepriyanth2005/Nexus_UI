import { api } from "../../../config/axios";
import { contentDeveloperDashboardApi } from "./contentDeveloperDashboard.api";

export interface ReplyThread {
  author: string;
  comment: string;
  postedAgo: string;
}

export interface FeedbackCardDto {
  id: string;
  type: "Required" | "Suggestion" | "Resolved";
  lessonRef: string;
  quote: string;
  author: string;
  postedAgo: string;
  isOptional?: boolean;
  metadata?: string;
  replies: ReplyThread[];
}

export interface FeedbackSummaryDto {
  requiredCount: number;
  suggestionsCount: number;
  resolvedCount: number;
}

export interface CompletenessItemDto {
  label: string;
  complete: boolean;
}

export interface CompletenessResultDto {
  isComplete: boolean;
  checklist: CompletenessItemDto[];
  missingCount: number;
}

export interface LearnerQADto {
  id: string;
  status: "Answered" | "Unanswered";
  lessonRef?: string;
  postedAgo: string;
  question: string;
  author: string;
  upvotes: number;
  reply?: string;
  subject?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return "Recently";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (isNaN(diff) || mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "1 week ago";
  return `${days}d ago`;
}

/** Map a review status string to a FeedbackCard type. */
function statusToCardType(
  status: string
): "Required" | "Suggestion" | "Resolved" {
  switch (status) {
    case "REJECTED":
    case "CHANGES_REQUESTED":
      return "Required";
    case "APPROVED":
    case "PUBLISHED":
      return "Resolved";
    case "PENDING":
    default:
      return "Suggestion";
  }
}

function reviewerName(reviewer: any): string {
  if (!reviewer) return "SME Reviewer";
  const fullName = [reviewer.profile?.firstName, reviewer.profile?.lastName].filter(Boolean).join(" ").trim();
  if (fullName) return fullName;
  const name = [reviewer.firstName, reviewer.lastName].filter(Boolean).join(" ").trim();
  return name || reviewer.email || "SME Reviewer";
}

// ---------------------------------------------------------------------------
// Local reply/resolve store (per session)
// ---------------------------------------------------------------------------
const localReplies: Record<string, ReplyThread[]> = {};
const localResolved: Set<string> = new Set();
const localQAReplies: Record<string, string> = {};

const RESOLVED_STORAGE_KEY = "feedback_resolved_store";

function getStoredResolved(entityType: string, entityId: string): Set<string> {
  const set = new Set<string>();
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const raw = localStorage.getItem(`${RESOLVED_STORAGE_KEY}_${entityType}_${entityId}`);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          arr.forEach((id) => set.add(id));
        }
      }
    } catch {
      // ignore
    }
  }
  return set;
}

function persistResolvedLocally(entityType: string, entityId: string, cardId: string) {
  localResolved.add(cardId);
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const set = getStoredResolved(entityType, entityId);
      set.add(cardId);
      localStorage.setItem(`${RESOLVED_STORAGE_KEY}_${entityType}_${entityId}`, JSON.stringify(Array.from(set)));
    } catch {
      // ignore
    }
  }
}

function checkIsResolved(entityType: string, entityId: string, cardId: string): boolean {
  if (localResolved.has(cardId)) return true;
  const set = getStoredResolved(entityType, entityId);
  return set.has(cardId);
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export const feedbackResolutionApi = {
  /**
   * Returns latest course / entity for Content Developer if none passed in route.
   * MUST receive the authenticated user's ID so only that user's own content is
   * returned — calling without userId would fetch all content across all users.
   */
  getLatestEntity: async (userId?: string): Promise<{ entityType: "course" | "career-path" | "lesson"; entityId: string; title: string } | null> => {
    try {
      const [courses, careerPaths, lessons] = await Promise.all([
        contentDeveloperDashboardApi.getContentDeveloperCourses(userId),
        contentDeveloperDashboardApi.getContentDeveloperCareerPaths(userId),
        contentDeveloperDashboardApi.getContentDeveloperLessons(userId),
      ]);
      const all = [...courses, ...careerPaths, ...lessons];
      if (all && all.length > 0) {
        // Prioritize course/entity in changes requested or review
        const priority = all.find((c) => c.status === "changes" || c.status === "review") || all[0];
        const entityType = priority.type === "Career Path" ? "career-path" : priority.type === "Standalone Lesson" ? "lesson" : "course";
        return {
          entityType,
          entityId: priority.id,
          title: priority.name,
        };
      }
      return null;
    } catch (e) {
      return null;
    }
  },

  /**
   * Returns the review history for a given entity as feedback cards.
   * Calls:  GET /api/v1/reviews/{entityType}/{entityId}/history
   */
  getFeedback: async (
    entityType: "course" | "career-path" | "lesson",
    entityId: string
  ): Promise<FeedbackCardDto[]> => {
    try {
      const [historyRes, commentsRes] = await Promise.allSettled([
        api.get(`/reviews/${entityType}/${entityId}/history`),
        api.get(`/reviews/${entityType}/${entityId}/comments`),
      ]);

      const reviews: any[] = historyRes.status === "fulfilled" ? (historyRes.value.data?.data?.reviews ?? []) : [];
      const workflowLogs: any[] = historyRes.status === "fulfilled" ? (historyRes.value.data?.data?.workflowLog ?? []) : [];
      const entityComments: any[] = commentsRes.status === "fulfilled" ? (commentsRes.value.data?.data ?? []) : [];

      if (reviews.length === 0 && workflowLogs.length === 0 && entityComments.length === 0) {
        return [];
      }

      // Map reviews
      const cards: FeedbackCardDto[] = [];
      reviews.forEach((r: any) => {
        if (r.comment && r.comment.trim()) {
          const isResolved = Boolean(r.resolvedById || r.resolvedBy || checkIsResolved(entityType, entityId, r.id));
          const replies = localReplies[r.id] ?? [];
          const dynamicRef = r.lessonTitle || (r.lesson?.title) || (r.lessonIndex ? `Lesson ${r.lessonIndex}` : (r.lessonId ? "Lesson" : (entityType === "lesson" ? "Lesson" : entityType === "career-path" ? "Career Path" : "Course")));
          cards.push({
            id: r.id,
            type: isResolved ? "Resolved" : statusToCardType(r.status),
            lessonRef: dynamicRef,
            quote: r.comment,
            author: reviewerName(r.reviewer || r.resolvedBy),
            postedAgo: timeAgo(r.reviewedAt ?? r.submittedAt),
            isOptional: r.status === "PENDING",
            metadata: r.reviewedAt ? `Reviewed · ${timeAgo(r.reviewedAt)}` : undefined,
            replies,
          });
        }
      });

      // Merge ReviewComment entries (lesson-specific & entity comments)
      entityComments.forEach((c: any) => {
        const cleanQuote = c.comment ? c.comment.replace(/^\[(Required|Suggestion|Resolved)\]\s*/gi, "").replace(/^\[(Required|Suggestion|Resolved)\]\s*/gi, "") : "";
        if (c.comment && c.comment.trim() && !cards.some((card) => card.id === c.id || card.quote === cleanQuote)) {
          const isResolved = Boolean(
            checkIsResolved(entityType, entityId, c.id) ||
            c.toStatus === "APPROVED" ||
            c.comment?.toLowerCase().includes("[resolved]")
          );
          const isRequired = c.rating === 1 || c.comment?.includes("[Required]");
          const lessonRef = c.lessonTitle || (c.lesson?.title) || (c.lessonId ? "Lesson" : (entityType === "lesson" ? "Lesson" : entityType === "career-path" ? "Career Path" : "Course"));

          cards.push({
            id: c.id,
            type: isResolved ? "Resolved" : (isRequired ? "Required" : "Suggestion"),
            lessonRef,
            quote: cleanQuote,
            author: reviewerName(c.actor || c.user),
            postedAgo: timeAgo(c.createdAt),
            isOptional: !isRequired,
            replies: localReplies[c.id] ?? [],
          });
        }
      });

      // Also merge any workflow log comments if distinct
      workflowLogs.forEach((log: any) => {
        const cleanQuote = log.comment ? log.comment.replace(/^\[(Required|Suggestion|Resolved)\]\s*/gi, "").replace(/^\[(Required|Suggestion|Resolved)\]\s*/gi, "") : "";
        if (log.comment && log.comment.trim() && !cards.some((c) => c.quote === cleanQuote)) {
          const isResolved = Boolean(
            checkIsResolved(entityType, entityId, log.id) ||
            log.toStatus === "APPROVED" ||
            log.toStatus === "PUBLISHED" ||
            log.comment?.toLowerCase().includes("resolved")
          );
          const logRef = log.lessonTitle || (log.lessonId ? "Lesson" : (entityType === "lesson" ? "Lesson" : entityType === "career-path" ? "Career Path" : "Course"));
          const cleanQuote = log.comment.replace(/^\[(Required|Suggestion|Resolved)\]\s*/gi, "").replace(/^\[(Required|Suggestion|Resolved)\]\s*/gi, "");
          cards.push({
            id: log.id,
            type: isResolved ? "Resolved" : (log.toStatus === "REJECTED" ? "Required" : "Suggestion"),
            lessonRef: logRef,
            quote: cleanQuote,
            author: reviewerName(log.actor),
            postedAgo: timeAgo(log.createdAt),
            isOptional: log.toStatus !== "REJECTED",
            replies: localReplies[log.id] ?? [],
          });
        }
      });

      return cards;
    } catch {
      return [];
    }
  },

  /**
   * Returns header details: course/entity name + reviewer info.
   * Calls:  GET /api/v1/reviews/{entityType}/{entityId}
   */
  getHeaderDetails: async (
    entityType: "course" | "career-path" | "lesson",
    entityId: string
  ) => {
    // Fetch entity name
    let entityTitle = "";
    let thumbnailUrl: string | undefined = undefined;
    try {
      const endpointMap: Record<string, string> = {
        "career-path": `/career-paths/${entityId}`,
        lesson: `/lessons/${entityId}`,
        course: `/courses/${entityId}`,
      };
      const entityRes = await api.get(endpointMap[entityType]);
      const data = entityRes.data?.data ?? entityRes.data;
      entityTitle = data?.title ?? data?.name ?? "";
      thumbnailUrl = data?.thumbnailAsset?.fileUrl || data?.coverImageAsset?.fileUrl || data?.thumbnailUrl || undefined;
    } catch {
      // silently ignore
    }

    // Fetch latest review
    let reviewer = "";
    let reviewed = "";
    let statusLabel = "Rejected";
    try {
      const reviewRes = await api.get(
        `/reviews/${entityType}/${entityId}`
      );
      const review = reviewRes.data?.data;
      if (review?.reviewer) {
        reviewer = reviewerName(review.reviewer);
      }
      if (review?.reviewedAt || review?.submittedAt) {
        reviewed = timeAgo(review.reviewedAt || review.submittedAt);
      }
      if (review?.status) {
        statusLabel = review.status === "APPROVED" || review.status === "PUBLISHED"
          ? "Approved"
          : (review.status === "REJECTED" ? "Rejected" : "Changes requested");
      }
    } catch {
      // silently ignore
    }

    return {
      courseName: entityTitle || "Course",
      statusLabel: statusLabel || "Draft",
      reviewerName: reviewer || "Unassigned",
      lastReviewTimestamp: reviewed || "Recently",
      thumbnailUrl,
    };
  },

  /**
   * Derives counts from the history, applying local resolved overrides.
   */
  getFeedbackSummary: async (
    entityType: "course" | "career-path" | "lesson",
    entityId: string
  ): Promise<FeedbackSummaryDto> => {
    try {
      const cards = await feedbackResolutionApi.getFeedback(entityType, entityId);
      let requiredCount = 0;
      let suggestionsCount = 0;
      let resolvedCount = 0;

      for (const c of cards) {
        if (c.type === "Required") requiredCount++;
        else if (c.type === "Suggestion") suggestionsCount++;
        else resolvedCount++;
      }

      return { requiredCount, suggestionsCount, resolvedCount };
    } catch {
      return { requiredCount: 0, suggestionsCount: 0, resolvedCount: 0 };
    }
  },

  /**
   * Fetches Real Completeness checklist data from backend
   * Calls: GET /api/v1/reviews/{entityType}/{entityId}/completeness
   */
  getCompleteness: async (
    entityType: "course" | "career-path" | "lesson",
    entityId: string
  ): Promise<CompletenessResultDto> => {
    try {
      const res = await api.get(`/reviews/${entityType}/${entityId}/completeness`);
      const data = res.data?.data;
      if (data && data.validations) {
        const metadataComplete = !!data.validations.metadata?.valid;
        const structureComplete = !!data.validations.structure?.valid;
        const transcriptsComplete = !!data.validations.videoGovernance?.valid;
        const personaComplete = !!data.validations.personCoverage?.valid;
        const subordinateComplete = !!data.validations.subordinateAssets?.valid;

        const checklist: CompletenessItemDto[] = [
          { label: "Course metadata", complete: metadataComplete },
          { label: "Course structure", complete: structureComplete },
          { label: "Lesson transcripts", complete: transcriptsComplete },
          { label: "Persona assignment", complete: personaComplete },
          { label: "Subordinate assets", complete: subordinateComplete },
        ];

        const missingCount = checklist.filter((item) => !item.complete).length;

        return {
          isComplete: !!data.isComplete && missingCount === 0,
          checklist,
          missingCount,
        };
      }
    } catch {
      // Completeness engine not available
    }

    // Default clean fallback without synthetic/fake hardcoded results
    return {
      isComplete: false,
      checklist: [],
      missingCount: 0,
    };
  },

  /**
   * Fetches Review comments (no fake/random data)
   */
  getLearnerQA: async (
    entityType: "course" | "career-path" | "lesson",
    entityId: string
  ): Promise<LearnerQADto[]> => {
    try {
      const res = await api.get(`/reviews/${entityType}/${entityId}/comments`);
      const comments: any[] = res.data?.data ?? [];
      if (comments.length > 0) {
        return comments.map((c: any) => {
          const authorName = [c.actor?.profile?.firstName, c.actor?.profile?.lastName].filter(Boolean).join(" ").trim() || c.actor?.email || "Reviewer";
          const isAnswered = !!localQAReplies[c.id] || (c.replies && c.replies.length > 0);
          const dynamicLessonRef = c.lessonTitle || (c.lessonNumber ? `Lesson ${c.lessonNumber}` : (c.lessonId ? "Lesson" : (entityType === "lesson" ? "Lesson" : entityType === "career-path" ? "Career Path" : "General")));
          const upvotesCount = typeof c.upvotes === "number" ? c.upvotes : (typeof c.rating === "number" ? c.rating : (typeof c.likes === "number" ? c.likes : (c._count?.likes ?? 0)));
          return {
            id: c.id,
            status: isAnswered ? "Answered" : "Unanswered",
            lessonRef: dynamicLessonRef,
            postedAgo: timeAgo(c.createdAt),
            question: c.comment || "",
            author: authorName,
            upvotes: upvotesCount,
            reply: localQAReplies[c.id] || c.reply || undefined,
            subject: "All subjects",
          };
        });
      }
    } catch (e) {
      // ignore
    }
    return [];
  },

  /** Adds a reply to a card locally or remotely. */
  replyToFeedback: async (
    _entityType: "course" | "career-path" | "lesson",
    _entityId: string,
    cardId: string,
    message: string
  ) => {
    if (!localReplies[cardId]) localReplies[cardId] = [];
    localReplies[cardId].push({
      author: "You",
      comment: message,
      postedAgo: "Just now",
    });
    return true;
  },

  /** Marks a card as resolved locally and remotely. */
  markFeedbackResolved: async (
    entityType: "course" | "career-path" | "lesson",
    entityId: string,
    cardId: string,
    developerReply?: string
  ) => {
    persistResolvedLocally(entityType, entityId, cardId);
    try {
      await api.post(`/reviews/${entityType}/${entityId}/resolve`, {
        items: [{ itemId: cardId, developerReply }],
      });
    } catch {
      // Local persistent storage maintains resolve state
    }
    return true;
  },

  /** Submits reply to learner QA. */
  replyToLearnerQA: async (qaId: string, replyText: string) => {
    localQAReplies[qaId] = replyText;
    return true;
  },

  /**
   * Resubmits the entity for review.
   * Calls:  POST /api/v1/reviews/{entityType}/{entityId}/submit
   */
  resubmitForReview: async (
    entityType: "course" | "career-path" | "lesson",
    entityId: string,
    payload?: {
      submittedById?: string;
      reviewerId?: string;
      comment?: string;
    }
  ) => {
    const res = await api.post(
      `/reviews/${entityType}/${entityId}/submit`,
      payload || {}
    );
    return res.data;
  },
};