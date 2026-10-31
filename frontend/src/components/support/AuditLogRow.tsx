import React from "react";
import { AuditActionBadge } from "./AuditActionBadge";
import { AuditOutcomeBadge } from "./AuditOutcomeBadge";

type AuditLogRecord = any;

interface AuditLogRowProps {
  record: AuditLogRecord;
}

const formatTimestamp = (dateVal: string | Date) => {
  if (!dateVal) return "-";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
  } catch {
    return String(dateVal);
  }
};

export const AuditLogRow: React.FC<AuditLogRowProps> = ({ record }) => {
  const isImpersonation = record.action?.toLowerCase().includes("impersonation");

  return (
    <tr
      className={`border-b border-[var(--line)] transition-colors duration-150 ${isImpersonation ? "bg-[#fcf7ae]/40 hover:bg-[#f8f1a0]/50" : "hover:bg-[var(--paper-2)]"}`}
    >
      <td 
        style={{ 
          padding: "16px 21px", 
          fontSize: "var(--fs-meta)", 
          color: "var(--ink-mute)", 
          whiteSpace: "nowrap",
          borderLeft: isImpersonation ? "3px solid var(--sidebar-active-bar)" : "3px solid transparent",
        }}
      >
        {formatTimestamp(record.timestamp)}
      </td>
      <td style={{ padding: "16px 21px", fontSize: "var(--fs-meta)", fontWeight: 600, color: "var(--ink)", whiteSpace: "nowrap" }}>
        {record.userAffectedEmail || record.user}
      </td>
      <td style={{ padding: "16px 21px", whiteSpace: "nowrap" }}>
        <AuditActionBadge action={record.action} />
      </td>
      <td style={{ padding: "16px 21px", fontSize: "var(--fs-meta)", color: "var(--ink-soft)", minWidth: 240 }} title={record.reason}>
        {record.reason || "-"}
      </td>
      <td style={{ padding: "16px 21px", whiteSpace: "nowrap" }}>
        <AuditOutcomeBadge outcome={record.outcome} />
      </td>
    </tr>
  );
};

export default AuditLogRow;
