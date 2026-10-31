import React from "react";

export const SupportUserLookupFooter: React.FC = () => {
  return (
    <div className="bg-[var(--c-honey-wash)] border border-dashed border-[var(--c-honey-soft)] rounded-2xl p-5 mt-6 font-sans">
      <p className="text-xs text-[var(--c-honey-text)] leading-relaxed">
        <strong className="font-bold text-[var(--ink)]">Scoped lookup.</strong> Role and permission edits,
        plus account deletion, are Super Admin only on a separate screen (admin.nexusacademy.org/users)
        with different chrome. This screen is read-access plus three assist actions: Resend
        OTP, Unlock, Re-verify profile. Every assist action is written to the audit log
        with the support engineer as actor.
      </p>
    </div>
  );
};
