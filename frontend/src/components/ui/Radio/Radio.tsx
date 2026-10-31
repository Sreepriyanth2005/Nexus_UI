import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '../../../lib/cn';

export interface RadioProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { className, ...rest },
  ref,
) {
  return (
    <input
      type="radio"
      ref={ref}
      className={cn(
        "appearance-none w-5 h-5 border border-line-strong rounded-full bg-paper checked:border-[#2e9f5b] cursor-pointer transition-colors flex-shrink-0 focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
        "relative after:content-[''] after:absolute after:hidden checked:after:block after:left-1/2 after:top-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:w-2.5 after:h-2.5 after:rounded-full after:bg-[#2e9f5b]",
        className
      )}
      {...rest}
    />
  );
});