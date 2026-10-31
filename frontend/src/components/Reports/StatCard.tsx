import React from 'react';
import { TrendingUp, TrendingDown, ArrowUp, ArrowDown, LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  trend?: number | string; // percentage, positive for up, negative for down, or literal string
  trendLabel?: string;
  icon?: React.ElementType;
  iconBgColor?: string;
  iconColor?: string;
  trendSuffix?: string;
  trendColorMode?: 'default' | 'inverse';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  trend,
  trendLabel = 'vs prev period',
  icon: Icon,
  iconBgColor = 'bg-[var(--c-honey-wash)]',
  iconColor = 'text-[var(--c-honey-text)]',
  trendSuffix = '%',
  trendColorMode = 'default',
}) => {
  const isPositive = typeof trend === 'number' ? trend >= 0 : false;
  
  let colorClass = '';
  if (typeof trend === 'number') {
    if (trendColorMode === 'inverse') {
      colorClass = isPositive ? 'text-[var(--c-danger)] ard-delta-down' : 'text-[#4E6A40] ard-delta-up';
    } else {
      colorClass = isPositive ? 'text-[#4E6A40] ard-delta-up' : 'text-[var(--c-danger)] ard-delta-down';
    }
  }

  return (
    <div className="bg-[var(--paper)] rounded-[var(--r-lg)] border border-[var(--line)] py-[20px] px-[22px] flex flex-col shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:-translate-y-1 transition-all duration-300">
      <div className="flex items-start justify-between mb-3.5">
        {Icon && (
          <div className={`w-[40px] h-[40px] flex items-center justify-center rounded-[var(--r-md)] ${iconBgColor}`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
        )}
      </div>
      
      <div className="mt-auto">
        <div className="text-[var(--ink-mute)] text-[length:var(--fs-label)] font-[var(--fw-semibold)] uppercase tracking-wider mb-[8px] ard-kpi-label">
          {title}
        </div>
        <div className="text-[length:var(--fs-h1)] font-[var(--fw-bold)] text-[var(--ink)] leading-none ard-kpi-value">
          {value}
        </div>
        
        {trend !== undefined && typeof trend === 'number' && (
          <div className={`mt-[8px] flex items-center text-[length:var(--fs-meta)] font-[var(--fw-medium)] ard-kpi-delta ${colorClass}`}>
            <span className="mr-1 text-[1.1em] leading-none">{isPositive ? '↑' : '↓'}</span>
            <span>{isPositive ? '+' : '-'}{Math.abs(trend)}{trendSuffix} {trendLabel}</span>
          </div>
        )}
        {trend !== undefined && typeof trend === 'string' && (
          <div className="mt-[8px] flex items-center text-[length:var(--fs-meta)] font-[var(--fw-medium)] text-[var(--ink-mute)] ard-kpi-delta">
            <span>{trend}</span>
          </div>
        )}
      </div>
    </div>
  );
};
