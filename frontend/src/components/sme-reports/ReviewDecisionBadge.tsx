import React from "react";

export type DecisionStatus = "Approved" | "Rejected" | "Pending";
interface ReviewDecisionBadgeProps { decision: DecisionStatus; }

export const ReviewDecisionBadge: React.FC<ReviewDecisionBadgeProps> = ({ decision }) => {
  let dot = "bg-[var(--ink-faint)]";
  let classes = "border-[var(--line)] bg-[var(--paper-2)] text-[var(--ink-soft)]";
  if (decision === "Approved") {
    dot = "bg-[var(--c-sage)]";
    classes = "border-[var(--c-sage-soft)] bg-[var(--c-sage-wash)] text-[var(--c-sage-text)]";
  } else if (decision === "Rejected") {
    dot = "bg-[var(--c-clay)]";
    classes = "border-[var(--c-clay-soft)] bg-[var(--c-clay-wash)] text-[var(--c-clay-text)]";
  } else if (decision === "Pending") {
    dot = "bg-[var(--c-honey)]";
    classes = "border-[var(--c-honey-soft)] bg-[var(--c-honey-wash)] text-[var(--c-honey-text)]";
  }
  return <span className={`inline-flex items-center gap-1.5 rounded-[var(--r-pill)] border px-2.5 py-1 text-[10px] font-bold leading-none whitespace-nowrap select-none ${classes}`}><span className={`h-1.5 w-1.5 rounded-full ${dot}`} />{decision}</span>;
};

export default ReviewDecisionBadge;
