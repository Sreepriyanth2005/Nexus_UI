import React from "react";
import { useNavigate } from "react-router";

interface FeedbackResolutionHeaderProps {
  courseName?: string;
}

export const FeedbackResolutionHeader: React.FC<FeedbackResolutionHeaderProps> = ({
  courseName = "Knowledge Mapping Fundamentals",
}) => {
  const navigate = useNavigate();

  return (
    <div className="pb-4 border-b border-slate-200">
      <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold mb-2">
        <button
          onClick={() => navigate(-1)}
          className="hover:text-slate-900 transition"
        >
          ← Course overview
        </button>
        <span className="text-slate-300">|</span>
        <span className="text-slate-800">SME feedback</span>
      </div>
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
        SME feedback: {courseName}
      </h1>
    </div>
  );
};
export default FeedbackResolutionHeader;
