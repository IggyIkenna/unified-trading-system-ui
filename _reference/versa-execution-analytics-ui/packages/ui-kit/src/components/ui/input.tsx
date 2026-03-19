import * as React from "react";
import { cn } from "../../lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const DATE_TYPES = new Set(["date", "datetime-local", "time", "month", "week"]);

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        // Base styles
        "flex h-8 w-full rounded-md border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] px-3.5 py-1.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] transition-colors",
        // File input
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        // Hover / focus
        "hover:border-[var(--color-border-emphasis)]",
        "focus-visible:outline-none focus-visible:border-[var(--color-border-focus)] focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-primary)]",
        // Disabled
        "disabled:cursor-not-allowed disabled:opacity-50",
        // Date/time inputs: enforce dark color-scheme so the browser renders
        // the calendar/clock picker chrome in dark mode (visible icon on dark bg)
        type && DATE_TYPES.has(type) && "color-scheme-dark [color-scheme:dark]",
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input };
