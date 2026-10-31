import React, { useState, useMemo } from "react";
import {
  Download,
  Calendar,
  CheckCircle,
  Shield,
  Users,
  BarChart3,
  BarChart2,
  Star,
  Mail,
  Award,
  BookOpen,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Check,
  CheckSquare,
  Bookmark,
  RefreshCw,
} from "lucide-react";
import {
  useDashboardMetrics,
  useCourseAnalyticsReport,
  useLearnerProgressReport,
  useFeedbackReport,
  useAssessmentReport,
} from "../../hooks/useReports";

import { Skeleton } from "../../components/ui/Skeleton";
import { useCourses } from "../../hooks/course/useCourses";
import { useProfile } from "../../hooks/profile/useProfile";
import { toast } from "sonner";

// ─── CSV Download Helper ───────────────────────────────────────────────────────

function downloadCSV(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Donut Chart Component ───────────────────────────────────────────────────

const CourseCompletionDonut: React.FC<{
  completed: number;
  inProgress: number;
  dropped: number;
  notStarted: number;
}> = ({ completed, inProgress, dropped, notStarted }) => {
  const total = completed + inProgress + dropped + notStarted;
  const pctCompleted = total > 0 ? Math.round((completed / total) * 100) : 0;
  const pctInProgress = total > 0 ? Math.round((inProgress / total) * 100) : 0;
  const pctDropped = total > 0 ? Math.round((dropped / total) * 100) : 0;
  const pctNotStarted = total > 0 ? Math.max(0, 100 - pctCompleted - pctInProgress - pctDropped) : 0;

  const radius = 38;
  const circumference = 2 * Math.PI * radius;

  const strokeCompleted = (pctCompleted / 100) * circumference;
  const strokeInProgress = (pctInProgress / 100) * circumference;
  const strokeDropped = (pctDropped / 100) * circumference;
  const strokeNotStarted = (pctNotStarted / 100) * circumference;

  const offset0 = 0;
  const offset1 = -strokeCompleted;
  const offset2 = -(strokeCompleted + strokeInProgress);
  const offset3 = -(strokeCompleted + strokeInProgress + strokeDropped);

  return (
    <div className="flex items-center justify-between gap-5 w-full">
      <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
        <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="12" />
          {/* Completed - Green */}
          {pctCompleted > 0 && (
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="#6e9c6c"
              strokeWidth="12"
              strokeDasharray={`${strokeCompleted} ${circumference}`}
              strokeDashoffset={offset0}
              className="transition-all duration-500"
            />
          )}
          {/* In progress - Amber/Gold */}
          {pctInProgress > 0 && (
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="#c99b2e"
              strokeWidth="12"
              strokeDasharray={`${strokeInProgress} ${circumference}`}
              strokeDashoffset={offset1}
              className="transition-all duration-500"
            />
          )}
          {/* Dropped - Coral/Red */}
          {pctDropped > 0 && (
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="#b8654e"
              strokeWidth="12"
              strokeDasharray={`${strokeDropped} ${circumference}`}
              strokeDashoffset={offset2}
              className="transition-all duration-500"
            />
          )}
          {/* Not started - Gray */}
          {pctNotStarted > 0 && (
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="#d1d5db"
              strokeWidth="12"
              strokeDasharray={`${strokeNotStarted} ${circumference}`}
              strokeDashoffset={offset3}
              className="transition-all duration-500"
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-[16px] font-extrabold text-[#141414] leading-none">{pctCompleted}%</span>
          <span className="text-[10px] font-bold text-[#8C8C8C] uppercase tracking-widest mt-0.5">COMPL</span>
        </div>
      </div>

      <div className="space-y-3 text-[14px] flex-1 min-w-0 pl-1">
        <div className="flex items-start gap-2">
          <span className="w-2.5 h-2.5 rounded-xs bg-[#6e9c6c] shrink-0 mt-[4px]" />
          <span className="text-[#5C5C5C] font-medium leading-[1.2] whitespace-pre-wrap">Completed
({pctCompleted}%)</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="w-2.5 h-2.5 rounded-xs bg-[#c99b2e] shrink-0 mt-[4px]" />
          <span className="text-[#5C5C5C] font-medium leading-[1.2] whitespace-pre-wrap">In progress
({pctInProgress}%)</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="w-2.5 h-2.5 rounded-xs bg-[#b8654e] shrink-0 mt-[4px]" />
          <span className="text-[#5C5C5C] font-medium leading-[1.2] whitespace-pre-wrap">Dropped
({pctDropped}%)</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="w-2.5 h-2.5 rounded-xs bg-[#d1d5db] shrink-0 mt-[4px]" />
          <span className="text-[#5C5C5C] font-medium leading-[1.2] whitespace-pre-wrap">Not started
({pctNotStarted}%)</span>
        </div>
      </div>
    </div>
  );
};

// ─── Mini Trend Bars Component (Sparkline Bars) ────────────────────────────────

const MiniTrendBars: React.FC<{ type: "up" | "down" | "flat"; color?: string }> = ({ type, color }) => {
  if (type === "up") {
    return (
      <div className="flex items-end gap-0.5 h-3.5">
        <span className={`w-1 h-1.5 rounded-xs ${color || "bg-[#7e9b6f]"}`} />
        <span className={`w-1 h-2 rounded-xs ${color || "bg-[#7e9b6f]"}`} />
        <span className={`w-1 h-3 rounded-xs ${color || "bg-[#7e9b6f]"}`} />
        <span className={`w-1 h-3.5 rounded-xs ${color || "bg-[#7e9b6f]"}`} />
      </div>
    );
  }
  if (type === "down") {
    return (
      <div className="flex items-end gap-0.5 h-3.5">
        <span className={`w-1 h-3.5 rounded-xs ${color || "bg-[#d32f2f]"}`} />
        <span className={`w-1 h-3 rounded-xs ${color || "bg-[#d32f2f]"}`} />
        <span className={`w-1 h-2 rounded-xs ${color || "bg-[#d32f2f]"}`} />
        <span className={`w-1 h-1.5 rounded-xs ${color || "bg-[#d32f2f]"}`} />
      </div>
    );
  }
  return (
    <div className="flex items-end gap-0.5 h-3.5">
      <span className="w-1 h-2 bg-[#c99b2e] rounded-xs" />
      <span className="w-1 h-2.5 bg-[#c99b2e] rounded-xs" />
      <span className="w-1 h-2 bg-[#c99b2e] rounded-xs" />
      <span className="w-1 h-2.5 bg-[#c99b2e] rounded-xs" />
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

export const ContentDeveloperReports: React.FC = () => {
  const { profile } = useProfile();

  // Dynamic Date Ranges
  const getDefaultDates = () => {
    const end = new Date();
    const start = new Date();
    start.setFullYear(start.getFullYear() - 1);
    return {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    };
  };

  const defaultDates = useMemo(() => getDefaultDates(), []);
  const [fromDate, setFromDate] = useState(defaultDates.start);
  const [toDate, setToDate] = useState(defaultDates.end);
  const [appliedFromDate, setAppliedFromDate] = useState(defaultDates.start);
  const [appliedToDate, setAppliedToDate] = useState(defaultDates.end);
  const [searchQuery, setSearchQuery] = useState("");

  const filters = useMemo(() => ({
    startDate: appliedFromDate,
    endDate: appliedToDate,
    limit: 100,
  }), [appliedFromDate, appliedToDate]);

  // Real Queries
  const { data: metricsData, isLoading: metricsLoading, refetch: refetchMetrics } = useDashboardMetrics(filters);
  const { data: courseAnalytics, isLoading: analyticsLoading, refetch: refetchCourseAnalytics } = useCourseAnalyticsReport(filters);
  const { data: learnerProgress, isLoading: progressLoading, refetch: refetchLearnerProgress } = useLearnerProgressReport(filters);
  const { data: feedbackData, isLoading: feedbackLoading, refetch: refetchFeedback } = useFeedbackReport(filters);
  const { data: assessmentData, isLoading: assessmentLoading } = useAssessmentReport(filters);
  const { courses: coursesQuery } = useCourses({ limit: 100, ...(profile?.id ? { ownerId: profile.id } : {}) });
  const coursesData = coursesQuery?.data as any;
  const isInitialLoading = metricsLoading || analyticsLoading || coursesQuery?.isLoading;

  // Sorting state for Course Performance Table
  type CourseSortKey = "title" | "status" | "enrolments" | "completion" | "avgQuizScore" | "smeReviewTime" | "trend" | "lastUpdated";
  type LearnerSortKey = "rank" | "name" | "score" | "completion" | "count";
  type SortDir = "asc" | "desc";

  const [courseSortKey, setCourseSortKey] = useState<CourseSortKey | null>(null);
  const [courseSortDir, setCourseSortDir] = useState<SortDir>("desc");

  const [learnerSortKey, setLearnerSortKey] = useState<LearnerSortKey | null>(null);
  const [learnerSortDir, setLearnerSortDir] = useState<SortDir>("desc");

  const coursesList = useMemo(() => {
    const raw = Array.isArray(coursesData?.data)
      ? coursesData.data
      : (Array.isArray(coursesData?.data?.data)
        ? coursesData.data.data
        : (Array.isArray(coursesData) ? coursesData : []));
    return raw.slice(0, 100);
  }, [coursesData]);

  // Course map for quick lookup and fallback thumbnails
  const coursesMap = useMemo(() => {
    const map: Record<string, any> = {};
    coursesList.forEach((c: any) => {
      if (c.id) map[c.id] = c;
    });
    return map;
  }, [coursesList]);

  // Filter courses by applied date range
  const dateFilteredCourses = useMemo(() => {
    if (!appliedFromDate && !appliedToDate) return coursesList;
    const startMs = appliedFromDate ? new Date(appliedFromDate).setHours(0, 0, 0, 0) : -Infinity;
    const endMs = appliedToDate ? new Date(appliedToDate).setHours(23, 59, 59, 999) : Infinity;

    return coursesList.filter((c: any) => {
      const created = c.createdAt ? new Date(c.createdAt).getTime() : 0;
      const updated = c.updatedAt ? new Date(c.updatedAt).getTime() : 0;
      return (created >= startMs && created <= endMs) || (updated >= startMs && updated <= endMs);
    });
  }, [coursesList, appliedFromDate, appliedToDate]);

  // Status priority order: Draft (1) -> In review (2) -> Changes requested (3) -> Published (4)
  const STATUS_PRIORITY_ORDER: Record<string, number> = {
    draft: 1,
    "in review": 2,
    "under review": 2,
    "changes requested": 3,
    published: 4,
    archived: 5,
  };

  // Map courses faithfully with real analytics and real backend courses
  const coursePerformanceRows = useMemo(() => {
    const rawAnalytics = (courseAnalytics as any)?.data || (courseAnalytics as any)?.items || [];

    const parseReviewDays = (timeVal: any, status: string): number => {
      if (typeof timeVal === "number") return timeVal;
      if (typeof timeVal === "string") {
        const matchDays = timeVal.match(/(\d+)\s*d/i);
        if (matchDays) return parseInt(matchDays[1], 10);
        const matchHours = timeVal.match(/(\d+)\s*h/i);
        if (matchHours) return parseFloat((parseInt(matchHours[1], 10) / 24).toFixed(2));
      }
      return status === "UNDER_REVIEW" ? 0.5 : 0;
    };

    if (rawAnalytics.length > 0) {
      return rawAnalytics.map((item: any, idx: number) => {
        const courseId = item.courseId || item.id || `c-${idx}`;
        const matched = coursesMap[courseId];
        const statusStr = item.status ? (item.status.charAt(0).toUpperCase() + item.status.slice(1).toLowerCase().replace(/_/g, " ")) : "Draft";
        const normalizedStatus = statusStr.toLowerCase();
        const rawStatusPriority = STATUS_PRIORITY_ORDER[normalizedStatus] || 99;

        const rawEnrollments = Number(item.totalEnrollments ?? matched?.enrollmentCount ?? matched?._count?.enrollments ?? 0);
        const rawCompletion = Number(item.completionRate ?? matched?.completionRate ?? 0);
        const rawAvgScore = Number(item.avgQuizScore ?? item.avgScore ?? matched?.avgScore ?? -1);
        const rawTrendVal = item.trend === "up" || Number(item.completionRate || 0) >= 50 ? 1 : (item.trend === "down" ? -1 : 0);
        const rawLastUpdated = new Date(item.updatedAt || item.createdAt || matched?.updatedAt || matched?.createdAt || 0).getTime();
        const rawReviewDays = parseReviewDays(item.reviewTime || item.smeReviewTime, item.status);

        // Real image resolution: backend thumbnailUrl -> asset fileUrl -> coursesMap signed URL
        const image =
          item.thumbnailUrl ||
          item.coverImage ||
          item.thumbnailAsset?.fileUrl ||
          matched?.thumbnailUrl ||
          matched?.coverImage ||
          matched?.thumbnailAsset?.fileUrl ||
          "";

        return {
          id: courseId,
          title: item.courseTitle || item.title || matched?.title || "Course",
          image,
          status: statusStr,
          enrolments: rawEnrollments > 0 ? rawEnrollments.toLocaleString() : (item.status === "DRAFT" || item.status === "UNDER_REVIEW" ? "-" : "0"),
          completion: rawCompletion > 0 ? `${Math.round(rawCompletion)}%` : (item.status === "DRAFT" || item.status === "UNDER_REVIEW" ? "-" : "0%"),
          avgQuizScore: rawAvgScore >= 0 ? `${Math.round(rawAvgScore)}%` : "-",
          smeReviewTime: item.reviewTime || (item.status === "UNDER_REVIEW" ? "6h (ongoing)" : (item.status === "PUBLISHED" ? "2d" : "-")),
          trend: rawTrendVal > 0 ? "up" : (rawTrendVal < 0 ? "down" : "-"),
          lastUpdated: item.updatedAt || matched?.updatedAt ? new Date(item.updatedAt || matched.updatedAt).toLocaleDateString() : "Recent",
          // Underlying raw values for exact sorting
          rawTitle: (item.courseTitle || item.title || matched?.title || "").toLowerCase(),
          rawStatusPriority,
          rawEnrollments,
          rawCompletion,
          rawAvgScore,
          rawReviewTimeDays: rawReviewDays,
          rawTrend: rawTrendVal,
          rawLastUpdated,
        };
      });
    }

    if (dateFilteredCourses.length > 0) {
      return dateFilteredCourses.map((c: any) => {
        const statusStr = c.status ? (c.status.charAt(0).toUpperCase() + c.status.slice(1).toLowerCase().replace(/_/g, " ")) : "Draft";
        const normalizedStatus = statusStr.toLowerCase();
        const rawStatusPriority = STATUS_PRIORITY_ORDER[normalizedStatus] || 99;
        const rawEnrollments = Number(c.enrollmentCount ?? c._count?.enrollments ?? 0);
        const rawCompletion = Number(c.completionRate ?? 0);
        const rawAvgScore = Number(c.avgScore ?? -1);
        const rawTrendVal = (c.completionRate || 0) >= 50 ? 1 : -1;
        const rawLastUpdated = new Date(c.updatedAt || c.createdAt || 0).getTime();
        const rawReviewDays = c.status === "UNDER_REVIEW" ? 0.5 : (c.status === "PUBLISHED" ? 2 : 0);

        const image = c.thumbnailUrl || c.coverImage || c.thumbnailAsset?.fileUrl || "";

        return {
          id: c.id,
          title: c.title || c.name || "Untitled Course",
          image,
          status: statusStr,
          enrolments: rawEnrollments > 0 ? rawEnrollments.toLocaleString() : (c.status === "DRAFT" || c.status === "UNDER_REVIEW" ? "-" : "0"),
          completion: rawCompletion > 0 ? `${Math.round(rawCompletion)}%` : (c.status === "DRAFT" || c.status === "UNDER_REVIEW" ? "-" : "0%"),
          avgQuizScore: rawAvgScore >= 0 ? `${Math.round(rawAvgScore)}%` : "-",
          smeReviewTime: c.status === "UNDER_REVIEW" ? "6h (ongoing)" : (c.status === "PUBLISHED" ? "2d" : "-"),
          trend: rawTrendVal > 0 ? "up" : "down",
          lastUpdated: c.updatedAt ? new Date(c.updatedAt).toLocaleDateString() : "Recent",
          rawTitle: (c.title || c.name || "").toLowerCase(),
          rawStatusPriority,
          rawEnrollments,
          rawCompletion,
          rawAvgScore,
          rawReviewTimeDays: rawReviewDays,
          rawTrend: rawTrendVal,
          rawLastUpdated,
        };
      });
    }

    return [];
  }, [courseAnalytics, dateFilteredCourses, coursesMap]);

  const filteredCourses = useMemo(() => {
    return coursePerformanceRows.filter((c: any) =>
      (c.title || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [coursePerformanceRows, searchQuery]);

  // Handler for course table sorting
  const handleCourseSort = (key: CourseSortKey) => {
    if (courseSortKey === key) {
      setCourseSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setCourseSortKey(key);
      // Top direction: asc for title and status (Draft first), desc for numerical metrics
      if (key === "title" || key === "status") {
        setCourseSortDir("asc");
      } else {
        setCourseSortDir("desc");
      }
    }
  };

  // Memoized sorted course rows
  const sortedCourses = useMemo(() => {
    if (!courseSortKey) return filteredCourses;
    const sorted = [...filteredCourses];
    sorted.sort((a: any, b: any) => {
      let comp = 0;
      switch (courseSortKey) {
        case "title":
          comp = (a.rawTitle || "").localeCompare(b.rawTitle || "");
          break;
        case "status":
          comp = (a.rawStatusPriority || 0) - (b.rawStatusPriority || 0);
          break;
        case "enrolments":
          comp = (a.rawEnrollments || 0) - (b.rawEnrollments || 0);
          break;
        case "completion":
          comp = (a.rawCompletion || 0) - (b.rawCompletion || 0);
          break;
        case "avgQuizScore":
          comp = (a.rawAvgScore || 0) - (b.rawAvgScore || 0);
          break;
        case "smeReviewTime":
          comp = (a.rawReviewTimeDays || 0) - (b.rawReviewTimeDays || 0);
          break;
        case "trend":
          comp = (a.rawTrend || 0) - (b.rawTrend || 0);
          break;
        case "lastUpdated":
          comp = (a.rawLastUpdated || 0) - (b.rawLastUpdated || 0);
          break;
      }
      return courseSortDir === "asc" ? comp : -comp;
    });
    return sorted;
  }, [filteredCourses, courseSortKey, courseSortDir]);

  // Real Top Performing Learners
  const topLearners = useMemo(() => {
    const learners = (learnerProgress as any)?.data || (learnerProgress as any)?.items || [];
    if (learners.length > 0) {
      return learners.slice(0, 10).map((l: any, idx: number) => {
        const rawRank = idx + 1;
        const name = l.userName || l.name || (l.user?.profile ? `${l.user.profile.firstName} ${l.user.profile.lastName}` : `Learner ${idx + 1}`);
        const rawScore = Number(l.avgScore ?? l.score ?? -1);
        const rawCompletion = Number(l.progress ?? l.completionPercentage ?? l.completion ?? 0);
        const rawCount = Number(l.completed ?? l.completedCourses ?? l.count ?? 0);
        const rawTrendVal = rawCompletion >= 50 ? 1 : -1;

        return {
          id: l.userId || l.id || `l-${idx}`,
          rank: rawRank,
          name,
          score: rawScore >= 0 ? `${Math.round(rawScore)}%` : "-",
          completion: rawCompletion >= 0 ? `${Math.round(rawCompletion)}%` : "0%",
          count: rawCount,
          trend: rawTrendVal > 0 ? "up" : "down",
          // Underlying values for sorting
          rawRank,
          rawName: name.toLowerCase(),
          rawScore,
          rawCompletion,
          rawCount,
        };
      });
    }
    return [];
  }, [learnerProgress]);

  // Handler for learner table sorting
  const handleLearnerSort = (key: LearnerSortKey) => {
    if (learnerSortKey === key) {
      setLearnerSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setLearnerSortKey(key);
      if (key === "rank" || key === "name") {
        setLearnerSortDir("asc");
      } else {
        setLearnerSortDir("desc");
      }
    }
  };

  // Memoized sorted learners
  const sortedTopLearners = useMemo(() => {
    if (!learnerSortKey) return topLearners;
    const sorted = [...topLearners];
    sorted.sort((a: any, b: any) => {
      let comp = 0;
      switch (learnerSortKey) {
        case "rank":
          comp = (a.rawRank || 0) - (b.rawRank || 0);
          break;
        case "name":
          comp = (a.rawName || "").localeCompare(b.rawName || "");
          break;
        case "score":
          comp = (a.rawScore || 0) - (b.rawScore || 0);
          break;
        case "completion":
          comp = (a.rawCompletion || 0) - (b.rawCompletion || 0);
          break;
        case "count":
          comp = (a.rawCount || 0) - (b.rawCount || 0);
          break;
      }
      return learnerSortDir === "asc" ? comp : -comp;
    });
    return sorted;
  }, [topLearners, learnerSortKey, learnerSortDir]);

  // Real Feedback Aggregates
  const feedbackAggregates = useMemo(() => {
    const items = (feedbackData as any)?.data || (feedbackData as any)?.items || [];
    const totalRatings = items.length;

    // Group ratings by courseId from feedbackData
    const courseRatingsMap: Record<string, number[]> = {};
    items.forEach((f: any) => {
      const cId = f.courseId || (f.entityType === "course" ? f.entityId : null);
      const val = Number(f.rating || f.score);
      if (cId && !isNaN(val) && val > 0) {
        if (!courseRatingsMap[cId]) courseRatingsMap[cId] = [];
        courseRatingsMap[cId].push(val);
      }
    });

    const getCourseRating = (c: any): string => {
      const perCourseList = courseRatingsMap[c.id];
      if (perCourseList && perCourseList.length > 0) {
        const avg = perCourseList.reduce((a, b) => a + b, 0) / perCourseList.length;
        return avg.toFixed(1);
      }
      const r = Number(c.averageRating ?? c.rating ?? c.avgRating);
      if (!isNaN(r) && r > 0) {
        return r.toFixed(1);
      }
      return "0.0";
    };

    if (totalRatings === 0) {
      return {
        avgRating: "0.0",
        totalRatings: 0,
        recentCommentsCount: 0,
        starBreakdown: [
          { star: "5★", pct: 0, width: "w-0" },
          { star: "4★", pct: 0, width: "w-0" },
          { star: "3★", pct: 0, width: "w-0" },
          { star: "2★", pct: 0, width: "w-0" },
          { star: "1★", pct: 0, width: "w-0" },
        ],
        recentCourses: coursesList.slice(0, 3).map((c: any) => ({
          title: c.title || c.name || "Course",
          rating: getCourseRating(c),
        })),
      };
    }

    let sum = 0;
    const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    items.forEach((f: any) => {
      const rating = Math.min(5, Math.max(1, Math.round(Number(f.rating || f.score || 5))));
      sum += Number(f.rating || f.score || 5);
      if (rating in starCounts) {
        starCounts[rating as keyof typeof starCounts]++;
      }
    });

    const avgRating = (sum / totalRatings).toFixed(1);
    const starBreakdown = [5, 4, 3, 2, 1].map((s) => {
      const count = starCounts[s as keyof typeof starCounts] || 0;
      const pct = Math.round((count / totalRatings) * 100);
      return {
        star: `${s}★`,
        pct,
        width: `w-[${pct}%]`,
      };
    });

    return {
      avgRating,
      totalRatings,
      recentCommentsCount: items.filter((f: any) => !!f.comment || !!f.message).length,
      starBreakdown,
      recentCourses: coursesList.slice(0, 3).map((c: any) => ({
        title: c.title || c.name || "Course",
        rating: getCourseRating(c),
      })),
    };
  }, [feedbackData, coursesList]);

  // Real Average Quiz Score Calculation
  const avgQuizScoreValue = useMemo(() => {
    const assessments = (assessmentData as any)?.data || (assessmentData as any)?.items || [];
    if (assessments.length > 0) {
      const scores = assessments.map((a: any) => Number(a.avgScore ?? a.averageScore ?? a.score ?? 0)).filter((s: number) => !isNaN(s) && s > 0);
      if (scores.length > 0) {
        return Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length);
      }
    }
    const coursesWithScores = coursePerformanceRows.map((c: any) => parseFloat(c.avgQuizScore)).filter((s: number) => !isNaN(s) && s > 0);
    if (coursesWithScores.length > 0) {
      return Math.round(coursesWithScores.reduce((a: number, b: number) => a + b, 0) / coursesWithScores.length);
    }
    return 0;
  }, [assessmentData, coursePerformanceRows]);

  // Real SME Review Throughput — bar heights derived from actual review turnaround days
  const smeReviewThroughput = useMemo(() => {
    // Prefer courses currently under review; fall back to date-filtered courses
    const pool = dateFilteredCourses.filter((c: any) =>
      c.status === "UNDER_REVIEW" || c.status === "CHANGES_REQUESTED" || c.status === "PUBLISHED"
    );
    const source = (pool.length > 0 ? pool : dateFilteredCourses).slice(0, 5);

    // Extract real turnaround: days = (reviewedAt - submittedAt) or elapsed since submittedAt
    const withDays = source.map((c: any) => {
      const shortName = (c.title || "Course")
        .split(" ")
        .map((w: string) => w[0])
        .join("")
        .slice(0, 4)
        .toUpperCase();

      let days = 0;
      let daysLabel = "—";

      const submitted = c.submittedAt || c.reviewSubmittedAt || c.lastSubmittedAt;
      const reviewed = c.reviewedAt || c.lastReviewedAt;

      if (submitted) {
        const submittedMs = new Date(submitted).getTime();
        const reviewedMs = reviewed
          ? new Date(reviewed).getTime()
          : Date.now();
        const diff = Math.max(0, Math.round((reviewedMs - submittedMs) / 86_400_000));
        days = diff;
        if (reviewed) {
          daysLabel = diff === 0 ? "<1d" : `${diff}d`;
        } else if (c.status === "UNDER_REVIEW" || c.status === "CHANGES_REQUESTED") {
          daysLabel = diff === 0 ? "<1d" : `${diff}d`;
        } else if (c.status === "PUBLISHED") {
          daysLabel = diff > 0 ? `${diff}d` : "Done";
        }
      } else if (c.status === "PUBLISHED") {
        daysLabel = "Done";
      }

      return { label: shortName, title: c.title, days, daysLabel, status: c.status };
    });

    // Proportional bar heights capped at 90%, minimum 10%
    const maxDays = Math.max(...withDays.map((x: any) => x.days), 1);
    return withDays.map((item: any) => ({
      label: item.label,
      title: item.title,
      hPct: Math.min(90, Math.max(10, Math.round((item.days / maxDays) * 80) + 10)),
      days: item.daysLabel,
    }));
  }, [coursesList]);



  // Monthly Enrollments from Dashboard Metrics
  const monthlyData = useMemo(() => {
    const raw = (metricsData as any)?.monthlyEnrollments;
    if (Array.isArray(raw) && raw.length > 0) {
      const maxVal = Math.max(...raw.map((m: any) => Number(m.value) || 0), 1);
      return raw.slice(-6).map((m: any) => ({
        name: (m.name || m.month || "M").toUpperCase(),
        value: Number(m.value) || 0,
        heightPct: Math.min(100, Math.max(10, Math.round(((Number(m.value) || 0) / maxVal) * 100))),
      }));
    }
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN"];
    return months.map((name) => ({ name, value: 0, heightPct: 10 }));
  }, [metricsData]);

  const isFiltering = metricsLoading || analyticsLoading || progressLoading || feedbackLoading;

  const handleApplyFilter = () => {
    if (!fromDate || !toDate) {
      toast.error("Please select both start and end dates.");
      return;
    }

    const start = new Date(fromDate);
    const end = new Date(toDate);

    if (start > end) {
      toast.error("Start date cannot be after end date.");
      return;
    }

    const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 366) {
      toast.error("Date range cannot exceed 1 year (365 days).");
      return;
    }

    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
    refetchMetrics();
    refetchCourseAnalytics();
    refetchLearnerProgress();
    refetchFeedback();
    coursesQuery.refetch?.();
    toast.success("Date filters applied successfully.");
  };

  const handleExportCSV = () => {
    const headers = ["Course", "Status", "Enrolments", "Completion %", "Avg Quiz Score", "SME Review Time", "Last Updated"];
    const rows = filteredCourses.map((c: any) => [
      c.title,
      c.status,
      c.enrolments,
      c.completion,
      c.avgQuizScore,
      c.smeReviewTime,
      c.lastUpdated,
    ]);
    downloadCSV(`content_developer_course_reports_${appliedFromDate}_${appliedToDate}.csv`, [headers, ...rows]);
    toast.success("CSV export downloaded successfully.");
  };

  const handleExportExcel = () => {
    const headers = ["Course", "Status", "Enrolments", "Completion %", "Avg Quiz Score", "SME Review Time", "Last Updated"];
    const rows = filteredCourses.map((c: any) => [
      c.title,
      c.status,
      c.enrolments,
      c.completion,
      c.avgQuizScore,
      c.smeReviewTime,
      c.lastUpdated,
    ]);
    downloadCSV(`content_developer_course_reports_${appliedFromDate}_${appliedToDate}.xls`, [headers, ...rows]);
    toast.success("Excel export downloaded successfully.");
  };

  if (isInitialLoading && !courseAnalytics && !metricsData) {
    return (
      <div className="w-full min-w-0 flex flex-col gap-6 pb-14">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-3">
            <Skeleton className="h-4 w-64 bg-gray-200" />
            <Skeleton className="h-8 w-48 bg-gray-200" />
            <Skeleton className="h-4 w-[400px] bg-gray-200" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24 rounded-full bg-gray-200" />
            <Skeleton className="h-10 w-24 rounded-full bg-gray-200" />
          </div>
        </div>

        {/* Filters Skeleton */}
        <div className="bg-white rounded-[14px] p-4 border border-gray-100 flex gap-4">
          <Skeleton className="h-9 w-40 rounded-lg bg-gray-200" />
          <Skeleton className="h-9 w-40 rounded-lg bg-gray-200" />
          <Skeleton className="h-9 w-24 rounded-lg bg-gray-200" />
        </div>

        {/* Top KPIs Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-[14px] p-5 border border-gray-100 shadow-sm space-y-4">
              <div className="flex gap-3 items-center mb-2">
                <Skeleton className="h-10 w-10 rounded-lg bg-gray-200" />
                <Skeleton className="h-4 w-32 bg-gray-200" />
              </div>
              <Skeleton className="h-10 w-24 bg-gray-200" />
            </div>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-[16px] border border-gray-100 p-6 min-h-[300px] flex flex-col">
            <Skeleton className="h-5 w-48 bg-gray-200 mb-6" />
            <Skeleton className="flex-1 w-full bg-gray-100 rounded-lg" />
          </div>
          <div className="bg-white rounded-[16px] border border-gray-100 p-6 min-h-[300px] flex flex-col">
            <Skeleton className="h-5 w-48 bg-gray-200 mb-6" />
            <div className="flex-1 flex justify-center items-center">
              <Skeleton className="h-40 w-40 rounded-full bg-gray-100" />
            </div>
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-white rounded-[16px] border border-gray-100 p-6 mt-4">
          <Skeleton className="h-6 w-48 bg-gray-200 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-14 w-full bg-gray-100 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div
      className="cbr-layout w-full min-w-0 flex flex-col gap-6 pb-14 text-[#141414]"
      style={{ fontFamily: "'Manrope', system-ui, -apple-system, sans-serif" }}
    >
      {/* ── Page Header Row ────────────────────────────────────────── */}
      <div className="cbr-head flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div
            className="cbr-eyebrow font-semibold uppercase tracking-[1.5px] mb-1"
            style={{ fontSize: "12px", color: "#5C5C5C", marginBottom: "6px" }}
          >
            COURSE BUILDER &middot; REPORTS & ANALYTICS
          </div>
          <h1
            className="cbr-page-title font-bold tracking-tight text-[#141414] leading-tight"
            style={{ fontSize: "24px", margin: "0px 0px 6px" }}
          >
            Content reports
          </h1>
          <p
            className="cbr-page-sub font-normal text-[#5C5C5C]"
            style={{ fontSize: "14px" }}
          >
            Course performance, learner engagement, SME review throughput.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => {
              refetchMetrics();
              refetchCourseAnalytics();
              refetchLearnerProgress();
              refetchFeedback();
              coursesQuery.refetch?.();
              toast.success("Analytics refreshed.");
            }}
            className="nexus-btn sm bg-white border border-gray-200 hover:bg-gray-50 text-[#141414] font-semibold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all active:scale-95"
            title="Refresh analytics data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <button
            onClick={handleExportCSV}
            className="nexus-btn sm active:scale-95 border border-[#e5df8a] font-bold px-[16px] py-[8px] rounded-full hover:shadow-md transition-all duration-200 cursor-pointer flex items-center gap-1.5 shadow-2xs"
            style={{ fontSize: "14px", background: "#FCF7AE", color: "#141414" }}
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            Export CSV
          </button>
          <button
            onClick={handleExportExcel}
            className="nexus-btn sm active:scale-95 border border-[#e5df8a] font-bold px-[16px] py-[8px] rounded-full hover:shadow-md transition-all duration-200 cursor-pointer flex items-center gap-1.5 shadow-2xs"
            style={{ fontSize: "14px", background: "#FCF7AE", color: "#141414" }}
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            Export Excel
          </button>
        </div>
      </div>

      {/* ── Dynamic Date Filter Card ───────────────────────────────── */}
      <div className="card bg-white border border-gray-200/80 rounded-2xl px-6 py-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-6px_rgba(42,17,8,0.12)]">
        <div className="flex flex-wrap items-center gap-y-3 gap-x-4">
          {/* FROM */}
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase tracking-[0.1em] text-[#8C8C8C] text-[12px]">
              FROM
            </span>
            <div className="relative flex items-center">
              <input
                type="date"
                value={fromDate}
                max={toDate || todayStr}
                onChange={(e) => setFromDate(e.target.value)}
                className="border border-gray-200 rounded-xl px-3.5 py-1.5 text-[13px] font-semibold text-[#141414] bg-white focus:outline-none focus:border-black cursor-pointer shadow-2xs"
              />
            </div>
          </div>

          <span className="text-[12px] text-[#8C8C8C] font-normal mx-1">to</span>

          {/* TO */}
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase tracking-[0.1em] text-[#8C8C8C] text-[12px]">
              TO
            </span>
            <div className="relative flex items-center">
              <input
                type="date"
                value={toDate}
                min={fromDate}
                max={todayStr}
                onChange={(e) => setToDate(e.target.value)}
                className="border border-gray-200 rounded-xl px-3.5 py-1.5 text-[13px] font-semibold text-[#141414] bg-white focus:outline-none focus:border-black cursor-pointer shadow-2xs"
              />
            </div>
          </div>

          <span className="text-[12px] text-[#8C8C8C] font-normal sm:ml-2">
            Maximum range: 1 year
          </span>

          <button
            type="button"
            onClick={handleApplyFilter}
            disabled={isFiltering}
            className="nexus-btn ghost sm bg-white hover:bg-gray-50 border border-gray-300 text-[#141414] text-[14px] font-bold px-6 py-1.5 rounded-full transition-all duration-150 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isFiltering && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            Apply
          </button>
        </div>
      </div>

      {/* ── 4 Stat / KPI Cards Row ──────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: LEARNING PUBLISHED */}
        <div className="card bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-6px_rgba(42,17,8,0.12)] cursor-default flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div
              className="cbr-kpi-label font-bold uppercase tracking-wider leading-tight"
              style={{ fontSize: "12px", color: "#5C5C5C", margin: "0px 0px 8px" }}
            >
              LEARNING PUBLISHED
            </div>
            <div className="w-8 h-8 rounded-lg bg-[#dce5d3] text-[#446038] flex items-center justify-center shrink-0">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <div
              className="cbr-kpi-value font-extrabold text-[#141414] tracking-tight leading-none"
              style={{ fontSize: "33px", margin: "0px 0px 8px" }}
            >
              {(metricsData as any)?.learningPublished ?? (dateFilteredCourses.filter((c: any) => c.status === "PUBLISHED").length || 0)}
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-[#446038] font-semibold">
            <MiniTrendBars type="up" color="bg-[#7e9b6f]" />
            <span className="text-[#446038]">↑</span>
            <span>
              +{dateFilteredCourses.filter((c: any) => c.status === "PUBLISHED" && new Date(c.updatedAt || c.createdAt || Date.now()).getFullYear() === new Date().getFullYear()).length} this year
            </span>
          </div>
        </div>

        {/* Card 2: IN SME REVIEW */}
        <div className="card bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-6px_rgba(42,17,8,0.12)] cursor-default flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div
              className="cbr-kpi-label font-bold uppercase tracking-wider leading-tight"
              style={{ fontSize: "12px", color: "#5C5C5C", margin: "0px 0px 8px" }}
            >
              IN SME REVIEW
            </div>
            <div className="w-8 h-8 rounded-lg bg-[#f6e8c4] text-[#755a12] flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 fill-[#755a12]/20" />
            </div>
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <div
              className="cbr-kpi-value font-extrabold text-[#141414] tracking-tight leading-none"
              style={{ fontSize: "33px", margin: "0px 0px 8px" }}
            >
              {(metricsData as any)?.inSmeReview ?? (dateFilteredCourses.filter((c: any) => c.status === "UNDER_REVIEW" || c.status === "CHANGES_REQUESTED" || c.status === "SUBMITTED").length || 0)}
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-[#755a12] font-semibold">
            <MiniTrendBars type="flat" />
            <span className="text-[#755a12]">→</span>
            <span>
              {smeReviewThroughput.length > 0
                ? `${smeReviewThroughput.filter((s: any) => s.days !== "—").length} reviewed`
                : "Active reviews"}
            </span>
          </div>
        </div>

        {/* Card 3: TOTAL ENROLMENTS */}
        <div className="card bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-6px_rgba(42,17,8,0.12)] cursor-default flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div
              className="cbr-kpi-label font-bold uppercase tracking-wider leading-tight"
              style={{ fontSize: "12px", color: "#5C5C5C", margin: "0px 0px 8px" }}
            >
              TOTAL ENROLMENTS
            </div>
            <div className="w-8 h-8 rounded-lg bg-[#efd3c7] text-[#8f3a20] flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <div
              className="cbr-kpi-value font-extrabold text-[#141414] tracking-tight leading-none"
              style={{ fontSize: "33px", margin: "0px 0px 8px" }}
            >
              {((metricsData as any)?.totalEnrollments ?? (metricsData as any)?.totalEnrolments ?? 0).toLocaleString()}
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-[#446038] font-semibold">
            <MiniTrendBars type="up" color="bg-[#7e9b6f]" />
            <span className="text-[#446038]">↑</span>
            <span>
              {monthlyData.length >= 2 && monthlyData[monthlyData.length - 2].value > 0
                ? `${Math.round(((monthlyData[monthlyData.length - 1].value - monthlyData[monthlyData.length - 2].value) / monthlyData[monthlyData.length - 2].value) * 100)}% MoM`
                : `${((metricsData as any)?.totalEnrollments ?? 0).toLocaleString()} enrolled`}
            </span>
          </div>
        </div>

        {/* Card 4: AVG COMPLETION */}
        <div className="card bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-6px_rgba(42,17,8,0.12)] cursor-default flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div
              className="cbr-kpi-label font-bold uppercase tracking-wider leading-tight"
              style={{ fontSize: "12px", color: "#5C5C5C", margin: "0px 0px 8px" }}
            >
              AVG COMPLETION
            </div>
            <div className="w-8 h-8 rounded-lg bg-[#e8e8e3] text-[#141414] flex items-center justify-center shrink-0">
              <BarChart2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <div
              className="cbr-kpi-value font-extrabold text-[#141414] tracking-tight leading-none"
              style={{ fontSize: "33px", margin: "0px 0px 8px" }}
            >
              {(metricsData as any)?.overallCompletionPercentage !== undefined
                ? Math.round((metricsData as any).overallCompletionPercentage)
                : ((metricsData as any)?.avgCompletion ?? 0)}%
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-[#446038] font-semibold">
            <MiniTrendBars type="up" color="bg-[#7e9b6f]" />
            <span className="text-[#446038]">↑</span>
            <span>
              {((metricsData as any)?.completedEnrollments ?? 0).toLocaleString()} completed
            </span>
          </div>
        </div>
      </div>

      {/* ── 3 Chart Cards Row ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Chart 1: Monthly Enrolments */}
        <div className="lg:col-span-2 card bg-white border border-gray-200 rounded-2xl p-6 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-6px_rgba(42,17,8,0.12)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="cbr-chart-title font-bold text-[#141414]" style={{ fontSize: "16px" }}>
                Monthly enrolments
              </div>
              <BarChart3 className="w-4 h-4 text-[#d1d5db]" />
            </div>
            <p className="text-[12px] text-[#8C8C8C] font-normal mb-6">
              Last 6 months across all published courses
            </p>
          </div>

          <div className="flex items-end justify-between gap-3 h-36 pt-4 border-b border-gray-100">
            {monthlyData.map((m) => (
              <div key={m.name} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group cursor-pointer" title={`${m.name}: ${m.value} enrolments`}>
                <div
                  style={{ height: `${m.heightPct}%` }}
                  className="w-full bg-[#c99b2e] group-hover:bg-[#b08422] rounded-t-[3px] transition-all duration-150 group-hover:scale-y-[1.03] origin-bottom"
                />
                <span className="text-[10px] font-bold text-[#8C8C8C] uppercase">{m.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Course Completed Donut */}
        <div className="card bg-white border border-gray-200 rounded-2xl p-6 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-6px_rgba(42,17,8,0.12)] flex flex-col justify-between">
          <div>
            <div className="cbr-chart-title font-bold text-[#141414] mb-1" style={{ fontSize: "16px" }}>
              Course completed
            </div>
            <p className="text-[12px] text-[#8C8C8C] font-normal mb-5">By status</p>
          </div>

          <CourseCompletionDonut
            completed={(metricsData as any)?.completedEnrollments ?? 0}
            inProgress={(metricsData as any)?.inProgressEnrollments ?? 0}
            dropped={(metricsData as any)?.droppedEnrollments ?? (metricsData as any)?.cancelledEnrollments ?? 0}
            notStarted={(metricsData as any)?.notStartedEnrollments ?? 0}
          />
        </div>

        {/* Chart 3: Avg Quiz Score Semi-circle Gauge */}
        <div className="card bg-white border border-gray-200 rounded-2xl p-6 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-6px_rgba(42,17,8,0.12)] flex flex-col justify-between items-center text-center">
          <div className="w-full text-left">
            <div className="cbr-chart-title font-bold text-[#141414] mb-1" style={{ fontSize: "16px" }}>
              Avg quiz score
            </div>
            <p className="text-[12px] text-[#8C8C8C] font-normal mb-2">Across all published courses</p>
          </div>

          <div className="relative w-44 h-24 flex items-end justify-center overflow-hidden my-2">
            <svg className="w-44 h-44 -rotate-90 absolute top-0" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r={40} fill="none" stroke="#f3f4f6" strokeWidth="10" strokeDasharray="125 250" strokeDashoffset="0" />
              <circle
                cx="50"
                cy="50"
                r={40}
                fill="none"
                stroke={avgQuizScoreValue >= 70 ? "#5b8a6a" : "#c99b2e"}
                strokeWidth="10"
                strokeDasharray={`${Math.round((avgQuizScoreValue / 100) * 125)} 250`}
                strokeDashoffset="0"
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            </svg>
            <div className="flex flex-col items-center justify-center pb-1 z-10 pointer-events-none">
              <span className="text-[28px] font-black text-[#141414] leading-none">{avgQuizScoreValue}%</span>
              <span className="text-[9px] font-bold text-[#8C8C8C] uppercase tracking-widest mt-1">SCORE</span>
            </div>
          </div>

          <div className="w-full pt-3">
            <span className={`inline-flex items-center gap-1.5 ${avgQuizScoreValue >= 70 ? 'bg-[#e8f5e9] text-[#2e7d32] border-[#c8e6c9]' : 'bg-[#fff8e1] text-[#b78103] border-[#ffe082]'} border text-[12px] font-bold px-4 py-1 rounded-full shadow-2xs`}>
              <Check className="w-3.5 h-3.5 stroke-[3]" /> {avgQuizScoreValue >= 70 ? "Pass (threshold 70%)" : "Under Target (threshold 70%)"}
            </span>
          </div>
        </div>
      </div>

      {/* ── SME Review Throughput ─────────────────────────────────── */}
      <div className="card bg-white border border-gray-200 rounded-2xl p-6 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-6px_rgba(42,17,8,0.12)] flex flex-col" style={{ width: '1067.2px', height: '223.6px' }}>
        <div className="mb-4 shrink-0">
          <div className="card-title font-bold text-[#141414] mb-1" style={{ fontSize: "16px" }}>
            SME review throughput (days per course)
          </div>
          <p className="text-[12px] text-[#8C8C8C] font-normal">
            Avg days from submission to approval
          </p>
        </div>

        <div className="flex-1 flex flex-col justify-end">
          <div className="flex items-end gap-[6.4px] flex-1 border-b border-[#EAEAEA]">
            {smeReviewThroughput.length === 0 ? (
              <div className="w-full text-center text-xs text-gray-400 py-8">No review activity recorded.</div>
            ) : (
              smeReviewThroughput.map((item: any) => (
                <div key={item.label + item.title} className="flex flex-col justify-end h-full" style={{ width: '198.71px' }} title={`${item.title} (${item.days} days)`}>
                  <div
                    className="w-full bg-[#7e9f78] hover:bg-[#6b8c65] rounded-t-[3px] transition-all duration-150 cursor-pointer"
                    style={{ height: `${item.hPct}%` }}
                  />
                </div>
              ))
            )}
          </div>
          {smeReviewThroughput.length > 0 && (
            <div className="flex items-start gap-[6.4px] pt-3 shrink-0">
              {smeReviewThroughput.map((item: any, idx: number) => (
                <div key={`label-${idx}`} style={{ width: '198.71px' }}>
                  <span className="text-[12px] font-bold text-[#8C8C8C] uppercase tracking-wide">{item.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Course Performance Table ───────────────────────────────── */}
      <div className="card bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-6px_rgba(42,17,8,0.12)]">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Filter by course name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-gray-200 rounded-xl bg-white px-3.5 py-2 text-[12px] font-semibold text-[#141414] placeholder-[#8C8C8C] focus:outline-none focus:border-black shadow-2xs transition-colors"
            />
          </div>
          <div
            className="cbr-count font-medium"
            style={{ fontSize: "12px", color: "#5C5C5C", padding: "0px 12px 10px" }}
          >
            Showing {filteredCourses.length} of {coursePerformanceRows.length}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="tbl w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-gray-100 bg-[#fafaf8]">
                <th
                  onClick={() => handleCourseSort("title")}
                  className="px-5 py-3.5 font-bold uppercase tracking-wider cursor-pointer hover:bg-gray-100/80 transition-colors select-none group"
                  title="Sort by course title"
                >
                  <div className="flex items-center gap-1.5">
                    <span style={{ fontSize: "12px", color: courseSortKey === "title" ? "#141414" : "#5C5C5C" }}>COURSE</span>
                    <span className={`text-[13px] ${courseSortKey === "title" ? "text-[#141414] font-black" : "text-[#8c8c8c] opacity-60 group-hover:opacity-100"}`}>
                      {courseSortKey === "title" ? (courseSortDir === "asc" ? "↑" : "↓") : "⇅"}
                    </span>
                  </div>
                </th>
                <th
                  onClick={() => handleCourseSort("status")}
                  className="px-5 py-3.5 font-bold uppercase tracking-wider cursor-pointer hover:bg-gray-100/80 transition-colors select-none group"
                  title="Sort by status priority (Draft / In Review / Published)"
                >
                  <div className="flex items-center gap-1.5">
                    <span style={{ fontSize: "12px", color: courseSortKey === "status" ? "#141414" : "#5C5C5C" }}>STATUS</span>
                    <span className={`text-[13px] ${courseSortKey === "status" ? "text-[#141414] font-black" : "text-[#8c8c8c] opacity-60 group-hover:opacity-100"}`}>
                      {courseSortKey === "status" ? (courseSortDir === "asc" ? "↑" : "↓") : "⇅"}
                    </span>
                  </div>
                </th>
                <th
                  onClick={() => handleCourseSort("enrolments")}
                  className="px-5 py-3.5 font-bold uppercase tracking-wider cursor-pointer hover:bg-gray-100/80 transition-colors select-none group"
                  title="Sort by enrollments"
                >
                  <div className="flex items-center gap-1.5">
                    <span style={{ fontSize: "12px", color: courseSortKey === "enrolments" ? "#141414" : "#5C5C5C" }}>ENROLMENTS</span>
                    <span className={`text-[13px] ${courseSortKey === "enrolments" ? "text-[#141414] font-black" : "text-[#8c8c8c] opacity-60 group-hover:opacity-100"}`}>
                      {courseSortKey === "enrolments" ? (courseSortDir === "asc" ? "↑" : "↓") : "⇅"}
                    </span>
                  </div>
                </th>
                <th
                  onClick={() => handleCourseSort("completion")}
                  className="px-5 py-3.5 font-bold uppercase tracking-wider cursor-pointer hover:bg-gray-100/80 transition-colors select-none group"
                  title="Sort by completion rate"
                >
                  <div className="flex items-center gap-1.5">
                    <span style={{ fontSize: "12px", color: courseSortKey === "completion" ? "#141414" : "#5C5C5C" }}>COMPLETION %</span>
                    <span className={`text-[13px] ${courseSortKey === "completion" ? "text-[#141414] font-black" : "text-[#8c8c8c] opacity-60 group-hover:opacity-100"}`}>
                      {courseSortKey === "completion" ? (courseSortDir === "asc" ? "↑" : "↓") : "⇅"}
                    </span>
                  </div>
                </th>
                <th
                  onClick={() => handleCourseSort("avgQuizScore")}
                  className="px-5 py-3.5 font-bold uppercase tracking-wider cursor-pointer hover:bg-gray-100/80 transition-colors select-none group"
                  title="Sort by average quiz score"
                >
                  <div className="flex items-center gap-1.5">
                    <span style={{ fontSize: "12px", color: courseSortKey === "avgQuizScore" ? "#141414" : "#5C5C5C" }}>AVG QUIZ SCORE</span>
                    <span className={`text-[13px] ${courseSortKey === "avgQuizScore" ? "text-[#141414] font-black" : "text-[#8c8c8c] opacity-60 group-hover:opacity-100"}`}>
                      {courseSortKey === "avgQuizScore" ? (courseSortDir === "asc" ? "↑" : "↓") : "⇅"}
                    </span>
                  </div>
                </th>
                <th
                  onClick={() => handleCourseSort("smeReviewTime")}
                  className="px-5 py-3.5 font-bold uppercase tracking-wider cursor-pointer hover:bg-gray-100/80 transition-colors select-none group"
                  title="Sort by SME review time"
                >
                  <div className="flex items-center gap-1.5">
                    <span style={{ fontSize: "12px", color: courseSortKey === "smeReviewTime" ? "#141414" : "#5C5C5C" }}>SME REVIEW TIME</span>
                    <span className={`text-[13px] ${courseSortKey === "smeReviewTime" ? "text-[#141414] font-black" : "text-[#8c8c8c] opacity-60 group-hover:opacity-100"}`}>
                      {courseSortKey === "smeReviewTime" ? (courseSortDir === "asc" ? "↑" : "↓") : "⇅"}
                    </span>
                  </div>
                </th>
                <th
                  onClick={() => handleCourseSort("trend")}
                  className="px-5 py-3.5 font-bold uppercase tracking-wider cursor-pointer hover:bg-gray-100/80 transition-colors select-none group"
                  title="Sort by trend"
                >
                  <div className="flex items-center gap-1.5">
                    <span style={{ fontSize: "12px", color: courseSortKey === "trend" ? "#141414" : "#5C5C5C" }}>TREND</span>
                    <span className={`text-[13px] ${courseSortKey === "trend" ? "text-[#141414] font-black" : "text-[#8c8c8c] opacity-60 group-hover:opacity-100"}`}>
                      {courseSortKey === "trend" ? (courseSortDir === "asc" ? "↑" : "↓") : "⇅"}
                    </span>
                  </div>
                </th>
                <th
                  onClick={() => handleCourseSort("lastUpdated")}
                  className="px-5 py-3.5 font-bold uppercase tracking-wider cursor-pointer hover:bg-gray-100/80 transition-colors select-none group"
                  title="Sort by last updated date"
                >
                  <div className="flex items-center gap-1.5">
                    <span style={{ fontSize: "12px", color: courseSortKey === "lastUpdated" ? "#141414" : "#5C5C5C" }}>LAST UPDATED</span>
                    <span className={`text-[13px] ${courseSortKey === "lastUpdated" ? "text-[#141414] font-black" : "text-[#8c8c8c] opacity-60 group-hover:opacity-100"}`}>
                      {courseSortKey === "lastUpdated" ? (courseSortDir === "asc" ? "↑" : "↓") : "⇅"}
                    </span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {sortedCourses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-[#8C8C8C] font-medium">
                    No course performance data available.
                  </td>
                </tr>
              ) : (
                sortedCourses.map((c: any) => (
                  <tr key={c.id} className="hover:bg-[#fafaf8] transition-colors cursor-pointer">
                    <td className="px-5 py-3.5 font-bold text-[#141414] flex items-center gap-3" style={{ padding: "12px 20px" }}>
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0 border border-gray-100">
                        {c.image ? (
                          <img
                            src={c.image}
                            alt={c.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <BookOpen className="w-4 h-4 text-gray-600" />
                        )}
                      </div>
                      <span
                        className="cbr-course-name font-bold text-[#141414] truncate max-w-[280px]"
                        style={{ fontSize: "16px" }}
                      >
                        {c.title}
                      </span>
                    </td>
                    <td className="px-5 py-3.5" style={{ padding: "12px 20px" }}>
                      <span
                        className="cbr-status inline-flex items-center gap-1.5 font-normal"
                        style={{ fontSize: "14px", color: "#3A3A3A" }}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            c.status === "Published"
                              ? "bg-[#6e9c6c]"
                              : c.status === "In review" || c.status === "Under review"
                                ? "bg-[#c99b2e]"
                                : "bg-gray-400"
                          }`}
                        />
                        {c.status}
                      </span>
                    </td>
                    <td className="cbr-col-num font-normal text-[#141414]" style={{ fontSize: "16px", padding: "12px 20px" }}>
                      {c.enrolments || "0"}
                    </td>
                    <td className="cbr-col-num font-normal text-[#141414]" style={{ fontSize: "16px", padding: "12px 20px" }}>
                      {c.completion || "0%"}
                    </td>
                    <td className="cbr-col-num font-normal text-[#141414]" style={{ fontSize: "16px", padding: "12px 20px" }}>
                      {c.avgQuizScore || "-"}
                    </td>
                    <td className="cbr-col-num font-normal text-[#141414]" style={{ fontSize: "16px", padding: "12px 20px" }}>
                      {c.smeReviewTime || "-"}
                    </td>
                    <td className="px-5 py-3.5" style={{ padding: "12px 20px" }}>
                      {c.trend === "up" && (
                        <div className="flex items-center gap-1">
                          <MiniTrendBars type="up" color="bg-[#7e9b6f]" />
                          <span className="text-xs text-[#7e9b6f]">↑</span>
                        </div>
                      )}
                      {c.trend === "down" && (
                        <div className="flex items-center gap-1">
                          <MiniTrendBars type="down" color="bg-[#d32f2f]" />
                          <span className="text-xs text-[#d32f2f]">↓</span>
                        </div>
                      )}
                      {c.trend !== "up" && c.trend !== "down" && <span className="text-[#8C8C8C]">-</span>}
                    </td>
                    <td className="px-5 py-3.5 text-[#5C5C5C]" style={{ fontSize: "16px", padding: "12px 20px" }}>
                      {c.lastUpdated || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Top Performing Learners Table ─────────────────────────── */}
      <div className="card bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden transition-all duration-200 hover:shadow-md hover:border-gray-300">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <div className="cbr-chart-title font-bold text-[#141414] mb-0.5" style={{ fontSize: "16px" }}>
              Top performing learners
            </div>
            <p className="text-[12px] text-[#8C8C8C] font-normal">Ranked by average score and completion</p>
          </div>
          <Bookmark className="w-4 h-4 text-[#9ca3af]" />
        </div>

        <div className="overflow-x-auto">
          <table className="tbl w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-gray-100 bg-[#fafaf8]">
                <th
                  onClick={() => handleLearnerSort("rank")}
                  className="px-5 py-3.5 font-bold uppercase tracking-wider cursor-pointer hover:bg-gray-100/80 transition-colors select-none group"
                  title="Sort by rank"
                >
                  <div className="flex items-center gap-1.5">
                    <span style={{ fontSize: "12px", color: learnerSortKey === "rank" ? "#141414" : "#5C5C5C" }}>RANK</span>
                    <span className={`text-[13px] ${learnerSortKey === "rank" ? "text-[#141414] font-black" : "text-[#8c8c8c] opacity-60 group-hover:opacity-100"}`}>
                      {learnerSortKey === "rank" ? (learnerSortDir === "asc" ? "↑" : "↓") : "⇅"}
                    </span>
                  </div>
                </th>
                <th
                  onClick={() => handleLearnerSort("name")}
                  className="px-5 py-3.5 font-bold uppercase tracking-wider cursor-pointer hover:bg-gray-100/80 transition-colors select-none group"
                  title="Sort by learner name"
                >
                  <div className="flex items-center gap-1.5">
                    <span style={{ fontSize: "12px", color: learnerSortKey === "name" ? "#141414" : "#5C5C5C" }}>LEARNER</span>
                    <span className={`text-[13px] ${learnerSortKey === "name" ? "text-[#141414] font-black" : "text-[#8c8c8c] opacity-60 group-hover:opacity-100"}`}>
                      {learnerSortKey === "name" ? (learnerSortDir === "asc" ? "↑" : "↓") : "⇅"}
                    </span>
                  </div>
                </th>
                <th
                  onClick={() => handleLearnerSort("score")}
                  className="px-5 py-3.5 font-bold uppercase tracking-wider cursor-pointer hover:bg-gray-100/80 transition-colors select-none group"
                  title="Sort by average quiz score"
                >
                  <div className="flex items-center gap-1.5">
                    <span style={{ fontSize: "12px", color: learnerSortKey === "score" ? "#141414" : "#5C5C5C" }}>AVG SCORE</span>
                    <span className={`text-[13px] ${learnerSortKey === "score" ? "text-[#141414] font-black" : "text-[#8c8c8c] opacity-60 group-hover:opacity-100"}`}>
                      {learnerSortKey === "score" ? (learnerSortDir === "asc" ? "↑" : "↓") : "⇅"}
                    </span>
                  </div>
                </th>
                <th
                  onClick={() => handleLearnerSort("completion")}
                  className="px-5 py-3.5 font-bold uppercase tracking-wider cursor-pointer hover:bg-gray-100/80 transition-colors select-none group"
                  title="Sort by completion percentage"
                >
                  <div className="flex items-center gap-1.5">
                    <span style={{ fontSize: "12px", color: learnerSortKey === "completion" ? "#141414" : "#5C5C5C" }}>COMPLETION</span>
                    <span className={`text-[13px] ${learnerSortKey === "completion" ? "text-[#141414] font-black" : "text-[#8c8c8c] opacity-60 group-hover:opacity-100"}`}>
                      {learnerSortKey === "completion" ? (learnerSortDir === "asc" ? "↑" : "↓") : "⇅"}
                    </span>
                  </div>
                </th>
                <th
                  onClick={() => handleLearnerSort("count")}
                  className="px-5 py-3.5 font-bold uppercase tracking-wider cursor-pointer hover:bg-gray-100/80 transition-colors select-none group"
                  title="Sort by courses completed"
                >
                  <div className="flex items-center gap-1.5">
                    <span style={{ fontSize: "12px", color: learnerSortKey === "count" ? "#141414" : "#5C5C5C" }}>LEARNING COMPLETED</span>
                    <span className={`text-[13px] ${learnerSortKey === "count" ? "text-[#141414] font-black" : "text-[#8c8c8c] opacity-60 group-hover:opacity-100"}`}>
                      {learnerSortKey === "count" ? (learnerSortDir === "asc" ? "↑" : "↓") : "⇅"}
                    </span>
                  </div>
                </th>
                <th className="px-5 py-3.5 font-bold uppercase tracking-wider">
                  <span style={{ fontSize: "12px", color: "#5C5C5C" }}>TREND</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {sortedTopLearners.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-[#8C8C8C] font-medium">
                    No learner performance records available for selected period.
                  </td>
                </tr>
              ) : (
                sortedTopLearners.map((l: any) => (
                  <tr key={l.rank || l.id} className="hover:bg-[#fafaf8] transition-colors cursor-pointer">
                    <td className="px-5 py-3.5" style={{ padding: "12px 20px" }}>
                      <span
                        className={`rounded-md flex items-center justify-center font-extrabold text-[12px] ${(l.rank || 0) <= 3
                            ? "bg-[#f6e8c4] text-[#d1a848]"
                            : "bg-gray-100 text-[#5C5C5C]"
                          }`}
                        style={{ width: "26px", height: "26px" }}
                      >
                        {l.rank || "-"}
                      </span>
                    </td>
                    <td className="cbr-learner-name font-bold text-[#141414]" style={{ fontSize: "16px", padding: "12px 20px" }}>
                      {l.name}
                    </td>
                    <td className="cbr-col-num font-normal text-[#141414]" style={{ fontSize: "16px", padding: "12px 20px" }}>
                      {l.score || "-"}
                    </td>
                    <td className="cbr-col-num font-normal text-[#141414]" style={{ fontSize: "16px", padding: "12px 20px" }}>
                      {l.completion || "-"}
                    </td>
                    <td className="cbr-col-num font-normal text-[#141414]" style={{ fontSize: "16px", padding: "12px 20px" }}>
                      {l.count || "0"}
                    </td>
                    <td className="px-5 py-3.5" style={{ padding: "12px 20px" }}>
                      {l.trend === "up" ? (
                        <div className="flex items-center gap-1">
                          <MiniTrendBars type="up" color="bg-[#7e9b6f]" />
                          <span className="text-xs text-[#7e9b6f]">↑</span>
                        </div>
                      ) : l.trend === "down" ? (
                        <div className="flex items-center gap-1">
                          <MiniTrendBars type="down" color="bg-[#d32f2f]" />
                          <span className="text-xs text-[#d32f2f]">↓</span>
                        </div>
                      ) : (
                        <span className="text-[#8C8C8C]">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ContentDeveloperReports;
