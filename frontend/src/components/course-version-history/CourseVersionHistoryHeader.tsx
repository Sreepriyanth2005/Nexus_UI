import React from "react";
import { useNavigate } from "react-router";

export const CourseVersionHistoryHeader: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="pb-4">
      <button
        onClick={() => navigate(-1)}
        className="text-xs text-slate-500 hover:text-slate-900 transition flex items-center gap-1 font-semibold mb-2"
      >
        ← All Courses
      </button>
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
        Data Quality Foundations · Version history
      </h1>
    </div>
  );
};
export default CourseVersionHistoryHeader;
