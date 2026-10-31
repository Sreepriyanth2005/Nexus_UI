import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../lib/cn';
import { avatarVariants } from './avatar.variants';

export type AvatarSize = 22 | 30 | 34 | 38 | 46;
export type AvatarHue = 'sage' | 'honey';

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  size?: AvatarSize;
  hue?: AvatarHue;
  ring?: boolean;
  topbar?: boolean;
  src?: string;
  alt?: string;
  initials?: ReactNode;
}

export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(function Avatar(
  { size = 34, hue = 'sage', ring = false, topbar = false, src, alt = '', initials, className, children, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cn(avatarVariants({ size, hue, ring, topbar, className }))}
      {...rest}
    >
      {src ? <img src={src} alt={alt} className="w-full h-full object-cover" /> : (initials ?? children)}
    </span>
  );
});