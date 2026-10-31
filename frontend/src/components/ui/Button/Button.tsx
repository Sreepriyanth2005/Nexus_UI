import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../lib/cn';
import { buttonVariants } from './button.variants';

export type ButtonVariant = 'primary' | 'ghost' | 'muted' | 'danger' | 'danger-text';
export type ButtonSize = 'sm' | 'md' | 'xl';

type NativeButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

interface LabelButtonProps extends NativeButtonProps {
  iconOnly?: false;
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

interface IconButtonProps extends NativeButtonProps {
  iconOnly: true;
  'aria-label': string;
  variant?: never;
  size?: never;
  children: ReactNode;
}

export type ButtonProps = LabelButtonProps | IconButtonProps;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, children, type = 'button', iconOnly, variant, size, ...rest },
  ref,
) {
  const cvaVariant = iconOnly ? "icon" : (variant ?? "primary");
  const cvaSize = iconOnly ? undefined : (size ?? "md");
  
  return (
    <button 
      ref={ref} 
      type={type} 
      className={cn(buttonVariants({ variant: cvaVariant as any, size: cvaSize, className }))} 
      {...rest}
    >
      {children}
    </button>
  );
});
