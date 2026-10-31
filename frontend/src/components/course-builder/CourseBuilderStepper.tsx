// src/components/course-builder/CourseBuilderStepper.tsx

export type CourseBuilderSection =
  | "info"
  | "lessons"
  | "assessment"
  | "review";

interface CourseBuilderStepperProps {
  activeSection: CourseBuilderSection;
  onStepClick: (section: CourseBuilderSection) => void;
  assessmentRequired?: boolean;
  publishType?: "career-path" | "standalone-course" | "standalone-lesson";
}

const CourseBuilderStepper = ({
  activeSection,
  onStepClick,
  assessmentRequired = true,
  publishType = "standalone-course",
}: CourseBuilderStepperProps) => {
  const isLesson = publishType === "standalone-lesson";

  let stepCounter = 1;
  const infoStepNum = stepCounter++;
  const lessonsStepNum = !isLesson ? stepCounter++ : null;
  const assessmentStepNum = assessmentRequired ? stepCounter++ : null;
  const reviewStepNum = stepCounter;

  return (
    <div className="bg-white border-b border-gray-200 h-11 flex items-stretch text-xs font-semibold text-gray-400 select-none">
      {/* INFO */}
      <button
        type="button"
        onClick={() => onStepClick("info")}
        className={`flex-1 flex items-center justify-center gap-2 border-r border-gray-100 transition-all ${
          activeSection === "info"
            ? "text-gray-900 bg-gray-50/50"
            : "hover:bg-gray-50"
        }`}
      >
        <span
          className={`w-4 h-4 rounded-full flex items-center justify-center font-mono text-[9px] font-bold ${
            activeSection === "info"
              ? "bg-black text-white"
              : "border border-gray-300 text-gray-400"
          }`}
        >
          {infoStepNum}
        </span>

        <span>{isLesson ? "Content" : "Info"}</span>
      </button>

      {/* LESSONS / COURSES (for non-lesson entities) */}
      {!isLesson && (
        <button
          type="button"
          onClick={() => onStepClick("lessons")}
          className={`flex-1 flex items-center justify-center gap-2 border-r border-gray-100 transition-all ${
            activeSection === "lessons"
              ? "text-gray-900 bg-gray-50/50"
              : "hover:bg-gray-50"
          }`}
        >
          <span
            className={`w-4 h-4 rounded-full flex items-center justify-center font-mono text-[9px] font-bold ${
              activeSection === "lessons"
                ? "bg-black text-white"
                : "border border-gray-300 text-gray-400"
            }`}
          >
            {lessonsStepNum}
          </span>

          <span>{publishType === "career-path" ? "Courses" : "Lessons"}</span>
        </button>
      )}

      {/* ASSESSMENT */}
      {assessmentRequired && (
        <button
          type="button"
          onClick={() => onStepClick("assessment")}
          className={`flex-1 flex items-center justify-center gap-2 border-r border-gray-100 transition-all ${
            activeSection === "assessment"
              ? "text-gray-900 bg-gray-50/50"
              : "hover:bg-gray-50"
          }`}
        >
          <span
            className={`w-4 h-4 rounded-full flex items-center justify-center font-mono text-[9px] font-bold ${
              activeSection === "assessment"
                ? "bg-black text-white"
                : "border border-gray-300 text-gray-400"
            }`}
          >
            {assessmentStepNum}
          </span>

          <span>Assessment</span>
        </button>
      )}

      {/* REVIEW */}
      <button
        type="button"
        onClick={() => onStepClick("review")}
        className={`flex-1 flex items-center justify-center gap-2 transition-all ${
          activeSection === "review"
            ? "text-gray-900 bg-gray-50/50"
            : "hover:bg-gray-50"
        }`}
      >
        <span
          className={`w-4 h-4 rounded-full flex items-center justify-center font-mono text-[9px] font-bold ${
            activeSection === "review"
              ? "bg-black text-white"
              : "border border-gray-300 text-gray-400"
          }`}
        >
          {reviewStepNum}
        </span>

        <span>Review</span>
      </button>
    </div>
  );
};

export default CourseBuilderStepper;