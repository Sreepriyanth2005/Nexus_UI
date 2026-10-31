import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { Skeleton } from "../../components/ui/Skeleton/Skeleton";
import { useNavigate, useSearchParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {BarChart2,AlertTriangle,Calendar,Check,Clock,X,} from "../../assets/icons";
import {BarChart,Bar,ResponsiveContainer,Tooltip,} from "recharts";
import { api } from "../../config/axios";
import ReviewQueueTabs from "../../components/sme-review-queue/ReviewQueueTabs";
import ReviewQueueTable from "../../components/sme-review-queue/ReviewQueueTable";
import ReviewScopeBanner from "../../components/sme-review-queue/ReviewScopeBanner";
import { QueueItem } from "../../components/sme-review-queue/ReviewQueueRow";
import { useUserStore } from "../../store/user.store";
import { useProfileStore } from "../../store/profile.store";
import { useProfile } from "../../hooks/profile/useProfile";
import { useSmeReviewQueueStore } from "../../store/review-queue/smeReviewQueue.store";
import { useReviewQueue, useReviewQueueStatistics, } from "../../hooks/review-queue/useSmeReviewQueue";
import { useAssets } from "../../hooks/asset/useAssets";
import { useSubjects } from "../../hooks/useSubjects";
import { useVisibilities } from "../../hooks/useEnums";
import { smeReviewProgressService } from "../../core/services/smeReviewProgress.service";
import { getReviewCommentsApi } from "../../core/api/review/review-comment.api";
import { useAuthStore } from "../../core/auth/auth.store";
import { ChevronDown } from "@/assets/icons";

function getAssetUrl(asset: any): string {
  if (asset?.assetSource === "EXTERNAL_URL" && asset?.externalUrl) {
    return asset.externalUrl;
  }
  return asset?.signedUrl || asset?.fileUrl || asset?.externalUrl || asset?.url || "";
}

const ThumbnailImage = ({ thumbnailAssetId, title }: { thumbnailAssetId?: string; title: string }) => {
  const { getAssetById } = useAssets();

  const { data: assetUrl, isLoading } = useQuery({
    queryKey: ["asset-url", thumbnailAssetId],
    queryFn: async () => {
      if (!thumbnailAssetId) return null;
      const asset = await getAssetById(thumbnailAssetId);
      return getAssetUrl(asset);
    },
    enabled: !!thumbnailAssetId,
  });

  if (isLoading) {
    return (
      <div className="flex size-[42px] shrink-0 items-center justify-center rounded-md border border-[var(--line)] bg-[var(--paper-2)]">
        <div className="size-4 animate-pulse rounded-full bg-[var(--line-strong)]" />
      </div>
    );
  }

  if (assetUrl) {
    return (
      <img
        src={assetUrl}
        alt={title}
        className="size-[42px] shrink-0 rounded-md border border-[var(--line)] object-cover"
      />
    );
  }

  const firstLetter = title ? title.charAt(0).toUpperCase() : "?";
  return (
    <div className="flex size-[42px] shrink-0 items-center justify-center rounded-md border border-[var(--line)] bg-[#f8fafc] text-[16px] font-bold text-[#64748b]">
      {firstLetter}
    </div>
  );
};


const SubjectMatterReviewQueue: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const subjectParam = searchParams.get("subject");
  const [priorityOpen, setPriorityOpen] = useState(false);

  const { user } = useUserStore();
  const { profile } = useProfileStore();
  const { getProfile } = useProfile();
  
  useEffect(() => {
    if (!profile) {
      getProfile().catch(console.error);
    }
  }, [profile, getProfile]);

  const { permissions } = useAuthStore();
  
  const { subjects: rawSubjects } = useSubjects();
  const { data: rawVisibilities } = useVisibilities();

  const hasGlobalReviewAccess =
    (user as any)?.isSystemRole &&
    permissions.some((p) => p === "COURSE.UPDATE" || p === "CAREER_PATH.UPDATE");

  const reviewerId = hasGlobalReviewAccess
    ? "all"
    : user?.id || profile?.id || "";

  const anyUser = user as any;
  const anyProfile = profile as any;
  
  const displayName =
    [anyUser?.firstName, anyUser?.lastName].filter(Boolean).join(" ") ||
    [anyUser?.first_name, anyUser?.last_name].filter(Boolean).join(" ") ||
    [anyUser?.given_name, anyUser?.family_name].filter(Boolean).join(" ") ||
    anyUser?.name ||
    anyUser?.preferred_username ||
    [anyProfile?.profile?.firstName, anyProfile?.profile?.lastName].filter(Boolean).join(" ") ||
    [anyProfile?.first_name, anyProfile?.last_name].filter(Boolean).join(" ") ||
    "Reviewer";

  const { activeTab, setTab, reset } =
    useSmeReviewQueueStore();



  /* -------------------------------------------------------------------------- */
  /* URL / STORE SYNC                                                           */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    if (tabParam === "in_progress") {
      setTab("in_progress");
    } else if (tabParam === "reviewed") {
      setTab("reviewed");
    } else {
      setTab("pending");
    }
  }, [tabParam, setTab]);

  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  /* -------------------------------------------------------------------------- */
  /* REVIEW QUEUE                                                               */
  /* -------------------------------------------------------------------------- */

  const {
    data,
    isLoading: isLoadingItems,
    isError: isErrorItems,
    refetch: refetchItems,
  } = useReviewQueue(
    reviewerId,
    undefined,
    1,
    100
  );

  const allItems = useMemo(
    () => data?.items || [],
    [data]
  );

  const {
    data: stats,
    isLoading: isLoadingStats,
    isError: isErrorStats,
    refetch: refetchStats,
  } = useReviewQueueStatistics(reviewerId);

  /* -------------------------------------------------------------------------- */
  /* HISTORY MODAL                                                              */
  /* -------------------------------------------------------------------------- */

  const [historyModalOpen, setHistoryModalOpen] =
    useState(false);

  const [selectedHistoryItem, setSelectedHistoryItem] =
    useState<QueueItem | null>(null);

  const {
    data: historyData,
    isLoading: isLoadingHistory,
  } = useQuery({
    queryKey: [
      "review-history",
      selectedHistoryItem?.id,
      selectedHistoryItem?.type,
    ],
    queryFn: async () => {
      if (!selectedHistoryItem) {
        return null;
      }

      let url = "";

      const entityTypeRaw = (
        selectedHistoryItem.type || "course"
      ).toLowerCase();

      const typeParam = entityTypeRaw.includes("career path")
        ? "career-path"
        : entityTypeRaw;

      if (typeParam === "course") {
        url = `/reviews/course/${selectedHistoryItem.id}`;
      } else if (typeParam === "career-path") {
        url = `/reviews/career-path/${selectedHistoryItem.id}`;
      } else if (typeParam === "lesson") {
        url = `/reviews/lesson/${selectedHistoryItem.id}`;
      } else {
        return null;
      }

      const res = await api.get(url);

      return res.data?.data || null;
    },
    enabled: !!selectedHistoryItem,
  });

  /* -------------------------------------------------------------------------- */
  /* FILTER STATE                                                               */
  /* -------------------------------------------------------------------------- */

  const [selectedSubject, setSelectedSubject] = useState(subjectParam || "all");
  const [selectedVisibility, setSelectedVisibility] = useState("all");
  const [subjectOpen, setSubjectOpen] = useState(false);
  const [visibilityOpen, setVisibilityOpen] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [discussions, setDiscussions] = useState<any[]>([]);

  useEffect(() => {
    if (subjectParam) {
      setSelectedSubject(subjectParam);
    }
  }, [subjectParam]);

  /* -------------------------------------------------------------------------- */
  /* DISCUSSIONS                                                                */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    if (allItems.length === 0) {
      setDiscussions([]);
      return;
    }

    const fetchDiscussions = async () => {
      try {
        const allCommentsPromises = allItems.map(
          async (item) => {
            const entityTypeRaw = (
              item.type || "course"
            ).toLowerCase();

            const typeParam =
              entityTypeRaw.includes("career path")
                ? "career-path"
                : entityTypeRaw;

            const comments = await getReviewCommentsApi(
              item.reviewId || item.id,
              typeParam
            );

            return comments.map((comment) => ({
              ...comment,
              subject: item.subject,
              title: item.title,
              item,
            }));
          }
        );

        const results = await Promise.all(
          allCommentsPromises
        );

        const flattened = results.flat();

        flattened.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
        );

        setDiscussions(flattened);
      } catch (error) {
        console.error(
          "Failed to load discussions",
          error
        );
      }
    };

    fetchDiscussions();
  }, [allItems]);

  /* -------------------------------------------------------------------------- */
  /* REVIEW ACTIONS                                                             */
  /* -------------------------------------------------------------------------- */

  const handleReview = (item: QueueItem) => {
    const entityTypeRaw = (
      item.type || "course"
    ).toLowerCase();

    const typeParam = entityTypeRaw.includes("career path")
      ? "career-path"
      : entityTypeRaw;

    const isViewOnly = activeTab === "reviewed";

    if (activeTab === "pending") {
      smeReviewProgressService.markAsInProgress(
        item.reviewId || item.id
      );
    }

    navigate(
      `/sme-review?id=${item.id}&type=${typeParam}&viewOnly=${isViewOnly}`,
      {
        state: {
          entityId: item.id,
          type: typeParam,
          viewOnly: isViewOnly,
        },
      }
    );
  };

  const handleTitleClick = (item: QueueItem) => {
    setSelectedHistoryItem(item);
    setHistoryModalOpen(true);
  };

  const handleRetry = () => {
    refetchItems();
    refetchStats();
  };

  /* -------------------------------------------------------------------------- */
  /* QUEUE GROUPING                                                             */
  /* -------------------------------------------------------------------------- */

  const inboxItems = useMemo(() => {
    return allItems.filter(
      (item) =>
        item.status === "PENDING" &&
        !smeReviewProgressService.isInProgress(
          item.reviewId || item.id
        )
    );
  }, [allItems]);

  const inProgressItems = useMemo(() => {
    const inProgressPending = allItems.filter(
      (item) =>
        item.status === "PENDING" &&
        smeReviewProgressService.isInProgress(
          item.reviewId || item.id
        )
    );

    allItems.forEach((item) => {
      if (
        item.status !== "PENDING" &&
        smeReviewProgressService.isInProgress(
          item.reviewId || item.id
        )
      ) {
        smeReviewProgressService.removeFromInProgress(
          item.reviewId || item.id
        );
      }
    });

    return inProgressPending;
  }, [allItems]);

  const reviewedItems = useMemo(() => {
    return allItems.filter(
      (item) =>
        item.status === "APPROVED" ||
        item.status === "REJECTED"
    );
  }, [allItems]);

  /* -------------------------------------------------------------------------- */
  /* COUNTS                                                                     */
  /* -------------------------------------------------------------------------- */

  const inboxCount = inboxItems.length;
  const inProgressCount = inProgressItems.length;
  const reviewedCount = reviewedItems.length;

  /* -------------------------------------------------------------------------- */
  /* RESOLVED                                                                   */
  /* -------------------------------------------------------------------------- */

  const resolved = useMemo(() => {
    return reviewedItems.filter(
      (item) =>
        item.reviewedAt &&
        item.submittedAt
    );
  }, [reviewedItems]);

  /* -------------------------------------------------------------------------- */
  /* STATISTICS                                                                 */
  /* -------------------------------------------------------------------------- */

  const statsPending =
    inboxCount + inProgressCount;

  const statsReviewedYtd = useMemo(() => {
    const currentYear =
      new Date().getFullYear();

    return reviewedItems.filter((item) => {
      const reviewDate = item.reviewedAt
        ? new Date(item.reviewedAt)
        : null;

      return (
        reviewDate &&
        reviewDate.getFullYear() === currentYear
      );
    }).length;
  }, [reviewedItems]);

  const avgTurnaround = useMemo(() => {
    if (resolved.length === 0) {
      return "0";
    }

    const totalDays = resolved.reduce(
      (acc, item) => {
        const diffMs =
          new Date(item.reviewedAt!).getTime() -
          new Date(item.submittedAt!).getTime();

        return (
          acc +
          diffMs /
          (1000 * 60 * 60 * 24)
        );
      },
      0
    );

    return (
      (totalDays / resolved.length).toFixed(1) +
      "d"
    );
  }, [resolved]);

  const approvalRate = useMemo(() => {
    const approved = reviewedItems.filter(
      (item) => item.status === "APPROVED"
    ).length;

    if (reviewedItems.length === 0) {
      return "0";
    }

    return (
      Math.round(
        (approved / reviewedItems.length) * 100
      ) + "%"
    );
  }, [reviewedItems]);

  /* -------------------------------------------------------------------------- */
  /* QUEUE AGING                                                                */
  /* -------------------------------------------------------------------------- */

  const {
    dueSoonCount,
    thisWeekCount,
    pastDueCount,
  } = useMemo(() => {
    let dueSoon = 0;
    let thisWeek = 0;
    let pastDue = 0;

    const now = new Date();

    allItems
      .filter((item) => item.status === "PENDING")
      .forEach((item) => {
        if (!item.dueDate) {
          return;
        }

        const dueTime =
          new Date(item.dueDate).getTime();

        const diffMs =
          dueTime - now.getTime();

        const diffDays =
          diffMs /
          (1000 * 60 * 60 * 24);

        if (diffDays < 0) {
          pastDue++;
        } else if (diffDays <= 2) {
          dueSoon++;
        } else {
          thisWeek++;
        }
      });

    return {
      dueSoonCount: dueSoon,
      thisWeekCount: thisWeek,
      pastDueCount: pastDue,
    };
  }, [allItems]);

  /* -------------------------------------------------------------------------- */
  /* YOUR STATS                                                                 */
  /* -------------------------------------------------------------------------- */

  const approvedThisMonth = useMemo(() => {
    const startOfMonth = new Date();

    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    return reviewedItems.filter(
      (item) =>
        item.status === "APPROVED" &&
        item.reviewedAt &&
        new Date(item.reviewedAt) >=
        startOfMonth
    ).length;
  }, [reviewedItems]);

  const reviewedThisWeek = useMemo(() => {
    const sevenDaysAgo = new Date();

    sevenDaysAgo.setDate(
      sevenDaysAgo.getDate() - 7
    );

    return reviewedItems.filter(
      (item) =>
        item.reviewedAt &&
        new Date(item.reviewedAt) >=
        sevenDaysAgo
    ).length;
  }, [reviewedItems]);

  const onTimeRate = useMemo(() => {
    if (resolved.length === 0) {
      return "0";
    }

    const onTimeCount =
      resolved.filter((item) => {
        const diffMs =
          new Date(item.reviewedAt!).getTime() -
          new Date(item.submittedAt!).getTime();

        return (
          diffMs <=
          3 *
          24 *
          60 *
          60 *
          1000
        );
      }).length;

    return (
      Math.round(
        (onTimeCount / resolved.length) * 100
      ) + "%"
    );
  }, [resolved]);

  const oldestPendingText = useMemo(() => {
    const pendingList = allItems.filter(
      (item) => item.status === "PENDING"
    );

    if (pendingList.length === 0) {
      return "0";
    }

    const sorted = [...pendingList].sort(
      (a, b) =>
        new Date(a.submittedAt!).getTime() -
        new Date(b.submittedAt!).getTime()
    );

    const oldest = sorted[0];

    const diffDays = Math.floor(
      (Date.now() -
        new Date(
          oldest.submittedAt!
        ).getTime()) /
      (1000 * 60 * 60 * 24)
    );

    return `${diffDays}d`;
  }, [allItems]);

  const domainsCoveredText = useMemo(() => {
    const uniqueDomains = Array.from(
      new Set(
        reviewedItems
          .map((item) => item.subject)
          .filter(Boolean)
      )
    );

    const getAbbreviation = (
      name: string
    ) => {
      if (name.includes("Knowledge")) {
        return "KM";
      }

      if (name.includes("Records")) {
        return "ERM";
      }

      if (name.includes("Governance")) {
        return "DG";
      }

      if (name.includes("Data Management")) {
        return "DM";
      }

      return name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase();
    };

    return (
      uniqueDomains
        .map((domain) =>
          getAbbreviation(domain!)
        )
        .join(", ") || "0"
    );
  }, [reviewedItems]);

  /* -------------------------------------------------------------------------- */
  /* REVIEW VELOCITY                                                            */
  /* -------------------------------------------------------------------------- */

  const weekData = useMemo(() => {
    const weeks = [
      {
        name: "W1",
        Approved: 0,
        Returned: 0,
      },
      {
        name: "W2",
        Approved: 0,
        Returned: 0,
      },
      {
        name: "W3",
        Approved: 0,
        Returned: 0,
      },
      {
        name: "W4",
        Approved: 0,
        Returned: 0,
      },
    ];

    const nowTime = Date.now();

    reviewedItems.forEach((item) => {
      if (!item.reviewedAt) {
        return;
      }

      const ageDays =
        (nowTime -
          new Date(
            item.reviewedAt
          ).getTime()) /
        (1000 * 60 * 60 * 24);

      if (ageDays <= 30) {
        const weekIdx = Math.min(
          3,
          Math.floor(ageDays / 7.5)
        );

        const weekKey = 3 - weekIdx;

        if (item.status === "APPROVED") {
          weeks[weekKey].Approved++;
        } else {
          weeks[weekKey].Returned++;
        }
      }
    });

    return weeks;
  }, [reviewedItems]);

  /* -------------------------------------------------------------------------- */
  /* SUBJECTS                                                                   */
  /* -------------------------------------------------------------------------- */

  const uniqueSubjects = useMemo(() => {
    if (rawSubjects && rawSubjects.length > 0) {
      return Array.from(new Set(rawSubjects.map((s: any) => s.name).filter(Boolean))) as string[];
    }
    return Array.from(
      new Set(
        allItems
          .map((item) => item.subject)
          .filter(Boolean)
      )
    ) as string[];
  }, [rawSubjects, allItems]);

  /* -------------------------------------------------------------------------- */
  /* ACTIVE TAB                                                                 */
  /* -------------------------------------------------------------------------- */

  const currentTabItems = useMemo(() => {
    if (activeTab === "pending") {
      return inboxItems;
    }

    if (activeTab === "in_progress") {
      return inProgressItems;
    }

    return reviewedItems;
  }, [
    activeTab,
    inboxItems,
    inProgressItems,
    reviewedItems,
  ]);

  /* -------------------------------------------------------------------------- */
  /* FILTERED ITEMS                                                             */
  /* -------------------------------------------------------------------------- */

  const filteredItems = useMemo(() => {
    return currentTabItems.filter((item) => {
      if (searchQuery.trim()) {
        const q =
          searchQuery.toLowerCase();

        const matchTitle =
          item.title
            ?.toLowerCase()
            .includes(q);

        const matchSubmitter =
          item.submittedBy
            ?.toLowerCase()
            .includes(q);

        if (
          !matchTitle &&
          !matchSubmitter
        ) {
          return false;
        }
      }

      if (
        selectedSubject !== "all" &&
        item.subject !== selectedSubject
      ) {
        return false;
      }

      if (
        selectedVisibility !== "all" &&
        item.visibility !==
        selectedVisibility
      ) {
        return false;
      }

      if (overdueOnly) {
        const isOverdue = item.dueDate
          ? new Date() >
          new Date(item.dueDate)
          : false;

        if (!isOverdue) {
          return false;
        }
      }


      return true;
    });
  }, [
    currentTabItems,
    searchQuery,
    selectedSubject,
    selectedVisibility,
    overdueOnly,
    selectedPriority,
  ]);


  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, selectedPriority, overdueOnly]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const sortedItems = useMemo(() => {
    let result = [...filteredItems];

    result.sort((a, b) => {
      if (selectedPriority === "overdue_first") {
        const aIsOverdue = a.dueDate ? new Date() > new Date(a.dueDate) : false;
        const bIsOverdue = b.dueDate ? new Date() > new Date(b.dueDate) : false;
        if (aIsOverdue && !bIsOverdue) return -1;
        if (!aIsOverdue && bIsOverdue) return 1;
      } else if (selectedPriority === "newest_first") {
        const dateA = a.submittedDate && a.submittedDate !== "-" ? new Date(a.submittedDate).getTime() : 0;
        const dateB = b.submittedDate && b.submittedDate !== "-" ? new Date(b.submittedDate).getTime() : 0;
        return dateB - dateA;
      }

      return 0;
    });

    return result;
  }, [filteredItems, selectedPriority]);

  const paginatedItems = sortedItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  /* -------------------------------------------------------------------------- */
  /* LOADING / ERROR                                                            */
  /* -------------------------------------------------------------------------- */

  const isError =
    isErrorItems || isErrorStats;

  const isLoading =
    isLoadingItems ||
    isLoadingStats ||
    !reviewerId;

  /* -------------------------------------------------------------------------- */
  /* ERROR STATE                                                                */
  /* -------------------------------------------------------------------------- */

  if (isError) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[var(--paper)] p-6 font-[var(--font-sans)]">
        <div className="w-full max-w-md rounded-[var(--r-md)] border border-[var(--line)] bg-white p-8 text-center shadow-[var(--shadow-sm)]">
          <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-full bg-[var(--c-clay-wash)] text-[var(--c-clay-text)]">
            <AlertTriangle className="size-5" />
          </div>

          <h2 className="text-base font-[var(--fw-bold)] text-[var(--ink)]">
            Failed to load review queue
          </h2>

          <p className="mt-2 text-[var(--fs-label)] leading-[var(--lh-body)] text-[var(--ink-mute)]">
            There was an error communicating
            with the server. Please try again.
          </p>

          <button
            type="button"
            onClick={handleRetry}
            className="mt-5 inline-flex h-9 items-center justify-center rounded-[var(--r-pill)] bg-[var(--btn)] px-5 text-[var(--fs-label)] font-[var(--fw-bold)] text-[var(--btn-ink)] shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] ease-[var(--tn)] hover:-translate-y-px hover:bg-[var(--btn-hover)] hover:shadow-[var(--shadow-sm)] active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--line-strong)]"
          >
            Retry connection
          </button>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------------------------- */
  /* PAGE                                                                       */
  /* -------------------------------------------------------------------------- */

  return (
    <main className="flex w-full min-w-0 flex-col gap-[var(--space-6)] font-[var(--font-sans)] text-[var(--ink)]">

      {/* ====================================================================== */}
      {/* PAGE HEADER                                                             */}
      {/* ====================================================================== */}

      <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between mb-3.5">
        <div className="min-w-0 space-y-1">
          <p className="mb-1.5 text-[12px] font-bold uppercase tracking-[0.1em] text-[var(--ink-mute)]">
            SME - REVIEW INBOX
          </p>

          <h1 className="text-[24px] font-bold leading-tight tracking-tight text-[var(--ink)]">
            Inbox
          </h1>

          <p className="max-w-2xl text-[16px] font-medium leading-relaxed text-[var(--ink-soft)]">
            Items awaiting your approval. Logged in as <span className="font-bold text-[var(--ink)]">{displayName}</span>.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-3 self-start lg:mt-0">
          <span className="inline-flex h-5 items-center gap-2 rounded-full border border-[var(--c-clay)] bg-transparent px-2.5 text-[12px] font-semibold text-[var(--c-clay)]">
            <span className="size-1.5 rounded-full bg-[#dce5cd]" />
            {statsPending} pending
          </span>

          <span className="inline-flex h-5 items-center gap-2 rounded-full border border-[var(--c-sage)] bg-transparent px-2.5 text-[12px] font-semibold text-[var(--c-sage)]">
            <span className="size-1.5 rounded-full bg-[var(--c-sage)]" />
            {approvedThisMonth} approved this month
          </span>
        </div>
      </header>

      {/* ====================================================================== */}
      {/* KPI ROW                                                                */}
      {/* ====================================================================== */}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="flex min-h-[96px] flex-col rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--paper)] p-4 shadow-[var(--shadow-xs)]"
            >
              <div className="flex items-start justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </div>
              <div className="mt-3">
                <Skeleton className="h-8 w-12" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4 mb-4">
          {/* Card 1 */}
          <div className="group flex min-h-[84px] items-center gap-3.5 rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--paper)] px-[18px] py-4 shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] ease-[var(--tn)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)]">
            <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl bg-[var(--c-clay-wash)] text-[var(--c-clay-text)] transition-transform duration-[var(--dur-fast)] group-hover:scale-105">
              <Clock className="h-[18px] w-[18px]" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <div className="text-[22px] font-bold leading-tight tracking-tight text-[var(--ink)]">{statsPending}</div>
              <div className="text-[13px] font-medium text-[var(--ink-soft)]">Pending</div>
            </div>
          </div>
          {/* Card 2 */}
          <div className="group flex min-h-[84px] items-center gap-3.5 rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--paper)] px-[18px] py-4 shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] ease-[var(--tn)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)]">
            <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl bg-[var(--c-sage-wash)] text-[var(--c-sage-text)] transition-transform duration-[var(--dur-fast)] group-hover:scale-105">
              <Check className="h-[18px] w-[18px]" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <div className="text-[22px] font-bold leading-tight tracking-tight text-[var(--ink)]">{statsReviewedYtd}</div>
              <div className="text-[13px] font-medium text-[var(--ink-soft)]">Reviewed YTD</div>
            </div>
          </div>
          {/* Card 3 */}
          <div className="group flex min-h-[84px] items-center gap-3.5 rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--paper)] px-[18px] py-4 shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] ease-[var(--tn)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)]">
            <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl bg-[var(--c-honey-wash)] text-[var(--c-honey-text)] transition-transform duration-[var(--dur-fast)] group-hover:scale-105">
              <RotateCcw className="h-[18px] w-[18px]" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <div className="text-[22px] font-bold leading-tight tracking-tight text-[var(--ink)]">{avgTurnaround}</div>
              <div className="text-[13px] font-medium text-[var(--ink-soft)]">Turn-around</div>
            </div>
          </div>
          {/* Card 4 */}
          <div className="group flex min-h-[84px] items-center gap-3.5 rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--paper)] px-[18px] py-4 shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] ease-[var(--tn)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)]">
            <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl bg-[var(--c-sage-wash)] text-[var(--c-sage-text)] transition-transform duration-[var(--dur-fast)] group-hover:scale-105">
              <BarChart2 className="h-[18px] w-[18px]" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <div className="text-[22px] font-bold leading-tight tracking-tight text-[var(--ink)]">{approvalRate}</div>
              <div className="text-[13px] font-medium text-[var(--ink-soft)]">Approval rate</div>
            </div>
          </div>
        </div>
      )}
      {/* ====================================================================== */}
      {/* SCOPE BANNER                                                            */}
      {/* ====================================================================== */}

      <ReviewScopeBanner />

      {/* ====================================================================== */}
      {/* MAIN WORKSPACE                                                          */}
      {/* ====================================================================== */}

      <div className="grid grid-cols-1 items-start gap-[var(--space-6)] xl:grid-cols-[minmax(0,1fr)_320px]">

        {/* ==================================================================== */}
        {/* LEFT COLUMN                                                           */}
        {/* ==================================================================== */}

        <div className="min-w-0 space-y-[var(--space-4)]">

          {/* ------------------------------------------------------------------ */}
          {/* QUEUE                                                               */}
          {/* ------------------------------------------------------------------ */}

          <div className="rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--paper)] shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] ease-[var(--tn)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)]">

            {/* -------------------------------------------------------------- */}
            {/* TAB HEADER                                                       */}
            {/* -------------------------------------------------------------- */}

            <div className="flex flex-row items-end justify-between gap-3 border-b border-[var(--line)] px-5 pt-3">
              <div className="flex-1 overflow-x-auto custom-scrollbar">
                <ReviewQueueTabs
                  inboxCount={inboxCount}
                  inProgressCount={
                    inProgressCount
                  }
                  reviewedCount={
                    reviewedCount
                  }
                  activeTab={activeTab}
                  onTabChange={setTab}
                />
              </div>

              <div className="relative inline-flex shrink-0 mb-3">
                              <button
                                type="button"
                                onClick={() => setPriorityOpen((prev) => !prev)}
                                className="inline-flex h-10 min-w-[150px] items-center justify-between rounded-[var(--r-md)] border border-[var(--line-strong)] bg-[var(--paper)] px-[14px] font-[var(--font-sans)] text-[var(--fs-body)] font-medium text-[var(--ink)] outline-none transition-[border-color,box-shadow] duration-[var(--dur-fast)] hover:border-[var(--ink-mute)] focus:border-[var(--c-honey-text)] focus:ring-2 focus:ring-[var(--c-honey-wash)]"
                                aria-haspopup="listbox"
                                aria-expanded={priorityOpen}
                              >
                                <span>
                                  {selectedPriority === "all"
                                    ? "All priorities"
                                    : selectedPriority === "overdue_first"
                                      ? "Overdue first"
                                      : "Newest first"}
                                </span>

                                <ChevronDown
                                  className={`ml-3 h-[14px] w-[14px] shrink-0 text-[var(--ink-mute)] transition-transform duration-[var(--dur-fast)] ${priorityOpen ? "rotate-180" : ""
                                    }`}
                                />
                              </button>

                              {priorityOpen && (
                                <div
                                  className="absolute left-0 top-[calc(100%+4px)] z-50 min-w-full overflow-hidden rounded-[var(--r-md)] border border-[var(--line-strong)] bg-[var(--paper)] p-1 shadow-[0_4px_14px_rgba(17,17,17,0.08)]"
                                  role="listbox"
                                >
                                  {[
                                    { value: "all", label: "All priorities" },
                                    { value: "overdue_first", label: "Overdue first" },
                                    { value: "newest_first", label: "Newest first" },
                                  ].map((option) => {
                                    const isActive = selectedPriority === option.value;

                                    return (
                                      <button
                                        key={option.value}
                                        type="button"
                                        role="option"
                                        aria-selected={isActive}
                                        onClick={() => {
                                          setSelectedPriority(option.value);
                                          setPriorityOpen(false);
                                        }}
                                        className={`flex w-full whitespace-nowrap items-center rounded-[calc(var(--r-md)-4px)] px-3 py-2 text-left text-[var(--fs-body)] font-medium transition-colors ${isActive
                                            ? "bg-[var(--c-honey-wash)] text-[var(--c-honey-text)]"
                                            : "text-[var(--ink)] hover:bg-[var(--c-honey-wash)]"
                                          }`}
                                      >
                                        {option.label}
                                      </button>
                                    );
                                  })}
                                </div>

                              )}
                            </div>
            </div>

            {/* ================================================================ */}
            {/* IN PROGRESS                                                       */}
            {/* ================================================================ */}

            {/* ================================================================ */}
            {/* TAB CONTENT                                                      */}
            {/* ================================================================ */}

            <div className="flex flex-col gap-3 border-b border-[var(--line)] bg-[var(--paper)] px-5 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div className="flex w-full flex-wrap pb-2 sm:pb-0 items-center gap-2 sm:w-auto">
                    <div className="relative inline-flex">
                    <button
                      type="button"
                      onClick={() => { setSubjectOpen(prev => !prev); setVisibilityOpen(false); setPriorityOpen(false); }}
                      className="inline-flex h-8 min-w-[140px] items-center justify-between rounded-[var(--r-md)] border border-[var(--line-strong)] bg-white px-3 font-[var(--font-sans)] text-[var(--fs-label)] font-[var(--fw-semibold)] text-[var(--ink-soft)] outline-none transition-[border-color,box-shadow] duration-[var(--dur-fast)] hover:border-[var(--line-strong)] focus:border-[var(--c-honey-text)] focus:ring-2 focus:ring-[var(--c-honey-wash)]"
                      aria-haspopup="listbox"
                      aria-expanded={subjectOpen}
                    >
                      <span>
                        {selectedSubject === "all" ? "All subjects" : selectedSubject}
                      </span>
                      <ChevronDown
                        className={`ml-2 h-3 w-3 shrink-0 text-[var(--ink-mute)] transition-transform duration-[var(--dur-fast)] ${subjectOpen ? "rotate-180" : ""
                          }`}
                      />
                    </button>

                    {subjectOpen && (
                      <div
                        className="absolute left-0 top-[calc(100%+4px)] z-50 min-w-[200px] overflow-hidden  border border-[var(--line-strong)] bg-[var(--paper)] p-1 shadow-[0_4px_14px_rgba(17,17,17,0.08)] max-h-[300px] overflow-y-auto custom-scrollbar"
                        role="listbox"
                      >
                        {[{ value: "all", label: "All subjects" }, ...uniqueSubjects.map(s => ({ value: s, label: s }))].map((option) => {
                          const isActive = selectedSubject === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              role="option"
                              aria-selected={isActive}
                              onClick={() => {
                                setSelectedSubject(option.value);
                                setSubjectOpen(false);
                              }}
                              className={`flex w-full items-center whitespace-normal rounded-[calc(var(--r-md)-4px)] px-3 py-1.5 text-left text-[var(--fs-body)] font-medium transition-colors ${isActive
                                  ? "bg-[var(--c-honey-wash)] text-[var(--c-honey-text)]"
                                  : "text-[var(--ink)] hover:bg-[var(--c-honey-wash)]"
                                }`}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="relative inline-flex">
                    <button
                      type="button"
                      onClick={() => { setVisibilityOpen(prev => !prev); setSubjectOpen(false); setPriorityOpen(false); }}
                      className="inline-flex h-8 min-w-[140px] items-center justify-between rounded-[var(--r-md)] border border-[var(--line-strong)] bg-white px-3 font-[var(--font-sans)] text-[var(--fs-label)] font-[var(--fw-semibold)] text-[var(--ink-soft)] outline-none transition-[border-color,box-shadow] duration-[var(--dur-fast)] hover:border-[var(--line-strong)] focus:border-[var(--c-honey-text)] focus:ring-2 focus:ring-[var(--c-honey-wash)]"
                      aria-haspopup="listbox"
                      aria-expanded={visibilityOpen}
                    >
                      <span>
                        {selectedVisibility === "all" ? "All visibility" : selectedVisibility}
                      </span>
                      <ChevronDown
                        className={`ml-2 h-3 w-3 shrink-0 text-[var(--ink-mute)] transition-transform duration-[var(--dur-fast)] ${visibilityOpen ? "rotate-180" : ""
                          }`}
                      />
                    </button>

                    {visibilityOpen && (
                      <div
                        className="absolute left-0 top-[calc(100%+4px)] z-50 min-w-[160px] overflow-hidden rounded-[var(--r-md)] border border-[var(--line-strong)] bg-[var(--paper)] p-1 shadow-[0_4px_14px_rgba(17,17,17,0.08)]"
                        role="listbox"
                      >
                        {[
                          { value: "all", label: "All visibility" },
                          { value: "Public", label: "Public" },
                          { value: "Tenant", label: "Tenant" },
                          { value: "Public & Tenant", label: "Public & Tenant" },
                        ].map((option) => {
                          const isActive = selectedVisibility === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              role="option"
                              aria-selected={isActive}
                              onClick={() => {
                                setSelectedVisibility(option.value);
                                setVisibilityOpen(false);
                              }}
                              className={`flex w-full items-center whitespace-nowrap rounded-[calc(var(--r-md)-4px)] px-3 py-1.5 text-left text-[var(--fs-body)] font-medium transition-colors ${isActive
                                  ? "bg-[var(--c-honey-wash)] text-[var(--c-honey-text)]"
                                  : "text-[var(--ink)] hover:bg-[var(--c-honey-wash)]"
                                }`}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <label className="inline-flex h-8 cursor-pointer select-none items-center gap-2 rounded-[var(--r-md)] px-2 text-[var(--fs-label)] font-[var(--fw-semibold)] text-[var(--ink-soft)] transition-colors hover:bg-[var(--paper-2)]">
                    <input
                      type="checkbox"
                      checked={overdueOnly}
                      onChange={(event) => setOverdueOnly(event.target.checked)}
                      className="size-3.5 rounded border-[var(--line-strong)] accent-[var(--c-honey)]"
                    />
                    <span>Overdue only</span>
                  </label>
                </div>

                <span className="text-[var(--fs-micro)] font-[var(--fw-semibold)] text-[var(--ink-mute)]">
                  {filteredItems.length} of {currentTabItems.length}
                </span>
              </div>

            {isLoading ? (
              <div className="p-5 space-y-4">
                {[1, 2, 3, 4, 5].map((item) => (
                  <Skeleton key={item} className="h-16 w-full rounded-[var(--r-md)]" />
                ))}
              </div>
            ) : (
              <>
                {activeTab === "pending" ? (
                  <ReviewQueueTable
                    items={paginatedItems}
                    onReview={handleReview}
                    onTitleClick={handleTitleClick}
                    activeTab={activeTab}
                    title=""
                  />
                ) : (
                  <div className="flex flex-col bg-[var(--paper)] p-5">
                    {paginatedItems.map((item, index) => {
                      const isApproved = item.status === "APPROVED";
                      const isRejected = item.status === "REJECTED";
                      const isInProgress = activeTab === "in_progress";

                      const abbrevSubmitter = (() => {
                        const name = item.submittedBy || "";
                        const parts = name.split(" ");
                        if (parts.length <= 1) return parts[0] || "Unknown";
                        return `${parts[0][0]}. ${parts[parts.length - 1]}`;
                      })();

                      return (
                        <div key={item.id || index} className="mb-3 group relative overflow-hidden flex flex-col gap-4 rounded-[var(--r-md)] border border-[var(--line)] bg-white p-4 transition-all duration-[var(--dur-base)] ease-[var(--tn)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-xs)] hover:bg-[var(--paper-2)] sm:flex-row sm:items-center sm:justify-between">
                          {isInProgress && (
                            <div className="absolute inset-y-0 left-0 w-1 bg-[#c89831]" />
                          )}

                          <div className="flex min-w-0 flex-1 items-center gap-4">
                            <ThumbnailImage thumbnailAssetId={item.thumbnailAssetId} title={item.title} />

                            {isInProgress && (
                              <div className="flex size-[30px] shrink-0 items-center justify-center rounded-md bg-[#fef3c7] text-[#92400e]">
                                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </div>
                            )}

                            {!isInProgress && isApproved && (
                              <div className="flex size-[30px] shrink-0 items-center justify-center rounded-md bg-[#dcfce7] text-[#166534]">
                                <Check className="size-4" strokeWidth={2.5} />
                              </div>
                            )}

                            {!isInProgress && isRejected && (
                              <div className="flex size-[30px] shrink-0 items-center justify-center rounded-md bg-[#fee2e2] text-[#991b1b]">
                                <X className="size-4" strokeWidth={2.5} />
                              </div>
                            )}

                            <div className="min-w-0 space-y-0.5">
                              <h4
                                onClick={() => handleTitleClick(item)}
                                className="cursor-pointer text-[16px] font-[var(--fw-bold)] leading-tight text-[var(--ink)] transition-colors hover:text-[var(--c-honey-text)]"
                              >
                                {item.title}
                              </h4>

                              <div className="flex flex-wrap items-center gap-1.5 text-[12px] font-medium text-[var(--ink-soft)]">
                                <span>{abbrevSubmitter}</span>
                                <span className="text-[var(--ink-mute)]">·</span>
                                <span>{item.submittedDate}, {item.timestamp}</span>
                                <span className="text-[var(--ink-mute)]">·</span>
                                <span>{item.lessonsDetail || "8 lessons"}</span>
                                <span className="text-[var(--ink-mute)]">·</span>
                                <span>{item.duration || "5h"}</span>

                                {item.type && (
                                  <span className="ml-1 inline-flex items-center rounded-full border border-[#94a3b8] px-2 py-0.5 text-[10px] font-medium text-[#475569]">
                                    {item.type} {item.typeTag ? `· ${item.typeTag}` : ""}
                                  </span>
                                )}
                              </div>

                              {item.subject && (
                                <div className="text-[12px] text-[var(--ink-mute)] mt-0.5">
                                  {isInProgress ? `Path: ${item.subject}` : item.subject}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex shrink-0 flex-col items-end gap-2">
                            {isInProgress && (
                              <span className="inline-flex h-6 items-center gap-1.5 rounded-full border border-[#c89831] px-2.5 text-[10px] font-bold text-[#c89831] bg-[#fffbf0]">
                                <span className="size-1.5 rounded-full bg-[#c89831]" />
                                Under Review
                              </span>
                            )}

                            {!isInProgress && isApproved && (
                              <span className="inline-flex h-6 items-center gap-1.5 rounded-full border border-[#166534] bg-white px-2.5 text-[10px] font-bold text-[#166534]">
                                <span className="size-1.5 rounded-full bg-[#166534]" />
                                Approved
                              </span>
                            )}

                            {!isInProgress && isRejected && (
                              <span className="inline-flex h-6 items-center gap-1.5 rounded-full border border-[#991b1b] bg-[#fff5f5] px-2.5 text-[10px] font-bold text-[#991b1b]">
                                <span className="size-1.5 rounded-full bg-[#991b1b]" />
                                Rejected
                              </span>
                            )}

                            {isInProgress ? (
                              <button
                                type="button"
                                onClick={() => handleReview(item)}
                                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full bg-[#fef08a] px-4 text-[12px] font-bold text-[#422006] transition-colors hover:bg-[#fde047]"
                              >
                                Continue
                                <span aria-hidden="true">→</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleReview(item)}
                                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-[var(--line)] bg-white px-4 text-[12px] font-bold text-[var(--ink)] transition-colors hover:bg-[var(--paper-2)]"
                              >
                                View
                                <span aria-hidden="true">→</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {filteredItems.length === 0 && (
                  <div className="border-t border-[var(--line)] bg-white px-5 py-10 text-center text-[var(--fs-label)] font-[var(--fw-semibold)] text-[var(--ink-mute)]">
                    {activeTab === "in_progress"
                      ? "No items currently in progress."
                      : activeTab === "reviewed"
                        ? "No reviewed items found."
                        : "No items in review queue matching filter."}
                  </div>
                )}
              </>
            )}
          </div>


          {/* ================================================================ */}
          {/* UNIVERSAL PAGINATION FOOTER                                      */}
          {/* ================================================================ */}

          {filteredItems.length > 0 && (
            <div className="flex flex-col gap-2 bg-[var(--paper)] px-5 py-3 text-[var(--fs-micro)] font-[var(--fw-bold)] text-[var(--ink-mute)] sm:flex-row sm:items-center sm:justify-end">
              <div className="flex items-center gap-4">
                {pastDueCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-[var(--c-danger)]">
                    <AlertTriangle className="size-3.5" />
                    {pastDueCount} past due
                  </span>
                )}
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--line)] bg-white text-[var(--ink-soft)] hover:bg-[var(--paper-2)] disabled:opacity-50 disabled:pointer-events-none"
                    >
                      <ChevronLeft className="size-4" />
                    </button>
                    <span className="text-[12px] font-[var(--fw-bold)] text-[var(--ink)]">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--line)] bg-white text-[var(--ink-soft)] hover:bg-[var(--paper-2)] disabled:opacity-50 disabled:pointer-events-none"
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/* QUEUE AGING                                                        */}
          {/* ================================================================== */}

          <div
            className="rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--paper)] p-5 shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] ease-[var(--tn)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)]"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] pb-4">
              <h3
                className="m-0 text-[var(--ink)]"
                style={{
                  fontSize: "16px",
                  fontWeight: "var(--fw-bold)" as any,
                  fontFamily: "var(--font-sans)",
                }}
              >
                Queue aging
              </h3>

              <span
                className="inline-flex h-7 items-center rounded-full border border-[var(--line)] bg-transparent px-3 text-[12px] font-[var(--fw-semibold)] text-[var(--ink-soft)]"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                By due date
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              {/* Due Soon */}
              <div className="flex min-w-0 flex-col items-start justify-center rounded-[var(--r-md)] border border-[var(--line)] bg-white px-4 py-4 shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] ease-[var(--tn)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)]">
                <div className="mb-3 flex size-7 items-center justify-center rounded-md bg-[var(--c-sage-wash)] text-[var(--c-sage-text)]">
                  <Clock className="size-4" />
                </div>

                <span className="text-[22px] font-[var(--fw-bold)] leading-none text-[var(--ink)]">
                  {dueSoonCount}
                </span>

                <span className="mt-2 text-[11px] font-[var(--fw-bold)] uppercase tracking-[0.06em] text-[var(--ink)]">
                  Due soon
                </span>

                <span className="mt-1 text-[12px] text-[var(--ink-soft)]">
                  0-2 days
                </span>
              </div>

              {/* This Week */}
              <div className="flex min-w-0 flex-col items-start justify-center rounded-[var(--r-md)] border border-[var(--line)] bg-white px-4 py-4 shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] ease-[var(--tn)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)]">
                <div className="mb-3 flex size-7 items-center justify-center rounded-md bg-[var(--c-honey-wash)] text-[var(--c-honey-text)]">
                  <Calendar className="size-4" />
                </div>

                <span className="text-[22px] font-[var(--fw-bold)] leading-none text-[var(--ink)]">
                  {thisWeekCount}
                </span>

                <span className="mt-2 text-[11px] font-[var(--fw-bold)] uppercase tracking-[0.06em] text-[var(--ink)]">
                  This week
                </span>

                <span className="mt-1 text-[12px] text-[var(--ink-soft)]">
                  2-5 days
                </span>
              </div>

              {/* Past Due */}
              <div className="flex min-w-0 flex-col items-start justify-center rounded-[var(--r-md)] border border-[var(--line)] bg-white px-4 py-4 shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] ease-[var(--tn)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)]">
                <div className="mb-3 flex size-7 items-center justify-center rounded-md bg-[var(--c-clay-wash)] text-[var(--c-clay-text)]">
                  <AlertTriangle className="size-4" />
                </div>

                <span className="text-[22px] font-[var(--fw-bold)] leading-none text-[var(--c-danger)]">
                  {pastDueCount}
                </span>

                <span className="mt-2 text-[11px] font-[var(--fw-bold)] uppercase tracking-[0.06em] text-[var(--ink)]">
                  Past due
                </span>

                <span className="mt-1 text-[12px] text-[var(--ink-soft)]">
                  Overdue
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* RIGHT RAIL                                                           */}
        {/* ==================================================================== */}

        <aside className="space-y-6 xl:sticky xl:top-6">

          {/* ================================================================== */}
          {/* REVIEW VELOCITY                                                    */}
          {/* ================================================================== */}

          <div
            className="space-y-5 rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--paper)] px-6 shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] ease-[var(--tn)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)]"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            <div
              className="mx-[-24px] flex items-center justify-between border-b border-[var(--line)] px-[22px] py-4"
            >
              <h3
                className="m-0 text-[var(--ink)]"
                style={{
                  fontSize: "16px",
                  fontWeight: "var(--fw-bold)" as any,
                  fontFamily: "var(--font-sans)",
                }}
              >
                Review velocity
              </h3>

              <span
                className="inline-flex h-7 items-center rounded-full border border-[var(--line)] bg-transparent px-3 text-[12px] font-[var(--fw-semibold)] text-[var(--ink-soft)]"
                style={{
                  fontFamily: "var(--font-sans)",
                }}
              >
                30 days
              </span>
            </div>

            <div className="h-28 w-full">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={weekData}
                  barGap={4}
                >
                  <Tooltip
                    cursor={{
                      fill: "transparent",
                    }}
                  />

                  <Bar
                    dataKey="Approved"
                    fill="var(--c-sage)"
                    radius={[
                      3,
                      3,
                      0,
                      0,
                    ]}
                  />

                  <Bar
                    dataKey="Returned"
                    fill="#dce5cd"
                    radius={[
                      3,
                      3,
                      0,
                      0,
                    ]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex py-2 flex-wrap items-center gap-4 text-[12px] font-medium text-[var(--ink-soft)]">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[var(--c-sage)]" />
                <span>
                  Approved (
                  {
                    reviewedItems.filter(
                      (item) =>
                        item.status ===
                        "APPROVED"
                    ).length
                  }
                  )
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#dce5cd]" />
                <span>
                  Returned (
                  {
                    reviewedItems.filter(
                      (item) =>
                        item.status ===
                        "REJECTED"
                    ).length
                  }
                  )
                </span>
              </div>
            </div>
          </div>

          {/* ================================================================== */}
          {/* OPEN DISCUSSIONS                                                   */}
          {/* ================================================================== */}

          <div
            className="flex flex-col rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--paper)] shadow-[var(--shadow-xs)] overflow-hidden transition-all duration-[var(--dur-base)] ease-[var(--tn)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)]"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            <div className="border-b border-[var(--line)] px-6 py-5">
              <h3
                className="m-0 text-[var(--ink)]"
                style={{
                  fontSize: "16px",
                  fontWeight: "var(--fw-bold)" as any,
                  fontFamily: "var(--font-sans)",
                }}
              >
                Open discussions
              </h3>
            </div>

            {discussions.length > 0 ? (
              <div className="divide-y divide-[var(--line)]">
                {discussions.slice(0, 2).map((discussion, index) => {
                  const name = discussion.user ? `${discussion.user.firstName || ""} ${discussion.user.lastName || ""}`.trim() : "";
                  const parts = name.split(" ");
                  const abbrevAuthor = !name ? "Unknown" : parts.length === 1 ? parts[0] : `${parts[0][0]}. ${parts[parts.length - 1]}`;
                  return (
                    <div key={discussion.id || index} className="group flex items-start justify-between gap-4 px-6 py-5 transition-colors duration-[var(--dur-fast)] hover:bg-[var(--paper-2)]">
                      <div className="flex min-w-0 items-start gap-4">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--c-honey-wash)] text-[var(--c-honey)]">
                          <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="min-w-0 space-y-1">
                          <div className="truncate text-sm font-semibold text-[var(--ink)]">
                            {abbrevAuthor}: {discussion.message}
                          </div>
                          <div className="truncate text-[12px] font-medium text-[var(--ink-soft)]">
                            {discussion.subject ? `${discussion.subject} · ` : ""}
                            {discussion.title}
                          </div>
                        </div>
                      </div>
                      <button type="button" onClick={() => handleReview(discussion.item)} className="mt-1 shrink-0 text-[12px] font-bold text-[var(--ink)] transition-colors hover:text-[var(--c-honey-text)]">
                        Reply
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-[13px] text-[var(--ink-mute)]">
                No open discussions
              </div>
            )}
          </div>
          {/* ================================================================== */}
          {/* YOUR STATS                                                         */}
          {/* ================================================================== */}

          <div
            className="flex flex-col rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--paper)] shadow-[var(--shadow-xs)] overflow-hidden transition-all duration-[var(--dur-base)] ease-[var(--tn)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)]"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            <div className="flex items-center justify-between border-b border-[var(--line)] px-6 py-5">
              <h3
                className="m-0 text-[var(--ink)]"
                style={{
                  fontSize: "16px",
                  fontWeight: "var(--fw-bold)" as any,
                  fontFamily: "var(--font-sans)",
                }}
              >
                Your stats
              </h3>

              <span
                className="inline-flex h-7 items-center rounded-full border border-[var(--line)] bg-transparent px-3 text-[12px] font-[var(--fw-semibold)] text-[var(--ink-soft)]"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {new Date().toLocaleString("en-US", { month: "long", year: "numeric" })}
              </span>
            </div>

            <div className="flex flex-col text-sm">
              <div className="flex items-center justify-between border-b border-[var(--line)] bg-white px-6 py-4 transition-colors duration-[var(--dur-fast)] hover:bg-[var(--paper-2)]">
                <span className="font-semibold text-[var(--ink)]">Approved this month</span>
                <span className="font-bold text-base text-[var(--ink-soft)]">{approvedThisMonth}</span>
              </div>
              <div className="flex items-center justify-between border-b border-[var(--line)] bg-white px-6 py-4 transition-colors duration-[var(--dur-fast)] hover:bg-[var(--paper-2)]">
                <span className="font-semibold text-[var(--ink)]">Avg turn-around</span>
                <span className="font-bold text-base text-[var(--ink-soft)]">{avgTurnaround}</span>
              </div>
              <div className="flex items-center justify-between border-b border-[var(--line)] bg-white px-6 py-4 transition-colors duration-[var(--dur-fast)] hover:bg-[var(--paper-2)]">
                <span className="font-semibold text-[var(--ink)]">Approval rate</span>
                <span className="font-bold text-base text-[var(--ink-soft)]">{approvalRate}</span>
              </div>
              <div className="flex items-center justify-between border-b border-[var(--line)] bg-white px-6 py-4 transition-colors duration-[var(--dur-fast)] hover:bg-[var(--paper-2)]">
                <span className="font-semibold text-[var(--ink)]">Reviewed this week</span>
                <span className="font-bold text-base text-[var(--ink-soft)]">{reviewedThisWeek}</span>
              </div>
              <div className="flex items-center justify-between border-b border-[var(--line)] bg-white px-6 py-4 transition-colors duration-[var(--dur-fast)] hover:bg-[var(--paper-2)]">
                <span className="font-semibold text-[var(--ink)]">On-time rate</span>
                <span className="font-bold text-base text-[var(--ink-soft)]">{onTimeRate}</span>
              </div>
              <div className="flex items-center justify-between border-b border-[var(--line)] bg-white px-6 py-4 transition-colors duration-[var(--dur-fast)] hover:bg-[var(--paper-2)]">
                <span className="font-semibold text-[var(--ink)]">Oldest pending</span>
                <span className="font-bold text-base text-[var(--ink-soft)]">{oldestPendingText}</span>
              </div>
              <div className="flex items-center justify-between bg-white px-6 py-4 transition-colors duration-[var(--dur-fast)] hover:bg-[var(--paper-2)]">
                <span className="font-semibold text-[var(--ink)]">Domains covered</span>
                <span className="max-w-[130px] truncate text-right font-bold text-base text-[var(--ink-soft)]">{domainsCoveredText}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* ====================================================================== */}
      {/* REVISION HISTORY MODAL                                                 */}
      {/* ====================================================================== */}

      {historyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--scrim)] p-4 backdrop-blur-[2px]">
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-[var(--r-md)] border border-[var(--line)] bg-white shadow-[var(--shadow-lg)]">

            {/* ---------------------------------------------------------------- */}
            {/* MODAL HEADER                                                     */}
            {/* ---------------------------------------------------------------- */}

            <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] px-5 py-4">
              <div className="min-w-0">
                <h3 className="text-base font-[var(--fw-bold)] text-[var(--ink)]">
                  Revision history
                </h3>

                <p className="mt-1 truncate text-[var(--fs-label)] text-[var(--ink-mute)]">
                  {
                    selectedHistoryItem?.title
                  }
                </p>
              </div>

              <button
                type="button"
                aria-label="Close revision history"
                onClick={() =>
                  setHistoryModalOpen(
                    false
                  )
                }
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-[var(--r-sm)] border border-[var(--line)] bg-[var(--paper)] text-[var(--ink-mute)] transition-all duration-[var(--dur-fast)] hover:border-[var(--line-strong)] hover:bg-[var(--paper-2)] hover:text-[var(--ink)] active:scale-[0.96]"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* ---------------------------------------------------------------- */}
            {/* MODAL BODY                                                       */}
            {/* ---------------------------------------------------------------- */}

            <div className="flex-1 overflow-y-auto bg-[var(--paper)] p-5">
              {isLoadingHistory ? (
                <div className="space-y-6">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <Skeleton className="size-8 rounded-full" />
                        <Skeleton className="h-full w-0.5 mt-2 flex-1 min-h-[40px]" />
                      </div>
                      <div className="flex-1 pb-6">
                        <Skeleton className="h-4 w-1/3 mb-2" />
                        <Skeleton className="h-12 w-full rounded-[var(--r-md)]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !historyData?.reviews ||
                historyData.reviews
                  .length === 0 ? (
                <div className="py-12 text-center text-[var(--fs-label)] font-[var(--fw-medium)] text-[var(--ink-mute)]">
                  No revision history
                  found.
                </div>
              ) : (
                <div className="space-y-3">
                  {historyData.reviews.map(
                    (
                      review: any,
                      index: number
                    ) => {
                      const isLatest =
                        index === 0;

                      const statusClass =
                        review.status ===
                          "APPROVED"
                          ? "border-[var(--c-sage-soft)] bg-[var(--c-sage-wash)] text-[var(--c-sage-text)]"
                          : review.status ===
                            "REJECTED"
                            ? "border-[var(--c-clay-soft)] bg-[var(--c-clay-wash)] text-[var(--c-clay-text)]"
                            : "border-[var(--c-honey-soft)] bg-[var(--c-honey-wash)] text-[var(--c-honey-text)]";

                      return (
                        <div
                          key={
                            review.id ||
                            index
                          }
                          className={`rounded-[var(--r-md)] border bg-white p-4 shadow-[var(--shadow-xs)] ${isLatest
                              ? "border-[var(--c-honey)] ring-1 ring-[var(--c-honey-wash)]"
                              : "border-[var(--line)]"
                            }`}
                        >
                          {/* Status row */}
                          <div className="mb-4 flex items-start justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`inline-flex h-7 items-center rounded-[var(--r-pill)] border px-2.5 text-[10px] font-[var(--fw-bold)] uppercase tracking-[0.08em] ${statusClass}`}
                              >
                                {
                                  review.status
                                }
                              </span>

                              {isLatest && (
                                <span className="inline-flex h-7 items-center rounded-[var(--r-pill)] bg-[var(--c-honey-wash)] px-2.5 text-[10px] font-[var(--fw-bold)] uppercase tracking-[0.08em] text-[var(--c-honey-text)]">
                                  Latest
                                </span>
                              )}
                            </div>

                            <div className="shrink-0 text-right">
                              <div className="text-[var(--fs-micro)] font-[var(--fw-bold)] text-[var(--ink-soft)]">
                                {new Date(
                                  review.submittedAt
                                ).toLocaleDateString()}
                              </div>

                              <div className="mt-0.5 text-[10px] text-[var(--ink-mute)]">
                                {new Date(
                                  review.submittedAt
                                ).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>

                          {/* People */}
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                              <div className="mb-1 text-[10px] font-[var(--fw-bold)] uppercase tracking-[0.08em] text-[var(--ink-mute)]">
                                Submitted by
                              </div>

                              <div className="text-[var(--fs-label)] font-[var(--fw-semibold)] text-[var(--ink)]">
                                {review.submittedBy
                                  ?.firstName
                                  ? `${review.submittedBy.firstName} ${review.submittedBy.lastName ||
                                  ""
                                  }`
                                  : review
                                    .submittedBy
                                    ?.email ||
                                  "Author"}
                              </div>
                            </div>

                            {review.reviewedAt && (
                              <div>
                                <div className="mb-1 text-[10px] font-[var(--fw-bold)] uppercase tracking-[0.08em] text-[var(--ink-mute)]">
                                  Reviewed by
                                </div>

                                <div className="text-[var(--fs-label)] font-[var(--fw-semibold)] text-[var(--ink)]">
                                  {review.resolvedBy
                                    ?.firstName
                                    ? `${review.resolvedBy.firstName} ${review.resolvedBy.lastName ||
                                    ""
                                    }`
                                    : review
                                      .resolvedBy
                                      ?.email ||
                                    "Reviewer"}
                                </div>

                                <div className="mt-0.5 text-[10px] text-[var(--ink-mute)]">
                                  {new Date(
                                    review.reviewedAt
                                  ).toLocaleDateString()}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Comment */}
                          {review.comment && (
                            <div className="mt-4 rounded-[var(--r-sm)] border border-[var(--line)] bg-[var(--paper-2)] p-3">
                              <div className="mb-1 text-[10px] font-[var(--fw-bold)] uppercase tracking-[0.08em] text-[var(--ink-mute)]">
                                Reviewer comment
                              </div>

                              <p className="text-[var(--fs-label)] leading-[var(--lh-body)] text-[var(--ink-soft)] italic">
                                "{review.comment}"
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default SubjectMatterReviewQueue;