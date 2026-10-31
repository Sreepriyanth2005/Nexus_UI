import React from "react";
type CurriculumLesson = any;
type FinalAssessmentDetails = any;
import CurriculumLessonRow from "./CurriculumLessonRow";
import FinalAssessmentRow from "./FinalAssessmentRow";

interface CurriculumCardProps {
  lessons: CurriculumLesson[];
  assessment: FinalAssessmentDetails;
}

export const CurriculumCard: React.FC<CurriculumCardProps> = ({
  lessons,
  assessment,
}) => {
  return (
    <div className="space-y-4">
      {/* Title */}
      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 select-none">
        Curriculum &bull; {lessons.length} lessons
      </h2>

      {/* List */}
      <div className="space-y-2">
        {lessons.map((lesson) => (
          <CurriculumLessonRow key={lesson.id} lesson={lesson} />
        ))}
        <FinalAssessmentRow assessment={assessment} />
      </div>
    </div>
  );
};

export default CurriculumCard;
