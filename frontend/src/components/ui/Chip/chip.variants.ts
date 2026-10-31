import { cva } from "class-variance-authority";

export const chipVariants = cva(
  "inline-flex items-center gap-1.5 h-6 px-[11px] py-1 rounded-pill font-sans text-label font-bold leading-none whitespace-nowrap",
  {
    variants: {
      status: {
        success: "bg-sage-wash text-sage-text",
        warning: "bg-honey-wash text-honey-text text-[11px]",
        attention: "bg-clay-wash text-clay text-[11px]",
        muted: "bg-paper-2 text-ink-mute",
        danger: "bg-danger-wash text-danger",
        info: "bg-[#e7f0fb] text-[#2c5e92] tracking-[0.72px]",
        level: "bg-ink text-[#fbf7ef] tracking-[0.12px]",
      },
      removable: {
        true: "h-7 bg-paper-2 text-ink-mute text-meta",
        false: "",
      }
    },
    defaultVariants: {
      removable: false,
    },
  }
);