import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../lib/cn';

export interface ErrorStateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode;
  message: ReactNode;
  onRetry?: () => void;
}

export const ErrorState = forwardRef<HTMLDivElement, ErrorStateProps>(function ErrorState(
  { title = "Something went wrong", message, onRetry, className, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={cn("flex flex-col items-center justify-center text-center p-8 bg-danger-wash rounded-lg border border-danger/20", className)} {...rest}>
      <div className="mb-3 text-danger w-10 h-10">
        <svg fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
        </svg>
      </div>
      <h3 className="text-meta font-bold text-danger mb-1">{title}</h3>
      <p className="text-label text-danger mb-4">{message}</p>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="px-4 py-2 bg-danger text-white rounded-md text-label font-bold hover:bg-danger-deep transition-colors">
          Retry
        </button>
      ) : null}
    </div>
  );
});