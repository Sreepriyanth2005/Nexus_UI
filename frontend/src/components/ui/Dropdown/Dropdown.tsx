import { forwardRef, useState, useRef, useEffect } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../lib/cn';

export interface DropdownProps extends HTMLAttributes<HTMLDivElement> {
  trigger: ReactNode;
  children: ReactNode;
}

export const Dropdown = forwardRef<HTMLDivElement, DropdownProps>(function Dropdown(
  { trigger, children, className, ...rest },
  ref,
) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div ref={containerRef} className={cn("relative inline-block", className)} {...rest}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer inline-block">
        {trigger}
      </div>
      {isOpen && (
        <div className="absolute right-0 mt-2 min-w-[200px] bg-paper border border-line rounded-md shadow-card z-50 py-1" onClick={() => setIsOpen(false)}>
          {children}
        </div>
      )}
    </div>
  );
});

export function DropdownItem({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("px-4 py-2 text-[14px] text-ink cursor-pointer hover:bg-surface-3 transition-colors", className)} {...rest}>
      {children}
    </div>
  );
}