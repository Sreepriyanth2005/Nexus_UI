import React from "react";
type CurriculumLesson = any;
import LessonStatusBadge from "./LessonStatusBadge";

interface CurriculumLessonRowProps {
  lesson: CurriculumLesson;
}

export const CurriculumLessonRow: React.FC<CurriculumLessonRowProps> = ({ lesson }) => {
  return (
    <div className="flex items-center justify-between gap-4 border border-slate-200 bg-white rounded-xl px-5 py-4 hover:bg-slate-50/50 transition-colors shadow-sm select-none">
      {/* Title & Type Info */}
      <div className="space-y-0.5">
        <h4 className="text-xs font-bold text-slate-850">
          {lesson.order}. {lesson.title}
        </h4>
        <p className="text-[10px] font-semibold text-slate-400">
          {lesson.type} &bull; {lesson.duration}
        </p>
      </div>

      {/* Status Badge */}
      <div className="shrink-0">
        <LessonStatusBadge status={lesson.status} />
      </div>
    </div>
  );
};

export default CurriculumLessonRow;
