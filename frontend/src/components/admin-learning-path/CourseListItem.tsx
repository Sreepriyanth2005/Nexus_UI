import React from "react";
import { GripVertical, ArrowUp, ArrowDown } from "lucide-react";

interface CourseListItemProps {
  id: string;
  index: number;
  title: string;
  onRemove: (id: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export const CourseListItem: React.FC<CourseListItemProps> = ({
  id,
  index,
  title,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}) => {
  return (
    <div className="flex items-center justify-between p-3 border border-slate-200 rounded-xl bg-white hover:border-slate-300 transition shadow-sm">
      <div className="flex items-center gap-3">
        {/* Grip handle and reorder buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={isFirst}
            className="p-1 rounded hover:bg-slate-100 disabled:opacity-20 text-slate-500 transition"
            title="Move Up"
          >
            <ArrowUp size={14} />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={isLast}
            className="p-1 rounded hover:bg-slate-100 disabled:opacity-20 text-slate-500 transition"
            title="Move Down"
          >
            <ArrowDown size={14} />
          </button>
          <span className="text-slate-300 px-1 select-none">|</span>
          <span className="text-slate-400 cursor-grab active:cursor-grabbing hover:text-slate-700 transition">
            <GripVertical size={15} />
          </span>
        </div>
        {/* Order index */}
        <span className="text-xs font-bold text-slate-400 font-mono w-5">
          {index}
        </span>
        {/* Entity type tag */}
        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200 uppercase tracking-wider">
          Course
        </span>
        {/* Title */}
        <span className="text-sm font-semibold text-slate-800">
          {title}
        </span>
      </div>

      <button
        type="button"
        onClick={() => onRemove(id)}
        className="px-3 py-1.5 border border-red-200 bg-red-50/50 hover:bg-red-50 text-red-600 hover:text-red-700 text-xs font-bold rounded-xl transition"
      >
        Remove
      </button>
    </div>
  );
};
