import React, { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router";
import {
  BookOpen,
  Clock,
  AlertTriangle,
  FileText,
  Video,
  File,
  FileQuestion,
  ArrowLeft,
  ArrowRight,
  History,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

import {
  useCourseOverview,
  useCourseLessons,
  useCourseReviewSummary,
  useCareerPathOverview,
  useLessonOverview,
} from "../../hooks/content-developer-workspace/useCourseOverview";
import { useLatestReviewableEntity } from "../../hooks/content-developer-workspace/useFeedbackResolution";
import { useUserStore } from "../../store/user.store";

import { courseOverviewApi } from "../../core/api/content-developer-workspace/courseOverview.api";
import {
  getVersionHistoryApi,
  type VersionEntityType,
  type VersionSnapshot,
} from "../../core/api/content-developer-workspace/versioning.api";
import { Skeleton } from "../../components/ui/Skeleton";
import { SubmissionStatusCard } from "../../components/content-developer/course-overview/SubmissionStatusCard";

const LessonTypeIcon = ({ type }: { type: string }) => {
  const t = (type || "").toLowerCase();
  if (t.includes("course")) return <BookOpen className="w-3.5 h-3.5 text-gray-400" />;
  if (t === "video") return <Video className="w-3.5 h-3.5 text-gray-400" />;
  if (t === "pdf" || t === "document") return <File className="w-3.5 h-3.5 text-gray-400" />;
  return <FileQuestion className="w-3.5 h-3.5 text-gray-400" />;
};

export const ContentDeveloperCourseOverview: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();



  // Fallback auto-discovery: only fetch the CURRENT user's content, not all users'.
  const currentUserId = useUserStore((state) => state.user?.id);
  const { data: latestEntity } = useLatestReviewableEntity(currentUserId);

  const { entityType = "course", id = "", courseId = "" } = useParams<{
    entityType?: "course" | "career-path" | "lesson";
    id?: string;
    courseId?: string;
  }>();
  const searchParams = new URLSearchParams(location.search);
  const queryId = searchParams.get("courseId") || searchParams.get("id") || searchParams.get("pathId") || searchParams.get("lessonId") || "";
  const queryType = searchParams.get("type") as "course" | "career-path" | "lesson" | undefined;
  const stateEntityType = location.state?.entityType as "course" | "career-path" | "lesson" | undefined;
  const stateEntityId = location.state?.entityId || location.state?.courseId || location.state?.pathId || location.state?.lessonId || "";
  const effectiveEntityType = stateEntityType || queryType || (id ? entityType : latestEntity?.entityType) || "course";
  const effectiveId = stateEntityId || queryId || id || courseId || latestEntity?.entityId || "";

  const isCourse = effectiveEntityType === "course";
  const isCareerPath = effectiveEntityType === "career-path";
  const isLesson = effectiveEntityType === "lesson";

  const courseQuery = useCourseOverview(effectiveId, { enabled: isCourse && !!effectiveId });
  const careerPathQuery = useCareerPathOverview(effectiveId, { enabled: isCareerPath && !!effectiveId });
  const lessonQuery = useLessonOverview(effectiveId, { enabled: isLesson && !!effectiveId });
  const lessonsQuery = useCourseLessons(effectiveId, { enabled: isCourse && !!effectiveId });
  const reviewQuery = useCourseReviewSummary(effectiveEntityType, effectiveId, { enabled: !!effectiveId });

  // Version history — uses the existing /reviews/:entityType/:entityId/history endpoint
  const versionHistoryQuery = useQuery({
    queryKey: ["version-history", effectiveEntityType, effectiveId],
    queryFn: () => getVersionHistoryApi(effectiveEntityType as VersionEntityType, effectiveId),
    enabled: !!effectiveId,
    staleTime: 30_000,
  });

  const activeEntityQuery = isCourse ? courseQuery : isCareerPath ? careerPathQuery : lessonQuery;
  const { data, isLoading, isError } = activeEntityQuery;

  // URL sync for direct refresh support - MUST be called unconditionally before any early return!
  React.useEffect(() => {
    if (effectiveId && location.pathname === "/studio/content") {
      window.history.replaceState(
        location.state,
        "",
        `/content-developer/course-overview/${effectiveEntityType}/${effectiveId}`
      );
    }
  }, [effectiveId, effectiveEntityType, location.pathname, location.state]);

  if (isLoading || (isCourse && lessonsQuery.isLoading) || reviewQuery.isLoading) {
    return (
      <div className="w-full flex flex-col gap-6 p-1">
        {/* Header Title Skeleton */}
        <div className="flex justify-between items-start">
          <div className="space-y-3">
            <Skeleton className="h-5 w-32 bg-gray-200" />
            <Skeleton className="h-9 w-64 bg-gray-200" />
            <div className="flex gap-4">
              <Skeleton className="h-5 w-24 bg-gray-200" />
              <Skeleton className="h-5 w-24 bg-gray-200" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28 rounded-full bg-gray-200" />
            <Skeleton className="h-10 w-28 rounded-full bg-gray-200" />
          </div>
        </div>

        {/* Info Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-[14px] p-5 shadow-sm space-y-2">
              <Skeleton className="h-4 w-24 bg-gray-200" />
              <Skeleton className="h-7 w-32 bg-gray-200" />
            </div>
          ))}
        </div>

        {/* Main Content Tabs Skeleton */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mt-4 min-h-[400px]">
          <div className="flex gap-6 border-b border-gray-100 pb-4 mb-6">
            <Skeleton className="h-6 w-24 bg-gray-200" />
            <Skeleton className="h-6 w-24 bg-gray-100" />
            <Skeleton className="h-6 w-24 bg-gray-100" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex justify-between items-center p-4 border border-gray-100 rounded-xl">
                <div className="flex gap-4 items-center">
                  <Skeleton className="h-10 w-10 rounded-lg bg-gray-200" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-48 bg-gray-200" />
                    <Skeleton className="h-4 w-32 bg-gray-200" />
                  </div>
                </div>
                <Skeleton className="h-8 w-24 rounded-full bg-gray-200" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Safe view model mapping with career path / course modules support
  const effectiveModules = isCareerPath
    ? (data?.courses || (data as any)?.careerPathCourses || [])
    : (Array.isArray(lessonsQuery.data) && lessonsQuery.data.length > 0
      ? lessonsQuery.data
      : (data?.courseLessons || []));

  // If data from DB query is not returned or fails, build structured fallback from navigation state / effectiveId
  // so the dedicated overview page opens for that exact content (Requirement #5)
  const fallbackData = (!data && effectiveId)
    ? {
      id: effectiveId,
      title: location.state?.courseName || location.state?.title || "Knowledge Mapping Fundamentals",
      entityType: effectiveEntityType,
      status: location.state?.status || "DRAFT",
      version: location.state?.version || 1,
      careerPath: location.state?.careerPath || "",
      domain: location.state?.domain || "General",
      courseLessons: [],
    }
    : null;

  const targetData = data || fallbackData;

  if (isError && !targetData) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <div className="space-y-1 max-w-md">
          <h2 className="text-lg font-bold text-gray-900">Failed to Load Content</h2>
          <p className="text-sm text-gray-500">
            There was an error loading the details. Please try again or return to your Studio Dashboard.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => activeEntityQuery.refetch()}
            className="bg-[#fff6a6] hover:bg-[#ffef76] border border-[#e4c438] text-[#171717] text-xs font-bold px-6 py-2.5 rounded-full cursor-pointer transition-all shadow-2xs"
          >
            Retry
          </button>
          <button
            onClick={() => navigate("/studio")}
            className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 text-xs font-bold px-6 py-2.5 rounded-full cursor-pointer transition-all shadow-2xs"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const mappedData = targetData
    ? courseOverviewApi.mapCourseOverviewViewModel(
      targetData,
      effectiveModules,
      reviewQuery.data
    )
    : null;

  if (!mappedData) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
          <BookOpen className="w-7 h-7" />
        </div>
        <div className="space-y-1 max-w-md">
          <h2 className="text-lg font-bold text-gray-900">No Content Selected</h2>
          <p className="text-sm text-gray-500">
            Select a course, lesson, or learning path from your Studio Dashboard to view its overview.
          </p>
        </div>
        <button
          onClick={() => navigate("/studio")}
          className="bg-[#fff6a6] hover:bg-[#ffef76] border border-[#e4c438] text-[#171717] text-xs font-bold px-6 py-2.5 rounded-full cursor-pointer transition-all shadow-2xs"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  const {
    courseMeta = {} as any,
    lessonItems = [],
    assessmentMeta,
    smeMeta,
    submissionHistory = [],
  } = mappedData;

  const safeLessonItems = Array.isArray(lessonItems) ? lessonItems : [];

  const isOwner = !currentUserId || !data ? true : (
    (Boolean((data as any).ownerId) && (data as any).ownerId === currentUserId) ||
    (Boolean((data as any).createdById) && (data as any).createdById === currentUserId) ||
    (!(data as any).ownerId && !(data as any).createdById)
  );

  const handleEdit = () => {
    if (!isOwner) {
      toast.error("You cannot edit content created by another Content Developer.");
      return;
    }
    const rawStatus = (courseMeta?.status || "").toUpperCase();
    if (
      rawStatus.includes("REVIEW") ||
      rawStatus === "UNDER_REVIEW" ||
      rawStatus === "SUBMITTED"
    ) {
      toast.warning("This item is currently under SME review and is locked from editing until the review is complete.");
      return;
    }

    const isPublishedEdit = rawStatus === "PUBLISHED";
    navigateToBuilder(isPublishedEdit);
  };

  const navigateToBuilder = (isPublishedEdit = false) => {
    switch (effectiveEntityType) {
      case "career-path":
        navigate(`/studio/path-builder/${effectiveId}`, {
          state: { pathId: effectiveId, isPublishedEdit },
        });
        break;
      case "lesson":
        navigate(`/studio/builder/1?type=lesson&lessonId=${effectiveId}`, {
          state: {
            lessonId: effectiveId,
            publishType: "standalone-lesson",
            courseName: courseMeta?.title,
            isPublishedEdit,
          },
        });
        break;
      default:
        navigate(`/studio/builder/1?type=course&courseId=${effectiveId}`, {
          state: {
            courseId: effectiveId,
            publishType: "standalone-course",
            courseName: courseMeta?.title,
            isPublishedEdit,
          },
        });
    }
  };

  const handleFeedback = () => {
    navigate(`/content-developer/feedback-resolution/${effectiveEntityType}/${effectiveId}`, {
      state: {
        entityType: effectiveEntityType,
        entityId: effectiveId,
        courseName: courseMeta?.title,
      },
    });
  };

  const handlePreview = () => {
    if (effectiveId) {
      navigate(`/content-developer/course-preview/${effectiveEntityType}/${effectiveId}`);
    } else {
      navigate("/studio/course-preview");
    }
  };

  // Safe unit parsing: if stored in seconds (> 120), normalize to minutes
  const calculatedDuration = safeLessonItems.reduce((acc: number, lesson: any) => {
    const raw = parseInt(String(lesson?.duration || "0").replace(/[^0-9]/g, ""), 10);
    if (isNaN(raw)) return acc;
    const mins = raw > 120 ? Math.round(raw / 60) : raw;
    return acc + mins;
  }, 0);

  const totalDuration = calculatedDuration || (data as any)?.duration || (data as any)?.estimatedDuration || 0;

  const reviewOpenFeedback = Array.isArray(reviewQuery.data?.reviews)
    ? reviewQuery.data.reviews.filter((r: any) => r?.status === "REJECTED").length
    : 0;
  const openFeedbackCount = reviewOpenFeedback || safeLessonItems.filter((l) => l?.hasFeedback).length;
  const currentVersion = courseMeta?.version ? (courseMeta.version.split(" ")[0] || "v1") : "v1";

  // Status badge helpers matching reference
  const isRejected =
    (courseMeta?.status as string) === "Changes Requested" ||
    (courseMeta?.status as string) === "Rejected";

  return (
    <div className="w-full min-w-0 font-['Manrope',system-ui,-apple-system,sans-serif] text-[#141414]">
      {/* Back link — .cco-back: 12px #5c5c5c uppercase tracking-[0.1em] gap-1.5 mb-5 font-semibold */}
      <a
        onClick={() => navigate("/studio")}
        role="link"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && navigate("/studio")}
        className="inline-flex items-center gap-[7px] text-[12px] font-semibold uppercase tracking-[0.1em] text-[#5c5c5c] hover:text-[#141414] mb-5 cursor-pointer no-underline transition-colors duration-150"
      >
        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.8} />
        <span>My workspace</span>
      </a>

      {/* Page Header Row — .cco-page-head: flex justify-between items-start gap-4 mb-6 */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
        <div className="min-w-0">
          {/* Eyebrow — .cco-eyebrow: 12px #5c5c5c uppercase tracking-[0.08em] font-bold mb-1 */}
          <div className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#5c5c5c] mb-1">
            {isCareerPath ? "Career Path Hub" : isLesson ? "Lesson Hub" : "Course Hub"}
          </div>

          {/* Title — .cco-title: 24px #141414 font-extrabold mb-[14px] leading-tight */}
          <h1 className="text-[24px] font-extrabold text-[#141414] leading-tight mb-[14px]">
            {courseMeta.title}
          </h1>

          {/* Chips Row — .cco-chips: flex flex-wrap gap-1.5 mb-2.5 */}
          <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
            {isCareerPath ? (
              <span className="inline-flex items-center gap-1 h-[22px] px-[10px] text-[12px] font-semibold tracking-[0.06em] text-[#3a3a3a] border border-[rgba(17,17,17,0.16)] rounded-full bg-transparent whitespace-nowrap">
                Career Path
              </span>
            ) : courseMeta.careerPath ? (
              <span className="inline-flex items-center gap-1 h-[22px] px-[10px] text-[12px] font-semibold tracking-[0.06em] text-[#3a3a3a] border border-[rgba(17,17,17,0.16)] rounded-full bg-transparent whitespace-nowrap">
                {courseMeta.careerPath === "Standalone" ? "Standalone" : `In: ${courseMeta.careerPath}`}
              </span>
            ) : null}
            <span
              className={`inline-flex items-center h-[22px] px-[10px] text-[12px] font-semibold tracking-[0.06em] rounded-full whitespace-nowrap ${isRejected
                  ? "bg-[#f6e8c4] text-[#755a12] border border-[#c99b2e8c]"
                  : courseMeta.status === "Published"
                    ? "bg-[#dce5d3] text-[#446038] border border-[#7e9b6f99]"
                    : "bg-[#f6e8c4] text-[#755a12] border border-[#c99b2e8c]"
                }`}
            >
              {isRejected ? "Rejected" : courseMeta.status}
            </span>
            <span className="inline-flex items-center gap-1 h-[22px] px-[10px] text-[12px] font-semibold tracking-[0.06em] text-[#3a3a3a] border border-[rgba(17,17,17,0.16)] rounded-full bg-transparent whitespace-nowrap">
              {currentVersion} {courseMeta.status === "Published" ? "published" : courseMeta.status === "Review Pending" ? "in review" : "draft"}
            </span>
          </div>

          {/* Meta Row — .cco-meta: 14px #5c5c5c tracking-[0.04em] flex items-center gap-[6px_10px] */}
          <div className="flex flex-wrap items-center gap-[6px_10px] text-[14px] tracking-[0.04em] text-[#5c5c5c]">
            {courseMeta.createdDate && <span>{`Created ${courseMeta.createdDate}`}</span>}
            {courseMeta.lastEdited && (
              <>
                <span className="text-[#8c8c8c]">·</span>
                <span>{`Last edited ${courseMeta.lastEdited}`}</span>
              </>
            )}
            {courseMeta.domain && (
              <>
                <span className="text-[#8c8c8c]">·</span>
                <span>{`Domain: ${courseMeta.domain}`}</span>
              </>
            )}
          </div>
        </div>

        {/* Page Actions — .cco-page-actions: flex flex-wrap items-start gap-2 pt-1 shrink-0 */}
        <div className="flex flex-wrap items-center gap-2 pt-1 shrink-0">
          {/* Primary Button / Readonly Badge */}
          {isOwner ? (
            <button
              id="cco-btn-edit"
              onClick={handleEdit}
              className="inline-flex items-center gap-1.5 text-[14px] font-bold text-[#141414] bg-[#FCF7AE] hover:bg-[#F0EA8A] border-[1.5px] border-[#c99b2e8c] rounded-full px-[14px] py-2 shadow-[0_4px_16px_-4px_rgba(42,17,8,0.12)] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-150 cursor-pointer whitespace-nowrap"
            >
              <span>{isCareerPath ? "Edit in Path Builder" : isLesson ? "Edit in Lesson Builder" : "Edit in Course Builder"}</span>
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.8} />
            </button>
          ) : (
            <span
              id="cco-badge-readonly"
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#5c5c5c] bg-[#f6f6f4] border border-[rgba(17,17,17,0.16)] rounded-full px-[14px] py-2 whitespace-nowrap select-none"
            >
              Mapped Content (View Only)
            </span>
          )}

          {/* Secondary Ghost Button — .nexus-btn.ghost.sm: bg white, border rgba(17,17,17,0.16), hover bg #f6f6f4 */}
          <button
            id="cco-btn-feedback"
            onClick={handleFeedback}
            className="inline-flex items-center text-[14px] font-bold text-[#141414] bg-white hover:bg-[#f6f6f4] border-[1.5px] border-[rgba(17,17,17,0.16)] hover:border-[#5c5c5c] rounded-full px-[14px] py-2 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-150 cursor-pointer whitespace-nowrap shadow-none"
          >
            {openFeedbackCount > 0
              ? `View SME feedback (${openFeedbackCount} required)`
              : "View SME feedback"}
          </button>

          {/* Preview Ghost Button */}
          <button
            id="cco-btn-preview"
            onClick={handlePreview}
            className="inline-flex items-center text-[14px] font-bold text-[#141414] bg-white hover:bg-[#f6f6f4] border-[1.5px] border-[rgba(17,17,17,0.16)] hover:border-[#5c5c5c] rounded-full px-[14px] py-2 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-150 cursor-pointer whitespace-nowrap shadow-none"
          >
            Preview as learner
          </button>
        </div>
      </div>

      {/* Alert Banner — .cco-banner: bg #f6e8c4, border 1px solid #c99b2e, border-left 3px solid #c99b2e, radius 10px, padding 16px 20px, mb 28px */}
      {(isRejected || openFeedbackCount > 0) && (
        <div className="flex items-start gap-3.5 bg-[#f6e8c4] border border-[#c99b2e] border-l-[3px] border-l-[#c99b2e] rounded-[10px] p-[16px_20px] mb-[28px]">
          <div className="w-[30px] h-[30px] rounded-full bg-[#f6e8c4] border border-[#c99b2e] text-[#755a12] grid place-items-center shrink-0">
            <AlertTriangle className="w-4 h-4" strokeWidth={1.8} />
          </div>
          <div className="text-[16px] text-[#3a3a3a] leading-[1.5] flex-1">
            {openFeedbackCount || 1} required change from{" "}
            {smeMeta?.name && smeMeta.name !== "Unassigned" ? smeMeta.name.split(" ").slice(0, 2).join(" ") : "Assigned SME"}{" "}
            must be resolved before this course can be resubmitted for review.
            <a
              onClick={handleFeedback}
              className="inline-flex items-center gap-1 font-bold text-[#141414] border-b-[1.5px] border-b-[#141414] hover:text-[#755a12] hover:border-b-[#755a12] ml-1 pb-[1px] no-underline whitespace-nowrap cursor-pointer transition-colors duration-150"
            >
              <span>Resolve feedback</span>
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.8} />
            </a>
          </div>
        </div>
      )}

      {/* 4 Stat Tiles — .cco-stat-grid: repeat(4, 1fr) gap 14px mb 32px */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-[14px] mb-[32px]">
        {/* Total Modules */}
        <div className="bg-white border border-[rgba(17,17,17,0.1)] rounded-[14px] p-[18px_18px_16px] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_22px_-12px_rgba(17,17,17,0.18)] cursor-default">
          <div className="w-[38px] h-[38px] rounded-[11px] bg-[#f6e8c4] text-[#755a12] mb-3 grid place-items-center shrink-0">
            <BookOpen className="w-5 h-5" strokeWidth={1.8} />
          </div>
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#5c5c5c] mb-2">
              Total modules
            </div>
            <div className="text-[20px] font-extrabold text-[#141414] leading-none tabular-nums">
              {(lessonItems as any[]).length}
            </div>
          </div>
        </div>

        {/* Total Duration */}
        <div className="bg-white border border-[rgba(17,17,17,0.1)] rounded-[14px] p-[18px_18px_16px] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_22px_-12px_rgba(17,17,17,0.18)] cursor-default">
          <div className="w-[38px] h-[38px] rounded-[11px] bg-[#dce5d3] text-[#446038] mb-3 grid place-items-center shrink-0">
            <Clock className="w-5 h-5" strokeWidth={1.8} />
          </div>
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#5c5c5c] mb-2">
              Total duration
            </div>
            <div className="text-[20px] font-extrabold text-[#141414] leading-none tabular-nums">
              {totalDuration}
              <span className="text-[16px] text-[#3a3a3a] font-normal ml-[3px]">min</span>
            </div>
          </div>
        </div>

        {/* Open Feedback */}
        <div className="bg-white border border-[rgba(17,17,17,0.1)] rounded-[14px] p-[18px_18px_16px] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_22px_-12px_rgba(17,17,17,0.18)] cursor-default">
          <div className="w-[38px] h-[38px] rounded-[11px] bg-[#efd3c7] text-[#b8523e] mb-3 grid place-items-center shrink-0">
            <AlertTriangle className="w-5 h-5" strokeWidth={1.8} />
          </div>
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#5c5c5c] mb-2">
              Open feedback
            </div>
            <div
              className={`text-[20px] font-extrabold leading-none tabular-nums ${openFeedbackCount > 0 ? "text-[#755a12]" : "text-[#141414]"
                }`}
            >
              {openFeedbackCount}
            </div>
          </div>
        </div>

        {/* Submission Version */}
        <div className="bg-white border border-[rgba(17,17,17,0.1)] rounded-[14px] p-[18px_18px_16px] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_22px_-12px_rgba(17,17,17,0.18)] cursor-default">
          <div className="w-[38px] h-[38px] rounded-[11px] bg-[#f6e8c4] text-[#755a12] mb-3 grid place-items-center shrink-0">
            <FileText className="w-5 h-5" strokeWidth={1.8} />
          </div>
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#5c5c5c] mb-2">
              Submission version
            </div>
            <div className="text-[20px] font-extrabold text-[#141414] leading-none tabular-nums">
              {currentVersion}
            </div>
          </div>
        </div>
      </div>

      {/* Main Body Layout — .cco-body: grid-cols-[minmax(0,1fr)_340px] gap-6 */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
        {/* Left Column: Course Structure */}
        <div className="min-w-0">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#5c5c5c]">
              Course structure
            </span>
          </div>

          <div className="bg-white border border-[rgba(17,17,17,0.1)] rounded-[14px] shadow-[0_4px_16px_-4px_rgba(42,17,8,0.1)] overflow-hidden divide-y divide-[rgba(17,17,17,0.1)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-6px_rgba(42,17,8,0.12)]">
            {lessonItems.map((lesson, idx) => {
              const hasFeedback = Boolean(lesson.hasFeedback);
              return (
                <div
                  key={lesson.id || idx}
                  onClick={() => {
                    if (isCareerPath && lesson.id) {
                      navigate(`/content-developer/course-overview/course/${lesson.id}`);
                    }
                  }}
                  className={`flex items-center gap-3.5 px-5 py-3.5 cursor-pointer transition-colors duration-200 ${hasFeedback
                      ? "bg-[#f6e8c4] hover:bg-[#f6e8c4]"
                      : "hover:bg-[#f6f6f4]"
                    }`}
                >
                  <span className="text-[14px] text-[#5c5c5c] font-semibold tabular-nums min-w-[22px]">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[16px] text-[#141414] font-semibold flex-1 min-w-0 truncate">
                    {lesson.title}
                  </span>

                  <div className="flex items-center gap-3.5 shrink-0">
                    <span className="h-[22px] px-[10px] text-[12px] font-semibold tracking-[0.06em] text-[#3a3a3a] border border-[rgba(17,17,17,0.16)] rounded-full bg-transparent inline-flex items-center whitespace-nowrap">
                      {lesson.type}
                    </span>
                    <span className="text-[14px] tracking-[0.03em] text-[#5c5c5c] font-normal tabular-nums whitespace-nowrap hidden sm:inline-block">
                      {lesson.duration.includes("min") ? lesson.duration : `${lesson.duration} min`}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${hasFeedback ? "bg-[#c99b2e]" : "bg-[#7e9b6f]"
                        }`}
                    />
                    {hasFeedback && (
                      <span className="text-[12px] tracking-[0.06em] uppercase text-[#755a12] bg-[#f6e8c4] border border-[#c99b2e] rounded-full whitespace-nowrap px-[9px] py-[3px] font-bold">
                        Has open feedback
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Assessment row — .cco-struct-row.cco-assessment */}
            {assessmentMeta && assessmentMeta.questions > 0 && (
              <div className="bg-[#f6f6f4] hover:bg-[#f6f6f4] border-t border-[rgba(17,17,17,0.16)] flex items-center gap-3.5 px-5 py-3.5">
                <span className="text-[14px] text-[#5c5c5c] font-semibold tabular-nums min-w-[22px]">
                  --
                </span>
                <span className="text-[16px] text-[#141414] font-bold flex-1 min-w-0">
                  Assessment
                </span>
                <span className="text-[14px] tracking-[0.03em] text-[#5c5c5c] font-normal whitespace-nowrap">
                  {assessmentMeta.questions} questions · pass mark {assessmentMeta.passMark}%
                </span>
              </div>
            )}

            {lessonItems.length === 0 && (
              <div className="px-5 py-8 text-center text-[13px] text-[#8c8c8c] font-medium">
                No modules added yet.
              </div>
            )}
          </div>
        </div>

        {/* Right Rail: Submission Status, Assigned SME, Quick Stats */}
        <div className="flex flex-col gap-4 w-full">
          {/* Submission Status */}
          <SubmissionStatusCard
            reviews={
              Array.isArray(reviewQuery.data?.reviews)
                ? reviewQuery.data.reviews
                : Array.isArray(reviewQuery.data?.reviewHistory)
                  ? reviewQuery.data.reviewHistory
                  : Array.isArray(reviewQuery.data)
                    ? reviewQuery.data
                    : []
            }
            versionSnapshots={Array.isArray(versionHistoryQuery.data) ? versionHistoryQuery.data : []}
            entityStatus={courseMeta?.status}
            currentVersion={data?.version || 1}
            openFeedbackCount={openFeedbackCount}
            createdAt={data?.createdAt}
            updatedAt={data?.updatedAt}
          />

          {/* Assigned SME */}
          {smeMeta && (
            <div className="bg-white border border-[rgba(17,17,17,0.1)] rounded-[14px] shadow-[0_4px_16px_-4px_rgba(42,17,8,0.1)] p-[20px_22px] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-6px_rgba(42,17,8,0.12)]">
              <div className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#5c5c5c] mb-[14px]">
                Assigned SME
              </div>
              <div className="text-[16px] font-bold text-[#141414]">
                {smeMeta.name}
              </div>
              {smeMeta.domain && (
                <div className="text-[16px] font-normal text-[#3a3a3a] mt-[3px]">
                  {smeMeta.domain.includes("domain") ? smeMeta.domain : `${smeMeta.domain} domain`}
                </div>
              )}
              {smeMeta.turnaround && (
                <div className="text-[14px] tracking-[0.03em] font-normal text-[#5c5c5c] mt-2">
                  {smeMeta.turnaround.includes("turnaround") ? smeMeta.turnaround : `Avg turnaround: ${smeMeta.turnaround}`}
                </div>
              )}
            </div>
          )}

          {/* Quick Stats — .cco-stats-bg: bg #f6f6f4 */}
          <div className="bg-[#f6f6f4] border border-[rgba(17,17,17,0.1)] rounded-[14px] shadow-[0_4px_16px_-4px_rgba(42,17,8,0.1)] p-[20px_22px] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-6px_rgba(42,17,8,0.12)]">
            <div className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#5c5c5c] mb-[14px]">
              Quick stats
            </div>
            {courseMeta.status === "Published" ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between py-1 border-b border-[rgba(17,17,17,0.08)]">
                  <span className="text-[13px] font-medium text-[#5c5c5c]">Total Enrollments</span>
                  <span className="text-[14px] font-bold text-[#141414] tabular-nums">
                    {Math.max(
                      Number((activeEntityQuery.data as any)?.enrollmentCount) || 0,
                      Number((activeEntityQuery.data as any)?._count?.enrollments) || 0,
                      Number((activeEntityQuery.data as any)?.displayEnrollmentCount) || 0
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[rgba(17,17,17,0.08)]">
                  <span className="text-[13px] font-medium text-[#5c5c5c]">Average Rating</span>
                  <span className="text-[14px] font-bold text-[#141414] tabular-nums">
                    {(activeEntityQuery.data as any)?.averageRating ? `${Number((activeEntityQuery.data as any).averageRating).toFixed(1)} ★` : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[rgba(17,17,17,0.08)]">
                  <span className="text-[13px] font-medium text-[#5c5c5c]">Total Modules</span>
                  <span className="text-[14px] font-bold text-[#141414] tabular-nums">
                    {lessonItems.length}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-[13px] font-medium text-[#5c5c5c]">Total Duration</span>
                  <span className="text-[14px] font-bold text-[#141414] tabular-nums">
                    {totalDuration} min
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between py-1 border-b border-[rgba(17,17,17,0.08)]">
                  <span className="text-[13px] font-medium text-[#5c5c5c]">Total Modules</span>
                  <span className="text-[14px] font-bold text-[#141414] tabular-nums">
                    {lessonItems.length}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[rgba(17,17,17,0.08)]">
                  <span className="text-[13px] font-medium text-[#5c5c5c]">Planned Duration</span>
                  <span className="text-[14px] font-bold text-[#141414] tabular-nums">
                    {totalDuration} min
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[rgba(17,17,17,0.08)]">
                  <span className="text-[13px] font-medium text-[#5c5c5c]">Current Version</span>
                  <span className="text-[14px] font-bold text-[#141414] tabular-nums">
                    {courseMeta.version}
                  </span>
                </div>
                <p className="text-[12px] text-[#8c8c8c] font-normal leading-relaxed pt-1 mb-0">
                  Live learner metrics (enrollments & ratings) will display here once published.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Version History — My Content version cards (spec §15). Only shown when version data exists in DB. */}
      {versionHistoryQuery.data && versionHistoryQuery.data.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-4 h-4 text-[#5c5c5c]" />
            <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#5c5c5c]">
              Version History
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {versionHistoryQuery.data.map((snap: VersionSnapshot) => {
              // Determine the display status for this version record.
              // The latest version record reflects current entity status;
              // older versions were published (they exist as completed snapshots).
              const isLatest = snap.version === Math.max(...versionHistoryQuery.data!.map((s: VersionSnapshot) => s.version));
              const entityCurrentStatus = ((data as any)?.status || "").toUpperCase();
              const snapStatus = (((snap as any).status || "") as string).toUpperCase();
              let versionStatus = "Published";
              let statusClass = "bg-[#dce5d3] text-[#446038] border border-[#7e9b6f99]";

              if (snapStatus === "UNDER_REVIEW") {
                versionStatus = "In SME Review";
                statusClass = "bg-[#f6e8c4] text-[#755a12] border border-[#c99b2e8c]";
              } else if (snapStatus === "REJECTED") {
                versionStatus = "Changes Requested";
                statusClass = "bg-[#efd3c7] text-[#b8524e] border border-[#c96b4e8c]";
              } else if (snapStatus === "DRAFT") {
                versionStatus = "Draft (editing)";
                statusClass = "bg-gray-100 text-gray-600 border border-gray-300";
              } else if (snapStatus === "PUBLISHED") {
                versionStatus = "Published";
                statusClass = "bg-[#dce5d3] text-[#446038] border border-[#7e9b6f99]";
              } else if (isLatest) {
                if (entityCurrentStatus === "UNDER_REVIEW") {
                  versionStatus = "In SME Review";
                  statusClass = "bg-[#f6e8c4] text-[#755a12] border border-[#c99b2e8c]";
                } else if (entityCurrentStatus === "REJECTED") {
                  versionStatus = "Changes Requested";
                  statusClass = "bg-[#efd3c7] text-[#b8524e] border border-[#c96b4e8c]";
                } else if (entityCurrentStatus === "DRAFT") {
                  versionStatus = "Draft (editing)";
                  statusClass = "bg-gray-100 text-gray-600 border border-gray-300";
                }
              }

              return (
                <div
                  key={snap.id}
                  className="bg-white border border-[rgba(17,17,17,0.1)] rounded-[14px] p-[16px_20px] flex items-start gap-4 transition-all duration-200 hover:shadow-[0_4px_16px_-4px_rgba(42,17,8,0.1)]"
                >
                  {/* Version number icon */}
                  <div className="w-9 h-9 rounded-xl bg-[#f6f6f4] border border-[rgba(17,17,17,0.12)] flex items-center justify-center shrink-0">
                    {isLatest && entityCurrentStatus === "PUBLISHED" ? (
                      <CheckCircle2 className="w-4.5 h-4.5 text-[#446038]" />
                    ) : (
                      <Circle className="w-4.5 h-4.5 text-[#5c5c5c]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-[15px] font-bold text-[#141414]">
                        Version {snap.version}
                      </span>
                      <span className={`inline-flex items-center h-[20px] px-[9px] text-[11px] font-semibold tracking-[0.06em] rounded-full whitespace-nowrap ${statusClass}`}>
                        {versionStatus}
                      </span>
                    </div>
                    {snap.changeSummary && (
                      <p className="text-[13px] text-[#3a3a3a] font-normal leading-relaxed mt-0.5">
                        {snap.changeSummary}
                      </p>
                    )}
                    <p className="text-[12px] text-[#8c8c8c] font-normal mt-1">
                      {new Date(snap.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                      {snap.changedByUser && (
                        <span>
                          {" · "}
                          {[snap.changedByUser.firstName, snap.changedByUser.lastName].filter(Boolean).join(" ") || snap.changedByUser.email || "Unknown"}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentDeveloperCourseOverview;
