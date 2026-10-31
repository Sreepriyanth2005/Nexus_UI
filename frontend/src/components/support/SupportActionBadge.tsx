import React from "react";

interface SupportActionBadgeProps {
  action: string;
}

export const SupportActionBadge: React.FC<SupportActionBadgeProps> = ({ action }) => {
  // Normalize action name to match variations
  const displayAction = action;

  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold text-ink-mute bg-paper border border-gray-300 shadow-2xs">
      {displayAction}
    </span>
  );
};
