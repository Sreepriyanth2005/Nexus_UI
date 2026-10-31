import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, MouseEvent } from 'react';
import { cn } from '../../../lib/cn';
import { toggleVariants } from './toggle.variants';

export type ToggleTone = 'check' | 'sage';

export interface ToggleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  tone?: ToggleTone;
}

export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(function Toggle(
  { checked, onCheckedChange, tone = 'check', className, onClick, ...rest },
  ref,
) {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    onCheckedChange?.(!checked);
  };

  return (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      className={cn(toggleVariants({ checked, tone, className }))}
      onClick={handleClick}
      {...rest}
    />
  );
});