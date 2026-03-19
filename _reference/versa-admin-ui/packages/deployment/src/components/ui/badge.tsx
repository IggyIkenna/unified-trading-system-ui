import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-cyan)] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)]",
        running:
          "border-[rgba(34,211,238,0.3)] bg-[rgba(34,211,238,0.1)] text-[var(--color-accent-cyan)]",
        success:
          "border-[rgba(74,222,128,0.3)] bg-[rgba(74,222,128,0.1)] text-[var(--color-accent-green)]",
        warning:
          "border-[rgba(251,191,36,0.3)] bg-[rgba(251,191,36,0.1)] text-[var(--color-accent-amber)]",
        error:
          "border-[rgba(248,113,113,0.3)] bg-[rgba(248,113,113,0.1)] text-[var(--color-accent-red)]",
        pending:
          "border-[rgba(161,161,170,0.3)] bg-[rgba(161,161,170,0.1)] text-[var(--color-text-secondary)]",
        outline:
          "border-[var(--color-border-default)] text-[var(--color-text-secondary)]",
        cefi: "border-[rgba(96,165,250,0.3)] bg-[rgba(96,165,250,0.1)] text-[var(--color-accent-blue)]",
        tradfi:
          "border-[rgba(167,139,250,0.3)] bg-[rgba(167,139,250,0.1)] text-[var(--color-accent-purple)]",
        defi: "border-[rgba(74,222,128,0.3)] bg-[rgba(74,222,128,0.1)] text-[var(--color-accent-green)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
