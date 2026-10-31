import React from "react";
import { ArrowRight, Clock3 } from "lucide-react";
import { useNavigate } from "react-router";
export interface QueueItem { id: string; reviewId?: string; submittedDate: string; timestamp: string; submittedBy: string; title: string; type: "Course" | "Lesson" | "Career Path" | string; typeTag?: string; lessonsDetail: string; waitTime: string; approvedDate?: string; approvedBy?: string; comment?: string; duration?: string; visibility?: string; subject?: string; dueDate?: string; status?: string; rawStatus?: string; image?: string; originalEntity?: any; thumbnailAssetId?: string; thumbnail?: string; }
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
            pendingDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
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
                <button type="button" onClick={() => onTitleClick?.(item)} className="max-w-[320px] truncate text-left text-[14px] font-[var(--fw-bold)] leading-[var(--lh-tight)] text-[var(--ink)] hover:text-[var(--c-honey-text)] hover:underline">
                    {item.title}
                </button>
            </td>
            <td className="max-w-[200px] truncate px-5 py-4 text-[13px] font-medium text-[var(--ink-soft)]">
                {item.submittedBy || "-"}
            </td>
            <td className="px-5 py-4">
                <span className="inline-flex rounded-full border border-[var(--line)] bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-soft)] shadow-sm">
                    {item.typeTag || item.type || item.subject || "-"}
                </span>
            </td>
            <td className="whitespace-nowrap px-5 py-4">
                <span className={`inline-flex items-center gap-1.5 text-[13px] font-[var(--fw-bold)] ${overdue ? "text-[var(--c-danger)]" : "text-[var(--ink-soft)]"}`}>
                    <Clock3 className="h-4 w-4" />
                    {pendingDays > 0 ? `${pendingDays}d waiting` : (item.dueDate || "-")}
                </span>
            </td>
            <td className="px-5 py-4">
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium shadow-sm bg-white ${
                    priority === 'High' ? 'text-amber-800 border-amber-200' :
                    priority === 'Medium' ? 'text-orange-800 border-orange-200' :
                    'text-slate-500 border-[var(--line)]'
                }`}>
                    {priority}
                </span>
            </td>
            <td className="px-5 py-4">
                <button type="button" onClick={() => onReview?.(item)} className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-4 text-[13px] transition-[background-color,border-color,box-shadow,transform] duration-[var(--dur-fast)] active:scale-[0.98] shadow-sm ${
                    isHighPriority && activeTab === "pending" 
                    ? "border-[#fef08a] bg-[#fef08a] font-[var(--fw-bold)] text-[#422006] hover:bg-[#fde047]"
                    : "border-[var(--line)] bg-white font-[var(--fw-bold)] text-[var(--ink)] hover:bg-[var(--paper-2)]"
                }`}>
                    {action}<ArrowRight className="h-4 w-4" />
                </button>
            </td>
        </tr>
    ); 
};
export default ReviewQueueRow;
