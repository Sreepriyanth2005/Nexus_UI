import React from "react";

interface VersionStatusBadgeProps {
  status: "Live" | "Archived" | string;
}

export const VersionStatusBadge: React.FC<VersionStatusBadgeProps> = ({ status }) => {
  const isLive = status.toLowerCase() === "live";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
        isLive
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-slate-55/40 text-slate-600 border-slate-200 bg-slate-100"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isLive ? "bg-emerald-500" : "bg-slate-400"
        }`}
      />
      {status}
    </span>
  );
};
export default VersionStatusBadge;
