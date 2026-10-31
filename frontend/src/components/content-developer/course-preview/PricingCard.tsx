import React from "react";

export const PricingCard: React.FC = () => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
      {/* Price Header */}
      <div className="space-y-0.5 select-none">
        <h3 className="text-2xl font-extrabold text-slate-800">
          Free
        </h3>
        <p className="text-[10px] font-semibold text-slate-400">
          Included in Nexus membership
        </p>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 pt-2">
        <div className="space-y-1 text-center">
          <button
            disabled
            className="w-full bg-slate-350 text-white font-semibold text-xs px-5 py-3 rounded-lg cursor-not-allowed select-none opacity-90 outline-none"
          >
            Enroll now
          </button>
          <span className="text-[9px] font-semibold text-slate-400 block select-none">
            Enrollment disabled in preview
          </span>
        </div>

        <div className="space-y-1 text-center">
          <button
            disabled
            className="w-full border border-slate-200 bg-white text-slate-400 font-semibold text-xs px-5 py-3 rounded-lg cursor-not-allowed select-none outline-none"
          >
            Save for later
          </button>
          <span className="text-[9px] font-semibold text-slate-450 block select-none">
            Disabled in preview
          </span>
        </div>
      </div>
    </div>
  );
};

export default PricingCard;
