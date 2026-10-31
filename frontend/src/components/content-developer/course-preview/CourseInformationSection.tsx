import React from "react";

interface CourseInformationSectionProps {
  objectives: string[];
}

export const CourseInformationSection: React.FC<CourseInformationSectionProps> = ({
  objectives,
}) => {
  return (
    <section className="space-y-4">
      {/* Title */}
      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 select-none">
        What you'll learn
      </h2>

      {/* Two column list */}
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 pl-0 list-none text-xs font-semibold text-slate-650 leading-relaxed">
        {objectives.map((obj, idx) => (
          <li key={idx} className="flex items-start gap-2 select-none">
            <span className="text-slate-400 font-bold mt-[1px]">&bull;</span>
            <span>{obj}</span>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default CourseInformationSection;
