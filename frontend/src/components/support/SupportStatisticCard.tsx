import React from "react";
import { FileText, Phone, Unlock, Award, LucideIcon } from "lucide-react";

interface SupportStatisticCardProps {
  title: string;
  value: number | string;
  icon?: LucideIcon;
  wash?: string;
  iconColor?: string;
}

const getCardMeta = (title: string) => {
  const lower = title.toLowerCase();
  if (lower.includes("period") || lower.includes("actions")) {
    return { icon: FileText, wash: "var(--honey-wash)", color: "var(--honey-text)" };
  }
  if (lower.includes("otp") || lower.includes("resent")) {
    return { icon: Phone, wash: "var(--honey-wash)", color: "var(--honey-text)" };
  }
  if (lower.includes("unlock")) {
    return { icon: Unlock, wash: "var(--sage-wash)", color: "var(--sage-text)" };
  }
  return { icon: Award, wash: "var(--clay-wash)", color: "var(--clay-text)" };
};

export const SupportStatisticCard: React.FC<SupportStatisticCardProps> = ({
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
    <div className="bg-[var(--paper)] border border-[var(--line)] rounded-[var(--r-md)] pt-[18px] px-[18px] pb-[16px] flex flex-col justify-between h-[138px] shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] ease-[var(--tn)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)] font-sans group">
      <div 
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform mb-2"
        style={{ background: wash, color: iconColor }}
      >
        <Icon className="w-4 h-4" />
      </div>

      <div>
        <p className="text-[12px] font-bold tracking-[0.08em] text-[var(--ink-mute)] uppercase mb-2 select-none">
          {title}
        </p>
        <span className="text-[26px] font-bold text-[var(--ink)] tracking-tight leading-none">
          {value}
        </span>
      </div>
    </div>
  );
};

export default SupportStatisticCard;
