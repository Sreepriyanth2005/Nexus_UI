
import Select from "react-select";
import React, { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router";
import LanguageList from "language-list";
import { useAdminCourseById } from "../../hooks/admin-courses/useAdminCourses";
import { useLesson } from "../../hooks/lesson/useLessons";
import { useLearningPath } from "../../hooks/admin-learning-path/useAdminLearningPath";
import { useCareerPaths } from "../../hooks/career-path/useCareerPaths";
import { useSubcategories } from "../../hooks/category/useSubcategories";
import { useSubjects } from "../../hooks/useSubjects";
import { useCategories } from "../../hooks/category/useCategories";
import { useVisibilities, useDifficultyLevels, useLessonStatuses, useLessonTypes } from "../../hooks/useEnums";
import { getTenantsApi } from "../../core/api/tenant.api";
import { useQuery, useQueries, useQueryClient } from "@tanstack/react-query";
import { useSkills, useTags } from "../../hooks/useMaster";
import { useCourses } from "../../hooks/course/useCourses";
import { useCourseLessons } from "../../hooks/course/useCourseLessons";
import { useCourseLessonStore } from "../../store/course/courseLessonStore";
import { useCreateLesson } from "../../hooks/lesson/useLessons";
import { createSkillApi } from "../../core/api/skill/skill.api";
import { createTagApi } from "../../core/api/tag/tag.api";
import { LessonFormData, ContentDeveloperStandardLessonRef, } from "../ContentDeveloper/ContentDeveloperStandardLesson";
import { getCourseLessonsApi, createCourseLessonApi } from "../../core/api/course/course-lesson.api";

import type CourseLesson from "./CourseBuilderLessons";
import { getUniqueLessonMaterials } from "./CourseBuilderLessons";
import { useAssets } from "../../hooks/asset/useAssets";
import { useUpdateLesson } from "../../hooks/lesson/useLessons";
import { createCareerPathTagApi } from "../../core/api/career-path/careerpath-tag.api";
import { createCareerPathSkillApi } from "../../core/api/career-path/careerpath-skill.api";
import type { LessonContent, } from "../ContentDeveloper/ContentDeveloperStandardLesson";
import StandaloneCourseLessonAdded from "./StandaloneCourseLessonAdded";
import CourseBuilderHeader from "../../components/course-builder/CourseBuilderHeader";
import CourseBuilderStepper, { CourseBuilderSection } from "../../components/course-builder/CourseBuilderStepper";
import CourseBuilderStepRenderer from "../../components/course-builder/CourseBuilderStepRenderer";
import { detectMediaDuration, formatDurationToMinutes, getDisplayFileName } from "../../utils/mediaDuration";

//quiz api
import { createQuestionBankApi, createQuestionGroupApi, updateQuestionGroupApi, createQuestionOptionApi, createQuizApi, createQuizQuestionApi, getQuizzesApi, getQuizByIdApi, deleteQuizApi, updateQuizApi, deleteQuestionBankApi, deleteQuizQuestionApi, updateQuestionBankApi, updateQuestionOptionApi, deleteQuestionOptionApi, updateQuizQuestionApi } from "../../core/api/assessment.api";
import { Modal, Spin, notification } from "antd";
import { deleteCareerPathApi } from "../../core/api/career-path/career-path.api";
import { courseApi } from "../../core/api/course/course.api";
import { deleteLessonApi } from "../../core/api/lesson/lesson.api";
import { deleteAssetApi } from "../../core/api/asset/asset.api";
import { useUserStore } from "../../store/user.store";
import { ErrorBoundary } from "../../components/common/ErrorBoundary";

//quiz work end

const languageList = new LanguageList();
const languages = languageList.getData();
type PublishType = "career-path" | "standalone-course" | "standalone-lesson";

interface CourseItem {
  id: string;
  title: string;
  order: number;
}

export interface CreateCourseFormData extends Omit<LessonFormData, "learningOutcomes"> {
  learningPath: string;
  visibility: string;
  corporateTenant: string[];
  assessmentRequired: boolean;
  careerPathTitle: string;
  careerPathSubtitle: string;
  category: string;
  status: string;
  description: string;
  prerequisitePath: string;
  skillTags: string[];
  existingLessonIds: string[];
  existingCourseIds: string[];
  constituentCourses: CourseItem[];
  coverImage: File | null;
  priceTier: string;
  courseTitle: string;
  courseSubtitle: string;
  coursethumbnail: File | null;
  courseThumbnailAssetId?: string;
  courseThumbnailAssetUrl?: string;
  tagline: string;
  fullDescription: string;
  subjectId: string;
  categoryId: string;
  subcategoryId: string;
  difficulty: string;
  duration: string;
  learningOutcomes: string;
  shortDescription: string;
  learningObjectives: string;
  targetAudience: string;
  prerequisites: string;
  careerPathLink: string;
  language: string;
  thumbnail: File | null;
  thumbnailAssetId?: string;
  thumbnailAssetUrl?: string;
  tags: string[];
  skillsGain: string;
  attachment: File | null;
  attachmentAssetUrl?: string;
  supportingMaterialFile: File | null;
  supportingMaterialUrl?: string;
  supportingMaterialName?: string;
  supportingMaterialAssetId?: string;
  removedSupportingMaterial?: boolean;
  existingAttachments: Array<{ id: string; name: string; url?: string; size?: number }>;
  removedAttachmentIds: string[];
  coverImageAssetUrl?: string;
  authorName?: string;
  instructorDesignation?: string;
  previewLessonIds?: string[];
  whatIsIncluded?: string | string[];
  textVersion?: string;
  transcriptAssetUrl?: string;
  transcriptAssetName?: string;
  primaryContentAssetUrl?: string;
  primaryContentAssetName?: string;
  pricing?: string;
}

export interface CourseLesson {
  id: string;
  title: string;
  lessonType: string;
  duration?: number;
  shortDescription?: string;
  status?: string;
}

const normalizeLessonContents = (contents: LessonContent[] = []): LessonContent[] =>
  contents.map((content) => {
    const format = String(content.format || "").toUpperCase();
    const blockFormats = new Set(content.blocks.map((block) => block.blockType));
    const normalizedFormat = ["VIDEO", "TEXT_IMAGE", "PDF", "AUDIO"].includes(format)
      ? format
      : blockFormats.has("VIDEO")
        ? "VIDEO"
        : blockFormats.has("PDF")
          ? "PDF"
          : blockFormats.has("AUDIO")
            ? "AUDIO"
            : "TEXT_IMAGE";

    return { ...content, format: normalizedFormat };
  });

const relationNames = (items: any[] = [], relationKey: "skill" | "tag", catalog: any[] = []) =>
  items
    .map((item: any) => {
      if (typeof item === "string") {
        const catalogItem = catalog.find((entry: any) => entry.id === item || entry.name?.toLowerCase() === item.toLowerCase());
        return catalogItem?.name || (!/^[0-9a-fA-F-]{20,}$/.test(item) && !/^\d+$/.test(item) ? item : "");
      }
      const directName = item?.[relationKey]?.name || item?.name;
      if (directName) return directName;
      const idVal = item?.[`${relationKey}Name`] || item?.[`${relationKey}Id`] || item?.id;
      const catalogItem = catalog.find((entry: any) => entry.id === idVal || entry.name === idVal);
      return catalogItem?.name || (idVal && !/^[0-9a-fA-F-]{20,}$/.test(String(idVal)) && !/^\d+$/.test(String(idVal)) ? idVal : "");
    })
    .filter(Boolean);

const assetUrl = (asset: any) =>
  asset?.signedUrl || asset?.url || asset?.fileUrl || asset?.externalUrl || asset?.asset?.signedUrl || asset?.asset?.url || asset?.asset?.fileUrl || "";

const firstAssetUrl = (assets: any[] = [], predicate?: (asset: any) => boolean) =>
  assetUrl(assets.find((asset) => !predicate || predicate(asset)));

const assetTypeOf = (asset: any) => asset?.assetType || asset?.asset?.assetType || "";
const storagePathOf = (asset: any) => asset?.storagePath || asset?.asset?.storagePath || "";

// Helpers for clean initial states
export const getInitialCourseFormData = (): CreateCourseFormData => ({
  learningPath: "",
  visibility: "PUBLIC_CATALOG",
  corporateTenant: [],
  assessmentRequired: true,
  careerPathTitle: "",
  careerPathSubtitle: "",
  category: "",
  status: "DRAFT",
  description: "",
  prerequisitePath: "",
  skillTags: [],
  existingLessonIds: [],
  existingCourseIds: [],
  constituentCourses: [],
  coverImage: null,
  priceTier: "FREE",
  courseTitle: "",
  courseSubtitle: "",
  coursethumbnail: null,
  courseThumbnailAssetId: "",
  courseThumbnailAssetUrl: "",
  tagline: "",
  fullDescription: "",
  subjectId: "",
  categoryId: "",
  subcategoryId: "",
  difficulty: "BEGINNER",
  duration: "",
  learningOutcomes: "",
  shortDescription: "",
  learningObjectives: "",
  targetAudience: "",
  prerequisites: "",
  careerPathLink: "",
  language: "English",
  lessonTitle: "",
  lessonType: "VIDEO",
  authorName: "Nexus Academy",
  instructorDesignation: "",
  textVersion: "",
  lessonDescription: "",
  primaryContent: null,
  transcript: null,
  lessonAttachments: [],
  lessonContents: [],
  thumbnail: null,
  thumbnailAssetId: "",
  thumbnailAssetUrl: "",
  tags: [],
  skillsGain: "",
  attachment: null,
  supportingMaterialFile: null,
  supportingMaterialUrl: "",
  supportingMaterialName: "",
  supportingMaterialAssetId: "",
  removedSupportingMaterial: false,
  existingAttachments: [],
  removedAttachmentIds: [],
  allowPreview: false,
  previewDuration: null,
  previewAccessType: "NONE",
  primaryContentAssetUrl: "",
  primaryContentAssetName: "",
  transcriptAssetName: "",
});

export const getInitialLessonFormData = (): CreateCourseFormData => ({
  learningPath: "",
  visibility: "PUBLIC_CATALOG",
  corporateTenant: [],
  assessmentRequired: false,
  careerPathTitle: "",
  careerPathSubtitle: "",
  category: "",
  status: "DRAFT",
  description: "",
  prerequisitePath: "",
  skillTags: [],
  existingLessonIds: [],
  existingCourseIds: [],
  constituentCourses: [],
  coverImage: null,
  priceTier: "FREE",
  courseTitle: "",
  courseSubtitle: "",
  coursethumbnail: null,
  courseThumbnailAssetId: "",
  courseThumbnailAssetUrl: "",
  tagline: "",
  fullDescription: "",
  subjectId: "",
  categoryId: "",
  subcategoryId: "",
  difficulty: "BEGINNER",
  duration: "",
  learningOutcomes: "",
  shortDescription: "",
  learningObjectives: "",
  targetAudience: "",
  prerequisites: "",
  careerPathLink: "",
  language: "English",
  lessonTitle: "",
  lessonType: "VIDEO",
  authorName: "Nexus Academy",
  instructorDesignation: "",
  textVersion: "",
  lessonDescription: "",
  primaryContent: null,
  transcript: null,
  lessonAttachments: [],
  lessonContents: [],
  thumbnail: null,
  thumbnailAssetId: "",
  thumbnailAssetUrl: "",
  tags: [],
  skillsGain: "",
  attachment: null,
  supportingMaterialFile: null,
  supportingMaterialUrl: "",
  supportingMaterialName: "",
  supportingMaterialAssetId: "",
  removedSupportingMaterial: false,
  existingAttachments: [],
  removedAttachmentIds: [],
  allowPreview: false,
  previewDuration: null,
  previewAccessType: "NONE",
  primaryContentAssetUrl: "",
  primaryContentAssetName: "",
  transcriptAssetName: "",
});

export const getInitialCareerPathFormData = (): CreateCourseFormData => ({
  ...getInitialCourseFormData(),
  priceTier: "FREE",
  difficulty: "BEGINNER",
});

const CreateCourse: React.FC = () => {
  const lessonRef = useRef<ContentDeveloperStandardLessonRef>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const state = location.state as { courseId?: string; lessonId?: string; pathId?: string; returnToCourseId?: string; publishType?: PublishType } | null;

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const typeParam = searchParams.get("type");

  const initialPublishType: PublishType =
    typeParam === "lesson" || typeParam === "standalone-lesson"
      ? "standalone-lesson"
      : typeParam === "course" || typeParam === "standalone-course"
        ? "standalone-course"
        : typeParam === "career-path" || typeParam === "path"
          ? "career-path"
          : state?.publishType ||
          (location.pathname.includes("/standalone-lesson")
            ? "standalone-lesson"
            : location.pathname.includes("/path-builder") || state?.pathId
              ? "career-path"
              : "standalone-course");

  const [publishType, setPublishType] = useState<PublishType>(initialPublishType);

  useEffect(() => {
    if (typeParam === "lesson" || typeParam === "standalone-lesson") {
      setPublishType("standalone-lesson");
    } else if (typeParam === "course" || typeParam === "standalone-course") {
      setPublishType("standalone-course");
    } else if (typeParam === "career-path" || typeParam === "path") {
      setPublishType("career-path");
    }
  }, [typeParam]);

  const [formData, setFormData] = useState<CreateCourseFormData>(() => {
    const isChildLesson = Boolean((location.state as any)?.returnToCourseId || (location.state as any)?.courseId);
    const initialData = initialPublishType === "standalone-lesson"
      ? getInitialLessonFormData()
      : initialPublishType === "career-path"
        ? getInitialCareerPathFormData()
        : getInitialCourseFormData();

    // Prefer location.state; fall back to URL search params (survives page refresh)
    const pvState = (location.state as any)?.parentVisibility;
    const pvParam = new URLSearchParams(location.search).get("parentVisibility");
    const parentVisibility = pvState || pvParam;
    const parentCorporateTenant = (location.state as any)?.parentCorporateTenant ||
      (() => { try { return JSON.parse(new URLSearchParams(location.search).get("parentCorporateTenant") || "null") || []; } catch { return []; } })();

    if (initialPublishType === "standalone-lesson" && isChildLesson && parentVisibility) {
      initialData.visibility = parentVisibility;
      initialData.corporateTenant = parentCorporateTenant;
    }
    return initialData;
  });

  const getSectionFromPath = (path: string, type: PublishType, isAssessmentRequired?: boolean): "info" | "lessons" | "assessment" | "review" => {
    const assessmentEnabled = isAssessmentRequired !== false;
    if (type === "standalone-lesson") {
      if (path.includes("/builder/2")) return assessmentEnabled ? "assessment" : "review";
      if (path.includes("/builder/3")) return "review";
      return "info";
    }
    if (path.includes("/builder/2") || path.includes("/Course-Builder-Lessons")) return "lessons";
    if (path.includes("/builder/3")) return assessmentEnabled ? "assessment" : "review";
    if (path.includes("/builder/4")) return "review";
    return "info";
  };

  const [activeSection, setActiveSection] = useState<"info" | "lessons" | "assessment" | "review">(
    () => getSectionFromPath(location.pathname, initialPublishType, formData?.assessmentRequired)
  );

  useEffect(() => {
    setActiveSection(getSectionFromPath(location.pathname, publishType, formData?.assessmentRequired));
  }, [location.pathname, publishType, formData?.assessmentRequired]);

  //my quiz work start
  const [assessmentQuestions, setAssessmentQuestions] = useState<any[]>([]);
  const [savingAssessment, setSavingAssessment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  const [createdCareerPathId, setCreatedCareerPathId] = useState<string | null>(null);
  const [createdCourseId, setCreatedCourseId] = useState<string | null>(null);
  const [createdLessonId, setCreatedLessonId] = useState<string | null>(null);
  const [savingStatusMessage, setSavingStatusMessage] = useState<string>("");
  const [assessmentSettings, setAssessmentSettings] = useState({
    passingScore: "70",
    timeLimit: "30",
    attemptCount: "2",
    randomize: false,
    lockTab: false,
  });
  const isQuizSavedRef = useRef(false);
  const prevAssessmentQuestionsRef = useRef<any[]>([]);

  useEffect(() => {
    if (assessmentQuestions !== prevAssessmentQuestionsRef.current) {
      isQuizSavedRef.current = false;
      prevAssessmentQuestionsRef.current = assessmentQuestions;
    }
  }, [assessmentQuestions]);


  // ==================== EDIT MODE & ID RESOLUTION ====================
  const { courseId: routeCourseId, lessonId: routeLessonId, pathId: routePathId } = useParams<{ courseId?: string; lessonId?: string; pathId?: string }>();
  const queryCourseId = searchParams.get("courseId");
  const queryLessonId = searchParams.get("lessonId");
  const queryPathId = searchParams.get("pathId");
  const queryReturnToCourseId = searchParams.get("returnToCourseId");

  const explicitCourseId = routeCourseId || queryCourseId || (state?.publishType === "standalone-course" ? state?.courseId : undefined) || null;
  const explicitLessonId = routeLessonId || queryLessonId || (state?.publishType === "standalone-lesson" ? state?.lessonId : undefined) || null;
  const explicitPathId = routePathId || queryPathId || (state?.publishType === "career-path" ? state?.pathId : undefined) || null;

  const isExplicitNewLesson = Boolean(
    (state as any)?.isNewLesson ||
    (publishType === "standalone-lesson" && !explicitLessonId)
  );

  // Strictly isolate entity IDs based on the active publishType
  const resolvedCourseId = publishType === "standalone-course"
    ? (explicitCourseId || createdCourseId || null)
    : null;

  const resolvedLessonId = publishType === "standalone-lesson"
    ? (isExplicitNewLesson ? createdLessonId || null : (explicitLessonId || createdLessonId || null))
    : null;

  const resolvedPathId = publishType === "career-path"
    ? (explicitPathId || createdCareerPathId || null)
    : null;

  const courseId = resolvedCourseId;
  const lessonId = resolvedLessonId;
  const pathId = resolvedPathId;
  const returnToCourseId = queryReturnToCourseId || queryCourseId || state?.returnToCourseId || (state?.publishType === "standalone-lesson" ? state?.courseId : undefined) || null;
  const isEditMode = Boolean(courseId) || Boolean(lessonId) || Boolean(pathId);

  // Synchronize active ID with created ID state
  useEffect(() => {
    if (publishType === "standalone-lesson" && lessonId && createdLessonId !== lessonId) {
      setCreatedLessonId(lessonId);
    } else if (publishType === "standalone-course" && courseId && createdCourseId !== courseId) {
      setCreatedCourseId(courseId);
    } else if (publishType === "career-path" && pathId && createdCareerPathId !== pathId) {
      setCreatedCareerPathId(pathId);
    }
  }, [publishType, lessonId, courseId, pathId, createdLessonId, createdCourseId, createdCareerPathId]);

  // Clean state reset when authoring a new lesson
  const lastLocationKeyRef = useRef<string>(location.key);
  useEffect(() => {
    if (lastLocationKeyRef.current !== location.key) {
      lastLocationKeyRef.current = location.key;
      if (publishType === "standalone-lesson" && !explicitLessonId && !createdLessonId && (location.state as any)?.isNewLesson) {
        console.log("?? Resetting state for fresh lesson creation");
        setCreatedLessonId(null);
        hydratedLessonIdRef.current = null;
        const initialData = getInitialLessonFormData();
        {
          const pvS = (location.state as any)?.parentVisibility;
          const pvP = new URLSearchParams(location.search).get("parentVisibility");
          const pVis = pvS || pvP;
          const pTenant = (location.state as any)?.parentCorporateTenant ||
            (() => { try { return JSON.parse(new URLSearchParams(location.search).get("parentCorporateTenant") || "null") || []; } catch { return []; } })();
          if (pVis) {
            initialData.visibility = pVis;
            initialData.corporateTenant = pTenant;
          }
        }
        setFormData(initialData);
      }
    }
  }, [location.key, publishType, isExplicitNewLesson, explicitLessonId, location.state]);

  const { data: adminCourseData, isLoading: isLoadingCourse } = useAdminCourseById(courseId || "", Boolean(courseId && publishType === "standalone-course"));
  const courseToEdit = publishType === "standalone-course" ? (adminCourseData?.data || adminCourseData) : null;

  const { data: lessonData, isLoading: isLoadingLesson } = useLesson(lessonId || undefined);
  const lessonToEdit = publishType === "standalone-lesson" ? (lessonData?.data || lessonData) : null;

  const { data: pathData, isLoading: isLoadingPath } = useLearningPath(pathId || "");
  const pathToEdit = publishType === "career-path" ? pathData : null;

  const user = useUserStore((state) => state.user);

  const { getAllAssets } = useAssets();
  const [courseAssetsData, setCourseAssetsData] = useState<any[]>([]);

  useEffect(() => {
    const activeQueryId = courseId || lessonId || pathId;
    if (activeQueryId) {
      const query: any = {};
      if (courseId && publishType === "standalone-course") query.courseId = courseId;
      if (lessonId && publishType === "standalone-lesson") query.lessonId = lessonId;
      if (pathId && publishType === "career-path") query.careerPathId = pathId;

      getAllAssets(query).then(setCourseAssetsData).catch(console.error);
    }
  }, [courseId, lessonId, pathId, publishType, getAllAssets]);

  // Auto-hydrate quiz questions and settings from backend database
  useEffect(() => {
    const activeId = courseId || lessonId || pathId;
    if (!activeId) return;

    let isMounted = true;
    const loadExistingQuiz = async () => {
      try {
        const query: any = {};
        if (publishType === "career-path" && pathId) query.careerPathId = pathId;
        else if (publishType === "standalone-course" && courseId) query.courseId = courseId;
        else if (publishType === "standalone-lesson" && lessonId) query.lessonId = lessonId;
        else return;

        const res = await getQuizzesApi(query);
        let quizzesArray: any[] = [];
        if (Array.isArray(res)) quizzesArray = res;
        else if (Array.isArray(res?.data)) quizzesArray = res.data;
        else if (Array.isArray(res?.data?.data)) quizzesArray = res.data.data;
        else if (Array.isArray(res?.data?.items)) quizzesArray = res.data.items;
        else if (Array.isArray(res?.items)) quizzesArray = res.items;

        if (quizzesArray.length > 0 && isMounted) {
          const quiz = publishType === "standalone-course"
            ? (quizzesArray.find((q: any) => !q.lessonId && !q.lesson_id) || quizzesArray[0])
            : (publishType === "standalone-lesson"
              ? (quizzesArray.find((q: any) => String(q.lessonId || q.lesson_id) === String(lessonId)) || quizzesArray[0])
              : (quizzesArray.find((q: any) => !q.lessonId && !q.lesson_id && !q.courseId && !q.course_id) || quizzesArray[0]));

          if (quiz?.passingScore !== undefined) {
            setAssessmentSettings({
              passingScore: String(quiz.passingScore ?? "70"),
              timeLimit: String(quiz.timeLimitMinutes ?? "30"),
              attemptCount: String(quiz.maxAttempts ?? "2"),
              randomize: Boolean(quiz.randomizeQuestions),
              lockTab: Boolean(quiz.lockBrowserTab),
            });
          }

          const quizDetailRes = await getQuizByIdApi(quiz.id);
          const fullQuiz = quizDetailRes?.data || quizDetailRes;

          if (fullQuiz?.quizQuestions && isMounted) {
            const groupMap = new Map<string, any>();
            const standaloneQuestions: any[] = [];

            const sortedQQs = [...fullQuiz.quizQuestions].sort(
              (a: any, b: any) => (a.sequenceOrder ?? 0) - (b.sequenceOrder ?? 0)
            );

            for (const qq of sortedQQs) {
              const qb = qq.question;
              if (!qb) continue;

              const correctAnswerIndex = qb.questionOptions?.findIndex((o: any) => o.isCorrect) ?? 0;
              const options = qb.questionOptions
                ?.sort((a: any, b: any) => a.displayOrder - b.displayOrder)
                .map((o: any) => o.optionText) || [];

              if (qb.questionGroupId && qb.questionGroup) {
                const qg = qb.questionGroup;
                const isPassage = qg.groupType === "ESSAY" || !!qg.passageText || !!qb.commonEssayText;
                const isImageGroup = qg.groupType === "IMAGE" || !!qg.imageFileId;

                if (!groupMap.has(qb.questionGroupId)) {
                  if (isPassage) {
                    groupMap.set(qb.questionGroupId, {
                      id: qg.id,
                      questionGroupId: qg.id,
                      type: "ESSAY",
                      title: qg.title || "Passage",
                      passageText: qg.passageText || qb.commonEssayText || "",
                      question: qg.title || "Passage",
                      note: "",
                      questions: [],
                    });
                  } else if (isImageGroup) {
                    groupMap.set(qb.questionGroupId, {
                      id: qg.id,
                      questionGroupId: qg.id,
                      type: "IMAGE",
                      imageFile: "",
                      imagePreview: qg.imageFile?.url || qg.imageFile?.signedUrl || "",
                      questions: [],
                    });
                  } else {
                    groupMap.set(qb.questionGroupId, {
                      id: qg.id,
                      questionGroupId: qg.id,
                      type: qg.groupType || "ESSAY",
                      title: qg.title || "",
                      passageText: qg.passageText || "",
                      questions: [],
                    });
                  }
                }

                const currentGroup = groupMap.get(qb.questionGroupId);
                currentGroup.questions.push({
                  id: qq.id,
                  questionId: qb.id,
                  type: qb.questionType,
                  question: qb.questionText,
                  options,
                  correctAnswer: correctAnswerIndex >= 0 ? correctAnswerIndex : 0,
                });
                currentGroup.note = `${currentGroup.questions.length} sub-question${currentGroup.questions.length > 1 ? "s" : ""}`;
              } else {
                if (qb.questionType === "MCQ") {
                  standaloneQuestions.push({
                    id: qq.id,
                    questionId: qb.id,
                    type: "MCQ",
                    question: qb.questionText,
                    options,
                    correctAnswer: correctAnswerIndex >= 0 ? correctAnswerIndex : 0,
                  });
                } else if (qb.questionType === "TRUE_FALSE") {
                  standaloneQuestions.push({
                    id: qq.id,
                    questionId: qb.id,
                    type: "TRUE_FALSE",
                    question: qb.questionText,
                    options: options.length === 2 ? options : ["True", "False"],
                    correctAnswer: correctAnswerIndex >= 0 ? correctAnswerIndex : 0,
                  });
                } else if (qb.questionType === "IMAGE") {
                  standaloneQuestions.push({
                    id: qq.id,
                    questionId: qb.id,
                    type: "IMAGE",
                    question: qb.questionText,
                    imagePreview: qb.commonImageFile?.url || qb.commonImageFile?.signedUrl || qb.imageUrl || "",
                    options,
                    correctAnswer: correctAnswerIndex >= 0 ? correctAnswerIndex : 0,
                  });
                } else if (qb.questionType === "ESSAY") {
                  standaloneQuestions.push({
                    id: qq.id,
                    questionId: qb.id,
                    type: "ESSAY",
                    title: qb.questionText,
                    passageText: qb.commonEssayText || "",
                    question: qb.questionText,
                    note: "1 sub-question",
                    questions: [
                      {
                        id: qq.id,
                        questionId: qb.id,
                        type: "MCQ",
                        question: qb.questionText,
                        options,
                        correctAnswer: correctAnswerIndex >= 0 ? correctAnswerIndex : 0,
                      },
                    ],
                  });
                }
              }
            }

            const reconstructed = [...groupMap.values(), ...standaloneQuestions];
            if (reconstructed.length > 0) {
              setAssessmentQuestions(reconstructed);
            }
          }
        }
      } catch (err) {
        console.error("Failed to auto-hydrate quiz questions:", err);
      }
    };

    loadExistingQuiz();
    return () => {
      isMounted = false;
    };
  }, [courseId, lessonId, pathId, publishType]);


  const handleAssessmentNext = async (overrideTargetLessonId?: string, silent: boolean = false) => {
    const savedQuestions: any[] = [];
    const failedQuestions: any[] = [];
    try {
      setSavingAssessment(true);
      // 0. VALIDATION
      if (!user?.id) {
        notification.error({
          title: "User not found",
          description: "Please login again",
        });
        return;
      }
      if (!assessmentQuestions?.length) {
        notification.error({
          title: "No Questions",
          description: "Please add at least one question",
        });
        return;
      }
      // 1. CHECK FOR EXISTING QUIZ AND UPDATE OR KEEP IT
      let quizId = "";
      let fullQuizData: any = null;
      const query: any = {};
      const targetCareerPathId = pathId || createdCareerPathId;
      const targetCourseId = courseId || createdCourseId;
      const targetLessonId = overrideTargetLessonId || lessonId || createdLessonId;

      if (publishType === "career-path" && targetCareerPathId) query.careerPathId = targetCareerPathId;
      else if (publishType === "standalone-course" && targetCourseId) query.courseId = targetCourseId;
      else if (publishType === "standalone-lesson" && targetLessonId) query.lessonId = targetLessonId;

      if (Object.keys(query).length > 0) {
        try {
          const existingQuizzesRes = await getQuizzesApi(query);
          let quizzesArray: any[] = [];
          if (Array.isArray(existingQuizzesRes)) quizzesArray = existingQuizzesRes;
          else if (Array.isArray(existingQuizzesRes?.data)) quizzesArray = existingQuizzesRes.data;
          else if (Array.isArray(existingQuizzesRes?.data?.data)) quizzesArray = existingQuizzesRes.data.data;
          else if (Array.isArray(existingQuizzesRes?.data?.items)) quizzesArray = existingQuizzesRes.data.items;
          else if (Array.isArray(existingQuizzesRes?.items)) quizzesArray = existingQuizzesRes.items;

          if (quizzesArray.length > 0) {
            const targetQuiz = publishType === "standalone-course"
              ? (quizzesArray.find((q: any) => !q.lessonId && !q.lesson_id) || quizzesArray[0])
              : (publishType === "standalone-lesson"
                ? (quizzesArray.find((q: any) => String(q.lessonId || q.lesson_id) === String(targetLessonId)) || quizzesArray[0])
                : (quizzesArray.find((q: any) => !q.lessonId && !q.lesson_id && !q.courseId && !q.course_id) || quizzesArray[0]));
            const oldQuizId = targetQuiz?.id || quizzesArray[0].id;

            // Extract existing quiz data for PUT updates instead of deleting
            try {
              const fullQuizRes = await getQuizByIdApi(oldQuizId);
              fullQuizData = fullQuizRes?.data || fullQuizRes;
            } catch (err) {
              console.error("Failed to fetch old quiz data", err);
            }

            quizId = oldQuizId;
          }
        } catch (err) {
          console.error("Failed to check or delete existing quiz", err);
        }
      }

      // 2. CREATE OR UPDATE QUIZ
      const quizPayload = {
        lessonId: publishType === "standalone-lesson" ? targetLessonId : null,
        quizTitle: "Assessment",
        quizDescription: "",
        courseId: publishType === "standalone-course" ? targetCourseId : null,
        careerPathId: publishType === "career-path" ? targetCareerPathId : null,
        quizType: "PRACTICE",
        passingScore: Number(assessmentSettings.passingScore) || 70,
        maxAttempts: Math.max(Number(assessmentSettings.attemptCount) || 1, 1),
        timed: Number(assessmentSettings.timeLimit) > 0,
        timeLimitMinutes: Number(assessmentSettings.timeLimit) > 0 ? Number(assessmentSettings.timeLimit) : undefined,
        randomizeQuestions: Boolean(assessmentSettings.randomize),
        randomizeAnswers: false,
        allowRetry: true,
        showResultImmediately: true,
        lockBrowserTab: Boolean(assessmentSettings.lockTab),
        showQuestionNavigation: true,
        allowBackNavigation: true,
        quizStatus: "DRAFT",
        createdBy: user.id,
      };

      if (quizId) {
        const updatePayload = {
          quizTitle: "Assessment",
          quizDescription: "",
          passingScore: Number(assessmentSettings.passingScore) || 70,
          maxAttempts: Math.max(Number(assessmentSettings.attemptCount) || 1, 1),
          timed: Number(assessmentSettings.timeLimit) > 0,
          timeLimitMinutes: Number(assessmentSettings.timeLimit) > 0 ? Number(assessmentSettings.timeLimit) : undefined,
          randomizeQuestions: Boolean(assessmentSettings.randomize),
          randomizeAnswers: false,
          lockBrowserTab: Boolean(assessmentSettings.lockTab),
          quizStatus: "DRAFT",
        };
        await updateQuizApi({ quizId, payload: updatePayload });
      } else {
        const quiz = await createQuizApi(quizPayload);
        quizId = quiz?.data?.id || quiz?.id;
      }

      if (!quizId) {
        throw new Error("Quiz ID not found");
      }
      // 2. LOOP QUESTIONS SEQUENTIALLY
      // for (let i = 0; i < assessmentQuestions.length; i++) {
      //   const q = assessmentQuestions[i];
      //   try {
      //     const type = q?.type || q?.questionType;
      //     const text = q?.question || q?.questionText;
      //     if (!type || !text) continue;
      //     // 2.1 QUESTION BANK
      //     const questionRes = await createQuestionBankApi({
      //       questionType: type,
      //       questionText: text,
      //       questionStatus: "ACTIVE",
      //       createdBy: user?.id,
      //     });
      //     const questionId = questionRes?.id || questionRes?.data?.id;
      //     if (!questionId) {
      //       throw new Error("Question ID not returned");
      //     }
      //     // 2.2 OPTIONS (FIXED - IMPORTANT)
      //     if (type === "MCQ" && Array.isArray(q.options)) {
      //       for (let j = 0; j < q.options.length; j++) {
      //         const opt = q.options[j];
      //         await createQuestionOptionApi({
      //           questionId,
      //           optionText: String(opt),
      //           isCorrect: j === q.correctAnswer,
      //           displayOrder: j + 1,
      //         });
      //       }
      //     }
      //     if (type === "TRUE_FALSE") {
      //       const isTrue =
      //         q.correctAnswer === true || q.correctAnswer === 0;
      //       await createQuestionOptionApi({
      //         questionId,
      //         optionText: "True",
      //         isCorrect: isTrue,
      //         displayOrder: 1,
      //       });
      //       await createQuestionOptionApi({
      //         questionId,
      //         optionText: "False",
      //         isCorrect: !isTrue,
      //         displayOrder: 2,
      //       });
      //     }
      //     // 2.3 QUIZ QUESTION LINK
      //     await createQuizQuestionApi({
      //       quizId,
      //       questionId,
      //       sequenceOrder: i + 1,
      //       questionScoreWeight: 1,
      //       isMandatory: true,
      //     });
      //   } catch (err) {
      //     continue;
      //   }
      // }

      for (let i = 0; i < assessmentQuestions.length; i++) {
        const q = assessmentQuestions[i];

        try {
          const type = q?.type || q?.questionType;

          // =====================================================
          // IMAGE
          // =====================================================
          if (type === "IMAGE") {

            // Retain existing imageFileId if no new image was uploaded
            let commonImageFileId: string | undefined = q.imageFileId;

            let fileToUpload: File | null = null;
            if (q.imagePreview && typeof q.imagePreview === 'string' && q.imagePreview.startsWith('data:')) {
              const arr = q.imagePreview.split(',');
              const mimeMatch = arr[0].match(/:(.*?);/);
              if (mimeMatch) {
                const mime = mimeMatch[1];
                const bstr = atob(arr[arr.length - 1]);
                let n = bstr.length;
                const u8arr = new Uint8Array(n);
                while (n--) {
                  u8arr[n] = bstr.charCodeAt(n);
                }
                fileToUpload = new File([u8arr], (typeof q.imageFile === 'string' ? q.imageFile : "image.png"), { type: mime });
              }
            } else if (q.imageFile instanceof File) {
              fileToUpload = q.imageFile;
            }

            if (fileToUpload) {
              const fd = new FormData();
              fd.append("file", fileToUpload);
              fd.append("quizId", quizId);
              fd.append("uploadedBy", user?.id || "");
              fd.append("assetContext", "QUIZ");
              fd.append("assetType", "IMAGE");
              fd.append("storagePath", "assessments");

              try {
                const asset = await uploadAsset(fd, true);
                commonImageFileId = asset?.id || asset?.data?.id || commonImageFileId;
              } catch (uploadErr) {
                console.error("Assessment image upload failed:", uploadErr);
              }
            }

            // Create or update Question Group
            let questionGroupId = q.questionGroupId;
            if (questionGroupId) {
              try {
                await updateQuestionGroupApi({
                  id: questionGroupId,
                  payload: {
                    title: q.title || "Image Question",
                    imageFileId: commonImageFileId,
                    updatedBy: user.id,
                  },
                });
              } catch (e) {
                console.error("Failed to update image question group:", e);
              }
            } else {
              const groupRes = await createQuestionGroupApi({
                groupType: "IMAGE",
                title: q.title || "Image Question",
                imageFileId: commonImageFileId,
                createdBy: user.id,
              });
              questionGroupId = groupRes?.id || groupRes?.data?.id;
              q.questionGroupId = questionGroupId;
            }

            if (!questionGroupId) {
              throw new Error("Question Group ID not found");
            }

            // Save/update all questions
            for (let k = 0; k < q.questions.length; k++) {
              const imgQuestion = q.questions[k];
              let questionId = imgQuestion.questionId;

              if (questionId) {
                await updateQuestionBankApi({
                  id: questionId,
                  payload: {
                    questionType: "IMAGE",
                    questionText: imgQuestion.question,
                    questionStatus: "ACTIVE",
                    commonImageFileId,
                    questionGroupId,
                    updatedBy: user.id,
                  },
                });
              } else {
                const questionRes = await createQuestionBankApi({
                  questionGroupId,
                  questionType: "IMAGE",
                  questionText: imgQuestion.question,
                  questionStatus: "ACTIVE",
                  commonImageFileId,
                  createdBy: user.id,
                });
                questionId = questionRes?.id || questionRes?.data?.id;
                imgQuestion.questionId = questionId;
              }

              if (!questionId) {
                throw new Error("Question ID not found");
              }

              const existingQQ = fullQuizData?.quizQuestions?.find((qq: any) => qq.questionId === questionId);
              const existingOptions = existingQQ?.question?.questionOptions?.sort((a: any, b: any) => a.displayOrder - b.displayOrder) || [];

              // Save or update options
              if (Array.isArray(imgQuestion.options) && imgQuestion.options.length > 0) {
                for (let o = 0; o < imgQuestion.options.length; o++) {
                  const optText = String(imgQuestion.options[o] || `Option ${o + 1}`);
                  const isCorrect = imgQuestion.correctAnswer === o;
                  const existingOpt = existingOptions[o];

                  if (existingOpt) {
                    await updateQuestionOptionApi({
                      id: existingOpt.id,
                      payload: { optionText: optText, isCorrect, displayOrder: o + 1 },
                    });
                  } else {
                    await createQuestionOptionApi({
                      questionId,
                      optionText: optText,
                      isCorrect,
                      displayOrder: o + 1,
                    });
                  }
                }
                if (existingOptions.length > imgQuestion.options.length) {
                  for (let extra = imgQuestion.options.length; extra < existingOptions.length; extra++) {
                    if (existingOptions[extra]?.id) {
                      await deleteQuestionOptionApi(existingOptions[extra].id).catch(console.error);
                    }
                  }
                }
              }

              // Quiz Mapping
              const alreadyMapped = fullQuizData?.quizQuestions?.some((qq: any) => qq.questionId === questionId);
              if (!alreadyMapped) {
                await createQuizQuestionApi({
                  quizId,
                  questionId,
                  questionScoreWeight: 1,
                  isMandatory: true,
                });
              }
            }

            savedQuestions.push(q);
            continue;
          }

          // =====================================================
          // ESSAY / PASSAGE
          // =====================================================
          if (type === "ESSAY") {
            const passageTitle = q.title || q.question || "Passage";
            const passageContent = q.passageText || q.essayText || "";
            let questionGroupId = q.questionGroupId;

            if (questionGroupId) {
              try {
                await updateQuestionGroupApi({
                  id: questionGroupId,
                  payload: {
                    title: passageTitle,
                    passageText: passageContent,
                    updatedBy: user.id,
                  },
                });
              } catch (e) {
                console.error("Failed to update question group:", e);
              }
            } else {
              const groupRes = await createQuestionGroupApi({
                groupType: "ESSAY",
                title: passageTitle,
                passageText: passageContent,
                createdBy: user.id,
              });
              questionGroupId = groupRes?.id || groupRes?.data?.id;
              q.questionGroupId = questionGroupId;
            }

            if (!questionGroupId) {
              throw new Error("Question Group ID not returned");
            }

            const subQuestions = Array.isArray(q.questions) && q.questions.length > 0
              ? q.questions
              : [{
                question: q.question || passageTitle,
                type: "MCQ",
                options: q.options || ["Option 1", "Option 2", "Option 3", "Option 4"],
                correctAnswer: q.correctAnswer ?? 0,
              }];

            for (let e = 0; e < subQuestions.length; e++) {
              const essayQuestion = subQuestions[e];
              const subQType = essayQuestion.type || "MCQ";
              const subQText = essayQuestion.question || "";
              let questionId = essayQuestion.questionId;

              if (questionId) {
                await updateQuestionBankApi({
                  id: questionId,
                  payload: {
                    questionType: subQType,
                    questionText: subQText,
                    commonEssayText: passageContent,
                    questionGroupId,
                    questionStatus: "ACTIVE",
                    updatedBy: user.id,
                  },
                });
              } else {
                const questionRes = await createQuestionBankApi({
                  questionGroupId,
                  questionType: subQType,
                  questionText: subQText,
                  commonEssayText: passageContent,
                  questionStatus: "ACTIVE",
                  createdBy: user.id,
                });
                questionId = questionRes?.id || questionRes?.data?.id;
                essayQuestion.questionId = questionId;
              }

              if (!questionId) {
                throw new Error("Question ID not returned");
              }

              const existingQQ = fullQuizData?.quizQuestions?.find((qq: any) => qq.questionId === questionId);
              const existingOptions = existingQQ?.question?.questionOptions?.sort((a: any, b: any) => a.displayOrder - b.displayOrder) || [];

              if (subQType === "TRUE_FALSE") {
                const isTrue = essayQuestion.correctAnswer === true || essayQuestion.correctAnswer === 0;
                const optsToSave = [
                  { text: "True", isCorrect: isTrue },
                  { text: "False", isCorrect: !isTrue },
                ];
                for (let o = 0; o < optsToSave.length; o++) {
                  const existingOpt = existingOptions[o];
                  if (existingOpt) {
                    await updateQuestionOptionApi({
                      id: existingOpt.id,
                      payload: { optionText: optsToSave[o].text, isCorrect: optsToSave[o].isCorrect, displayOrder: o + 1 },
                    });
                  } else {
                    await createQuestionOptionApi({
                      questionId,
                      optionText: optsToSave[o].text,
                      isCorrect: optsToSave[o].isCorrect,
                      displayOrder: o + 1,
                    });
                  }
                }
              } else if (subQType === "ESSAY" || subQType === "DESCRIPTIVE" || !essayQuestion.options || essayQuestion.options.length === 0) {
                // Open-ended descriptive question without forced options
                if (existingOptions.length > 0) {
                  for (let k = 0; k < existingOptions.length; k++) {
                    if (existingOptions[k]?.id) {
                      await deleteQuestionOptionApi(existingOptions[k].id).catch(console.error);
                    }
                  }
                }
              } else {
                const opts = Array.isArray(essayQuestion.options) ? essayQuestion.options : ["Option 1", "Option 2", "Option 3", "Option 4"];
                for (let o = 0; o < opts.length; o++) {
                  const optText = String(opts[o] || `Option ${o + 1}`);
                  const isCorrect = essayQuestion.correctAnswer === o;
                  const existingOpt = existingOptions[o];

                  if (existingOpt) {
                    await updateQuestionOptionApi({
                      id: existingOpt.id,
                      payload: { optionText: optText, isCorrect, displayOrder: o + 1 },
                    });
                  } else {
                    await createQuestionOptionApi({
                      questionId,
                      optionText: optText,
                      isCorrect,
                      displayOrder: o + 1,
                    });
                  }
                }
                if (existingOptions.length > opts.length) {
                  for (let k = opts.length; k < existingOptions.length; k++) {
                    if (existingOptions[k].id) {
                      await deleteQuestionOptionApi(existingOptions[k].id).catch(console.error);
                    }
                  }
                }
              }

              const alreadyMapped = fullQuizData?.quizQuestions?.some((qq: any) => qq.questionId === questionId);
              if (!alreadyMapped) {
                await createQuizQuestionApi({
                  quizId,
                  questionId,
                  questionScoreWeight: 1,
                  isMandatory: true,
                });
              }
            }

            savedQuestions.push(q);
            continue;
          }
          const text = q?.question || q?.questionText;

          if (!type || !text) {
            failedQuestions.push(q);
            continue;
          }

          let questionId = q.questionId;
          if (!questionId && q.id) {
            const fallbackQQ = fullQuizData?.quizQuestions?.find((qq: any) => qq.id === q.id);
            if (fallbackQQ) {
              questionId = fallbackQQ.questionId;
            }
          }

          if (questionId) {
            // 1. UPDATE QUESTION BANK
            await updateQuestionBankApi({
              id: questionId,
              payload: {
                questionType: type,
                questionText: text,
                questionStatus: "ACTIVE",
                updatedBy: user?.id,
              }
            });

            // 2. GET EXISTING OPTIONS TO MAP
            const existingQQ = fullQuizData?.quizQuestions?.find((qq: any) => qq.questionId === questionId);
            const existingOptions = existingQQ?.question?.questionOptions?.sort((a: any, b: any) => a.displayOrder - b.displayOrder) || [];

            // 3. UPDATE / CREATE OPTIONS
            if (type === "MCQ" && Array.isArray(q.options)) {
              for (let j = 0; j < q.options.length; j++) {
                const optText = String(q.options[j]);
                const isCorrect = (j === q.correctAnswer);
                const existingOpt = existingOptions[j];

                if (existingOpt) {
                  await updateQuestionOptionApi({
                    id: existingOpt.id,
                    payload: { optionText: optText, isCorrect: isCorrect, displayOrder: j + 1 }
                  });
                } else {
                  await createQuestionOptionApi({
                    questionId, optionText: optText, isCorrect: isCorrect, displayOrder: j + 1
                  });
                }
              }
              if (existingOptions.length > q.options.length) {
                for (let k = q.options.length; k < existingOptions.length; k++) {
                  if (existingOptions[k].id) await deleteQuestionOptionApi(existingOptions[k].id).catch(console.error);
                }
              }
            } else if (type === "TRUE_FALSE") {
              const isTrue = q.correctAnswer === true || q.correctAnswer === 0;
              const optsToSave = [
                { text: "True", isCorrect: isTrue },
                { text: "False", isCorrect: !isTrue }
              ];
              for (let j = 0; j < optsToSave.length; j++) {
                const existingOpt = existingOptions[j];
                if (existingOpt) {
                  await updateQuestionOptionApi({
                    id: existingOpt.id,
                    payload: { optionText: optsToSave[j].text, isCorrect: optsToSave[j].isCorrect, displayOrder: j + 1 }
                  });
                } else {
                  await createQuestionOptionApi({
                    questionId, optionText: optsToSave[j].text, isCorrect: optsToSave[j].isCorrect, displayOrder: j + 1
                  });
                }
              }
            }

            // 4. UPDATE QUIZ QUESTION MAPPING
            if (existingQQ) {
              await updateQuizQuestionApi({
                id: existingQQ.id,
                payload: { sequenceOrder: i + 1 }
              });
            }

          } else {
            // Create Question
            const questionRes = await createQuestionBankApi({
              questionType: type,
              questionText: text,
              questionStatus: "ACTIVE",
              createdBy: user?.id,
            });

            questionId = questionRes?.id || questionRes?.data?.id;

            if (!questionId) {
              throw new Error("Question ID not returned");
            }

            // MCQ Options
            if (type === "MCQ" && Array.isArray(q.options)) {
              const cleanOpts = q.options
                .map((opt: any) => String(opt ?? "").trim())
                .filter((opt: string) => opt.length > 0);
              const validOptions = cleanOpts.length >= 2 ? cleanOpts : (cleanOpts.length > 0 ? [...cleanOpts, "Option 2"] : ["Option 1", "Option 2"]);

              for (let j = 0; j < validOptions.length; j++) {
                await createQuestionOptionApi({
                  questionId,
                  optionText: validOptions[j],
                  isCorrect: j === (q.correctAnswer ?? 0),
                  displayOrder: j + 1,
                });
              }
            }

            // True/False
            if (type === "TRUE_FALSE") {
              const isTrue =
                q.correctAnswer === true || q.correctAnswer === 0;

              await createQuestionOptionApi({
                questionId,
                optionText: "True",
                isCorrect: isTrue,
                displayOrder: 1,
              });

              await createQuestionOptionApi({
                questionId,
                optionText: "False",
                isCorrect: !isTrue,
                displayOrder: 2,
              });
            }

            // Quiz Mapping
            await createQuizQuestionApi({
              quizId,
              questionId,
              sequenceOrder: i + 1,
              questionScoreWeight: 1,
              isMandatory: true,
            });
          }

          // SUCCESS
          savedQuestions.push(q);

        } catch (err) {
          console.error(`Question ${i + 1} failed`, err);
          failedQuestions.push(q);
        }
      }


      // 5. CLEAN UP REMOVED QUESTIONS
      if (fullQuizData?.quizQuestions) {
        const allActiveQuestionIds = new Set<string>();
        for (const q of assessmentQuestions) {
          if (q.questionId) allActiveQuestionIds.add(String(q.questionId));
          if (Array.isArray(q.questions)) {
            for (const sub of q.questions) {
              if (sub.questionId) allActiveQuestionIds.add(String(sub.questionId));
            }
          }
        }

        for (const qq of fullQuizData.quizQuestions) {
          if (qq.questionId && !allActiveQuestionIds.has(String(qq.questionId))) {
            // Delete its options first
            if (qq.question?.questionOptions && Array.isArray(qq.question.questionOptions)) {
              for (const opt of qq.question.questionOptions) {
                if (opt.id) await deleteQuestionOptionApi(opt.id).catch(console.error);
              }
            }
            // Delete QuizQuestion mapping
            if (qq.id) await deleteQuizQuestionApi(qq.id).catch(console.error);
            // Delete QuestionBank entry
            if (qq.questionId) await deleteQuestionBankApi(qq.questionId).catch(console.error);
          }
        }
      }

      if (failedQuestions.length === 0) {
        // Everything saved
        // localStorage.removeItem("assessmentData");
        // localStorage.removeItem("assessmentQuestions");

        // We intentionally DO NOT clear setAssessmentQuestions here
        // so that the Review step can still read and display them.
        isQuizSavedRef.current = true;

        if (!silent) {
          notification.success({
            title: "Quiz Saved Successfully",
            description: "All questions processed successfully.",
          });
        }

      } else {
        isQuizSavedRef.current = false;
        // Keep only failed questions
        setAssessmentQuestions(failedQuestions);

        notification.warning({
          title: "Partial Save",
          description: `${savedQuestions.length} question(s) saved, ${failedQuestions.length} failed.`,
        });
      }

    } catch (err) {
      isQuizSavedRef.current = false;
      console.error("Save Error:", err);
      notification.error({
        title: "Save Failed",
        description: "Please check backend or payload",
        placement: "topRight",
      });
    } finally {
      setSavingAssessment(false);
    }
  };
  //my work quiz end

  const { data, isLoading, createMutation, updateMutation } = useCareerPaths();
  const createLessonMutation = useCreateLesson();
  const { createMutation: createCourseMutation, courses: coursesQuery, updateMutation: updateCourseMutation } = useCourses({ limit: 100, isStandalone: "all", status: "PUBLISHED" } as any);

  const { uploadAsset, uploadAssetDirectly } = useAssets();
  const updateLessonMutation = useUpdateLesson();

  // Hydration guards to ensure backend data is prepopulated strictly once per entity ID
  const hydratedLessonIdRef = useRef<string | null>(null);
  const hydratedCourseIdRef = useRef<string | null>(null);
  const hydratedPathIdRef = useRef<string | null>(null);

  // Transition & clean state management on entity/mode change
  const prevPublishTypeRef = useRef<PublishType>(initialPublishType);
  const prevLessonIdRef = useRef<string | null>(resolvedLessonId);
  const prevCourseIdRef = useRef<string | null>(resolvedCourseId);
  const prevPathIdRef = useRef<string | null>(resolvedPathId);

  useEffect(() => {
    if (prevPublishTypeRef.current !== publishType) {
      const oldType = prevPublishTypeRef.current;
      prevPublishTypeRef.current = publishType;
      hydratedLessonIdRef.current = null;
      hydratedCourseIdRef.current = null;
      hydratedPathIdRef.current = null;

      const isNewLesson = publishType === "standalone-lesson" && !resolvedLessonId;
      const isNewCourse = publishType === "standalone-course" && !resolvedCourseId;
      const isNewPath = publishType === "career-path" && !resolvedPathId;

      if (isNewLesson && oldType !== "standalone-lesson") {
        setFormData(getInitialLessonFormData());
        setCreatedLessonId(null);
        setCourseLessons([]);
      } else if (publishType === "standalone-lesson" && oldType !== "standalone-lesson") {
        setFormData(getInitialLessonFormData());
        setCreatedLessonId(resolvedLessonId || null);
        setCourseLessons([]);
      } else if (isNewCourse && oldType !== "standalone-course") {
        setFormData(getInitialCourseFormData());
        setCreatedCourseId(null);
        setCourseLessons([]);
      } else if (isNewPath && oldType !== "career-path") {
        setFormData(getInitialCareerPathFormData());
        setCreatedCareerPathId(null);
        setCourseLessons([]);
      }
    }

    if (prevLessonIdRef.current !== resolvedLessonId) {
      prevLessonIdRef.current = resolvedLessonId;
      hydratedLessonIdRef.current = null;
      if (publishType === "standalone-lesson") {
        setFormData(getInitialLessonFormData());
      }
    }
    prevCourseIdRef.current = resolvedCourseId;
    prevPathIdRef.current = resolvedPathId;
  }, [publishType, resolvedLessonId, resolvedCourseId, resolvedPathId]);

  const availableCourses = useMemo(() => {
    const res = coursesQuery.data as any;
    return Array.isArray(res?.data?.data)
      ? res.data.data
      : (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
  }, [coursesQuery.data]);

  const existingCoursesLessonsQueries = useQueries({
    queries: (formData.existingCourseIds || []).map((courseId) => ({
      queryKey: ["course-lessons", courseId],
      queryFn: () => getCourseLessonsApi(courseId),
      enabled: !!courseId,
    })),
  });

  const existingCoursesLessonsMap = useMemo(() => {
    const map: Record<string, any[]> = {};
    existingCoursesLessonsQueries.forEach((q, index) => {
      const courseId = formData.existingCourseIds[index];
      if (q.data && courseId) {
        map[courseId] = q.data;
      }
    });
    return map;
  }, [existingCoursesLessonsQueries, formData.existingCourseIds]);



  const { subjects, loading, createSubject, deleteSubject } = useSubjects();
  const { categories, loading: categoryLoading, createCategory, } = useCategories();
  const { subcategories, loading: subcategoryLoading, createSubcategory } = useSubcategories(
    publishType === "standalone-course" && formData.categoryId && formData.categoryId !== "new"
      ? formData.categoryId
      : undefined
  );
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newSubcategoryName, setNewSubcategoryName] = useState("");

  useEffect(() => {
    if (categories?.length && !formData.categoryId) {
      setFormData((prev) => {
        if (prev.categoryId) return prev;
        return {
          ...prev,
          categoryId: categories[0].id,
        };
      });
    }
  }, [categories, formData.categoryId]);

  const { data: visibilities = [] } = useVisibilities();
  const { data: difficultyLevels = [] } = useDifficultyLevels();
  const { data: lessonStatuses = [] } = useLessonStatuses();
  const { data: lessonTypes = [] } = useLessonTypes();
  const { data: tenants = [] } = useQuery({ queryKey: ["tenants"], queryFn: getTenantsApi, staleTime: 60000, refetchOnWindowFocus: false, retry: 1 });
  const [skillInput, setSkillInput] = useState("");
  const { data: skills = [] } = useSkills();

  const filteredSkills = skills.filter(
    (skill) =>
      skill.name.toLowerCase().includes(skillInput.replace("#", "").toLowerCase()) &&
      !formData.skillTags.some(
        (tag) => tag.toLowerCase() === skill.name.toLowerCase(),
      ),
  );
  const [tagInput, setTagInput] = useState("");
  const { data: tags = [] } = useTags();

  const filteredTags = tags.filter(
    (tag) =>
      tag.name
        .toLowerCase()
        .includes(tagInput.replace("#", "").toLowerCase()) &&
      !formData.tags.some((t) => t.toLowerCase() === tag.name.toLowerCase()),
  );

  // Lesson API (IDs)
  const activeSkillTags = publishType === "standalone-lesson" ? (formData.lessonSkills && formData.lessonSkills.length > 0 ? formData.lessonSkills : formData.skillTags) : formData.skillTags;
  const activeTags = publishType === "standalone-lesson" ? (formData.lessonTags && formData.lessonTags.length > 0 ? formData.lessonTags : formData.tags) : formData.tags;

  const selectedSkillIds = skills
    .filter((skill) => activeSkillTags.includes(skill.name))
    .map((skill) => skill.id);

  const selectedTagIds = tags
    .filter((tag) => activeTags.includes(tag.name))
    .map((tag) => tag.id);

  // Course API (Names)
  const selectedSkillNames = formData.skillTags;
  const selectedTagNames = formData.tags;

  const updateForm = (updates: Partial<CreateCourseFormData>) => {
    setFormData((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  const [courseLessons, setCourseLessons] = useState<CourseLesson[]>([]);

  // Auto-calculate Duration
  useEffect(() => {
    let totalDuration = 0;

    // Sum from local inline lessons (if any)
    if (courseLessons && courseLessons.length > 0) {
      totalDuration += courseLessons.reduce((acc, l) => acc + (Number(l.duration) || 0), 0);
    }

    // Sum from existing selected courses (if Career Path)
    if (publishType === "career-path" && formData.existingCourseIds?.length > 0 && coursesQuery.data) {
      const allCourses = (coursesQuery.data as any)?.data?.data || (coursesQuery.data as any)?.data || coursesQuery.data;
      if (Array.isArray(allCourses)) {
        formData.existingCourseIds.forEach((courseId) => {
          const c = allCourses.find((c: any) => c.id === courseId);
          if (c && c.duration) {
            totalDuration += Number(c.duration);
          }
        });
      }
    }

    // Only update duration if calculated total is strictly greater than 0
    // Never overwrite or clear user-entered duration when child lists are empty
    if (totalDuration > 0) {
      setFormData((prev) => {
        if (prev.duration !== totalDuration.toString()) {
          return { ...prev, duration: totalDuration.toString() };
        }
        return prev;
      });
    }
  }, [courseLessons, formData.existingCourseIds, publishType, coursesQuery.data]);

  // ==================== EDIT MODE PREPOPULATION ====================
  useEffect(() => {
    if (publishType === "standalone-course" && courseToEdit && resolvedCourseId) {
      if (hydratedCourseIdRef.current === resolvedCourseId) {
        return; // Already hydrated this course; prevent late query completions from overwriting user input
      }
      hydratedCourseIdRef.current = resolvedCourseId;

      const course = courseToEdit as any;

      const thumbUrl =
        courseAssetsData?.find(
          (a: any) =>
            assetTypeOf(a) === "IMAGE" &&
            (storagePathOf(a) === "thumbnails" ||
              storagePathOf(a) === "covers" ||
              a.assetContext === "COURSE_THUMBNAIL" ||
              a.assetContext === "COURSE")
        ) && assetUrl(courseAssetsData.find(
          (a: any) => assetTypeOf(a) === "IMAGE" && (storagePathOf(a) === "thumbnails" || storagePathOf(a) === "covers" || a.assetContext === "COURSE_THUMBNAIL" || a.assetContext === "COURSE")
        )) ||
        assetUrl(course.thumbnailAsset) ||
        assetUrl(course.coverImageAsset) ||
        assetUrl(course.courseAssets?.[0]) ||
        course.thumbnailUrl ||
        course.coverImageUrl ||
        "";
      const courseAssets = [
        ...(courseAssetsData || []),
        ...(course.assets || []),
        ...(course.courseAssets || []),
        ...(course.attachments || []),
        ...(course.courseAttachments || []),
      ];
      const courseTags = course.tags?.length ? course.tags : (course.courseTags?.length ? course.courseTags : (course.tagNames || []));
      const courseSkills = course.skills?.length ? course.skills : (course.courseSkills?.length ? course.courseSkills : (course.skillTags || course.skillNames || []));
      const prepopulatedTags = relationNames(courseTags, "tag", tags);
      const prepopulatedSkills = relationNames(courseSkills, "skill", skills);

      const supportingMaterialAsset = courseAssets.find(
        (a: any) =>
          storagePathOf(a) === "resources" ||
          a.assetContext === "COURSE_RESOURCE"
      );
      const supportingMaterialUrl = supportingMaterialAsset ? assetUrl(supportingMaterialAsset) : "";
      const supportingMaterialName = supportingMaterialAsset
        ? (supportingMaterialAsset.originalFileName || supportingMaterialAsset.originalFilename || supportingMaterialAsset.name || supportingMaterialAsset.assetName || supportingMaterialAsset.fileName || "Supporting Material")
        : "";
      const supportingMaterialAssetId = supportingMaterialAsset
        ? (supportingMaterialAsset.id || supportingMaterialAsset.assetId || "")
        : "";

      const rawCourseAttachments = courseAssets
        .filter((a: any) => {
          const sPath = storagePathOf(a);
          return sPath === "attachments" || sPath === "resources" || a.assetContext === "COURSE_ATTACHMENT" || a.assetContext === "COURSE_ATTACHMENTS" || a.assetContext === "SUPPORTING_MATERIAL" || a.assetRole === "SUPPORTING_MATERIAL" || a.assetRole === "RESOURCE" || a.assetRole === "ATTACHMENT";
        })
        .map((a: any) => {
          const rawName = a.name || a.assetName || a.originalFileName || a.originalFilename || a.fileName || a.asset?.originalFileName || a.asset?.name || "Supporting Material";
          return {
            id: a.id || a.assetId || a.asset?.id || "",
            name: getDisplayFileName(rawName, "Supporting Material"),
            url: assetUrl(a),
            size: a.size || a.fileSize || a.fileSizeBytes || undefined,
          };
        })
        .filter((att: any) => Boolean(att.id && att.url));

      const uniqueExistingCourseAttachments = Array.from(
        new Map(rawCourseAttachments.map((item: any) => [item.id, item])).values()
      );

      const courseTenantIds = Array.from(new Set([
        ...(course.tenantId ? [course.tenantId] : []),
        ...(Array.isArray(course.courseTenants) ? course.courseTenants.map((ct: any) => ct.tenantId || ct.id).filter(Boolean) : []),
        ...(Array.isArray(course.tenants) ? course.tenants.map((t: any) => t.tenantId || t.id).filter(Boolean) : []),
        ...(Array.isArray(course.tenantIds) ? course.tenantIds : []),
      ]));

      setFormData((prev) => ({
        ...prev,
        courseTitle: prev.courseTitle || course.title || "",
        courseSubtitle: prev.courseSubtitle || course.subtitle || "",
        tagline: prev.tagline || course.subtitle || course.tagline || "",
        fullDescription: prev.fullDescription || course.fullDescription || course.description || "",
        description: prev.description || course.description || course.fullDescription || "",
        categoryId: course.categoryId || course.category?.id || prev.categoryId || "",
        subcategoryId: course.subcategoryId || course.subCategoryId || course.subcategory?.id || prev.subcategoryId || "",
        subjectId: course.subjectId || (typeof course.subject === "string" ? course.subject : course.subject?.id) || course.subjects?.[0]?.subjectId || course.subjects?.[0]?.id || (typeof course.subjects?.[0] === "string" ? course.subjects[0] : "") || prev.subjectId || "",
        language: course.language || course.languages?.[0] || prev.language || "English",
        priceTier: course.priceTier || course.pricing || prev.priceTier || "FREE",
        difficulty: course.difficulty || course.difficultyLevel || prev.difficulty || "BEGINNER",
        duration: prev.duration || (course.duration ? String(course.duration) : ""),
        whatIsIncluded: prev.whatIsIncluded || (Array.isArray(course.whatIsIncluded) ? course.whatIsIncluded.join("\n") : (course.whatIsIncluded || "")),
        corporateTenant: prev.corporateTenant?.length ? prev.corporateTenant : (courseTenantIds.length > 0 ? courseTenantIds : []),
        visibility: course.visibility || prev.visibility || "PUBLIC_CATALOG",
        status: course.status || prev.status || "DRAFT",
        assessmentRequired: course.assessmentRequired !== undefined ? course.assessmentRequired : (prev.assessmentRequired ?? true),
        skillTags: prev.skillTags?.length ? prev.skillTags : prepopulatedSkills,
        tags: prev.tags?.length ? prev.tags : prepopulatedTags,
        existingLessonIds: prev.existingLessonIds?.length ? prev.existingLessonIds : (course.courseLessons?.map((cl: any) => cl.lessonId) || []),
        previewLessonIds: prev.previewLessonIds?.length ? prev.previewLessonIds : (
          typeof course.previewLessonId === 'string' 
            ? ((): string[] => { try { return JSON.parse(course.previewLessonId); } catch { return [course.previewLessonId]; } })() 
            : Array.isArray(course.previewLessonId) ? course.previewLessonId : []
        ),
        lessonType: course.shortDescription || course.courseLessons?.[0]?.lesson?.lessonType || prev.lessonType || "VIDEO",
        shortDescription: course.shortDescription || course.courseLessons?.[0]?.lesson?.lessonType || prev.shortDescription || "",
        learningObjectives: prev.learningObjectives || (Array.isArray(course.learningObjectives) ? course.learningObjectives.join("\n") : (course.learningObjectives || "")),
        learningOutcomes: prev.learningOutcomes || (Array.isArray(course.learningOutcomes) ? course.learningOutcomes.join("\n") : (course.learningOutcomes || course.learningOutcome || "")),
        prerequisites: prev.prerequisites || course.prerequisites || "",
        targetAudience: prev.targetAudience || (Array.isArray(course.targetAudience) ? course.targetAudience.join(", ") : (course.targetAudience || (course.personaIds ? course.personaIds.join(", ") : ""))),
        skillsGain: prev.skillsGain || prepopulatedSkills.join(", "),
        courseThumbnailAssetUrl: prev.courseThumbnailAssetUrl || thumbUrl,
        coverImageAssetUrl: prev.coverImageAssetUrl || thumbUrl,
        supportingMaterialUrl: prev.supportingMaterialUrl || supportingMaterialUrl,
        supportingMaterialName: prev.supportingMaterialName || supportingMaterialName,
        supportingMaterialAssetId: prev.supportingMaterialAssetId || supportingMaterialAssetId,
        existingAttachments: prev.existingAttachments?.length ? prev.existingAttachments : uniqueExistingCourseAttachments,
        attachmentAssetUrl: prev.attachmentAssetUrl || uniqueExistingCourseAttachments[0]?.url || "",
        authorName: (course.authorName || prev.authorName || "Nexus Academy").trim(),
        instructorDesignation: "",
      }));

      setCreatedCourseId(course.id);

      if (course.courseLessons && course.courseLessons.length > 0) {
        setCourseLessons((prevLessons) =>
          prevLessons.length > 0
            ? prevLessons
            : course.courseLessons.map((cl: any) => ({
              id: cl.lessonId,
              title: cl.lesson?.title || cl.title || "Untitled Lesson",
              lessonType: cl.lesson?.lessonType || cl.lessonType || "VIDEO",
              duration: cl.lesson?.duration ? String(cl.lesson.duration) : "0",
              status: cl.lesson?.status || "DRAFT",
              lessonContents: cl.lesson?.lessonContents || [],
            }))
        );
      }
    }
  }, [courseToEdit, courseAssetsData, publishType, resolvedCourseId, skills, tags]);

  useEffect(() => {
    if (publishType === "standalone-lesson" && lessonToEdit && resolvedLessonId) {
      if (hydratedLessonIdRef.current === resolvedLessonId) {
        return; // Already hydrated this lesson; prevent late query completions from overwriting user input
      }
      hydratedLessonIdRef.current = resolvedLessonId;

      const lesson = lessonToEdit as any;
      const lessonAssets = [
        ...(lesson.assetsStorage || []),
        ...(lesson.lessonAssets || []),
        ...(lesson.assets || []),
        ...(lesson.attachments || []),
        ...(lesson.lessonAttachments || []),
      ];
      const lessonSkills = lesson.skills || lesson.lessonSkills || lesson.lessonSkillTags || [];
      const lessonTags = lesson.lessonTags || lesson.tags || lesson.lessonTagLinks || [];
      const prepopulatedSkills = relationNames(lessonSkills, "skill", skills);
      const prepopulatedTags = relationNames(lessonTags, "tag", tags);
      const transcriptUrl = assetUrl(lesson.assets_storage_lessons_transcript_asset_idToassets_storage) || assetUrl(lesson.transcriptAsset) || firstAssetUrl(lessonAssets, (a: any) => a.assetType === "DOCUMENT" && (a.storagePath === "transcripts" || a.assetContext === "LESSON_TRANSCRIPT"));

      const uniqueMaterials = getUniqueLessonMaterials(lesson);
      const uniqueExistingLessonAttachments: any[] = uniqueMaterials.map((m: any) => ({
        id: m.assetId,
        assetId: m.assetId,
        name: getDisplayFileName(m.name, "Supporting Material"),
        url: m.url,
      }));

      const supportingMaterialAsset = lessonAssets.find(
        (a: any) =>
          storagePathOf(a) === "resources" ||
          a.assetContext === "LESSON_RESOURCE" ||
          a.assetRole === "SUPPORTING_MATERIAL"
      );
      const supportingMaterialUrl = supportingMaterialAsset ? assetUrl(supportingMaterialAsset) : (uniqueExistingLessonAttachments[0]?.url || "");
      const supportingMaterialName = supportingMaterialAsset
        ? (supportingMaterialAsset.originalFileName || supportingMaterialAsset.originalFilename || supportingMaterialAsset.name || supportingMaterialAsset.assetName || supportingMaterialAsset.fileName || "Supporting Material")
        : (uniqueExistingLessonAttachments[0]?.name || "");
      const supportingMaterialAssetId = supportingMaterialAsset
        ? (supportingMaterialAsset.id || supportingMaterialAsset.assetId || "")
        : (uniqueExistingLessonAttachments[0]?.assetId || "");

      const lessonTenantIds = Array.from(new Set([
        ...(lesson.tenantId ? [lesson.tenantId] : []),
        ...(Array.isArray(lesson.lessonTenants) ? lesson.lessonTenants.map((lt: any) => lt.tenantId || lt.id).filter(Boolean) : []),
        ...(Array.isArray(lesson.tenants) ? lesson.tenants.map((t: any) => t.tenantId || t.id).filter(Boolean) : []),
        ...(Array.isArray(lesson.tenantIds) ? lesson.tenantIds : []),
      ]));

      const videoAsset = lesson.contentAsset || lesson.assets_storage_lessons_content_asset_idToassets_storage || lessonAssets.find((a: any) => a.assetType === "VIDEO" || a.storagePath === "videos");
      const videoAssetUrl = assetUrl(lesson.contentAsset) || assetUrl(lesson.assets_storage_lessons_content_asset_idToassets_storage) || firstAssetUrl(lessonAssets, (a: any) => a.assetType === "VIDEO" || a.storagePath === "videos");
      const rawVideoName = videoAsset?.originalFileName || videoAsset?.originalFilename || videoAsset?.name || videoAsset?.assetName || videoAsset?.fileName || "";
      const videoAssetName = getDisplayFileName(rawVideoName || videoAssetUrl, "Uploaded Video");
      const transcriptAsset = lesson.transcriptAsset || lesson.assets_storage_lessons_transcript_asset_idToassets_storage || lessonAssets.find((a: any) => a.assetType === "DOCUMENT" && (a.storagePath === "transcripts" || a.assetRole === "TRANSCRIPT" || a.assetContext === "LESSON_TRANSCRIPT"));
      const rawTranscriptName = transcriptAsset?.originalFileName || transcriptAsset?.originalFilename || transcriptAsset?.name || transcriptAsset?.fileName || "";
      const transcriptAssetName = getDisplayFileName(rawTranscriptName || transcriptUrl, "Uploaded Subtitle");
      setCreatedLessonId(lesson.id);

      const isExternalLink =
        lesson.contentAsset?.assetSource === "EXTERNAL_LINK" ||
        lesson.assets_storage_lessons_content_asset_idToassets_storage?.assetSource === "EXTERNAL_LINK" ||
        String(lesson.assets_storage_lessons_content_asset_idToassets_storage?.storageProvider || "").toLowerCase() === "external" ||
        Boolean(lesson.assets_storage_lessons_content_asset_idToassets_storage?.externalUrl);

      const dbVideoUrl = isExternalLink
        ? (lesson.assets_storage_lessons_content_asset_idToassets_storage?.externalUrl ||
          lesson.contentAsset?.externalUrl ||
          lesson.videoUrl ||
          lesson.videoUrlExternal ||
          "")
        : "";

      setFormData((prev) => ({
        ...prev,
        lessonTitle: lesson.title || lesson.lessonTitle || prev.lessonTitle || "",
        lessonDescription: lesson.shortDescription || lesson.lessonDescription || prev.lessonDescription || "",
        fullDescription: lesson.description || prev.fullDescription || "",
        lessonType: lesson.lessonType || lesson.type || prev.lessonType || "VIDEO",
        difficulty: lesson.difficulty || lesson.difficultyLevel || prev.difficulty || "BEGINNER",
        visibility: lesson.visibility || prev.visibility || "PUBLIC_CATALOG",
        duration: (lesson.duration ? String(lesson.duration) : "") || prev.duration || "",
        subjectId: lesson.subjectId || lesson.subject?.id || prev.subjectId || "",
        categoryId: lesson.categoryId || lesson.category?.id || prev.categoryId || "",
        subcategoryId: lesson.subcategoryId || lesson.subcategory?.id || prev.subcategoryId || "",
        language: lesson.language || lesson.languages?.[0] || prev.language || "English",
        assessmentRequired: prev.assessmentRequired ?? (lesson.assessmentRequired || false),
        corporateTenant: prev.corporateTenant?.length ? prev.corporateTenant : (lessonTenantIds.length > 0 ? lessonTenantIds : []),
        tagline: prev.tagline || lesson.tagLine || lesson.tagline || "",
        shortDescription: prev.shortDescription || lesson.shortDescription || "",
        lessonSkills: prev.lessonSkills?.length ? prev.lessonSkills : (prev.skillTags?.length ? prev.skillTags : prepopulatedSkills),
        lessonTags: prev.lessonTags?.length ? prev.lessonTags : (prev.tags?.length ? prev.tags : prepopulatedTags),
        skillTags: prev.skillTags?.length ? prev.skillTags : (prev.lessonSkills?.length ? prev.lessonSkills : prepopulatedSkills),
        tags: prev.tags?.length ? prev.tags : (prev.lessonTags?.length ? prev.lessonTags : prepopulatedTags),
        learningOutcomes: prev.learningOutcomes || (Array.isArray(lesson.learningOutcomes) ? lesson.learningOutcomes.join("\n") : (Array.isArray(lesson.learningOutcome) ? lesson.learningOutcome.join("\n") : (lesson.learningOutcomes || lesson.learningOutcome || ""))),

        lessonContents: prev.lessonContents?.length ? prev.lessonContents : (lesson.lessonContents?.map((lc: any) => ({
          id: lc.id,
          title: lc.title || "",
          format: lc.format || "TEXT_IMAGE",
          estimatedDuration: lc.estimatedDuration || 0,
          displayOrder: lc.displayOrder || 1,
          isDefault: lc.isDefault || false,
          blocks: (lc.blocks || []).map((b: any) => ({
            id: b.id,
            blockType: b.blockType,
            title: b.title,
            textContent: b.textContent,
            assetId: b.assetId,
            assetUrl: b.asset?.url,
            metadata: b.metadata,
            displayOrder: b.displayOrder || 0,
          })).sort((a: any, b: any) => a.displayOrder - b.displayOrder),
        })) || []),
        allowPreview: prev.allowPreview ?? (lesson.allowPreview || false),
        previewDuration: prev.previewDuration ?? (lesson.previewDuration || null),
        previewAccessType: prev.previewAccessType || lesson.previewAccessType || "NONE",
        thumbnailAssetUrl: prev.thumbnailAssetUrl || lesson.thumbnailAsset?.url || lesson.lessonAssets?.find((a: any) => a.assetRole === "THUMBNAIL")?.asset?.url || lessonAssets.find((a: any) => a.assetType === "IMAGE" && (a.storagePath === "thumbnails" || a.assetContext === "LESSON_THUMBNAIL" || a.assetContext === "LESSON"))?.url || "",
        supportingMaterialUrl: supportingMaterialUrl,
        supportingMaterialName: supportingMaterialName,
        supportingMaterialAssetId: supportingMaterialAssetId,
        existingAttachments: uniqueExistingLessonAttachments,
        attachmentAssetUrl: uniqueExistingLessonAttachments[0]?.url || "",
        videoUrl: prev.videoUrl || dbVideoUrl,
        primaryContentAssetUrl: prev.primaryContentAssetUrl || videoAssetUrl,
        primaryContentAssetName: prev.primaryContentAssetName || videoAssetName,
        transcriptAssetUrl: prev.transcriptAssetUrl || transcriptUrl,
        transcriptAssetName: prev.transcriptAssetName || transcriptAssetName,
        textVersion: prev.textVersion || lesson.lessonContents?.flatMap((lc: any) => lc.blocks || [])?.find((b: any) => b.textContent)?.textContent || "",
        authorName: (lesson.authorName || prev.authorName || "Nexus Academy").trim(),
        instructorDesignation: "",
      }));
    }
  }, [lessonToEdit, publishType, resolvedLessonId, skills, tags]);

  useEffect(() => {
    if (publishType === "career-path" && pathToEdit && resolvedPathId) {
      if (hydratedPathIdRef.current === resolvedPathId) {
        return;
      }
      hydratedPathIdRef.current = resolvedPathId;

      const path = pathToEdit as any;

      const pathTenantIds = Array.from(new Set([
        ...(path.tenantId ? [path.tenantId] : []),
        ...(Array.isArray(path.careerPathTenants) ? path.careerPathTenants.map((t: any) => t.tenantId || t.id).filter(Boolean) : []),
        ...(Array.isArray(path.tenants) ? path.tenants.map((t: any) => t.tenantId || t.id).filter(Boolean) : []),
        ...(Array.isArray(path.tenantIds) ? path.tenantIds : []),
      ]));

      const pathAssets = [
        ...(Array.isArray(courseAssetsData) ? courseAssetsData : []),
        ...(Array.isArray(path.attachments) ? path.attachments : []),
        ...(Array.isArray(path.careerPathAssets) ? path.careerPathAssets : []),
        ...(Array.isArray(path.pathAssets) ? path.pathAssets : []),
        ...(Array.isArray(path.assets) ? path.assets : []),
      ];
      const rawPathAttachments = pathAssets
        .filter((a: any) => {
          const sPath = storagePathOf(a);
          return sPath === "attachments" || sPath === "resources" || a.assetContext === "CAREER_PATH_ATTACHMENT" || a.assetContext === "CAREER_PATH" || a.assetRole === "ATTACHMENT" || a.assetRole === "SUPPORTING_MATERIAL" || a.assetRole === "RESOURCE";
        })
        .map((a: any) => ({
          id: a.id || a.assetId || a.asset?.id || "",
          name: getDisplayFileName(a.name || a.assetName || a.fileName || a.originalFileName || a.originalFilename || "Supporting Material", "Supporting Material"),
          url: assetUrl(a),
          size: a.size || a.fileSize || a.fileSizeBytes || undefined,
        }))
        .filter((att: any) => Boolean(att.id && att.url));
      const uniqueExistingPathAttachments = Array.from(
        new Map(rawPathAttachments.map((item: any) => [item.id, item])).values()
      );

      setFormData((prev) => ({
        ...prev,
        careerPathTitle: path.title || prev.careerPathTitle || "",
        careerPathSubtitle: path.subtitle || prev.careerPathSubtitle || "",
        categoryId: path.categoryId || path.category?.id || prev.categoryId || "",
        subjectId: path.subjectId || path.subject?.id || prev.subjectId || "",
        description: path.description || path.fullDescription || prev.description || "",
        fullDescription: path.fullDescription || path.description || prev.fullDescription || "",
        tagline: path.tagline || path.subtitle || prev.tagline || "",
        whatIsIncluded: prev.whatIsIncluded || path.whatIsIncluded || "",
        learningOutcomes: prev.learningOutcomes || (Array.isArray(path.learningOutcome) ? path.learningOutcome.join("\n") : (Array.isArray(path.learningOutcomes) ? path.learningOutcomes.join("\n") : (path.learningOutcome || path.learningOutcomes || ""))),
        duration: (path.duration ? String(path.duration) : (path.estimatedDuration ? String(path.estimatedDuration) : "")) || prev.duration || "",
        pricing: path.pricing || prev.pricing || "",
        priceTier: path.priceTier || path.pricing || prev.priceTier || "FREE",
        targetAudience: prev.targetAudience || (path.personaIds ? path.personaIds.join(", ") : ""),
        status: path.status || prev.status || "DRAFT",
        visibility: path.visibility || prev.visibility || "PUBLIC_CATALOG",
        difficulty: path.difficulty || path.difficultyLevel || prev.difficulty || "BEGINNER",
        language: path.language || prev.language || "English",
        corporateTenant: prev.corporateTenant?.length ? prev.corporateTenant : (pathTenantIds.length > 0 ? pathTenantIds : []),
        assessmentRequired: prev.assessmentRequired ?? (path.assessmentRequired || false),
        tags: prev.tags?.length ? prev.tags : ((path.careerPathTags || path.tags)?.map((pt: any) => typeof pt === "string" ? pt : (pt.tag?.name || pt.name)) || []),
        skillTags: prev.skillTags?.length ? prev.skillTags : ((path.skillTags || path.skills)?.map((ps: any) => typeof ps === "string" ? ps : (ps.skill?.name || ps.name)) || []),
        constituentCourses: prev.constituentCourses?.length ? prev.constituentCourses : (path.courses?.map((c: any, index: number) => ({
          id: c.course?.id || c.courseId || c.id,
          title: c.course?.title || c.title || "Untitled Course",
          actionLabel: "View",
          order: c.sequenceOrder || index + 1
        })) || []),
        existingCourseIds: prev.existingCourseIds?.length ? prev.existingCourseIds : (path.courses?.map((c: any) => c.course?.id || c.courseId || c.id).filter(Boolean) || []),
        existingAttachments: prev.existingAttachments?.length ? prev.existingAttachments : uniqueExistingPathAttachments,
        coverImageAssetUrl: prev.coverImageAssetUrl || courseAssetsData?.find((a: any) => a.assetType === "IMAGE" && (a.storagePath === "thumbnails" || a.assetContext === "CAREER_PATH" || a.assetContext === "COURSE_THUMBNAIL"))?.url || path.pathAssets?.[0]?.asset?.url || "",
        authorName: (path.authorName || prev.authorName || "Nexus Academy").trim(),
        instructorDesignation: "",
      }));

      setCreatedCareerPathId(path.id);
    }
  }, [pathToEdit, courseAssetsData, publishType, resolvedPathId]);

  const { lessons: apiLessons = [], query: apiLessonsQuery } = useCourseLessons(createdCourseId || "");
  const fetchedApiLessons = Array.isArray(apiLessonsQuery?.data) ? apiLessonsQuery.data : (Array.isArray(apiLessons) ? apiLessons : []);

  const effectiveLessons = createdCourseId
    ? (fetchedApiLessons.length > 0 ? fetchedApiLessons.map((l: any) => l.lesson || l) : courseLessons)
    : courseLessons;

  // Sync lesson assessments dynamically when user opens the assessment step
  useEffect(() => {
    if (activeSection !== "assessment" || publishType !== "standalone-course") return;

    let isMounted = true;
    const syncLessonQuestions = async () => {
      try {
        const lessonIds = effectiveLessons.map((l: any) => l.lesson?.id || l.id).filter(Boolean);
        if (lessonIds.length === 0) return;

        let newQuestions: any[] = [];
        
        for (const lid of lessonIds) {
          try {
            const res: any = await getQuizzesApi({ lessonId: lid });
            let quizzesArray: any[] = [];
            if (Array.isArray(res)) quizzesArray = res;
            else if (Array.isArray(res?.data)) quizzesArray = res.data;
            else if (Array.isArray(res?.data?.data)) quizzesArray = res.data.data;
            else if (Array.isArray(res?.data?.items)) quizzesArray = res.data.items;
            else if (Array.isArray(res?.items)) quizzesArray = res.items;

            if (quizzesArray.length > 0 && isMounted) {
              const quiz = quizzesArray.find((q: any) => String(q.lessonId || q.lesson_id) === String(lid)) || quizzesArray[0];
              const quizDetailRes = await getQuizByIdApi(quiz.id);
              const fullQuiz = quizDetailRes?.data || quizDetailRes;
              
              if (fullQuiz?.quizQuestions) {
                const groupMap = new Map<string, any>();
                const standaloneQuestions: any[] = [];

                const sortedQQs = [...fullQuiz.quizQuestions].sort(
                  (a: any, b: any) => (a.sequenceOrder ?? 0) - (b.sequenceOrder ?? 0)
                );

                for (const qq of sortedQQs) {
                  const qb = qq.question;
                  if (!qb) continue;

                  const correctAnswerIndex = qb.questionOptions?.findIndex((o: any) => o.isCorrect) ?? 0;
                  const options = qb.questionOptions
                    ?.sort((a: any, b: any) => a.displayOrder - b.displayOrder)
                    .map((o: any) => o.optionText) || [];

                  if (qb.questionGroupId && qb.questionGroup) {
                    const qg = qb.questionGroup;
                    const isPassage = qg.groupType === "ESSAY" || !!qg.passageText || !!qb.commonEssayText;
                    const isImageGroup = qg.groupType === "IMAGE" || !!qg.imageFileId;

                    if (!groupMap.has(qb.questionGroupId)) {
                      if (isPassage) {
                        groupMap.set(qb.questionGroupId, {
                          id: qg.id,
                          questionGroupId: qg.id,
                          type: "ESSAY",
                          title: qg.title || "Passage",
                          passageText: qg.passageText || qb.commonEssayText || "",
                          question: qg.title || "Passage",
                          note: "",
                          questions: [],
                        });
                      } else if (isImageGroup) {
                        groupMap.set(qb.questionGroupId, {
                          id: qg.id,
                          questionGroupId: qg.id,
                          type: "IMAGE",
                          imageFile: "",
                          imagePreview: qg.imageFile?.url || qg.imageFile?.signedUrl || "",
                          questions: [],
                        });
                      } else {
                        groupMap.set(qb.questionGroupId, {
                          id: qg.id,
                          questionGroupId: qg.id,
                          type: qg.groupType || "ESSAY",
                          title: qg.title || "",
                          passageText: qg.passageText || "",
                          questions: [],
                        });
                      }
                    }

                    const currentGroup = groupMap.get(qb.questionGroupId);
                    currentGroup.questions.push({
                      id: qq.id, // we might want to generate a new ID to avoid conflicts if edited
                      questionId: qb.id,
                      type: qb.questionType,
                      question: qb.questionText,
                      options,
                      correctAnswer: correctAnswerIndex >= 0 ? correctAnswerIndex : 0,
                    });
                    currentGroup.note = `${currentGroup.questions.length} sub-question${currentGroup.questions.length > 1 ? "s" : ""}`;
                  } else {
                    if (qb.questionType === "MCQ") {
                      standaloneQuestions.push({
                        id: qq.id,
                        questionId: qb.id,
                        type: "MCQ",
                        question: qb.questionText,
                        options,
                        correctAnswer: correctAnswerIndex >= 0 ? correctAnswerIndex : 0,
                      });
                    } else if (qb.questionType === "TRUE_FALSE") {
                      standaloneQuestions.push({
                        id: qq.id,
                        questionId: qb.id,
                        type: "TRUE_FALSE",
                        question: qb.questionText,
                        options: options.length === 2 ? options : ["True", "False"],
                        correctAnswer: correctAnswerIndex >= 0 ? correctAnswerIndex : 0,
                      });
                    } else if (qb.questionType === "IMAGE") {
                      standaloneQuestions.push({
                        id: qq.id,
                        questionId: qb.id,
                        type: "IMAGE",
                        question: qb.questionText,
                        imagePreview: qb.commonImageFile?.url || qb.commonImageFile?.signedUrl || qb.imageUrl || "",
                        options,
                        correctAnswer: correctAnswerIndex >= 0 ? correctAnswerIndex : 0,
                      });
                    } else if (qb.questionType === "ESSAY") {
                      standaloneQuestions.push({
                        id: qq.id,
                        questionId: qb.id,
                        type: "ESSAY",
                        title: qb.questionText,
                        passageText: qb.commonEssayText || "",
                        question: qb.questionText,
                        note: "1 sub-question",
                        questions: [
                          {
                            id: qq.id,
                            questionId: qb.id,
                            type: "MCQ",
                            question: qb.questionText,
                            options,
                            correctAnswer: correctAnswerIndex >= 0 ? correctAnswerIndex : 0,
                          },
                        ],
                      });
                    }
                  }
                }

                newQuestions = [...newQuestions, ...groupMap.values(), ...standaloneQuestions];
              }
            }
          } catch (err) {
            console.error("Failed to auto-hydrate lesson quiz questions:", err);
          }
        }

        if (newQuestions.length > 0 && isMounted) {
          setAssessmentQuestions(prev => {
            const existingIds = new Set(prev.map(q => q.questionId || q.id));
            const existingTexts = new Set(prev.map(q => q.question || q.title));
            
            const toAdd = newQuestions.filter(q => !existingIds.has(q.questionId || q.id) && !existingTexts.has(q.question || q.title));
            if (toAdd.length > 0) {
              return [...prev, ...toAdd];
            }
            return prev;
          });
        }
      } catch (err) {
        console.error("Failed to sync lesson assessments:", err);
      }
    };

    syncLessonQuestions();
    return () => { isMounted = false; };
  }, [activeSection, publishType, effectiveLessons]);

  const [isAddingLesson, setIsAddingLesson] = useState(false);
  const [addingLessonType, setAddingLessonType] = useState<string>("");
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [targetCourseIdForNewLesson, setTargetCourseIdForNewLesson] = useState<string | null>(null);

  const handleAddLesson = (lessonType: string, courseId?: string) => {
    const targetCId = courseId || createdCourseId || "";
    // Encode parentVisibility in URL params so it survives browser refresh
    const pvParam = formData.visibility ? `&parentVisibility=${encodeURIComponent(formData.visibility)}` : "";
    const pcParam = formData.corporateTenant?.length
      ? `&parentCorporateTenant=${encodeURIComponent(JSON.stringify(formData.corporateTenant))}`
      : "";
    navigate(`/studio/builder/1?type=lesson${targetCId ? `&courseId=${targetCId}` : ""}${pvParam}${pcParam}`, {
      state: {
        publishType: "standalone-lesson",
        courseId: targetCId,
        returnToCourseId: targetCId,
        parentVisibility: formData.visibility,
        parentCorporateTenant: formData.corporateTenant,
      },
    });
  };

  const handleEditLesson = (lesson: any, courseId?: string) => {
    const targetCId = courseId || createdCourseId || "";
    const pvParam = formData.visibility ? `&parentVisibility=${encodeURIComponent(formData.visibility)}` : "";
    const pcParam = formData.corporateTenant?.length
      ? `&parentCorporateTenant=${encodeURIComponent(JSON.stringify(formData.corporateTenant))}`
      : "";
    navigate(`/studio/builder/1?type=lesson&lessonId=${lesson.id}${targetCId ? `&courseId=${targetCId}` : ""}${pvParam}${pcParam}`, {
      state: {
        publishType: "standalone-lesson",
        lessonId: lesson.id,
        courseId: targetCId,
        returnToCourseId: targetCId,
        parentVisibility: formData.visibility,
        parentCorporateTenant: formData.corporateTenant,
      },
    });
  };

  const handleDeleteLesson = (lessonId: string) => {
    setCourseLessons((prev) =>
      prev.filter((lesson: any) => {
        const id = lesson.lesson?.id || lesson.lessonId || lesson.id;
        return id !== lessonId;
      })
    );
    setFormData((prev) => ({
      ...prev,
      existingLessonIds: (prev.existingLessonIds || []).filter((id) => id !== lessonId),
    }));
    useCourseLessonStore.getState().deleteLesson(lessonId);
  };

  const ownerId = useMemo(() => {
    try {
      const storedUser = localStorage.getItem('keycloak_session_user');
      if (!storedUser) return "";
      const parsed = JSON.parse(storedUser);
      const user = parsed?.user || parsed;
      return user?.id || user?.userId || user?.sub || user?.keycloakId || "";
    } catch (error) {
      console.error("Failed to parse session user", error);
      return "";
    }
  }, []);

  const isStandaloneCourse = publishType === "standalone-course";
  const isStandaloneLesson = publishType === "standalone-lesson";


  // -------------------NEW: Handle Career Path Creation-----------------------------------------------------------------------
  const buildCareerPathPayload = async (
    ownerId: string,
    formData: CreateCourseFormData,
    selectedCareerPathSkills: string[],
    selectedCareerPathTags: string[],
    courseLessons: any[] = [],
  ) => {
    const fd = new globalThis.FormData();

    fd.append("createdById", ownerId);
    fd.append("title", formData.careerPathTitle.trim());

    if (formData.careerPathSubtitle.trim()) {
      fd.append("subtitle", formData.careerPathSubtitle.trim());
    }

    if (formData.description?.trim()) {
      fd.append("description", formData.description.trim());
    }

    if (formData.fullDescription?.trim()) {
      fd.append("fullDescription", formData.fullDescription.trim());
    }

    if (formData.tagline?.trim()) {
      fd.append("tagline", formData.tagline.trim());
    }

    if (formData.subjectId) {
      fd.append("subjectId", formData.subjectId);
      fd.append("subjectIds", JSON.stringify([formData.subjectId]));
    }

    if (formData.categoryId) {
      fd.append("categoryId", formData.categoryId);
    }

    if (formData.visibility) {
      const mappedVis =
        formData.visibility === "Corporate" || formData.visibility === "TENANT_ONLY"
          ? "TENANT_ONLY"
          : formData.visibility === "BOTH" || formData.visibility === "PUBLIC_AND_CORPORATE"
            ? "BOTH"
            : "PUBLIC_CATALOG";
      fd.append("visibility", mappedVis);
    }

    fd.append("status", formData.status || "DRAFT");

    if (formData.difficulty) {
      fd.append("difficulty", formData.difficulty.toUpperCase());
    }

    if (formData.language) {
      fd.append("language", formData.language);
    }

    if (formData.prerequisitePath) {
      fd.append("prerequisitePathId", formData.prerequisitePath);
    }

    fd.append("notifyOnUpdate", "true");
    fd.append("slug", formData.careerPathTitle.trim().toLowerCase().replace(/\s+/g, "-"));
    fd.append("isFeatured", "false");
    fd.append("isTrending", "false");
    fd.append("isNewRelease", "false");
    fd.append("assessmentRequired", String(formData.assessmentRequired));

    if (formData.duration) {
      fd.append("estimatedDuration", String(Math.max(0, Number(formData.duration))));
    }

    if (formData.whatIsIncluded) {
      fd.append(
        "whatIsIncluded",
        Array.isArray(formData.whatIsIncluded)
          ? JSON.stringify(formData.whatIsIncluded)
          : typeof formData.whatIsIncluded === "string"
            ? JSON.stringify(formData.whatIsIncluded.split("\n").map((s: string) => s.trim()).filter(Boolean))
            : JSON.stringify(formData.whatIsIncluded)
      );
    }

    if (formData.visibility === "PUBLIC_CATALOG") {
      fd.append("tenantIds", JSON.stringify([]));
    } else if (formData.corporateTenant?.length > 0) {
      fd.append("tenantId", formData.corporateTenant[0]);
      fd.append("tenantIds", JSON.stringify(formData.corporateTenant));
    }

    fd.append("skills", JSON.stringify(selectedCareerPathSkills));
    fd.append("tags", JSON.stringify(selectedCareerPathTags));

    fd.append("authorName", (formData.authorName || "Nexus Academy").trim());
    if (formData.instructorDesignation !== undefined) {
      fd.append("instructorDesignation", formData.instructorDesignation.trim());
    }
    if (formData.learningOutcomes?.trim()) {
      fd.append("learningOutcomes", formData.learningOutcomes.trim());
    }

    const coursesPayload: any[] = [];

    if (formData.courseTitle?.trim()) {
      coursesPayload.push({
        isExisting: false,
        ownerId: ownerId,
        categoryId: formData.categoryId || undefined,
        title: formData.courseTitle.trim(),
        fullDescription: formData.fullDescription || "Course details pending",
        sequenceOrder: 1,
        difficulty: formData.difficulty || undefined,
        language: formData.language?.toLowerCase() || undefined,
        visibility: formData.visibility || undefined,
        assessmentRequired: formData.assessmentRequired,
        duration: formData.duration ? Math.max(0, Number(formData.duration)) : undefined,
        slug: formData.courseTitle.trim().toLowerCase().replace(/\s+/g, "-"),
        lessons: [
          ...(courseLessons.length > 0 ? courseLessons.map((l, idx) => ({
            isExisting: false,
            ownerId: ownerId,
            sequenceOrder: idx + 1,
            title: l.title,
            lessonType: l.lessonType
          })) : formData.lessonTitle?.trim() ? [{
            isExisting: false,
            ownerId: ownerId,
            sequenceOrder: 1,
            title: formData.lessonTitle.trim(),
            lessonType: formData.lessonType || "VIDEO",
            description: formData.lessonDescription?.trim() || undefined,
            shortDescription: formData.lessonDescription?.trim()?.slice(0, 160) || undefined,
            duration: formData.duration ? Math.max(0, Number(formData.duration)) : undefined,
            language: formData.language?.toLowerCase() || undefined,
            tagline: formData.tagline?.trim() || undefined,
          }] : []),
          ...(formData.existingLessonIds || []).map((lessonId, idx) => ({
            isExisting: true,
            lessonId: lessonId,
            sequenceOrder: (courseLessons.length > 0 ? courseLessons.length : (formData.lessonTitle?.trim() ? 1 : 0)) + idx + 1
          }))
        ]
      });

      if (formData.coursethumbnail) {
        fd.append("courseThumbnails", formData.coursethumbnail);
      }
      if (formData.attachment) {
        fd.append("coursePreviews", formData.attachment);
      }

      if (courseLessons.length === 0 && formData.lessonTitle?.trim()) {
        if (formData.thumbnail) fd.append("lessonThumbnails", formData.thumbnail);
        if (formData.primaryContent) fd.append("lessonContents", formData.primaryContent);
        if (formData.transcript) fd.append("lessonTranscripts", formData.transcript);
      }
    }

    const startIndex = coursesPayload.length;
    (formData.existingCourseIds || []).forEach((courseId, index) => {
      coursesPayload.push({
        isExisting: true,
        courseId: courseId,
        sequenceOrder: startIndex + index + 1,
      });
    });

    fd.append("courses", JSON.stringify(coursesPayload));

    fd.append("status", formData.status || "DRAFT");

    if (formData.duration) {
      fd.append("estimatedDuration", String(Math.max(0, Number(formData.duration)) || 0));
    }

    if (formData.coverImage) {
      fd.append("careerPathCoverImage", formData.coverImage);
    }
    if (formData.attachment) {
      fd.append("careerPathPreview", formData.attachment);
    }

    return fd;
  };

  // --- Dynamic Mapping & Creation Helpers ---
  const resolveSkillIds = async (skillNames: string[], currentSelectedIds?: string[]) => {
    const finalIds = new Set<string>();
    const missingNames: string[] = [];
    for (const name of skillNames) {
      if (!name) continue;
      const existing = skills.find(s => s.name.toLowerCase() === name.toLowerCase());
      if (existing) {
        finalIds.add(existing.id);
      } else {
        missingNames.push(name);
      }
    }
    if (missingNames.length > 0) {
      const results = await Promise.allSettled(missingNames.map(name => createSkillApi({ name })));
      results.forEach(res => {
        if (res.status === "fulfilled") {
          const val = res.value as any;
          const id = val?.data?.id || val?.id;
          if (id) finalIds.add(id);
        }
      });
      queryClient.invalidateQueries({ queryKey: ["skills"] });
    }
    return Array.from(finalIds);
  };

  const resolveTagIds = async (tagNames: string[], currentSelectedIds?: string[]) => {
    const finalIds = new Set<string>();
    const missingNames: string[] = [];
    for (const name of tagNames) {
      if (!name) continue;
      const existing = tags.find(t => t.name.toLowerCase() === name.toLowerCase());
      if (existing) {
        finalIds.add(existing.id);
      } else {
        missingNames.push(name);
      }
    }
    if (missingNames.length > 0) {
      const results = await Promise.allSettled(missingNames.map(name => createTagApi({ name })));
      results.forEach(res => {
        if (res.status === "fulfilled") {
          const val = res.value as any;
          const id = val?.data?.id || val?.id;
          if (id) finalIds.add(id);
        }
      });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    }
    return Array.from(finalIds);
  };

  // 1. Career Path
  const submitCareerPath = async () => {
    try {
      const finalSkillIds = await resolveSkillIds(selectedSkillNames || [], selectedSkillIds);
      const finalTagIds = await resolveTagIds(selectedTagNames || [], selectedTagIds);

      const payload = await buildCareerPathPayload(
        ownerId,
        formData,
        finalSkillIds,
        finalTagIds,
        courseLessons,
      );

      let response;
      const targetPathId = pathId || createdCareerPathId;
      if (targetPathId) {
        response = await updateMutation.mutateAsync({ id: targetPathId, data: payload } as any);
      } else {
        response = await createMutation.mutateAsync(payload);
      }

      const careerPathId = response?.data?.id || response?.id || pathId;

      if (!careerPathId) {
        throw new Error("Career Path ID not returned from API");
      }

      setCreatedCareerPathId(careerPathId);
      hydratedPathIdRef.current = careerPathId;
      console.log(`✅ Career Path ${isEditMode ? 'updated' : 'created'}. ID =`, careerPathId);


      let extractedCourseId: string | null = null;

      if (formData.courseTitle?.trim()) {
        const cpData = response?.data?.data || response?.data || response;
        if (cpData?.courses && cpData.courses.length > 0) {
          const newCourseLinked = cpData.courses.find((c: any) => c.course?.title === formData.courseTitle.trim());
          if (newCourseLinked && newCourseLinked.courseId) {
            extractedCourseId = newCourseLinked.courseId;
            console.log("✅ Extracted nested newly created Course ID:", extractedCourseId);
          }
        }
      }

      if (!extractedCourseId && formData.existingCourseIds && formData.existingCourseIds.length > 0) {
        extractedCourseId = formData.existingCourseIds[0];
        console.log("✅ Using existing Course ID for lesson management:", extractedCourseId);
      }

      if (extractedCourseId) {
        setCreatedCourseId(extractedCourseId);
      }

      // Upload career path-level attachments if attached (storagePath: "attachments")
      if (formData.lessonAttachments && formData.lessonAttachments.length > 0 && careerPathId) {
        for (const file of formData.lessonAttachments) {
          try {
            await uploadSingleAsset(careerPathId, file, "DOCUMENT", "attachments", "CAREER_PATH");
          } catch (attErr) {
            console.error("Career path attachment upload error:", attErr);
          }
        }
      } else if (formData.attachment && careerPathId) {
        try {
          await uploadSingleAsset(careerPathId, formData.attachment, "DOCUMENT", "attachments", "CAREER_PATH");
        } catch (attErr) {
          console.error("Career path attachment upload error:", attErr);
        }
      }

      if (formData.removedAttachmentIds && formData.removedAttachmentIds.length > 0) {
        await Promise.allSettled(
          formData.removedAttachmentIds.map((attId: string) => deleteAssetApi(attId))
        );
      }

      updateForm({ lessonAttachments: [], removedAttachmentIds: [] });
      queryClient.invalidateQueries({ queryKey: ["career-path", careerPathId] });
      queryClient.invalidateQueries({ queryKey: ["course-assets", careerPathId] });

      notification.success({ title: "Career Path created successfully!" });

      setActiveSection("lessons");   // Move to Lessons
      return careerPathId;

    } catch (error: any) {
      console.error(error);
      notification.error({
        title: "Save Failed",
        description: error?.message || "Please check console",
      });
    }
  };

  // ====================== STANDALONE COURSE ======================

  const uploadCourseThumbnail = async (
    courseId: string,
    ownerId: string,
  ) => {
    if (!formData.coursethumbnail) {
      return "";
    }

    const fd = new FormData();

    fd.append("file", formData.coursethumbnail);

    fd.append("uploadedBy", ownerId);
    fd.append("courseId", courseId);

    fd.append("assetContext", "COURSE");
    fd.append("assetType", "IMAGE");
    fd.append("storagePath", "thumbnail");

    const response = await uploadAsset(fd, true);

    const assetId =
      response?.data?.id ??
      response?.id ??
      "";

    updateForm({
      courseThumbnailAssetId: assetId,
    });

    console.log("✅ Course Thumbnail Uploaded:", assetId);

    return assetId;
  };

  const buildStandaloneCoursePayload = (
    ownerId: string,
    formData: CreateCourseFormData,
    finalSkillIds: string[],
    finalTagIds: string[],
  ): globalThis.FormData => {
    const fd = new globalThis.FormData();
    const effectiveFullDesc = (formData.fullDescription || formData.description || formData.shortDescription || "").trim();
    const effectiveShortDesc = (formData.shortDescription || effectiveFullDesc.slice(0, 160) || "").trim();

    // Required fields
    fd.append("ownerId", ownerId);
    const effectiveCategoryId = formData.categoryId || (categories?.[0]?.id || "");
    if (effectiveCategoryId) {
      fd.append("categoryId", effectiveCategoryId);
    }
    fd.append("title", (formData.courseTitle || formData.lessonTitle || "").trim());
    fd.append("fullDescription", effectiveFullDesc);
    const learningTypeToSave = (formData.lessonType || formData.shortDescription || effectiveShortDesc || "").trim();
    if (learningTypeToSave) {
      fd.append("shortDescription", learningTypeToSave);
    }
    // Optional fields
    if (formData.subcategoryId) {
      fd.append("subcategoryId", formData.subcategoryId);
    }

    if (formData.subjectId) {
      fd.append("subjectIds", JSON.stringify([formData.subjectId]));
    }

    if (formData.courseSubtitle?.trim()) {
      fd.append("subtitle", formData.courseSubtitle.trim());
    }

    if (formData.tagline?.trim()) {
      fd.append("tagline", formData.tagline.trim());
    }

    if (formData.targetAudience?.trim()) {
      fd.append("targetAudience", formData.targetAudience.trim());
    }

    if (formData.prerequisites?.trim()) {
      fd.append("prerequisites", formData.prerequisites.trim());
    }
    // Scalars
    fd.append("difficulty", (formData.difficulty || "BEGINNER").toUpperCase());
    fd.append("language", formData.language || "English");
    fd.append("priceTier", formData.priceTier || "FREE");
    fd.append("visibility", formData.visibility || "PUBLIC_CATALOG");
    fd.append("assessmentRequired", String(formData.assessmentRequired || false));
    fd.append("notifyOnUpdate", "true");
    fd.append("isStandalone", String(isStandaloneCourse));
    fd.append("status", String(formData.status) || "DRAFT");

    if (formData.previewLessonIds && formData.previewLessonIds.length > 0) {
      fd.append("previewLessonId", JSON.stringify(formData.previewLessonIds));
    }
    fd.append("videoThreshold", "90");
    fd.append("duration", String(Math.max(0, Number(formData.duration)) || 0));
    fd.append("slug", (formData.courseTitle || formData.lessonTitle || "course").trim().toLowerCase().replace(/\s+/g, "-"));
    if (formData.authorName?.trim()) {
      fd.append("authorName", formData.authorName.trim());
    }
    if (formData.instructorDesignation?.trim()) {
      fd.append("instructorDesignation", formData.instructorDesignation.trim());
    }

    // JSON values
    if (formData.learningObjectives?.trim()) {
      fd.append("learningObjectives", formData.learningObjectives.trim());
    }
    if (formData.learningOutcomes?.trim()) {
      fd.append("learningOutcomes", formData.learningOutcomes.trim());
    }

    // Arrays - Persist exact human-readable words for course tags & skills
    const effectiveSkillNames = (formData.skillTags && formData.skillTags.length > 0) ? formData.skillTags : (selectedSkillNames || []);
    const effectiveTagNames = (formData.tags && formData.tags.length > 0) ? formData.tags : (selectedTagNames || []);
    fd.append("skills", JSON.stringify(effectiveSkillNames));
    fd.append("tags", JSON.stringify(effectiveTagNames));
    if (formData.existingLessonIds && formData.existingLessonIds.length > 0) {
      fd.append("existingLessonIds", JSON.stringify(formData.existingLessonIds));
    }

    if (formData.visibility === "PUBLIC_CATALOG") {
      fd.append("tenantIds", JSON.stringify([]));
    } else if (formData.corporateTenant?.length > 0) {
      fd.append("tenantId", formData.corporateTenant[0]);
      fd.append("tenantIds", JSON.stringify(formData.corporateTenant));
    }
    // Files
    if (formData.coursethumbnail || formData.thumbnail) {
      fd.append("courseThumbnail", formData.coursethumbnail || formData.thumbnail as Blob);
    }

    // Lessons for Standalone Course:
    // Only explicitly mapped/added course lessons are included.
    // Course Basic Information in step 1 is never treated as a lesson.
    const lessonsPayload = courseLessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      lessonType: lesson.lessonType,
    }));

    fd.append("lessons", JSON.stringify(lessonsPayload));
    return fd;
  };

  const submitStandaloneCourse = async () => {
    try {
      const effectiveSkillNames = (formData.skillTags && formData.skillTags.length > 0) ? formData.skillTags : (selectedSkillNames || []);
      const effectiveTagNames = (formData.tags && formData.tags.length > 0) ? formData.tags : (selectedTagNames || []);

      const payload = buildStandaloneCoursePayload(
        ownerId,
        formData,
        effectiveSkillNames,
        effectiveTagNames,
      );

      let response;
      const targetCourseId = courseId || createdCourseId;
      if (targetCourseId) {
        response = await updateCourseMutation.mutateAsync({ id: targetCourseId, data: payload });
      } else {
        response = await createCourseMutation.mutateAsync(payload);
      }

      console.log("========== COURSE RESPONSE ==========");
      console.log(response);
      console.log(JSON.stringify(response, null, 2));
      console.log("===========================================");

      const createdOrUpdatedId =
        (response as any)?.data?.data?.id ??
        (response as any)?.data?.id ??
        (response as any)?.id ??
        courseId;

      if (!createdOrUpdatedId) {
        console.error("Full API Response:", response);
        throw new Error("Course saved but ID not returned");
      }

      setCreatedCourseId(createdOrUpdatedId);
      hydratedCourseIdRef.current = createdOrUpdatedId;
      console.log(`✅ Standalone Course ${isEditMode ? 'updated' : 'created'}. ID =`, createdOrUpdatedId);

      // Upload course-level supporting material if attached (storagePath: "resources")
      if (formData.supportingMaterialFile && createdOrUpdatedId) {
        try {
          await uploadSingleAsset(createdOrUpdatedId, formData.supportingMaterialFile, "DOCUMENT", "resources", "COURSE");
        } catch (smErr) {
          console.error("Course supporting material upload error:", smErr);
        }
      }

      // Upload course-level attachments if attached (storagePath: "attachments")
      if (formData.lessonAttachments && formData.lessonAttachments.length > 0 && createdOrUpdatedId) {
        for (const file of formData.lessonAttachments) {
          try {
            await uploadSingleAsset(createdOrUpdatedId, file, "DOCUMENT", "attachments", "COURSE");
          } catch (attErr) {
            console.error("Course attachment upload error:", attErr);
          }
        }
      } else if (formData.attachment && createdOrUpdatedId) {
        try {
          await uploadSingleAsset(createdOrUpdatedId, formData.attachment, "DOCUMENT", "attachments", "COURSE");
        } catch (attErr) {
          console.error("Course attachment upload error:", attErr);
        }
      }

      if (formData.removedAttachmentIds && formData.removedAttachmentIds.length > 0) {
        await Promise.allSettled(
          formData.removedAttachmentIds.map((attId: string) => deleteAssetApi(attId))
        );
      }

      updateForm({ lessonAttachments: [], removedAttachmentIds: [] });
      queryClient.invalidateQueries({ queryKey: ["course", createdOrUpdatedId] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["course-assets", createdOrUpdatedId] });

      notification.success({ title: `Course ${isEditMode ? 'updated' : 'created'} successfully!` });
      return createdOrUpdatedId;


    } catch (error: any) {
      console.error("COURSE SAVE ERROR", error);
      notification.error({
        title: "Course Save Failed",
        description: error?.message || "Check console for details",
      });
    }
  };

  // ====================== STANDALONE LESSON ======================+

  const submitStandaloneLesson = async () => {
    let lessonId = createdLessonId || routeLessonId || (location.state as any)?.lessonId || new URLSearchParams(location.search).get("lessonId") || null;
    try {
      let lessonData: LessonFormData;
      let lessonFiles: any;

      if (lessonRef.current) {
        if (!lessonRef.current.validate()) return null;
        lessonData = lessonRef.current.getLessonData();
        lessonFiles = lessonRef.current.getLessonFiles();
      } else {
        const lessonTitle = (formData.lessonTitle || "").trim();
        if (!lessonTitle) {
          notification.error({ title: "Lesson Title is required" });
          return null;
        }
        const effectiveContents = [...((formData as any).lessonContents || [])];
        if (formData.textVersion?.trim()) {
          const existingTextIndex = effectiveContents.findIndex((lc: any) => lc.format === "TEXT" || lc.format === "ARTICLE");
          const textBlock = {
            id: `text-block-${Date.now()}`,
            blockType: "PARAGRAPH",
            textContent: formData.textVersion.trim(),
            displayOrder: 1,
          };
          if (existingTextIndex >= 0) {
            effectiveContents[existingTextIndex] = {
              ...effectiveContents[existingTextIndex],
              blocks: [textBlock],
            };
          } else {
            effectiveContents.push({
              id: `lc-${Date.now()}`,
              title: "Text Version",
              format: "TEXT",
              displayOrder: effectiveContents.length + 1,
              isDefault: false,
              blocks: [textBlock],
            });
          }
        }

        lessonData = {
          lessonTitle,
          lessonType: formData.lessonType || "VIDEO",
          lessonDescription: (formData.lessonDescription || formData.fullDescription || "").trim(),
          primaryContent: formData.primaryContent || null,
          videoUrl: formData.videoUrl || undefined,
          transcript: formData.transcript || null,
          lessonAttachments: (formData as any).lessonAttachments || (formData.attachment ? [formData.attachment] : []),
          lessonContents: effectiveContents,
          allowPreview: (formData as any).allowPreview ?? false,
          previewDuration: (formData as any).previewDuration ?? null,
          previewAccessType: (formData as any).previewAccessType || "NONE",
          lessonDuration: formData.duration && Number(formData.duration) > 0
            ? Number(formData.duration)
            : ((formData as any).lessonDuration && Number((formData as any).lessonDuration) > 0
              ? Number((formData as any).lessonDuration)
              : undefined),
          tagLine: formData.tagLine || formData.tagline || undefined,
          language: formData.language || "english",
          learningOutcomes: Array.isArray(formData.learningOutcomes) ? formData.learningOutcomes : (formData.learningOutcomes ? [formData.learningOutcomes] : []),
          thumbnail: formData.thumbnail || null,
          authorName: formData.authorName?.trim() || "Nexus Academy",
          instructorDesignation: formData.instructorDesignation?.trim() || undefined,
        };
        lessonFiles = {
          primaryContent: formData.primaryContent || null,
          transcript: formData.transcript || null,
          supportingMaterialFile: formData.supportingMaterialFile || null,
          lessonAttachments: (formData as any).lessonAttachments || (formData.attachment ? [formData.attachment] : []),
          lessonContents: effectiveContents,
          thumbnail: formData.thumbnail || null,
        };
      }

      // If duration is still missing or 0 and a video URL is provided, eagerly auto-detect real duration before submit
      if ((!lessonData.lessonDuration || Number(lessonData.lessonDuration) <= 0) && (lessonData.videoUrl || formData.videoUrl)) {
        const candidateUrl = lessonData.videoUrl || formData.videoUrl;
        if (candidateUrl) {
          try {
            const detectedSecs = await detectMediaDuration(candidateUrl);
            if (detectedSecs && detectedSecs > 0) {
              const detectedMins = formatDurationToMinutes(detectedSecs);
              lessonData.lessonDuration = detectedMins;
              updateForm({ duration: detectedMins.toString(), lessonDuration: detectedMins } as any);
            }
          } catch (e) {
            console.warn("Could not eagerly auto-detect duration before submit:", e);
          }
        }
      }

      lessonData.lessonContents = normalizeLessonContents(lessonData.lessonContents);
      lessonFiles.lessonContents = normalizeLessonContents(lessonFiles.lessonContents);

      setSavingStatusMessage("Saving lesson details...");
      const finalSkillIds = await resolveSkillIds(activeSkillTags || [], selectedSkillIds);
      const finalTagIds = await resolveTagIds(activeTags || [], selectedTagIds);

      const createPayload = buildStandaloneLessonPayload(ownerId, lessonData, finalSkillIds, finalTagIds);

      if (lessonId) {
        await updateLessonMutation.mutateAsync({ lessonId, data: createPayload });
        hydratedLessonIdRef.current = lessonId;
      } else {
        const lessonRes = await createLessonMutation.mutateAsync(createPayload);
        lessonId = (lessonRes as any)?.data?.data?.id || (lessonRes as any)?.data?.id || (lessonRes as any)?.id;

        if (!lessonId) throw new Error("No lesson ID returned from server");

        setCreatedLessonId(lessonId);
        hydratedLessonIdRef.current = lessonId;
      }

      // Upload files or process removals if any
      const hasRemovals = (formData.removedAssetRoles && formData.removedAssetRoles.length > 0) ||
        (formData.removedAttachmentIds && formData.removedAttachmentIds.length > 0) ||
        Boolean(formData.removedSupportingMaterial);
      const hasThumbnail = Boolean(lessonFiles.thumbnail || formData.thumbnail);

      if (hasThumbnail || lessonFiles.primaryContent || lessonFiles.transcript ||
        lessonFiles.supportingMaterialFile || formData.supportingMaterialFile ||
        lessonFiles.lessonAttachments?.length > 0 || lessonFiles.lessonContents?.length > 0 || hasRemovals) {

        setSavingStatusMessage("Uploading lesson media and files in parallel...");
        const uploadedAssets = await uploadAllLessonFiles(lessonId, lessonFiles);
        const updatePayload = buildStandaloneLessonUpdatePayload(
          uploadedAssets.finalContents,
          uploadedAssets.thumbnailAssetId,
          uploadedAssets.contentAssetId,
          uploadedAssets.transcriptAssetId,
          uploadedAssets.attachmentIds,
          finalSkillIds,
          finalTagIds,
          lessonData.videoUrl || formData.videoUrl,
          uploadedAssets.supportingMaterialAssetId
        );

        setSavingStatusMessage("Finalizing lesson...");
        await updateLessonMutation.mutateAsync({ lessonId, data: updatePayload });
      }

      if (formData.removedAttachmentIds && formData.removedAttachmentIds.length > 0) {
        await Promise.allSettled(
          formData.removedAttachmentIds.map((attId: string) => deleteAssetApi(attId))
        );
      }

      updateForm({ lessonAttachments: [], removedAttachmentIds: [] });
      queryClient.invalidateQueries({ queryKey: ["lesson", lessonId] });
      queryClient.invalidateQueries({ queryKey: ["course-assets", lessonId] });

      const relatedCourseId = (location.state as any)?.returnToCourseId || (location.state as any)?.courseId || searchParams.get("courseId") || resolvedCourseId || createdCourseId;
      if (relatedCourseId) {
        queryClient.invalidateQueries({ queryKey: ["course-lessons", relatedCourseId] });
        queryClient.invalidateQueries({ queryKey: ["course-assets", relatedCourseId] });
      }
      queryClient.invalidateQueries({ queryKey: ["course-lessons"] });
      queryClient.invalidateQueries({ queryKey: ["lessons"] });

      setSavingStatusMessage("Lesson saved successfully!");
      notification.success({ title: "Lesson saved successfully!" });
      return lessonId;

    } catch (error: any) {
      console.error("Submission error:", error, error?.response?.data);
      const isUploadError = !!createdLessonId && (error?.config?.url?.includes('/assets') || error?.message?.toLowerCase().includes('upload'));

      const backendIssues = error?.response?.data?.issues?.map((i: any) => `${i.path?.join('.')}: ${i.message}`).join('; ');
      const backendMsg = error?.response?.data?.message;
      let errorDesc = backendIssues || backendMsg || error?.message || "Check console for details";
      if (error?.response?.data?.errors) {
        errorDesc += " " + JSON.stringify(error?.response?.data?.errors);
      }

      notification.error({
        title: isUploadError ? "Lesson Saved, but Upload Failed" : (lessonId ? "Lesson Update Failed" : "Lesson Creation Failed"),
        description: errorDesc,
      });
      return lessonId || null;
    }
  };

  // Updated to accept LessonFormData + full formData if needed
  // 1. Update this function signature and body:
  const buildStandaloneLessonPayload = (ownerId: string, lessonData: LessonFormData, finalSkillIds: string[], finalTagIds: string[]) => ({
    ownerId,
    title: lessonData.lessonTitle.trim(),
    lessonType: formData.lessonType || lessonData.lessonType || "VIDEO",
    subjectId: formData.subjectId || undefined,
    categoryId: formData.categoryId || undefined,
    shortDescription: lessonData.lessonDescription.trim() || undefined,
    description: formData.fullDescription?.trim() || undefined,
    tagline: lessonData.tagLine?.trim() || undefined,
    learningOutcomes: lessonData.learningOutcomes || [],
    slug: lessonData.lessonTitle
      .trim()
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-"),

    difficulty: formData.difficulty || "BEGINNER",
    language: formData.language || lessonData.language || "English",
    duration: lessonData.lessonDuration && Number(lessonData.lessonDuration) > 0
      ? Math.max(0, Number(lessonData.lessonDuration))
      : (formData.duration && Number(formData.duration) > 0
        ? Math.max(0, Number(formData.duration))
        : ((formData as any).lessonDuration && Number((formData as any).lessonDuration) > 0
          ? Math.max(0, Number((formData as any).lessonDuration))
          : undefined)),

    visibility: formData.visibility,
    assessmentRequired: Boolean((location.state as any)?.returnToCourseId || (location.state as any)?.courseId || searchParams.get("courseId")) ? false : formData.assessmentRequired,

    videoThreshold: 80,
    completionThreshold: 100,


    isStandalone: (lessonToEdit && typeof (lessonToEdit as any).isStandalone === 'boolean')
      ? (lessonToEdit as any).isStandalone
      : !Boolean((location.state as any)?.returnToCourseId || (location.state as any)?.courseId || searchParams.get("courseId")),

    allowPreview: lessonData.allowPreview,
    previewAccessType: lessonData.allowPreview ? lessonData.previewAccessType : "NONE",
    previewDuration: lessonData.allowPreview ? Math.max(0, Number(lessonData.previewDuration)) : undefined,

    notifyOnUpdate: true,
    status: formData.status || "DRAFT",           // ← Fixed: take from main formData

    skillIds: finalSkillIds,
    tagIds: finalTagIds,
    personaIds: [],
    tenantIds: formData.visibility === "PUBLIC_CATALOG" ? [] : (formData.corporateTenant || []),
    courseIds: ((location.state as any)?.courseId || searchParams.get("courseId"))
      ? [((location.state as any)?.courseId || searchParams.get("courseId"))]
      : (formData.existingCourseIds && formData.existingCourseIds.length > 0 ? formData.existingCourseIds : []),
    videoUrl: lessonData.videoUrl || formData.videoUrl || undefined,
    authorName: (formData.authorName || lessonData.authorName || "Nexus Academy").trim(),
    instructorDesignation: (formData.instructorDesignation || lessonData.instructorDesignation || "").trim() || undefined,
  });

  // NEW: Centralized Fast Parallel Upload Function
  const uploadAllLessonFiles = async (lessonId: string, files: any) => {
    const { primaryContent, transcript, lessonAttachments, lessonContents, supportingMaterialFile } = files;

    const typeUpper = (formData.lessonType || "VIDEO").toUpperCase();
    let primaryAssetType = "VIDEO";
    let primaryStoragePath = "videos";
    if (typeUpper === "AUDIO") {
      primaryAssetType = "AUDIO";
      primaryStoragePath = "resources";
    } else if (typeUpper === "IMAGE") {
      primaryAssetType = "IMAGE";
      primaryStoragePath = "resources";
    } else if (typeUpper === "PDF" || typeUpper === "DOCUMENT") {
      primaryAssetType = "DOCUMENT";
      primaryStoragePath = "resources";
    } else if (typeUpper === "SCORM") {
      primaryAssetType = "ZIP";
      primaryStoragePath = "resources";
    }

    const effectiveSupportingMaterial = supportingMaterialFile || formData.supportingMaterialFile;

    // Execute all independent file uploads concurrently in parallel via Promise.all
    const [
      finalContents,
      thumbnailAssetId,
      contentAssetId,
      transcriptAssetId,
      supportingMaterialAssetId,
      attachmentResults,
    ] = await Promise.all([
      // 1. Study content assets
      lessonContents?.length > 0
        ? uploadLessonContentAssets(lessonId, ownerId, lessonContents).catch((err) => {
          console.error("Study content upload warning:", err);
          return [];
        })
        : Promise.resolve([]),

      // 2. Lesson thumbnail
      (files.thumbnail || formData.thumbnail)
        ? uploadSingleAsset(lessonId, files.thumbnail || formData.thumbnail, "IMAGE", "thumbnails").catch((err) => {
          console.error("Thumbnail upload warning:", err);
          return undefined;
        })
        : Promise.resolve(undefined),

      // 3. Primary media content (video, document, audio, etc.)
      primaryContent
        ? uploadSingleAsset(lessonId, primaryContent, primaryAssetType, primaryStoragePath).catch((err) => {
          console.error("Primary content upload warning:", err);
          return undefined;
        })
        : Promise.resolve(undefined),

      // 4. Transcript
      transcript
        ? uploadSingleAsset(lessonId, transcript, "DOCUMENT", "transcripts").catch((err) => {
          console.error("Transcript upload warning:", err);
          return undefined;
        })
        : Promise.resolve(undefined),

      // 5. Supporting Material (storagePath: "resources")
      effectiveSupportingMaterial
        ? uploadSingleAsset(lessonId, effectiveSupportingMaterial, "DOCUMENT", "resources").catch((err) => {
          console.error("Supporting material upload warning:", err);
          return undefined;
        })
        : Promise.resolve(undefined),

      // 6. Attachments (all attachments uploaded concurrently in parallel)
      lessonAttachments && lessonAttachments.length > 0
        ? Promise.allSettled(
          lessonAttachments.map((file: File) =>
            uploadSingleAsset(lessonId, file, "DOCUMENT", "attachments")
          )
        )
        : Promise.resolve([]),
    ]);

    const attachmentIds = (attachmentResults as any[])
      .filter((r) => r.status === "fulfilled" && r.value)
      .map((r) => r.value);

    return { finalContents, thumbnailAssetId, contentAssetId, transcriptAssetId, supportingMaterialAssetId, attachmentIds };
  };

  // ====================== UPLOAD HELPERS ======================

  const uploadSingleAsset = async (
    entityId: string,
    file: File,
    assetType: string,
    storagePath: string,   // Must match backend allowed paths
    context: "LESSON" | "COURSE" | "CAREER_PATH" = "LESSON"
  ): Promise<string> => {
    const payload = {
      ...(context === "COURSE"
        ? { courseId: entityId }
        : context === "CAREER_PATH"
          ? { careerPathId: entityId }
          : { lessonId: entityId }),
      uploadedBy: ownerId || "",
      assetContext: context,
      assetType,
      storagePath,
    };

    try {
      const fd = new FormData();
      fd.append("file", file);
      Object.entries(payload).forEach(([key, val]) => fd.append(key, val as string));
      const asset = await uploadAsset(fd);
      console.log(`Uploaded ${assetType} to ${storagePath} for ${context}:`, asset.id);
      return asset.id;
    } catch (err: any) {
      console.error(`Upload failed for ${storagePath}:`, err.response?.data || err);
      throw err;
    }
  };

  // Updated Study Content Upload
  const uploadLessonContentAssets = async (
    lessonId: string,
    ownerId: string,
    contents: LessonContent[]
  ): Promise<LessonContent[]> => {
    console.log("🔄 uploadLessonContentAssets called with", contents.length, "contents");

    if (!contents || contents.length === 0) return [];

    const updatedContents = await Promise.all(
      contents.map(async (content) => {
        const updatedBlocks = await Promise.all(
          content.blocks.map(async (block) => {
            if (!block.file) return block;

            let storagePath = "resources"; // default

            switch (block.blockType) {
              case "IMAGE":
                storagePath = "thumbnails";     // or "images" if allowed
                break;
              case "VIDEO":
                storagePath = "videos";
                break;
              case "PDF":
                storagePath = "attachments";
                break;
              case "AUDIO":
                storagePath = "resources";
                break;
              default:
                storagePath = "resources";
            }

            const payload = {
              lessonId,
              uploadedBy: ownerId,
              assetContext: "LESSON",
              assetType: block.blockType === "IMAGE" ? "IMAGE" : "DOCUMENT",
              storagePath,
            };

            try {
              const fd = new FormData();
              fd.append("file", block.file);
              Object.entries(payload).forEach(([key, val]) => fd.append(key, val as string));
              const asset = await uploadAsset(fd, true);

              console.log(`✅ Block uploaded: ${block.blockType} → ${storagePath}`);

              return {
                ...block,
                assetId: asset.id,
                assetUrl: asset.url,
                file: undefined,
                previewUrl: undefined,
              };
            } catch (err) {
              console.error("Block upload failed", err);
              return block; // continue with other blocks
            }
          })
        );

        return { ...content, blocks: updatedBlocks };
      })
    );

    return updatedContents;
  };

  const buildStandaloneLessonUpdatePayload = (
    lessonContents: LessonContent[],
    thumbnailAssetId?: string,
    contentAssetId?: string,
    transcriptAssetId?: string,
    attachmentIds: string[] = [],
    finalSkillIds?: string[],
    finalTagIds?: string[],
    videoUrl?: string,
    newSupportingMaterialAssetId?: string
  ) => {
    const payload: any = {
      lessonContents: normalizeLessonContents(lessonContents),
      skillIds: finalSkillIds !== undefined ? finalSkillIds : selectedSkillIds,
      tagIds: finalTagIds !== undefined ? finalTagIds : selectedTagIds,
      visibility: formData.visibility || "PUBLIC_CATALOG",
      tenantIds: formData.visibility === "PUBLIC_CATALOG" ? [] : (formData.corporateTenant || []),
      assessmentRequired: formData.assessmentRequired || false,
      authorName: (formData.authorName || "Nexus Academy").trim(),
      instructorDesignation: formData.instructorDesignation !== undefined ? formData.instructorDesignation.trim() : undefined,
      categoryId: formData.categoryId || undefined,
      subjectId: formData.subjectId || undefined,
      difficulty: formData.difficulty || undefined,
      lessonType: formData.lessonType || undefined,
      language: formData.language || undefined,
    };

    if (thumbnailAssetId) {
      payload.thumbnailAssetId = thumbnailAssetId;
    } else if (formData.removedAssetRoles?.includes("THUMBNAIL")) {
      payload.thumbnailAssetId = null;
    }

    if (contentAssetId) {
      payload.contentAssetId = contentAssetId;
    } else if (formData.removedAssetRoles?.includes("VIDEO") || formData.removedAssetRoles?.includes("CONTENT")) {
      payload.contentAssetId = null;
    } else if (videoUrl) {
      payload.videoUrl = videoUrl;
    }

    if (transcriptAssetId) {
      payload.transcriptAssetId = transcriptAssetId;
    } else if (formData.removedAssetRoles?.includes("TRANSCRIPT")) {
      payload.transcriptAssetId = null;
    }

    const existingList = Array.isArray(formData.existingAttachments) ? formData.existingAttachments : [];
    const remainingExistingIds = existingList
      .map((a: any) => a.assetId || a.id)
      .filter(Boolean);

    const removedIds = new Set(formData.removedAttachmentIds || []);
    let remainingAttachmentIds = remainingExistingIds.filter((id: string) => !removedIds.has(id));

    if (formData.removedSupportingMaterial && formData.supportingMaterialAssetId) {
      remainingAttachmentIds = remainingAttachmentIds.filter((id) => id !== formData.supportingMaterialAssetId);
    }

    const allNewAttachmentIds = [...attachmentIds];
    if (newSupportingMaterialAssetId) {
      allNewAttachmentIds.push(newSupportingMaterialAssetId);
    } else if (formData.supportingMaterialAssetId && !formData.removedSupportingMaterial && !removedIds.has(formData.supportingMaterialAssetId)) {
      allNewAttachmentIds.push(formData.supportingMaterialAssetId);
    }

    payload.attachmentIds = Array.from(new Set([...remainingAttachmentIds, ...allNewAttachmentIds]));

    return payload;
  };


  // ----------------------------------------------------------------------------

  const wizardConfig = useMemo(() => {
    // Build the exact steps relevant to this publish type
    const steps: CourseBuilderSection[] =
      publishType === "standalone-lesson"
        ? (formData.assessmentRequired ? ["info", "assessment", "review"] : ["info", "review"])
        : (formData.assessmentRequired ? ["info", "lessons", "assessment", "review"] : ["info", "lessons", "review"]);

    return ({
      steps,

      getStepTitle: (section: CourseBuilderSection) => {
        const map: Record<CourseBuilderSection, string> = {
          info: "Basic Information",
          lessons: "Lessons",
          assessment: "Assessment",
          review: "Review & Publish"
        };
        return map[section];
      },

      validateStep: (section: CourseBuilderSection): { valid: boolean; message?: string } => {
        switch (section) {
          case "info":
            if (!formData.visibility) {
              return { valid: false, message: "Visibility is required" };
            }
            if ((formData.visibility === "TENANT_ONLY" || formData.visibility === "Corporate") && (!formData.corporateTenant || formData.corporateTenant.length === 0)) {
              return { valid: false, message: "Please select at least one corporate tenant for Corporate visibility" };
            }
            if (publishType === "career-path" && !formData.careerPathTitle?.trim()) {
              return { valid: false, message: "Career Path Title is required" };
            }
            if (publishType === "standalone-course" && !formData.courseTitle?.trim()) {
              return { valid: false, message: "Course Title is required" };
            }
            if (publishType === "standalone-lesson") {
              const effectiveLessonType = formData.lessonType || (formData as any).learningType;
              if (!effectiveLessonType) {
                return { valid: false, message: "Lesson Type is required" };
              }
              if (!formData.lessonTitle?.trim() && !formData.courseTitle?.trim()) {
                return { valid: false, message: "Lesson Title is required" };
              }
              if (!formData.lessonDescription?.trim() && !formData.fullDescription?.trim()) {
                return { valid: false, message: "Lesson Description is required" };
              }
              // Primary content validation for standalone-lesson based on lessonType
              const hasExistingContent = Boolean(
                formData.primaryContentAssetUrl ||
                formData.primaryContentAssetName ||
                lessonToEdit?.content_asset_id ||
                lessonToEdit?.contentAsset ||
                lessonToEdit?.assets_storage_lessons_content_asset_idToassets_storage ||
                lessonToEdit?.lessonAssets?.some((a: any) => a.assetRole === "VIDEO" || a.assetRole === "CONTENT")
              );
              const removedContent = formData.removedAssetRoles?.includes("VIDEO") || formData.removedAssetRoles?.includes("CONTENT");

              const normalizedType = effectiveLessonType.toUpperCase();
              if (normalizedType === "VIDEO") {
                if (!formData.primaryContent && !formData.videoUrl && (!hasExistingContent || removedContent)) {
                  return { valid: false, message: "Video Upload or Video URL is required" };
                }
                const hasExistingTranscript = Boolean(
                  (formData as any).transcriptAssetUrl ||
                  (formData as any).transcriptAssetName ||
                  lessonToEdit?.transcript_asset_id ||
                  lessonToEdit?.transcriptAsset ||
                  lessonToEdit?.assets_storage_lessons_transcript_asset_idToassets_storage ||
                  lessonToEdit?.lessonAssets?.some((a: any) => a.assetRole === "TRANSCRIPT")
                );
                const removedTranscript = formData.removedAssetRoles?.includes("TRANSCRIPT");
                if (!formData.transcript && (!hasExistingTranscript || removedTranscript)) {
                  return { valid: false, message: "Subtitles (.srt or .vtt) are required for video lessons" };
                }
              } else if (normalizedType === "DOCUMENT" || normalizedType === "PDF") {
                if (!formData.primaryContent && (!hasExistingContent || removedContent)) {
                  return { valid: false, message: "Document Upload is required" };
                }
              } else if (normalizedType === "AUDIO") {
                if (!formData.primaryContent && (!hasExistingContent || removedContent)) {
                  return { valid: false, message: "Audio Upload is required" };
                }
              } else if (normalizedType === "IMAGE") {
                if (!formData.primaryContent && (!hasExistingContent || removedContent)) {
                  return { valid: false, message: "Image Upload is required" };
                }
              } else if (normalizedType === "TEXT" || normalizedType === "ARTICLE") {
                if (!formData.fullDescription?.trim() && !formData.lessonDescription?.trim()) {
                  return { valid: false, message: "Text content is required" };
                }
              }
              if (!formData.difficulty) {
                return { valid: false, message: "Difficulty is required" };
              }
            } else if (publishType === "standalone-course") {
              if (!formData.courseTitle?.trim()) {
                return { valid: false, message: "Course Title is required" };
              }
              if (!formData.fullDescription?.trim() && !formData.shortDescription?.trim()) {
                return { valid: false, message: "Full description is required" };
              }
              if (!formData.difficulty) {
                return { valid: false, message: "Difficulty is required" };
              }
              if (!formData.priceTier) {
                return { valid: false, message: "Price / Access Tier is required" };
              }
              const hasExistingCourseThumb = formData.courseThumbnailAssetUrl || (courseToEdit && !formData.removedAssetRoles?.includes("COURSE_THUMBNAIL"));
              if (!formData.coursethumbnail && !formData.thumbnail && !hasExistingCourseThumb) {
                return { valid: false, message: "Course Thumbnail is required" };
              }
            } else if (publishType === "career-path") {
              const hasExistingCoverImage = formData.coverImageAssetUrl || (pathToEdit && !formData.removedAssetRoles?.includes("COVER_IMAGE"));
              if (!formData.coverImage && !hasExistingCoverImage) {
                return { valid: false, message: "Cover Image is required" };
              }
              if (!formData.description?.trim()) {
                return { valid: false, message: "Description is required" };
              }
              if (!formData.fullDescription?.trim()) {
                return { valid: false, message: "Full description is required" };
              }
              if (!formData.difficulty) {
                return { valid: false, message: "Difficulty is required" };
              }
            }
            if (!formData.subjectId) {
              return { valid: false, message: "Domain is required" };
            }
            if (!formData.language) {
              return { valid: false, message: "Language is required" };
            }
            return { valid: true };

          case "lessons":
            if (publishType === "career-path" && (!formData.existingCourseIds || formData.existingCourseIds.length === 0) && !formData.courseTitle?.trim()) {
              return { valid: false, message: "Please add at least one course to the career path" };
            }
            if (publishType === "standalone-course" && effectiveLessons.length === 0) {
              return { valid: false, message: "Please add at least one lesson to the course" };
            }
            return { valid: true };

          case "assessment":
            if (formData.assessmentRequired || assessmentQuestions.length > 0) {
              if (formData.assessmentRequired && assessmentQuestions.length === 0) {
                return { valid: false, message: "Add at least one assessment question since assessment is required" };
              }
              if (assessmentSettings.timeLimit === "" || assessmentSettings.timeLimit === undefined || Number(assessmentSettings.timeLimit) <= 0) {
                return { valid: false, message: "Time Limit is required for the assessment" };
              }
              if (assessmentSettings.attemptCount === "" || assessmentSettings.attemptCount === undefined || Number(assessmentSettings.attemptCount) <= 0) {
                return { valid: false, message: "Attempt Count is required for the assessment" };
              }
              if (assessmentSettings.passingScore === "" || assessmentSettings.passingScore === undefined || Number(assessmentSettings.passingScore) < 0 || Number(assessmentSettings.passingScore) > 100) {
                return { valid: false, message: "Passing score must be between 0 and 100" };
              }
            }
            return { valid: true };

          default:
            return { valid: true };
        }
      }
    });
  }, [publishType, formData, courseLessons, effectiveLessons, assessmentQuestions, assessmentSettings]);

  const handleNext = async () => {
    // 1. Info Step
    if (activeSection === "info") {
      const validation = wizardConfig.validateStep("info");
      if (!validation.valid) {
        notification.warning({
          title: "Validation Error",
          description: validation.message,
        });
        return;
      }

      setIsSubmitting(true);
      try {
        if (publishType === "standalone-lesson") {
          const resLessonId = await submitStandaloneLesson();
          if (!resLessonId) {
            return;
          }
          setCreatedLessonId(resLessonId);
          const returnToCourseId = (location.state as any)?.returnToCourseId || (location.state as any)?.courseId || searchParams.get("courseId");
          if (returnToCourseId) {
            try {
              await createCourseLessonApi(returnToCourseId, {
                lessonId: resLessonId,
                title: formData.lessonTitle || "Lesson",
              });
            } catch (err) {
              console.error("Failed to map lesson to course:", err);
            }
            queryClient.invalidateQueries({ queryKey: ["course-lessons", returnToCourseId] });
            queryClient.invalidateQueries({ queryKey: ["course-lessons"] });
            queryClient.invalidateQueries({ queryKey: ["admin-course", returnToCourseId] });
            queryClient.invalidateQueries({ queryKey: ["admin-course"] });
            queryClient.invalidateQueries({ queryKey: ["courses"] });

            setCreatedLessonId(null);
            hydratedLessonIdRef.current = null;
            setFormData(getInitialCourseFormData());

            notification.success({ title: "Lesson saved and added to course successfully!" });
            navigate(`/studio/builder/2?type=course&courseId=${returnToCourseId}`, {
              state: { courseId: returnToCourseId }
            });
            return;
          }
          const nextSec = formData.assessmentRequired ? "assessment" : "review";
          const stepNum = formData.assessmentRequired ? 2 : 3;
          setActiveSection(nextSec);
          navigate(`/studio/builder/${stepNum}?type=lesson&lessonId=${resLessonId}`, {
            state: { lessonId: resLessonId, publishType: "standalone-lesson" }
          });
          return;
        } else if (publishType === "standalone-course") {
          const resCourseId = await submitStandaloneCourse();
          if (!resCourseId) return;
          setCreatedCourseId(resCourseId);
          setActiveSection("lessons");
          navigate(`/studio/builder/2?type=course&courseId=${resCourseId}`, {
            state: { courseId: resCourseId }
          });
          return;
        } else if (publishType === "career-path") {
          const resPathId = await submitCareerPath();
          if (!resPathId) return;
          setCreatedCareerPathId(resPathId);
          setActiveSection("lessons");
          navigate(`/studio/builder/2?type=path&pathId=${resPathId}`, {
            state: { pathId: resPathId }
          });
          return;
        }
      } catch (err: any) {
        console.error("Step 1 Save Error:", err);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // ================= LESSONS =================
    if (activeSection === "lessons") {
      const validation = wizardConfig.validateStep("lessons");
      if (!validation.valid) {
        notification.warning({
          title: "Validation Error",
          description: validation.message,
        });
        return;
      }
      const isAssessment = formData.assessmentRequired !== false;
      const nextSection = isAssessment ? "assessment" : "review";
      const stepNum = isAssessment ? 3 : 4;
      const typeSlug = publishType === "career-path" ? "path" : "course";
      const idParam = publishType === "career-path"
        ? (createdCareerPathId ? `&pathId=${createdCareerPathId}` : "")
        : (createdCourseId ? `&courseId=${createdCourseId}` : "");
      setActiveSection(nextSection);
      navigate(`/studio/builder/${stepNum}?type=${typeSlug}${idParam}`, {
        state: { courseId: createdCourseId, pathId: createdCareerPathId }
      });
      return;
    }

    // ================= ASSESSMENT =================
    if (activeSection === "assessment") {
      const validation = wizardConfig.validateStep("assessment");
      if (!validation.valid) {
        notification.warning({
          title: "Validation Error",
          description: validation.message,
        });
        return;
      }
      if (assessmentQuestions.length > 0) {
        const isSilent = isQuizSavedRef.current;
        await handleAssessmentNext(undefined, isSilent);
      }
      setActiveSection("review");
      const stepNum = publishType === "standalone-lesson" ? 3 : 4;
      const typeSlug = publishType === "standalone-lesson" ? "lesson" : publishType === "career-path" ? "path" : "course";
      const returnToCourseId = (location.state as any)?.returnToCourseId || (location.state as any)?.courseId || searchParams.get("courseId");
      const courseQuery = returnToCourseId ? `&courseId=${returnToCourseId}` : "";
      const idParam = publishType === "standalone-lesson"
        ? (createdLessonId ? `&lessonId=${createdLessonId}` : "")
        : publishType === "career-path"
          ? (createdCareerPathId ? `&pathId=${createdCareerPathId}` : "")
          : (createdCourseId ? `&courseId=${createdCourseId}` : "");
      navigate(`/studio/builder/${stepNum}?type=${typeSlug}${idParam}${courseQuery}`, {
        state: { lessonId: createdLessonId, courseId: createdCourseId || returnToCourseId, pathId: createdCareerPathId, returnToCourseId }
      });
      return;
    }

    // ================= REVIEW =================
    if (activeSection === "review") {
      await handleFinalSubmit();
      return;
    }
  };

  const handleStepClick = async (targetSection: CourseBuilderSection) => {
    const steps: CourseBuilderSection[] = ["info", "lessons", "assessment", "review"];
    const currentIndex = steps.indexOf(activeSection);
    const targetIndex = steps.indexOf(targetSection);

    // Block forward navigation from "info" if the entity hasn't been saved yet
    // (applies to all publish types: lesson, course, career-path).
    const notSavedYet =
      (publishType === "standalone-lesson" && !createdLessonId) ||
      (publishType === "standalone-course" && !createdCourseId) ||
      (publishType === "career-path" && !createdCareerPathId);

    if (targetIndex > currentIndex && activeSection === "info" && notSavedYet) {
      notification.warning({
        message: "Save required",
        description: "Please save the info first before moving to the next step.",
      });
      // Do NOT auto-save — user must explicitly click Next or Save
      return;
    }

    if (targetIndex > currentIndex) {
      for (let i = currentIndex; i < targetIndex; i++) {
        const stepToValidate = steps[i];
        const validation = wizardConfig.validateStep(stepToValidate);
        if (!validation.valid) {
          notification.warning({
            title: "Validation Error",
            description: validation.message || `Please complete the ${wizardConfig.getStepTitle(stepToValidate)} step first.`,
          });
          return;
        }
      }
    }

    setActiveSection(targetSection);
    const stepNum = targetSection === "info"
      ? 1
      : targetSection === "lessons"
        ? 2
        : targetSection === "assessment"
          ? 3
          : 4;
    const typeSlug = publishType === "standalone-lesson" ? "lesson" : publishType === "career-path" ? "path" : "course";
    const idParam = publishType === "standalone-lesson"
      ? (createdLessonId ? `&lessonId=${createdLessonId}` : "")
      : publishType === "career-path"
        ? (createdCareerPathId ? `&pathId=${createdCareerPathId}` : "")
        : (createdCourseId ? `&courseId=${createdCourseId}` : "");
    navigate(`/studio/builder/${stepNum}?type=${typeSlug}${idParam}`, {
      state: { lessonId: createdLessonId, courseId: createdCourseId, pathId: createdCareerPathId }
    });
  };


  const handleSaveDraft = async () => {
    const validation = wizardConfig.validateStep(activeSection);
    if (!validation.valid) {
      notification.warning({ title: "Validation Error", description: validation.message });
      return;
    }

    setIsDraftSaving(true);
    try {
      let currentCourseId: string | undefined = createdCourseId || undefined;
      let currentCareerPathId: string | undefined = createdCareerPathId || undefined;
      let currentLessonId: string | undefined = createdLessonId || undefined;

      // Save base entity
      if (publishType === "career-path") {
        currentCareerPathId = await submitCareerPath();
        if (currentCareerPathId && !resolvedPathId) {
          navigate(`/studio/builder/1?type=path&pathId=${currentCareerPathId}`, { replace: true, state: { pathId: currentCareerPathId } });
        }
        if (assessmentQuestions && assessmentQuestions.length > 0) {
          await handleAssessmentNext(currentCareerPathId, true);
        }
      } else if (publishType === "standalone-course") {
        currentCourseId = await submitStandaloneCourse();
        if (currentCourseId && !resolvedCourseId) {
          navigate(`/studio/builder/1?type=course&courseId=${currentCourseId}`, { replace: true, state: { courseId: currentCourseId } });
        }
        if (assessmentQuestions && assessmentQuestions.length > 0) {
          await handleAssessmentNext(currentCourseId, true);
        }
      } else if (publishType === "standalone-lesson") {
        currentLessonId = await submitStandaloneLesson();
        if (currentLessonId) {
          const returnToCourseId = (location.state as any)?.returnToCourseId || (location.state as any)?.courseId || searchParams.get("courseId");
          if (returnToCourseId && !explicitLessonId) {
            try {
              await createCourseLessonApi(returnToCourseId, {
                lessonId: currentLessonId,
                title: formData.lessonTitle || "Lesson",
              });
              queryClient.invalidateQueries({ queryKey: ["course-lessons", returnToCourseId] });
            } catch (err) {
              console.error("Failed to map draft lesson to course:", err);
            }
          }
        }
        if (currentLessonId && !resolvedLessonId) {
          navigate(`/studio/builder/1?type=lesson&lessonId=${currentLessonId}`, { replace: true, state: { lessonId: currentLessonId } });
        }
        if (assessmentQuestions && assessmentQuestions.length > 0) {
          await handleAssessmentNext(currentLessonId, true);
          // No separate notification here — "Draft saved successfully" below covers this
        }
      }

      notification.success({ title: "Draft saved successfully" });
      console.log("Draft saved successfully");

    } catch (error) {
      console.error("SAVE DRAFT ERROR", error);
      notification.error({ title: "Draft save failed" });
    } finally {
      setIsDraftSaving(false);
    }
  };

  const handleDiscardDraft = async () => {
    const hasSaved = createdCareerPathId || createdCourseId || createdLessonId;
    if (!hasSaved) {
      navigate(-1);
      return;
    }

    Modal.confirm({
      title: "Discard draft?",
      content: "Are you sure you want to discard this draft? This will permanently delete this draft from the database.",
      okText: "Discard",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          setIsDraftSaving(true);
          if (publishType === "career-path" && createdCareerPathId) {
            await deleteCareerPathApi(createdCareerPathId);
          } else if (publishType === "standalone-course" && createdCourseId) {
            await courseApi.delete(createdCourseId);
          } else if (publishType === "standalone-lesson" && createdLessonId) {
            await deleteLessonApi(createdLessonId);
          }
          notification.success({ title: "Draft discarded and deleted successfully" });
          navigate(-1);
        } catch (err: any) {
          console.error(err);
          notification.error({ title: "Failed to discard draft", description: err.message });
        } finally {
          setIsDraftSaving(false);
        }
      }
    });
  };

  const handleFinalSubmit = async () => {
    // Validate all steps before final submission
    for (const step of wizardConfig.steps) {
      // Skip assessment validation when it was not enabled
      if (step === "assessment" && !formData.assessmentRequired) continue;
      const validation = wizardConfig.validateStep(step);
      if (!validation.valid) {
        notification.warning({
          title: "Validation Error",
          description: validation.message || `Please complete the ${wizardConfig.getStepTitle(step)} step.`,
        });
        setActiveSection(step); // Navigate user to the invalid step
        return;
      }
    }

    console.log("=== HANDLE SUBMIT TRIGGERED ===");
    console.log("Current Publish Type:", publishType);

    setIsSubmitting(true);

    try {
      switch (publishType) {
        case "career-path":
          console.log("→ Going to Career Path");
          await submitCareerPath();
          break;

        case "standalone-course":
          console.log("→ Going to Standalone Course");
          await submitStandaloneCourse();
          break;

        case "standalone-lesson":
          console.log("→ Going to Standalone Lesson");
          await submitStandaloneLesson();
          break;

        default:
          console.log("Invalid publish type");
          break;
      }
    } catch (error) {
      console.error("Error in handleSubmit:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Preview Navigation
  const handlePreview = () => {
    let targetType = "course";
    let targetId = createdCourseId || courseId;

    if (publishType === "career-path") {
      targetType = "career-path";
      targetId = createdCareerPathId || pathId;
    } else if (publishType === "standalone-lesson") {
      targetType = "lesson";
      targetId = createdLessonId || lessonId;
    }

    if (targetId) {
      navigate(`/content-developer/course-preview/${targetType}/${targetId}`);
    } else {
      notification.warning({
        title: "Not saved yet",
        description: "Please save as a draft before previewing.",
      });
    }
  };

  const handleUpdateLesson = (updatedLesson: any) => {
    setCourseLessons((prev) =>
      prev.map((l) => (l.id === updatedLesson.id ? updatedLesson : l))
    );
  };

  const handleMapExistingLessons = (newLessons: any[], targetCourseId?: string) => {
    if (targetCourseId) {
      queryClient.invalidateQueries({ queryKey: ["course-lessons", targetCourseId] });
    } else {
      setCourseLessons((prev) => {
        const existingIds = new Set(prev.map(l => l.id));
        const filteredNew = newLessons.filter(l => !existingIds.has(l.id));
        return [...prev, ...filteredNew];
      });
    }
  };

  const isEditLoading = (courseId && isLoadingCourse) || (lessonId && isLoadingLesson) || (pathId && isLoadingPath);

  if (isEditLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Spin size="large" />
          <p className="text-gray-500 font-medium">Loading {publishType.replace('-', ' ')} details...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="w-full relative">
        {(isSubmitting || savingAssessment || isDraftSaving) && (
          <div className="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
            <Spin size="large" />
            <h2 className="mt-4 text-white text-xl font-semibold">
              {savingStatusMessage || "Saving Data..."}
            </h2>
            <p className="mt-1 text-sm text-gray-200">Please wait while your details and media are being saved...</p>
          </div>
        )}
        <CourseBuilderStepRenderer
          isChildLesson={Boolean(publishType === "standalone-lesson" && returnToCourseId)}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          publishType={publishType}
          setPublishType={setPublishType}
          formData={formData}
          setFormData={setFormData}
          updateForm={updateForm}
          lessonRef={lessonRef}
          // Pass remaining props (subjects, categories, handlers, etc.)
          visibilities={visibilities}
          tenants={tenants}
          subjects={subjects}
          subcategories={subcategories}
          categories={categories}
          difficultyLevels={difficultyLevels}
          lessonTypes={lessonTypes}
          lessonStatuses={lessonStatuses}
          languages={languages}
          loading={loading}
          categoryLoading={categoryLoading}
          skillInput={skillInput}
          setSkillInput={setSkillInput}
          filteredSkills={filteredSkills}
          tagInput={tagInput}
          setTagInput={setTagInput}
          filteredTags={filteredTags}
          newSubjectName={newSubjectName}
          setNewSubjectName={setNewSubjectName}
          newCategoryName={newCategoryName}
          setNewCategoryName={setNewCategoryName}
          createSubject={createSubject}
          createCategory={createCategory}
          createSubcategory={createSubcategory}
          courseLessons={courseLessons}
          createdCourseId={createdCourseId}
          createdLessonId={createdLessonId}
          createdCareerPathId={createdCareerPathId}
          handleAddLesson={handleAddLesson}
          handleEditLesson={handleEditLesson}
          handleDeleteLesson={handleDeleteLesson}
          assessmentQuestions={assessmentQuestions}
          setAssessmentQuestions={setAssessmentQuestions}
          assessmentSettings={assessmentSettings}
          setAssessmentSettings={setAssessmentSettings}
          handleSubmit={handleFinalSubmit}
          onNext={handleNext}
          onSaveDraft={handleSaveDraft}
          isSavingAssessment={savingAssessment || isSubmitting}
          onUpdateLesson={handleUpdateLesson}
          onMapExistingLessons={handleMapExistingLessons}
          careerPaths={Array.isArray((data as any)?.data) ? (data as any).data : (Array.isArray(data) ? data : [])}
        />
      </div>
    </ErrorBoundary>
  );
};

export default CreateCourse;
