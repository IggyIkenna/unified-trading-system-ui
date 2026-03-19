import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded px-2.5 py-0.5 text-[11px] font-medium font-mono whitespace-nowrap",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] border border-[var(--color-border-default)]",
        success: "badge-success",
        error: "badge-error",
        warning: "badge-warning",
        running: "badge-running",
        pending: "badge-pending",
        info: "badge-info",
        outline:
          "border border-[var(--color-border-default)] text-[var(--color-text-secondary)]",
      },
    },
    defaultVariants: { variant: "default" },
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
