import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../lib/cn';

export interface StatTileProps extends HTMLAttributes<HTMLDivElement> {
  value: ReactNode;
  label: ReactNode;
  success?: boolean;
}

export const StatTile = forwardRef<HTMLDivElement, StatTileProps>(function StatTile(
  { value, label, success = false, className, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={cn("flex flex-col gap-2 p-6 bg-paper border border-line rounded-md", className)} {...rest}>
      <span className={cn("text-h2 font-extrabold text-ink leading-none", success && "text-[#2e9f5b]")}>{value}</span>
      <span className="text-[14px] font-medium text-ink-mute">{label}</span>
    </div>
  );
});