import React from "react";
import {
  HelpCircle,
  CheckSquare,
  AlertTriangle,
  LucideIcon,
} from "lucide-react";

interface SupportUsersStatisticCardProps {
  title: string;
  value: number | string;
  icon?: LucideIcon;
}

const getMeta = (title: string) => {
  const lower = title.toLowerCase();
  if (lower.includes("open") || lower.includes("ticket")) {
    return {
      icon: HelpCircle,
      bg: "bg-[#fee2e2]",
      color: "text-[#991b1b]",
    };
  }
  if (lower.includes("resolved")) {
    return {
      icon: CheckSquare,
      bg: "bg-[var(--c-sage-wash)]",
      color: "text-[var(--c-sage-text)]",
    };
  }
  return {
    icon: AlertTriangle,
    bg: "bg-[#fef3c7]",
    color: "text-[#92400e]",
  };
};

export const SupportUsersStatisticCard: React.FC<
  SupportUsersStatisticCardProps
> = ({ title, value, icon: IconProp }) => {
  const meta = getMeta(title);
  const Icon = IconProp || meta.icon;

  return (
    <div className="supu-stat-flat stat-tile shadow-sm group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg bg-white border border-gray-200 rounded-[20px] pt-[18px] px-[18px] pb-[16px] flex flex-col justify-between h-[130px] text-left font-sans">
      <span className={`w-[38px] h-[38px] flex items-center justify-center rounded-[10px] shrink-0 ${meta.bg} ${meta.color}`}>
        <Icon className="w-[18px] h-[18px]" />
      </span>
      <div>
        <p className="text-[12px] font-bold text-[#5C5C5C] uppercase tracking-wider mb-1" style={{ fontFamily: 'var(--font-serif)' }}>
          {title}
        </p>
        <span className="text-[20px] font-bold text-[var(--ink)] tracking-tight leading-none font-sans">
          {value}
        </span>
      </div>
    </div>
  );
};

export default SupportUsersStatisticCard;