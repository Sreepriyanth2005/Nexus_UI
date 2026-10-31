import React from "react";
import { LucideIcon } from "lucide-react";

interface SupportMetricCardProps {
  title: string;
  value: number | string;
  icon?: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  indicatorColor?: "red" | "green" | "amber" | "none";
}

export const SupportMetricCard: React.FC<SupportMetricCardProps> = ({
  title,
  value,
  icon: Icon,
  iconBg = "bg-[var(--paper-2)]",
  iconColor = "text-[var(--ink-mute)]",
  indicatorColor = "none",
}) => {
  const dotClass =
    indicatorColor === "red"
      ? "bg-[var(--c-clay)]"
      : indicatorColor === "green"
        ? "bg-[var(--c-sage)]"
        : indicatorColor === "amber"
          ? "bg-[var(--c-honey)]"
          : null;

  return (
    <article
      className="group flex min-h-[108px] flex-col justify-between rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--paper)] px-4 py-4 shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] ease-[var(--tn)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)]"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      {Icon ? (
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconBg} ${iconColor}`}
        >
          <Icon className="h-4 w-4" strokeWidth={2} />
        </div>
      ) : (
        <div />
      )}
      <div className="mt-4">
        <span
          className="mb-0.5 block uppercase text-[var(--ink-mute)]"
          style={{
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.08em",
          }}
        >
          {title}
        </span>
        <div className="flex items-center gap-1.5">
          <span
            className="leading-none tracking-tight text-[var(--ink)]"
            style={{ fontSize: "24px", fontWeight: 700 }}
          >
            {value}
          </span>
          {dotClass && (
            <span className={`h-2 w-2 rounded-full ${dotClass}`} />
          )}
        </div>
      </div>
    </article>
  );
};

export default SupportMetricCard;