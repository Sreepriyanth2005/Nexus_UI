import React from "react";
import ReviewQueueRow, { QueueItem } from "./ReviewQueueRow";
import { ArrowRight, ChevronsUpDown } from "lucide-react";
import { Link } from "react-router";

interface Props {
  items: QueueItem[];
  onReview?: (item: QueueItem) => void;
  onTitleClick?: (item: QueueItem) => void;
  activeTab?: string;
  title?: string;
}

/**
 * Priority rules (fully dynamic from waiting days):
 *
 * Absolute thresholds:
 *   ≥ 5 days  → High
 *   ≥ 2 days  → Medium
 *   < 2 days  → Normal
 *
 * Relative thresholds (wide age spread):
 *   top ~33%    → High
 *   middle ~33% → Medium
 *   bottom ~33% → Normal
 */
export const ReviewQueueTable: React.FC<Props> = ({
  items,
  onReview,
  onTitleClick,
  activeTab = "pending",
  title = "Review queue",
}) => {
  const waitingDaysArray = items.map((item) => {
    if (!item.submittedDate || item.submittedDate === "-") return 0;
    const submitted = new Date(item.submittedDate);
    if (isNaN(submitted.getTime())) return 0;
    const diffTime = Date.now() - submitted.getTime();
    return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  });

  const maxDays = items.length > 0 ? Math.max(...waitingDaysArray) : 0;
  const minDays = items.length > 0 ? Math.min(...waitingDaysArray) : 0;

  let highThreshold = maxDays * 0.66;
  let mediumThreshold = maxDays * 0.33;

  if (maxDays === minDays) {
    highThreshold = Infinity;
    mediumThreshold = Infinity;
  }

  const getPriority = (days: number): "High" | "Medium" | "Normal" => {
    if (maxDays > 0 && maxDays !== minDays) {
      if (days >= highThreshold) return "High";
      if (days >= mediumThreshold) return "Medium";
      return "Normal";
    }
    if (days >= 5) return "High";
    if (days >= 2) return "Medium";
    return "Normal";
  };

  const thStyle: React.CSSProperties = {
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    fontFamily: "var(--font-sans)",
    textTransform: "uppercase",
  };

  return (
    <div
      className="overflow-hidden rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--paper)] shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] ease-[var(--tn)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)]"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <div className="flex items-start sm:items-center justify-between border-b border-[var(--line)] px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
          <h3
            className="m-0 text-[var(--ink)]"
            style={{
              fontSize: "16px",
              fontWeight: 700,
              fontFamily: "var(--font-sans)",
            }}
          >
            {title}
          </h3>
          <span
            className="text-[var(--ink-soft)]"
            style={{
              fontSize: "12px",
              fontWeight: 500,
              fontFamily: "var(--font-sans)",
            }}
          >
            (assigned to me)
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <span
            className="inline-flex rounded-full border border-[var(--line)] bg-[var(--paper)] px-2.5 py-0.5 text-[var(--ink-soft)]"
            style={{
              fontSize: "12px",
              fontWeight: 700,
              fontFamily: "var(--font-sans)",
            }}
          >
            {items.length} {items.length === 1 ? "course" : "courses"}
          </span>
          <Link
            to="/sme/queue"
            className="flex items-center gap-1 uppercase text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)]"
            style={{
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.06em",
              fontFamily: "var(--font-sans)",
            }}
          >
            VIEW ALL <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[var(--line)] bg-[var(--paper-2)]">
              {["LEARNING", "SUBMITTED BY", "SUBJECT", "WAITING", "PRIORITY", "ACTION"].map(
                (label) => (
                  <th
                    key={label}
                    className="px-5 py-2.5 text-[var(--ink-mute)]"
                    style={thStyle}
                  >
                    <div className="flex cursor-pointer items-center gap-1.5">
                      {label}
                      {label !== "ACTION" && (
                        <ChevronsUpDown className="h-3 w-3 opacity-50" />
                      )}
                    </div>
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {items.length ? (
              items.map((item, idx) => {
                const pendingDays = waitingDaysArray[idx];
                const dynamicPriority = getPriority(pendingDays);

                return (
                  <ReviewQueueRow
                    key={item.id || idx}
                    item={item}
                    activeTab={activeTab}
                    onReview={onReview}
                    onTitleClick={onTitleClick}
                    dynamicPriority={dynamicPriority}
                    isPrimaryAction={idx === 0 && activeTab === "pending"}
                  />
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-10 text-center text-[var(--ink-mute)]"
                  style={{
                    fontSize: "13px",
                    fontWeight: 500,
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  No queue items found.
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