import React from "react";
import { ArrowRight, CheckSquare, X } from "../../../assets/icons";
import { RecentlyReviewedItem as ReviewedItem } from "../../../types/smeDashboard.types";
import ReviewStatusBadge from "./ReviewStatusBadge";

interface RecentlyReviewedListProps {
  reviewed?: ReviewedItem[];
  onViewAll?: () => void;
}

export const RecentlyReviewedList: React.FC<RecentlyReviewedListProps> = ({
  reviewed = [],
  onViewAll,
}) => (
  <div
    className="flex h-full flex-col rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--paper)] shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] ease-[var(--tn)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)]"
    style={{ fontFamily: "var(--font-sans)" }}
  >
    <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
      <h3
        className="m-0 text-[var(--ink)]"
        style={{
          fontSize: "16px",
          fontWeight: "var(--fw-bold)" as any,
          fontFamily: "var(--font-sans)",
        }}
      >
        Recently reviewed
      </h3>
      <button
        type="button"
        onClick={onViewAll}
        className="group flex items-center gap-1 uppercase text-[var(--ink)] transition-colors hover:text-[var(--ink)]"
        style={{
          fontSize: "12px",
          fontWeight: "var(--fw-bold)" as any,
          letterSpacing: "0.08em",
          fontFamily: "var(--font-label)",
        }}
      >
        VIEW ALL
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </button>
    </div>

    <div className="flex-1 divide-y divide-[var(--line)]">
      {!reviewed.length ? (
        <div
          className="px-5 py-10 text-center text-[var(--ink-mute)]"
          style={{
            fontSize: "var(--fs-body)",
            fontWeight: "var(--fw-semibold)" as any,
            fontFamily: "var(--font-sans)",
          }}
        >
          No recently reviewed items recorded.
        </div>
      ) : (
        reviewed.map((item, idx) => {
          const approved =
            item.status === "Approved" || item.dot === "green";
          return (
            <div
              key={idx}
              className="group flex items-center justify-between gap-3 px-5 py-3.5 transition-colors duration-[var(--dur-fast)] ease-[var(--tn)] hover:bg-[var(--paper-2)]"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={`flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg ${
                    approved
                      ? "bg-[var(--c-sage-wash)] text-[var(--c-sage)]"
                      : "bg-[var(--c-danger-wash)] text-[var(--c-danger)]"
                  }`}
                >
                  {approved ? (
                    <CheckSquare className="h-4 w-4" strokeWidth={1.8} color="var(--c-sage)" />
                  ) : (
                    <X className="h-4 w-4" strokeWidth={1.8} color="var(--c-clay)" />
                  )}
                </span>
                <div className="min-w-0">
                  <p
                    className="mb-0.5 truncate"
                    style={{
                      fontSize: "16px",
                      fontWeight: "var(--fw-semibold)" as any,
                      fontFamily: "var(--font-sans)",
                    }}
                  >
                    {item.title}
                  </p>
                  <p
                    className="truncate text-[var(--ink-mute)]"
                    style={{
                      fontSize: "var(--fs-micro)",
                      fontWeight: "var(--fw-regular)" as any,
                      fontFamily: "var(--font-sans)",
                    }}
                  >
                    Reviewed · {item.reviewer}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2.5">
                <ReviewStatusBadge
                  status={item.status as any}
                  dotColor={item.dot as any}
                />
                <span
                  className="whitespace-nowrap text-[var(--ink-soft)]"
                  style={{
                    fontSize: "var(--fs-meta)",
                    fontWeight: "var(--fw-semibold)" as any,
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  {item.time}
                </span>
              </div>
            </div>
          );
        })
      )}
    </div>
  </div>
);

export default RecentlyReviewedList;