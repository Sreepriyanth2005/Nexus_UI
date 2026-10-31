import React from "react";

export interface SupportUserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  accountStatus: string;
  lastLoginAt?: string | Date;
  hasOpenTicket?: boolean;
}

interface SupportUsersRowProps {
  user: SupportUserRecord;
  onView?: (user: SupportUserRecord) => void;
  onToggleStatus?: (user: SupportUserRecord) => void;
  onReissueCert?: (user: SupportUserRecord) => void;
  isUpdatingStatus?: boolean;
  isReissuingCert?: boolean;
}

const formatLastLogin = (dateVal?: string | Date) => {
  if (!dateVal) return "Never";
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

export const SupportUsersRow: React.FC<SupportUsersRowProps> = ({
  user,
  onView,
  onToggleStatus,
  onReissueCert,
  isUpdatingStatus = false,
  isReissuingCert = false,
}) => {
const statusLower = (user.accountStatus || "").toLowerCase();
  const isActive = statusLower === "active";
  const isOtp = statusLower.includes("otp");
  const isLocked = statusLower === "locked";

  let dotColor = "var(--ink-faint)";
  let textColor = "var(--ink-mute)";
  let rowBg = "transparent";

  if (isActive) {
    dotColor = "var(--c-check)";
    textColor = "var(--sage-text)";
  } else if (isOtp) {
    dotColor = "var(--c-clay)";
    textColor = "var(--c-clay-text)";
    rowBg = "var(--c-clay-wash)";
  } else if (isLocked) {
    dotColor = "var(--c-danger)";
    textColor = "var(--c-danger-deep)";
  }

  return (
    <tr className="border-b border-[var(--line)] hover:bg-[var(--paper-2)] transition-all duration-300"
    >
      {/* Name */}
      <td className="py-[14px] px-[14px] font-bold  whitespace-nowrap">
        {user.name}
      </td>

      {/* Email */}
      <td className="py-[14px] px-[14px] font-medium text-[var(--ink-soft)] whitespace-nowrap">
        {user.email}
      </td>

      {/* Role */}
      <td className="py-[14px] px-[14px] text-[14px] font-medium text-[var(--ink)] whitespace-nowrap">
        {user.role}
      </td>

{/* Account Status */}
      <td className="py-[14px] px-[14px] whitespace-nowrap">
        <div className="flex flex-col items-start gap-1">
          <span 
            style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              gap: 6, 
              fontSize: "16px", 
              fontWeight: 600, 
              color: textColor 
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: dotColor, flexShrink: 0, display: "inline-block" }} />
            <span>{user.accountStatus}</span>
          </span>
          {user.hasOpenTicket ? (
            <span style={{ background: "var(--honey-wash)", color: "var(--honey-text)", height: 18, fontSize: "10px", padding: "0 6px", borderRadius: "var(--r-sm)", fontWeight: 700, display: "inline-flex", alignItems: "center" }}>
              OPEN TICKET
            </span>
          ) : isOtp ? (
            <span style={{ background: "var(--c-clay)", color: "#fff", height: 18, fontSize: "10px", padding: "0 6px", borderRadius: "var(--r-sm)", fontWeight: 700, display: "inline-flex", alignItems: "center" }}>
              NO TICKET
            </span>
          ) : null}
        </div>
      </td>

      {/* Last Login */}
      <td style={{ padding: "14px 24px", fontSize: "15px", color: "var(--ink-mute)", whiteSpace: "nowrap" }}>
        {formatLastLogin(user.lastLoginAt)}
      </td>

      {/* Actions */}
      <td className="py-[14px] px-[14px] whitespace-nowrap">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onView?.(user)}
            className="h-8 px-[14px] text-[13px] font-bold rounded-full bg-white border border-[var(--line)] cursor-pointer hover:bg-[var(--paper-2)] transition-colors text-[var(--ink)]"
          >
            View
          </button>

          <button
            type="button"
            onClick={() => onToggleStatus?.(user)}
            disabled={isUpdatingStatus}
            
            className="h-8 px-[14px] text-[12px] font-bold rounded-full bg-white border border-[var(--line)] cursor-pointer hover:bg-[var(--paper-2)] transition-colors text-[var(--ink)] min-w-[90px]">
            {isLocked || !isActive ? "Activate" : "Deactivate"}
          </button>

          <button
            type="button"
            onClick={() => onReissueCert?.(user)}
            disabled={isReissuingCert}
            className="h-8 px-[14px] text-[12px] font-bold rounded-full bg-white border border-[var(--line)] cursor-pointer hover:bg-[var(--paper-2)] transition-colors text-[var(--ink)]"
          >
            Re-issue cert
          </button>
        </div>
      </td>
    </tr>
  );
};

export default SupportUsersRow;
