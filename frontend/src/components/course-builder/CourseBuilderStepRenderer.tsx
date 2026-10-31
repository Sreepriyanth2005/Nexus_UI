// src/components/course-builder/CourseBuilderStepRenderer.tsx
import React from "react";
import Select from "react-select";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  BookOpen,
  Plus,
  Image as ImageIcon,
  FileText,
  ArrowUp,
  ArrowDown,
  Trash2,
  X,
  CheckCircle2,
} from "lucide-react";
import ContentDeveloperStandardLesson, {
  LessonFormData,
  ContentDeveloperStandardLessonRef,
  LessonContent,
  LessonContentBlock,
} from "../../pages/ContentDeveloper/ContentDeveloperStandardLesson";
import StandaloneCourse from "../../pages/SuperAdmin/StandaloneCourse";
import CourseBuilderLessons from "../../pages/SuperAdmin/CourseBuilderLessons";
import CourseBuilderAssessment from "../../pages/SuperAdmin/CourseBuilderAssessment";
import CourseBuilderReview from "../../pages/SuperAdmin/CourseBuilderReview";
import ContentDeveloperStandardCourse from "../../pages/SuperAdmin/StandaloneCourse";
import { CreateCourseFormData } from "../../pages/SuperAdmin/CreateCourse";
import { useCourses } from "../../hooks/course/useCourses";
import { useAssets } from "../../hooks/asset/useAssets";

import { useNavigate } from "react-router";
import { notification } from "antd";
import { detectMediaDuration, formatDurationToMinutes, getDisplayFileName } from "../../utils/mediaDuration";

export type PublishType = "career-path" | "standalone-course" | "standalone-lesson";

interface CourseBuilderStepRendererProps {
  activeSection: "info" | "lessons" | "assessment" | "review";
  setActiveSection: React.Dispatch<React.SetStateAction<"info" | "lessons" | "assessment" | "review">>;
  publishType: PublishType;
  setPublishType: (type: PublishType) => void;
  formData: CreateCourseFormData;
  setFormData: React.Dispatch<React.SetStateAction<CreateCourseFormData>>;
  updateForm: (updates: Partial<CreateCourseFormData>) => void;
  lessonRef: React.RefObject<ContentDeveloperStandardLessonRef | null>;
  visibilities: any[];
  tenants: any[];
  subjects: any[];
  subcategories: any[];
  categories: any[];
  difficultyLevels: any[];
  lessonTypes: any[];
  lessonStatuses: any[];
  languages: any[];
  loading: boolean;
  categoryLoading: boolean;
  skillInput: string;
  setSkillInput: (value: string) => void;
  filteredSkills: any[];
  tagInput: string;
  setTagInput: (value: string) => void;
  filteredTags: any[];
  newSubjectName: string;
  setNewSubjectName: (value: string) => void;
  newCategoryName: string;
  setNewCategoryName: (value: string) => void;
  createSubject: any;
  createCategory: any;
  createSubcategory?: any;
  courseLessons: any[];
  createdCourseId: string | null;
  createdLessonId: string | null;
  createdCareerPathId: string | null;
  handleAddLesson: (lessonType: string, courseId?: string) => void;
  handleEditLesson: (lesson: any, courseId?: string) => void;
  handleDeleteLesson: (lessonId: string) => void;
  assessmentQuestions: any[];
  setAssessmentQuestions: React.Dispatch<React.SetStateAction<any[]>>;
  assessmentSettings: any;
  setAssessmentSettings: React.Dispatch<React.SetStateAction<any>>;
  handleSubmit: () => void;
  onNext?: () => void;
  onSaveDraft?: () => void;
  isSavingAssessment?: boolean;
  onUpdateLesson?: (updatedLesson: any) => void;
  onMapExistingLessons?: (lessons: any[], courseId?: string) => void;
  careerPaths?: any[];
  isChildLesson?: boolean;
}

const CourseBuilderStepRenderer: React.FC<CourseBuilderStepRendererProps> = (props) => {
  const {
    activeSection, setActiveSection, publishType, setPublishType, formData, setFormData, updateForm,
    lessonRef, visibilities, tenants, subjects, subcategories, categories, difficultyLevels, lessonTypes,
    lessonStatuses, languages, loading, categoryLoading, skillInput, setSkillInput,
    filteredSkills, tagInput, setTagInput, filteredTags, newSubjectName,
    setNewSubjectName, newCategoryName, setNewCategoryName, createSubject,
    createCategory, createSubcategory, courseLessons, createdCourseId, createdLessonId, createdCareerPathId,
    handleAddLesson, handleEditLesson, handleDeleteLesson, assessmentQuestions,
    setAssessmentQuestions, assessmentSettings, setAssessmentSettings, handleSubmit,
    onNext,
    onSaveDraft,
    isSavingAssessment,
    onUpdateLesson,
    onMapExistingLessons,
    careerPaths,
    isChildLesson = false,
  } = props;

  const navigate = useNavigate();

  const selectedThumbnailFile = publishType === "standalone-lesson"
    ? formData.thumbnail
    : publishType === "career-path"
      ? formData.coverImage
      : (formData.coursethumbnail || formData.thumbnail);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = React.useState("");

  React.useEffect(() => {
    const rawFile = selectedThumbnailFile as any;
    if (!rawFile || !(rawFile instanceof Blob)) {
      if (typeof rawFile === "string" && rawFile.startsWith("http")) {
        setThumbnailPreviewUrl(rawFile);
      } else {
        setThumbnailPreviewUrl("");
      }
      return;
    }

    try {
      const objectUrl = URL.createObjectURL(rawFile);
      setThumbnailPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } catch {
      setThumbnailPreviewUrl("");
    }
  }, [selectedThumbnailFile]);

  // Creation dialog states
  const [showDomainModal, setShowDomainModal] = React.useState(false);
  const [domainNameInput, setDomainNameInput] = React.useState("");
  const [isSubmittingDomain, setIsSubmittingDomain] = React.useState(false);

  const [showCategoryModal, setShowCategoryModal] = React.useState(false);
  const [categoryNameInput, setCategoryNameInput] = React.useState("");
  const [isSubmittingCategory, setIsSubmittingCategory] = React.useState(false);

  const [showSubcategoryModal, setShowSubcategoryModal] = React.useState(false);
  const [subcategoryNameInput, setSubcategoryNameInput] = React.useState("");
  const [isSubmittingSubcategory, setIsSubmittingSubcategory] = React.useState(false);

  const [isCalculatingDuration, setIsCalculatingDuration] = React.useState(false);
  const durationDebounceTimerRef = React.useRef<any>(null);

  const calculateAndApplyDuration = React.useCallback(async (urlOrFile: string | File) => {
    if (!urlOrFile) return;
    try {
      setIsCalculatingDuration(true);
      const durSecs = await detectMediaDuration(urlOrFile);
      if (durSecs && durSecs > 0) {
        const mins = formatDurationToMinutes(durSecs);
        setFormData((prev: any) => ({
          ...prev,
          duration: mins.toString(),
          lessonDuration: mins,
        }));
        if (typeof updateForm === "function") {
          updateForm({
            duration: mins.toString(),
            lessonDuration: mins,
          } as any);
        }
        notification.info({
          message: "Duration Detected",
          description: `Automatically calculated duration: ${mins} minute${mins > 1 ? "s" : ""}`,
          duration: 3,
        });
      }
    } catch (err) {
      console.warn("Failed to auto-detect media duration", err);
    } finally {
      setIsCalculatingDuration(false);
    }
  }, [setFormData, updateForm]);

  const handleMediaUrlChange = React.useCallback((val: string) => {
    setFormData((prev: any) => ({
      ...prev,
      videoUrl: val,
      assetSource: "EXTERNAL_LINK",
    }));

    if (durationDebounceTimerRef.current) {
      clearTimeout(durationDebounceTimerRef.current);
      durationDebounceTimerRef.current = null;
    }

    const trimmed = (val || "").trim();
    if (trimmed.length > 5) {
      durationDebounceTimerRef.current = setTimeout(() => {
        calculateAndApplyDuration(trimmed);
      }, 400);
    }
  }, [setFormData, calculateAndApplyDuration]);

  // Automatically calculate real duration from video URL if present on load or if duration is missing/default 20
  React.useEffect(() => {
    if (
      formData.videoUrl &&
      (!formData.duration || formData.duration === "0" || formData.duration === "20")
    ) {
      calculateAndApplyDuration(formData.videoUrl);
    }
  }, [formData.videoUrl, formData.duration, calculateAndApplyDuration]);

  const handleCreateDomain = async () => {
    if (!domainNameInput.trim() || !createSubject) return;
    setIsSubmittingDomain(true);
    try {
      const created: any = await createSubject({ name: domainNameInput.trim() });
      const newId = created?.id || created?.data?.id || (created as any)?.data?.data?.id || (created as any)?.subject?.id;
      if (newId) {
        setFormData((prev: any) => ({ ...prev, subjectId: newId }));
      }
      notification.success({
        message: "Domain Created",
        description: `Domain "${domainNameInput.trim()}" created successfully.`,
      });
      setDomainNameInput("");
      setShowDomainModal(false);
    } catch (err: any) {
      console.error("Failed to create domain:", err);
      notification.error({
        message: "Failed to Create Domain",
        description: err?.response?.data?.message || err?.message || "Please check domain name and try again.",
      });
    } finally {
      setIsSubmittingDomain(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!categoryNameInput.trim() || !createCategory) return;
    setIsSubmittingCategory(true);
    try {
      const created: any = await createCategory({ name: categoryNameInput.trim() });
      const newId = created?.id || created?.data?.id || (created as any)?.data?.data?.id || (created as any)?.category?.id;
      if (newId) {
        setFormData((prev: any) => ({ ...prev, categoryId: newId }));
      }
      notification.success({
        message: "Category Created",
        description: `Category "${categoryNameInput.trim()}" created successfully.`,
      });
      setCategoryNameInput("");
      setShowCategoryModal(false);
    } catch (err: any) {
      console.error("Failed to create category:", err);
      notification.error({
        message: "Failed to Create Category",
        description: err?.response?.data?.message || err?.message || "Please check category name and try again.",
      });
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  const handleCreateSubcategory = async () => {
    if (!subcategoryNameInput.trim() || !createSubcategory || !formData.categoryId) return;
    setIsSubmittingSubcategory(true);
    try {
      const created: any = await createSubcategory({
        categoryId: formData.categoryId,
        payload: { name: subcategoryNameInput.trim() },
      });
      const newId = created?.id || created?.data?.id || (created as any)?.data?.data?.id || (created as any)?.subcategory?.id;
      if (newId) {
        setFormData((prev: any) => ({ ...prev, subcategoryId: newId }));
      }
      notification.success({
        message: "Subcategory Created",
        description: `Subcategory "${subcategoryNameInput.trim()}" created successfully.`,
      });
      setSubcategoryNameInput("");
      setShowSubcategoryModal(false);
    } catch (err: any) {
      console.error("Failed to create subject/subcategory:", err);
      notification.error({
        message: "Failed to Create Subcategory",
        description: err?.response?.data?.message || err?.message || "Please check subcategory name and try again.",
      });
    } finally {
      setIsSubmittingSubcategory(false);
    }
  };

  const totalSteps = publishType === "standalone-lesson"
    ? (formData.assessmentRequired ? 3 : 2)
    : (formData.assessmentRequired ? 4 : 3);

  const getStepNumber = (section: "info" | "lessons" | "assessment" | "review") => {
    if (publishType === "standalone-lesson") {
      if (section === "info") return 1;
      if (section === "assessment") return 2;
      if (section === "review") return formData.assessmentRequired ? 3 : 2;
      return 1;
    }
    if (section === "info") return 1;
    if (section === "lessons") return 2;
    if (section === "assessment") return 3;
    if (section === "review") return formData.assessmentRequired ? 4 : 3;
    return 1;
  };

  const goToStep = (section: "info" | "lessons" | "assessment" | "review") => {
    setActiveSection(section);
    const stepNum = getStepNumber(section);
    const currentType = publishType === "standalone-lesson" ? "lesson" : publishType === "career-path" ? "path" : "course";
    const activeId = createdLessonId || createdCourseId || createdCareerPathId;
    const idQuery = publishType === "standalone-lesson" && activeId
      ? `&lessonId=${activeId}`
      : publishType === "standalone-course" && activeId
        ? `&courseId=${activeId}`
        : publishType === "career-path" && activeId
          ? `&pathId=${activeId}`
          : "";
    navigate(`/studio/builder/${stepNum}?type=${currentType}${idQuery}`, {
      state: {
        lessonId: createdLessonId,
        courseId: createdCourseId,
        pathId: createdCareerPathId,
        publishType,
      }
    });
  };

  /**
   * Guarded version of goToStep used by stepper tab clicks.
   * Forward navigation away from the "info" step is only allowed after
   * the entity has been saved (createdLessonId / createdCourseId /
   * createdCareerPathId is set). If not saved yet, show a warning and
   * trigger onNext() which performs the save + navigation.
   */
  const goToStepGuarded = (target: "info" | "lessons" | "assessment" | "review") => {
    const steps = ["info", "lessons", "assessment", "review"];
    const currentIdx = steps.indexOf(activeSection);
    const targetIdx = steps.indexOf(target);
    const isForward = targetIdx > currentIdx;

    const notSavedYet =
      (publishType === "standalone-lesson" && !createdLessonId) ||
      (publishType === "standalone-course" && !createdCourseId) ||
      (publishType === "career-path" && !createdCareerPathId);

    if (isForward && activeSection === "info" && notSavedYet) {
      notification.warning({
        message: "Save required",
        description: "Please save the info first before moving to the next step.",
      });
      return;
    }

    goToStep(target);
  };

  const availableLessonTypes = (Array.isArray(lessonTypes) && lessonTypes.length > 0)
    ? lessonTypes
    : ["VIDEO", "DOCUMENT", "AUDIO", "TEXT", "ARTICLE", "PDF"];

  const availableDifficultyLevels = (Array.isArray(difficultyLevels) && difficultyLevels.length > 0)
    ? difficultyLevels
    : ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

  const availableSubjects: any[] = React.useMemo(() => {
    if (Array.isArray(subjects) && subjects.length > 0) return subjects;
    if (Array.isArray((subjects as any)?.data)) return (subjects as any).data;
    if (Array.isArray((subjects as any)?.items)) return (subjects as any).items;
    return [];
  }, [subjects]);

  const tenantOptions = React.useMemo(
    () => tenants?.map((t: any) => ({ label: t.name, value: t.id })) || [],
    [tenants]
  );

  const { courses: coursesQuery } = useCourses({ limit: 100, isStandalone: "all", status: "PUBLISHED" } as any);
  const coursesResponse = coursesQuery.data;
  const coursesLoading = coursesQuery.isLoading;
  const coursesResAny = coursesResponse as any;
  const availableCourses = Array.isArray(coursesResAny?.data?.data)
    ? coursesResAny.data.data
    : (Array.isArray(coursesResAny?.data) ? coursesResAny.data : (Array.isArray(coursesResAny) ? coursesResAny : []));
  const { getAllAssets } = useAssets();
  const [courseAssetsMap, setCourseAssetsMap] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (availableCourses.length > 0) {
      const courseIds = availableCourses.map((c: any) => c.id).join(",");
      getAllAssets({ courseIds }).then((assets: any[]) => {
        const map: Record<string, string> = {};
        assets.forEach((a) => {
          if (a.assetType === "IMAGE" && (a.storagePath === "thumbnails" || a.assetContext === "COURSE_THUMBNAIL" || a.assetContext === "COURSE")) {
            if (a.courseId) map[a.courseId] = a.url;
          }
        });
        setCourseAssetsMap(map);
      }).catch(console.error);
    }
  }, [availableCourses, getAllAssets]);

  const courseOptions = availableCourses
    .filter((c: any) => c.status === "PUBLISHED")
    .map((c: any) => ({
      value: c.id,
      label: c.title,
      image: courseAssetsMap[c.id] || c.courseAssets?.find((a: any) => a.assetRole === "THUMBNAIL")?.asset?.url || c.thumbnailUrl || c.coverImageUrl || "",
    }));

  const finalCourseOptions = [...(formData.constituentCourses?.map((c: any) => ({
    value: c.id || c.courseId,
    label: c.title || "Untitled Course",
    image: "", // May not have image in constituentCourses
  })) || [])];

  courseOptions.forEach((co: any) => {
    if (!finalCourseOptions.find((fco: any) => fco.value === co.value)) {
      finalCourseOptions.push(co);
    }
  });

  // ==================== STUDY CONTENT STATE & HANDLERS ====================
  const [showStudyContentModal, setShowStudyContentModal] = React.useState(false);
  const [studyBlocks, setStudyBlocks] = React.useState<any[]>([]);

  React.useEffect(() => {
    const existing = formData.lessonContents?.[0]?.blocks || [];
    if (existing.length > 0) {
      setStudyBlocks(existing.map((b: any, idx: number) => ({
        id: b.id || crypto.randomUUID(),
        blockType: b.blockType || (b.type === "IMAGE" ? "IMAGE" : "PARAGRAPH"),
        title: b.title || b.heading || "",
        textContent: b.textContent || b.content || "",
        file: b.file,
        previewUrl: b.previewUrl || b.assetUrl || b.asset?.signedUrl || b.asset?.url,
        assetId: b.assetId,
        assetUrl: b.assetUrl || b.asset?.signedUrl || b.asset?.url,
        metadata: b.metadata || (b.caption ? { caption: b.caption } : {}),
        displayOrder: b.displayOrder || idx + 1,
      })));
    } else {
      setStudyBlocks([]);
    }
  }, [formData.lessonContents]);

  const addStudyTextBlock = () => {
    setStudyBlocks((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        blockType: "PARAGRAPH",
        title: "",
        textContent: "",
        displayOrder: prev.length + 1,
      },
    ]);
  };

  const addStudyImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const newImageBlocks = files.map((file, i) => ({
      id: crypto.randomUUID(),
      blockType: "IMAGE",
      file,
      previewUrl: URL.createObjectURL(file),
      metadata: { caption: "" },
      displayOrder: studyBlocks.length + i + 1,
    }));
    setStudyBlocks((prev) => [...prev, ...newImageBlocks]);
    e.target.value = "";
  };

  const insertStudyTextBlockAfter = (targetBlockId: string) => {
    setStudyBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === targetBlockId);
      if (idx === -1) return prev;
      const newBlock = {
        id: crypto.randomUUID(),
        blockType: "PARAGRAPH",
        title: "",
        textContent: "",
        displayOrder: idx + 2,
      };
      const copy = [...prev];
      copy.splice(idx + 1, 0, newBlock);
      return copy.map((b, i) => ({ ...b, displayOrder: i + 1 }));
    });
  };

  const insertStudyImagesAfter = (e: React.ChangeEvent<HTMLInputElement>, targetBlockId: string) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setStudyBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === targetBlockId);
      if (idx === -1) return prev;
      const newBlocks = files.map((file, i) => ({
        id: crypto.randomUUID(),
        blockType: "IMAGE",
        file,
        previewUrl: URL.createObjectURL(file),
        metadata: { caption: "" },
        displayOrder: idx + i + 2,
      }));
      const copy = [...prev];
      copy.splice(idx + 1, 0, ...newBlocks);
      return copy.map((b, i) => ({ ...b, displayOrder: i + 1 }));
    });
    e.target.value = "";
  };

  const moveStudyBlock = (blockId: string, direction: "UP" | "DOWN") => {
    setStudyBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === blockId);
      if (idx === -1) return prev;
      const targetIdx = direction === "UP" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(idx, 1);
      copy.splice(targetIdx, 0, moved);
      return copy.map((b, i) => ({ ...b, displayOrder: i + 1 }));
    });
  };

  const removeStudyBlock = (blockId: string) => {
    setStudyBlocks((prev) => {
      const block = prev.find((b) => b.id === blockId);
      if (block?.previewUrl && block?.file) {
        URL.revokeObjectURL(block.previewUrl);
      }
      return prev.filter((b) => b.id !== blockId).map((b, i) => ({ ...b, displayOrder: i + 1 }));
    });
  };

  const updateStudyTextBlock = (blockId: string, field: "title" | "textContent", val: string) => {
    setStudyBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, [field]: val } : b))
    );
  };

  const updateStudyImageCaption = (blockId: string, caption: string) => {
    setStudyBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId
          ? { ...b, metadata: { ...(b.metadata || {}), caption } }
          : b
      )
    );
  };

  const saveStudyContent = () => {
    const lessonTitle = (formData.lessonTitle || formData.courseTitle || "Study Content").trim();
    const lessonContentObj: LessonContent = {
      id: formData.lessonContents?.[0]?.id || crypto.randomUUID(),
      title: lessonTitle,
      format: "TEXT_IMAGE",
      estimatedDuration: 0,
      displayOrder: 1,
      isDefault: true,
      blocks: studyBlocks.map((b, i) => ({
        id: b.id,
        blockType: (b.blockType || "PARAGRAPH") as LessonContentBlock["blockType"],
        title: b.title || "",
        textContent: b.textContent || "",
        file: b.file,
        assetId: b.assetId,
        assetUrl: b.assetUrl,
        previewUrl: b.previewUrl,
        metadata: b.metadata || {},
        displayOrder: i + 1,
      })),
    };
    setFormData((prev: any) => ({ ...prev, lessonContents: [lessonContentObj] }));
    updateForm({ lessonContents: [lessonContentObj] });
    setShowStudyContentModal(false);
  };

  const handleStudyContentToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      if (studyBlocks.length === 0) {
        const initialBlock: LessonContentBlock = {
          id: crypto.randomUUID(),
          blockType: "PARAGRAPH",
          title: "",
          textContent: "",
          displayOrder: 1,
        };
        setStudyBlocks([initialBlock]);
        const lessonContentObj: LessonContent = {
          id: crypto.randomUUID(),
          title: (formData.lessonTitle || formData.courseTitle || "Study Content").trim(),
          format: "TEXT_IMAGE",
          estimatedDuration: 0,
          displayOrder: 1,
          isDefault: true,
          blocks: [initialBlock],
        };
        setFormData((prev: any) => ({ ...prev, lessonContents: [lessonContentObj] }));
        updateForm({ lessonContents: [lessonContentObj] });
      }
      setShowStudyContentModal(true);
    } else {
      setStudyBlocks([]);
      setFormData((prev: any) => ({ ...prev, lessonContents: [] }));
      updateForm({ lessonContents: [] });
    }
  };

  const hasSavedOrEditMode = !!createdCourseId || !!createdLessonId || !!createdCareerPathId;
  const currentStep = getStepNumber(activeSection);

  return (
    <div className="w-full min-w-0 space-y-6 pb-10">
      {/* Breadcrumb on Step 4 (Review) */}
      {activeSection === "review" && (
        <div className="mb-2">
          <button
            type="button"
            onClick={() => navigate("/studio/content")}
            className="text-[11px] font-bold text-gray-500 hover:text-gray-900 flex items-center gap-1.5 cursor-pointer uppercase tracking-wider transition-colors"
          >
            ← MY CONTENT
          </button>
        </div>
      )}

      {/* Top Page Header (Matching Reference Screenshots & Spec) */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#5C5C5C] mb-1.5">
            {publishType === "standalone-lesson"
              ? `LESSON BUILDER · STEP ${currentStep} OF ${totalSteps}`
              : `COURSE BUILDER · STEP ${currentStep} OF ${totalSteps}`}
          </p>
          <h1 className="text-2xl sm:text-3xl leading-tight font-extrabold tracking-tight text-[#141414] mb-1">
            {publishType === "standalone-lesson"
              ? (activeSection === "info" ? "Lesson content" : activeSection === "assessment" ? "Build the quiz" : "Review & save")
              : (activeSection === "info" ? "Course info" : activeSection === "lessons" ? "Lessons" : activeSection === "assessment" ? "Build the assessment" : "Review & save")}
          </h1>
          {!(publishType === "standalone-lesson" && activeSection === "assessment") && (
            <p className="text-base text-[#3A3A3A] font-normal mt-1 max-w-[680px]">
              {publishType === "standalone-lesson"
                ? (activeSection === "info" ? "Author the lesson content learners will see. No course wrapper needed." : "Final completeness check before you hand off.")
                : (activeSection === "info" ? "Define the core details that learners and administrators will see." : activeSection === "lessons" ? "Arrange, reorder, and add lessons before publishing. Every lesson is available in Video and Text." : activeSection === "assessment" ? "Configure questions, passing score, and exam settings." : "Final completeness check before you hand off. Confirm the basics, then submit for SME review.")}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {activeSection !== "info" && (
            <button
              type="button"
              onClick={() => {
                if (activeSection === "review") {
                  goToStep(publishType === "standalone-lesson" ? (formData.assessmentRequired ? "assessment" : "info") : (formData.assessmentRequired ? "assessment" : "lessons"));
                } else if (activeSection === "assessment") {
                  goToStep(publishType === "standalone-lesson" ? "info" : "lessons");
                } else if (activeSection === "lessons") {
                  goToStep("info");
                }
              }}
              className="bg-white border border-gray-300 text-[#141414] text-sm font-semibold px-4 py-2 rounded-full hover:bg-gray-50 transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
            >
              ← Back
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              const entityType = publishType === "standalone-lesson" ? "lesson" : publishType === "career-path" ? "career-path" : "course";
              const entityId = createdCourseId || createdLessonId || createdCareerPathId || "";
              navigate(`/content-developer/course-preview/${entityType}/${entityId || "draft"}`, {
                state: {
                  entityType,
                  entityId: entityId || "draft",
                  courseName: formData.courseTitle || formData.lessonTitle || formData.careerPathTitle || "Course Preview",
                  course: {
                    id: entityId || "draft",
                    title: formData.courseTitle || formData.lessonTitle || formData.careerPathTitle,
                    ...formData,
                  },
                },
              });
            }}
            className="bg-white border border-gray-300 text-[#141414] text-sm font-semibold px-4 py-2 rounded-full hover:bg-gray-50 transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
          >
            Preview
          </button>
          <button
            type="button"
            disabled={isSavingAssessment}
            onClick={() => {
              if (isSavingAssessment) return;
              if (activeSection === "review") {
                handleSubmit();
              } else if (props.onNext) {
                props.onNext();
              } else {
                if (activeSection === "info") {
                  goToStep(publishType === "standalone-lesson" ? (formData.assessmentRequired ? "assessment" : "review") : "lessons");
                } else if (activeSection === "lessons") {
                  goToStep(formData.assessmentRequired ? "assessment" : "review");
                } else if (activeSection === "assessment") {
                  goToStep("review");
                }
              }
            }}
            className="bg-[#FCF7AE] hover:bg-[#FDF9C4] border border-[#e5df8a] text-[#141414] text-sm font-bold px-5 py-2 rounded-full transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSavingAssessment ? "Saving..." : (activeSection === "review" ? "Save course →" : "Next →")}
          </button>
        </div>
      </div>

      {/* Stepper Tabs Bar (Matching Reference Screenshots & Spec exactly) */}
      <div className="bg-white rounded-2xl flex items-center gap-2 border border-gray-200 p-1.5 shadow-2xs">
        <button
          type="button"
          onClick={() => goToStep("info")}
          className={`flex-1 h-[52px] px-5 rounded-xl text-base font-bold flex items-center gap-3 transition-all cursor-pointer ${activeSection === "info"
            ? "bg-[#dce5d3] text-[#141414] border border-[#dce5d3]"
            : "bg-white text-[#5C5C5C] hover:bg-gray-50 border border-transparent"
            }`}
        >
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[16px] font-bold shrink-0 ${activeSection === "info" ? "bg-[#C99B2E] text-white" : "border border-gray-300 text-gray-400 bg-white"
            }`}>
            1
          </span>
          {publishType === "standalone-lesson" ? "Lesson content" : "Info"}
        </button>

        {publishType !== "standalone-lesson" && (
          <button
            type="button"
            onClick={() => goToStepGuarded("lessons")}
            className={`flex-1 h-[52px] px-5 rounded-xl text-base font-bold flex items-center gap-3 transition-all cursor-pointer ${(activeSection as string) === "lessons"
              ? "bg-[#FAF0DC] text-[#755A12] border border-[#e8d7a7]"
              : "bg-white text-[#5C5C5C] hover:bg-gray-50 border border-transparent"
              }`}
          >
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[16px] font-bold shrink-0 ${(activeSection as string) === "lessons" ? "bg-[#C99B2E] text-white" : "border border-gray-300 text-gray-400 bg-white"
              }`}>
              2
            </span>
            {publishType === "career-path" ? "Courses" : "Lessons"}
          </button>
        )}

        {publishType === "standalone-lesson" ? (
          (!isChildLesson && formData.assessmentRequired) && (
            <button
              type="button"
              onClick={() => goToStepGuarded("assessment")}
              className={`flex-1 h-[52px] px-5 rounded-xl text-base font-bold flex items-center gap-3 transition-all cursor-pointer ${(activeSection as string) === "assessment"
                ? "bg-[#FAF0DC] text-[#755A12] border border-[#e8d7a7]"
                : "bg-white text-gray-700 border border-transparent hover:border-gray-200"
                }`}
            >
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[16px] font-bold shrink-0 ${(activeSection as string) === "assessment" ? "bg-[#C99B2E] text-white" : "border border-gray-300 text-gray-400 bg-white"
                }`}>
                2
              </span>
              Quiz
            </button>
          )
        ) : (
          formData.assessmentRequired && (
            <button
              type="button"
              onClick={() => goToStepGuarded("assessment")}
              className={`flex-1 h-[52px] px-5 rounded-xl text-base font-bold flex items-center gap-3 transition-all cursor-pointer ${(activeSection as string) === "assessment"
                ? "bg-[#FAF0DC] text-[#755A12] border border-[#e8d7a7]"
                : "bg-white text-[#5C5C5C] hover:bg-gray-50 border border-transparent"
                }`}
            >
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[16px] font-bold shrink-0 ${(activeSection as string) === "assessment" ? "bg-[#C99B2E] text-white" : "border border-gray-300 text-gray-400 bg-white"
                }`}>
                3
              </span>
              Assessment
            </button>
          )
        )}

        {!(publishType === "standalone-lesson" && isChildLesson) && (
          <button
            type="button"
            onClick={() => goToStepGuarded("review")}
            className={`flex-1 h-[52px] px-5 rounded-xl text-base font-bold flex items-center gap-3 transition-all cursor-pointer ${(activeSection as string) === "review"
              ? "bg-[#FAF0DC] text-[#755A12] border border-[#e8d7a7]"
              : "bg-white text-[#5C5C5C] hover:bg-gray-50 border border-transparent"
              }`}
          >
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[16px] font-bold shrink-0 ${(activeSection as string) === "review" ? "bg-[#C99B2E] text-white" : "border border-gray-300 text-gray-400 bg-white"
              }`}>
              {publishType === "standalone-lesson" ? (formData.assessmentRequired ? 3 : 2) : (formData.assessmentRequired ? 4 : 3)}
            </span>
            Review
          </button>
        )}
      </div>

      {/* STEP 1: INFO */}
      {activeSection === "info" && (
        <div className="space-y-6">
          {/* Building a Career Path Nudge Callout (Matching Screenshot 357, 113538, 113550, 113601) */}
          {publishType !== "standalone-lesson" && (
            <div className="bg-[#eaf0e6] border border-[#d2e0cc] rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200 hover:shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-white border border-[#d2e0cc] text-[#446038] flex items-center justify-center shrink-0 shadow-2xs">
                  <svg className="w-5 h-5 text-[#446038]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.85} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#141414] mb-0.5">
                    Building a career path?
                  </h3>
                  <p className="text-sm text-[#3A3A3A] font-normal">
                    Career paths bundle multiple courses into a guided track. They are built in a dedicated Career Path builder.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate("/studio/path-builder")}
                className="bg-white border border-gray-300 text-[#141414] text-sm font-semibold px-4 py-2 rounded-full hover:bg-gray-50 transition-colors shadow-2xs cursor-pointer shrink-0"
              >
                Open Career Path builder →
              </button>
            </div>
          )}

          {/* Card 1: Access & Visibility (Matching Image 1 & Specs) */}
          <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-2xs space-y-4 transition-all duration-200 hover:shadow-md hover:border-gray-300/80">
            <h3 className="text-base font-bold text-[#141414]">
              Access & visibility
            </h3>

            <div className={`grid grid-cols-1 ${formData.visibility && formData.visibility !== "PUBLIC_CATALOG" ? "md:grid-cols-2" : "md:grid-cols-1"} gap-6`}>
              {/* Visibility Select */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5C5C]">
                  VISIBILITY <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.visibility || "PUBLIC_CATALOG"}
                  disabled={isChildLesson}
                  onChange={(e) => {
                    const newVis = e.target.value;
                    setFormData({
                      ...formData,
                      visibility: newVis,
                      ...(newVis === "PUBLIC_CATALOG" ? { corporateTenant: [] } : {}),
                    });
                  }}
                  className={`w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-900 focus:outline-none focus:border-gray-900 shadow-2xs ${isChildLesson ? "opacity-60 cursor-not-allowed bg-gray-50" : "cursor-pointer"}`}
                >
                  <option value="PUBLIC_CATALOG">Public (open to Subscribed learners)</option>
                  <option value="TENANT_ONLY">Corporate (open to Tenant learners only)</option>
                  <option value="BOTH">Public & Corporate (Both)</option>
                </select>
                <p className="text-sm text-[#5C5C5C] font-normal pt-1">
                  Public = subscribed learners. Visitors = anyone on the site. Corporate = tenant users. Public & Corporate = both.
                </p>
              </div>

              {/* Corporate Tenants Selection (Only when Corporate / Both) */}
              {formData.visibility && formData.visibility !== "PUBLIC_CATALOG" && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5C5C]">
                      CORPORATE TENANTS {formData.visibility === "TENANT_ONLY" && <span className="text-red-500">*</span>}
                    </label>
                    <span className="bg-[#F6E8C4] text-[#755A12] text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {formData.visibility === "TENANT_ONLY" ? "REQUIRED" : "OPTIONAL"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {tenants && tenants.length > 0 ? (
                      <>
                        {/* ALL quick-select button */}
                        {(() => {
                          const allIds = tenants.map((t: any) => t.id);
                          const currentTenants = formData.corporateTenant || [];
                          const allSelected = allIds.length > 0 && allIds.every((id: string) => currentTenants.includes(id));
                          return (
                            <button
                              key="__all__"
                              type="button"
                              disabled={isChildLesson}
                              onClick={() => {
                                if (isChildLesson) return;
                                setFormData({
                                  ...formData,
                                  corporateTenant: allSelected ? [] : allIds,
                                });
                              }}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-bold transition-all ${
                                isChildLesson
                                  ? "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed opacity-60"
                                  : allSelected
                                    ? "bg-[#755A12] border-[#755A12] text-white shadow-sm cursor-pointer"
                                    : "bg-white border-[#e8d7a7] text-[#755A12] hover:bg-[#FDF6E3] hover:border-[#c9a94e] cursor-pointer"
                              }`}
                            >
                              {allSelected && <span className="font-bold">✓</span>}
                              All
                            </button>
                          );
                        })()}
                        {/* Individual tenant buttons */}
                        {tenants.map((tenant: any) => {
                          const isSelected = (formData.corporateTenant || []).includes(tenant.id);
                          return (
                            <button
                              key={tenant.id}
                              type="button"
                              disabled={isChildLesson}
                              onClick={() => {
                                if (isChildLesson) return;
                                const currentTenants = formData.corporateTenant || [];
                                setFormData({
                                  ...formData,
                                  corporateTenant: isSelected
                                    ? currentTenants.filter((id) => id !== tenant.id)
                                    : [...currentTenants, tenant.id],
                                });
                              }}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-semibold transition-all ${isChildLesson ? (isSelected ? "bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed" : "bg-white border-gray-200 text-gray-400 cursor-not-allowed opacity-60") : (isSelected ? "bg-[#FAF0DC] border-[#e8d7a7] text-[#755A12]" : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 cursor-pointer")
                                }`}
                            >
                              {isSelected && <span className="mr-1.5 font-bold">✓</span>}
                              {tenant.name}
                            </button>
                          );
                        })}
                      </>
                    ) : (
                      <span className="text-sm text-gray-400 italic">No corporate tenants available</span>
                    )}
                  </div>
                  <p className="text-sm text-[#5C5C5C] font-normal pt-1">
                    {(() => {
                      const count = (formData.corporateTenant || []).length;
                      const total = tenants?.length || 0;
                      const isAll = total > 0 && count === total;
                      if (count === 0) {
                        return formData.visibility === "TENANT_ONLY"
                          ? "Select at least one tenant. The course is visible inside selected tenant portals only."
                          : "Select one or more tenants. The course is visible inside each selected tenant\u2019s portal.";
                      }
                      return isAll
                        ? `All ${total} tenant${total !== 1 ? "s" : ""} selected \u2014 course is visible to all corporate portals.`
                        : `${count} of ${total} tenant${total !== 1 ? "s" : ""} selected.`;
                    })()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Assessment */}
          {!(publishType === "standalone-lesson" && isChildLesson) && (
            <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-2xs flex items-center justify-between gap-4 transition-all duration-200 hover:shadow-md hover:border-gray-300/80">
              <div>
                <h3 className="text-base font-bold text-[#141414]">
                  {publishType === "standalone-lesson" ? "Assessment (optional)" : "Assessment (enabled by default)"}
                </h3>
                <p className="text-sm text-[#5C5C5C] font-normal mt-0.5">
                  {publishType === "standalone-lesson"
                    ? "Toggle to include or exclude a final assessment for this lesson."
                    : "New courses include a final assessment by default. Toggle to exclude it."}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${formData.assessmentRequired ? "bg-emerald-100 text-emerald-700" : "bg-[#F6E8C4] text-[#755A12]"}`}>
                  {formData.assessmentRequired ? "ENABLED" : "DISABLED"}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      assessmentRequired: !formData.assessmentRequired,
                    })
                  }
                  className={`w-12 h-6.5 rounded-full p-0.5 transition-colors cursor-pointer flex items-center ${formData.assessmentRequired ? "bg-[#7E9B6F]" : "bg-gray-300"
                    }`}
                >
                  <div
                    className={`w-5.5 h-5.5 rounded-full bg-white shadow-md transition-transform ${formData.assessmentRequired ? "translate-x-5.5" : "translate-x-0"
                      }`}
                  />
                </button>
              </div>
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
            {/* BASIC INFORMATION + MEDIA & METADATA */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Box: Basic Information Layout */}
              <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-2xs space-y-4 transition-all duration-200 hover:shadow-md hover:border-gray-300/80">
                <h3 className="text-base font-bold text-[#141414] pb-1">
                  Basic information
                </h3>

                {/* TITLE */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5C5C]">
                    {publishType === "standalone-lesson" ? "LESSON TITLE" : publishType === "career-path" ? "CAREER PATH TITLE" : "COURSE TITLE"} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={publishType === "standalone-lesson" ? (formData.lessonTitle || "") : publishType === "career-path" ? (formData.careerPathTitle || "") : (formData.courseTitle || "")}
                    onChange={(e) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        ...(publishType === "standalone-lesson"
                          ? { lessonTitle: e.target.value }
                          : publishType === "career-path"
                            ? { careerPathTitle: e.target.value }
                            : { courseTitle: e.target.value }),
                      }))
                    }
                    placeholder={publishType === "standalone-lesson" ? "e.g. Introduction to Data Quality" : publishType === "career-path" ? "e.g. Data Governance Specialist" : "e.g. Data Quality Foundations"}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-900 focus:outline-none focus:border-gray-900 shadow-2xs"
                  />
                </div>

                {/* TAGLINE */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5C5C]">
                    TAGLINE
                  </label>
                  <input
                    type="text"
                    value={publishType === "standalone-lesson" ? (formData.tagLine || formData.tagline || "") : publishType === "career-path" ? (formData.careerPathSubtitle || formData.tagline || "") : (formData.courseSubtitle || formData.tagline || "")}
                    onChange={(e) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        tagline: e.target.value,
                        ...(publishType === "standalone-lesson"
                          ? { tagLine: e.target.value }
                          : publishType === "career-path"
                            ? { careerPathSubtitle: e.target.value }
                            : { courseSubtitle: e.target.value }),
                      }))
                    }
                    placeholder="One-line description shown on cards"
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-900 focus:outline-none focus:border-gray-900 shadow-2xs"
                  />
                </div>

                {/* FULL DESCRIPTION */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5C5C]">
                    FULL DESCRIPTION <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={publishType === "standalone-lesson" ? (formData.lessonDescription || formData.fullDescription || "") : publishType === "career-path" ? (formData.description || formData.fullDescription || "") : (formData.fullDescription || formData.description || "")}
                    onChange={(e) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        ...(publishType === "standalone-lesson"
                          ? { lessonDescription: e.target.value, fullDescription: e.target.value }
                          : publishType === "career-path"
                            ? { description: e.target.value, fullDescription: e.target.value }
                            : { fullDescription: e.target.value, description: e.target.value }),
                      }))
                    }
                    placeholder={publishType === "standalone-lesson" ? "What this lesson covers..." : "What this course covers, who it's for..."}
                    className="w-full bg-white border border-gray-200 rounded-xl p-3.5 text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 h-28 resize-none shadow-2xs"
                  />
                </div>

                {/* CATEGORY & DOMAIN */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* CATEGORY */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5C5C]">
                        CATEGORY <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowCategoryModal(true)}
                        className="text-xs font-bold text-amber-700 hover:text-amber-800 cursor-pointer"
                      >
                        + Add Category
                      </button>
                    </div>
                    <select
                      value={formData.categoryId || ""}
                      onChange={(e) => {
                        if (e.target.value === "__new_category__") {
                          setShowCategoryModal(true);
                        } else {
                          setFormData((prev: any) => ({
                            ...prev,
                            categoryId: e.target.value,
                          }));
                        }
                      }}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-gray-900 focus:outline-none focus:border-gray-900 cursor-pointer shadow-2xs"
                    >
                      <option value="">
                        {categoryLoading ? "Loading categories..." : "Select Category"}
                      </option>
                      {(categories || []).map((cat: any) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                      <option value="__new_category__">+ Add New Category</option>
                    </select>
                  </div>

                  {/* DOMAIN */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5C5C]">
                        DOMAIN <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowDomainModal(true)}
                        className="text-xs font-bold text-amber-700 hover:text-amber-800 cursor-pointer"
                      >
                        + Add Domain
                      </button>
                    </div>
                    <select
                      value={formData.subjectId || ""}
                      onChange={(e) => {
                        if (e.target.value === "__new_domain__") {
                          setShowDomainModal(true);
                        } else {
                          setFormData((prev: any) => ({
                            ...prev,
                            subjectId: e.target.value,
                          }));
                        }
                      }}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-gray-900 focus:outline-none focus:border-gray-900 cursor-pointer shadow-2xs"
                    >
                      <option value="">
                        {loading ? "Loading domains..." : "Select Domain"}
                      </option>
                      {availableSubjects.map((subject: any) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name}
                        </option>
                      ))}
                      <option value="__new_domain__">+ Add New Domain</option>
                    </select>
                  </div>
                </div>

                {/* DIFFICULTY + LEARNING TYPE */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5C5C]">
                        DIFFICULTY <span className="text-red-500">*</span>
                      </label>
                      <span className="bg-[#F6E8C4] text-[#755A12] text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        ON CARD
                      </span>
                    </div>
                    <select
                      value={
                        availableDifficultyLevels
                          .map((level: any) => level.value ?? level)
                          .find((lvl: string) => String(lvl).toUpperCase() === String(formData.difficulty || "").toUpperCase()) ||
                        formData.difficulty ||
                        ""
                      }
                      onChange={(e) =>
                        setFormData((prev: any) => ({
                          ...prev,
                          difficulty: e.target.value,
                        }))
                      }
                      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-gray-900 focus:outline-none focus:border-gray-900 cursor-pointer shadow-2xs"
                    >
                      <option value="">Select Difficulty</option>
                      {availableDifficultyLevels.map((level: any) => (
                        <option key={level.value ?? level} value={level.value ?? level}>
                          {level.label ?? level}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5C5C]">
                        LEARNING TYPE <span className="text-red-500">*</span>
                      </label>
                      <span className="bg-[#F6E8C4] text-[#755A12] text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        ON CARD
                      </span>
                    </div>
                    <select
                      value={
                        availableLessonTypes
                          .map((lt: any) => lt.value ?? lt)
                          .find(
                            (type: string) =>
                              String(type).toUpperCase() === String(formData.lessonType || formData.shortDescription || "").toUpperCase()
                          ) ||
                        formData.lessonType ||
                        ""
                      }
                      onChange={(e) =>
                        setFormData((prev: any) => ({
                          ...prev,
                          lessonType: e.target.value,
                          shortDescription: e.target.value,
                        }))
                      }
                      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-gray-900 focus:outline-none focus:border-gray-900 cursor-pointer shadow-2xs"
                    >
                      <option value="">Select Learning Type</option>
                      {availableLessonTypes.map((lt: any) => (
                        <option key={lt.value ?? lt} value={lt.value ?? lt}>
                          {lt.label ?? lt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* DURATION + LANGUAGE */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5C5C]">
                        {publishType === "standalone-lesson" ? "DURATION (MINUTES)" : "DURATION (HOURS)"} <span className="text-red-500">*</span>
                      </label>
                      <span className="bg-[#F6E8C4] text-[#755A12] text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        ON CARD
                      </span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={formData.duration ?? ""}
                      onChange={(e) =>
                        setFormData((prev: any) => ({
                          ...prev,
                          duration: e.target.value,
                          lessonDuration: Number(e.target.value) || 0,
                        }))
                      }
                      placeholder={publishType === "standalone-lesson" ? "Auto-detected or enter mins" : "4"}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-900 focus:outline-none focus:border-gray-900 shadow-2xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5C5C]">
                      LANGUAGE <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={
                        ["English", "Arabic", ...(languages || []).map((l: any) => l.name)].find(
                          (name: string) => name.toLowerCase() === String(formData.language || "").toLowerCase()
                        ) ||
                        formData.language ||
                        "English"
                      }
                      onChange={(e) =>
                        setFormData((prev: any) => ({
                          ...prev,
                          language: e.target.value,
                        }))
                      }
                      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-gray-900 focus:outline-none focus:border-gray-900 cursor-pointer shadow-2xs"
                    >
                      <option value="English">English</option>
                      <option value="Arabic">Arabic</option>
                      {languages.map((l: any) => (
                        <option key={l.code} value={l.name}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* LESSON-SPECIFIC CONTENT FIELDS DYNAMICALLY SWITCHED BY LESSON TYPE */}
                {publishType === "standalone-lesson" && (
                  <>
                    {/* 1. VIDEO LESSON TYPE */}
                    {formData.lessonType?.toUpperCase() === "VIDEO" && (
                      <>
                        {/* VIDEO PRIMARY CONTENT */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center gap-1.5">
                            <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5C5C]">
                              VIDEO <span className="text-red-500">*</span>
                            </label>
                            <span className="bg-[#e6eee3] text-[#3d5c3a] text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                              PRIMARY CONTENT
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="url"
                              value={formData.videoUrl || ""}
                              onChange={(e) => handleMediaUrlChange(e.target.value)}
                              onBlur={() => {
                                if (formData.videoUrl) {
                                  calculateAndApplyDuration(formData.videoUrl);
                                }
                              }}
                              placeholder="Paste a video URL (YouTube, Vimeo, MP4...), or upload below"
                              className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-900 focus:outline-none focus:border-gray-900 shadow-2xs"
                            />
                            {formData.videoUrl && (
                              <button
                                type="button"
                                disabled={isCalculatingDuration}
                                onClick={() => calculateAndApplyDuration(formData.videoUrl!)}
                                className="px-3.5 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                title="Detect real duration from video URL"
                              >
                                {isCalculatingDuration ? "Detecting..." : "Detect Duration"}
                              </button>
                            )}
                          </div>
                          {isCalculatingDuration && (
                            <p className="text-xs text-blue-600 font-medium animate-pulse flex items-center gap-1.5 mt-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping inline-block" />
                              Auto-calculating video duration from URL...
                            </p>
                          )}
                          {!isCalculatingDuration && formData.duration && Number(formData.duration) > 0 && formData.videoUrl && (
                            <p className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-1">
                              ✓ Real duration auto-calculated: {formData.duration} min{Number(formData.duration) > 1 ? "s" : ""}
                            </p>
                          )}
                          <label
                            htmlFor="video-file-upload"
                            className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center hover:border-gray-400 transition-colors cursor-pointer bg-gray-50/50 block"
                          >
                            {formData.primaryContent ? (
                              <p className="text-sm font-bold text-gray-800">📹 {formData.primaryContent.name} (UPLOAD)</p>
                            ) : formData.videoUrl ? (
                              <p className="text-sm font-bold text-gray-800">📹 Video Linked: {formData.videoUrl} (EXTERNAL_LINK)</p>
                            ) : (formData.primaryContentAssetUrl || formData.primaryContentAssetName) && !formData.removedAssetRoles?.includes("VIDEO") && !formData.removedAssetRoles?.includes("CONTENT") ? (
                              <div className="flex flex-col items-center gap-1">
                                <p className="text-sm font-bold text-gray-800">
                                  📹 {getDisplayFileName(formData.primaryContentAssetName || formData.primaryContentAssetUrl, "Uploaded Video")}
                                </p>
                                <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                                  ✓ Previously uploaded video associated (Click to replace)
                                </span>
                              </div>
                            ) : (
                              <p className="text-sm font-medium text-gray-500">Video file (MP4 / MOV) · or paste URL above</p>
                            )}
                            <input
                              id="video-file-upload"
                              type="file"
                              accept="video/mp4,video/quicktime,video/webm"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                if (file) {
                                  const video = document.createElement("video");
                                  video.preload = "metadata";
                                  video.onloadedmetadata = () => {
                                    window.URL.revokeObjectURL(video.src);
                                    const durationInMinutes = Math.ceil(video.duration / 60) || 1;
                                    setFormData((prev: any) => ({ ...prev, primaryContent: file, duration: durationInMinutes.toString(), lessonDuration: durationInMinutes, assetSource: "UPLOAD" }));
                                  };
                                  video.src = URL.createObjectURL(file);
                                  setFormData((prev: any) => ({ ...prev, primaryContent: file, assetSource: "UPLOAD" }));
                                }
                              }}
                            />
                          </label>
                          <p className="text-xs text-gray-400 font-medium">Video is the primary content for this learning type.</p>
                        </div>

                        {/* SUBTITLES / CAPTIONS */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center gap-1.5">
                            <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5C5C]">
                              SUBTITLES / CAPTIONS <span className="text-red-500">*</span>
                            </label>
                            <span className="bg-[#F6E8C4] text-[#755A12] text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                              MANDATORY FOR VIDEO
                            </span>
                          </div>
                          <label
                            htmlFor="subtitles-upload"
                            className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center hover:border-gray-400 transition-colors cursor-pointer bg-gray-50/50 block"
                          >
                            {formData.transcript ? (
                              <p className="text-sm font-bold text-gray-800">💬 {formData.transcript.name}</p>
                            ) : ((formData as any).transcriptAssetName || (formData as any).transcriptAssetUrl) && !formData.removedAssetRoles?.includes("TRANSCRIPT") ? (
                              <div className="flex flex-col items-center gap-1">
                                <p className="text-sm font-bold text-gray-800">
                                  💬 {getDisplayFileName((formData as any).transcriptAssetName || (formData as any).transcriptAssetUrl, "Uploaded Subtitle")}
                                </p>
                                <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                                  ✓ Previously uploaded subtitle associated (Click to replace)
                                </span>
                              </div>
                            ) : (
                              <p className="text-sm font-medium text-gray-500">.srt or .vtt · Mandatory</p>
                            )}
                            <input
                              id="subtitles-upload"
                              type="file"
                              accept=".srt,.vtt"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                if (file) {
                                  setFormData((prev: any) => ({ ...prev, transcript: file }));
                                }
                              }}
                            />
                          </label>
                          <p className="text-xs text-gray-400 font-medium">Subtitles (.srt / .vtt) are required for video lessons.</p>
                        </div>


                      </>
                    )}

                    {/* 2. AUDIO LESSON TYPE */}
                    {formData.lessonType?.toUpperCase() === "AUDIO" && (
                      <>
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center gap-1.5">
                            <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5C5C]">
                              AUDIO <span className="text-red-500">*</span>
                            </label>
                            <span className="bg-[#e6eee3] text-[#3d5c3a] text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                              PRIMARY CONTENT
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="url"
                              value={formData.videoUrl || ""}
                              onChange={(e) => handleMediaUrlChange(e.target.value)}
                              onBlur={() => {
                                if (formData.videoUrl) {
                                  calculateAndApplyDuration(formData.videoUrl);
                                }
                              }}
                              placeholder="Paste audio URL, or upload below"
                              className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-900 focus:outline-none focus:border-gray-900 shadow-2xs"
                            />
                            {formData.videoUrl && (
                              <button
                                type="button"
                                disabled={isCalculatingDuration}
                                onClick={() => calculateAndApplyDuration(formData.videoUrl!)}
                                className="px-3.5 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                title="Detect real duration from audio URL"
                              >
                                {isCalculatingDuration ? "Detecting..." : "Detect Duration"}
                              </button>
                            )}
                          </div>
                          {isCalculatingDuration && (
                            <p className="text-xs text-blue-600 font-medium animate-pulse flex items-center gap-1.5 mt-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping inline-block" />
                              Auto-calculating audio duration from URL...
                            </p>
                          )}
                          {!isCalculatingDuration && formData.duration && Number(formData.duration) > 0 && formData.videoUrl && (
                            <p className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-1">
                              ✓ Real duration auto-calculated: {formData.duration} min{Number(formData.duration) > 1 ? "s" : ""}
                            </p>
                          )}
                          <label
                            htmlFor="audio-file-upload"
                            className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center hover:border-gray-400 transition-colors cursor-pointer bg-gray-50/50 block"
                          >
                            {formData.primaryContent ? (
                              <p className="text-sm font-bold text-gray-800">🎵 {formData.primaryContent.name}</p>
                            ) : (
                              <p className="text-sm font-medium text-gray-500">Audio file (MP3 / WAV / AAC) · or paste URL above</p>
                            )}
                            <input
                              id="audio-file-upload"
                              type="file"
                              accept="audio/mp3,audio/wav,audio/mpeg,audio/aac,audio/ogg,audio/m4a"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                if (file) {
                                  const audio = document.createElement("audio");
                                  audio.preload = "metadata";
                                  audio.onloadedmetadata = () => {
                                    window.URL.revokeObjectURL(audio.src);
                                    const durationInMinutes = Math.ceil(audio.duration / 60) || 1;
                                    setFormData((prev: any) => ({ ...prev, primaryContent: file, duration: durationInMinutes.toString(), lessonDuration: durationInMinutes, assetSource: "UPLOAD" }));
                                  };
                                  audio.src = URL.createObjectURL(file);
                                  setFormData((prev: any) => ({ ...prev, primaryContent: file, assetSource: "UPLOAD" }));
                                }
                              }}
                            />
                          </label>
                          <p className="text-xs text-gray-400 font-medium">Audio is the primary content for this lesson type.</p>
                        </div>

                      </>
                    )}

                    {/* 3. IMAGE LESSON TYPE */}
                    {formData.lessonType?.toUpperCase() === "IMAGE" && (
                      <>
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center gap-1.5">
                            <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5C5C]">
                              IMAGE / INFOGRAPHIC <span className="text-red-500">*</span>
                            </label>
                            <span className="bg-[#e6eee3] text-[#3d5c3a] text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                              PRIMARY CONTENT
                            </span>
                          </div>
                          <label
                            htmlFor="image-primary-upload"
                            className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-gray-400 transition-colors cursor-pointer bg-gray-50/50 block"
                          >
                            {formData.primaryContent ? (
                              <p className="text-sm font-bold text-gray-800">🖼️ {formData.primaryContent.name}</p>
                            ) : (
                              <p className="text-sm font-medium text-gray-500">Click or drag image file (PNG / JPG / WebP / SVG)</p>
                            )}
                            <input
                              id="image-primary-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                if (file) {
                                  setFormData((prev: any) => ({ ...prev, primaryContent: file, assetSource: "UPLOAD" }));
                                }
                              }}
                            />
                          </label>
                          <p className="text-xs text-gray-400 font-medium">Image/infographic is the primary visual content for this lesson.</p>
                        </div>
                      </>
                    )}

                    {/* 4. DOCUMENT LESSON TYPE */}
                    {(formData.lessonType?.toUpperCase() === "DOCUMENT" || formData.lessonType?.toUpperCase() === "PDF") && (
                      <>
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center gap-1.5">
                            <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5C5C]">
                              DOCUMENT / PDF <span className="text-red-500">*</span>
                            </label>
                            <span className="bg-[#e6eee3] text-[#3d5c3a] text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                              PRIMARY CONTENT
                            </span>
                          </div>
                          <label
                            htmlFor="document-primary-upload"
                            className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-gray-400 transition-colors cursor-pointer bg-gray-50/50 block"
                          >
                            {formData.primaryContent ? (
                              <p className="text-sm font-bold text-gray-800">📄 {formData.primaryContent.name}</p>
                            ) : (
                              <p className="text-sm font-medium text-gray-500">Click or drag PDF document</p>
                            )}
                            <input
                              id="document-primary-upload"
                              type="file"
                              accept=".pdf,application/pdf"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                if (file) {
                                  setFormData((prev: any) => ({ ...prev, primaryContent: file, assetSource: "UPLOAD" }));
                                }
                              }}
                            />
                          </label>
                        </div>
                      </>
                    )}

                    {/* 5. TEXT / ARTICLE LESSON TYPE */}
                    {(formData.lessonType?.toUpperCase() === "TEXT" || formData.lessonType?.toUpperCase() === "ARTICLE") && (
                      <>
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center gap-1.5">
                            <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5C5C]">
                              ARTICLE / TEXT CONTENT <span className="text-red-500">*</span>
                            </label>
                            <span className="bg-[#e6eee3] text-[#3d5c3a] text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                              PRIMARY CONTENT
                            </span>
                          </div>
                          <textarea
                            value={formData.fullDescription || formData.lessonDescription || ""}
                            onChange={(e) =>
                              setFormData((prev: any) => ({
                                ...prev,
                                fullDescription: e.target.value,
                                lessonDescription: e.target.value,
                              }))
                            }
                            placeholder="Write or paste the full article/text lesson content here..."
                            className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 h-44 resize-y shadow-2xs"
                          />
                        </div>
                      </>
                    )}

                    {/* 6. SCORM LESSON TYPE */}
                    {formData.lessonType?.toUpperCase() === "SCORM" && (
                      <>
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center gap-1.5">
                            <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5C5C]">
                              SCORM PACKAGE (.ZIP) <span className="text-red-500">*</span>
                            </label>
                            <span className="bg-[#e6eee3] text-[#3d5c3a] text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                              PRIMARY CONTENT
                            </span>
                          </div>
                          <label
                            htmlFor="scorm-primary-upload"
                            className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-gray-400 transition-colors cursor-pointer bg-gray-50/50 block"
                          >
                            {formData.primaryContent ? (
                              <p className="text-sm font-bold text-gray-800">📦 {formData.primaryContent.name}</p>
                            ) : (
                              <p className="text-sm font-medium text-gray-500">Click or drag SCORM 1.2 / 2004 package (.zip)</p>
                            )}
                            <input
                              id="scorm-primary-upload"
                              type="file"
                              accept=".zip,application/zip,application/x-zip-compressed"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                if (file) {
                                  setFormData((prev: any) => ({ ...prev, primaryContent: file, assetSource: "UPLOAD" }));
                                }
                              }}
                            />
                          </label>
                        </div>
                      </>
                    )}
                  </>
                )}

                {/* LEARNING OUTCOMES */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5C5C]">
                    LEARNING OUTCOMES
                  </label>
                  <textarea
                    value={formData.learningOutcomes || ""}
                    onChange={(e) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        learningOutcomes: e.target.value,
                      }))
                    }
                    placeholder="One outcome per line"
                    className="w-full bg-white border border-gray-200 rounded-xl p-3.5 text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 h-24 resize-none shadow-2xs"
                  />
                </div>
              </div>

              {/* Right Box: Media & Metadata Form Inputs Layout */}
              <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-2xs space-y-4 transition-all duration-200 hover:shadow-md hover:border-gray-300/80">
                <h3 className="text-base font-bold text-[#141414] pb-1">
                  Media &amp; metadata
                </h3>



                {/* THUMBNAIL */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5C5C]">
                    THUMBNAIL <span className="text-red-500">*</span>
                  </label>
                  <label
                    htmlFor="thumbnail-upload"
                    className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-gray-400 transition-colors cursor-pointer bg-[#FAFAFA] block"
                  >
                    {(() => {
                      const activeFile = publishType === "standalone-lesson"
                        ? formData.thumbnail
                        : publishType === "career-path"
                          ? formData.coverImage
                          : (formData.coursethumbnail || formData.thumbnail);

                      const activeExistingUrl = publishType === "standalone-lesson"
                        ? formData.thumbnailAssetUrl
                        : publishType === "career-path"
                          ? formData.coverImageAssetUrl
                          : (formData.courseThumbnailAssetUrl || formData.coverImageAssetUrl);

                      if (activeFile) {
                        return (
                          <div className="flex flex-col items-center gap-2">
                            {thumbnailPreviewUrl ? (
                              <img
                                src={thumbnailPreviewUrl}
                                alt="Selected thumbnail preview"
                                className="w-40 h-24 object-cover rounded-lg border border-gray-200 mb-1"
                              />
                            ) : null}
                            <p className="text-sm font-bold text-gray-800">
                              {activeFile.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              Click to replace
                            </p>
                          </div>
                        );
                      }

                      if (activeExistingUrl) {
                        return (
                          <div className="flex flex-col items-center gap-2">
                            <img
                              src={activeExistingUrl}
                              alt="Thumbnail preview"
                              className="w-24 h-16 object-cover rounded-lg border border-gray-200 mb-1"
                            />
                            <p className="text-sm font-bold text-gray-800">
                              Current thumbnail loaded
                            </p>
                            <p className="text-xs text-gray-400">
                              Click to upload a new image
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div className="flex flex-col items-center gap-2">
                          <div className="mx-auto w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 mb-1">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                          </div>
                          <p className="text-sm font-semibold text-[#5C5C5C]">
                            Drag image · 16:10 · Min 1280×800
                          </p>
                          <p className="text-xs text-gray-400">
                            PNG, JPG or WebP up to 5 MB
                          </p>
                        </div>
                      );
                    })()}
                    <input
                      id="thumbnail-upload"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        if (file) {
                          setFormData((prev: any) => ({
                            ...prev,
                            ...(publishType === "standalone-lesson"
                              ? { thumbnail: file }
                              : publishType === "career-path"
                                ? { coverImage: file }
                                : { coursethumbnail: file, thumbnail: file }),
                          }));
                        }
                      }}
                    />
                  </label>
                  {(() => {
                    const hasActiveThumb = publishType === "standalone-lesson"
                      ? (formData.thumbnail || formData.thumbnailAssetUrl)
                      : publishType === "career-path"
                        ? (formData.coverImage || formData.coverImageAssetUrl)
                        : (formData.coursethumbnail || formData.thumbnail || formData.courseThumbnailAssetUrl);

                    if (!hasActiveThumb) return null;

                    return (
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev: any) => ({
                            ...prev,
                            ...(publishType === "standalone-lesson"
                              ? { thumbnail: null, thumbnailAssetUrl: "", removedAssetRoles: [...(prev.removedAssetRoles || []), "LESSON_THUMBNAIL", "THUMBNAIL"] }
                              : publishType === "career-path"
                                ? { coverImage: null, coverImageAssetUrl: "", removedAssetRoles: [...(prev.removedAssetRoles || []), "COVER_IMAGE"] }
                                : { coursethumbnail: null, thumbnail: null, courseThumbnailAssetUrl: "", coverImageAssetUrl: "", removedAssetRoles: [...(prev.removedAssetRoles || []), "COURSE_THUMBNAIL", "THUMBNAIL"] }),
                          }))
                        }
                        className="text-xs text-red-500 hover:text-red-700 font-semibold mt-1 cursor-pointer"
                      >
                        Remove thumbnail
                      </button>
                    );
                  })()}
                </div>

                {/* AUTHOR NAME & AVATAR */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5C5C]">
                    AUTHOR NAME <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#FCF7AE] text-[#141414] font-extrabold text-base flex items-center justify-center border border-[#e5df8a] shrink-0 shadow-2xs">
                      {((formData as any).authorName || "Nexus Academy").trim().charAt(0).toUpperCase() || "N"}
                    </div>
                    <input
                      type="text"
                      value={(formData as any).authorName ?? "Nexus Academy"}
                      onChange={(e) =>
                        setFormData((prev: any) => ({
                          ...prev,
                          authorName: e.target.value,
                        }))
                      }
                      placeholder="e.g. Nexus Academy"
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-900 focus:outline-none focus:border-gray-900 shadow-2xs"
                    />
                  </div>
                </div>

                {/* TAGS */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5C5C]">
                    TAGS (comma-separated)
                  </label>
                  <div className="relative">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val.includes(",")) {
                            const parts = val.split(",").map((s: string) => s.replace(/^#/, "").trim().toLowerCase()).filter(Boolean);
                            const current = formData.tags || [];
                            const newTags = Array.from(new Set([...current, ...parts]));
                            setFormData((prev: any) => ({ ...prev, tags: newTags, lessonTags: newTags }));
                            setTagInput("");
                          } else {
                            setTagInput(val);
                          }
                        }}
                        onKeyDown={(e) => {
                          if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
                            e.preventDefault();
                            const clean = tagInput.replace(/^#/, "").trim().toLowerCase();
                            if (clean) {
                              const current = formData.tags || [];
                              if (!current.some((t: string) => t.toLowerCase() === clean)) {
                                const updated = [...current, clean];
                                setFormData((prev: any) => ({ ...prev, tags: updated, lessonTags: updated }));
                              }
                            }
                            setTagInput("");
                          }
                        }}
                        placeholder="dama, dmbok, quality, governance"
                        className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-900 focus:outline-none focus:border-gray-900 shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (tagInput.trim()) {
                            const parts = tagInput.split(",").map((s: string) => s.replace(/^#/, "").trim().toLowerCase()).filter(Boolean);
                            const current = formData.tags || [];
                            const newTags = Array.from(new Set([...current, ...parts]));
                            setFormData((prev: any) => ({ ...prev, tags: newTags, lessonTags: newTags }));
                            setTagInput("");
                          }
                        }}
                        className="bg-white border border-gray-300 text-gray-800 text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors shadow-2xs cursor-pointer"
                      >
                        Add
                      </button>
                    </div>

                    {filteredTags.length > 0 && tagInput.trim().length > 0 && (
                      <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {filteredTags.map((tag: any) => (
                          <button
                            key={tag.id}
                            type="button"
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs font-medium text-gray-700 cursor-pointer"
                            onClick={() => {
                              const current = formData.tags || [];
                              const clean = tag.name.toLowerCase();
                              if (!current.some((t: string) => t.toLowerCase() === clean)) {
                                const updated = [...current, clean];
                                setFormData((prev: any) => ({ ...prev, tags: updated, lessonTags: updated }));
                              }
                              setTagInput("");
                            }}
                          >
                            #{tag.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {(formData.tags || []).map((tag: string) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 bg-[#e0f2fe] border border-[#bae6fd] text-[#0369a1] text-xs px-3 py-1 rounded-full font-bold shadow-2xs"
                      >
                        #{tag}
                        <button
                          type="button"
                          className="hover:text-red-700 font-extrabold ml-0.5"
                          onClick={() =>
                            setFormData((prev: any) => {
                              const remaining = (prev.tags || []).filter((t: string) => t !== tag);
                              return {
                                ...prev,
                                tags: remaining,
                                lessonTags: remaining,
                              };
                            })
                          }
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* SKILLS & ATTACHMENTS (AVAILABLE FOR ALL PUBLISH TYPES) */}
                <div className="space-y-1.5 relative">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5C5C]">
                    SKILLS STUDENTS WILL GAIN
                  </label>
                  <div className="relative">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={skillInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val.includes(",")) {
                            const parts = val.split(",").map((s: string) => s.trim()).filter(Boolean);
                            const current = formData.skillTags || [];
                            const updated = Array.from(new Set([...current, ...parts]));
                            setFormData((prev: any) => ({ ...prev, skillTags: updated, lessonSkills: updated }));
                            setSkillInput("");
                          } else {
                            setSkillInput(val);
                          }
                        }}
                        onKeyDown={(e) => {
                          if ((e.key === "Enter" || e.key === ",") && skillInput.trim()) {
                            e.preventDefault();
                            const clean = skillInput.trim();
                            if (clean) {
                              const current = formData.skillTags || [];
                              if (!current.some((s: string) => s.toLowerCase() === clean.toLowerCase())) {
                                const updated = [...current, clean];
                                setFormData((prev: any) => ({ ...prev, skillTags: updated, lessonSkills: updated }));
                              }
                            }
                            setSkillInput("");
                          }
                        }}
                        placeholder="Python, Machine Learning, Data Analysis"
                        className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-900 focus:outline-none focus:border-gray-900 shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (skillInput.trim()) {
                            const parts = skillInput.split(",").map((s: string) => s.trim()).filter(Boolean);
                            const current = formData.skillTags || [];
                            const updated = Array.from(new Set([...current, ...parts]));
                            setFormData((prev: any) => ({ ...prev, skillTags: updated, lessonSkills: updated }));
                            setSkillInput("");
                          }
                        }}
                        className="bg-white border border-gray-300 text-gray-800 text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors shadow-2xs cursor-pointer"
                      >
                        Add
                      </button>
                    </div>

                    {filteredSkills && filteredSkills.length > 0 && skillInput.trim().length > 0 && (
                      <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {filteredSkills.map((skill: any) => (
                          <button
                            key={skill.id}
                            type="button"
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs font-medium text-gray-700 cursor-pointer"
                            onClick={() => {
                              const current = formData.skillTags || [];
                              if (!current.some((s: string) => s.toLowerCase() === skill.name.toLowerCase())) {
                                const updated = [...current, skill.name];
                                setFormData((prev: any) => ({ ...prev, skillTags: updated, lessonSkills: updated }));
                              }
                              setSkillInput("");
                            }}
                          >
                            {skill.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {(formData.skillTags || []).map((skill: string) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1.5 bg-white border border-gray-300 text-[#141414] text-xs px-3 py-1 rounded-full font-medium shadow-2xs"
                      >
                        {skill}
                        <button
                          type="button"
                          className="hover:text-red-700 font-extrabold ml-0.5 text-gray-400 hover:text-gray-700"
                          onClick={() =>
                            setFormData((prev: any) => {
                              const remaining = (prev.skillTags || []).filter((s: string) => s !== skill);
                              return {
                                ...prev,
                                skillTags: remaining,
                                lessonSkills: remaining,
                              };
                            })
                          }
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* SUPPORTING MATERIALS (Unified multi-file management) */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5C5C]">
                      SUPPORTING MATERIALS
                    </label>
                    <span className="bg-[#F6E8C4] text-[#755A12] text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      OPTIONAL
                    </span>
                  </div>

                  {/* List of Existing and Newly Selected Attachments */}
                  {(((formData.existingAttachments && formData.existingAttachments.length > 0)) ||
                    ((formData.lessonAttachments && formData.lessonAttachments.length > 0))) && (
                      <div className="space-y-2 mb-2">
                        {/* Existing DB Attachments */}
                        {formData.existingAttachments?.map((att: any) => (
                          <div
                            key={att.id}
                            className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xs font-semibold text-gray-800 truncate">
                                {getDisplayFileName(att.name || att.fileName || att.originalFileName, "Supporting Material")}
                              </span>
                              {att.url && (
                                <a
                                  href={att.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs font-bold text-blue-600 hover:underline shrink-0 ml-1"
                                >
                                  Preview
                                </a>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setFormData((prev: any) => ({
                                  ...prev,
                                  existingAttachments: (prev.existingAttachments || []).filter((a: any) => a.id !== att.id),
                                  removedAttachmentIds: [...(prev.removedAttachmentIds || []), att.id],
                                }));
                              }}
                              className="text-xs font-semibold text-red-600 hover:text-red-800 px-2 py-0.5 rounded bg-red-50 hover:bg-red-100 transition-colors ml-2 cursor-pointer shrink-0"
                            >
                              Remove
                            </button>
                          </div>
                        ))}

                        {/* Newly selected Files */}
                        {formData.lessonAttachments?.map((file: File, index: number) => (
                          <div
                            key={`new-${index}-${file.name}`}
                            className="flex items-center justify-between p-3 bg-blue-50/50 border border-blue-200 rounded-xl"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-sm">📎</span>
                              <span className="text-xs font-semibold text-gray-800 truncate">{file.name}</span>
                              <span className="text-[11px] text-gray-500 shrink-0">
                                ({(file.size / (1024 * 1024)).toFixed(1)} MB)
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setFormData((prev: any) => ({
                                  ...prev,
                                  lessonAttachments: (prev.lessonAttachments || []).filter((_: any, idx: number) => idx !== index),
                                }));
                              }}
                              className="text-xs font-semibold text-red-600 hover:text-red-800 px-2 py-0.5 rounded bg-red-50 hover:bg-red-100 transition-colors ml-2 cursor-pointer shrink-0"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                  <label
                    htmlFor="attachments-upload"
                    className="border border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-gray-400 transition-colors cursor-pointer bg-white block"
                  >
                    <span className="text-sm font-medium text-[#5C5C5C]">
                      + Add supporting material · PDF / slides / documents · up to 25 MB
                    </span>
                    <input
                      id="attachments-upload"
                      type="file"
                      multiple
                      accept=".pdf,.ppt,.pptx,.doc,.docx,application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length > 0) {
                          setFormData((prev: any) => ({
                            ...prev,
                            lessonAttachments: [...(prev.lessonAttachments || []), ...files],
                          }));
                        }
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* STUDY CONTENT TRIGGER CARD */}
            {publishType !== "standalone-course" && (
              <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-2xs space-y-4 transition-all duration-200 hover:shadow-md hover:border-gray-300/80">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <label className="flex items-start gap-3.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={studyBlocks.length > 0}
                      onChange={handleStudyContentToggle}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-emerald-600" />
                        <h3 className="text-base font-bold text-gray-900">
                          Add Study Content
                        </h3>
                        <span className="bg-[#F6E8C4] text-[#755A12] text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          OPTIONAL
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 font-medium mt-1 leading-relaxed">
                        Add structured reading sections, detailed explanations, and images with captions alongside this lesson.
                      </p>
                    </div>
                  </label>

                  {studyBlocks.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowStudyContentModal(true)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-4 py-2 text-xs font-bold transition-all shadow-2xs cursor-pointer shrink-0"
                    >
                      Edit Study Content ({studyBlocks.length} block{studyBlocks.length !== 1 ? "s" : ""})
                    </button>
                  )}
                </div>

                {studyBlocks.length > 0 && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-emerald-900">
                          Study Content Configured
                        </p>
                        <p className="text-[11px] text-emerald-700">
                          {studyBlocks.length} block{studyBlocks.length !== 1 ? "s" : ""} in sequence
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowStudyContentModal(true)}
                      className="text-xs font-bold text-emerald-800 hover:underline cursor-pointer"
                    >
                      Open Editor →
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* LESSON STRUCTURE / COURSE HIERARCHY PREVIEW (Matching Screenshot 360) */}
            <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-2xs space-y-4 transition-all duration-200 hover:shadow-md hover:border-gray-300/80">
              <h3 className="text-base font-bold text-[#141414]">
                {publishType === "standalone-lesson" ? "Lesson structure" : "Course hierarchy preview"}
              </h3>

              <div className="bg-[#FAF9F7] border border-gray-200/80 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#fef3c7] text-[#92400e] border border-[#fde68a] flex items-center justify-center font-bold text-[16px]">
                      {publishType === "standalone-lesson" ? "📄" : "📁"}
                    </div>
                    <span className="font-bold text-gray-900 text-[16px]">
                      {formData.lessonTitle || formData.courseTitle || formData.careerPathTitle || (publishType === "standalone-lesson" ? "Untitled lesson" : "Untitled course")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-white border border-gray-300 text-gray-700 text-xs font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
                      {publishType === "career-path" ? "CAREER PATH" : publishType === "standalone-lesson" ? "LESSON" : "COURSE"}
                    </span>
                  </div>
                </div>

                {publishType === "standalone-lesson" ? (
                  <div className="pl-11 space-y-2 font-medium text-gray-600 border-l-2 border-gray-200 ml-4">
                    <div className="flex items-center justify-between py-1">
                      <span className="text-[16px]">Lesson content</span>
                      <span className="bg-[#F6E8C4] text-[#755A12] text-xs font-bold px-3 py-0.5 rounded-full border border-[#fde68a]">
                        {formData.lessonType || "Video"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-[16px]">Assessment</span>
                      <span className="bg-[#F6E8C4] text-[#755A12] text-xs font-bold px-3 py-0.5 rounded-full border border-[#fde68a]">
                        {formData.assessmentRequired ? "Required" : "Optional"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="pl-11 space-y-2 font-medium text-gray-600 border-l-2 border-gray-200 ml-4">
                    <div className="flex items-center justify-between py-1">
                      <span className="text-[16px] text-[#141414]">Lesson 1</span>
                      <span className="bg-[#F6E8C4] text-[#755A12] text-xs font-semibold px-3 py-0.5 rounded-full">
                        Video + Text
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-[16px] text-[#141414]">Lesson 2</span>
                      <span className="bg-[#F6E8C4] text-[#755A12] text-xs font-semibold px-3 py-0.5 rounded-full">
                        Video + Text
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1 text-gray-400">
                      <span className="text-[16px] text-gray-500">More lessons</span>
                      <span className="bg-gray-100 text-gray-600 text-xs font-medium px-3 py-0.5 rounded-full">Added in step 2</span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-[16px] text-[#141414]">Assessment</span>
                      <span className="bg-[#F6E8C4] text-[#755A12] text-xs font-semibold px-3 py-0.5 rounded-full">
                        Optional
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <p className="text-sm text-[#5C5C5C] font-normal">
                {publishType === "standalone-lesson"
                  ? "Live preview of how this lesson is structured. Lessons are added in step 2."
                  : "Live preview of how this course is structured. Lessons are added in step 2."}
              </p>
            </div>
          </form>
        </div>
      )}

      {/* STEP 2: LESSONS */}
      {(activeSection as string) === "lessons" && (
        <div className="w-full">
          <CourseBuilderLessons
            publishType={publishType}
            courseId={createdCourseId}
            lessonId={createdLessonId}
            careerPathId={createdCareerPathId}
            lessons={courseLessons}
            careerPathCourseIds={formData.existingCourseIds}
            constituentLessonIds={formData.existingLessonIds}
            inlineCourseTitle={formData.courseTitle}
            onAdd={handleAddLesson}
            onEdit={handleEditLesson}
            onDelete={handleDeleteLesson}
            onUpdateCourses={(courseIds) => updateForm({ existingCourseIds: courseIds })}
            previewLessonIds={formData.previewLessonIds || []}
            setPreviewLessonIds={(ids) => updateForm({ previewLessonIds: ids })}
            courseOptions={courseOptions}
            onUpdateLesson={onUpdateLesson}
            onMapExistingLessons={onMapExistingLessons}
            subjects={subjects}
            categories={categories}
          />
        </div>
      )}

      {/* STEP 3: ASSESSMENT */}
      {(activeSection as string) === "assessment" && (
        <div className="w-full">
          <CourseBuilderAssessment
            createdCourseId={createdCourseId}
            createdLessonId={createdLessonId}
            createdCareerPathId={createdCareerPathId}
            publishType={publishType}
            assessmentQuestions={assessmentQuestions}
            setAssessmentQuestions={setAssessmentQuestions}
            assessmentSettings={assessmentSettings}
            setAssessmentSettings={setAssessmentSettings}
            onSaveDraft={onSaveDraft}
            isSaving={isSavingAssessment}
          />
        </div>
      )}

      {/* STEP 4: REVIEW */}
      {(activeSection as string) === "review" && (
        <div className="w-full">
          <CourseBuilderReview
            publishType={publishType}
            formData={formData}
            createdCourseId={createdCourseId}
            createdLessonId={createdLessonId}
            createdCareerPathId={createdCareerPathId}
            courseLessons={courseLessons}
            assessmentQuestions={assessmentQuestions}
          />
        </div>
      )}

      {/* Sticky Bottom Navigation Bar (Across Steps 1-3 only - Matching Screenshot 360, 373 & 113821) */}
      {activeSection !== "review" && (
        <div className="border-t border-[#e0e0e0] pt-6 pb-2 flex items-center justify-between">
          <span className="text-sm font-normal text-[#5C5C5C]">
            {publishType === "standalone-lesson"
              ? `Step ${currentStep} of ${totalSteps} · ${activeSection === "info" ? "Lesson content" : activeSection === "assessment" ? "Quiz" : "Review"}`
              : `Step ${currentStep} of ${totalSteps} · ${activeSection === "info" ? "Info" : activeSection === "lessons" ? "Lessons" : activeSection === "assessment" ? "Assessment" : "Review"}`}
          </span>

          <div className="flex items-center gap-3">
            {activeSection !== "info" && (
              <button
                type="button"
                onClick={() => goToStep(activeSection === "assessment" ? (publishType === "standalone-lesson" ? "info" : "lessons") : (publishType === "standalone-lesson" ? (formData.assessmentRequired ? "assessment" : "info") : (formData.assessmentRequired ? "assessment" : "lessons")))}
                className="bg-white border border-gray-300 text-[#141414] text-base font-semibold px-5 py-2.5 rounded-full hover:bg-gray-50 transition-colors cursor-pointer inline-flex items-center gap-2 shadow-2xs"
              >
                ← Back
              </button>
            )}
            <button
              type="button"
              disabled={isSavingAssessment}
              onClick={() => {
                if (isSavingAssessment) return;
                if (props.onNext) {
                  props.onNext();
                } else {
                  const isAssessment = formData.assessmentRequired !== false;
                  goToStep(
                    activeSection === "info"
                      ? (publishType === "standalone-lesson" ? (isAssessment ? "assessment" : "review") : "lessons")
                      : activeSection === "lessons"
                        ? (isAssessment ? "assessment" : "review")
                        : "review"
                  );
                }
              }}
              className="bg-[#FCF7AE] hover:bg-[#FDF9C4] border border-[#e5df8a] text-[#141414] text-base font-bold px-6 py-2.5 rounded-full shadow-2xs transition-colors cursor-pointer inline-flex items-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSavingAssessment ? (
                "Saving..."
              ) : (
                activeSection === "info"
                  ? (publishType === "standalone-lesson"
                    ? (isChildLesson ? "Save & Add to Course" : (formData.assessmentRequired ? "Next: Quiz →" : "Next: Review →"))
                    : "Next: Lessons →")
                  : activeSection === "lessons"
                    ? (publishType === "standalone-lesson"
                      ? (formData.assessmentRequired ? "Next: Quiz →" : "Next: Review →")
                      : "Next →")
                    : "Next: Review →"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Create Domain Modal */}
      {showDomainModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[1px] animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => !isSubmittingDomain && setShowDomainModal(false)} />
          <div className="relative bg-white rounded-2xl p-6 max-w-[420px] w-full shadow-2xl space-y-4 border border-gray-100 z-10">
            <h3 className="text-lg font-bold text-gray-900">Add New Domain</h3>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700">Domain Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={domainNameInput}
                onChange={(e) => setDomainNameInput(e.target.value)}
                placeholder="e.g. Technology & Engineering"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-medium text-gray-900 focus:outline-none focus:border-gray-900 shadow-2xs"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreateDomain();
                  }
                }}
              />
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDomainModal(false)}
                disabled={isSubmittingDomain}
                className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold px-4 py-2 rounded-full cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateDomain}
                disabled={isSubmittingDomain || !domainNameInput.trim()}
                className="bg-[#fff6a6] hover:bg-[#ffef76] border border-[#e4c438] text-[#171717] text-xs font-bold px-5 py-2 rounded-full cursor-pointer disabled:opacity-50"
              >
                {isSubmittingDomain ? "Creating..." : "Create Domain"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[1px] animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => !isSubmittingCategory && setShowCategoryModal(false)} />
          <div className="relative bg-white rounded-2xl p-6 max-w-[420px] w-full shadow-2xl space-y-4 border border-gray-100 z-10">
            <h3 className="text-lg font-bold text-gray-900">Add New Category</h3>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700">Category Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={categoryNameInput}
                onChange={(e) => setCategoryNameInput(e.target.value)}
                placeholder="e.g. Data Governance"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-medium text-gray-900 focus:outline-none focus:border-gray-900 shadow-2xs"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreateCategory();
                  }
                }}
              />
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                disabled={isSubmittingCategory}
                className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold px-4 py-2 rounded-full cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateCategory}
                disabled={isSubmittingCategory || !categoryNameInput.trim()}
                className="bg-[#fff6a6] hover:bg-[#ffef76] border border-[#e4c438] text-[#171717] text-xs font-bold px-5 py-2 rounded-full cursor-pointer disabled:opacity-50"
              >
                {isSubmittingCategory ? "Creating..." : "Create Category"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Subcategory Modal */}
      {showSubcategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[1px] animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => !isSubmittingSubcategory && setShowSubcategoryModal(false)} />
          <div className="relative bg-white rounded-2xl p-6 max-w-[420px] w-full shadow-2xl space-y-4 border border-gray-100 z-10">
            <h3 className="text-lg font-bold text-gray-900">Add New Subject</h3>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700">Subject Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={subcategoryNameInput}
                onChange={(e) => setSubcategoryNameInput(e.target.value)}
                placeholder="e.g. Master Data Management"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-medium text-gray-900 focus:outline-none focus:border-gray-900 shadow-2xs"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreateSubcategory();
                  }
                }}
              />
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowSubcategoryModal(false)}
                disabled={isSubmittingSubcategory}
                className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold px-4 py-2 rounded-full cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateSubcategory}
                disabled={isSubmittingSubcategory || !subcategoryNameInput.trim()}
                className="bg-[#fff6a6] hover:bg-[#ffef76] border border-[#e4c438] text-[#171717] text-xs font-bold px-5 py-2 rounded-full cursor-pointer disabled:opacity-50"
              >
                {isSubmittingSubcategory ? "Creating..." : "Create Subject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STUDY CONTENT MODAL */}
      {showStudyContentModal && (
        <div className="fixed inset-0 z-[9999] bg-white">
          <div className="flex h-screen w-screen flex-col bg-white">
            {/* HEADER */}
            <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 py-4 sm:px-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Study Content Editor
                  </h2>
                  <p className="text-xs text-gray-500">
                    Add unlimited structured text blocks and images in the exact order learners will see them.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowStudyContentModal(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all cursor-pointer"
                aria-label="Close study content editor"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SCROLLABLE CONTENT */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-gray-50/50">
              <div className="mx-auto w-full max-w-5xl space-y-8">
                {/* Lesson Title */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-600">
                    Lesson Title
                  </label>
                  <input
                    type="text"
                    value={formData.lessonTitle || formData.courseTitle || ""}
                    readOnly
                    placeholder="Enter lesson title first"
                    className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-800 outline-none"
                  />
                  {!(formData.lessonTitle || formData.courseTitle)?.trim() && (
                    <p className="mt-2 text-xs font-medium text-amber-600">
                      Enter the lesson title in Basic Information first. It will be used automatically as the study document title.
                    </p>
                  )}
                </div>

                {/* CONTENT FLOW */}
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <span>Content Flow Blocks</span>
                        <span className="rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5">
                          {studyBlocks.length}
                        </span>
                      </h3>
                      <p className="mt-0.5 text-xs text-gray-500">
                        Add text sections and images. Reorder them using the arrow controls.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={addStudyTextBlock}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-gray-900 hover:bg-black px-4 py-2 text-xs font-semibold text-white transition-all shadow-xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Text
                      </button>
                      <label className="inline-flex items-center gap-1.5 cursor-pointer rounded-xl border border-gray-300 bg-white hover:bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-700 transition-all shadow-xs">
                        <ImageIcon className="w-3.5 h-3.5 text-gray-500" />
                        Add Image
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          multiple
                          onChange={addStudyImages}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {studyBlocks.length === 0 ? (
                    <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white px-6 py-16 text-center shadow-xs">
                      <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-3 text-gray-400">
                        <FileText className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-gray-800">
                        No study content blocks added yet
                      </p>
                      <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto">
                        Click "+ Add Text" or "+ Add Image" above to compose reading material for this lesson.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {studyBlocks.map((block, index) => {
                        const isImage = block.blockType === "IMAGE";

                        return (
                          <div
                            key={block.id}
                            className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-xs hover:border-gray-300 transition-all"
                          >
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3.5">
                              <div className="flex items-center gap-2.5">
                                <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-700">
                                  #{index + 1}
                                </span>
                                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
                                  {isImage ? (
                                    <>
                                      <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                                      <span>Study Image</span>
                                    </>
                                  ) : (
                                    <>
                                      <FileText className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>Text Section</span>
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  disabled={index === 0}
                                  onClick={() => moveStudyBlock(block.id, "UP")}
                                  className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                  title="Move Up"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={index === studyBlocks.length - 1}
                                  onClick={() => moveStudyBlock(block.id, "DOWN")}
                                  className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                  title="Move Down"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeStudyBlock(block.id)}
                                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 transition-all cursor-pointer ml-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Remove
                                </button>
                              </div>
                            </div>

                            {!isImage ? (
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Section Heading (Optional)
                                  </label>
                                  <input
                                    type="text"
                                    value={block.title ?? ""}
                                    onChange={(event) =>
                                      updateStudyTextBlock(block.id, "title", event.target.value)
                                    }
                                    placeholder="e.g. Core Concepts & Overview"
                                    className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm focus:border-black focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Content Body
                                  </label>
                                  <textarea
                                    rows={5}
                                    value={block.textContent ?? ""}
                                    onChange={(event) =>
                                      updateStudyTextBlock(block.id, "textContent", event.target.value)
                                    }
                                    placeholder="Write detailed explanatory notes, bullet points, or takeaways..."
                                    className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm focus:border-black focus:outline-none resize-y font-normal leading-relaxed"
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center p-3">
                                  <img
                                    src={block.previewUrl || block.assetUrl}
                                    alt={(block.metadata?.caption as string) || "Study content"}
                                    className="max-h-[420px] w-full rounded-lg object-contain"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Image Caption (Optional)
                                  </label>
                                  <input
                                    type="text"
                                    value={(block.metadata?.caption as string) || ""}
                                    onChange={(event) =>
                                      updateStudyImageCaption(block.id, event.target.value)
                                    }
                                    placeholder="e.g. Diagram 1: Architectural diagram of the system"
                                    className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm focus:border-black focus:outline-none"
                                  />
                                </div>
                              </div>
                            )}

                            <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-3.5">
                              <button
                                type="button"
                                onClick={() => insertStudyTextBlockAfter(block.id)}
                                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-all cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                                Add Text Below
                              </button>
                              <label className="inline-flex items-center gap-1 cursor-pointer rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-all">
                                <ImageIcon className="w-3 h-3 text-gray-500" />
                                Add Image Below
                                <input
                                  type="file"
                                  accept="image/png,image/jpeg,image/webp"
                                  multiple
                                  onChange={(event) => insertStudyImagesAfter(event, block.id)}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* LEARNER PREVIEW */}
                {studyBlocks.length > 0 && (
                  <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-emerald-600" />
                        <h3 className="text-sm font-bold text-gray-900">
                          Learner Real-time Preview
                        </h3>
                      </div>
                      <span className="text-xs text-gray-400 font-medium">
                        Learner View Simulation
                      </span>
                    </div>

                    {(formData.lessonTitle || formData.courseTitle)?.trim() && (
                      <h2 className="mb-6 text-2xl font-extrabold text-gray-900 tracking-tight">
                        {formData.lessonTitle || formData.courseTitle}
                      </h2>
                    )}

                    <div className="space-y-6">
                      {studyBlocks.map((block) => {
                        if (block.blockType === "IMAGE") {
                          return (
                            <figure key={block.id} className="space-y-2">
                              <img
                                src={block.previewUrl || block.assetUrl}
                                alt={(block.metadata?.caption as string) || "Study content"}
                                className="max-h-[500px] w-full rounded-2xl object-contain border border-gray-100 bg-gray-50"
                              />
                              {block.metadata?.caption && (
                                <figcaption className="text-center text-xs text-gray-500 italic">
                                  {String(block.metadata.caption)}
                                </figcaption>
                              )}
                            </figure>
                          );
                        }
                        return (
                          <section key={block.id} className="space-y-2">
                            {block.title && (
                              <h3 className="text-lg font-bold text-gray-900">
                                {block.title}
                              </h3>
                            )}
                            {block.textContent && (
                              <p className="whitespace-pre-wrap leading-relaxed text-sm text-gray-700">
                                {block.textContent}
                              </p>
                            )}
                          </section>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* FIXED FOOTER */}
            <div className="flex shrink-0 items-center justify-between border-t border-gray-200 bg-white px-6 py-4 sm:px-8">
              <span className="text-xs text-gray-500">
                {studyBlocks.length} block{studyBlocks.length !== 1 ? "s" : ""} in current study document
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowStudyContentModal(false)}
                  className="rounded-xl border border-gray-300 px-5 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveStudyContent}
                  disabled={!(formData.lessonTitle || formData.courseTitle)?.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-gray-900 hover:bg-black px-6 py-2.5 text-xs font-bold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Save Study Content
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseBuilderStepRenderer;
