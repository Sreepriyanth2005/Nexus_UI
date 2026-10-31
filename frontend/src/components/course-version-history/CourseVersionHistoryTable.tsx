import React from "react";
import { VersionHistoryRow, VersionItem } from "./VersionHistoryRow";

interface CourseVersionHistoryTableProps {
  versions: VersionItem[];
  onPreview?: (version: VersionItem) => void;
}

export const CourseVersionHistoryTable: React.FC<CourseVersionHistoryTableProps> = ({
  versions,
  onPreview,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="py-3.5 px-4 text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
                Version
              </th>
              <th className="py-3.5 px-4 text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
                Published
              </th>
              <th className="py-3.5 px-4 text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
                Changes
              </th>
              <th className="py-3.5 px-4 text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
                Author
              </th>
              <th className="py-3.5 px-4 text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
                Status
              </th>
              <th className="py-3.5 px-4 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {versions.map((v, index) => (
              <VersionHistoryRow
                key={index}
                item={v}
                onPreview={() => onPreview?.(v)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default CourseVersionHistoryTable;
