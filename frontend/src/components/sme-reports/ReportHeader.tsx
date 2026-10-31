import React from "react";
import { Download } from "lucide-react";

interface ReportHeaderProps {
  reviewerName?: string;
  onExportCsv?: () => void;
  onExportExcel?: () => void;
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({
  reviewerName = "Reviewer",
  onExportCsv,
  onExportExcel,
}) => {
  return (
    <div
      className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <div className="min-w-0 space-y-1">
        <p className="mb-1.5 text-[12px] font-bold uppercase tracking-[0.1em] text-[var(--ink-mute)]">
          NEXUS REVIEW · SME ANALYTICS
        </p>
        <h1 className="text-[24px] font-bold leading-tight tracking-tight text-[var(--ink)]">
          Review reports
        </h1>
        <p className="text-[14px] leading-relaxed text-[var(--ink-soft)]">
          Your review activity, outcomes and turnaround. Logged in as{" "}
          <span className="text-[var(--ink)]">
            {reviewerName || "Reviewer"}
          </span>
          .
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2 pt-0.5">
        <button
          onClick={onExportCsv}
          type="button"
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-[var(--c-honey)]/45 bg-[var(--hero-bg)] px-4 text-sm font-semibold text-[var(--ink)] shadow-sm transition-all hover:shadow-[var(--shadow-lg)] active:scale-[0.98]"
        >
          <Download className="h-[14px] w-[14px]" strokeWidth={1.8} />
          Export CSV
        </button>
        <button
          onClick={onExportExcel}
          type="button"
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-[var(--c-honey)]/45 bg-[var(--hero-bg)] px-4 text-sm font-semibold text-[var(--ink)] shadow-sm transition-all hover:shadow-[var(--shadow-lg)] active:scale-[0.98]"
        >
          <Download className="h-[14px] w-[14px]" strokeWidth={1.8} />
          Export Excel
        </button>
      </div>
    </div>
  );
};

export default ReportHeader;