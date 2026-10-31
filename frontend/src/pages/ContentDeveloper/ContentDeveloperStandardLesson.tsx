import React, { useCallback, useEffect, useState, useRef, forwardRef, useImperativeHandle } from "react";
import Select from "react-select";
import LanguageList from "language-list";
import {
  BookOpen,
  Plus,
  Image as ImageIcon,
  FileText,
  ArrowUp,
  ArrowDown,
  Trash2,
  X,
  Eye,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { useLessonTypes, usePreviewAccessType } from "../../hooks/useEnums";
import { useLesson } from "../../hooks/lesson/useLessons";
import { useAssets } from "../../hooks/asset/useAssets";
import { useTags, useSkills } from "../../hooks/useMaster";
import { detectMediaDuration, formatDurationToMinutes, getDisplayFileName } from "../../utils/mediaDuration";

interface Props {
  formData: LessonFormData;
  updateForm: (updates: Partial<LessonFormData>) => void;
  lessonId?: string | null;
  isStandalone?: boolean;
}

export interface ContentDeveloperStandardLessonRef {
  getLessonData: () => LessonFormData;
  getLessonFiles: () => {
    primaryContent: File | null;
    transcript: File | null;
    supportingMaterialFile?: File | null;
    lessonAttachments: File[];
    lessonContents: LessonContent[];
  };
  validate: () => boolean;
}

export type LessonContentBlock = {
  id: string;
  blockType:
  | "HEADING" | "SUB_HEADING" | "PARAGRAPH"
  | "IMAGE" | "VIDEO" | "PDF" | "AUDIO"
  | "CODE" | "NOTE" | "QUOTE" | "LIST" | "TABLE" | "EMBED";
  title?: string;
  textContent?: string;
  file?: File;
  previewUrl?: string;
  assetId?: string;
  assetUrl?: string;
  metadata?: Record<string, any>;
  displayOrder: number;
};

export type LessonContent = {
  id: string;
  title: string;
  format: string;
  estimatedDuration?: number;
  displayOrder: number;
  isDefault: boolean;
  blocks: LessonContentBlock[];
};

export type PreviewAccessType = "NONE" | "PREVIEW" | "FULL";

export interface LessonFormData {
  lessonTitle: string;
  lessonType: string;
  lessonDescription: string;
  primaryContent: File | null;
  primaryContentAssetUrl?: string;
  primaryContentAssetName?: string;
  videoUrl?: string;
  transcript: File | null;
  transcriptAssetUrl?: string;
  transcriptAssetName?: string;
  supportingMaterialFile?: File | null;
  supportingMaterialUrl?: string;
  supportingMaterialName?: string;
  supportingMaterialAssetId?: string;
  lessonAttachments: File[];
  existingAttachments?: Array<{ id: string; name: string; url?: string; size?: number }>;
  lessonContents: LessonContent[];
  allowPreview: boolean;
  previewDuration: number | null;
  previewAccessType: PreviewAccessType;
  lessonDuration?: number | null;
  removedAssetRoles?: string[];
  removedAttachmentIds?: string[];
  tagLine?: string;
  lessonTags?: string[];
  language?: string;
  learningOutcomes?: string[];
  lessonSkills?: string[];
  thumbnail?: File | null;
  authorName?: string;
  instructorDesignation?: string;
}

const languageList = new LanguageList();
const languages = languageList.getData();

const CommaSeparatedInput = ({ initialValue, onChange, placeholder, className, isTextArea = false, rows = 2 }: any) => {
  const [localVal, setLocalVal] = useState(() => Array.isArray(initialValue) ? initialValue.join(", ") : (initialValue || ""));

  useEffect(() => {
    const currentArray = localVal.split(",").map((s: string) => s.trim()).filter(Boolean);
    const incomingArray = Array.isArray(initialValue) ? initialValue : (initialValue ? [initialValue] : []);
    if (JSON.stringify(currentArray) !== JSON.stringify(incomingArray)) {
      setLocalVal(incomingArray.join(", "));
    }
  }, [initialValue]);

  const handleChange = (e: any) => {
    const val = e.target.value.toLowerCase();
    setLocalVal(val);
    const arr = val.split(",").map((s: string) => s.trim()).filter(Boolean);
    onChange(arr);
  };

  if (isTextArea) {
    return <textarea value={localVal} onChange={handleChange} placeholder={placeholder} className={className} rows={rows} />;
  }
  return <input type="text" value={localVal} onChange={handleChange} placeholder={placeholder} className={className} />;
};

const ChipInput = ({ items, onChange, placeholder, options, prefix = "" }: any) => {
  const [inputVal, setInputVal] = useState("");

  const filteredOptions = options.filter(
    (opt: any) =>
      opt.name.toLowerCase().includes(inputVal.replace(prefix, "").toLowerCase()) &&
      !items.some((t: any) => t.toLowerCase() === opt.name.toLowerCase())
  );

  const processInput = (val: string) => {
    if (val.includes(",")) {
      const parts = val.split(",").map((s: string) => s.replace(new RegExp(`^${prefix}`), "").trim().toLowerCase()).filter(Boolean);
      const newItems = Array.from(new Set([...items, ...parts]));
      onChange(newItems);
      setInputVal("");
      return true;
    }
    return false;
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => {
            const val = e.target.value;
            if (!processInput(val)) {
              setInputVal(val.toLowerCase());
            }
          }}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === ",") && inputVal.trim()) {
              e.preventDefault();
              const cleanVal = inputVal.replace(new RegExp(`^${prefix}`), "").trim();
              if (cleanVal && !items.some((t: any) => t.toLowerCase() === cleanVal.toLowerCase())) {
                onChange([...items, cleanVal]);
              }
              setInputVal("");
            }
          }}
          placeholder={placeholder}
          className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black"
        />

        {inputVal.length > 0 && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {filteredOptions.map((opt: any) => (
              <button
                key={opt.id}
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-gray-100 text-xs cursor-pointer"
                onClick={() => {
                  onChange([...items, opt.name.toLowerCase()]);
                  setInputVal("");
                }}
              >
                {prefix}{opt.name}
              </button>
            ))}

            {filteredOptions.length === 0 && inputVal.trim() !== prefix && (
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-blue-600 hover:bg-blue-50 text-xs cursor-pointer"
                onClick={() => {
                  const cleanVal = inputVal.replace(new RegExp(`^${prefix}`), "").trim();
                  if (cleanVal && !items.some((t: any) => t.toLowerCase() === cleanVal.toLowerCase())) {
                    onChange([...items, cleanVal]);
                  }
                  setInputVal("");
                }}
              >
                Create {prefix}{inputVal.replace(new RegExp(`^${prefix}`), "")}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {items.map((item: any) => (
          <span
            key={item}
            className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs px-3 py-1 rounded-full font-medium"
          >
            {prefix}{item}
            <button
              type="button"
              className="font-bold hover:text-red-600 cursor-pointer"
              onClick={() => onChange(items.filter((t: any) => t !== item))}
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
};

const ContentDeveloperStandardLesson = forwardRef<ContentDeveloperStandardLessonRef, Props>(({ formData, updateForm, lessonId, isStandalone, }, ref) => {
  const { data: lessonData, isLoading: isLoadingLesson } = useLesson(lessonId || undefined);
  const { data: tagsData = [] } = useTags();

  const { data: skillsData = [] } = useSkills();

  const { getAllAssets } = useAssets();
  const [lessonAssetsData, setLessonAssetsData] = useState<any[]>([]);

  useEffect(() => {
    if (lessonId) {
      getAllAssets({ lessonId }).then(setLessonAssetsData).catch(() => {});
    }
  }, [lessonId, getAllAssets]);

  const { data: lessonTypes = [] } = useLessonTypes();
  const { data: previewAccessTypes } = usePreviewAccessType();

  const [showLessonContentModal, setShowLessonContentModal] = useState(false);
  const [selectedContentIndex, setSelectedContentIndex] = useState(0);
  const [lessonContents, setLessonContents] = useState<LessonContent[]>([]);
  const [isCalculatingDuration, setIsCalculatingDuration] = useState(false);

  const calculateAndApplyDuration = useCallback(async (url: string) => {
    if (!url || url.trim().length < 5) return;
    try {
      setIsCalculatingDuration(true);
      const durSecs = await detectMediaDuration(url);
      if (durSecs && durSecs > 0) {
        const mins = formatDurationToMinutes(durSecs);
        updateForm({
          lessonDuration: mins,
          duration: mins.toString(),
        } as any);
      }
    } catch (err) {
      console.warn("Failed to detect media duration", err);
    } finally {
      setIsCalculatingDuration(false);
    }
  }, [updateForm]);

  const standardLessonDebounceRef = useRef<any>(null);

  const handleVideoUrlChange = useCallback((val: string) => {
    updateForm({ videoUrl: val, assetSource: "EXTERNAL_LINK" } as any);
    if (standardLessonDebounceRef.current) {
      clearTimeout(standardLessonDebounceRef.current);
      standardLessonDebounceRef.current = null;
    }
    const trimmed = (val || "").trim();
    if (trimmed.length > 5) {
      standardLessonDebounceRef.current = setTimeout(() => {
        calculateAndApplyDuration(trimmed);
      }, 400);
    }
  }, [updateForm, calculateAndApplyDuration]);

  useEffect(() => {
    const vUrl = (formData as any).videoUrl;
    if (vUrl && (!formData.lessonDuration || formData.lessonDuration === 0 || formData.lessonDuration === 20)) {
      calculateAndApplyDuration(vUrl);
    }
  }, [(formData as any).videoUrl, formData.lessonDuration, calculateAndApplyDuration]);

  useEffect(() => {
    if (formData.lessonContents && formData.lessonContents.length > 0) {
      setLessonContents(formData.lessonContents);
    }
  }, [formData.lessonContents]);

  useEffect(() => {
    const data: any = lessonData?.data?.data || lessonData?.data || lessonData;
    if (data) {
      const updates: any = {};
      const isExternalLink =
        data.contentAsset?.assetSource === "EXTERNAL_LINK" ||
        data.assets_storage_lessons_content_asset_idToassets_storage?.assetSource === "EXTERNAL_LINK" ||
        String(data.assets_storage_lessons_content_asset_idToassets_storage?.storageProvider || "").toLowerCase() === "external" ||
        Boolean(data.assets_storage_lessons_content_asset_idToassets_storage?.externalUrl);

      const extVideoUrl = isExternalLink
        ? (data.assets_storage_lessons_content_asset_idToassets_storage?.externalUrl ||
           data.contentAsset?.externalUrl ||
           data.videoUrl ||
           data.videoUrlExternal ||
           "")
        : "";
      if (extVideoUrl && !formData.videoUrl) {
        updates.videoUrl = extVideoUrl;
      }
      if ((!formData.lessonSkills || formData.lessonSkills.length === 0) && data.skills?.length > 0) {
        updates.lessonSkills = data.skills.map((s: any) => s.skill?.name || s.name).filter(Boolean);
      }
      if ((!formData.lessonTags || formData.lessonTags.length === 0) && data.lessonTags?.length > 0) {
        updates.lessonTags = data.lessonTags.map((t: any) => t.tag?.name || t.name).filter(Boolean);
      }
      if (data?.lessonContents?.length > 0 && lessonContents.length === 0 && (!formData.lessonContents || formData.lessonContents.length === 0)) {
        const mapped: LessonContent[] = data.lessonContents.map((lc: any) => ({
          id: lc.id || crypto.randomUUID(),
          title: lc.title || formData.lessonTitle || "",
          format: lc.format || getLessonContentFormat(formData.lessonType),
          estimatedDuration: lc.estimatedDuration || 0,
          displayOrder: lc.displayOrder || 1,
          isDefault: lc.isDefault ?? false,
          blocks: (lc.blocks || []).map((b: any) => ({
            id: b.id || crypto.randomUUID(),
            blockType: b.blockType,
            title: b.title || "",
            textContent: b.textContent || "",
            assetId: b.assetId,
            assetUrl: b.asset?.signedUrl || b.asset?.url,
            previewUrl: b.asset?.signedUrl || b.asset?.url,
            metadata: b.metadata || {},
            displayOrder: b.displayOrder || 0,
          })).sort((a: any, b: any) => a.displayOrder - b.displayOrder),
        }));
        setLessonContents(mapped);
        updates.lessonContents = mapped;
      }
      if (Object.keys(updates).length > 0) {
        updateForm(updates);
      }
    }
  }, [lessonData]);

  // ==================== EXPOSED TO PARENT ====================
  useImperativeHandle(ref, () => ({
    getLessonData: () => {
      const sanitizedLessonContents = (lessonContents.length > 0 ? lessonContents : formData.lessonContents || []).map(content => ({
        ...content,
        blocks: content.blocks.map(block => {
          const { assetId, ...rest } = block;
          return assetId ? { ...rest, assetId } : (rest as LessonContentBlock);
        })
      }));
      return { ...formData, lessonContents: sanitizedLessonContents };
    },

    getLessonFiles: () => {
      const sanitizedLessonContents = lessonContents.map(content => ({
        ...content,
        blocks: content.blocks.map(block => {
          const { assetId, ...rest } = block;
          return assetId ? { ...rest, assetId } : (rest as LessonContentBlock);
        })
      }));
      return {
        primaryContent: formData.primaryContent,
        transcript: formData.transcript,
        supportingMaterialFile: formData.supportingMaterialFile || null,
        lessonAttachments: [...formData.lessonAttachments],
        lessonContents: sanitizedLessonContents,
      };
    },

    validate: () => {
      if (!formData.lessonTitle?.trim()) {
        alert("Lesson Title is required");
        return false;
      }
      if (!formData.lessonType) {
        alert("Lesson Type is required");
        return false;
      }
      if (!formData.lessonDescription?.trim()) {
        alert("Lesson Description is required");
        return false;
      }
      return true;
    },
  }));
  // ==========================================================

  const updateLessonContents = (updater: LessonContent[] | ((prev: LessonContent[]) => LessonContent[])) => {
    setLessonContents((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      updateForm({ lessonContents: next });
      return next;
    });
  };

  // File Handlers
  const handlePrimaryContentChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    const isVideo = file && (
      file.type.startsWith("video/") ||
      /\.(mp4|mov|webm|mkv|avi)$/i.test(file.name)
    );
    if (file && isVideo) {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        const durationInMinutes = Math.ceil(video.duration / 60) || 1;
        updateForm({ primaryContent: file, lessonDuration: durationInMinutes, assetSource: "UPLOAD" } as any);
      };
      video.src = URL.createObjectURL(file);
    } else {
      updateForm({ primaryContent: file, assetSource: "UPLOAD" } as any);
    }
  }, [updateForm]);

  const handleTranscriptChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateForm({ transcript: e.target.files?.[0] || null });
  }, [updateForm]);

  const handleAttachmentsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    updateForm({
      lessonAttachments: [...formData.lessonAttachments, ...Array.from(e.target.files)],
    });
  }, [formData.lessonAttachments, updateForm]);

  const getLessonContentFormat = (lessonType: string): string => {
    switch (lessonType.toUpperCase()) {
      case "VIDEO": return "VIDEO";
      case "PDF": return "PDF";
      case "AUDIO": return "AUDIO";
      default: return "TEXT_IMAGE";
    }
  };

  const handlePreviewToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    updateForm({
      allowPreview: checked,
      previewAccessType: checked ? (formData.previewAccessType || "PREVIEW") : "NONE",
      previewDuration: checked ? (formData.previewDuration ?? 5) : null,
    });
  };

  // Study Content Handlers
  const createLessonTextBlock = (): LessonContentBlock => ({
    id: crypto.randomUUID(),
    blockType: "PARAGRAPH",
    title: "",
    textContent: "",
    displayOrder: 0,
  });

  // NEW: Local Image Block (No Upload)
  const createLessonImageBlocks = (files: File[]): LessonContentBlock[] => {
    return files.map((file) => {
      const previewUrl = URL.createObjectURL(file);
      return {
        id: crypto.randomUUID(),
        blockType: "IMAGE",
        file,
        previewUrl,
        metadata: { caption: "" },
        displayOrder: 0,
      };
    });
  };

  const addLessonImages = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const imageBlocks = createLessonImageBlocks(files);

    updateLessonContents((previous) =>
      previous.map((content, index) => {
        if (index !== selectedContentIndex) return content;
        const blocks = [...content.blocks, ...imageBlocks].map((block, i) => ({
          ...block,
          displayOrder: i + 1,
        }));
        return { ...content, blocks };
      })
    );

    event.target.value = "";
  };

  const insertLessonImagesAfter = (event: React.ChangeEvent<HTMLInputElement>, blockId: string) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const images = createLessonImageBlocks(files);

    updateLessonContents((previous) =>
      previous.map((content, index) => {
        if (index !== selectedContentIndex) return content;
        const insertIndex = content.blocks.findIndex((b) => b.id === blockId);
        if (insertIndex === -1) return content;

        const blocks = [...content.blocks];
        blocks.splice(insertIndex + 1, 0, ...images);
        return {
          ...content,
          blocks: blocks.map((b, i) => ({ ...b, displayOrder: i + 1 })),
        };
      })
    );

    event.target.value = "";
  };

  const openLessonContentModal = () => {
    if (!formData.lessonTitle.trim()) {
      alert("Please enter the lesson title before adding lesson content.");
      return;
    }
    if (lessonContents.length === 0) {
      const newContent: LessonContent = {
        id: crypto.randomUUID(),
        title: formData.lessonTitle,
        format: getLessonContentFormat(formData.lessonType),
        estimatedDuration: 0,
        displayOrder: 1,
        isDefault: true,
        blocks: [createLessonTextBlock()],
      };
      setLessonContents([newContent]);
      setSelectedContentIndex(0);
    }
    setShowLessonContentModal(true);
  };

  const closeLessonContentModal = () => setShowLessonContentModal(false);

  const handleLessonContentToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    if (checked) {
      if (!formData.lessonTitle.trim()) {
        alert("Please enter the lesson title first.");
        return;
      }
      if (lessonContents.length === 0) {
        const newContent: LessonContent = {
          id: crypto.randomUUID(),
          title: formData.lessonTitle,
          format: getLessonContentFormat(formData.lessonType),
          estimatedDuration: undefined,
          displayOrder: 1,
          isDefault: true,
          blocks: [],
        };
        setLessonContents([newContent]);
      }
      setSelectedContentIndex(0);
      setShowLessonContentModal(true);
    } else {
      setLessonContents([]);
      updateForm({ lessonContents: [] });
    }
  };

  // Block Handlers (Pure UI - no uploads)
  const addLessonTextBlock = () => {
    updateLessonContents((previous) =>
      previous.map((content, index) => {
        if (index !== selectedContentIndex) return content;
        return {
          ...content,
          blocks: [...content.blocks, { ...createLessonTextBlock(), displayOrder: content.blocks.length + 1 }],
        };
      })
    );
  };

  const insertLessonTextBlockAfter = (blockId: string) => {
    updateLessonContents((previous) =>
      previous.map((content, index) => {
        if (index !== selectedContentIndex) return content;
        const insertIndex = content.blocks.findIndex((b) => b.id === blockId);
        if (insertIndex === -1) return content;
        const blocks = [...content.blocks];
        blocks.splice(insertIndex + 1, 0, {
          ...createLessonTextBlock(),
          displayOrder: insertIndex + 2,
        });
        return { ...content, blocks: blocks.map((b, i) => ({ ...b, displayOrder: i + 1 })) };
      })
    );
  };

  const updateLessonTextBlock = (blockId: string, field: "title" | "textContent", value: string) => {
    updateLessonContents((previous) =>
      previous.map((content, index) => {
        if (index !== selectedContentIndex) return content;
        return {
          ...content,
          blocks: content.blocks.map((block) =>
            block.id === blockId && block.blockType === "PARAGRAPH"
              ? { ...block, [field]: value }
              : block
          ),
        };
      })
    );
  };

  const updateLessonImageCaption = (blockId: string, caption: string) => {
    updateLessonContents((previous) =>
      previous.map((content, index) => {
        if (index !== selectedContentIndex) return content;
        return {
          ...content,
          blocks: content.blocks.map((block) =>
            block.id === blockId && block.blockType === "IMAGE"
              ? { ...block, metadata: { ...block.metadata, caption } }
              : block
          ),
        };
      })
    );
  };

  const removeLessonBlock = (blockId: string) => {
    updateLessonContents((previous) =>
      previous.map((content, index) => {
        if (index !== selectedContentIndex) return content;
        const block = content.blocks.find((b) => b.id === blockId);
        if (block?.previewUrl && !block.assetUrl) URL.revokeObjectURL(block.previewUrl);

        return {
          ...content,
          blocks: content.blocks
            .filter((b) => b.id !== blockId)
            .map((b, i) => ({ ...b, displayOrder: i + 1 })),
        };
      })
    );
  };

  const moveLessonBlock = (blockId: string, direction: "UP" | "DOWN") => {
    updateLessonContents((previous) =>
      previous.map((content, index) => {
        if (index !== selectedContentIndex) return content;
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

  const saveLessonContents = () => {
    updateForm({ lessonContents });
    setShowLessonContentModal(false);
  };

  // Effects
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
    if (!formData.lessonTitle) return;
    updateLessonContents((prev) => {
      if (prev.length && prev[0].isDefault) {
        return prev.map((content, i) =>
          i === 0 ? { ...content, title: formData.lessonTitle } : content
        );
      }
      return prev;
    });
  }, [formData.lessonTitle]);

  useEffect(() => {
    const format = getLessonContentFormat(formData.lessonType);
    updateLessonContents((prev) =>
      prev.map((content) => ({ ...content, format }))
    );
  }, [formData.lessonType]);

  const currentLessonContent = lessonContents[selectedContentIndex];
  const lessonBlocks = currentLessonContent?.blocks ?? [];

  if (lessonId && isLoadingLesson && !lessonData) {
    return (
      <div className="bg-emerald-50/70 border border-emerald-100 rounded-3xl p-12 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-emerald-700 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-emerald-900">Loading lesson details...</p>
      </div>
    );
  }

  return (
    <div className="bg-emerald-50/70 border border-emerald-100 rounded-3xl p-8 shadow-sm">
      {/* Removed Lesson heading and description */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-10 mt-8">
        {/* Lesson Title + Type */}
        <div className="lg:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Lesson Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.lessonTitle}
              onChange={(e) => updateForm({ lessonTitle: e.target.value })}
              placeholder="e.g. Introduction to ISO 30401"
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Lesson Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.lessonType}
              onChange={(e) => updateForm({ lessonType: e.target.value })}
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black cursor-pointer"
            >
              <option value="">Select Type</option>
              {lessonTypes.map((type: string) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Lesson Description */}
        <div className="lg:col-span-2">
          <label className="block text-xs font-bold text-gray-700 mb-1.5">
            Lesson Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.lessonDescription}
            onChange={(e) => updateForm({ lessonDescription: e.target.value })}
            placeholder="What this lesson covers"
            rows={4}
            className="w-full bg-white border border-gray-300 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-black resize-y"
          />
        </div>

        {/* --- NEW FIELDS --- */}
        <div className="lg:col-span-2">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Tagline
            </label>
            <input
              type="text"
              value={formData.tagLine || ""}
              onChange={(e) => updateForm({ tagLine: e.target.value })}
              placeholder="Short catchy tagline"
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black"
            />
          </div>
        </div>

        <div className="lg:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Tags (comma separated)
            </label>
            <ChipInput
              items={formData.lessonTags || []}
              onChange={(tags: string[]) => updateForm({ lessonTags: tags })}
              placeholder="#react"
              options={tagsData}
              prefix="#"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Skills (comma separated)
            </label>
            <ChipInput
              items={formData.lessonSkills || []}
              onChange={(skills: string[]) => updateForm({ lessonSkills: skills })}
              placeholder="JavaScript"
              options={skillsData}
            />
          </div>
        </div>

        <div className="lg:col-span-2">
          <label className="block text-xs font-bold text-gray-700 mb-1.5">
            Learning Outcomes (comma separated)
          </label>
          <CommaSeparatedInput
            isTextArea={true}
            initialValue={formData.learningOutcomes}
            onChange={(outcomes: string[]) => updateForm({ learningOutcomes: outcomes })}
            placeholder="e.g. Build a web app, Deploy to cloud"
            className="w-full bg-white border border-gray-300 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-black resize-y"
          />
        </div>

        {/* Thumbnail Content */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">
            Thumbnail Upload
          </label>
          {(() => {
            const data: any = lessonData?.data?.data || lessonData?.data || lessonData;
            const isRemoved = formData.removedAssetRoles?.includes("THUMBNAIL");
            const thumbId = data?.thumbnailAssetId || data?.thumbnail_asset_id || data?.thumbnailAsset?.id;
            const dbThumbnailAsset = lessonAssetsData.find((a: any) => a.id === thumbId) || lessonAssetsData.find((a: any) => a.assetType === "IMAGE" && (a.storagePath === "thumbnails" || a.assetContext === "COURSE_THUMBNAIL" || a.assetContext === "LESSON"));
            const fallbackThumbnailAsset = data?.lessonAssets?.find((a: any) => a.assetRole === "THUMBNAIL")?.asset;
            const existingThumbnailAsset = dbThumbnailAsset || fallbackThumbnailAsset;
            const existingThumbnailUrl = isRemoved ? "" : (existingThumbnailAsset?.signedUrl || existingThumbnailAsset?.url || "");
            const existingThumbnailName = isRemoved ? "" : (existingThumbnailAsset?.originalFileName || existingThumbnailAsset?.fileName || fallbackThumbnailAsset?.originalFileName || fallbackThumbnailAsset?.fileName || existingThumbnailUrl.split("/").pop());

            if (!formData.thumbnail && !existingThumbnailUrl) {
              return (
                <label className="border border-dashed border-gray-300 bg-white hover:bg-gray-50 rounded-2xl h-28 flex flex-col items-center justify-center cursor-pointer transition-all">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => updateForm({ thumbnail: e.target.files?.[0] || null })}
                    className="hidden"
                  />
                  <div className="text-center text-sm text-gray-500">
                    Drag file • Image
                  </div>
                </label>
              );
            }

            return (
              <div className="border border-gray-200 bg-gray-50 rounded-2xl p-4 flex flex-col items-center justify-center relative min-h-28">
                <p className="text-xs font-semibold text-gray-800 truncate max-w-[280px]">
                  {formData.thumbnail ? formData.thumbnail.name : `Existing: ${existingThumbnailName}`}
                </p>
                <div className="flex gap-3 mt-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      const url = formData.thumbnail ? URL.createObjectURL(formData.thumbnail) : existingThumbnailUrl;
                      window.open(url, "_blank");
                    }}
                    className="bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 font-bold text-xs px-3 py-1.5 rounded-lg transition-all"
                  >
                    Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (formData.thumbnail) {
                        updateForm({ thumbnail: null });
                      } else {
                        const removed = formData.removedAssetRoles || [];
                        updateForm({
                          thumbnail: null,
                          removedAssetRoles: [...removed, "THUMBNAIL"],
                        });
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

        {/* Primary Content — Video URL or File Upload */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">
            Primary Content (Video) <span className="text-red-500">*</span>
          </label>

          {/* Video URL input */}
          <div className="mb-2">
            <div className="flex gap-2">
              <input
                type="url"
                value={(formData as any).videoUrl || ""}
                onChange={(e) => handleVideoUrlChange(e.target.value)}
                onBlur={() => {
                  const val = (formData as any).videoUrl;
                  if (val) {
                    calculateAndApplyDuration(val);
                  }
                }}
                placeholder="Paste video URL (YouTube, Vimeo, direct MP4…)"
                className="flex-1 border border-gray-200 bg-white rounded-xl px-4 py-2.5 text-xs font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 shadow-2xs"
              />
              {(formData as any).videoUrl && (
                <>
                  <button
                    type="button"
                    disabled={isCalculatingDuration}
                    onClick={() => calculateAndApplyDuration((formData as any).videoUrl)}
                    className="px-3 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors shrink-0 disabled:opacity-50"
                    title="Detect real duration from video URL"
                  >
                    {isCalculatingDuration ? "Detecting..." : "Detect Duration"}
                  </button>
                  <button
                    type="button"
                    onClick={() => window.open((formData as any).videoUrl, "_blank")}
                    className="px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors shrink-0"
                  >
                    Preview
                  </button>
                </>
              )}
            </div>
            {isCalculatingDuration && (
              <p className="text-[11px] text-blue-600 font-medium mt-1 animate-pulse flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping inline-block" />
                Auto-calculating video duration from URL...
              </p>
            )}
            {(formData as any).videoUrl && formData.lessonDuration && !isCalculatingDuration && (
              <p className="text-[11px] text-indigo-600 font-medium mt-1">
                ✓ Duration auto-calculated: {formData.lessonDuration} mins
              </p>
            )}
            {(formData as any).videoUrl && (
              <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-gray-100">
                <label className="text-xs font-semibold text-gray-600 shrink-0">Duration (mins):</label>
                <input
                  type="number"
                  min="1"
                  value={formData.lessonDuration || ""}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0;
                    updateForm({ lessonDuration: val, duration: val.toString() } as any);
                  }}
                  placeholder="Auto-detected or enter mins"
                  className="w-32 border border-gray-200 bg-white rounded-lg px-3 py-1 text-xs font-semibold text-gray-900 focus:outline-none focus:border-gray-900 shadow-2xs"
                />
                {formData.lessonDuration ? (
                  <span className="text-xs font-medium text-emerald-600">✓ {formData.lessonDuration} min{formData.lessonDuration > 1 ? "s" : ""}</span>
                ) : null}
              </div>
            )}
          </div>

          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1.5">Or upload a file</p>

          {(() => {
            const data: any = lessonData?.data?.data || lessonData?.data || lessonData;
            const isRemoved = formData.removedAssetRoles?.includes("VIDEO") || formData.removedAssetRoles?.includes("CONTENT");
            const contentId = data?.contentAssetId || data?.content_asset_id || data?.assets_storage_lessons_content_asset_idToassets_storage?.id;
            const dbVideoAsset = lessonAssetsData.find((a: any) => a.id === contentId)
              || lessonAssetsData.find((a: any) => a.assetType === "VIDEO" && (a.storagePath === "videos" || a.storagePath === "content" || a.assetContext === "LESSON_CONTENT" || a.assetContext === "LESSON"))
              || lessonAssetsData.find((a: any) => a.assetType === "DOCUMENT" && (a.storagePath === "videos" || a.storagePath === "content" || a.assetContext === "LESSON_CONTENT" || a.assetContext === "LESSON"));
            const fallbackVideoAsset = data?.lessonAssets?.find((a: any) => a.assetRole === "VIDEO" || a.assetRole === "CONTENT")?.asset;
            const existingVideoAsset = dbVideoAsset || fallbackVideoAsset;
            const isExternal = existingVideoAsset?.assetSource === "EXTERNAL_LINK" || existingVideoAsset?.storageProvider === "EXTERNAL";
            const existingFileUrl = isRemoved || isExternal ? "" : (existingVideoAsset?.signedUrl || existingVideoAsset?.url || formData.primaryContentAssetUrl || "");
            const existingFileName = isRemoved || isExternal ? "" : (existingVideoAsset?.originalFileName || existingVideoAsset?.originalFilename || existingVideoAsset?.fileName || formData.primaryContentAssetName || (existingFileUrl ? existingFileUrl.split("/").pop() : ""));

            if (!formData.primaryContent && !existingFileUrl) {
              return (
                <label className="border border-dashed border-gray-300 bg-white hover:bg-gray-50 rounded-2xl h-28 flex flex-col items-center justify-center cursor-pointer transition-all">
                  <input
                    type="file"
                    accept="video/*,.pdf,.scorm"
                    onChange={handlePrimaryContentChange}
                    className="hidden"
                  />
                  <div className="text-center text-sm text-gray-500">
                    Drag file • Video (MP4/MOV) / PDF / SCORM
                  </div>
                </label>
              );
            }

            return (
              <div className="border border-gray-200 bg-gray-50 rounded-2xl p-4 flex flex-col items-center justify-center relative min-h-28">
                <p className="text-xs font-semibold text-gray-800 truncate max-w-[280px]">
                  {formData.primaryContent ? `${formData.primaryContent.name} (UPLOAD)` : `Existing: ${getDisplayFileName(existingFileName, "Uploaded Video")}`}
                </p>
                {formData.primaryContent && formData.lessonDuration && (
                  <p className="text-xs text-indigo-600 mt-1 font-medium">Duration: {formData.lessonDuration} mins</p>
                )}
                <div className="flex gap-3 mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      const url = formData.primaryContent ? URL.createObjectURL(formData.primaryContent) : existingFileUrl;
                      window.open(url, "_blank");
                    }}
                    className="bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 font-bold text-xs px-3 py-1.5 rounded-lg transition-all"
                  >
                    Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (formData.primaryContent) {
                        updateForm({ primaryContent: null, lessonDuration: null, primaryContentAssetUrl: "", primaryContentAssetName: "" });
                      } else {
                        const removed = formData.removedAssetRoles || [];
                        updateForm({
                          primaryContent: null,
                          lessonDuration: null,
                          primaryContentAssetUrl: "",
                          primaryContentAssetName: "",
                          removedAssetRoles: [...removed, "VIDEO", "CONTENT"],
                        });
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

        {/* Optional Features */}
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* ================= Study Content ================= */}

          <div className="rounded-2xl border border-gray-200 bg-white p-5 h-full shadow-sm hover:border-gray-300 transition-all flex flex-col justify-between">

            <label className="flex items-start gap-3.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={lessonContents.length > 0}
                onChange={handleLessonContentToggle}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />

              <div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  <p className="text-sm font-bold text-gray-900">
                    Add Study Content
                  </p>
                </div>

                <p className="mt-1 text-xs text-gray-500 leading-relaxed">
                  Provide rich step-by-step reading materials, images, captions, and key takeaways alongside this lesson.
                </p>
              </div>
            </label>

            {lessonContents.length > 0 && currentLessonContent && (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 transition-all">

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-emerald-900">
                        Study Content Configured
                      </p>

                      <p className="text-[11px] text-emerald-700">
                        {currentLessonContent.blocks.length} block{currentLessonContent.blocks.length !== 1 ? "s" : ""} added
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={openLessonContentModal}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3.5 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-all cursor-pointer shadow-xs"
                  >
                    Edit Content
                  </button>

                </div>

              </div>
            )}

          </div>


          {/* ================= Preview ================= */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 h-full shadow-sm hover:border-gray-300 transition-all">

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.allowPreview}
                onChange={handlePreviewToggle}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
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

            {formData.allowPreview && (
              <div className="mt-5 space-y-4">

                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Preview Duration (Minutes)
                  </label>

                  <input
                    type="number"
                    value={formData.previewDuration ?? ""}
                    onChange={(e) =>
                      updateForm({
                        previewDuration:
                          e.target.value === ""
                            ? null
                            : Math.max(0, Number(e.target.value)),
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Preview Access Type
                  </label>

                  <select
                    value={formData.previewAccessType}
                    onChange={(e) =>
                      updateForm({
                        previewAccessType: e.target.value as PreviewAccessType,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="">Select Preview Access Type</option>

                    {previewAccessTypes?.map((type) => (
                      <option key={type} value={type}>
                        {type.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>

              </div>
            )}

          </div>

        </div>


        {/* Transcript */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">
            Transcript (VTT/SRT)
          </label>
          {(() => {
            const data: any = lessonData?.data?.data || lessonData?.data || lessonData;
            const isRemoved = formData.removedAssetRoles?.includes("TRANSCRIPT");
            const transcriptId = data?.transcriptAssetId || data?.transcript_asset_id || data?.assets_storage_lessons_transcript_asset_idToassets_storage?.id;
            const dbTranscriptAsset = lessonAssetsData.find((a: any) => a.id === transcriptId) || lessonAssetsData.find((a: any) => a.assetType === "DOCUMENT" && (a.storagePath === "transcripts" || a.assetContext === "LESSON_TRANSCRIPT"));
            const fallbackTranscriptAsset = data?.lessonAssets?.find((a: any) => a.assetRole === "TRANSCRIPT")?.asset;
            const existingTranscriptAsset = dbTranscriptAsset || fallbackTranscriptAsset;
            const existingTranscriptUrl = isRemoved ? "" : (existingTranscriptAsset?.signedUrl || existingTranscriptAsset?.url || formData.transcriptAssetUrl || "");
            const existingTranscriptName = isRemoved ? "" : (existingTranscriptAsset?.originalFileName || existingTranscriptAsset?.originalFilename || existingTranscriptAsset?.fileName || formData.transcriptAssetName || (existingTranscriptUrl ? existingTranscriptUrl.split("/").pop() : ""));

            if (!formData.transcript && !existingTranscriptUrl) {
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
                  {formData.transcript ? formData.transcript.name : `Existing: ${getDisplayFileName(existingTranscriptName, "Uploaded Subtitle")}`}
                </p>
                <div className="flex gap-3 mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      const url = formData.transcript ? URL.createObjectURL(formData.transcript) : existingTranscriptUrl;
                      window.open(url, "_blank");
                    }}
                    className="bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 font-bold text-xs px-3 py-1.5 rounded-lg transition-all"
                  >
                    Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (formData.transcript) {
                        updateForm({ transcript: null, transcriptAssetUrl: "", transcriptAssetName: "" });
                      } else {
                        const removed = formData.removedAssetRoles || [];
                        updateForm({
                          transcript: null,
                          transcriptAssetUrl: "",
                          transcriptAssetName: "",
                          removedAssetRoles: [...removed, "TRANSCRIPT"],
                        });
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
              const dbAtts = lessonAssetsData.filter((a: any) => a.assetType === "DOCUMENT" && (a.storagePath === "attachments" || a.assetContext === "LESSON_ATTACHMENT") && !formData.removedAttachmentIds?.includes(a.id));
              const fallbackAtts = data?.lessonAssets?.filter((a: any) => a.assetRole === "ATTACHMENT" && !formData.removedAttachmentIds?.includes(a.assetId)) || [];
              const existingAtts = dbAtts.length > 0 ? dbAtts : fallbackAtts;

              if (formData.lessonAttachments?.length > 0 || existingAtts.length > 0) {
                return (
                  <div className="mt-2 text-xs text-gray-600 w-full px-4">
                    {formData.lessonAttachments?.map((file, index) => (
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
                              updateForm({
                                lessonAttachments: formData.lessonAttachments.filter((_, i) => i !== index)
                              });
                            }}
                            className="text-red-600 font-bold px-1 hover:bg-red-50 rounded"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                    {existingAtts.map((la: any, index: number) => {
                      const url = la.url || la.asset?.url;
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
                              onClick={() => {
                                const removedIds = formData.removedAttachmentIds || [];
                                updateForm({
                                  removedAttachmentIds: [...removedIds, idToRemove]
                                });
                              }}
                              className="text-red-600 font-bold hover:bg-red-50 px-1 rounded"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                );
              } else {
                return (
                  <div className="text-center text-sm text-gray-500">
                    Drag files • PDFs / Slides / Docs
                  </div>
                );
              }
            })()}
          </label>
        </div>


      </div>
      {showLessonContentModal && (
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
                onClick={closeLessonContentModal}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all cursor-pointer"
                aria-label="Close study content editor"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SCROLLABLE CONTENT */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-gray-50/50">
              <div className="mx-auto w-full max-w-5xl space-y-8">
                {/* Lesson Content TITLE */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-600">
                    Lesson Title
                  </label>

                  <input
                    type="text"
                    value={formData.lessonTitle}
                    readOnly
                    placeholder="Enter lesson title first"
                    className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-800 outline-none"
                  />

                  {!formData.lessonTitle.trim() && (
                    <p className="mt-2 text-xs font-medium text-amber-600">
                      Enter the lesson title in Basic Information first. It will be used automatically as the Lesson Content title.
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
                          {lessonBlocks.length}
                        </span>
                      </h3>

                      <p className="mt-0.5 text-xs text-gray-500">
                        Add text sections and images. Reorder them using the arrow controls.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={addLessonTextBlock}
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
                          onChange={addLessonImages}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {lessonBlocks.length === 0 ? (
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
                      {lessonBlocks.map((block, index) => {
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
                                  onClick={() => moveLessonBlock(block.id, "UP")}
                                  className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                  title="Move Up"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  disabled={index === lessonBlocks.length - 1}
                                  onClick={() => moveLessonBlock(block.id, "DOWN")}
                                  className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                  title="Move Down"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => removeLessonBlock(block.id)}
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
                                    onChange={(e) =>
                                      updateLessonTextBlock(
                                        block.id,
                                        "title",
                                        e.target.value
                                      )
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
                                    onChange={(e) =>
                                      updateLessonTextBlock(
                                        block.id,
                                        "textContent",
                                        e.target.value
                                      )
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
                                    alt={
                                      (block.metadata?.caption as string) ??
                                      "Lesson Image"
                                    }
                                    className="max-h-[420px] w-full rounded-lg object-contain"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Image Caption (Optional)
                                  </label>
                                  <input
                                    type="text"
                                    value={(block.metadata?.caption as string) ?? ""}
                                    onChange={(e) =>
                                      updateLessonImageCaption(
                                        block.id,
                                        e.target.value
                                      )
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
                                onClick={() => insertLessonTextBlockAfter(block.id)}
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
                                  multiple
                                  accept="image/*"
                                  hidden
                                  onChange={(e) =>
                                    insertLessonImagesAfter(e, block.id)
                                  }
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
                {lessonBlocks.length > 0 && (
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

                    {formData.lessonTitle.trim() && (
                      <h2 className="mb-6 text-2xl font-extrabold text-gray-900 tracking-tight">
                        {formData.lessonTitle}
                      </h2>
                    )}

                    <div className="space-y-6">
                      {lessonBlocks.map((block) => {
                        if (block.blockType === "IMAGE") {
                          return (
                            <figure key={block.id} className="space-y-2">
                              <img
                                src={block.previewUrl || block.assetUrl}
                                alt={(block.metadata?.caption as string) ?? ""}
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
                {lessonBlocks.length} block{lessonBlocks.length !== 1 ? "s" : ""} in current study document
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={closeLessonContentModal}
                  className="rounded-xl border border-gray-300 px-5 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={saveLessonContents}
                  disabled={!formData.lessonTitle.trim()}
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

});

export default ContentDeveloperStandardLesson;