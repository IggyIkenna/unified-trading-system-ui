import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-primary)] disabled:pointer-events-none disabled:opacity-50 cursor-pointer [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-accent)] text-[var(--color-text-inverse)] hover:bg-[var(--color-accent-hover)]",
        destructive: "btn-destructive",
        outline:
          "border border-[var(--color-border-default)] bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]",
        ghost:
          "border border-transparent bg-transparent text-[var(--color-text-secondary)] hover:border-[var(--color-border-default)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]",
        secondary:
          "bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] border border-[var(--color-border-default)] hover:border-[var(--color-border-emphasis)]",
        link: "text-[var(--color-accent)] underline-offset-4 hover:underline",
        "error-toggle-on": "btn-error-toggle-on",
        "error-toggle-off": "btn-error-toggle-off",
      },
      size: {
        default: "h-8 px-3 py-1.5",
        sm: "h-7 px-2.5 py-1 text-xs",
        lg: "h-10 px-4 py-2",
        icon: "h-8 w-8",
        "icon-sm": "h-7 w-7 p-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export { Button, buttonVariants };
