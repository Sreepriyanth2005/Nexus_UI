import React from "react";
type ReviewReportStats = any;

interface ReportStatisticsCardsProps {
  stats: ReviewReportStats;
}

export const ReportStatisticsCards: React.FC<ReportStatisticsCardsProps> = ({ stats }) => {
  const cards = [
    { label: "TOTAL REVIEWS", value: stats.totalReviews },
    { label: "THIS MONTH", value: stats.thisMonth },
    { label: "AVG TURNAROUND", value: stats.avgTurnaround },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="group flex min-h-[100px] flex-col justify-between rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--paper)] p-4 shadow-[var(--shadow-xs)] transition-all duration-150 hover:-translate-y-px hover:shadow-[var(--shadow-sm)]"
        >
          <span className="select-none text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--ink-mute)]">
            {card.label}
          </span>
          <span className="mt-2 text-[24px] font-bold leading-none text-[var(--ink)]">
            {card.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default ReportStatisticsCards;
