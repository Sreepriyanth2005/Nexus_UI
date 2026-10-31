import { forwardRef, Fragment } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../lib/cn';

export interface Crumb {
  label: ReactNode;
  href?: string;
}

export interface BreadcrumbsProps extends HTMLAttributes<HTMLElement> {
  items: Crumb[];
  separator?: ReactNode;
}

export const Breadcrumbs = forwardRef<HTMLElement, BreadcrumbsProps>(function Breadcrumbs(
  { items, separator = '/', className, ...rest },
  ref,
) {
  return (
    <nav ref={ref} aria-label="Breadcrumb" className={cn("flex items-center gap-2 font-sans text-label font-medium", className)} {...rest}>
      {items.map((crumb, index) => {
        const last = index === items.length - 1;
        return (
          <Fragment key={index}>
            {crumb.href && !last ? (
              <a href={crumb.href} className="text-ink-mute no-underline transition-colors hover:text-ink">{crumb.label}</a>
            ) : (
              <span className={cn(last && "text-ink font-bold")} aria-current={last ? 'page' : undefined}>
                {crumb.label}
              </span>
            )}
            {!last ? (
              <span className="text-line-strong" aria-hidden="true">
                {separator}
              </span>
            ) : null}
          </Fragment>
        );
      })}
    </nav>
  );
});