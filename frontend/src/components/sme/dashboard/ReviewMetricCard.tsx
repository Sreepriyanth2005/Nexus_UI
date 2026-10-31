import React from "react";
import { Check, Clock as Clock3, FileText, RefreshCw as RotateCcw, Shield } from "../../../assets/icons";

export interface ReviewMetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  accent?: boolean;
}

export const ReviewMetricCard: React.FC<ReviewMetricCardProps> = ({
  title,
  value,
  subtitle,
}) => {
  const key = title.toLowerCase();
  const config =
    key.includes("awaiting") || key.includes("pending")
      ? {
          bg: "bg-[var(--c-clay-wash)]",
          ink: "text-[var(--c-clay-text)]",
          icon: <FileText className="h-4.1 w-4.1" strokeWidth={1.2} />,
        }
      : key.includes("progress")
        ? {
            bg: "bg-[var(--c-honey-wash)]",
            ink: "text-[var(--c-honey-text)]",
            icon: <Clock3 className="h-4.1 w-4.1" strokeWidth={2} />,
          }
        : key.includes("approved") || key.includes("reviewed")
          ? {
              bg: "bg-[var(--c-sage-wash)]",
              ink: "text-[var(--c-sage-text)]",
              icon: <Check className="h-4.1 w-4.1" strokeWidth={2.5} />,
            }
          : key.includes("turnaround")
            ? {
                bg: "bg-[var(--c-honey-wash)]",
                ink: "text-[var(--c-honey-text)]",
                icon: <RotateCcw className="h-4.1 w-4.1" strokeWidth={2} />,
              }
            : {
                bg: "bg-[var(--paper-2)]",
                ink: "text-[var(--ink-mute)]",
                icon: <Shield className="h-4.1 w-4.1" strokeWidth={2} />,
              };

  return (
    <article
      className="group flex min-h-[108px] flex-col justify-between rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--paper)] px-4 py-4 shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] ease-[var(--tn)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)]"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <div
        className={`flex h-9.5 w-9.5 items-center justify-center rounded-lg ${config.bg} ${config.ink} transition-transform duration-[var(--dur-fast)] group-hover:scale-105`}
      >
        {config.icon}
      </div>
      <div className="mt-4 flex flex-col gap-0.5">
        <span
          className="block truncate uppercase text-[var(--ink-mute)]"
          style={{
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            fontFamily: "var(--font-sans)",
          }}
        >
          {title}
        </span>
        <div className="flex items-baseline gap-1">
          <span
            className="leading-none tracking-tight text-[var(--ink)]"
            style={{
              fontSize: "22px",
              fontWeight: 700,
              fontFamily: "var(--font-sans)",
            }}
          >
            {value}
          </span>
          {subtitle && (
            <span
              className="leading-none text-[var(--ink-soft)]"
              style={{
                fontSize: "11px",
                fontWeight: 500,
                fontFamily: "var(--font-sans)",
              }}
            >
              {subtitle}
            </span>
          )}
        </div>
      </div>
    </article>
  );
};

export default ReviewMetricCard;