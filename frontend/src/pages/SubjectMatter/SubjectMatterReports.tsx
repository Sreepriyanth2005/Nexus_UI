import React, { useMemo, useState } from "react";
import { Clock, CheckSquare, RefreshCw, BarChart2 } from "lucide-react";
import { useUserStore } from "../../store/user.store";
import { useProfileStore } from "../../store/profile.store";
import {useReviewQueue,useReviewQueueStatistics,} from "../../hooks/review-queue/useSmeReviewQueue";

import ReportHeader from "../../components/sme-reports/ReportHeader";
import ReportFilters from "../../components/sme-reports/ReportFilters";
import ReportStatisticCard, {StatCardItem,} from "../../components/sme-reports/ReportStatisticCard";
import ReviewOutcomesCard from "../../components/sme-reports/ReviewOutcomesCard";
import TurnaroundByTypeCard from "../../components/sme-reports/TurnaroundByTypeCard";
import AvailableReports from "../../components/sme-reports/AvailableReports";
import { Skeleton } from "../../components/ui/Skeleton/Skeleton";

function downloadCSV(filename: string, rows: string[][]) {
  const csv = rows
    .map((r) =>
      r.map((c) => `"${(c || "").replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadExcel(filename: string, rows: string[][]) {
  const tsv = rows
    .map((r) =>
      r.map((c) => `"${(c || "").replace(/"/g, '""')}"`).join("\t")
    )
    .join("\n");
  const blob = new Blob(["\uFEFF" + tsv], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".xls") ? filename : `${filename}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}

function formatTurnaround(
  submittedAt?: string,
  reviewedAt?: string | null
): string {
  if (!submittedAt || !reviewedAt) return "";
  const start = new Date(submittedAt).getTime();
  const end = new Date(reviewedAt).getTime();
  if (isNaN(start) || isNaN(end) || end < start) return "";
  const totalMins = Math.floor((end - start) / (1000 * 60));
  const days = Math.floor(totalMins / (24 * 60));
  const hours = Math.floor((totalMins % (24 * 60)) / 60);
  const mins = totalMins % 60;
  if (days > 0) return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  if (hours > 0) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  return `${mins}m`;
}

export const SubjectMatterReports: React.FC = () => {
  const { user } = useUserStore();
  const { profile: storedProfile } = useProfileStore();

  const reviewerName = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Reviewer"
    : storedProfile?.profile?.firstName
      ? `${storedProfile.profile.firstName} ${
          storedProfile.profile.lastName || ""
        }`.trim() || "Reviewer"
      : "Reviewer";

  const reviewerId = user?.id || "";
  const { data: stats, isLoading: isLoadingStats } = useReviewQueueStatistics(reviewerId);
  const { data: queueData, isLoading: isLoadingQueue } = useReviewQueue(reviewerId);

  const today = new Date().toISOString().split("T")[0];
  const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [fromDate, setFromDate] = useState(threeMonthsAgo);
  const [toDate, setToDate] = useState(today);
  const [timeRange, setTimeRange] = useState("All time");

  const approvedCount = stats?.approved ?? 0;
  const pendingCount = stats?.pending ?? 0;
  const rejectedCount = stats?.rejected ?? 0;
  const approvedThisMonth = stats?.approvedThisMonth ?? 0;
  const totalDecisions = approvedCount + rejectedCount + pendingCount;
  const revisionCount = rejectedCount;

  const resolvedItems = useMemo(() => {
    return (queueData?.items || []).filter((i: any) => {
      const start = new Date(i.submittedAt || i.submittedDate).getTime();
      const end = new Date(i.reviewedAt || i.approvedDate).getTime();
      return !isNaN(start) && !isNaN(end) && end >= start;
    });
  }, [queueData]);

  const avgTurnaround = useMemo(() => {
    if (resolvedItems.length === 0) return 0;
    const totalDays = resolvedItems.reduce((acc: number, item: any) => {
      const start = new Date(item.submittedAt || item.submittedDate).getTime();
      const end = new Date(item.reviewedAt || item.approvedDate).getTime();
      return acc + (end - start) / (1000 * 60 * 60 * 24);
    }, 0);
    return Number((totalDays / resolvedItems.length).toFixed(1));
  }, [resolvedItems]);

  const turnaroundByType = useMemo(() => {
    const map: Record<string, { totalDays: number; count: number }> = {};
    resolvedItems.forEach((item: any) => {
      const typeKey = item.type || "Course";
      const start = new Date(item.submittedAt || item.submittedDate).getTime();
      const end = new Date(item.reviewedAt || item.approvedDate).getTime();
      const days = (end - start) / (1000 * 60 * 60 * 24);
      if (!map[typeKey]) map[typeKey] = { totalDays: 0, count: 0 };
      map[typeKey].totalDays += days;
      map[typeKey].count++;
    });
    const result: Record<string, number> = {};
    Object.entries(map).forEach(([key, value]) => {
      result[key] = Number((value.totalDays / value.count).toFixed(1));
    });
    return result;
  }, [resolvedItems]);

  const feedbackCount = useMemo(() => {
    if (!queueData?.items) return 0;
    return queueData.items.filter(
      (i: any) => i.comment && i.comment.trim()
    ).length;
  }, [queueData]);

  const approvedItems = () =>
    queueData?.items?.filter(
      (i: any) =>
        i.status === "APPROVED" ||
        i.rawStatus === "APPROVED" ||
        i.waitTime === "Approved"
    ) || [];

  const rejectedItems = () =>
    queueData?.items?.filter(
      (i: any) =>
        i.status === "REJECTED" ||
        i.rawStatus === "REJECTED" ||
        i.waitTime === "Rejected"
    ) || [];

  const pendingItems = () =>
    queueData?.items?.filter(
      (i: any) =>
        i.status === "PENDING" ||
        i.rawStatus === "PENDING" ||
        (i.waitTime !== "Approved" && i.waitTime !== "Rejected")
    ) || [];

  const handleQueueExport = (format: "csv" | "excel") => {
    if (!queueData?.items) return;
    const rows = [
      ["Title", "Type", "Status", "Submitted Date"],
      ...queueData.items.map((i: any) => [
        i.title || "",
        i.type || "",
        i.status || i.waitTime || "",
        i.submittedDate || i.submittedAt || "",
      ]),
    ];
    format === "csv"
      ? downloadCSV(`sme-report-${today}.csv`, rows)
      : downloadExcel(`sme-report-${today}.xls`, rows);
  };

  const exportBestPerformance = (format: "csv" | "excel") => {
    const items = approvedItems();
    const rows = [
      ["Title", "Type", "Status", "Submitted Date", "Reviewed Date", "Reviewer"],
      ...items.map((i: any) => [
        i.title || "",
        i.type || "",
        i.status || "APPROVED",
        i.submittedDate || i.submittedAt || "",
        i.approvedDate || i.reviewedAt || "",
        i.reviewerName || i.approvedBy || "",
      ]),
    ];
    format === "csv"
      ? downloadCSV(`best-performance-${today}.csv`, rows)
      : downloadExcel(`best-performance-${today}.xls`, rows);
  };

  const exportPendingReview = (format: "csv" | "excel") => {
    const rows = [
      ["Title", "Type", "Submitter", "Submitted Date", "Waiting Duration"],
      ...pendingItems().map((i: any) => [
        i.title || "",
        i.type || "",
        i.submitterName || i.submittedBy || "",
        i.submittedDate || i.submittedAt || "",
        i.waitTime || "",
      ]),
    ];
    format === "csv"
      ? downloadCSV(`pending-review-${today}.csv`, rows)
      : downloadExcel(`pending-review-${today}.xls`, rows);
  };

  const exportApprovedContent = (format: "csv" | "excel") => {
    const rows = [
      ["Title", "Type", "Submitted Date", "Approved Date", "Reviewer", "Status"],
      ...approvedItems().map((i: any) => [
        i.title || "",
        i.type || "",
        i.submittedDate || i.submittedAt || "",
        i.approvedDate || i.reviewedAt || "",
        i.reviewerName || i.approvedBy || "",
        i.status || "APPROVED",
      ]),
    ];
    format === "csv"
      ? downloadCSV(`approved-content-${today}.csv`, rows)
      : downloadExcel(`approved-content-${today}.xls`, rows);
  };

  const exportRevision = (format: "csv" | "excel") => {
    const rows = [
      [
        "Title",
        "Type",
        "Status",
        "Submitted Date",
        "Reviewed Date",
        "Rejection Reason / Comment",
      ],
      ...rejectedItems().map((i: any) => [
        i.title || "",
        i.type || "",
        i.status || "REJECTED",
        i.submittedDate || i.submittedAt || "",
        i.approvedDate || i.reviewedAt || "",
        i.comment || "",
      ]),
    ];
    format === "csv"
      ? downloadCSV(`revision-${today}.csv`, rows)
      : downloadExcel(`revision-${today}.xls`, rows);
  };

  const exportFeedback = (format: "csv" | "excel") => {
    const items =
      queueData?.items?.filter(
        (i: any) => i.comment && i.comment.trim()
      ) || [];
    const rows = [
      [
        "Content Title",
        "Reviewer",
        "Comment / Decision Note",
        "Decision",
        "Date",
      ],
      ...items.map((i: any) => [
        i.title || "",
        i.reviewerName || i.approvedBy || i.submittedBy || "",
        i.comment || "",
        i.status || i.waitTime || "",
        i.approvedDate || i.submittedDate || "",
      ]),
    ];
    format === "csv"
      ? downloadCSV(`sme-feedback-${today}.csv`, rows)
      : downloadExcel(`sme-feedback-${today}.xls`, rows);
  };

  const exportTurnaround = (format: "csv" | "excel") => {
    if (!queueData?.items) return;
    const rows = [
      [
        "Title",
        "Type",
        "Submitted Date",
        "Reviewed Date",
        "Turnaround Duration",
        "Status",
      ],
      ...queueData.items.map((i: any) => {
        const duration = formatTurnaround(
          i.submittedAt || i.submittedDate,
          i.reviewedAt || i.approvedDate
        );
        return [
          i.title || "",
          i.type || "",
          i.submittedDate || i.submittedAt || "",
          i.approvedDate || i.reviewedAt || "",
          duration,
          i.status || i.waitTime || "",
        ];
      }),
    ];
    format === "csv"
      ? downloadCSV(`turnaround-${today}.csv`, rows)
      : downloadExcel(`turnaround-${today}.xls`, rows);
  };

  const kpiCards: StatCardItem[] = [
    {
      label: "PENDING REVIEW",
      value: pendingCount,
      iconBg: "bg-[var(--c-clay-wash)] text-[var(--c-clay-text)]",
      icon: <Clock className="h-[18px] w-[18px] text-[var(--c-clay)]" strokeWidth={2} />,
    },
    {
      label: "APPROVED (30 DAYS)",
      value: approvedThisMonth,
      iconBg: "bg-[var(--c-sage-wash)] text-[var(--c-sage-text)]",
      icon: <CheckSquare className="h-[18px] w-[18px] text-[var(--c-sage)]" strokeWidth={2} />,
    },
    {
      label: "SENT FOR REVISION",
      value: revisionCount,
      iconBg: "bg-[var(--c-honey-wash)] text-[var(--c-honey-text)]",
      icon: <RefreshCw className="h-[18px] w-[18px] text-[var(--c-honey)]" strokeWidth={2} />,
    },
    {
      label: "AVG TURNAROUND",
      value: `${avgTurnaround}d`,
      iconBg: "bg-[var(--c-honey-wash)] text-[var(--c-honey-text)]",
      icon: <BarChart2 className="h-[18px] w-[18px] text-[var(--c-honey)]" strokeWidth={2} />,
    },
  ];

  return (
    <main
      className="w-full text-[var(--ink)]"
      style={{
        fontFamily: "var(--font-sans)",
        fontSize: "var(--fs-body)",
        lineHeight: "var(--lh-body)",
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
      }}
    >
      <div className="mx-auto flex w-full flex-col gap-6">
        <section>
          <ReportHeader
            reviewerName={reviewerName}
            onExportCsv={() => handleQueueExport("csv")}
            onExportExcel={() => handleQueueExport("excel")}
          />
        </section>

        <section>
          <ReportFilters
            fromDate={fromDate}
            toDate={toDate}
            timeRange={timeRange}
            onFromDateChange={setFromDate}
            onToDateChange={setToDate}
            onTimeRangeChange={setTimeRange}
          />
        </section>

        <section>
          <ReportStatisticCard cards={kpiCards} />
        </section>

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <ReviewOutcomesCard
              approvedCount={approvedCount}
              revisionCount={revisionCount}
              pendingCount={pendingCount}
              totalDecisions={totalDecisions}
            />
          </div>
          <div className="lg:col-span-7">
            <TurnaroundByTypeCard
              turnaroundByType={turnaroundByType}
              slaTargetDays={3.0}
            />
          </div>
        </section>

        <section>
          <AvailableReports
            approvedCount={approvedCount}
            pendingCount={pendingCount}
            revisionCount={revisionCount}
            feedbackCount={feedbackCount}
            totalDecisions={totalDecisions}
            avgTurnaroundDays={Math.round(avgTurnaround)}
            onBestPerformanceCsv={() => exportBestPerformance("csv")}
            onBestPerformanceExcel={() => exportBestPerformance("excel")}
            onPendingReviewCsv={() => exportPendingReview("csv")}
            onPendingReviewExcel={() => exportPendingReview("excel")}
            onApprovedContentCsv={() => exportApprovedContent("csv")}
            onApprovedContentExcel={() => exportApprovedContent("excel")}
            onRevisionCsv={() => exportRevision("csv")}
            onRevisionExcel={() => exportRevision("excel")}
            onSmeFeedbackCsv={() => exportFeedback("csv")}
            onSmeFeedbackExcel={() => exportFeedback("excel")}
            onTurnaroundCsv={() => exportTurnaround("csv")}
            onTurnaroundExcel={() => exportTurnaround("excel")}
          />
        </section>
      </div>
    </main>
  );
};

export default SubjectMatterReports;