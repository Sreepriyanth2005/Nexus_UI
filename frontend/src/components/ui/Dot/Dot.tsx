import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { cn } from '../../../lib/cn';
import { dotVariants } from './dot.variants';

export type DotTone = 'honey' | 'sage';

export interface DotProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: DotTone;
}

export const Dot = forwardRef<HTMLSpanElement, DotProps>(function Dot(
  { tone = 'honey', className, ...rest },
  ref,
) {
  return (
    <span ref={ref} className={cn(dotVariants({ tone, className }))} aria-hidden="true" {...rest} />
  );
});