import React from "react";
import { ArrowRight, Shield } from "lucide-react";

export interface DomainItem {
  id?: string;
  title: string;
  pendingCount: number;
  reviewedCount: number;
}

interface MyDomainsCardProps {
  domains?: DomainItem[];
  onViewAll?: () => void;
  onViewDomain?: (domain: DomainItem) => void;
}

export const MyDomainsCard: React.FC<MyDomainsCardProps> = ({
  domains = [],
  onViewAll,
  onViewDomain,
}) => {
  const palettes = [
    ["bg-[var(--c-honey-wash)]", "text-[var(--c-honey)]"],
    ["bg-[var(--c-sage-wash)]", "text-[var(--c-sage)]"],
    ["bg-[var(--c-clay-wash)]", "text-[var(--c-clay)]"],
  ];

  return (
    <div
      className="flex h-full flex-col rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--paper)] shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] ease-[var(--tn)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)]"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
        <h3
          className="m-0 text-[var(--ink)]"
          style={{
            fontSize: "16px",
            fontWeight: "var(--fw-bold)" as any,
            fontFamily: "var(--font-sans)",
          }}
        >
          My domains
        </h3>
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

      <div className="flex-1 divide-y divide-[var(--line)]">
        {!domains.length ? (
          <div
            className="px-5 py-10 text-center text-[var(--ink-mute)]"
            style={{
              fontSize: "var(--fs-body)",
              fontWeight: "var(--fw-semibold)" as any,
              fontFamily: "var(--font-sans)",
            }}
          >
            No domains assigned yet.
          </div>
        ) : (
          domains.map((domain, idx) => {
            const [bg, ink] = palettes[idx % palettes.length];
            return (
              <div
                key={domain.id || idx}
                className="group flex items-center justify-between gap-3 px-5 py-3.5 transition-colors duration-[var(--dur-fast)] ease-[var(--tn)] hover:bg-[var(--paper-2)]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`flex  h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg ${bg} ${ink}`}
                  >
                    <Shield className="h-4 w-4" strokeWidth={1.8} color="var(--c-honey)"/>
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
                      {domain.title}
                    </p>
                    <p
                      className="truncate text-[var(--ink-mute)]"
                      style={{
                        fontSize: "var(--fs-micro)",
                        fontWeight: "var(--fw-regular)" as any,
                        fontFamily: "var(--font-sans)",
                      }}
                    >
                      {domain.pendingCount} pending
                      <span className="mx-1">·</span>
                      {domain.reviewedCount} reviewed total
                    </p>
                  </div>
                </div>
       <button
  type="button"
  onClick={() => onViewDomain?.(domain)}
  className="nexus-btn ghost sm"
  style={{
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    height: "40px",
    padding: "0 14px",
    borderRadius: "9999px",
    border: "1px solid var(--line)",
    background: "transparent",
    color: "var(--ink)",
    fontFamily: "var(--font-sans)",
    fontSize: "var(--fs-meta)",
    fontWeight: "var(--fw-bold)" as any,
    lineHeight: "1",
    whiteSpace: "nowrap",
    transition: "border-color 150ms ease, background-color 150ms ease",
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.borderColor = "var(--ink)";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.borderColor = "var(--line)";
  }}
>
  View
  <ArrowRight
    style={{
      width: "13px",
      height: "13px",
      flexShrink: 0,
    }}
  />
</button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MyDomainsCard;