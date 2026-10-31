import { cva } from "class-variance-authority";

export const avatarVariants = cva(
  "inline-flex items-center justify-center rounded-full font-sans font-bold overflow-hidden shrink-0",
  {
    variants: {
      size: {
        22: "w-[22px] h-[22px] text-[10px]",
        30: "w-[30px] h-[30px] text-label",
        34: "w-[34px] h-[34px] text-label",
        38: "w-[38px] h-[38px] text-label bg-paper-2 text-ink-mute",
        46: "w-[46px] h-[46px] text-meta",
      },
      hue: {
        sage: "bg-sage-wash text-sage-text",
        honey: "bg-honey-wash text-honey-text",
      },
      ring: {
        true: "bg-surface-3 shadow-[0_0_0_2px_#fff]",
        false: "",
      },
      topbar: {
        true: "bg-sage text-white shadow-[inset_0_0_0_3px_#fff]",
        false: "",
      }
    },
    defaultVariants: {
      size: 34,
      hue: "sage",
      ring: false,
      topbar: false,
    },
  }
);