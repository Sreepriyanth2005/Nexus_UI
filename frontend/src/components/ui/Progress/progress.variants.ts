import { cva } from "class-variance-authority";

export const progressTrackVariants = cva(
  "w-full rounded-pill overflow-hidden",
  {
    variants: {
      thickness: {
        thin: "h-1",
        default: "h-1.5",
        thick: "h-3",
      },
      muted: {
        true: "bg-line",
        false: "bg-surface-3",
      }
    },
    defaultVariants: {
      thickness: "default",
      muted: false,
    }
  }
);

export const progressFillVariants = cva(
  "h-full rounded-pill transition-[width] duration-400 ease-nexus",
  {
    variants: {
      tone: {
        honey: "bg-honey",
        sage: "bg-sage",
        clay: "bg-clay",
      }
    },
    defaultVariants: {
      tone: "honey",
    }
  }
);