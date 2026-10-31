import React from "react";
import { Info } from "lucide-react";

export const SupportAccessBanner: React.FC = () => {
  return (
    <div 
      className="flex items-start gap-3.5 w-full select-none"
      style={{
        backgroundColor: "#F6F6F4",
        border: "1px solid var(--line)",
        borderRadius: "var(--r-md)",
        padding: "12px 18px",
        fontFamily: "var(--font-sans)"
      }}
    >
      <div 
        style={{
          width: 30,
          height: 30,
          borderRadius: "10px",
          backgroundColor: "#F6E8C4",
          color: "#755A12",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0
        }}
      >
        <Info style={{ width: 16, height: 16 }} />
      </div>
      <p style={{ fontSize: "16px", color: "#3A3A3A", lineHeight: 1.45, margin: 0 }}>
        <strong style={{ fontWeight: 700, color: "var(--ink)" }}>Support access.</strong>{" "}
        View profiles, activate or deactivate accounts, re-issue completion
        certificates. Changing roles or impersonating users requires Super Admin
        access. All actions are logged.
      </p>
    </div>
  );
};

export default SupportAccessBanner;