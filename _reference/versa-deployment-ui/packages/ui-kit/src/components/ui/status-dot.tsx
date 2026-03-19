import { cn } from "../../lib/utils";

type StatusDotVariant =
  | "success"
  | "error"
  | "warning"
  | "running"
  | "pending"
  | "info";

interface StatusDotProps {
  variant?: StatusDotVariant;
  className?: string;
  pulse?: boolean;
  label?: string;
}

const dotColors: Record<StatusDotVariant, string> = {
  success: "bg-[var(--color-success)]",
  error: "bg-[var(--color-error)]",
  warning: "bg-[var(--color-warning)]",
  running: "bg-[var(--color-running)]",
  pending: "bg-[var(--color-pending)]",
  info: "bg-[var(--color-info)]",
};

export function StatusDot({
  variant = "pending",
  className,
  pulse,
  label,
}: StatusDotProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span
        className={cn(
          "inline-block w-1.5 h-1.5 rounded-full shrink-0",
          dotColors[variant],
          pulse && "animate-pulse",
        )}
      />
      {label && (
        <span className="text-xs text-[var(--color-text-secondary)]">
          {label}
        </span>
      )}
    </span>
  );
}
