import React from "react";
import { Info } from "../../assets/icons";

export const SupportAccessBanner: React.FC = () => {
  return (
    <div className="flex mb-3 items-center gap-3 w-full select-none bg-[var(--paper-2)] border border-[var(--line)] rounded-[var(--r-md)] py-[14px] px-[20px] font-sans">
      <div className="w-6 h-6 rounded-full bg-[var(--honey-wash)] text-[var(--honey-text)] flex items-center justify-center shrink-0">
        <Info className="w-3.5 h-3.5" />
      </div>
      <p className="text-[16px] text-[var(--ink-mute)] leading-[1.45]">
        <strong className="font-bold text-[var(--ink)]">Support access.</strong> View profiles, activate or deactivate accounts, re-issue completion certificates. Changing roles or impersonating users requires Super Admin access. All actions are logged.
      </p>
    </div>
  );
};

export default SupportAccessBanner;
