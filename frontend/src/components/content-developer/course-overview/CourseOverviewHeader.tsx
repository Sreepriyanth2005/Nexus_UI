import React from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
type CourseMetadata = any;

interface CourseOverviewHeaderProps {
  course: CourseMetadata;
  onEdit?: () => void;
  onViewFeedback?: () => void;
  onPreview?: () => void;
}

export const CourseOverviewHeader: React.FC<CourseOverviewHeaderProps> = ({
  course,
  onEdit,
  onViewFeedback,
  onPreview,
}) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4 select-none">
      {/* Back Link */}
      <button
        onClick={() => navigate("/content-developer-dashboard")}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8c8c8c] hover:text-[#141414] transition-colors cursor-pointer bg-transparent border-none p-0"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        MY WORKSPACE
      </button>

      {/* Page Label */}
      <p className="text-[11px] uppercase tracking-[0.16em] text-[#5c5c5c] font-bold">
        COURSE HUB
      </p>

      {/* Title & Actions Row */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div className="space-y-3">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#141414] leading-tight">
            {course.title || "Knowledge Mapping Fundamentals"}
          </h1>

          {/* Status Tags */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {course.careerPath && (
              <span className="inline-flex items-center gap-1 text-[#5c5c5c] font-semibold">
                <span className="text-[#8c8c8c]">In:</span> {course.careerPath}
              </span>
            )}
            <span className="inline-flex items-center bg-[#f8ded7] text-[#9c422f] border border-[#f4b8b0] text-[11px] font-bold px-3 py-0.5 rounded-full">
              {course.status || "Rejected"}
            </span>
            {course.version && (
              <span className="inline-flex items-center bg-white border border-[#1111111a] text-[#5c5c5c] text-[11px] font-semibold px-3 py-0.5 rounded-full">
                {course.version}
              </span>
            )}
          </div>

          {/* Metadata */}
          <p className="text-xs text-[#5c5c5c] font-medium leading-relaxed flex flex-wrap items-center gap-1.5">
            {course.createdDate && <span>Created {course.createdDate}</span>}
            {course.createdDate && course.lastEdited && <span>·</span>}
            {course.lastEdited && <span>Last edited {course.lastEdited}</span>}
            {course.domain && (
              <>
                <span>·</span>
                <span>Domain: {course.domain}</span>
              </>
            )}
          </p>
        </div>

        {/* Top Right Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 shrink-0 pt-1">
          <button
            onClick={onEdit}
            className="bg-[#fef08a] hover:bg-[#fde047] text-[#141414] font-bold text-xs px-5 py-2.5 rounded-full flex items-center gap-1.5 border border-yellow-300 shadow-xs transition-colors cursor-pointer outline-none"
          >
            Edit in Course Builder <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onViewFeedback}
            className="bg-white border border-[#1111111a] text-[#141414] hover:bg-[#141414] hover:text-white transition-colors text-xs font-bold px-4 py-2.5 rounded-full cursor-pointer outline-none shadow-xs"
          >
            View SME feedback{course.openFeedbackCount > 0 ? ` (${course.openFeedbackCount} required)` : ""}
          </button>
          <button
            onClick={onPreview}
            className="bg-white border border-[#1111111a] text-[#141414] hover:bg-[#141414] hover:text-white transition-colors text-xs font-bold px-4 py-2.5 rounded-full cursor-pointer outline-none shadow-xs"
          >
            Preview as learner
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseOverviewHeader;
