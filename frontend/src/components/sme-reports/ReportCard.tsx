import React from "react";
import { Download } from "lucide-react";

interface ReportCardProps {
  icon: React.ReactNode;
  iconBgClass: string;
  title: string;
  description: string;
  count: number | string;
  countLabel?: string;
  onCsv: () => void;
  onExcel: () => void;
}

export const ReportCard: React.FC<ReportCardProps> = ({
  icon,
  iconBgClass,
  title,
  description,
  count,
  countLabel = "ITEMS",
  onCsv,
  onExcel,
}) => {
  return (
    <div className="group flex min-h-[92px] items-center justify-between gap-4 rounded-[var(--r-md)] border border-[var(--line)] bg-white p-5 transition-all duration-[var(--dur-base)] ease-[var(--tn)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)]">
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconBgClass}`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[16px] font-bold text-[var(--ink)]">
            {title}
          </h3>
          <p className="mt-1 line-clamp-1 text-[14px] font-medium text-[var(--ink-mute)]">
            {description}
          </p>
          <div className="mt-3">
            <span className="inline-flex items-center rounded-full border border-[var(--line)] bg-[var(--paper-2)] px-2.5 py-0.5 text-[12px] font-bold uppercase tracking-[0.06em] text-[var(--ink-soft)]">
              {count} {countLabel}
            </span>
          </div>
        </div>
      </div>

      <div className="flex min-w-[76px] shrink-0 flex-col gap-2">
        <button
          type="button"
          onClick={onCsv}
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-[var(--r-md)] border border-[var(--line)] bg-white px-3 text-[12px] font-bold text-[var(--ink)] transition-all duration-[var(--dur-fast)] hover:border-[var(--c-honey)] hover:bg-[var(--c-honey-wash)] active:scale-[0.98]"
        >
          <Download className="h-3.5 w-3.5 text-[var(--ink-mute)]" strokeWidth={2.5} />
          CSV
        </button>
        <button
          type="button"
          onClick={onExcel}
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-[var(--r-md)] border border-[var(--line)] bg-white px-3 text-[12px] font-bold text-[var(--ink)] transition-all duration-[var(--dur-fast)] hover:border-[var(--c-honey)] hover:bg-[var(--c-honey-wash)] active:scale-[0.98]"
        >
          <Download className="h-3.5 w-3.5 text-[var(--ink-mute)]" strokeWidth={2.5} />
          Excel
        </button>
      </div>
    </div>
  );
};

export default ReportCard;