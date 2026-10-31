import React from "react";
interface Props { inboxCount: number; inProgressCount: number; reviewedCount: number; activeTab: "pending" | "in_progress" | "reviewed"; onTabChange: (tab: "pending" | "in_progress" | "reviewed") => void; }
export const ReviewQueueTabs: React.FC<Props> = ({ inboxCount, inProgressCount, reviewedCount, activeTab, onTabChange }) => { 
  const tabs = [["pending", "Inbox", inboxCount], ["in_progress", "In progress", inProgressCount], ["reviewed", "Reviewed", reviewedCount]] as const; 
  return (
    <div className="flex gap-4">
      {tabs.map(([key, label, count]) => (
        <button 
          key={key} 
          type="button" 
          onClick={() => onTabChange(key)} 
          className={`relative px-3 py-4 text-[16px] font-[700] transition-colors duration-200 ${activeTab === key ? "text-[var(--ink)]" : "text-[var(--ink-mute)] hover:text-[var(--ink)]"}`}
          style={{ fontFamily: "var(--font-sans)" }}
        >
          {label} <span className={activeTab === key ? "text-[var(--ink-soft)]" : "text-[var(--ink-faint)]"}>({count})</span>
          {activeTab === key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--ink)]" />}
        </button>
      ))}
    </div>
  ); 
};
export default ReviewQueueTabs;
