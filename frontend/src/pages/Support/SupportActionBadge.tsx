import React from "react";

interface SupportActionBadgeProps {
  action: string;
}

export const SupportActionBadge: React.FC<SupportActionBadgeProps> = ({ action }) => {
  // Normalize action name to match variations
  const displayAction = action;

  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold text-[var(--ink-soft)] bg-[var(--paper-2)] border border-[var(--line-strong)] select-none">
      {displayAction}
    </span>
  );
};
