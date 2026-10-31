import React from "react";

interface AssessmentRowProps {
  assessment: any;
}

export const AssessmentRow: React.FC<AssessmentRowProps> = ({ assessment }) => {
  if (!assessment) return null;

  return (
    <tr className="hover:bg-[#f6f6f4]/60 transition-colors select-none bg-[#f6f6f4]/30 border-t border-[#1111111a]">
      {/* Order */}
      <td className="px-6 py-3.5 text-xs font-bold text-[#8c8c8c] w-12">
        —
      </td>

      {/* Title */}
      <td className="px-6 py-3.5">
        <span className="text-xs font-bold text-[#141414]">Assessment</span>
      </td>

      {/* Type placeholder */}
      <td className="px-6 py-3.5 w-24" />

      {/* Stats */}
      <td colSpan={2} className="px-6 py-3.5 text-[11px] font-semibold text-[#5c5c5c] text-right">
        {assessment.questions || 12} questions · pass mark {assessment.passMark || 70}%
      </td>
    </tr>
  );
};

export default AssessmentRow;
