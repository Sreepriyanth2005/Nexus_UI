import React from "react";
import {
  Activity,
  ArrowRight,
  Bell,
  Monitor,
  RefreshCcw,
  Shield,
} from "lucide-react";

export interface HealthItem {
  name: string;
  detail: string;
  status: "Operational" | "Healthy" | "Stable" | "Degraded";
}

interface PlatformHealthCardProps {
  score?: number;
  items?: HealthItem[];
  onViewAll?: () => void;
}

export const PlatformHealthCard: React.FC<PlatformHealthCardProps> = ({
  score = 100,
  items = [],
  onViewAll,
}) => {
  const icon = (name: string) => {
    const n = name.toLowerCase();
    if (
      n.includes("workspace") ||
      n.includes("video") ||
      n.includes("editor")
    )
      return <Monitor className="h-4 w-4" />;
    if (n.includes("api") || n.includes("gateway") || n.includes("response"))
      return <RefreshCcw className="h-4 w-4" />;
    if (n.includes("notification") || n.includes("bell"))
      return <Bell className="h-4 w-4" />;
    return <Shield className="h-4 w-4" />;
  };

  const safeScore = Math.max(0, Math.min(100, score));

  return (
    <div
      className="flex h-full flex-col rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--paper)] shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] ease-[var(--tn)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)]"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
        <div className="flex items-center gap-2.5">
          <h3
            className="m-0 text-[var(--ink)]"
            style={{
              fontSize: "16px",
              fontWeight: "var(--fw-bold)" as any,
              fontFamily: "var(--font-sans)",
            }}
          >
            Platform health
          </h3>
          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--c-sage)] bg-transparent px-2 py-0.5 text-[var(--c-sage)]"
            style={{
              fontSize: "10px",
              fontWeight: "var(--fw-medium)" as any,
              fontFamily: "var(--font-sans)",
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--c-sage)]" />
            Operational
          </span>
        </div>
        <button
          type="button"
          onClick={onViewAll}
           className="group flex items-center gap-1 uppercase text-[var(--ink)] transition-colors hover:text-[var(--ink)]"
        style={{
          fontSize: "12px",
          fontWeight: "var(--fw-bold)" as any,
          letterSpacing: "0.08em",
          fontFamily: "var(--font-label)",
        }}
      >
        VIEW ALL
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      <div className="mx-5 my-3.5 rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--paper-2)] px-4 py-3.5">
        <div className="flex items-end justify-between">
          <div
            className="leading-none tracking-tight text-[var(--ink)]"
            style={{
              fontSize: "26px",
              fontWeight: "var(--fw-bold)" as any,
              fontFamily: "var(--font-sans)",
            }}
          >
            {safeScore}
            <span
              className="ml-1 text-[var(--ink-mute)]"
              style={{
                fontSize: "var(--fs-micro)",
                fontWeight: "var(--fw-semibold)" as any,
              }}
            >
              /100
            </span>
          </div>
          <span
            className="uppercase text-[var(--ink-soft)]"
            style={{
              fontSize: "12px",
              fontWeight: "var(--fw-semibold)" as any,
              letterSpacing: "0.1em",
              fontFamily: "var(--font-sans)",
            }}
          >
            PERFORMANCE SCORE
          </span>
        </div>
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[var(--surface-3)]">
          <div
            className="h-full rounded-full bg-[var(--c-sage)] transition-[width] duration-[var(--dur-base)] ease-[var(--tn)]"
            style={{ width: `${safeScore}%` }}
          />
        </div>
      </div>

      <div className="flex-1 divide-y divide-[var(--line)]">
        {!items.length ? (
          <div
            className="px-5 py-8 text-center text-[var(--ink-mute)]"
            style={{
              fontSize: "var(--fs-body)",
              fontWeight: "var(--fw-semibold)" as any,
              fontFamily: "var(--font-sans)",
            }}
          >
            <Activity className="mx-auto mb-2 h-4 w-4 text-[var(--ink-faint)]" />
            Platform health telemetry unavailable.
          </div>
        ) : (
          items.map((item, idx) => {
            const degraded = item.status === "Degraded";
            return (
              <div
                key={idx}
                className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors duration-[var(--dur-fast)] ease-[var(--tn)] hover:bg-[var(--paper-2)]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg ${
                      degraded
                        ? "bg-[var(--c-honey-wash)] text-[var(--c-honey)]"
                        : "bg-[var(--c-sage-wash)] text-[var(--c-sage)]"
                    }`}
                  >
                    {icon(item.name)}
                  </span>
                  <div className="min-w-0">
                    <p
                      className="mb-0.5 truncate"
                      style={{
                        fontSize: "16px",
                        fontWeight: "var(--fw-semibold)" as any,
                        fontFamily: "var(--font-sans)",
                      }}
                    >
                      {item.name}
                    </p>
                    <p
                      className="truncate text-[var(--ink-mute)]"
                      style={{
                        fontSize: "var(--fs-micro)",
                        fontWeight: "var(--fw-regular)" as any,
                        fontFamily: "var(--font-sans)",
                      }}
                    >
                      {item.detail}
                    </p>
                  </div>
                </div>
                <span
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 ${
                    degraded
                      ? "border-[var(--c-honey)] bg-transparent text-[var(--c-honey)]"
                      : "border-[var(--c-sage)] bg-transparent text-[var(--c-sage)]"
                  }`}
                  style={{
                    fontSize: "12px",
                    fontWeight: "var(--fw-bold)" as any,
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      degraded ? "bg-[var(--c-honey)]" : "bg-[var(--c-sage)]"
                    }`}
                  />
                  {item.status}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PlatformHealthCard;