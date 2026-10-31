import { forwardRef } from 'react';
import type { SVGProps } from 'react';
import { cn } from '../../../lib/cn';

export interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
}

export const Icon = forwardRef<SVGSVGElement, IconProps>(function Icon(
  { size = 24, className, children, ...rest },
  ref,
) {
  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("shrink-0", className)}
      {...rest}
    >
      {children}
    </svg>
  );
});