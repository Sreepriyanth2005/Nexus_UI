import React from "react";

interface SupportActionButtonsProps {
  status: "Active" | "Locked" | "OTP Issue" | string;
  onResendOtp?: () => void;
  onUnlock?: () => void;
  onReverify?: () => void;
}

export const SupportActionButtons: React.FC<SupportActionButtonsProps> = ({
  status,
  onResendOtp,
  onUnlock,
  onReverify,
}) => {
  const isOtpActive = status === "OTP Issue";
  const isUnlockActive = status === "Locked";

  const btnBase =
    "inline-flex h-7 items-center rounded-full border px-3 transition-all duration-[var(--dur-fast)] active:scale-[0.98]";
  const neutral =
    "border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] hover:border-[var(--line-strong)] hover:bg-[var(--paper-2)]";
  const active =
    "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)] hover:opacity-90";

  return (
    <div
      className="flex items-center gap-1.5"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <button
        type="button"
        onClick={onResendOtp}
        className={`${btnBase} ${isOtpActive ? active : neutral}`}
        style={{ fontSize: "11px", fontWeight: 600 }}
      >
        Resend OTP
      </button>
      <button
        type="button"
        onClick={onUnlock}
        className={`${btnBase} ${isUnlockActive ? active : neutral}`}
        style={{ fontSize: "11px", fontWeight: 600 }}
      >
        Unlock
      </button>
      <button
        type="button"
        onClick={onReverify}
        className={`${btnBase} ${neutral}`}
        style={{ fontSize: "11px", fontWeight: 600 }}
      >
        Re-verify profile
      </button>
    </div>
  );
};

export default SupportActionButtons;