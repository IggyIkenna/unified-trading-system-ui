/**
 * Badge component — extends @unified-trading/ui-kit Badge with
 * deployment-specific variants (cefi, tradfi, defi).
 *
 * When these variants are upstreamed to ui-kit, this file should
 * become a re-export like the other ui components.
 */
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@unified-trading/ui-kit";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)]",
        running:
          "border-[var(--color-status-running-border)] bg-[var(--color-status-running-bg)] text-[var(--color-accent-cyan)]",
        success:
          "border-[var(--color-status-success-border-strong)] bg-[var(--color-status-success-bg)] text-[var(--color-accent-green)]",
        warning:
          "border-[var(--color-status-warning-border)] bg-[var(--color-status-warning-bg)] text-[var(--color-accent-amber)]",
        error:
          "border-[var(--color-status-error-border-strong)] bg-[var(--color-status-error-bg)] text-[var(--color-accent-red)]",
        pending:
          "border-[var(--color-status-pending-border)] bg-[var(--color-status-pending-bg)] text-[var(--color-text-secondary)]",
        info: "badge-info",
        outline:
          "border-[var(--color-border-default)] text-[var(--color-text-secondary)]",
        /* Deployment-specific: market category badges */
        cefi: "border-[var(--color-status-info-border)] bg-[var(--color-status-info-bg)] text-[var(--color-accent-blue)]",
        tradfi:
          "border-[var(--color-status-tradfi-border)] bg-[var(--color-status-tradfi-bg)] text-[var(--color-accent-purple)]",
        defi: "border-[var(--color-status-success-border-strong)] bg-[var(--color-status-success-bg)] text-[var(--color-accent-green)]",
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
