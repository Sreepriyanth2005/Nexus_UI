import { api } from "../../../config/axios";
import type {
  CourseMetadata,
  LessonItem,
  AssessmentMetadata,
  SubmissionEvent,
  SMEMetadata,

} from "./contentDeveloperWorkspace.types";

// Custom date formatter helper
export function formatDateMonthYear(dateString: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Unknown Date";
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function formatRelativeTimeShort(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (isNaN(date.getTime())) return "Unknown";
  if (diffMs < 0 || diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "yesterday";
  return `${diffDays}d ago`;
}

export const courseOverviewApi = {
  getCourseOverview: async (courseId: string) => {
    const res = await api.get(`/courses/${courseId}`);
    return res.data?.data || res.data;
  },

  getCourseLessons: async (courseId: string) => {
    const res = await api.get(`/courses/${courseId}/lessons`);
    return res.data?.lessons || res.data?.data || [];
  },

  /* -------------------------------------------------------------------------- */
  /* Career Path */
  /* -------------------------------------------------------------------------- */

  getCareerPathOverview: async (careerPathId: string) => {
    const res = await api.get(`/career-paths/${careerPathId}`);
    return res.data?.data || res.data;
  },

  /* -------------------------------------------------------------------------- */
  /* Lesson */
  /* -------------------------------------------------------------------------- */

  getLessonOverview: async (lessonId: string) => {
    const res = await api.get(`/lessons/${lessonId}`);
    return res.data?.data || res.data;
  },

  /* -------------------------------------------------------------------------- */
  /* Review Summary (Common) */
  /* -------------------------------------------------------------------------- */

  getReviewSummary: async (
    entityType: "course" | "career-path" | "lesson",
    id: string
  ) => {
    try {
      // First attempt to get full review history
      try {
        const historyRes = await api.get(`/reviews/${entityType}/${id}/history`);
        if (historyRes.data?.data) {
          return historyRes.data.data;
        }
      } catch {
        // Fallback to single review endpoint
      }

      const res = await api.get(`/reviews/${entityType}/${id}`);
      return res.data?.data || null;
    } catch {
      return null;
    }
  },

  getCourseReviewSummary: async (courseId: string) => {
    try {
      try {
        const historyRes = await api.get(`/reviews/course/${courseId}/history`);
        if (historyRes.data?.data) {
          return historyRes.data.data;
        }
      } catch {
        // Fallback
      }

      const res = await api.get(`/reviews/course/${courseId}`);
      return res.data?.data || null;
    } catch {
      return null;
    }
  },

  mapCourseOverviewViewModel: (course: any, modulesOrLessons: any[] = [], reviewSummary: any = null) => {
    if (!course) {
      return null;
    }

    const isCareerPathEntity =
      Boolean(course.courses && Array.isArray(course.courses)) ||
      Boolean(course.careerPathCourses && Array.isArray(course.careerPathCourses)) ||
      (course.entityType && String(course.entityType).toLowerCase().includes("career"));

    // Map Course / Career Path Metadata
    const statusMapping: Record<string, "Draft" | "Changes Requested" | "Published" | "Review Pending"> = {
      DRAFT: "Draft",
      SUBMITTED: "Review Pending",
      UNDER_REVIEW: "Review Pending",
      APPROVED: "Review Pending",
      PUBLISHED: "Published",
      REJECTED: "Changes Requested",
    };

    const realCareerPathTitle = isCareerPathEntity
      ? ""
      : (course.careerPaths?.[0]?.careerPath?.title ||
         course.careerPaths?.[0]?.title ||
         course.careerPath?.title ||
         course.careerPathTitle ||
         (course.isStandalone ? "Standalone" : (course.careerPaths && course.careerPaths.length === 0 ? "Standalone" : "")));

    const resolvedDomain = course.domain || course.category?.name || (typeof course.category === "string" ? course.category : "");

    const rawStatus = String(course.status || "DRAFT").toUpperCase();
    const mappedStatus = statusMapping[rawStatus] || (rawStatus === "UNDER_REVIEW" || rawStatus === "SUBMITTED" ? "Review Pending" : "Draft");

    const courseMeta: CourseMetadata = {
      id: course.id || "",
      title: course.title || course.name || "Untitled Content",
      careerPath: realCareerPathTitle,
      version: `v${course.version || 1} ${mappedStatus === "Published" ? "published" : mappedStatus === "Review Pending" ? "in review" : "draft"}`,
      status: mappedStatus,
      createdDate: course.createdAt ? formatDateMonthYear(course.createdAt) : "",
      lastEdited: course.updatedAt || course.createdAt ? formatRelativeTimeShort(course.updatedAt || course.createdAt) : "",
      domain: resolvedDomain,
    };

    // Determine raw items: check passed array, or career path courses, or course lessons
    let rawItems: any[] = [];
    if (Array.isArray(modulesOrLessons) && modulesOrLessons.length > 0) {
      rawItems = modulesOrLessons;
    } else if (Array.isArray(course.courses) && course.courses.length > 0) {
      rawItems = course.courses;
    } else if (Array.isArray(course.careerPathCourses) && course.careerPathCourses.length > 0) {
      rawItems = course.careerPathCourses;
    } else if (Array.isArray(course.courseLessons) && course.courseLessons.length > 0) {
      rawItems = course.courseLessons;
    }

    // Map Lessons / Mapped Courses List safely
    const typeMapping: Record<string, "Video" | "PDF" | "Text"> = {
      VIDEO: "Video",
      PDF: "PDF",
      TEXT: "Text",
      DOCUMENT: "PDF",
      ARTICLE: "Text",
    };

    const lessonItems: LessonItem[] = rawItems.map((item: any, idx: number) => {
      if (!item) return null;

      // Check if item is a CareerPathCourse (which has a nested .course object)
      const isCpc = Boolean(item.course || item.courseId);
      const entity = item.course || item.lesson || item;

      const orderNum = item.sequenceOrder ?? item.order ?? (idx + 1);
      const lOrder = String(orderNum).padStart(2, "0");

      // Safe unit parsing: if duration is stored in seconds (> 120), normalize to minutes
      const rawDur = typeof entity.duration === 'number'
        ? entity.duration
        : typeof item.duration === 'number'
        ? item.duration
        : parseInt(String(entity.duration || item.duration || "0").replace(/[^0-9]/g, ""), 10);
      const mins = isNaN(rawDur) ? 0 : rawDur > 120 ? Math.round(rawDur / 60) : rawDur;

      const rawType = String(entity.lessonType || entity.type || (isCpc || isCareerPathEntity ? "Course" : "VIDEO")).toUpperCase();
      const resolvedType = (isCpc || isCareerPathEntity) ? "Course" : (typeMapping[rawType] || "Video");

      const itemStatus = String(entity.status || item.status || "").toUpperCase();

      return {
        id: entity.id || item.courseId || item.lessonId || item.id || `module-${idx}`,
        order: lOrder,
        title: entity.title || entity.name || item.title || (isCpc || isCareerPathEntity ? `Course ${idx + 1}` : `Lesson ${idx + 1}`),
        type: resolvedType as any,
        duration: `${mins} min`,
        hasFeedback: itemStatus === "REJECTED" || itemStatus === "CHANGES" || Boolean(item.hasFeedback),
        completed: itemStatus === "PUBLISHED" || itemStatus === "APPROVED" || Boolean(item.completed),
      };
    }).filter(Boolean) as LessonItem[];

    // Map Assessment details — use real quiz questions count, no totalLessons fallback
    const primaryQuiz = Array.isArray(course.Quiz) ? course.Quiz[0] : course.quiz || course.assessment;
    const realQuestionCount =
      primaryQuiz?.quizQuestions?.length ??
      primaryQuiz?._count?.quizQuestions ??
      primaryQuiz?.totalQuestions ??
      primaryQuiz?.questionPoolSize ??
      course.assessment?.totalQuestions ??
      0;

    const realPassMark =
      primaryQuiz?.passingScore ??
      primaryQuiz?.passPercentage ??
      course.assessment?.passMark ??
      70;

    const hasAssessment = Boolean(primaryQuiz || course.assessmentRequired || realQuestionCount > 0);

    const assessmentMeta: AssessmentMetadata | undefined = hasAssessment
      ? {
          questions: realQuestionCount,
          passMark: Math.round(realPassMark),
        }
      : undefined;

    // Map Submission timeline history safely
    const reviews = Array.isArray(reviewSummary?.reviews)
      ? reviewSummary.reviews
      : Array.isArray(reviewSummary)
      ? reviewSummary
      : reviewSummary?.id
      ? [reviewSummary]
      : [];
    const submissionHistory: SubmissionEvent[] = [];

    if (reviews.length > 0) {
      reviews.forEach((r: any, idx: number) => {
        if (!r) return;
        const revNum = reviews.length - idx;
        const parsedDate = r.submittedAt ? new Date(r.submittedAt) : null;
        const subDate = parsedDate && !isNaN(parsedDate.getTime())
          ? parsedDate.toLocaleDateString("en-US", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : "Recently";

        const statusMappingText: Record<string, string> = {
          PENDING: "In SME review",
          UNDER_REVIEW: "Under review",
          APPROVED: "Approved with suggestions",
          REJECTED: "Changes requested",
        };

        const typeMapping: Record<string, "success" | "pending" | "info"> = {
          APPROVED: "success",
          PENDING: "pending",
          UNDER_REVIEW: "pending",
          REJECTED: "info",
        };

        submissionHistory.push({
          version: `v${revNum}`,
          submittedDate: `submitted ${subDate}`,
          statusText: statusMappingText[r.status] || r.status || "Pending",
          type: typeMapping[r.status] || "info",
          label: `v${revNum} Submission`,
          outcome: statusMappingText[r.status] || r.status || "Pending",
          detail: `Submitted ${subDate}${r.comment ? ` · "${r.comment}"` : ""}`,
        });
      });
    } else {
      // Default initial row reflecting real course/career path state
      const currentVer = course.version || 1;
      const isPublished = course.status === "PUBLISHED";
      const isUnderReview = course.status === "UNDER_REVIEW" || course.status === "SUBMITTED";

      submissionHistory.push({
        version: `v${currentVer}`,
        submittedDate: isPublished ? "Published" : isUnderReview ? "in review (current)" : "in progress (current)",
        statusText: isPublished ? "Published" : isUnderReview ? "Review Pending" : "Draft",
        type: isPublished ? "success" : "pending",
        label: `v${currentVer} ${isPublished ? "Published" : isUnderReview ? "In Review" : "Draft"}`,
        outcome: isPublished ? "Published" : isUnderReview ? "Under review" : "Draft in progress",
        detail: course.updatedAt ? `Last modified ${formatDateMonthYear(course.updatedAt)}` : "Current version",
      });
    }

    // Map SME details from reviewer profile or assigned instructor
    const latestReview = reviews[0];
    const reviewerUser = latestReview?.reviewer;
    const reviewerProfile = reviewerUser?.profile;

    const reviewerName = reviewerProfile
      ? `${reviewerProfile.firstName || ""} ${reviewerProfile.lastName || ""}`.trim()
      : reviewerUser?.name || (reviewerUser?.email ? reviewerUser.email.split("@")[0] : "");

    const instructorProfile = course.instructor?.profile;
    const instructorName = instructorProfile
      ? `${instructorProfile.firstName || ""} ${instructorProfile.lastName || ""}`.trim()
      : typeof course.instructor === "string"
      ? course.instructor
      : course.instructor?.name || course.authorName || (course.createdBy?.profile ? `${course.createdBy.profile.firstName || ""} ${course.createdBy.profile.lastName || ""}`.trim() : "");

    const resolvedSmeName = reviewerName || instructorName || "";

    const smeMeta: SMEMetadata = {
      name: resolvedSmeName || "Unassigned",
      domain: resolvedDomain || "",
      turnaround: reviewerUser?.turnaround ? `${reviewerUser.turnaround} days` : "2-3 business days",
    };

    return {
      courseMeta,
      lessonItems,
      assessmentMeta,
      submissionHistory,
      smeMeta,
    };
  },
};
