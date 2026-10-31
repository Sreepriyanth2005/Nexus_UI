import React from "react";

export type CourseStatus =
  | "Draft"
  | "Changes Requested"
  | "Published"
  | "Review Pending"
  | "In SME Review"
  | string;

interface StatusBadgeProps {
  status: CourseStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let dotColor = "bg-gray-400";
  let badgeClasses = "text-gray-600 bg-gray-100 border-gray-200";
  let label = status;

  switch (status) {
    case "Published":
      dotColor = "bg-emerald-500";
      badgeClasses = "text-emerald-700 bg-emerald-50 border-emerald-200";
      break;
    case "Changes Requested":
      dotColor = "bg-amber-500";
      badgeClasses = "text-amber-700 bg-amber-50 border-amber-200";
      label = "Changes Requested";
      break;
    case "In SME Review":
    case "Review Pending":
      dotColor = "bg-blue-500";
      badgeClasses = "text-blue-700 bg-blue-50 border-blue-200";
      label = status === "Review Pending" ? "In Review" : status;
      break;
    case "Draft":
      dotColor = "bg-gray-400";
      badgeClasses = "text-gray-600 bg-gray-100 border-gray-200";
      break;
    default:
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 border px-2.5 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap select-none ${badgeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {label}
    </span>
  );
};

export default StatusBadge;
