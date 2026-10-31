import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../lib/cn';

export interface SegmentedOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

export interface SegmentedProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  options: SegmentedOption[];
  value: string;
  onChange?: (value: string) => void;
  dark?: boolean;
}

export const Segmented = forwardRef<HTMLDivElement, SegmentedProps>(function Segmented(
  { options, value, onChange, dark = false, className, ...rest },
  ref,
) {
  return (
    <div ref={ref} role="group" className={cn("inline-flex p-1 bg-surface-3 rounded-pill", dark && "bg-ink text-white", className)} {...rest}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            disabled={option.disabled}
            className={cn(
              "h-[32px] px-4 border-0 rounded-pill bg-transparent text-ink-mute font-sans text-label font-semibold cursor-pointer transition-colors hover:text-ink disabled:opacity-50 disabled:cursor-not-allowed",
              active && "bg-paper text-ink shadow-xs",
              active && dark && "bg-paper-2 text-ink"
            )}
            onClick={() => onChange?.(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
});