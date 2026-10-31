import React from "react";

export const ReportsFooterNote: React.FC = () => (
  <div className="rounded-[var(--r-md)] border border-dashed border-[var(--c-honey-soft)] bg-[var(--c-honey-wash)] p-4 text-[11px] font-medium leading-[1.55] text-[var(--c-honey-text)] select-none">
    <strong className="font-bold">Scope:</strong> SME sees only their own review history. Super Admin sees all SME reports across all reviewers. Reports show approved, rejected, and pending counts.
  </div>
);

export default ReportsFooterNote;
