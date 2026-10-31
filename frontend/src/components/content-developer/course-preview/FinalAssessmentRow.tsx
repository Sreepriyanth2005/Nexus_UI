import React from "react";
type FinalAssessmentDetails = any;
import LessonStatusBadge from "./LessonStatusBadge";

interface FinalAssessmentRowProps {
  assessment: FinalAssessmentDetails;
}

export const FinalAssessmentRow: React.FC<FinalAssessmentRowProps> = ({ assessment }) => {
  return (
    <div className="flex items-center justify-between gap-4 border border-slate-200 bg-white rounded-xl px-5 py-4 hover:bg-slate-50/50 transition-colors shadow-sm select-none">
      {/* Title & Type Info */}
      <div className="space-y-0.5">
        <h4 className="text-xs font-bold text-slate-850">
          Final assessment
        </h4>
        <p className="text-[10px] font-semibold text-slate-400">
          {assessment.questions} questions &bull; pass mark {assessment.passMark}%
        </p>
      </div>

      {/* Status Badge */}
      <div className="shrink-0">
        <LessonStatusBadge status="After all lessons" />
      </div>
    </div>
  );
};

export default FinalAssessmentRow;
