import React from "react";

export const SupportHeader: React.FC = () => {
  return (
    <div className="flex items-center justify-between border-b border-[var(--line)] pb-5 mb-6 select-none font-sans">
      <div>
        <h1 className="smerep-page-title">Support console</h1>
        <p className="text-xs text-[var(--ink-mute)] font-medium">
          Support Engineer <span className="text-[var(--ink-mute)] mx-1.5">•</span> Maria Lopez
        </p>
      </div>
      <div className="flex items-center gap-3">
        {/* Right side avatar */}
        <div className="w-10 h-10 rounded-full bg-[var(--paper-2)] flex items-center justify-center font-bold text-[var(--ink)] text-sm select-none border border-[var(--line-strong)]">
          ML
        </div>
      </div>
    </div>
  );
};
