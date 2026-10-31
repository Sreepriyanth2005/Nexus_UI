import React from "react";

interface CourseMetaBadgeProps {
  label: string;
  hasDot?: boolean;
  dotColor?: string;
}

export const CourseMetaBadge: React.FC<CourseMetaBadgeProps> = ({
  label,
  hasDot = false,
  dotColor = "bg-emerald-500",
}) => {
  return (
    <span className="inline-flex items-center gap-1.5 border border-slate-200 bg-slate-50 text-slate-650 text-[10px] font-bold px-2.5 py-0.5 rounded-full select-none">
      {hasDot && <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />}
      <span>{label}</span>
    </span>
  );
};

export default CourseMetaBadge;
