import React from "react";
import { Phone, Unlock, RefreshCcw, Award } from "lucide-react";

interface QuickActionsCardProps {
  onAction?: (id: string) => void;
}

export const QuickActionsCard: React.FC<QuickActionsCardProps> = ({
  onAction,
}) => {
  const actions = [
    { id: "otp", label: "Resend OTP", icon: Phone },
    { id: "unlock", label: "Unlock account", icon: Unlock },
    { id: "reverify", label: "Force profile re-verify", icon: RefreshCcw },
    { id: "reissue", label: "Re-issue learning credential", icon: Award },
  ];

  return (
    <div
      className="flex w-full flex-col rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--paper)] p-4 shadow-[var(--shadow-xs)] lg:w-[260px]"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <h3
        className="mb-3 m-0 uppercase text-[var(--ink-mute)]"
        style={{
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: "0.08em",
        }}
      >
        Quick actions
      </h3>

      <div className="flex flex-1 flex-col gap-2">
        {actions.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => onAction?.(a.id)}
            className="inline-flex h-9 w-full items-center gap-2.5 rounded-full border border-[var(--line)] bg-[var(--paper)] px-3.5 text-left text-[var(--ink)] transition-all duration-[var(--dur-fast)] hover:border-[var(--line-strong)] hover:bg-[var(--paper-2)] active:scale-[0.98]"
            style={{ fontSize: "13px", fontWeight: 600 }}
          >
            <a.icon className="h-3.5 w-3.5 shrink-0 text-[var(--ink-mute)]" />
            {a.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-center gap-1.5 self-center rounded-full border border-[var(--c-honey-soft)] bg-[var(--c-honey-wash)] px-3 py-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--c-honey)]" />
        <span
          className="text-[var(--c-honey-text)]"
          style={{ fontSize: "10px", fontWeight: 600 }}
        >
          All actions logged to audit trail
        </span>
      </div>
    </div>
  );
};

export default QuickActionsCard;