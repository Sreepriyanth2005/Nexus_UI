import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../lib/cn';

export interface TooltipProps extends Omit<HTMLAttributes<HTMLDivElement>, 'content'> {
  content: ReactNode;
  children: ReactNode;
}

export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(function Tooltip(
  { content, children, className, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={cn("relative group inline-block", className)} {...rest}>
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
        <div className="bg-ink text-paper text-[11px] font-semibold px-2.5 py-1.5 rounded-sm shadow-sm whitespace-nowrap">
          {content}
        </div>
      </div>
    </div>
  );
});