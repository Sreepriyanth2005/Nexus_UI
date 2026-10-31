import React, { forwardRef } from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'info' | 'warning' | 'danger' | 'muted' | 'count';
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = '', variant = 'default', children, ...props }, ref) => {
    
    let badgeClass = 'chip';
    
    if (variant === 'success') badgeClass += ' chip--success';
    if (variant === 'info') badgeClass += ' chip--info';
    if (variant === 'warning') badgeClass += ' chip--warning';
    if (variant === 'danger') badgeClass += ' chip--danger';
    if (variant === 'muted') badgeClass += ' chip--muted';
    if (variant === 'count') badgeClass += ' chip--count';
    
    return (
      <span
        ref={ref}
        className={`${badgeClass} ${className}`.trim()}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
