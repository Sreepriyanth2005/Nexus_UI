import React from "react";

export const SupportUserLookupFooter: React.FC = () => {
  return (
    <div className="bg-[#fefaf0] border border-dashed border-amber-300 rounded-md p-5 mt-6 shadow-2xs">
      <p className="text-label text-amber-900 leading-relaxed">
        <strong className="font-bold">Scoped lookup.</strong> Role and permission edits,
        plus account deletion, are Super Admin only on a separate screen (admin.nexusacademy.org/users)
        with different chrome. This screen is read-access plus three assist actions: Resend
        OTP, Unlock, Re-verify profile. Every assist action is written to the audit log
        with the support engineer as actor.
      </p>
    </div>
  );
};
