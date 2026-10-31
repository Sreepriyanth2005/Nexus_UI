import React from "react";

export const PreviewFooterNote: React.FC = () => {
  return (
    <div className="bg-amber-50 border border-dashed border-amber-300 rounded-xl p-4 text-[11px] text-amber-800 font-medium leading-relaxed select-none">
      <strong>Role isolation note</strong> · Preview renders the learner experience inside the author shell (Nexus Studio). The author never leaves the CD sidebar chrome. The black banner at the top of the content area clearly signals preview mode at all times. The "Enroll now" and "Save for later" buttons are disabled with a label so the author cannot accidentally enroll as a learner. Exit returns to the course overview screen (#cd-course-overview), not to any learner or Super Admin route.
    </div>
  );
};

export default PreviewFooterNote;
