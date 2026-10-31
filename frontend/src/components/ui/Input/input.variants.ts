import { cva } from "class-variance-authority";

export const inputVariants = cva(
  "w-full px-3 border border-line-strong bg-paper text-ink font-sans font-medium transition-all duration-[150ms] ease-nexus placeholder:text-ink-faint focus-visible:outline-2 focus-visible:outline-paper focus-visible:outline-offset-1 focus-visible:border-ink disabled:bg-paper-2 disabled:opacity-60 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        default: "h-[40px] text-meta rounded-xs",
        md: "h-[40px] text-meta rounded-md",
        search: "h-[34px] text-meta rounded-pill",
      },
      valid: {
        true: "border-[#2e9f5b] bg-[#f2fbf5]",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      valid: false,
    },
  }
);