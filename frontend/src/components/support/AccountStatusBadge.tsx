import React from "react";

interface AccountStatusBadgeProps {
  status: "Active" | "Locked" | "OTP Issue";
}

export const AccountStatusBadge: React.FC<AccountStatusBadgeProps> = ({ status }) => {
  const getStyle = () => {
    switch (status) {
      case "Active":
        return {
          bgClass: "bg-sage-wash/50 text-sage-text border-sage-soft",
          dotClass: "bg-sage",
        };
      case "Locked":
        return {
          bgClass: "bg-red-50/50 text-red-700 border-red-200",
          dotClass: "bg-clay",
        };
      case "OTP Issue":
        return {
          bgClass: "bg-honey-wash/50 text-honey-text border-honey-soft",
          dotClass: "bg-honey",
        };
      default:
        return {
          bgClass: "bg-paper-2 text-ink-soft border-line-strong",
          dotClass: "bg-paper-20",
        };
    }
  };

  const { bgClass, dotClass } = getStyle();

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border ${bgClass} shadow-2xs`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
      {status}
    </span>
  );
};
