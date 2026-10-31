import React from "react";

interface AccountStatusBadgeProps {
  status: "Active" | "Locked" | "OTP Issue" | string;
}

export const AccountStatusBadge: React.FC<AccountStatusBadgeProps> = ({
  status,
}) => {
  const lower = (status || "").toLowerCase();

  let classes =
    "border-[var(--line-strong)] bg-transparent text-[var(--ink-soft)]";
  let dot = "bg-[var(--ink-mute)]";

  if (lower === "active") {
    classes =
      "border-[var(--c-sage)] bg-transparent text-[var(--c-sage)]";
    dot = "bg-[var(--c-sage)]";
  } else if (lower === "locked" || lower.includes("otp")) {
    classes =
      "border-[var(--c-clay)] bg-transparent text-[var(--c-clay)]";
    dot = "bg-[var(--c-clay)]";
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
      {status}
    </span>
  );
};

export default AccountStatusBadge;