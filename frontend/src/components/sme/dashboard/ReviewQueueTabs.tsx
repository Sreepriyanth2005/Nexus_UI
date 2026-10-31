import React from "react";

interface Props {
  inboxCount: number;
  inProgressCount: number;
  reviewedCount: number;
  activeTab: "pending" | "in_progress" | "reviewed";
  onTabChange: (tab: "pending" | "in_progress" | "reviewed") => void;
}

export const ReviewQueueTabs: React.FC<Props> = ({
  inboxCount,
  inProgressCount,
  reviewedCount,
  activeTab,
  onTabChange,
}) => {
  const tabs = [
    ["pending", "Inbox", inboxCount],
    ["in_progress", "In progress", inProgressCount],
    ["reviewed", "Reviewed", reviewedCount],
  ] as const;

  return (
    <div className="flex border-b border-[var(--line)]">
      {tabs.map(([key, label, count]) => (
        <button
          key={key}
          type="button"
          onClick={() => onTabChange(key)}
          className={`relative -mb-px px-4 py-3 text-[var(--fs-label)] font-[var(--fw-semibold)] transition-colors duration-[var(--dur-fast)] ease-[var(--tn)] ${
            activeTab === key
              ? "border-b-2 border-[var(--c-honey)] text-[var(--ink)]"
              : "border-b-2 border-transparent text-[var(--ink-mute)] hover:text-[var(--ink)]"
          }`}
        >
          {label}{" "}
          <span
            className={
              activeTab === key
                ? "text-[var(--c-honey-text)]"
                : "text-[var(--ink-faint)]"
            }
          >
            ({count})
          </span>
        </button>
      ))}
    </div>
  );
};

export default ReviewQueueTabs;