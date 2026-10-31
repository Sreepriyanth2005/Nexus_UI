import React from "react";

export type ReviewStatus = "Approved" | "Changes requested" | "Rejected";

interface Props {
  status: ReviewStatus;
  dotColor?: "green" | "red";
}

export const ReviewStatusBadge: React.FC<Props> = ({ status, dotColor }) => {
  const approved = status === "Approved" || dotColor === "green";
  const rejected = status === "Rejected" || dotColor === "red";

  const cls = approved
    ? "border-[var(--c-sage)] bg-transparent text-[var(--c-sage)]"
    : rejected
      ? "border-[var(--c-danger)] bg-transparent text-[var(--c-danger)]"
      : "border-[var(--c-honey)] bg-transparent text-[var(--c-honey)]";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[var(--r-pill)] border px-2.5 py-0.5 capitalize whitespace-nowrap ${cls}`}
      style={{
        fontSize: "var(--fs-label)",
        fontWeight: "var(--fw-semibold)" as any,
        fontFamily: "var(--font-sans)",
      }}
    >
      {approved ? "Approved" : rejected ? "Rejected" : "Changes requested"}
    </span>
  );
};

export default ReviewStatusBadge;