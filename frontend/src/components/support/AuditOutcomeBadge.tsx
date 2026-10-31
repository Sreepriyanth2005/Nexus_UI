import React from "react";

interface AuditOutcomeBadgeProps {
  outcome: string;
}

export const AuditOutcomeBadge: React.FC<AuditOutcomeBadgeProps> = ({ outcome }) => {
  const lower = outcome ? outcome.toLowerCase() : "";
  let dotColor = "var(--c-check)";
  let textColor = "var(--sage-text)";

  if (lower.includes("active")) {
    dotColor = "var(--c-honey)";
    textColor = "var(--honey-text)";
  } else if (lower.includes("failed") || lower.includes("error")) {
    dotColor = "var(--c-danger)";
    textColor = "var(--c-danger-deep)";
  }

  return (
    <span 
      style={{ 
        display: "inline-flex", 
        alignItems: "center", 
        gap: "6px", 
        fontSize: "var(--fs-meta)", 
        fontWeight: 600, 
        color: textColor,
        whiteSpace: "nowrap"
      }}
    >
      <span 
        style={{ 
          width: 6, 
          height: 6, 
          borderRadius: "50%", 
          background: dotColor, 
          flexShrink: 0,
          display: "inline-block" 
        }} 
      />
      <span>{outcome}</span>
    </span>
  );
};

export default AuditOutcomeBadge;
