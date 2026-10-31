import { api } from "../../../config/axios";

import type {
  ReviewItem,
  PreviewCourseMetadata,
  InstructorDetails,
  CurriculumLesson,
  FinalAssessmentDetails,
} from "./contentDeveloperWorkspace.types";

export const DEFAULT_PREVIEW_VIEW_MODEL = {
  previewCourse: {
    id: "default-preview",
    title: "",
    category: "",
    description: "",
    lessonsCount: 0,
    durationHours: 0,
    level: "All Levels",
    certificateName: "Certificate of Completion",
    enrolledCount: 0,
    domain: "",
    coverImage: "",
    status: "DRAFT",
  },
  instructor: {
    name: "Nexus Academy",
    designation: "",
    avatarInitials: "IM",
  },
  objectives: [] as string[],
  curriculum: [] as CurriculumLesson[],
  assessment: undefined as FinalAssessmentDetails | undefined,
};

import { readThumbnailUrl, readAuthorName } from "./contentDeveloperDashboard.api";

export const coursePreviewApi = {
  getCoursePreview: async (courseId: string) => {
    const res = await api.get(`/courses/${courseId}`);
    return res.data?.data || res.data;
  },

  getLessonPreview: async (lessonId: string) => {
    const res = await api.get(`/lessons/${lessonId}`);
    return res.data?.data || res.data;
  },

  getCareerPathPreview: async (pathId: string) => {
    const res = await api.get(`/career-paths/${pathId}`);
    return res.data?.data || res.data;
  },

  getCourseLessons: async (courseId: string) => {
    try {
      const res = await api.get(`/courses/${courseId}/lessons`);
      return res.data?.lessons || res.data?.data || [];
    } catch {
      return [];
    }
  },

  getCareerPathCourses: async (pathId: string) => {
    try {
      const res = await api.get(`/career-paths/${pathId}/courses`);
      return res.data?.courses || res.data?.data || [];
    } catch {
      return [];
    }
  },

  getCourseReviews: async (entityTypeOrId: string, entityId?: string): Promise<ReviewItem[]> => {
    try {
      const type = entityId ? entityTypeOrId : "course";
      const id = entityId || entityTypeOrId;
      const res = await api.get(`/reviews/${type}/${id}`);
      const reviews = res.data?.data?.reviews || (Array.isArray(res.data?.data) ? res.data.data : []);
      return reviews.map((r: any) => ({
        id: r.id,
        reviewer: r.reviewer
          ? `${r.reviewer.firstName || ""} ${r.reviewer.lastName || ""}`.trim()
          : "Reviewer",
        review: r.comment || "No review content provided",
        date: r.reviewedAt
          ? new Date(r.reviewedAt).toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          })
          : "Recently",
      }));
    } catch (error) {
      return [];
    }
  },

  /**
   * Log a preview view event to the real backend audit log.
   * BRD §27.3 / US Story 3 AC#5: "Log: Course preview views"
   *
   * Maps frontend entityType (course/lesson/career-path) to Prisma
   * ContentEntityType enum (COURSE/LESSON/CAREER_PATH).
   *
   * Fire-and-forget — errors are silenced so audit failures never break the UI.
   */
  logPreviewView: async (
    entityType: "course" | "lesson" | "career-path",
    entityId: string
  ): Promise<void> => {
    if (!entityId) return;

    // Map frontend param values to Prisma ContentEntityType enum values
    const entityTypeMap: Record<string, "COURSE" | "LESSON" | "CAREER_PATH"> = {
      "course": "COURSE",
      "lesson": "LESSON",
      "career-path": "CAREER_PATH",
    };
    const mappedEntityType = entityTypeMap[entityType];
    if (!mappedEntityType) return;

    try {
      // POST to real backend endpoint — persists to UserAuditLog in PostgreSQL
      await api.post("/courses/preview-view-log", {
        entityType: mappedEntityType,
        entityId,
      });
    } catch {
      // Silent — audit log failure must never block or error the preview page
    }
  },

  /**
   * Check if the course/entity is in the current user's wishlist in PostgreSQL.
   */
  checkIsWishlisted: async (entityId: string): Promise<boolean> => {
    if (!entityId) return false;
    try {
      const res = await api.get<{ success: boolean; data: { wishlists: any[] } }>("/wishlists");
      const list = res.data?.data?.wishlists || [];
      return list.some(
        (w: any) =>
          w.courseId === entityId ||
          w.lessonId === entityId ||
          w.careerPathId === entityId
      );
    } catch {
      return false;
    }
  },

  /**
   * Add entity to wishlist via real backend endpoint.
   */
  addToWishlist: async (
    entityId: string,
    entityType: "course" | "lesson" | "career-path" = "course"
  ): Promise<void> => {
    if (!entityId) return;
    await api.post(`/wishlists/${entityId}`, { entityId, entityType });
  },

  /**
   * Remove entity from wishlist via real backend endpoint.
   */
  removeFromWishlist: async (
    entityId: string,
    entityType: "course" | "lesson" | "career-path" = "course"
  ): Promise<void> => {
    if (!entityId) return;
    await api.delete(`/wishlists/${entityId}?entityType=${entityType}`);
  },

  mapCoursePreviewViewModel: (
    course: any,
    lessons: any[] = []
  ) => {
    if (!course) {
      return DEFAULT_PREVIEW_VIEW_MODEL;
    }

    const difficultyMapping: Record<string, string> = {
      BEGINNER: "Beginner",
      INTERMEDIATE: "Intermediate",
      ADVANCED: "Advanced",
      FOUNDATION: "Foundation",
      PRACTITIONER: "Practitioner",
      EXPERT: "Expert",
    };

    const calculatedDuration = lessons.reduce((acc, lesson) => {
      const lessonObj = lesson.lesson || lesson;
      const raw = parseInt(String(lessonObj.duration || "0").replace(/[^0-9]/g, ""), 10);
      if (isNaN(raw)) return acc;
      const mins = raw > 300 ? Math.round(raw / 60) : raw;
      return acc + mins;
    }, 0);
    const durationFromDB = course.duration ? Number(course.duration) : 0;
    const finalDurationMins = calculatedDuration > 0 ? calculatedDuration : durationFromDB;

    // Author name must use saved entity authorName or default to Nexus Academy (do not use logged-in user/profile name)
    const author = (course.authorName || course.instructorName || (typeof course.author === "string" ? course.author : "") || "").trim() || "Nexus Academy";

    const authorInitials = author
      ? author
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((p: string) => p[0]?.toUpperCase())
        .join("")
      : "IM";

    const previewCourse: PreviewCourseMetadata = {
      id: course.id || "preview-course",
      title: course.title || course.lessonTitle || course.careerPathTitle || course.name || "",
      category:
        course.category?.name ||
        course.domain ||
        (typeof course.category === "string" ? course.category : ""),
      description:
        course.shortDescription ||
        course.fullDescription ||
        course.description ||
        course.lessonDescription ||
        course.tagline ||
        "",
      lessonsCount: lessons.length > 0 ? lessons.length : (course.totalLessons || course.courseLessons?.length || 0),
      durationHours:
        finalDurationMins > 0
          ? Math.round((finalDurationMins / 60) * 10) / 10
          : 0,
      level: difficultyMapping[(course.difficulty || course.difficultyLevel || "").toUpperCase()] || course.level || "All Levels",
      certificateName:
        course.certificatePolicy?.name ||
        course.certificateName ||
        (course.certificatePolicyId ? "Verified Certificate" : "Certificate of Completion"),
      enrolledCount: course.enrollmentCount ?? course._count?.enrollments ?? 0,
      domain: course.domain || "",
      coverImage: readThumbnailUrl(course) || undefined,
      status: course.status || "DRAFT",
    };

    const instructor: InstructorDetails = {
      name: author,
      designation: "",
      avatarInitials: authorInitials,
    };

    let objectives: string[] = [];
    if (course.learningObjectives) {
      try {
        const parsed =
          typeof course.learningObjectives === "string"
            ? (course.learningObjectives.startsWith("[")
              ? JSON.parse(course.learningObjectives)
              : course.learningObjectives.split("\n").map((s: string) => s.trim()).filter(Boolean))
            : course.learningObjectives;
        if (Array.isArray(parsed) && parsed.length > 0) {
          objectives = parsed.map((o: any) =>
            typeof o === "string" ? o : o.objective || o.title || String(o)
          );
        }
      } catch {
        // Fall back to empty objectives
      }
    }

    if (objectives.length === 0 && course.learningOutcomes) {
      if (Array.isArray(course.learningOutcomes)) {
        objectives = course.learningOutcomes.map((o: any) => typeof o === "string" ? o : o.outcome || String(o));
      } else if (typeof course.learningOutcomes === "string") {
        objectives = course.learningOutcomes.split("\n").map((s: string) => s.trim()).filter(Boolean);
      }
    }

    const typeMapping: Record<string, "Video" | "PDF" | "Text"> = {
      VIDEO: "Video",
      PDF: "PDF",
      TEXT: "Text",
      DOCUMENT: "PDF",
      ARTICLE: "Text",
    };

    let curriculum: CurriculumLesson[] = [];
    if (lessons && lessons.length > 0) {
      curriculum = lessons.map((l: any, idx: number) => {
        const lessonObj = l.lesson || l;
        const rawType = (lessonObj.lessonType || lessonObj.type || "VIDEO").toUpperCase();
        const primaryType: "Video" | "PDF" | "Text" =
          rawType === "PDF" || rawType === "DOCUMENT"
            ? "PDF"
            : rawType === "TEXT" || rawType === "ARTICLE"
              ? "Text"
              : "Video";

        const modes: ("Video" | "PDF" | "Text")[] =
          primaryType === "Video"
            ? ["Video", "Text"]
            : primaryType === "PDF"
              ? ["PDF"]
              : ["Text"];

        const videoUrl =
          lessonObj.videoUrl ||
          lessonObj.assets_storage_lessons_content_asset_idToassets_storage?.externalUrl ||
          lessonObj.assets_storage_lessons_content_asset_idToassets_storage?.signedUrl ||
          lessonObj.assets_storage_lessons_content_asset_idToassets_storage?.fileUrl ||
          lessonObj.assets_storage_lessons_content_asset_idToassets_storage?.url ||
          lessonObj.contentAsset?.externalUrl ||
          lessonObj.contentAsset?.signedUrl ||
          lessonObj.contentAsset?.fileUrl ||
          lessonObj.contentAsset?.url ||
          lessonObj.previewAsset?.externalUrl ||
          lessonObj.previewAsset?.signedUrl ||
          lessonObj.previewAsset?.fileUrl ||
          lessonObj.previewAsset?.url ||
          lessonObj.lessonAssets?.find((a: any) => a.assetRole === "VIDEO" || a.assetRole === "CONTENT")?.asset?.externalUrl ||
          lessonObj.lessonAssets?.find((a: any) => a.assetRole === "VIDEO" || a.assetRole === "CONTENT")?.asset?.signedUrl ||
          lessonObj.lessonAssets?.find((a: any) => a.assetRole === "VIDEO" || a.assetRole === "CONTENT")?.asset?.fileUrl ||
          lessonObj.fileUrl ||
          lessonObj.signedUrl ||
          "";

        const subtitleUrl =
          lessonObj.subtitleUrl ||
          lessonObj.assets_storage_lessons_transcript_asset_idToassets_storage?.signedUrl ||
          lessonObj.assets_storage_lessons_transcript_asset_idToassets_storage?.fileUrl ||
          lessonObj.assets_storage_lessons_transcript_asset_idToassets_storage?.url ||
          lessonObj.transcriptAsset?.signedUrl ||
          lessonObj.transcriptAsset?.fileUrl ||
          lessonObj.lessonAssets?.find((a: any) => a.assetRole === "TRANSCRIPT")?.asset?.signedUrl ||
          lessonObj.lessonAssets?.find((a: any) => a.assetRole === "TRANSCRIPT")?.asset?.fileUrl ||
          "";

        const isFree = idx === 0 || lessonObj.allowPreview || lessonObj.previewAccessType === "FREE_PREVIEW";

        const rawDur = typeof lessonObj.duration === "number"
          ? lessonObj.duration
          : parseInt(String(lessonObj.duration || "0").replace(/[^0-9]/g, ""), 10);
        const mins = isNaN(rawDur) ? 0 : rawDur > 300 ? Math.round(rawDur / 60) : rawDur;

        return {
          id: lessonObj.id || `l-${idx + 1}`,
          order: idx + 1,
          title: lessonObj.title?.match(/^\d+\./)
            ? lessonObj.title
            : `${idx + 1}. ${lessonObj.title || lessonObj.lessonTitle || `Lesson ${idx + 1}`}`,
          type: primaryType,
          modes,
          duration: mins > 0 ? `${mins} min` : "Self-paced",
          status: isFree ? "Free preview" : "Locked",
          isFree,
          videoUrl: videoUrl || undefined,
          fileUrl: lessonObj.fileUrl || videoUrl || undefined,
          signedUrl: lessonObj.signedUrl || videoUrl || undefined,
          contentAsset: lessonObj.contentAsset || lessonObj.assets_storage_lessons_content_asset_idToassets_storage || undefined,
          transcriptAsset: lessonObj.transcriptAsset || lessonObj.assets_storage_lessons_transcript_asset_idToassets_storage || undefined,
          subtitleUrl: subtitleUrl || undefined,
          lessonContents: lessonObj.lessonContents || undefined,
          description: lessonObj.description || lessonObj.lessonDescription || undefined,
          shortDescription: lessonObj.shortDescription || undefined,
          contentAssetId: lessonObj.content_asset_id || lessonObj.contentAssetId || undefined,
        };
      });
    }

    const primaryQuiz = Array.isArray(course.Quiz) ? course.Quiz[0] : course.quiz || course.assessment;
    const realQuestions =
      primaryQuiz?.quizQuestions?.length ??
      primaryQuiz?._count?.quizQuestions ??
      primaryQuiz?.totalQuestions ??
      primaryQuiz?.questionPoolSize ??
      course.assessment?.totalQuestions ??
      0;

    const hasQuiz = Boolean(primaryQuiz || course.assessmentRequired || realQuestions > 0);

    const assessment: FinalAssessmentDetails | undefined = hasQuiz && realQuestions > 0
      ? {
        questions: realQuestions,
        passMark: primaryQuiz?.passingScore ?? primaryQuiz?.passPercentage ?? course.assessment?.passMark ?? 70,
        status: "After all lessons",
      }
      : undefined;

    return {
      previewCourse,
      instructor,
      objectives,
      curriculum,
      assessment,
    };
  },
};
