import React from "react";
import ReviewReportRow from "./ReviewReportRow";

type ReviewHistoryItem = any;
interface ReviewReportsTableProps { items: ReviewHistoryItem[]; }

export const ReviewReportsTable: React.FC<ReviewReportsTableProps> = ({ items }) => (
  <div className="overflow-hidden rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--paper)] shadow-[var(--shadow-sm)]">
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-left">
        <thead>
          <tr className="border-b border-[var(--line)] bg-[var(--paper-2)] select-none">
            {['Submitted Date','Content','Type','Decision','Turnaround'].map((label) => (
              <th key={label} className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.08em] leading-[1.15] text-[var(--ink-mute)]">{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>{items.map((item: any) => <ReviewReportRow key={item.id} item={item} />)}</tbody>
      </table>
    </div>
  </div>
);

export default ReviewReportsTable;
