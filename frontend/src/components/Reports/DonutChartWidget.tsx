import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

interface DonutChartWidgetProps {
  title: string;
  data: Array<{ name: string; value: number; color?: string }>;
  centerLabel?: string;
  centerSubLabel?: string;
  rightAction?: React.ReactNode;
  variant?: 'default' | 'bare';
  ariaLabel?: string;
  hideLegend?: boolean;
  roundedCaps?: boolean;
  chartSpacingClass?: string;
}

export const DonutChartWidget: React.FC<DonutChartWidgetProps> = ({
  title,
  data,
  centerLabel,
  centerSubLabel,
  rightAction,
  variant = 'default',
  ariaLabel,
  hideLegend = false,
  roundedCaps = false,
  chartSpacingClass = "mt-8 mb-8"
}) => {
  const DEFAULT_COLORS = ['#65a30d', '#eab308', '#ef4444', '#8b5cf6', '#d1d5db'];
  const isBare = variant === 'bare';

  const containerClass = isBare
    ? "flex flex-col w-full"
    : "bg-[var(--paper)] rounded-[var(--r-lg)] border border-[var(--line)] py-[22px] px-[24px] flex flex-col h-full shadow-[var(--shadow-sm)]";

  const headerClass = isBare
    ? "flex justify-center items-center mb-[10px]"
    : "flex justify-between items-center mb-3.5";

  const titleClass = isBare
    ? "text-[length:var(--fs-label)] text-[var(--ink-mute)] font-[var(--fw-semibold)] uppercase tracking-wider text-center ard-donut-section-label"
    : "text-[var(--ink)] font-[var(--fw-semibold)] text-[length:var(--fs-h3)]";

  return (
    <div className={containerClass}>
      <div className={headerClass}>
        {isBare ? (
          <div className={titleClass}>{title}</div>
        ) : (
          <h3 className={titleClass}>{title}</h3>
        )}
        {!isBare && rightAction}
      </div>

      <div className={`flex flex-col items-center relative ${chartSpacingClass}`}>
        <div className="w-[140px] h-[140px] relative [&_.recharts-wrapper]:!outline-none [&_.recharts-surface]:!outline-none [&_*]:!outline-none">
          <ResponsiveContainer width="100%" height="100%" className="!outline-none">
            <PieChart role="img" aria-label={ariaLabel || `${title} donut`} style={{ outline: 'none' }} className="!outline-none">
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={0}
                cornerRadius={roundedCaps ? 20 : 0}
                dataKey="value"
                stroke="none"
                style={{ outline: 'none' }}
                className="!outline-none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]} style={{ outline: 'none' }} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: '#374151' }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Center Text overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {centerLabel && (
              <span className="text-[length:var(--fs-h1)] font-[var(--fw-bold)] text-[var(--ink)] leading-none">
                {centerLabel}
              </span>
            )}
            {centerSubLabel && (
              <span className="text-[length:var(--fs-meta)] font-[var(--fw-semibold)] text-[var(--ink-faint)] mt-1 uppercase tracking-wider">
                {centerSubLabel}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      {!hideLegend && (
        <div className="w-max mx-auto grid grid-cols-[auto_auto] gap-x-[24px] gap-y-[8px] text-[length:var(--fs-label)]">
          {data.map((item, index) => (
            <React.Fragment key={index}>
              <div className="flex items-center">
                <div
                  className="w-[12px] h-[12px] rounded-[var(--r-pill)] mr-2"
                  style={{ backgroundColor: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length] }}
                />
                <span className="text-[var(--ink-mute)]">{item.name}</span>
              </div>
              <span className="font-[var(--fw-semibold)] text-[var(--ink)] text-right">{item.value} %</span>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};