import React from "react";

interface SupportOutcomeBadgeProps {
  outcome: string;
}

export const SupportOutcomeBadge: React.FC<SupportOutcomeBadgeProps> = ({
  outcome,
}) => {
  const o = (outcome || "").toLowerCase();

  let classes =
    "border-[var(--line-strong)] bg-transparent text-[var(--ink-soft)]";
  let dot = "bg-[var(--ink-mute)]";

  if (
    o.includes("sent") ||
    o.includes("unlocked") ||
    o.includes("done") ||
    o.includes("completed") ||
    o.includes("reissued")
  ) {
    classes =
      "border-[var(--c-sage)] bg-[var(--c-sage-wash)] text-[var(--c-sage-text)]";
    dot = "bg-[var(--c-sage)]";
  } else if (o.includes("active")) {
    classes =
      "border-[var(--c-honey)] bg-[var(--c-honey-wash)] text-[var(--c-honey-text)]";
    dot = "bg-[var(--c-honey)]";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 ${classes}`}
      style={{
        fontSize: "11px",
        fontWeight: 500,
        fontFamily: "var(--font-sans)",
      }}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {outcome}
    </span>
  );
};

export default SupportOutcomeBadge;