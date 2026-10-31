import React from "react";

interface AssignedSMECardProps {
  sme: any;
}

export const AssignedSMECard: React.FC<AssignedSMECardProps> = ({ sme }) => {
  return (
    <div className="bg-white border border-[#1111111a] rounded-xl p-5 shadow-xs space-y-3 select-none">
      <h3 className="text-[11px] font-bold text-[#5c5c5c] uppercase tracking-wider">
        ASSIGNED SME
      </h3>
      <div className="space-y-1">
        <h4 className="text-xs font-bold text-[#141414]">
          {sme?.name || "Unassigned"}
        </h4>
        {sme?.domain && (
          <p className="text-[11px] text-[#5c5c5c]">
            {sme.domain}
          </p>
        )}
        {sme?.turnaround && (
          <p className="text-[11px] text-[#8c8c8c] pt-1">
            {sme.turnaround}
          </p>
        )}
      </div>
    </div>
  );
};

export default AssignedSMECard;
