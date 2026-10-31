import React from "react";
import { Pencil } from "lucide-react";
type LessonItem = any;
import LessonTypeBadge from "./LessonTypeBadge";

interface LessonRowProps {
  lesson: LessonItem;
  onEdit?: (lessonId: string) => void;
}

export const LessonRow: React.FC<LessonRowProps> = ({ lesson, onEdit }) => {
  const hasFb = lesson.hasFeedback;

  return (
    <tr
      className={`group border-b border-[#1111111a] transition-colors select-none ${
        hasFb
          ? "bg-[#fef08a]/60 hover:bg-[#fef08a]/80 font-bold"
          : "hover:bg-[#f6f6f4]/60"
      }`}
    >
      {/* Order */}
      <td className="px-6 py-3.5 text-xs font-bold text-[#8c8c8c] w-12">
        {lesson.order < 10 ? `0${lesson.order}` : lesson.order}
      </td>

      {/* Title */}
      <td className="px-6 py-3.5">
        <span className={`text-xs font-bold ${hasFb ? "text-[#141414]" : "text-[#141414]"}`}>
          {lesson.title}
        </span>
      </td>

      {/* Type Badge */}
      <td className="px-6 py-3.5 w-24">
        <LessonTypeBadge type={lesson.type} />
      </td>

      {/* Duration */}
      <td className="px-6 py-3.5 text-xs font-semibold text-[#5c5c5c] w-24 text-right">
        {lesson.duration}
      </td>

      {/* Feedback / Status Dot */}
      <td className="px-6 py-3.5 w-44 text-right">
        <div className="flex items-center justify-end gap-2">
          {lesson.hasFeedback ? (
            <span className="inline-flex items-center gap-1.5 border border-[#c99b2e]/40 bg-[#f6e8c4] text-[#755a12] text-[10px] font-bold px-2.5 py-0.5 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2e9f5b]" />
              HAS OPEN FEEDBACK
            </span>
          ) : (
            <span className="w-2 h-2 rounded-full bg-[#2e9f5b] inline-block" />
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(lesson.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-[#8c8c8c] hover:text-[#141414] cursor-pointer"
              title="Edit lesson"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

export default LessonRow;
