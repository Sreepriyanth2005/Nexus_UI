import React from "react";
import { BookOpen, Clock, Plus } from "lucide-react";
type LessonItem = any;
type AssessmentMetadata = any;
import LessonRow from "./LessonRow";
import AssessmentRow from "./AssessmentRow";

interface CourseStructureCardProps {
  lessons: LessonItem[];
  assessment: AssessmentMetadata;
}

export const CourseStructureCard: React.FC<CourseStructureCardProps> = ({
  lessons,
  assessment,
}) => {
  const totalLessons = lessons?.length ?? 0;
  const totalDurationMins = lessons?.reduce((acc: number, l: any) => {
    const mins = parseInt(l.duration) || 0;
    return acc + mins;
  }, 0);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Card Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-4 h-4 text-gray-400" />
          <h3 className="text-xs font-bold text-gray-700 tracking-wider uppercase">
            Course Structure
          </h3>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-semibold text-gray-400">
          <span className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            {totalLessons} {totalLessons === 1 ? "lesson" : "lessons"}
          </span>
          {totalDurationMins > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              ~{totalDurationMins} min
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-6 py-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 w-12">#</th>
              <th className="px-6 py-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">Lesson</th>
              <th className="px-6 py-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 w-24">Type</th>
              <th className="px-6 py-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 w-24 text-right">Duration</th>
              <th className="px-6 py-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 w-40 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {lessons.map((lesson: any) => (
              <LessonRow key={lesson.id} lesson={lesson} />
            ))}
            <AssessmentRow assessment={assessment} />
          </tbody>
        </table>
      </div>

      {/* Footer: Add lesson */}
      <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50">
        <button className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 hover:text-gray-800 transition-colors cursor-pointer">
          <Plus className="w-3.5 h-3.5" />
          Add lesson
        </button>
      </div>
    </div>
  );
};

export default CourseStructureCard;
