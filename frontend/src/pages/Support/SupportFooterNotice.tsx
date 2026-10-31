import React from "react";

export const SupportFooterNotice: React.FC = () => {
  return (
    <div className="bg-[#fefaf0] border border-dashed border-amber-300 rounded-xl p-5 mt-6 shadow-2xs">
      <p className="text-xs text-amber-900 leading-relaxed">
        <strong className="font-bold">
          Support Engineer can act on behalf of users (impersonation).
        </strong>{" "}
        Every action is written to the Audit Log with the support engineer as actor and
        an impersonation flag. Cannot change roles or delete users. Impersonation sessions
        must be ended explicitly and are time-limited to 30 minutes.
      </p>
    </div>
  );
};
