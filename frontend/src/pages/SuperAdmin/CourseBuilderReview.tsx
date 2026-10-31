// src/pages/SuperAdmin/CourseBuilderReview.tsx

import React, { useState } from "react";
import { notification } from "antd";
import { useNavigate, useParams, useLocation } from "react-router";

import { useUserStore } from "../../store/user.store";
import { useAuthStore } from "../../core/auth/auth.store";
import { HasPermission } from "../../components/common/HasPermission";

import { useCareerPathWorkflow } from "../../hooks/career-path/useCareerPathWorkflow";
import { useCourseWorkflow } from "../../hooks/course/useCourseWorkflow";
import { useLessonWorkflow } from "../../hooks/lesson/useLessonWorkflow";
import { useQuery, useQueries } from "@tanstack/react-query";
import { getCareerPathApi } from "../../core/api/career-path/career-path.api";
import { getCareerPathCoursesApi } from "../../core/api/career-path/careerpath-course.api";
import { courseApi } from "../../core/api/course/course.api";
import { getLessonApi } from "../../core/api/lesson/lesson.api";
import { getQuizzesApi, getQuizByIdApi } from "../../core/api/assessment.api";
import { getCourseLessonsApi } from "../../core/api/course/course-lesson.api";
import { useUsers } from "../../hooks/internal-user/useInternalUser";
import ContentDeveloperCertificateModal from "../../components/course-builder/ContentDeveloperCertificateModal";
import { getLessonMaterialsCount } from "./CourseBuilderLessons";
import { toast } from "sonner";
import { MessageSquare, Save, AlertTriangle } from "lucide-react";
import {
  getVersionHistoryApi,
  saveChangeSummaryApi,
  VersionEntityType,
} from "../../core/api/content-developer-workspace/versioning.api";

interface CourseBuilderReviewProps {
  publishType: "career-path" | "standalone-course" | "standalone-lesson";
  formData: any;
  courseLessons?: any[];
  assessmentQuestions?: any[];

  createdCareerPathId?: string | null;
  createdCourseId?: string | null;
  createdLessonId?: string | null;

  onStatusUpdate?: () => void;
}

const CourseBuilderReview: React.FC<CourseBuilderReviewProps> = ({
  publishType,
  formData,
  createdCareerPathId,
  createdCourseId,
  createdLessonId,
  onStatusUpdate,
  courseLessons = [],
  assessmentQuestions = [],
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { courseId: routeCourseId, lessonId: routeLessonId, pathId: routePathId } = useParams<{ courseId?: string; lessonId?: string; pathId?: string }>();
  const searchParams = new URLSearchParams(location.search);
  const queryCourseId = searchParams.get("courseId");
  const queryLessonId = searchParams.get("lessonId");
  const queryPathId = searchParams.get("pathId");

  const effectiveCourseId = createdCourseId || routeCourseId || queryCourseId || (location.state as any)?.courseId || null;
  const effectiveLessonId = createdLessonId || routeLessonId || queryLessonId || (location.state as any)?.lessonId || null;
  const effectiveCareerPathId = createdCareerPathId || routePathId || queryPathId || (location.state as any)?.pathId || null;

  const user = useUserStore((state: any) => state.user);

  const { submitMutation: submitCareerPathMutation, publishMutation: publishCareerPathMutation } = useCareerPathWorkflow(effectiveCareerPathId ?? "");
  const { submitMutation: submitCourseMutation, publishMutation: publishCourseMutation } = useCourseWorkflow(effectiveCourseId ?? "");
  const { submitMutation: submitLessonMutation, publishMutation: publishLessonMutation } = useLessonWorkflow(effectiveLessonId ?? "");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showDirectPublishModal, setShowDirectPublishModal] = useState(false);
  const [showCertPreviewModal, setShowCertPreviewModal] = useState(false);
  const [issueCertificate, setIssueCertificate] = useState(true);

  // Version 2+ published edit detection (spec §3, §7, §9, §11, §12)
  const locationState = (location.state as any) || {};
  const isPublishedEditFromState = Boolean(locationState?.isPublishedEdit);
  const inheritedChangeSummary: string = locationState?.changeSummary || "";

  const entityTypeForVersion: VersionEntityType =
    publishType === "standalone-lesson" ? "lesson" : publishType === "career-path" ? "career-path" : "course";
  const activeEntityIdForVersion =
    publishType === "standalone-lesson" ? effectiveLessonId : publishType === "career-path" ? effectiveCareerPathId : effectiveCourseId;

  const { data: versionSnapshots = [] } = useQuery({
    queryKey: ["version-history", entityTypeForVersion, activeEntityIdForVersion],
    queryFn: () => getVersionHistoryApi(entityTypeForVersion, activeEntityIdForVersion!),
    enabled: Boolean(activeEntityIdForVersion),
  });



  const [changeSummaryText, setChangeSummaryText] = useState(inheritedChangeSummary);
  const [isSavingSummary, setIsSavingSummary] = useState(false);

  React.useEffect(() => {
    if (!changeSummaryText && versionSnapshots.length > 0) {
      const latestWithSummary = [...versionSnapshots].reverse().find((s: any) => s.changeSummary);
      if (latestWithSummary?.changeSummary) {
        setChangeSummaryText(latestWithSummary.changeSummary);
      }
    }
  }, [versionSnapshots]);

  const handleSaveChangeSummary = async () => {
    if (!activeEntityIdForVersion) {
      toast.error("Content must be saved before saving change summary.");
      return;
    }
    if (!changeSummaryText || changeSummaryText.trim().length < 5) {
      toast.error("Change summary must be at least 5 characters.");
      return;
    }
    setIsSavingSummary(true);
    try {
      await saveChangeSummaryApi(entityTypeForVersion, activeEntityIdForVersion, changeSummaryText.trim());
      toast.success("Change summary saved to database.");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to save change summary.");
    } finally {
      setIsSavingSummary(false);
    }
  };

  const { data: allUsers = [] } = useUsers({ limit: 100 });
  const reviewerUsers = React.useMemo(() => {
    const rawList = Array.isArray(allUsers)
      ? allUsers
      : Array.isArray((allUsers as any)?.data)
        ? (allUsers as any).data
        : Array.isArray((allUsers as any)?.data?.items)
          ? (allUsers as any).data.items
          : [];

    const smes = rawList.filter((u: any) =>
      u && Array.isArray(u.roles) && u.roles.some((roleStr: any) => {
        const roleUpper = String(roleStr || "").toUpperCase();
        return (
          roleUpper === "SME" ||
          roleUpper.includes("SME") ||
          roleUpper.includes("SUBJECT_MATTER") ||
          roleUpper.includes("SUBJECT_MATTER_EXPERT")
        );
      })
    );
    if (smes.length > 0) return smes;

    return rawList.filter((u: any) =>
      u && Array.isArray(u.roles) && u.roles.some((roleStr: any) => {
        const roleUpper = String(roleStr || "").toUpperCase();
        return roleUpper.includes("SUPERADMIN") || roleUpper.includes("SUPER_ADMIN");
      })
    );
  }, [allUsers]);

  const [reviewer, setReviewer] = useState("");

  React.useEffect(() => {
    if (reviewerUsers.length > 0 && !reviewer) {
      setReviewer(reviewerUsers[0].id);
    }
  }, [reviewerUsers]);

  const activeReviewerObj = (reviewerUsers.find((u: any) => u.id === reviewer) || null) as any;
  const reviewerDisplayName = activeReviewerObj ? (activeReviewerObj.name || `${activeReviewerObj.firstName || ""} ${activeReviewerObj.lastName || ""}`.trim() || activeReviewerObj.email) : (reviewer ? "Assigned Reviewer" : "");

  const { data: careerPathRes, isLoading: isCpLoading } = useQuery({
    queryKey: ["careerPath", effectiveCareerPathId],
    queryFn: () => getCareerPathApi(effectiveCareerPathId!),
    enabled: !!effectiveCareerPathId && publishType === "career-path",
  });

  const { data: courseRes, isLoading: isCourseLoading } = useQuery({
    queryKey: ["course", effectiveCourseId],
    queryFn: () => courseApi.getById(effectiveCourseId!),
    enabled: !!effectiveCourseId && publishType === "standalone-course",
  });

  const { data: lessonRes, isLoading: isLessonLoading } = useQuery({
    queryKey: ["lesson", effectiveLessonId],
    queryFn: () => getLessonApi(effectiveLessonId!),
    enabled: !!effectiveLessonId && publishType === "standalone-lesson",
  });

  const cpDb = (careerPathRes as any)?.data?.data || (careerPathRes as any)?.data || (careerPathRes as any) || null;
  const courseDb = (courseRes as any)?.data?.data || (courseRes as any)?.data || (courseRes as any) || null;
  const lessonDb = (lessonRes as any)?.data?.data || (lessonRes as any)?.data || (lessonRes as any) || null;

  const currentDbStatus = (
    publishType === "standalone-lesson"
      ? lessonDb?.status
      : publishType === "career-path"
        ? cpDb?.status
        : courseDb?.status
  )?.toUpperCase();

  const isPublishedEdit =
    isPublishedEditFromState ||
    currentDbStatus === "PUBLISHED" ||
    (Array.isArray(versionSnapshots) && versionSnapshots.some((s: any) => s.version >= 1));



  const entityTitle = React.useMemo(() => {
    if (publishType === "standalone-lesson") {
      return formData?.lessonTitle?.trim() || lessonDb?.title?.trim() || "";
    }
    if (publishType === "standalone-course") {
      return formData?.courseTitle?.trim() || courseDb?.title?.trim() || "";
    }
    if (publishType === "career-path") {
      return formData?.careerPathTitle?.trim() || cpDb?.title?.trim() || "";
    }
    return "";
  }, [publishType, lessonDb, courseDb, cpDb, formData]);

  // Fetch career path courses if any are saved in DB
  const { data: apiCareerPathCourses, isLoading: isCpCoursesLoading } = useQuery({
    queryKey: ["career-path-courses", effectiveCareerPathId],
    queryFn: () => getCareerPathCoursesApi(effectiveCareerPathId!),
    enabled: !!effectiveCareerPathId && publishType === "career-path",
  });

  const apiCareerPathCoursesList = Array.isArray(apiCareerPathCourses)
    ? apiCareerPathCourses
    : Array.isArray((apiCareerPathCourses as any)?.data)
      ? (apiCareerPathCourses as any).data
      : Array.isArray((apiCareerPathCourses as any)?.courses)
        ? (apiCareerPathCourses as any).courses
        : [];

  // For career-path: fetch lessons from all selected courses
  const careerPathCourseIds: string[] = publishType === "career-path"
    ? Array.from(new Set([
      ...(formData?.existingCourseIds || []),
      ...(apiCareerPathCoursesList.map((c: any) => c?.courseId || c?.id).filter(Boolean))
    ]))
    : [];

  const courseLessonQueries = useQueries({
    queries: careerPathCourseIds.map((courseId: string) => ({
      queryKey: ["course-lessons", courseId],
      queryFn: () => getCourseLessonsApi(courseId),
      enabled: !!courseId,
    })),
  });

  // For standalone-course: fetch lessons from the API using effectiveCourseId
  const { data: apiCourseLessonsData, isLoading: isCourseLessonsLoading } = useQuery({
    queryKey: ["course-lessons", effectiveCourseId],
    queryFn: () => getCourseLessonsApi(effectiveCourseId!),
    enabled: !!effectiveCourseId && publishType === "standalone-course",
  });

  const apiCourseLessonsRaw = Array.isArray(apiCourseLessonsData)
    ? apiCourseLessonsData
    : Array.isArray((apiCourseLessonsData as any)?.data)
      ? (apiCourseLessonsData as any).data
      : Array.isArray((apiCourseLessonsData as any)?.lessons)
        ? (apiCourseLessonsData as any).lessons
        : [];

  // Merge API lessons with local (newly added) lessons for standalone-course
  const apiCourseLessons: any[] = apiCourseLessonsRaw
    .map((cl: any) => cl?.lesson || cl)
    .filter(Boolean);

  const apiIds = new Set(apiCourseLessons.map((l: any) => l?.id).filter(Boolean));
  const localOnlyLessons = (Array.isArray(courseLessons) ? courseLessons : []).filter((l: any) => l?.id && !apiIds.has(l.id));
  const effectiveCourseLessons = [...apiCourseLessons, ...localOnlyLessons].filter(Boolean);

  // Flatten all lessons from all courses in the career path
  const careerPathLessons: any[] = courseLessonQueries.flatMap(
    (q: any) => {
      const rawData = Array.isArray(q?.data)
        ? q.data
        : Array.isArray(q?.data?.data)
          ? q.data.data
          : Array.isArray(q?.data?.lessons)
            ? q.data.lessons
            : [];
      return rawData.map((cl: any) => cl?.lesson || cl).filter(Boolean);
    }
  );

  let lessonDescription = "0 min total";
  let lessonStatus = "warning";

  if (publishType === "standalone-lesson") {
    const lType = lessonDb?.lessonType || formData?.lessonType || "VIDEO";
    const dur = lessonDb?.duration || formData?.duration || 0;
    const isVid = lType === "VIDEO" ? 1 : 0;
    const isDoc = ["DOCUMENT", "PDF", "TEXT"].includes(lType) ? 1 : 0;
    lessonDescription = `${isVid} video${isVid !== 1 ? 's' : ''}, ${isDoc} text · ${dur} min total.`;
    lessonStatus = entityTitle ? "success" : "warning";
  } else if (publishType === "standalone-course") {
    const lessonsForCount = effectiveCourseLessons;
    const totalDuration = lessonsForCount.reduce((acc: number, curr: any) => acc + (Number(curr?.duration) || 0), 0);
    const videoCount = lessonsForCount.filter((l: any) => l?.lessonType === "VIDEO").length;
    const pdfCount = lessonsForCount.filter((l: any) => ["DOCUMENT", "PDF", "TEXT"].includes(l?.lessonType)).length;
    lessonDescription = `${videoCount} video${videoCount !== 1 ? 's' : ''}, ${pdfCount} text · ${totalDuration} min total.`;
    lessonStatus = lessonsForCount.length > 0 ? "success" : "warning";
  } else {
    // career-path: use lessons fetched from all linked courses
    const totalDuration = careerPathLessons.reduce((acc: number, l: any) => acc + (Number(l?.duration) || 0), 0);
    const videoCount = careerPathLessons.filter((l: any) => l?.lessonType === "VIDEO").length;
    const textCount = careerPathLessons.filter((l: any) => ["DOCUMENT", "PDF", "TEXT"].includes(l?.lessonType)).length;
    const courseCount = careerPathCourseIds.length;
    lessonDescription = careerPathLessons.length > 0
      ? `${courseCount} course${courseCount !== 1 ? 's' : ''} · ${videoCount} video${videoCount !== 1 ? 's' : ''}, ${textCount} text · ${totalDuration} min total.`
      : courseCount > 0
        ? `${courseCount} course${courseCount !== 1 ? 's' : ''} selected · Loading lessons...`
        : "No courses selected.";
    lessonStatus = courseCount > 0 ? "success" : "warning";
  }

  // Step 1: Find the quiz linked to this entity from the list endpoint
  const entityId = effectiveCareerPathId || effectiveCourseId || effectiveLessonId;

  const { data: quizzesListRes, isLoading: isQuizListLoading } = useQuery({
    queryKey: ["quizzes-list", { effectiveCareerPathId, effectiveCourseId, effectiveLessonId }],
    queryFn: () => getQuizzesApi({
      careerPathId: publishType === "career-path" ? (effectiveCareerPathId || undefined) : undefined,
      courseId: publishType === "standalone-course" ? (effectiveCourseId || undefined) : undefined,
      lessonId: publishType === "standalone-lesson" ? (effectiveLessonId || undefined) : undefined,
    }),
    enabled: !!entityId,
  });

  // Step 2: Get the quizId from the list, then fetch full quiz by ID
  const quizzesListItems = Array.isArray(quizzesListRes?.data?.items)
    ? quizzesListRes.data.items
    : Array.isArray(quizzesListRes?.data?.data)
      ? quizzesListRes.data.data
      : Array.isArray(quizzesListRes?.data)
        ? quizzesListRes.data
        : Array.isArray(quizzesListRes?.items)
          ? quizzesListRes.items
          : [];

  const activeQuizItem = publishType === "standalone-course"
    ? (quizzesListItems.find((q: any) => q && !q.lessonId && !q.lesson_id) || quizzesListItems[0] || null)
    : (publishType === "standalone-lesson"
      ? (quizzesListItems.find((q: any) => q && String(q.lessonId || q.lesson_id) === String(effectiveLessonId)) || quizzesListItems[0] || null)
      : (quizzesListItems.find((q: any) => q && !q.lessonId && !q.lesson_id && !q.courseId && !q.course_id) || quizzesListItems[0] || null));

  const quizId = activeQuizItem?.id || quizzesListRes?.data?.[0]?.id || quizzesListRes?.data?.data?.[0]?.id || null;

  const { data: quizDetailRes, isLoading: isQuizDetailLoading } = useQuery({
    queryKey: ["quiz-detail", quizId],
    queryFn: () => getQuizByIdApi(quizId!),
    enabled: !!quizId,
  });

  // The full quiz data: data.quizQuestions[].question.questionType
  const savedQuiz = (quizDetailRes as any)?.data?.data || (quizDetailRes as any)?.data || quizDetailRes || null;
  const dynamicQuestions = (savedQuiz?.quizQuestions && Array.isArray(savedQuiz.quizQuestions) && savedQuiz.quizQuestions.length > 0)
    ? savedQuiz.quizQuestions.map((qq: any) => qq?.question).filter(Boolean)
    : (Array.isArray(assessmentQuestions) ? assessmentQuestions.filter(Boolean) : []);

  const mcqCount = dynamicQuestions.filter((q: any) => q && (q.questionType === "MCQ" || q.type === "MCQ")).length;
  const essayCount = dynamicQuestions.filter((q: any) => q && (q.questionType === "ESSAY" || q.type === "ESSAY")).length;
  const trueFalseCount = dynamicQuestions.filter((q: any) => q && (q.questionType === "TRUE_FALSE" || q.type === "TRUE_FALSE")).length;
  const imageCount = dynamicQuestions.filter((q: any) => q && (q.questionType === "IMAGE" || q.type === "IMAGE")).length;
  const totalQuestions = dynamicQuestions.length;

  const assessmentDetails = totalQuestions > 0
    ? `${mcqCount} MCQ · ${trueFalseCount} T/F · ${essayCount} Essay · ${imageCount} Image · ${totalQuestions} total`
    : "No assessment configured.";

  let outcomesStatus = "warning";
  let outcomesDescription = "Pending skills or learning outcomes configuration.";

  if (publishType === "standalone-lesson") {
    const desc = formData?.lessonDescription || lessonDb?.description;
    outcomesStatus = desc ? "success" : "warning";
    outcomesDescription = desc ? "Lesson description completed." : "Please add a description for the lesson.";
  } else if (publishType === "standalone-course") {
    const outcomes = formData?.learningOutcomes || courseDb?.learningOutcomes;
    const skills = formData?.skillTags || courseDb?.skills || courseDb?.skillTags;
    const hasOutcomes = typeof outcomes === "string" ? outcomes.trim().length > 0 : (Array.isArray(outcomes) && outcomes.length > 0);
    const hasSkills = Array.isArray(skills) && skills.length > 0;
    outcomesStatus = (hasOutcomes || hasSkills) ? "success" : "warning";
    outcomesDescription = (hasOutcomes || hasSkills)
      ? "Skills and learning outcomes completed."
      : "No learning outcomes or skills added.";
  } else {
    // career-path
    const skills = formData?.skillTags || cpDb?.skills || cpDb?.skillTags;
    const hasSkills = Array.isArray(skills) && skills.length > 0;
    outcomesStatus = hasSkills ? "success" : "warning";
    outcomesDescription = hasSkills
      ? "Skills & learning outcomes completed."
      : "No skills tags configured.";
  }

  // Dynamic Pre-submission Checklist Items
  const preSubmissionChecks = React.useMemo(() => {
    const checks: { id: string; title: string; description: string; passed: boolean; optional?: boolean }[] = [];

    // 1. Basic Info
    const hasBasicInfo = Boolean(entityTitle && (formData?.shortDescription || formData?.description || formData?.fullDescription || lessonDb?.description || courseDb?.shortDescription || courseDb?.fullDescription));
    checks.push({
      id: "basic_info",
      title: hasBasicInfo ? "Basic info complete" : "Basic info incomplete",
      description: hasBasicInfo ? `Title, description, tags, thumbnail (${entityTitle})` : "Missing required title or description.",
      passed: hasBasicInfo,
    });

    // 2. Content / Lessons Structure
    if (publishType === "standalone-lesson") {
      const isVideoUrlPresent = Boolean(
        formData?.videoUrl ||
        lessonDb?.videoUrl ||
        lessonDb?.assets_storage_lessons_content_asset_idToassets_storage?.externalUrl ||
        (lessonDb?.contentAsset?.assetSource === "EXTERNAL_LINK" && (lessonDb?.contentAsset?.externalUrl || lessonDb?.contentAsset?.url))
      );
      const hasContent = Boolean(
        formData?.primaryContent ||
        isVideoUrlPresent ||
        lessonDb?.contentAssetId ||
        lessonDb?.content_asset_id ||
        lessonDb?.attachments?.length ||
        lessonDb?.lessonAssets?.length ||
        (lessonDb?.lessonContents && lessonDb.lessonContents.length > 0) ||
        (formData?.lessonContents && formData.lessonContents.length > 0)
      );
      checks.push({
        id: "content",
        title: hasContent ? "Lesson content attached" : "Lesson content missing",
        description: hasContent
          ? (isVideoUrlPresent
            ? `Video URL / media attached · ${formData?.duration || lessonDb?.duration || 0} min duration`
            : `Content attached · ${formData?.duration || lessonDb?.duration || 0} min duration`)
          : "Primary content upload or video required.",
        passed: hasContent,
      });
    } else if (publishType === "standalone-course") {
      const count = effectiveCourseLessons.length;
      checks.push({
        id: "lessons",
        title: count > 0 ? `${count} lesson${count > 1 ? "s" : ""} added` : "No lessons added",
        description: count > 0 ? `${count} lesson(s) configured in course` : "At least 1 lesson is required to publish.",
        passed: count > 0,
      });
    } else {
      const count = (formData?.constituentCourses || []).length;
      checks.push({
        id: "courses",
        title: count > 0 ? `${count} course${count > 1 ? "s" : ""} added` : "No courses added",
        description: count > 0 ? `${count} course(s) mapped to career path` : "At least 1 course is required for the path.",
        passed: count > 0,
      });
    }

    // 3. Quiz / Assessment
    if (formData?.assessmentRequired || totalQuestions > 0) {
      checks.push({
        id: "assessment",
        title: totalQuestions > 0 ? `${totalQuestions} quiz question${totalQuestions > 1 ? "s" : ""}` : "Assessment questions missing",
        description: totalQuestions > 0 ? assessmentDetails : "Assessment is required but no questions are configured.",
        passed: totalQuestions > 0,
      });
    } else {
      checks.push({
        id: "assessment",
        title: "Assessment not required",
        description: "Assessment is marked as optional for this entity.",
        passed: true,
        optional: true,
      });
    }

    // 4. Learning Outcomes & Competencies
    const hasOutcomes = outcomesStatus === "success";
    checks.push({
      id: "outcomes",
      title: hasOutcomes ? "Learning outcomes & skills configured" : "Skills / outcomes pending",
      description: outcomesDescription,
      passed: hasOutcomes,
    });

    // 5. SME Reviewer
    const hasReviewer = Boolean(reviewer);

    checks.push({
      id: "reviewer",
      title: hasReviewer ? "SME reviewer assigned" : "SME reviewer not yet selected",
      description: hasReviewer ? `Assigned to ${reviewerDisplayName || "selected reviewer"}` : "Select an eligible SME reviewer before submission.",
      passed: hasReviewer,
    });

    return checks;
  }, [entityTitle, formData, lessonDb, courseDb, publishType, effectiveCourseLessons, totalQuestions, assessmentDetails, outcomesStatus, outcomesDescription, reviewer, reviewerDisplayName]);

  const passedChecksCount = preSubmissionChecks.filter((c) => c.passed).length;
  const totalChecksCount = preSubmissionChecks.length;
  const readinessPercent = Math.round((passedChecksCount / (totalChecksCount || 1)) * 100);

  // Dynamic Completeness Criteria Checklist
  const completenessItems = React.useMemo(() => {
    return [
      {
        label: publishType === "standalone-lesson" ? "Domain and subject categorization assigned" : (publishType === "standalone-course" ? "Course category and subcategory assigned" : "Career path category assigned"),
        passed: Boolean(formData?.subjectId || formData?.categoryId || lessonDb?.subjectId || courseDb?.categoryId),
      },
      {
        label: "Difficulty level and target language defined",
        passed: Boolean((formData?.difficulty || lessonDb?.difficulty || courseDb?.difficulty) && (formData?.language || lessonDb?.language || courseDb?.language)),
      },
      {
        label: "Description & learning objectives populated",
        passed: Boolean(formData?.fullDescription || formData?.description || lessonDb?.description || courseDb?.fullDescription),
      },
      {
        label: publishType === "standalone-lesson" ? "Thumbnail or cover asset uploaded" : "Course thumbnail uploaded (1280x720)",
        passed: Boolean(formData?.thumbnail || formData?.coursethumbnail || formData?.coverImage || lessonDb?.thumbnailAssetId || courseDb?.thumbnailAssetId || (formData as any)?.thumbnailAssetUrl),
      },
      {
        label: formData?.assessmentRequired ? "Passing score & attempt limits configured" : "Assessment criteria verified (or optional)",
        passed: !formData?.assessmentRequired || totalQuestions > 0,
      },
      {
        label: "Eligible SME reviewer assigned for review",
        passed: Boolean(reviewer),
      },
    ];
  }, [publishType, formData, lessonDb, courseDb, totalQuestions, reviewer]);

  const isAnyLoading = isCpLoading || isCourseLoading || isLessonLoading || isCpCoursesLoading || courseLessonQueries.some(q => q.isLoading) || isCourseLessonsLoading || isQuizListLoading || isQuizDetailLoading;

  if (isAnyLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mb-4"></div>
        <p className="text-gray-500 font-medium">Loading review details...</p>
      </div>
    );
  }

  const smName = formData?.supportingMaterialFile?.name || (formData as any)?.supportingMaterialName;
  const smUrl = (formData as any)?.supportingMaterialUrl;
  const hasSm = Boolean(formData?.supportingMaterialFile || smUrl);

  let materialsDescription = "Optional — No supporting materials added.";

  if (publishType === "standalone-course") {
    const courseLessonsMaterialsCount = Array.isArray(effectiveCourseLessons)
      ? effectiveCourseLessons.reduce((sum: number, l: any) => sum + getLessonMaterialsCount(l), 0)
      : 0;
    if (courseLessonsMaterialsCount > 0) {
      materialsDescription = `${courseLessonsMaterialsCount} supporting material${courseLessonsMaterialsCount > 1 ? "s" : ""} across course lessons.`;
    } else if (hasSm) {
      materialsDescription = `Course supporting material attached (${smName || "Document"}).`;
    }
  } else {
    const lessonMaterialsCount = getLessonMaterialsCount(lessonDb || formData);
    const newAttachmentsCount = formData?.lessonAttachments?.length || 0;
    const effectiveCount = lessonMaterialsCount > 0 ? lessonMaterialsCount : newAttachmentsCount;
    if (effectiveCount > 0) {
      materialsDescription = `${effectiveCount} supporting material${effectiveCount > 1 ? "s" : ""} added.`;
    } else if (hasSm) {
      materialsDescription = `Supporting material attached (${smName || "Document"}).`;
    } else if (formData?.attachment || (formData as any)?.attachmentAssetUrl) {
      materialsDescription = `Document attached (${formData?.attachment?.name || "Downloadable Resource Available"}).`;
    }
  }

  const checklist = [
    {
      id: 1,
      status: entityTitle ? "success" : "warning",
      title: "Basic information",
      description: entityTitle
        ? `Title, description, tags and thumbnail completed. (${entityTitle})`
        : "Pending creation...",
    },
    {
      id: 2,
      status: lessonStatus,
      title: publishType === "career-path" ? "Courses" : "Lessons",
      description: lessonDescription,
    },
    {
      id: 3,
      status: totalQuestions > 0 ? "success" : "warning",
      title: "Assessment",
      description: assessmentDetails,
    },
    {
      id: 4,
      status: outcomesStatus,
      title: "Learning Outcomes & Skills",
      description: outcomesDescription,
    },
    {
      id: 5,
      status: "success",
      title: "Supporting Materials",
      description: materialsDescription,
    },
  ];

  const handleSubmitForReview = async () => {
    if (!user?.id) {
      notification.error({
        title: "User not authenticated",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      switch (publishType) {
        case "career-path":
          if (!effectiveCareerPathId) {
            throw new Error("Career Path ID missing");
          }

          await submitCareerPathMutation.mutateAsync({
            reviewerId: reviewer || undefined,
          } as any);
          break;

        case "standalone-course":
          if (!effectiveCourseId) {
            throw new Error("Course ID missing");
          }

          await submitCourseMutation.mutateAsync({
            reviewerId: reviewer || undefined,
          } as any);
          break;

        case "standalone-lesson":
          if (!effectiveLessonId) {
            throw new Error("Lesson ID missing");
          }

          await submitLessonMutation.mutateAsync({
            reviewerId: reviewer || undefined,
          } as any);
          break;

        default:
          throw new Error("Invalid publish type");
      }

      setShowSubmitModal(false);

      notification.success({
        title: "Submitted for Review",
        description:
          "Status updated successfully to UNDER_REVIEW.",
      });

      onStatusUpdate?.();
      const activeRole = useAuthStore.getState().role || user?.role || "";
      const normalizedRole = activeRole.toUpperCase().replace(/\s+/g, "_");

      const returnToCourseId = (location.state as any)?.returnToCourseId || (location.state as any)?.courseId || searchParams.get("courseId");
      if (publishType === "standalone-lesson" && returnToCourseId) {
        navigate(`/studio/builder/2?type=course&courseId=${returnToCourseId}`, {
          state: { publishType: "standalone-course", courseId: returnToCourseId },
        });
        return;
      }

      let dashboardPath = "/super-admin-dashboard";
      if (normalizedRole === "CONTENT_DEVELOPER") dashboardPath = "/studio";
      else if (normalizedRole === "SME") dashboardPath = "/sme-dashboard";
      else if (normalizedRole === "CORPORATE_ADMIN") dashboardPath = "/corporate-admin-dashboard";

      navigate(dashboardPath);
    } catch (error: any) {
      console.error(error);

      notification.error({
        title: "Submission Failed",
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Something went wrong.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDirectPublish = async () => {
    if (isPublishedEdit) {
      notification.error({
        title: "Direct Publishing Blocked",
        description: "This is a Version 2 edit. You are not allowed to publish this version directly. Please submit it for SME Review.",
      });
      return;
    }

    if (!user?.id) {
      notification.error({
        title: "User not authenticated",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      switch (publishType) {
        case "career-path":
          if (!effectiveCareerPathId) {
            throw new Error("Career Path ID missing");
          }
          await publishCareerPathMutation.mutateAsync(user.id);
          break;

        case "standalone-course":
          if (!effectiveCourseId) {
            throw new Error("Course ID missing");
          }
          await publishCourseMutation.mutateAsync(user.id);
          break;

        case "standalone-lesson":
          if (!effectiveLessonId) {
            throw new Error("Lesson ID missing");
          }
          await publishLessonMutation.mutateAsync(user.id);
          break;

        default:
          throw new Error("Invalid publish type");
      }

      notification.success({
        title: "Published Successfully",
        description: "Status updated successfully to PUBLISHED.",
      });

      onStatusUpdate?.();
      const activeRole = useAuthStore.getState().role || user?.role || "";
      const normalizedRole = activeRole.toUpperCase().replace(/\s+/g, "_");

      let dashboardPath = "/super-admin-dashboard";
      if (normalizedRole === "CONTENT_DEVELOPER") dashboardPath = "/studio";
      else if (normalizedRole === "SME") dashboardPath = "/sme-dashboard";
      else if (normalizedRole === "CORPORATE_ADMIN") dashboardPath = "/corporate-admin-dashboard";

      navigate(dashboardPath);

    } catch (error: any) {
      console.error(error);
      notification.error({
        title: "Publishing Failed",
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Something went wrong.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-w-0 mt-6 space-y-6 pb-24">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT COLUMN (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Pre-submission Checklist Card (Matching Frame 60 & Screenshot 247) */}
          <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-2xs space-y-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-gray-300">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#141414]">Pre-submission checklist</h3>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${passedChecksCount === totalChecksCount
                ? "bg-[#ebf8f2] text-[#2d9d68] border-[#a3e6cd]"
                : "bg-amber-50 text-amber-700 border-amber-200"
                }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${passedChecksCount === totalChecksCount ? "bg-[#10b981]" : "bg-amber-500"}`}></span>
                {passedChecksCount} of {totalChecksCount} clear
              </span>
            </div>

            <div className="space-y-4 pt-1">
              {preSubmissionChecks.map((chk) => (
                <div key={chk.id} className="flex items-start gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${chk.passed ? (chk.optional ? "bg-gray-400" : "bg-[#829e79]") : "bg-[#c7913b]"}`} />
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-[#141414]">{chk.title}</h4>
                    <p className="text-xs text-[#5C5C5C] mt-0.5">{chk.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Completeness Checklist Card (Matching Screenshots 248-249) */}
          <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-2xs space-y-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-gray-300">
            <h3 className="text-base font-bold text-[#141414]">Completeness checklist</h3>

            <div className="space-y-3 text-xs font-medium text-[#3A3A3A]">
              {completenessItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${item.passed ? "bg-[#ecfdf5] text-[#10b981]" : "bg-amber-50 text-amber-600"
                    }`}>
                    {item.passed ? "✓" : "!"}
                  </span>
                  <span className="text-sm font-medium text-[#141414]">{item.label}</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-[#5C5C5C] font-medium pt-1">
              {readinessPercent === 100 ? "All checks passed. Ready to submit." : "Please resolve any missing required items before final submission."}
            </p>
          </div>

          {/* Submission Readiness Progress Bar (Matching Screenshot 249) */}
          <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-2xs space-y-3 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-gray-300">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#5C5C5C]">SUBMISSION READINESS</h3>
              <span className="text-sm font-extrabold text-[#141414]">{readinessPercent}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div className="bg-[#4d7c5f] h-2 rounded-full transition-all duration-300" style={{ width: `${readinessPercent}%` }} />
            </div>
            <p className="text-xs text-[#5C5C5C] font-medium">
              {readinessPercent === 100
                ? "All checks passed. This item is ready to submit for SME review."
                : `${totalChecksCount - passedChecksCount} item(s) pending before full submission readiness.`}
            </p>
          </div>

        </div>

        {/* RIGHT COLUMN (1 Col) */}
        <div className="space-y-6">

          {/* Submit for SME Review Card (Matching Screenshot 247 & Vercel) */}
          <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-2xs space-y-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-gray-300">
            <h3 className="text-base font-bold text-[#141414]">Submit for SME review</h3>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5C5C]">
                ASSIGN SME REVIEWER <span className="text-red-500">*</span>
              </label>
              <select
                value={reviewer}
                onChange={(e) => setReviewer(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-[#141414] shadow-2xs focus:outline-none focus:border-[#141414] cursor-pointer"
              >
                <option value="">Select SME reviewer</option>
                {reviewerUsers.map((u: any) => {
                  const name = u.name || `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email;
                  return (
                    <option key={u.id} value={u.id}>
                      {name} ({u.email})
                    </option>
                  );
                })}
              </select>
              {reviewerUsers.length === 0 && (
                <p className="text-xs text-amber-600 font-medium pt-0.5">
                  No SME reviewers loaded. Default administrator will review.
                </p>
              )}
            </div>



            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              disabled={isSubmitting}
              className="w-full bg-[#FCF7AE] hover:bg-[#FDF9C4] border border-[#e5df8a] text-[#141414] text-sm font-bold py-2.5 rounded-full shadow-2xs transition-colors cursor-pointer text-center active:scale-98"
            >
              {isSubmitting ? "Submitting..." : "Submit for review"}
            </button>

            <p className="text-xs text-[#5C5C5C] font-medium text-left leading-normal">
              Course will be locked from edits until SME approves or rejects.
            </p>

            <div className="pt-2">
              <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-between">
                <span className="text-xs font-medium text-[#3A3A3A] flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Ask a question about this course
                </span>
                <span className="bg-gray-200/80 text-gray-600 text-[10px] font-extrabold px-1.5 py-0.5 rounded">
                  SOON
                </span>
              </div>
            </div>
          </div>

          {/* Direct Publication OR Change Summary Card (spec §3, §7, §9, §11, §12, §18) */}
          {!isPublishedEdit ? (
            /* Direct Publish Card (First-time creation Version 1 only) */
            <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-2xs space-y-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-gray-300">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#141414]">Direct Publication</h3>
                <span className="bg-[#ebf8f2] text-[#2d9d68] text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-[#a3e6cd]">
                  AVAILABLE
                </span>
              </div>

              <p className="text-xs text-[#5C5C5C] font-medium leading-relaxed">
                Publish directly to make this {publishType === "standalone-lesson" ? "lesson" : publishType === "career-path" ? "career path" : "course"} immediately visible in the platform catalog.
              </p>

              <button
                type="button"
                onClick={() => setShowDirectPublishModal(true)}
                disabled={isSubmitting}
                className="w-full bg-[#2d7a4f] hover:bg-[#246340] border border-[#2d7a4f] text-white text-sm font-bold py-2.5 rounded-full shadow-2xs transition-colors cursor-pointer text-center active:scale-98 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Publishing...
                  </>
                ) : (
                  `Publish ${publishType === "standalone-lesson" ? "lesson" : publishType === "career-path" ? "career path" : "course"} now`
                )}
              </button>
            </div>
          ) : (
            /* Change Summary Chat Box — shown ONLY when editing already-published content (spec §7, §9, §11, §12) */
            <div className="bg-white border border-amber-200/90 rounded-2xl p-6 shadow-2xs space-y-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-amber-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-[#141414]">Change Summary</h3>
                </div>
                <span className="bg-[#fef3c7] text-[#92400e] text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-[#fde68a]">
                  VERSION 2 REVISION
                </span>
              </div>

              <div className="flex items-start gap-2 bg-amber-50/70 border border-amber-200/60 rounded-xl p-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[12px] text-amber-800 font-normal leading-relaxed">
                  You are editing already-published content. Direct publishing is disabled. Please describe your changes, click <strong>Save Changes</strong>, and submit for SME Review.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5C5C]">
                  Changes Made <span className="text-amber-600">*</span>
                </label>
                <textarea
                  value={changeSummaryText}
                  onChange={(e) => setChangeSummaryText(e.target.value)}
                  placeholder={"Describe the changes you made, e.g.:\n- Updated course title\n- Updated skills\n- Updated tags\n- Replaced thumbnail"}
                  rows={4}
                  maxLength={500}
                  className="w-full bg-amber-50/30 border border-amber-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 font-normal leading-relaxed resize-none focus:outline-none focus:border-amber-500 shadow-2xs"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-500">Min 5 characters</span>
                  <span className="text-[11px] text-gray-400">{changeSummaryText.length}/500</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveChangeSummary}
                disabled={isSavingSummary || changeSummaryText.trim().length < 5}
                className="w-full bg-[#141414] hover:bg-gray-800 text-white text-xs font-bold py-2.5 px-4 rounded-full shadow-2xs transition-colors cursor-pointer text-center active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSavingSummary ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}


          {/* Preview as Learner Card (Matching Screenshot 248 & Vercel) */}
          <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-2xs space-y-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-gray-300">
            <h4 className="text-base font-bold text-[#141414]">Preview</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#ebf8f2] flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-[#2d9d68]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#141414]">Preview the entire course as a learner</p>
                  <p className="text-xs text-[#5C5C5C] font-medium leading-relaxed mt-1">
                    Walk through every lesson (video and text) and the assessment exactly as a learner will see it.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigate("/studio/preview", {
                    state: {
                      entityType: publishType === "standalone-lesson" ? "lesson" : publishType === "career-path" ? "career-path" : "course",
                      entityId: effectiveCourseId || effectiveLessonId || effectiveCareerPathId || "",
                      courseName: entityTitle || "Course Preview",
                      course: {
                        id: effectiveCourseId || effectiveLessonId || effectiveCareerPathId || "",
                        title: entityTitle,
                        ...formData,
                      },
                    },
                  });
                }}
                className="w-full bg-[#FCF7AE] hover:bg-[#FDF9C4] border border-[#e5df8a] text-[#141414] text-sm font-bold py-2.5 rounded-full shadow-2xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
              >
                <svg className="w-3.5 h-3.5 text-[#141414]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Preview as learner
              </button>
            </div>
          </div>

          {/* Learning Credential Card (Matching Screenshot 248 & 249) */}
          <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-2xs space-y-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-gray-300">
            <h3 className="text-base font-bold text-[#141414]">Learning credential</h3>

            <label className="flex items-center gap-2.5 text-xs font-bold text-[#141414] cursor-pointer select-none">
              <div
                onClick={() => setIssueCertificate(!issueCertificate)}
                className={`w-4 h-4 rounded flex items-center justify-center transition-colors cursor-pointer ${issueCertificate
                  ? "bg-[#2d7a4f] text-white"
                  : "border border-gray-300 bg-white"
                  }`}
              >
                {issueCertificate && (
                  <span className="text-[10px] font-extrabold leading-none">✓</span>
                )}
              </div>
              <span className="text-sm font-semibold text-[#141414]">Issue completion certificate</span>
            </label>

            <p className="text-xs text-gray-500 font-medium leading-relaxed">
              Learners earn the standard Nexus Academy completion certificate after finishing all lessons and passing the final assessment.
            </p>

            <div className="bg-[#fbf4de] border border-[#faeec7] rounded-xl p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-[#c4923e]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-[13px] font-bold text-gray-900">Standard Nexus Academy completion certificate</p>
                <p className="text-[11px] text-gray-500 font-medium">Verifiable at nexusacademy.org/verify/</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowCertPreviewModal(true)}
              className="w-full bg-white border border-gray-300 text-gray-800 text-[13px] font-semibold py-2.5 rounded-full hover:bg-gray-50 transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              Preview certificate →
            </button>
          </div>

        </div>

      </div>

      {/* Submit for Review Confirmation Modal (Matching Screenshot) */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[1px] animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => !isSubmitting && setShowSubmitModal(false)}
          />
          <div className="relative bg-white rounded-2xl p-7 max-w-[480px] w-full shadow-2xl space-y-4 border border-gray-100 z-10">
            <h3 className="text-[20px] font-bold text-gray-900 tracking-tight">
              Submit for review?
            </h3>
            <p className="text-[14px] text-gray-600 leading-relaxed font-normal">
              The {publishType === "standalone-lesson" ? "lesson" : publishType === "career-path" ? "career path" : "course"} will be sent to <strong className="font-bold text-gray-900">{reviewerDisplayName || "the assigned reviewer"}</strong> and locked from edits until a decision is made.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                disabled={isSubmitting}
                className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-[13px] font-semibold px-5 py-2 rounded-full transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitForReview}
                disabled={isSubmitting}
                className="bg-[#fff6a6] hover:bg-[#ffef76] border border-[#e4c438] text-[#171717] text-[13px] font-bold px-5 py-2 rounded-full shadow-[0_2px_8px_rgba(197,151,34,0.15)] transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-gray-800 border-t-transparent rounded-full animate-spin"></span>
                    Submitting...
                  </>
                ) : (
                  "Confirm & submit"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct Publish Confirmation Modal */}
      {showDirectPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[1px] animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => !isSubmitting && setShowDirectPublishModal(false)}
          />
          <div className="relative bg-white rounded-2xl p-7 max-w-[480px] w-full shadow-2xl space-y-4 border border-gray-100 z-10">
            <h3 className="text-[20px] font-bold text-gray-900 tracking-tight">
              Publish directly?
            </h3>
            <p className="text-[14px] text-gray-600 leading-relaxed font-normal">
              This {publishType === "standalone-lesson" ? "lesson" : publishType === "career-path" ? "career path" : "course"} will be marked as <strong className="font-bold text-gray-900">PUBLISHED</strong> and made immediately accessible to enrolled learners and catalog visitors.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowDirectPublishModal(false)}
                disabled={isSubmitting}
                className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-[13px] font-semibold px-5 py-2 rounded-full transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowDirectPublishModal(false);
                  await handleDirectPublish();
                }}
                disabled={isSubmitting}
                className="bg-[#2d7a4f] hover:bg-[#246340] border border-[#2d7a4f] text-white text-[13px] font-bold px-5 py-2 rounded-full shadow-[0_2px_8px_rgba(45,122,79,0.2)] transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Publishing...
                  </>
                ) : (
                  "Confirm & publish now"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCertPreviewModal && (
        <ContentDeveloperCertificateModal
          isOpen={showCertPreviewModal}
          onClose={() => setShowCertPreviewModal(false)}
          entityTitle={entityTitle}
          publishType={publishType}
          entityId={
            publishType === "standalone-lesson"
              ? effectiveLessonId
              : publishType === "career-path"
                ? effectiveCareerPathId
                : effectiveCourseId
          }
          authorName={user?.name || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || undefined}
        />
      )}
    </div>

  );
};

export default CourseBuilderReview;
