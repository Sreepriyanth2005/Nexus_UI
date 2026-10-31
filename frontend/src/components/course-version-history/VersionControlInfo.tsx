import React from "react";

export const VersionControlInfo: React.FC = () => {
  return (
    <div className="bg-[#fffbeb] border border-[#fde68a] rounded-2xl p-4 text-[13px] text-[#b45309] font-medium leading-relaxed shadow-sm">
      <strong>Version control:</strong> Each SME-approved publish creates a new version.
      Archived versions remain accessible for reference and learner historical records
      (their progress is tied to the version they enrolled in).
    </div>
  );
};
export default VersionControlInfo;
