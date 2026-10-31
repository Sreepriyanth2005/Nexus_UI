import React from "react";
import { RecentlyReviewedItem as ReviewedItem } from "../../../types/smeDashboard.types";
import ReviewStatusBadge from "./ReviewStatusBadge";
import { Check, X } from "lucide-react";

interface RecentlyReviewedItemProps {
  item: ReviewedItem;
  isLast: boolean;
}

export const RecentlyReviewedItem: React.FC<RecentlyReviewedItemProps> = ({
  item,
}) => {
  const isApproved = item.status === "Approved" || item.dot === "green";

  return (
    <div className="flex items-center justify-between gap-3 px-1 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--r-sm)] ${
            isApproved
              ? "bg-[var(--c-sage-wash)]"
              : "bg-[var(--c-clay-wash)]"
          }`}
        >
          {isApproved ? (
            <Check className="h-3.5 w-3.5 text-[var(--c-sage-text)] stroke-[2.5]" />
          ) : (
            <X className="h-3.5 w-3.5 text-[var(--c-clay-text)] stroke-[2.5]" />
          )}
        </div>
        <div className="min-w-0 space-y-0.5">
          <p className="truncate text-[13px] font-[var(--fw-medium)] leading-snug text-[var(--ink)]">
            {item.title}
          </p>
          <p className="truncate text-[11px] font-[var(--fw-medium)] text-[var(--ink-mute)]">
            Reviewed · {item.reviewer}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2.5">
        <ReviewStatusBadge
          status={item.status as any}
          dotColor={item.dot}
        />
        <span className="whitespace-nowrap text-[11px] text-[var(--ink-mute)]">
          {item.time}
        </span>
      </div>
    </div>
  );
};

export default RecentlyReviewedItem;