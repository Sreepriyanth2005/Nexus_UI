import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { cn } from '../../../lib/cn';

export interface PaginationProps extends Omit<HTMLAttributes<HTMLElement>, 'onChange'> {
  page: number;
  pageCount: number;
  onChange?: (page: number) => void;
  honey?: boolean;
  siblingCount?: number;
  prevLabel?: string;
  nextLabel?: string;
}

type PageItem = number | 'ellipsis';

function buildRange(page: number, pageCount: number, siblingCount: number): PageItem[] {
  const total = siblingCount * 2 + 5;
  if (pageCount <= total) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }

  const left = Math.max(page - siblingCount, 1);
  const right = Math.min(page + siblingCount, pageCount);
  const showLeftDots = left > 2;
  const showRightDots = right < pageCount - 1;
  const items: PageItem[] = [1];

  if (showLeftDots) items.push('ellipsis');
  for (let i = left; i <= right; i += 1) {
    if (i !== 1 && i !== pageCount) items.push(i);
  }
  if (showRightDots) items.push('ellipsis');
  items.push(pageCount);

  return items;
}

export const Pagination = forwardRef<HTMLElement, PaginationProps>(function Pagination(
  { page, pageCount, onChange, honey = false, siblingCount = 1, prevLabel = 'Prev', nextLabel = 'Next', className, ...rest },
  ref,
) {
  const items = buildRange(page, pageCount, siblingCount);

  return (
    <nav ref={ref} aria-label="Pagination" className={cn("flex items-center justify-center gap-2", className)} {...rest}>
      <button
        type="button"
        className="inline-flex items-center justify-center gap-[6px] h-[40px] p-[12px] border border-line rounded-sm bg-paper-2 text-ink-mute font-sans text-[14px] font-bold leading-none cursor-pointer transition-colors hover:bg-surface-3 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={page <= 1}
        onClick={() => onChange?.(page - 1)}
      >
        {prevLabel}
      </button>

      {items.map((item, index) =>
        item === 'ellipsis' ? (
          <span key={"ellipsis-${index}"} className="inline-flex items-center justify-center w-8 h-8 bg-transparent text-ink font-sans text-[14px] font-semibold" aria-hidden="true">
            &hellip;
          </span>
        ) : (
          <button
            key={item}
            type="button"
            className={cn(
              "inline-flex items-center justify-center w-8 h-8 border-0 rounded-pill bg-transparent text-ink font-sans text-[14px] font-semibold cursor-pointer hover:not-disabled:bg-paper-2",
              item === page && (honey ? "bg-honey text-ink" : "bg-ink text-white")
            )}
            aria-current={item === page ? 'page' : undefined}
            onClick={() => onChange?.(item)}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        className="inline-flex items-center justify-center gap-[6px] h-[40px] p-[12px] border border-line rounded-sm bg-paper-2 text-ink-mute font-sans text-[14px] font-bold leading-none cursor-pointer transition-colors hover:bg-surface-3 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={page >= pageCount}
        onClick={() => onChange?.(page + 1)}
      >
        {nextLabel}
      </button>
    </nav>
  );
});