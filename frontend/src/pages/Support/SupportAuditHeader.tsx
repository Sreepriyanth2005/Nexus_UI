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
    <div
      className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <div className="min-w-0">
        <p
          className="mb-1 flex items-center gap-1.5 uppercase text-[var(--ink-mute)]"
          style={{
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: "0.12em",
          }}
        >
          <FileText className="h-3.5 w-3.5" />
          NEXUS SUPPORT · MY SUPPORT ACTIONS · READ-ONLY
        </p>
        <h1
          className="m-0 mb-1 text-[var(--ink)]"
          style={{
            fontSize: "24px",
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: "-0.02em",
          }}
        >
          My support actions
        </h1>
        <p
          className="m-0 text-[var(--ink-soft)]"
          style={{ fontSize: "13px", fontWeight: 500, lineHeight: 1.4 }}
        >
          Every action you performed on user accounts. Read-only, retained per
          policy.
        </p>
      </div>

      <button
        type="button"
        onClick={onExport}
        disabled={isExporting}
        className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-full border border-[var(--btn)] bg-[var(--btn)] px-3.5 leading-none text-[var(--btn-ink)] transition-all duration-[var(--dur-fast)] ease-[var(--tn)] hover:border-[var(--btn-hover)] hover:bg-[var(--btn-hover)] active:scale-[0.98] disabled:opacity-50"
        style={{ fontSize: "12px", fontWeight: 500 }}
      >
        <Download className="h-3.5 w-3.5" />
        {isExporting ? "Exporting..." : "Export my log"}
      </button>
    </div>
  );
};

export default SupportAuditHeader;