import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-sans font-bold leading-none whitespace-nowrap cursor-pointer transition-all duration-[180ms] ease-nexus focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary: "bg-hero-bg text-ink border-honey/45 hover:bg-hero-bg-deep hover:shadow-hover",
        ghost: "bg-paper text-ink border border-line-strong hover:bg-paper-2 hover:shadow-hover",
        muted: "bg-paper-2 text-ink-mute border border-line hover:bg-surface-3",
        danger: "bg-danger text-white border border-danger hover:bg-danger-deep",
        "danger-text": "bg-transparent text-danger-deep hover:underline px-1",
        icon: "bg-transparent text-ink-mute hover:bg-paper-2 w-[42px] h-[42px] p-[8px] rounded-pill",
      },
      size: {
        sm: "h-[33px] pl-[15px] pr-[8px] py-[6px] text-label rounded-pill",
        md: "h-[40px] px-[15px] py-[9px] text-meta rounded-pill",
        xl: "w-full h-[52px] px-[19px] py-[12px] text-body rounded border-honey/55 bg-[#f3b01c] shadow-[0_6px_20px_-6px_#0006] hover:bg-[#e6a416] hover:shadow-[0_8px_24px_-8px_#0007]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);
