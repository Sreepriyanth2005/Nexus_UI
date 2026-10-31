import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../lib/cn';

export interface TabItem {
  id: string;
  label: ReactNode;
  disabled?: boolean;
}

export interface TabsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  tabs: TabItem[];
  value: string;
  onChange?: (id: string) => void;
  accent?: boolean;
  tabClassName?: string;
}

export const Tabs = forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  { tabs, value, onChange, accent = false, className, tabClassName, ...rest },
  ref,
) {
  return (
    <div ref={ref} role="tablist" className={cn("flex border-b border-line gap-6", className)} {...rest}>
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={tab.disabled}
            className={cn(
              "h-[40px] px-[4px] mb-[-1px] border-b-[3px] border-transparent bg-transparent text-[#5c5c5c] font-sans text-[15px] font-medium cursor-pointer transition-colors hover:text-[#141414] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap",
              active && "text-[#141414] !border-[#141414]",
              tabClassName
            )}
            onClick={() => onChange?.(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
});