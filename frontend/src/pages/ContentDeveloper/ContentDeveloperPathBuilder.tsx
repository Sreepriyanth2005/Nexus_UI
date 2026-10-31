import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation, useParams } from "react-router";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Upload,
  Plus,
  X,
  Info,
  Loader2,
  Send,
  CheckCircle,
  FileText,
  Download,
  Trash2,
  Eye,
  Save,
  AlertTriangle,
} from "lucide-react";
import {
  getVersionHistoryApi,
  saveChangeSummaryApi,
} from "../../core/api/content-developer-workspace/versioning.api";
import { useSubjects } from "../../hooks/useSubjects";
import { useCourses } from "../../hooks/course/useCourses";
import { useProfile } from "../../hooks/profile/useProfile";
import { useLearningPath } from "../../hooks/admin-learning-path/useAdminLearningPath";
import { useDifficultyLevels } from "../../hooks/useEnums";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getTenantsApi } from "../../core/api/tenant.api";
import {
  getQuizzesApi,
  getQuizByIdApi,
  createQuizApi,
  updateQuizApi,
  createQuestionBankApi,
  createQuestionOptionApi,
  createQuizQuestionApi
} from "../../core/api/assessment.api";
import {
  createCareerPathApi,
  updateCareerPathApi,
  submitCareerPathForReviewApi,
  publishCareerPathApi,
  careerPathKeys,
} from "../../core/api/career-path/career-path.api";
import {
  reorderCareerPathCourseApi,
  updateCareerPathCourseApi,
  deleteCareerPathCourseApi,
  createCareerPathCourseApi,
} from "../../core/api/career-path/careerpath-course.api";
import { developerDashboardKeys } from "../../hooks/content-developer-workspace/useContentDeveloperDashboard";
import { getInternalUsers } from "../../core/api/internal-user/internalUser.api";
import { useUserStore } from "../../store/user.store";
import { deleteAssetApi, uploadAssetApi } from "../../core/api/asset/asset.api";
import { getDisplayFileName } from "../../utils/mediaDuration";

interface PathCourseItem {
  id: string;
  title: string;
  instructor: string;
  duration: string;
  durationMinutes?: number;
  isMandatory: boolean;
  order: number;
}

export const ContentDeveloperPathBuilder: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { pathId: paramPathId } = useParams<{ pathId?: string }>();
  const statePathId = location.state?.pathId;
  const pathId = paramPathId || statePathId;
  const isEditMode = Boolean(pathId);

  // Detect if this is a "published content edit" flow (Version 2+).
  // Can be initiated from CourseOverview modal OR detected directly if published version exists in DB (spec §10)
  const { data: cpVersionSnapshots = [] } = useQuery({
    queryKey: ["version-history", "career-path", pathId],
    queryFn: () => getVersionHistoryApi("career-path", pathId!),
    enabled: Boolean(pathId),
  });



  const inheritedChangeSummary: string = location.state?.changeSummary || "";
  const [cpChangeSummary, setCpChangeSummary] = useState(inheritedChangeSummary);
  const [isSavingCpSummary, setIsSavingCpSummary] = useState(false);

  useEffect(() => {
    if (!cpChangeSummary && cpVersionSnapshots.length > 0) {
      const latestWithSummary = [...cpVersionSnapshots].reverse().find((s: any) => s.changeSummary);
      if (latestWithSummary?.changeSummary) {
        setCpChangeSummary(latestWithSummary.changeSummary);
      }
    }
  }, [cpVersionSnapshots]);

  const handleSaveCpChangeSummary = async () => {
    if (!pathId) {
      toast.error("Please save the career path draft first before saving change summary.");
      return;
    }
    if (!cpChangeSummary || cpChangeSummary.trim().length < 5) {
      toast.error("Change summary must be at least 5 characters.");
      return;
    }
    setIsSavingCpSummary(true);
    try {
      await saveChangeSummaryApi("career-path", pathId, cpChangeSummary.trim());
      toast.success("Change summary saved to database.");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to save change summary.");
    } finally {
      setIsSavingCpSummary(false);
    }
  };

  const { profile } = useProfile();
  const currentUser = useUserStore((state) => state.user);
  const { subjects = [], createSubject } = useSubjects();
  const { data: difficultyLevels = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] } = useDifficultyLevels();
  const { data: tenants = [] } = useQuery({ queryKey: ["tenants"], queryFn: getTenantsApi });
  const { data: smeUsers = [] } = useQuery({
    queryKey: ["internal-users", "SME"],
    queryFn: () => getInternalUsers({ role: "SME" }),
  });

  const { courses: coursesQuery } = useCourses({ status: "PUBLISHED", isStandalone: "all", limit: 100 });
  const availableCourses: any[] = useMemo(() => {
    const raw = coursesQuery?.data as any;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.courses)) return raw.courses;
    if (Array.isArray(raw?.data)) return raw.data;
    return [];
  }, [coursesQuery?.data]);

  const { data: existingPath, isLoading: isPathLoading } = useLearningPath(
    pathId || ""
  );

  const existingPathStatus = (
    (existingPath as any)?.status ||
    (existingPath as any)?.data?.status
  )?.toUpperCase();

  const isPublishedEdit: boolean =
    Boolean(location.state?.isPublishedEdit) ||
    existingPathStatus === "PUBLISHED" ||
    (Array.isArray(cpVersionSnapshots) && cpVersionSnapshots.some((s: any) => s.version >= 1));

  // Form State - strictly aligning with the confirmed required fields
  const [name, setName] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("BEGINNER");
  const [whatIsIncluded, setWhatIsIncluded] = useState("");
  const [learningOutcome, setLearningOutcome] = useState("");
  const [authorName, setAuthorName] = useState("Nexus Academy");
  const [assessmentRequired, setAssessmentRequired] = useState(true);
  const [assessmentSettings, setAssessmentSettings] = useState({
    passingScore: "70",
    timeLimit: "30",
    attemptCount: "3",
    randomize: true,
    lockTab: true,
  });


  // Assessment Preview Modal State
  const [showAssessmentPreview, setShowAssessmentPreview] = useState(false);
  const [assessmentQuestions, setAssessmentQuestions] = useState<any[]>([]);
  const [isLoadingAssessment, setIsLoadingAssessment] = useState(false);

  // Tags (Individual chip items + comma-separated input)
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // Thumbnail & Attachment
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<any[]>([]);
  const [removedAttachmentIds, setRemovedAttachmentIds] = useState<string[]>([]);

  // Skills
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");

  // Metadata
  const [visibility, setVisibility] = useState("Public");
  const [selectedTenants, setSelectedTenants] = useState<string[]>([]);

  // Constituent Courses
  const [coursesList, setCoursesList] = useState<PathCourseItem[]>([]);
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);

  // Publish Settings (Right Column)
  const [status, setStatus] = useState("UNDER_REVIEW");
  const [reviewerId, setReviewerId] = useState("");
  const [price, setPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Domain Creation Modal State
  const [showDomainModal, setShowDomainModal] = useState(false);
  const [domainNameInput, setDomainNameInput] = useState("");
  const [isSubmittingDomain, setIsSubmittingDomain] = useState(false);

  const handleCreateDomain = async () => {
    if (!domainNameInput.trim() || !createSubject) return;
    setIsSubmittingDomain(true);
    try {
      const created: any = await createSubject({ name: domainNameInput.trim() });
      const newId = created?.id || created?.data?.id || (created as any)?.data?.data?.id || (created as any)?.subject?.id;
      if (newId) {
        setSubjectId(newId);
      }
      toast.success(`Domain "${domainNameInput.trim()}" created successfully.`);
      setDomainNameInput("");
      setShowDomainModal(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to create domain. Please try again.");
    } finally {
      setIsSubmittingDomain(false);
    }
  };

  const fetchAssessmentQuestions = async () => {
    setIsLoadingAssessment(true);
    setShowAssessmentPreview(true);
    try {
      let allCourseQuestions: any[] = [];
      for (const course of coursesList) {
        try {
          const res: any = await getQuizzesApi({ courseId: course.id });
          let quizzesArray = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : Array.isArray(res?.data?.data) ? res.data.data : Array.isArray(res?.data?.items) ? res.data.items : Array.isArray(res?.items) ? res.items : [];
          if (quizzesArray.length > 0) {
            const quiz = quizzesArray.find((q: any) => !q.lessonId && !q.lesson_id) || quizzesArray[0];
            const quizDetailRes: any = await getQuizByIdApi(quiz.id);
            const fullQuiz = quizDetailRes?.data || quizDetailRes;
            if (fullQuiz?.quizQuestions) {
              allCourseQuestions = [...allCourseQuestions, ...fullQuiz.quizQuestions];
            }
          }
        } catch (err) {
          console.error(`Failed to fetch quiz for course ${course.id}`, err);
        }
      }

      const sortedQQs = [...allCourseQuestions].sort(
        (a: any, b: any) => (a.sequenceOrder ?? 0) - (b.sequenceOrder ?? 0)
      );
      setAssessmentQuestions(sortedQQs);
    } catch (error) {
      console.error("Failed to fetch assessment questions:", error);
      toast.error("Failed to load assessment questions.");
    } finally {
      setIsLoadingAssessment(false);
    }
  };

  // Duration formatting helper
  const formatCourseDuration = (dur: any) => {
    if (dur === undefined || dur === null || dur === "") return "0 min";
    let num = typeof dur === "number" ? dur : parseFloat(String(dur).replace(/[^0-9.]/g, "") || "0");
    if (isNaN(num) || num <= 0) return "0 min";
    if (num >= 60) {
      const hrs = (num / 60).toFixed(1).replace(/\.0$/, "");
      return `${num} min (${hrs} hr${Number(hrs) !== 1 ? "s" : ""})`;
    }
    return `${num} min`;
  };

  const getCourseEffectiveDuration = (course: any): number => {
    if (!course) return 0;
    if (typeof course.duration === "number" && course.duration > 0) return course.duration;
    if (typeof course.duration === "string" && !isNaN(Number(course.duration)) && Number(course.duration) > 0) {
      return Number(course.duration);
    }
    if (Array.isArray(course.courseLessons) && course.courseLessons.length > 0) {
      return course.courseLessons.reduce((acc: number, cl: any) => acc + (Number(cl.lesson?.duration) || 0), 0);
    }
    return 0;
  };

  // Pure numeric total minutes computed from constituent courses (read-only)
  const computedDurationMinutes = useMemo(() => {
    return coursesList.reduce((sum, c) => {
      if (typeof c.durationMinutes === "number" && c.durationMinutes > 0) {
        return sum + c.durationMinutes;
      }
      const raw = String(c.duration || "");
      const match = raw.match(/(\d+(\.\d+)?)\s*min/i) || raw.match(/(\d+(\.\d+)?)/);
      let mins = match ? parseFloat(match[1]) : 0;
      return sum + (mins || 0);
    }, 0);
  }, [coursesList]);

  // Display string formatted in minutes (and hours if >= 60)
  const computedDuration = useMemo(() => {
    if (computedDurationMinutes <= 0) return "0 min";
    if (computedDurationMinutes >= 60) {
      const hrs = (computedDurationMinutes / 60).toFixed(1).replace(/\.0$/, "");
      return `${computedDurationMinutes} min (${hrs} hr${Number(hrs) !== 1 ? "s" : ""})`;
    }
    return `${computedDurationMinutes} min`;
  }, [computedDurationMinutes]);

  // Filter out courses already in path, and ensure only PUBLISHED courses are selectable
  const selectableCourses = useMemo(() => {
    const existingIds = new Set(coursesList.map((c) => c.id));
    return availableCourses.filter((c) => !existingIds.has(c.id) && c.status === "PUBLISHED");
  }, [availableCourses, coursesList]);

  // Load existing path data if editing
  useEffect(() => {
    if (existingPath) {
      const ep = existingPath as any;
      setName(ep.title || "");
      setSubjectId(ep.subjectId || ep.subject?.id || "");
      setDescription(ep.description || ep.fullDescription || "");
      setAuthorName((ep.authorName || ep.instructor || "Nexus Academy").trim());
      setWhatIsIncluded(
        Array.isArray(ep.whatIsIncluded)
          ? ep.whatIsIncluded.join("\n")
          : (ep.whatIsIncluded || "")
      );
      setLearningOutcome(
        Array.isArray(ep.learningOutcomes)
          ? ep.learningOutcomes.join("\n")
          : (Array.isArray(ep.learningOutcome) ? ep.learningOutcome.join("\n") : (ep.learningOutcome || ""))
      );
      setAssessmentRequired(ep.assessmentRequired ?? true);



      setDifficulty(ep.difficulty || "BEGINNER");
      setStatus(
        ep.status === "UNDER_REVIEW" || ep.status === "SUBMITTED" || ep.status === "In SME Review"
          ? "UNDER_REVIEW"
          : ep.status === "PUBLISHED"
            ? "PUBLISHED"
            : "DRAFT"
      );
      if (ep.visibility === "TENANT_ONLY") {
        setVisibility("Corporate");
      } else if (
        ep.visibility === "BOTH" ||
        (ep.careerPathTenants && ep.careerPathTenants.length > 0) ||
        (ep.tenantIds && ep.tenantIds.length > 0)
      ) {
        setVisibility("Public and Corporate");
      } else {
        setVisibility("Public");
      }

      if (ep.careerPathTenants && Array.isArray(ep.careerPathTenants) && ep.careerPathTenants.length > 0) {
        setSelectedTenants(
          ep.careerPathTenants.map((t: any) => t.tenantId || t.id).filter(Boolean)
        );
      } else if (ep.tenantIds && Array.isArray(ep.tenantIds)) {
        setSelectedTenants(ep.tenantIds);
      }


      // Previously uploaded Attachments
      const rawAttachments = ep.attachments || ep.careerPathAssets || ep.assets;
      if (rawAttachments && Array.isArray(rawAttachments) && rawAttachments.length > 0) {
        setExistingAttachments(
          rawAttachments.map((a: any) => ({
            id: a.id || a.assetId || "",
            filename: a.originalFileName || a.originalFilename || a.fileName || a.filename || "attachment",
            fileUrl: a.fileUrl || a.url || a.signedUrl || "",
            size: a.fileSize || a.size || 0,
            mimeType: a.mimeType || "",
          })).filter((att: any) => att.id)
        );
      }

      setPrice(ep.priceTier === "PAID" ? (ep.pricing || "Paid") : (ep.price || ep.pricing || ""));

      // Previously saved Tags
      if (ep.tags && Array.isArray(ep.tags) && ep.tags.length > 0) {
        setTags(ep.tags.map((t: any) => typeof t === "string" ? t : (t.name || t.tag?.name)).filter(Boolean));
      } else if (ep.careerPathTags && Array.isArray(ep.careerPathTags) && ep.careerPathTags.length > 0) {
        setTags(ep.careerPathTags.map((ct: any) => ct.tag?.name || ct.name).filter(Boolean));
      }

      // Previously saved Skills
      if (ep.skills && Array.isArray(ep.skills) && ep.skills.length > 0) {
        setSkills(ep.skills);
      } else if (ep.skillTags && Array.isArray(ep.skillTags) && ep.skillTags.length > 0) {
        setSkills(ep.skillTags.map((st: any) => st.skill?.name || st.name).filter(Boolean));
      }

      // Previously uploaded Thumbnail
      const existingThumb = ep.coverImageUrl || ep.coverImageAsset?.fileUrl || ep.thumbnailUrl || ep.thumbnail || "";
      if (existingThumb) {
        setThumbnailPreview(existingThumb);
      }

      // Previously saved Author Name
      const existingAuthor = (ep.authorName || ep.instructor || "").trim();
      setAuthorName(existingAuthor || "Nexus Academy");

      if (ep.courses && ep.courses.length > 0) {
        const sortedCourses = [...ep.courses].sort((a: any, b: any) => {
          const seqA = a.sequenceOrder ?? a.sequence ?? a.order ?? 0;
          const seqB = b.sequenceOrder ?? b.sequence ?? b.order ?? 0;
          return seqA - seqB;
        });

        setCoursesList(
          sortedCourses.map((c: any, index: number) => {
            const courseObj = c.course || c;
            const durMins = getCourseEffectiveDuration(courseObj);
            const courseDur = formatCourseDuration(durMins);

            return {
              id: c.courseId || c.id || `c-${index}`,
              title: courseObj.title || courseObj.name || `Course ${index + 1}`,
              instructor: courseObj.instructor || "Nexus Instructor",
              duration: courseDur,
              durationMinutes: durMins,
              isMandatory: c.isMandatory !== undefined ? c.isMandatory : true,
              order: c.sequenceOrder ?? c.sequence ?? c.order ?? index + 1,
            };
          })
        );
      }
    }
  }, [existingPath]);

  // Handle Tag Add/Remove
  const handleAddTag = (customInput?: string) => {
    const raw = customInput !== undefined ? customInput : tagInput;
    if (!raw.trim()) return;
    // Comma-separated splitting correctly preserves # prefixes, hyphens, and alphanumeric strings without truncation
    const parts = raw
      .split(",")
      .map((s) => s.trim().replace(/^['"]+|['"]+$/g, ""))
      .filter((s) => Boolean(s) && s.length > 0)
      .map((s) => s.startsWith("#") ? s : `#${s}`);
    setTags((prev) => {
      const next = [...prev];
      parts.forEach((p) => {
        if (!next.includes(p)) next.push(p);
      });
      return next;
    });
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  // Handle Skill Tag Add/Remove
  const handleAddSkill = (customInput?: string) => {
    const raw = customInput !== undefined ? customInput : skillInput;
    if (!raw.trim()) return;
    // Comma-separated splitting correctly preserves hyphens and special characters without truncation
    const parts = raw
      .split(",")
      .map((s) => s.trim().replace(/^['"]+|['"]+$/g, ""))
      .filter((s) => Boolean(s) && s.length > 0);
    setSkills((prev) => {
      const next = [...prev];
      parts.forEach((p) => {
        if (!next.includes(p)) next.push(p);
      });
      return next;
    });
    setSkillInput("");
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills((prev) => prev.filter((s) => s !== skillToRemove));
  };

  // Handle Tenant selection toggle
  const toggleTenant = (tenant: string) => {
    setSelectedTenants((prev) =>
      prev.includes(tenant)
        ? prev.filter((t) => t !== tenant)
        : [...prev, tenant]
    );
  };

  // Handle Course removal
  const handleRemoveCourse = (courseId: string) => {
    const effectivePathId = pathId || (existingPath as any)?.id;
    if (effectivePathId) {
      deleteCareerPathCourseApi(effectivePathId, courseId).catch((err) => {
        console.error("Failed to remove course mapping:", err);
      });
    }
    setCoursesList((prev) =>
      prev
        .filter((c) => c.id !== courseId)
        .map((c, idx) => ({ ...c, order: idx + 1 }))
    );
  };

  // Handle Toggle Mandatory/Optional
  const toggleCourseRequirement = (courseId: string) => {
    setCoursesList((prev) => {
      const target = prev.find((c) => c.id === courseId);
      const nextMandatory = target ? !target.isMandatory : false;
      const effectivePathId = pathId || (existingPath as any)?.id;
      if (effectivePathId) {
        updateCareerPathCourseApi(effectivePathId, courseId, {
          isMandatory: nextMandatory,
        }).catch((err) => {
          console.error("Failed to persist course mandatory change:", err);
        });
      }
      return prev.map((c) =>
        c.id === courseId ? { ...c, isMandatory: nextMandatory } : c
      );
    });
  };

  // Handle Adding Course from Available Courses
  const handleSelectCourseToAdd = (course: any) => {
    const durMins = getCourseEffectiveDuration(course);
    const dur = formatCourseDuration(durMins);
    const newCourseItem: PathCourseItem = {
      id: course.id,
      title: course.title || course.name || "Untitled Course",
      instructor: course.instructor || "Nexus Instructor",
      duration: dur,
      durationMinutes: durMins,
      isMandatory: true,
      order: coursesList.length + 1,
    };

    const effectivePathId = pathId || (existingPath as any)?.id;
    if (effectivePathId) {
      createCareerPathCourseApi(effectivePathId, {
        courseId: course.id,
        sequenceOrder: newCourseItem.order,
        isMandatory: true,
      }).catch((err) => {
        console.error("Failed to persist course add:", err);
      });
    }

    setCoursesList((prev) => [...prev, newCourseItem]);
    setShowAddCourseModal(false);
    toast.success(`Added "${newCourseItem.title}" to career path`);
  };

  // Course Reordering
  const moveCourseUp = (index: number) => {
    if (index <= 0) return;
    setCoursesList((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[index - 1];
      updated[index - 1] = temp;
      const reordered = updated.map((c, i) => ({ ...c, order: i + 1 }));

      const effectivePathId = pathId || (existingPath as any)?.id;
      if (effectivePathId) {
        reorderCareerPathCourseApi(
          effectivePathId,
          reordered.map((c) => c.id)
        ).catch((err) => {
          console.error("Failed to persist course reorder:", err);
          toast.error("Failed to persist course order to database");
        });
      }

      return reordered;
    });
  };

  const moveCourseDown = (index: number) => {
    if (index >= coursesList.length - 1) return;
    setCoursesList((prev) => {
      if (index >= prev.length - 1) return prev;
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[index + 1];
      updated[index + 1] = temp;
      const reordered = updated.map((c, i) => ({ ...c, order: i + 1 }));

      const effectivePathId = pathId || (existingPath as any)?.id;
      if (effectivePathId) {
        reorderCareerPathCourseApi(
          effectivePathId,
          reordered.map((c) => c.id)
        ).catch((err) => {
          console.error("Failed to persist course reorder:", err);
          toast.error("Failed to persist course order to database");
        });
      }

      return reordered;
    });
  };

  // Handle Thumbnail File
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };


  // Save / Submit Handler
  const saveCombinedAssessment = async (targetPathId: string) => {
    if (!coursesList || coursesList.length === 0) return;

    // 1. Fetch quizzes from all mapped courses
    let allCourseQuestions: any[] = [];
    for (const course of coursesList) {
      try {
        const res: any = await getQuizzesApi({ courseId: course.id });
        let quizzesArray = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : Array.isArray(res?.data?.data) ? res.data.data : Array.isArray(res?.data?.items) ? res.data.items : Array.isArray(res?.items) ? res.items : [];
        if (quizzesArray.length > 0) {
          const quiz = quizzesArray.find((q: any) => !q.lessonId && !q.lesson_id) || quizzesArray[0];
          const quizDetailRes: any = await getQuizByIdApi(quiz.id);
          const fullQuiz = quizDetailRes?.data || quizDetailRes;
          if (fullQuiz?.quizQuestions) {
            allCourseQuestions = [...allCourseQuestions, ...fullQuiz.quizQuestions];
          }
        }
      } catch (err) {
        console.error(`Failed to fetch quiz for course ${course.id}`, err);
      }
    }

    // 2. Check if career path already has a quiz
    let quizId = "";
    try {
      const res: any = await getQuizzesApi({ careerPathId: targetPathId });
      let quizzesArray = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : Array.isArray(res?.data?.data) ? res.data.data : Array.isArray(res?.data?.items) ? res.data.items : Array.isArray(res?.items) ? res.items : [];
      if (quizzesArray.length > 0) {
        quizId = quizzesArray[0].id;
      }
    } catch (err) {
      console.error("Failed to fetch existing career path quiz", err);
    }

    const quizPayload = {
      careerPathId: targetPathId,
      quizTitle: "Assessment",
      quizDescription: "",
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
      createdBy: currentUser?.id || profile?.id || (profile as any)?.userId || "",
    };

    // 3. Create or Update Quiz
    if (quizId) {
      await updateQuizApi({ quizId, payload: quizPayload });
    } else {
      const quizRes: any = await createQuizApi(quizPayload);
      quizId = quizRes?.data?.id || quizRes?.id;
    }

    // 4. If we found questions, add them to this quiz
    // To properly map questions, we would typically need to fetch the existing quiz questions
    // and only add new ones, or delete old ones and recreate. 
    // But since the request specifies: "if course mapped into careerpath that courses quiz all cumulative togather add and show the careerpath assessment"
    // We will just do a simplistic add of questions if they don't exist, 
    // or rely on a backend endpoint if available. 
    // Let's create QuizQuestions for each question we gathered.
    // For safety, we should ideally clear existing questions if we are syncing, 
    // but without a clear delete endpoint in scope we'll just append or skip based on existing logic.
    // I'll leave the exact question linking simple since the user didn't ask for full sync logic, just adding.
    try {
      const existingQuizRes: any = await getQuizByIdApi(quizId);
      const fullQuiz = existingQuizRes?.data || existingQuizRes;
      const existingQIds = new Set((fullQuiz?.quizQuestions || []).map((qq: any) => qq.questionId));

      for (const qq of allCourseQuestions) {
        if (!existingQIds.has(qq.questionId) && qq.questionId) {
          await createQuizQuestionApi({
            quizId,
            questionId: qq.questionId,
            sequenceOrder: qq.sequenceOrder || 0,
            points: qq.points || 1,
            isRequired: true
          });
          existingQIds.add(qq.questionId);
        }
      }
    } catch (e) {
      console.error("Failed to link questions to career path quiz", e);
    }
  };

  const handleSubmit = async (e?: React.FormEvent, forcedStatus?: string) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      toast.error("Career Path Name is required.");
      return;
    }
    if (!subjectId) {
      toast.error("Please select a Subject / Domain.");
      return;
    }

    const targetStatus = forcedStatus
      ? forcedStatus
      : status;

    if (targetStatus === "UNDER_REVIEW" || forcedStatus === "UNDER_REVIEW") {
      if (!description.trim()) {
        toast.error("Description is required before submitting for review.");
        return;
      }
      if (!learningOutcome.trim()) {
        toast.error("Learning outcome is required before submitting for review.");
        return;
      }
      if (coursesList.length === 0) {
        toast.error("Please add at least one course before submitting for review.");
        return;
      }
    }

    if (targetStatus === "PUBLISHED" || forcedStatus === "PUBLISHED") {
      if (isPublishedEdit) {
        toast.error(
          "This is a Version 2. You are not allowed to publish this version directly. Please submit it for SME Review."
        );
        return;
      }
      if (coursesList.length === 0) {
        toast.error("Please add at least one course before publishing.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      let mappedVisibility = "PUBLIC_CATALOG";
      let tenantIdsToSave: string[] | undefined = undefined;

      if (visibility === "Corporate") {
        mappedVisibility = "TENANT_ONLY";
        if (selectedTenants.length === 0) {
          toast.error("Please select at least one corporate tenant for Corporate visibility");
          setIsSubmitting(false);
          return;
        }
        tenantIdsToSave = selectedTenants;
      } else if (visibility === "Public and Corporate") {
        mappedVisibility = "BOTH";
        if (selectedTenants.length === 0) {
          toast.error("Please select at least one corporate tenant for Public and Corporate visibility");
          setIsSubmitting(false);
          return;
        }
        tenantIdsToSave = selectedTenants;
      } else {
        // Public
        mappedVisibility = "PUBLIC_CATALOG";
        tenantIdsToSave = [];
      }

      // Duration is auto-calculated from selected courses in real integer minutes
      const parsedDuration = Math.round(computedDurationMinutes) || 0;
      const parsedWhatIsIncluded = whatIsIncluded
        ? (typeof whatIsIncluded === "string" ? whatIsIncluded.split("\n").map((s) => s.trim()).filter(Boolean) : whatIsIncluded)
        : [];
      const parsedLearningOutcomes = learningOutcome
        ? (typeof learningOutcome === "string" ? learningOutcome.split("\n").map((s) => s.trim()).filter(Boolean) : learningOutcome)
        : [];

      const targetStatus = forcedStatus
        ? forcedStatus
        : status;

      const formattedCourses = coursesList.map((c, idx) => ({
        isExisting: true,
        courseId: c.id,
        sequenceOrder: c.order || idx + 1,
        isMandatory: c.isMandatory !== undefined ? c.isMandatory : true,
      }));

      // Resolve the authenticated user's DB ID:
      // useUserStore.user.id is always available (persisted in localStorage from login).
      // profile?.id is the same value but may be undefined if profile hasn't loaded yet.
      const createdByIdVal =
        currentUser?.id ||
        profile?.id ||
        (profile as any)?.userId ||
        "";

      // The backend also injects createdById from the JWT, but guard here for clear UX
      if (!createdByIdVal) {
        toast.error("Authentication session not found. Please refresh and try again.");
        setIsSubmitting(false);
        return;
      }

      let requestData: any;

      if (thumbnailFile) {
        const formData = new FormData();
        formData.append("careerPathCoverImage", thumbnailFile);
        formData.append("title", name.trim());
        formData.append("description", description.trim());
        formData.append("fullDescription", description.trim());
        if (subjectId) formData.append("subjectId", subjectId);
        if ((existingPath as any)?.categoryId) formData.append("categoryId", (existingPath as any).categoryId);
        if ((existingPath as any)?.language) formData.append("language", (existingPath as any).language);
        if (tenantIdsToSave && tenantIdsToSave.length > 0) {
          formData.append("tenantIds", JSON.stringify(tenantIdsToSave));
        }
        formData.append("difficulty", difficulty);
        formData.append("status", targetStatus);
        formData.append("estimatedDuration", String(parsedDuration));
        formData.append("visibility", mappedVisibility);
        formData.append("assessmentRequired", String(assessmentRequired));

        formData.append("whatIsIncluded", JSON.stringify(parsedWhatIsIncluded));
        formData.append("learningOutcomes", JSON.stringify(parsedLearningOutcomes));
        formData.append("skills", JSON.stringify(skills));
        formData.append("tags", JSON.stringify(tags));
        formData.append("courses", JSON.stringify(formattedCourses));
        if (createdByIdVal) formData.append("createdById", createdByIdVal);
        formData.append("authorName", authorName.trim() || "Nexus Academy");
        if (price) formData.append("priceTier", price === "Paid" ? "PAID" : "FREE");

        requestData = formData;
      } else {
        requestData = {
          createdById: createdByIdVal,
          title: name.trim(),
          description: description.trim(),
          fullDescription: description.trim(),
          subjectId: subjectId || undefined,
          categoryId: (existingPath as any)?.categoryId || undefined,
          language: (existingPath as any)?.language || undefined,
          tenantIds: tenantIdsToSave,
          difficulty: difficulty,
          status: targetStatus,
          estimatedDuration: parsedDuration,
          duration: parsedDuration,
          visibility: mappedVisibility,
          assessmentRequired: assessmentRequired,
          whatIsIncluded: parsedWhatIsIncluded,
          learningOutcomes: parsedLearningOutcomes,
          skills,
          tags,
          courses: formattedCourses,
          authorName: authorName.trim() || "Nexus Academy",
          priceTier: price === "Paid" ? "PAID" : "FREE",
        };
      }

      let savedPathId = pathId;
      if (isEditMode && pathId) {
        await updateCareerPathApi({
          id: pathId,
          data: requestData,
        });
      } else {
        const createRes = await createCareerPathApi(requestData);
        savedPathId = createRes?.data?.id || createRes?.id;
      }

      if (assessmentRequired && savedPathId) {
        try {
          await saveCombinedAssessment(savedPathId);
        } catch (e) {
          console.error("Failed to save combined assessment", e);
        }
      }

      if (targetStatus === "UNDER_REVIEW" && savedPathId) {
        await submitCareerPathForReviewApi({
          careerPathId: savedPathId,
          reviewerId: reviewerId || undefined,
        });
      } else if (targetStatus === "PUBLISHED" && savedPathId && createdByIdVal) {
        await publishCareerPathApi({
          id: savedPathId,
          publishedById: createdByIdVal,
        });
      }

      if (attachmentFiles.length > 0 && savedPathId) {
        for (const file of attachmentFiles) {
          try {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("careerPathId", savedPathId);
            fd.append("uploadedBy", createdByIdVal);
            fd.append("assetContext", "CAREER_PATH");
            fd.append("assetType", "DOCUMENT");
            fd.append("storagePath", "attachments");
            await uploadAssetApi(fd);
          } catch (attErr) {
            console.error("Career path attachment upload error:", attErr);
          }
        }
        setAttachmentFiles([]);
      }

      if (removedAttachmentIds.length > 0) {
        await Promise.allSettled(
          removedAttachmentIds.map((attId) => deleteAssetApi(attId))
        );
        setRemovedAttachmentIds([]);
      }


      toast.success(
        targetStatus === "UNDER_REVIEW"
          ? "Career path submitted for SME review successfully!"
          : targetStatus === "PUBLISHED"
            ? "Career path published successfully!"
            : "Career path saved as Draft successfully!"
      );

      queryClient.invalidateQueries({ queryKey: developerDashboardKeys.all });
      queryClient.invalidateQueries({ queryKey: careerPathKeys.all });
      if (savedPathId) {
        queryClient.invalidateQueries({ queryKey: ["career-path", savedPathId] });
      }

      navigate("/studio");
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Failed to save career path");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isPathLoading && pathId) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          <p className="text-sm text-gray-500 font-medium font-sans">Loading career path...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-6 pb-24 font-sans">

      {/* Back Breadcrumb */}
      <button
        type="button"
        onClick={() => navigate("/studio")}
        className="flex items-center gap-1.5 text-xs font-bold text-[#5C5C5C] hover:text-[#141414] transition-colors uppercase tracking-wider cursor-pointer mb-5"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        CAREER PATHS
      </button>

      {/* Page Header */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-[#5C5C5C] mb-1.5">
          CAREER PATHS
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-[#141414] mb-2">
          {isEditMode ? "Edit career path" : "Create career path"}
        </h1>
        <p className="text-base text-[#3A3A3A] font-normal leading-relaxed">
          Define a guided sequence of courses, set the audience and access level, then save as Draft, publish, or submit for SME review.
        </p>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* Left Column (2 Cols) — Form Cards */}
        <div className="lg:col-span-2 space-y-6">

          {/* CARD 1: Basic Information */}
          <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-2xs space-y-5 transition-all duration-300 hover:shadow-md hover:border-gray-300">
            <h2 className="text-base font-bold text-[#141414] tracking-tight">
              Basic Information
            </h2>

            {/* Name, Subject/Domain, Difficulty Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5C5C]">
                  CAREER PATH NAME <span className="text-[#C99B2E] font-bold">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. CDMP Pathway"
                  className="w-full h-[42px] bg-white border border-gray-300 rounded-xl px-4 text-sm font-semibold text-[#141414] placeholder:text-gray-400 focus:outline-none focus:border-[#141414] shadow-2xs transition-colors"
                />
                <p className="text-sm text-[#5C5C5C] font-normal pt-0.5">
                  Unique and understandable to learners and admins
                </p>
              </div>

              <div className="sm:col-span-2 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5C5C]">
                    SUBJECT / DOMAIN <span className="text-[#C99B2E] font-bold">*</span>
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
                  value={subjectId}
                  onChange={(e) => {
                    if (e.target.value === "__new_domain__") {
                      setShowDomainModal(true);
                    } else {
                      setSubjectId(e.target.value);
                    }
                  }}
                  className="w-full h-[40px] bg-white border border-gray-300 rounded-xl px-3.5 text-sm font-semibold text-[#141414] focus:outline-none focus:border-[#141414] shadow-2xs cursor-pointer transition-colors"
                >
                  <option value="">Select domain / subject...</option>
                  {subjects.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name || s.title}
                    </option>
                  ))}
                  <option value="__new_domain__">+ Add New Domain</option>
                </select>
              </div>

              <div className="sm:col-span-2 space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5C5C]">
                  DIFFICULTY LEVEL <span className="text-[#C99B2E] font-bold">*</span>
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full h-[40px] bg-white border border-gray-300 rounded-xl px-3.5 text-sm font-semibold text-[#141414] focus:outline-none focus:border-[#141414] shadow-2xs cursor-pointer transition-colors"
                >
                  {difficultyLevels.map((lvl: any) => (
                    <option key={lvl} value={lvl}>
                      {String(lvl).charAt(0).toUpperCase() + String(lvl).slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5C5C]">
                DESCRIPTION <span className="text-[#C99B2E] font-bold">*</span>
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Purpose and expected learning outcome of the path"
                className="w-full bg-white border border-gray-300 rounded-xl p-3.5 text-sm font-semibold text-[#141414] placeholder:text-gray-400 focus:outline-none focus:border-[#141414] shadow-2xs resize-none transition-colors"
              />
            </div>

            {/* What is Included (Optional) */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5C5C]">
                  WHAT IS INCLUDED
                </label>
                <span className="bg-[#F6E8C4] text-[#755A12] text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  OPTIONAL
                </span>
              </div>
              <textarea
                rows={2}
                value={whatIsIncluded}
                onChange={(e) => setWhatIsIncluded(e.target.value)}
                placeholder="Path benefits: number of courses, lessons, downloadable resources, hands-on projects, certificates, support"
                className="w-full bg-white border border-gray-300 rounded-xl p-3.5 text-sm font-semibold text-[#141414] placeholder:text-gray-400 focus:outline-none focus:border-[#141414] shadow-2xs resize-none transition-colors"
              />
            </div>

            {/* Learning Outcome */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5C5C]">
                LEARNING OUTCOME <span className="text-[#C99B2E] font-bold">*</span>
              </label>
              <textarea
                rows={2}
                value={learningOutcome}
                onChange={(e) => setLearningOutcome(e.target.value)}
                placeholder="Specific, measurable, learner-focused statement of what learner can do upon completion"
                className="w-full bg-white border border-gray-300 rounded-xl p-3.5 text-sm font-semibold text-[#141414] placeholder:text-gray-400 focus:outline-none focus:border-[#141414] shadow-2xs resize-none transition-colors"
              />
            </div>

            {/* Estimated Duration (auto-calculated from selected courses, read-only) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5C5C]">
                ESTIMATED DURATION
              </label>
              <input
                type="text"
                value={computedDuration}
                readOnly
                disabled
                className="w-full h-[42px] border border-gray-200 rounded-xl px-4 text-sm font-semibold text-gray-500 bg-gray-50/80 cursor-not-allowed shadow-2xs"
              />
              <p className="text-sm text-[#5C5C5C] font-normal pt-0.5">
                Auto-calculated — aggregate of all constituent course durations.
              </p>
            </div>
          </div>

          {/* CARD 2: LEARNING METADATA */}
          <div className="bg-white border border-gray-200/90 rounded-2xl p-6 space-y-5 shadow-2xs transition-all duration-300 hover:shadow-md hover:border-gray-300">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5C5C5C]">
              LEARNING METADATA
            </h3>

            {/* Visibility & Corporate Tenants */}
            <div className={`grid grid-cols-1 ${visibility !== "Public" ? "sm:grid-cols-2" : "sm:grid-cols-1"} gap-4`}>
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5C5C]">
                  VISIBILITY <span className="text-[#C99B2E] font-bold">*</span>
                </label>
                <select
                  value={visibility}
                  onChange={(e) => {
                    const val = e.target.value;
                    setVisibility(val);
                    if (val === "Public") {
                      setSelectedTenants([]);
                    }
                  }}
                  className="w-full h-[40px] bg-white border border-gray-300 rounded-xl px-3.5 text-sm font-semibold text-[#141414] focus:outline-none focus:border-[#141414] shadow-2xs cursor-pointer transition-colors"
                >
                  <option value="Public">Public (open to all learners)</option>
                  <option value="Corporate">Corporate (restricted to selected tenants)</option>
                  <option value="Public and Corporate">Public and Corporate (both)</option>
                </select>
                <p className="text-sm text-[#5C5C5C] font-normal pt-0.5">
                  {visibility === "Corporate"
                    ? "Career Path is listed only for the selected Corporate audience."
                    : visibility === "Public and Corporate"
                      ? "Career Path is publicly available and also assigned to the selected Corporate audience."
                      : "Career Path is listed for everyone in the public catalog without tenant restriction."}
                </p>
              </div>

              {visibility !== "Public" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5C5C]">
                      CORPORATE TENANTS <span className="text-[#C99B2E] font-bold">*</span>
                    </label>
                    <span className="bg-[#F6E8C4] text-[#755A12] text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {visibility === "Corporate" ? "REQUIRED" : "OPTIONAL"}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {tenants && tenants.length > 0 ? (
                      <>
                        {/* ALL quick-select button */}
                        {(() => {
                          const allIds = (tenants as any[]).map((t: any) => t.id);
                          const allSelected = allIds.length > 0 && allIds.every((id: string) => selectedTenants.includes(id));
                          return (
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedTenants(allSelected ? [] : allIds)
                              }
                              className={`text-xs font-bold px-3.5 py-1.5 rounded-full border transition-colors cursor-pointer ${allSelected
                                  ? "bg-[#755A12] border-[#755A12] text-white shadow-sm"
                                  : "bg-white border-[#e5df8a] text-[#755A12] hover:bg-[#FDF6E3] hover:border-[#c9a94e]"
                                }`}
                            >
                              {allSelected && <span className="mr-1">✓</span>}
                              All
                            </button>
                          );
                        })()}
                        {/* Individual tenant chips */}
                        {(tenants as any[]).map((t: any) => {
                          const isSelected = selectedTenants.includes(t.id);
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => toggleTenant(t.id)}
                              className={`text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-colors cursor-pointer ${isSelected
                                ? "bg-[#FCF7AE] border-[#e5df8a] text-[#141414] font-bold shadow-2xs"
                                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 shadow-2xs"
                                }`}
                            >
                              {isSelected && <span className="mr-1">✓</span>}
                              {t.name}
                            </button>
                          );
                        })}
                      </>
                    ) : (
                      <span className="text-xs text-gray-400 italic">No corporate tenants available</span>
                    )}
                  </div>
                  <p className="text-sm text-[#5C5C5C] font-normal pt-0.5">
                    {(() => {
                      const count = selectedTenants.length;
                      const total = (tenants as any[])?.length || 0;
                      const isAll = total > 0 && count === total;
                      if (count === 0) return "Select one or more corporate tenants to assign this career path.";
                      return isAll
                        ? `All ${total} tenant${total !== 1 ? "s" : ""} selected \u2014 career path visible to all corporate portals.`
                        : `${count} of ${total} tenant${total !== 1 ? "s" : ""} selected.`;
                    })()}
                  </p>
                </div>
              )}
            </div>

            {/* Assessment Required */}
            <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-4">
              <div>
                <h4 className="text-[15px] font-bold text-[#141414]">Assessment (optional)</h4>
                <p className="text-sm text-gray-500 font-normal mt-0.5">
                  Include a final assessment for this career path.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAssessmentRequired(!assessmentRequired)}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${assessmentRequired ? "bg-[#82a27a]" : "bg-gray-300"
                  }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${assessmentRequired ? "translate-x-6" : "translate-x-1"
                    }`}
                />
              </button>
            </div>

            {/* Quiz Settings */}
            {assessmentRequired && (
              <div className="bg-white border border-gray-200/90 rounded-xl p-5 shadow-2xs space-y-4 transition-all duration-200">
                <h3 className="text-[15px] font-bold text-[#141414]">
                  Assessment settings
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5C5C]">
                      PASSING SCORE <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={assessmentSettings.passingScore}
                        onChange={(e) => setAssessmentSettings((prev) => ({ ...prev, passingScore: e.target.value }))}
                        placeholder="70"
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 pr-8 text-sm font-semibold text-[#141414] focus:outline-none focus:border-[#141414] shadow-2xs"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#5C5C5C] pointer-events-none">
                        %
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5C5C]">
                      TIME LIMIT
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="300"
                        value={assessmentSettings.timeLimit}
                        onChange={(e) => setAssessmentSettings((prev) => ({ ...prev, timeLimit: e.target.value }))}
                        placeholder="30"
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 pr-16 text-sm font-semibold text-[#141414] focus:outline-none focus:border-[#141414] shadow-2xs"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#5C5C5C] pointer-events-none">
                        minutes
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5C5C]">
                      RETRY ATTEMPTS <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={assessmentSettings.attemptCount}
                      onChange={(e) => setAssessmentSettings((prev) => ({ ...prev, attemptCount: e.target.value }))}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-[#141414] focus:outline-none focus:border-[#141414] cursor-pointer shadow-2xs appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%239CA3AF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:9px_9px] bg-[right_1rem_center] bg-no-repeat pr-8"
                    >
                      <option value="1">1 attempt</option>
                      <option value="2">2 attempts</option>
                      <option value="3">3 attempts</option>
                      <option value="5">5 attempts</option>
                      <option value="10">10 attempts</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-3">
                  <label className="flex items-center gap-2.5 text-sm font-medium text-[#3A3A3A] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={assessmentSettings.randomize}
                      onChange={(e) => setAssessmentSettings((prev) => ({ ...prev, randomize: e.target.checked }))}
                      className="sr-only"
                    />
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center transition-colors cursor-pointer ${assessmentSettings.randomize
                          ? "bg-[#2d7a4f] text-white"
                          : "border border-gray-300 bg-white"
                        }`}
                    >
                      {assessmentSettings.randomize && (
                        <span className="text-[10px] font-extrabold leading-none">✓</span>
                      )}
                    </div>
                    <span>Randomise question order</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-sm font-medium text-[#3A3A3A] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={assessmentSettings.lockTab}
                      onChange={(e) => setAssessmentSettings((prev) => ({ ...prev, lockTab: e.target.checked }))}
                      className="sr-only"
                    />
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center transition-colors cursor-pointer ${assessmentSettings.lockTab
                          ? "bg-[#2d7a4f] text-white"
                          : "border border-gray-300 bg-white"
                        }`}
                    >
                      {assessmentSettings.lockTab && (
                        <span className="text-[10px] font-extrabold leading-none">✓</span>
                      )}
                    </div>
                    <span>Lock browser tab during quiz</span>
                  </label>
                </div>
              </div>
            )}

            {/* Author Name */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5C5C]">
                AUTHOR NAME <span className="text-[#C99B2E] font-bold">*</span>
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Nexus Academy"
                className="w-full h-[42px] bg-white border border-gray-300 rounded-xl px-4 text-sm font-semibold text-[#141414] placeholder:text-gray-400 focus:outline-none focus:border-[#141414] shadow-2xs transition-colors"
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5C5C]">
                TAGS
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.includes(",")) {
                      handleAddTag(val);
                    } else {
                      setTagInput(val);
                    }
                  }}
                  onKeyDown={(e) => {
                    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Add tag (comma-separated or press Enter)"
                  className="flex-1 h-[42px] bg-white border border-gray-300 rounded-xl px-4 text-sm font-semibold text-[#141414] placeholder:text-gray-400 focus:outline-none focus:border-[#141414] shadow-2xs transition-colors"
                />
                <button
                  type="button"
                  onClick={() => handleAddTag()}
                  className="h-[42px] px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-[#141414] font-bold text-sm rounded-xl transition-colors cursor-pointer shadow-2xs active:scale-95"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 bg-[#eaf0e6] border border-[#d2e0cc] text-[#446038] text-xs font-semibold px-3 py-1 rounded-full"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-[#446038] hover:text-red-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Thumbnail Upload */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5C5C]">
                THUMBNAIL <span className="text-[#C99B2E] font-bold">*</span>
              </label>
              <label className="border border-dashed border-gray-300 hover:border-gray-400 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-white block shadow-2xs">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  className="hidden"
                />
                {thumbnailPreview ? (
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail Preview"
                    className="max-h-36 rounded-xl object-cover mb-2 border border-gray-200"
                  />
                ) : (
                  <div className="text-center space-y-1">
                    <p className="text-xs font-normal text-[#5C5C5C]">
                      Upload thumbnail image, 16:10, min 1280x800
                    </p>
                  </div>
                )}
              </label>
            </div>

            {/* Skills Students Will Gain */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5C5C]">
                SKILLS STUDENTS WILL GAIN
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.includes(",")) {
                      handleAddSkill(val);
                    } else {
                      setSkillInput(val);
                    }
                  }}
                  onKeyDown={(e) => {
                    if ((e.key === "Enter" || e.key === ",") && skillInput.trim()) {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                  placeholder="Add a skill (comma-separated or press Enter)"
                  className="flex-1 h-[42px] bg-white border border-gray-300 rounded-xl px-4 text-sm font-semibold text-[#141414] placeholder:text-gray-400 focus:outline-none focus:border-[#141414] shadow-2xs transition-colors"
                />
                <button
                  type="button"
                  onClick={() => handleAddSkill()}
                  className="h-[42px] px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-[#141414] font-bold text-sm rounded-xl transition-colors cursor-pointer shadow-2xs active:scale-95"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 bg-[#eaf0e6] border border-[#d2e0cc] text-[#446038] text-xs font-semibold px-3 py-1 rounded-full"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-[#446038] hover:text-red-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Supporting Materials (BRD Section 8.3 - Supporting Materials / Downloadable Resources) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5C5C]">
                  SUPPORTING MATERIALS
                </label>
                <span className="bg-[#F6E8C4] text-[#755A12] text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  OPTIONAL
                </span>
              </div>

              {/* Existing Persisted Supporting Materials */}
              {existingAttachments.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Persisted Supporting Materials ({existingAttachments.length})
                  </p>
                  <div className="space-y-1.5">
                    {existingAttachments.map((att: any, idx: number) => (
                      <div
                        key={att.id || idx}
                        className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileText className="w-4 h-4 text-[#C99B2E] shrink-0" />
                          <span className="font-semibold text-gray-800 truncate max-w-[200px] sm:max-w-xs">
                            {getDisplayFileName(att.filename || att.name || "Supporting Material", "Supporting Material")}
                          </span>
                          {att.size && (
                            <span className="text-[11px] text-gray-400 shrink-0">
                              ({(att.size / 1024).toFixed(1)} KB)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {att.fileUrl && (
                            <a
                              href={att.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Download supporting material"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              if (att.id) {
                                setRemovedAttachmentIds((prev) => [...prev, att.id]);
                              }
                              setExistingAttachments((prev) =>
                                prev.filter((_, i) => i !== idx)
                              );
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Remove supporting material"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload New Supporting Material */}
              <div className="space-y-2">
                {/* List of newly selected files */}
                {attachmentFiles.length > 0 && (
                  <div className="space-y-1.5">
                    {attachmentFiles.map((file, idx) => (
                      <div
                        key={`new-${idx}-${file.name}`}
                        className="flex items-center justify-between p-2.5 bg-blue-50/50 border border-blue-200 rounded-xl text-xs"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="text-sm">📎</span>
                          <span className="font-semibold text-gray-800 truncate max-w-[200px] sm:max-w-xs">
                            {getDisplayFileName(file.name, "Supporting Material")}
                          </span>
                          <span className="text-[11px] text-gray-400 shrink-0">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAttachmentFiles((prev) => prev.filter((_, i) => i !== idx))}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove supporting material"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <label className="border border-dashed border-gray-300 hover:border-gray-400 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-white block shadow-2xs">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.ppt,.pptx,.doc,.docx,application/pdf"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length > 0) {
                        setAttachmentFiles((prev) => [...prev, ...files]);
                      }
                      e.target.value = "";
                    }}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-1">
                    <Upload className="w-5 h-5 text-gray-400" />
                    <p className="text-xs font-normal text-[#5C5C5C] text-center">
                      + Add supporting material · PDF / slides / documents · up to 25 MB
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* CARD 3: Courses in this path */}
          <div className="bg-white border border-gray-200/90 rounded-2xl p-6 space-y-4 shadow-2xs transition-all duration-300 hover:shadow-md hover:border-gray-300">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h2 className="text-base font-bold text-[#141414]">
                Courses in this path
              </h2>
              <button
                type="button"
                onClick={() => setShowAddCourseModal(true)}
                className="bg-white border border-gray-300 hover:bg-gray-50 text-[#141414] text-sm font-bold px-4 py-2 rounded-full flex items-center gap-1.5 shadow-2xs transition-all duration-200 active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add course
              </button>
            </div>

            {/* Course Items List */}
            <div className="divide-y divide-gray-100">
              {coursesList.length > 0 ? (
                coursesList.map((c, idx) => (
                  <div
                    key={c.id}
                    className="py-3.5 flex items-center justify-between gap-3 group"
                  >
                    {/* Left: Drag handle / Reorder buttons, Order, Course pill, Course Title */}
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex flex-col items-center justify-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => moveCourseUp(idx)}
                          disabled={idx === 0}
                          title="Move Up"
                          aria-label={`Move ${c.title} up`}
                          className="text-gray-400 hover:text-gray-900 disabled:opacity-20 disabled:hover:text-gray-400 cursor-pointer p-0.5"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveCourseDown(idx)}
                          disabled={idx === coursesList.length - 1}
                          title="Move Down"
                          aria-label={`Move ${c.title} down`}
                          className="text-gray-400 hover:text-gray-900 disabled:opacity-20 disabled:hover:text-gray-400 cursor-pointer p-0.5"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-sm font-bold text-[#5C5C5C] w-4 text-center">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-medium border border-gray-200 text-[#3A3A3A] px-2.5 py-0.5 rounded-full shrink-0 bg-white">
                        Course
                      </span>
                      <h4 className="text-base font-bold text-[#141414] truncate">
                        {c.title}
                      </h4>
                    </div>

                    {/* Right: Instructor, Mandatory/Optional Badge, Duration, Remove */}
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-sm text-[#5C5C5C] font-normal">
                        {c.instructor}
                      </span>

                      <button
                        type="button"
                        onClick={() => toggleCourseRequirement(c.id)}
                        className={`text-xs font-bold px-3 py-1 rounded-full cursor-pointer transition-colors ${c.isMandatory
                          ? "bg-[#F6E8C4] text-[#755A12] border border-[#E5D5A5]"
                          : "bg-white border border-gray-300 text-[#3A3A3A] hover:bg-gray-50"
                          }`}
                      >
                        {c.isMandatory ? "MANDATORY" : "OPTIONAL"}
                      </button>

                      <span className="text-sm font-semibold text-[#5C5C5C] w-16 text-right">
                        {c.duration}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemoveCourse(c.id)}
                        className="text-xs font-bold text-[#B8654E] hover:text-[#9e2014] uppercase tracking-wider transition-colors cursor-pointer px-2 py-1"
                      >
                        REMOVE
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-sm text-[#5C5C5C]">
                  No courses added yet. Click &quot;Add course&quot; to link courses to this career path.
                </div>
              )}
            </div>


          </div>

        </div>

        {/* Right Column: Publish Settings & Version History */}
        <div className="space-y-5">

          {/* Publish Settings Card */}
          <div className="bg-white border border-gray-200/90 rounded-2xl p-6 space-y-4 shadow-2xs transition-all duration-300 hover:shadow-md hover:border-gray-300">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5C5C5C]">
              PUBLISH SETTINGS
            </h3>

            {/* Status */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5C5C]">
                STATUS <span className="text-[#C99B2E] font-bold">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full h-[40px] bg-white border border-gray-300 rounded-xl px-3.5 text-[14px] font-semibold text-[#141414] focus:outline-none focus:border-[#141414] shadow-2xs cursor-pointer transition-colors"
              >
                <option value="DRAFT">Draft</option>
                <option value="UNDER_REVIEW">In SME Review</option>
                {(!existingPath || (existingPath as any)?.status !== "PUBLISHED") && (
                  <option value="PUBLISHED">Published</option>
                )}
              </select>
            </div>

            {/* Dynamic SME Reviewer Assignment when In SME Review */}
            {status === "UNDER_REVIEW" && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5C5C]">
                    ASSIGN SME REVIEWER
                  </label>
                  <span className="bg-[#F6E8C4] text-[#755A12] text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    OPTIONAL
                  </span>
                </div>
                <select
                  value={reviewerId}
                  onChange={(e) => setReviewerId(e.target.value)}
                  className="w-full h-[40px] bg-white border border-gray-300 rounded-xl px-3.5 text-sm font-semibold text-[#141414] focus:outline-none focus:border-[#141414] shadow-2xs cursor-pointer transition-colors"
                >
                  <option value="">Auto-assign (Super Admin / Any SME)</option>
                  {smeUsers.map((sme) => (
                    <option key={sme.id} value={sme.id}>
                      {sme.firstName} {sme.lastName} {sme.email ? `(${sme.email})` : ""}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-[#5C5C5C] font-normal pt-0.5">
                  If selected, only this SME can review. Otherwise, any Super Admin can review.
                </p>
              </div>
            )}

            {/* Preview Assessment Button */}
            {assessmentRequired && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={fetchAssessmentQuestions}
                  className="w-full bg-white hover:bg-gray-50 text-[#141414] font-bold text-sm py-2.5 px-5 rounded-xl border border-gray-300 shadow-2xs transition-all duration-200 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Preview Assessment
                </button>
              </div>
            )}

            {/* Price */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5C5C]">
                PRICE (OMR) <span className="text-[#C99B2E] font-bold">*</span>
              </label>
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 120.000"
                className="w-full h-[42px] bg-white border border-gray-300 rounded-xl px-4 text-sm font-semibold text-[#141414] placeholder:text-gray-400 focus:outline-none focus:border-[#141414] shadow-2xs transition-colors"
              />
              <p className="text-sm text-[#5C5C5C] font-normal pt-0.5">
                Configuration only - no checkout in Phase 1.
              </p>
            </div>

            {/* Change Summary Box — shown ONLY when editing already-published Career Path (spec §7, §10) */}
            {isPublishedEdit && (
              <div className="space-y-2 pt-2 pb-1 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5C5C]">
                    CHANGE SUMMARY <span className="text-amber-600">*</span>
                  </label>
                  <span className="bg-[#fef3c7] text-[#92400e] text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-[#fde68a]">
                    VERSION 2 REVISION
                  </span>
                </div>

                <div className="flex items-start gap-2 bg-amber-50/70 border border-amber-200/60 rounded-xl p-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 font-normal leading-relaxed">
                    Editing published career path. Direct publishing is disabled. Enter your changes, click <strong>Save Changes</strong>, and submit for SME Review.
                  </p>
                </div>

                <textarea
                  value={cpChangeSummary}
                  onChange={(e) => setCpChangeSummary(e.target.value)}
                  placeholder={"Describe the changes made in this version:\n- Updated title or description\n- Added/removed courses\n- Updated skills/tags"}
                  rows={4}
                  maxLength={500}
                  className="w-full bg-amber-50/30 border border-amber-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 font-normal leading-relaxed resize-none focus:outline-none focus:border-amber-500 shadow-2xs"
                />

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-500">Min 5 characters</span>
                  <span className="text-[11px] text-gray-400">{cpChangeSummary.length}/500</span>
                </div>

                <button
                  type="button"
                  onClick={handleSaveCpChangeSummary}
                  disabled={isSavingCpSummary || cpChangeSummary.trim().length < 5}
                  className="w-full bg-[#141414] hover:bg-gray-800 text-white text-xs font-bold py-2.5 px-4 rounded-full shadow-2xs transition-colors cursor-pointer text-center active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSavingCpSummary ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
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

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={() => handleSubmit(undefined, "UNDER_REVIEW")}
                disabled={isSubmitting}
                className="w-full bg-[#FCF7AE] hover:bg-[#FDF9C4] text-[#141414] font-bold text-[16px] py-3 px-6 rounded-full shadow-2xs transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 border border-[#e5df8a] active:scale-95"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Save and submit for review
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleSubmit(undefined, "DRAFT")}
                disabled={isSubmitting}
                className="w-full bg-white hover:bg-gray-50 text-[#141414] font-bold text-[16px] py-2.5 px-5 rounded-full border border-gray-300 shadow-2xs transition-all duration-200 active:scale-95 cursor-pointer"
              >
                Save as Draft
              </button>

              <button
                type="button"
                onClick={() => handleSubmit(undefined, "PUBLISHED")}
                disabled={isSubmitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[16px] py-2.5 px-5 rounded-full shadow-2xs transition-all duration-200 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Publish directly
              </button>

              <button
                type="button"
                onClick={() => navigate("/studio")}
                className="w-full text-[#5C5C5C] hover:text-[#141414] font-bold text-[16px] py-2 transition-colors cursor-pointer text-center block"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Version History Callout Card */}
          <div className="bg-[#fef9c3]/70 border border-[#fde047] rounded-2xl p-5 text-sm text-[#713f12] space-y-1 transition-all duration-300 hover:shadow-xs">
            <div className="flex items-start gap-2.5">
              <Info className="w-4.5 h-4.5 text-[#a16207] shrink-0 mt-0.5" />
              <p className="font-normal text-xs leading-relaxed text-[#713f12]">
                <span className="font-bold">Version history:</span> Each save creates a version snapshot. Content developer version-1 content supports direct publishing or SME review workflow.
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* Add Course Modal */}
      {showAddCourseModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Select course to add</h3>
              <button
                type="button"
                onClick={() => setShowAddCourseModal(false)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 space-y-1">
              {selectableCourses.length > 0 ? (
                selectableCourses.map((c: any) => (
                  <div
                    key={c.id}
                    className="p-3 hover:bg-gray-50 rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                    onClick={() => handleSelectCourseToAdd(c)}
                  >
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">{c.title || c.name}</h4>
                      <p className="text-[11px] text-gray-500">
                        {c.instructor || "Nexus Instructor"} · {formatCourseDuration(c.duration)}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5" /> Select
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-gray-400">
                  {availableCourses.length > 0
                    ? "All available courses are already added to this career path."
                    : "No courses available in catalog."}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Domain Modal */}
      {showDomainModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[1px] animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => !isSubmittingDomain && setShowDomainModal(false)} />
          <div className="relative bg-white rounded-2xl p-6 max-w-[420px] w-full shadow-2xl space-y-4 border border-gray-100 z-10">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Add New Domain</h3>
              <button
                type="button"
                onClick={() => !isSubmittingDomain && setShowDomainModal(false)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700">
                Domain Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={domainNameInput}
                onChange={(e) => setDomainNameInput(e.target.value)}
                placeholder="e.g. Technology & Engineering"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-900 focus:outline-none focus:border-gray-900 shadow-2xs"
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

      {/* Assessment Preview Modal */}
      {showAssessmentPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[1px] animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => setShowAssessmentPreview(false)} />
          <div className="relative bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-gray-100 z-10">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 shrink-0">
              <h3 className="text-base font-bold text-[#141414]">Overall Assessment Preview</h3>
              <button
                type="button"
                onClick={() => setShowAssessmentPreview(false)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto py-4 flex-1 space-y-4 pr-2">
              {isLoadingAssessment ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  <span className="text-sm font-semibold text-gray-500">Loading questions...</span>
                </div>
              ) : assessmentQuestions.length > 0 ? (
                assessmentQuestions.map((q: any, idx: number) => (
                  <div key={q.id || idx} className="p-4 border border-gray-200 rounded-xl bg-[#FAFAFA]">
                    <div className="flex gap-2">
                      <span className="font-bold text-[#141414]">{idx + 1}.</span>
                      <p className="text-[14px] font-semibold text-[#141414] leading-relaxed">
                        {q.questionText || q.question?.questionText || "Question text missing"}
                      </p>
                    </div>
                    {q.question?.questionOptions && q.question.questionOptions.length > 0 && (
                      <div className="mt-4 space-y-2.5 pl-6">
                        {q.question.questionOptions
                          .sort((a: any, b: any) => a.displayOrder - b.displayOrder)
                          .map((opt: any, oIdx: number) => (
                            <div key={opt.id || oIdx} className="flex items-start gap-2.5">
                              <div className={`w-3.5 h-3.5 mt-0.5 shrink-0 rounded-full border ${opt.isCorrect ? 'border-[#4CAF50] bg-[#4CAF50]' : 'border-gray-300 bg-white'}`} />
                              <span className={`text-[13px] leading-snug ${opt.isCorrect ? 'font-bold text-[#2E7D32]' : 'font-medium text-gray-700'}`}>
                                {opt.optionText}
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-[13px] text-gray-500 font-medium">
                  No questions found for this career path assessment.
                  <br />
                  <span className="text-xs font-normal mt-1 inline-block">Please save your career path and create questions in the assessment builder.</span>
                </div>
              )}
            </div>
            <div className="pt-4 border-t border-gray-100 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowAssessmentPreview(false)}
                className="bg-white border border-gray-300 hover:bg-gray-50 text-[#141414] text-xs font-bold px-6 py-2.5 rounded-full cursor-pointer shadow-2xs transition-colors active:scale-95"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentDeveloperPathBuilder;
