
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import Select from "react-select";
import LanguageList from "language-list";
import { useCreateLesson, useUpdateLesson, useLesson } from "../../hooks/lesson/useLessons";
import { useDifficultyLevels, useLessonTypes } from "../../hooks/useEnums";
import { useSkills, useTags, useCreateTag, useCreateSkill } from "../../hooks/useMaster";
import { useAssets } from "../../hooks/asset/useAssets";
import { useSubjects } from "../../hooks/useSubjects";
import { notification } from "antd";

/**
 * StandaloneCourseLessonAdded.tsx
 *
 * Adds a single lesson to an EXISTING course (courseId comes from the route).
 * This is intentionally a stripped-down version of the full Standalone Lesson
 * uploader — it does not include Subject / Skills / Learning Outcomes /
 * Visibility / Tenant / Assessment Builder, because those concepts belong to
 * standalone library lessons, not lessons nested inside a course.
 *
 * Flow:
 *   CourseBuilderLessons -> "+ Add Lesson" -> StandaloneCourseLessonAdded
 *     1. Create lesson (courseIds: [courseId])
 *     2. Upload assets (thumbnail / primary content / transcript / attachments)
 *     3. PATCH lesson with returned asset ids
 *     4. Navigate back to CourseBuilderLessons
 */

interface StandaloneCourseLessonAddedProps {
  courseId?: string | null;
  careerPathId?: string | null;
  lessonId?: string | null;
  lessonType?: string;
  initialLessonData?: any;
  onClose?: (lesson?: any) => void;
}

const StandaloneCourseLessonAdded: React.FC<StandaloneCourseLessonAddedProps> = (props) => {
  // ==================== TYPES ====================
  type StudyContentBlock =
    | {
      id: string;
      type: "TEXT";
      heading: string;
      content: string;
    }
    | {
      id: string;
      type: "IMAGE";
      file: File;
      previewUrl: string;
      caption: string;
      assetId?: string;
      assetUrl?: string;
    };

  type SavedStudyDocumentBlock =
    | {
      id: string;
      order: number;
      type: "TEXT";
      heading: string;
      content: string;
    }
    | {
      id: string;
      order: number;
      type: "IMAGE";
      caption: string;
      assetId?: string;
      assetUrl?: string;
      fileName: string;
    };

  type StudyDocument = {
    title: string;
    blocks: SavedStudyDocumentBlock[];
  };

  // ==================== ROUTING / MUTATIONS ====================
  const navigate = useNavigate();
  const { courseId: routeCourseId, lessonId: routeLessonId } = useParams<{
    courseId: string;
    lessonId?: string;
  }>();
  const location = useLocation();
  const courseId = props.courseId || routeCourseId || location.state?.courseId;
  const careerPathId = props.careerPathId || location.state?.careerPathId;
  const lessonId = props.lessonId !== undefined ? props.lessonId : routeLessonId;
  const isEditMode = Boolean(lessonId);
  const queryClient = useQueryClient();

  const createLessonMutation = useCreateLesson();
  const updateLessonMutation = useUpdateLesson();
  const createTagMutation = useCreateTag();
  const createSkillMutation = useCreateSkill();
  const { uploadAsset, getAllAssets, uploadAssetDirectly } = useAssets();

  // Fetch lesson data if in edit mode
  const { data: lessonData, isLoading: isLoadingLesson } = useLesson(lessonId || undefined);

  const [lessonAssetsData, setLessonAssetsData] = useState<any[]>([]);
  useEffect(() => {
    if (lessonId) {
      getAllAssets({ lessonId }).then(setLessonAssetsData);
    }
  }, [lessonId, getAllAssets]);

  // ==================== ENUMS ====================
  const { data: lessonTypes = [] } = useLessonTypes();
  const { data: difficultyLevels = [] } = useDifficultyLevels();
  const { data: skillsData = [] } = useSkills();
  const { data: tagsData = [] } = useTags();
  const { subjects = [] } = useSubjects();

  const languageList = new LanguageList();
  const languages = languageList.getData();
  const previewAccessTypes = ["NONE", "PREVIEW", "FULL"];

  // ==================== FORM STATE ====================
  const [lessonType, setLessonType] = useState(props.lessonType || location.state?.lessonType || "VIDEO");
  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [language, setLanguage] = useState("ENGLISH");
  const [difficulty, setDifficulty] = useState("");
  const [tagLine, setTagLine] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [allowPreview, setAllowPreview] = useState(false);
  const [previewDuration, setPreviewDuration] = useState<number | "">("");
  const [previewAccessType, setPreviewAccessType] = useState("");

  // Tags
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  // Skills students will gain
  const [skillInput, setSkillInput] = useState("");
  const [skillTags, setSkillTags] = useState<string[]>([]);
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);

  // Learning outcomes
  const [learningOutcomeInput, setLearningOutcomeInput] = useState("");
  const [learningOutcomes, setLearningOutcomes] = useState<string[]>([]);

  // File state
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [removedAssetRoles, setRemovedAssetRoles] = useState<string[]>([]);
  const [removedAttachmentIds, setRemovedAttachmentIds] = useState<string[]>([]);

  // Study content state
  const [hasStudyDocument, setHasStudyDocument] = useState(false);
  const [showStudyDocumentModal, setShowStudyDocumentModal] = useState(false);
  const [studyDocumentBlocks, setStudyDocumentBlocks] = useState<StudyContentBlock[]>([]);
  const [studyDocument, setStudyDocument] = useState<StudyDocument | null>(null);

  const [uploading, setUploading] = useState(false);

  // Populate form if we have existing lesson data
  useEffect(() => {
    if (isEditMode && (lessonData || props.initialLessonData)) {
      const data: any = lessonData?.data?.data || lessonData?.data || lessonData || props.initialLessonData;
      setLessonType(data.lessonType || data.type || props.lessonType || "");
      setTitle(data.title || "");
      setShortDescription(data.shortDescription || "");
      setDescription(data.description || "");
      setDuration(data.duration?.toString() || "");
      setLanguage(data.language || "ENGLISH");
      setDifficulty(data.difficulty || data.difficultyLevel || "");
      setTagLine(data.tagLine || data.tagline || "");
      setSubjectId(data.subjectId || data.categoryId || "");
      setAllowPreview(data.allowPreview || false);
      setPreviewDuration(data.previewDuration || "");
      setPreviewAccessType(data.previewAccessType || "");

      if (data.learningOutcomes) {
        if (Array.isArray(data.learningOutcomes)) {
          setLearningOutcomes(data.learningOutcomes);
        } else if (typeof data.learningOutcomes === "string") {
          try {
            const parsed = JSON.parse(data.learningOutcomes);
            if (Array.isArray(parsed)) setLearningOutcomes(parsed);
          } catch (e) {
            setLearningOutcomes([data.learningOutcomes]);
          }
        }
      }

      // If there are skills/tags associated, we might want to map them here
      const fetchedSkills = data.lessonSkills || data.skills || data.skillIds;
      if (fetchedSkills && skillsData.length > 0) {
        const parsedSkillNames = fetchedSkills.map((s: any) => {
          if (typeof s === "string") {
            const found = skillsData.find((skill: any) => skill.id === s);
            return found ? found.name : s;
          }
          return s.skill?.name || s.name || s;
        }).filter(Boolean);
        const parsedSkillIds = fetchedSkills.map((s: any) => {
          if (typeof s === "string") {
            const found = skillsData.find((skill: any) => skill.id === s);
            return found ? found.id : s;
          }
          return s.skillId || s.id || s.skill?.id || "";
        }).filter(Boolean);
        setSkillTags(parsedSkillNames);
        setSelectedSkillIds(parsedSkillIds);
      } else if (data.skillTags) {
        setSkillTags(data.skillTags.map((s: any) => typeof s === "string" ? s : (s.skill?.name || s.name || s)));
      }

      const fetchedTags = data.lessonTags || data.tags || data.tagIds;
      if (fetchedTags && tagsData.length > 0) {
        const parsedTags = fetchedTags.map((t: any) => {
          if (typeof t === "string") {
            const found = tagsData.find((tag: any) => tag.id === t);
            return found ? found.name : t;
          }
          return t.tag?.name || t.name || t;
        }).filter(Boolean);
        setTags(parsedTags);
      }

      // If there are study blocks
      if (data.lessonContents && data.lessonContents.length > 0) {
        setHasStudyDocument(true);
        const firstDoc = data.lessonContents[0];
        if (firstDoc && Array.isArray(firstDoc.blocks)) {
          const mappedBlocks = firstDoc.blocks.map((b: any) => {
            if (b.blockType === "IMAGE" || b.type === "IMAGE") {
              return {
                id: b.id,
                type: "IMAGE" as const,
                caption: b.metadata?.caption || b.caption || "",
                assetUrl: b.asset?.signedUrl || b.asset?.url || b.assetUrl || b.previewUrl || "",
                assetId: b.assetId || "",
                fileName: b.asset?.name || "image.png"
              } as any;
            }
            return {
              id: b.id,
              type: "TEXT" as const,
              heading: b.title || b.heading || "",
              content: b.textContent || b.content || "",
            } as any;
          });
          setStudyDocumentBlocks(mappedBlocks);
          setStudyDocument({
            title: firstDoc.title || data.title || "",
            blocks: mappedBlocks
          });
        }
      }
    } else if (!isEditMode) {
      setLessonType(props.lessonType || "VIDEO");
      setTitle("");
      setShortDescription("");
      setDescription("");
      setDuration("");
      setLanguage("ENGLISH");
      setDifficulty("");
      setTagLine("");
      setSubjectId("");
      setAllowPreview(false);
      setPreviewDuration("");
      setPreviewAccessType("");
      setTags([]);
      setTagInput("");
      setSkillTags([]);
      setSelectedSkillIds([]);
      setLearningOutcomes([]);
      setThumbnailFile(null);
      setVideoFile(null);
      setTranscriptFile(null);
      setAttachments([]);
      setRemovedAssetRoles([]);
      setRemovedAttachmentIds([]);
      setHasStudyDocument(false);
      setStudyDocumentBlocks([]);
      setStudyDocument(null);
    }
  }, [isEditMode, lessonData, props.initialLessonData, props.lessonType, tagsData, skillsData]);

  const ownerId = React.useMemo(() => {
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

  // ==================== TAGS HELPERS ====================
  const addTag = (rawTag: string) => {
    if (!rawTag) return;
    const parts = rawTag.split(",").map((s) => s.replace(/^#/, "").trim().toLowerCase()).filter(Boolean);
    if (parts.length === 0) return;
    setTags((prev) => {
      const newTags = [...prev];
      parts.forEach((cleanTag) => {
        if (!newTags.some((tag) => tag.toLowerCase() === cleanTag)) {
          newTags.push(cleanTag);
        }
      });
      return newTags;
    });
    setTagInput("");
  };

  const removeTag = (index: number) => {
    setTags((prev) => prev.filter((_, i) => i !== index));
  };

  const filteredTags = useMemo(() => {
    const needle = tagInput.replace(/^#/, "").trim().toLowerCase();
    if (!needle) return [];
    return tagsData.filter(
      (t: any) =>
        t.name.toLowerCase().includes(needle) &&
        !tags.some((tag) => tag.toLowerCase() === t.name.toLowerCase()),
    );
  }, [tagInput, tagsData, tags]);

  // ==================== SKILLS HELPERS ====================
  const filteredSkills = useMemo(() => {
    const needle = skillInput.replace(/^#/, "").trim().toLowerCase();
    if (!needle) return [];
    return skillsData.filter(
      (skill: any) =>
        skill.name.toLowerCase().includes(needle) &&
        !selectedSkillIds.includes(skill.id),
    );
  }, [skillInput, skillsData, selectedSkillIds]);

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
    if (skillObj) {
      setSelectedSkillIds((prev) => prev.filter((id) => id !== skillObj.id));
    }
  };

  // ==================== LEARNING OUTCOMES HELPERS ====================
  const addLearningOutcome = (outcome: string) => {
    const trimmed = outcome.trim();
    if (trimmed && !learningOutcomes.includes(trimmed)) {
      setLearningOutcomes((prev) => [...prev, trimmed]);
    }
    setLearningOutcomeInput("");
  };

  const removeLearningOutcome = (index: number) => {
    setLearningOutcomes((prev) => prev.filter((_, i) => i !== index));
  };

  // ==================== STUDY CONTENT HELPERS ====================
  const createStudyTextBlock = (): StudyContentBlock => ({
    id: crypto.randomUUID(),
    type: "TEXT",
    heading: "",
    content: "",
  });

  const openStudyDocumentModal = () => {
    if (!title.trim()) {
      alert("Please enter the lesson title before adding study content.");
      return false;
    }
    if (studyDocumentBlocks.length === 0) {
      setStudyDocumentBlocks([createStudyTextBlock()]);
    }
    setShowStudyDocumentModal(true);
    return true;
  };

  const closeStudyDocumentModal = () => setShowStudyDocumentModal(false);

  const handleStudyDocumentToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    if (checked) {
      const opened = openStudyDocumentModal();
      if (!opened) {
        setHasStudyDocument(false);
        return;
      }
      setHasStudyDocument(true);
      return;
    }
    setHasStudyDocument(false);
    setShowStudyDocumentModal(false);
    setStudyDocumentBlocks([]);
    setStudyDocument(null);
  };

  const addStudyTextBlock = () => {
    setStudyDocumentBlocks((previous) => [...previous, createStudyTextBlock()]);
  };

  const insertStudyTextBlockAfter = (blockId: string) => {
    const newBlock = createStudyTextBlock();
    setStudyDocumentBlocks((previous) => {
      const index = previous.findIndex((block) => block.id === blockId);
      if (index === -1) return [...previous, newBlock];
      return [...previous.slice(0, index + 1), newBlock, ...previous.slice(index + 1)];
    });
  };

  const updateStudyTextBlock = (
    blockId: string,
    field: "heading" | "content",
    value: string,
  ) => {
    setStudyDocumentBlocks((previous) =>
      previous.map((block) => {
        if (block.id !== blockId || block.type !== "TEXT") return block;
        return { ...block, [field]: value };
      }),
    );
  };

  const createStudyImageBlocks = (files: File[]): StudyContentBlock[] =>
    files.map((file) => ({
      id: crypto.randomUUID(),
      type: "IMAGE",
      file,
      previewUrl: URL.createObjectURL(file),
      caption: "",
    }));

  const addStudyImages = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    setStudyDocumentBlocks((previous) => [...previous, ...createStudyImageBlocks(files)]);
    event.target.value = "";
  };

  const insertStudyImagesAfter = (
    event: React.ChangeEvent<HTMLInputElement>,
    blockId: string,
  ) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    const newBlocks = createStudyImageBlocks(files);
    setStudyDocumentBlocks((previous) => {
      const index = previous.findIndex((block) => block.id === blockId);
      if (index === -1) return [...previous, ...newBlocks];
      return [...previous.slice(0, index + 1), ...newBlocks, ...previous.slice(index + 1)];
    });
    event.target.value = "";
  };

  const updateStudyImageCaption = (blockId: string, caption: string) => {
    setStudyDocumentBlocks((previous) =>
      previous.map((block) => {
        if (block.id !== blockId || block.type !== "IMAGE") return block;
        return { ...block, caption };
      }),
    );
  };

  const removeStudyBlock = (blockId: string) => {
    setStudyDocumentBlocks((previous) => {
      const block = previous.find((item) => item.id === blockId);
      if (block?.type === "IMAGE") {
        URL.revokeObjectURL(block.previewUrl);
      }
      return previous.filter((item) => item.id !== blockId);
    });
  };

  const moveStudyBlock = (blockId: string, direction: "UP" | "DOWN") => {
    setStudyDocumentBlocks((previous) => {
      const currentIndex = previous.findIndex((block) => block.id === blockId);
      if (currentIndex === -1) return previous;
      const nextIndex = direction === "UP" ? currentIndex - 1 : currentIndex + 1;
      if (nextIndex < 0 || nextIndex >= previous.length) return previous;
      const updated = [...previous];
      [updated[currentIndex], updated[nextIndex]] = [updated[nextIndex], updated[currentIndex]];
      return updated;
    });
  };

  const saveStudyDocument = () => {
    if (!title.trim()) {
      alert("Please enter the lesson title before saving study content.");
      return;
    }

    const validBlocks = studyDocumentBlocks.filter((block) => {
      if (block.type === "TEXT") {
        return Boolean(block.heading?.trim() || block.content?.trim());
      }
      return Boolean(block.file || block.assetId || block.assetUrl);
    });

    if (validBlocks.length === 0) {
      alert("Add at least one text block or image.");
      return;
    }

    const documentBlocks: SavedStudyDocumentBlock[] = validBlocks.map((block, index) => {
      if (block.type === "TEXT") {
        return {
          id: block.id,
          order: index + 1,
          type: "TEXT",
          heading: block.heading?.trim() || "",
          content: block.content?.trim() || "",
        };
      }
      return {
        id: block.id,
        order: index + 1,
        type: "IMAGE",
        caption: block.caption?.trim() || "",
        fileName: block.file?.name || (block as any).fileName || "image.png",
        assetId: block.assetId,
        assetUrl: block.assetUrl,
      };
    });

    setStudyDocument({ title: title.trim(), blocks: documentBlocks });
    setHasStudyDocument(true);
    setShowStudyDocumentModal(false);
  };

  useEffect(() => {
    return () => {
      studyDocumentBlocks.forEach((block) => {
        if (block.type === "IMAGE") {
          URL.revokeObjectURL(block.previewUrl);
        }
      });
    };
  }, [studyDocumentBlocks]);

  // ==================== FILE HANDLERS ====================
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
      setAttachments((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  }, []);

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // ==================== SUBMIT ====================
  const uploadOneAsset = async (
    file: File,
    assetType: "IMAGE" | "VIDEO" | "DOCUMENT",
    storagePath: string,
    lessonIdForAsset: string,
  ) => {
    const payload = {
      assetContext: "LESSON",
      assetType,
      storagePath,
      lessonId: lessonIdForAsset,
      uploadedBy: ownerId,
    };



    const formData = new FormData();
    formData.append("file", file);
    Object.entries(payload).forEach(([key, val]) => formData.append(key, val as string));

    return uploadAsset(formData, true);
  };
  console.log("Route Course ID:", courseId);

  const handleSubmit = async (submitForReview: boolean) => {
    console.log("Submitting Course ID:", courseId);
    // For standalone lessons, courseId will be undefined/null.
    const isStandalone = !courseId;

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

      // Create new tags if they don't exist
      const finalTagIds = tagsData
        .filter((t: any) => tags.some((tag) => tag.toLowerCase() === t.name.toLowerCase()))
        .map((t: any) => t.id);

      for (const tag of tags) {
        if (!tagsData.some((t: any) => t.name.toLowerCase() === tag.toLowerCase())) {
          try {
            const newTag = await createTagMutation.mutateAsync({ name: tag });
            if (newTag?.id) finalTagIds.push(newTag.id);
            else if (newTag?.data?.id) finalTagIds.push(newTag.data.id);
          } catch (e) { console.error("Error creating tag:", e); }
        }
      }

      // Create new skills if they don't exist
      const finalSkillIds = [...selectedSkillIds];
      for (const skill of skillTags) {
        if (!skillsData.some((s: any) => s.name.toLowerCase() === skill.toLowerCase())) {
          try {
            const newSkill = await createSkillMutation.mutateAsync({ name: skill });
            if (newSkill?.id) finalSkillIds.push(newSkill.id);
            else if (newSkill?.data?.id) finalSkillIds.push(newSkill.data.id);
          } catch (e) { console.error("Error creating skill:", e); }
        }
      }

      // ---------------- STEP 1: CREATE LESSON ----------------
      const basePayload: any = {
        title: title.trim(),
        lessonType,
        shortDescription: shortDescription.trim() || undefined,
        description: description.trim() || undefined,
        slug: title.toLowerCase().replace(/\s+/g, "-"),
        duration: duration ? Math.max(0, Number(duration)) : undefined,
        language,
        difficulty: difficulty || undefined,
        allowPreview,

        previewDuration:
          allowPreview && previewDuration !== ""
            ? Math.max(0, Number(previewDuration))
            : undefined,

        previewAccessType:
          allowPreview
            ? previewAccessType
            : undefined,
        tagline: tagLine.trim() || undefined,
        learningOutcomes: learningOutcomes.length > 0 ? learningOutcomes : undefined,
        videoThreshold: 80,
        completionThreshold: 100,
        notifyOnUpdate: true,
        status: submitForReview ? "SUBMITTED" : "DRAFT",
        skillIds: finalSkillIds,
        tagIds: finalTagIds,
        subjectId: subjectId || undefined,
      };

      const lessonPayload = isEditMode
        ? { ...basePayload }
        : {
          ...basePayload,
          ownerId,
          isStandalone,
          courseIds: courseId ? [courseId] : undefined,
          personaIds: [],
          tenantIds: [],
        };

      let finalLessonId: string;

      if (isEditMode && lessonId) {
        await updateLessonMutation.mutateAsync({
          lessonId: lessonId,
          data: lessonPayload,
        });
        finalLessonId = lessonId;
      } else {
        const lesson = await createLessonMutation.mutateAsync(lessonPayload as any);
        console.log("Lesson Payload:", lessonPayload);
        console.log("Create Lesson Response:", lesson);
        finalLessonId = lesson?.id || lesson?.data?.id || lesson?.lesson?.id;

        if (!finalLessonId) {
          throw new Error("Lesson ID not returned from create API");
        }
      }

      // ---------------- STEP 2: UPLOAD ASSETS ----------------
      let thumbnailAssetId: string | undefined;
      let contentAssetId: string | undefined;
      let transcriptAssetId: string | undefined;
      const attachmentIds: string[] = [];

      if (thumbnailFile) {
        const asset = await uploadOneAsset(thumbnailFile, "IMAGE", "thumbnails", finalLessonId);
        thumbnailAssetId = asset.id;
      }

      if (videoFile) {
        const asset = await uploadOneAsset(videoFile, "VIDEO", "videos", finalLessonId);
        contentAssetId = asset.id;
      }

      if (transcriptFile) {
        const asset = await uploadOneAsset(transcriptFile, "DOCUMENT", "transcripts", finalLessonId);
        transcriptAssetId = asset.id;
      }

      for (const file of attachments) {
        const asset = await uploadOneAsset(file, "DOCUMENT", "attachments", finalLessonId);
        attachmentIds.push(asset.id);
      }

      // Upload Study Content image files
      let finalLessonContents: any[] | undefined = undefined;
      if (hasStudyDocument && studyDocument && studyDocument.blocks?.length > 0) {
        const updatedBlocks = await Promise.all(
          studyDocument.blocks.map(async (block, index) => {
            let assetId = (block as any).assetId;
            let assetUrl = (block as any).assetUrl;

            if (block.type === "IMAGE") {
              const liveBlock = studyDocumentBlocks.find((b) => b.id === block.id);
              const fileToUpload = (liveBlock as any)?.file;
              if (fileToUpload) {
                try {
                  const asset = await uploadOneAsset(fileToUpload, "IMAGE", "thumbnails", finalLessonId);
                  assetId = asset.id;
                  assetUrl = asset.url;
                } catch (err) {
                  console.error("Study block image upload error", err);
                }
              }
            }

            return {
              blockType: block.type === "IMAGE" ? "IMAGE" : "PARAGRAPH",
              title: (block as any).heading || "",
              textContent: (block as any).content || "",
              assetId: assetId || undefined,
              metadata: block.type === "IMAGE" ? { caption: (block as any).caption || "" } : undefined,
              displayOrder: index + 1,
            };
          })
        );

        finalLessonContents = [{
          title: studyDocument.title || title.trim(),
          format: lessonType === "VIDEO" ? "VIDEO" : (lessonType === "PDF" ? "PDF" : "TEXT_IMAGE"),
          estimatedDuration: 0,
          displayOrder: 1,
          isDefault: true,
          blocks: updatedBlocks,
        }];
      } else if (!hasStudyDocument && isEditMode) {
        finalLessonContents = [];
      }

      // ---------------- STEP 3: UPDATE LESSON ----------------
      const hasRemovals = removedAssetRoles.length > 0 || removedAttachmentIds.length > 0;

      if (thumbnailAssetId || contentAssetId || transcriptAssetId || attachmentIds.length || hasRemovals || finalLessonContents !== undefined) {
        const updatePayload: any = {
          ...lessonPayload,
        };

        if (finalLessonContents !== undefined) {
          updatePayload.lessonContents = finalLessonContents;
        }

        if (thumbnailAssetId) {
          updatePayload.thumbnailAssetId = thumbnailAssetId;
        } else if (removedAssetRoles.includes("THUMBNAIL")) {
          updatePayload.thumbnailAssetId = null;
        }

        if (contentAssetId) {
          updatePayload.contentAssetId = contentAssetId;
        } else if (removedAssetRoles.includes("VIDEO") || removedAssetRoles.includes("CONTENT")) {
          updatePayload.contentAssetId = null;
        }

        if (transcriptAssetId) {
          updatePayload.transcriptAssetId = transcriptAssetId;
        } else if (removedAssetRoles.includes("TRANSCRIPT")) {
          updatePayload.transcriptAssetId = null;
        }

        const originalAttachments = lessonData?.data?.data?.lessonAssets?.filter((a: any) => a.assetRole === "ATTACHMENT") ||
          lessonData?.data?.lessonAssets?.filter((a: any) => a.assetRole === "ATTACHMENT") || [];
        const remainingAttachmentIds = originalAttachments
          .map((a: any) => a.assetId)
          .filter((id: string) => !removedAttachmentIds.includes(id));

        updatePayload.attachmentIds = [...remainingAttachmentIds, ...attachmentIds];

        await updateLessonMutation.mutateAsync({
          lessonId: finalLessonId,
          data: updatePayload,
        });
      }


      await queryClient.invalidateQueries({ queryKey: ["course-lessons"] });
      await queryClient.invalidateQueries({ queryKey: ["career-path-courses"] });
      await queryClient.invalidateQueries({ queryKey: ["course-details"] });
      await queryClient.invalidateQueries({ queryKey: ["lesson"] });
      await queryClient.invalidateQueries({ queryKey: ["lessons"] });

      if (props.onClose) {
        props.onClose({
          id: finalLessonId,
          title: title.trim(),
          lessonType,
          duration: duration ? Math.max(0, Number(duration)) : undefined,
          shortDescription: shortDescription.trim() || undefined,
          status: submitForReview ? "SUBMITTED" : "DRAFT",
        });
      } else {
        navigate(-1);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to add lesson to course");
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    if (props.onClose) {
      props.onClose();
    } else {
      navigate(-1);
    }
  };

  // ==================== RENDER ====================
  return (

    <div className="min-h-screen bg-gray-50 p-6 relative z-9999">
      {/* FULL PAGE LOADER OVERLAY */}
      {uploading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="flex flex-col items-center bg-white p-6 rounded-xl shadow-xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mb-4"></div>
            <p className="font-semibold text-gray-800 text-sm">Saving Lesson & Uploading Assets...</p>
            <p className="text-xs text-gray-500 mt-1">Please do not close this window</p>
          </div>
        </div>
      )}

      <div className="w-full min-w-0 pb-12">
        <button
          onClick={handleCancel}
          className="text-sm text-gray-500 hover:text-black mb-6 flex items-center gap-1"
        >
          ← Back to Course Lessons
        </button>

        {isLoadingLesson && isEditMode && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="flex flex-col items-center bg-white p-6 rounded-xl shadow-xl">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mb-4"></div>
              <p className="font-semibold text-gray-800 text-sm">Loading lesson data...</p>
            </div>
          </div>
        )}

        <h1 className="text-2xl font-bold mb-1">
          {isEditMode ? "Edit Lesson" : "Add Lesson"}
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          This lesson will be added to the current course.
        </p>

        <div className="bg-white border rounded-xl p-8 space-y-10">
          {/* LESSON DETAILS */}
          <section>
            <h2 className="text-lg font-semibold mb-6 border-b pb-3">
              Lesson Details
            </h2>

            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">

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
                    Lesson Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={lessonType}
                    onChange={(e) => setLessonType(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-black"
                  >
                    <option value="">Select Lesson Type</option>
                    {lessonTypes.map((type: string) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>


              </div>


              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tag Line */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tag Line
                  </label>
                  <input
                    type="text"
                    value={tagLine}
                    onChange={(e) => setTagLine(e.target.value)}
                    placeholder="One-line description shown on lesson cards"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-black"
                  />
                </div>

                {/* Language */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Language {!isEditMode && <span className="text-red-500">*</span>}
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
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Category
                  </label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-black"
                  >
                    <option value="">Select Category</option>
                    {subjects?.map((subj: any) => (
                      <option key={subj.id} value={subj.id}>
                        {subj.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Duration (minutes) <span className="text-gray-400 font-normal ml-1">(auto-calculated)</span>
                  </label>
                  <input
                    type="number"
                    value={duration}
                    readOnly
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium text-gray-500 cursor-not-allowed focus:outline-none"
                  />
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


              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Short Description
                  </label>
                  <textarea
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    placeholder="Short description (max 160 chars)"
                    rows={4}
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
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Learning Outcomes
                </label>
                <input
                  type="text"
                  value={learningOutcomeInput}
                  onChange={(e) => setLearningOutcomeInput(e.target.value.toLowerCase())}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && learningOutcomeInput.trim()) {
                      e.preventDefault();
                      addLearningOutcome(learningOutcomeInput);
                    }
                  }}
                  placeholder="Add learning outcome and press Enter"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-black"
                />
                <div className="flex flex-wrap gap-3 mt-3">
                  {learningOutcomes.map((outcome, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-4 py-2 text-sm bg-emerald-50 border border-emerald-200 rounded-full"
                    >
                      {outcome}{" "}
                      <button
                        type="button"
                        onClick={() => removeLearningOutcome(i)}
                        className="font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* TAGS */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tags
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.includes(",")) {
                          addTag(val);
                        } else {
                          setTagInput(val.toLowerCase());
                        }
                      }}
                      onKeyDown={(e) => {
                        if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
                          e.preventDefault();
                          addTag(tagInput);
                        }
                      }}
                      placeholder="#Add tag and press Enter or comma"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-black"
                    />
                    {filteredTags.length > 0 && (
                      <div className="absolute z-20 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredTags.map((tag: any) => (
                          <button
                            key={tag.id}
                            type="button"
                            className="w-full text-left px-4 py-2 hover:bg-gray-100"
                            onClick={() => addTag(tag.name)}
                          >
                            #{tag.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 mt-3">
                    {tags.map((tag, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-4 py-2 text-sm bg-blue-50 border border-blue-200 rounded-full"
                      >
                        #{tag}{" "}
                        <button
                          type="button"
                          onClick={() => removeTag(i)}
                          className="font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* SKILLS STUDENTS WILL GAIN */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Skills Students Will Gain
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value.toLowerCase())}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && skillInput.trim()) {
                          e.preventDefault();
                          const clean = skillInput.replace(/^#/, "").trim();
                          if (clean && !skillTags.includes(clean)) {
                            setSkillTags((prev) => [...prev, clean]);
                            const existing = skillsData.find((s: any) => s.name.toLowerCase() === clean.toLowerCase());
                            if (existing && !selectedSkillIds.includes(existing.id)) {
                              setSelectedSkillIds((prev) => [...prev, existing.id]);
                            }
                          }
                          setSkillInput("");
                        }
                      }}
                      placeholder="Search or type skill and press Enter"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-black"
                    />
                    {filteredSkills.length > 0 && (
                      <div className="absolute z-20 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredSkills.map((skill: any) => (
                          <button
                            key={skill.id}
                            type="button"
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
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-emerald-50 border border-emerald-200 rounded-full"
                      >
                        #{skill}
                        <button
                          type="button"
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
            </div>
          </section>

          {/* Primary Content */}
          <section>

            <h2 className="text-lg font-semibold mb-6 border-b pb-3">
              Lesson Content
            </h2>

            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Thumbnail Upload */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Thumbnail Upload {!isEditMode && <span className="text-red-500">*</span>}
                  </label>
                  {(() => {
                    const data: any = lessonData?.data?.data || lessonData?.data || lessonData || props.initialLessonData;
                    const isRemoved = removedAssetRoles.includes("THUMBNAIL");
                    const thumbId = data?.thumbnailAssetId || data?.thumbnail_asset_id || data?.thumbnailAsset?.id;
                    const dbThumbnailAsset = lessonAssetsData.find((a: any) => a.id === thumbId) || lessonAssetsData.find((a: any) => a.assetType === "IMAGE" && (a.storagePath === "thumbnails" || a.assetContext === "COURSE_THUMBNAIL" || a.assetContext === "LESSON"));
                    const fallbackThumbnailAsset = data?.lessonAssets?.find((a: any) => a.assetRole === "THUMBNAIL")?.asset;
                    const existingThumbnailAsset = dbThumbnailAsset || fallbackThumbnailAsset;
                    const existingThumbnailUrl = isRemoved ? "" : (existingThumbnailAsset?.signedUrl || existingThumbnailAsset?.url || "");
                    const existingThumbnailName = isRemoved ? "" : (existingThumbnailAsset?.originalFileName || existingThumbnailAsset?.fileName || existingThumbnailUrl.split("/").pop());

                    if (!thumbnailFile && !existingThumbnailUrl) {
                      return (
                        <label className="border border-dashed border-gray-300 bg-white hover:bg-gray-50 rounded-2xl h-28 flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden">
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={handleThumbnailChange}
                            className="hidden"
                          />
                          <div className="text-center text-sm text-gray-500">
                            Drag image • PNG / JPG
                          </div>
                        </label>
                      );
                    }

                    return (
                      <div className="border border-gray-200 bg-gray-50 rounded-2xl p-4 flex flex-col items-center justify-center relative min-h-28">
                        {thumbnailFile ? (
                          <span className="text-xs font-semibold text-gray-700 block truncate max-w-[280px]">
                            {thumbnailFile.name}
                          </span>
                        ) : (
                          <img
                            src={existingThumbnailUrl}
                            alt="Current Thumbnail"
                            className="h-16 object-contain rounded-md border border-gray-200"
                          />
                        )}
                        <div className="flex gap-3 mt-3">
                          <button
                            type="button"
                            onClick={() => {
                              const url = thumbnailFile ? URL.createObjectURL(thumbnailFile) : existingThumbnailUrl;
                              window.open(url, "_blank");
                            }}
                            className="bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 font-bold text-xs px-3 py-1.5 rounded-lg transition-all"
                          >
                            Preview
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (thumbnailFile) {
                                setThumbnailFile(null);
                              } else {
                                setThumbnailFile(null);
                                setRemovedAssetRoles((prev) => [...prev, "THUMBNAIL"]);
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

                {/* Primary Content Upload */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Primary Content Upload <span className="text-red-500">*</span>
                  </label>
                  {(() => {
                    const data: any = lessonData?.data?.data || lessonData?.data || lessonData || props.initialLessonData;
                    const isRemoved = removedAssetRoles.includes("VIDEO") || removedAssetRoles.includes("CONTENT");
                    const contentId = data?.contentAssetId || data?.content_asset_id || data?.assets_storage_lessons_content_asset_idToassets_storage?.id;
                    const dbVideoAsset = lessonAssetsData.find((a: any) => a.id === contentId)
                      || lessonAssetsData.find((a: any) => a.assetType === "VIDEO" && (a.storagePath === "videos" || a.storagePath === "content" || a.assetContext === "LESSON_CONTENT" || a.assetContext === "LESSON"))
                      || lessonAssetsData.find((a: any) => a.assetType === "DOCUMENT" && (a.storagePath === "videos" || a.storagePath === "content" || a.assetContext === "LESSON_CONTENT" || a.assetContext === "LESSON"));
                    const fallbackVideoAsset = data?.lessonAssets?.find((a: any) => a.assetRole === "VIDEO" || a.assetRole === "CONTENT")?.asset;
                    const existingVideoAsset = dbVideoAsset || fallbackVideoAsset;
                    const existingVideoUrl = isRemoved ? "" : (existingVideoAsset?.externalUrl || existingVideoAsset?.signedUrl || existingVideoAsset?.url || data?.videoUrl || "");
                    const existingVideoName = isRemoved ? "" : (existingVideoAsset?.originalFileName || existingVideoAsset?.fileName || existingVideoUrl.split("/").pop());

                    if (!videoFile && !existingVideoUrl) {
                      return (
                        <label className="border border-dashed border-gray-300 bg-white hover:bg-gray-50 rounded-2xl h-28 flex flex-col items-center justify-center cursor-pointer transition-all">
                          <input
                            type="file"
                            accept="video/*,.pdf"
                            onChange={handleVideoChange}
                            className="hidden"
                          />
                          <div className="text-center text-sm text-gray-500">
                            Drag file • Video / PDF
                          </div>
                        </label>
                      );
                    }

                    return (
                      <div className="border border-gray-200 bg-gray-50 rounded-2xl p-4 flex flex-col items-center justify-center relative min-h-28">
                        <p className="text-xs font-semibold text-gray-800 truncate max-w-[280px]">
                          {videoFile ? videoFile.name : `Existing: ${existingVideoName}`}
                        </p>
                        {videoFile && duration && (
                          <p className="text-xs text-indigo-600 mt-1 font-medium">Duration: {duration} mins</p>
                        )}
                        <div className="flex gap-3 mt-3">
                          <button
                            type="button"
                            onClick={() => {
                              const url = videoFile ? URL.createObjectURL(videoFile) : existingVideoUrl;
                              window.open(url, "_blank");
                            }}
                            className="bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 font-bold text-xs px-3 py-1.5 rounded-lg transition-all"
                          >
                            Preview
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (videoFile) {
                                setVideoFile(null);
                                setDuration("");
                              } else {
                                setVideoFile(null);
                                setDuration("");
                                setRemovedAssetRoles((prev) => [...prev, "VIDEO", "CONTENT"]);
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
              </div>

              <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* ================= Study Content ================= */}

                <div className="rounded-xl border border-gray-200 bg-white p-4">

                  <label className="flex items-start gap-3 cursor-pointer">

                    <input
                      type="checkbox"
                      checked={hasStudyDocument}
                      onChange={handleStudyDocumentToggle}
                      className="mt-1 h-4 w-4 rounded border-gray-300"
                    />

                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        Add Study Content
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        Add text, images and learning notes for learners.
                      </p>
                    </div>

                  </label>

                  {studyDocument && (

                    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">

                      <div className="flex items-center justify-between">

                        <div>
                          <p className="text-sm font-semibold text-emerald-800">
                            Study Content Ready
                          </p>

                          <p className="mt-1 text-xs text-emerald-700">
                            {studyDocument.title} • {studyDocument.blocks.length} block
                            {studyDocument.blocks.length !== 1 && "s"}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={openStudyDocumentModal}
                          className="rounded-lg border border-emerald-300 bg-white px-4 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                        >
                          Edit
                        </button>

                      </div>

                    </div>

                  )}

                </div>

                {/* ================= Preview ================= */}

                <div className="rounded-xl border border-gray-200 bg-white p-4">

                  <label className="flex items-start gap-3 cursor-pointer">

                    <input
                      type="checkbox"
                      checked={allowPreview}
                      onChange={(e) => setAllowPreview(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-gray-300"
                    />

                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        Enable Preview
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        Allow learners to preview this lesson before enrollment.
                      </p>
                    </div>

                  </label>

                  {allowPreview && (

                    <div className="mt-5 space-y-4">

                      <div>

                        <label className="block text-xs font-medium text-gray-700">
                          Preview Duration (Minutes)
                        </label>

                        <input
                          type="number"
                          value={previewDuration}
                          onChange={(e) =>
                            setPreviewDuration(Number(e.target.value))
                          }
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />

                      </div>

                      <div>

                        <label className="block text-xs font-medium text-gray-700">
                          Preview Access Type
                        </label>

                        <select
                          value={previewAccessType}
                          onChange={(e) =>
                            setPreviewAccessType(e.target.value)
                          }
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        >
                          <option value="">Select Preview Access Type</option>

                          {previewAccessTypes.map((type) => (
                            <option
                              key={type}
                              value={type}
                            >
                              {type}
                            </option>
                          ))}

                        </select>

                      </div>

                    </div>

                  )}

                </div>

              </div>

            </div>

            {/* Transcript + Attachments */}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Transcript */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Transcript (VTT/SRT)
                </label>
                {(() => {
                  const data: any = lessonData?.data?.data || lessonData?.data || lessonData || props.initialLessonData;
                  const isRemoved = removedAssetRoles.includes("TRANSCRIPT");
                  const transcriptId = data?.transcriptAssetId || data?.transcript_asset_id || data?.assets_storage_lessons_transcript_asset_idToassets_storage?.id;
                  const dbTranscriptAsset = lessonAssetsData.find((a: any) => a.id === transcriptId) || lessonAssetsData.find((a: any) => a.assetType === "DOCUMENT" && (a.storagePath === "transcripts" || a.assetContext === "LESSON_TRANSCRIPT"));
                  const fallbackTranscriptAsset = data?.lessonAssets?.find((a: any) => a.assetRole === "TRANSCRIPT")?.asset;
                  const existingTranscriptAsset = dbTranscriptAsset || fallbackTranscriptAsset;
                  const existingTranscriptUrl = isRemoved ? "" : (existingTranscriptAsset?.signedUrl || existingTranscriptAsset?.url || "");
                  const existingTranscriptName = isRemoved ? "" : (existingTranscriptAsset?.originalFileName || existingTranscriptAsset?.fileName || existingTranscriptUrl.split("/").pop());

                  if (!transcriptFile && !existingTranscriptUrl) {
                    return (
                      <label className="border border-dashed border-gray-300 bg-white hover:bg-gray-50 rounded-2xl h-28 flex flex-col items-center justify-center cursor-pointer transition-all">
                        <input
                          type="file"
                          accept=".vtt,.srt,.txt"
                          onChange={handleTranscriptChange}
                          className="hidden"
                        />
                        <div className="text-center text-sm text-gray-500">
                          Optional • WCAG • captions
                        </div>
                      </label>
                    );
                  }

                  return (
                    <div className="border border-gray-200 bg-gray-50 rounded-2xl p-4 flex flex-col items-center justify-center relative min-h-28">
                      <p className="text-xs font-semibold text-gray-800 truncate max-w-[280px]">
                        {transcriptFile ? transcriptFile.name : `Existing: ${existingTranscriptName}`}
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

              {/* Attachments */}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Attachments
                </label>

                <label className="border border-dashed border-gray-300 bg-white hover:bg-gray-50 rounded-2xl h-28 flex flex-col items-center justify-center cursor-pointer transition-all">

                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xlsx"
                    onChange={handleAttachmentsChange}
                    className="hidden"
                  />

                  {(() => {
                    const data: any = lessonData?.data?.data || lessonData?.data || lessonData;
                    const newExistingAtts = lessonAssetsData.filter((a: any) => a.assetType === "DOCUMENT" && (a.storagePath === "attachments" || a.assetContext === "LESSON_ATTACHMENT") && !removedAttachmentIds.includes(a.id));
                    const fallbackAtts = data?.lessonAssets?.filter((a: any) => a.assetRole === "ATTACHMENT" && !removedAttachmentIds.includes(a.assetId)) || [];
                    const existingAtts = newExistingAtts.length > 0 ? newExistingAtts : fallbackAtts;

                    if (attachments.length > 0 || existingAtts.length > 0) {
                      return (
                        <div className="mt-2 text-xs text-gray-600 w-full px-4">
                          {attachments.map((file, index) => (
                            <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded mb-1">
                              <span className="truncate max-w-[200px]">{file.name}</span>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => window.open(URL.createObjectURL(file), "_blank")}
                                  className="text-indigo-600 font-bold hover:underline"
                                >
                                  Preview
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    removeAttachment(index);
                                  }}
                                  className="text-red-600 font-bold px-1 hover:bg-red-50 rounded"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          ))}
                          {existingAtts.map((la: any, index: number) => {
                            const url = la.signedUrl || la.url || la.asset?.signedUrl || la.asset?.url;
                            const name = la.originalFileName || la.fileName || la.asset?.originalFileName || la.asset?.fileName || la.asset?.name || url?.split("/").pop();
                            const idToRemove = la.id || la.assetId;

                            return (
                              <div key={index} className="flex justify-between items-center bg-emerald-50 text-emerald-800 p-2 rounded mb-1">
                                <span className="truncate max-w-[200px]">Existing: {name}</span>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => window.open(url, "_blank")}
                                    className="text-indigo-600 font-bold hover:underline"
                                  >
                                    Preview
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setRemovedAttachmentIds((prev) => [...prev, idToRemove]);
                                    }}
                                    className="text-red-600 font-bold hover:bg-red-50 px-1 rounded"
                                  >
                                    ×
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    } else {
                      return (
                        <div className="text-center text-sm text-gray-500">
                          Multi-file • PDFs / worksheets
                        </div>
                      );
                    }
                  })()}

                </label>

              </div>

            </div>

          </section>

          {/* FOOTER ACTIONS */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={handleCancel}
              disabled={uploading}
              className="rounded-xl border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={createLessonMutation.isPending || updateLessonMutation.isPending || uploading}
              className="rounded-xl bg-black text-white px-6 py-3 text-sm font-semibold hover:bg-gray-900 disabled:opacity-60 transition-colors"
            >
              {createLessonMutation.isPending || updateLessonMutation.isPending
                ? isEditMode
                  ? "Updating..."
                  : "Saving..."
                : isEditMode
                  ? "Update Lesson"
                  : "Save Lesson"}
            </button>
          </div>
        </div>
        {/* STUDY CONTENT MODAL */}
        {showStudyDocumentModal && (
          <div className="fixed inset-0 z-[9999] bg-white">
            <div className="flex h-screen w-screen flex-col bg-white">
              {/* HEADER */}
              <div className="flex shrink-0 items-start justify-between border-b border-gray-200 bg-white px-6 py-5 sm:px-8">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Lesson Study Content
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Add unlimited text and images in the exact order learners
                    should read them.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeStudyDocumentModal}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xl text-gray-500 hover:bg-gray-100"
                  aria-label="Close study content editor"
                >
                  ×
                </button>
              </div>

              {/* SCROLLABLE CONTENT */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-8">
                <div className="mx-auto w-full max-w-6xl space-y-6">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-800">
                      Study Document Title
                    </label>
                    <input
                      type="text"
                      value={title}
                      readOnly
                      placeholder="Enter lesson title first"
                      className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-sm text-gray-600 outline-none"
                    />
                    {!title.trim() && (
                      <p className="mt-2 text-xs font-medium text-amber-600">
                        Enter the lesson title first. It will be used
                        automatically as the study document title.
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-800">
                          Content Flow
                        </h3>
                        <p className="mt-1 text-xs text-gray-500">
                          Add as many text blocks and images as needed.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={addStudyTextBlock}
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
                            onChange={addStudyImages}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    {studyDocumentBlocks.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
                        <p className="text-sm font-semibold text-gray-700">
                          No study content added yet
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          Click "Add Text" or "Add Image" to start creating the
                          study document.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {studyDocumentBlocks.map((block, index) => (
                          <div
                            key={block.id}
                            className="rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:p-5"
                          >
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <span className="rounded-md bg-gray-200 px-2 py-1 text-xs font-bold text-gray-700">
                                  {index + 1}
                                </span>
                                <span className="text-sm font-semibold text-gray-700">
                                  {block.type === "TEXT" ? "Text Content" : "Study Image"}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  disabled={index === 0}
                                  onClick={() => moveStudyBlock(block.id, "UP")}
                                  className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                                  aria-label="Move content up"
                                >
                                  ↑
                                </button>
                                <button
                                  type="button"
                                  disabled={index === studyDocumentBlocks.length - 1}
                                  onClick={() => moveStudyBlock(block.id, "DOWN")}
                                  className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                                  aria-label="Move content down"
                                >
                                  ↓
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeStudyBlock(block.id)}
                                  className="rounded-md px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>

                            {block.type === "TEXT" ? (
                              <div className="space-y-3">
                                <input
                                  type="text"
                                  value={block.heading}
                                  onChange={(event) =>
                                    updateStudyTextBlock(block.id, "heading", event.target.value)
                                  }
                                  placeholder="Heading (optional)"
                                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-black"
                                />
                                <textarea
                                  rows={7}
                                  value={block.content}
                                  onChange={(event) =>
                                    updateStudyTextBlock(block.id, "content", event.target.value)
                                  }
                                  placeholder="Write detailed study content..."
                                  className="w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-black"
                                />
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <img
                                  src={block.previewUrl}
                                  alt={block.caption || "Study content"}
                                  className="max-h-[520px] w-full rounded-xl border border-gray-200 bg-white object-contain"
                                />
                                <input
                                  type="text"
                                  value={block.caption}
                                  onChange={(event) =>
                                    updateStudyImageCaption(block.id, event.target.value)
                                  }
                                  placeholder="Image caption (optional)"
                                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-black"
                                />
                              </div>
                            )}

                            <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-200 pt-4">
                              <button
                                type="button"
                                onClick={() => insertStudyTextBlockAfter(block.id)}
                                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                              >
                                + Add Text Below
                              </button>
                              <label className="cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100">
                                + Add Image Below
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
                        ))}
                      </div>
                    )}
                  </div>

                  {/* LEARNER PREVIEW */}
                  {studyDocumentBlocks.length > 0 && (
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
                      <h3 className="mb-5 text-sm font-semibold text-gray-800">
                        Learner Preview
                      </h3>

                      {title.trim() && (
                        <h2 className="mb-6 text-2xl font-bold text-gray-900">{title}</h2>
                      )}

                      <div className="space-y-6">
                        {studyDocumentBlocks.map((block) => {
                          if (block.type === "TEXT") {
                            if (!block.heading && !block.content) return null;
                            return (
                              <section key={block.id}>
                                {block.heading && (
                                  <h3 className="mb-2 text-lg font-bold text-gray-900">
                                    {block.heading}
                                  </h3>
                                )}
                                {block.content && (
                                  <p className="whitespace-pre-wrap text-sm leading-7 text-gray-700">
                                    {block.content}
                                  </p>
                                )}
                              </section>
                            );
                          }
                          return (
                            <figure key={block.id}>
                              <img
                                src={block.previewUrl}
                                alt={block.caption || "Study content"}
                                className="max-h-[520px] w-full rounded-xl border border-gray-200 object-contain"
                              />
                              {block.caption && (
                                <figcaption className="mt-2 text-center text-xs text-gray-500">
                                  {block.caption}
                                </figcaption>
                              )}
                            </figure>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* FIXED FOOTER */}
              <div className="flex shrink-0 justify-end gap-3 border-t border-gray-200 bg-white px-6 py-4 sm:px-8">
                <button
                  type="button"
                  onClick={closeStudyDocumentModal}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveStudyDocument}
                  disabled={!title.trim()}
                  className="rounded-xl bg-black px-5 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Save Study Content
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StandaloneCourseLessonAdded;