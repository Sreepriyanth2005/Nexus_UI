import React from "react";
type PreviewCourseMetadata = any;
type InstructorDetails = any;
import CourseMetaBadge from "./CourseMetaBadge";

interface CourseHeroSectionProps {
  course: PreviewCourseMetadata;
  instructor: InstructorDetails;
}

export const CourseHeroSection: React.FC<CourseHeroSectionProps> = ({
  course,
  instructor,
}) => {
  return (
    <div className="space-y-4">
      {/* Category */}
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block select-none">
        {course.category}
      </span>

      {/* Title */}
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
        {course.title}
      </h1>

      {/* Description */}
      <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-3xl">
        {course.description}
      </p>

      {/* Metadata Badges Row */}
      <div className="flex flex-wrap items-center gap-2 pt-1 select-none">
        <CourseMetaBadge label={`${course.lessonsCount} lessons`} />
        <CourseMetaBadge label={`${course.durationHours} hours`} />
        <CourseMetaBadge label={course.level} />
        <CourseMetaBadge label={course.certificateName} />
        <CourseMetaBadge label={`${course.enrolledCount} enrolled`} hasDot={true} />
      </div>

      {/* Instructor Box */}
      <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-4 flex items-center gap-3.5 max-w-xl shadow-sm pt-4">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm select-none shrink-0">
          {instructor.avatarInitials}
        </div>

        {/* Info */}
        <div className="space-y-0.5 select-none">
          <h4 className="text-xs font-bold text-slate-800 leading-tight">
            {instructor.name}
          </h4>
        </div>
      </div>
    </div>
  );
};

export default CourseHeroSection;
