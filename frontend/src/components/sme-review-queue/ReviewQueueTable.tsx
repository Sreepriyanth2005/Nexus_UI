import React from "react";
import { AlertTriangle, ChevronsUpDown } from "lucide-react";
import { QueueItem } from "./ReviewQueueRow";

interface Props { items: QueueItem[]; onReview?: (item: QueueItem) => void; onTitleClick?: (item: QueueItem) => void; activeTab?: string; title?: string; }

export const ReviewQueueTable: React.FC<Props> = ({ items, onReview, onTitleClick, activeTab, title }) => {
  const renderHeader = (label: string) => (
    <th 
      className="px-5 py-2.5 text-left cursor-pointer transition-colors hover:bg-[var(--paper-3)] text-[var(--ink-mute)]"
      style={{
        fontSize: "12px",
        fontWeight: 700,
        letterSpacing: "0.08em",
        fontFamily: "var(--font-sans)",
        textTransform: "uppercase"
      }}
    >
      <div className="flex items-center gap-1.5">
        {label}
        <ChevronsUpDown className="h-3 w-3 opacity-50" />
      </div>
    </th>
  );

  return (
    <div className="border-t border-[var(--line)] flex flex-col">
      {/* ── MOBILE CARD VIEW ── */}
      <div className="hidden divide-y divide-[var(--line)]">
        {items.length ? items.map((item, idx) => {
          const isOverdue = item.dueDate && new Date(item.dueDate) < new Date();
          return (
            <div 
              key={item.id || idx} 
              onClick={() => onReview?.(item)} 
              className="p-4 cursor-pointer bg-white hover:bg-[var(--paper-2)] flex flex-col gap-2.5 transition-colors duration-[var(--dur-fast)]"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              <div className="flex justify-between items-start gap-4">
                <div className="text-[15px] font-[var(--fw-bold)] text-[var(--ink)] leading-tight">
                  {item.title}
                </div>
                {isOverdue && <AlertTriangle className="size-4 text-[var(--c-danger)] shrink-0" />}
              </div>
              <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-[13px] font-medium text-[var(--ink-soft)]">
                {item.subject && item.subject !== "-" && <span>{item.subject}</span>}
                {item.subject && item.subject !== "-" && item.visibility && <span className="text-[var(--ink-mute)]">•</span>}
                {item.visibility && <span>{item.visibility}</span>}
              </div>
              <div className="flex items-center justify-between mt-1 text-[12px] font-[var(--fw-bold)] text-[var(--ink-mute)]">
                {item.duration && (
                  <span className="bg-[var(--paper-2)] px-2 py-0.5 rounded border border-[var(--line)] text-[var(--ink-soft)]">
                    {item.duration}
                  </span>
                )}
                {item.dueDate && (
                  <span className={`flex items-center gap-1 ${isOverdue ? "text-[var(--c-danger)]" : ""}`}>
                    Due: {item.dueDate}
                  </span>
                )}
              </div>
            </div>
          );
        }) : (
          <div className="p-12 text-center text-[13px] font-medium text-[var(--ink-mute)]">
            No items found.
          </div>
        )}
      </div>

      {/* ── DESKTOP TABLE VIEW ── */}
      <div className=" overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-left bg-white">
          <thead>
            <tr className="bg-[var(--paper-2)] border-b border-[var(--line)]">
              {renderHeader('COURSE NAME')}
              {renderHeader('SUBJECT')}
              {renderHeader('DURATION')}
              {renderHeader('VISIBILITY')}
              {renderHeader('DATE RECEIVED')}
              {renderHeader('DATE DUE')}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {items.length ? items.map((item, idx) => {
              const isOverdue = item.dueDate && new Date(item.dueDate) < new Date();
              return (
                <tr key={item.id || idx} onClick={() => onReview?.(item)} className="group/row cursor-pointer transition-colors duration-[var(--dur-fast)] hover:bg-[var(--paper-2)]">
                  <td className="px-5 py-4" style={{ fontFamily: "var(--font-sans)" }}>
                    <div className="truncate text-[16px] font-[var(--fw-bold)] text-[var(--ink)]">
                      {item.title}
                    </div>
                  </td>
                  <td className="px-5 py-4" style={{ fontFamily: "var(--font-sans)" }}>
                    <div className="truncate max-w-[180px] text-[16px] font-medium text-[var(--ink-soft)]">
                      {item.subject || "-"}
                    </div>
                  </td>
                  <td className="px-5 py-4" style={{ fontFamily: "var(--font-sans)" }}>
                    <div className="text-[14px] font-[var(--fw-bold)] text-[var(--ink-soft)]">
                      {item.duration || "1h"}
                    </div>
                  </td>
                  <td className="px-5 py-4" style={{ fontFamily: "var(--font-sans)" }}>
                    <span className="inline-flex items-center rounded-full border border-[var(--line)] bg-white px-2.5 py-1 text-[12px] font-bold tracking-wider text-[var(--ink-soft)]">
                      {item.visibility || "Public"}
                    </span>
                  </td>
                  <td className="px-5 py-4" style={{ fontFamily: "var(--font-sans)" }}>
                    <div className="text-[14px] font-[var(--fw-bold)] text-[var(--ink-soft)]">
                      {item.submittedDate && item.submittedDate !== "-" ? item.submittedDate : "2026-07-09"}
                    </div>
                  </td>
                  <td className="px-5 py-4" style={{ fontFamily: "var(--font-sans)" }}>
                    <div className={`flex items-center gap-1.5 text-[14px] font-[var(--fw-bold)] ${isOverdue ? "text-[var(--c-danger)]" : "text-[var(--ink-soft)]"}`}>
                      {isOverdue && <AlertTriangle className="size-3.5" />}
                      {item.dueDate || "-"}
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-[13px] font-medium text-[var(--ink-mute)]">
                  No items found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default ReviewQueueTable;
