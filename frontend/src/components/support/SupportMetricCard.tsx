import React from "react";
import { LucideIcon } from "lucide-react";

interface SupportMetricCardProps {
  title: string;
  value: number | string;
  icon?: LucideIcon;
  boxBgClass?: string;
  iconColorClass?: string;
  dotColorClass?: string;
}

export const SupportMetricCard: React.FC<SupportMetricCardProps> = ({
  title,
  value,
  icon: Icon,
  boxBgClass,
  iconColorClass,
  dotColorClass,
}) => {
  return (
    <div className="bg-paper border border-line rounded-md p-8 shadow-xs flex flex-col justify-between min-h-[112px] hover:shadow-sm hover:border-line-strong transition-[border-color,box-shadow] duration-[180ms] ease-nexus group">
      {Icon && (
        <div
          className={`w-8 h-8 rounded-sm flex items-center justify-center shrink-0 ${boxBgClass || ''}`}
        >
          <Icon size={16} strokeWidth={1.5} className={iconColorClass || ''} />
        </div>
      )}
      <div className={Icon ? "mt-6" : ""}>
        <span className="text-label font-bold text-ink-mute uppercase tracking-[0.16em] block">
          {title}
        </span>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-h1 font-extrabold text-ink leading-none">
            {value}
          </span>
          {dotColorClass && (
            <span className={`w-2 h-2 rounded-full inline-block ${dotColorClass}`} />
          )}
        </div>
      </div>
    </div>
  );
};
