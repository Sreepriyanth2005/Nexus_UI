import { useEffect } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import { cn } from '../../../lib/cn';

export interface ModalProps {
  open: boolean;
  onClose?: () => void;
  title?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  closeOnScrim?: boolean;
  closeOnEsc?: boolean;
  className?: string;
  contentClassName?: string;
  labelledBy?: string;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  closeOnScrim = true,
  closeOnEsc = true,
  className,
  contentClassName,
  labelledBy,
}: ModalProps) {
  useEffect(() => {
    if (!open || !closeOnEsc) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, closeOnEsc, onClose]);

  if (!open) return null;

  const handleScrim = () => {
    if (closeOnScrim) onClose?.();
  };

  const stop = (event: MouseEvent<HTMLDivElement>) => event.stopPropagation();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#14141499] backdrop-blur-[4px]" onMouseDown={handleScrim}>
      <div
        className={cn("w-full max-w-[520px] max-h-full flex flex-col bg-card border border-line rounded-lg shadow-card overflow-hidden", className)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onMouseDown={stop}
      >
        {title != null ? <div className="px-6 pt-6 pb-4 text-h3 font-bold border-b border-line">{title}</div> : null}
        <div className={cn("p-6 overflow-y-auto", contentClassName)}>{children}</div>
        {footer != null ? <div className="px-6 pt-4 pb-6 bg-paper-2 border-t border-line flex justify-end gap-3">{footer}</div> : null}
      </div>
    </div>
  );
}