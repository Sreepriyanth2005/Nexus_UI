import { api } from "../../../config/axios";
import { getCourse, getCourseLessons, submitReviewApi, publishEntityApi } from "./courseReview.api";
import { getCareerPathApi } from "../career-path/career-path.api";
import { getCareerPathCoursesApi } from "../career-path/careerpath-course.api";
import { getLessonApi } from "../lesson/lesson.api";
import { getQuizzesApi, getQuizByIdApi } from "../assessment.api";

export interface CourseReviewSummary {
  title: string;
  description: string;
  status: string;
  isStandalone: boolean;
  lessons: any[];
  quiz: any | null;
  skills: any[];
  learningOutcomes: string;
  coverImageAssetId: string | null;
  reviewerId: string | null;
  personaIds: string[];
  language: string;
  difficulty: string;
  priceTier: string;
  categoryId: string;
  tenantId: string | null;
}

export interface ReviewChecklistItem {
  id: string;
  title: string;
  status: "complete" | "warning" | "missing";
  description: string;
}

export interface CompletenessItem {
  id: string;
  status: "complete" | "warning" | "missing";
  description: string;
}

export interface ValidationWarning {
  id: string;
  title: string;
  description: string;
}

export interface SubmissionSummary {
  assignedSme: string;
  reviewStatus: string;
  submissionStatus: string;
}

export const getCourseReviewSummary = async (
  entityId: string,
  publishType: "career-path" | "standalone-course" | "standalone-lesson"
): Promise<CourseReviewSummary> => {
  let title = "";
  let description = "";
  let status = "DRAFT";
  let isStandalone = true;
  let lessons: any[] = [];
  let skills: any[] = [];
  let learningOutcomes = "";
  let coverImageAssetId: string | null = null;
  let reviewerId: string | null = null;
  let personaIds: string[] = [];
  let language = "ENGLISH";
  let difficulty = "BEGINNER";
  let priceTier = "FREE";
  let categoryId = "";
  let tenantId: string | null = null;

  if (publishType === "career-path") {
    const cpRes = await getCareerPathApi(entityId) as any;
    const cp = cpRes.data?.data || cpRes.data;
    title = cp.title || "";
    description = cp.description || "";
    status = cp.status || "DRAFT";
    isStandalone = false;
    skills = cp.skills || [];
    learningOutcomes = cp.learningOutcome || "";
    reviewerId = cp.reviewerId || null;
    personaIds = cp.personaIds || [];
    categoryId = cp.categoryId || "";
    tenantId = cp.tenantId || null;

    // Fetch linked courses
    const cpCoursesRes = await getCareerPathCoursesApi(entityId);
    const cpCourses = cpCoursesRes.data?.data || cpCoursesRes.data || cpCoursesRes || [];
    const courseIds = cpCourses.map((c: any) => c.courseId).filter(Boolean);

    // Fetch lessons from all courses
    const lessonsPromises = courseIds.map(async (cId: string) => {
      try {
        const res = await api.get(`/courses/${cId}/lessons`);
        const lessonList = res.data?.lessons || res.data?.data || [];
        return lessonList.map((l: any) => l.lesson || l);
      } catch (e) {
        return [];
      }
    });
    const lessonsList = await Promise.all(lessonsPromises);
    lessons = lessonsList.flat();
  } else if (publishType === "standalone-lesson") {
    const lessonRes = await getLessonApi(entityId) as any;
    const lesson = lessonRes.data?.data || lessonRes.data;
    title = lesson.title || "";
    description = lesson.description || "";
    status = lesson.status || "DRAFT";
    isStandalone = true;
    skills = lesson.skills || [];
    learningOutcomes = lesson.learningObjectives || "";
    coverImageAssetId = lesson.thumbnailAssetId || null;
    reviewerId = lesson.reviewerId || null;
    personaIds = lesson.personaIds || [];
    language = lesson.language || "ENGLISH";
    difficulty = lesson.difficulty || "BEGINNER";
    priceTier = lesson.priceTier || "FREE";
    categoryId = lesson.subjectId || "";
    tenantId = lesson.tenantId || null;
    lessons = [lesson];
  } else {
    // standalone-course
    const course = await getCourse(entityId) as any;
    title = course.title || "";
    description = course.fullDescription || course.shortDescription || "";
    status = course.status || "DRAFT";
    isStandalone = true;
    skills = course.skills || [];
    learningOutcomes = course.learningOutcomes || "";
    coverImageAssetId = course.thumbnailAssetId || null;
    reviewerId = course.reviewerId || null;
    personaIds = course.personaIds || [];
    language = course.language || "ENGLISH";
    difficulty = course.difficulty || "BEGINNER";
    priceTier = course.priceTier || "FREE";
    categoryId = course.categoryId || "";
    tenantId = course.tenantId || null;

    lessons = await getCourseLessons(entityId);
  }

  // Fetch quizzes list
  let quiz: any = null;
  try {
    const params = {
      careerPathId: publishType === "career-path" ? entityId : undefined,
      courseId: publishType === "standalone-course" ? entityId : undefined,
      lessonId: publishType === "standalone-lesson" ? entityId : undefined,
    };
    const quizzesRes = await getQuizzesApi(params);
    const quizzes = quizzesRes.data || quizzesRes;
    const firstQuiz = quizzes?.[0] || quizzes?.data?.[0];
    if (firstQuiz?.id) {
      const quizDetailRes = await getQuizByIdApi(firstQuiz.id);
      quiz = quizDetailRes.data || quizDetailRes;
    }
  } catch (e) {
    console.error("Failed to load quiz detail for review summary:", e);
  }

  return {
    title,
    description,
    status,
    isStandalone,
    lessons,
    quiz,
    skills,
    learningOutcomes,
    coverImageAssetId,
    reviewerId,
    personaIds,
    language,
    difficulty,
    priceTier,
    categoryId,
    tenantId,
  };
};

export const submitCourseForReview = async (
  entityId: string,
  publishType: "career-path" | "standalone-course" | "standalone-lesson",
  payload: {
    submittedById: string;
    reviewerId: string;
    comment?: string;
  }
) => {
  let entityType = "course";
  if (publishType === "career-path") {
    entityType = "career-path";
  } else if (publishType === "standalone-lesson") {
    entityType = "lesson";
  }
  return submitReviewApi(entityType, entityId, payload);
};

export const publishCourseDirectly = async (
  entityId: string,
  publishType: "career-path" | "standalone-course" | "standalone-lesson",
  payload: {
    publishedById: string;
    comment?: string;
  }
) => {
  let entityType = "course";
  if (publishType === "career-path") {
    entityType = "career-path";
  } else if (publishType === "standalone-lesson") {
    entityType = "lesson";
  }
  return publishEntityApi(entityType, entityId, payload);
};

export const mapReviewChecklist = (
  summary: CourseReviewSummary,
  selectedReviewer?: string
): {
  preSubmissionChecklist: ReviewChecklistItem[];
  completenessChecklist: CompletenessItem[];
} => {
  const preSubmissionChecklist: ReviewChecklistItem[] = [];
  const completenessChecklist: CompletenessItem[] = [];

  // 1. Basic Information
  const hasBasicInfo = summary.title?.trim().length > 0 && summary.description?.trim().length >= 200;
  preSubmissionChecklist.push({
    id: "basic-info",
    title: "Basic information",
    status: hasBasicInfo ? "complete" : "missing",
    description: hasBasicInfo
      ? `Title, description, tags, thumbnail completed. (${summary.title})`
      : `Title and description (min 200 chars) required. Current: ${summary.description?.trim().length || 0} chars.`,
  });

  // 2. Lessons / Courses
  const lessonsCount = summary.lessons?.length || 0;
  const hasLessons = lessonsCount > 0;
  const videoCount = summary.lessons?.filter((l: any) => l.lessonType === "VIDEO").length || 0;
  const textCount = summary.lessons?.filter((l: any) => ["DOCUMENT", "PDF", "TEXT"].includes(l.lessonType)).length || 0;
  const totalDuration = summary.lessons?.reduce((acc: number, curr: any) => acc + (Number(curr.duration) || 0), 0) || 0;
  preSubmissionChecklist.push({
    id: "lessons",
    title: summary.isStandalone ? "Lessons" : "Courses & Lessons",
    status: hasLessons ? "complete" : "missing",
    description: hasLessons
      ? `${lessonsCount} lesson(s) added (${videoCount} video, ${textCount} text) · ${totalDuration} min total.`
      : "At least one lesson/course is required.",
  });

  // 3. Assessment
  const quizQuestions = summary.quiz?.quizQuestions || [];
  const quizCount = quizQuestions.length || 0;
  const hasAssessment = quizCount > 0;
  preSubmissionChecklist.push({
    id: "assessment",
    title: "Assessment",
    status: hasAssessment ? "complete" : "missing",
    description: hasAssessment
      ? `${quizCount} quiz question(s) configured.`
      : "No assessment quiz configured.",
  });

  // 4. Learning Outcomes
  const hasSkills = summary.skills?.length > 0;
  const hasOutcomes = summary.learningOutcomes?.trim().length > 0;
  preSubmissionChecklist.push({
    id: "skills-outcomes",
    title: "Skills + outcomes filled",
    status: (hasSkills && hasOutcomes) ? "complete" : "missing",
    description: (hasSkills && hasOutcomes)
      ? `${summary.skills.length} skill(s) and learning outcomes defined.`
      : "Skills and learning outcomes are required.",
  });

  // Completeness Checklist (BRD GOV-02)

  // - All modules have at least 3 lessons
  completenessChecklist.push({
    id: "modules-lessons-count",
    status: lessonsCount >= 3 ? "complete" : "warning",
    description: lessonsCount >= 3
      ? `All modules have at least 3 lessons (${lessonsCount} total)`
      : `Missing lessons: only ${lessonsCount} lesson(s) available (target: min 3)`,
  });

  // - Quiz exists per module + final assessment
  completenessChecklist.push({
    id: "quiz-exists",
    status: hasAssessment ? "complete" : "missing",
    description: hasAssessment
      ? `Quiz exists per module + final assessment (${quizCount} questions)`
      : "Quiz not configured",
  });

  // - Cover image uploaded
  const hasCoverImage = Boolean(summary.coverImageAssetId);
  completenessChecklist.push({
    id: "cover-image-uploaded",
    status: hasCoverImage ? "complete" : "missing",
    description: hasCoverImage
      ? "Cover image uploaded successfully (1280x720)"
      : "Cover image not uploaded",
  });

  // - Description length + outcomes
  completenessChecklist.push({
    id: "description-outcomes",
    status: hasBasicInfo && hasOutcomes ? "complete" : "missing",
    description: hasBasicInfo && hasOutcomes
      ? "Description >= 200 chars + learning outcomes listed"
      : "Description < 200 chars or learning outcomes missing",
  });

  // - Subtitles on video lessons (Optional / Warning)
  const videoLessons = summary.lessons?.filter((l: any) => l.lessonType === "VIDEO") || [];
  const missingTranscriptsCount = videoLessons.filter((l: any) => !l.transcriptAssetId && !l.transcript).length;
  completenessChecklist.push({
    id: "video-subtitles",
    status: videoLessons.length === 0 ? "complete" : (missingTranscriptsCount === 0 ? "complete" : "warning"),
    description: missingTranscriptsCount === 0
      ? `Subtitles on all ${videoLessons.length} video lessons (WCAG 2.1 AA)`
      : `Subtitles missing on ${missingTranscriptsCount} video lesson(s) (WCAG 2.1 AA)`,
  });

  // - Transcript availability (Optional / Warning)
  completenessChecklist.push({
    id: "transcript-availability",
    status: videoLessons.length === 0 ? "complete" : (missingTranscriptsCount === 0 ? "complete" : "warning"),
    description: missingTranscriptsCount === 0
      ? "Transcript available on all video lessons"
      : `Transcript missing on ${missingTranscriptsCount} video lesson(s)`,
  });

  // - PDF attachments (Optional / Warning)
  const docLessons = summary.lessons?.filter((l: any) => ["DOCUMENT", "PDF", "TEXT"].includes(l.lessonType)) || [];
  const missingAttachmentsCount = docLessons.filter((l: any) => !l.attachmentIds?.length && !l.attachments?.length).length;
  completenessChecklist.push({
    id: "pdf-attachments-completeness",
    status: docLessons.length === 0 ? "complete" : (missingAttachmentsCount === 0 ? "complete" : "warning"),
    description: missingAttachmentsCount === 0
      ? "All document lessons have PDF attachments"
      : `PDF attachments missing on ${missingAttachmentsCount} document lesson(s)`,
  });

  // - Persona assignment (Optional / Warning)
  const hasPersonas = summary.personaIds?.length > 0;
  completenessChecklist.push({
    id: "persona-assignment-completeness",
    status: hasPersonas ? "complete" : "warning",
    description: hasPersonas
      ? "Persona assignment complete"
      : "Persona assignment incomplete (Learner only, missing Corp User access)",
  });

  // - SME reviewer assigned (Mandatory / Missing)
  const sMeAssigned = Boolean(summary.reviewerId || selectedReviewer);
  completenessChecklist.push({
    id: "sme-reviewer-assigned",
    status: sMeAssigned ? "complete" : "missing",
    description: sMeAssigned
      ? `SME reviewer assigned: ${summary.reviewerId || selectedReviewer}`
      : "SME reviewer not yet assigned",
  });

  return {
    preSubmissionChecklist,
    completenessChecklist,
  };
};
