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
  const isLocked = statusLower === "locked" || statusLower.includes("otp");

  const dotClass = isLocked ? "bg-amber-600" : isActive ? "bg-emerald-600" : "bg-gray-400";
  const textClass = isLocked ? "text-amber-800 font-semibold" : isActive ? "text-emerald-700 font-semibold" : "text-gray-600 font-semibold";

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors font-sans cursor-pointer">
      {/* Name */}
      <td className="py-[12px] px-[14px] text-[14px] font-semibold text-gray-900 whitespace-nowrap">
        {user.name}
      </td>

      {/* Email */}
      <td className="py-[12px] px-[14px] text-[14px] font-normal text-[#3A3A3A] font-sans whitespace-nowrap">
        {user.email}
      </td>

      {/* Role */}
      <td className="py-[12px] px-[14px] text-[14px] font-medium text-gray-800 whitespace-nowrap">
        {user.role}
      </td>

      {/* Account Status */}
      <td className="py-[12px] px-[14px] whitespace-nowrap">
        <div className="flex items-center gap-2">
          <div className={`inline-flex items-center gap-1.5 text-[14px] ${textClass} whitespace-nowrap`}>
            <span className={`w-2 h-2 rounded-full ${dotClass} shrink-0 inline-block`} />
            <span>{user.accountStatus}</span>
          </div>
          {user.hasOpenTicket && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
              OPEN TICKET
            </span>
          )}
        </div>
      </td>

      {/* Last Login */}
      <td className="py-[12px] px-[14px] text-[14px] text-[#3A3A3A] font-normal whitespace-nowrap">
        {formatLastLogin(user.lastLoginAt)}
      </td>

      {/* Actions */}
      <td className="py-[12px] px-[14px] text-left whitespace-nowrap">
        <div className="flex items-center justify-start gap-2">
          <button
            type="button"
            onClick={() => onView?.(user)}
            className="px-3.5 py-1 rounded-full border border-gray-200 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 cursor-pointer shadow-2xs transition-all"
          >
            View
          </button>

          <button
            type="button"
            onClick={() => onToggleStatus?.(user)}
            disabled={isUpdatingStatus}
            className="px-3.5 py-1 rounded-full border border-gray-200 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 cursor-pointer shadow-2xs transition-all min-w-[82px]"
          >
            {isLocked || !isActive ? "Activate" : "Deactivate"}
          </button>

          <button
            type="button"
            onClick={() => onReissueCert?.(user)}
            disabled={isReissuingCert}
            className="px-3.5 py-1 rounded-full border border-gray-200 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 cursor-pointer shadow-2xs transition-all"
          >
            Re-issue cert
          </button>
        </div>
      </td>
    </tr>
  );
};

export default SupportUsersRow;
