import { cva } from "class-variance-authority";

export const washTileVariants = cva(
  "p-6 rounded-lg",
  {
    variants: {
      hue: {
        honey: "bg-honey-wash",
        sage: "bg-sage-wash",
        clay: "bg-clay-wash",
      },
    },
    defaultVariants: {
      hue: "honey",
    },
  }
);