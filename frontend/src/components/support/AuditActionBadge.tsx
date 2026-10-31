import React from "react";

interface AuditActionBadgeProps {
  action: string;
}

export const AuditActionBadge: React.FC<AuditActionBadgeProps> = ({ action }) => {
  const lower = action.toLowerCase();

  let chipStyle: React.CSSProperties = {
    background: "#edf4fb",
    color: "#2c6496",
    border: "1px solid #c7dcf1",
  };

  if (lower.includes("impersonation")) {
    chipStyle = {
      background: "var(--honey-wash)",
      color: "var(--honey-text)",
      border: "1px solid var(--c-honey-soft)",
    };
  } else if (lower.includes("unlocked")) {
    chipStyle = {
      background: "var(--sage-wash)",
      color: "var(--sage-text)",
      border: "1px solid var(--c-sage-soft)",
    };
  } else if (lower.includes("otp")) {
    chipStyle = {
      background: "#edf4fb",
      color: "#2c6496",
      border: "1px solid #c7dcf1",
    };
  } else if (lower.includes("reissued") || lower.includes("credential")) {
    chipStyle = {
      background: "var(--clay-wash)",
      color: "var(--clay-text)",
      border: "1px solid var(--c-clay-soft)",
    };
  } else if (lower.includes("re-verify") || lower.includes("reverify")) {
    chipStyle = {
      background: "var(--honey-wash)",
      color: "var(--honey-text)",
      border: "1px solid var(--c-honey-soft)",
    };
  }

  return (
    <span
      className="chip"
      style={{
        ...chipStyle,
        height: 24,
        padding: "3px 10px",
        fontSize: "var(--fs-micro)",
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
        borderRadius: "var(--r-pill)",
        whiteSpace: "nowrap"
      }}
    >
      {action}
    </span>
  );
};

export default AuditActionBadge;
