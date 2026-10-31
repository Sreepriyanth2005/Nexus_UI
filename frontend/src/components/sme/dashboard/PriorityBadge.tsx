import React from "react";

export type PriorityLevel = "High" | "Medium" | "Normal";

export const PriorityBadge: React.FC<{ priority: PriorityLevel }> = ({
  priority,
}) => {
  const cls =
    priority === "High"
      ? "border-[var(--c-clay)] bg-[var(--paper)] text-[var(--c-clay)]"
      : priority === "Medium"
        ? "border-[var(--c-honey)] bg-[var(--paper)] text-[var(--c-honey)]"
        : "border-[var(--line-strong)] bg-[var(--paper)] text-[var(--ink-soft)]";

  return (
    <span
      className={`inline-flex items-center rounded-[var(--r-pill)] border px-2.5 py-1 text-[11px] font-[var(--fw-medium)] capitalize ${cls}`}
    >
      {priority}
    </span>
  );
};

export default PriorityBadge;