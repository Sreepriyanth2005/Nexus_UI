import { cva } from "class-variance-authority";

export const textareaVariants = cva(
  "w-full min-h-[70px] p-3 border border-line-strong rounded-xs bg-paper text-ink font-sans text-body font-normal leading-[1.55] resize-y transition-all duration-[150ms] ease-nexus placeholder:text-ink-faint focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-1 focus-visible:border-ink disabled:bg-paper-2 disabled:opacity-60 disabled:cursor-not-allowed",
  { variants: {}, defaultVariants: {} }
);