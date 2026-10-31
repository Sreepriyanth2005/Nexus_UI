import React from "react";

interface PriorityBadgeProps {
  priority: "High" | "Medium" | "Normal" | string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const p = (priority || "Normal").toLowerCase();

  let classes =
    "border-[var(--line-strong)] bg-transparent text-[var(--ink-soft)]";
  let showDot = false;
  let dot = "";

  if (p === "high" || p === "critical") {
    classes =
      "border-[var(--c-clay)] bg-transparent text-[var(--c-clay)]";
    showDot = true;
    dot = "bg-[var(--c-clay)]";
  } else if (p === "medium") {
    classes =
      "border-[var(--c-honey)] bg-transparent text-[var(--c-honey)]";
    showDot = true;
    dot = "bg-[var(--c-honey)]";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 capitalize ${classes}`}
      style={{
        fontSize: "11px",
        fontWeight: 500,
        fontFamily: "var(--font-sans)",
      }}
    >
      {showDot && <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />}
      {priority}
    </span>
  );
};

export default PriorityBadge;