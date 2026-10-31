import React from "react";

interface AuditOutcomeBadgeProps {
  outcome: string;
}

export const AuditOutcomeBadge: React.FC<AuditOutcomeBadgeProps> = ({
  outcome,
}) => {
  const lower = (outcome || "").toLowerCase();

  let text = "text-[var(--c-sage)]";
  let dot = "bg-[var(--c-sage)]";

  if (lower.includes("active") || lower.includes("ended")) {
    text = "text-[var(--c-honey)]";
    dot = "bg-[var(--c-honey)]";
  } else if (
    lower.includes("fail") ||
    lower.includes("error") ||
    lower.includes("decline")
  ) {
    text = "text-[var(--c-clay)]";
    dot = "bg-[var(--c-clay)]";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap ${text}`}
      style={{
        fontSize: "12px",
        fontWeight: 600,
        fontFamily: "var(--font-sans)",
      }}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
      {outcome || "—"}
    </span>
  );
};

export default AuditOutcomeBadge;