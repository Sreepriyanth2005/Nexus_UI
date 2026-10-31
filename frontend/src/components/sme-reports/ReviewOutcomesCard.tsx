import React from "react";

interface ReviewOutcomesCardProps {
  approvedCount?: number;
  revisionCount?: number;
  pendingCount?: number;
  totalDecisions?: number;
}

export const ReviewOutcomesCard: React.FC<ReviewOutcomesCardProps> = ({
  approvedCount = 0,
  revisionCount = 0,
  pendingCount = 0,
  totalDecisions,
}) => {
  const approved = approvedCount ?? 0;
  const revision = revisionCount ?? 0;
  const pending = pendingCount ?? 0;
  const total = totalDecisions !== undefined ? totalDecisions : approved + revision + pending;

  const pctApproved = total > 0 ? Math.round((approved / total) * 100) : 0;
  const pctRevision = total > 0 ? Math.round((revision / total) * 100) : 0;
  const pctPending = total > 0 ? Math.max(0, 100 - pctApproved - pctRevision) : 0;

  const r = 44;
  const circ = 2 * Math.PI * r;
  const gap = total > 1 ? 3 : 0;
  const fracApproved = total > 0 ? approved / total : 0;
  const fracRevision = total > 0 ? revision / total : 0;
  const fracPending = total > 0 ? pending / total : 0;
  const segApproved = Math.max(0, fracApproved * circ - (fracApproved > 0 ? gap : 0));
  const segRevision = Math.max(0, fracRevision * circ - (fracRevision > 0 ? gap : 0));
  const segPending = Math.max(0, fracPending * circ - (fracPending > 0 ? gap : 0));
  const offsetRevision = fracApproved > 0 ? segApproved + gap : 0;
  const offsetPending = offsetRevision + (fracRevision > 0 ? segRevision + gap : 0);

  const rows = [
    { label: "Approved", pct: pctApproved, value: approved, color: "var(--c-sage)" },
    { label: "Revision", pct: pctRevision, value: revision, color: "var(--c-honey)" },
    { label: "Pending", pct: pctPending, value: pending, color: "var(--ink-faint)" },
  ];

  return (
    <div className="group flex h-full flex-col rounded-[var(--r-md)] border border-[var(--line)] bg-white p-4 shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] hover:-translate-y-1 hover:border-[var(--line-strong)] hover:shadow-sm select-none">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 className="text-[16px] font-bold text-[var(--ink)]">Review outcomes</h2>
        <span className="inline-flex h-8 items-center rounded-full border border-[var(--line)] bg-[var(--paper-2)] px-3.5 text-[12px] font-semibold text-[var(--ink)]">
          {total} decisions
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 xl:flex-row xl:justify-between xl:gap-10">
        <div className="relative h-[180px] w-[180px] shrink-0">
          <svg width="180" height="180" viewBox="0 0 120 120" className="h-full w-full -rotate-90 transform">
            <circle cx="60" cy="60" r="46" fill="none" stroke="var(--paper-2)" strokeWidth="15" />
            {fracApproved > 0 && <circle cx="60" cy="60" r="46" fill="none" stroke="var(--c-sage)" strokeWidth="15" strokeDasharray={`${Math.max(0, fracApproved * (2 * Math.PI * 46) - (fracApproved > 0 ? 4 : 0))} ${2 * Math.PI * 46}`} strokeDashoffset="0" strokeLinecap="round" />}
            {fracRevision > 0 && <circle cx="60" cy="60" r="46" fill="none" stroke="var(--c-honey)" strokeWidth="15" strokeDasharray={`${Math.max(0, fracRevision * (2 * Math.PI * 46) - (fracRevision > 0 ? 4 : 0))} ${2 * Math.PI * 46}`} strokeDashoffset={-(fracApproved > 0 ? Math.max(0, fracApproved * (2 * Math.PI * 46) - 4) + 4 : 0)} strokeLinecap="round" />}
            {fracPending > 0 && <circle cx="60" cy="60" r="46" fill="none" stroke="var(--ink-faint)" strokeWidth="15" strokeDasharray={`${Math.max(0, fracPending * (2 * Math.PI * 46) - (fracPending > 0 ? 4 : 0))} ${2 * Math.PI * 46}`} strokeDashoffset={-((fracApproved > 0 ? Math.max(0, fracApproved * (2 * Math.PI * 46) - 4) + 4 : 0) + (fracRevision > 0 ? Math.max(0, fracRevision * (2 * Math.PI * 46) - 4) + 4 : 0))} strokeLinecap="round" />}
          </svg>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center mt-1">
            <span className="text-[32px] font-bold leading-none text-[var(--ink)]">{pctApproved}%</span>
            <span className="mt-2 text-[12px] font-bold uppercase tracking-[0.12em] leading-none text-[var(--ink-mute)]">Approved</span>
          </div>
        </div>

        <div className="w-full max-w-[460px] space-y-4">
          {rows.map((row) => (
            <div key={row.label} className="space-y-3">
              <div className="flex items-center justify-between text-[16px] leading-[1.2]">
                <div className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: row.color }} />
                  <span className="font-normal text-[var(--ink)]">{row.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-normal text-[var(--ink-soft)]">{row.pct}%</span>
                  <span className="w-8 text-right font-bold text-[var(--ink)]">{row.value}</span>
                </div>
              </div>
              <div className="h-[6px] overflow-hidden rounded-full bg-[var(--paper-2)]">
                <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${row.pct}%`, backgroundColor: row.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReviewOutcomesCard;
