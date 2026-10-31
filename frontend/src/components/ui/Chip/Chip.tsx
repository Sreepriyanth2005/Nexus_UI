import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../lib/cn';
import { chipVariants } from './chip.variants';

export type ChipStatus =
  | 'success'
  | 'warning'
  | 'attention'
  | 'muted'
  | 'danger'
  | 'info'
  | 'level';

interface BaseChipProps extends HTMLAttributes<HTMLSpanElement> {
  status?: ChipStatus;
  children: ReactNode;
}

interface StaticChipProps extends BaseChipProps {
  removable?: false;
  onRemove?: never;
  removeLabel?: never;
}

interface RemovableChipProps extends BaseChipProps {
  removable: true;
  onRemove: () => void;
  removeLabel?: string;
}

export type ChipProps = StaticChipProps | RemovableChipProps;

export const Chip = forwardRef<HTMLSpanElement, ChipProps>(function Chip(
  { status, removable, onRemove, removeLabel = 'Remove', className, children, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cn(chipVariants({ status, removable: removable ?? false, className }))}
      {...rest}
    >
      {children}
      {removable ? (
        <button type="button" className="cursor-pointer opacity-70 hover:opacity-100" aria-label={removeLabel} onClick={onRemove}>
          &times;
        </button>
      ) : null}
    </span>
  );
});