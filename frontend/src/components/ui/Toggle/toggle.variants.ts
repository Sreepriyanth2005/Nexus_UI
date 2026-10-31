import { cva } from "class-variance-authority";

export const toggleVariants = cva(
  "relative inline-block w-[42px] h-[24px] rounded-full cursor-pointer transition-colors duration-[200ms] ease-nexus focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:w-[18px] after:h-[18px] after:rounded-full after:bg-white after:shadow-xs after:transition-transform after:duration-[200ms] after:ease-nexus",
  {
    variants: {
      tone: { check: "", sage: "" },
      checked: {
        true: "after:translate-x-[18px]",
        false: "bg-surface-3",
      }
    },
    compoundVariants: [
      { checked: true, tone: "check", className: "bg-[#2e9f5b]" },
      { checked: true, tone: "sage", className: "bg-sage" },
    ],
    defaultVariants: {
      tone: "check",
      checked: false,
    }
  }
);