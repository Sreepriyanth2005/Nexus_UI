import React from "react";
import ReportCard from "./ReportCard";
import {
  Award,
  Clock,
  CheckSquare,
  RefreshCw,
  MessageSquare,
  BarChart2,
} from "lucide-react";

interface AvailableReportsProps {
  approvedCount?: number;
  pendingCount?: number;
  revisionCount?: number;
  feedbackCount?: number;
  totalDecisions?: number;
  avgTurnaroundDays?: number;
  onBestPerformanceCsv: () => void;
  onBestPerformanceExcel: () => void;
  onPendingReviewCsv: () => void;
  onPendingReviewExcel: () => void;
  onApprovedContentCsv: () => void;
  onApprovedContentExcel: () => void;
  onRevisionCsv: () => void;
  onRevisionExcel: () => void;
  onSmeFeedbackCsv: () => void;
  onSmeFeedbackExcel: () => void;
  onTurnaroundCsv: () => void;
  onTurnaroundExcel: () => void;
}

export const AvailableReports: React.FC<AvailableReportsProps> = ({
  approvedCount,
  pendingCount,
  revisionCount,
  feedbackCount,
  avgTurnaroundDays,
  onBestPerformanceCsv,
  onBestPerformanceExcel,
  onPendingReviewCsv,
  onPendingReviewExcel,
  onApprovedContentCsv,
  onApprovedContentExcel,
  onRevisionCsv,
  onRevisionExcel,
  onSmeFeedbackCsv,
  onSmeFeedbackExcel,
  onTurnaroundCsv,
  onTurnaroundExcel,
}) => {
  const reports = [
    {
      iconBgClass: "bg-[var(--c-sage-wash)] text-[var(--c-sage-text)]",
      icon: <Award className="h-[18px] w-[18px] text-[var(--c-sage)]" />,
      title: "Best Performance Report",
      description: "Top-rated approved content by learner outcomes",
      count: approvedCount ?? 0,
      label: "ITEMS",
      csv: onBestPerformanceCsv,
      excel: onBestPerformanceExcel,
    },
    {
      iconBgClass: "bg-[var(--c-clay-wash)] text-[var(--c-clay-text)]",
      icon: <Clock className="h-[18px] w-[18px] text-[var(--c-clay)]" />,
      title: "Pending Review Report",
      description: "Content currently awaiting your review",
      count: pendingCount ?? 0,
      label: "ITEMS",
      csv: onPendingReviewCsv,
      excel: onPendingReviewExcel,
    },
    {
      iconBgClass: "bg-[var(--c-sage-wash)] text-[var(--c-sage-text)]",
      icon: <CheckSquare className="h-[18px] w-[18px] text-[var(--c-sage)]" />,
      title: "Approved Content Report",
      description: "Everything you approved, with dates and domains",
      count: approvedCount ?? 0,
      label: "ITEMS",
      csv: onApprovedContentCsv,
      excel: onApprovedContentExcel,
    },
    {
      iconBgClass: "bg-[var(--c-honey-wash)] text-[var(--c-honey-text)]",
      icon: <RefreshCw className="h-[18px] w-[18px] text-[var(--c-honey)]" />,
      title: "Revision / Resubmission Report",
      description: "Items returned for changes and resubmitted",
      count: revisionCount ?? 0,
      label: "ITEMS",
      csv: onRevisionCsv,
      excel: onRevisionExcel,
    },
    {
      iconBgClass: "bg-[var(--c-honey-wash)] text-[var(--c-honey-text)]",
      icon: <MessageSquare className="h-[18px] w-[18px] text-[var(--c-honey)]" />,
      title: "SME Comments / Feedback Report",
      description: "Comments and feedback left on submissions",
      count: feedbackCount ?? 0,
      label: "NOTES",
      csv: onSmeFeedbackCsv,
      excel: onSmeFeedbackExcel,
    },
    {
      iconBgClass: "bg-[var(--c-clay-wash)] text-[var(--c-clay-text)]",
      icon: <BarChart2 className="h-[18px] w-[18px] text-[var(--c-clay)]" />,
      title: "Review Turnaround Time Report",
      description: "Time from assignment to decision per item",
      count: avgTurnaroundDays ?? 0,
      label: "DAYS",
      csv: onTurnaroundCsv,
      excel: onTurnaroundExcel,
    },
  ];

  return (
    <div className="flex flex-col rounded-xl border border-[var(--line)] bg-white p-6 shadow-none transition-all duration-[var(--dur-base)] hover:-translate-y-1 hover:shadow-sm">
      <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-[16px] font-bold text-[var(--ink)]">
          Available reports
        </h2>
        <span className="text-[12px] font-medium text-[var(--ink-mute)]">
          Export as CSV or Excel
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {reports.map((report) => (
          <ReportCard
            key={report.title}
            iconBgClass={report.iconBgClass}
            icon={report.icon}
            title={report.title}
            description={report.description}
            count={report.count}
            countLabel={report.label}
            onCsv={report.csv}
            onExcel={report.excel}
          />
        ))}
      </div>
    </div>
  );
};

export default AvailableReports;