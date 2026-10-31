import React from "react";
import { FileText, Phone, Unlock, Award, LucideIcon } from "lucide-react";

interface SupportStatisticCardProps {
  title: string;
  value: number | string;
  icon?: LucideIcon;
}

const getMeta = (title: string) => {
  const lower = title.toLowerCase();
  if (lower.includes("period") || lower.includes("actions")) {
    return {
      icon: FileText,
      bg: "bg-[var(--c-honey-wash)]",
      color: "text-[var(--c-honey-text)]",
    };
  }
  if (lower.includes("otp") || lower.includes("resent")) {
    return {
      icon: Phone,
      bg: "bg-[var(--c-honey-wash)]",
      color: "text-[var(--c-honey-text)]",
    };
  }
  if (lower.includes("unlock")) {
    return {
      icon: Unlock,
      bg: "bg-[var(--c-sage-wash)]",
      color: "text-[var(--c-sage-text)]",
    };
  }
  return {
    icon: Award,
    bg: "bg-[var(--c-clay-wash)]",
    color: "text-[var(--c-clay-text)]",
  };
};

export const SupportStatisticCard: React.FC<SupportStatisticCardProps> = ({
  title,
  value,
  icon: IconProp,
}) => {
  const meta = getMeta(title);
  const Icon = IconProp || meta.icon;

  return (
    <article
      className="group flex min-h-[108px] flex-col justify-between rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--paper)] px-4 py-4 shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] ease-[var(--tn)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)]"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <div
        className="flex w-[38px] h-[38px] items-center justify-center rounded-[10px] transition-transform duration-200 mb-3"
        style={{ background: meta.bg.includes('[') ? undefined : undefined }}
      >
        <span className={`w-full h-full flex items-center justify-center rounded-[10px] ${meta.bg} ${meta.color}`}>
          <Icon className="h-4 w-4" strokeWidth={2} />
        </span>
      </div>
      <div className="mt-4">
        <span
          className="mb-0.5 block uppercase text-[var(--ink-mute)]"
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "0.05em",
          }}
        >
          {title}
        </span>
        <span
          className="leading-none tracking-tight text-[var(--ink)]"
          style={{ fontSize: "20px", fontWeight: 700 }}
        >
          {value}
        </span>
      </div>
    </article>
  );
};

export default SupportStatisticCard;