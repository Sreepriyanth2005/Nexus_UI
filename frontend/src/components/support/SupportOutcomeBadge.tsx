import React from "react";

interface SupportOutcomeBadgeProps {
  outcome: string;
}

export const SupportOutcomeBadge: React.FC<SupportOutcomeBadgeProps> = ({ outcome }) => {
  const getStyle = () => {
    const o = outcome ? outcome.toLowerCase() : "";
    switch (o) {
      case "sent":
      case "unlocked":
      case "done":
        return {
          bgClass: "bg-sage-wash text-sage-text border-emerald-100",
          dotClass: "bg-sage",
        };
      case "active":
        return {
          bgClass: "bg-honey-wash text-honey-text border-amber-100",
          dotClass: "bg-honey",
        };
      case "email sent":
        return {
          bgClass: "bg-sky-50 text-sky-700 border-sky-100",
          dotClass: "bg-sky-500",
        };
      default:
        return {
          bgClass: "bg-paper-2 text-ink-soft border-line",
          dotClass: "bg-gray-400",
        };
    }
  };

  const { bgClass, dotClass } = getStyle();

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border ${bgClass} shadow-2xs`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
      {outcome}
    </span>
  );
};
