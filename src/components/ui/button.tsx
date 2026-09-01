import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-white shadow-sm hover:bg-primary-dark",
        secondary:
          "bg-secondary text-white hover:opacity-90",
        outline:
          "border border-primary text-primary hover:bg-primary/10",
        ghost: "text-primary hover:bg-primary/10",
        destructive:
          "bg-red-600 text-white hover:bg-red-700",
        success:
          "bg-green-600 text-white hover:bg-green-700",
        whatsapp:
          "bg-[#25D366] text-white hover:bg-[#1eb958]",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-3 rounded-lg text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
