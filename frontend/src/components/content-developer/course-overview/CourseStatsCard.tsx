import React from "react";

interface CourseStatsCardProps {
  status?: string;
}

export const CourseStatsCard: React.FC<CourseStatsCardProps> = ({ status }) => {
  const isPublished = status === "Published";

  return (
    <div className="bg-white border border-[#1111111a] rounded-xl p-5 shadow-xs space-y-2 select-none">
      <h3 className="text-[11px] font-bold text-[#5c5c5c] uppercase tracking-wider">
        QUICK STATS
      </h3>
      <p className="text-xs text-[#5c5c5c] leading-relaxed">
        {isPublished
          ? "Published course analytics and completion rates are active."
          : "Not yet published. Analytics available after publish."}
      </p>
    </div>
  );
};

export default CourseStatsCard;
