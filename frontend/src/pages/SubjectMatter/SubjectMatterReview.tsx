import React, { useEffect, useState, useMemo, useRef } from "react";
import { Skeleton } from "../../components/ui/Skeleton/Skeleton";
import { useNavigate, useSearchParams, useLocation, useParams } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getQuizzesApi } from "../../core/api/assessment.api";
import { resolveReviewCommentApi, replyReviewCommentApi } from "../../core/api/review/review-comment.api";
import { useCourseReviewUiStore } from "../../store/course-review/courseReview.store";
import { useCourseDetails, useCourseLessons } from "../../hooks/course-details/courseDetails";
import { useReview, useApproveReview, useRequestChanges } from "../../hooks/review/useReview";
import { useResolveWorkflow } from "../../hooks/review/useReviewWorkflow";
import { useReviewComments, useCreateReviewComment } from "../../hooks/review/useReviewComments";
import { useLesson } from "../../hooks/lesson/useLessons";
import { getLessonAttachmentsApi } from "../../core/api/lesson/lesson-attachment.api";
import { useCareerPathOverview } from "../../hooks/content-developer-workspace/useCourseOverview";
import { useCategories } from "../../hooks/category/useCategories";
import { useSubjects } from "../../hooks/useSubjects";
import { useSkills, useTags } from "../../hooks/useMaster";
import { useAssets } from "../../hooks/asset/useAssets";
import { useProfile } from "../../hooks/profile/useProfile";
import { useAuthStore } from "../../core/auth/auth.store";
import { useUserStore } from "../../store/user.store";
import {
    ChevronRight,
    Play,
    Pause,
    ChevronLeft,
    ChevronDown,
    Menu,
    X,
    BookOpen,
    Subtitles,
    Volume2,
    VolumeX,
    Maximize2,
    FileText,
    Settings,
} from "lucide-react";

// ==================== ASSET & STRING HELPERS ====================

interface SubtitleCue {
    start: number; // in seconds
    end: number;   // in seconds
    text: string;
}

function parseTimeToSeconds(timeStr: string): number {
    const clean = timeStr.trim().replace(",", ".");
    const parts = clean.split(":");
    if (parts.length === 3) {
        return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
    }
    if (parts.length === 2) {
        return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
    }
    return parseFloat(clean) || 0;
}

function parseSrtOrVtt(content: string): SubtitleCue[] {
    if (!content) return [];
    const cues: SubtitleCue[] = [];
    const normalized = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const blocks = normalized.split(/\n\s*\n/);

    for (const block of blocks) {
        const lines = block.trim().split("\n");
        if (lines.length === 0) continue;

        let timeLineIndex = -1;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes("-->")) {
                timeLineIndex = i;
                break;
            }
        }
        if (timeLineIndex === -1) continue;

        const timeLine = lines[timeLineIndex];
        const [startStr, endStr] = timeLine.split("-->").map(s => s.trim().split(" ")[0]);
        const start = parseTimeToSeconds(startStr);
        const end = parseTimeToSeconds(endStr);
        const text = lines.slice(timeLineIndex + 1).join(" ").replace(/<[^>]+>/g, "").trim();

        if (text && !isNaN(start) && !isNaN(end)) {
            cues.push({ start, end, text });
        }
    }
    return cues;
}

function resolveQuizParentParams(type: string, id: string) {
    const normType = (type || "").toLowerCase();
    if (!id) return null;
    if (normType === "course") return { courseId: id };
    if (normType === "careerpath" || normType === "career-path") return { careerPathId: id };
    if (normType === "lesson") return { lessonId: id };
    return null;
}

function isTranscriptAsset(url?: string, fileName?: string): boolean {
    const value = `${url || ""} ${fileName || ""}`.toLowerCase();
    return /(?:transcript|\.(?:srt|vtt)(?:$|[?#]))/.test(value);
}

function getAssetUrl(asset: any): string {
    if (asset?.assetSource === "EXTERNAL_URL" && asset?.externalUrl) {
        return asset.externalUrl;
    }
    return asset?.signedUrl || asset?.fileUrl || asset?.externalUrl || asset?.url || "";
}

function isVideoAsset(asset: any): boolean {
    const url = getAssetUrl(asset);
    const fileName = asset?.originalFileName || asset?.fileName || asset?.name;
    if (isTranscriptAsset(url, fileName)) return false;
    return asset?.assetRole === "VIDEO"
        || asset?.assetType === "VIDEO"
        || String(asset?.mimeType || "").toLowerCase().startsWith("video/")
        || Boolean(asset?.externalUrl)
        || Boolean(asset?.gcsKey && (asset?.storagePath === "videos" || asset?.assetContext === "LESSON_CONTENT" || asset?.assetContext === "LESSON"))
        || /\.(?:mp4|webm|ogg|m3u8|mov|avi)(?:$|[?#])/i.test(`${url} ${fileName || ""}`);
}

const normalizeWorkflowStatus = (value: any) => String(value || "UNDER_REVIEW").toUpperCase().replace(/-/g, "_");

// ==================== SKELETON LOADER ====================
const LoadingSkeleton = () => (
  <div className="w-full min-h-screen bg-[var(--paper)]">
    <div className="flex h-[72px] items-center border-b border-[var(--line)] px-6">
      <Skeleton className="h-10 w-10 rounded-full mr-4" />
      <Skeleton className="h-6 w-1/3 max-w-[300px]" />
    </div>
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-72px)]">
      <div className="flex-1 p-6 space-y-6">
        <Skeleton className="w-full aspect-video rounded-[var(--r-lg)]" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-32 w-full rounded-[var(--r-md)]" />
        <Skeleton className="h-32 w-full rounded-[var(--r-md)]" />
      </div>
      <div className="w-full lg:w-[450px] border-l border-[var(--line)] p-6 space-y-6">
         <Skeleton className="h-[48px] w-full rounded-[var(--r-md)]" />
         <div className="space-y-4">
           {[1, 2, 3].map(i => (
             <div key={i} className="flex gap-3">
               <Skeleton className="size-8 rounded-full shrink-0" />
               <div className="space-y-2 flex-1">
                 <Skeleton className="h-4 w-1/2" />
                 <Skeleton className="h-20 w-full rounded-[var(--r-md)]" />
               </div>
             </div>
           ))}
         </div>
      </div>
    </div>
  </div>
);

// ==================== MAIN COMPONENT ====================

const SubjectMatterReview: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { id: routeId } = useParams();

    // Determine Entity ID and Type from URL parameters or Navigation state
    const entityId = routeId || searchParams.get("id") || searchParams.get("courseId") || location.state?.courseId || location.state?.entityId || "";
    const entityTypeRaw = searchParams.get("type") || location.state?.type || "course";
    const entityType = entityTypeRaw.toLowerCase();

    const queryClient = useQueryClient();

    // Video & Captions state
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(2718);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [isCaptionsOn, setIsCaptionsOn] = useState(true);
    const [showCaptionSettings, setShowCaptionSettings] = useState(false);
    const [captionFontSize, setCaptionFontSize] = useState("text-[14px]");
    const [captionColor, setCaptionColor] = useState("text-white");
    const [isMuted, setIsMuted] = useState(false);
    const [videoHasError, setVideoHasError] = useState(false);

    // Collapsible outline states
    const [isCareerPathExpanded, setIsCareerPathExpanded] = useState(true);
    const [expandedCourseMap, setExpandedCourseMap] = useState<Record<string, boolean>>({});
    const [isMobileOutlineOpen, setIsMobileOutlineOpen] = useState(false);

    // Comment states
    const [localComments, setLocalComments] = useState<any[]>([]);
    const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
    const [replyDraft, setReplyDraft] = useState("");

    // Reject / Approve modal state
    const [rejectNoCommentError, setRejectNoCommentError] = useState(false);
    const [showApproveModal, setShowApproveModal] = useState(false);

    // Dynamic Media, Attachments, and SRT Captions State
    const [resolvedAttachments, setResolvedAttachments] = useState<any[]>([]);
    const [resolvedCourseAttachments, setResolvedCourseAttachments] = useState<any[]>([]);
    const [actualTranscriptUrl, setActualTranscriptUrl] = useState<string | null>(null);
    const [actualTranscriptFileName, setActualTranscriptFileName] = useState<string>("transcript.srt");
    const [parsedSubtitles, setParsedSubtitles] = useState<SubtitleCue[]>([]);
    const [isLoadingTranscript, setIsLoadingTranscript] = useState(false);
    const [transcriptExpanded, setTranscriptExpanded] = useState(false);

    // Global Store
    const {
        selectedLessonId,
        setSelectedLessonId,
        commentDraft,
        setCommentDraft,
        commentKind,
        setCommentKind,
    } = useCourseReviewUiStore();

    // User profile & role
    const { profile } = useProfile();
    const { role } = useAuthStore();
    const { getAllAssets, getAssetById } = useAssets();
    const [entityAssets, setEntityAssets] = useState<any[]>([]);

    // ── Backend Queries ──
    const isLessonEntity = entityType === "lesson";
    const isCourseEntity = entityType === "course";
    const isCareerPathEntity = entityType === "careerpath" || entityType === "career-path";

    // 1. Single Lesson Query (Critical when entityType is "lesson")
    const { data: lessonQueryRes, isLoading: isLoadingSingleLesson } = useLesson(
        isLessonEntity && !!entityId ? entityId : undefined
    );
    const rawSingleLesson = (lessonQueryRes as any)?.data || lessonQueryRes;

    // 2. Course Details & Lessons Query
    const effectiveCourseId = isLessonEntity ? (rawSingleLesson?.courseId || rawSingleLesson?.course?.id || "") : entityId;
    const { data: courseData, isLoading: isLoadingCourse } = useCourseDetails(
        effectiveCourseId,
        !!effectiveCourseId && (isCourseEntity || (isLessonEntity && !!effectiveCourseId))
    );
    const { data: lessonsData, isLoading: isLoadingLessons } = useCourseLessons(
        effectiveCourseId,
        !!effectiveCourseId && (isCourseEntity || (isLessonEntity && !!effectiveCourseId))
    );

    // 3. Career Path Overview
    const { data: careerPathData, isLoading: isLoadingCareerPath } = useCareerPathOverview(
        isCareerPathEntity && !!entityId ? entityId : ""
    );

    // 4. Review Metadata
    const { data: courseReview, isLoading: isLoadingReview } = useReview(
        isCareerPathEntity ? "career-path" : (isLessonEntity ? "lesson" : "course"),
        entityId
    );

    // 5. Comments & Reviews Queue
    const { categories } = useCategories();
    const { data: skills = [] } = useSkills();
    const { data: tags = [] } = useTags();
    const { subjects } = useSubjects();

    const { data: commentsData, isLoading: isLoadingComments } = useReviewComments(
        entityId || "",
        isCareerPathEntity ? "career-path" : (isLessonEntity ? "lesson" : "course")
    );


    // ── Mutations ──
    const approveMutation = useApproveReview();
    const rejectMutation = useRequestChanges();
    const submitCommentMutation = useCreateReviewComment(entityId || "");

    const reviewer = useMemo(() => {
        const name = profile ? `${profile.profile?.firstName || ""} ${profile.profile?.lastName || ""}`.trim() : "";
        return {
            id: profile?.id || "",
            name: name || "Subject Matter Expert",
        };
    }, [profile]);

    // ── Normalized Hierarchy ──
    const rawCourse = (courseData as any)?.data || courseData;
    const rawCareerPath = (careerPathData as any)?.data || careerPathData;
    // console.log("DEBUG: rawCareerPath", rawCareerPath);

    // Courses in review (Supports CareerPath, Course, AND Single Lesson Review)
    const coursesInReview = useMemo(() => {
        // A) Career Path Entity
        if (isCareerPathEntity) {
            const cpCourses = rawCareerPath?.courses || rawCareerPath?.careerPathCourses || [];
            return cpCourses.map((cpc: any, idx: number) => {
                // cpc is the CareerPathCourse junction record;
                // cpc.course is the actual Course entity.
                const c = cpc.course || cpc;
                return {
                    ...c, // Inject all raw course properties first!
                    id: c.id || `course-${idx}`,
                    courseId: c.id,
                    title: c.title || c.name || `Course ${idx + 1}`,
                    description: c.description || "",
                    category: c.category?.name || c.category || rawCareerPath?.category?.name || rawCareerPath?.category || "N/A",
                    duration: c.duration || "-",
                    difficulty: c.difficulty || rawCareerPath?.difficulty || "-",
                    assessmentRequired: c.assessmentRequired ?? true,
                    status: c.status || "UNDER_REVIEW",
                    lessons: c.courseLessons || c.lessons || [],
                    // Pull isMandatory and sequenceOrder from the junction record
                    isMandatory: cpc.isMandatory !== undefined ? cpc.isMandatory : true,
                    sequenceOrder: cpc.sequenceOrder ?? cpc.sequence ?? idx + 1,
                };
            });
        }

        // B) Single Lesson Review Entity
        if (isLessonEntity) {
            const l = rawSingleLesson;
            const parentCourse = rawCourse || l?.course;
            return [{
                ...(parentCourse || {}),
                id: parentCourse?.id || l?.courseId || "parent-course",
                courseId: parentCourse?.id || l?.courseId || "parent-course",
                title: parentCourse?.title || parentCourse?.name || "Course Overview",
                description: parentCourse?.description || "",
                category: parentCourse?.category?.name || parentCourse?.category || "Training",
                duration: l?.duration ? `${l.duration} min` : "45 min",
                difficulty: parentCourse?.difficulty || "-",
                assessmentRequired: false,
                status: l?.status || "UNDER_REVIEW",
                lessons: l ? [{
                    id: l.id || entityId,
                    lessonId: l.id || entityId,
                    title: l.title || l.name || "Lesson",
                    description: l.description || "",
                    duration: l.duration || 45,
                    videoUrl: l.videoUrl,
                    contentAsset: l.contentAsset || l.assets_storage_lessons_content_asset_idToassets_storage,
                    lesson: l,
                }] : [{
                    id: entityId,
                    lessonId: entityId,
                    title: "Lesson",
                    duration: 45,
                    lesson: { id: entityId, title: "Lesson" }
                }],
            }];
        }

        // C) Course Review Entity
        if (isCourseEntity) {
            const rawLessonsList = Array.isArray(lessonsData) ? lessonsData : ((lessonsData as any)?.data || []);
            return [{
                // Spread rawCourse first so subjects, categoryId, tags, skills and
                // all other relations are available on currentCourseData.
                ...(rawCourse || {}),
                id: entityId,
                courseId: entityId,
                title: rawCourse?.title || rawCourse?.name || "Course",
                description: rawCourse?.description || "",
                category: rawCourse?.category?.name || rawCourse?.category || "N/A",
                duration: rawCourse?.duration || "-",
                difficulty: rawCourse?.difficulty || "-",
                assessmentRequired: rawCourse?.assessmentRequired ?? true,
                status: rawCourse?.status || "UNDER_REVIEW",
                lessons: rawLessonsList,
            }];
        }

        return [];
    }, [isCareerPathEntity, isLessonEntity, isCourseEntity, rawCareerPath, rawSingleLesson, rawCourse, lessonsData, entityId]);

    // Flatten all lessons for lookup
    const allFlattenedLessons = useMemo(() => {
        const result: any[] = [];
        coursesInReview.forEach((course: any) => {
            const list = course.lessons || [];
            list.forEach((item: any) => {
                const lData = item.lesson || item;
                result.push({
                    ...item,
                    courseId: course.id,
                    courseTitle: course.title,
                    id: item.id || item.lessonId || lData.id,
                    lessonId: item.lessonId || item.id || lData.id,
                    lesson: lData,
                });
            });
        });
        return result;
    }, [coursesInReview]);

    // ── Reliable Selection Initialization ──
    useEffect(() => {
        if (isLessonEntity) {
            if (selectedLessonId !== entityId) {
                setSelectedLessonId(entityId);
            }
        } else if (isCareerPathEntity) {
            if (!selectedLessonId || selectedLessonId === "course-info") {
                setSelectedLessonId("career-path");
            }
        } else {
            // Course: if selectedLessonId is invalid or stale, default to "course-info"
            const isValidSelection = selectedLessonId === "course-info" ||
                selectedLessonId === "assessment-node" ||
                coursesInReview.some((c: any) => c.id == selectedLessonId) ||
                allFlattenedLessons.some(l => l.id === selectedLessonId || l.lessonId === selectedLessonId);

            if (!isValidSelection) {
                setSelectedLessonId("course-info");
            }
        }
    }, [isLessonEntity, isCareerPathEntity, entityId, selectedLessonId, coursesInReview, allFlattenedLessons, setSelectedLessonId]);

    // Active Mode Computations
    const isCareerPathSelected = isCareerPathEntity && (
        selectedLessonId === "career-path" ||
        selectedLessonId === "careerpath-info" ||
        selectedLessonId === "course-info"
    );

    const selectedCourse = useMemo(() => {
        if (isLessonEntity) return null;
        return coursesInReview.find((c: any) => c.id == selectedLessonId || c.courseId === selectedLessonId) || null;
    }, [isLessonEntity, coursesInReview, selectedLessonId]);

    const isCourseSelected = !isCareerPathSelected && !isLessonEntity && (
        selectedLessonId === "course-info" || !!selectedCourse
    );

    const currentCourseData = useMemo(() => {
        if (selectedCourse) return selectedCourse;
        if (coursesInReview.length > 0) return coursesInReview[0];
        return null;
    }, [selectedCourse, coursesInReview]);

    const activeLesson = useMemo(() => {
        if (isCareerPathSelected) return null;
        if (isLessonEntity) {
            return allFlattenedLessons[0] || (rawSingleLesson ? {
                id: rawSingleLesson.id || entityId,
                lessonId: rawSingleLesson.id || entityId,
                lesson: rawSingleLesson,
                title: rawSingleLesson.title || "Lesson",
            } : null);
        }
        if (isCourseSelected) return null;
        return allFlattenedLessons.find(l => (l.id === selectedLessonId || l.lessonId === selectedLessonId)) || null;
    }, [isCareerPathSelected, isCourseSelected, isLessonEntity, allFlattenedLessons, selectedLessonId, rawSingleLesson, entityId]);

    const activeLessonIndex = useMemo(() => {
        if (isLessonEntity) return 0;
        return allFlattenedLessons.findIndex(l => (l.id === selectedLessonId || l.lessonId === selectedLessonId));
    }, [isLessonEntity, allFlattenedLessons, selectedLessonId]);

    const activeLessonData = activeLesson?.lesson || activeLesson || rawSingleLesson;

    // Guaranteed View Flags (Ensures workspace never renders blank!)
    const isAssessmentSelected = selectedLessonId === "assessment-node";
    const isLessonViewActive = isLessonEntity || (!isCareerPathSelected && !isCourseSelected && !isAssessmentSelected && !!activeLesson);
    const isCourseViewActive = !isCareerPathSelected && !isLessonViewActive && !isAssessmentSelected;

    // Load assets for active lesson/entity
    useEffect(() => {
        if (!entityId && !activeLesson) return;
        let isMounted = true;
        const fetchAssets = async () => {
            try {
                const queryParams: any = {};
                const currLessonId = activeLessonData?.id || activeLessonData?.lessonId || (isLessonEntity ? entityId : undefined);
                if (isCourseEntity) {
                    queryParams.courseId = entityId;
                } else if (isCareerPathEntity) {
                    queryParams.careerPathId = entityId;
                } else if (currLessonId) {
                    queryParams.lessonId = currLessonId;
                }
                const assets = await getAllAssets(queryParams);
                if (isMounted) setEntityAssets(assets || []);
            } catch (e) {
                console.warn("Could not fetch assets:", e);
            }
        };
        fetchAssets();
        return () => { isMounted = false; };
    }, [entityId, isLessonEntity, isCourseEntity, isCareerPathEntity, activeLessonData, getAllAssets, activeLesson]);

    // ── Dedicated Dynamic Resolver for Attachments & SRT Transcript Files ──
    useEffect(() => {
        let isMounted = true;

        const resolveMediaAndAssets = async () => {
            // First, process entity assets for course-level attachments (these don't require an active lesson)
            const extractedCourseAttachments: any[] = [];
            entityAssets.forEach((ea: any) => {
                const isNotTranscript = !isTranscriptAsset(getAssetUrl(ea), ea.fileName || ea.name);
                const isNotVideo = !isVideoAsset(ea);

                if (isNotTranscript && isNotVideo && !ea.lessonId) {
                    extractedCourseAttachments.push(ea);
                }
            });

            const uniqueCourseAttachments = extractedCourseAttachments.filter((att, idx, self) => {
                if (!att) return false;
                const url = getAssetUrl(att);
                const name = att.originalFileName || att.fileName || att.name;
                const id = att.id || att.assetId;
                return self.findIndex(o => (id && (o.id === id || o.assetId === id)) || (url && getAssetUrl(o) === url) || (name && (o.originalFileName || o.fileName || o.name) === name)) === idx;
            });

            const enrichedCourseAttachments = await Promise.all(
                uniqueCourseAttachments.map(async (att: any) => {
                    let url = getAssetUrl(att);
                    const assetId = att.id || att.assetId;
                    if ((!url || url.includes("null") || !url.startsWith("http")) && assetId) {
                        try {
                            const fresh = await getAssetById(assetId);
                            url = getAssetUrl(fresh) || url;
                        } catch (e) {
                            console.warn("Could not get fresh URL for attachment:", assetId, e);
                        }
                    }
                    return {
                        ...att,
                        url,
                        signedUrl: url,
                        fileName: att.originalFileName || att.fileName || att.name || "course-attachment.pdf",
                        size: att.fileSize || att.size,
                    };
                })
            );

            if (isMounted) {
                setResolvedCourseAttachments(enrichedCourseAttachments);
            }

            if (!activeLessonData) {
                if (isMounted) {
                    setResolvedAttachments([]);
                    setActualTranscriptUrl(null);
                    setParsedSubtitles([]);
                }
                return;
            }

            // ==========================================
            // 1. RESOLVE ATTACHMENTS (ACTUAL FILES)
            // ==========================================
            const lessonAssetsList = activeLessonData.lessonAssets || [];
            let rawAttachmentsList = Array.isArray(activeLessonData.attachments) ? activeLessonData.attachments : [];

            const activeId = activeLessonData.id || activeLessonData.lessonId;
            if (activeId) {
                try {
                    const fetchedAttachments = await getLessonAttachmentsApi(activeId);
                    if (Array.isArray(fetchedAttachments) && fetchedAttachments.length > 0) {
                        rawAttachmentsList = [...rawAttachmentsList, ...fetchedAttachments];
                    }
                } catch (err: any) {
                    if (err?.response?.status !== 404) {
                        console.warn("Failed to fetch dedicated lesson attachments:", err);
                    }
                }
            }

            const extractedAttachments: any[] = [];

            // A. From lessonAssets
            lessonAssetsList.forEach((la: any) => {
                if (la.assetRole === "ATTACHMENT" || la.role === "ATTACHMENT" || la.assetContext === "LESSON_ATTACHMENT") {
                    extractedAttachments.push(la.asset || la);
                }
            });

            // B. From lesson.attachments / fetched attachments
            rawAttachmentsList.forEach((att: any) => {
                // Push the nested asset object if it exists, otherwise push the attachment itself
                const assetObj = att.asset || att;
                if (assetObj && (assetObj.id || assetObj.assetId || assetObj.signedUrl || assetObj.storagePath)) {
                    extractedAttachments.push(assetObj);
                }
            });

            // C. From entityAssets matching this lesson or general documents (excluding transcript/video)
            entityAssets.forEach((ea: any) => {
                const isNotTranscript = !isTranscriptAsset(getAssetUrl(ea), ea.fileName || ea.name);
                const isNotVideo = !isVideoAsset(ea);

                if (isNotTranscript && isNotVideo && ea.lessonId === activeId) {
                    extractedAttachments.push(ea);
                }
            });

            // De-duplicate attachments by ID or URL/FileName
            const uniqueAttachments = extractedAttachments.filter((att, idx, self) => {
                if (!att) return false;
                const url = getAssetUrl(att);
                const name = att.originalFileName || att.fileName || att.name;
                const id = att.id || att.assetId;
                return self.findIndex(o => (id && (o.id === id || o.assetId === id)) || (url && getAssetUrl(o) === url) || (name && (o.originalFileName || o.fileName || o.name) === name)) === idx;
            });

            // Refresh signed URLs if needed
            const enrichedAttachments = await Promise.all(
                uniqueAttachments.map(async (att: any) => {
                    let url = getAssetUrl(att);
                    const assetId = att.id || att.assetId;
                    if ((!url || url.includes("null") || !url.startsWith("http")) && assetId) {
                        try {
                            const fresh = await getAssetById(assetId);
                            url = getAssetUrl(fresh) || url;
                        } catch (e) {
                            console.warn("Could not get fresh URL for attachment:", assetId, e);
                        }
                    }
                    return {
                        ...att,
                        url,
                        signedUrl: url,
                        fileName: att.originalFileName || att.fileName || att.name || "attachment.pdf",
                        size: att.fileSize || att.size,
                    };
                })
            );

            if (isMounted) {
                setResolvedAttachments(enrichedAttachments);
            }

            // ==========================================
            // 2. RESOLVE SRT / TRANSCRIPT FILE (ACTUAL DATA)
            // ==========================================
            let transUrl = "";
            let transName = "transcript.srt";

            // A. Check lesson transcript relation
            const transcriptRel = activeLessonData.assets_storage_lessons_transcript_asset_idToassets_storage || activeLessonData.transcriptAsset;
            if (transcriptRel) {
                transUrl = getAssetUrl(transcriptRel);
                transName = transcriptRel.originalFileName || transcriptRel.fileName || transName;
            }

            // B. Check lessonAssets for transcript
            if (!transUrl) {
                const transEntry = lessonAssetsList.find((la: any) => la.assetRole === "TRANSCRIPT" || la.role === "TRANSCRIPT");
                if (transEntry) {
                    const tAsset = transEntry.asset || transEntry;
                    transUrl = getAssetUrl(tAsset);
                    transName = tAsset.originalFileName || tAsset.fileName || transName;
                }
            }

            // C. Check direct URL fields
            if (!transUrl) {
                transUrl = activeLessonData.subtitleUrl || activeLessonData.transcriptUrl || "";
            }

            // D. Check entityAssets
            if (!transUrl) {
                const entityTranscript = entityAssets.find((a: any) =>
                    isTranscriptAsset(getAssetUrl(a), a.fileName || a.name) || a.assetRole === "TRANSCRIPT" || a.storagePath === "transcripts"
                );
                if (entityTranscript) {
                    transUrl = getAssetUrl(entityTranscript);
                    transName = entityTranscript.originalFileName || entityTranscript.fileName || transName;
                }
            }

            // E. Fetch signed URL by ID if URL is missing or not a full URL
            const transcriptId = activeLessonData.transcriptAssetId || activeLessonData.transcript_asset_id || activeLessonData.assets_storage_lessons_transcript_asset_idToassets_storage?.id || activeLessonData.transcriptAsset?.id;
            if (transcriptId && (!transUrl || !transUrl.startsWith("http"))) {
                try {
                    const freshTrans = await getAssetById(transcriptId);
                    if (freshTrans) {
                        transUrl = getAssetUrl(freshTrans) || transUrl;
                        transName = freshTrans.originalFileName || freshTrans.fileName || transName;
                    }
                } catch (e) {
                    console.warn("Could not get fresh URL for transcript:", transcriptId, e);
                }
            }

            if (isMounted) {
                setActualTranscriptUrl(transUrl || null);
                setActualTranscriptFileName(transName);
            }

            // ==========================================
            // 3. FETCH AND PARSE SRT / VTT CONTENT
            // ==========================================
            if (transUrl && transUrl.startsWith("http")) {
                setIsLoadingTranscript(true);
                try {
                    const res = await fetch(transUrl);
                    if (res.ok) {
                        const srtRawText = await res.text();
                        if (isMounted) {
                            const parsed = parseSrtOrVtt(srtRawText);
                            setParsedSubtitles(parsed);
                        }
                    } else {
                        console.warn("Transcript HTTP fetch returned status", res.status);
                        if (isMounted) setParsedSubtitles([]);
                    }
                } catch (err) {
                    console.warn("Failed to fetch/parse transcript file content:", err);
                    if (isMounted) setParsedSubtitles([]);
                } finally {
                    if (isMounted) setIsLoadingTranscript(false);
                }
            } else {
                if (isMounted) {
                    setParsedSubtitles([]);
                    setIsLoadingTranscript(false);
                }
            }
        };

        resolveMediaAndAssets();
        return () => { isMounted = false; };
    }, [activeLessonData, entityAssets, getAssetById]);

    // ── Video Playback Source Resolution ──
    const [fetchedVideoSrc, setFetchedVideoSrc] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        setVideoHasError(false);

        const resolveVideo = async () => {
            if (!activeLessonData) {
                if (isMounted) setFetchedVideoSrc("");
                return;
            }

            const activeLId = activeLessonData?.id || activeLessonData?.lessonId;
            const contentAsset = activeLessonData?.assets_storage_lessons_content_asset_idToassets_storage || activeLessonData?.contentAsset;
            const lessonVideoEntry = activeLessonData?.lessonAssets?.find((entry: any) =>
                !isTranscriptAsset(getAssetUrl(entry?.asset || entry), entry?.asset?.fileName || entry?.fileName)
                && isVideoAsset(entry?.asset || entry)
            );
            const listedVideoAsset = entityAssets.find((asset: any) =>
                String(asset?.lessonId || asset?.lesson_id || "") === String(activeLId || "")
                && isVideoAsset(asset)
            );

            const videoCandidate = [contentAsset, lessonVideoEntry?.asset || lessonVideoEntry, listedVideoAsset].find(a => isVideoAsset(a));
            let videoUrl = getAssetUrl(videoCandidate) || activeLessonData?.contentUrl || activeLessonData?.videoUrl || activeLessonData?.assets_storage_lessons_content_asset_idToassets_storage?.externalUrl || "";

            const assetId = videoCandidate?.id || lessonVideoEntry?.assetId || activeLessonData?.content_asset_id || activeLessonData?.contentAssetId;
            if (assetId) {
                try {
                    const fullAsset = await getAssetById(assetId);
                    const signed = fullAsset?.signedUrl || fullAsset?.fileUrl || fullAsset?.url || fullAsset?.externalUrl;
                    if (signed) videoUrl = signed;
                } catch (err) {
                    console.warn("Failed to get fresh signed URL for lesson video:", err);
                }
            }

            if (!videoUrl || videoUrl.includes("null/null")) {
                videoUrl = "";
            }

            if (isMounted) {
                setFetchedVideoSrc(videoUrl);
            }
        };

        resolveVideo();
        return () => { isMounted = false; };
    }, [activeLessonData, entityAssets, getAssetById]);

    // Quizzes / Assessments
    const activeQuizParams = useMemo(() => {
        if (activeLesson) {
            return { lessonId: activeLesson.lessonId || activeLesson.id };
        }
        return resolveQuizParentParams(entityType, entityId);
    }, [activeLesson, entityType, entityId]);

    const { data: quizzesListRes } = useQuery({
        queryKey: ["quizzes-list", activeQuizParams],
        queryFn: () => getQuizzesApi(activeQuizParams as Record<string, any>),
        enabled: !!activeQuizParams,
    });

    const quizzes = quizzesListRes?.data?.items || quizzesListRes?.data?.data || (Array.isArray(quizzesListRes?.data) ? quizzesListRes?.data : []);

    // ── Comments Aggregation ──
    const comments: any[] = useMemo(() => {
        const backendComments = Array.isArray(commentsData) ? commentsData : ((commentsData as any)?.items || []);
        const mappedBackend = backendComments.map((log: any) => ({
            id: log.id || log.commentId,
            commentId: log.id || log.commentId,
            entityId: log.entityId || log.lessonId || entityId,
            lessonRef: log.lessonRef || log.lessonTitle || (log.lessonId ? `Lesson` : "Course"),
            authorName: log.actor?.name || log.actor?.email || (log.actor?.profile ? `${log.actor.profile.firstName || ''} ${log.actor.profile.lastName || ''}`.trim() : "Reviewer"),
            message: (log.comment || log.message || "").replace(/^\[(Required|Suggestion|Resolved)\]\s*/gi, "").replace(/^\[(Required|Suggestion|Resolved)\]\s*/gi, ""),
            type: log.type || (log.toStatus === "REJECTED" ? "Required" : "Suggestion"),
            resolved: log.resolved || log.toStatus === "APPROVED" || Boolean((log.comment || log.message)?.toLowerCase().includes("[resolved]")),
            postedAgo: log.createdAt ? new Date(log.createdAt).toLocaleDateString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "Just now",
            timeTag: log.timestamp || "Lesson",
            replies: log.replies || [],
        }));

        return [...mappedBackend, ...localComments];
    }, [commentsData, localComments, entityId]);

    // Scoped comments
    const activeLId = activeLessonData?.id || activeLessonData?.lessonId || entityId;
    const scopedComments = useMemo(() => {
        if (isLessonViewActive && activeLId) {
            return comments.filter(c => {
                if (!c.entityId || c.entityId === activeLId) return true;
                if (c.lessonRef && activeLessonData?.title && c.lessonRef.includes(activeLessonData.title)) return true;
                return false;
            });
        }
        if (isCourseViewActive && currentCourseData) {
            return comments.filter(c => c.entityId === currentCourseData.id || c.entityId === entityId);
        }
        return comments;
    }, [comments, isLessonViewActive, isCourseViewActive, activeLId, activeLessonData, currentCourseData, entityId]);

    const requiredUnresolved = comments.filter(c => c.type === "Required" && !c.resolved);
    const suggestionUnresolved = comments.filter(c => c.type === "Suggestion" && !c.resolved);
    const isApprovalGated = requiredUnresolved.length > 0;

    // Helper to get dot tone per lesson based on real comments
    const getLessonDotClass = (lId: string) => {
        const lComments = comments.filter(c => c.entityId === lId || (c.lessonRef && c.lessonRef.includes(lId)));
        if (lComments.some(c => c.type === "Required" && !c.resolved)) return "bg-[#c86d5e]";
        if (lComments.some(c => c.type === "Suggestion" && !c.resolved)) return "bg-amber-500";
        if (lComments.length > 0 && lComments.every(c => c.resolved)) return "bg-[#748f65]";
        return "bg-gray-300";
    };

    const getLessonStatusBadge = (lId: string) => {
        const lComments = comments.filter(c => c.entityId === lId || (c.lessonRef && c.lessonRef.includes(lId)));
        const reqCount = lComments.filter(c => c.type === "Required" && !c.resolved).length;
        const sugCount = lComments.filter(c => c.type === "Suggestion" && !c.resolved).length;
        if (reqCount > 0) {
            return <span className="px-2.5 py-0.5 rounded-full border border-red-200 bg-red-50 text-[#c86d5e] text-[12px] font-bold">{reqCount} required</span>;
        }
        if (sugCount > 0) {
            return <span className="px-2.5 py-0.5 rounded-full border border-amber-200 bg-amber-50 text-amber-800 text-[12px] font-bold">{sugCount} suggestion</span>;
        }
        if (lComments.length > 0) {
            return <span className="px-2.5 py-0.5 rounded-full border border-[#748f65]/30 bg-[#748f65]/10 text-[#748f65] text-[12px] font-bold">Clear</span>;
        }
        return <span className="text-[12px] text-[var(--ink-soft)] font-medium">No comments</span>;
    };

    // ── Entity Display Strings ──
    const entityTitle = useMemo(() => {
        if (isCareerPathEntity) return rawCareerPath?.title || rawCareerPath?.name || "Career Path";
        if (isLessonEntity) return rawSingleLesson?.title || rawSingleLesson?.name || "Single Lesson";
        return rawCourse?.title || rawCourse?.name || "Course";
    }, [isCareerPathEntity, isLessonEntity, rawCareerPath, rawSingleLesson, rawCourse]);

    const rawSubmitter = rawCourse?.createdBy || rawCareerPath?.createdBy || rawSingleLesson?.createdBy || (courseReview as any)?.submittedBy || (courseReview as any)?.submittedById || "Author";
    const submitterName = typeof rawSubmitter === "object"
        ? ((rawSubmitter?.profile?.firstName || rawSubmitter?.profile?.lastName) 
            ? `${rawSubmitter?.profile?.firstName || ""} ${rawSubmitter?.profile?.lastName || ""}`.trim() 
            : (rawSubmitter?.email || "Author"))
        : String(rawSubmitter);
    const submittedDate = courseReview?.submittedAt
        ? new Date(courseReview.submittedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
        : "";
    const waitDays = courseReview?.submittedAt
        ? Math.floor((Date.now() - new Date(courseReview.submittedAt).getTime()) / 86_400_000)
        : 0;

    const { permissions } = useAuthStore();
    const { user } = useUserStore();
    const isSMERole = (role || "").toUpperCase().includes("SUBJECT_MATTER") || (role || "").toUpperCase() === "SME";
    const hasGlobalReviewAccess = isSMERole || ((user as any)?.isSystemRole && permissions?.some((p: string) => p === "COURSE.UPDATE" || p === "CAREER_PATH.UPDATE"));

    const currentStatus = courseReview?.status || "UNDER_REVIEW";
    const isViewOnlyParam = searchParams.get("viewOnly") === "true" || location.state?.viewOnly;
    // reviewerId in the DB is always the User table ID (dbUser.id), same as user.id in the store
    const currentUserId = user?.id || (user as any)?.userId;
    const isAllocatedReviewer = !!(courseReview?.reviewerId && currentUserId &&
        courseReview.reviewerId === currentUserId);
    // SME role always sees action buttons; otherwise check allocation
    const isViewOnly = isViewOnlyParam || (!isSMERole && !isLoadingReview && !!courseReview && !hasGlobalReviewAccess && !isAllocatedReviewer);

    // ── Video Playback Handlers ──
    const handlePlayPauseToggle = () => {
        if (!videoRef.current) return;
        if (videoRef.current.paused) {
            videoRef.current.play().then(() => setIsPlaying(true)).catch((err) => {
                console.warn("Video play error:", err);
                setVideoHasError(true);
            });
        } else {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    };

    const handleVideoTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    const handleVideoLoadedMetadata = () => {
        if (videoRef.current && videoRef.current.duration) {
            setDuration(videoRef.current.duration);
        }
    };

    const handleSpeedToggle = () => {
        const speeds = [1, 1.25, 1.5, 2];
        const next = speeds[(speeds.indexOf(playbackRate) + 1) % speeds.length];
        setPlaybackRate(next);
        if (videoRef.current) {
            videoRef.current.playbackRate = next;
        }
    };

    const handleMuteToggle = () => {
        if (!videoRef.current) return;
        videoRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    const handleFullscreen = () => {
        if (!videoRef.current) return;
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(err => console.warn(err));
        } else {
            videoRef.current.requestFullscreen().catch(err => console.warn(err));
        }
    };

    // Synced captions from ACTUAL parsed SRT cues
    const currentSubtitle = useMemo(() => {
        if (!isCaptionsOn) return null;
        if (parsedSubtitles.length === 0) return null;
        const match = parsedSubtitles.find(cue => currentTime >= cue.start && currentTime <= cue.end);
        return match ? match.text : null;
    }, [isCaptionsOn, parsedSubtitles, currentTime]);

    // ── SKIP TO NEXT LOGIC (LESSON -> NEXT LESSON -> NEXT COURSE -> NEXT QUEUE ITEM) ──
    const handleSkipNext = () => {
        if (isLessonViewActive) {
            const courseLessons = currentCourseData?.lessons || [];
            const currIdx = courseLessons.findIndex((l: any) => {
                const lId = l.id || l.lessonId || l.lesson?.id;
                return lId === selectedLessonId;
            });

            if (currIdx !== -1 && currIdx < courseLessons.length - 1) {
                const nextLesson = courseLessons[currIdx + 1];
                const nextId = nextLesson.id || nextLesson.lessonId || nextLesson.lesson?.id;
                setSelectedLessonId(nextId);
                return;
            }

            const currentCourseIdx = coursesInReview.findIndex((c: any) => c.id == currentCourseData?.id);
            if (currentCourseIdx !== -1 && currentCourseIdx < coursesInReview.length - 1) {
                const nextCourse = coursesInReview[currentCourseIdx + 1];
                const nextLessons = nextCourse.lessons || [];
                if (nextLessons.length > 0) {
                    const firstLId = nextLessons[0].id || nextLessons[0].lessonId || nextLessons[0].lesson?.id;
                    setSelectedLessonId(firstLId);
                } else {
                    setSelectedLessonId(nextCourse.id);
                }
                return;
            }
        }

        if (isCareerPathSelected) {
            if (coursesInReview.length > 0) {
                const firstCourse = coursesInReview[0];
                const firstLessons = firstCourse.lessons || [];
                if (firstLessons.length > 0) {
                    const firstLId = firstLessons[0].id || firstLessons[0].lessonId || firstLessons[0].lesson?.id;
                    setSelectedLessonId(firstLId);
                } else {
                    setSelectedLessonId(firstCourse.id);
                }
                return;
            }
        }

        if (isCourseViewActive) {
            const courseLessons = currentCourseData?.lessons || [];
            if (courseLessons.length > 0 && selectedLessonId === "course-info") {
                const firstLId = courseLessons[0].id || courseLessons[0].lessonId || courseLessons[0].lesson?.id;
                setSelectedLessonId(firstLId);
                return;
            }

            const currentCourseIdx = coursesInReview.findIndex((c: any) => c.id == currentCourseData?.id);
            if (currentCourseIdx !== -1 && currentCourseIdx < coursesInReview.length - 1) {
                setSelectedLessonId(coursesInReview[currentCourseIdx + 1].id);
                return;
            }
        }

        // End of entity / Single Lesson Review -> Go to next review item in queue!
        const queueList: any[] = [];
        if (queueList && queueList.length > 0) {
            const currQueueIdx = queueList.findIndex((item: any) => (item.id === entityId || item.entityId === entityId));
            if (currQueueIdx !== -1 && currQueueIdx < queueList.length - 1) {
                const nextItem = queueList[currQueueIdx + 1];
                const nextTargetId = nextItem.entityId || nextItem.id || nextItem.courseId || nextItem.careerPathId || nextItem.lessonId;
                const nextTargetType = nextItem.entityType || nextItem.type || "course";
                navigate(`/sme-review?id=${nextTargetId}&type=${nextTargetType}&viewOnly=false`);
                return;
            }
        }

        navigate("/sme/queue");
    };

    const handlePrevLesson = () => {
        if (activeLessonIndex > 0) {
            const prev = allFlattenedLessons[activeLessonIndex - 1];
            setSelectedLessonId(prev.id || prev.lessonId);
        }
    };

    const handleAddComment = () => {
        if (!commentDraft.trim()) return;

        const targetLessonId = isLessonViewActive ? activeLId : undefined;
        const targetCourseId = currentCourseData?.id || (isCourseEntity ? entityId : undefined);
        const targetCareerPathId = isCareerPathEntity ? entityId : undefined;
        const targetTitle = isLessonViewActive ? activeLessonData?.title : (isCourseViewActive ? currentCourseData?.title : entityTitle);

        const draftText = commentDraft.trim();
        const newComment = {
            id: `local-${Date.now()}`,
            commentId: `local-${Date.now()}`,
            entityId: targetLessonId || targetCourseId || entityId,
            lessonRef: targetTitle,
            type: commentKind,
            timeTag: isLessonViewActive ? `Lesson ${activeLessonIndex + 1}` : "Course",
            message: draftText,
            authorName: reviewer.name,
            postedAgo: "Just now",
            pinned: false,
            resolved: false,
            replies: []
        };

        setLocalComments(prev => [newComment, ...prev]);
        setCommentDraft("");

        submitCommentMutation.mutate({
            comment: `[${commentKind}] ${draftText}`,
            message: `[${commentKind}] ${draftText}`,
            type: commentKind,
            lessonId: targetLessonId,
            courseId: targetCourseId,
            careerPathId: targetCareerPathId,
            entityType: isCareerPathEntity ? "career-path" : (isLessonEntity ? "lesson" : "course"),
            entityId: entityId,
        } as any);
    };

    const { mutate: resolveItems } = useResolveWorkflow();

    const handleResolveComment = async (commentId: string) => {
        resolveItems({
            reviewId: entityId || "",
            items: [{ itemId: commentId }]
        }, {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ["review-comments"] });
            }
        });
        setLocalComments(prev => prev.map(c => (c.id == commentId || c.commentId === commentId) ? { ...c, resolved: true, type: "Resolved" } : c));
    };

    const handleSendReply = async (commentId: string) => {
        if (!replyDraft.trim()) return;
        const replyText = replyDraft.trim();

        try {
            await replyReviewCommentApi(commentId, replyText);
            queryClient.invalidateQueries({ queryKey: ["review-comments"] });
        } catch (e) {
            console.warn("Could not submit reply via API:", e);
        }

        setLocalComments(prev => prev.map(c => {
            if (c.id == commentId || c.commentId === commentId) {
                return {
                    ...c,
                    replies: [
                        ...(c.replies || []),
                        {
                            id: `rep-${Date.now()}`,
                            message: replyText,
                            authorName: reviewer.name,
                            postedAgo: "Just now"
                        }
                    ]
                };
            }
            return c;
        }));

        setReplyDraft("");
        setReplyingToCommentId(null);
    };

    const handleDownloadFile = (url: string, filename: string) => {
        if (!url) {
            alert("File URL not available for download.");
            return;
        }
        const a = document.createElement("a");
        a.href = url;
        a.download = filename || "attachment";
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    // Opens approve confirmation modal
    const handleApprovePublish = () => {
        if (isApprovalGated || approveMutation.isPending) return;
        setShowApproveModal(true);
    };

    // Actually executes approval after modal confirm
    const handleConfirmApprove = () => {
        approveMutation.mutate(
            {
                entityType: isCareerPathEntity ? "career-path" : (isLessonEntity ? "lesson" : "course"),
                entityId: entityId,
                payload: {
                    comment: comments.length > 0
                        ? comments.map(c => `[${c.type}] ${c.message}`).join(" | ")
                        : "Approved & Published by Subject Matter Expert"
                }
            },
            {
                onSuccess: () => {
                    setShowApproveModal(false);
                    navigate("/sme/queue");
                },
                onError: (err: any) => {
                    setShowApproveModal(false);
                    alert(err?.response?.data?.message || "Failed to approve content.");
                }
            }
        );
    };

    // Reject directly using existing page comments — no modal needed
    const handleRejectReturn = () => {
        if (rejectMutation.isPending) return;
        if (comments.length === 0) {
            setRejectNoCommentError(true);
            setTimeout(() => setRejectNoCommentError(false), 4000);
            return;
        }
        setRejectNoCommentError(false);
        const mappedItems = comments.map(c => ({
            issueDescription: `[${c.type}] ${c.message}`,
            elementId: c.entityId && c.entityId !== entityId ? c.entityId : undefined
        }));
        rejectMutation.mutate(
            {
                entityType: isCareerPathEntity ? "career-path" : (isLessonEntity ? "lesson" : "course"),
                entityId: entityId,
                payload: { items: mappedItems }
            },
            {
                onSuccess: () => navigate("/sme/queue"),
                onError: (err: any) => {
                    alert(err?.response?.data?.message || "Failed to request changes.");
                }
            }
        );
    };

    const formatTime = (seconds: number) => {
        if (isNaN(seconds) || seconds === null) return "00:00";
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        const pad = (n: number) => String(n).padStart(2, "0");
        return `${pad(m)}:${pad(s)}`;
    };

    // Loading state
    if (isLoadingReview || (isCourseEntity && (isLoadingCourse || isLoadingLessons)) || (isLessonEntity && isLoadingSingleLesson) || isLoadingComments) {
        return <LoadingSkeleton />;
    }

    const activeVideoUrl = videoHasError ? "" : (fetchedVideoSrc || "");

    const renderCommentsSection = (titleContext: string) => (
        <div className="rounded-[var(--r-md)] border border-[var(--line)] bg-white shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)] p-5 sm:p-6 space-y-5">
            {/* Comments Header */}
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-baseline gap-2">
                    <h2 className="text-[16px] font-bold text-[var(--ink)]">Comments</h2>
                    <span className="text-[12px] text-[var(--ink-mute)]">
                        {scopedComments.filter(c => !c.resolved).length} open · {scopedComments.filter(c => c.resolved).length} resolved
                    </span>
                </div>

                <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-[12px] font-bold">
                    {titleContext}
                </span>
            </div>

            {/* Responsive Comments Cards Grid */}
            {scopedComments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {scopedComments.map((c) => {
                        const isResolved = c.resolved || c.type === "Resolved";
                        const isRequired = c.type === "Required" && !isResolved;

                        return (
                            <div
                                key={c.id}
                                className={`
                                    rounded-lg p-4 flex flex-col justify-between transition-all duration-200 bg-white hover:shadow-[var(--shadow-xs)]
                                    ${isRequired
                                        ? "border-l-4 border-l-[#c86d5e] border border-[var(--line)]"
                                        : isResolved
                                            ? "border-l-4 border-l-[#748f65] border border-[var(--line)]"
                                            : "border border-[var(--line)]"
                                    }
                                `}
                            >
                                <div>
                                    {/* Comment Top Badges */}
                                    <div className="flex items-center justify-between mb-2">
                                        <span
                                            className={`
                                                px-2.5 py-0.5 rounded-full text-[12px] font-bold uppercase tracking-wide
                                                ${isRequired
                                                    ? "bg-red-50 text-[#c86d5e] border border-red-200"
                                                    : isResolved
                                                        ? "bg-[#748f65]/10 text-[#748f65] border border-[#748f65]/30"
                                                        : "bg-[var(--paper-2)] text-[var(--ink-mute)] border border-[var(--line)]"
                                                }
                                            `}
                                        >
                                            {c.type}
                                        </span>
                                        <span className="text-[12px] text-[var(--ink-soft)]">
                                            {c.timeTag}
                                        </span>
                                    </div>

                                    {/* Message */}
                                    <p className="text-[14px] font-medium text-[var(--ink)] leading-relaxed mb-2">
                                        &ldquo;{c.message}&rdquo;
                                    </p>

                                    {/* Author */}
                                    <p className="text-[12px] text-[var(--ink-soft)] mb-3">
                                        {c.authorName} · {c.postedAgo} {c.pinned && "· pinned"}
                                    </p>

                                    {/* Replies */}
                                    {c.replies && c.replies.length > 0 && (
                                        <div className="space-y-2 mb-3">
                                            {c.replies.map((rep: any) => (
                                                <div key={rep.id} className="bg-[var(--paper-2)] border border-[var(--line)] rounded-md p-3 space-y-1">
                                                    <p className="text-[12px] font-medium text-[var(--ink)]">
                                                        {rep.message}
                                                    </p>
                                                    <p className="text-[12px] text-[var(--ink-soft)]">
                                                        {rep.authorName} · {rep.postedAgo}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                </div>
                                {!isResolved && (
                                    <div className="mt-3 pt-3 border-t border-[var(--line)] flex justify-end">
                                        <button
                                            onClick={() => handleResolveComment(c.id)}
                                            className="px-3 py-1.5 rounded-md text-[13px] font-medium text-white bg-[#748f65] hover:bg-[#607a51] transition-colors"
                                        >
                                            Mark as Resolved
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="p-6 text-center border border-dashed border-[var(--line)] rounded-lg text-[var(--ink-soft)] text-[14px]">
                    No comments posted yet for this section.
                </div>
            )}

            {/* Add Comment Composer */}
            {!isViewOnly && (
                <div className="pt-2 space-y-3">
                    <div className="w-full">
                        <select
                            value={commentKind}
                            onChange={(e) => setCommentKind(e.target.value as any)}
                            className="w-full px-3 py-2 border border-[var(--line)] rounded-lg text-[14px] font-medium text-[var(--ink)] bg-[var(--paper-2)] focus:outline-none focus:border-amber-500 cursor-pointer"
                        >
                            <option value="Suggestion">Suggestion</option>
                            <option value="Required">Required</option>
                        </select>
                    </div>

                    <textarea
                        value={commentDraft}
                        onChange={(e) => setCommentDraft(e.target.value)}
                        placeholder="Add a comment..."
                        className="w-full h-24 p-3 rounded-lg border border-[var(--line)] bg-[var(--paper-2)] focus:bg-white text-[14px] text-[var(--ink)] placeholder:text-[var(--ink-soft)] resize-none focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                    />

                    <button
                        onClick={handleAddComment}
                        className="w-full py-2.5 px-6 rounded-full bg-amber-300 hover:bg-amber-400 text-black font-bold text-[14px] transition-all shadow-[var(--shadow-xs)] cursor-pointer flex items-center justify-center gap-1"
                    >
                        + Add comment
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <>
        <div className="min-h-screen bg-white text-[var(--ink)] font-sans flex flex-col selection:bg-amber-100 selection:text-amber-900">

            {/* ── TOP HEADER / ACTION BAR WITH APPROVE / REJECT ACTIONS ── */}
            <header className="relative bg-white/95 backdrop-blur flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center flex-wrap sm:flex-nowrap gap-2 sm:gap-4 min-w-0 flex-1">
                    <button
                        onClick={() => { if (window.history.state && window.history.state.idx > 0) { navigate(-1); } else { navigate(isSMERole ? "/sme/queue" : "/review-queue"); } }}
                        className="flex items-center gap-1.5 text-[12px] font-bold text-[var(--ink-mute)] hover:text-[var(--ink)] transition-colors shrink-0 cursor-pointer"
                    >
                        <ChevronLeft className="w-4 h-4 text-[var(--ink-soft)]" />
                        <span className="hidden sm:inline">Back to queue</span>
                        <span className="sm:hidden">Back</span>
                    </button>

                    <div className="h-4 w-px bg-gray-200 shrink-0 hidden sm:block" />

                    {/* Reviewing Entity Title and Submitter Info */}
                    <div className="flex items-center gap-2 min-w-0 overflow-hidden w-full sm:w-auto order-last sm:order-none mt-1 sm:mt-0">
                        <span className="text-[14px] font-bold text-[var(--ink)] truncate">
                            Reviewing: {entityTitle}
                        </span>
                        <span className="text-[12px] text-[var(--ink-mute)] hidden md:inline truncate">
                            Submitted by {submitterName} {submittedDate ? `· ${submittedDate}` : ""}{waitDays > 0 ? ` · ${waitDays}d ago` : ""}
                        </span>
                    </div>

                    {/* Status badge pill */}
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[12px] font-bold shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        <span>{normalizeWorkflowStatus(currentStatus).replace(/_/g, " ")}</span>
                    </div>
                </div>

                {/* Right Header Actions */}
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    {/* Skip next button */}
                    <button
                        onClick={handleSkipNext}
                        className="flex items-center gap-1 text-[12px] font-bold text-[var(--ink)] hover:text-black transition-colors cursor-pointer px-3 py-1.5 rounded-md hover:bg-[var(--paper-2)] border border-[var(--line)]"
                        title="Skip to next item in queue or next lesson"
                    >
                        <span className="hidden sm:inline">Skip to next</span>
                        <span className="sm:hidden">Skip</span>
                        <ChevronRight className="w-4 h-4 text-[var(--ink-soft)]" />
                    </button>

                    {/* Mobile outline drawer toggle */}
                    <button
                        onClick={() => setIsMobileOutlineOpen(prev => !prev)}
                        className="lg:hidden p-2 rounded-md border border-[var(--line)] hover:bg-[var(--paper-2)] text-[var(--ink-mute)]"
                        aria-label="Toggle Outline"
                    >
                        {isMobileOutlineOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                    </button>
                </div>
            </header>

            {/* ── MAIN WORKSPACE: TWO COLUMN LAYOUT ── */}
            <div className="flex-1  w-full mx-auto flex flex-col lg:flex-row gap-6 items-start">

                {/* ── LEFT COLUMN: REVIEW OUTLINE CARD (HIERARCHICAL STRUCTURE) ── */}
                <aside
                    className={`
                        w-full lg:w-[310px] xl:w-[330px] shrink-0
                        ${isMobileOutlineOpen ? "block" : "hidden lg:block"}
                    `}
                >
                    <div className="rounded-[var(--r-md)] border border-[var(--line)] bg-white shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)] p-4 sm:p-5 sticky top-[76px] max-h-[calc(100vh-96px)] flex flex-col">

                        {/* Outline Card Header */}
                        <div className="pb-3 border-b border-[var(--line)]">
                            <h2 className="text-[16px] font-bold text-[var(--ink)] tracking-tight">Review outline</h2>
                            <p className="text-[12px] text-[var(--ink-mute)] mt-0.5">
                                {isCareerPathEntity
                                    ? `1 career path · ${coursesInReview.length} course${coursesInReview.length !== 1 ? "s" : ""} · ${allFlattenedLessons.length} lesson${allFlattenedLessons.length !== 1 ? "s" : ""}`
                                    : isLessonEntity
                                        ? `1 lesson review`
                                        : `1 course · ${allFlattenedLessons.length} lesson${allFlattenedLessons.length !== 1 ? "s" : ""}`
                                }
                            </p>
                        </div>

                        {/* Hierarchical Tree Body */}
                        <nav className="flex-1 overflow-y-auto pt-3 space-y-1 pr-1 custom-scrollbar">

                            {/* Case A: Single Lesson Review Direct Outline Node */}
                            {isLessonEntity && (
                                <div>
                                    <button
                                        onClick={() => setSelectedLessonId(entityId)}
                                        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-amber-50 text-[var(--ink)] border-l-4 border-l-amber-400 font-bold transition-all text-[12px] cursor-pointer"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                                            <span className="truncate">
                                                {rawSingleLesson?.title || rawSingleLesson?.name || "Lesson Review"}
                                            </span>
                                        </div>
                                        <span className="bg-amber-200 text-amber-900 font-bold text-[12px] px-2 py-0.5 rounded tracking-wide uppercase shrink-0">
                                            LESSON
                                        </span>
                                    </button>
                                </div>
                            )}

                            {/* Case B: Career Path Node */}
                            {isCareerPathEntity && (
                                <div>
                                    <div
                                        onClick={() => setSelectedLessonId("career-path")}
                                        className={`
                                            group flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg transition-all duration-200 cursor-pointer
                                            ${isCareerPathSelected ? "bg-amber-50 text-[var(--ink)] font-bold border-l-4 border-l-amber-400" : "hover:bg-[var(--paper-2)]"}
                                        `}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                                            <span className="text-[12px] font-bold text-[var(--ink)] truncate">
                                                {rawCareerPath?.title || rawCareerPath?.name || "Career Path"}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <span className="bg-[#748f65]/15 text-[#748f65] font-bold text-[12px] px-1.5 py-0.5 rounded tracking-wide uppercase">
                                                PATH
                                            </span>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setIsCareerPathExpanded(!isCareerPathExpanded);
                                                }}
                                                className="p-1 text-[var(--ink-soft)] hover:text-[var(--ink)]"
                                            >
                                                {isCareerPathExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Case C: Courses & Nested Lessons (For Course and CareerPath Reviews) */}
                            {!isLessonEntity && (
                                <div className={`${isCareerPathEntity && isCareerPathExpanded ? "pl-3 space-y-1 mt-1" : "space-y-1"}`}>
                                    {coursesInReview.map((course: any) => {
                                        const isExpanded = expandedCourseMap[course.id] ?? true;
                                        const courseLessons = course.lessons || [];
                                        const isThisCourseSelected = isCourseViewActive && (selectedLessonId === course.id || selectedLessonId === "course-info");

                                        return (
                                            <div key={course.id}>
                                                {/* Course Row Header */}
                                                <div
                                                    onClick={() => setSelectedLessonId(course.id)}
                                                    className={`
                                                        group flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg transition-all duration-200 cursor-pointer
                                                        ${isThisCourseSelected ? "bg-amber-50 text-[var(--ink)] font-bold border-l-4 border-l-amber-400" : "hover:bg-[var(--paper-2)]"}
                                                    `}
                                                >
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <span className={`w-2 h-2 rounded-full shrink-0 ${course.status === "APPROVED" || course.status === "COMPLETED" ? "bg-[#748f65]" : "bg-amber-500"}`} />
                                                        <span className="text-[12px] font-bold text-[var(--ink)] truncate">
                                                            {course.title}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        <span className="bg-amber-100 text-amber-800 font-bold text-[12px] px-1.5 py-0.5 rounded tracking-wide uppercase">
                                                            COURSE
                                                        </span>
                                                        {courseLessons.length > 0 && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setExpandedCourseMap(prev => ({ ...prev, [course.id]: !isExpanded }));
                                                                }}
                                                                className="p-1 text-[var(--ink-soft)] hover:text-[var(--ink)]"
                                                            >
                                                                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "" : "-rotate-90"}`} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Nested Lessons under Course */}
                                                {isExpanded && courseLessons.length > 0 && (
                                                    <div className="pl-4 space-y-0.5 mt-0.5 border-l border-[var(--line)] ml-3">
                                                        {courseLessons.map((item: any, lIdx: number) => {
                                                            const lData = item.lesson || item;
                                                            const lId = item.id || item.lessonId || lData.id;
                                                            const isSelected = (selectedLessonId === lId);
                                                            const dotClass = getLessonDotClass(lId);

                                                            return (
                                                                <button
                                                                    key={lId || lIdx}
                                                                    onClick={() => {
                                                                        setSelectedLessonId(lId);
                                                                        setIsMobileOutlineOpen(false);
                                                                    }}
                                                                    className={`
                                                                        w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-left transition-all duration-200 text-[12px] cursor-pointer
                                                                        ${isSelected
                                                                            ? "bg-amber-50 text-[var(--ink)] font-bold border-l-4 border-l-amber-400"
                                                                            : "text-[var(--ink-mute)] hover:text-[var(--ink)] hover:bg-[var(--paper-2)]"
                                                                        }
                                                                    `}
                                                                >
                                                                    <span className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`} />
                                                                    <span className="truncate leading-tight">
                                                                        {lIdx + 1}. {lData.title || lData.name || `Lesson ${lIdx + 1}`}
                                                                    </span>
                                                                </button>
                                                            );
                                                        })}

                                                        {/* Assessment under Course */}
                                                        {quizzes.length > 0 && (
                                                            <button
                                                                onClick={() => setSelectedLessonId("assessment-node")}
                                                                className={`
                                                                    w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-left transition-all duration-200 text-[12px] cursor-pointer
                                                                    ${selectedLessonId === "assessment-node"
                                                                        ? "bg-amber-50 text-[var(--ink)] font-bold border-l-4 border-l-amber-400"
                                                                        : "text-[var(--ink-mute)] hover:text-[var(--ink)] hover:bg-[var(--paper-2)]"
                                                                    }
                                                                `}
                                                            >
                                                                <span className="w-2 h-2 rounded-full bg-[#c86d5e] shrink-0" />
                                                                <span className="truncate">
                                                                    {(() => {
                                                                        const qCount = quizzes.reduce((sum: number, q: any) => sum + ((q.quizQuestions || q.questions)?.length || 0), 0);
                                                                        return `Assessment (${qCount} question${qCount !== 1 ? "s" : ""})`;
                                                                    })()}
                                                                </span>
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </nav>
                    </div>
                </aside>

                {/* ── RIGHT COLUMN: DYNAMIC WORKSPACE (GUARANTEED TO NEVER BE BLANK) ── */}
                <main className="flex-1 min-w-0 flex flex-col gap-6 w-full">

                    {/* ════════════════════════════════════════════════════════════════════════
                        VIEW 1: LESSON REVIEW VIEW (ACTIVE FOR LESSON REVIEW OR CLICKED LESSON)
                    ════════════════════════════════════════════════════════════════════════ */}
                    {isLessonViewActive && (
                        <>
                            {/* ── CARD 1: VIDEO PLAYER & ABOUT LESSON ── */}
                            <div className="rounded-[var(--r-md)] border border-[var(--line)] bg-white shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)] overflow-hidden">

                                {/* Lesson Basic Info (Inline, No Divider) */}
                                <div className="p-5 sm:p-6 pb-2 flex flex-wrap items-center gap-2.5">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full border border-[var(--line)] text-[12px] font-bold text-[var(--ink)] bg-[var(--paper-2)]">
                                        Lesson {activeLessonIndex !== -1 ? activeLessonIndex + 1 : 1} of {allFlattenedLessons.length || 1}
                                    </span>
                                    <h1 className="text-[16px] sm:text-[16px] font-bold text-[var(--ink)]">
                                        {activeLessonData?.title || activeLessonData?.name || entityTitle}
                                    </h1>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full border border-[var(--line)] text-[12px] font-medium text-[var(--ink-mute)] bg-[var(--paper-2)]">
                                        {activeLessonData?.lessonType || activeLessonData?.contentType || "Video"}
                                    </span>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full border border-[var(--line)] text-[12px] font-medium text-[var(--ink-mute)] bg-[var(--paper-2)]">
                                        {activeLessonData?.duration || 45} min
                                    </span>
                                </div>

                                {/* Video Surface (16:9 Canvas with Reliable HTML5 Playback + Real SRT Subtitles) */}
                                <div className="px-5 sm:px-6 pt-4">
                                    <div className="w-full bg-[#111111] aspect-video rounded-lg overflow-hidden relative flex items-center justify-center shadow-inner group">
                                        <video
                                            ref={videoRef}
                                            src={activeVideoUrl || undefined}
                                            className="w-full h-full object-contain cursor-pointer"
                                            onClick={handlePlayPauseToggle}
                                            onTimeUpdate={handleVideoTimeUpdate}
                                            onLoadedMetadata={handleVideoLoadedMetadata}
                                            onError={() => {
                                                console.warn("Video failed to play source or is missing.");
                                                setVideoHasError(true);
                                            }}
                                            onPlay={() => setIsPlaying(true)}
                                            onPause={() => setIsPlaying(false)}
                                            muted={isMuted}
                                            playsInline
                                            preload="metadata"
                                        />

                                        {/* Center Signature Yellow Play Button (Visible when paused) */}
                                        {!isPlaying && (
                                            <button
                                                onClick={handlePlayPauseToggle}
                                                className="absolute w-[64px] h-[64px] rounded-full bg-[#f4ed9c] hover:bg-[#fae86a] text-black shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-110 cursor-pointer z-20"
                                                aria-label="Play video"
                                            >
                                                <Play className="w-7 h-7 text-black ml-1 fill-black" />
                                            </button>
                                        )}

                                        {/* Active Captions Overlay (from ACTUAL parsed SRT cues) */}
                                        {isCaptionsOn && currentSubtitle && (
                                            <div className={`absolute bottom-12 left-1/2 -translate-x-1/2 bg-black/85 backdrop-blur-sm ${captionColor} font-medium ${captionFontSize} px-4 py-2 rounded-lg shadow-xl text-center max-w-[85%] z-20 pointer-events-none transition-all border border-white/10`}>
                                                {currentSubtitle}
                                            </div>
                                        )}

                                        {/* Bottom-left overlay info */}
                                        <div className="absolute bottom-2.5 left-3.5 text-white/80 text-[12px] tracking-wide z-10 drop-shadow">
                                            Lesson {activeLessonIndex !== -1 ? activeLessonIndex + 1 : 1} · {activeLessonData?.title || activeLessonData?.name || "Lesson"} · {formatTime(currentTime)} / {formatTime(duration)}
                                        </div>
                                    </div>

                                    {/* Progress Scrubber Bar */}
                                    <div
                                        onClick={(e) => {
                                            if (!duration || !videoRef.current) return;
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            const clickPos = (e.clientX - rect.left) / rect.width;
                                            const targetTime = clickPos * duration;
                                            videoRef.current.currentTime = targetTime;
                                            setCurrentTime(targetTime);
                                        }}
                                        className="h-[5px] bg-gray-200 w-full mt-3 cursor-pointer relative rounded-full overflow-hidden hover:h-[7px] transition-all"
                                    >
                                        <div
                                            className="h-full bg-amber-500 transition-all"
                                            style={{ width: `${Math.min(100, (currentTime / (duration || 1)) * 100)}%` }}
                                        />
                                    </div>

                                    {/* Player Transport Controls Row */}
                                    <div className="flex items-center justify-between py-3.5 border-b border-[var(--line)] flex-wrap gap-2">
                                        <div className="flex items-center gap-2.5">
                                            <button
                                                onClick={handlePrevLesson}
                                                className="w-8 h-8 rounded-full border border-[var(--line)] flex items-center justify-center text-[var(--ink)] hover:bg-[var(--paper-2)] transition-colors cursor-pointer"
                                                aria-label="Previous lesson"
                                                title="Previous lesson"
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                            </button>

                                            <button
                                                onClick={handlePlayPauseToggle}
                                                className="w-10 h-10 rounded-full bg-gray-900 text-[#f4ed9c] hover:bg-black flex items-center justify-center shadow transition-transform hover:scale-105 cursor-pointer"
                                                aria-label={isPlaying ? "Pause" : "Play"}
                                            >
                                                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5 fill-[#f4ed9c]" />}
                                            </button>

                                            <button
                                                onClick={handleSkipNext}
                                                className="w-8 h-8 rounded-full border border-[var(--line)] flex items-center justify-center text-[var(--ink)] hover:bg-[var(--paper-2)] transition-colors cursor-pointer"
                                                aria-label="Next lesson"
                                                title="Next lesson"
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-3 text-[12px] text-[var(--ink-mute)] relative">
                                            <span className="font-mono text-[12px] font-medium mr-1">{formatTime(currentTime)} / {formatTime(duration)}</span>

                                            {/* Captions ON/OFF Toggle & Settings */}
                                            <div className="flex items-center">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsCaptionsOn(prev => !prev)}
                                                    className={`
                                                        px-2.5 py-1 rounded-l-md text-[12px] font-bold transition-all cursor-pointer border
                                                        ${isCaptionsOn
                                                            ? "bg-amber-400 text-black border-amber-500 hover:bg-amber-300"
                                                            : "bg-[var(--paper-2)] text-[var(--ink-mute)] border-[var(--line-strong)] hover:bg-gray-200"
                                                        }
                                                    `}
                                                    title={isCaptionsOn ? "Turn Captions OFF" : "Turn Captions ON"}
                                                >
                                                    {isCaptionsOn ? "CC ON" : "CC OFF"}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowCaptionSettings(!showCaptionSettings)}
                                                    className="px-2 py-1 bg-white border-y border-r border-[var(--line-strong)] rounded-r-md hover:bg-[var(--paper-2)] text-[var(--ink-mute)] cursor-pointer transition-colors"
                                                    title="Caption Settings"
                                                >
                                                    <Settings className="w-4 h-4" />
                                                </button>
                                            </div>

                                            {/* Caption Settings Popover */}
                                            {showCaptionSettings && (
                                                <div className="absolute bottom-full right-16 mb-2 bg-white border border-[var(--line)] rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-4 w-64 z-50">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h4 className="text-[14px] font-bold text-[var(--ink)]">Caption Settings</h4>
                                                        <button onClick={() => setShowCaptionSettings(false)} className="text-[var(--ink-soft)] hover:text-[var(--ink-mute)] cursor-pointer">
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                                                        </button>
                                                    </div>
                                                    
                                                    <div className="space-y-4">
                                                        <div>
                                                            <p className="text-[12px] font-bold text-[var(--ink-mute)] uppercase tracking-wider mb-2">Size</p>
                                                            <div className="flex gap-2">
                                                                {['text-[12px]', 'text-[14px]', 'text-[16px]', 'text-[16px]'].map(size => (
                                                                    <button
                                                                        key={size}
                                                                        onClick={() => setCaptionFontSize(size)}
                                                                        className={`flex-1 py-1 text-center rounded border ${captionFontSize === size ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-[var(--paper-2)] border-[var(--line)] text-[var(--ink-mute)] hover:bg-[var(--paper-2)]'} cursor-pointer transition-colors`}
                                                                    >
                                                                        A
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <p className="text-[12px] font-bold text-[var(--ink-mute)] uppercase tracking-wider mb-2">Color</p>
                                                            <div className="flex gap-2">
                                                                {[
                                                                    { val: 'text-white', bg: 'bg-white', label: 'White' },
                                                                    { val: 'text-yellow-400', bg: 'bg-yellow-400', label: 'Yellow' },
                                                                    { val: 'text-cyan-400', bg: 'bg-cyan-400', label: 'Cyan' }
                                                                ].map(color => (
                                                                    <button
                                                                        key={color.val}
                                                                        onClick={() => setCaptionColor(color.val)}
                                                                        className={`w-8 h-8 rounded-full border-2 ${captionColor === color.val ? 'border-blue-500' : 'border-[var(--line)] hover:border-[var(--line-strong)]'} ${color.bg} cursor-pointer transition-colors`}
                                                                        title={color.label}
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Playback Speed Toggle */}
                                            <button
                                                onClick={handleSpeedToggle}
                                                className="px-2.5 py-1 rounded-md border border-[var(--line)] text-[12px] font-bold text-[var(--ink)] hover:bg-[var(--paper-2)] transition-colors cursor-pointer"
                                                title="Cycle playback speed"
                                            >
                                                {playbackRate}x
                                            </button>

                                            {/* Fullscreen Button */}
                                            <button
                                                onClick={handleFullscreen}
                                                className="p-1.5 rounded-md border border-[var(--line)] hover:bg-[var(--paper-2)] text-[var(--ink-mute)] cursor-pointer transition-colors"
                                                title="Toggle fullscreen"
                                            >
                                                <Maximize2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* About This Lesson Section */}
                                <div className="p-5 sm:p-6 space-y-4">
                                    <div>
                                        <h3 className="text-[14px] font-bold text-[var(--ink)] mb-1.5">
                                            About this lesson
                                        </h3>
                                        <p className="text-[14px] leading-relaxed text-[var(--ink-mute)]">
                                            {activeLessonData?.description || activeLessonData?.shortDescription || "No description provided."}
                                        </p>
                                    </div>

                                    {/* ── ACTUAL DOWNLOADABLE ATTACHMENTS ── */}
                                    <div>
                                        <p className="text-[12px] font-bold text-[var(--ink)] mb-2">Lesson Attachments</p>
                                        {resolvedAttachments.length > 0 ? (
                                            <div className="space-y-2">
                                                {resolvedAttachments.map((doc: any, i: number) => {
                                                    const docUrl = doc.signedUrl || doc.url || doc.fileUrl;
                                                    const docName = doc.fileName || doc.originalFileName || `attachment-${i + 1}.pdf`;
                                                    const ext = docName.includes(".") ? docName.split(".").pop()?.toUpperCase() || "FILE" : "FILE";
                                                    const sizeBytes = doc.size || doc.fileSize;
                                                    let sizeText = "";
                                                    if (typeof sizeBytes === "number" && sizeBytes > 0) {
                                                        if (sizeBytes < 1024 * 1024) sizeText = `· ${Math.round(sizeBytes / 1024)} KB`;
                                                        else sizeText = `· ${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
                                                    }

                                                    return (
                                                        <div key={doc.id || i} className="flex items-center justify-between rounded-lg bg-[var(--paper-2)] border border-[var(--line)] p-3.5 transition-all duration-200 hover:shadow-[var(--shadow-xs)] hover:border-[var(--line)]">
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <span className="px-2 py-0.5 rounded bg-red-100 text-[#c86d5e] font-bold text-[12px] tracking-wider uppercase shrink-0">
                                                                    {ext}
                                                                </span>
                                                                <span className="text-[14px] font-medium text-[var(--ink)] truncate">
                                                                    {docName} <span className="text-[var(--ink-soft)] font-normal">{sizeText}</span>
                                                                </span>
                                                            </div>
                                                            <button
                                                                onClick={() => handleDownloadFile(docUrl, docName)}
                                                                className="text-[14px] font-bold text-[#748f65] hover:underline shrink-0 ml-4 cursor-pointer"
                                                            >
                                                                Download
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-[12px] text-[var(--ink-soft)] italic">No attachment files uploaded for this lesson.</p>
                                        )}
                                    </div>

                                    {/* ── ACTUAL SRT / TRANSCRIPT FILE & CAPTION SOURCE ── */}
                                    {actualTranscriptUrl && (
                                        <div className="pt-3 border-t border-[var(--line)]">
                                            <p className="text-[12px] font-bold text-[var(--ink)] mb-2">Lesson Transcript (Captions)</p>
                                            <div className="rounded-lg bg-[var(--paper-2)] border border-[var(--line)] overflow-hidden">
                                                <div className="flex items-center justify-between p-3.5">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[12px] tracking-wider uppercase shrink-0">
                                                            {actualTranscriptFileName.includes(".") ? actualTranscriptFileName.split(".").pop()?.toUpperCase() || "SRT" : "SRT"}
                                                        </span>
                                                        <div className="min-w-0">
                                                            <p className="text-[14px] font-medium text-[var(--ink)] truncate">
                                                                {actualTranscriptFileName}
                                                            </p>
                                                            <p className="text-[12px] text-[var(--ink-soft)]">
                                                                {parsedSubtitles.length > 0
                                                                    ? `${parsedSubtitles.length} cues`
                                                                    : (isLoadingTranscript ? "Loading..." : "Transcript available")}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 shrink-0 ml-4">
                                                        {parsedSubtitles.length > 0 && (
                                                            <button
                                                                onClick={() => setTranscriptExpanded(v => !v)}
                                                                className="text-[14px] font-bold text-[#748f65] hover:underline cursor-pointer"
                                                            >
                                                                {transcriptExpanded ? "Collapse" : "Expand"}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                {transcriptExpanded && parsedSubtitles.length > 0 && (
                                                    <div className="border-t border-[var(--line)] max-h-72 overflow-y-auto p-3 space-y-1.5 bg-white">
                                                        {parsedSubtitles.map((cue, idx) => {
                                                            const m = Math.floor(cue.start / 60);
                                                            const sec = Math.floor(cue.start % 60);
                                                            const ts = `${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
                                                            return (
                                                                <div key={idx} className="flex gap-2 text-[12px] leading-relaxed">
                                                                    <span className="text-[var(--ink-soft)] shrink-0 font-mono w-[60px]">{ts}</span>
                                                                    <span className="text-[var(--ink)]">{cue.text}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* ── LESSON BASIC DETAILS ── */}
                                    <div className="pt-6 border-t border-[var(--line)]">
                                        {(() => {
    const categoryName = activeLessonData?.category?.name || activeLessonData?.category || categories?.find((c: any) => c.id == (activeLessonData?.categoryId || activeLessonData?.category_id))?.name || "-";
    const subjectName = activeLessonData?.subject?.name || activeLessonData?.subject || subjects?.find((s: any) => s.id == (activeLessonData?.subjectId || activeLessonData?.subject_id))?.name || "-";
    
    let parsedOutcomes: any[] = [];
    const rawLessonOutcome = ((activeLessonData?.learningOutcomes || activeLessonData?.learningOutcome) || activeLessonData?.learning_outcome) || activeLessonData?.objective;
    if (typeof rawLessonOutcome === 'string') {
        try {
            const parsed = JSON.parse(rawLessonOutcome);
            if (Array.isArray(parsed)) parsedOutcomes = parsed;
            else if (parsed.blocks) parsedOutcomes = parsed.blocks.map((b: any) => b.text || b.data?.text);
            else parsedOutcomes = [rawLessonOutcome];
        } catch(e) {
            parsedOutcomes = [rawLessonOutcome];
        }
    } else if (Array.isArray(rawLessonOutcome)) {
        parsedOutcomes = rawLessonOutcome;
    } else if (rawLessonOutcome) {
        parsedOutcomes = [rawLessonOutcome];
    }
    
    // Split by newlines and flatten
    parsedOutcomes = parsedOutcomes.flatMap(o => typeof o === 'string' ? o.split('\n') : o).filter(Boolean);

    return (
        <div className="flex flex-col space-y-8">
            <div>
                <p className="text-[12px] font-bold tracking-wider text-[var(--ink-soft)] uppercase mb-2">Basic Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-[var(--paper-2)]/80 border border-[var(--line)] rounded-lg p-4 transition-all duration-200 hover:shadow-[var(--shadow-xs)] hover:border-[var(--line)]">
                        <p className="text-[12px] font-bold tracking-wider text-[var(--ink-soft)] uppercase mb-1">Category</p>
                        <p className="text-[14px] font-bold text-[var(--ink)]">{categoryName}</p>
                    </div>
                    <div className="bg-[var(--paper-2)]/80 border border-[var(--line)] rounded-lg p-4 transition-all duration-200 hover:shadow-[var(--shadow-xs)] hover:border-[var(--line)]">
                        <p className="text-[12px] font-bold tracking-wider text-[var(--ink-soft)] uppercase mb-1">Subject</p>
                        <p className="text-[14px] font-bold text-[var(--ink)]">{subjectName}</p>
                    </div>
                    <div className="bg-[var(--paper-2)]/80 border border-[var(--line)] rounded-lg p-4 transition-all duration-200 hover:shadow-[var(--shadow-xs)] hover:border-[var(--line)]">
                        <p className="text-[12px] font-bold tracking-wider text-[var(--ink-soft)] uppercase mb-1">Duration</p>
                        <p className="text-[14px] font-bold text-[var(--ink)]">{activeLessonData?.duration || "-"}</p>
                    </div>
                    <div className="bg-[var(--paper-2)]/80 border border-[var(--line)] rounded-lg p-4 transition-all duration-200 hover:shadow-[var(--shadow-xs)] hover:border-[var(--line)]">
                        <p className="text-[12px] font-bold tracking-wider text-[var(--ink-soft)] uppercase mb-1">Difficulty</p>
                        <p className="text-[14px] font-bold text-[var(--ink)]">{activeLessonData?.difficulty || "-"}</p>
                    </div>
                    <div className="bg-[var(--paper-2)]/80 border border-[var(--line)] rounded-lg p-4 transition-all duration-200 hover:shadow-[var(--shadow-xs)] hover:border-[var(--line)]">
                        <p className="text-[12px] font-bold tracking-wider text-[var(--ink-soft)] uppercase mb-1">Assessment Required</p>
                        <p className="text-[14px] font-bold text-[var(--ink)]">{activeLessonData?.assessmentRequired || activeLessonData?.hasAssessment ? "Yes" : "No"}</p>
                    </div>
                </div>
            </div>

            <div>
                <p className="text-[12px] font-bold tracking-wider text-[var(--ink-soft)] uppercase mb-2">Learning Outcome</p>
                <div className="bg-[#748f65]/10 border border-[#748f65]/20 rounded-lg p-4">
                    {parsedOutcomes.length > 0 ? (
                        <ul className="list-disc pl-4 space-y-1">
                            {parsedOutcomes.map((outcome, idx) => (
                                <li key={idx} className="text-[14px] text-[var(--ink)] leading-relaxed">
                                    {typeof outcome === 'object' ? outcome.value || outcome.text || JSON.stringify(outcome) : outcome}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-[14px] text-[var(--ink)] leading-relaxed">-</p>
                    )}
                </div>
            </div>

        </div>
    );
})()}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div>
                                            <p className="text-[12px] font-bold tracking-wider text-[var(--ink-soft)] uppercase mb-2">Skills</p>
                                            <div className="flex flex-wrap gap-2">
                                                {((activeLessonData?.lesson_skills || activeLessonData?.lesson_skill) || activeLessonData?.skills || []).map((s: any, i: number) => { const skillName = typeof s === "string" ? s : s?.skill?.name || s?.name || skills?.find((sk: any) => sk.id == (s.skillId || s.skill_id))?.name || "Unknown"; return (
                                                    <span key={i} className="px-2.5 py-1 bg-[var(--paper-2)] border border-[var(--line)] rounded-md text-[12px] font-medium text-[var(--ink-mute)]">{skillName}</span>
                                                ); })}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[12px] font-bold tracking-wider text-[var(--ink-soft)] uppercase mb-2">Tags</p>
                                            <div className="flex flex-wrap gap-2">
                                                {((activeLessonData?.lessonTags || activeLessonData?.lesson_tags || activeLessonData?.lesson_tag) || activeLessonData?.tags || []).map((t: any, i: number) => { const tagName = typeof t === "string" ? t : t?.tag?.name || t?.name || tags?.find((tg: any) => tg.id == (t.tagId || t.tag_id))?.name || "Unknown"; return (
                                                    <span key={i} className="px-2.5 py-1 bg-[var(--paper-2)] border border-[var(--line)] rounded-md text-[12px] font-medium text-[var(--ink-mute)]">{tagName}</span>
                                                ); })}
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>

                            {/* ── CARD 2: COMMENTS / SUGGESTIONS ── */}
                            {renderCommentsSection(activeLessonData?.title || entityTitle)}
                        </>
                    )}

                    {/* ════════════════════════════════════════════════════════════════════════
                        VIEW 2: CAREER PATH REVIEW VIEW (WHEN CAREER PATH IS SELECTED)
                    ════════════════════════════════════════════════════════════════════════ */}
                    {isCareerPathSelected && (
                        <div className="space-y-6">
                            <div className="rounded-[var(--r-md)] border border-[var(--line)] bg-white shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)] p-6 sm:p-7 space-y-6">

                                {/* Tags Pill Row */}
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="px-3 py-1 rounded-full border border-[var(--line)] bg-[var(--paper-2)] text-[12px] font-medium text-[var(--ink)]">
                                        Career Path
                                    </span>
                                    {rawCareerPath?.certifications?.map((cert: any, ci: number) => (
                                        <span key={ci} className="px-3 py-1 rounded-full border border-[var(--line)] bg-[var(--paper-2)] text-[12px] font-medium text-[var(--ink)]">
                                            {cert?.name || cert}
                                        </span>
                                    ))}
                                    {(rawCareerPath?.category?.name || rawCareerPath?.category || (rawCareerPath?.categoryId || rawCareerPath?.category_id)) && (
                                        <span className="px-3 py-1 rounded-full border border-[var(--line)] bg-[var(--paper-2)] text-[12px] font-medium text-[var(--ink)]">
                                            {rawCareerPath?.category?.name || rawCareerPath?.category || categories?.find((c: any) => c.id == (rawCareerPath?.categoryId || rawCareerPath?.category_id))?.name}
                                        </span>
                                    )}
                                </div>

                                {/* Title and Subtitle */}
                                <div>
                                    <h1 className="text-[16px] font-bold text-[var(--ink)] tracking-tight">
                                        {rawCareerPath?.title || rawCareerPath?.name || entityTitle}
                                    </h1>
                                    <p className="text-[14px] text-[var(--ink-mute)] mt-1">
                                        Submitted by {submitterName} {submittedDate ? `· ${submittedDate}` : ""} · {waitDays}d wait
                                    </p>
                                </div>

                                {(() => {
    // 1. Resolve Category
    const categoryName = rawCareerPath?.category?.name || rawCareerPath?.category || categories?.find((c: any) => c.id == (rawCareerPath?.categoryId || rawCareerPath?.category_id))?.name || "-";
    
    // 2. Resolve Subjects
    let subjectNames = "-";
    const cpSubjects = rawCareerPath?.careerPathSubjects || rawCareerPath?.careerpath_subjects || rawCareerPath?.careerpath_subject || rawCareerPath?.subjects;
    if (Array.isArray(cpSubjects) && cpSubjects.length > 0) {
        subjectNames = cpSubjects.map((s: any) => {
            const sId = (s.subjectId || s.subject_id) || s.id;
            return s.subject?.name || s.name || subjects?.find((sub: any) => sub.id == sId)?.name || "Unknown";
        }).join(", ");
    } else if ((rawCareerPath?.subjectId || rawCareerPath?.subject_id)) {
        subjectNames = subjects?.find((sub: any) => sub.id == (rawCareerPath?.subjectId || rawCareerPath?.subject_id))?.name || "-";
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-[var(--paper-2)]/80 border border-[var(--line)] rounded-lg p-4 transition-all duration-200 hover:shadow-[var(--shadow-xs)] hover:border-[var(--line)]">
                <p className="text-[12px] font-bold tracking-wider text-[var(--ink-soft)] uppercase mb-1">Category</p>
                <p className="text-[14px] font-bold text-[var(--ink)]">{categoryName}</p>
            </div>
            <div className="bg-[var(--paper-2)]/80 border border-[var(--line)] rounded-lg p-4 transition-all duration-200 hover:shadow-[var(--shadow-xs)] hover:border-[var(--line)]">
                <p className="text-[12px] font-bold tracking-wider text-[var(--ink-soft)] uppercase mb-1">Subject</p>
                <p className="text-[14px] font-bold text-[var(--ink)]">{subjectNames}</p>
            </div>
            <div className="bg-[var(--paper-2)]/80 border border-[var(--line)] rounded-lg p-4 transition-all duration-200 hover:shadow-[var(--shadow-xs)] hover:border-[var(--line)]">
                <p className="text-[12px] font-bold tracking-wider text-[var(--ink-soft)] uppercase mb-1">Difficulty</p>
                <p className="text-[14px] font-bold text-[var(--ink)]">{rawCareerPath?.difficulty || "-"}</p>
            </div>
            <div className="bg-[var(--paper-2)]/80 border border-[var(--line)] rounded-lg p-4 transition-all duration-200 hover:shadow-[var(--shadow-xs)] hover:border-[var(--line)]">
                <p className="text-[12px] font-bold tracking-wider text-[var(--ink-soft)] uppercase mb-1">Estimated Duration</p>
                <p className="text-[14px] font-bold text-[var(--ink)]">{rawCareerPath?.duration || "-"}</p>
            </div>
            <div className="bg-[var(--paper-2)]/80 border border-[var(--line)] rounded-lg p-4 transition-all duration-200 hover:shadow-[var(--shadow-xs)] hover:border-[var(--line)]">
                <p className="text-[12px] font-bold tracking-wider text-[var(--ink-soft)] uppercase mb-1">Visibility</p>
                <p className="text-[14px] font-bold text-[var(--ink)]">{rawCareerPath?.visibility || rawCareerPath?.personaMapping || rawCareerPath?.targetAudience || "-"}</p>
            </div>
        </div>
    );
})()}

                                {/* Learning Outcome */}
                                {(() => {
                                    let parsedOutcomes: any[] = [];
                                    const rawOutcome = ((rawCareerPath?.learningOutcomes || rawCareerPath?.learningOutcome) || rawCareerPath?.learning_outcome) || rawCareerPath?.description;
                                    if (typeof rawOutcome === 'string') {
                                        try {
                                            const parsed = JSON.parse(rawOutcome);
                                            if (Array.isArray(parsed)) parsedOutcomes = parsed;
                                            else if (parsed.blocks) parsedOutcomes = parsed.blocks.map((b: any) => b.text || b.data?.text);
                                            else parsedOutcomes = [rawOutcome];
                                        } catch(e) {
                                            parsedOutcomes = [rawOutcome];
                                        }
                                    } else if (Array.isArray(rawOutcome)) {
                                        parsedOutcomes = rawOutcome;
                                    } else if (rawOutcome) {
                                        parsedOutcomes = [rawOutcome];
                                    }

                                    parsedOutcomes = parsedOutcomes.flatMap(o => typeof o === 'string' ? o.split('\n') : o).filter(Boolean);

                                    return (
                                        <div>
                                            <p className="text-[12px] font-bold tracking-wider text-[var(--ink-soft)] uppercase mb-2">Learning Outcome</p>
                                            <div className="bg-[#748f65]/10 border border-[#748f65]/20 rounded-lg p-4">
                                                {parsedOutcomes.length > 0 ? (
                                                    <ul className="list-disc pl-4 space-y-1">
                                                        {parsedOutcomes.map((outcome, idx) => (
                                                            <li key={idx} className="text-[14px] text-[var(--ink)] leading-relaxed">
                                                                {typeof outcome === 'object' ? outcome.value || outcome.text || JSON.stringify(outcome) : outcome}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className="text-[14px] text-[var(--ink)] leading-relaxed">-</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })()}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                                    <div>
                                        <p className="text-[12px] font-bold tracking-wider text-[var(--ink-soft)] uppercase mb-2">Skills</p>
                                        <div className="flex flex-wrap gap-2">
                                            {((rawCareerPath?.skillTags || rawCareerPath?.careerpath_skills || rawCareerPath?.careerpath_skill) || rawCareerPath?.skills || []).map((s: any, i: number) => { const skillName = typeof s === "string" ? s : s?.skill?.name || s?.name || skills?.find((sk: any) => sk.id == (s.skillId || s.skill_id))?.name || "Unknown"; return (
                                                <span key={i} className="px-2.5 py-1 bg-[var(--paper-2)] border border-[var(--line)] rounded-md text-[12px] font-medium text-[var(--ink-mute)]">{skillName}</span>
                                            ); })}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[12px] font-bold tracking-wider text-[var(--ink-soft)] uppercase mb-2">Tags</p>
                                        <div className="flex flex-wrap gap-2">
                                            {((rawCareerPath?.careerPathTags || rawCareerPath?.careerpath_tags || rawCareerPath?.careerpath_tag) || rawCareerPath?.tags || []).map((t: any, i: number) => { const tagName = typeof t === "string" ? t : t?.tag?.name || t?.name || tags?.find((tg: any) => tg.id == (t.tagId || t.tag_id))?.name || "Unknown"; return (
                                                <span key={i} className="px-2.5 py-1 bg-[var(--paper-2)] border border-[var(--line)] rounded-md text-[12px] font-medium text-[var(--ink-mute)]">{tagName}</span>
                                            ); })}
                                        </div>
                                    </div>
                                </div>

                                {/* Constituent Courses */}
                                <div>
                                    <p className="text-[12px] font-bold tracking-wider text-[var(--ink-soft)] uppercase mb-3">Constituent Courses</p>
                                    <div className="space-y-3">
                                        {coursesInReview.map((course: any, idx: number) => {
                                            const lessonsCount = course.lessons?.length || 0;
                                            return (
                                                <div
                                                    key={course.id}
                                                    onClick={() => setSelectedLessonId(course.id)}
                                                    className="flex items-center justify-between p-3.5 sm:p-4 rounded-lg border border-[var(--line)] bg-white hover:bg-[var(--paper-2)] hover:shadow-[var(--shadow-xs)] cursor-pointer transition-all duration-200 group"
                                                >
                                                    <div className="flex items-center gap-3.5 min-w-0">
                                                        <div className="w-10 h-10 rounded-lg bg-[var(--paper-2)] border border-[var(--line)] overflow-hidden flex items-center justify-center shrink-0">
                                                            {(() => {
                                                                const assetObj = course.thumbnailAsset || course.courseAssets?.find((a: any) => a.assetContext === "COURSE_THUMBNAIL")?.asset;
                                                                const thumbUrl = getAssetUrl(assetObj) || course.thumbnailUrl || assetObj?.url;
                                                                return thumbUrl ? (
                                                                    <img src={thumbUrl} alt={course.title} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <BookOpen className="w-5 h-5 text-[var(--ink-mute)] group-hover:text-amber-600 transition-colors" />
                                                                );
                                                            })()}
                                                        </div>
                                                        <span className="text-[12px] font-bold text-[var(--ink-soft)]">
                                                            {String(idx + 1).padStart(2, "0")}
                                                        </span>
                                                        <div className="min-w-0">
                                                            <p className="text-[14px] font-bold text-[var(--ink)] truncate group-hover:text-amber-800 transition-colors">
                                                                {course.title}
                                                            </p>
                                                            <p className="text-[12px] text-[var(--ink-soft)]">
                                                                {lessonsCount} lesson{lessonsCount !== 1 ? "s" : ""} · {course.duration ? `${course.duration}h` : "–"} · {course.isMandatory !== false ? "Mandatory" : "Optional"}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <span className={`px-2.5 py-0.5 rounded-full border text-[12px] font-bold ${
                                                            course.isMandatory !== false
                                                                ? "border-amber-200 bg-amber-50 text-amber-800"
                                                                : "border-gray-200 bg-gray-50 text-gray-600"
                                                        }`}>
                                                            {course.isMandatory !== false ? "MANDATORY" : "OPTIONAL"}
                                                        </span>
                                                        <ChevronRight className="w-4 h-4 text-[var(--ink-soft)] group-hover:translate-x-0.5 transition-transform" />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                            </div>
                            
                            {renderCommentsSection(rawCareerPath?.title || rawCareerPath?.name || entityTitle)}
                        </div>
                    )}

                    {/* ════════════════════════════════════════════════════════════════════════
                        VIEW 3: COURSE REVIEW VIEW (WHEN COURSE IS SELECTED)
                    ════════════════════════════════════════════════════════════════════════ */}
                    {isCourseViewActive && currentCourseData && (
                        <div className="space-y-6">
                            <div className="rounded-[var(--r-md)] border border-[var(--line)] bg-white shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)] p-6 sm:p-7 space-y-6">

                                {/* Tags Pill Row */}
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="px-3 py-1 rounded-full border border-[var(--line)] bg-[var(--paper-2)] text-[12px] font-medium text-[var(--ink)]">
                                        Course
                                    </span>
                                    {rawCourse?.code && (
                                        <span className="px-3 py-1 rounded-full border border-[var(--line)] bg-[var(--paper-2)] text-[12px] font-medium text-[var(--ink)]">
                                            {rawCourse.code}
                                        </span>
                                    )}
                                    {currentCourseData?.category && (
                                        <span className="px-3 py-1 rounded-full border border-[var(--line)] bg-[var(--paper-2)] text-[12px] font-medium text-[var(--ink)]">
                                            {currentCourseData.category}
                                        </span>
                                    )}
                                    {currentCourseData?.difficulty && (
                                        <span className="px-3 py-1 rounded-full border border-[var(--line)] bg-[var(--paper-2)] text-[12px] font-medium text-[var(--ink)]">
                                            {currentCourseData.difficulty}
                                        </span>
                                    )}
                                </div>

                                {/* Title and Subtitle / Description */}
                                <div>
                                    <h1 className="text-[16px] font-bold text-[var(--ink)] tracking-tight">
                                        {currentCourseData.title}
                                    </h1>
                                    <p className="text-[14px] text-[var(--ink-mute)] mt-1 leading-relaxed">
                                        {currentCourseData.description || rawCourse?.description || "No description provided."}
                                    </p>
                                </div>

{(() => {
    // 1. Resolve Category
    const categoryName = currentCourseData.category || rawCourse?.category?.name || rawCourse?.category || categories?.find((c: any) => c.id == ((currentCourseData.categoryId || currentCourseData.category_id) || (rawCourse?.categoryId || rawCourse?.category_id)))?.name || "-";
    
    // 2. Resolve Subjects
    let subjectNames = "-";
    const courseSubjects = currentCourseData.courseSubjects || currentCourseData.course_subjects || currentCourseData.course_subject || rawCourse?.courseSubjects || rawCourse?.course_subjects || rawCourse?.course_subject || currentCourseData.subjects || rawCourse?.subjects;
    if (Array.isArray(courseSubjects) && courseSubjects.length > 0) {
        subjectNames = courseSubjects.map((s: any) => {
            const sId = (s.subjectId || s.subject_id) || s.id;
            return s.subject?.name || s.name || subjects?.find((sub: any) => sub.id == sId)?.name || "Unknown";
        }).join(", ");
    } else if ((currentCourseData.subjectId || currentCourseData.subject_id) || (rawCourse?.subjectId || rawCourse?.subject_id)) {
        subjectNames = subjects?.find((sub: any) => sub.id == ((currentCourseData.subjectId || currentCourseData.subject_id) || (rawCourse?.subjectId || rawCourse?.subject_id)))?.name || "-";
    }

    // 3. Resolve Learning Outcomes
    let parsedOutcomes: any[] = [];
    const rawOutcome = ((currentCourseData.learningOutcomes || currentCourseData.learningOutcome) || currentCourseData.learning_outcome) || ((rawCourse?.learningOutcomes || rawCourse?.learningOutcome) || rawCourse?.learning_outcome) || currentCourseData.objective || rawCourse?.objective;
    if (typeof rawOutcome === 'string') {
        try {
            const parsed = JSON.parse(rawOutcome);
            if (Array.isArray(parsed)) parsedOutcomes = parsed;
            else if (parsed.blocks) parsedOutcomes = parsed.blocks.map((b: any) => b.text || b.data?.text);
            else parsedOutcomes = [rawOutcome];
        } catch(e) {
            parsedOutcomes = [rawOutcome];
        }
    } else if (Array.isArray(rawOutcome)) {
        parsedOutcomes = rawOutcome;
    } else if (rawOutcome) {
        parsedOutcomes = [rawOutcome];
    }

    // Split by newlines and flatten
    parsedOutcomes = parsedOutcomes.flatMap(o => typeof o === 'string' ? o.split('\n') : o).filter(Boolean);

    return (
        <div className="flex flex-col space-y-8 mt-6">
            <div>
                <p className="text-[12px] font-bold tracking-wider text-[var(--ink-soft)] uppercase mb-2">Basic Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-[var(--paper-2)]/80 border border-[var(--line)] rounded-lg p-4 transition-all duration-200 hover:shadow-[var(--shadow-xs)] hover:border-[var(--line)]">
                        <p className="text-[12px] font-bold tracking-wider text-[var(--ink-soft)] uppercase mb-1">Category</p>
                        <p className="text-[14px] font-bold text-[var(--ink)]">{categoryName}</p>
                    </div>
                    <div className="bg-[var(--paper-2)]/80 border border-[var(--line)] rounded-lg p-4 transition-all duration-200 hover:shadow-[var(--shadow-xs)] hover:border-[var(--line)]">
                        <p className="text-[12px] font-bold tracking-wider text-[var(--ink-soft)] uppercase mb-1">Subject</p>
                        <p className="text-[14px] font-bold text-[var(--ink)]">{subjectNames}</p>
                    </div>
                    <div className="bg-[var(--paper-2)]/80 border border-[var(--line)] rounded-lg p-4 transition-all duration-200 hover:shadow-[var(--shadow-xs)] hover:border-[var(--line)]">
                        <p className="text-[12px] font-bold tracking-wider text-[var(--ink-soft)] uppercase mb-1">Duration</p>
                        <p className="text-[14px] font-bold text-[var(--ink)]">{currentCourseData.duration || rawCourse?.duration || "-"}</p>
                    </div>
                    <div className="bg-[var(--paper-2)]/80 border border-[var(--line)] rounded-lg p-4 transition-all duration-200 hover:shadow-[var(--shadow-xs)] hover:border-[var(--line)]">
                        <p className="text-[12px] font-bold tracking-wider text-[var(--ink-soft)] uppercase mb-1">Difficulty</p>
                        <p className="text-[14px] font-bold text-[var(--ink)]">{currentCourseData.difficulty || rawCourse?.difficulty || "-"}</p>
                    </div>
                    <div className="bg-[var(--paper-2)]/80 border border-[var(--line)] rounded-lg p-4 transition-all duration-200 hover:shadow-[var(--shadow-xs)] hover:border-[var(--line)]">
                        <p className="text-[12px] font-bold tracking-wider text-[var(--ink-soft)] uppercase mb-1">Assessment Required</p>
                        <p className="text-[14px] font-bold text-[var(--ink)]">{currentCourseData.assessmentRequired || rawCourse?.assessmentRequired ? "Yes" : "No"}</p>
                    </div>
                </div>
            </div>

            <div>
                <p className="text-[12px] font-bold tracking-wider text-[var(--ink-soft)] uppercase mb-2">Learning Outcome</p>
                <div className="bg-[#748f65]/10 border border-[#748f65]/20 rounded-lg p-4">
                    {parsedOutcomes.length > 0 ? (
                        <ul className="list-disc pl-4 space-y-1">
                            {parsedOutcomes.map((outcome, idx) => (
                                <li key={idx} className="text-[14px] text-[var(--ink)] leading-relaxed">
                                    {typeof outcome === 'object' ? outcome.value || outcome.text || JSON.stringify(outcome) : outcome}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-[14px] text-[var(--ink)] leading-relaxed">-</p>
                    )}
                </div>
            </div>
        </div>
    );
})()}

                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                                    <div>
                                        <p className="text-[12px] font-bold tracking-wider text-[var(--ink-soft)] uppercase mb-2">Skills</p>
                                        <div className="flex flex-wrap gap-2">
                                            {((currentCourseData.course_skills || currentCourseData.course_skill || rawCourse?.course_skills || rawCourse?.course_skill) || currentCourseData.skills || rawCourse?.skills || []).map((s: any, i: number) => { const skillName = typeof s === "string" ? s : s?.skill?.name || s?.name || skills?.find((sk: any) => sk.id == (s.skillId || s.skill_id))?.name || "Unknown"; return (
                                                <span key={i} className="px-2.5 py-1 bg-[var(--paper-2)] border border-[var(--line)] rounded-md text-[12px] font-medium text-[var(--ink-mute)]">{skillName}</span>
                                            ); })}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[12px] font-bold tracking-wider text-[var(--ink-soft)] uppercase mb-2">Tags</p>
                                        <div className="flex flex-wrap gap-2">
                                            {((currentCourseData.course_tags || currentCourseData.course_tag || rawCourse?.course_tags || rawCourse?.course_tag) || currentCourseData.tags || rawCourse?.tags || []).map((t: any, i: number) => { const tagName = typeof t === "string" ? t : t?.tag?.name || t?.name || tags?.find((tg: any) => tg.id == (t.tagId || t.tag_id))?.name || "Unknown"; return (
                                                <span key={i} className="px-2.5 py-1 bg-[var(--paper-2)] border border-[var(--line)] rounded-md text-[12px] font-medium text-[var(--ink-mute)]">{tagName}</span>
                                            ); })}
                                        </div>
                                    </div>
                                </div>

                                {/* Lessons Table */}
                                <div>
                                    <p className="text-[12px] font-bold tracking-wider text-[var(--ink-soft)] uppercase mb-3">
                                        Lessons ({currentCourseData.lessons?.length || 0})
                                    </p>

                                    <div className="border border-[var(--line)] rounded-lg overflow-hidden bg-white shadow-[var(--shadow-xs)]">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="border-b border-[var(--line)] bg-[var(--paper-2)] text-[12px] font-bold text-[var(--ink-soft)] uppercase tracking-wider">
                                                    <th className="px-4 py-3 w-16">#</th>
                                                    <th className="px-4 py-3">Lesson</th>
                                                    <th className="px-4 py-3 w-28">Duration</th>
                                                    <th className="px-4 py-3 w-36 text-right">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {(currentCourseData.lessons || []).map((item: any, idx: number) => {
                                                    const lData = item.lesson || item;
                                                    const lId = item.id || item.lessonId || lData.id;
                                                    const durationMins = lData.duration ? `${lData.duration} min` : "30 min";

                                                    return (
                                                        <tr
                                                            key={lId || idx}
                                                            onClick={() => setSelectedLessonId(lId)}
                                                            className="hover:bg-[var(--paper-2)] cursor-pointer transition-colors group"
                                                        >
                                                            <td className="px-4 py-3 text-[12px] font-bold text-[var(--ink-soft)]">
                                                                L{idx + 1}
                                                            </td>
                                                            <td className="px-4 py-3 text-[14px] font-medium text-[var(--ink)] group-hover:text-amber-800 transition-colors">
                                                                {lData.title || lData.name || `Lesson ${idx + 1}`}
                                                            </td>
                                                            <td className="px-4 py-3 text-[12px] text-[var(--ink-mute)]">
                                                                {durationMins}
                                                            </td>
                                                            <td className="px-4 py-3 text-right">
                                                                {getLessonStatusBadge(lId)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Assessment Summary Section */}
                                <div>
                                    <p className="text-[12px] font-bold tracking-wider text-[var(--ink-soft)] uppercase mb-2">Assessment Summary</p>
                                    <div className="bg-[var(--paper-2)] border border-[var(--line)] rounded-lg p-5 flex items-start gap-8 sm:gap-12 flex-wrap">
                                        <div>
                                            <p className="text-[16px] font-bold text-[var(--ink)]">
                                                {quizzes.reduce((sum: number, q: any) => sum + ((q.quizQuestions || q.questions)?.length || 0), 0)}
                                            </p>
                                            <p className="text-[12px] font-bold text-[var(--ink-soft)] uppercase tracking-wider mt-0.5">Questions</p>
                                        </div>
                                        <div>
                                            <p className="text-[16px] font-bold text-[var(--ink)]">
                                                {(quizzes[0]?.passingScore ?? rawCourse?.passingScore ?? 70)}%
                                            </p>
                                            <p className="text-[12px] font-bold text-[var(--ink-soft)] uppercase tracking-wider mt-0.5">Pass Score</p>
                                        </div>
                                        <div>
                                            <p className="text-[16px] font-bold text-[var(--ink)]">
                                                {quizzes[0]?.maxAttempts ?? rawCourse?.maxAttempts ?? 3}
                                            </p>
                                            <p className="text-[12px] font-bold text-[var(--ink-soft)] uppercase tracking-wider mt-0.5">Retry Limit</p>
                                        </div>
                                        <div>
                                            <p className="text-[14px] font-bold text-[var(--ink)]">
                                                {(() => {
                                                    const types = new Set<string>();
                                                    quizzes.forEach((q: any) => (q.quizQuestions || q.questions)?.forEach((qq: any) => {
                                                        const qu = qq.question || qq;
                                                        const t = qu.type || qu.questionType || "";
                                                        if (t.includes("MULTIPLE_CHOICE") || t.includes("MCQ")) types.add("MCQ");
                                                        else if (t.includes("TRUE_FALSE") || t.includes("T/F")) types.add("T/F");
                                                        else if (t.includes("ESSAY") || t.includes("TEXT")) types.add("Essay");
                                                        else if (t) types.add(t);
                                                    }));
                                                    return Array.from(types).join(", ") || "MCQ";
                                                })()}
                                            </p>
                                            <p className="text-[12px] font-bold text-[var(--ink-soft)] uppercase tracking-wider mt-0.5">Types</p>
                                        </div>
                                    </div>
                                </div>

                                {/*  ACTUAL DOWNLOADABLE COURSE ATTACHMENTS  */}
                                <div>
                                    <p className="text-[12px] font-bold tracking-wider text-[var(--ink-soft)] uppercase mb-2">Course Attachments</p>
                                    {resolvedCourseAttachments.length > 0 ? (
                                        <div className="space-y-2">
                                            {resolvedCourseAttachments.map((doc: any, i: number) => {
                                                const docUrl = doc.signedUrl || doc.url || doc.fileUrl;
                                                const docName = doc.fileName || doc.originalFileName || `attachment-${i + 1}.pdf`;
                                                const ext = docName.includes(".") ? docName.split(".").pop()?.toUpperCase() || "FILE" : "FILE";

                                                return (
                                                    <a
                                                        key={doc.id || i}
                                                        href={docUrl || "#"}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="group flex items-center gap-3 p-3 rounded-lg border border-[var(--line)] bg-white hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-xs)] transition-all cursor-pointer"
                                                    >
                                                        <div className="w-8 h-8 rounded bg-[var(--paper-2)] border border-[var(--line)] flex items-center justify-center shrink-0 group-hover:bg-amber-50 group-hover:border-amber-100 transition-colors">
                                                            <FileText className="w-4 h-4 text-[var(--ink-soft)] group-hover:text-amber-600" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[14px] font-bold text-[var(--ink)] truncate group-hover:text-amber-800 transition-colors">
                                                                {docName}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className="text-[12px] font-bold text-[var(--ink-soft)] uppercase tracking-wider bg-[var(--paper-2)] px-1.5 py-0.5 rounded">{ext}</span>
                                                                {doc.size && (
                                                                    <span className="text-[12px] font-medium text-[var(--ink-soft)]">
                                                                        {(doc.size / (1024 * 1024)).toFixed(2)} MB
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </a>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="p-4 text-center border border-dashed border-[var(--line)] rounded-lg bg-[var(--paper-2)]">
                                            <p className="text-[12px] font-bold text-[var(--ink-mute)] uppercase tracking-wider">No Attachments</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {renderCommentsSection(currentCourseData.title || entityTitle)}
                        </div>
                    )}

                    {/*
                        VIEW 4: ASSESSMENT REVIEW VIEW (WHEN ASSESSMENT IS SELECTED)
                    */}
                    {isAssessmentSelected && (
                        <div className="space-y-6">
                            <div className="rounded-[var(--r-md)] border border-[var(--line)] bg-white shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)] p-6 sm:p-7 space-y-6">
                                {/* Title */}
                                <div>
                                    <h1 className="text-[16px] font-bold text-[var(--ink)] tracking-tight">
                                        Assessment Review
                                    </h1>
                                    <p className="mt-3 text-[14px] text-[var(--ink-mute)] leading-relaxed max-w-3xl">
                                        Review the quizzes and assessment questions linked to this course.
                                    </p>
                                </div>

                                {/* Quizzes List */}
                                <div className="space-y-4">
                                    {quizzes.length > 0 ? quizzes.map((quiz: any, qIdx: number) => {
                                        const quizQuestionsList = quiz.quizQuestions || quiz.questions || [];
                                        return (
                                        <div key={quiz.id || qIdx} className="rounded-[var(--r-md)] border border-[var(--line)] bg-white overflow-hidden shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)]">
                                            {/* Quiz Header */}
                                            <div className="px-5 py-4 border-b border-[var(--line)] bg-[var(--paper-2)] flex items-center justify-between">
                                                <div>
                                                    <h3 className="text-[16px] font-bold text-[var(--ink)]">
                                                        {quiz.quizTitle || quiz.title || `Quiz ${qIdx + 1}`}
                                                    </h3>
                                                    {(quiz.quizDescription || quiz.description) && (
                                                        <p className="text-[14px] text-[var(--ink-mute)] mt-1">{quiz.quizDescription || quiz.description}</p>
                                                    )}
                                                </div>
                                                <div className="flex gap-4">
                                                    <div className="text-right">
                                                        <span className="text-[12px] font-bold text-[var(--ink-soft)] uppercase">Questions</span>
                                                        <p className="text-[14px] font-bold text-[var(--ink)]">{quizQuestionsList.length || 0}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-[12px] font-bold text-[var(--ink-soft)] uppercase">Passing Score</span>
                                                        <p className="text-[14px] font-bold text-[var(--ink)]">{quiz.passingScore || 70}%</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Questions List */}
                                            {quizQuestionsList.length > 0 ? (
                                                <div className="divide-y divide-gray-100">
                                                    {quizQuestionsList.map((qq: any, i: number) => {
                                                        const qData = qq.question || qq;
                                                        const qOptions = qData.questionOptions || qData.options || [];
                                                        return (
                                                        <div key={qData.id || qq.id || i} className="p-5 hover:bg-amber-50/30 transition-colors">
                                                            <div className="flex items-start gap-4">
                                                                <span className="w-6 h-6 shrink-0 rounded bg-[var(--paper-2)] flex items-center justify-center text-[12px] font-bold text-[var(--ink-mute)]">
                                                                    {i + 1}
                                                                </span>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-[14px] font-medium text-[var(--ink)]" dangerouslySetInnerHTML={{ __html: qData.questionText || qData.text || "Question text" }} />
                                                                    
                                                                    {/* Options */}
                                                                    {qOptions.length > 0 && (
                                                                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                            {qOptions.map((opt: any, oIdx: number) => {
                                                                                const isCorrect = opt.isCorrect || opt.is_correct;
                                                                                const optionText = opt.optionText || opt.text || `Option ${oIdx + 1}`;
                                                                                return (
                                                                                    <div key={opt.id || oIdx} className={`p-3 rounded-lg border text-[14px] flex items-start gap-3 ${isCorrect ? 'border-green-200 bg-green-50' : 'border-[var(--line)] bg-white'}`}>
                                                                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 shrink-0 ${isCorrect ? 'border-green-500 bg-green-500 text-white' : 'border-[var(--line-strong)]'}`}>
                                                                                            {isCorrect && (
                                                                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                                                            )}
                                                                                        </div>
                                                                                        <span className={`${isCorrect ? 'text-green-800 font-medium' : 'text-[var(--ink)]'}`}>{optionText}</span>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="p-6 text-center text-[14px] text-[var(--ink-mute)]">
                                                    No questions defined for this quiz yet.
                                                </div>
                                            )}
                                        </div>
                                    );
                                }) : (
                                        <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-[var(--line)] rounded-xl bg-[var(--paper-2)]/50">
                                            <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>
                                            <p className="text-[14px] font-medium text-[var(--ink)]">No assessments found</p>
                                            <p className="text-[12px] text-[var(--ink-mute)] mt-1 max-w-xs text-center">There are no quizzes or assessments linked to this course.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}


 {/* 
                ALWAYS-VISIBLE STICKY BOTTOM DOCK: APPROVAL / PUBLISH / REJECT PANEL
                (Exact reference design matching the provided image)
            */}
            {!isViewOnly && (
                (isCourseEntity && isCourseViewActive) ||
                (isLessonEntity && isLessonViewActive) ||
                (isCareerPathEntity && isCareerPathSelected)
            ) && (
                <div className="sticky bottom-4 mt-6">
                    <div className="rounded-[var(--r-md)] border border-[var(--line)] bg-white shadow-[var(--shadow-xs)] py-4 px-6 sm:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <div className="text-[14px] flex items-center gap-2">
                                <span className="font-bold text-[#c25e43]">
                                    {requiredUnresolved.length} required
                                </span>
                                <span className="text-[var(--ink-soft)]">·</span>
                                <span className="text-[var(--ink-mute)] font-medium">
                                    {suggestionUnresolved.length} suggestion
                                </span>
                            </div>
                            {rejectNoCommentError ? (
                                <p className="text-[12px] text-[#c86d5e] font-bold mt-1">
                                    ⚠ Add at least one comment before rejecting.
                                </p>
                            ) : (
                                <p className="text-[12px] text-[var(--ink-soft)] mt-1">
                                    Approve requires all required comments resolved. Reject uses existing comments.
                                </p>
                            )}
                        </div>

                        {/* Action Buttons: Approve & publish (sage green pill) and Reject & return (white pill terracotta border) */}
                        <div className="flex items-center gap-3.5 w-full sm:w-auto justify-end">
                            {/* Approve & publish */}
                            <button
                                onClick={handleApprovePublish}
                                disabled={isApprovalGated}
                                className="h-10 px-6 rounded-full bg-[#748f65] hover:bg-[#668058] text-white font-medium text-[14px] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[var(--shadow-sm)] cursor-pointer"
                            >
                                Approve &amp; publish
                            </button>

                            {/* Reject & return */}
                            <button
                                onClick={handleRejectReturn}
                                className="h-10 px-6 rounded-full bg-white border border-[#c86d5e] text-[#c86d5e] hover:bg-[#fcf5f3] font-medium text-[14px] transition-all shadow-[var(--shadow-xs)] cursor-pointer"
                            >
                                Reject &amp; return
                            </button>
                        </div>
                    </div>
                </div>
            )}

                </main>
            </div>

           
        </div>


        {/* ════════════ APPROVE CONFIRMATION MODAL ════════════ */}
        {showApproveModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
                <div className="rounded-[var(--r-md)] border border-[var(--line)] bg-white shadow-[var(--shadow-sm)] w-full max-w-md p-6 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-200">
                    <div>
                        <h2 className="text-[16px] font-bold text-[var(--ink)]">Approve &amp; Publish</h2>
                        <p className="text-[14px] text-[var(--ink-mute)] mt-1">
                            This content will be approved and published. Any comments below will be included in the approval record.
                        </p>
                    </div>

                    {/* All comments being sent with approval */}
                    {comments.length > 0 ? (
                        <div className="bg-[var(--paper-2)] border border-[var(--line)] rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                            <p className="text-[12px] font-bold text-[var(--ink-soft)] uppercase tracking-wider">Comments included ({comments.length})</p>
                            {comments.map((c) => (
                                <div key={c.id} className="flex items-start gap-2 text-[12px]">
                                    <span className={`shrink-0 px-1.5 py-0.5 rounded font-bold text-[12px] uppercase ${
                                        c.resolved ? "bg-[#748f65]/10 text-[#748f65]" :
                                        c.type === "Required" ? "bg-red-50 text-[#c86d5e]" : "bg-amber-50 text-amber-700"
                                    }`}>
                                        {c.resolved ? "Resolved" : c.type}
                                    </span>
                                    <span className="text-[var(--ink)] leading-relaxed">{c.message}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-[#748f65]/5 border border-[#748f65]/20 rounded-lg p-3 text-[14px] text-[#748f65] font-medium">
                            ✓ No comments — content is clear for approval.
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-1">
                        <button
                            onClick={() => setShowApproveModal(false)}
                            className="h-10 px-5 rounded-full border border-[var(--line)] text-[14px] font-bold text-[var(--ink-mute)] hover:bg-[var(--paper-2)] transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirmApprove}
                            disabled={approveMutation.isPending}
                            className="h-10 px-6 rounded-full bg-[#748f65] hover:bg-[#668058] text-white font-bold text-[14px] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                            {approveMutation.isPending ? "Approving..." : "Confirm Approve"}
                        </button>
                    </div>
                </div>
            </div>
        )}

        </>
    );
};

export default SubjectMatterReview;
