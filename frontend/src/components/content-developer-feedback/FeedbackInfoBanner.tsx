import React from "react";

export const FeedbackInfoBanner: React.FC = () => {
  return (
    <div className="bg-[#fffbeb] border border-[#fde68a] rounded-2xl p-4 text-[12px] sm:text-[13px] text-[#b45309] font-medium leading-relaxed shadow-sm">
      <strong>Author mirror of the SME review screen.</strong> Author can reply and mark items
      addressed, but cannot change the verdict (Required vs Suggestion) set by the SME.
      Resubmit is gated until all Required items are marked addressed. Suggestions are optional
      and never block resubmission. When required count reaches 0, the Resubmit button becomes active.
    </div>
  );
};
export default FeedbackInfoBanner;
