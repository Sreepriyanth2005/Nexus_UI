import React from "react";

export const QuickActionsCard: React.FC = () => {
  return (
    <div className="bg-paper border border-line-strong rounded-md p-5 shadow-[var(--shadow-sm)] w-full lg:w-[280px] flex flex-col">
      <h3 className="text-[11px] font-bold text-ink-faint uppercase tracking-wider mb-4">
        QUICK ACTIONS
      </h3>
      <div className="flex flex-col gap-3 flex-1 justify-between">
        <div className="flex flex-col gap-2.5">
          <button className="w-full bg-paper border border-gray-950 text-gray-950 text-label font-semibold py-2.5 px-4 rounded-sm hover:bg-paper-2 transition duration-150 cursor-pointer shadow-2xs">
            Resend OTP to user
          </button>
          <button className="w-full bg-paper border border-gray-950 text-gray-950 text-label font-semibold py-2.5 px-4 rounded-sm hover:bg-paper-2 transition duration-150 cursor-pointer shadow-2xs">
            Unlock account
          </button>
          <button className="w-full bg-paper border border-gray-950 text-gray-950 text-label font-semibold py-2.5 px-4 rounded-sm hover:bg-paper-2 transition duration-150 cursor-pointer shadow-2xs">
            Force profile re-verify
          </button>
          <button
            disabled
            className="w-full bg-paper-2 border border-line-strong text-ink-faint text-label font-semibold py-2.5 px-4 rounded-sm cursor-not-allowed shadow-2xs"
          >
            Re-issue completion proof
          </button>
        </div>
        <div className="mt-5 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-paper-2 rounded-full border border-line self-center">
          <span className="w-1.5 h-1.5 rounded-full bg-honey inline-block" />
          <span className="text-[10px] font-semibold text-ink-mute">
            All actions logged to audit trail
          </span>
        </div>
      </div>
    </div>
  );
};
