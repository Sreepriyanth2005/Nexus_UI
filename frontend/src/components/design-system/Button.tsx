import React, { forwardRef } from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'muted' | 'danger';
  size?: 'default' | 'sm' | 'xl';
  lift?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'default', lift, children, ...props }, ref) => {
    
    let btnClass = 'btn';
    
    if (variant === 'ghost') btnClass += ' btn-ghost';
    if (variant === 'muted') btnClass += ' btn-muted';
    if (variant === 'danger') btnClass += ' btn-danger';
    
    if (size === 'sm') btnClass += ' btn-sm';
    if (size === 'xl') btnClass += ' btn-xl';
    
    if (lift) btnClass += ' btn--lift';
    
    return (
      <button
        ref={ref}
        className={`${btnClass} ${className}`.trim()}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
