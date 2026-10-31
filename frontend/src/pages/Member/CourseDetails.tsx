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
  type: "video" | "video+pdf" | "quiz" | "course";
  title: string;
  meta: string;
  isFreePreview?: boolean;
  statusText: string;
  children?: any[];
}

interface AttachmentItem {
  type: "pdf" | "link";
  title: string;
  meta: string;
  actionText: string;
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
      statusText: isPreview ? "Free preview" : "Locked",
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
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
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

const DetailsSkeleton = () => (
  <div className="min-h-screen bg-white font-sans text-gray-900 pb-20">
    <div className="mx-auto pt-6 pb-2">
      {/* Breadcrumbs Skeleton */}
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-3" />
        <Skeleton className="h-3 w-32" />
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

const DetailsError = ({ onRetry }: { onRetry: () => void }) => (
  <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
    <p className="text-red-500 font-semibold">Failed to load course details. Please try again.</p>
    <button
      onClick={onRetry}
      className="bg-gray-900 text-white font-bold px-4 py-2 rounded-lg text-xs hover:bg-black transition-all"
    >
      Retry
    </button>
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

  const itemType = searchParams.get("type") || "course";
  const parentCareerPathId = searchParams.get("careerPathId") || location.state?.careerPathId;
  const parentCareerPathTitle = location.state?.parentCareerPathTitle;
  const queryLessonId = searchParams.get("lessonId") || location.state?.selectedLessonId;

  // Corporate assigned content fetching
  const { data: assignedData, isLoading: isLoadingAssigned } = useQuery({
    queryKey: ["corporate-assigned-content", profile?.tenantId, profile?.id],
    queryFn: async () => {
      if (profile?.tenantId && profile?.id) {
        return getAssignedContentApi(profile.tenantId, profile.id);
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
            if (fullDataRes?.data) {
              return {
                ...fullDataRes.data,
                dueDate: foundData.dueDate || actualItem.dueDate || fullDataRes.data.dueDate,
                enrollmentCount: actualItem.enrollmentCount ?? fullDataRes.data.enrollmentCount,
                _count: actualItem._count ?? fullDataRes.data._count,
                estimatedDuration: actualItem.estimatedDuration ?? fullDataRes.data.estimatedDuration,
                duration: actualItem.duration ?? fullDataRes.data.duration,
                isEnrolled: fullDataRes.data.isEnrolled ?? actualItem.isEnrolled ?? true,
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
      }

      if (itemType === "career-path") {
        const { data } = await api.get(`/career-paths/${courseId}`);
        return data.data;
      } else if (itemType === "lesson") {
        const { data } = await api.get(`/lessons/${courseId}`);
        return data.data;
      } else {
        try {
          const { data } = await api.get(`/courses/${courseId}`);
          return data.data;
        } catch (courseErr) {
          if (parentCareerPathId) {
            try {
              const { data: cpRes } = await api.get(`/career-paths/${parentCareerPathId}`);
              const cpData = cpRes?.data;
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
    if (!isCorporateUser) return true;
    if (!courseId) return false;
    if (allocatedIds.has(String(courseId))) return true;

    if (assignedData) {
      if (itemType === "career-path") {
        return Boolean(
          assignedData?.careerPaths?.some(
            (p: any) =>
              String(p.id) === String(courseId) ||
              String(p.careerPath?.id) === String(courseId) ||
              String(p.careerPathId) === String(courseId) ||
              String(p.contentId) === String(courseId)
          )
        );
      } else if (itemType === "lesson") {
        const parentCourseIds = itemData?.courseLessons?.map((cl: any) => String(cl.courseId || cl.course?.id)).filter(Boolean) || [];
        const isParentCourseAssigned = parentCourseIds.some((pId: string) => allocatedIds.has(pId));
        if (isParentCourseAssigned) return true;

        return Boolean(
          assignedData?.lessons?.some(
            (l: any) =>
              String(l.id) === String(courseId) ||
              String(l.lesson?.id) === String(courseId) ||
              String(l.lessonId) === String(courseId) ||
              String(l.contentId) === String(courseId)
          )
        );
      } else {
        const inAssignedCareerPath = assignedData?.careerPaths?.some((p: any) => {
          const cp = p.careerPath || p;
          const courses = cp.courses || cp.careerPathCourses || [];
          return courses.some((cpc: any) => String(cpc.courseId || cpc.id || cpc.course?.id) === String(courseId));
        });
        if (inAssignedCareerPath) return true;

        return Boolean(
          assignedData?.courses?.some(
            (c: any) =>
              String(c.id) === String(courseId) ||
              String(c.course?.id) === String(courseId) ||
              String(c.courseId) === String(courseId) ||
              String(c.contentId) === String(courseId)
          )
        );
      }
    }
    return Boolean(itemData?.isEnrolled);
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

  const { data: lessonsData, refetch: refetchLessons } = useQuery({
    queryKey: ["unified-lessons", itemType, effectiveCourseId, routeShareToken, isCorporateUser],
    queryFn: async () => {
      if (itemType === "course") {
        if (isLoggedIn && isCorporateUser && profile?.id && profile?.tenantId) {
          const assignedDataRes = await getAssignedContentApi(profile.tenantId, profile.id);
          const foundCourse = assignedDataRes?.courses?.find(
            (c: any) =>
              String(c.id) === String(effectiveCourseId) ||
              String(c.course?.id) === String(effectiveCourseId) ||
              String(c.courseId) === String(effectiveCourseId) ||
              String(c.contentId) === String(effectiveCourseId)
          );
          const actualCourse = foundCourse?.course || foundCourse;
          if (actualCourse?.courseLessons && actualCourse.courseLessons.length > 0) {
            return actualCourse.courseLessons;
          }
        }

        if (itemData?.courseLessons && itemData.courseLessons.length > 0) {
          return itemData.courseLessons;
        }

        const effectiveId = itemData?.id || effectiveCourseId;
        if (effectiveId) {
          try {
            const { data } = await api.get(`/courses/${effectiveId}/lessons`);
            return data.data || [];
          } catch (e) {
            return itemData?.courseLessons || [];
          }
        }
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
      if ((rawVal === undefined || rawVal === null || rawVal === 0 || rawVal === "") && lessonsData && lessonsData.length > 0) {
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
  const [isEnrolled, setIsEnrolled] = useState(false);
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

  // Sync wishlist state with localStorage state on load/update
  useEffect(() => {
    if (courseId) {
      if (isCorporateUser) {
        setIsEnrolled(Boolean(isAssigned || itemData?.isEnrolled || currentEnrollment));
        return;
      }

      let alreadyEnrolled = Boolean(currentEnrollment) || Boolean(itemData?.isEnrolled);
      const forceEnrolled = searchParams.get("enrolled") === "true";

      const stored = localStorage.getItem("member_learning_state");
      if (stored) {
        try {
          const state = JSON.parse(stored);
          const wishlisted = state.wishlistIds?.includes(courseId) || false;
          const prog = Number(backendProgress?.progress ?? state.progressMap?.[courseId] ?? 0);
          setIsEnrolled(forceEnrolled || alreadyEnrolled || prog > 0);
          setIsWishlisted(wishlisted);
          setCourseProgress(prog);
        } catch (e) {
          console.error(e);
        }
      } else {
        setIsEnrolled(forceEnrolled || alreadyEnrolled);
        if (backendProgress) {
          setCourseProgress(Number(backendProgress.progress ?? 0));
        }
      }
    }
  }, [courseId, isCorporateUser, isAssigned, itemData?.isEnrolled, currentEnrollment, backendProgress, searchParams]);

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
          actionText: isEnrolled ? (isCompleted ? "Download" : "Complete  to Open") : "Enrol to download",
          isUnlocked: isEnrolled && isCompleted,
          isLink: false,
          url: finalAsset?.fileUrl || finalAsset?.storagePath || "#"
        };
      } else if (lessonObj?.contentUrl) {
        return {
          type: "LINK",
          title: lessonObj.title || "External Link",
          meta: "External link · Opens in new tab",
          actionText: isEnrolled ? (isCompleted ? "Open link" : "Complete lesson to open") : "Enrol to open",
          isUnlocked: isEnrolled && isCompleted,
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
      const lessons = itemData.courseLessons?.map((cl: any) => cl.lesson) || lessonsData?.map((cl: any) => cl.lesson || cl) || [];
      lessons.forEach((l: any, idx: number) => {
        const isCompleted = isCourseCompleted || idx < completedLessonsCount;
        const a = extractAsset(l, isCompleted);
        if (a) attachments.push(a as any);
      });
    } else if (itemType === "career-path") {
      const cpCourses = itemData.courses || itemData.careerPathCourses || [];
      let globalLessonIdx = 0;
      cpCourses.forEach((cpc: any) => {
        const c = cpc.course || cpc;
        const lessons = c?.courseLessons?.map((cl: any) => cl.lesson) || [];
        lessons.forEach((l: any) => {
          const isCompleted = isCourseCompleted || globalLessonIdx < completedLessonsCount;
          const a = extractAsset(l, isCompleted);
          if (a) attachments.push(a as any);
          globalLessonIdx++;
        });
      });
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
    curriculum = (lessonsData || []).map((cl: any, idx: number) => {
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

      let isUnlocked = false;
      let statusText = "Locked";

      if (!isEnrolled) {
        if (isPreview) {
          isUnlocked = true;
          statusText = "Free preview";
        } else {
          isUnlocked = false;
          statusText = "Locked";
        }
      } else {
        if (isCourseCompleted || idx <= completedLessonsCount) {
          isUnlocked = true;
          statusText = isCourseCompleted ? "Review" : "Start";
        } else {
          isUnlocked = false;
          statusText = "Locked";
        }
      }

      return {
        id: lessonData?.id,
        type: type as any,
        title: `${cl.sequenceOrder || 1}. ${lessonData?.title || "Untitled Lesson"}`,
        meta: `${lessonData?.lessonType || "Video"} • ${lessonData?.duration ?? 0} min`,
        isFreePreview: !isEnrolled ? isPreview : isUnlocked,
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
    const allCourseLessons = (lessonsData && lessonsData.length > 0)
      ? lessonsData
      : (itemData?.courseLessons || itemData?.course_lessons || []);

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
    return <DetailsSkeleton />;
  }

  if (isErrorDetails || !course) {
    return (
      <DetailsError
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
    <div className={`min-h-screen bg-white font-sans text-gray-900 selection:bg-gray-100 pb-20 ${!isLoggedIn ? "px-4 sm:px-8 md:px-12 max-w-7xl mx-auto" : ""}`}>

      {/* Guest top bar when viewing without login */}
      {!isLoggedIn && (
        <header className="flex items-center justify-between py-4 border-b border-gray-100 mb-4">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate("/login")}>
            <span className="text-xl font-black tracking-tight text-gray-900">NX</span>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest hidden sm:inline">Learning Portal</span>
          </div>
          <button
            onClick={() => navigate("/login", { state: { from: location } })}
            className="bg-(--btn) hover:bg-(--btn-hover) text-[#141414] font-bold text-xs sm:text-sm px-5 py-2 rounded-full border border-[#c99b2e8c] transition-all cursor-pointer shadow-xs"
          >
            Log in
          </button>
        </header>
      )}

      {/* Container for both Breadcrumb and Hero */}
      <div className=" mx-auto pt-6 pb-2">
        {/* Top Row: Breadcrumbs outside hero */}
        <div className="flex items-center gap-2 text-[12px] font-medium  mb-4">
          <span className="cursor-pointer text-(--ink-mute) hover:text-[#8c4534] transition-colors" onClick={() => navigate(isLoggedIn ? '/member-learning' : '/login')}>Browse</span>
          {parentCareerPathId && parentCareerPathTitle && (
            <>
              <span className="flex items-center justify-center text-(--ink-mute)" ><ChevronRight className="h-[13px] w-[13px]" /></span>
              <span className="cursor-pointer text-(--ink-mute) hover:text-[#8c4534] transition-colors" onClick={() => navigate(`/course-details?id=${parentCareerPathId}&type=career-path`)}>{parentCareerPathTitle}</span>
            </>
          )}
          <span className="flex items-center justify-center text-(--ink-mute)" ><ChevronRight className="h-[13px] w-[13px]" /></span>
          <span className="text-[#141414] font-bold">{course.title}</span>
        </div>

        {/* HERO SECTION - ROUNDED BOX */}
        <div className="w-full bg-[#1111112e] relative rounded-2xl overflow-hidden shadow-sm flex flex-col justify-end min-h-[340px]">
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            {(course.thumbnailAsset?.fileUrl || course.thumbnailUrl) ? (
              <img src={course.thumbnailAsset?.fileUrl || course.thumbnailUrl} className="w-full h-full object-cover opacity-60 mix-blend-overlay" />
            ) : (
              <div className="w-full h-full bg-[#111111db]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-[#1111112e] to-[#111111db]"></div>
          </div>

          {/* Top right actions (Heart & Share) inside the rounded box */}
          {isLoggedIn && !isCorporateAdmin && (
            <div className="absolute top-6 right-6 flex gap-3 z-20">
              <button onClick={handleWishlistToggle} disabled={isWishlistLoading} className="w-9.5 h-9.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-all border border-white/10 disabled:opacity-50">
                <Heart className={`w-[17px] h-[17px] ${isWishlisted ? "fill-white" : ""}`} />
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
                className="w-9.5 h-9.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-all border border-white/10 cursor-pointer"
              >
                <Share2 className="w-[17px] h-[17px]" />
              </button>
            </div>
          )}

          {/* Hero Content Container */}
          <div className="relative z-10 p-8 md:p-12 w-full max-w-4xl pt-20">
            {/* Hero Main */}
            <div className="space-y-5">
              <div>
                <span className="text-[#ffffff] text-[12px] font-bold uppercase tracking-widest block mb-2">{course.category?.name || "CDMP"} · {itemType === "career-path" ? "PATH" : "FOUNDATIONS"}</span>
                <h1 className="text-[33px]  md:text-[33px] font-extrabold text-white tracking-tight leading-tight mb-3">
                  {course.title}
                </h1>
                <p className="text-[#ffffff] text-sm sm:text-base leading-relaxed max-w-2xl">
                  {course.shortDescription || course.tagline || course.subtitle || "Define, measure and improve data quality in enterprise environments. Based on DAMA-DMBOK 2nd edition."}
                </p>
              </div>

              {/* Meta tags */}
              <div className="flex flex-wrap items-center gap-5 text-[#fffffff2] text-[14px] font-medium py-2">
                <span className="flex items-center gap-2">
                  <Video className="w-[15px] h-[15px] text-[#fffffff2]" />
                  {curriculum.length} {itemType === "career-path" ? "courses" : "lessons"}
                </span>
                <span className="flex items-center gap-2">
                  <Clock className="w-[15px] h-[15px] text-[#fffffff2]" />
                  {stats.formattedDuration}
                </span>
                <span className="flex items-center gap-2">
                  <Star className="w-[15px] h-[15px] text-[#fffffff2]" />
                  {course.difficulty ? course.difficulty.charAt(0).toUpperCase() + course.difficulty.slice(1).toLowerCase() : "Practitioner"}
                </span>
                <span className="flex items-center gap-2">
                  <Users className="w-[15px] h-[15px] text-[#fffffff2]" />
                  {stats.enrolledCount} enrolled
                </span>
              </div>

              {/* Action Buttons */}
              {isLoggedIn && !isCorporateAdmin && (
                <div className="flex flex-col gap-3 pt-3">
                  <div className="flex flex-wrap gap-3">
                    {!isEnrolled ? (
                      <button
                        onClick={handleEnrol}
                        disabled={
                          enrollMutation.isPending ||
                          (itemType !== "course" && itemType !== "career-path") ||
                          (isCorporateUser && !isAssigned)
                        }
                        className={`${isCorporateUser && !isAssigned
                            ? "bg-gray-200 border border-gray-300 text-gray-400 cursor-not-allowed"
                            : "bg-(--btn) border border-[#c99b2e8c] hover:bg-(--btn-hover) text-[#141414] cursor-pointer"
                          } font-bold text-[16px] px-6 py-2.5 rounded-full transition-colors disabled:opacity-60`}
                        title={
                          isCorporateUser && !isAssigned
                            ? "This content is not assigned to your corporate account"
                            : undefined
                        }
                      >
                        {enrollMutation.isPending ? "Enrolling..." : "Enrol now"}
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
                        className="bg-(--btn) border border-[#c99b2e8c] hover:bg-(--btn-hover) text-[#141414] font-bold text-[16px] px-6 py-2.5 rounded-full transition-colors cursor-pointer"
                      >
                        Continue learning
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
                      className={`backdrop-blur-md border font-bold text-[14px] px-5 py-2.75 rounded-full transition-colors flex items-center gap-2 ${
                        !hasPreview
                          ? "bg-white/10 border-white/15 text-white/40 cursor-not-allowed opacity-50"
                          : "bg-[#ffffff29] hover:bg-white/20 border-[#fff6] text-white cursor-pointer"
                      }`}
                    >
                      <Play className={`w-[15px] h-[15px] ${!hasPreview ? 'fill-white/40 text-white/40' : 'fill-white text-white'}`} />
                      Watch preview
                    </button>
                    <button onClick={handleWishlistToggle} className={`backdrop-blur-md text-white font-bold text-[14px] px-5 py-2.75 rounded-full transition-colors flex items-center gap-2 ${isWishlisted ? "bg-[#7e9b6f] border border-[#7e9b6f] hover:bg-[#6c855e]" : "bg-white/10 border border-white/20 hover:bg-white/20"}`}>
                      <Heart className={`w-[15px] h-[15px] ${isWishlisted ? "fill-white" : ""}`} />
                      {isWishlisted ? "Saved" : "Save"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className=" mx-full  mt-10">
        <div className="flex flex-col lg:flex-row gap-12 items-start relative">
          {/* =========================================================
              LEFT COLUMN: MAIN COURSE DATA BODY
             ========================================================= */}
          <main className="flex-1 space-y-6.5 w-full lg:max-w-[calc(100%-380px)]">




            {/* Instructors */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border border-[#c99b2e66] bg-(--honey-wash) text-(--honey-text) flex items-center justify-center font-bold text-[14px] shrink-0">
                  {instructorName !== "No Data Available" ? instructorName[0] : "N"}
                </div>
                <span className="text-sm font-bold text-[#141414]">{instructorName !== "No Data Available" ? instructorName : "No Data Available"}</span>
              </div>
            </div>

            {/* What you'll learn */}
            {outcomes.length > 0 && (
              <div className="space-y-3.5">
                <h2 className="text-[16px] font-bold text-[#141414] tracking-tight">What you'll learn</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-8">
                  {outcomes.map((outcome, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <svg className="w-4 h-4 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                      <span className="text-[16px] text-[#3a3a3a]">{typeof outcome === 'string' ? outcome : (outcome as any).name || String(outcome)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills you'll gain */}
            {skills.length > 0 && (
              <div className="space-y-3.5">
                <h2 className="text-[16px] font-bold text-[#141414] tracking-tight">Skills you'll gain</h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, idx) => (
                    <span key={idx} className="bg-(--c-sage-wash) text-(--c-sage-text) px-3 py-1.5 rounded-full text-[12px] font-bold border border-(--c-sage-soft)">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Curriculum Segment List Grid */}
            <div className="space-y-3.5">
              {itemType === "career-path" ? (
                <>
                  <h2 className="text-[16px] font-bold text-[#141414] tracking-tight">
                    Courses in this path <span className="text-[#5c5c5c] font-normal">· {curriculum.length} courses, in order</span>
                  </h2>
                  <div className="border border-gray-200 rounded-2xl bg-[#ffffff] overflow-hidden shadow-sm flex flex-col">
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

                        let statusUI;
                        if (!isEnrolled) {
                          statusUI = courseHasPreview 
                            ? <span className="bg-[#eef6ec] text-[#6cb356] border border-[#d4edda] text-[12px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">Free preview</span>
                            : <span className="bg-gray-50 border border-gray-200 text-gray-500 text-[12px] font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> Locked</span>;
                        } else if (allDone) {
                          statusUI = <span className="bg-[#eef6ec] text-[#6cb356] border border-[#6cb35640] text-[12px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">✓ Completed</span>;
                        } else if (someStarted) {
                          statusUI = <span className="bg-[#fff7d6] text-[#b88c3a] border border-[#ffe88b] text-[12px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5"><Play className="w-3.5 h-3.5 fill-current" /> In progress · {Math.round(progressPct)}%</span>;
                        } else if (isPrevDone) {
                           statusUI = <span className="bg-white border border-gray-300 text-gray-600 text-[12px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">Start</span>;
                        } else {
                          statusUI = <span className="bg-gray-50 border border-gray-200 text-gray-500 text-[12px] font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> Locked</span>;
                        }

                        const courseThumbAsset = c?.courseAssets?.find?.((a: any) => a.assetRole === "THUMBNAIL" || a.role === "THUMBNAIL")?.asset || cpc?.course?.courseAssets?.find?.((a: any) => a.assetRole === "THUMBNAIL" || a.role === "THUMBNAIL")?.asset;
                        const courseThumbUrl = courseThumbAsset?.signedUrl || courseThumbAsset?.url || courseThumbAsset?.fileUrl;
                        const thumb = courseThumbUrl || c?.thumbnailAsset?.signedUrl || c?.thumbnailAsset?.url || c?.thumbnailAsset?.fileUrl || c?.thumbnailUrl || c?.coverImageUrl || c?.coverImageAsset?.fileUrl || c?.thumbnail || cpc?.thumbnailUrl || cpc?.course?.thumbnailUrl || c?.thumbnail_url || c?.cover_image_url || c?.thumbnail_asset?.signedUrl || c?.thumbnail_asset?.url || c?.thumbnail_asset?.fileUrl || cpc?.course?.thumbnail_url || cpc?.course?.thumbnail_asset?.fileUrl || c?.image || c?.imageUrl || cpc?.course?.imageUrl || cpc?.imageUrl;
                        const durationStr = c?.duration ? (c.duration < 60 ? `${c.duration} mins` : `${Math.round(c.duration/60)} hrs`) : (c?.estimatedDuration ? `${c.estimatedDuration} hrs` : "0 hrs");
                        const instructor = c?.owner?.profile ? `${c.owner.profile.firstName} ${c.owner.profile.lastName}` : "Senior Instructor";
                        
                        return (
                          <div 
                            key={c?.id || idx} 
                            onClick={() => {
                              const targetCourseId = c?.id || cpc?.courseId || cpc?.course?.id;
                              if (targetCourseId) {
                                navigate(`/course-details?id=${targetCourseId}&type=course&careerPathId=${courseId}`, { 
                                  state: { parentCareerPathTitle: itemData?.title } 
                                });
                              }
                            }}
                            className={`flex gap-4 px-6 py-5 ${idx !== cpCourses.length - 1 ? 'border-b border-gray-100' : ''} hover:bg-gray-50 transition-colors cursor-pointer relative`}
                          >
                            <div className="flex flex-col items-center shrink-0 w-8 relative">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold z-10 relative ${allDone ? 'bg-[#7e9b6f] text-white' : someStarted || (isEnrolled && isPrevDone) ? 'bg-white border-2 border-[#d3a13b] text-[#d3a13b]' : 'bg-white border-2 border-gray-300 text-gray-400'}`}>
                                {idx + 1}
                              </div>
                              {idx !== cpCourses.length - 1 && (
                                <div className={`w-[2px] absolute top-8 bottom-[-20px] ${allDone ? 'bg-[#7e9b6f]' : 'bg-gray-200'}`}></div>
                              )}
                            </div>
                            
                            <div className="flex-1 flex items-center justify-between ml-2 pb-2">
                              <div className="flex items-center gap-5">
                                <div className="w-[100px] h-[64px] rounded-lg overflow-hidden shrink-0 bg-gray-100 border border-gray-200 shadow-sm">
                                  <CourseThumbnail courseId={c?.id || cpc?.courseId} fallbackThumb={thumb} />
                                </div>
                                
                                <div className="flex-1 space-y-1.5">
                                  <h4 className="text-[16px] font-bold text-[#141414] leading-tight">{c?.title || `Course ${idx+1}`}</h4>
                                  <div className="text-[13px] text-[#5c5c5c] font-medium flex items-center gap-1.5">
                                    <span>{totalCourseLessons} Material</span>
                                    <span>·</span>
                                    <span>{durationStr}</span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <div className="w-5 h-5 rounded-full bg-[#fdf5d3] text-[#b88c3a] flex items-center justify-center text-[9px] font-bold">
                                      {instructor.split(' ').map((n:string)=>n[0]).join('').substring(0,2)}
                                    </div>
                                    <span className="text-[12px] text-[#3a3a3a] font-medium">{instructor}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="shrink-0 pl-4 flex items-center gap-2 justify-end min-w-[120px]">
                                <button
                                  type="button"
                                  title="Share Course"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShareItem({
                                      id: c?.id || cpc?.courseId,
                                      title: c?.title || `Course ${idx+1}`,
                                      thumbnailUrl: thumb || course?.thumbnailAsset?.fileUrl || course?.thumbnailUrl,
                                      type: "course",
                                      shareToken: c?.shareToken || c?.share_token,
                                    });
                                  }}
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer border-none"
                                >
                                  <Share2 className="w-3.5 h-3.5" />
                                </button>
                                {statusUI}
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-[16px] font-bold text-[#141414] tracking-tight">
                    Curriculum <span className="text-[#5c5c5c] font-normal">· {curriculum.length} lessons</span>
                  </h2>
                  <div className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm">
                    {curriculum.map((item: CurriculumItem, idx: number) => {
                  const handleLessonClick = (lessonId: string, isUnlocked: boolean, parentCourseId?: string) => {
                    const pCourse = parentCourseId || (itemType === 'course' ? courseId : '');
                    const cpId = itemType === 'career-path' ? courseId : (parentCareerPathId || '');

                    if (!isEnrolled) {
                      if (itemType === 'lesson' || isUnlocked || item.isFreePreview) {
                        navigate(`/course-player?careerPathId=${cpId}&courseId=${pCourse}&lessonId=${lessonId}`);
                        return;
                      }
                      notification.warning({
                        title: isCorporateUser ? "Content Not Assigned" : "Enrollment Required",
                        description: isCorporateUser
                          ? "This content is not assigned to your corporate account."
                          : "You must enrol to view this lesson.",
                      });
                    } else if (!isUnlocked) {
                      notification.warning({
                        title: "Lesson Locked",
                        description: "Please complete previous lessons to unlock this one.",
                      });
                    } else {
                      navigate(`/course-player?careerPathId=${cpId}&courseId=${pCourse}&lessonId=${lessonId}`);
                    }
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

                  const isLast = idx === curriculum.length - 1;
                  const isSelectedLesson = Boolean(queryLessonId && String(item.id) === String(queryLessonId));

                  return (
                    <div
                      id={`curriculum-lesson-${item.id}`}
                      key={item.id}
                      onClick={() => handleLessonClick(item.id, !!item.isFreePreview)}
                      className={`p-4 flex justify-between items-center gap-4 hover:bg-gray-50 transition-colors cursor-pointer ${!isLast ? 'border-b border-(--line)' : ''} ${isSelectedLesson ? 'bg-[#fcf8ee] border-l-4 border-l-[#c99b2e]' : ''}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-8.5 h-8.5 rounded-lg flex items-center justify-center shrink-0 ${item.isFreePreview ? 'bg-(--sage-wash) text-(--sage-text)' : 'bg-(--bg) text-(--ink-soft) border border-(--line)'}`}>
                          {item.isFreePreview ? (
                            <Play className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></Play>
                          ) : (
                            <Lock className="w-4 h-4" />
                          )}
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <h4 className="text-[16px] font-bold text-[#141414] tracking-tight">
                              {item.title}
                            </h4>
                            {isSelectedLesson && (
                              <span className="bg-[#f5ecd4] border border-[#c99b2e]/40 text-[#825e0b] text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Selected Lesson
                              </span>
                            )}
                          </div>
                          <p className="text-[14px] text-[#5c5c5c] font-medium">{item.meta}</p>
                        </div>
                      </div>
                      <div className="shrink-0 pl-4 flex items-center gap-2 justify-end">
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
                          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer border-none"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        {item.isFreePreview ? (
                          <span className="bg-(--sage-wash) border border-[#7e9b6f4d] text-(--sage-text) text-[14px] font-medium px-2.5 py-1 rounded-full">
                            {item.statusText}
                          </span>
                        ) : (
                          <span className="border border-(--line) text-(--ink-soft) text-[14px] font-medium px-2.5 py-1 rounded-full">
                            Locked (enrol to unlock)
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              </>
              )}
            </div>

            {/* Course Attachment Section Block */}
            {itemType !== "career-path" && attachments.length > 0 && (
              <div id="course-resources" className="space-y-4 ">
                <h2 className="text-[16px] font-bold text-[#141414] tracking-tight">Course resources & attachments</h2>
                <p className="text-[14px] text-[#5c5c5c]">Everything for this course in one place. Resources are available to enrolled learners; downloads require active enrolment.</p>

                <div className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm">
                  {attachments.map((file: any, idx, arr) => (
                    <div
                      key={idx}
                      className={`p-4 flex justify-between items-center gap-4 ${idx !== arr.length - 1 ? 'border-b border-gray-100' : ''}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-[38px] h-[38px] rounded-lg flex items-center justify-center text-[12px] font-semibold uppercase tracking-wider bg-(--clay-wash) text-(--accent) border-1 border-(--line)`}>
                          {file.type}
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="text-[16px] font-semibold text-[#141414] tracking-tight">
                            {file.title}
                          </h4>
                          <p className="text-[14px] text-[#5c5c5c] font-medium">{file.meta}</p>
                        </div>
                      </div>
                      {file.isUnlocked ? (
                        <button
                          onClick={() => {
                            if (file.isLink) {
                              window.open(file.url, '_blank');
                            } else {
                              // Force download via Blob to prevent browser from opening PDFs/videos directly
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
                                  // Attempt to parse a proper extension if missing, though title should have it
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
                                  console.warn("Failed to download via Blob (possibly CORS), opening in new tab", err);
                                  window.open(file.url, '_blank');
                                });
                            }
                          }}
                          className="border border-(--line) hover:text-(--accent) hover:border-(--accent) font-semibold text-[14px] px-3 py-1.5 rounded-full flex items-center gap-1.5 cursor-pointer"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                          <span>{file.actionText}</span>
                        </button>
                      ) : (
                        <button disabled className="border border-[#d8d8d8] text-[#5c5c5c] font-medium text-[14px] px-3 py-1.5 rounded-full flex items-center gap-1.5 cursor-not-allowed bg-gray-50/50">
                          <Lock className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" />
                          <span>{file.actionText}</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-[14px] text-[#5c5c5c] pt-2 font-normal">
                  <strong className="text-[#5c5c5c] font-medium">{attachments.length} resources</strong> for this course. Resources remain accessible for 12 months after enrolment.
                </p>
              </div>
            )}

            {/* Reviews */}
            {reviews && reviews.length > 0 && (
              <div className="space-y-4 pt-6 border-t border-gray-100">
                <h2 className="text-[16px] font-bold text-[#141414] tracking-tight">Reviews</h2>
                <div className="space-y-4">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="border-b border-gray-100 pb-4 space-y-1">
                      <div className="flex justify-between items-center">
                        <h4 className="text-[16px] font-bold text-[#141414]">{rev.userName}</h4>
                        <span className="text-[14px] text-[#5c5c5c] font-normal">{rev.date}</span>
                      </div>
                      <div className="flex items-center gap-1 text-yellow-400 text-xs">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <span key={i}>★</span>
                        ))}
                      </div>
                      <p className="text-xs text-gray-600">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>

          {/* =========================================================
              RIGHT COLUMN: FIXED SIDEBAR CONTEXT ACTIONS UTILITY
             ========================================================= */}
          <aside className="w-full lg:w-[340px] shrink-0 space-y-5 lg:top-10 sticky">

            {/* THIS COURSE INCLUDES */}
            <div className="border border-gray-200 rounded-2xl p-6 shadow-sm bg-white space-y-3.5">
              <h3 className="text-[11px] font-bold text-[#5c5c5c] uppercase tracking-widest">This course includes</h3>

              <ul className="space-y-3.5 text-[14px] text-[#3a3a3a] font-medium">
                <li className="flex items-center gap-3">
                  <Video className="w-[15px] h-[15px] text-(--honey-text) shrink-0" />
                  <span>{curriculum.length} {itemType === "career-path" ? "courses" : "lessons"} of on-demand video</span>
                </li>
                <li className="flex items-center gap-3">
                  <Clock className="w-[15px] h-[15px] text-(--honey-text) shrink-0" />
                  <span>{stats.formattedDuration} total</span>
                </li>
                <li className="flex items-center gap-3">
                  <FileText className="w-[15px] h-[15px] text-(--honey-text) shrink-0" />
                  <span>{attachments.length || 0} downloadable resources</span>
                </li>
                <li className="flex items-center gap-3">
                  <Award className="w-[15px] h-[15px] text-(--honey-text) shrink-0" />
                  <span>Course learning credential</span>
                </li>
                <li className="flex items-center gap-3">
                  <Users className="w-[15px] h-[15px] text-(--honey-text) shrink-0" />
                  <span>{stats.enrolledCount} already enrolled</span>
                </li>
              </ul>

              <div className="space-y-3 pt-3 border-t border-gray-100">
                {!isLoggedIn ? (
                  <button
                    onClick={() => navigate("/login", { state: { from: location } })}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm py-3.5 rounded-2xl transition-all shadow-md shadow-indigo-100 flex justify-center items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <span>Log in to enrol</span>
                  </button>
                ) : isCorporateAdmin ? (
                  <>
                    <button
                      onClick={() => {
                        if (itemType === "lesson") return;
                        const cType = itemType === "career-path" ? "CAREER_PATH" : "COURSE";
                        const cTitle = course?.title || itemData?.title || "";
                        navigate(`/course-assignment?contentId=${courseId}&type=${cType}&title=${encodeURIComponent(cTitle)}`, {
                          state: { contentId: courseId, contentType: cType, title: cTitle }
                        });
                      }}
                      disabled={itemType === "lesson"}
                      className={`w-full font-bold text-[16px] py-3 rounded-full transition-colors flex justify-center items-center gap-2 shadow-xs ${
                        itemType === "lesson"
                          ? "bg-gray-200 border border-gray-300 text-gray-400 cursor-not-allowed"
                          : "bg-(--btn) border border-[#c99b2e8c] hover:bg-(--btn-hover) text-[#141414] cursor-pointer"
                      }`}
                      title={itemType === "lesson" ? "Standalone lessons cannot be assigned directly" : undefined}
                    >
                      Assign now
                    </button>

                    {itemType === "lesson" && itemData?.courseLessons?.length > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <p className="text-xs text-amber-800 font-medium">
                          This lesson is mapped to <strong>{itemData.courseLessons[0]?.course?.title || "a course"}</strong>. Please assign that course to grant access.
                        </p>
                      </div>
                    )}
                    {itemType === "lesson" && (!itemData?.courseLessons || itemData.courseLessons.length === 0) && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <p className="text-xs text-gray-500 font-medium">
                          This lesson is currently not available for assignment.
                        </p>
                      </div>
                    )}
                  </>
                ) : !isEnrolled ? (
                  <>
                    <button
                      onClick={handleEnrol}
                      disabled={
                        enrollMutation.isPending ||
                        (itemType !== "course" && itemType !== "career-path") ||
                        (isCorporateUser && !isAssigned)
                      }
                      className={`w-full ${isCorporateUser && !isAssigned
                          ? "bg-gray-200 border border-gray-300 text-gray-400 cursor-not-allowed"
                          : "bg-(--btn) border border-[#c99b2e8c] hover:bg-(--btn-hover) text-[#141414] cursor-pointer"
                        } font-bold text-[16px] py-3 rounded-full transition-colors disabled:opacity-60 shadow-xs`}
                      title={
                        isCorporateUser && !isAssigned
                          ? "This content is not assigned to your corporate account"
                          : undefined
                      }
                    >
                      {enrollMutation.isPending ? "Enrolling..." : "Enrol now"}
                    </button>

                    {isCorporateUser && !isAssigned && (
                      <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3 text-center">
                        <p className="text-xs text-amber-800 font-medium leading-relaxed">
                          This {itemType === "career-path" ? "career path" : "course"} is not assigned to your corporate account. Please contact your organization administrator to request access.
                        </p>
                      </div>
                    )}

                    {itemType === "lesson" && itemData?.courseLessons?.length > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <p className="text-xs text-amber-800 font-medium">
                          This lesson is mapped to <strong>{itemData.courseLessons[0]?.course?.title || "a course"}</strong>. Please enroll in that course first to continue.
                        </p>
                      </div>
                    )}
                    {itemType === "lesson" && (!itemData?.courseLessons || itemData.courseLessons.length === 0) && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <p className="text-xs text-gray-500 font-medium">
                          This lesson is currently not available for enrollment.
                        </p>
                      </div>
                    )}
                  </>
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
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm py-3.5 rounded-2xl transition-all shadow-md shadow-indigo-100 flex justify-center items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <span>{isCourseCompleted ? "Review Completed Training" : "Start / Resume Training Module"}</span>
                  </button>
                )}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span>Completion Criteria</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-600">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />
                      <span>Complete 100% of video/SOP learning modules</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />
                      <span>Pass post-training assessment (Min. 70% score)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />
                      <span>Submit post-training feedback</span>
                    </li>
                  </ul>
                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Offline access supported</span>
                    <span className="font-semibold text-emerald-600">Available</span>
                  </div>
                </div>
                {isLoggedIn && !isCorporateAdmin && (
                  <button onClick={handleWishlistToggle} disabled={isWishlistLoading} className={`w-full font-bold text-[13px] py-3 rounded-full transition-colors  disabled:opacity-50 flex items-center justify-center gap-2 ${isWishlisted ? "bg-[#7e9b6f] text-white border border-[#7e9b6f] hover:bg-[#6c855e]" : "bg-(--card) hover:bg-gray-50 border border-(--line-strong) text-gray-900"}`}>
                    {isWishlistLoading && (
                      <svg className="animate-spin h-3.5 w-3.5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    <span>{isWishlisted ? "Remove from wishlist" : "Save for later"}</span>
                  </button>
                )}
              </div>
            </div>

            {/* EARN ON COMPLETION */}
            <div className="border border-gray-200 rounded-2xl p-5 shadow-sm flex items-center gap-4 bg-white">
              <div className="w-11.5 h-11.5 rounded-full bg-(--sage-wash) border border-(--c-sage-soft) flex items-center justify-center shrink-0">
                <Award className="w-5.5 h-5.5 text-(--sage-text)" />
              </div>
              <div>
                <h4 className="text-[12px] font-bold text-[#5c5c5c] uppercase tracking-widest mb-0.5">Earn on completion</h4>
                <h3 className="text-[16px] font-bold text-[#141414] leading-snug">CDMP Associate Course learning credential</h3>
                <p className="text-[16px] text-[#3a3a3a] mt-1 ">Verifiable at nexusacademy.org/verify/</p>
              </div>
            </div>

          </aside>
        </div>
      </div>

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