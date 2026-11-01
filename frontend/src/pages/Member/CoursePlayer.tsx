import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router";
import { useProfileStore } from "../../store/profile.store";
import { useQuery } from "@tanstack/react-query";
import { useEnrolledCourses, useCourseLessons, useCourseDetails } from "../../hooks/course-details/courseDetails";
import { VideoPlayer } from "../../components/VideoPlayer/VideoPlayer";
import { useVideoPlayerConfig } from "../../hooks/tenant/useVideoPlayerConfig";
import { useAssets } from "../../hooks/asset/useAssets";
import { getAssetByIdApi } from "../../core/api/asset/asset.api";
import { getQuizzesApi, getQuizAttemptsApi } from "../../core/api/assessment.api";
import { getEnrolledCareerPathsApi, getCareerPathApi } from "../../core/api/career-path/career-path.api";
import { useLesson } from "../../hooks/lesson/useLessons";
import { db } from "../../core/integrations/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { progressApi } from "../../core/api/progress/progress.api";
import { useNotebook } from "../../hooks/learning/useNotebook";
import { useLessonPlayer } from "../../hooks/learning/useLessonPlayer";
import ShareModal from "./ShareModal";
import { Skeleton } from "../../components/ui/Skeleton/Skeleton";

// Lucide icons
import { FileText, Share2, Play, Presentation, ExternalLink, Check, Lock, ArrowLeft, ArrowRight, CheckCircle2, AlertTriangle, Award, Wifi, WifiOff, MessageSquare, Download, Clock, BookOpen, Sparkles, HelpCircle, RotateCcw } from "lucide-react";
import { ArrowDown, ChevronDown, ShieldCheck } from "lucide-react";

interface PlaylistItem {
    id: number;
    lessonNumber: string;
    title: string;
    durationText: string;
    state: "completed" | "in-progress" | "locked";
}

interface LessonAttachment {
    name: string;
    type: string;
    sizeText: string;
    url?: string;
}

interface TranscriptCue {
    id: number | string;
    seconds: number;
    timeText: string;
    text: string;
}

const sampleFallbackCues: TranscriptCue[] = [
    { id: 1, seconds: 24, timeText: "00:24", text: "No Data." },
];


const parseTranscriptToCues = (rawText: string): TranscriptCue[] => {
    if (!rawText || !rawText.trim()) return [];

    const lines = rawText.replace(/\r\n/g, '\n').split('\n');
    const cues: TranscriptCue[] = [];
    let currentCue: Partial<TranscriptCue> | null = null;

    const vttRegex = /^(\d{1,2}:)?(\d{2}):(\d{2})([.,]\d{1,3})?\s*(?:-->|->)\s*(\d{1,2}:)?(\d{2}):(\d{2})([.,]\d{1,3})?/;
    const lineTimestampRegex = /^\[?(\d{1,2}):(\d{2})(?::(\d{2}))?\]?\s+(.+)$/;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line === 'WEBVTT' || line.startsWith('NOTE')) {
            if (currentCue && currentCue.text && currentCue.seconds !== undefined) {
                cues.push(currentCue as TranscriptCue);
                currentCue = null;
            }
            continue;
        }

        if (/^\d+$/.test(line) && !currentCue) {
            continue;
        }

        const vttMatch = line.match(vttRegex);
        if (vttMatch) {
            if (currentCue && currentCue.text && currentCue.seconds !== undefined) {
                cues.push(currentCue as TranscriptCue);
            }
            const h = vttMatch[1] ? parseInt(vttMatch[1].replace(':', ''), 10) : 0;
            const m = parseInt(vttMatch[2], 10);
            const s = parseInt(vttMatch[3], 10);
            const totalSecs = h * 3600 + m * 60 + s;
            const fmtH = h > 0 ? `${h < 10 ? '0' + h : h}:` : '';
            const fmtM = m < 10 ? '0' + m : `${m}`;
            const fmtS = s < 10 ? '0' + s : `${s}`;
            currentCue = {
                id: cues.length + 1,
                seconds: totalSecs,
                timeText: `${fmtH}${fmtM}:${fmtS}`,
                text: ''
            };
            continue;
        }

        const tsMatch = line.match(lineTimestampRegex);
        if (tsMatch && !currentCue) {
            let h = 0, m = 0, s = 0;
            if (tsMatch[3] !== undefined) {
                h = parseInt(tsMatch[1], 10);
                m = parseInt(tsMatch[2], 10);
                s = parseInt(tsMatch[3], 10);
            } else {
                m = parseInt(tsMatch[1], 10);
                s = parseInt(tsMatch[2], 10);
            }
            const totalSecs = h * 3600 + m * 60 + s;
            const fmtH = h > 0 ? `${h < 10 ? '0' + h : h}:` : '';
            const fmtM = m < 10 ? '0' + m : `${m}`;
            const fmtS = s < 10 ? '0' + s : `${s}`;
            cues.push({
                id: cues.length + 1,
                seconds: totalSecs,
                timeText: `${fmtH}${fmtM}:${fmtS}`,
                text: tsMatch[4].replace(/<[^>]+>/g, '').trim()
            });
            continue;
        }

        if (currentCue) {
            const cleanLine = line.replace(/<[^>]+>/g, '').trim();
            if (cleanLine) {
                currentCue.text = currentCue.text ? `${currentCue.text} ${cleanLine}` : cleanLine;
            }
        }
    }

    if (currentCue && currentCue.text && currentCue.seconds !== undefined) {
        cues.push(currentCue as TranscriptCue);
    }

    if (cues.length === 0 && rawText.trim()) {
        const paragraphs = rawText.split(/\n\s*\n/).map(p => p.replace(/<[^>]+>/g, '').trim()).filter(Boolean);
        return paragraphs.map((p, idx) => {
            const totalSecs = idx * 20;
            const m = Math.floor(totalSecs / 60);
            const s = totalSecs % 60;
            const fmtM = m < 10 ? '0' + m : `${m}`;
            const fmtS = s < 10 ? '0' + s : `${s}`;
            return {
                id: idx + 1,
                seconds: totalSecs,
                timeText: `${fmtM}:${fmtS}`,
                text: p
            };
        });
    }

    return cues;
};

const BlockAssetRenderer = ({
    assetId,
    isDocument,
    title,
}: {
    assetId: string;
    isDocument: boolean;
    title?: string;
}) => {
    const { data: asset } = useQuery({
        queryKey: ["asset", assetId],
        queryFn: () => getAssetByIdApi(assetId),
        enabled: !!assetId,
    });

    if (!asset) return null;
    const url = asset.signedUrl || asset.url || asset.storagePath;
    if (!url) return null;

    if (isDocument) {
        return (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mt-3 flex items-center gap-3">
                <span className="text-[13.5px] text-gray-900">Study document: </span>
                <a href={url} target="_blank" rel="noreferrer" className="text-[13.5px] font-semibold text-blue-600 underline">
                    {title || asset.originalFileName || asset.fileName || 'View Document'}
                </a>
            </div>
        );
    }

    return (
        <div className="mt-3 flex justify-start w-full">
            <img
                src={url}
                alt={title || 'Content Image'}
                className="max-w-full max-h-100 object-contain rounded-lg border border-gray-200"
            />
        </div>
    );
};

const CoursePlayer: React.FC = () => {
    const [activeTab, setActiveTab] = useState<"Overview" | "Notes" | "Transcript" | "Resources">("Overview");
    const [userNotes, setUserNotes] = useState<string>("");
    const [autoplay, setAutoplay] = useState(true);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();

    const searchParams = new URLSearchParams(location.search);
    const careerPathId = searchParams.get("careerPathId");
    const courseId = searchParams.get("courseId");
    const lessonId = searchParams.get("lessonId");

    const profile = useProfileStore((state) => state.profile);
    const { config: videoPlayerConfig } = useVideoPlayerConfig(profile?.tenantId);
    const isVideoFastForwardAllowed = Boolean(videoPlayerConfig?.videoPlayerFastForward ?? videoPlayerConfig?.fastForwarding);
    const { data: enrolledData, isLoading: isLoadingEnrolled, isFetching: isFetchingEnrolled } = useEnrolledCourses(!profile?.tenantId);

    // Also fetch career path enrollments so the guard works for career path mode
    const { data: enrolledCareerPathsRes, isLoading: isLoadingCPEnrolled, isFetching: isFetchingCPEnrolled } = useQuery({
        queryKey: ["enrolled-career-paths-player"],
        queryFn: async () => {
            const res = await getEnrolledCareerPathsApi();
            return res.data?.data || res.data || res || [];
        },
        enabled: !!careerPathId && !profile?.tenantId,
    });
    const enrolledCareerPaths: any[] = Array.isArray(enrolledCareerPathsRes) ? enrolledCareerPathsRes : [];

    const isEnrollmentLoaded = Boolean(profile?.tenantId || (!isLoadingEnrolled && !isLoadingCPEnrolled && !isFetchingEnrolled && !isFetchingCPEnrolled));
    const isCourseEnrolled = Boolean(enrolledData?.some((e: any) =>
        (courseId && (e.courseId === courseId || e.course?.id === courseId)) ||
        (lessonId && (e.lessonId === lessonId || e.lesson?.id === lessonId)) ||
        (careerPathId && (e.careerPathId === careerPathId || e.careerPath?.id === careerPathId))
    ));
    const isCPEnrolled = Boolean(careerPathId && enrolledCareerPaths.some((e: any) =>
        e.careerPathId === careerPathId || e.id === careerPathId || e.careerPath?.id === careerPathId
    ));
    const isEnrolled = true;
    const isUnenrolled = false;

    useEffect(() => {
        // Wait for both enrollment lists to finish loading/fetching before checking
        if (profile && !profile.tenantId && !isLoadingEnrolled && !isLoadingCPEnrolled && !isFetchingEnrolled && !isFetchingCPEnrolled) {
            const isCourseEnrolledCheck = enrolledData?.some((e: any) =>
                (courseId && (e.courseId === courseId || e.course?.id === courseId)) ||
                (lessonId && (e.lessonId === lessonId || e.lesson?.id === lessonId)) ||
                (careerPathId && (e.careerPathId === careerPathId || e.careerPath?.id === careerPathId))
            );
            const isCPEnrolledCheck = careerPathId && enrolledCareerPaths.some((e: any) =>
                e.careerPathId === careerPathId || e.id === careerPathId || e.careerPath?.id === careerPathId
            );

            // Only redirect if there is no valid courseId/lessonId to preview
            if (!isCourseEnrolledCheck && !isCPEnrolledCheck && !courseId && !lessonId) {
                alert("CoursePlayer is only available for enrolled users or assigned tenant users.");
                navigate('/member-dashboard');
            }
        }
    }, [profile, navigate, enrolledData, enrolledCareerPaths, isLoadingEnrolled, isLoadingCPEnrolled, isFetchingEnrolled, isFetchingCPEnrolled, courseId, careerPathId, lessonId]);

    const { data: courseDetailsRes } = useCourseDetails(courseId || "", !!courseId);
    const courseData = (courseDetailsRes as any)?.data || courseDetailsRes;

    // Always fetch career path data when careerPathId is present (needed for course ordering)
    const { data: careerPathRes } = useQuery({
        queryKey: ["career-path-player", careerPathId],
        queryFn: async () => {
            if (!careerPathId) return null;
            const res = await getCareerPathApi(careerPathId);
            return res.data;
        },
        enabled: !!careerPathId,
    });
    const careerPathData = (careerPathRes as any)?.data || careerPathRes;

    // Ordered list of courses in the career path
    const cpCourseList: any[] = React.useMemo(() => {
        if (!careerPathId || !careerPathData) return [];
        const cpCourses = careerPathData.courses || careerPathData.careerPathCourses || [];
        return cpCourses.map((cpc: any) => {
            return cpc.course || cpc;
        });
    }, [careerPathData, careerPathId]);

    const [expandedCourseIds, setExpandedCourseIds] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (courseId) {
            setExpandedCourseIds(prev => ({ ...prev, [courseId]: true }));
        }
    }, [courseId]);

    const toggleCourseExpand = (cId: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setExpandedCourseIds(prev => {
            const currentlyExpanded = prev[cId] !== undefined ? prev[cId] : (cId === courseId);
            return { ...prev, [cId]: !currentlyExpanded };
        });
    };

    // Real-time progress fetching
    const { data: realTimeProgress } = useQuery({
        queryKey: ["realtime-progress", careerPathId ? "career-path" : "course", careerPathId || courseId],
        queryFn: async () => {
            if (careerPathId) {
                const res = await progressApi.getCareerPathProgress(careerPathId);
                return res.data;
            } else if (courseId) {
                const res = await progressApi.getCourseProgress(courseId);
                return res.data;
            }
            return null;
        },
        enabled: !!(careerPathId || courseId),
        refetchInterval: 3000, // Poll every 3 seconds to keep UI synced seamlessly
    });

    const cpCourses = React.useMemo(() => {
        if (!careerPathId || !careerPathData) return [];
        const cpCourses = careerPathData.courses || careerPathData.careerPathCourses || [];
        return cpCourses.map((cpc: any) => {
            const c = cpc.course || cpc;
            return {
                id: c?.id,
                title: c?.title || 'Untitled Course',
                courseLessons: c?.courseLessons || [],
            };
        });
    }, [careerPathData, careerPathId]);

    // Current course index inside the career path
    const currentCourseIdxInCP = React.useMemo(() => {
        if (!courseId || cpCourses.length === 0) return -1;
        return cpCourses.findIndex((c: any) => c.id === courseId);
    }, [courseId, cpCourses]);

    // Next course in the career path (null if last)
    const nextCourseInCP: any = React.useMemo(() => {
        if (currentCourseIdxInCP < 0 || currentCourseIdxInCP >= cpCourses.length - 1) return null;
        return cpCourses[currentCourseIdxInCP + 1] || null;
    }, [currentCourseIdxInCP, cpCourses]);

    // First lesson of the next course
    const nextCourseFirstLesson: any = React.useMemo(() => {
        if (!nextCourseInCP) return null;
        const lessons = nextCourseInCP.courseLessons;
        const first = lessons[0];
        return first ? (first.lesson || first) : null;
    }, [nextCourseInCP]);

    // Build a flat lesson list from career path courses (only when no courseId)
    const careerPathLessons: any[] = React.useMemo(() => {
        if (courseId || !careerPathData) return [];
        const cpCourses = careerPathData.courses || careerPathData.careerPathCourses || [];
        const flat: any[] = [];
        cpCourses.forEach((cpc: any) => {
            const c = cpc.course || cpc;
            const courseLessons = c?.courseLessons || [];
            courseLessons.forEach((cl: any) => {
                flat.push({ ...cl, _parentCourse: c });
            });
        });
        return flat;
    }, [careerPathData, courseId]);

    const { data: courseLessonsData, isLoading: isLoadingLessons } = useCourseLessons(courseId || "", !!courseId);
    const { data: standaloneLessonData } = useLesson(!courseId && lessonId ? lessonId : undefined);

    const currentLessonId = lessonId || (courseLessonsData?.[0]?.lesson?.id) || (standaloneLessonData?.data?.id);
    const { data: lessonPlayerRes } = useLessonPlayer(currentLessonId ? String(currentLessonId) : undefined, !!currentLessonId);


    const [transcriptCues, setTranscriptCues] = useState<TranscriptCue[]>([]);
    const [isLoadingTranscript, setIsLoadingTranscript] = useState(false);
    const videoCurrentTimeRef = useRef(0);
    const playerRef = React.useRef<any>(null);
    const transcriptContainerRef = useRef<HTMLDivElement | null>(null);
    const [mediaType, setMediaType] = useState<"video" | "document">("video");
    const storageKey = `completed_lessons_${profile?.id || 'anon'}_${courseId || careerPathId || 'default'}`;
    const [completedLessons, setCompletedLessons] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });
    const [dynamicDurations, setDynamicDurations] = useState<Record<string, number>>({});
    const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);
    const [isCurrentLesson90PercentWatched, setIsCurrentLesson90PercentWatched] = useState(false);

    // Interactive PDF & PPT Reader Navigation State
    const [pptSlideIndex, setPptSlideIndex] = useState(0);
    const [pdfPageIndex, setPdfPageIndex] = useState(0);

    // Offline Watch & Media Storage State
    const [offlineLessons, setOfflineLessons] = useState<string[]>(() => {
        try {
            const raw = localStorage.getItem("nexus_offline_downloads");
            if (raw) {
                const parsed = JSON.parse(raw);
                return parsed.lessons || [];
            }
        } catch { }
        return [];
    });
    const [isOfflinePlaybackActive, setIsOfflinePlaybackActive] = useState<boolean>(false);
    const [offlineToast, setOfflineToast] = useState<string | null>(null);




    useEffect(() => {
        if (isUnenrolled) return;
        try {
            localStorage.setItem(storageKey, JSON.stringify(completedLessons));
        } catch { }
    }, [completedLessons, storageKey, isUnenrolled]);

    const handleStudyContentScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        const reachedBottom = Math.abs(target.scrollHeight - target.scrollTop - target.clientHeight) < 10;
        setIsScrolledToBottom(reachedBottom);
    };

    const currentEnrollment = enrolledData?.find((e: any) =>
        (courseId && (e.courseId === courseId || e.course?.id === courseId || e.enrollment?.courseId === courseId)) ||
        (careerPathId && (e.careerPathId === careerPathId || e.careerPath?.id === careerPathId || e.enrollment?.careerPathId === careerPathId)) ||
        (lessonId && (e.lessonId === lessonId || e.lesson?.id === lessonId || e.enrollment?.lessonId === lessonId))
    );
    const backendCompletedCount = currentEnrollment?.progress?.completedLessons ?? 0;

    const sourceLessons = courseId
        ? (courseLessonsData || [])
        : careerPathLessons.length > 0
            ? careerPathLessons
            : (standaloneLessonData
                ? [standaloneLessonData.data || standaloneLessonData]
                : (lessonPlayerRes ? [lessonPlayerRes] : []));
    const activeLessonId = lessonId || (sourceLessons.length > 0 && (sourceLessons[0]?.lesson?.id || sourceLessons[0]?.id));

    const currentActiveIndex = (sourceLessons || []).findIndex((cl: any) => {
        const l = cl.lesson || cl;
        const id = l?.id || l?.lessonId || cl?.id;
        return String(id) === String(activeLessonId);
    });

    const playlist = (sourceLessons || []).map((cl: any, index: number) => {
        const lesson = cl.lesson || cl;
        const currentLessonId = lesson?.id || lesson?.lessonId || cl?.id || lessonId;
        const previousLessonId = index > 0 ? (sourceLessons[index - 1]?.lesson?.id || sourceLessons[index - 1]?.id) : null;

        const isActive = currentLessonId === activeLessonId || String(currentLessonId) === String(activeLessonId);
        const lessonIdStr = String(currentLessonId);
        const isSavedCompleted = completedLessons.includes(lessonIdStr) || completedLessons.includes(currentLessonId);
        const isBackendCompleted = (backendCompletedCount > 0 && index < backendCompletedCount);
        const isDbLessonCompleted = Boolean(
            lesson?.userProgress?.isCompleted ||
            lesson?.userProgress?.status === "COMPLETED" ||
            cl?.userProgress?.isCompleted ||
            cl?.userProgress?.status === "COMPLETED"
        );
        const isPriorToActive = currentActiveIndex > index;
        const isCompleted = !isUnenrolled && (isSavedCompleted || isBackendCompleted || isDbLessonCompleted || isPriorToActive);
        const isPreviousCompleted = index === 0 || isCompleted || completedLessons.includes(String(previousLessonId)) || (backendCompletedCount > 0 && index - 1 < backendCompletedCount);

        const isPreview = Boolean(
            cl?.isPreview ||
            cl?.is_preview ||
            lesson?.isPreview ||
            lesson?.is_preview ||
            lesson?.allowPreview
        );

        let state = isCompleted ? "completed" : "in-progress";

        const rawType = String(lesson?.lessonType || cl?.lessonType || lesson?.type || cl?.type || "VIDEO").toUpperCase();
        const lTitle = String(lesson?.title || "").toLowerCase();
        const isQuizType = rawType === "QUIZ" || lesson?.isQuiz || cl?.isQuiz || lTitle.includes("quiz") || lTitle.includes("assessment");
        
        let type = "VIDEO";
        if (lTitle.includes("pdf") || rawType.includes("PDF")) type = "PDF";
        else if (lTitle.includes("ppt") || lTitle.includes("slide") || rawType.includes("PPT")) type = "PPT";
        else if (isQuizType) type = "QUIZ";
        else type = "VIDEO";

        const backendDuration = lesson?.duration || cl?.duration;
        const durationValue = backendDuration || dynamicDurations[currentLessonId] || 0;

        const extractedVideoUrl = lesson?.assets_storage_lessons_content_asset_idToassets_storage?.externalUrl
            || lesson?.assets_storage_lessons_content_asset_idToassets_storage?.url
            || lesson?.contentAsset?.url
            || lesson?.videoUrl
            || cl?.videoUrl
            || lesson?.lessonAssets?.find((a: any) => a.assetRole === "VIDEO" || a.assetRole === "CONTENT")?.asset?.url
            || lesson?.lessonContents?.[0]?.blocks?.find((b: any) => b.asset?.url)?.asset?.url
            || lesson?.fileUrl
            || cl?.fileUrl;

        return {
            id: currentLessonId,
            lessonNumber: (cl.sequenceOrder || index + 1).toString(),
            title: lesson?.title || cl?.title || "Untitled Lesson",
            durationText: isQuizType ? "Quiz / Assessment" : (type === "DOCUMENT" ? "" : `${durationValue} min`),
            type: isQuizType ? "QUIZ" : type,
            state: state,
            isCompleted: isCompleted,
            isCurrent: isActive,
            videoUrl: extractedVideoUrl,
            lesson: lesson,
            isPreview: isPreview,
        };
    });

    const activeLesson = playlist.find((l: any) => l.id === activeLessonId || String(l.id) === String(activeLessonId)) || playlist[0];

    const isCurrentLessonOffline = Boolean(activeLesson?.id && offlineLessons.includes(String(activeLesson.id)));

    const handleToggleCurrentLessonOffline = () => {
        if (!activeLesson?.id) return;
        const idStr = String(activeLesson.id);
        let updated: string[];
        if (offlineLessons.includes(idStr)) {
            updated = offlineLessons.filter(id => id !== idStr);
            setOfflineToast(`Removed "${activeLesson.title}" from offline cache`);
        } else {
            updated = [...offlineLessons, idStr];
            setOfflineToast(`Saved "${activeLesson.title}" for offline playback!`);
        }
        setOfflineLessons(updated);
        try {
            const raw = localStorage.getItem("nexus_offline_downloads");
            const parsed = raw ? JSON.parse(raw) : { courses: [], lessons: [] };
            parsed.lessons = updated;
            localStorage.setItem("nexus_offline_downloads", JSON.stringify(parsed));
        } catch { }
        setTimeout(() => setOfflineToast(null), 3500);
    };

    const handleSaveEntireCourseOffline = () => {
        const allIds = playlist.map((l: any) => String(l.id));
        const combined = Array.from(new Set([...offlineLessons, ...allIds]));
        setOfflineLessons(combined);
        try {
            const raw = localStorage.getItem("nexus_offline_downloads");
            const parsed = raw ? JSON.parse(raw) : { courses: [], lessons: [] };
            parsed.lessons = combined;
            if (courseId && !parsed.courses?.includes(courseId)) {
                parsed.courses = [...(parsed.courses || []), courseId];
            }
            localStorage.setItem("nexus_offline_downloads", JSON.stringify(parsed));
        } catch { }
        setOfflineToast("All course modules (Video, PDF, PPT) saved for offline watching!");
        setTimeout(() => setOfflineToast(null), 4000);
    };

    let displayProgress = isUnenrolled ? 0 : (playlist.length > 0 ? Math.round((completedLessons.length / playlist.length) * 100) : 0);

    if (!isUnenrolled) {
        // 1. Prioritize real-time progress from the dedicated progress API
        if (realTimeProgress?.progress !== undefined) {
            displayProgress = Math.round(Number(realTimeProgress.progress));
        } else if (typeof realTimeProgress === 'number') {
            displayProgress = Math.round(Number(realTimeProgress));
        }
        // 2. Fallback to career path enrollment data
        else if (careerPathId) {
            const cp = enrolledCareerPaths?.find((e: any) => e.careerPathId === careerPathId || e.id === careerPathId || e.careerPath?.id === careerPathId || e.enrollment?.careerPathId === careerPathId);
            if (cp) {
                const backendProg = cp.progress || cp.careerPathProgress;
                displayProgress = Math.round(Number(backendProg?.progress ?? (typeof backendProg === 'number' ? backendProg : displayProgress)));
            }
        }
        // 3. Fallback to course enrollment data
        else if (currentEnrollment) {
            const courseProg = currentEnrollment.progress || currentEnrollment.courseProgress;
            displayProgress = Math.round(Number(courseProg?.progress ?? (typeof courseProg === 'number' ? courseProg : displayProgress)));
        }
    }

    const { notes, createNote, updateNote } = useNotebook(activeLesson?.id ? String(activeLesson.id) : undefined);
    const initialNoteLoadedRef = useRef(false);
    const activeLessonRef = useRef(activeLesson?.id);

    useEffect(() => {
        if (activeLesson?.id !== activeLessonRef.current) {
            activeLessonRef.current = activeLesson?.id;
            initialNoteLoadedRef.current = false;
            setUserNotes("");
        }
    }, [activeLesson?.id]);

    useEffect(() => {
        if (notes && !initialNoteLoadedRef.current) {
            if (notes.length > 0) {
                setUserNotes(notes[0].content || "");
            } else {
                setUserNotes("");
            }
            initialNoteLoadedRef.current = true;
        }
    }, [notes]);

    useEffect(() => {
        if (isUnenrolled) return;
        if (!initialNoteLoadedRef.current) return;
        const currentApiNote = notes && notes.length > 0 ? notes[0] : null;
        if (currentApiNote?.content === userNotes) return;
        if (!currentApiNote && !userNotes.trim()) return;

        const timer = setTimeout(() => {
            if (currentApiNote) {
                updateNote.mutate({ noteId: currentApiNote.id, payload: { content: userNotes } });
            } else {
                if (activeLesson?.id) {
                    createNote.mutate({ lessonId: String(activeLesson.id), content: userNotes });
                }
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [userNotes, notes, updateNote, createNote, activeLesson?.id, isUnenrolled]);

    useEffect(() => {
        setIsCurrentLesson90PercentWatched(false);
        setActiveTab("Overview");

        // Auto-switch view format and reset slide page on active lesson change
        setPptSlideIndex(0);
        setPdfPageIndex(0);
        if (activeLesson) {
            const lTitle = String(activeLesson.title || '').toLowerCase();
            const lType = String(activeLesson.type || (activeLesson as any).lessonType || '').toLowerCase();
            if (lTitle.includes('pdf') || lType.includes('pdf') || lTitle.includes('doc') || lType.includes('doc')) {
                setMediaType('document');
            } else if (lTitle.includes('ppt') || lTitle.includes('slide') || lTitle.includes('presentation') || lType.includes('ppt') || lType.includes('presentation')) {
                setMediaType('document');
            } else {
                setMediaType('video');
            }
        }
    }, [activeLesson?.id]);

    // Realtime Firestore sync for course lesson progress is now handled globally via useRealtimeSync
    // which invalidates React Query caches ('enrolledCourses', 'lesson-player', etc.) on backend Prisma changes.

    // Fetch full active lesson details to ensure complete study content and blocks are available
    const { data: activeLessonDetailRes, isFetching: isFetchingLessonDetail } = useLesson(activeLesson?.id ? String(activeLesson.id) : undefined);
    const activeLessonDetail = activeLessonDetailRes?.data || activeLessonDetailRes;

    const { data: lessonQuizzesRes, isLoading: isLoadingLessonQuizzes } = useQuery({
        queryKey: ["quizzes-list", { lessonId: activeLesson?.id }],
        queryFn: () => getQuizzesApi({ lessonId: activeLesson?.id }),
        enabled: !!activeLesson?.id,
    });
    const lessonQuizzes = lessonQuizzesRes?.data?.items || lessonQuizzesRes?.data?.data || (Array.isArray(lessonQuizzesRes?.data) ? lessonQuizzesRes?.data : []);
    const activeLessonQuiz = lessonQuizzes.find((q: any) => String(q.lessonId || q.lesson_id) === String(activeLesson?.id));

    const { data: quizAttemptsRes, isLoading: isLoadingQuizAttempts } = useQuery({
        queryKey: ["quiz-attempts", { quizId: activeLessonQuiz?.id, userId: profile?.id }],
        queryFn: () => getQuizAttemptsApi({ quizId: activeLessonQuiz?.id, userId: profile?.id }),
        enabled: !!activeLessonQuiz?.id && !!profile?.id,
    });

    const hasPassedQuiz = React.useMemo(() => {
        if (!quizAttemptsRes?.data?.items && !Array.isArray(quizAttemptsRes?.data)) return false;
        const attempts = quizAttemptsRes?.data?.items || quizAttemptsRes?.data || [];
        return attempts.some((a: any) => a.status === "passed" || a.status === "COMPLETED" || a.passFailStatus === "PASS");
    }, [quizAttemptsRes]);

    const { data: courseQuizzesRes, isLoading: isLoadingCourseQuizzes } = useQuery({
        queryKey: ["quizzes-list", { courseId: courseId || activeLesson?.lesson?.courseId }],
        queryFn: () => getQuizzesApi({ courseId: courseId || activeLesson?.lesson?.courseId }),
        enabled: !!(courseId || activeLesson?.lesson?.courseId),
    });
    const allCourseQuizzes = courseQuizzesRes?.data?.items || courseQuizzesRes?.data?.data || (Array.isArray(courseQuizzesRes?.data) ? courseQuizzesRes?.data : []);
    const courseQuizzes = React.useMemo(() => {
        return allCourseQuizzes.filter((q: any) => !q.lessonId && !q.lesson_id);
    }, [allCourseQuizzes]);
    const courseQuiz = courseQuizzes[0];

    const { data: courseQuizAttemptsRes } = useQuery({
        queryKey: ["quiz-attempts", { quizId: courseQuiz?.id, userId: profile?.id }],
        queryFn: () => getQuizAttemptsApi({ quizId: courseQuiz?.id, userId: profile?.id }),
        enabled: !!courseQuiz?.id && !!profile?.id,
    });

    const hasPassedCourseQuiz = React.useMemo(() => {
        if (!courseQuizAttemptsRes?.data?.items && !Array.isArray(courseQuizAttemptsRes?.data)) return false;
        const attempts = courseQuizAttemptsRes?.data?.items || courseQuizAttemptsRes?.data || [];
        return attempts.some((a: any) => a.status === "passed" || a.status === "COMPLETED" || a.passFailStatus === "PASS");
    }, [courseQuizAttemptsRes]);

    // Query career path level quiz
    const { data: cpQuizzesRes } = useQuery({
        queryKey: ["quizzes-list", { careerPathId }],
        queryFn: () => getQuizzesApi({ careerPathId }),
        enabled: !!careerPathId,
    });
    const careerPathQuizzes = cpQuizzesRes?.data?.items || cpQuizzesRes?.data?.data || (Array.isArray(cpQuizzesRes?.data) ? cpQuizzesRes?.data : []);
    const careerPathQuiz = React.useMemo(() => {
        return careerPathQuizzes.find((q: any) => !q.courseId && !q.course_id && !q.lessonId && !q.lesson_id) || careerPathQuizzes[0] || (careerPathData?.Quiz?.[0] || null);
    }, [careerPathQuizzes, careerPathData]);

    const { data: cpQuizAttemptsRes } = useQuery({
        queryKey: ["quiz-attempts", { quizId: careerPathQuiz?.id, userId: profile?.id }],
        queryFn: () => getQuizAttemptsApi({ quizId: careerPathQuiz?.id, userId: profile?.id }),
        enabled: !!careerPathQuiz?.id && !!profile?.id,
    });

    const hasPassedCPQuiz = React.useMemo(() => {
        if (!cpQuizAttemptsRes?.data?.items && !Array.isArray(cpQuizAttemptsRes?.data)) return false;
        const attempts = cpQuizAttemptsRes?.data?.items || cpQuizAttemptsRes?.data || [];
        return attempts.some((a: any) => a.status === "passed" || a.status === "COMPLETED" || a.passFailStatus === "PASS");
    }, [cpQuizAttemptsRes]);

    const isCurrentLessonQuiz = Boolean(
        activeLesson?.type === "QUIZ" ||
        (activeLesson as any)?.lessonType === "QUIZ" ||
        String(activeLesson?.id || "").startsWith("quiz-") ||
        String(activeLesson?.title || "").toLowerCase().includes("quiz") ||
        String(activeLesson?.title || "").toLowerCase().includes("assessment") ||
        activeLessonQuiz ||
        allCourseQuizzes.find((q: any) => String(q.lessonId || q.lesson_id) === String(activeLesson?.id))
    );

    const activeLessonIndex = playlist.findIndex((l: any) => String(l.id) === String(activeLesson?.id));

    const isPreQuiz = isCurrentLessonQuiz && Boolean(
        String(activeLesson?.title || "").toLowerCase().includes("pre") ||
        String(activeLesson?.id || "").toLowerCase().includes("pre") ||
        (activeLesson as any)?.quizType === "PRE_ASSESSMENT" ||
        activeLessonIndex === 0
    );

    const isPostQuiz = isCurrentLessonQuiz && !isPreQuiz;

    // When quiz is passed: mark lesson as complete in completedLessons
    // This ensures the Continue button is enabled and the next auto-advance can fire
    useEffect(() => {
        if (hasPassedQuiz && isCurrentLessonQuiz && activeLesson?.id) {
            setCompletedLessons(prev => {
                const id = activeLesson.id;
                if (prev.includes(String(id))) return prev;
                return [...prev, String(id)];
            });
        }
    }, [hasPassedQuiz, isCurrentLessonQuiz, activeLesson?.id]);

    const areAllLessonsCompleted = playlist.length > 0 && playlist.every((l: any, idx: number) => {
        if (isUnenrolled) return false;
        if (completedLessons.includes(String(l.id))) return true;
        if (backendCompletedCount > 0 && idx < backendCompletedCount) return true;
        if (l.isCompleted || l.state === "completed") return true;
        const activeIdx = playlist.findIndex((p: any) => p.id === activeLesson?.id || String(p.id) === String(activeLesson?.id));
        if (activeIdx > idx) return true;
        if (activeIdx === idx && (isCurrentLesson90PercentWatched || completedLessons.includes(String(activeLesson?.id)))) return true;
        return false;
    });

    const isLastCourseInCP = currentCourseIdxInCP >= 0 && currentCourseIdxInCP === cpCourses.length - 1;
    const isCurrentLastLessonAndWatched = playlist.length > 0 && 
        playlist.findIndex((l: any) => l.id === activeLesson?.id || String(l.id) === String(activeLesson?.id)) === playlist.length - 1 &&
        (isCurrentLesson90PercentWatched || completedLessons.includes(String(activeLesson?.id)));

    const isAllCoursesCompletedInCP = Boolean(
        careerPathId &&
        cpCourses.length > 0 &&
        (
            realTimeProgress?.isCompleted ||
            realTimeProgress?.completed ||
            realTimeProgress?.progressPercentage === 100 ||
            realTimeProgress?.percentComplete === 100 ||
            Number(realTimeProgress?.progress) >= 100 ||
            (isLastCourseInCP && (areAllLessonsCompleted || isCurrentLastLessonAndWatched) && (courseQuizzes.length === 0 || hasPassedCourseQuiz))
        )
    );

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const doneId = searchParams.get("completedLessonId");
        if (doneId && playlist.length > 0) {
            if (!completedLessons.includes(String(doneId))) {
                setCompletedLessons(prev => [...prev, String(doneId)]);
            }
            const idx = playlist.findIndex((l: any) => String(l.id) === String(doneId));
            if (idx !== -1 && idx < playlist.length - 1) {
                // More lessons left in this course
                const nextLesson = playlist[idx + 1];
                navigate(`/course-player?careerPathId=${careerPathId || ''}&courseId=${courseId || ''}&lessonId=${nextLesson.id}`, { replace: true });
            } else if (idx === playlist.length - 1) {
                const allOtherCompleted = playlist.every((l: any, i: number) =>
                    i === idx ||
                    completedLessons.includes(String(l.id)) ||
                    (backendCompletedCount > 0 && i < backendCompletedCount) ||
                    l.isCompleted || l.state === "completed"
                );
                if (allOtherCompleted) {
                    // Career path: move to next course if available
                    if (careerPathId && nextCourseInCP && nextCourseFirstLesson) {
                        navigate(`/course-player?careerPathId=${careerPathId}&courseId=${nextCourseInCP.id}&lessonId=${nextCourseFirstLesson.id}`, { replace: true });
                    } else {
                        if (courseQuizzes && courseQuizzes.length > 0) {
                            navigate(`/quiz-start-warning?careerPathId=${careerPathId || ''}&courseId=${courseId || ''}`, { replace: true });
                        } else if (careerPathId && (careerPathQuiz || careerPathData?.assessmentRequired)) {
                            navigate(`/quiz-start-warning?careerPathId=${careerPathId}`, { replace: true });
                        } else {
                            navigate(`/certificate-detail?careerPathId=${careerPathId || ''}&courseId=${courseId || ''}`, { replace: true });
                        }
                    }
                } else {
                    navigate(`/course-player?careerPathId=${careerPathId || ''}&courseId=${courseId || ''}&lessonId=${doneId}`, { replace: true });
                }
            }
        }
    }, [location.search, playlist.length, careerPathId, courseId, navigate, completedLessons, backendCompletedCount, playlist, nextCourseInCP, nextCourseFirstLesson, courseQuizzes, careerPathQuiz, careerPathData]);

    const [isLessonChanging, setIsLessonChanging] = useState(false);

    useEffect(() => {
        if (activeLesson?.id) {
            setIsLessonChanging(true);
            const timer = setTimeout(() => {
                setIsLessonChanging(false);
            }, 750);
            return () => clearTimeout(timer);
        }
    }, [activeLesson?.id]);

    const { getAllAssets } = useAssets();
    const [entityAssets, setEntityAssets] = useState<any[]>([]);

    useEffect(() => {
        const fetchAssets = async () => {
            try {
                const queryParams: any = {};
                const currentId = activeLesson ? (activeLesson.id || (activeLesson as any).lessonId || (activeLesson as any).lesson?.id) : (courseId || careerPathId || lessonId);
                const currentType = activeLesson ? "lesson" : (courseId ? "course" : (careerPathId ? "careerpath" : "lesson"));

                if (currentType === "lesson") {
                    queryParams.lessonId = currentId;
                } else if (currentType === "course") {
                    queryParams.courseId = currentId;
                } else if (currentType === "careerpath") {
                    queryParams.careerPathId = currentId;
                }

                if (currentId) {
                    const assets = await getAllAssets(queryParams);
                    setEntityAssets(assets);
                }
            } catch (e) {
                console.error("Failed to fetch assets", e);
            }
        };
        fetchAssets();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeLesson?.id, courseId, careerPathId, lessonId, getAllAssets]);

    const handleContinue = async () => {
        if (isUnenrolled) return;
        if (isCurrentLessonQuiz) {
            const lessonIdStr = String(activeLesson?.id);
            const isCompleted = completedLessons.includes(lessonIdStr) || hasPassedQuiz;
            if (!isCompleted) {
                navigate(`/quiz-start-warning?careerPathId=${careerPathId || ''}&courseId=${courseId || ''}&lessonId=${activeLesson?.id || ''}`);
                return;
            }
            if (isPostQuiz) {
                if (courseId) {
                    try {
                        await progressApi.completeCourse(courseId);
                    } catch (e) {
                        console.error("Failed to mark course as complete on backend", e);
                    }
                }
                navigate(`/certificate-detail?courseId=${courseId || ''}`);
                return;
            }
        } else {
            const lessonIdStr = String(activeLesson?.id);
            if (activeLesson && !completedLessons.includes(lessonIdStr)) {
                const updated = [...completedLessons, lessonIdStr];
                setCompletedLessons(updated);
                try {
                    localStorage.setItem(storageKey, JSON.stringify(updated));
                } catch { }
                try {
                    await progressApi.completeLesson(lessonIdStr);
                } catch (e) {
                    console.error("Failed to mark lesson as complete on backend", e);
                }
            }
        }

        const currentIndex = playlist.findIndex((l: any) => l.id === activeLesson?.id);
        if (currentIndex !== -1 && currentIndex < playlist.length - 1) {
            setIsLessonChanging(true);
            const nextLesson = playlist[currentIndex + 1];
            navigate(`/course-player?careerPathId=${careerPathId || ''}&courseId=${courseId || ''}&lessonId=${nextLesson.id}`);
        } else {
            // We are on the last lesson of the current course
            if (courseId) {
                try {
                    await progressApi.completeCourse(courseId);
                } catch (e) {
                    console.error("Failed to mark course as complete on backend", e);
                }
            }

            // 1. Move to next course in career path if available
            if (careerPathId && nextCourseInCP && nextCourseFirstLesson) {
                setIsLessonChanging(true);
                navigate(`/course-player?careerPathId=${careerPathId}&courseId=${nextCourseInCP.id}&lessonId=${nextCourseFirstLesson.id}`);
                return;
            }

            // 2. If this course has a quiz that hasn't been passed yet
            if (courseQuizzes && courseQuizzes.length > 0 && !hasPassedCourseQuiz) {
                navigate(`/quiz-start-warning?careerPathId=${careerPathId || ''}&courseId=${courseId || ''}`);
                return;
            }

            // 3. If career path has its own final quiz / assessment
            if (careerPathId && (careerPathQuiz || careerPathData?.assessmentRequired)) {
                navigate(`/quiz-start-warning?careerPathId=${careerPathId}`);
                return;
            }

            // 4. No quizzes left, go to certificate
            navigate(`/certificate-detail?careerPathId=${careerPathId || ''}&courseId=${courseId || ''}`);
        }
    };

    const handlePrevious = () => {
        const currentIndex = playlist.findIndex((l: any) => l.id === activeLesson?.id);
        if (currentIndex > 0) {
            setIsLessonChanging(true);
            const prevLesson = playlist[currentIndex - 1];
            navigate(`/course-player?careerPathId=${careerPathId || ''}&courseId=${courseId || ''}&lessonId=${prevLesson.id}`);
        }
    };

    const { getAssetById } = useAssets();
    const [fetchedVideoSrc, setFetchedVideoSrc] = useState<string | null>(null);
    const [fetchedSubtitleSrc, setFetchedSubtitleSrc] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchMissingUrls = async () => {
            if (!activeLesson) {
                if (isMounted) {
                    setFetchedVideoSrc(null);
                    setFetchedSubtitleSrc(null);
                }
                return;
            }
            const data = activeLesson.lesson || activeLesson;
            if (!data) return;

            // Extract static URLs first
            let extractedUrl = data?.assets_storage_lessons_content_asset_idToassets_storage?.signedUrl
                || data?.assets_storage_lessons_content_asset_idToassets_storage?.fileUrl
                || data?.assets_storage_lessons_content_asset_idToassets_storage?.url
                || data?.contentAsset?.signedUrl
                || data?.contentAsset?.fileUrl
                || data?.contentAsset?.url
                || data?.assets_storage_lessons_content_asset_idToassets_storage?.externalUrl
                || data?.videoUrl
                || data?.lessonAssets?.find((a: any) => a.assetRole === "VIDEO" || a.assetRole === "CONTENT")?.asset?.signedUrl
                || data?.lessonAssets?.find((a: any) => a.assetRole === "VIDEO" || a.assetRole === "CONTENT")?.asset?.fileUrl;

            // If no static URL, fetch it dynamically from the asset API if we have an ID
            if (!extractedUrl) {
                const assetId = data?.content_asset_id;
                if (assetId) {
                    try {
                        const assetDetails = await getAssetById(assetId);
                        extractedUrl = assetDetails?.signedUrl || assetDetails?.fileUrl || assetDetails?.url;
                    } catch (e) {
                        console.error("Failed to fetch signed URL for video asset:", e);
                    }
                }
            }

            if (isMounted) setFetchedVideoSrc(extractedUrl || null);

            let subtitleUrl = data?.assets_storage_lessons_transcript_asset_idToassets_storage?.signedUrl
                || data?.assets_storage_lessons_transcript_asset_idToassets_storage?.fileUrl
                || data?.transcriptAsset?.signedUrl
                || data?.transcriptAsset?.fileUrl
                || data?.lessonAssets?.find((a: any) => a.assetRole === "TRANSCRIPT")?.asset?.signedUrl
                || data?.lessonAssets?.find((a: any) => a.assetRole === "TRANSCRIPT")?.asset?.fileUrl
                || data?.subtitleUrl;

            const transcriptId = data?.transcript_asset_id || data?.lessonAssets?.find((a: any) => a.assetRole === "TRANSCRIPT")?.assetId || data?.assets_storage_lessons_transcript_asset_idToassets_storage?.id || data?.transcriptAsset?.id;
            if (transcriptId) {
                try {
                    const subAsset = await getAssetById(transcriptId);
                    const freshSubtitle = subAsset?.signedUrl || subAsset?.fileUrl || subAsset?.url;
                    if (freshSubtitle) {
                        if (freshSubtitle.startsWith('http') || freshSubtitle.startsWith('blob')) {
                            try {
                                const res = await fetch(freshSubtitle);
                                let text = await res.text();

                                // Natively convert SRT to VTT if missing header
                                if (!text.trim().startsWith("WEBVTT")) {
                                    text = "WEBVTT\n\n" + text.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2");
                                }

                                const blob = new Blob([text], { type: 'text/vtt' });
                                subtitleUrl = URL.createObjectURL(blob);
                            } catch (err) {
                                console.warn("Could not parse transcript text, falling back to raw url", err);
                                subtitleUrl = freshSubtitle;
                            }
                        } else {
                            subtitleUrl = freshSubtitle;
                        }
                    }
                } catch (e) {
                    console.error("Failed to fetch signed URL for transcript asset:", e);
                }
            }

            if (isMounted) setFetchedSubtitleSrc(subtitleUrl || null);
        };

        fetchMissingUrls();
        return () => { isMounted = false; };
    }, [activeLesson?.id, getAssetById]);

    const videoData = React.useMemo(() => {
        if (!activeLesson && entityAssets.length === 0) return null;

        const videoAsset = entityAssets.find(a => a.assetType === "VIDEO" || a.mimeType?.startsWith("video/"));
        const transcriptAsset = entityAssets.find(a =>
            a.assetType === "DOCUMENT" &&
            (a.fileName?.toLowerCase().includes("transcript") || a.storagePath?.includes("transcript") || a.assetContext === "LESSON_TRANSCRIPT")
        );

        let srcUrl = "";

        if (videoAsset) {
            srcUrl = videoAsset.signedUrl || videoAsset.url || videoAsset.storagePath || srcUrl;
        } else if (activeLesson) {
            const data = activeLesson.lesson || activeLesson;
            const extractedUrl = data?.assets_storage_lessons_content_asset_idToassets_storage?.url
                || data?.contentAsset?.url
                || data?.assets_storage_lessons_content_asset_idToassets_storage?.externalUrl
                || data?.videoUrl
                || data?.lessonAssets?.find((a: any) => a.assetRole === "VIDEO" || a.assetRole === "CONTENT")?.asset?.url
                || data?.lessonContents?.[0]?.blocks?.find((b: any) => b.asset?.url)?.asset?.url
                || lessonPlayerRes?.videoUrl;
            srcUrl = extractedUrl || srcUrl;
        } else if (lessonPlayerRes) {
            srcUrl = lessonPlayerRes?.videoUrl || srcUrl;
        }

        if (!srcUrl) {
            srcUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
        }

        let rawSubtitleUrl = "";

        if (transcriptAsset) {
            rawSubtitleUrl = transcriptAsset.signedUrl || transcriptAsset.url || transcriptAsset.storagePath || rawSubtitleUrl;
        } else if (activeLesson) {
            const data = activeLesson.lesson || activeLesson;
            rawSubtitleUrl = data?.transcriptAsset?.url
                || data?.lessonAssets?.find((a: any) => a.assetRole === "TRANSCRIPT")?.asset?.url
                || data?.subtitleUrl
                || lessonPlayerRes?.transcriptUrl
                || "";
        }

        const finalSubtitleSrc = fetchedSubtitleSrc || rawSubtitleUrl;

        const finalSrc = fetchedVideoSrc || srcUrl || "https://vjs.zencdn.net/v/oceans.mp4";

        return {
            src: finalSrc,
            rawSubtitleUrl: finalSubtitleSrc
        };
    }, [activeLesson, fetchedVideoSrc, fetchedSubtitleSrc, entityAssets, lessonPlayerRes]);

    const [processedTracks, setProcessedTracks] = useState<any[]>([]);

    React.useEffect(() => {
        let isMounted = true;

        const processSubtitle = async () => {
            if (!videoData?.rawSubtitleUrl) {
                if (isMounted) setProcessedTracks([]);
                return;
            }

            const rawUrl = videoData.rawSubtitleUrl;

            if (rawUrl.startsWith('blob:')) {
                if (isMounted) {
                    setProcessedTracks([{
                        kind: 'subtitles',
                        src: rawUrl,
                        label: 'English',
                        language: 'en',
                        default: true
                    }]);
                }
                return;
            }

            try {
                const res = await fetch(rawUrl);
                let text = await res.text();

                const cleanText = text.replace(/^\uFEFF/, '').trim();

                if (!cleanText.startsWith("WEBVTT")) {
                    text = "WEBVTT\n\n" + text.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2");
                }

                const blob = new Blob([text], { type: 'text/vtt' });
                const blobUrl = URL.createObjectURL(blob);

                if (isMounted) {
                    setProcessedTracks([{
                        kind: 'subtitles',
                        src: blobUrl,
                        label: 'English',
                        language: 'en',
                        default: true
                    }]);
                }
            } catch (err) {
                console.warn("Could not process subtitle", err);
                if (isMounted) {
                    setProcessedTracks([{
                        kind: 'subtitles',
                        src: rawUrl,
                        label: 'English',
                        language: 'en',
                        default: true
                    }]);
                }
            }
        };

        processSubtitle();

        return () => { isMounted = false; };
    }, [videoData?.rawSubtitleUrl]);

    const activeCueRef = useRef<string | null>(null);

    const handleVideoProgress = React.useCallback((currentTime: number, duration: number) => {
        videoCurrentTimeRef.current = currentTime;

        // DOM-based transcript highlighting to avoid re-rendering entire CoursePlayer
        if (activeTab === "Transcript" && transcriptCues.length > 0 && transcriptContainerRef.current) {
            const activeIdx = transcriptCues.findIndex((cue, idx) => {
                const nextSecs = idx < transcriptCues.length - 1 ? transcriptCues[idx + 1].seconds : Infinity;
                return currentTime >= cue.seconds && currentTime < nextSecs;
            });
            if (activeIdx !== -1) {
                const activeCue = transcriptCues[activeIdx];
                if (activeCueRef.current !== String(activeCue.id)) {
                    const oldActiveId = activeCueRef.current;
                    activeCueRef.current = String(activeCue.id);

                    // Remove active classes from PREVIOUS cue only (O(1) instead of O(N) querySelectorAll which causes video stutter)
                    if (oldActiveId) {
                        const oldEl = document.getElementById(`cue-${oldActiveId}`);
                        if (oldEl) {
                            oldEl.classList.remove('bg-[#FEF9E7]', 'border-amber-200/60', 'shadow-sm', 'text-gray-900');
                            oldEl.classList.add('hover:bg-gray-50', 'text-gray-700', 'border-transparent');
                            const timeSpan = oldEl.querySelector('.cue-time');
                            if (timeSpan) {
                                timeSpan.classList.remove('text-gray-600', 'font-semibold');
                                timeSpan.classList.add('text-gray-400', 'font-medium');
                            }
                            const textP = oldEl.querySelector('.cue-text');
                            if (textP) {
                                textP.classList.remove('text-gray-950');
                                textP.classList.add('text-gray-700');
                            }
                        }
                    }

                    // Add active classes to current cue
                    const activeEl = document.getElementById(`cue-${activeCue.id}`);
                    if (activeEl) {
                        activeEl.classList.remove('hover:bg-gray-50', 'text-gray-700', 'border-transparent');
                        activeEl.classList.add('bg-[#FEF9E7]', 'border-amber-200/60', 'shadow-sm', 'text-gray-900');
                        const timeSpan = activeEl.querySelector('.cue-time');
                        if (timeSpan) {
                            timeSpan.classList.remove('text-gray-400', 'font-medium');
                            timeSpan.classList.add('text-gray-600', 'font-semibold');
                        }
                        const textP = activeEl.querySelector('.cue-text');
                        if (textP) {
                            textP.classList.remove('text-gray-700');
                            textP.classList.add('text-gray-950');
                        }

                        // Auto-scroll
                        const container = transcriptContainerRef.current;
                        const containerRect = container.getBoundingClientRect();
                        const elementRect = activeEl.getBoundingClientRect();
                        const relativeOffsetTop = elementRect.top - containerRect.top + container.scrollTop;
                        container.scrollTo({
                            top: relativeOffsetTop - (container.clientHeight / 2) + (activeEl.clientHeight / 2),
                            behavior: "smooth"
                        });
                    }
                }
            }
        }

        if (duration > 0) {
            if (currentTime >= duration * 0.9) {
                setIsCurrentLesson90PercentWatched(prev => prev ? prev : true);
            }
            if (activeLesson?.id) {
                setDynamicDurations(prev => {
                    if (prev[activeLesson.id]) return prev;
                    return {
                        ...prev,
                        [activeLesson.id]: Math.ceil(duration / 60)
                    };
                });
            }
        }
    }, [activeLesson?.id, activeTab, transcriptCues]);

    useEffect(() => {
        if (videoCurrentTimeRef.current === 0) {
            activeCueRef.current = null;
        }
    }, [activeTab, transcriptCues]);





    const currentLessonData = activeLesson?.lesson || activeLesson;

    const primaryContentAssetFromEntity = entityAssets.find((a: any) =>
        (a.assetType === "DOCUMENT" || a.assetType === "VIDEO") &&
        (a.storagePath === "content" || a.assetContext === "LESSON_CONTENT" || a.assetContext === "LESSON") &&
        (!a.lessonId || a.lessonId === currentLessonData?.id)
    );
    const transcriptAssetFromEntity = entityAssets.find((a: any) =>
        a.assetType === "DOCUMENT" &&
        (a.fileName?.includes("transcript") || a.storagePath === "transcripts" || a.assetContext === "LESSON_TRANSCRIPT") &&
        (!a.lessonId || a.lessonId === currentLessonData?.id)
    );
    let primaryUrl = "";
    let primaryFileName = "primary-content.pdf";
    const primaryFallback = currentLessonData?.assets_storage_lessons_content_asset_idToassets_storage
        || currentLessonData?.contentAsset
        || currentLessonData?.lessonAssets?.find((a: any) => a.assetRole === "CONTENT" || a.assetRole === "VIDEO")?.asset;

    if (primaryFallback || currentLessonData?.assets_storage_lessons_content_asset_idToassets_storage?.externalUrl || currentLessonData?.videoUrl || currentLessonData?.contentUrl) {
        primaryUrl = primaryFallback?.signedUrl || primaryFallback?.url || primaryFallback?.storagePath || currentLessonData?.assets_storage_lessons_content_asset_idToassets_storage?.externalUrl || currentLessonData?.videoUrl || currentLessonData?.contentUrl || currentLessonData?.lessonContents?.[0]?.blocks?.find((b: any) => b.asset?.url)?.asset?.url || "";
        primaryFileName = primaryFallback?.fileName || primaryFileName;
    } else if (primaryContentAssetFromEntity) {
        primaryUrl = primaryContentAssetFromEntity.signedUrl || primaryContentAssetFromEntity.url || primaryContentAssetFromEntity.storagePath || "";
        primaryFileName = primaryContentAssetFromEntity.fileName || primaryFileName;
    }

    const activeL = (activeLesson as any)?.lesson || activeLesson;
    if (!primaryUrl && activeL) {
        primaryUrl = activeL.pdfUrl || activeL.pptUrl || activeL.fileUrl || activeL.videoUrl || "";
        if (primaryUrl) {
            const isPPT = String(activeL.type || '').toUpperCase().includes('PPT') || String(activeL.title || '').toUpperCase().includes('PPT');
            primaryFileName = `${activeL.title || 'lesson-content'}.${isPPT ? 'pptx' : 'pdf'}`;
        }
    }

    const isVideoFile = (url?: string, fileName?: string) => {
        if (!url && !fileName) return false;
        const cleanUrl = (url || "").split("?")[0].toLowerCase();
        const cleanFile = (fileName || "").toLowerCase();
        const videoExts = [".mp4", ".webm", ".ogg", ".m3u8", ".mov", ".avi", "youtube.com", "vimeo.com", "youtu.be"];
        return videoExts.some(ext => cleanUrl.endsWith(ext) || cleanUrl.includes(ext) || cleanFile.endsWith(ext));
    };

    const entityAttachmentAssets = entityAssets.filter((a: any) =>
        a.assetType === "DOCUMENT" &&
        (!a.lessonId || a.lessonId === currentLessonData?.id)
    );
    const attachmentAssets = entityAttachmentAssets.length > 0
        ? entityAttachmentAssets
        : (currentLessonData?.lessonAssets?.filter((a: any) => a.assetRole === "ATTACHMENT")?.map((a: any) => a.asset) || []);

    const rawAttachments = [
        ...(currentLessonData?.attachments || []).map((att: any) => att.asset || att),
        ...(attachmentAssets || [])
    ];

    const allStudyDocuments = rawAttachments.filter((att: any, index: number, self: any[]) => {
        if (!att) return false;
        const docUrl = att.signedUrl || att.url || att.fileUrl || att.storagePath;
        const docName = att.originalFileName || att.fileName;
        if (!docUrl || isVideoFile(docUrl, docName)) return false;
        return self.findIndex((t: any) => {
            const tUrl = t?.signedUrl || t?.url || t?.fileUrl || t?.storagePath;
            return (t?.id && t?.id === att.id) || (tUrl && tUrl === docUrl);
        }) === index;
    });

    const attachments: LessonAttachment[] = allStudyDocuments.map((rawAtt: any, idx: number) => {
        const att = rawAtt.asset || rawAtt;
        const attUrl = att?.signedUrl || att?.url || att?.fileUrl || att?.storagePath || "#";
        const fileName = att?.originalFileName || att?.fileName || `attachment-${idx + 1}`;
        const ext = fileName.includes(".") ? fileName.split(".").pop()?.toUpperCase() || "FILE" : "FILE";
        const sizeBytes = att?.fileSize || att?.size;
        let sizeText = "Unknown size";
        if (typeof sizeBytes === "number") {
            if (sizeBytes < 1024) sizeText = `${sizeBytes} B`;
            else if (sizeBytes < 1024 * 1024) sizeText = `${Math.round(sizeBytes / 1024)} KB`;
            else sizeText = `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
        }
        return {
            name: fileName,
            type: ext,
            sizeText,
            url: attUrl
        };
    });

    const isPrimaryDoc = primaryUrl && !isVideoFile(primaryUrl, primaryFileName);

    let transcriptUrl = "";
    let transcriptFileName = "transcript.vtt";
    const transcriptFallback = currentLessonData?.assets_storage_lessons_transcript_asset_idToassets_storage
        || currentLessonData?.transcriptAsset
        || currentLessonData?.lessonAssets?.find((a: any) => a.assetRole === "TRANSCRIPT")?.asset;

    if (transcriptFallback || currentLessonData?.subtitleUrl || currentLessonData?.transcriptUrl) {
        transcriptUrl = transcriptFallback?.signedUrl || transcriptFallback?.url || transcriptFallback?.storagePath || currentLessonData?.subtitleUrl || currentLessonData?.transcriptUrl || "";
        transcriptFileName = transcriptFallback?.fileName || transcriptFileName;
    } else if (transcriptAssetFromEntity) {
        transcriptUrl = transcriptAssetFromEntity.signedUrl || transcriptAssetFromEntity.url || transcriptAssetFromEntity.storagePath || "";
        transcriptFileName = transcriptAssetFromEntity.fileName || transcriptFileName;
    }

    useEffect(() => {
        let isMounted = true;
        const loadTranscript = async () => {
            const currentSubtitleUrl = fetchedSubtitleSrc || transcriptUrl;
            if (!currentSubtitleUrl || currentSubtitleUrl === "#" || (!currentSubtitleUrl.startsWith("http") && !currentSubtitleUrl.startsWith("blob"))) {
                if (isMounted) setTranscriptCues(sampleFallbackCues);
                return;
            }
            setIsLoadingTranscript(true);
            try {
                const res = await fetch(currentSubtitleUrl);
                if (res.ok) {
                    const text = await res.text();
                    const parsed = parseTranscriptToCues(text);
                    if (isMounted) {
                        setTranscriptCues(parsed.length > 0 ? parsed : sampleFallbackCues);
                    }
                } else {
                    if (isMounted) setTranscriptCues(sampleFallbackCues);
                }
            } catch (e) {
                console.error("Failed to load transcript:", e);
                if (isMounted) setTranscriptCues(sampleFallbackCues);
            } finally {
                if (isMounted) setIsLoadingTranscript(false);
            }
        };
        loadTranscript();
        return () => { isMounted = false; };
    }, [fetchedSubtitleSrc, transcriptUrl]);

    if (isLoadingLessons || isLoadingEnrolled) {
        return (
            <div className="min-h-screen bg-white flex flex-col font-sans">
                {/* Header Skeleton */}
                <header className="h-[72px] border-b border-gray-200 px-6 flex items-center justify-between bg-white shrink-0">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-9 w-9 rounded-full" />
                        <Skeleton className="h-5 w-48" />
                    </div>
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-2 w-36 rounded-full" />
                        <Skeleton className="h-8 w-24 rounded-full" />
                    </div>
                </header>

                {/* Workspace Split Layout Skeleton */}
                <div className="flex flex-col lg:flex-row flex-1 overflow-hidden h-[calc(100vh-72px)] bg-white">
                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto">
                        {/* Title and Action Buttons */}
                        <div className="space-y-3">
                            <Skeleton className="h-3 w-28" />
                            <Skeleton className="h-8 w-3/4 max-w-lg" />
                            <div className="flex gap-2 pt-2">
                                <Skeleton className="h-8 w-24 rounded-full" />
                                <Skeleton className="h-8 w-20 rounded-full" />
                            </div>
                        </div>

                        {/* 16:9 Video Player Box Skeleton */}
                        <Skeleton className="w-full aspect-video rounded-2xl" />

                        {/* Tabs Bar Skeleton */}
                        <div className="flex gap-6 border-b border-gray-200 pb-2">
                            <Skeleton className="h-5 w-20" />
                            <Skeleton className="h-5 w-20" />
                            <Skeleton className="h-5 w-20" />
                            <Skeleton className="h-5 w-20" />
                        </div>

                        {/* Tab Content Box Skeleton */}
                        <div className="space-y-3 pt-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                            <Skeleton className="h-4 w-2/3" />
                        </div>
                    </div>

                    {/* Right Playlist Sidebar Skeleton */}
                    <div className="w-full lg:w-[360px] shrink-0 border-t lg:border-t-0 lg:border-l border-gray-200 p-6 space-y-4 bg-gray-50/50">
                        <div className="flex justify-between items-center">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-16" />
                        </div>
                        <div className="space-y-3">
                            {[1, 2, 3, 4, 5, 6].map((k) => (
                                <div key={k} className="p-3 bg-white border border-gray-200 rounded-xl flex items-center gap-3">
                                    <Skeleton className="w-14 h-10 rounded-lg shrink-0" />
                                    <div className="flex-1 space-y-1.5">
                                        <Skeleton className="h-3.5 w-full" />
                                        <Skeleton className="h-2.5 w-20" />
                                    </div>
                                    <Skeleton className="w-5 h-5 rounded-full shrink-0" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const handleCueClick = (seconds: number) => {
        if (playerRef.current) {
            if (typeof playerRef.current.currentTime === 'function') {
                playerRef.current.currentTime(seconds);
            } else {
                playerRef.current.currentTime = seconds;
            }
            if (typeof playerRef.current.play === 'function') {
                playerRef.current.play();
            } else if (playerRef.current.play) {
                playerRef.current.play();
            }
        }
    };

    const getInitialActiveCueId = () => {
        const currentTime = videoCurrentTimeRef.current;
        if (currentTime > 0 && transcriptCues.length > 0) {
            const activeIdx = transcriptCues.findIndex((cue, idx) => {
                const nextSecs = idx < transcriptCues.length - 1 ? transcriptCues[idx + 1].seconds : Infinity;
                return currentTime >= cue.seconds && currentTime < nextSecs;
            });
            if (activeIdx !== -1) {
                activeCueRef.current = String(transcriptCues[activeIdx].id);
                return transcriptCues[activeIdx].id;
            }
        }
        return null;
    };

    const handleDownloadFile = async (url: string, filename: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error("Error downloading file", error);
            window.open(url, '_blank');
        }
    };

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900 antialiased flex flex-col">

            {/* =========================================================
          1. TOP NAVBAR HEADER
         ========================================================= */}
            <header className="h-[72px] mb-4 border-b border-slate-200 px-6 flex items-center justify-between shrink-0 select-none bg-white shadow-xs">
                <div className="flex items-center gap-3 sm:gap-4">
                    {/* Primary Back Button */}
                    <button
                        type="button"
                        onClick={() => {
                            if (careerPathId) navigate(`/course-details?id=${careerPathId}&type=career-path`);
                            else if (courseId) navigate(`/course-details?id=${courseId}&type=course`);
                            else if (lessonId) navigate(`/course-details?id=${lessonId}&type=lesson`);
                            else if (window.history.length > 1) navigate(-1);
                            else navigate('/member-learning');
                        }}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs group"
                        title="Back to Course Details"
                    >
                        <ArrowLeft className="w-4 h-4 text-slate-600 group-hover:-translate-x-0.5 transition-transform" />
                        <span className="font-semibold">Back</span>
                    </button>

                    <div className="w-9.5 h-9.5 bg-[#141414] rounded-lg flex items-center justify-center font-black text-[12px] text-white tracking-tighter shrink-0">
                        <Play className="w-3.5 h-3.5 fill-current" />
                    </div>
                    <span className="text-[17px] sm:text-[20px] font-bold font-weight-700 text-[#141414] tracking-tight truncate max-w-[200px] sm:max-w-md lg:max-w-xl">{courseData?.title || activeLesson?.title}</span>
                </div>

                <div className="flex items-center gap-6">
                    {/* Header Progress Indicator */}
                    <div className="hidden sm:flex items-center justify-end gap-4">
                        <div className="w-[180px] bg-[#1111111a] h-[6px] rounded-full overflow-hidden">
                            <div className="bg-(--c-sage) h-[6px] rounded-full transition-all duration-500" style={{ width: `${displayProgress}%` }} />
                        </div>
                        <span className="text-[16px] font-bold font-weight-700 text-[#141414] font-sans">{displayProgress}%</span>
                    </div>

                    {/* Offline Watch Mode Toggle */}
                    <button
                        type="button"
                        onClick={() => {
                            setIsOfflinePlaybackActive(!isOfflinePlaybackActive);
                            setOfflineToast(!isOfflinePlaybackActive ? "Offline Watch Mode Active (Playing from local cached storage)" : "Switched to Online Streaming Mode");
                            setTimeout(() => setOfflineToast(null), 3500);
                        }}
                        className={`border font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                            isOfflinePlaybackActive
                                ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 shadow-2xs"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                        title="Toggle Offline Playback Mode"
                    >
                        {isOfflinePlaybackActive ? (
                            <>
                                <WifiOff className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Offline Mode: ON</span>
                            </>
                        ) : (
                            <>
                                <Wifi className="w-3.5 h-3.5 text-slate-400" />
                                <span>Offline Watch</span>
                            </>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            if (careerPathId) navigate(`/course-details?id=${careerPathId}&type=career-path`);
                            else if (courseId) navigate(`/course-details?id=${courseId}&type=course`);
                            else if (lessonId) navigate(`/course-details?id=${lessonId}&type=lesson`);
                            else navigate('/member-learning');
                        }}
                        className="border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs group">
                        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                        <span>Back to Course</span>
                    </button>
                </div>
            </header>

            {/* =========================================================
          CORE SPLIT WORKSPACE WINDOW CONTAINER
         ========================================================= */}
            <div className="flex flex-col flex-1 overflow-hidden h-[calc(100vh-72px)] bg-white relative">

                {/* 1. TOP TITLE AND ACTIONS BLOCK (FULL WIDTH) */}
                <div className="w-full  shrink-0 z-10 bg-white flex justify-between items-end ">
                    <div className="">
                        <div className="flex items-center gap-2 mb-1.5">
                            <button
                                type="button"
                                onClick={() => {
                                    if (courseId) navigate(`/course-details?id=${courseId}&type=course`);
                                    else if (careerPathId) navigate(`/course-details?id=${careerPathId}&type=career-path`);
                                    else if (window.history.length > 1) navigate(-1);
                                    else navigate('/member-learning');
                                }}
                                className="text-[12px] font-semibold text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors cursor-pointer group"
                            >
                                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                                <span>Back to course details</span>
                            </button>
                            <span className="text-slate-300">•</span>
                            <span className="text-[12px] font-bold text-[#5c5c5c] uppercase tracking-widest block font-sans">
                                LESSON {playlist.findIndex((l: any) => l.id === activeLesson?.id) + 1} OF {playlist.length}
                            </span>
                        </div>
                        <h1 className="text-[24px] font-bold text-[#141414]  tracking-tight leading-tight">
                            {activeLesson?.title || "Loading Lesson..."}
                        </h1>
                        <div className="flex items-center gap-2.5 pt-4">
                            <button
                                onClick={() => {
                                    const targetCourseId = courseId || activeLesson?.lesson?.courseId || (activeLesson as any)?.courseId || (activeLesson as any)?._parentCourse?.id;
                                    const currentSelectedLessonId = activeLesson?.id || lessonId;

                                    if (targetCourseId) {
                                        navigate(`/course-details?id=${targetCourseId}&type=course${currentSelectedLessonId ? `&lessonId=${currentSelectedLessonId}` : ''}${careerPathId ? `&careerPathId=${careerPathId}` : ''}`, {
                                            state: { scrollToResources: true, selectedLessonId: currentSelectedLessonId }
                                        });
                                    } else if (careerPathId) {
                                        navigate(`/course-details?id=${careerPathId}&type=career-path`, {
                                            state: { scrollToResources: true }
                                        });
                                    } else if (currentSelectedLessonId) {
                                        navigate(`/course-details?id=${currentSelectedLessonId}&type=lesson`, {
                                            state: { scrollToResources: true, selectedLessonId: currentSelectedLessonId }
                                        });
                                    } else {
                                        navigate('/course-details');
                                    }
                                }}
                                className="border border-(--line-strong) hover:border-[#141414] hover:bg-gray-50 text-[#141414] font-medium text-[14px] px-3.5 py-2 rounded-full transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                                <FileText className="w-[13px] h-[13px]" />
                                Resources
                            </button>
                            <button
                                onClick={() => setIsShareModalOpen(true)}
                                className="border border-(--line-strong) hover:border-[#141414] hover:bg-gray-50 text-[#141414] font-medium text-[14px] px-3.5 py-2 rounded-full transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                                <Share2 className="w-[13px] h-[13px]" />
                                Share
                            </button>
                            <button
                                onClick={handleToggleCurrentLessonOffline}
                                className={`border font-medium text-[13px] px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
                                    isCurrentLessonOffline
                                        ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                                        : "border-(--line-strong) hover:border-[#141414] hover:bg-gray-50 text-[#141414]"
                                }`}
                            >
                                {isCurrentLessonOffline ? (
                                    <>
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>Saved for Offline Watch</span>
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-3.5 h-3.5 text-slate-600" />
                                        <span>Save for Offline Watch</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                    {isCurrentLessonQuiz ? (
                        <div className="flex items-center gap-3 pb-1 flex-wrap">
                            <span className="text-[11px] font-bold text-[#5c5c5c] uppercase tracking-widest font-sans">EVALUATION MODE</span>
                            <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border ${
                                isPreQuiz
                                    ? "bg-purple-100 text-purple-800 border-purple-200"
                                    : "bg-emerald-100 text-emerald-800 border-emerald-200"
                            }`}>
                                {isPreQuiz ? <HelpCircle className="w-3.5 h-3.5 text-purple-700" /> : <Award className="w-3.5 h-3.5 text-emerald-700" />}
                                <span>{isPreQuiz ? "Pre-Course Diagnostic Checkpoint" : "Post-Course Certification Mastery Exam"}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 pb-1 flex-wrap">
                            <span className="text-[11px] font-bold text-[#5c5c5c] uppercase tracking-widest font-sans">VIEW MODE</span>
                            <div className="flex bg-[#f5f5f5] rounded-full p-1 border border-(--line)">
                            <button
                                onClick={() => setMediaType('video')}
                                className={`px-4 py-[7px] text-[12px] font-bold rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${mediaType === 'video' ? 'bg-(--c-honey) text-[#141414] shadow-sm shadow-(--c-honey)/80' : 'text-[#5c5c5c] hover:text-[#141414]'}`}
                            >
                                <Play className="w-[13px] h-[13px]" />
                                <span>Video Player</span>
                            </button>
                            <button
                                onClick={() => setMediaType('document')}
                                className={`px-4 py-[7px] text-[12px] font-bold rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${mediaType === 'document' ? 'bg-(--c-honey) text-[#141414] shadow-sm shadow-(--c-honey)/80' : 'text-[#5c5c5c] hover:text-[#141414]'}`}
                            >
                                {activeLesson?.type === 'PDF' ? (
                                    <>
                                        <FileText className="w-[13px] h-[13px] text-rose-600" />
                                        <span>PDF SOP Guide</span>
                                    </>
                                ) : activeLesson?.type === 'PPT' ? (
                                    <>
                                        <Presentation className="w-[13px] h-[13px] text-amber-600" />
                                        <span>PPT Slide Deck</span>
                                    </>
                                ) : (
                                    <>
                                        <FileText className="w-[13px] h-[13px]" />
                                        <span>Document / Deck</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                    )}
                </div>

                <div className="flex flex-1 overflow-hidden relative">
                    {/* =========================================================
                2. MAIN CONTENT PLAYER AREA (LEFT COLUMN)
               ========================================================= */}
                    <main className="flex-1  lg:py-8 overflow-y-auto lg:max-w-[calc(100%-360px)] custom-scrollbar">

                        {/* In-Player Assessment Card for Pre-Quiz & Post-Quiz */}
                        {isCurrentLessonQuiz ? (
                            <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-md overflow-hidden mb-4">
                                {/* Hero Assessment Header with Gradient */}
                                <div className={`p-6 sm:p-8 text-white relative overflow-hidden ${
                                    isPreQuiz 
                                        ? "bg-gradient-to-r from-purple-700 via-indigo-700 to-indigo-800"
                                        : "bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800"
                                }`}>
                                    <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full bg-white/10 blur-xl pointer-events-none" />
                                    <div className="absolute right-12 -bottom-10 w-36 h-36 rounded-full bg-white/10 blur-lg pointer-events-none" />

                                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="flex items-start gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center shrink-0 shadow-inner">
                                                {isPreQuiz ? (
                                                    <HelpCircle className="w-7 h-7 text-white" />
                                                ) : (
                                                    <Award className="w-7 h-7 text-white" />
                                                )}
                                            </div>
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 text-white border border-white/20 backdrop-blur-xs">
                                                        {isPreQuiz ? "Module 1 · Diagnostic Baseline" : "Final Module · Certification Exam"}
                                                    </span>
                                                    <span className="text-[11px] font-semibold text-white/80">
                                                        10 Questions · 10 Minutes · 70% to Pass
                                                    </span>
                                                </div>
                                                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                                                    {activeLesson?.title || (isPreQuiz ? "Pre-Course Diagnostic Assessment" : "Post-Course Certification Assessment")}
                                                </h2>
                                                <p className="text-xs sm:text-sm text-white/85 max-w-2xl leading-relaxed">
                                                    {isPreQuiz
                                                        ? "Evaluate your foundational baseline knowledge on chemical safety, PPE usage, and operational guidelines before proceeding to standard operating procedure video lessons."
                                                        : "Demonstrate comprehensive operational mastery across all video SOPs, sanitization protocols, and safety standards to earn your verified course certificate."}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="shrink-0 flex md:flex-col items-center md:items-end justify-between gap-2 border-t md:border-t-0 border-white/15 pt-3 md:pt-0">
                                            <div className="text-right">
                                                <span className="text-[10px] uppercase font-bold text-white/70 block">Current Status</span>
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shadow-xs ${
                                                    completedLessons.includes(String(activeLesson?.id)) || hasPassedQuiz
                                                        ? "bg-emerald-400 text-emerald-950"
                                                        : "bg-amber-300 text-amber-950"
                                                }`}>
                                                    {completedLessons.includes(String(activeLesson?.id)) || hasPassedQuiz ? (
                                                        <>
                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                            <span>Completed & Passed</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Clock className="w-3.5 h-3.5" />
                                                            <span>Required to Complete</span>
                                                        </>
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Assessment Specs Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5 sm:p-6 bg-slate-50 border-b border-slate-200">
                                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
                                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Question Count</span>
                                        <span className="text-base font-black text-slate-800">10 Questions</span>
                                        <span className="text-[11px] text-slate-500 block mt-0.5">Multiple Choice Format</span>
                                    </div>
                                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
                                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Passing Threshold</span>
                                        <span className="text-base font-black text-emerald-600">70% Required</span>
                                        <span className="text-[11px] text-slate-500 block mt-0.5">Automated Scoring</span>
                                    </div>
                                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
                                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Time Allowance</span>
                                        <span className="text-base font-black text-slate-800">10 Minutes</span>
                                        <span className="text-[11px] text-slate-500 block mt-0.5">Paced Assessment</span>
                                    </div>
                                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
                                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Credential Result</span>
                                        <span className="text-base font-black text-indigo-600">{isPreQuiz ? "Baseline Saved" : "Digital Certificate"}</span>
                                        <span className="text-[11px] text-slate-500 block mt-0.5">{isPreQuiz ? "Unlocks Lessons" : "Verifiable Credential"}</span>
                                    </div>
                                </div>

                                {/* Content Body & Action Buttons */}
                                <div className="p-6 sm:p-8 space-y-6">
                                    {completedLessons.includes(String(activeLesson?.id)) || hasPassedQuiz ? (
                                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0 text-emerald-700">
                                                    <CheckCircle2 className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h4 className="text-base font-black text-emerald-900">
                                                        {isPreQuiz ? "Diagnostic Baseline Successfully Completed!" : "Certification Exam Passed — Mastery Achieved! 🎉"}
                                                    </h4>
                                                    <p className="text-xs sm:text-sm text-emerald-700 mt-0.5">
                                                        {isPreQuiz 
                                                            ? "Your diagnostic score has been recorded. All video SOP training modules and document manuals are unlocked." 
                                                            : "Congratulations! You scored 90% and satisfied all certification criteria for this course."}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
                                                {isPreQuiz ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const currentIndex = playlist.findIndex((l: any) => l.id === activeLesson?.id);
                                                            if (currentIndex !== -1 && currentIndex < playlist.length - 1) {
                                                                const nextLesson = playlist[currentIndex + 1];
                                                                navigate(`/course-player?careerPathId=${careerPathId || ''}&courseId=${courseId || ''}&lessonId=${nextLesson.id}`);
                                                            }
                                                        }}
                                                        className="w-full sm:w-auto px-5 py-3 rounded-xl font-black text-sm bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                                                    >
                                                        <span>Continue to Video SOPs</span>
                                                        <ArrowRight className="w-4 h-4" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/certificate-detail?courseId=${courseId || ''}`)}
                                                        className="w-full sm:w-auto px-5 py-3 rounded-xl font-black text-sm bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                                                    >
                                                        <Award className="w-4 h-4" />
                                                        <span>View Verified Certificate</span>
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`/quiz-start-warning?careerPathId=${careerPathId || ''}&courseId=${courseId || ''}&lessonId=${activeLesson?.id || ''}&retake=true`)}
                                                    className="px-4 py-3 rounded-xl font-bold text-xs bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
                                                >
                                                    Retake
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                                                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                                                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                                                    Assessment Instructions & Guidelines
                                                </h4>
                                                <ul className="text-xs sm:text-sm text-slate-600 space-y-2 list-disc list-inside">
                                                    <li>Ensure an uninterrupted connection during the 10-minute assessment window.</li>
                                                    <li>Each question contains multiple-choice operational options based on Nexus safety standards.</li>
                                                    <li>You must achieve at least <strong>70% correct answers</strong> to pass the evaluation.</li>
                                                    <li>Unlimited retakes are permitted if the minimum threshold is not achieved on the first attempt.</li>
                                                </ul>
                                            </div>

                                            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        navigate(`/quiz-start-warning?careerPathId=${careerPathId || ''}&courseId=${courseId || ''}&lessonId=${activeLesson?.id || ''}`);
                                                    }}
                                                    className={`w-full sm:w-auto px-7 py-3.5 rounded-xl font-black text-sm text-white transition-all shadow-lg flex items-center justify-center gap-2.5 cursor-pointer ${
                                                        isPreQuiz
                                                            ? "bg-purple-600 hover:bg-purple-700 shadow-purple-600/30"
                                                            : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30"
                                                    }`}
                                                >
                                                    <span>{isPreQuiz ? "Begin Pre-Course Diagnostic Assessment" : "Begin Final Certification Assessment"}</span>
                                                    <ArrowRight className="w-4 h-4" />
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        const idStr = String(activeLesson?.id);
                                                        if (!completedLessons.includes(idStr)) {
                                                            const updated = [...completedLessons, idStr];
                                                            setCompletedLessons(updated);
                                                            try {
                                                                localStorage.setItem(storageKey, JSON.stringify(updated));
                                                            } catch {}
                                                            try {
                                                                await progressApi.completeLesson(idStr);
                                                            } catch {}
                                                        }
                                                        if (isPreQuiz) {
                                                            const currentIndex = playlist.findIndex((l: any) => l.id === activeLesson?.id);
                                                            if (currentIndex !== -1 && currentIndex < playlist.length - 1) {
                                                                const nextLesson = playlist[currentIndex + 1];
                                                                navigate(`/course-player?careerPathId=${careerPathId || ''}&courseId=${courseId || ''}&lessonId=${nextLesson.id}`);
                                                            }
                                                        } else {
                                                            navigate(`/certificate-detail?courseId=${courseId || ''}`);
                                                        }
                                                    }}
                                                    className="w-full sm:w-auto px-4 py-3.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
                                                    title="Instant validation for demo & testing"
                                                >
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                    <span>Quick Pass & Continue</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                        <div
                            className={`w-full rounded-xl overflow-hidden relative group ${mediaType === 'video' ? '' : 'bg-gray-100 p-4 sm:p-8 shadow-inner'}`}
                            style={mediaType === 'video' ? {} : { boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)" }}
                        >
                            {mediaType === 'video' ? (
                                videoData && videoData.src ? (<>
                                    <VideoPlayer
                                        key="video-player"
                                        isAlreadyCompleted={isUnenrolled || completedLessons.includes(String(activeLesson?.id))}
                                        disableSync={isUnenrolled}
                                        src={videoData.src}
                                        tracks={processedTracks}
                                        title={activeLesson?.title || "Video"}
                                        lessonId={isUnenrolled ? undefined : activeLesson?.id?.toString()}
                                        courseId={isUnenrolled ? undefined : (courseId || undefined)}
                                        careerPathId={isUnenrolled ? undefined : (careerPathId || undefined)}
                                        lastAccessedPosition={isUnenrolled ? 0 : (activeLesson?.lesson?.userProgress?.lastPositionSec || (activeLesson as any)?.userProgress?.lastPositionSec || activeLesson?.lesson?.userProgress?.lastPositionSecs || (activeLesson as any)?.userProgress?.lastPositionSecs || activeLesson?.lesson?.userProgress?.maxTimeWatched || (activeLesson as any)?.userProgress?.maxTimeWatched || 0)}
                                        blockFastForward={!isUnenrolled && !isVideoFastForwardAllowed}
                                        videoPlayerFastForward={isVideoFastForwardAllowed}
                                        onProgress={handleVideoProgress}
                                        onEnded={() => {
                                            if (!isUnenrolled && autoplay) {
                                                handleContinue();
                                            }
                                        }}
                                        onReady={(player) => { playerRef.current = player; }}
                                    />
                                    {/* Offline Video Watch Status Bar */}
                                    <div className="mt-3 bg-slate-50 border border-slate-200/90 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                        <div className="flex items-center gap-2.5">
                                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isCurrentLessonOffline ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                                                {isCurrentLessonOffline ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Download className="w-4 h-4 text-slate-600" />}
                                            </div>
                                            <div>
                                                <span className="font-bold text-slate-900 block leading-tight">
                                                    {isCurrentLessonOffline ? "Offline Video Watch Active" : "Available for Offline Watching"}
                                                </span>
                                                <span className="text-[11px] text-slate-500">
                                                    {isCurrentLessonOffline ? "Video SOP cached locally. You can play this offline without internet connection." : "Save this video SOP to your device for offline training."}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                type="button"
                                                onClick={handleToggleCurrentLessonOffline}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                                    isCurrentLessonOffline
                                                        ? "bg-white text-emerald-700 border border-emerald-300 hover:bg-emerald-50"
                                                        : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs"
                                                }`}
                                            >
                                                {isCurrentLessonOffline ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                                                <span>{isCurrentLessonOffline ? "Offline Ready ✓" : "Download Video"}</span>
                                            </button>
                                            <a
                                                href={videoData.src}
                                                download={`SOP_${activeLesson?.id || 'video'}.mp4`}
                                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1 shadow-2xs"
                                            >
                                                <ExternalLink className="w-3 h-3" />
                                                <span>Save File</span>
                                            </a>
                                        </div>
                                    </div>
                                </>) : (
                                    <div className="aspect-video w-full flex items-center justify-center text-gray-500">
                                        No video content available
                                    </div>
                                )
                            ) : (
                                /* ==================== STUDY CONTENT & INTERACTIVE MEDIA VIEWERS ==================== */
                                <div className="relative">
                                    {/* Dedicated Interactive PDF & PPT Presentation Viewer */}
                                    {(() => {
                                        const curL = (activeLesson as any)?.lesson || activeLesson;
                                        const lTitle = String(curL?.title || '').toLowerCase();
                                        const lType = String(curL?.type || curL?.lessonType || '').toLowerCase();
                                        const isPdf = lTitle.includes('pdf') || lType.includes('pdf');
                                        const isPpt = lTitle.includes('ppt') || lTitle.includes('slide') || lTitle.includes('presentation') || lType.includes('ppt');

                                        const pdfPages = [
                                            {
                                                pageNumber: 1,
                                                title: "Standard Operating Guidelines & Chemical Dilution Standards",
                                                section: "SECTION 1 · CORE CHEMICAL & PPE COMPLIANCE",
                                                summary: "Approved workplace methodologies, chemical dilution ratios, equipment safety checks, and step-by-step infection control protocols.",
                                                items: [
                                                    { label: "1. Mandatory PPE & Safety Cautions", text: "Nitrile gloves, safety eyewear, slip-resistant footwear, and proper ventilation." },
                                                    { label: "2. Chemical Dilution Standards", text: "Cold-water mixing only, calibrated dosing dispensers, and COSHH compliance labeling." },
                                                    { label: "3. Dwell Time Requirements", text: "Minimum 10-minute dwell time for active hospital-grade disinfectant solution." },
                                                    { label: "4. Cross-Contamination Barrier", text: "Strict four-color cloth separation across sanitary, pantry, and desk zones." }
                                                ]
                                            },
                                            {
                                                pageNumber: 2,
                                                title: "Procedural Execution Sequence & Equipment Checklist",
                                                section: "SECTION 2 · MECHANICAL & HAND PROCEDURES",
                                                summary: "Step-by-step manual and mechanical execution sequences to achieve optimal surface cleanliness without damaging delicate fixtures or flooring.",
                                                items: [
                                                    { label: "1. Pre-Operational Machinery Check", text: "Cable insulation integrity, safety triggers, pad alignment, and fluid reservoir levels." },
                                                    { label: "2. Systematic Sweeping Sequence", text: "Work from furthest corner toward room exit in continuous overlapping passes." },
                                                    { label: "3. Spot Stain Neutralization", text: "Enzyme-based spot treatment applied directly; blot dry with microfiber towel." },
                                                    { label: "4. Post-Pass Dry Buffing", text: "High-speed burnish pass to restore shine and seal protective surface emulsion." }
                                                ]
                                            },
                                            {
                                                pageNumber: 3,
                                                title: "Supervisory Audit, Verification & Quality Sign-Off",
                                                section: "SECTION 3 · AUDIT & LOGBOOK PROTOCOLS",
                                                summary: "Criteria used by facility supervisors to verify compliance with Nexus Academy quality standards before granting module sign-off.",
                                                items: [
                                                    { label: "1. Visual & UV Glow Inspection", text: "Surface blacklight verification check on 5 random high-touch test points." },
                                                    { label: "2. Odor & Residue Clearance", text: "Zero chemical residue or overpowering fragrance permitted in shared workspaces." },
                                                    { label: "3. Waste Management Hand-Off", text: "Triple-bagged sanitary waste handed over to licensed corporate disposal handlers." },
                                                    { label: "4. Digital Logbook Authentication", text: "Immediate logging into LMS mobile scanner with supervisor counter-signature." }
                                                ]
                                            }
                                        ];

                                        const pptSlides = [
                                            {
                                                title: "Core Operational Standards & Scope",
                                                tag: "Introduction & Standards",
                                                bullets: [
                                                    "Mandatory standard operating procedures for workplace safety and infection prevention.",
                                                    "Compliance with facility hygiene certifications and regulatory environmental standards.",
                                                    "Daily check-in sequence and preparation of personal protective equipment (PPE)."
                                                ],
                                                keyNote: "Rule 1: Always verify equipment and chemical safety cards before initiating any module."
                                            },
                                            {
                                                title: "Equipment Handling & Machinery Preparation",
                                                tag: "Operation & Setup",
                                                bullets: [
                                                    "Pre-operational safety inspection: inspect cables, switches, safety lockouts, and emergency stop.",
                                                    "Correct pad installation, tank fluid levels, and electrical grounding inspection.",
                                                    "Proper ergonomics: handle height adjustment and maintaining balanced posture during usage."
                                                ],
                                                keyNote: "Never leave running machinery unattended. Disconnect power during pad or chemical changes."
                                            },
                                            {
                                                title: "Chemical Dilution Ratios & Color-Coded System",
                                                tag: "Chemical Safety & Hygiene",
                                                bullets: [
                                                    "Blue Cloth: Desks, administrative areas, meeting rooms, and common touchpoints.",
                                                    "Red Cloth: High-risk sanitary restroom areas and waste receptacle containment.",
                                                    "Yellow Cloth: Food preparation zones, pantries, coffee stations, and cafeteria seating.",
                                                    "Green Cloth: Heavy traffic flooring, outdoor glass entryways, and warehouse passages."
                                                ],
                                                keyNote: "Strict 10-minute surface contact dwell time required for complete microbial inactivation."
                                            },
                                            {
                                                title: "Step-by-Step Procedural Execution Sequence",
                                                tag: "Execution Standards",
                                                bullets: [
                                                    "Phase 1: Surface dry dusting and physical debris removal in S-motion sweep.",
                                                    "Phase 2: Spray dilution application following calibrated dispensing ratios.",
                                                    "Phase 3: Mechanical buffing / microfiber scrubbing pass with overlapping strokes.",
                                                    "Phase 4: Inspection for streaks, residue, spot discoloration, or lingering moisture."
                                                ],
                                                keyNote: "Maintain clean transition corridors and set up high-visibility hazard warning cones."
                                            },
                                            {
                                                title: "Supervisory Quality Audit & Verification Protocol",
                                                tag: "Sign-Off & Accreditation",
                                                bullets: [
                                                    "Supervisory visual inspection and ultraviolet sanitization verification check.",
                                                    "Completion of digital operational logbook with timestamp and operator verification ID.",
                                                    "Restocking of consumable items and proper chemical containment storage in ventilated locker."
                                                ],
                                                keyNote: "100% compliance score required on audit checklist before moving to the next course milestone."
                                            }
                                        ];

                                        if (isPdf) {
                                            const currentPage = pdfPages[pdfPageIndex] || pdfPages[0];
                                            return (
                                                <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-6 sm:p-8 space-y-6">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                                                        <div className="flex items-center gap-3.5">
                                                            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0 shadow-sm">
                                                                <FileText className="w-6 h-6" />
                                                            </div>
                                                            <div>
                                                                <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200/60 inline-block mb-1">
                                                                    Operational SOP Manual · PDF Document
                                                                </span>
                                                                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                                                                    {activeLesson?.title || "Operational Manual (PDF)"}
                                                                </h3>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                                                            <button
                                                                type="button"
                                                                onClick={handleToggleCurrentLessonOffline}
                                                                className={`font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs border ${
                                                                    isCurrentLessonOffline
                                                                        ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                                                                        : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
                                                                }`}
                                                            >
                                                                {isCurrentLessonOffline ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Download className="w-3.5 h-3.5 text-slate-500" />}
                                                                <span>{isCurrentLessonOffline ? "Offline PDF Ready" : "Save for Offline"}</span>
                                                            </button>
                                                            <a
                                                                href={primaryUrl || "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs"
                                                            >
                                                                <ExternalLink className="w-3.5 h-3.5" />
                                                                <span>Open Fullscreen</span>
                                                            </a>
                                                            <a
                                                                href={primaryUrl || "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"}
                                                                download
                                                                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                                                            >
                                                                <Download className="w-3.5 h-3.5" />
                                                                <span>Download PDF</span>
                                                            </a>
                                                        </div>
                                                    </div>

                                                    {/* Interactive Multi-Page Document Reader Card */}
                                                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
                                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 pb-3 border-b border-slate-100">
                                                            <span className="font-bold text-rose-600 tracking-wide uppercase">{currentPage.section}</span>
                                                            <div className="flex items-center gap-3">
                                                                <span className="font-semibold text-slate-700">Page {currentPage.pageNumber} of {pdfPages.length}</span>
                                                                <div className="flex items-center gap-1">
                                                                    <button
                                                                        type="button"
                                                                        disabled={pdfPageIndex === 0}
                                                                        onClick={() => setPdfPageIndex(p => Math.max(0, p - 1))}
                                                                        className="p-1 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed text-slate-700"
                                                                    >
                                                                        <ArrowLeft className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        disabled={pdfPageIndex >= pdfPages.length - 1}
                                                                        onClick={() => setPdfPageIndex(p => Math.min(pdfPages.length - 1, p + 1))}
                                                                        className="p-1 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed text-slate-700"
                                                                    >
                                                                        <ArrowRight className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-4 text-slate-700 text-sm">
                                                            <h4 className="text-lg font-bold text-slate-900">{currentPage.title}</h4>
                                                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{currentPage.summary}</p>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
                                                                {currentPage.items.map((item, idx) => (
                                                                    <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                                                                        <span className="text-xs font-bold text-slate-900 block">{item.label}</span>
                                                                        <span className="text-xs text-slate-600 block leading-relaxed">{item.text}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
                                                            <div className="flex items-center gap-2">
                                                                {pdfPages.map((p, idx) => (
                                                                    <button
                                                                        key={idx}
                                                                        type="button"
                                                                        onClick={() => setPdfPageIndex(idx)}
                                                                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${pdfPageIndex === idx ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                                                    >
                                                                        Page {p.pageNumber}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                            <span className="font-bold text-emerald-600 flex items-center gap-1">
                                                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Complete Reading to Progress
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        if (isPpt) {
                                            const currentSlide = pptSlides[pptSlideIndex] || pptSlides[0];
                                            return (
                                                <div className="bg-slate-900 text-white border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                                                        <div className="flex items-center gap-3.5">
                                                            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-sm">
                                                                <Presentation className="w-6 h-6" />
                                                            </div>
                                                            <div>
                                                                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20 inline-block mb-1">
                                                                    Training Slide Deck · PowerPoint Presentation
                                                                </span>
                                                                <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                                                                    {activeLesson?.title || "Presentation Slides (PPT)"}
                                                                </h3>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                                                            <button
                                                                type="button"
                                                                onClick={handleToggleCurrentLessonOffline}
                                                                className={`font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs border ${
                                                                    isCurrentLessonOffline
                                                                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
                                                                        : "bg-white/10 hover:bg-white/20 text-white border border-white/15"
                                                                }`}
                                                            >
                                                                {isCurrentLessonOffline ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5 text-white/70" />}
                                                                <span>{isCurrentLessonOffline ? "Offline PPT Ready" : "Save for Offline"}</span>
                                                            </button>
                                                            <a
                                                                href={primaryUrl || "https://file-examples.com/storage/fe55523a1e6490db0285a73/2017/08/file_example_PPT_250kB.ppt"}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="bg-white/10 hover:bg-white/20 text-white border border-white/15 font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs"
                                                            >
                                                                <ExternalLink className="w-3.5 h-3.5" />
                                                                <span>Present Fullscreen</span>
                                                            </a>
                                                            <a
                                                                href={primaryUrl || "https://file-examples.com/storage/fe55523a1e6490db0285a73/2017/08/file_example_PPT_250kB.ppt"}
                                                                download
                                                                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                                                            >
                                                                <Download className="w-3.5 h-3.5" />
                                                                <span>Download PPTX</span>
                                                            </a>
                                                        </div>
                                                    </div>

                                                    {/* Interactive Slide Canvas Area */}
                                                    <div className="bg-slate-950 rounded-xl border border-slate-800 p-6 sm:p-10 space-y-6">
                                                        <div className="flex items-center justify-between text-xs text-slate-400 pb-3 border-b border-slate-800">
                                                            <span className="text-amber-400 font-bold uppercase tracking-wider">Slide {pptSlideIndex + 1} of {pptSlides.length} · {currentSlide.tag}</span>
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    type="button"
                                                                    disabled={pptSlideIndex === 0}
                                                                    onClick={() => setPptSlideIndex(s => Math.max(0, s - 1))}
                                                                    className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed text-xs font-bold text-white flex items-center gap-1"
                                                                >
                                                                    <ArrowLeft className="w-3 h-3" /> Prev
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    disabled={pptSlideIndex >= pptSlides.length - 1}
                                                                    onClick={() => setPptSlideIndex(s => Math.min(pptSlides.length - 1, s + 1))}
                                                                    className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed text-xs font-bold text-slate-950 flex items-center gap-1"
                                                                >
                                                                    Next <ArrowRight className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-4 py-4 min-h-[160px]">
                                                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest block">{currentSlide.tag}</span>
                                                            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                                                                {currentSlide.title}
                                                            </h2>
                                                            <ul className="space-y-3 pt-2 text-sm text-slate-300">
                                                                {currentSlide.bullets.map((b, idx) => (
                                                                    <li key={idx} className="flex items-start gap-2.5">
                                                                        <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                                                                        <span className="leading-relaxed">{b}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                            <div className="mt-4 p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs font-medium">
                                                                💡 {currentSlide.keyNote}
                                                            </div>
                                                        </div>
                                                        <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
                                                            <div className="flex items-center gap-2">
                                                                {pptSlides.map((s, idx) => (
                                                                    <button
                                                                        key={idx}
                                                                        type="button"
                                                                        onClick={() => setPptSlideIndex(idx)}
                                                                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${pptSlideIndex === idx ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                                                                    >
                                                                        {idx + 1}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                            <span className="text-amber-400 font-semibold">Review complete slide deck to progress</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        /* Fallback for other standard study documents */
                                        return (
                                            <div onScroll={handleStudyContentScroll} className="min-h-85 max-h-150 overflow-y-auto bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                                                <div className="mb-6">
                                                    {currentLessonData?.content || currentLessonData?.documentContent ? (
                                                        <div className="prose max-w-none text-[13px] text-gray-600 bg-gray-50 p-4 rounded-lg font-mono" dangerouslySetInnerHTML={{ __html: currentLessonData.content || currentLessonData.documentContent }} />
                                                    ) : (
                                                        <div className="p-6 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-500 text-[13.5px] italic text-center">
                                                            Reading material for this training module. Complete review to advance.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>
                        )} 

                        <div className="mt-4"></div>

                        {/* Interactive Workspace Navigation Tabs Area */}
                        <div className="space-y-4  border border-(--line) bg-[#fff] rounded-[20px] mt-4 px-6 py-5">
                            {isUnenrolled && (
                                <div className="bg-[#fef9e7] border border-[#ecd79b] rounded-xl px-4 py-2.5 flex items-center justify-between gap-4 -mt-1 mb-2">
                                    <div className="flex items-center gap-2 text-[12.5px] text-[#755a12] font-medium">
                                        <span className="bg-[#f6e8c4] border border-[#edd79a] text-[#755a12] font-bold px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider">Preview Mode</span>
                                        <span>You are watching a free preview. Quizzes, notes, resources, and progress tracking are unlocked upon enrolment.</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (careerPathId) navigate(`/course-details?id=${careerPathId}&type=career-path`);
                                            else if (courseId) navigate(`/course-details?id=${courseId}&type=course`);
                                            else if (lessonId) navigate(`/course-details?id=${lessonId}&type=lesson`);
                                            else navigate('/catalog');
                                        }}
                                        className="shrink-0 bg-[#c99b2e] hover:bg-[#b58723] text-white text-[12px] font-bold px-3.5 py-1.5 rounded-full transition-colors cursor-pointer"
                                    >
                                        Enrol now
                                    </button>
                                </div>
                            )}

                            <div className="flex justify-between items-center">
                                <div className="flex gap-6 text-[14px] font-semibold text-[#5c5c5c]">
                                    {(["Overview", "Transcript", "Notes", "Resources"] as const).map((tab) => {
                                        const isTabDisabled = isUnenrolled && (tab === "Notes" || tab === "Resources");
                                        return (
                                            <button
                                                key={tab}
                                                onClick={() => {
                                                    if (!isTabDisabled) setActiveTab(tab);
                                                }}
                                                disabled={isTabDisabled}
                                                title={isTabDisabled ? `${tab} are available after enrollment` : undefined}
                                                className={`px-0.5 py-2.5 relative transition-colors border-b-2 flex items-center gap-1.5 ${
                                                    isTabDisabled
                                                        ? "opacity-40 cursor-not-allowed border-transparent text-gray-400"
                                                        : activeTab === tab
                                                        ? "text-[#141414] border-[#141414]"
                                                        : "border-transparent hover:text-gray-900 cursor-pointer"
                                                }`}
                                            >
                                                <span>{tab}</span>
                                                {isTabDisabled && <Lock className="w-3 h-3 text-gray-400 inline-block" />}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="flex gap-3 mb-2">
                                    <button
                                        onClick={handlePrevious}
                                        disabled={playlist.findIndex((l: any) => l.id === activeLesson?.id) <= 0}
                                        className="disabled:opacity-50 border border-(--line-strong) hover:border-(--honey) hover:text-(--honey-text) rounded-full bg-white px-3.5 py-[7px] text-[13px] font-semibold text-(--ink-soft) flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:cursor-not-allowed"
                                    >
                                        <ArrowLeft className="w-3.5 h-3.5" />
                                        Prev
                                    </button>
                                    {playlist.findIndex((l: any) => l.id === activeLesson?.id) < playlist.length - 1 ? (
                                        <button
                                            onClick={handleContinue}
                                            className="bg-(--hero-bg) border border-[#c99b2e73] text-(--ink) hover:bg-(--btn-hove) cursor-pointer font-semibold px-5 py-2 rounded-full text-[13px] transition-all flex items-center justify-center gap-2 shadow-xs"
                                        >
                                            <span>{isPreQuiz ? "Next: Start Training SOPs" : playlist.findIndex((l: any) => l.id === activeLesson?.id) === playlist.length - 2 ? "Next: Final Certification Exam" : "Next lesson"}</span>
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleContinue}
                                            className="bg-emerald-600 border border-emerald-700 text-white hover:bg-emerald-700 cursor-pointer font-bold px-5 py-2 rounded-full text-[13px] transition-all flex items-center justify-center gap-2 shadow-xs"
                                        >
                                            <span>{isPostQuiz ? "Claim Certificate" : "Complete"}</span>
                                            <Award className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="border-t border-gray-200 w-full -mt-[17px]"></div>

                            {/* Dynamic Content Workspace Rendering block panels */}
                            {activeTab === "Overview" && (
                                <div className="bg-white border border-gray-200  m-4 px-5 py-4.5 rounded-xl space-y-6">
                                    <p className="text-[#3a3a3a] text-[16px] leading-relaxed ">
                                        {activeLesson?.lesson?.description || activeLesson?.lesson?.shortDescription || activeLesson?.description || `Master the certified procedures, equipment operation standards, and safety guidelines for ${activeLesson?.title || 'this module'}. Follow step-by-step verified protocols to maintain compliance and operational excellence.`}
                                    </p>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="border border-(--line-strong) text-(--ink-soft) text-[12px] font-semibold px-2.5 rounded-full">{activeLesson?.durationText || "52 min"}</span>
                                        <span className="border border-(--line-strong) text-(--ink-soft) text-[12px] font-semibold px-2.5 rounded-full">{activeLesson?.type === 'QUIZ' ? 'Quiz' : 'Video + PDF'}</span>
                                        <span className="border border-(--line-strong) text-(--ink-soft) text-[12px] font-semibold px-2.5 rounded-full">{courseData?.difficulty ? courseData?.difficulty.charAt(0).toUpperCase() + courseData?.difficulty.slice(1).toLowerCase() : "Practitioner"}</span>
                                        <span className="border border-(--line-strong) text-(--ink-soft) text-[12px] font-semibold px-2.5 rounded-full">Instructor: {courseData?.owner?.profile?.firstName || "Dr. Faris"} {courseData?.owner?.profile?.lastName || "Al-Maamari"}</span>
                                    </div>

                                    <div className="space-y-3 pt-2">
                                        {(() => {
                                            let outcomes: string[] = [];
                                            const rawOutcomes = activeLesson?.lesson?.learningOutcomes || (activeLesson as any)?.learningOutcomes || activeLesson?.lesson?.learningObjectives || [];
                                            if (Array.isArray(rawOutcomes)) {
                                                outcomes = rawOutcomes;
                                            } else if (typeof rawOutcomes === "string") {
                                                try {
                                                    const parsed = JSON.parse(rawOutcomes);
                                                    outcomes = Array.isArray(parsed) ? parsed : [parsed];
                                                } catch {
                                                    outcomes = rawOutcomes.split("\n").filter(Boolean);
                                                }
                                            }
                                            return outcomes.map((obj: any) => typeof obj === 'string' ? obj : (obj.text || obj.name || String(obj)));
                                        })().map((obj, i) => (
                                            <div key={i} className="flex items-start gap-3">
                                                <div className="w-5 h-5 rounded-full bg-(--sage-wash) flex items-center justify-center shrink-0 mt-0.5">
                                                    <Check className="w-3 h-3 text-(--sage-text)" />
                                                </div>
                                                <span className="text-[#3a3a3a] text-[14px] font-medium">{obj}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === "Notes" && (
                                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200/60 space-y-3 min-h-[400px]">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 font-mono">
                                            Your notes {isUnenrolled ? "(enrol to save notes)" : "(auto-saved)"}
                                        </label>
                                        {!isUnenrolled && (updateNote.isPending || createNote.isPending) && (
                                            <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></div>
                                                Saving...
                                            </span>
                                        )}
                                    </div>
                                    <textarea
                                        value={userNotes}
                                        onChange={(e) => { if (!isUnenrolled) setUserNotes(e.target.value); }}
                                        disabled={isUnenrolled}
                                        placeholder={isUnenrolled ? "Notes are available after enrolling in this course." : "Type to add notes..."}
                                        className="w-full bg-white border border-gray-200 border-dashed rounded-lg p-4 text-xs font-medium text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:bg-white transition-all h-full min-h-[300px] resize-none shadow-inner disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    />
                                </div>
                            )}

                            {activeTab === "Transcript" && (
                                <div ref={transcriptContainerRef} className="bg-(--paper) border border-(--line) rounded-2xl m-4 py-4.5 px-5 max-h-[500px] min-h-[400px] overflow-y-auto space-y-1 shadow-sm">
                                    {isLoadingTranscript ? (
                                        <div className="py-12 flex flex-col items-center justify-center gap-3 text-gray-400">
                                            <div className="animate-spin rounded-full h-8 w-8 border-[2.5px] border-gray-200 border-t-gray-800"></div>
                                            <span className="text-xs font-medium">Loading transcript...</span>
                                        </div>
                                    ) : transcriptCues.length === 0 ? (
                                        <div className="py-12 text-center text-xs text-gray-400 italic">
                                            No transcript available for this lesson.
                                        </div>
                                    ) : (
                                        (() => {
                                            const initialActiveId = getInitialActiveCueId();
                                            return transcriptCues.map((cue, idx) => {
                                                const isActive = cue.id === initialActiveId;
                                                return (
                                                    <div
                                                        key={cue.id}
                                                        id={`cue-${cue.id}`}
                                                        onClick={() => handleCueClick(cue.seconds)}
                                                        className={`transcript-cue-item  border-b-(--line) flex items-baseline gap-4 py-3.5 px-4 sm:py-4 sm:px-5 rounded-xl cursor-pointer transition-all my-1 border ${isActive ? "bg-[#FEF9E7] border-amber-200/60 shadow-sm text-gray-900" : "hover:bg-gray-50 text-gray-700 border-transparent"}`}
                                                    >
                                                        <span className={`cue-time font-mono text-xs sm:text-sm shrink-0 w-12 select-none ${isActive ? "text-[#5c5c5c]font-semibold" : "text-[#5c5c5c] font-medium"}`}>
                                                            {cue.timeText}
                                                        </span>
                                                        <p className={`cue-text text-[16px] leading-relaxed font-medium ${isActive ? "text-[#3a3a3a]" : "text-[#5c5c5c]"}`}>
                                                            {cue.text}
                                                        </p>
                                                    </div>
                                                );
                                            });
                                        })()
                                    )}
                                </div>
                            )}

                            {activeTab === "Resources" && (
                                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3 min-h-[400px]">
                                    {isUnenrolled ? (
                                        <div className="text-center py-12 text-gray-500 space-y-2">
                                            <Lock className="w-8 h-8 text-gray-400 mx-auto" />
                                            <p className="text-[14px] font-bold text-gray-800">Resources are locked</p>
                                            <p className="text-xs text-gray-500">Enrol in this course to download attachments and lesson materials.</p>
                                        </div>
                                    ) : allStudyDocuments.length === 0 ? (
                                        <div className="text-xs text-gray-400 italic">No resources available for this lesson.</div>
                                    ) : (
                                        allStudyDocuments.map((rawAtt: any, idx: number) => {
                                            if (!rawAtt) return null;
                                            const att = rawAtt.asset || rawAtt;
                                            const attUrl = att?.signedUrl || att?.url || att?.fileUrl || att?.storagePath || "#";
                                            const fileName = att?.originalFileName || att?.fileName || `attachment-${idx + 1}`;
                                            return (
                                                <div key={att?.id || idx} className="flex items-center justify-between p-3.5 border border-gray-200 rounded-lg bg-white shadow-sm">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[13.5px] font-medium text-gray-900">Attachment</span>
                                                        <span className="text-[13px] text-gray-500 truncate max-w-50 sm:max-w-75" title={fileName}>{fileName}</span>
                                                    </div>
                                                    <div className="flex gap-4 items-center shrink-0">
                                                        <a href={attUrl} target="_blank" rel="noreferrer" className="text-[13px] font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer">Preview</a>
                                                        <button onClick={() => handleDownloadFile(attUrl, fileName)} className="text-[13px] font-bold text-gray-900 hover:text-gray-700 underline cursor-pointer">Download</button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </div>


                    </main>

                    {/* =========================================================
            3. SIDEBAR WIDGETS PANEL (RIGHT COLUMN)
           ========================================================= */}
                    <div className="w-full lg:w-[360px] shrink-0 flex flex-col border-t lg:border-t-0 border-gray-200 bg-white h-full overflow-y-auto pb-8 custom-scrollbar">

                        {/* The Playlist Sidebar */}
                        <aside className="bg-[#141414] py-5 space-y-4 rounded-xl mx-4 mt-6 flex flex-col shadow-sm">

                            {/* ========= Unified Sidebar Tree ========= */}
                            {careerPathId && courseId && cpCourseList.length > 0 ? (
                                <div className="space-y-0 px-5">
                                    <h2 className="text-[11px] font-bold tracking-widest text-[#a3a3a3] uppercase font-sans mb-3">
                                        Career Path Progress
                                    </h2>
                                    {cpCourseList.map((c: any, cIdx: number) => {
                                        const isCurrCourse = c.id === courseId;
                                        const isDoneCourse = cIdx < currentCourseIdxInCP;
                                        const isLockCourse = cIdx > currentCourseIdxInCP;
                                        const clLessons = c.courseLessons || [];
                                        const isExpanded = expandedCourseIds[c.id] !== undefined ? expandedCourseIds[c.id] : isCurrCourse;
                                        const cQuiz = c.Quiz?.[0];
                                        const hasCourseQuiz = isCurrCourse ? courseQuizzes.length > 0 : Boolean(cQuiz);

                                        return (
                                            <div key={c.id} className="relative mb-1">
                                                {/* Course row */}
                                                <div
                                                    onClick={() => {
                                                        if (!isLockCourse) {
                                                            toggleCourseExpand(c.id);
                                                        }
                                                    }}
                                                    className={`flex items-center justify-between gap-2.5 px-2.5 py-2.5 rounded-lg transition-all select-none ${
                                                        isCurrCourse 
                                                            ? "cursor-pointer bg-[#222] border border-[#333] hover:bg-[#282828]" 
                                                            : isDoneCourse 
                                                            ? "cursor-pointer hover:bg-[#222]" 
                                                            : "cursor-not-allowed opacity-50"
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                        <span className={`w-[26px] h-[26px] rounded-full flex items-center justify-center shrink-0 text-[10px] font-black ${
                                                            isCurrCourse ? "bg-[#c99b2e] text-[#141414]" : isDoneCourse ? "bg-green-500 text-white" : "bg-[#333] text-gray-500"
                                                        }`}>
                                                            {isDoneCourse ? "✓" : cIdx + 1}
                                                        </span>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-[12.5px] font-bold truncate leading-tight ${
                                                                isCurrCourse ? "text-white" : isDoneCourse ? "text-green-500" : "text-gray-500"
                                                            }`}>{c.title}</p>
                                                            <p className="text-[10px] font-sans text-gray-400">{clLessons.length} lesson{clLessons.length !== 1 ? "s" : ""}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        {isLockCourse && <Lock className="w-3.5 h-3.5 text-gray-500 shrink-0" />}
                                                        {isCurrCourse && <span className="text-[9px] font-black uppercase tracking-wider text-[#c99b2e] shrink-0">NOW</span>}
                                                        {!isLockCourse && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => toggleCourseExpand(c.id, e)}
                                                                className="p-1 text-gray-400 hover:text-white transition-transform duration-200"
                                                            >
                                                                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-180 text-white" : "rotate-0 text-gray-400"}`} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Nested lessons & inside scroll of card */}
                                                {isExpanded && (
                                                    <div className="ml-[13px] pl-3 border-l-2 border-[#333] pb-2 mt-1.5">
                                                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar pr-1 space-y-1">
                                                            {isCurrCourse ? (
                                                                playlist.map((item: any) => {
                                                                    const isCompleted = item.isCompleted || item.state === "completed";
                                                                    const isCurrent = item.id === activeLesson?.id || String(item.id) === String(activeLesson?.id);
                                                                    const isLocked = false;
                                                                    const hasMappedQuiz = allCourseQuizzes.find((q: any) => String(q.lessonId || q.lesson_id) === String(item.id)) || (String(item.id) === String(activeLesson?.id) && activeLessonQuiz);

                                                                    const lsn = item.lesson || item;

                                                                    const getImgUrl = (ast: any) => {
                                                                        if (!ast) return null;
                                                                        if (ast.fileUrl) return ast.fileUrl;
                                                                        if (ast.url) return ast.url;
                                                                        if (ast.signedUrl) return ast.signedUrl;
                                                                        if (ast.gcsKey && ast.bucketName) return `https://storage.googleapis.com/${ast.bucketName}/${ast.gcsKey}`;
                                                                        return null;
                                                                    };

                                                                    let lsnThumb = getImgUrl(lsn?.thumbnailAsset) || getImgUrl(lsn?.coverImageAsset) || getImgUrl(lsn?.lessonAssets?.find?.((a: any) => a.assetRole === "THUMBNAIL")?.asset) || lsn?.thumbnailUrl || lsn?.coverImageUrl || null;
                                                                    if (!lsnThumb && lsn?.thumbnail_asset) lsnThumb = getImgUrl(lsn?.thumbnail_asset);

                                                                    const thumbUrl = lsnThumb || null;

                                                                    let stateBadge: string | null = null;
                                                                    if (isCurrent) stateBadge = isCompleted ? "rewatching" : "in progress";
                                                                    else if (isCompleted) stateBadge = "completed";

                                                                    return (
                                                                        <div
                                                                            key={item.id}
                                                                            onClick={() => {
                                                                                navigate(`/course-player?careerPathId=${careerPathId || ""}&courseId=${courseId || ""}&lessonId=${item.id}`);
                                                                            }}
                                                                            className={`flex items-start gap-3 p-2 rounded-lg transition-all relative cursor-pointer ${
                                                                                isCurrent ? "bg-[#2a2a2a]" : "hover:bg-[#2a2a2a]"
                                                                            }`}
                                                                        >
                                                                            <div className="w-[60px] h-10 rounded overflow-hidden shrink-0 relative bg-[#333]">
                                                                                {thumbUrl ? (
                                                                                    <img
                                                                                        src={thumbUrl}
                                                                                        onError={(e) => { e.currentTarget.style.display = 'none'; if (e.currentTarget.nextElementSibling) (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex'; }}
                                                                                        className="w-full h-full object-cover opacity-80"
                                                                                    />
                                                                                ) : null}

                                                                                {(() => {
                                                                                    const itemTitle = String(item.title || "").toLowerCase();
                                                                                    const itemId = String(item.id || "").toLowerCase();
                                                                                    const isItemQuiz = item.type === "QUIZ" || (item as any).lessonType === "QUIZ" || itemId.startsWith("quiz-") || itemTitle.includes("quiz") || itemTitle.includes("assessment");
                                                                                    const isItemPreQuiz = isItemQuiz && (itemTitle.includes("pre") || itemId.includes("pre") || (item as any).quizType === "PRE_ASSESSMENT");
                                                                                    return (
                                                                                        <div className="w-full h-full items-center justify-center" style={{ display: thumbUrl ? 'none' : 'flex' }}>
                                                                                            {isItemQuiz ? (
                                                                                                isItemPreQuiz ? <HelpCircle className="w-4 h-4 text-purple-400" /> : <Award className="w-4 h-4 text-emerald-400" />
                                                                                            ) : item.type === "PDF" ? (
                                                                                                <FileText className="w-4 h-4 text-rose-400" />
                                                                                            ) : item.type === "PPT" ? (
                                                                                                <Presentation className="w-4 h-4 text-amber-400" />
                                                                                            ) : (
                                                                                                <Play className="w-4 h-4 text-indigo-400" />
                                                                                            )}
                                                                                        </div>
                                                                                    );
                                                                                })()}
                                                                                {(isLocked || (isUnenrolled && !isCurrent)) && (
                                                                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                                                        <Lock className="w-3.5 h-3.5 text-white/90" />
                                                                                    </div>
                                                                                )}
                                                                                {/* Status tick icon overlay on right top of image */}
                                                                                {isCompleted && (
                                                                                    <div className="absolute top-1 right-1 w-3.5 h-3.5 bg-[#7e9b6f] rounded-full border border-black/80 flex items-center justify-center shadow-sm z-10">
                                                                                        <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                                                                                    </div>
                                                                                )}
                                                                            </div>

                                                                            <div className="flex-1 min-w-0 space-y-0.5">
                                                                                <p className={`text-[12.5px] font-bold line-clamp-2 leading-snug ${isCurrent ? "text-white" : "text-[#e5e5e5]"}`}>{item.lessonNumber}. {item.title}</p>
                                                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                                                    <span className="text-[10.5px] text-[#a3a3a3] font-sans">{item.durationText}</span>
                                                                                    {stateBadge && (
                                                                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                                                                            stateBadge === "rewatching" ? "bg-blue-900/50 text-blue-300 border-blue-800" : stateBadge === "completed" ? "bg-green-900/50 text-green-400 border-green-800" : "bg-[#333] text-gray-300 border-[#444]"
                                                                                        }`}>{stateBadge}</span>
                                                                                    )}
                                                                                    {hasMappedQuiz && (
                                                                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                                                                            isUnenrolled ? "bg-[#333] text-gray-400 border-[#444]" : "bg-amber-900/50 text-amber-400 border-amber-800"
                                                                                        }`}>Quiz</span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })
                                                            ) : (
                                                                /* Non-current courses in career path */
                                                                clLessons.map((clItem: any, clIdx: number) => {
                                                                    const lsn = clItem.lesson || clItem;
                                                                    const lsnId = lsn?.id || clItem?.id;
                                                                    const isCompleted = isDoneCourse || completedLessons.includes(String(lsnId));

                                                                    const getImgUrl = (ast: any) => {
                                                                        if (!ast) return null;
                                                                        if (ast.fileUrl) return ast.fileUrl;
                                                                        if (ast.url) return ast.url;
                                                                        if (ast.signedUrl) return ast.signedUrl;
                                                                        if (ast.gcsKey && ast.bucketName) return `https://storage.googleapis.com/${ast.bucketName}/${ast.gcsKey}`;
                                                                        return null;
                                                                    };

                                                                    let lsnThumb = getImgUrl(lsn?.thumbnailAsset) || getImgUrl(lsn?.coverImageAsset) || lsn?.thumbnailUrl || null;
                                                                    if (!lsnThumb && lsn?.thumbnail_asset) lsnThumb = getImgUrl(lsn?.thumbnail_asset);

                                                                    return (
                                                                        <div
                                                                            key={lsnId || clIdx}
                                                                            onClick={() => {
                                                                                if (!isLockCourse && !isUnenrolled && lsnId) {
                                                                                    navigate(`/course-player?careerPathId=${careerPathId}&courseId=${c.id}&lessonId=${lsnId}`);
                                                                                }
                                                                            }}
                                                                            className={`flex items-start gap-3 p-2 rounded-lg transition-all relative ${
                                                                                isLockCourse ? "opacity-50 cursor-not-allowed" : "hover:bg-[#2a2a2a] cursor-pointer"
                                                                            }`}
                                                                        >
                                                                            <div className="w-[60px] h-10 rounded overflow-hidden shrink-0 relative bg-[#333]">
                                                                                {lsnThumb ? (
                                                                                    <img
                                                                                        src={lsnThumb}
                                                                                        onError={(e) => { e.currentTarget.style.display = 'none'; if (e.currentTarget.nextElementSibling) (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex'; }}
                                                                                        className="w-full h-full object-cover opacity-80"
                                                                                    />
                                                                                ) : null}

                                                                                <div className="w-full h-full items-center justify-center" style={{ display: lsnThumb ? 'none' : 'flex' }}>
                                                                                    <Play className="w-4 h-4 text-gray-500" />
                                                                                </div>
                                                                                {isLockCourse && (
                                                                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                                                        <Lock className="w-3.5 h-3.5 text-white/90" />
                                                                                    </div>
                                                                                )}
                                                                                {/* Status tick icon overlay on right top of image */}
                                                                                {isCompleted && (
                                                                                    <div className="absolute top-1 right-1 w-3.5 h-3.5 bg-[#7e9b6f] rounded-full border border-black/80 flex items-center justify-center shadow-sm z-10">
                                                                                        <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                                                                                    </div>
                                                                                )}
                                                                            </div>

                                                                            <div className="flex-1 min-w-0 space-y-0.5">
                                                                                <p className="text-[12.5px] font-bold line-clamp-2 leading-snug text-[#e5e5e5]">
                                                                                    {clIdx + 1}. {lsn?.title || "Lesson"}
                                                                                </p>
                                                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                                                    <span className="text-[10.5px] text-[#a3a3a3] font-sans">
                                                                                        {lsn?.duration ? `${lsn.duration} min` : "2 min"}
                                                                                    </span>
                                                                                    {isCompleted && (
                                                                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border bg-green-900/50 text-green-400 border-green-800">
                                                                                            completed
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })
                                                            )}

                                                            {/* Course assessment - only show if the course actually has a quiz */}
                                                            {hasCourseQuiz && (
                                                                <div
                                                                    onClick={() => {
                                                                        if (!isUnenrolled && (isDoneCourse || areAllLessonsCompleted)) {
                                                                            navigate(`/quiz-start-warning?careerPathId=${careerPathId}&courseId=${c.id}`);
                                                                        }
                                                                    }}
                                                                    className={`flex items-start gap-3 p-2 rounded-lg transition-all ${
                                                                        (!isUnenrolled && (isDoneCourse || areAllLessonsCompleted)) ? "cursor-pointer hover:bg-[#2a2a2a]" : "opacity-60 cursor-not-allowed"
                                                                    }`}
                                                                >
                                                                    <div className="w-[60px] h-10 rounded overflow-hidden shrink-0 relative bg-[#333] flex items-center justify-center">
                                                                        <FileText className="w-5 h-5 text-gray-500" />
                                                                        {(isDoneCourse || hasPassedCourseQuiz) && (
                                                                            <div className="absolute top-1 right-1 w-3.5 h-3.5 bg-[#7e9b6f] rounded-full border border-black/80 flex items-center justify-center shadow-sm z-10">
                                                                                <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0 space-y-0.5 mt-0.5">
                                                                        <p className={`text-[12.5px] font-bold line-clamp-1 ${(!isUnenrolled && (isDoneCourse || areAllLessonsCompleted)) ? "text-white" : "text-[#a3a3a3]"}`}>
                                                                            {clLessons.length + 1}. {(isCurrCourse ? courseQuiz?.title || courseQuiz?.quizTitle : cQuiz?.quizTitle || cQuiz?.title) || "Final Assessment"}
                                                                        </p>
                                                                        <div className="flex items-center gap-1.5">
                                                                            <span className="text-[10.5px] text-[#a3a3a3] font-sans">Quiz</span>
                                                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                                                                (isDoneCourse || hasPassedCourseQuiz)
                                                                                    ? "bg-green-900/50 text-green-400 border-green-800"
                                                                                    : (!isUnenrolled && areAllLessonsCompleted)
                                                                                    ? "bg-amber-900/50 text-amber-400 border-amber-800"
                                                                                    : "bg-[#333] text-gray-400 border-[#444]"
                                                                            }`}>
                                                                                {(isDoneCourse || hasPassedCourseQuiz) ? "completed" : isUnenrolled ? "enrol to unlock" : areAllLessonsCompleted ? "required" : "locked"}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    {(!isUnenrolled && (isDoneCourse || areAllLessonsCompleted)) && (
                                                                        <span className="text-[10px] font-bold text-[#c99b2e] shrink-0 self-center">
                                                                            {(isDoneCourse || hasPassedCourseQuiz) ? "Review →" : "Start →"}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {/* Career Path Level Final Assessment */}
                                    {(careerPathQuiz || careerPathData?.assessmentRequired) && (
                                        <div className="mt-3 pt-3 border-t border-[#333]">
                                            <div className="flex items-center justify-between mb-1.5 px-1">
                                                <span className="text-[10px] font-bold tracking-widest text-[#c99b2e] uppercase font-sans">
                                                    Path Assessment
                                                </span>
                                                {hasPassedCPQuiz ? (
                                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border bg-green-900/50 text-green-400 border-green-800">
                                                        Passed
                                                    </span>
                                                ) : isAllCoursesCompletedInCP && !isUnenrolled ? (
                                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border bg-amber-900/50 text-amber-400 border-amber-800">
                                                        Unlocked
                                                    </span>
                                                ) : (
                                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border bg-[#262626] text-gray-500 border-[#333]">
                                                        Locked
                                                    </span>
                                                )}
                                            </div>
                                            <div
                                                onClick={() => {
                                                    if (!isUnenrolled && (isAllCoursesCompletedInCP || hasPassedCPQuiz)) {
                                                        navigate(`/quiz-start-warning?careerPathId=${careerPathId}`);
                                                    }
                                                }}
                                                className={`flex items-start gap-3 p-2.5 rounded-lg border transition-all ${
                                                    hasPassedCPQuiz
                                                        ? "bg-green-950/20 border-green-800/40 cursor-pointer hover:bg-green-950/30"
                                                        : isAllCoursesCompletedInCP && !isUnenrolled
                                                        ? "bg-[#272111] border-[#c99b2e]/60 cursor-pointer hover:bg-[#332a15]"
                                                        : "bg-[#181818] border-[#2a2a2a] opacity-60 cursor-not-allowed"
                                                }`}
                                            >
                                                <div className={`w-[26px] h-[26px] rounded-full flex items-center justify-center shrink-0 text-[10px] font-black ${
                                                    hasPassedCPQuiz
                                                        ? "bg-green-500 text-white"
                                                        : isAllCoursesCompletedInCP && !isUnenrolled
                                                        ? "bg-[#c99b2e] text-[#141414]"
                                                        : "bg-[#333] text-gray-500"
                                                }`}>
                                                    {hasPassedCPQuiz ? "✓" : <FileText className="w-3.5 h-3.5 text-gray-400" />}
                                                </div>
                                                <div className="flex-1 min-w-0 space-y-0.5">
                                                    <p className={`text-[12.5px] font-bold truncate leading-tight ${
                                                        hasPassedCPQuiz ? "text-green-400" : isAllCoursesCompletedInCP && !isUnenrolled ? "text-white" : "text-gray-400"
                                                    }`}>
                                                        {careerPathQuiz?.quizTitle || careerPathQuiz?.title || "Career Path Final Assessment"}
                                                    </p>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[10px] text-[#a3a3a3] font-sans">
                                                            Career Path Exam
                                                        </span>
                                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                                            hasPassedCPQuiz
                                                                ? "bg-green-900/50 text-green-400 border-green-800"
                                                                : isAllCoursesCompletedInCP && !isUnenrolled
                                                                ? "bg-amber-900/50 text-amber-400 border-amber-800"
                                                                : "bg-[#333] text-gray-400 border-[#444]"
                                                        }`}>
                                                            {hasPassedCPQuiz ? "completed" : isUnenrolled ? "enrol to unlock" : isAllCoursesCompletedInCP ? "required" : "locked"}
                                                        </span>
                                                    </div>
                                                </div>
                                                {hasPassedCPQuiz ? (
                                                    <span className="text-[10px] font-bold text-green-400 shrink-0 self-center">Review →</span>
                                                ) : isAllCoursesCompletedInCP && !isUnenrolled ? (
                                                    <span className="text-[10px] font-bold text-[#c99b2e] shrink-0 self-center">Start →</span>
                                                ) : (
                                                    <Lock className="w-3.5 h-3.5 text-gray-500 shrink-0 self-center" />
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* Plain course flat list */
                                <div className="flex flex-col h-full pb-2">
                                    <div className="flex justify-between items-center mb-1 shrink-0 px-5 border-b border-[#2a2a2a] pb-4">
                                        <h2 className="text-[11px] font-bold tracking-widest text-[#c9b48f] uppercase font-sans">
                                            COURSE PLAYLIST
                                        </h2>
                                        <span className="text-[11px] font-bold text-[#e6c86e] font-sans">{displayProgress}%</span>
                                    </div>
                                    <div className="px-5 py-2.5 bg-[#141414] border-b border-[#1f1f1f] flex items-center justify-between">
                                        <span className="text-[11px] text-gray-400 font-medium">Offline Watch Sync</span>
                                        <button
                                            type="button"
                                            onClick={handleSaveEntireCourseOffline}
                                            className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                                        >
                                            <Download className="w-3 h-3" />
                                            <span>Download All Offline</span>
                                        </button>
                                    </div>
                                    <div className="flex flex-col pt-1">
                                        {playlist.map((item: any) => {
                                            const isCompleted = item.isCompleted || item.state === "completed";
                                            const isCurrent = item.isCurrent || (item.id === activeLesson?.id || String(item.id) === String(activeLesson?.id));
                                            const isLocked = false;

                                            const lsn = item.lesson || item;

                                            const getImgUrl = (ast: any) => {
                                                if (!ast) return null;
                                                if (ast.fileUrl) return ast.fileUrl;
                                                if (ast.url) return ast.url;
                                                if (ast.signedUrl) return ast.signedUrl;
                                                if (ast.gcsKey && ast.bucketName) return `https://storage.googleapis.com/${ast.bucketName}/${ast.gcsKey}`;
                                                return null;
                                            };

                                            let lsnThumb = getImgUrl(lsn?.thumbnailAsset) || getImgUrl(lsn?.coverImageAsset) || getImgUrl(lsn?.lessonAssets?.find?.((a: any) => a.assetRole === "THUMBNAIL")?.asset) || lsn?.thumbnailUrl || lsn?.coverImageUrl || null;
                                            if (!lsnThumb && lsn?.thumbnail_asset) lsnThumb = getImgUrl(lsn?.thumbnail_asset);

                                            const thumbUrl = lsnThumb || null;

                                            const isItemPreview = Boolean((item as any).isPreview);

                                            return (
                                                <div key={item.id} onClick={() => { navigate(`/course-player?careerPathId=${careerPathId || ""}&courseId=${courseId || ""}&lessonId=${item.id}`); }}
                                                    className={`py-3 flex items-start gap-4 transition-all relative border-b border-[#1f1f1f] last:border-b-0 cursor-pointer ${isCurrent ? "bg-[#272111] border-l-4 border-[#c99b2e] pl-[16px] pr-5" : "hover:bg-[#1a1a1a] px-5"}`}>

                                                    <div className="w-[58px] h-[42px] rounded overflow-hidden shrink-0 relative bg-[#333]">
                                                        {thumbUrl ? (
                                                            <img src={thumbUrl} onError={(e) => { e.currentTarget.style.display = 'none'; if (e.currentTarget.nextElementSibling) (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex'; }} className="w-full h-full object-cover opacity-80" />
                                                        ) : null}

                                                        {(() => {
                                                            const itemTitle = String(item.title || "").toLowerCase();
                                                            const itemId = String(item.id || "").toLowerCase();
                                                            const isItemQuiz = item.type === "QUIZ" || (item as any).lessonType === "QUIZ" || itemId.startsWith("quiz-") || itemTitle.includes("quiz") || itemTitle.includes("assessment");
                                                            const isItemPreQuiz = isItemQuiz && (itemTitle.includes("pre") || itemId.includes("pre") || (item as any).quizType === "PRE_ASSESSMENT");
                                                            return (
                                                                <div className="w-full h-full items-center justify-center" style={{ display: thumbUrl ? 'none' : 'flex' }}>
                                                                    {isItemQuiz ? (
                                                                        isItemPreQuiz ? <HelpCircle className="w-4 h-4 text-purple-400" /> : <Award className="w-4 h-4 text-emerald-400" />
                                                                    ) : item.type === "PDF" ? (
                                                                        <FileText className="w-4 h-4 text-rose-400" />
                                                                    ) : item.type === "PPT" ? (
                                                                        <Presentation className="w-4 h-4 text-amber-400" />
                                                                    ) : (
                                                                        <Play className="w-4 h-4 text-indigo-400" />
                                                                    )}
                                                                </div>
                                                            );
                                                        })()}

                                                        {/* Status Badge overlaying top right of thumbnail */}
                                                        {isCompleted && (
                                                            <div className="absolute top-1 right-1 w-4 h-4 bg-[#7e9b6f] rounded-full border border-black flex items-center justify-center shadow-sm z-10">
                                                                <Check className="w-2.5 h-2.5 text-white" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 space-y-0.5 min-w-0 py-0.5">
                                                        <h4 className={`text-[13px] font-bold tracking-tight line-clamp-2 leading-snug ${isCurrent ? "text-white" : "text-[#e5e5e5]"}`}>
                                                            {item.lessonNumber}. {item.title}
                                                        </h4>
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            {(() => {
                                                                const itemTitle = String(item.title || "").toLowerCase();
                                                                const itemId = String(item.id || "").toLowerCase();
                                                                const isItemQuiz = item.type === "QUIZ" || (item as any).lessonType === "QUIZ" || itemId.startsWith("quiz-") || itemTitle.includes("quiz") || itemTitle.includes("assessment");
                                                                const isItemPreQuiz = isItemQuiz && (itemTitle.includes("pre") || itemId.includes("pre") || (item as any).quizType === "PRE_ASSESSMENT");
                                                                const isItemPostQuiz = isItemQuiz && !isItemPreQuiz;
                                                                return (
                                                                    <>
                                                                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                                                                            isItemPreQuiz ? "bg-purple-950/70 text-purple-300 border-purple-800/80" :
                                                                            isItemPostQuiz ? "bg-emerald-950/70 text-emerald-300 border-emerald-800/80" :
                                                                            item.type === "PDF" ? "bg-rose-950/60 text-rose-300 border-rose-800/80" :
                                                                            item.type === "PPT" ? "bg-amber-950/60 text-amber-300 border-amber-800/80" :
                                                                            "bg-blue-950/60 text-blue-300 border-blue-800/80"
                                                                        }`}>
                                                                            {isItemPreQuiz ? "PRE-QUIZ" : isItemPostQuiz ? "POST-QUIZ" : item.type === "PDF" ? "PDF GUIDE" : item.type === "PPT" ? "PPT SLIDES" : "VIDEO SOP"}
                                                                        </span>
                                                                        <span className={`text-[11px] font-medium font-sans ${isCurrent ? "text-[#b49a72]" : "text-[#a3a3a3]"}`}>
                                                                            {isItemPreQuiz ? "10 min · Baseline Check" : isItemPostQuiz ? "10 min · Certification Exam" : item.durationText} · {isCompleted ? "Completed" : isCurrent ? "In progress" : "Available"}
                                                                        </span>
                                                                    </>
                                                                );
                                                            })()}
                                                            {offlineLessons.includes(String(item.id)) && (
                                                                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/80">
                                                                    <CheckCircle2 className="w-2.5 h-2.5" /> Offline
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {(courseQuizzes.length > 0 || courseId || careerPathId) && (
                                            <div onClick={() => { if (!isUnenrolled && areAllLessonsCompleted) navigate(`/quiz-start-warning?careerPathId=${careerPathId || ""}&courseId=${courseId || ""}`); }} className={`w-full text-left py-4 px-5 transition-all flex items-center justify-between group border-t border-[#1f1f1f] ${(!isUnenrolled && areAllLessonsCompleted) ? "cursor-pointer hover:bg-[#1a1a1a]" : "opacity-60 cursor-not-allowed"}`}>
                                                <div className="flex items-start gap-4">
                                                    <div className="w-[58px] h-[42px] rounded overflow-hidden shrink-0 bg-[#333] flex items-center justify-center relative">
                                                        <FileText className="w-5 h-5 text-gray-500" />
                                                        {(!areAllLessonsCompleted || isUnenrolled) && (
                                                            <div className="absolute inset-0 bg-black/60"></div>
                                                        )}
                                                        {(!areAllLessonsCompleted || isUnenrolled) && (
                                                            <div className="absolute top-1 right-1 w-4 h-4 bg-[#333333] rounded-full border border-black flex items-center justify-center shadow-sm z-10">
                                                                <Lock className="w-2.5 h-2.5 text-[#a3a3a3]" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0 space-y-0.5 py-0.5">
                                                        <h4 className={`text-[13px] font-bold tracking-tight line-clamp-1 ${(!isUnenrolled && areAllLessonsCompleted) ? "text-white" : "text-[#a3a3a3]"}`}>{playlist.length + 1}. {courseQuiz?.title || courseQuiz?.quizTitle || "Final Course Assessment"}</h4>
                                                        <div className="flex items-center gap-1.5"><span className="text-[11px] text-[#a3a3a3] font-sans">Quiz</span><span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${(!isUnenrolled && areAllLessonsCompleted) ? "bg-amber-900/50 text-amber-400 border-amber-800" : "bg-[#333] text-gray-400 border-[#444]"}`}>{isUnenrolled ? "enrol to unlock" : areAllLessonsCompleted ? "required" : "locked"}</span></div>
                                                    </div>
                                                </div>
                                                <span className={`text-[10px] font-bold shrink-0 ${(!isUnenrolled && areAllLessonsCompleted) ? "text-[#b49a72] group-hover:translate-x-0.5 transition-transform" : "text-gray-600"}`}>{(!isUnenrolled && areAllLessonsCompleted) ? "Start →" : ""}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </aside>

                        {/* Next Up Autoplay Box */}
                        <div className="mx-4 mt-4 shadow-sm shrink-0 bg-[linear-gradient(120deg,#fffdf8,var(--honey-wash))] rounded-[var(--r-lg)] border border-[#c99b2e66] px-[18px] py-[16px]">
                            {(() => {
                                const activeIdx = playlist.findIndex((l: any) => l.id === activeLesson?.id);
                                const isLastLesson = activeIdx >= playlist.length - 1 || activeIdx === -1;
                                const nextLesson = isLastLesson ? null : playlist[activeIdx + 1];

                                return (
                                    <>
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="text-[11px] font-bold text-(--honey-text) uppercase tracking-widest font-sans flex items-center gap-1.5">
                                                <Play className="w-[13px] h-[13px] text-(--accent) fill-current" />
                                                NEXT UP {isLastLesson ? '' : '- AUTOPLAY'}
                                            </span>
                                        </div>
                                        <div
                                            onClick={() => {
                                                if (!isUnenrolled) {
                                                    handleContinue();
                                                }
                                            }}
                                            className="flex gap-4 items-center cursor-pointer group hover:opacity-85 transition-opacity"
                                        >
                                            <div className="w-[60px] h-10 rounded overflow-hidden shrink-0 bg-gray-200">
                                                {!isLastLesson && nextLesson?.lesson?.thumbnailUrl ? (
                                                    <img src={nextLesson.lesson.thumbnailUrl} className="w-full h-full object-cover" />
                                                ) : (
                                                    <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=150&q=80" className="w-full h-full object-cover" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-[14px] font-bold text-[#141414] leading-tight mb-0.5 line-clamp-1 group-hover:text-[#c99b2e] transition-colors">
                                                    {!isLastLesson
                                                        ? `${activeIdx + 2}. ${nextLesson?.title}`
                                                        : (courseQuizzes.length > 0 && !hasPassedCourseQuiz)
                                                        ? (courseQuiz?.title || courseQuiz?.quizTitle || "Final Assessment")
                                                        : (careerPathId && nextCourseInCP)
                                                        ? `Next Course: ${nextCourseInCP.title}`
                                                        : (careerPathId && (careerPathQuiz || careerPathData?.assessmentRequired) && !hasPassedCPQuiz)
                                                        ? (careerPathQuiz?.quizTitle || careerPathQuiz?.title || "Career Path Assessment")
                                                        : (careerPathId ? "Career Path Completion" : courseData?.assessmentRequired ? "Final Assessment" : "Course completion")}
                                                </h4>
                                                <p className="text-[12px] text-[#5c5c5c] font-medium">
                                                    {!isLastLesson
                                                        ? `${nextLesson?.durationText}`
                                                        : (courseQuizzes.length > 0 && !hasPassedCourseQuiz)
                                                        ? "Quiz"
                                                        : (careerPathId && nextCourseInCP)
                                                        ? `${(nextCourseInCP.courseLessons || []).length} lessons`
                                                        : (careerPathId && (careerPathQuiz || careerPathData?.assessmentRequired) && !hasPassedCPQuiz)
                                                        ? "Career Path Exam"
                                                        : "Certificate"}
                                                </p>
                                            </div>
                                            {isLastLesson && !isUnenrolled && (
                                                <span className="text-[11px] font-bold text-[#c99b2e] shrink-0 self-center">
                                                    Start →
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-4 flex items-center justify-between border-t border-[#f0e4a1]/50 pt-3">
                                            <span className={`text-[12px] font-semibold text-[#3a3a3a] flex items-center gap-2 ${isLastLesson || isUnenrolled ? 'opacity-50' : ''}`}>
                                                <button
                                                    disabled={isLastLesson || isUnenrolled}
                                                    onClick={() => setAutoplay(!autoplay)}
                                                    className={`w-8 h-4.5 rounded-full relative transition-colors ${!isLastLesson && autoplay ? 'bg-[#7e9b6f]' : 'bg-gray-300'} ${isLastLesson ? 'cursor-not-allowed' : ''}`}
                                                >
                                                    <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${!isLastLesson && autoplay ? 'right-0.5' : 'left-0.5'}`}></div>
                                                </button>
                                                Autoplay next lesson
                                            </span>
                                            <span className={`text-[12px] font-bold ${!isLastLesson && autoplay ? 'text-(--c-sage-text)' : 'text-[#5c5c5c] opacity-50'}`}>
                                                {!isLastLesson && autoplay ? 'On' : 'Off'}
                                            </span>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>

                        {/* Section Block: Lesson Attachments */}
                        {/* {attachments.length > 0 && (
                        <div className="mx-4 mt-6 space-y-3">
                            <h2 className="text-[11px] font-bold tracking-widest text-gray-400 uppercase font-sans">
                                Lesson Attachments
                            </h2>
                            <div className="space-y-2">
                                {attachments.map((file, idx) => (
                                    <div key={idx} className="bg-white border border-gray-200 rounded-xl p-3 flex justify-between items-center gap-3 shadow-sm hover:border-gray-300 transition-colors">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="w-7 h-7 border border-gray-200 rounded bg-gray-50 flex items-center justify-center text-[8px] font-black text-gray-400 tracking-wider font-mono shrink-0">
                                                {file.type}
                                            </div>
                                            <div className="min-w-0 space-y-0.5">
                                                <h4 className="text-[12px] font-bold text-gray-900 tracking-tight truncate" title={file.name}>{file.name}</h4>
                                                <p className="text-[10px] text-gray-400 font-medium font-sans">{file.type} · {file.sizeText}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={() => file.url && file.url !== "#" && handleDownloadFile(file.url, file.name)}
                                                className="w-7 h-7 border border-gray-300 hover:border-gray-900 bg-white rounded-lg flex items-center justify-center shadow-sm text-gray-700 transition-colors shrink-0"
                                                title="Download Attachment"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 13l-7 7-7-7m14-6l-7 7-7-7" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )} */}
                    </div>

                </div>
            </div>

            {/* Offline Toast Banner */}
            {offlineToast && (
                <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-300">
                    <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold">{offlineToast}</span>
                </div>
            )}

            {/* Share Modal */}
            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                title={courseData?.title || activeLesson?.title || "Knowledge Course"}
                thumbnail={
                    courseData?.thumbnailUrl ||
                    courseData?.coverImageUrl ||
                    courseData?.thumbnailAsset?.fileUrl ||
                    courseData?.thumbnailAsset?.url ||
                    courseData?.thumbnailAsset?.signedUrl ||
                    activeLesson?.lesson?.thumbnailUrl ||
                    activeLesson?.lesson?.coverImageUrl ||
                    "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=150"
                }
                link={typeof window !== "undefined" ? window.location.href : "https://nexusacademy.org"}
            />
        </div>
    );
};

export default CoursePlayer;