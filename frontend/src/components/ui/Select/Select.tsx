import { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';
import { cn } from '../../../lib/cn';
import { selectVariants } from './select.variants';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  iconClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, iconClassName, children, ...rest },
  ref,
) {
  return (
    <div className="relative w-full">
      <select ref={ref} className={cn("appearance-none pr-[36px]", selectVariants({ className }))} {...rest}>
        {children}
      </select>
      <div className={cn("pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500", iconClassName)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6"></path>
        </svg>
      </div>
    </div>
  );
});