import React from "react";

interface CertificateStatusBannerProps {
  userName: string;
  onConfirm?: () => void;
  onChangeName?: () => void;
  isConfirming?: boolean;
}

const CertificateStatusBanner: React.FC<CertificateStatusBannerProps> = ({
  userName,
  onConfirm,
  onChangeName,
  isConfirming,
}) => {
  return (
    <div className="border border-yellow-500 bg-[#fffae8] rounded-md p-4 mb-4">
      <p className="text-[10px] uppercase tracking-[0.25em] text-gray-500 mb-2 font-medium">
        CONFIRM YOUR LEGAL NAME BEFORE WE GENERATE YOUR PROOF
      </p>

      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-sm text-gray-900">
            {userName}
          </h3>

          <p className="text-xs text-gray-600 mt-1">
            This is how your name will appear on the course completion proof.
            To change, verify with OTP first.
          </p>
        </div>

        <div className="flex gap-2 shrink-0">
          <button
            onClick={onChangeName}
            className="border border-gray-300 bg-white px-3 py-2 rounded text-xs font-medium hover:bg-gray-50 transition-colors"
          >
            Change name
          </button>

          <button
            onClick={onConfirm}
            disabled={isConfirming}
            className="bg-black text-white px-3 py-2 rounded text-xs font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {isConfirming ? "Confirming..." : "Confirm and generate →"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CertificateStatusBanner;
