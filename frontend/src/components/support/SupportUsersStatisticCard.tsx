import React from "react";
import { HelpCircle, Check, AlertTriangle } from "../../assets/icons";

interface SupportUsersStatisticCardProps {
  title: string;
  value: number | string;
  icon?: any;
  wash?: string;
  iconColor?: string;
}

const getCardMeta = (title: string) => {
  const lower = title.toLowerCase();
  if (lower.includes("open") || lower.includes("ticket")) {
    return { icon: HelpCircle, wash: "var(--clay-wash)", color: "var(--clay-text)" };
  }
  if (lower.includes("resolved")) {
    return { icon: Check, wash: "var(--sage-wash)", color: "var(--sage-text)" };
  }
  return { icon: AlertTriangle, wash: "var(--honey-wash)", color: "var(--honey-text)" };
};

export const SupportUsersStatisticCard: React.FC<SupportUsersStatisticCardProps> = ({
  title,
  value,
  icon: IconProp,
  wash: washProp,
  iconColor: colorProp,
}) => {
  const defaultMeta = getCardMeta(title);
  const Icon = IconProp || defaultMeta.icon;
  const wash = washProp || defaultMeta.wash;
  const iconColor = colorProp || defaultMeta.color;

  return (
    <div className="bg-[var(--paper)] border border-[var(--line)] rounded-[var(--r-md)] pt-[18px] px-[18px] pb-[16px] flex flex-col justify-between h-[138px] shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] ease-[var(--tn)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)] cursor-pointer text-left font-sans group">
      <span className="h-9 w-9 flex items-center justify-center rounded-xl shrink-0 group-hover:scale-110 transition-transform" style={{ background: wash, color: iconColor }}>
        <Icon className="w-4 h-4" />
      </span>
      <div>
        <p className="text-[12px] font-bold tracking-[0.08em] text-[var(--ink-mute)] uppercase mb-2 select-none">
          {title}
        </p>
        <span className="text-[26px] md:text-[26px] font-bold text-[var(--ink)] tracking-tight leading-none font-sans">
          {value}
        </span>
      </div>
    </div>
  );
};

export default SupportUsersStatisticCard;
