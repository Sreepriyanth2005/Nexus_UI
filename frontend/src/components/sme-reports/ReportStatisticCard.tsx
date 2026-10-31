import React from "react";

export interface StatCardItem {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  iconBg: string;
}

interface ReportStatisticCardProps {
  cards: StatCardItem[];
}

export const ReportStatisticCard: React.FC<ReportStatisticCardProps> = ({
  cards,
}) => {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="group flex flex-col justify-between rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--paper)] px-4 py-4 shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] ease-[var(--tn)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)]"
        >
          <div
            className={`flex h-[38px] w-[38px] items-center justify-center rounded-lg ${card.iconBg} transition-transform duration-[var(--dur-fast)] group-hover:scale-105`}
          >
            {card.icon}
          </div>
          <div className="mt-4 flex flex-col gap-0.5">
            <span className="block truncate text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--ink-mute)]">
              {card.label}
            </span>
            <div className="text-[22px] font-bold leading-none tracking-tight text-[var(--ink)]">
              {card.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReportStatisticCard;