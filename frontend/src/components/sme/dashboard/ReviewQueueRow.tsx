import React from "react";
import { ArrowRight, Clock3 } from "lucide-react";
import { useNavigate } from "react-router";
export interface QueueItem { id: string; reviewId?: string; submittedDate: string; timestamp: string; submittedBy: string; title: string; type: "Course" | "Lesson" | "Career Path" | string; typeTag?: string; lessonsDetail: string; waitTime: string; approvedDate?: string; approvedBy?: string; comment?: string; duration?: string; visibility?: string; subject?: string; dueDate?: string; status?: string; rawStatus?: string; }
interface Props { item: QueueItem; activeTab?: string; onReview?: (item: QueueItem) => void; onTitleClick?: (item: QueueItem) => void; isPrimaryAction?: boolean; dynamicPriority?: "High" | "Medium" | "Normal"; }
export const ReviewQueueRow: React.FC<Props> = ({ item, activeTab = "pending", onReview, onTitleClick, isPrimaryAction, dynamicPriority }) => {
    const overdue = activeTab === "pending" && item.dueDate ? new Date() > new Date(item.dueDate) : false;
    const action = activeTab === "pending" ? "Review" : activeTab === "in_progress" ? "Continue" : "View";
    
    let pendingDays = 0;
    if (item.submittedDate && item.submittedDate !== "-") {
        const submitted = new Date(item.submittedDate);
        if (!isNaN(submitted.getTime())) {
            const today = new Date();
            const diffTime = today.getTime() - submitted.getTime();
            pendingDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
        }
    }
    
    let priority = dynamicPriority || "Normal";
    if (!dynamicPriority) {
        if (pendingDays >= 14) priority = "High";
        else if (pendingDays >= 7) priority = "Medium";
    }
    
    const isHighPriority = priority === "High";
    
    return (
        <tr className="group border-t border-[var(--line)] bg-[var(--paper)] transition-colors duration-[var(--dur-fast)] hover:bg-[var(--paper-2)]">
            <td className="px-5 py-4">
                <button type="button" onClick={() => onTitleClick?.(item)} className="max-w-[320px] truncate text-left text-[16px] font-[var(--fw-bold)] leading-[var(--lh-tight)] text-[var(--ink)] hover:text-[var(--c-honey-text)] hover:underline">
                    {item.title}
                </button>
            </td>
            <td className="max-w-[200px] truncate px-5 py-4 text-[16px] font-medium text-[var(--ink-soft)]">
                {item.submittedBy || "-"}
            </td>
            <td className="px-5 py-4">
                <span className="inline-flex rounded-full border border-[var(--line)] bg-white px-2.5 py-1 text-[12px] font-bold tracking-wider text-[var(--ink-soft)]">
                    {item.typeTag || item.type || item.subject || "-"}
                </span>
            </td>
            <td className="whitespace-nowrap px-5 py-4">
                <span className={`inline-flex items-center gap-1.5 text-[14px] font-[var(--fw-bold)] ${overdue ? "text-[var(--c-danger)]" : "text-[var(--ink-soft)]"}`}>
                    <Clock3 className="h-4 w-4" />
                    {pendingDays > 0 ? (pendingDays === 1 ? '1 day' : `${pendingDays} days`) : '<1 day'}
                </span>
            </td>
            <td className="px-5 py-4">
                <span className={`inline-flex rounded-full border px-2.5 py-0.2 text-[12px] font-medium  ${
                    priority === 'High' ? 'text-red-700 border-red-300' :
                    priority === 'Medium' ? 'text-orange-700 border-orange-300' :
                    'text-slate-500 border-slate-300'
                }`}>
                    {priority}
                </span>
            </td>
   <td className="px-5 py-4">
  <button
    type="button"
    onClick={() => onReview?.(item)}
    className={`inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-[14px] font-[var(--fw-bold)] text-[var(--ink)] transition-[background-color,border-color,box-shadow,transform] duration-[var(--dur-fast)] ease-[var(--tn)] hover:-translate-y-[1px] hover:shadow-[0_2px_8px_rgba(17,17,17,0.08)] active:translate-y-0 active:scale-[0.98] hover:shadow-[var(--shadow-sm)] ${
      isHighPriority && activeTab === "pending"
        ? "border-[#fef08a] bg-[#fef08a] text-[#422006] hover:border-[var(--ink)] hover:bg-[#fde047]"
        : "border-[var(--line)] bg-white hover:border-[var(--ink)] hover:bg-[var(--paper-2)]"
    }`}
  >
    {action}
    <ArrowRight className="h-[13px] w-[13px] shrink-0" />
  </button>
</td>
        </tr>
    ); 
};
export default ReviewQueueRow;
