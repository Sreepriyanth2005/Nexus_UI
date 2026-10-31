import React from "react";
import ContentTypeBadge from "./ContentTypeBadge";
import ReviewDecisionBadge from "./ReviewDecisionBadge";

type ReviewHistoryItem = any;
interface ReviewReportRowProps { item: ReviewHistoryItem; }

export const ReviewReportRow: React.FC<ReviewReportRowProps> = ({ item }) => (
  <tr className="border-b border-[var(--line)] transition-colors duration-[var(--dur-fast)] hover:bg-[var(--paper-2)]">
    <td className="px-4 py-3 text-[12px] font-medium text-[var(--ink-mute)]">{item.submittedDate}</td>
    <td className="px-4 py-3 text-[12px] font-semibold text-[var(--ink)]">{item.content}</td>
    <td className="px-4 py-3"><ContentTypeBadge type={item.type} /></td>
    <td className="px-4 py-3"><ReviewDecisionBadge decision={item.decision} /></td>
    <td className="px-4 py-3 text-[12px] font-medium text-[var(--ink-mute)]">{item.turnaround}</td>
  </tr>
);

export default ReviewReportRow;
