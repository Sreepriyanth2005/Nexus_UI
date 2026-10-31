import React from "react";
import { Lock, Play } from "lucide-react";

export type LessonStatus = "Free Preview" | "Locked" | "After all lessons";

interface LessonStatusBadgeProps {
  status: LessonStatus;
}

export const LessonStatusBadge: React.FC<LessonStatusBadgeProps> = ({ status }) => {
  if (status === "Free Preview") {
    return (
      <span className="inline-flex items-center gap-1 border border-emerald-200 bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded select-none">
        <Play size={10} className="fill-emerald-600 text-emerald-600" />
        Free preview
      </span>
    );
  }

  if (status === "Locked") {
    return (
      <span className="inline-flex items-center gap-1 border border-slate-200 bg-slate-50 text-slate-400 text-[10px] font-semibold px-2.5 py-0.5 rounded select-none">
        <Lock size={10} className="text-slate-400" />
        Locked
      </span>
    );
  }

  return (
    <span className="inline-flex items-center border border-slate-200 bg-slate-50 text-slate-500 text-[10px] font-semibold px-2.5 py-0.5 rounded select-none">
      After all lessons
    </span>
  );
};

export default LessonStatusBadge;
