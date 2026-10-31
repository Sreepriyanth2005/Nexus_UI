import React from "react";

interface PriorityBadgeProps {
  priority: "High" | "Medium" | "Normal";
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const getStyle = () => {
    switch (priority) {
      case "High":
        return {
          bgClass: "bg-red-50 text-red-700 border-red-100",
          dotClass: "bg-clay",
        };
      case "Medium":
        return {
          bgClass: "bg-honey-wash text-honey-text border-amber-100",
          dotClass: "bg-honey",
        };
      case "Normal":
      default:
        return {
          bgClass: "bg-surface-3 text-ink-soft border-line-strong",
          dotClass: null,
        };
    }
  };

  const { bgClass, dotClass } = getStyle();

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border ${bgClass} shadow-2xs`}>
      {dotClass && <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />}
      {priority}
    </span>
  );
};
