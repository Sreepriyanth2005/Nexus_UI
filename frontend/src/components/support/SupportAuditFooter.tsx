import React from "react";

export const SupportAuditFooter: React.FC = () => {
  return (
    <div 
      style={{
        backgroundColor: "var(--honey-wash)",
        border: "1px solid var(--c-honey-soft)",
        borderRadius: "var(--r-lg)",
        padding: "16px 20px",
        fontFamily: "var(--font-sans)"
      }}
    >
      <p style={{ fontSize: "var(--fs-meta)", color: "var(--honey-text)", lineHeight: 1.55 }}>
        <strong style={{ fontWeight: 700, color: "var(--ink)" }}>Support sees only their own action trail.</strong> The
        full platform audit log (all actors, all system events) is a Super Admin screen with broader filters including actor name,
        IP, and system events. Impersonation rows are always paired (started / ended) and show
        the mandatory reason field. This view is read-only and retained per platform retention
        policy.
      </p>
    </div>
  );
};

export default SupportAuditFooter;
