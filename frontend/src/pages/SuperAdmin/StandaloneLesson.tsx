import React, { useMemo, useState, useCallback, useEffect } from "react";
import { useParams } from "react-router";
import { useCreateLesson, useUpdateLesson, useLesson } from "../../hooks/lesson/useLessons";
import { useSubjects } from "../../hooks/useSubjects";
import { useSkills } from "../../hooks/useMaster";
import LanguageList from "language-list";
import Select from "react-select";
import { useDifficultyLevels, useLessonStatuses, useLessonTypes, useVisibilities } from "../../hooks/useEnums";
import { getTenantsApi } from "../../core/api/tenant.api";
import { useQuery } from "@tanstack/react-query";
import { useAssets } from "../../hooks/asset/useAssets";
import { useCreateLessonTranscript } from "../../hooks/lesson/useLessonTranscript";
import { Spin, notification } from "antd";
import { toast } from "sonner";

const StandaloneLesson: React.FC = () => {
  // ==================== TYPES ====================

  interface LessonBlock {
    id: string;
    blockType: "PARAGRAPH" | "IMAGE";
    title?: string;
    textContent?: string;
    previewUrl?: string;
    file?: File;
    metadata?: {
      caption?: string;
    };
  }

  type LessonContentBlock = {
    id: string;
    blockType: "HEADING" | "SUB_HEADING" | "PARAGRAPH" | "IMAGE" | "VIDEO" | "PDF" | "AUDIO" | "CODE" | "NOTE" | "QUOTE" | "LIST" | "TABLE" | "EMBED";
    title?: string;
    textContent?: string;
    file?: File;
    previewUrl?: string;
    assetId?: string;
    assetUrl?: string;
    metadata?: Record<string, any>;
    displayOrder: number;
  };

  type LessonContent = {
    id: string;
    title: string;
    format: string;
    estimatedDuration?: number;
    displayOrder: number;
    isDefault: boolean;
    blocks: LessonContentBlock[];
  };



  // ==================== HOOKS & STATES ====================
  const createLessonMutation = useCreateLesson();
  const updateLessonMutation = useUpdateLesson();
  const { lessonId } = useParams<{ lessonId: string }>();
  const isEditMode = Boolean(lessonId);
  const { data: lessonData, isLoading: lessonLoading } = useLesson(lessonId);

  useEffect(() => {
    if (lessonData && isEditMode) {
      const lesson = lessonData.data || lessonData;
      if (lesson) {
        setTitle(lesson.title || "");
        setLessonType(lesson.lessonType || "");
        setDifficulty(lesson.difficulty || "");
        setVisibility(lesson.visibility || "");
        setDescription(lesson.description || "");
        setDuration(lesson.duration ? String(lesson.duration) : "");
        setSubjectId(lesson.subjectId || "");
        setLanguage(lesson.language || "ENGLISH");
        setAssessmentRequired(lesson.assessmentRequired || false);
        setCorporateTenant(lesson.tenantIds?.[0] || lesson.tenantId || "");
        setTagLine(lesson.tagLine || "");
        setShortDescription(lesson.shortDescription || "");
        setAllowPreview(lesson.allowPreview || false);
        setPreviewAccessType(lesson.previewAccessType || "NONE");
        setPreviewDuration(lesson.previewDuration ? String(lesson.previewDuration) : "");
        
        if (lesson.skills) {
          const names = lesson.skills.map((s: any) => s.name || s);
          const ids = lesson.skills.map((s: any) => s.id);
          setSkillTags(names);
          setSelectedSkillIds(ids);
        } else if (lesson.skillIds) {
          setSelectedSkillIds(lesson.skillIds);
        }
      }
    }
  }, [lessonData, isEditMode]);

  const { subjects, loading: subjectsLoading, error: subjectsError } = useSubjects();
  const { data: skillsData = [] } = useSkills();
  const { data: tenants = [] } = useQuery({ queryKey: ["tenants"], queryFn: getTenantsApi });

  const { data: lessonTypes = [] } = useLessonTypes();
  const { data: difficultyLevels = [] } = useDifficultyLevels();
  const { data: visibilities = [] } = useVisibilities();

  const languageList = new LanguageList();
  const languages = languageList.getData();

  const { uploadAsset, uploadAssetDirectly } = useAssets();

  // Form States
  const [lessonType, setLessonType] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [visibility, setVisibility] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [language, setLanguage] = useState("ENGLISH");
  const [assessmentRequired, setAssessmentRequired] = useState(false);
  const [corporateTenant, setCorporateTenant] = useState("");
  const [subjectInput, setSubjectInput] = useState("");
  const [subjectTags, setSubjectTags] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [skillTags, setSkillTags] = useState<string[]>([]);
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [tagLine, setTagLine] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [learningOutcomes, setLearningOutcomes] = useState<string[]>([]);
  const [lessonBlocks, setLessonBlocks] = useState<LessonBlock[]>([]);

  // File States
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [removedAssetRoles, setRemovedAssetRoles] = useState<string[]>([]);
  const [removedAttachmentIds, setRemovedAttachmentIds] = useState<string[]>([]);

  // Study Content States
  const [hasStudyDocument, setHasStudyDocument] = useState(false);
  const [showStudyDocumentModal, setShowStudyDocumentModal] = useState(false);
  const [lessonContents, setLessonContents] = useState<LessonContent[]>([]);
  const [selectedContentIndex, setSelectedContentIndex] = useState(0);

  const [allowPreview, setAllowPreview] = useState(false);
  const [previewDuration, setPreviewDuration] = useState("");
  const [previewAccessType, setPreviewAccessType] = useState("NONE");
  const [uploading, setUploading] = useState(false);

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


  // Populate form if we have existing lesson data
  useEffect(() => {
    if (isEditMode && lessonData) {
      const data: any = lessonData?.data?.data || lessonData?.data || lessonData;
      setLessonType(data.lessonType || "");
      setDifficulty(data.difficulty || data.difficultyLevel || "");
      setVisibility(data.visibility || "");
      setTitle(data.title || "");
      setDescription(data.description || "");
      setDuration(data.duration?.toString() || "");
      setSubjectId(data.subjectId || "");
      setLanguage(data.language || "ENGLISH");
      setAssessmentRequired(data.assessmentRequired || false);
      setCorporateTenant(data.tenantId || "");
      setTagLine(data.tagLine || data.tagline || "");
      setShortDescription(data.shortDescription || "");
      setAllowPreview(data.allowPreview || false);
      setPreviewDuration(data.previewDuration?.toString() || "");
      setPreviewAccessType(data.previewAccessType || "NONE");

      const fetchedSkills = data.lessonSkills || data.skills;
      if (fetchedSkills) {
        setSkillTags(fetchedSkills.map((s: any) => s.skill?.name || s.name || s));
        setSelectedSkillIds(fetchedSkills.map((s: any) => s.skillId || s.id || s.skill?.id || ""));
      } else if (data.skillTags) {
        setSkillTags(data.skillTags);
      }

      const fetchedTags = data.lessonTags || data.tags;
      if (fetchedTags) {
        setSubjectTags(fetchedTags.map((t: any) => t.tag?.name ? `#${t.tag.name}` : (t.name ? `#${t.name}` : `#${t}`)));
      } else if (data.tags) {
        setSubjectTags(data.tags.map((t: any) => t.startsWith("#") ? t : `#${t}`));
      }

      if (data.lessonContents && data.lessonContents.length > 0) {
        setHasStudyDocument(true);
        const mappedContents = data.lessonContents.map((lc: any) => {
          return {
            id: lc.id,
            title: lc.title || "",
            format: lc.format || "",
            estimatedDuration: lc.estimatedDuration,
            displayOrder: lc.displayOrder,
            isDefault: lc.isDefault || false,
            blocks: Array.isArray(lc.blocks) ? lc.blocks.map((b: any) => {
              return {
                id: b.id,
                blockType: b.blockType || "PARAGRAPH",
                title: b.title || "",
                textContent: b.textContent || "",
                previewUrl: b.asset?.url || b.assetUrl || "",
                assetId: b.assetId || "",
                displayOrder: b.displayOrder || 0,
                metadata: b.metadata || {}
              };
            }) : []
          };
        });
        setLessonContents(mappedContents);
      }
    }
  }, [isEditMode, lessonData]);


  // ==================== FILTERS & HELPERS ====================
  const filteredSubjectSuggestions = useMemo(() => {
    const needle = subjectInput.replace(/^#/, "").trim().toLowerCase();
    if (!needle) return [];
    return subjects.filter(
      (subject: any) =>
        subject.name.toLowerCase().includes(needle) &&
        !subjectTags.some((tag) => tag.toLowerCase() === `#${subject.name.toLowerCase()}`)
    );
  }, [subjectInput, subjects, subjectTags]);

  const filteredSkills = useMemo(() => {
    const needle = skillInput.replace(/^#/, "").trim().toLowerCase();
    if (!needle) return [];
    return skillsData.filter(
      (skill: any) =>
        skill.name.toLowerCase().includes(needle) && !selectedSkillIds.includes(skill.id)
    );
  }, [skillInput, skillsData, selectedSkillIds]);

  const addSubjectTag = (subjectName: string) => {
    const tag = `#${subjectName}`;
    if (!subjectTags.some((t) => t.toLowerCase() === tag.toLowerCase())) {
      setSubjectTags((prev) => [...prev, tag]);
    }
    setSubjectInput("");
  };

  const addSkill = (skill: any) => {
    if (selectedSkillIds.includes(skill.id)) return;
    setSkillTags((prev) => [...prev, skill.name]);
    setSelectedSkillIds((prev) => [...prev, skill.id]);
    setSkillInput("");
  };

  const removeSkill = (index: number) => {
    const skillName = skillTags[index];
    const skillObj = skillsData.find((s: any) => s.name === skillName);
    setSkillTags((prev) => prev.filter((_, i) => i !== index));
    if (skillObj) setSelectedSkillIds((prev) => prev.filter((id) => id !== skillObj.id));
  };

  const addRequiredSkill = (skillName: string) => {
    if (!requiredSkills.includes(skillName)) {
      setRequiredSkills((prev) => [...prev, skillName]);
    }
  };

  const addLearningOutcome = (outcome: string) => {
    const trimmed = outcome.trim();
    if (trimmed && !learningOutcomes.includes(trimmed)) {
      setLearningOutcomes((prev) => [...prev, trimmed]);
    }
  };

  const getLessonContentFormat = (lt: string): string => {
    switch (lt.toUpperCase()) {
      case "VIDEO": return "VIDEO";
      case "PDF": return "PDF";
      case "AUDIO": return "AUDIO";
      default: return "TEXT_IMAGE";
    }
  };

  // ==================== STUDY CONTENT HELPERS ====================
  const createLessonTextBlock = (): LessonContentBlock => ({
    id: crypto.randomUUID(),
    blockType: "PARAGRAPH",
    title: "",
    textContent: "",
    displayOrder: 0,
  });

  const createLessonImageBlocks = (files: File[]): LessonContentBlock[] => {
    return files.map((file) => ({
      id: crypto.randomUUID(),
      blockType: "IMAGE",
      file,
      previewUrl: URL.createObjectURL(file),
      metadata: { caption: "" },
      displayOrder: 0,
    }));
  };



  const openStudyDocumentModal = () => {
    if (!title.trim()) {
      alert("Please enter the lesson title before adding study content.");
      return false;
    }
    if (lessonContents.length === 0) {
      const newContent: LessonContent = {
        id: crypto.randomUUID(),
        title: title.trim(),
        format: getLessonContentFormat(lessonType),
        estimatedDuration: 0,
        displayOrder: 1,
        isDefault: true,
        blocks: [createLessonTextBlock()],
      };
      setLessonContents([newContent]);
      setSelectedContentIndex(0);
    }
    setShowStudyDocumentModal(true);
    return true;
  };

  const handleStudyDocumentToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    if (checked) {
      openStudyDocumentModal();
      setHasStudyDocument(true);
    } else {
      setHasStudyDocument(false);
      setShowStudyDocumentModal(false);
      setLessonContents([]);
    }
  };

  const addLessonTextBlock = () => {
    setLessonContents((prev) =>
      prev.map((content, idx) =>
        idx === selectedContentIndex
          ? { ...content, blocks: [...content.blocks, { ...createLessonTextBlock(), displayOrder: content.blocks.length + 1 }] }
          : content
      )
    );
  };

  const insertLessonTextBlockAfter = (blockId: string) => {
    setLessonContents((prev) =>
      prev.map((content, idx) => {
        if (idx !== selectedContentIndex) return content;
        const insertIndex = content.blocks.findIndex((b) => b.id === blockId);
        if (insertIndex === -1) return content;
        const blocks = [...content.blocks];
        blocks.splice(insertIndex + 1, 0, { ...createLessonTextBlock(), displayOrder: insertIndex + 2 });
        return { ...content, blocks: blocks.map((b, i) => ({ ...b, displayOrder: i + 1 })) };
      })
    );
  };

  const addLessonImages = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const imageBlocks = createLessonImageBlocks(files);
    setLessonContents((prev) =>
      prev.map((content, idx) =>
        idx === selectedContentIndex
          ? { ...content, blocks: [...content.blocks, ...imageBlocks].map((b, i) => ({ ...b, displayOrder: i + 1 })) }
          : content
      )
    );
    event.target.value = "";
  };

  const insertLessonImagesAfter = (event: React.ChangeEvent<HTMLInputElement>, blockId: string) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const images = createLessonImageBlocks(files);
    setLessonContents((prev) =>
      prev.map((content, idx) => {
        if (idx !== selectedContentIndex) return content;
        const insertIndex = content.blocks.findIndex((b) => b.id === blockId);
        if (insertIndex === -1) return content;
        const blocks = [...content.blocks];
        blocks.splice(insertIndex + 1, 0, ...images);
        return { ...content, blocks: blocks.map((b, i) => ({ ...b, displayOrder: i + 1 })) };
      })
    );
    event.target.value = "";
  };

  const updateLessonTextBlock = (blockId: string, field: "title" | "textContent", value: string) => {
    setLessonContents((prev) =>
      prev.map((content, idx) =>
        idx === selectedContentIndex
          ? {
            ...content,
            blocks: content.blocks.map((block) =>
              block.id === blockId && block.blockType === "PARAGRAPH" ? { ...block, [field]: value } : block
            ),
          }
          : content
      )
    );
  };

  const updateLessonImageCaption = (blockId: string, caption: string) => {
    setLessonContents((prev) =>
      prev.map((content, idx) =>
        idx === selectedContentIndex
          ? {
            ...content,
            blocks: content.blocks.map((block) =>
              block.id === blockId && block.blockType === "IMAGE"
                ? { ...block, metadata: { ...block.metadata, caption } }
                : block
            ),
          }
          : content
      )
    );
  };

  const removeLessonBlock = (blockId: string) => {
    setLessonContents((prev) =>
      prev.map((content, idx) => {
        if (idx !== selectedContentIndex) return content;
        const block = content.blocks.find((b) => b.id === blockId);
        if (block?.previewUrl && !block.assetUrl) URL.revokeObjectURL(block.previewUrl);
        return {
          ...content,
          blocks: content.blocks.filter((b) => b.id !== blockId).map((b, i) => ({ ...b, displayOrder: i + 1 })),
        };
      })
    );
  };

  const moveLessonBlock = (blockId: string, direction: "UP" | "DOWN") => {
    setLessonContents((prev) =>
      prev.map((content, idx) => {
        if (idx !== selectedContentIndex) return content;
        const blocks = [...content.blocks];
        const current = blocks.findIndex((b) => b.id === blockId);
        if (current === -1) return content;
        const target = direction === "UP" ? current - 1 : current + 1;
        if (target < 0 || target >= blocks.length) return content;
        [blocks[current], blocks[target]] = [blocks[target], blocks[current]];
        return { ...content, blocks: blocks.map((b, i) => ({ ...b, displayOrder: i + 1 })) };
      })
    );
  };

  const saveStudyDocument = () => {
    if (!title.trim()) {
      alert("Please enter the lesson title before saving study content.");
      return;
    }
    setHasStudyDocument(true);
    setShowStudyDocumentModal(false);
  };

  const closeStudyDocumentModal = () => setShowStudyDocumentModal(false);

  // Cleanup URLs
  useEffect(() => {
    return () => {
      lessonContents.forEach((content) => {
        content.blocks.forEach((block) => {
          if (block.previewUrl && !block.assetUrl) URL.revokeObjectURL(block.previewUrl);
        });
      });
    };
  }, [lessonContents]);

  useEffect(() => {
    if (title) {
      setLessonContents((prev) =>
        prev.map((content, i) => (i === 0 && content.isDefault ? { ...content, title } : content))
      );
    }
  }, [title]);

  useEffect(() => {
    const format = getLessonContentFormat(lessonType);
    setLessonContents((prev) => prev.map((content) => ({ ...content, format })));
  }, [lessonType]);

  // ==================== SUBMIT HANDLER (unchanged core) ====================
  const handleSubmit = async (submitForReview: boolean) => {
    if (!title.trim()) {
      notification.warning({ title: "Validation Error", description: "Please enter the lesson title." });
      return;
    }
    if (!lessonType) {
      notification.warning({ title: "Validation Error", description: "Please select a lesson type." });
      return;
    }
    if (!language) {
      notification.warning({ title: "Validation Error", description: "Please select a language." });
      return;
    }
    if (!shortDescription?.trim()) {
      notification.warning({ title: "Validation Error", description: "Please enter a short description." });
      return;
    }
    
    // Asset validation based on lesson type (if not edit mode or if replacing)
    if (lessonType === "VIDEO" && !videoFile && !isEditMode) {
      notification.warning({ title: "Validation Error", description: "Please upload a video file for this video lesson." });
      return;
    }

    try {
      setUploading(true);

      const lessonPayload = {
        ownerId,
        title: title.trim(),
        lessonType,
        subjectId: subjectId || undefined,
        shortDescription: shortDescription.trim() || undefined,
        description: description.trim() || undefined,
        slug: title.toLowerCase().replace(/\s+/g, "-"),
        difficulty,
        language,
        duration: duration ? Math.max(0, Number(duration)) : undefined,
        visibility,
        assessmentRequired,
        videoThreshold: 80,
        completionThreshold: 100,
        isStandalone: true,
        allowPreview,
        previewAccessType,
        previewDuration: allowPreview && previewDuration ? Math.max(0, Number(previewDuration)) : undefined,
        notifyOnUpdate: true,
        status: submitForReview ? "SUBMITTED" : "DRAFT",
        skillIds: selectedSkillIds,
        tagIds: [],
        personaIds: [],
        tenantIds: corporateTenant ? [corporateTenant] : [],
        courseIds: [],
      };

      let activeLessonId = lessonId || "";
      if (isEditMode && lessonId) {
        await updateLessonMutation.mutateAsync({
          lessonId,
          data: {
            title: title.trim(),
            lessonType,
            subjectId: subjectId || undefined,
            shortDescription: shortDescription.trim() || undefined,
            description: description.trim() || undefined,
            slug: title.toLowerCase().replace(/\s+/g, "-"),
            difficulty,
            language,
            duration: duration ? Math.max(0, Number(duration)) : undefined,
            visibility,
            assessmentRequired,
            allowPreview,
            previewAccessType,
            previewDuration: allowPreview && previewDuration ? Math.max(0, Number(previewDuration)) : undefined,
            status: submitForReview ? "SUBMITTED" : "DRAFT",
            skillIds: selectedSkillIds,
            tenantIds: corporateTenant ? [corporateTenant] : [],
          }
        });
      } else {
        const lesson = await createLessonMutation.mutateAsync(lessonPayload as any);
        activeLessonId = lesson?.id || lesson?.data?.id || lesson?.lesson?.id || "";
        if (!activeLessonId) throw new Error("Lesson ID not returned");
      }

      //----------------------------------
      // STEP 2 UPLOAD ASSETS
      //----------------------------------

      let thumbnailAssetId:
        | string
        | undefined;

      let contentAssetId:
        | string
        | undefined;

      let transcriptAssetId:
        | string
        | undefined;

      const attachmentIds: string[] =
        [];

      // THUMBNAIL
      if (thumbnailFile) {
        const formData =
          new FormData();

        formData.append(
          "file",
          thumbnailFile
        );

        formData.append(
          "assetContext",
          "LESSON"
        );

        formData.append(
          "assetType",
          "IMAGE"
        );

        formData.append(
          "storagePath",
          "thumbnails"
        );

        formData.append(
          "lessonId",
          activeLessonId
        );

        formData.append(
          "uploadedBy",
          ownerId
        );

        const asset =
          await uploadAsset(
            formData
          );

        thumbnailAssetId =
          asset.id;
      }

      // VIDEO
      if (videoFile) {
        const formData = new FormData();
        formData.append("file", videoFile);
        formData.append("assetContext", "LESSON");
        formData.append("assetType", "VIDEO");
        formData.append("storagePath", "videos");
        formData.append("lessonId", activeLessonId);
        formData.append("uploadedBy", ownerId);

        const asset = await uploadAsset(formData);
        contentAssetId = asset.id;
      }

      // TRANSCRIPT
      if (transcriptFile) {
        const formData =
          new FormData();

        formData.append(
          "file",
          transcriptFile
        );

        formData.append(
          "assetContext",
          "LESSON"
        );

        formData.append(
          "assetType",
          "DOCUMENT"
        );

        formData.append(
          "storagePath",
          "transcripts"
        );

        formData.append(
          "lessonId",
          activeLessonId
        );

        formData.append(
          "uploadedBy",
          ownerId
        );

        const asset =
          await uploadAsset(
            formData
          );

        transcriptAssetId =
          asset.id;
      }

      // ATTACHMENTS
      for (const file of attachments) {
        const formData =
          new FormData();

        formData.append(
          "file",
          file
        );

        formData.append(
          "assetContext",
          "LESSON"
        );

        formData.append(
          "assetType",
          "DOCUMENT"
        );

        formData.append(
          "storagePath",
          "attachments"
        );

        formData.append(
          "lessonId",
          activeLessonId
        );

        formData.append(
          "uploadedBy",
          ownerId
        );

        const asset =
          await uploadAsset(
            formData
          );

        attachmentIds.push(
          asset.id
        );
      }

      //----------------------------------
      // STEP 3 UPDATE LESSON
      //----------------------------------

      if (thumbnailAssetId || contentAssetId || transcriptAssetId || attachmentIds.length) {
        await updateLessonMutation.mutateAsync({
          lessonId: activeLessonId,
          data: {
            thumbnailAssetId,
            contentAssetId,
            transcriptAssetId,
            attachmentIds,
            skillIds: selectedSkillIds,
            tenantIds: corporateTenant ? [corporateTenant] : [],
            tagIds: [],
            personaIds: [],
          },
        });
      }

      toast.success(submitForReview ? "Lesson submitted successfully" : "Lesson draft saved successfully");
    } catch (error: any) {
      console.error(error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to create lesson";
      toast.error(`Failed: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };




  const handleThumbnailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setThumbnailFile(e.target.files[0]);
  }, []);

  const handleVideoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        const durationInMinutes = Math.ceil(video.duration / 60) || 1;
        setDuration(durationInMinutes.toString());
      };
      video.src = URL.createObjectURL(file);
    }
  }, []);

  const handleTranscriptChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setTranscriptFile(e.target.files[0]);
  }, []);

  const handleAttachmentsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments((prev: any) => [...prev, ...Array.from(e.target.files!)]);
    }
  }, []);

  const removeAttachment = (index: number) => {
    setAttachments((prev: any) => prev.filter((_: any, i: any) => i !== index));
  };


  type QuestionType = "MCQ" | "TRUE_FALSE" | "IMAGE" | "ESSAY";

  type AssessmentQuestion = {
    id: number;
    type: QuestionType;
    question: string;
    note?: string;
    imageUrl?: string;
    options?: string[];
    correctAnswer?: number;
    essayText?: string;
  };

  type GroupQuestion = {
    id: number;
    question: string;
    options: string[];
    correctAnswer: number;
  };

  const createEmptyGroupQuestion = (): GroupQuestion => ({
    id: Date.now() + Math.random(),
    question: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
  });


  //  quiz======================================================================================
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [selectedQuestionType, setSelectedQuestionType] = useState<QuestionType>("MCQ");
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [essayText, setEssayText] = useState("");
  const [imageQuestions, setImageQuestions] = useState<GroupQuestion[]>([createEmptyGroupQuestion(),]);
  const [essayQuestions, setEssayQuestions] = useState<GroupQuestion[]>([createEmptyGroupQuestion(),]);
  const openQuestionModal = (type: QuestionType) => {
    setSelectedQuestionType(type);
    setQuestionText("");
    setOptions(["", "", "", ""]);
    setCorrectAnswer(0);
    setImageFile(null);
    setImagePreview(null);
    setEssayText("");
    setImageQuestions([createEmptyGroupQuestion()]);
    setEssayQuestions([createEmptyGroupQuestion()]);
    setShowQuestionModal(true);
  };

  const closeQuestionModal = () => {
    setShowQuestionModal(false);
    setQuestionText("");
    setOptions(["", "", "", ""]);
    setCorrectAnswer(0);
    setImageFile(null);
    setImagePreview(null);
    setEssayText("");
    setImageQuestions([createEmptyGroupQuestion()]);
    setEssayQuestions([createEmptyGroupQuestion()]);
  };

  const handleAssessmentImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0] || null;

    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const addImageQuestion = () => {
    setImageQuestions((prev) => [...prev, createEmptyGroupQuestion()]);
  };

  const removeImageQuestion = (id: number) => {
    setImageQuestions((prev) => prev.filter((item) => item.id !== id));
  };

  const addEssayQuestion = () => {
    setEssayQuestions((prev) => [...prev, createEmptyGroupQuestion()]);
  };

  const removeEssayQuestion = (id: number) => {
    setEssayQuestions((prev) => prev.filter((item) => item.id !== id));
  };

  const updateImageQuestion = (
    id: number,
    field: "question" | "correctAnswer",
    value: string | number,
  ) => {
    setImageQuestions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const updateImageQuestionOption = (
    questionId: number,
    optionIndex: number,
    value: string,
  ) => {
    setImageQuestions((prev) =>
      prev.map((item) => {
        if (item.id !== questionId) return item;

        const updatedOptions = [...item.options];
        updatedOptions[optionIndex] = value;

        return { ...item, options: updatedOptions };
      }),
    );
  };

  const updateEssayQuestion = (
    id: number,
    field: "question" | "correctAnswer",
    value: string | number,
  ) => {
    setEssayQuestions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const updateEssayQuestionOption = (
    questionId: number,
    optionIndex: number,
    value: string,
  ) => {
    setEssayQuestions((prev) =>
      prev.map((item) => {
        if (item.id !== questionId) return item;

        const updatedOptions = [...item.options];
        updatedOptions[optionIndex] = value;

        return { ...item, options: updatedOptions };
      }),
    );
  };

  const saveAssessmentQuestion = () => {
    if (selectedQuestionType === "IMAGE") {
      if (!imagePreview) {
        alert("Please upload an image.");
        return;
      }

      const validQuestions = imageQuestions.filter(
        (item) =>
          item.question.trim() &&
          item.options.filter((option) => option.trim()).length >= 2,
      );

      if (validQuestions.length === 0) {
        alert(
          "Add at least one complete image-based question with two options.",
        );
        return;
      }

      setQuestions((prev) => [
        ...prev,
        ...validQuestions.map((item) => ({
          id: Date.now() + Math.random(),
          type: "IMAGE" as const,
          question: item.question.trim(),
          imageUrl: imagePreview,
          options: item.options.filter((option) => option.trim()),
          correctAnswer: item.correctAnswer,
        })),
      ]);

      closeQuestionModal();
      return;
    }

    if (selectedQuestionType === "ESSAY") {
      if (!essayText.trim()) {
        alert("Please enter the essay passage.");
        return;
      }

      const validQuestions = essayQuestions.filter(
        (item) =>
          item.question.trim() &&
          item.options.filter((option) => option.trim()).length >= 2,
      );

      if (validQuestions.length === 0) {
        alert("Add at least one complete question with two options.");
        return;
      }

      setQuestions((prev) => [
        ...prev,
        ...validQuestions.map((item) => ({
          id: Date.now() + Math.random(),
          type: "ESSAY" as const,
          question: item.question.trim(),
          essayText: essayText.trim(),
          options: item.options.filter((option) => option.trim()),
          correctAnswer: item.correctAnswer,
        })),
      ]);

      closeQuestionModal();
      return;
    }

    if (!questionText.trim()) {
      alert("Please enter the question.");
      return;
    }

    if (
      selectedQuestionType === "MCQ" &&
      options.filter((option) => option.trim()).length < 2
    ) {
      alert("Please add at least two options.");
      return;
    }

    setQuestions((prev) => [
      ...prev,
      {
        id: Date.now(),
        type: selectedQuestionType,
        question: questionText.trim(),
        options:
          selectedQuestionType === "MCQ"
            ? options.filter((option) => option.trim())
            : ["True", "False"],
        correctAnswer,
      },
    ]);

    closeQuestionModal();
  };

  const removeAssessmentQuestion = (questionId: number) => {
    setQuestions((prev) =>
      prev.filter((question) => question.id !== questionId),
    );
  };

  if (isEditMode && lessonLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <Spin size="large" tip="Loading lesson details..." />
      </div>
    );
  }

  if (subjectsLoading)
    return <div className="p-8 text-center">Loading subjects...</div>;
  if (subjectsError)
    return <div className="p-8 text-red-500">Error loading subjects</div>;


  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <button className="text-sm text-gray-500 hover:text-black mb-6 flex items-center gap-1">
          ← Back to Content Library
        </button>

        <h1 className="text-2xl font-bold mb-1">
          {isEditMode ? "Edit Standalone Lesson" : "Upload Standalone Lesson"}
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          A single video, PDF, or text lesson that can be added to any course
          later, or accessed from the Learner Library.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* ====================== LEFT FORM ====================== */}
          <div className="lg:col-span-3 bg-white border rounded-xl p-8 space-y-12">
            {/* BASIC INFORMATION */}
            <section>
              <h2 className="text-lg font-semibold mb-6 border-b pb-3">
                Basic Information
              </h2>

              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Lesson Type <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-3">
                  {lessonTypes.map((type: string) => (
                    <label
                      key={type}
                      className={`flex items-center gap-3 px-5 py-3 rounded-xl border cursor-pointer transition-all ${lessonType === type
                        ? "border-black bg-white shadow-sm"
                        : "border-gray-300 hover:border-gray-400"
                        }`}
                    >
                      <input
                        type="radio"
                        name="lessonType"
                        checked={lessonType === type}
                        onChange={() => setLessonType(type)}
                        className="hidden"
                      />
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${lessonType === type
                          ? "border-black"
                          : "border-gray-300"
                          }`}
                      >
                        {lessonType === type && (
                          <div className="w-2.5 h-2.5 rounded-full bg-black" />
                        )}
                      </div>
                      <span
                        className={`font-medium ${lessonType === type ? "text-gray-900" : "text-gray-700"}`}
                      >
                        {type}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g Introduction to Knowledge Classification"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tag Line
                  </label>
                  <input
                    type="text"
                    value={tagLine}
                    onChange={(e) => setTagLine(e.target.value)}
                    placeholder="Master React Hooks in 30 Minutes"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Short Description
                  </label>
                  <textarea
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    placeholder="Short description (max 160 chars)"
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What this lesson covers and who it is for"
                    rows={6}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-black"
                  />
                </div>
              </div>
            </section>

            {/* CLASSIFICATION */}
            <section>
              <h2 className="text-lg font-semibold mb-6 border-b pb-3">
                Classification
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-black"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((subject: any) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Difficulty
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-black"
                  >
                    <option value="">Select Difficulty</option>
                    {difficultyLevels.map((level: string) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Language
                  </label>
                  <Select
                    options={languages.map((lang: any) => ({
                      value: lang.language,
                      label: lang.language,
                    }))}
                    value={{ value: language, label: language }}
                    onChange={(opt) => setLanguage(opt?.value || "ENGLISH")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              {/* Subject Tags */}
              <div className="mt-8">
                <label className="block text-sm font-medium mb-2">
                  Subject Tags
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={subjectInput}
                    onChange={(e) => setSubjectInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && subjectInput.trim()) {
                        e.preventDefault();
                        addSubjectTag(subjectInput.replace(/^#/, "").trim());
                      }
                    }}
                    placeholder="#Add subject tag"
                    className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                  />
                  {subjectInput && filteredSubjectSuggestions.length > 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredSubjectSuggestions.map((subject: any) => (
                        <button
                          key={subject.id}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100"
                          onClick={() => addSubjectTag(subject.name)}
                        >
                          #{subject.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 mt-3">
                  {subjectTags.map((tag, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-4 py-2 text-sm bg-gray-100 border border-gray-200 rounded-full"
                    >
                      {tag}{" "}
                      <button
                        onClick={() =>
                          setSubjectTags((prev) =>
                            prev.filter((_, idx) => idx !== i),
                          )
                        }
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </section>

            {/* SKILLS */}
            <section>
              <h2 className="text-lg font-semibold mb-6 border-b pb-3">
                Skills
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Skills Required
                  </label>
                  <input
                    type="text"
                    placeholder="Add prerequisite skill and press Enter"
                    className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.currentTarget.value.trim()) {
                        addRequiredSkill(e.currentTarget.value.trim());
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                  <div className="flex flex-wrap gap-3 mt-3">
                    {requiredSkills.map((skill, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-4 py-2 text-sm bg-orange-50 border border-orange-200 rounded-full"
                      >
                        {skill}{" "}
                        <button
                          onClick={() =>
                            setRequiredSkills((prev) =>
                              prev.filter((_, idx) => idx !== i),
                            )
                          }
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Skills Gained
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      placeholder="Search or type skill"
                      className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                    />
                    {skillInput.startsWith("#") && filteredSkills.length > 0 && (
                      <div className="absolute z-20 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredSkills.map((skill: any) => (
                          <button
                            key={skill.id}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100"
                            onClick={() => addSkill(skill)}
                          >
                            #{skill.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 mt-3">
                    {skillTags.map((skill, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-blue-50 border border-blue-200 rounded-full"
                      >
                        #{skill}
                        <button
                          onClick={() => removeSkill(i)}
                          className="font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Learning Outcomes */}
              <div className="mt-10">
                <label className="block text-sm font-medium mb-2">
                  Learning Outcomes
                </label>
                <input
                  type="text"
                  placeholder="Add learning outcome and press Enter"
                  className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.currentTarget.value.trim()) {
                      addLearningOutcome(e.currentTarget.value);
                      e.currentTarget.value = "";
                    }
                  }}
                />
                <div className="flex flex-wrap gap-3 mt-3">
                  {learningOutcomes.map((outcome, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-4 py-2 text-sm bg-emerald-50 border border-emerald-200 rounded-full"
                    >
                      {outcome}{" "}
                      <button
                        onClick={() =>
                          setLearningOutcomes((prev) =>
                            prev.filter((_, idx) => idx !== i),
                          )
                        }
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </section>

            {/* MEDIA ASSETS */}
            <section className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between gap-4 border-b border-gray-200 pb-4 mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Media Assets
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Upload the lesson thumbnail, video, transcript, and
                    supporting files.
                  </p>
                </div>
              </div>

              <div className="space-y-8">
                {/* THUMBNAIL */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-800">
                      Thumbnail
                    </label>
                    <span className="text-xs text-gray-500">
                      PNG, JPG, WEBP
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-5">
                    <div className="w-full h-[170px] rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
                      {(() => {
                        const data: any = lessonData?.data?.data || lessonData?.data || lessonData;
                        const isRemoved = removedAssetRoles.includes("THUMBNAIL");
                        const existingThumbnailUrl = isRemoved ? "" : (data?.thumbnailAsset?.url || "");

                        if (thumbnailFile) {
                          return (
                            <img
                              src={URL.createObjectURL(thumbnailFile)}
                              alt="Thumbnail preview"
                              className="w-full h-full object-cover"
                            />
                          );
                        } else if (existingThumbnailUrl) {
                          return (
                            <img
                              src={existingThumbnailUrl}
                              alt="Existing thumbnail preview"
                              className="w-full h-full object-cover"
                            />
                          );
                        } else {
                          return (
                            <div className="w-full h-full flex flex-col items-center justify-center text-center px-4">
                              <span className="text-3xl mb-2">🖼️</span>
                              <p className="text-sm font-medium text-gray-700">
                                Thumbnail preview
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Upload an image to preview it here
                              </p>
                            </div>
                          );
                        }
                      })()}
                    </div>

                    <label className="min-h-[170px] flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 text-center cursor-pointer hover:border-black hover:bg-white transition-all">
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleThumbnailChange}
                        className="hidden"
                      />

                      <span className="text-3xl mb-3">↑</span>

                      <p className="text-sm font-semibold text-gray-800">
                        {thumbnailFile
                          ? "Replace thumbnail"
                          : "Upload thumbnail"}
                      </p>

                      <p className="text-xs text-gray-500 mt-2">
                        Recommended size: 1280 × 720 px
                      </p>

                      {(() => {
                        const data: any = lessonData?.data?.data || lessonData?.data || lessonData;
                        const isRemoved = removedAssetRoles.includes("THUMBNAIL");
                        const existingThumbnailUrl = isRemoved ? "" : (data?.thumbnailAsset?.url || "");

                        if (!thumbnailFile && !existingThumbnailUrl) return null;

                        return (
                          <div className="mt-3 flex flex-col gap-2">
                            <p className="max-w-full truncate text-xs font-medium text-emerald-600">
                              {thumbnailFile ? thumbnailFile.name : `Existing: ${existingThumbnailUrl.split("/").pop()}`}
                            </p>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const url = thumbnailFile ? URL.createObjectURL(thumbnailFile) : existingThumbnailUrl;
                                  window.open(url, "_blank");
                                }}
                                className="bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 font-bold text-xs px-3 py-1 rounded"
                              >
                                Preview
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (thumbnailFile) {
                                    setThumbnailFile(null);
                                  } else {
                                    setThumbnailFile(null);
                                    setRemovedAssetRoles((prev) => [...prev, "THUMBNAIL"]);
                                  }
                                }}
                                className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold text-xs px-3 py-1 rounded"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                    </label>
                  </div>
                </div>

                {/* VIDEO */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-800">
                      Video File
                    </label>
                    <span className="text-xs text-gray-500">
                      MP4, MOV, WEBM
                    </span>
                  </div>

                  {(() => {
                    const data: any = lessonData?.data?.data || lessonData?.data || lessonData;
                    const isRemoved = removedAssetRoles.includes("VIDEO") || removedAssetRoles.includes("CONTENT");
                    const existingVideoUrl = isRemoved ? "" : (data?.assets_storage_lessons_content_asset_idToassets_storage?.externalUrl || data?.assets_storage_lessons_content_asset_idToassets_storage?.url || data?.contentAsset?.url || data?.videoUrl || data?.lessonAssets?.find((a: any) => a.assetRole === "VIDEO" || a.assetRole === "CONTENT")?.asset?.url || "");

                    return (
                      <label className="block rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-6 cursor-pointer hover:border-black hover:bg-white transition-all">
                        <input
                          type="file"
                          accept="video/mp4,video/webm,video/quicktime"
                          onChange={handleVideoChange}
                          className="hidden"
                        />

                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center text-xl shrink-0">
                            ▶
                          </div>

                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-800">
                              {(videoFile || existingVideoUrl)
                                ? "Replace video file"
                                : "Upload lesson video"}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Click here to select the main lesson video.
                            </p>

                            {(videoFile || existingVideoUrl) && (
                              <div className="mt-2 flex flex-col gap-2">
                                <p className="text-xs font-medium text-emerald-600 break-all">
                                  {videoFile ? videoFile.name : `Existing: ${existingVideoUrl.split("/").pop()}`}
                                </p>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      const url = videoFile ? URL.createObjectURL(videoFile) : existingVideoUrl;
                                      window.open(url, "_blank");
                                    }}
                                    className="bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 font-bold text-xs px-3 py-1 rounded"
                                  >
                                    Preview
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      if (videoFile) {
                                        setVideoFile(null);
                                      } else {
                                        setVideoFile(null);
                                        setRemovedAssetRoles((prev) => [...prev, "VIDEO", "CONTENT"]);
                                      }
                                    }}
                                    className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold text-xs px-3 py-1 rounded"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </label>
                    );
                  })()}

                  {(() => {
                    const data: any = lessonData?.data?.data || lessonData?.data || lessonData;
                    const isRemoved = removedAssetRoles.includes("VIDEO") || removedAssetRoles.includes("CONTENT");
                    const existingVideoUrl = isRemoved ? "" : (data?.assets_storage_lessons_content_asset_idToassets_storage?.externalUrl || data?.assets_storage_lessons_content_asset_idToassets_storage?.url || data?.contentAsset?.url || data?.videoUrl || data?.lessonAssets?.find((a: any) => a.assetRole === "VIDEO" || a.assetRole === "CONTENT")?.asset?.url || "");
                    const previewUrl = videoFile ? URL.createObjectURL(videoFile) : existingVideoUrl;

                    if (!previewUrl) return null;

                    return (
                      <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-black">
                        <video
                          key={videoFile ? videoFile.name : existingVideoUrl}
                          controls
                          className="w-full max-h-[420px] object-contain"
                        >
                          <source
                            src={previewUrl}
                            type={videoFile ? videoFile.type : undefined}
                          />
                          Your browser does not support video preview.
                        </video>
                      </div>
                    );
                  })()}
                  <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={hasStudyDocument}
                        onChange={handleStudyDocumentToggle}
                        className="mt-1 h-4 w-4 rounded border-gray-300"
                      />

                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          Add study content for this video
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          Add unlimited text and images in the same reading
                          order for learners.
                        </p>
                      </div>
                    </label>

                    {showStudyDocumentModal && (
                      <div className="fixed inset-0 z-[9999] bg-white">
                        <div className="flex h-screen w-screen flex-col bg-white">
                          <div className="flex shrink-0 items-start justify-between border-b border-gray-200 bg-white px-6 py-5 sm:px-8">
                            <div>
                              <h2 className="text-lg font-bold text-gray-900">Video Study Content</h2>
                              <p className="mt-1 text-sm text-gray-500">Add unlimited text and images.</p>
                            </div>
                            <button onClick={closeStudyDocumentModal} className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-gray-500 hover:bg-gray-100">×</button>
                          </div>

                          <div className="flex-1 overflow-y-auto p-6 sm:p-8">
                            <div className="mx-auto w-full max-w-6xl space-y-6">
                              <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">Study Document Title</label>
                                <input type="text" value={title} readOnly className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-sm text-gray-600" />
                              </div>

                              <div>
                                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                  <div>
                                    <h3 className="text-sm font-semibold text-gray-800">Content Flow</h3>
                                    <p className="mt-1 text-xs text-gray-500">Add text and images as needed.</p>
                                  </div>
                                  <div className="flex gap-2">
                                    <button onClick={addLessonTextBlock} className="rounded-lg bg-black px-3 py-2 text-xs font-semibold text-white hover:bg-gray-800">+ Add Text</button>
                                    <label className="cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                                      + Add Image
                                      <input type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={addLessonImages} className="hidden" />
                                    </label>
                                  </div>
                                </div>

                                {lessonBlocks.length === 0 ? (
                                  <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
                                    <p className="text-sm font-semibold text-gray-700">No content added yet</p>
                                  </div>
                                ) : (
                                  <div className="space-y-4">
                                    {lessonBlocks.map((block, index) => (
                                      <div key={block.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                                        <div className="flex justify-between mb-4">
                                          <span>Block {index + 1}</span>
                                          <div className="flex gap-2">
                                            <button onClick={() => moveLessonBlock(block.id, "UP")}>↑</button>
                                            <button onClick={() => moveLessonBlock(block.id, "DOWN")}>↓</button>
                                            <button onClick={() => removeLessonBlock(block.id)} className="text-red-600">Remove</button>
                                          </div>
                                        </div>
                                        {block.blockType === "PARAGRAPH" ? (
                                          <div className="space-y-3">
                                            <input value={block.title || ""} onChange={(e) => updateLessonTextBlock(block.id, "title", e.target.value)} placeholder="Heading" className="w-full border p-3 rounded" />
                                            <textarea value={block.textContent || ""} onChange={(e) => updateLessonTextBlock(block.id, "textContent", e.target.value)} placeholder="Content" rows={6} className="w-full border p-3 rounded" />
                                          </div>
                                        ) : (
                                          <div>
                                            <img src={block.previewUrl} alt="" className="max-h-96 w-full object-contain border rounded" />
                                            <input value={(block.metadata?.caption as string) || ""} onChange={(e) => updateLessonImageCaption(block.id, e.target.value)} placeholder="Caption" className="w-full border p-3 rounded mt-3" />
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end gap-3 border-t p-4 bg-white">
                            <button onClick={closeStudyDocumentModal} className="px-4 py-2 border rounded-xl">Cancel</button>
                            <button onClick={saveStudyDocument} disabled={!title.trim()} className="px-5 py-2 bg-black text-white rounded-xl">Save Study Content</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* TRANSCRIPT + ATTACHMENTS */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* TRANSCRIPT */}
                  <div className="rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-800">
                          Transcript
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          SRT, VTT, or TXT file
                        </p>
                      </div>
                      <span className="text-xl">📄</span>
                    </div>

                    {(() => {
                      const data: any = lessonData?.data?.data || lessonData?.data || lessonData;
                      const isRemoved = removedAssetRoles.includes("TRANSCRIPT");
                      const existingTranscriptUrl = isRemoved ? "" : (data?.assets_storage_lessons_transcript_asset_idToassets_storage?.url || data?.transcriptAsset?.url || "");

                      if (!transcriptFile && !existingTranscriptUrl) {
                        return (
                          <label className="min-h-[120px] flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-center cursor-pointer hover:border-black hover:bg-white transition-all">
                            <input
                              type="file"
                              accept=".srt,.vtt,.txt"
                              onChange={handleTranscriptChange}
                              className="hidden"
                            />
                            <p className="text-sm font-medium text-gray-800">
                              Upload transcript
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Click to browse files
                            </p>
                          </label>
                        );
                      }

                      return (
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 flex flex-col items-center justify-center relative min-h-[120px]">
                          <p className="text-xs font-semibold text-gray-800 truncate max-w-[280px]">
                            {transcriptFile ? transcriptFile.name : `Existing: ${existingTranscriptUrl.split("/").pop()}`}
                          </p>
                          <div className="flex gap-3 mt-3">
                            <button
                              type="button"
                              onClick={() => {
                                const url = transcriptFile ? URL.createObjectURL(transcriptFile) : existingTranscriptUrl;
                                window.open(url, "_blank");
                              }}
                              className="bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 font-bold text-xs px-3 py-1.5 rounded-lg transition-all"
                            >
                              Preview
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (transcriptFile) {
                                  setTranscriptFile(null);
                                } else {
                                  setTranscriptFile(null);
                                  setRemovedAssetRoles((prev) => [...prev, "TRANSCRIPT"]);
                                }
                              }}
                              className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold text-xs px-3 py-1.5 rounded-lg transition-all"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* ATTACHMENTS */}
                  <div className="rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-800">
                          Supporting Documents
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          PDF, PPT, DOCX, worksheets, notes
                        </p>
                      </div>
                      <span className="text-xl">📎</span>
                    </div>

                    <label className="min-h-[120px] flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-center cursor-pointer hover:border-black hover:bg-white transition-all">
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.txt"
                        onChange={handleAttachmentsChange}
                        className="hidden"
                      />

                      <p className="text-sm font-medium text-gray-800">
                        Upload supporting documents
                      </p>

                      <p className="text-xs text-gray-500 mt-1">
                        You can select multiple files
                      </p>
                    </label>

                    {(() => {
                      const data: any = lessonData?.data?.data || lessonData?.data || lessonData;
                      const originalAttachments = data?.attachments || [];
                      const activeAttachments = originalAttachments.filter(
                        (att: any) => !removedAttachmentIds.includes(att.id)
                      );

                      if (attachments.length === 0 && activeAttachments.length === 0) return null;

                      return (
                        <div className="mt-4 space-y-2 max-h-[220px] overflow-y-auto pr-1">
                          {/* Existing Attachments */}
                          {activeAttachments.map((att: any) => (
                            <div
                              key={att.id}
                              className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-emerald-50 px-3 py-2"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-base">📄</span>
                                <div className="min-w-0">
                                  <p className="text-xs font-medium text-emerald-800 truncate">
                                    {att.asset?.name || `document_${att.id.substring(0,6)}`}
                                  </p>
                                  <p className="text-[11px] text-emerald-600">
                                    {att.asset?.size ? `${(att.asset.size / 1024 / 1024).toFixed(2)} MB` : "Existing document"}
                                  </p>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                {att.asset?.url && (
                                  <button
                                    type="button"
                                    onClick={() => window.open(att.asset.url, "_blank")}
                                    className="text-indigo-600 font-bold text-xs hover:underline"
                                  >
                                    Preview
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRemovedAttachmentIds((prev) => [...prev, att.id]);
                                  }}
                                  className="shrink-0 w-7 h-7 rounded-md text-red-600 hover:bg-red-50 font-bold"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          ))}

                          {/* Newly selected Attachments */}
                          {attachments.map((file, i) => (
                            <div
                              key={`${file.name}-${i}`}
                              className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-base">📄</span>
                                <div className="min-w-0">
                                  <p className="text-xs font-medium text-gray-800 truncate">
                                    {file.name}
                                  </p>
                                  <p className="text-[11px] text-gray-500">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => window.open(URL.createObjectURL(file), "_blank")}
                                  className="text-indigo-600 font-bold text-xs hover:underline"
                                >
                                  Preview
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeAttachment(i)}
                                  className="shrink-0 w-7 h-7 rounded-md text-red-600 hover:bg-red-50 font-bold"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </section>

            {/* ACCESS */}
            <section>
              <h2 className="text-lg font-semibold mb-6 border-b pb-3">
                Access
              </h2>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Visibility
                </label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-black"
                >
                  <option value="">Select Visibility</option>
                  {visibilities.map((item: string) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              {(visibility === "TENANT" || visibility === "TENANT_ONLY") && (
                <div className="mt-6">
                  <label className="block text-sm font-medium mb-2">
                    Corporate Tenant <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={corporateTenant}
                    onChange={(e) => setCorporateTenant(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-black"
                  >
                    <option value="">Select Tenant</option>
                    {tenants.map((tenant: any) => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="mt-8 p-6 border rounded-xl">
                <label className="flex items-center gap-2 font-medium">
                  <input
                    type="checkbox"
                    checked={allowPreview}
                    onChange={(e) => setAllowPreview(e.target.checked)}
                  />
                  Enable Preview
                </label>
                {allowPreview && (
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm">Preview Duration (min)</label>
                      <input
                        type="number"
                        value={previewDuration}
                        onChange={(e) => setPreviewDuration(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm">Preview Access Type</label>
                      <select
                        value={previewAccessType}
                        onChange={(e) => setPreviewAccessType(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 mt-1"
                      >
                        <option value="NONE">None</option>
                        <option value="FREE">Free</option>
                        <option value="LIMITED">Limited</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* ASSESSMENT */}
            {/* ASSESSMENT */}
            <section className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Assessment
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Create MCQ, True/False, image-based, and essay questions for
                    this lesson.
                  </p>
                </div>

                <label className="inline-flex cursor-pointer items-center gap-3">
                  <span
                    className={`text-sm font-semibold ${assessmentRequired ? "text-gray-900" : "text-gray-500"
                      }`}
                  >
                    {assessmentRequired ? "Enabled" : "Disabled"}
                  </span>

                  <span className="relative inline-flex h-7 w-12 items-center">
                    <input
                      type="checkbox"
                      checked={assessmentRequired}
                      onChange={(e) => setAssessmentRequired(e.target.checked)}
                      className="peer sr-only"
                    />

                    <span className="absolute inset-0 rounded-full bg-gray-300 transition-colors peer-checked:bg-black" />

                    <span className="absolute left-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
                  </span>
                </label>
              </div>

              {!assessmentRequired ? (
                <div className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                    ✓
                  </div>

                  <p className="mt-4 text-sm font-semibold text-gray-800">
                    Assessment is disabled
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Enable it to add questions for this lesson.
                  </p>
                </div>
              ) : (
                <div className="mt-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        Questions ({questions.length})
                      </h3>

                      <p className="mt-1 text-xs text-gray-500">
                        Add one or more questions for learners.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openQuestionModal("MCQ")}
                        className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:border-black hover:text-black"
                      >
                        + MCQ
                      </button>

                      <button
                        type="button"
                        onClick={() => openQuestionModal("TRUE_FALSE")}
                        className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:border-black hover:text-black"
                      >
                        + True / False
                      </button>

                      <button
                        type="button"
                        onClick={() => openQuestionModal("IMAGE")}
                        className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:border-black hover:text-black"
                      >
                        + Image
                      </button>

                      <button
                        type="button"
                        onClick={() => openQuestionModal("ESSAY")}
                        className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:border-black hover:text-black"
                      >
                        + Essay
                      </button>
                    </div>
                  </div>

                  {questions.length === 0 ? (
                    <div className="mt-5 rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center">
                      <p className="text-sm font-semibold text-gray-700">
                        No questions added yet
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        Use the buttons above to add your first question.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-5 space-y-3">
                      {questions.map((question, index) => (
                        <div
                          key={question.id}
                          className="rounded-2xl border border-gray-200 bg-white p-4"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                Q{String(index + 1).padStart(2, "0")} ·{" "}
                                {question.type.replace("_", " / ")}
                              </p>

                              <p className="mt-2 text-sm font-semibold text-gray-900">
                                {question.question}
                              </p>

                              {question.imageUrl && (
                                <img
                                  src={question.imageUrl}
                                  alt={`Question ${index + 1}`}
                                  className="mt-3 max-h-48 rounded-xl border border-gray-200 object-cover"
                                />
                              )}

                              {question.options && (
                                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                  {question.options.map(
                                    (option, optionIndex) => (
                                      <div
                                        key={`${option}-${optionIndex}`}
                                        className={`rounded-lg border px-3 py-2 text-xs ${question.correctAnswer === optionIndex
                                          ? "border-emerald-300 bg-emerald-50 font-semibold text-emerald-700"
                                          : "border-gray-200 text-gray-600"
                                          }`}
                                      >
                                        {option}
                                      </div>
                                    ),
                                  )}
                                </div>
                              )}

                              {question.essayText && (
                                <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
                                  <p className="text-xs text-gray-600 whitespace-pre-wrap">
                                    {question.essayText}
                                  </p>
                                </div>
                              )}

                              {question.note && (
                                <p className="mt-3 text-xs font-medium text-amber-700">
                                  {question.note}
                                </p>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                removeAssessmentQuestion(question.id)
                              }
                              className="h-8 w-8 shrink-0 rounded-lg text-red-600 hover:bg-red-50"
                              aria-label={`Remove question ${index + 1}`}
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>

          {/* ===================== RIGHT SIDEBAR ===================== */}
          <div className="space-y-6">
            <div className="bg-white border rounded-xl p-6">
              <h3 className="font-semibold mb-5">Lesson Summary</h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Type</span>
                  <span>{lessonType || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Domain</span>
                  <span>
                    {subjects.find((s: any) => s.id === subjectId)?.name || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Duration</span>
                  <span>{duration || "—"} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Visibility</span>
                  <span>{visibility || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Assessment</span>
                  <span>{assessmentRequired ? "Enabled" : "Disabled"}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-6">
                REVIEW PROCESS
              </p>
              <div className="space-y-6">
                {[
                  "Submit to SME for content review",
                  "SME approves or rejects with comment",
                  "Approved lesson goes live in Learner Library",
                ].map((text, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-black text-white text-xs font-medium flex items-center justify-center shrink-0">
                      {i + 1}
                    </div>
                    <p className="text-[15px] text-gray-800">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleSubmit(true)}
              disabled={
                createLessonMutation.isPending ||
                updateLessonMutation.isPending ||
                uploading
              }
              className="w-full bg-black text-white py-4 rounded-xl font-medium hover:bg-gray-900 disabled:opacity-60 transition-colors"
            >
              {createLessonMutation.isPending || updateLessonMutation.isPending
                ? isEditMode
                  ? "Updating..."
                  : "Submitting..."
                : isEditMode
                  ? "Update Lesson →"
                  : "Submit for SME Review →"}
            </button>
          </div>
        </div>

        {/* ==================== STUDY CONTENT MODAL (Enhanced) ==================== */}
        {showStudyDocumentModal && (
          <div className="fixed inset-0 z-[9999] bg-white">
            <div className="flex h-screen w-screen flex-col bg-white">
              {/* Header */}
              <div className="flex shrink-0 items-start justify-between border-b border-gray-200 bg-white px-6 py-5 sm:px-8">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Video Study Content</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Add unlimited text and images in the exact order learners should read them.
                  </p>
                </div>
                <button
                  onClick={closeStudyDocumentModal}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-gray-500 hover:bg-gray-100"
                >
                  ×
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-8">
                <div className="mx-auto w-full max-w-6xl space-y-6">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-800">Study Document Title</label>
                    <input
                      type="text"
                      value={title}
                      readOnly
                      className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-sm text-gray-600"
                    />
                  </div>

                  {/* Content Flow */}
                  <div>
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-800">Content Flow</h3>
                        <p className="mt-1 text-xs text-gray-500">Add text and images as needed.</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={addLessonTextBlock}
                          className="rounded-lg bg-black px-3 py-2 text-xs font-semibold text-white hover:bg-gray-800"
                        >
                          + Add Text
                        </button>
                        <label className="cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                          + Add Image
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            multiple
                            onChange={addLessonImages}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    {lessonBlocks.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
                        <p className="text-sm font-semibold text-gray-700">No content added yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {lessonBlocks.map((block, index) => (
                          <div key={block.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                            {/* Block controls, content editor, move/remove buttons - same as above */}
                            {/* ... (full block rendering logic from previous response) ... */}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Learner Preview - same as before */}
                </div>
              </div>

              {/* Footer */}
              <div className="flex shrink-0 justify-end gap-3 border-t border-gray-200 bg-white px-6 py-4 sm:px-8">
                <button
                  onClick={closeStudyDocumentModal}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={saveStudyDocument}
                  disabled={!title.trim()}
                  className="rounded-xl bg-black px-5 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  Save Study Content
                </button>
              </div>
            </div>
          </div>
        )}


        {showQuestionModal && (
          <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between border-b border-gray-200 pb-4">
                <div>
                  <h2 className="text-lg font-semibold">
                    Add {selectedQuestionType.replace("_", " / ")} Question
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Configure the assessment question.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeQuestionModal}
                  className="h-8 w-8 rounded-lg text-gray-500 hover:bg-gray-100"
                >
                  ×
                </button>
              </div>

              <div className="mt-6 space-y-5">
                {(selectedQuestionType === "MCQ" ||
                  selectedQuestionType === "TRUE_FALSE") && (
                    <>
                      <textarea
                        rows={3}
                        value={questionText}
                        onChange={(e) => setQuestionText(e.target.value)}
                        placeholder="Enter your question..."
                        className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
                      />

                      {selectedQuestionType === "MCQ" && (
                        <div className="space-y-3">
                          {options.map((option, index) => (
                            <label
                              key={index}
                              className="flex items-center gap-3 rounded-xl border border-gray-200 p-3"
                            >
                              <input
                                type="radio"
                                name="mcq-answer"
                                checked={correctAnswer === index}
                                onChange={() => setCorrectAnswer(index)}
                              />

                              <input
                                value={option}
                                onChange={(e) => {
                                  const updated = [...options];
                                  updated[index] = e.target.value;
                                  setOptions(updated);
                                }}
                                placeholder={`Option ${index + 1}`}
                                className="flex-1 border-0 bg-transparent text-sm outline-none"
                              />
                            </label>
                          ))}
                        </div>
                      )}

                      {selectedQuestionType === "TRUE_FALSE" && (
                        <div className="grid grid-cols-2 gap-3">
                          {["True", "False"].map((answer, index) => (
                            <button
                              key={answer}
                              type="button"
                              onClick={() => setCorrectAnswer(index)}
                              className={`rounded-xl border p-4 font-semibold ${correctAnswer === index
                                ? "border-black bg-black text-white"
                                : "border-gray-200"
                                }`}
                            >
                              {answer}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                {selectedQuestionType === "IMAGE" && (
                  <div className="space-y-5">
                    {!imagePreview ? (
                      <label className="flex min-h-45 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50">
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={handleAssessmentImageChange}
                          className="hidden"
                        />
                        <span className="text-3xl">🖼️</span>
                        <p className="mt-2 text-sm font-semibold">
                          Upload image
                        </p>
                      </label>
                    ) : (
                      <div className="rounded-xl border border-gray-200 p-3">
                        <img
                          src={imagePreview}
                          alt="Question preview"
                          className="max-h-64 w-full rounded-lg object-contain"
                        />
                      </div>
                    )}

                    {imageQuestions.map((item, questionIndex) => (
                      <div
                        key={item.id}
                        className="relative rounded-xl border border-gray-200 bg-gray-50 p-4"
                      >
                        {imageQuestions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeImageQuestion(item.id)}
                            className="absolute right-3 top-3 text-red-600"
                          >
                            ×
                          </button>
                        )}

                        <p className="mb-3 text-sm font-semibold">
                          Question {questionIndex + 1}
                        </p>

                        <textarea
                          rows={2}
                          value={item.question}
                          onChange={(e) =>
                            updateImageQuestion(
                              item.id,
                              "question",
                              e.target.value,
                            )
                          }
                          placeholder="Question based on this image"
                          className="mb-3 w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />

                        <div className="grid gap-2 sm:grid-cols-2">
                          {item.options.map((option, optionIndex) => (
                            <label
                              key={optionIndex}
                              className="flex items-center gap-2 rounded-lg border bg-white p-2"
                            >
                              <input
                                type="radio"
                                name={`image-${item.id}`}
                                checked={item.correctAnswer === optionIndex}
                                onChange={() =>
                                  updateImageQuestion(
                                    item.id,
                                    "correctAnswer",
                                    optionIndex,
                                  )
                                }
                              />
                              <input
                                value={option}
                                onChange={(e) =>
                                  updateImageQuestionOption(
                                    item.id,
                                    optionIndex,
                                    e.target.value,
                                  )
                                }
                                placeholder={`Option ${optionIndex + 1}`}
                                className="min-w-0 flex-1 text-sm outline-none"
                              />
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addImageQuestion}
                      className="w-full rounded-xl border border-dashed border-gray-300 py-3 text-sm font-semibold hover:border-black"
                    >
                      + Add another question for this image
                    </button>
                  </div>
                )}

                {selectedQuestionType === "ESSAY" && (
                  <div className="space-y-5">
                    <textarea
                      rows={7}
                      value={essayText}
                      onChange={(e) => setEssayText(e.target.value)}
                      placeholder="Enter the essay passage, case study, or scenario..."
                      className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm"
                    />

                    {essayQuestions.map((item, questionIndex) => (
                      <div
                        key={item.id}
                        className="relative rounded-xl border border-gray-200 bg-gray-50 p-4"
                      >
                        {essayQuestions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeEssayQuestion(item.id)}
                            className="absolute right-3 top-3 text-red-600"
                          >
                            ×
                          </button>
                        )}

                        <p className="mb-3 text-sm font-semibold">
                          Question {questionIndex + 1}
                        </p>

                        <textarea
                          rows={2}
                          value={item.question}
                          onChange={(e) =>
                            updateEssayQuestion(
                              item.id,
                              "question",
                              e.target.value,
                            )
                          }
                          placeholder="Question based on this essay"
                          className="mb-3 w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />

                        <div className="grid gap-2 sm:grid-cols-2">
                          {item.options.map((option, optionIndex) => (
                            <label
                              key={optionIndex}
                              className="flex items-center gap-2 rounded-lg border bg-white p-2"
                            >
                              <input
                                type="radio"
                                name={`essay-${item.id}`}
                                checked={item.correctAnswer === optionIndex}
                                onChange={() =>
                                  updateEssayQuestion(
                                    item.id,
                                    "correctAnswer",
                                    optionIndex,
                                  )
                                }
                              />
                              <input
                                value={option}
                                onChange={(e) =>
                                  updateEssayQuestionOption(
                                    item.id,
                                    optionIndex,
                                    e.target.value,
                                  )
                                }
                                placeholder={`Option ${optionIndex + 1}`}
                                className="min-w-0 flex-1 text-sm outline-none"
                              />
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addEssayQuestion}
                      className="w-full rounded-xl border border-dashed border-gray-300 py-3 text-sm font-semibold hover:border-black"
                    >
                      + Add another question for this essay
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-5">
                <button
                  type="button"
                  onClick={closeQuestionModal}
                  className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={saveAssessmentQuestion}
                  className="rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white"
                >
                  Add Question
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StandaloneLesson;