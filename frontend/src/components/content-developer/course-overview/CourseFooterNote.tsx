import React from "react";

export const CourseFooterNote: React.FC = () => {
  return (
    <div className="bg-amber-50 border border-dashed border-amber-300 rounded-xl p-4 text-[11px] text-amber-800 font-medium leading-relaxed select-none">
      <strong>Author's own course hub</strong> · Distinct from the SME review screen (reviewer side) and the admin All Courses list (oversight). Editing opens Course Builder. Resolving feedback opens the author feedback view (s-cd-feedback). The "View SME feedback" button and the banner link both route to #cd-feedback. Stats card is intentionally greyed: this course is not yet published.
    </div>
  );
};

export default CourseFooterNote;
