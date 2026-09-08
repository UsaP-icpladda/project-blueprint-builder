import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-extrabold cursor-pointer transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/15 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-[#FFE47A] to-primary text-primary-foreground shadow-[var(--shadow-accent-glow)] hover:from-primary hover:to-[#E6B800]",
        destructive:
          "bg-gradient-to-b from-[#FF8A6A] to-destructive text-destructive-foreground shadow-[var(--shadow-coral-glow)] hover:from-destructive hover:to-[#D45233]",
        outline:
          "border-2 border-primary/70 bg-[#FFF8E7] text-primary-foreground shadow-[var(--shadow-card)] hover:bg-primary/25",
        secondary:
          "bg-gradient-to-b from-[#3CC4BD] to-[#2BA8A2] text-white shadow-[var(--shadow-teal-glow)] hover:from-[#2BA8A2] hover:to-[#1E8C86]",
        ghost: "hover:bg-accent/20 hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-10 px-5 py-2",
        sm: "min-h-9 px-4 text-xs",
        lg: "min-h-12 px-8 text-base",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
