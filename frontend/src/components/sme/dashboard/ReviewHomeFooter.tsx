import React from "react";

export const ReviewHomeFooter: React.FC = () => {
  return (
    <div
      className="
        select-none rounded-[var(--r-md)]
        border border-dashed border-[var(--c-honey-soft)]
        bg-[var(--c-honey-wash)]
        px-4 py-3
        text-[11px] font-[var(--fw-medium)] leading-5
        text-[var(--c-honey-text)]
        transition-colors duration-[var(--dur-fast)] ease-[var(--tn)]
      "
    >
      <strong className="font-[var(--fw-extrabold)]">
        SMEs only see courses in their domain expertise
      </strong>{" "}
      · Approval gating: courses with open Required comments cannot be
      approved. 3-day SLA tracked per submission. Overdue items (red
      dot) escalate to Super Admin at 6 days. Verdicts: Approved /
      Changes requested / Rejected (all require a comment).
    </div>
  );
};

export default ReviewHomeFooter;