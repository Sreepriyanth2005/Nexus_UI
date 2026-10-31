import React from "react";

interface SupportActionButtonsProps {
  status: "Active" | "Locked" | "OTP Issue";
}

export const SupportActionButtons: React.FC<SupportActionButtonsProps> = ({ status }) => {
  const isOtpActive = status === "OTP Issue";
  const isUnlockActive = status === "Locked";

  return (
    <div className="flex items-center gap-2">
      <button
        className={`px-3 py-1.5 rounded-sm text-[10px] font-bold border transition duration-150 cursor-pointer ${
          isOtpActive
            ? "bg-gray-950 text-white border-gray-950 hover:bg-black"
            : "bg-paper text-ink border-gray-300 hover:bg-paper-2"
        }`}
      >
        Resend OTP
      </button>
      <button
        className={`px-3 py-1.5 rounded-sm text-[10px] font-bold border transition duration-150 cursor-pointer ${
          isUnlockActive
            ? "bg-gray-950 text-white border-gray-950 hover:bg-black"
            : "bg-paper text-ink border-gray-300 hover:bg-paper-2"
        }`}
      >
        Unlock
      </button>
      <button
        className="px-3 py-1.5 rounded-sm text-[10px] font-bold bg-paper text-ink border-gray-300 hover:bg-paper-2 transition duration-150 cursor-pointer"
      >
        Re-verify profile
      </button>
    </div>
  );
};
