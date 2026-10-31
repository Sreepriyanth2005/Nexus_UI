import React from "react";

interface ReportsHeaderProps {
  reviewerName?: string;
  onExportCsv?: () => void;
}

export const ReportsHeader: React.FC<ReportsHeaderProps> = ({
  reviewerName,
  onExportCsv,
}) => {
  return (
    <div className="flex flex-col items-start justify-between gap-3 pb-3 select-none md:flex-row md:items-center">
      <div>
        <h1 className="smerep-page-title">My review reports</h1>
        <p className="text-[12px] font-medium text-[var(--ink-soft)]">
          Completed reviews{reviewerName ? ` by ${reviewerName}` : ""}
        </p>
      </div>
      <button
        onClick={onExportCsv}
        type="button"
        className="btn-ghost h-8 rounded-[var(--r-pill)] px-3.5 text-[12px] font-bold transition-all duration-150 hover:shadow-[var(--shadow-sm)] active:scale-[0.98] cursor-pointer whitespace-nowrap"
      >
        Export CSV
      </button>
    </div>
  );
};

export default ReportsHeader;
