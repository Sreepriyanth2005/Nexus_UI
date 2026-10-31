import React from "react";
import { FileText, Download } from "lucide-react";

interface SupportAuditHeaderProps {
  onExport?: () => void;
  isExporting?: boolean;
}

export const SupportAuditHeader: React.FC<SupportAuditHeaderProps> = ({
  onExport,
  isExporting = false,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6 font-sans">
      <div className="flex flex-col">
        <p className="mb-1.5 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.1em] text-[var(--ink-mute)] select-none">
          <FileText className="w-3.5 h-3.5" />
          <span>NEXUS SUPPORT &middot; MY SUPPORT ACTIONS &middot; READ-ONLY</span>
        </p>
        <h1 className="m-0 text-[24px] font-bold leading-tight tracking-tight text-[var(--ink)]">
          My support actions
        </h1>
        <p className="mt-2 text-[14px] font-medium leading-[1.5] text-[var(--ink-soft)] max-w-3xl">
          Every action you performed on user accounts. Read-only, retained per policy.
        </p>
      </div>

      <button
        type="button"
        onClick={onExport}
        disabled={isExporting}
        className="nexus-btn sm px-[14px] py-[8px] bg-[var(--hero-bg)] text-[#141414] font-bold rounded-full border border-[#e5d56d] hover:-translate-y-0.5 hover:shadow-xs transition-all duration-200 shadow-2xs cursor-pointer shrink-0 flex items-center gap-2 self-start md:self-auto disabled:opacity-50"
      >
        <Download className="w-4 h-4 text-[#141414]" />
        <span>{isExporting ? "Exporting..." : "Export my log"}</span>
      </button>
    </div>
  );
};

export default SupportAuditHeader;
