import { cva } from "class-variance-authority";

export const cardVariants = cva(
  "bg-card border border-line rounded-lg shadow-sm p-[21px]",
  {
    variants: {
      variant: {
        default: "",
        flat: "shadow-none",
        success: "border-l-4 border-l-sage",
        alert: "border-t-[3px] border-t-danger",
        danger: "border-danger-wash",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);