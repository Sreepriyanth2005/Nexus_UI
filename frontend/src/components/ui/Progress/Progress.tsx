import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { cn } from '../../../lib/cn';
import { progressTrackVariants, progressFillVariants } from './progress.variants';

export type ProgressTone = 'honey' | 'sage' | 'clay';
export type ProgressThickness = 'thin' | 'default' | 'thick';

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  tone?: ProgressTone;
  thickness?: ProgressThickness;
  muted?: boolean;
}

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(function Progress(
  { value, tone = 'honey', thickness = 'default', muted = false, className, ...rest },
  ref,
) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      ref={ref}
      className={cn(progressTrackVariants({ thickness, muted, className }))}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      {...rest}
    >
      <div className={cn(progressFillVariants({ tone }))} style={{ width: `${pct}%` }} />
    </div>
  );
});