import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { cn } from '../../../lib/cn';
import { cardVariants } from './card.variants';

export type CardVariant = 'default' | 'flat' | 'success' | 'alert' | 'danger';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = 'default', className, children, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={cn(cardVariants({ variant, className }))} {...rest}>
      {children}
    </div>
  );
});