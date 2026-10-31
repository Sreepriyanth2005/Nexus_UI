import { cva } from "class-variance-authority";

export const dotVariants = cva(
  "inline-block w-1.5 h-1.5 rounded-full",
  {
    variants: {
      tone: {
        honey: "bg-honey",
        sage: "bg-sage",
      },
    },
    defaultVariants: {
      tone: "honey",
    },
  }
);