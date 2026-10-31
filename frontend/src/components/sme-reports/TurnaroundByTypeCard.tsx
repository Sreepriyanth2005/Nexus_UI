import React from "react";

interface TurnaroundByTypeCardProps {
  turnaroundByType?: Record<string, number>;
  slaTargetDays?: number;
}

export const TurnaroundByTypeCard: React.FC<TurnaroundByTypeCardProps> = ({
  turnaroundByType = {},
  slaTargetDays = 3.0,
}) => {
  const items = [
    {
      label: "Lessons",
      value: turnaroundByType["Lessons"] ?? turnaroundByType["Lesson"] ?? 0,
      color: "var(--c-sage)",
    },
    {
      label: "Quizzes",
      value: turnaroundByType["Quizzes"] ?? turnaroundByType["Quiz"] ?? 0,
      color: "var(--c-sage)",
    },
    {
      label: "Courses",
      value: turnaroundByType["Courses"] ?? turnaroundByType["Course"] ?? 0,
      color: "var(--c-honey)",
    },
    {
      label: "Career paths",
      value:
        turnaroundByType["Career paths"] ??
        turnaroundByType["CareerPath"] ??
        turnaroundByType["Career Path"] ??
        0,
      color: "var(--c-clay)",
    },
  ];

  const maxVal = 6;
  const slaPct = Math.min(100, Math.max(0, (slaTargetDays / maxVal) * 100));

  return (
    <div className="flex h-full flex-col rounded-[var(--r-md)] border border-[var(--line)] bg-white p-5 shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] hover:-translate-y-1 hover:border-[var(--line-strong)] hover:shadow-sm select-none">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 className="text-[16px] font-bold text-[var(--ink)]">
          Turnaround by content type
        </h2>
        <span className="inline-flex h-8 items-center rounded-full border border-[var(--line)] bg-[var(--paper-2)] px-3.5 text-[12px] font-semibold text-[var(--ink)]">
          SLA {slaTargetDays}d
        </span>
      </div>

      <div className="relative flex flex-1 flex-col justify-center space-y-4">
        <div
          className="pointer-events-none absolute bottom-[36px] top-0 z-10 border-r border-[#cbd5e1]"
          style={{ left: `${slaPct}%` }}
        />

        {items.map(({ label, value, color }) => {
          const barPct = Math.min(100, (value / maxVal) * 100);
          return (
            <div key={label} className="space-y-3">
              <div className="flex items-center justify-between text-[16px] leading-[1.2]">
                <span className="font-normal text-[var(--ink)]">{label}</span>
                <span className="font-bold text-[var(--ink)]">
                  {value.toFixed(1)}{" "}
                  <span className="font-normal text-[var(--ink-soft)]">days</span>
                </span>
              </div>
              <div className="relative h-[6px] overflow-hidden rounded-full bg-[var(--paper-2)]">
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{ width: `${barPct}%`, backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}

        <div className="flex items-center gap-2 pt-2 text-[12px] font-medium text-[var(--ink-mute)]">
          <span className="font-bold text-[#cbd5e1]">|</span>
          <span>SLA target: {slaTargetDays} days</span>
        </div>
      </div>
    </div>
  );
};

export default TurnaroundByTypeCard;