import React from "react";

interface AuditActionBadgeProps {
  action: string;
}

export const AuditActionBadge: React.FC<AuditActionBadgeProps> = ({
  action,
}) => {
  const lower = (action || "").toLowerCase();

  let classes =
    "border-[var(--line-strong)] bg-transparent text-[var(--ink-soft)]";

  if (lower.includes("impersonation")) {
    classes =
      "border-[var(--c-honey)] bg-transparent text-[var(--c-honey)]";
  } else if (lower.includes("unlock")) {
    classes =
      "border-[var(--c-sage)] bg-transparent text-[var(--c-sage)]";
  } else if (lower.includes("otp")) {
    classes =
      "border-[var(--c-sage)] bg-transparent text-[var(--c-sage)]";
  } else if (
    lower.includes("reissued") ||
    lower.includes("credential") ||
    lower.includes("cert")
  ) {
    classes =
      "border-[var(--c-clay)] bg-transparent text-[var(--c-clay)]";
  } else if (lower.includes("re-verify") || lower.includes("reverify")) {
    classes =
      "border-[var(--c-honey)] bg-transparent text-[var(--c-honey)]";
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 whitespace-nowrap ${classes}`}
      style={{
        fontSize: "11px",
        fontWeight: 500,
        fontFamily: "var(--font-sans)",
      }}
    >
      {action}
    </span>
  );
};

export default AuditActionBadge;