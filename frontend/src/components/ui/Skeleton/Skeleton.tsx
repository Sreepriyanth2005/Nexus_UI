import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { cn } from '../../../lib/cn';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(function Skeleton(
  { className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn("animate-pulse bg-[var(--surface-3)] rounded-md", className)}
      {...rest}
    />
  );
});
