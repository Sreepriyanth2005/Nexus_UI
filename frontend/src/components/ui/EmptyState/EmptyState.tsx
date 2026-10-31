import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../lib/cn';

export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}

export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(function EmptyState(
  { icon, title, description, action, className, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={cn("flex flex-col items-center justify-center text-center p-12 bg-paper-2 rounded-lg border border-line border-dashed", className)} {...rest}>
      {icon ? <div className="mb-4 text-ink-mute w-12 h-12">{icon}</div> : null}
      <h3 className="text-h3 font-bold text-ink mb-2">{title}</h3>
      {description ? <p className="text-body text-ink-mute mb-6 max-w-sm">{description}</p> : null}
      {action ? <div>{action}</div> : null}
    </div>
  );
});