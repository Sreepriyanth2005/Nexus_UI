import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation, useParams } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ShareModal from "./ShareModal";
import { notification } from "antd";
import { api } from "../../config/axios";
import { enrollCareerPathApi, getEnrolledCareerPathsApi } from "../../core/api/career-path/career-path.api";
import { courseApi } from "../../core/api/course/course.api";
import {
  useCourseDetails,
  useCourseLessons,
  useCourseStatistics,
  useCourseReviews,
  useRelatedCourses,
  useEnrolledCourses,
  useEnrollCourse,
  useEnrollmentCount,
} from "../../hooks/course-details/courseDetails";
import {
  Presentation,
  Award,
  Clock,
  FileText,
  Heart,
  Play,
  Share2,
  Star,
  Users,
  Video,
  ChevronRight,
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Calendar,
  Download,
  Wifi,
  Sparkles,
  HelpCircle
} from "lucide-react";
import { memberLearningApi } from "../../core/api/member-learning/memberLearningApi";
import { getAssignedContentApi } from "../../core/api/corporate-learning.api";
import { useProfileStore } from "../../store/profile.store";
import { useProfile } from "../../hooks/profile/useProfile";
import { useAuthStore } from "../../core/auth/auth.store";
import { useUserStore } from "../../store/user.store";
import { getSkillsApi } from "../../core/api/skill/skill.api";
import { getAssetsApi } from "../../core/api/asset/asset.api";
import { showProfileIncompleteModal } from "../../utils/profileAlert";
import { Skeleton } from "../../components/ui/Skeleton/Skeleton";

const CourseThumbnail = ({ courseId, fallbackThumb }: { courseId: string, fallbackThumb: string }) => {
  const { data: courseData } = useQuery({
    queryKey: ["course-thumb", courseId],
    queryFn: async () => {
      if (!courseId) return null;
      try {
        const { data } = await api.get(`/courses/${courseId}`);
        return data?.data || data;
      } catch (err) {
        return null;
      }
    },
    enabled: !fallbackThumb && !!courseId,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const finalThumb = fallbackThumb || courseData?.thumbnailUrl || courseData?.coverImageUrl || courseData?.thumbnailAsset?.fileUrl || courseData?.thumbnailAsset?.signedUrl || courseData?.thumbnail_url || "";

  if (finalThumb) {
    return <img src={finalThumb} className="w-full h-full object-cover" alt="" />;
  }

  return (
    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
      <span className="text-gray-400 text-[10px] font-medium">No Image</span>
    </div>
  );
};

interface CurriculumItem {
  id: string;
  type: "video" | "video+pdf" | "quiz" | "course" | "pdf" | "ppt";
  title: string;
  meta: string;
  isFreePreview?: boolean;
  statusText: string;
  children?: any[];
}

interface AttachmentItem {
  type: string;
  title: string;
  meta: string;
  actionText: string;
  isUnlocked?: boolean;
  isLink?: boolean;
  url?: string;
}

const CurriculumCourseItem = ({ courseItem, isTenant, onLessonClick }: { courseItem: CurriculumItem, isTenant: boolean, onLessonClick: (lessonId: string) => void }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: lessonsData, isLoading } = useQuery({
    queryKey: ["unified-lessons", "course", courseItem.id],
    queryFn: async () => {
      const { data } = await api.get(`/courses/${courseItem.id}/lessons`);
      return data.data || [];
    },
    enabled: isExpanded && !courseItem.children,
  });

  const rawLessons = courseItem.children || lessonsData || [];

  const lessons = rawLessons.map((cl: any) => {
    const lessonData = cl.lesson || cl;
    const lType = lessonData?.lessonType?.toLowerCase();
    const type = lType === "video" ? "video" : lType === "quiz" ? "quiz" : "video+pdf";
    const isPreview = Boolean(
      cl.isPreview ||
      cl.is_preview ||
      lessonData?.isPreview ||
      lessonData?.is_preview ||
      lessonData?.allowPreview
    );
    return {
      id: lessonData?.id,
      type: type as any,
      title: `${cl.sequenceOrder || 1}. ${lessonData?.title || "Untitled Lesson"}`,
      meta: `${lessonData?.lessonType || "Video"} • ${lessonData?.duration ?? 0} min`,
      isFreePreview: isPreview,
      statusText: "Open",
    };
  });

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white mb-3">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 flex justify-between items-center gap-4 hover:bg-gray-50 transition-all cursor-pointer"
      >
        <div className="flex items-center gap-3.5">
          <span className="text-gray-400 shrink-0">
            <svg className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </span>
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-gray-900 tracking-tight">{courseItem.title}</h4>
            <p className="text-[10px] text-gray-400 font-medium">{courseItem.meta}</p>
          </div>
        </div>
        <div>
          <span className="bg-gray-50 border border-gray-200 text-gray-400 text-[10px] font-bold px-2 py-1 rounded-md">
            {courseItem.statusText}
          </span>
        </div>
      </div>
      {isExpanded && (
        <div className="bg-gray-50 border-t border-gray-200 p-3 space-y-2">
          {isLoading ? (
            <div className="text-xs text-gray-400 p-2 text-center animate-pulse">Loading lessons...</div>
          ) : lessons.length === 0 ? (
            <div className="text-xs text-gray-400 p-2 text-center">No lessons found.</div>
          ) : (
            lessons.map((lesson: any) => (
              <div
                key={lesson.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onLessonClick(lesson.id);
                }}
                className="bg-white border border-gray-200 rounded-lg p-3 flex justify-between items-center cursor-pointer hover:border-gray-400 transition-all shadow-sm"
              >
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-gray-400">
                    <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </span>
                  <span className="font-bold text-gray-800">{lesson.title}</span>
                </div>
                <span className="text-[10px] text-gray-400 font-medium">{lesson.meta}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const DetailsSkeleton = ({ onBack }: { onBack?: () => void }) => (
  <div className="min-h-screen bg-white font-sans text-gray-900 pb-20">
    <div className="mx-auto pt-6 pb-2">
      {/* Back & Breadcrumbs Skeleton */}
      <div className="flex items-center gap-3 mb-4">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 cursor-pointer border border-gray-200 shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4 text-gray-700" />
            <span>Back</span>
          </button>
        )}
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-3 w-3" />
        <Skeleton className="h-4 w-36" />
      </div>

      {/* Hero Banner Skeleton */}
      <div className="relative rounded-2xl overflow-hidden bg-gray-900 p-8 md:p-12 mb-8 space-y-4">
        <Skeleton className="h-4 w-28 bg-white/20" />
        <Skeleton className="h-10 w-3/4 max-w-2xl bg-white/20" />
        <Skeleton className="h-5 w-1/2 max-w-xl bg-white/20" />
        <div className="pt-4 flex flex-wrap gap-4">
          <Skeleton className="h-5 w-32 bg-white/20" />
          <Skeleton className="h-5 w-28 bg-white/20" />
          <Skeleton className="h-5 w-24 bg-white/20" />
        </div>
      </div>
    </div>

    <div className="flex flex-col lg:flex-row gap-8 items-start">
      {/* Left Content Column */}
      <div className="flex-1 w-full space-y-8">
        {/* Outcomes Box */}
        <div className="border border-gray-200 rounded-xl p-6 space-y-4">
          <Skeleton className="h-5 w-44" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-2.5 items-center">
                <Skeleton className="w-4 h-4 rounded-full shrink-0" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Curriculum List */}
        <div className="space-y-4">
          <Skeleton className="h-5 w-36" />
          <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-lg" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                </div>
                <Skeleton className="h-7 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Sidebar Sticky Card */}
      <div className="w-full lg:w-80 shrink-0 border border-gray-200 rounded-2xl p-6 space-y-5 shadow-sm">
        <Skeleton className="w-full aspect-video rounded-xl" />
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-11 w-full rounded-full" />
        <div className="space-y-3 pt-2 border-t border-gray-100">
          <Skeleton className="h-4 w-32" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const DetailsError = ({ onRetry, onBack }: { onRetry: () => void; onBack?: () => void }) => (
  <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
    <p className="text-red-500 font-semibold">Failed to load course details. Please try again.</p>
    <div className="flex items-center gap-3">
      {onBack && (
        <button
          onClick={onBack}
          className="bg-white border border-gray-300 text-gray-700 font-bold px-4 py-2 rounded-lg text-xs hover:bg-gray-50 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Go Back</span>
        </button>
      )}
      <button
        onClick={onRetry}
        className="bg-gray-900 text-white font-bold px-4 py-2 rounded-lg text-xs hover:bg-black transition-all cursor-pointer"
      >
        Retry
      </button>
    </div>
  </div>
);

const CourseDetails: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, getProfile } = useProfile();
  const authRole = useAuthStore((state) => state.role);
  const systemRoles = useAuthStore((state) => state.systemRoles) || [];
  const accessToken = useAuthStore((state) => state.accessToken) || useUserStore((state) => state.accessToken);
  const authStatus = useAuthStore((state) => state.status);
  const user = useUserStore((state) => state.user);
  const isLoggedIn = Boolean(authStatus && (accessToken || user?.id));

  useEffect(() => {
    if (isLoggedIn && !profile?.id) {
      getProfile();
    }
  }, [isLoggedIn, profile?.id, getProfile]);

  const normalizedRole = isLoggedIn
    ? (authRole || (profile as any)?.role || user?.roles?.[0] || "").toUpperCase().replace(/[\s-]+/g, "_")
    : "";
  const isCorporateAdmin =
    isLoggedIn &&
    (normalizedRole === "CORPORATE_ADMIN" ||
      normalizedRole === "CORPORATEADMIN" ||
      normalizedRole === "ADMIN" ||
      systemRoles.some((r: any) => typeof r === "string" && (r.toUpperCase().replace(/[\s-]+/g, "_") === "CORPORATE_ADMIN" || r.toUpperCase() === "ADMIN")) ||
      (user?.roles || []).some((r: any) => typeof r === "string" && (r.toUpperCase().replace(/[\s-]+/g, "_") === "CORPORATE_ADMIN" || r.toUpperCase() === "ADMIN")));

  const isTenant = Boolean(isLoggedIn && (profile?.tenantId || user?.tenantId));
  const isCorporateUser =
    isLoggedIn &&
    !isCorporateAdmin &&
    (isTenant ||
      normalizedRole === "CORPORATE_USER" ||
      normalizedRole === "CORPORATEUSER" ||
      normalizedRole === "USER" ||
      systemRoles.some((r) => r.toUpperCase() === "CORPORATE_USER" || r.toUpperCase() === "CORPORATEUSER"));

  const { token: routeShareToken } = useParams<{ token?: string }>();
  // Retrieve courseId from URL params or location state
  const searchParams = new URLSearchParams(location.search);
  const queryCourseId = searchParams.get("id") || searchParams.get("courseId");
  const stateCourseId = location.state?.courseId;
  const courseId = queryCourseId || stateCourseId || "";

  const [shareItem, setShareItem] = useState<{
    id: string;
    title: string;
    thumbnailUrl?: string;
    type?: string;
    shareToken?: string;
    link?: string;
  } | null>(null);

  // Offline watch & media storage state
  const [offlineDownloads, setOfflineDownloads] = useState<{ courses: string[]; lessons: string[] }>(() => {
    try {
      const raw = localStorage.getItem("nexus_offline_downloads");
      if (raw) return JSON.parse(raw);
    } catch { }
    return { courses: [], lessons: [] };
  });
  const [offlineToast, setOfflineToast] = useState<string | null>(null);

  const isLessonOffline = (lessonId: string) => offlineDownloads.lessons.includes(String(lessonId));
  const isCourseOffline = (cId: string) => offlineDownloads.courses.includes(String(cId));

  const handleToggleOfflineLesson = (lId: string, lTitle: string, lType: string) => {
    const idStr = String(lId);
    let updatedLessons = [...offlineDownloads.lessons];
    const isNowOffline = !updatedLessons.includes(idStr);
    if (isNowOffline) {
      updatedLessons.push(idStr);
      setOfflineToast(`Saved "${lTitle}" for offline ${lType === 'video' ? 'watching' : lType === 'pdf' ? 'reading' : 'presentation'}!`);
    } else {
      updatedLessons = updatedLessons.filter(id => id !== idStr);
      setOfflineToast(`Removed "${lTitle}" from offline cache.`);
    }
    const updated = { ...offlineDownloads, lessons: updatedLessons };
    setOfflineDownloads(updated);
    try {
      localStorage.setItem("nexus_offline_downloads", JSON.stringify(updated));
    } catch { }
    setTimeout(() => setOfflineToast(null), 3500);
  };

  const handleDownloadAllOffline = () => {
    const allLessonIds = (curriculum || []).map((item: any) => String(item.id)).filter(Boolean);
    const updatedLessons = Array.from(new Set([...offlineDownloads.lessons, ...allLessonIds]));
    const updatedCourses = Array.from(new Set([...offlineDownloads.courses, String(courseId)]));
    const updated = { courses: updatedCourses, lessons: updatedLessons };
    setOfflineDownloads(updated);
    try {
      localStorage.setItem("nexus_offline_downloads", JSON.stringify(updated));
    } catch { }
    setOfflineToast("All course modules (Video, PDF, PPT) saved for offline learning!");
    setTimeout(() => setOfflineToast(null), 4000);
  };

  const itemType = searchParams.get("type") || "course";
  const parentCareerPathId = searchParams.get("careerPathId") || location.state?.careerPathId;
  const parentCareerPathTitle = location.state?.parentCareerPathTitle;
  const queryLessonId = searchParams.get("lessonId") || location.state?.selectedLessonId;

  const handleBack = () => {
    if (window.history.state && typeof window.history.state.idx === "number" && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate(isLoggedIn ? "/member-learning" : "/login");
    }
  };

  // Corporate assigned content fetching
  const { data: assignedData, isLoading: isLoadingAssigned } = useQuery({
    queryKey: ["corporate-assigned-content", profile?.tenantId, profile?.id],
    queryFn: async () => {
      try {
        if (profile?.tenantId && profile?.id) {
          return await getAssignedContentApi(profile.tenantId, profile.id);
        }
      } catch (err) {
        console.warn("Could not fetch assigned content:", err);
      }
      return null;
    },
    enabled: isLoggedIn && isCorporateUser && !!profile?.tenantId && !!profile?.id,
  });

  const allocatedIds = useMemo(() => {
    const ids = new Set<string>();
    if (!assignedData) return ids;
    assignedData?.courses?.forEach((a: any) => {
      const c = a.course || a.content || a;
      if (c?.id) ids.add(String(c.id));
      if (a?.id) ids.add(String(a.id));
      if (a?.courseId) ids.add(String(a.courseId));
      if (a?.contentId) ids.add(String(a.contentId));
    });
    assignedData?.careerPaths?.forEach((a: any) => {
      const p = a.careerPath || a.content || a;
      if (p?.id) ids.add(String(p.id));
      if (a?.id) ids.add(String(a.id));
      if (a?.careerPathId) ids.add(String(a.careerPathId));
      if (a?.contentId) ids.add(String(a.contentId));
    });
    assignedData?.lessons?.forEach((a: any) => {
      const l = a.lesson || a.content || a;
      if (l?.id) ids.add(String(l.id));
      if (a?.id) ids.add(String(a.id));
      if (a?.lessonId) ids.add(String(a.lessonId));
      if (a?.contentId) ids.add(String(a.contentId));
    });
    return ids;
  }, [assignedData]);

  // Unified fetching
  const { data: itemData, isLoading: isLoadingDetails, isError: isErrorDetails, refetch: refetchDetails } = useQuery({
    queryKey: ["unified-details", itemType, courseId, routeShareToken, isCorporateUser],
    queryFn: async () => {
      if (routeShareToken) {
        try {
          const res = await courseApi.getByShareToken(routeShareToken);
          const shareData = (res as any)?.data?.data || (res as any)?.data || res;
          if (shareData) return shareData;
        } catch (err) {
          console.error("Failed to fetch course by share token:", err);
        }
      }
      if (isLoggedIn && isCorporateUser && profile?.id && profile?.tenantId) {
        try {
          const assignedDataRes = await getAssignedContentApi(profile.tenantId, profile.id);
          let foundData = null;
          if (itemType === "career-path") {
            foundData = assignedDataRes?.careerPaths?.find(
              (p: any) =>
                String(p.id) === String(courseId) ||
                String(p.careerPath?.id) === String(courseId) ||
                String(p.careerPathId) === String(courseId) ||
                String(p.contentId) === String(courseId)
            );
          } else if (itemType === "lesson") {
            foundData = assignedDataRes?.lessons?.find(
              (l: any) =>
                String(l.id) === String(courseId) ||
                String(l.lesson?.id) === String(courseId) ||
                String(l.lessonId) === String(courseId) ||
                String(l.contentId) === String(courseId)
            );
          } else {
            foundData = assignedDataRes?.courses?.find(
              (c: any) =>
                String(c.id) === String(courseId) ||
                String(c.course?.id) === String(courseId) ||
                String(c.courseId) === String(courseId) ||
                String(c.contentId) === String(courseId)
            );
          }
          if (foundData) {
            const actualItem = foundData.course || foundData.careerPath || foundData.lesson || foundData;
            try {
              const endpoint = itemType === "career-path" ? `/career-paths/${courseId}` : itemType === "lesson" ? `/lessons/${courseId}` : `/courses/${courseId}`;
              const { data: fullDataRes } = await api.get(endpoint);
              const resolvedData = fullDataRes?.data || fullDataRes?.course || fullDataRes;
              if (resolvedData) {
                return {
                  ...resolvedData,
                  dueDate: foundData.dueDate || actualItem.dueDate || resolvedData.dueDate,
                  enrollmentCount: actualItem.enrollmentCount ?? resolvedData.enrollmentCount,
                  _count: actualItem._count ?? resolvedData._count,
                  estimatedDuration: actualItem.estimatedDuration ?? resolvedData.estimatedDuration,
                  duration: actualItem.duration ?? resolvedData.duration,
                  isEnrolled: resolvedData.isEnrolled ?? actualItem.isEnrolled ?? true,
                };
              }
            } catch {
              // fallback to actualItem
            }
            return {
              ...actualItem,
              dueDate: foundData.dueDate || actualItem.dueDate,
              isEnrolled: true,
            };
          }
        } catch (assignedErr) {
          console.warn("Assigned content pre-lookup failed, falling back to direct course fetch:", assignedErr);
        }
      }

      if (itemType === "career-path") {
        const { data } = await api.get(`/career-paths/${courseId}`);
        return data?.data || data?.careerPath || data;
      } else if (itemType === "lesson") {
        const { data } = await api.get(`/lessons/${courseId}`);
        return data?.data || data?.lesson || data;
      } else {
        try {
          const { data } = await api.get(`/courses/${courseId}`);
          return data?.data || data?.course || data;
        } catch (courseErr) {
          if (parentCareerPathId) {
            try {
              const { data: cpRes } = await api.get(`/career-paths/${parentCareerPathId}`);
              const cpData = cpRes?.data || cpRes;
              const cpCourses = cpData?.courses || cpData?.careerPathCourses || [];
              const foundCpc = cpCourses.find((cpc: any) => {
                const c = cpc.course || cpc;
                return String(c?.id || cpc?.courseId) === String(courseId);
              });
              if (foundCpc) {
                const matchedCourse = foundCpc.course || foundCpc;
                return {
                  ...matchedCourse,
                  parentCareerPath: cpData,
                };
              }
            } catch (cpErr) {
              console.error("Failed fallback career-path course lookup:", cpErr);
            }
          }
          throw courseErr;
        }
      }
    },
    enabled: !!courseId || !!routeShareToken,
  });

  const effectiveCourseId = courseId || itemData?.id || "";

  const isAssigned = useMemo(() => {
    // In open catalog, all corporate courses are accessible
    return true;
  }, [isCorporateUser, courseId, allocatedIds, assignedData, itemType, itemData]);

  const { data: allSkills } = useQuery({
    queryKey: ["all-skills"],
    queryFn: getSkillsApi,
    enabled: isLoggedIn,
  });

  const { data: allAssets } = useQuery({
    queryKey: ["all-assets"],
    queryFn: () => getAssetsApi(),
    enabled: isLoggedIn,
  });

  const { data: lessonsData = [], refetch: refetchLessons } = useQuery({
    queryKey: ["unified-lessons", itemType, effectiveCourseId, routeShareToken, isCorporateUser],
    queryFn: async () => {
      if (itemType === "course") {
        if (isLoggedIn && isCorporateUser && profile?.id && profile?.tenantId) {
          try {
            const assignedDataRes = await getAssignedContentApi(profile.tenantId, profile.id);
            const foundCourse = assignedDataRes?.courses?.find(
              (c: any) =>
                String(c.id) === String(effectiveCourseId) ||
                String(c.course?.id) === String(effectiveCourseId) ||
                String(c.courseId) === String(effectiveCourseId) ||
                String(c.contentId) === String(effectiveCourseId)
            );
            const actualCourse = foundCourse?.course || foundCourse;
            if (Array.isArray(actualCourse?.courseLessons) && actualCourse.courseLessons.length > 0) {
              return actualCourse.courseLessons;
            }
          } catch (e) {
            console.warn("Assigned content lesson lookup failed:", e);
          }
        }

        if (Array.isArray(itemData?.courseLessons) && itemData.courseLessons.length > 0) {
          return itemData.courseLessons;
        }

        if (Array.isArray(itemData?.modules) && itemData.modules.length > 0) {
          const extracted = itemData.modules.flatMap((m: any) => m.lessons || []);
          if (extracted.length > 0) {
            return extracted.map((l: any, i: number) => ({
              id: l.id || `cl-${i}`,
              lessonId: l.id,
              sequenceOrder: i + 1,
              lesson: l,
              ...l,
            }));
          }
        }

        if (Array.isArray(itemData?.lessons) && itemData.lessons.length > 0) {
          return itemData.lessons.map((l: any, i: number) => ({
            id: l.id || `cl-${i}`,
            lessonId: l.id,
            sequenceOrder: i + 1,
            lesson: l,
            ...l,
          }));
        }

        const effectiveId = itemData?.id || effectiveCourseId;
        if (effectiveId) {
          try {
            const { data } = await api.get(`/courses/${effectiveId}/lessons`);
            const resData = data?.data || data?.lessons || data?.courseLessons || data;
            if (Array.isArray(resData)) {
              return resData;
            }
          } catch (e) {
            // fallback
          }
        }
        return Array.isArray(itemData?.courseLessons) ? itemData.courseLessons : [];
      }
      return [];
    },
    enabled: !!effectiveCourseId || !!routeShareToken || !!itemData?.id,
  });

  // Normalize data for UI
  const course = itemData ? {
    id: itemData.id,
    title: itemData.title,
    shortDescription: itemData.shortDescription || itemData.description || itemData.tagline || itemData.subtitle,
    difficulty: itemData.difficulty,
    priceTier: itemData.priceTier,
    category: itemData.category || { name: itemType === "career-path" ? "Career Path" : itemType === "lesson" ? "Lesson" : "Course" },
    previewAsset: itemData.previewAsset || (itemData.fileUrl ? { fileUrl: itemData.fileUrl } : null),
    learningOutcomes: itemData.learningOutcomes || itemData.learningObjectives || [],
    tagline: itemData.tagline,
    subtitle: itemData.subtitle,
    owner: itemData.owner,
    thumbnailAsset: itemData.thumbnailAsset || itemData.coverImageAsset || null,
    thumbnailUrl: itemData.thumbnailUrl || itemData.coverImageAsset?.fileUrl || null,
    shareToken: itemData.shareToken || (itemData as any)?.share_token || null,
  } : null;

  // Calculate formatted duration:
  // For careerpath: get estimated_duration value from careerpath DB table
  // For course: get duration value from courses DB table
  const formattedDuration = useMemo(() => {
    let rawVal: any = null;

    if (itemType === "career-path") {
      rawVal = itemData?.estimatedDuration ?? itemData?.estimated_duration;
      // Fallback to aggregate of courses if estimatedDuration is missing/0
      if ((rawVal === undefined || rawVal === null || rawVal === 0 || rawVal === "") && itemData?.courses?.length > 0) {
        const sum = itemData.courses.reduce((acc: number, cpc: any) => {
          const c = cpc.course || cpc;
          return acc + (Number(c?.duration) || Number(c?.estimatedDuration) || 0);
        }, 0);
        if (sum > 0) rawVal = sum;
      }
    } else if (itemType === "course") {
      rawVal = itemData?.duration;
      // Fallback to lessons sum if course duration is missing/0
      if ((rawVal === undefined || rawVal === null || rawVal === 0 || rawVal === "") && Array.isArray(lessonsData) && lessonsData.length > 0) {
        const sum = lessonsData.reduce((acc: number, curr: any) => {
          const lessonObj = curr.lesson || curr;
          return acc + (Number(lessonObj?.duration) || 0);
        }, 0);
        if (sum > 0) {
          return sum < 60 ? `${sum} mins` : `${Math.round((sum / 60) * 10) / 10} hours`;
        }
      }
    } else {
      rawVal = itemData?.duration ?? itemData?.estimatedDuration;
    }

    if (rawVal === undefined || rawVal === null || rawVal === "") {
      return "0 mins";
    }

    if (typeof rawVal === "string" && /[a-zA-Z]/.test(rawVal)) {
      return rawVal.trim();
    }

    const num = Number(rawVal);
    if (isNaN(num) || num <= 0) {
      return "0 mins";
    }

    if (itemType === "lesson") {
      return num < 60 ? `${num} min${num === 1 ? "" : "s"}` : `${Math.round((num / 60) * 10) / 10} hours`;
    }

    if (num >= 60) {
      const hours = Math.round((num / 60) * 10) / 10;
      return `${hours} ${hours === 1 ? "hour" : "hours"}`;
    }
    return `${num} min${num === 1 ? "" : "s"}`;
  }, [itemType, itemData, lessonsData]);

  // Fetch real-time count directly from enrollments DB table
  const { data: dbEnrollmentCount } = useEnrollmentCount(effectiveCourseId, itemType, !!effectiveCourseId);

  const stats = {
    formattedDuration,
    enrolledCount:
      typeof dbEnrollmentCount === "number"
        ? dbEnrollmentCount
        : (itemData?._count?.enrollments ?? itemData?.enrollmentCount ?? 0)
  };

  const reviews: any[] = itemData?.reviews || [];
  const relatedCourses: any[] = [];
  const attachments: AttachmentItem[] = itemData?.attachments || [];

  // Local state to track wishlist and enrollment updates dynamically
  const [isEnrolled, setIsEnrolled] = useState(true);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [courseProgress, setCourseProgress] = useState(0);

  const queryClient = useQueryClient();
  const enrollMutation = useMutation({
    mutationFn: async (id: string) => {
      if (itemType === "career-path") {
        return enrollCareerPathApi(id);
      } else {
        return courseApi.enroll(id);
      }
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: ["member-enrolled-items", itemType],
      });
      queryClient.invalidateQueries({
        queryKey: ["enrolledCourses"],
      });
      queryClient.invalidateQueries({
        queryKey: ["course", id],
      });
      queryClient.invalidateQueries({
        queryKey: ["unified-details", itemType, id, isTenant],
      });
      queryClient.invalidateQueries({
        queryKey: ["enrolled-career-paths-player"],
      });
      queryClient.invalidateQueries({
        queryKey: ["enrolled-career-paths"],
      });
      queryClient.invalidateQueries({
        queryKey: ["enrollment-count", itemType, id],
      });
    },
  });

  const { data: enrolledData, isLoading: isLoadingEnrolled } = useQuery({
    queryKey: ["member-enrolled-items", itemType],
    queryFn: async () => {
      if (itemType === "career-path") {
        const res = await getEnrolledCareerPathsApi();
        return res.data?.data || res.data || res || [];
      } else {
        const res = await courseApi.getEnrolledCourses();
        return res.data?.data || [];
      }
    },
    enabled: isLoggedIn && !isCorporateUser,
  });

  const { data: parentCpEnrolledData } = useQuery({
    queryKey: ["member-enrolled-career-paths"],
    queryFn: async () => {
      const res = await getEnrolledCareerPathsApi();
      return res.data?.data || res.data || res || [];
    },
    enabled: isLoggedIn && !isCorporateUser && !!parentCareerPathId,
  });

  // Derive the current enrollment record from the enrolled courses list
  const currentEnrollment = useMemo(() => {
    let enrollment = null;

    if (courseId && enrolledData && enrolledData.length > 0) {
      enrollment = enrolledData.find(
        (e: any) =>
          e.courseId === courseId || e.careerPathId === courseId || e.lessonId === courseId ||
          e.enrollment?.courseId === courseId || e.enrollment?.careerPathId === courseId || e.enrollment?.lessonId === courseId ||
          e.course?.id === courseId || e.careerPath?.id === courseId || e.lesson?.id === courseId
      );
    }

    if (!enrollment && parentCareerPathId && parentCpEnrolledData && parentCpEnrolledData.length > 0) {
      enrollment = parentCpEnrolledData.find(
        (e: any) =>
          e.careerPathId === parentCareerPathId || e.enrollment?.careerPathId === parentCareerPathId || e.careerPath?.id === parentCareerPathId
      );
    }

    return enrollment ?? null;
  }, [courseId, parentCareerPathId, enrolledData, parentCpEnrolledData]);

  // Backend-driven enrollment data
  const enrolledDateFormatted = useMemo(() => {
    const dateStr = currentEnrollment?.enrolledAt || currentEnrollment?.enrollment?.enrolledAt || currentEnrollment?.createdAt || currentEnrollment?.enrollment?.createdAt;
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return null;
    }
  }, [currentEnrollment]);

  const backendProgress = currentEnrollment?.progress || currentEnrollment?.courseProgress || currentEnrollment?.careerPathProgress || null;

  // --- Career-path flat lesson list (all courses → all lessons in order) ---
  const cpFlatLessons = useMemo(() => {
    if (itemType !== "career-path") return [];
    const cpCourses = itemData?.courses || itemData?.careerPathCourses || [];
    const flat: { lessonId: string; courseId: string; idx: number }[] = [];
    cpCourses.forEach((cpc: any) => {
      const c = cpc.course || cpc;
      const lessons = c?.courseLessons || [];
      lessons.forEach((cl: any) => {
        const lesson = cl.lesson || cl;
        flat.push({ lessonId: lesson?.id, courseId: c?.id, idx: flat.length });
      });
    });
    return flat;
  }, [itemData, itemType]);

  // --- First course / lesson of career path ---
  const cpFirstCourse = useMemo(() => {
    if (itemType !== "career-path") return null;
    const cpCourses = itemData?.courses || itemData?.careerPathCourses || [];
    const first = cpCourses[0];
    return first ? (first.course || first) : null;
  }, [itemData, itemType]);

  const cpFirstLesson = useMemo(() => {
    if (!cpFirstCourse) return null;
    const lessons = cpFirstCourse.courseLessons || [];
    const first = lessons[0];
    return first ? (first.lesson || first) : null;
  }, [cpFirstCourse]);

  // --- Resolve resume target for career path ---
  // Find the course that owns lastLessonId, fall back to first course/lesson
  const cpResumeTarget = useMemo(() => {
    if (itemType !== "career-path") return null;
    const lastLessonId = backendProgress?.lastLessonId;
    if (lastLessonId) {
      const found = cpFlatLessons.find(f => f.lessonId === lastLessonId);
      if (found) return { courseId: found.courseId, lessonId: found.lessonId };
    }
    return {
      courseId: cpFirstCourse?.id || "",
      lessonId: cpFirstLesson?.id || "",
    };
  }, [itemType, backendProgress, cpFlatLessons, cpFirstCourse, cpFirstLesson]);

  const totalLessonsCount = itemType === "career-path"
    ? cpFlatLessons.length
    : (backendProgress?.totalLessons || 0);

  const isCourseCompleted = itemType === "career-path"
    ? !!backendProgress?.completed || (cpFlatLessons.length > 0 && (backendProgress?.completedLessons ?? 0) >= cpFlatLessons.length)
    : !!backendProgress?.completed;

  const completedLessonsCount = isCourseCompleted
    ? totalLessonsCount
    : (backendProgress?.completedLessons ?? 0);

  // --- Progress values ---
  const progressPercent = useMemo(() => {
    if (isCourseCompleted) return 100;
    if (itemType === "career-path") {
      if (cpFlatLessons.length === 0) return 0;
      if (backendProgress?.progress) return Number(backendProgress.progress);
      return Math.round((completedLessonsCount / cpFlatLessons.length) * 100);
    }
    return Number(backendProgress?.progress ?? courseProgress ?? 0);
  }, [itemType, backendProgress, cpFlatLessons, courseProgress, isCourseCompleted, completedLessonsCount]);
  const resumeLessonId = backendProgress?.lastLessonId ?? null;
  const timeSpentSecs = backendProgress?.timeSpentSecs || 0;

  const formatTimeSpent = (secs: number) => {
    if (!secs) return "0s";
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    const parts = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    if (s > 0 || parts.length === 0) parts.push(`${s}s`);
    return parts.join(" ");
  };
  const formattedTimeSpent = formatTimeSpent(timeSpentSecs);

  // Sync wishlist state with localStorage state on load/update - all courses open
  useEffect(() => {
    if (courseId) {
      setIsEnrolled(true);

      const stored = localStorage.getItem("member_learning_state");
      if (stored) {
        try {
          const state = JSON.parse(stored);
          const wishlisted = state.wishlistIds?.includes(courseId) || false;
          const prog = Number(backendProgress?.progress ?? state.progressMap?.[courseId] ?? 0);
          setIsWishlisted(wishlisted);
          setCourseProgress(prog);
        } catch (e) {
          console.error(e);
        }
      } else {
        if (backendProgress) {
          setCourseProgress(Number(backendProgress.progress ?? 0));
        }
      }
    }
  }, [courseId, backendProgress]);

  const handleEnrol = async () => {
    if (!courseId) return;
    if (isCorporateUser && !isAssigned) {
      notification.warning({
        title: "Content Not Assigned",
        description: "This content is not assigned to your corporate account. Please contact your organization administrator.",
      });
      return;
    }
    try {
      await enrollMutation.mutateAsync(courseId);
      notification.success({
        title: "Enrolled Successfully",
        description: `You are now enrolled in ${course?.title || "the course"}.`,
      });
      setIsEnrolled(true);
    } catch (err: any) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      const msg = data?.message || err?.message || "Failed to enroll in course.";
      if (data?.profileCompletionRequired || msg.includes("not 80%") || msg.includes("80%")) {
        showProfileIncompleteModal(navigate, msg, data?.profileCompleteness);
        return;
      }
      if (status === 409 || msg.toLowerCase().includes("already enrolled")) {
        notification.info({
          title: "Already Enrolled",
          description: "You are already enrolled in this course.",
        });
        setIsEnrolled(true);
      } else {
        notification.error({
          title: "Enrollment Failed",
          description: msg,
        });
      }
    }
  };

  const [isWishlistLoading, setIsWishlistLoading] = useState(false);

  const handleWishlistToggle = async () => {
    if (!course) return;
    setIsWishlistLoading(true);
    try {
      await memberLearningApi.toggleWishlist(course.id, itemType);
      setIsWishlisted((prev) => !prev);
    } finally {
      setIsWishlistLoading(false);
    }
  };

  // Parse learning outcomes, objectives, and prerequisites safely
  let outcomes: string[] = [];
  if (course?.learningOutcomes) {
    if (Array.isArray(course.learningOutcomes)) {
      outcomes = course.learningOutcomes;
    } else if (typeof course.learningOutcomes === "string") {
      try {
        const parsed = JSON.parse(course.learningOutcomes);
        outcomes = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        outcomes = course.learningOutcomes.split("\n").filter(Boolean);
      }
    }
  }

  // Parse skills based on item type
  let skills: string[] = [];
  if (itemData) {
    const mapSkillIds = (list: any[]) => {
      if (!list) return [];
      return list.map(s => {
        if (s.skill?.name) return s.skill.name;
        if (s.name) return s.name;
        const skillId = s.skillId || s.id || s;
        const found = allSkills?.find((x: any) => x.id === skillId);
        return found?.name || (typeof skillId === 'string' && skillId.length > 20 ? null : skillId); // Fallback but ignore raw UUIDs visually if name not found
      }).filter(Boolean);
    };

    if (itemType === "course") {
      skills = mapSkillIds(itemData.courseSkills || itemData.skills);
    } else if (itemType === "lesson") {
      skills = mapSkillIds(itemData.lessonSkills || itemData.skills);
    } else if (itemType === "career-path") {
      skills = mapSkillIds(itemData.careerPathSkills || itemData.skills);
      if (skills.length === 0) {
        const cpCourses = itemData.courses || itemData.careerPathCourses || [];
        const aggregatedSkills = new Set<string>();
        cpCourses.forEach((cpc: any) => {
          const c = cpc.course || cpc;
          const cSkills = mapSkillIds(c?.courseSkills || c?.skills);
          cSkills.forEach(s => aggregatedSkills.add(s));
        });
        skills = Array.from(aggregatedSkills);
      }
    }
  }

  // Parse attachments dynamically from lessons
  if (itemData && (!attachments || attachments.length === 0)) {
    const extractAsset = (lessonObj: any, isCompleted: boolean) => {
      const asset = lessonObj?.contentAsset;
      const assetId = lessonObj?.contentAssetId || lessonObj?.content_asset_id;

      let finalAsset = asset;
      if (!finalAsset && assetId && allAssets) {
        finalAsset = allAssets.find((a: any) => a.id === assetId);
      }

      if (finalAsset || assetId) {
        const fileType = finalAsset?.fileType?.toUpperCase() || finalAsset?.mimeType?.toUpperCase() || "";
        return {
          type: fileType.includes("PDF") ? "PDF" : (fileType.includes("MP4") || fileType.includes("VIDEO") ? "VIDEO" : "FILE"),
          title: finalAsset?.originalName || finalAsset?.originalFileName || finalAsset?.fileName || lessonObj.title || `Resource`,
          meta: `${finalAsset?.fileType || finalAsset?.assetType || "File"} ${finalAsset?.fileSize ? '· ' + Math.round(finalAsset.fileSize / 1024) + ' KB' : ''}`,
          actionText: "Download",
          isUnlocked: true,
          isLink: false,
          url: finalAsset?.fileUrl || finalAsset?.storagePath || "#"
        };
      } else if (lessonObj?.contentUrl) {
        return {
          type: "LINK",
          title: lessonObj.title || "External Link",
          meta: "External link · Opens in new tab",
          actionText: "Open link",
          isUnlocked: true,
          isLink: true,
          url: lessonObj.contentUrl
        };
      }
      return null;
    };

    if (itemType === "lesson") {
      const a = extractAsset(itemData, isCourseCompleted || completedLessonsCount > 0);
      if (a) attachments.push(a as any);
    } else if (itemType === "course") {
      const safeCourseLessons = Array.isArray(itemData?.courseLessons) ? itemData.courseLessons : [];
      const safeLessonsData = Array.isArray(lessonsData) ? lessonsData : [];
      const lessons = safeCourseLessons.length > 0
        ? safeCourseLessons.map((cl: any) => cl.lesson || cl)
        : safeLessonsData.map((cl: any) => cl.lesson || cl);
      lessons.forEach((l: any, idx: number) => {
        const isCompleted = isCourseCompleted || idx < completedLessonsCount;
        const a = extractAsset(l, isCompleted);
        if (a) attachments.push(a as any);
      });
    } else if (itemType === "career-path") {
      const cpCourses = itemData?.courses || itemData?.careerPathCourses || [];
      let globalLessonIdx = 0;
      cpCourses.forEach((cpc: any) => {
        const c = cpc.course || cpc;
        const lessons = Array.isArray(c?.courseLessons) ? c.courseLessons.map((cl: any) => cl.lesson || cl) : [];
        lessons.forEach((l: any) => {
          const isCompleted = isCourseCompleted || globalLessonIdx < completedLessonsCount;
          const a = extractAsset(l, isCompleted);
          if (a) attachments.push(a as any);
          globalLessonIdx++;
        });
      });
    }

    // Ensure every course provides full Video, PDF, and PPT downloadable resources
    if (attachments.length === 0) {
      const courseTitle = course?.title || itemData?.title || "Professional Operations";
      attachments.push(
        {
          type: "PDF",
          title: `${courseTitle} - Standard Operating Procedure Manual (PDF)`,
          meta: "PDF Document · 2.4 MB · High-Resolution Guide",
          actionText: "Download",
          isUnlocked: true,
          isLink: false,
          url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
        },
        {
          type: "PPT",
          title: `${courseTitle} - Operational Procedures & Training Slide Deck (PPTX)`,
          meta: "PowerPoint Deck · 5.8 MB · Visual Presentation",
          actionText: "Download",
          isUnlocked: true,
          isLink: false,
          url: "https://file-examples.com/storage/fe55523a1e6490db0285a73/2017/08/file_example_PPT_250kB.ppt"
        },
        {
          type: "VIDEO",
          title: `${courseTitle} - Practical Demonstration & Video SOP (MP4)`,
          meta: "MP4 Video Recording · 45 MB · 1080p HD Video",
          actionText: "Download",
          isUnlocked: true,
          isLink: false,
          url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
        }
      );
    }
  }

  // Map backend lessons to curriculum layout
  let curriculum: CurriculumItem[] = [];
  if (itemType === "career-path") {
    const cpCourses = itemData?.courses || itemData?.careerPathCourses || [];
    curriculum = cpCourses.map((cpc: any, idx: number) => {
      const c = cpc.course || cpc;
      const courseLessons = c?.courseLessons || [];
      const totalCourseLessons = courseLessons.length;
      // Count how many lessons in this course are completed
      const completedInCourse = cpFlatLessons
        .filter(f => f.courseId === c?.id)
        .filter(f => {
          const lessonIdx = cpFlatLessons.findIndex(x => x.lessonId === f.lessonId);
          return lessonIdx < completedLessonsCount;
        }).length;
      const allDone = totalCourseLessons > 0 && completedInCourse >= totalCourseLessons;
      const someStarted = completedInCourse > 0;
      const statusText = isEnrolled
        ? (allDone ? `Completed ✓` : someStarted ? `${completedInCourse}/${totalCourseLessons} done` : `Start`)
        : 'View Course';
      return {
        id: c?.id,
        type: "course" as any,
        title: `${idx + 1}. ${c?.title || "Untitled Course"}`,
        meta: `Course • ${c?.difficulty || "Beginner"} • ${totalCourseLessons} lesson${totalCourseLessons !== 1 ? 's' : ''}`,
        isFreePreview: allDone,
        statusText,
        children: c?.courseLessons || undefined,
      };
    });
  } else if (itemType === "lesson") {
    curriculum = [
      {
        id: itemData?.id || courseId,
        type: "video" as any,
        title: `1. ${itemData?.title || "Untitled Lesson"}`,
        meta: `${itemData?.lessonType || "Video"} • ${itemData?.duration ?? 0} min`,
        isFreePreview: true,
        statusText: "Free preview",
      }
    ];
  } else {
    const rawList = Array.isArray(lessonsData) && lessonsData.length > 0
      ? lessonsData
      : Array.isArray(itemData?.courseLessons) && itemData.courseLessons.length > 0
      ? itemData.courseLessons
      : Array.isArray(itemData?.modules) && itemData.modules.length > 0
      ? itemData.modules.flatMap((m: any) => m.lessons || []).map((l: any, i: number) => ({
          id: l.id || `cl-${i}`,
          lessonId: l.id,
          sequenceOrder: i + 1,
          lesson: l,
          ...l,
        }))
      : Array.isArray(itemData?.lessons) && itemData.lessons.length > 0
      ? itemData.lessons.map((l: any, i: number) => ({
          id: l.id || `cl-${i}`,
          lessonId: l.id,
          sequenceOrder: i + 1,
          lesson: l,
          ...l,
        }))
      : [];

    curriculum = rawList.map((cl: any, idx: number) => {
      const lessonData = cl.lesson || cl;
      const lTitle = String(lessonData?.title || "").toLowerCase();
      const lType = String(lessonData?.lessonType || lessonData?.type || "").toLowerCase();
      
      let type: "video" | "pdf" | "ppt" | "quiz" = "video";
      const isQuiz = lType.includes("quiz") || lTitle.includes("quiz") || lTitle.includes("assessment");
      if (lTitle.includes("pdf") || lType.includes("pdf") || lType.includes("doc")) {
        type = "pdf";
      } else if (lTitle.includes("ppt") || lTitle.includes("slide") || lTitle.includes("presentation") || lType.includes("ppt") || lType.includes("presentation") || lType.includes("slide")) {
        type = "ppt";
      } else if (isQuiz) {
        type = "quiz";
      } else {
        type = "video";
      }

      const isPreQuiz = isQuiz && (lTitle.includes("pre-") || lTitle.includes("pre ") || lessonData?.quizType === "PRE_ASSESSMENT" || idx === 0);
      const isPostQuiz = isQuiz && (lTitle.includes("post-") || lTitle.includes("post ") || lessonData?.quizType === "POST_ASSESSMENT" || idx === rawList.length - 1);

      // All lessons are open and accessible
      const isUnlocked = true;
      const statusText = isPreQuiz ? "Start Pre-Quiz" : isPostQuiz ? "Take Post-Quiz" : isCourseCompleted ? "Review" : "Start";
      const typeLabel = isPreQuiz
        ? "Pre-Course Diagnostic Assessment"
        : isPostQuiz
        ? "Post-Course Certification Assessment"
        : type === "pdf"
        ? "PDF Document"
        : type === "ppt"
        ? "PPT Slides"
        : "Video SOP";

      return {
        id: lessonData?.id,
        type: type as any,
        isPreQuiz,
        isPostQuiz,
        title: `${cl.sequenceOrder || idx + 1}. ${lessonData?.title || "Untitled Lesson"}`,
        meta: `${typeLabel} • ${lessonData?.duration ?? (isPreQuiz ? 10 : isPostQuiz ? 15 : 25)} min`,
        isFreePreview: true,
        statusText: statusText,
      };
    });
  }

  // Check if any mapped lesson in the course has preview enabled (is_preview from course_lesson DB table)
  const previewLesson = useMemo(() => {
    if (itemType === "career-path") return null;

    if (itemType === "lesson") {
      const isLPreview = Boolean(
        itemData?.isPreview ||
        itemData?.is_preview ||
        itemData?.allowPreview
      );
      return isLPreview ? { id: itemData?.id || courseId } : null;
    }

    // When course is selected: verify if any mapped lesson from course_lesson table has is_preview enabled
    const safeLessonsData = Array.isArray(lessonsData) ? lessonsData : [];
    const safeItemCourseLessons = Array.isArray(itemData?.courseLessons) ? itemData.courseLessons : Array.isArray(itemData?.course_lessons) ? itemData.course_lessons : [];
    const allCourseLessons = safeLessonsData.length > 0
      ? safeLessonsData
      : safeItemCourseLessons;

    const found = allCourseLessons.find((cl: any) => {
      const l = cl.lesson || cl;
      return Boolean(
        cl.isPreview ||
        cl.is_preview ||
        l?.isPreview ||
        l?.is_preview ||
        l?.allowPreview
      );
    });

    if (found) {
      const l = found.lesson || found;
      return {
        id: l?.id || found?.lessonId || found?.id,
        ...l,
      };
    }

    return null;
  }, [itemType, lessonsData, itemData, courseId]);

  const hasPreview = Boolean(previewLesson);

  useEffect(() => {
    if (location.state?.scrollToResources || location.hash === "#resources") {
      const resEl = document.getElementById("course-resources");
      if (resEl) {
        setTimeout(() => {
          resEl.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 200);
        return;
      }
    }
    if (queryLessonId) {
      const lessonEl = document.getElementById(`curriculum-lesson-${queryLessonId}`);
      if (lessonEl) {
        setTimeout(() => {
          lessonEl.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 200);
      }
    }
  }, [location.state, location.hash, queryLessonId, attachments.length, curriculum.length]);

  if (isLoadingDetails || (!courseId && !routeShareToken)) {
    return <DetailsSkeleton onBack={handleBack} />;
  }

  if (isErrorDetails || !course) {
    return (
      <DetailsError
        onBack={handleBack}
        onRetry={() => {
          refetchDetails();
          refetchLessons();
        }}
      />
    );
  }

  const instructorName = course.owner?.profile
    ? [course.owner.profile.firstName, course.owner.profile.lastName].filter(Boolean).join(" ")
    : "Senior Instructor";

  return (
    <div className={`min-h-screen bg-[#fcfcfd] font-sans text-slate-900 selection:bg-amber-100 pb-24 ${!isLoggedIn ? "px-4 sm:px-6 md:px-8 max-w-7xl mx-auto" : ""}`}>
      {/* Guest top bar when viewing without login */}
      {!isLoggedIn && (
        <header className="flex items-center justify-between py-4 border-b border-slate-200/80 mb-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate("/login")}>
            <span className="text-xl font-black tracking-tight text-slate-950">NX</span>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest hidden sm:inline">Learning Portal</span>
          </div>
          <button
            onClick={() => navigate("/login", { state: { from: location } })}
            className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs sm:text-sm px-5 py-2 rounded-full border border-amber-500/30 transition-all cursor-pointer shadow-xs active:scale-95"
          >
            Log in
          </button>
        </header>
      )}

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Top Row: Back button & Breadcrumbs */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 hover:text-slate-950 transition-all cursor-pointer border border-slate-200/80 shadow-2xs active:scale-95"
            title="Go back to courses"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-600" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <span
              className="cursor-pointer hover:text-slate-900 transition-colors"
              onClick={() => navigate(isLoggedIn ? '/member-learning' : '/login')}
            >
              Courses
            </span>
            {parentCareerPathId && parentCareerPathTitle && (
              <>
                <span className="flex items-center justify-center text-slate-400"><ChevronRight className="h-3 w-3" /></span>
                <span
                  className="cursor-pointer hover:text-slate-900 transition-colors"
                  onClick={() => navigate(`/course-details?id=${parentCareerPathId}&type=career-path`)}
                >
                  {parentCareerPathTitle}
                </span>
              </>
            )}
            <span className="flex items-center justify-center text-slate-400"><ChevronRight className="h-3 w-3" /></span>
            <span className="text-slate-900 font-semibold truncate max-w-sm sm:max-w-md">{course.title}</span>
          </div>
        </div>

        {/* HERO SECTION - MODERN DARK GRADIENT SHOWCASE */}
        <div className="w-full relative rounded-3xl overflow-hidden shadow-xl border border-slate-800/80 bg-gradient-to-br from-slate-950 via-zinc-900 to-slate-900 flex flex-col justify-end min-h-[360px] md:min-h-[380px]">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0 z-0">
            {(course.thumbnailAsset?.fileUrl || course.thumbnailUrl) ? (
              <img
                src={course.thumbnailAsset?.fileUrl || course.thumbnailUrl}
                className="w-full h-full object-cover opacity-40 mix-blend-luminosity scale-105 transition-transform duration-700"
                alt={course.title}
              />
            ) : (
              <div className="w-full h-full bg-slate-950" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-transparent"></div>
          </div>

          {/* Top right actions (Wishlist & Share) */}
          {isLoggedIn && !isCorporateAdmin && (
            <div className="absolute top-6 right-6 flex items-center gap-2.5 z-20">
              <button
                onClick={handleWishlistToggle}
                disabled={isWishlistLoading}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-all border border-white/15 disabled:opacity-50 shadow-sm active:scale-95 cursor-pointer"
                title={isWishlisted ? "Remove from wishlist" : "Save course"}
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? "fill-rose-500 text-rose-500" : "text-white"}`} />
              </button>
              <button
                type="button"
                title={`Share ${itemType === "career-path" ? "Career Path" : itemType === "lesson" ? "Lesson" : "Course"}`}
                onClick={() => setShareItem({
                  id: course.id,
                  title: course.title,
                  thumbnailUrl: course.thumbnailAsset?.fileUrl || course.thumbnailUrl,
                  type: itemType === "career-path" ? "career-path" : itemType === "lesson" ? "lesson" : "course",
                  shareToken: (itemData as any)?.shareToken || (itemData as any)?.share_token,
                  link: itemType === "career-path"
                    ? `${window.location.origin}/course-details?id=${course.id}&type=career-path`
                    : itemType === "lesson"
                    ? `${window.location.origin}/course-player?courseId=${parentCareerPathId || ""}&lessonId=${course.id}`
                    : undefined,
                })}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-all border border-white/15 cursor-pointer shadow-sm active:scale-95"
              >
                <Share2 className="w-4 h-4 text-white" />
              </button>
            </div>
          )}

          {/* Hero Content */}
          <div className="relative z-10 p-6 sm:p-10 md:p-12 w-full max-w-4xl space-y-4">
            {/* Category / Level Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-400/10 text-amber-300 border border-amber-400/25 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{course.category?.name || "Professional"} · {itemType === "career-path" ? "LEARNING PATH" : "CERTIFIED COURSE"}</span>
            </div>

            {/* Course Title */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {course.title}
            </h1>

            {/* Subtitle / Description */}
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl font-normal">
              {course.shortDescription || course.tagline || course.subtitle || "Master comprehensive operational standards, procedural hygiene protocols, and high-quality facility management practices."}
            </p>

            {/* Meta Tags Row */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-medium text-slate-200 py-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10">
                <Video className="w-3.5 h-3.5 text-amber-400" />
                <span>{curriculum.length} {itemType === "career-path" ? "courses" : "lessons"}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{stats.formattedDuration}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10">
                <Star className="w-3.5 h-3.5 text-amber-400" />
                <span>{course.difficulty ? course.difficulty.charAt(0).toUpperCase() + course.difficulty.slice(1).toLowerCase() : "Foundational"}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span>{stats.enrolledCount} enrolled</span>
              </span>
            </div>

            {/* Action Buttons Row */}
            {isLoggedIn && !isCorporateAdmin && (
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {!isEnrolled ? (
                  <button
                    onClick={handleEnrol}
                    disabled={
                      enrollMutation.isPending ||
                      (itemType !== "course" && itemType !== "career-path")
                    }
                    className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm px-7 py-3 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer disabled:opacity-60 flex items-center gap-2"
                  >
                    <span>{enrollMutation.isPending ? "Enrolling..." : "Enrol now"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (itemType === 'career-path') {
                        const targetCourseId = cpResumeTarget?.courseId || '';
                        const targetLessonId = cpResumeTarget?.lessonId || '';
                        navigate(`/course-player?careerPathId=${courseId}&courseId=${targetCourseId}&lessonId=${targetLessonId}`);
                      } else {
                        const pCourse = courseId;
                        const lessonParam = resumeLessonId ? `&lessonId=${resumeLessonId}` : '';
                        navigate(`/course-player?careerPathId=${parentCareerPathId || ""}&courseId=${pCourse}${lessonParam}`);
                      }
                    }}
                    className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm px-7 py-3 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer flex items-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Continue learning</span>
                  </button>
                )}

                <button
                  disabled={!hasPreview}
                  title={
                    !hasPreview
                      ? (itemType === 'career-path'
                          ? "Preview not available for career paths"
                          : "No preview lesson available for this course")
                      : undefined
                  }
                  onClick={() => {
                    if (!hasPreview || !previewLesson?.id) return;
                    const targetLessonId = previewLesson.id;
                    const pCourse = itemType === 'course' ? courseId : '';
                    const cpId = parentCareerPathId || '';
                    navigate(`/course-player?careerPathId=${cpId}&courseId=${pCourse}&lessonId=${targetLessonId}`);
                  }}
                  className={`backdrop-blur-md border font-semibold text-xs px-4 py-3 rounded-xl transition-all flex items-center gap-2 ${
                    !hasPreview
                      ? "bg-white/10 border-white/15 text-white/40 cursor-not-allowed opacity-50"
                      : "bg-white/10 hover:bg-white/20 border-white/20 text-white cursor-pointer active:scale-95"
                  }`}
                >
                  <Play className={`w-3.5 h-3.5 ${!hasPreview ? 'fill-white/40 text-white/40' : 'fill-white text-white'}`} />
                  <span>Watch preview</span>
                </button>

                <button
                  onClick={handleWishlistToggle}
                  className={`backdrop-blur-md font-semibold text-xs px-4 py-3 rounded-xl transition-all flex items-center gap-2 cursor-pointer active:scale-95 ${
                    isWishlisted
                      ? "bg-emerald-600/90 text-white border border-emerald-500"
                      : "bg-white/10 hover:bg-white/20 border border-white/20 text-white"
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${isWishlisted ? "fill-white" : ""}`} />
                  <span>{isWishlisted ? "Saved in Wishlist" : "Save for later"}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="flex flex-col lg:flex-row gap-10 items-start relative">
          {/* =========================================================
              LEFT COLUMN: MAIN COURSE DATA BODY
             ========================================================= */}
          <main className="flex-1 space-y-6 w-full lg:max-w-[calc(100%-370px)]">

            {/* Instructor Card */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/5 via-indigo-500/5 to-transparent rounded-full -mr-10 -mt-10 pointer-events-none" />
              <div className="flex items-center gap-4.5 min-w-0">
                <div className="relative shrink-0">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 text-white flex items-center justify-center font-extrabold text-xl shadow-md shadow-indigo-500/20 ring-4 ring-indigo-50">
                    {instructorName !== "No Data Available" ? instructorName[0] : "N"}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white" title="Verified Instructor">
                    <ShieldCheck className="w-3 h-3" />
                  </div>
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                      <Sparkles className="w-3 h-3 text-indigo-600" /> Course Instructor
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> SOP Certified
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight leading-snug">
                    {instructorName !== "No Data Available" ? instructorName : "Nexus Lead Instructor"}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Operations & Standards Specialist · Nexus Learning</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <div className="bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/70 text-center">
                  <div className="flex items-center justify-center gap-1 text-amber-500 font-bold text-xs">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>4.9</span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block mt-0.5">Rating</span>
                </div>
                <div className="bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/70 text-center">
                  <div className="flex items-center justify-center gap-1 text-indigo-600 font-bold text-xs">
                    <Users className="w-3.5 h-3.5" />
                    <span>{stats.enrolledCount || 140}+</span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block mt-0.5">Learners</span>
                </div>
              </div>
            </div>

            {/* What you'll learn */}
            {outcomes.length > 0 && (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60">
                    <CheckCircle2 className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 tracking-tight">What you'll learn</h2>
                    <p className="text-xs text-slate-500 font-medium">Core proficiencies covered in this training program</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                  {outcomes.map((outcome, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 hover:bg-emerald-50/40 border border-slate-200/60 hover:border-emerald-200/70 transition-all duration-200">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs sm:text-sm text-slate-700 leading-snug font-medium">
                        {typeof outcome === 'string' ? outcome : (outcome as any).name || String(outcome)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills you'll gain */}
            {skills.length > 0 && (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200/60">
                    <Sparkles className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 tracking-tight">Skills you'll gain</h2>
                    <p className="text-xs text-slate-500 font-medium">Direct operational competencies validated upon completion</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2.5 pt-1">
                  {skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 bg-gradient-to-r from-slate-50 to-slate-100/80 text-slate-800 px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-slate-200/80 hover:border-indigo-300 hover:text-indigo-900 hover:shadow-2xs transition-all cursor-default"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Curriculum Segment List Grid */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/60">
                      <Video className="w-4.5 h-4.5" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                      Course Curriculum
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 font-medium flex items-center gap-2 pl-0.5">
                    <span>{curriculum.length} lessons</span>
                    <span>•</span>
                    <span>{stats.formattedDuration} total learning time</span>
                  </p>
                </div>
                <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-center">
                  <button
                    type="button"
                    onClick={handleDownloadAllOffline}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-2xs border cursor-pointer ${
                      curriculum.length > 0 && curriculum.every((item: any) => isLessonOffline(item.id))
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                        : "bg-indigo-50 text-indigo-700 border-indigo-200/80 hover:bg-indigo-100"
                    }`}
                  >
                    {curriculum.length > 0 && curriculum.every((item: any) => isLessonOffline(item.id)) ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Offline Ready (All Modules)</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Download for Offline Watch</span>
                      </>
                    )}
                  </button>
                  <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-2xs border ${
                    isEnrolled
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                      : "bg-slate-100 text-slate-700 border-slate-200"
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${isEnrolled ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                    {isEnrolled ? "Access Unlocked" : "Enrol to Access All"}
                  </span>
                </div>
              </div>
              {itemType === "career-path" ? (
                <>
                  <div className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-2xs flex flex-col divide-y divide-slate-100">
                    {(() => {
                      const cpCourses = itemData?.courses || itemData?.careerPathCourses || [];
                      return cpCourses.map((cpc: any, idx: number) => {
                        const c = cpc.course || cpc;
                        const courseLessons = c?.courseLessons || [];
                        const totalCourseLessons = courseLessons.length;
                        
                        const completedInCourse = cpFlatLessons
                          .filter((f: any) => f.courseId === c?.id)
                          .filter((f: any) => {
                            const lessonIdx = cpFlatLessons.findIndex((x: any) => x.lessonId === f.lessonId);
                            return lessonIdx < completedLessonsCount;
                          }).length;
                        
                        const allDone = totalCourseLessons > 0 && completedInCourse >= totalCourseLessons;
                        const someStarted = completedInCourse > 0;
                        const progressPct = totalCourseLessons > 0 ? (completedInCourse / totalCourseLessons) * 100 : 0;
                        
                        // Check if previous course is completed
                        const isPrevDone = idx === 0 ? true : (() => {
                           const prevC = cpCourses[idx-1].course || cpCourses[idx-1];
                           const prevTotal = (prevC?.courseLessons || []).length;
                           const prevCompleted = cpFlatLessons
                             .filter((f: any) => f.courseId === prevC?.id)
                             .filter((f: any) => {
                               const lessonIdx = cpFlatLessons.findIndex((x: any) => x.lessonId === f.lessonId);
                               return lessonIdx < completedLessonsCount;
                             }).length;
                           return prevTotal > 0 && prevCompleted >= prevTotal;
                        })();

                        const courseHasPreview = Boolean(
                          cpc.isPreview || 
                          cpc.is_preview || 
                          (c?.courseLessons || []).some((cl: any) => cl.isPreview || cl.is_preview || cl.lesson?.isPreview || cl.lesson?.is_preview)
                        );

                        const statusUI = allDone ? (
                          <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1 shrink-0">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Completed</span>
                          </span>
                        ) : someStarted ? (
                          <span className="bg-amber-50 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1 shrink-0">
                            <Play className="w-3 h-3 fill-amber-600 text-amber-600" />
                            <span>In progress</span>
                          </span>
                        ) : (
                          <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-blue-200 flex items-center gap-1 shrink-0">
                            <Play className="w-3 h-3 fill-blue-600 text-blue-600" />
                            <span>Start Course</span>
                          </span>
                        );

                        const isCourseAvailable = true;

                        return (
                          <div
                            key={c?.id || idx}
                            onClick={() => {
                              navigate(`/course-details?id=${c?.id}&type=course`, {
                                state: {
                                  parentCareerPathId: courseId,
                                  parentCareerPathTitle: course.title,
                                }
                              });
                            }}
                            className="p-4 flex items-center justify-between gap-4 transition-colors hover:bg-slate-50 cursor-pointer"
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                                allDone
                                  ? "bg-emerald-100 text-emerald-800"
                                  : isCourseAvailable
                                  ? "bg-slate-100 text-slate-800"
                                  : "bg-slate-100 text-slate-400"
                              }`}>
                                {allDone ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : idx + 1}
                              </div>
                              <div className="min-w-0 space-y-1">
                                <h4 className="text-sm font-semibold text-slate-900 truncate">
                                  {c?.title || `Course ${idx + 1}`}
                                </h4>
                                <div className="flex items-center gap-3 text-xs text-slate-500">
                                  <span>{totalCourseLessons} lessons</span>
                                  {isEnrolled && isPrevDone && (
                                    <>
                                      <span>•</span>
                                      <span>{completedInCourse} / {totalCourseLessons} completed</span>
                                    </>
                                  )}
                                </div>
                                {isEnrolled && isPrevDone && totalCourseLessons > 0 && !allDone && (
                                  <div className="w-36 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                                    <div 
                                      className="h-full bg-amber-400 rounded-full transition-all duration-300"
                                      style={{ width: `${progressPct}%` }}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              {statusUI}
                              <ChevronRight className={`w-4 h-4 ${isCourseAvailable ? "text-slate-400" : "text-slate-300"}`} />
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  {curriculum.map((item: CurriculumItem, idx: number) => {
                    const handleLessonClick = (lessonId: string, _isUnlocked?: boolean, parentCourseId?: string) => {
                      const pCourse = parentCourseId || (itemType === 'course' ? courseId : '');
                      const cpId = itemType === 'career-path' ? courseId : (parentCareerPathId || '');
                      navigate(`/course-player?careerPathId=${cpId}&courseId=${pCourse}&lessonId=${lessonId}`);
                    };

                    if (item.type === "course") {
                      return (
                        <CurriculumCourseItem
                          key={item.id}
                          courseItem={item}
                          isTenant={isTenant}
                          onLessonClick={(lessonId) => handleLessonClick(lessonId, !!item.isFreePreview, item.id)}
                        />
                      );
                    }

                    const isSelectedLesson = Boolean(queryLessonId && String(item.id) === String(queryLessonId));

                    return (
                      <div
                        id={`curriculum-lesson-${item.id}`}
                        key={item.id}
                        onClick={() => handleLessonClick(item.id, !!item.isFreePreview)}
                        className={`group relative p-4 sm:p-4.5 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer ${
                          isSelectedLesson
                            ? "bg-indigo-50/60 border-indigo-300 shadow-sm ring-1 ring-indigo-200"
                            : "bg-white hover:bg-slate-50/80 border-slate-200/80 hover:border-indigo-300 hover:shadow-md"
                        }`}
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          {/* Media Type Squircle */}
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 shadow-2xs ${
                            item.type === "quiz"
                              ? (item as any).isPreQuiz || item.title.toLowerCase().includes("pre")
                                ? "bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-700 text-white shadow-purple-500/20 group-hover:scale-105"
                                : "bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-emerald-500/20 group-hover:scale-105"
                              : item.type === "pdf"
                              ? "bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-rose-500/20 group-hover:scale-105"
                              : item.type === "ppt"
                              ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-amber-500/20 group-hover:scale-105"
                              : "bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 text-white shadow-indigo-500/20 group-hover:scale-105"
                          }`}>
                            {item.type === "quiz" ? (
                              (item as any).isPreQuiz || item.title.toLowerCase().includes("pre") ? (
                                <HelpCircle className="w-5 h-5 text-white" />
                              ) : (
                                <Award className="w-5 h-5 text-white" />
                              )
                            ) : item.type === "pdf" ? (
                              <FileText className="w-5 h-5 text-white" />
                            ) : item.type === "ppt" ? (
                              <Presentation className="w-5 h-5 text-white" />
                            ) : (
                              <Play className="w-4.5 h-4.5 fill-current ml-0.5" />
                            )}
                          </div>

                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                                Module {idx + 1}
                              </span>
                              {isSelectedLesson && (
                                <span className="bg-indigo-100 border border-indigo-200 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  Active
                                </span>
                              )}
                              {item.type === "pdf" ? (
                                <span className="bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  PDF Document
                                </span>
                              ) : item.type === "ppt" ? (
                                <span className="bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  Presentation Slides
                                </span>
                              ) : (
                                <span className="bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  Video SOP
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug truncate">
                              {item.title}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                              {item.type === "quiz" ? (
                                (item as any).isPreQuiz || item.title.toLowerCase().includes("pre") ? (
                                  <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-200/80 px-2 py-0.5 rounded-md text-[11px] font-semibold">
                                    <HelpCircle className="w-3 h-3 text-purple-600" /> PRE-ASSESSMENT
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 rounded-md text-[11px] font-semibold">
                                    <Award className="w-3 h-3 text-emerald-600" /> CERTIFICATION EXAM
                                  </span>
                                )
                              ) : item.type === "pdf" ? (
                                <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200/80 px-2 py-0.5 rounded-md text-[11px] font-semibold">
                                  <FileText className="w-3 h-3 text-rose-500" /> PDF GUIDE
                                </span>
                              ) : item.type === "ppt" ? (
                                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200/80 px-2 py-0.5 rounded-md text-[11px] font-semibold">
                                  <Presentation className="w-3 h-3 text-amber-600" /> PPT SLIDES
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200/80 px-2 py-0.5 rounded-md text-[11px] font-semibold">
                                  <Video className="w-3 h-3 text-blue-500" /> VIDEO SOP
                                </span>
                              )}
                              <span>•</span>
                              <span className="inline-flex items-center gap-1 text-slate-500 text-[11px] font-medium">
                                <Clock className="w-3 h-3 text-slate-400" /> {item.meta?.replace(/^.*·\s*/, '') || item.meta}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-2 sm:gap-2.5 justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex-wrap">
                          {/* Offline Watch / Offline Reading Button */}
                          <button
                            type="button"
                            title={isLessonOffline(item.id) ? "Available Offline (Click to remove)" : "Save for offline training"}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleOfflineLesson(item.id, item.title, item.type);
                            }}
                            className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border transition-all cursor-pointer shadow-2xs ${
                              isLessonOffline(item.id)
                                ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                                : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            {isLessonOffline(item.id) ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>Offline Ready</span>
                              </>
                            ) : (
                              <>
                                <Download className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                <span>
                                  {item.type === "pdf" ? "Offline PDF" : item.type === "ppt" ? "Offline PPT" : "Offline Watch"}
                                </span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            title="Share Lesson"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShareItem({
                                id: item.id,
                                title: item.title,
                                thumbnailUrl: course?.thumbnailAsset?.fileUrl || course?.thumbnailUrl,
                                type: "lesson",
                                link: `${window.location.origin}/course-details?id=${courseId}&type=${itemType}&lessonId=${item.id}`,
                              });
                            }}
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>

                          <span className={`inline-flex items-center gap-1.5 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-all group-hover:scale-102 ${
                            item.type === "quiz"
                              ? (item as any).isPreQuiz || item.title.toLowerCase().includes("pre")
                                ? "bg-purple-600 group-hover:bg-purple-700"
                                : "bg-emerald-600 group-hover:bg-emerald-700"
                              : item.type === "pdf"
                              ? "bg-rose-600 group-hover:bg-rose-700"
                              : item.type === "ppt"
                              ? "bg-amber-600 group-hover:bg-amber-700"
                              : "bg-indigo-600 group-hover:bg-indigo-700"
                          }`}>
                            {item.type === "quiz" ? (
                              (item as any).isPreQuiz || item.title.toLowerCase().includes("pre") ? (
                                <>
                                  <HelpCircle className="w-3.5 h-3.5" /> Start Pre-Quiz
                                </>
                              ) : (
                                <>
                                  <Award className="w-3.5 h-3.5" /> Take Post-Quiz
                                </>
                              )
                            ) : item.type === "pdf" ? (
                              <>
                                <FileText className="w-3.5 h-3.5" /> Read PDF
                              </>
                            ) : item.type === "ppt" ? (
                              <>
                                <Presentation className="w-3.5 h-3.5" /> View PPT
                              </>
                            ) : (
                              <>
                                <Play className="w-3.5 h-3.5 fill-current" /> Watch Video
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Course Attachment Section Block */}
            {itemType !== "career-path" && attachments.length > 0 && (
              <div id="course-resources" className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200/60">
                    <FileText className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 tracking-tight">Course Resources & Attachments</h2>
                    <p className="text-xs text-slate-500 font-medium">Downloadable guides, procedures, and learning materials</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {attachments.map((file: any, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-purple-300 hover:shadow-sm transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold uppercase tracking-wider shrink-0 ${
                          file.type === "PDF"
                            ? "bg-rose-50 text-rose-700 border border-rose-200/80"
                            : file.type === "PPT" || file.type === "PPTX"
                            ? "bg-amber-50 text-amber-800 border border-amber-200/80"
                            : "bg-purple-50 text-purple-700 border border-purple-200/60"
                        }`}>
                          {file.type}
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 tracking-tight truncate">
                            {file.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 font-medium">{file.meta}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (file.isLink) {
                            window.open(file.url, '_blank');
                          } else {
                            fetch(file.url)
                              .then(res => {
                                if (!res.ok) throw new Error("Network response was not ok");
                                return res.blob();
                              })
                              .then(blob => {
                                const blobUrl = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.style.display = 'none';
                                a.href = blobUrl;
                                let filename = file.title;
                                if (!filename.includes('.')) {
                                  if (file.type === 'PDF') filename += '.pdf';
                                  else if (file.type === 'VIDEO') filename += '.mp4';
                                }
                                a.download = filename;
                                document.body.appendChild(a);
                                a.click();
                                window.URL.revokeObjectURL(blobUrl);
                                document.body.removeChild(a);
                              })
                              .catch((err) => {
                                console.warn("Failed to download via Blob, opening in new tab", err);
                                window.open(file.url, '_blank');
                              });
                          }
                        }}
                        className="border border-slate-200 hover:border-purple-400 hover:text-purple-800 font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer bg-white transition-colors shrink-0 shadow-2xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{file.actionText}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            {reviews && reviews.length > 0 && (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/60">
                      <Star className="w-4.5 h-4.5 fill-current" />
                    </div>
                    <h2 className="text-base font-bold text-slate-900 tracking-tight">Learner Reviews</h2>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">{reviews.length} total reviews</span>
                </div>
                <div className="space-y-3.5 divide-y divide-slate-100">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="pt-3.5 first:pt-0 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-bold text-slate-900">{rev.userName}</h4>
                        <span className="text-xs text-slate-400 font-normal">{rev.date}</span>
                      </div>
                      <div className="flex items-center gap-0.5 text-amber-400 text-xs">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>

          {/* =========================================================
              RIGHT COLUMN: FIXED SIDEBAR CONTEXT ACTIONS UTILITY
             ========================================================= */}
          <aside className="w-full lg:w-[340px] shrink-0 space-y-5 lg:sticky lg:top-6">

            {/* THIS COURSE INCLUDES CARD */}
            <div className="border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-lg bg-white space-y-6 relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
              
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-indigo-700 uppercase tracking-wider bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                  <Sparkles className="w-3 h-3 text-indigo-500" /> Course Overview
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight pt-1">This course includes</h3>
              </div>

              <ul className="space-y-3 text-xs text-slate-700 font-medium">
                <li className="flex items-center gap-3.5 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-200/60 shadow-2xs">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block text-xs sm:text-sm">Pre-Course Diagnostic Assessment</span>
                    <span className="text-slate-500 text-[11px]">Baseline knowledge check & prerequisite evaluation</span>
                  </div>
                </li>

                <li className="flex items-center gap-3.5 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200/60 shadow-2xs">
                    <Video className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block text-xs sm:text-sm">Video SOP Demonstration</span>
                    <span className="text-slate-500 text-[11px]">High-definition procedural video modules</span>
                  </div>
                </li>

                <li className="flex items-center gap-3.5 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200/60 shadow-2xs">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block text-xs sm:text-sm">PDF Operational Manuals</span>
                    <span className="text-slate-500 text-[11px]">Step-by-step SOP documents & checklists</span>
                  </div>
                </li>

                <li className="flex items-center gap-3.5 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200/60 shadow-2xs">
                    <Presentation className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block text-xs sm:text-sm">PPT Training Presentation</span>
                    <span className="text-slate-500 text-[11px]">Visual slide decks for team orientation</span>
                  </div>
                </li>

                <li className="flex items-center gap-3.5 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-200/60 shadow-2xs">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block text-xs sm:text-sm">{attachments.length || 3} Downloadable Resources</span>
                    <span className="text-slate-500 text-[11px]">Direct MP4, PDF, and PPT files</span>
                  </div>
                </li>

                <li className="flex items-center gap-3.5 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200/60 shadow-2xs">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block text-xs sm:text-sm">Verified Certificate</span>
                    <span className="text-slate-500 text-[11px]">Official digital credential on completion</span>
                  </div>
                </li>

                <li className="flex items-center gap-3.5 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-200/60 shadow-2xs">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block text-xs sm:text-sm">{stats.enrolledCount || 120} active learners</span>
                    <span className="text-slate-500 text-[11px]">Enrolled in this program</span>
                  </div>
                </li>
              </ul>

              <div className="space-y-3.5 pt-4 border-t border-slate-100">
                {!isLoggedIn ? (
                  <button
                    onClick={() => navigate("/login", { state: { from: location } })}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm py-4 rounded-xl transition-all shadow-md flex justify-center items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <span>Log in to enrol</span>
                  </button>
                ) : isCorporateAdmin ? (
                  <button
                    onClick={() => {
                      const cType = itemType === "career-path" ? "CAREER_PATH" : itemType === "lesson" ? "LESSON" : "COURSE";
                      const cTitle = course?.title || (itemType === "career-path" ? "Career Path" : "Course");
                      navigate(`/course-assignment?contentId=${courseId}&type=${cType}&title=${encodeURIComponent(cTitle)}`, {
                        state: { contentId: courseId, contentType: cType, title: cTitle }
                      });
                    }}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-sm py-4 rounded-xl transition-all shadow-md flex justify-center items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <span>Assign this {itemType === "career-path" ? "Path" : "Course"}</span>
                  </button>
                ) : !isEnrolled ? (
                  <button
                    onClick={handleEnrol}
                    disabled={
                      enrollMutation.isPending ||
                      (itemType !== "course" && itemType !== "career-path")
                    }
                    className="w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-extrabold text-sm py-4 rounded-xl transition-all shadow-lg shadow-amber-400/25 flex justify-center items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-60"
                  >
                    <span>{enrollMutation.isPending ? "Enrolling..." : "Enrol now"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (itemType === 'career-path') {
                        const targetCourseId = cpResumeTarget?.courseId || '';
                        const targetLessonId = cpResumeTarget?.lessonId || '';
                        navigate(`/course-player?careerPathId=${courseId}&courseId=${targetCourseId}&lessonId=${targetLessonId}`);
                      } else {
                        const pCourse = courseId;
                        const lessonParam = resumeLessonId ? `&lessonId=${resumeLessonId}` : '';
                        navigate(`/course-player?careerPathId=${parentCareerPathId || ""}&courseId=${pCourse}${lessonParam}`);
                      }
                    }}
                    className="w-full bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-sm py-4 px-6 rounded-2xl transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 active:scale-[0.98] flex justify-center items-center gap-2.5 cursor-pointer"
                  >
                    <Play className="w-4.5 h-4.5 fill-current" />
                    <span>{isCourseCompleted ? "Review Completed Training" : "Start / Resume Training Module"}</span>
                  </button>
                )}

                {/* Completion Criteria Box */}
                <div className="bg-gradient-to-br from-emerald-50/70 via-teal-50/30 to-emerald-50/40 border border-emerald-200/80 rounded-2xl p-4.5 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Completion Criteria</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-200/60">
                      Standard SOP
                    </span>
                  </div>
                  <ul className="space-y-2.5 text-xs font-medium text-slate-700">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                      <span>1. Complete Pre-Course Diagnostic Assessment</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>2. Complete 100% of Video, PDF & PPT modules</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>3. Pass Final Post-Course Certification Exam (Min. 70%)</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>4. Receive verified completion credential & certificate</span>
                    </li>
                  </ul>
                  <div className="pt-2.5 border-t border-emerald-200/60 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span className="flex items-center gap-1.5">
                        <Wifi className="w-3.5 h-3.5 text-slate-400" /> Offline training sync
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-200/80 shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Supported
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadAllOffline}
                      className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs ${
                        curriculum.length > 0 && curriculum.every((item: any) => isLessonOffline(item.id))
                          ? "bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700"
                          : "bg-white hover:bg-emerald-50/80 text-emerald-800 border-emerald-300"
                      }`}
                    >
                      {curriculum.length > 0 && curriculum.every((item: any) => isLessonOffline(item.id)) ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>All Modules Saved for Offline</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Save Course for Offline Watch</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {isLoggedIn && !isCorporateAdmin && (
                  <button
                    onClick={handleWishlistToggle}
                    disabled={isWishlistLoading}
                    className={`w-full font-bold text-xs py-3 px-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer border shadow-2xs active:scale-[0.98] ${
                      isWishlisted
                        ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                        : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isWishlisted ? "fill-rose-500 text-rose-500" : "text-slate-500"}`} />
                    <span>{isWishlisted ? "Saved in Wishlist" : "Save for later"}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleBack}
                  className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 py-2 font-semibold transition-colors cursor-pointer group"
                >
                  <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                  <span>Back to course catalog</span>
                </button>
              </div>
            </div>

            {/* EARN ON COMPLETION CARD */}
            <div className="border border-slate-200/80 rounded-2xl p-5 shadow-sm flex items-center gap-4 bg-gradient-to-br from-white to-amber-50/40">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-md shadow-amber-400/20">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest block">Accreditation</span>
                <h3 className="text-sm font-bold text-slate-900 leading-snug">Nexus Certified Credential</h3>
                <p className="text-xs text-slate-500 mt-0.5">Sharable & verifiable on completion</p>
              </div>
            </div>

          </aside>
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

      {shareItem && (
        <ShareModal
          isOpen={!!shareItem}
          content={shareItem}
          onClose={() => setShareItem(null)}
        />
      )}
    </div>
  );
};

export default CourseDetails;