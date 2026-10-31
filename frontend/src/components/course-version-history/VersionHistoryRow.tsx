import React from "react";
import { VersionStatusBadge } from "./VersionStatusBadge";

export interface VersionItem {
  version: string;
  published: string;
  changes: string;
  author: string;
  status: "Live" | "Archived" | string;
}

interface VersionHistoryRowProps {
  item: VersionItem;
  onPreview?: () => void;
}

export const VersionHistoryRow: React.FC<VersionHistoryRowProps> = ({
  item,
  onPreview,
}) => {
  const isCurrent = item.version.toLowerCase().includes("current");

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition">
      {/* Version column */}
      <td className="py-4 px-4">
        {isCurrent ? (
          <span className="inline-block px-3 py-1 border border-slate-350 bg-white text-slate-800 text-xs font-bold rounded-full border-slate-300">
            {item.version}
          </span>
        ) : (
          <span className="text-xs font-semibold text-slate-700 font-mono">
            {item.version}
          </span>
        )}
      </td>

      {/* Published date column */}
      <td className="py-4 px-4 text-xs font-medium text-slate-500 font-mono">
        {item.published}
      </td>

      {/* Change summary column */}
      <td className="py-4 px-4 text-sm font-medium text-slate-800 max-w-sm break-words">
        {item.changes}
      </td>

      {/* Author column */}
      <td className="py-4 px-4 text-xs font-semibold text-slate-700">
        {item.author}
      </td>

      {/* Status Badge column */}
      <td className="py-4 px-4">
        <VersionStatusBadge status={item.status} />
      </td>

      {/* Actions preview button */}
      <td className="py-4 px-4 text-right">
        <button
          type="button"
          onClick={onPreview}
          className="px-4 py-1.5 border border-slate-300 hover:border-slate-800 text-slate-800 text-xs font-bold rounded-xl transition"
        >
          Preview
        </button>
      </td>
    </tr>
  );
};
export default VersionHistoryRow;
