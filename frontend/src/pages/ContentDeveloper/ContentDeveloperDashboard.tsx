import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Clock,
  Check,
  AlertTriangle,
  Award,
  ArrowRight,
  Share2,
  Eye,
  Star,
  MessageSquare,
  Plus,
} from "../../assets/icons";
import { toast } from "sonner";
import { useProfile } from "../../hooks/profile/useProfile";
import {
  useWorkspaceDashboard,
  useWorkspaceStatistics,
  developerDashboardKeys,
} from "../../hooks/content-developer-workspace/useContentDeveloperDashboard";
import { useWorkspaceStore } from "../../store/content-developer-workspace/contentDeveloperDashboard.store";
import { deleteLessonApi } from "../../core/api/lesson/lesson.api";
import { deleteCareerPathApi, careerPathKeys } from "../../core/api/career-path/career-path.api";
import { courseApi } from "../../core/api/course/course.api";
import { BookOpen, ChevronLeft, ChevronRight, ChevronsUpDown, Trash2, X, ExternalLink, Search } from "lucide-react";
import { useFeedbackReport } from "../../hooks/useReports";
import { formatRelativeTime } from "../../core/api/content-developer-workspace/contentDeveloperDashboard.api";
import { Skeleton } from "../../components/ui/Skeleton";
import { ShareModal } from "../../components/common/ShareModal";


type CourseStatus = "changes" | "review" | "draft" | "published";

interface Course {
  id: string;
  name: string;
  type: "Career Path" | "Standalone Course" | "Standalone Lesson";
  status: CourseStatus;
  statusLabel: string;
  lastEdited: string;
  action: "view-feedback" | "view" | "edit" | "none";
  thumbnailUrl?: string;
  durationMinutes?: number;
  level?: string;
  authorName?: string;
  enrollmentCount?: number;
  completionRate?: number;
  rating?: number;
}

const statusDot: Record<CourseStatus, string> = {
  changes: "bg-[#b8654e]",
  review: "bg-amber-500",
  draft: "bg-gray-400",
  published: "bg-emerald-500",
};

const statConfig: {
  key: "draft" | "smeReview" | "published" | "changesRequested";
  label: string;
  icon: "draft" | "review" | "published" | "changes";
  iconBg: string;
  iconColor: string;
  dot: boolean;
}[] = [
  {
    key: "draft",
    label: "IN DRAFT",
    icon: "draft",
    iconBg: "bg-[#f6e8c4]",
    iconColor: "text-[#755a12]",
    dot: false,
  },
  {
    key: "smeReview",
    label: "IN SME REVIEW",
    icon: "review",
    iconBg: "bg-[#dce5d3]",
    iconColor: "text-[#446038]",
    dot: false,
  },
  {
    key: "published",
    label: "PUBLISHED",
    icon: "published",
    iconBg: "bg-[#efd3c7]",
    iconColor: "text-[#8f3a20]",
    dot: false,
  },
  {
    key: "changesRequested",
    label: "CHANGES REQUESTED",
    icon: "changes",
    iconBg: "bg-[#e8e8e3]",
    iconColor: "text-[#5c5c5c]",
    dot: true,
  },
];

function ActionButton({
  course,
  onDelete,
}: {
  course: Course;
  onDelete: (course: Course) => void;
}) {
  const navigate = useNavigate();

  let entityType: "course" | "career-path" | "lesson" = "course";
  if (course.type === "Career Path") entityType = "career-path";
  else if (course.type === "Standalone Lesson") entityType = "lesson";

  const handleAction = () => {
    if (course.action === "view-feedback" || course.status === "changes") {
      navigate(`/content-developer/feedback-resolution/${entityType}/${course.id}`, {
        state: {
          entityType,
          entityId: course.id,
          courseName: course.name,
        },
      });
      return;
    }

    if (course.action === "view" || course.status === "published" || course.status === "review") {
      navigate(`/content-developer/course-preview/${entityType}/${course.id}`, {
        state: {
          entityType,
          entityId: course.id,
          courseName: course.name,
          course,
        },
      });
      return;
    }

    if (course.type === "Standalone Lesson") {
      navigate(`/standalone-lesson/${course.id}?type=lesson`, {
        state: {
          lessonId: course.id,
          courseId: course.id,
          publishType: "standalone-lesson",
          courseName: course.name,
        },
      });
      return;
    }

    if (course.type === "Career Path") {
      navigate(`/studio/path-builder/${course.id}`, {
        state: {
          pathId: course.id,
          publishType: "career-path",
          courseName: course.name,
        },
      });
      return;
    }

    navigate(`/create-course/${course.id}?type=course`, {
      state: {
        courseId: course.id,
        publishType: "standalone-course",
        courseName: course.name,
      },
    });
  };

  const actionText =
    course.status === "changes"
      ? "View feedback →"
      : course.status === "published" || course.status === "review"
        ? "View →"
        : "Edit →";

  return (
    <div className="flex items-center justify-end gap-2">
      {/* Delete — only for draft items that can be safely removed */}
      {course.status === "draft" && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(course); }}
          title={`Delete ${course.name}`}
          className="text-[#b8654e] hover:text-[#8f3a20] transition-colors cursor-pointer bg-transparent border-none p-0 inline-flex items-center"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
      <button
        onClick={handleAction}
        className="text-[12px] font-semibold text-[#3a3a3a] hover:text-[#141414] transition-colors cursor-pointer bg-transparent border-none p-0 inline-flex items-center gap-1"
      >
        <span>{actionText}</span>
      </button>
    </div>
  );
}

const getEntityType = (course: Course): "course" | "career-path" | "lesson" => {
  if (course.type === "Career Path") return "career-path";
  if (course.type === "Standalone Lesson") return "lesson";
  return "course";
};

const getCategoryLabel = (course: Course) =>
  course.type === "Career Path" ? "Career Path" : course.type === "Standalone Lesson" ? "Lesson" : "Course";

const formatLevel = (level?: string) =>
  level ? level.toLowerCase().replace(/(^|_|\s)\w/g, (match) => match.replace("_", " ").toUpperCase()) : undefined;

const getInitials = (name?: string) => {
  if (!name) return "IM";
  const trimmed = name.trim();
  if (trimmed.toUpperCase() === "NEXUS") return "IM";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1 && parts[0].length >= 2) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "IM";
};

function RecentActivityItem({
  activity,
}: {
  activity: {
    id: string;
    title: string;
    entityName?: string;
    leadText?: string;
    trailText?: string;
    text?: string;
    detail: string;
    time: string;
    iconVariant?: "clay" | "sage" | "paper" | "honey";
    iconType?: "alert" | "clock" | "check" | "file";
    entityType?: string;
    entityId?: string;
  };
}) {
  const navigate = useNavigate();

  const iconClasses =
    activity.iconVariant === "clay"
      ? "bg-[#efd3c7] text-[#8f3a20]"
      : activity.iconVariant === "sage"
        ? "bg-[#dce5d3] text-[#446038]"
        : activity.iconVariant === "honey"
          ? "bg-[#f6e8c4] text-[#755a12]"
          : "bg-[#f6f6f4] text-[#5c5c5c]";

  const handleClick = () => {
    if (activity.entityId) {
      const type =
        activity.entityType?.toLowerCase().includes("career")
          ? "career-path"
          : activity.entityType?.toLowerCase().includes("lesson")
            ? "lesson"
            : "course";
      navigate(`/content-developer/course-overview/${type}/${activity.entityId}`, {
        state: { entityType: type, entityId: activity.entityId, courseName: activity.title },
      });
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`cdh-list-item px-[22px] py-[13px] flex items-center gap-3 transition-colors hover:bg-[#f6f6f4]/60 ${
        activity.entityId ? "cursor-pointer group" : ""
      }`}
    >
      <div
        className={`cdh-list-ico w-[34px] h-[34px] rounded-[8px] ${iconClasses} flex items-center justify-center shrink-0`}
        aria-hidden="true"
      >
        {activity.iconType === "alert" ? (
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        ) : activity.iconType === "clock" ? (
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        ) : activity.iconType === "check" ? (
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        )}
      </div>
      <div className="cdh-list-body flex-1 min-w-0">
        <div className="cdh-act-text text-[14px] text-[#3a3a3a] leading-[1.45] font-normal truncate">
          {activity.leadText && <span>{activity.leadText}</span>}
          {activity.entityName ? (
            <strong className="font-semibold text-[#141414]">{activity.entityName}</strong>
          ) : !activity.leadText && !activity.trailText ? (
            <span>{activity.text || activity.detail || activity.title}</span>
          ) : null}
          {activity.trailText && <span>{activity.trailText}</span>}
        </div>
      </div>
      <span className="cdh-list-when text-[12px] text-[#5c5c5c] font-normal tracking-[0.04em] whitespace-nowrap shrink-0 ml-2">
        {activity.time || "Recent"}
      </span>
    </div>
  );
}

function PendingActionCard({
  item,
}: {
  item: {
    id: string;
    courseId: string;
    name: string;
    detail: string;
    label: string;
    type: "changes" | "draft" | "review";
    entityType: "career-path" | "course" | "lesson";
  };
}) {
  const navigate = useNavigate();
  const isChanges = item.type === "changes";
  const isDraft = item.type === "draft";

  const handleAction = (e?: React.MouseEvent) => {
    e?.stopPropagation();

    if (isChanges) {
      navigate(`/content-developer/feedback-resolution/${item.entityType}/${item.courseId}`, {
        state: {
          entityType: item.entityType,
          entityId: item.courseId,
          courseName: item.name,
        },
      });
      return;
    }

    if (isDraft) {
      if (item.entityType === "career-path") {
        navigate(`/studio/path-builder/${item.courseId}`, {
          state: { pathId: item.courseId, courseName: item.name },
        });
      } else if (item.entityType === "lesson") {
        navigate(`/standalone-lesson/${item.courseId}?type=lesson`, {
          state: {
            lessonId: item.courseId,
            courseId: item.courseId,
            publishType: "standalone-lesson",
            courseName: item.name,
          },
        });
      } else {
        navigate(`/create-course/${item.courseId}?type=course`, {
          state: {
            courseId: item.courseId,
            publishType: "standalone-course",
            courseName: item.name,
          },
        });
      }
      return;
    }

    navigate(`/content-developer/course-overview/${item.entityType}/${item.courseId}`, {
      state: {
        entityType: item.entityType,
        entityId: item.courseId,
        courseName: item.name,
      },
    });
  };

  return (
    <div
      onClick={handleAction}
      className="cdh-list-item px-[22px] py-[13px] flex items-center gap-3 transition-colors hover:bg-[#f6f6f4]/60 cursor-pointer group"
    >
      <div
        className={`cdh-list-ico w-[34px] h-[34px] rounded-[8px] flex items-center justify-center shrink-0 ${
          isChanges
            ? "cdh-list-ico-clay bg-[#efd3c7] text-[#8f3a20]"
            : isDraft
              ? "cdh-list-ico-honey bg-[#f6e8c4] text-[#755a12]"
              : "cdh-list-ico-sage bg-[#dce5d3] text-[#446038]"
        }`}
        aria-hidden="true"
      >
        {isChanges ? (
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        ) : isDraft ? (
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        )}
      </div>
      <div className="cdh-list-body flex-1 min-w-0">
        <div className="cdh-list-title text-[14px] font-semibold text-[#141414] leading-[1.3] truncate mb-[2px]">
          {item.name}
        </div>
        <div className="cdh-list-sub text-[12px] text-[#5c5c5c] font-normal leading-[1.4] truncate">
          {item.detail}
        </div>
      </div>
      <button
        onClick={handleAction}
        className="nexus-btn ghost sm shrink-0 border-[1.5px] border-[rgba(17,17,17,0.16)] bg-white hover:bg-[#f6f6f4] active:scale-95 text-[#141414] font-bold text-[13px] px-4 py-1.5 rounded-full transition-all cursor-pointer shadow-2xs"
      >
        {item.label}
      </button>
    </div>
  );
}

function PublishedContentCard({ course, onShare }: { course: Course; authorName?: string; onShare?: (course: Course) => void }) {
  const navigate = useNavigate();
  const entityType = getEntityType(course);
  const level = formatLevel(course.level);

  const author = (course.authorName || "").trim() || "Nexus Academy";
  const initials = getInitials(author);
  const duration = course.durationMinutes ? `${course.durationMinutes} min` : undefined;
  const category = getCategoryLabel(course);

  return (
    <div
      onClick={() => navigate(`/content-developer/course-overview/${entityType}/${course.id}`)}
      className="bg-white border border-[rgba(17,17,17,0.1)] rounded-[14px] overflow-hidden shadow-[0_4px_16px_-4px_rgba(42,17,8,0.1)] hover:shadow-[0_24px_48px_-16px_rgba(42,17,8,0.1)] hover:-translate-y-1 transition-all duration-250 flex flex-col group cursor-pointer"
    >
      <div className="relative h-44 bg-[#f6f6f4] flex items-center justify-center overflow-hidden">
        {course.thumbnailUrl ? (
          <img
            src={course.thumbnailUrl}
            alt={course.name}
            className="w-full h-full object-cover transition-transform duration-300 ease-out"
          />
        ) : (
          <div className="w-full h-full bg-[#f6f6f4] flex items-center justify-center text-gray-400 transition-transform duration-300 ease-out">
            <BookOpen className="w-10 h-10" />
          </div>
        )}
        {level && (
          <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 border border-white/10 shadow-xs">
            <Star className="w-3 h-3" /> {level}
          </div>
        )}
        {duration && (
          <div className="absolute top-3 right-3 bg-black/75 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 border border-white/10 shadow-xs">
            <Clock className="w-3 h-3" /> {duration}
          </div>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#b8654e] mb-1">
            {course.type === "Standalone Course" ? (
              <BookOpen className="w-3.5 h-3.5" />
            ) : (
              <Award className="w-3.5 h-3.5" />
            )}
            {category}
          </div>
          <h3 className="text-[16px] font-bold text-[#141414] line-clamp-2 min-h-[44px] transition-colors leading-snug">
            {course.name}
          </h3>
        </div>
        <div className="pt-2 border-t border-[rgba(17,17,17,0.1)] flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {initials && (
              <div className="w-6 h-6 rounded-full bg-[#f6e8c4] text-[#755a12] text-[10px] font-extrabold flex items-center justify-center shrink-0">
                {initials}
              </div>
            )}
            <span className="text-[12px] text-[#5c5c5c] font-medium truncate">
              By: {author}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onShare) {
                  onShare(course);
                }
              }}
              className="w-8 h-8 rounded-full border border-[rgba(17,17,17,0.1)] hover:bg-[#f6f6f4] hover:border-[rgba(17,17,17,0.16)] hover:text-[#141414] flex items-center justify-center text-[#5c5c5c] transition-all cursor-pointer shadow-xs"
              aria-label={`Share ${course.name}`}
              title={`Share ${course.name}`}
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/content-developer/course-preview/${entityType}/${course.id}`);
              }}
              className="w-8 h-8 rounded-full border border-[rgba(17,17,17,0.1)] hover:bg-[#f6f6f4] hover:border-[rgba(17,17,17,0.16)] hover:text-[#141414] flex items-center justify-center text-[#5c5c5c] transition-all cursor-pointer shadow-xs"
              aria-label={`Preview ${course.name}`}
              title={`Preview & Info: ${course.name}`}
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export const ContentDeveloperDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"all" | "draft" | "published">("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showActivityModal, setShowActivityModal] = useState<boolean>(false);
  const [showPendingModal, setShowPendingModal] = useState<boolean>(false);
  const [showPublishedModal, setShowPublishedModal] = useState<boolean>(location.pathname === "/studio/published");
  const [shareItem, setShareItem] = useState<{ id: string; title: string; thumbnailUrl?: string | null; type?: string } | null>(null);
  const [publishedSearch, setPublishedSearch] = useState<string>("");
  const [publishedTypeFilter, setPublishedTypeFilter] = useState<"all" | "course" | "career-path" | "lesson">("all");
  const itemsPerPage = 6;

  const { search, selectedStatus, setFilter, reset } = useWorkspaceStore();

  const { profile, getProfile } = useProfile();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const filter = params.get("filter");
    if (filter === "sme-reviews") {
      navigate("/studio/feedback", { replace: true });
      return;
    }
    if (filter === "learner-qa") {
      navigate("/studio/feedback", { replace: true });
      return;
    }
    if (location.pathname === "/studio/drafts" || filter === "drafts") {
      setActiveTab("draft");
      setFilter("selectedStatus", "draft");
    } else if (location.pathname === "/studio/published" || filter === "published") {
      setActiveTab("published");
      setFilter("selectedStatus", "published");
      setShowPublishedModal(true);
    } else if (location.pathname === "/studio" && !filter) {
      setActiveTab("all");
      setFilter("selectedStatus", "all");
    }
    setCurrentPage(1);
  }, [location.pathname, location.search, navigate, setFilter]);

  useEffect(() => {
    reset();
    queryClient.invalidateQueries({ queryKey: developerDashboardKeys.all });
    if (!profile) {
      getProfile().catch(() => {});
    }
  }, [reset, profile, getProfile, queryClient]);

  const { data: stats } = useWorkspaceStatistics(profile?.id);
  const { data: dashboardData, isLoading, isPending } = useWorkspaceDashboard(profile?.id);

  const handleDelete = async (course: Course) => {
    if (window.confirm(`Are you sure you want to delete ${course.name}?`)) {
      try {
        if (course.type === "Career Path") {
          await deleteCareerPathApi(course.id);
        } else if (course.type === "Standalone Course") {
          await courseApi.delete(course.id);
        } else if (course.type === "Standalone Lesson") {
          await deleteLessonApi(course.id);
        }

        queryClient.invalidateQueries({ queryKey: developerDashboardKeys.all });
        queryClient.invalidateQueries({ queryKey: careerPathKeys.all });
        queryClient.invalidateQueries({ queryKey: ["courses"] });
        queryClient.invalidateQueries({ queryKey: ["lessons"] });
        toast.success(`Deleted ${course.name}`);
      } catch {
        toast.error("Failed to delete. Please try again.");
      }
    }
  };

  // Enforce strict 100-item maximum limit
  const listData: Course[] = Array.isArray(dashboardData?.courses)
    ? (dashboardData.courses as Course[]).slice(0, 100)
    : [];

  const statStatusMap: Record<string, CourseStatus> = {
    draft: "draft",
    smeReview: "review",
    published: "published",
    changesRequested: "changes",
  };

  const filteredCourses = listData.filter((course) => {
    const matchesSearch = course.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      selectedStatus === "all"
        ? activeTab === "all"
          ? true
          : course.status === activeTab
        : course.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage) || 1;
  const paginatedCourses = filteredCourses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const userName =
    [profile?.profile?.firstName, profile?.profile?.lastName].filter(Boolean).join(" ") ||
    "Author";

  // Dynamic real counts from backend database
  const backendStats = (dashboardData as any)?.statistics;
  const draftCount = backendStats?.draft ?? stats?.draft ?? listData.filter((c) => c.status === "draft").length;
  const reviewCount = backendStats?.smeReview ?? stats?.smeReview ?? listData.filter((c) => c.status === "review").length;
  const publishedCount = backendStats?.published ?? stats?.published ?? listData.filter((c) => c.status === "published").length;
  const changesCount = backendStats?.changesRequested ?? stats?.changesRequested ?? listData.filter((c) => c.status === "changes").length;

  const tabDraftCount = listData.filter((c) => c.status === "draft").length;
  const tabPublishedCount = listData.filter((c) => c.status === "published").length;

  // Real recent activity from DB workflow logs
  const rawRecentActivity = (dashboardData as any)?.recentActivity;
  const allMappedActivities = Array.isArray(rawRecentActivity) && rawRecentActivity.length > 0
    ? rawRecentActivity
        .filter((act: any) => act.entityType !== "QUIZ")
        .map((act: any) => {
          const statusUpper = String(act.toStatus || "").toUpperCase();
          const fromUpper = String(act.fromStatus || "").toUpperCase();
          const isReject = statusUpper === "REJECTED" || statusUpper === "CHANGES_REQUESTED";
          const isApproved = statusUpper === "APPROVED";
          const isPublished = statusUpper === "PUBLISHED";
          const isReview = statusUpper === "SUBMITTED" || statusUpper === "UNDER_REVIEW";

          const entityType =
            act.entityType === "CAREER_PATH"
              ? "career-path"
              : act.entityType === "LESSON"
                ? "lesson"
                : "course";

          const entityName = act.entityName || "Content Item";

          // Format clean, human-readable activity text exactly matching the Figma reference design:
          // 1. Changes requested: "Reviewer requested changes on {entityName}"
          // 2. Submitted for review: "You submitted {entityName} for SME review"
          // 3. Published: "{entityName} was published"
          // 4. Approved: "{entityName} was approved by SME"
          // 5. Draft: "You created a new draft: {entityName}" or "You updated draft: {entityName}"
          let actText = "";
          let leadText = "";
          let trailText = "";
          let iconVariant: "clay" | "sage" | "paper" | "honey" = "paper";
          let iconType: "alert" | "clock" | "check" | "file" = "file";

          if (isReject) {
            iconVariant = "clay";
            iconType = "alert";
            leadText = "Reviewer requested changes on ";
            actText = `Reviewer requested changes on ${entityName}`;
          } else if (isReview) {
            iconVariant = "sage";
            iconType = "clock";
            leadText = "You submitted ";
            trailText = " for SME review";
            actText = `You submitted ${entityName} for SME review`;
          } else if (isPublished) {
            iconVariant = "sage";
            iconType = "check";
            trailText = " was published";
            actText = `${entityName} was published`;
          } else if (isApproved) {
            iconVariant = "sage";
            iconType = "check";
            trailText = " was approved";
            actText = `${entityName} was approved`;
          } else {
            iconVariant = "paper";
            iconType = "file";
            const isNew = fromUpper === "NONE" || !fromUpper;
            leadText = isNew ? "You created a new draft: " : "You updated draft: ";
            actText = `${leadText}${entityName}`;
          }

          return {
            id: act.id,
            title: entityName,
            entityName,
            leadText,
            trailText,
            text: actText,
            detail: actText,
            time: formatRelativeTime(act.createdAt),
            iconVariant,
            iconType,
            entityType,
            entityId: act.entityId,
            fromStatus: act.fromStatus,
            toStatus: act.toStatus,
          };
        })
    : [];

  const recentActivity = allMappedActivities.slice(0, 4);


  // Real SME feedback inbox from content_reviews
  const rawFeedbackInbox = (dashboardData as any)?.feedbackInbox;
  const feedbackList: any[] = Array.isArray(rawFeedbackInbox) ? rawFeedbackInbox : [];

  // Real pending your action (changes requested & in-progress drafts)
  const changesActions = listData
    .filter((c) => c.status === "changes")
    .map((c) => {
      const match = feedbackList.find((fb) => fb.entityId === c.id);
      const reviewerName = match?.reviewer?.name;
      const subtitle = reviewerName ? `Changes requested by ${reviewerName}` : "Changes requested by reviewer";
      return {
        id: c.id,
        courseId: c.id,
        name: c.name,
        detail: subtitle,
        label: "Resolve",
        type: "changes" as const,
        entityType:
          c.type === "Career Path"
            ? ("career-path" as const)
            : c.type === "Standalone Lesson"
              ? ("lesson" as const)
              : ("course" as const),
      };
    });

  const draftActions = listData
    .filter((c) => c.status === "draft")
    .map((c) => ({
      id: c.id,
      courseId: c.id,
      name: c.name,
      detail: "Draft ready to submit for review",
      label: "Submit",
      type: "draft" as const,
      entityType:
        c.type === "Career Path"
          ? ("career-path" as const)
          : c.type === "Standalone Lesson"
            ? ("lesson" as const)
            : ("course" as const),
    }));

  const allPendingActions = [...changesActions, ...draftActions];
  const totalPendingActionCount = allPendingActions.length;
  const pendingActions = allPendingActions;

  // The detail field MUST reflect the ACTUAL current SME review outcome.
  // Do NOT show "Submitted for SME review" once the SME has already reviewed.
  const feedbackInbox = feedbackList.length > 0
    ? feedbackList.slice(0, 4).map((item: any) => {
        const statusUpper = String(item.status).toUpperCase();
        const isChanges = statusUpper === "CHANGES_REQUESTED" || statusUpper === "REJECTED";
        const isApproved = statusUpper === "APPROVED";
        const isPublished = statusUpper === "PUBLISHED";
        const entityType =
          item.entityType === "CAREER_PATH"
            ? "career-path"
            : item.entityType === "LESSON"
              ? "lesson"
              : "course";

        // Derive the human-readable detail from the ACTUAL review status.
        let detail: string;
        if (isChanges) {
          detail = item.comment || (item.reviewer?.name ? `1 required change from ${item.reviewer.name}` : "1 required change from SME reviewer");
        } else if (isApproved) {
          detail = item.comment
            ? item.comment.toLowerCase().includes("approved")
              ? item.comment
              : `Review complete, approved`
            : "Review complete, approved";
        } else {
          detail = item.comment || (item.reviewer?.name ? `2 optional suggestions from ${item.reviewer.name}` : "2 optional suggestions from reviewer");
        }

        // Figma specification dot classes
        const dotClass = isChanges
          ? "cdh-fb-dot-bad bg-[#b8523e]"
          : isApproved || isPublished
            ? "cdh-fb-dot-good bg-[#446038]"
            : "cdh-fb-dot-warn bg-[#c99b2e]";

        const actionLabel = isChanges ? "Resolve" : isApproved || isPublished ? "View" : "Open";
        const fbStatus: "changes" | "review" = isChanges ? "changes" : "review";

        return {
          id: item.id,
          courseId: item.entityId,
          name: item.entityName || "Content Item",
          detail,
          reviewerName: item.reviewer?.name || "SME Reviewer",
          time: formatRelativeTime(item.reviewedAt || item.submittedAt),
          dotClass,
          actionLabel,
          status: fbStatus,
          entityType,
        };
      })
    : listData
        .filter((c) => c.status === "changes")
        .map((c) => ({
          id: `fb-${c.id}`,
          courseId: c.id,
          name: c.name,
          detail: "1 required change from SME reviewer",
          reviewerName: "SME Reviewer",
          time: c.lastEdited || "Recent",
          dotClass: "cdh-fb-dot-bad bg-[#b8523e]",
          actionLabel: "Resolve",
          status: "changes" as const,
          entityType:
            c.type === "Career Path"
              ? ("career-path" as const)
              : c.type === "Standalone Lesson"
                ? ("lesson" as const)
                : ("course" as const),
        }))
        .slice(0, 4);

  const publishedCourses: Course[] = listData.filter((c) => c.status === "published");

  const filteredPublishedModalItems = publishedCourses.filter((item) => {
    if (publishedTypeFilter === "course" && item.type !== "Standalone Course") return false;
    if (publishedTypeFilter === "career-path" && item.type !== "Career Path") return false;
    if (publishedTypeFilter === "lesson" && item.type !== "Standalone Lesson") return false;
    if (publishedSearch.trim()) {
      const q = publishedSearch.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchType = item.type.toLowerCase().includes(q);
      return matchName || matchType;
    }
    return true;
  });


  if ((isLoading || isPending) && !dashboardData) {
    return (
      <div className="w-full min-w-0 flex flex-col gap-7 pb-14">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-3">
            <Skeleton className="h-4 w-48 bg-gray-200" />
            <Skeleton className="h-8 w-64 bg-gray-200" />
            <Skeleton className="h-5 w-[400px] bg-gray-200" />
          </div>
          <Skeleton className="h-10 w-32 rounded-full bg-gray-200" />
        </div>

        {/* KPI Cards Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-[14px] p-4 border border-gray-100 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <Skeleton className="h-4 w-24 bg-gray-200" />
                <Skeleton className="h-8 w-8 rounded-lg bg-gray-200" />
              </div>
              <Skeleton className="h-10 w-16 bg-gray-200" />
            </div>
          ))}
        </div>

        {/* Content Layout Skeleton */}
        <div className="flex flex-col xl:flex-row items-start gap-6">
          {/* Main Table Skeleton */}
          <div className="w-full xl:w-[65%] 2xl:w-[70%] bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <Skeleton className="h-6 w-32 bg-gray-200" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-48 rounded-lg bg-gray-200" />
                <Skeleton className="h-9 w-24 rounded-lg bg-gray-200" />
              </div>
            </div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl bg-gray-100" />
              ))}
            </div>
          </div>

          {/* Right Sidebar Skeleton */}
          <div className="w-full xl:w-[35%] 2xl:w-[30%] space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
              <Skeleton className="h-6 w-40 bg-gray-200" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4 items-start">
                  <Skeleton className="h-10 w-10 rounded-xl shrink-0 bg-gray-200" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-full bg-gray-200" />
                    <Skeleton className="h-3 w-2/3 bg-gray-200" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div
      className="w-full min-w-0 flex flex-col gap-7 pb-14 text-[#141414]"
      style={{ fontFamily: "'Manrope', system-ui, -apple-system, BlinkMacSystemFont, sans-serif" }}
    >
      {/* Page Header — Eyebrow + H1 + Subtitle + Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 min-w-0">
        <div className="min-w-0">
          <div
            className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#5c5c5c] mb-1.5"
          >
            CONTENT DEVELOPER WORKSPACE
          </div>
          <h1
            className="text-[24px] lg:text-[24px] font-extrabold tracking-[-0.02em] text-[#141414] leading-[1.15] mb-1"
          >
            Author your craft
          </h1>
          <p
            className="text-[14px] text-[#3a3a3a] font-normal leading-[1.5] max-w-[580px]"
          >
            {userName}. {draftCount} {draftCount === 1 ? "draft" : "drafts"} in progress,{" "}
            {reviewCount} {reviewCount === 1 ? "course" : "courses"} awaiting SME approval, and{" "}
            {changesCount} {changesCount === 1 ? "course" : "courses"} with changes requested.
          </p>
        </div>

        {/* Right-aligned Header Actions */}
        <div className="flex items-center gap-2.5 shrink-0 pt-1">
          <button
            onClick={() => navigate("/studio/builder/1")}
            className="bg-[#FCF7AE] hover:bg-[#F0EA8A] text-[#141414] font-bold text-[14px] px-[17px] py-[9px] rounded-full transition-all duration-200 shadow-[0_8px_24px_-8px_rgba(42,17,8,0.18)] hover:shadow-[0_14px_32px_-8px_rgba(42,17,8,0.24)] hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer flex items-center gap-1.5 border border-[#d6b753]"
          >
            <Plus className="w-4 h-4" />
             Create new
          </button>
        </div>
      </div>

      {/* 4 Stat Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 min-w-0">
        {statConfig.map((stat) => {
          const targetStatus = statStatusMap[stat.key];
          const isSelected = selectedStatus === targetStatus;
          const count =
            stat.key === "draft"
              ? draftCount
              : stat.key === "smeReview"
                ? reviewCount
                : stat.key === "published"
                  ? publishedCount
                  : changesCount;

          return (
            <button
              key={stat.key}
              onClick={() => {
                if (isSelected) {
                  setFilter("selectedStatus", "all");
                } else {
                  setFilter("selectedStatus", targetStatus);
                }
                setCurrentPage(1);
              }}
              className={`bg-white rounded-[14px] p-[16px_18px] text-left transition-all duration-200 cursor-pointer border active:scale-[0.99] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#11111129] ${
                isSelected
                  ? "border-[#141414] shadow-[0_4px_16px_-4px_rgba(42,17,8,0.12)] bg-[#FAFAFA]"
                  : "border-[rgba(17,17,17,0.1)] hover:border-[rgba(17,17,17,0.2)] hover:shadow-[0_12px_28px_-6px_rgba(42,17,8,0.12)] hover:-translate-y-1"
              }`}
            >
              {/* Icon Top Left */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div
                  className={`w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 ${stat.iconBg} ${stat.iconColor}`}
                >
                  {stat.icon === "draft" && <FileText className="w-4.5 h-4.5" />}
                  {stat.icon === "review" && <Clock className="w-4.5 h-4.5" />}
                  {stat.icon === "published" && <Check className="w-4.5 h-4.5" />}
                  {stat.icon === "changes" && <AlertTriangle className="w-4.5 h-4.5" />}
                </div>
              </div>

              {/* Label */}
              <div className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#5c5c5c] mb-2.5">
                {stat.label}
              </div>

              {/* Value + Optional Dot */}
              <div className="flex items-center gap-2">
                <span className="text-[24px] font-bold tracking-[-0.025em] text-[#141414] leading-none">
                  {count}
                </span>
                {stat.dot && count > 0 && (
                  <span className="w-2 h-2 rounded-full bg-[#b8654e] shrink-0" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Quick-Create Strip (3 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-w-0">
        <button
          onClick={() => navigate("/studio/path-builder")}
          className="bg-white border border-[rgba(17,17,17,0.1)] rounded-[14px] p-[18px_22px] text-left transition-all duration-200 flex items-center justify-between group cursor-pointer hover:border-[rgba(17,17,17,0.2)] hover:shadow-[0_12px_28px_-6px_rgba(42,17,8,0.12)] hover:-translate-y-1 active:scale-[0.99]"
        >
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <div className="w-11 h-11 rounded-[12px] bg-[#f6e8c4] text-[#755a12] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200">
              <Award className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[16px] font-bold tracking-[-0.005em] text-[#141414] mb-0.5 truncate">
                Create a career path
              </div>
              <div className="text-[14px] text-[#5c5c5c] font-normal truncate">
                Multi-course structured track
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#8c8c8c] group-hover:text-[#141414] group-hover:translate-x-1 transition-all duration-200 shrink-0 ml-2" />
        </button>

        <button
          onClick={() =>
            navigate("/studio/builder/1?type=course", {
              state: { publishType: "standalone-course" },
            })
          }
          className="bg-white border border-[rgba(17,17,17,0.1)] rounded-[14px] p-[18px_22px] text-left transition-all duration-200 flex items-center justify-between group cursor-pointer hover:border-[rgba(17,17,17,0.2)] hover:shadow-[0_12px_28px_-6px_rgba(42,17,8,0.12)] hover:-translate-y-1 active:scale-[0.99]"
        >
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <div className="w-11 h-11 rounded-[12px] bg-[#f6e8c4] text-[#755a12] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[16px] font-bold tracking-[-0.005em] text-[#141414] mb-0.5 truncate">
                Create a course
              </div>
              <div className="text-[14px] text-[#5c5c5c] font-normal truncate">
                Single self-contained course
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#8c8c8c] group-hover:text-[#141414] group-hover:translate-x-1 transition-all duration-200 shrink-0 ml-2" />
        </button>

        <button
          onClick={() =>
            navigate("/studio/builder/1?type=lesson", {
              state: { publishType: "standalone-lesson" },
            })
          }
          className="bg-white border border-[rgba(17,17,17,0.1)] rounded-[14px] p-[18px_22px] text-left transition-all duration-200 flex items-center justify-between group cursor-pointer hover:border-[rgba(17,17,17,0.2)] hover:shadow-[0_12px_28px_-6px_rgba(42,17,8,0.12)] hover:-translate-y-1 active:scale-[0.99]"
        >
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <div className="w-11 h-11 rounded-[12px] bg-[#f6e8c4] text-[#755a12] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[16px] font-bold tracking-[-0.005em] text-[#141414] mb-0.5 truncate">
                Create a lesson
              </div>
              <div className="text-[14px] text-[#5c5c5c] font-normal truncate">
                One focused lesson
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#8c8c8c] group-hover:text-[#141414] group-hover:translate-x-1 transition-all duration-200 shrink-0 ml-2" />
        </button>
      </div>

      {/* Two-Column Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.8fr_1fr] xl:grid-cols-[2fr_1.1fr] gap-6 min-w-0">
        {/* Left Column: My Content Table */}
        <div className="space-y-6 min-w-0">
          <div id="my-content-section" className="card bg-white border border-[rgba(17,17,17,0.1)] rounded-[14px] shadow-[0_4px_16px_-4px_rgba(42,17,8,0.1)] overflow-hidden transition-all duration-200 hover:shadow-[0_12px_28px_-6px_rgba(42,17,8,0.12)] hover:border-[rgba(17,17,17,0.18)] hover:-translate-y-0.5">
            {/* Header & Tabs */}
            <div className="px-[22px] pt-[20px]">
              {/* Top Title Row */}
              <div className="flex items-center justify-between gap-3">
                <div className="text-[16px] font-semibold text-[#141414]">My content</div>
                <button
                  onClick={() => {
                    setActiveTab("all");
                    setFilter("selectedStatus", "all");
                    setCurrentPage(1);
                    const el = document.getElementById("my-content-section");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="text-[12px] font-semibold text-[#5c5c5c] hover:text-[#b8523e] transition-colors cursor-pointer flex items-center gap-1 bg-transparent border-none p-0"
                >
                  All content &rarr;
                </button>
              </div>

              {/* Tabs Bar */}
              <div className="flex items-center gap-6 border-b border-[rgba(17,17,17,0.1)] mt-4">
                <button
                  onClick={() => {
                    setActiveTab("all");
                    setFilter("selectedStatus", "all");
                    setCurrentPage(1);
                  }}
                  className={`text-[14px] pb-[10px] -mb-[1px] border-b-2 transition-all cursor-pointer whitespace-nowrap bg-transparent border-t-0 border-l-0 border-r-0 p-0 ${
                    activeTab === "all" && selectedStatus === "all"
                      ? "border-[#141414] text-[#141414] font-bold"
                      : "border-transparent text-[#5c5c5c] font-semibold hover:text-[#141414] hover:border-[rgba(17,17,17,0.16)]"
                  }`}
                >
                  All ({listData.length})
                </button>
                <button
                  onClick={() => {
                    setActiveTab("draft");
                    setFilter("selectedStatus", "draft");
                    setCurrentPage(1);
                  }}
                  className={`text-[14px] pb-[10px] -mb-[1px] border-b-2 transition-all cursor-pointer whitespace-nowrap bg-transparent border-t-0 border-l-0 border-r-0 p-0 ${
                    selectedStatus === "draft" || activeTab === "draft"
                      ? "border-[#141414] text-[#141414] font-bold"
                      : "border-transparent text-[#5c5c5c] font-semibold hover:text-[#141414] hover:border-[rgba(17,17,17,0.16)]"
                  }`}
                >
                  Drafts ({tabDraftCount})
                </button>
                <button
                  onClick={() => {
                    setActiveTab("published");
                    setFilter("selectedStatus", "published");
                    setCurrentPage(1);
                  }}
                  className={`text-[14px] pb-[10px] -mb-[1px] border-b-2 transition-all cursor-pointer whitespace-nowrap bg-transparent border-t-0 border-l-0 border-r-0 p-0 ${
                    selectedStatus === "published" || activeTab === "published"
                      ? "border-[#141414] text-[#141414] font-bold"
                      : "border-transparent text-[#5c5c5c] font-semibold hover:text-[#141414] hover:border-[rgba(17,17,17,0.16)]"
                  }`}
                >
                  Published ({tabPublishedCount})
                </button>
              </div>
            </div>

            {/* Items Count Bar */}
            <div className="px-[22px] py-[10px] flex items-center justify-end">
              <span className="text-[13px] text-[#5c5c5c] font-normal shrink-0">
                <strong className="font-bold text-[#141414]">{filteredCourses.length}</strong> of{" "}
                {listData.length} items
              </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto min-w-0">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f6f6f4] border-y border-[rgba(17,17,17,0.1)] text-[12px] font-semibold uppercase tracking-[0.08em] text-[#5c5c5c]">
                    <th className="py-[11px] pl-[22px] pr-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        LEARNING <ChevronsUpDown className="w-3.5 h-3.5 text-[#8c8c8c]" />
                      </span>
                    </th>
                    <th className="py-[11px] px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        CATEGORY <ChevronsUpDown className="w-3.5 h-3.5 text-[#8c8c8c]" />
                      </span>
                    </th>
                    <th className="py-[11px] px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        STATUS <ChevronsUpDown className="w-3.5 h-3.5 text-[#8c8c8c]" />
                      </span>
                    </th>
                    <th className="py-[11px] px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        LAST EDITED <ChevronsUpDown className="w-3.5 h-3.5 text-[#8c8c8c]" />
                      </span>
                    </th>
                    <th className="py-[11px] pl-4 pr-[22px] text-right whitespace-nowrap">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(17,17,17,0.1)]">
                  {paginatedCourses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-[22px] py-8 text-center text-[#8c8c8c] font-medium">
                        No content matching filter.
                      </td>
                    </tr>
                  ) : (
                    paginatedCourses.map((course) => {
                      const entityType =
                        course.type === "Career Path"
                          ? "career-path"
                          : course.type === "Standalone Lesson"
                            ? "lesson"
                            : "course";

                      return (
                        <tr key={course.id} className="hover:bg-[#f6f6f4] transition-colors">
                          <td className="py-[14px] pl-[22px] pr-4 font-semibold text-[16px] text-[#141414]">
                            <button
                              onClick={() =>
                                navigate(`/content-developer/course-overview/${entityType}/${course.id}`, {
                                  state: {
                                    entityType,
                                    entityId: course.id,
                                    courseName: course.name,
                                  },
                                })
                              }
                              className="text-left transition-colors cursor-pointer bg-transparent border-none p-0 font-semibold text-[#141414]"
                            >
                              {course.name}
                            </button>
                          </td>
                          <td className="py-[14px] px-4 whitespace-nowrap">
                            <span className="inline-flex items-center rounded-full border border-[rgba(17,17,17,0.16)] text-[#3a3a3a] text-[12px] font-semibold h-[22px] px-[10px] bg-transparent whitespace-nowrap">
                              {course.type === "Career Path"
                                ? "Career Path"
                                : course.type === "Standalone Lesson"
                                  ? "Lesson"
                                  : "Course"}
                            </span>
                          </td>
                          <td className="py-[14px] px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full text-[12px] font-semibold h-[22px] px-[10px] whitespace-nowrap ${
                                course.status === "changes"
                                  ? "bg-[#efd3c7]/40 text-[#8c4534] border border-[#ddb0a0]/60"
                                  : course.status === "review"
                                    ? "bg-[#fef3c7]/60 text-[#92400e] border border-[#fde68a]/60"
                                    : course.status === "published"
                                      ? "bg-[#dcfce7]/60 text-[#166534] border border-[#bbf7d0]/60"
                                      : "bg-[#f6f6f4] text-[#3a3a3a] border border-[#e8e8e3]"
                              }`}
                            >
                              {course.status !== "draft" && (
                                <span
                                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDot[course.status]}`}
                                />
                              )}
                              <span>{course.statusLabel}</span>
                            </span>
                          </td>
                          <td className="py-[14px] px-4 text-[14px] text-[#5c5c5c] whitespace-nowrap">
                            {course.lastEdited || "1d ago"}
                          </td>
                          <td className="py-[14px] pl-4 pr-[22px] text-right whitespace-nowrap">
                            <ActionButton course={course} onDelete={handleDelete} />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-[22px] py-3 border-t border-[rgba(17,17,17,0.1)] flex items-center justify-between bg-[#f6f6f4]/50">
                <span className="text-[12px] text-[#5c5c5c] font-medium">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="border border-[rgba(17,17,17,0.16)] bg-white hover:bg-[#f6f6f4] disabled:opacity-40 disabled:cursor-not-allowed text-[#141414] font-semibold text-[12px] px-3 py-1 rounded-lg transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="border border-[rgba(17,17,17,0.16)] bg-white hover:bg-[#f6f6f4] disabled:opacity-40 disabled:cursor-not-allowed text-[#141414] font-semibold text-[12px] px-3 py-1 rounded-lg transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="card bg-white border border-[rgba(17,17,17,0.1)] rounded-[14px] shadow-[0_4px_16px_-4px_rgba(42,17,8,0.1)] overflow-hidden transition-all duration-200 hover:shadow-[0_12px_28px_-6px_rgba(42,17,8,0.12)] hover:border-[rgba(17,17,17,0.18)] hover:-translate-y-0.5">
            <div className="card-head px-[22px] py-[16px] border-b border-[rgba(17,17,17,0.1)] flex items-center justify-between">
              <div className="card-title text-[16px] font-semibold text-[#141414] tracking-[-0.01em]">
                Recent activity
              </div>
              <button
                onClick={() => setShowActivityModal(true)}
                className="card-link text-[12px] font-semibold text-[#5c5c5c] hover:text-[#b8523e] tracking-[0.04em] transition-colors cursor-pointer flex items-center gap-1 bg-transparent border-none p-0"
              >
                All &rarr;
              </button>
            </div>

            <div className="cdh-list divide-y divide-[rgba(17,17,17,0.1)]">
              {recentActivity.length === 0 ? (
                <div className="px-[22px] py-4 text-center text-xs text-[#8c8c8c] italic">
                  No recent activity recorded yet.
                </div>
              ) : (
                recentActivity.map((activity) => (
                  <RecentActivityItem key={activity.id} activity={activity} />
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Column: SME Feedback Inbox & Quick Feeds */}
        <div className="space-y-6 min-w-0">
          {/* SME Feedback Inbox */}
          <div className="card bg-white border border-[rgba(17,17,17,0.1)] rounded-[14px] shadow-[0_4px_16px_-4px_rgba(42,17,8,0.1)] overflow-hidden transition-all duration-200 hover:shadow-[0_12px_28px_-6px_rgba(42,17,8,0.12)] hover:border-[rgba(17,17,17,0.18)] hover:-translate-y-0.5">
            <div className="card-head px-[22px] py-[16px] border-b border-[rgba(17,17,17,0.1)] flex items-center justify-between">
              <div className="card-title text-[16px] font-semibold text-[#141414] tracking-[-0.01em]">
                SME feedback inbox
              </div>
              <button
                onClick={() => navigate("/studio/feedback")}
                className="card-link text-[12px] font-semibold text-[#5c5c5c] hover:text-[#b8523e] tracking-[0.04em] transition-colors cursor-pointer bg-transparent border-none p-0 inline-flex items-center gap-1"
              >
                All{" "}
                <svg
                  viewBox="0 0 24 24"
                  width="13"
                  height="13"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>
            <div className="cdh-fb-list divide-y divide-[rgba(17,17,17,0.1)]">
              {feedbackInbox.length === 0 ? (
                <div className="px-[22px] py-4 text-center text-xs text-[#8c8c8c] italic">
                  No pending feedback from SMEs.
                </div>
              ) : (
                feedbackInbox.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (item.status === "changes") {
                        navigate(`/content-developer/feedback-resolution/${item.entityType}/${item.courseId}`, {
                          state: {
                            entityType: item.entityType,
                            entityId: item.courseId,
                            courseName: item.name,
                          },
                        });
                      } else {
                        navigate(`/content-developer/course-overview/${item.entityType}/${item.courseId}`, {
                          state: {
                            entityType: item.entityType,
                            entityId: item.courseId,
                            courseName: item.name,
                          },
                        });
                      }
                    }}
                    className="cdh-fb-item px-[22px] py-[16px] flex items-start gap-3 transition-colors hover:bg-[#f6f6f4]/60 cursor-pointer"
                  >
                    <span
                      className={`cdh-fb-dot w-2 h-2 rounded-full shrink-0 mt-[6px] ${item.dotClass}`}
                      aria-hidden="true"
                    />
                    <div className="cdh-fb-body flex-1 min-w-0">
                      <div className="cdh-fb-title text-[14px] font-semibold text-[#141414] leading-[1.3] truncate mb-[2px]">
                        {item.name}
                      </div>
                      <div className="cdh-fb-sub text-[12px] text-[#5c5c5c] font-normal leading-[1.4] truncate mb-2">
                        {item.detail}
                      </div>
                      <div className="cdh-fb-foot flex items-center justify-between gap-2.5 mt-1">
                        <span className="cdh-fb-when text-[12px] tracking-[0.04em] text-[#8c8c8c]">
                          {item.time}
                        </span>
                        <button
                          onClick={() => {
                            if (item.status === "changes") {
                              navigate(`/content-developer/feedback-resolution/${item.entityType}/${item.courseId}`, {
                                state: {
                                  entityType: item.entityType,
                                  entityId: item.courseId,
                                  courseName: item.name,
                                },
                              });
                            } else {
                              navigate(`/content-developer/course-overview/${item.entityType}/${item.courseId}`, {
                                state: {
                                  entityType: item.entityType,
                                  entityId: item.courseId,
                                  courseName: item.name,
                                },
                              });
                            }
                          }}
                          className="nexus-btn ghost sm shrink-0 border-[1.5px] border-[rgba(17,17,17,0.16)] bg-white hover:bg-[#f6f6f4] active:scale-95 text-[#141414] font-semibold text-[13px] px-4 py-1 rounded-full transition-all cursor-pointer shadow-2xs"
                        >
                          {item.actionLabel}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pending Your Action */}
          <div className="card bg-white border border-[rgba(17,17,17,0.1)] rounded-[14px] shadow-[0_4px_16px_-4px_rgba(42,17,8,0.1)] overflow-hidden transition-all duration-200 hover:shadow-[0_12px_28px_-6px_rgba(42,17,8,0.12)] hover:border-[rgba(17,17,17,0.18)] hover:-translate-y-0.5">
            <div className="card-head px-[22px] py-[16px] border-b border-[rgba(17,17,17,0.1)] flex items-center justify-between">
              <div className="card-title text-[16px] font-semibold text-[#141414] tracking-[-0.01em]">
                Pending your action
              </div>
              <button
                onClick={() => setShowPendingModal(true)}
                className="cdh-inbox-count min-w-[22px] px-2.5 py-0.5 rounded-full bg-[#efd3c7] text-[#8f3a20] font-bold text-[12px] text-center inline-block cursor-pointer hover:opacity-80 transition-opacity border-none"
                aria-label={`${totalPendingActionCount} items pending`}
                title="View all pending actions"
              >
                {totalPendingActionCount}
              </button>
            </div>

            <div className="cdh-list divide-y divide-[rgba(17,17,17,0.1)]">
              {pendingActions.length === 0 ? (
                <div className="px-[22px] py-4 text-center text-xs text-[#8c8c8c] italic">
                  No pending actions.
                </div>
              ) : (
                pendingActions.map((item) => (
                  <PendingActionCard key={item.id} item={item} />
                ))
              )}
            </div>
          </div>

          {/* Your Published Content */}
          <div className="card bg-white border border-[rgba(17,17,17,0.1)] rounded-[14px] shadow-[0_4px_16px_-4px_rgba(42,17,8,0.1)] overflow-hidden transition-all duration-200 hover:shadow-[0_12px_28px_-6px_rgba(42,17,8,0.12)] hover:border-[rgba(17,17,17,0.18)] hover:-translate-y-0.5">
            <div className="card-head px-[22px] py-[16px] border-b border-[rgba(17,17,17,0.1)] flex items-center justify-between">
              <div className="card-title text-[16px] font-semibold text-[#141414] tracking-[-0.01em]">
                Your published content
              </div>
              <button
                onClick={() => setShowPublishedModal(true)}
                className="card-link text-[12px] font-semibold text-[#5c5c5c] hover:text-[#b8523e] tracking-[0.04em] transition-colors cursor-pointer bg-transparent border-none p-0 inline-flex items-center gap-1"
              >
                All published{" "}
                <svg
                  viewBox="0 0 24 24"
                  width="13"
                  height="13"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>

            <div className="cdh-list divide-y divide-[rgba(17,17,17,0.1)]">
              {publishedCourses.length === 0 ? (
                <div className="px-[22px] py-4 text-center text-xs text-[#8c8c8c] italic">
                  No published content yet.
                </div>
              ) : (
                publishedCourses.slice(0, 4).map((item) => {
                  const entityType =
                    item.type === "Career Path"
                      ? "career-path"
                      : item.type === "Standalone Lesson"
                        ? "lesson"
                        : "course";

                  const enrolments = item.enrollmentCount ?? 0;
                  const completion = item.completionRate ?? 0;
                  const subText = `${enrolments} enrolment${enrolments === 1 ? "" : "s"}, ${completion}% complete`;

                  return (
                    <div
                      key={item.id}
                      onClick={() => navigate(`/content-developer/course-overview/${entityType}/${item.id}`)}
                      className="cdh-list-item px-[22px] py-[13px] flex items-center gap-3 transition-colors hover:bg-[#f6f6f4]/60 cursor-pointer group"
                    >
                      <div
                        className="cdh-list-ico cdh-list-ico-sage w-[34px] h-[34px] rounded-[8px] bg-[#dce5d3] text-[#446038] flex items-center justify-center shrink-0"
                        aria-hidden="true"
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                        </svg>
                      </div>
                      <div className="cdh-list-body flex-1 min-w-0">
                        <div className="cdh-list-title text-[16px] font-semibold text-[#141414] leading-[1.3] truncate mb-[2px]">
                          {item.name}
                        </div>
                        <div
                          className="cdh-list-sub text-[14px] font-normal leading-[1.4] truncate"
                          style={{ color: "var(--c-sage-text, #446038)" }}
                        >
                          {subText}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Published Content Strip (Bottom Grid) */}
      <div className="space-y-4 pt-2 min-w-0">
        <div className="flex items-center justify-between">
          <h2 className="text-[20px] font-bold text-[#141414]">Published content</h2>
          <button
            onClick={() => setShowPublishedModal(true)}
            className="text-[12px] font-semibold text-[#5c5c5c] hover:text-[#b8523e] transition-colors cursor-pointer bg-transparent border-none p-0"
          >
            All published &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 min-w-0">
          {publishedCourses.length === 0 ? (
            <div className="col-span-full py-8 text-center text-xs text-[#8c8c8c] italic bg-white rounded-[14px] border border-dashed border-[rgba(17,17,17,0.16)]">
              No published content yet.
            </div>
          ) : (
            publishedCourses.map((course) => (
              <PublishedContentCard
                key={course.id}
                course={course}
                onShare={(c) => setShareItem({ id: c.id, title: c.name, thumbnailUrl: c.thumbnailUrl, type: c.type })}
              />
            ))
          )}
        </div>
      </div>

      {/* Detailed Recent Activity Modal */}
      {showActivityModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[16px] border border-[rgba(17,17,17,0.1)] shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-[rgba(17,17,17,0.1)] flex items-center justify-between">
              <div>
                <h3 className="text-[18px] font-bold text-[#141414]">Detailed Recent Activity</h3>
                <p className="text-[13px] text-[#5c5c5c]">All workflow and audit logs for your authored content</p>
              </div>
              <button
                onClick={() => setShowActivityModal(false)}
                className="p-1.5 rounded-full hover:bg-[#f6f6f4] text-[#5c5c5c] hover:text-[#141414] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto divide-y divide-[rgba(17,17,17,0.08)] space-y-3">
              {allMappedActivities.length === 0 ? (
                <p className="text-sm text-[#8c8c8c] italic py-8 text-center">No activity records found.</p>
              ) : (
                allMappedActivities.map((act) => (
                  <div key={act.id} className="pt-3 first:pt-0 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div
                        className={`w-[34px] h-[34px] rounded-[8px] ${
                          act.iconVariant === "clay"
                            ? "bg-[#efd3c7] text-[#8f3a20]"
                            : act.iconVariant === "sage"
                              ? "bg-[#dce5d3] text-[#446038]"
                              : "bg-[#f6f6f4] text-[#5c5c5c]"
                        } flex items-center justify-center shrink-0 mt-0.5`}
                      >
                        {act.iconType === "alert" ? (
                          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                          </svg>
                        ) : act.iconType === "clock" ? (
                          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                        ) : act.iconType === "check" ? (
                          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                          </svg>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[14px] text-[#3a3a3a] leading-[1.45]">
                          {act.leadText && <span>{act.leadText}</span>}
                          {act.entityName ? (
                            <strong className="font-semibold text-[#141414]">{act.entityName}</strong>
                          ) : !act.leadText && !act.trailText ? (
                            <span>{act.text || act.detail || act.title}</span>
                          ) : null}
                          {act.trailText && <span>{act.trailText}</span>}
                        </div>
                        <div className="text-[12px] text-[#5c5c5c] mt-0.5">{act.time}</div>
                      </div>
                    </div>
                    {act.entityId && (
                      <button
                        onClick={() => {
                          setShowActivityModal(false);
                          navigate(`/content-developer/course-overview/${act.entityType}/${act.entityId}`);
                        }}
                        className="shrink-0 text-[12px] font-semibold text-[#b8654e] hover:text-[#8f3a20] transition-colors flex items-center gap-1 cursor-pointer bg-transparent border-none p-0"
                      >
                        Open <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
            <div className="px-6 py-3 border-t border-[rgba(17,17,17,0.1)] bg-[#f6f6f4]/50 flex justify-end">
              <button
                onClick={() => setShowActivityModal(false)}
                className="px-4 py-1.5 rounded-full border border-[rgba(17,17,17,0.16)] bg-white hover:bg-[#f6f6f4] text-[13px] font-semibold text-[#141414] transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Pending Actions Modal */}
      {showPendingModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[16px] border border-[rgba(17,17,17,0.1)] shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-[rgba(17,17,17,0.1)] flex items-center justify-between">
              <div>
                <h3 className="text-[18px] font-bold text-[#141414]">Pending Your Action ({totalPendingActionCount})</h3>
                <p className="text-[13px] text-[#5c5c5c]">Items requiring your revision or drafts ready to edit and submit</p>
              </div>
              <button
                onClick={() => setShowPendingModal(false)}
                className="p-1.5 rounded-full hover:bg-[#f6f6f4] text-[#5c5c5c] hover:text-[#141414] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto divide-y divide-[rgba(17,17,17,0.1)]">
              {allPendingActions.length === 0 ? (
                <p className="text-sm text-[#8c8c8c] italic py-8 text-center">No pending actions required.</p>
              ) : (
                allPendingActions.map((item) => (
                  <PendingActionCard key={item.id} item={item} />
                ))
              )}
            </div>
            <div className="px-6 py-3 border-t border-[rgba(17,17,17,0.1)] bg-[#f6f6f4]/50 flex items-center justify-between">
              <button
                onClick={() => {
                  setShowPendingModal(false);
                  setActiveTab("draft");
                  setFilter("selectedStatus", "changes");
                  const el = document.getElementById("my-content-section");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="text-[13px] font-semibold text-[#b8654e] hover:underline cursor-pointer bg-transparent border-none p-0"
              >
                Filter table to pending items &rarr;
              </button>
              <button
                onClick={() => setShowPendingModal(false)}
                className="px-4 py-1.5 rounded-full border border-[rgba(17,17,17,0.16)] bg-white hover:bg-[#f6f6f4] text-[13px] font-semibold text-[#141414] transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Detailed Published Content Modal */}
      {showPublishedModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[16px] border border-[rgba(17,17,17,0.1)] shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[rgba(17,17,17,0.1)] flex items-center justify-between">
              <div>
                <h3 className="text-[18px] font-bold text-[#141414]">
                  All Published Content ({publishedCourses.length})
                </h3>
                <p className="text-[13px] text-[#5c5c5c]">
                  All published courses, career paths, and standalone lessons authored by you
                </p>
              </div>
              <button
                onClick={() => {
                  setShowPublishedModal(false);
                  if (location.pathname === "/studio/published") {
                    navigate("/studio", { replace: true });
                  }
                }}
                className="p-1.5 rounded-full hover:bg-[#f6f6f4] text-[#5c5c5c] hover:text-[#141414] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="px-6 py-3 border-b border-[rgba(17,17,17,0.08)] bg-[#fdfdfd] flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setPublishedTypeFilter("all")}
                  className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-all cursor-pointer whitespace-nowrap border ${
                    publishedTypeFilter === "all"
                      ? "bg-[#141414] text-white border-[#141414]"
                      : "bg-white text-[#5c5c5c] border-[rgba(17,17,17,0.16)] hover:border-[rgba(17,17,17,0.3)]"
                  }`}
                >
                  All ({publishedCourses.length})
                </button>
                <button
                  onClick={() => setPublishedTypeFilter("course")}
                  className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-all cursor-pointer whitespace-nowrap border ${
                    publishedTypeFilter === "course"
                      ? "bg-[#141414] text-white border-[#141414]"
                      : "bg-white text-[#5c5c5c] border-[rgba(17,17,17,0.16)] hover:border-[rgba(17,17,17,0.3)]"
                  }`}
                >
                  Courses ({publishedCourses.filter((c) => c.type === "Standalone Course").length})
                </button>
                <button
                  onClick={() => setPublishedTypeFilter("career-path")}
                  className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-all cursor-pointer whitespace-nowrap border ${
                    publishedTypeFilter === "career-path"
                      ? "bg-[#141414] text-white border-[#141414]"
                      : "bg-white text-[#5c5c5c] border-[rgba(17,17,17,0.16)] hover:border-[rgba(17,17,17,0.3)]"
                  }`}
                >
                  Career Paths ({publishedCourses.filter((c) => c.type === "Career Path").length})
                </button>
                <button
                  onClick={() => setPublishedTypeFilter("lesson")}
                  className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-all cursor-pointer whitespace-nowrap border ${
                    publishedTypeFilter === "lesson"
                      ? "bg-[#141414] text-white border-[#141414]"
                      : "bg-white text-[#5c5c5c] border-[rgba(17,17,17,0.16)] hover:border-[rgba(17,17,17,0.3)]"
                  }`}
                >
                  Lessons ({publishedCourses.filter((c) => c.type === "Standalone Lesson").length})
                </button>
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8c8c8c]" />
                <input
                  type="text"
                  placeholder="Search published..."
                  value={publishedSearch}
                  onChange={(e) => setPublishedSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-[13px] bg-white border border-[rgba(17,17,17,0.16)] rounded-full focus:outline-none focus:border-[#141414] transition-colors shadow-2xs"
                />
              </div>
            </div>

            {/* List of Published Items */}
            <div className="p-6 overflow-y-auto space-y-3 divide-y divide-[rgba(17,17,17,0.06)]">
              {filteredPublishedModalItems.length === 0 ? (
                <div className="py-12 text-center">
                  <BookOpen className="w-8 h-8 text-[#8c8c8c] mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-semibold text-[#141414]">No published content found</p>
                  <p className="text-xs text-[#8c8c8c] mt-0.5">
                    {publishedSearch ? "Try clearing your search query" : "You have not published any content yet"}
                  </p>
                </div>
              ) : (
                filteredPublishedModalItems.map((item) => {
                  const entityType =
                    item.type === "Career Path"
                      ? "career-path"
                      : item.type === "Standalone Lesson"
                        ? "lesson"
                        : "course";

                  return (
                    <div
                      key={item.id}
                      className="pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-[10px] bg-[#dce5d3] text-[#446038] flex items-center justify-center shrink-0 mt-0.5 overflow-hidden">
                          {item.thumbnailUrl ? (
                            <img
                              src={item.thumbnailUrl}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <BookOpen className="w-5 h-5" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-[#141414] text-[15px] truncate max-w-md">
                              {item.name}
                            </h4>
                            <span className="text-[11px] font-semibold text-[#446038] bg-[#dce5d3] px-2 py-0.5 rounded-full border border-[#bfcfb4]">
                              {item.type}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[12px] text-[#5c5c5c] font-normal mt-1 flex-wrap">
                            <span>
                              {item.durationMinutes ? `${item.durationMinutes} min` : getCategoryLabel(item)}
                            </span>
                            <span>·</span>
                            <span>
                              {item.enrollmentCount !== undefined && item.enrollmentCount > 0
                                ? `${item.enrollmentCount} learner${item.enrollmentCount !== 1 ? "s" : ""}`
                                : "0 learners"}
                            </span>
                            {item.rating && item.rating > 0 && (
                              <>
                                <span>·</span>
                                <span className="flex items-center gap-1 font-bold text-[#141414]">
                                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                                  {item.rating.toFixed(1)}
                                </span>
                              </>
                            )}
                            <span>·</span>
                            <span className="text-[#8c8c8c]">Edited {item.lastEdited}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => {
                            setShareItem({ id: item.id, title: item.name, thumbnailUrl: item.thumbnailUrl, type: item.type });
                          }}
                          className="w-8 h-8 rounded-full border border-[rgba(17,17,17,0.1)] hover:bg-[#f6f6f4] hover:border-[rgba(17,17,17,0.2)] text-[#5c5c5c] hover:text-[#141414] flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                          title="Share"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setShowPublishedModal(false);
                            navigate(`/content-developer/course-preview/${entityType}/${item.id}`);
                          }}
                          className="px-3 py-1.5 rounded-full border border-[rgba(17,17,17,0.16)] bg-white hover:bg-[#f6f6f4] text-[12px] font-semibold text-[#141414] transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Preview
                        </button>
                        <button
                          onClick={() => {
                            setShowPublishedModal(false);
                            navigate(`/content-developer/course-overview/${entityType}/${item.id}`);
                          }}
                          className="px-3.5 py-1.5 rounded-full bg-[#141414] hover:bg-black text-white text-[12px] font-semibold transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                        >
                          Overview <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-[rgba(17,17,17,0.1)] bg-[#f6f6f4]/50 flex items-center justify-between">
              <button
                onClick={() => {
                  setShowPublishedModal(false);
                  setActiveTab("published");
                  setFilter("selectedStatus", "published");
                  if (location.pathname === "/studio/published") {
                    navigate("/studio", { replace: true });
                  }
                  const el = document.getElementById("my-content-section");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="text-[13px] font-semibold text-[#446038] hover:underline cursor-pointer bg-transparent border-none p-0"
              >
                Filter main table to published content &rarr;
              </button>
              <button
                onClick={() => {
                  setShowPublishedModal(false);
                  if (location.pathname === "/studio/published") {
                    navigate("/studio", { replace: true });
                  }
                }}
                className="px-4 py-1.5 rounded-full border border-[rgba(17,17,17,0.16)] bg-white hover:bg-[#f6f6f4] text-[13px] font-semibold text-[#141414] transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal Popup */}
      <ShareModal
        isOpen={!!shareItem}
        onClose={() => setShareItem(null)}
        content={shareItem}
      />
    </div>
  );
};

export default ContentDeveloperDashboard;
