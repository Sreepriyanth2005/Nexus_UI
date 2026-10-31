import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { cn } from '../../../lib/cn';
import { washTileVariants } from './wash-tile.variants';

export type WashHue = 'honey' | 'sage' | 'clay';

export interface WashTileProps extends HTMLAttributes<HTMLDivElement> {
  hue?: WashHue;
}

export const WashTile = forwardRef<HTMLDivElement, WashTileProps>(function WashTile(
  { hue = 'honey', className, children, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={cn(washTileVariants({ hue, className }))} {...rest}>
      {children}
    </div>
  );
});