"use client";

// StatusBadge v3.0 - fully hardened with safe fallbacks
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusType =
  | "live"
  | "paused"
  | "warning"
  | "critical"
  | "info"
  | "pending"
  | "running"
  | "done"
  /** Execution / backtest complete (alias for done-style success) */
  | "complete"
  | "failed"
  | "idle"
  | "staging"
  | "development"
  | "blocked"
  | "in_progress"
  /** Batch / secondary series (e.g. live vs batch chart legend) */
  | "batch"
  /** Unread / attention marker (e.g. notification rows) */
  | "unread"
  /** Strategy / backtest queue states */
  | "queued"
  | "completed"
  | "cancelled";

interface StatusBadgeProps {
  status?: StatusType | string | null | undefined;
  label?: string;
  showDot?: boolean;
  className?: string;
}

const DEFAULT_CONFIG = {
  label: "Pending",
  color: "var(--muted-foreground)",
  bgColor: "rgba(161, 161, 170, 0.1)",
  dotColor: "var(--muted-foreground)",
};

const statusConfig: Record<string, { label: string; color: string; bgColor: string; dotColor: string }> = {
  live: {
    label: "Live",
    color: "var(--status-live)",
    bgColor: "rgba(74, 222, 128, 0.1)",
    dotColor: "var(--status-live)",
  },
  paused: {
    label: "Paused",
    color: "var(--status-warning)",
    bgColor: "rgba(251, 191, 36, 0.1)",
    dotColor: "var(--status-warning)",
  },
  warning: {
    label: "Warning",
    color: "var(--status-warning)",
    bgColor: "rgba(251, 191, 36, 0.1)",
    dotColor: "var(--status-warning)",
  },
  critical: {
    label: "Critical",
    color: "var(--status-critical)",
    bgColor: "rgba(248, 113, 113, 0.1)",
    dotColor: "var(--status-critical)",
  },
  info: {
    label: "Info",
    color: "#38bdf8",
    bgColor: "rgba(14, 165, 233, 0.12)",
    dotColor: "#0ea5e9",
  },
  pending: DEFAULT_CONFIG,
  running: {
    label: "Running",
    color: "var(--status-running)",
    bgColor: "rgba(96, 165, 250, 0.1)",
    dotColor: "var(--status-running)",
  },
  done: {
    label: "Done",
    color: "var(--status-live)",
    bgColor: "rgba(74, 222, 128, 0.1)",
    dotColor: "var(--status-live)",
  },
  complete: {
    label: "Complete",
    color: "var(--status-live)",
    bgColor: "rgba(74, 222, 128, 0.1)",
    dotColor: "var(--status-live)",
  },
  failed: {
    label: "Failed",
    color: "var(--status-critical)",
    bgColor: "rgba(248, 113, 113, 0.1)",
    dotColor: "var(--status-critical)",
  },
  idle: {
    label: "Idle",
    color: "var(--status-idle)",
    bgColor: "rgba(113, 113, 122, 0.1)",
    dotColor: "var(--status-idle)",
  },
  staging: {
    label: "Staging",
    color: "var(--status-warning)",
    bgColor: "rgba(251, 191, 36, 0.1)",
    dotColor: "var(--status-warning)",
  },
  testing: {
    label: "Testing",
    color: "var(--status-warning)",
    bgColor: "rgba(251, 191, 36, 0.1)",
    dotColor: "var(--status-warning)",
  },
  development: {
    label: "Development",
    color: "var(--muted-foreground)",
    bgColor: "rgba(161, 161, 170, 0.1)",
    dotColor: "var(--muted-foreground)",
  },
  blocked: {
    label: "Blocked",
    color: "var(--status-critical)",
    bgColor: "rgba(239, 68, 68, 0.1)",
    dotColor: "var(--status-critical)",
  },
  in_progress: {
    label: "In Progress",
    color: "var(--status-warning)",
    bgColor: "rgba(251, 191, 36, 0.1)",
    dotColor: "var(--status-warning)",
  },
  batch: {
    label: "Batch",
    color: "var(--primary)",
    bgColor: "color-mix(in oklab, var(--primary) 12%, transparent)",
    dotColor: "var(--primary)",
  },
  unread: {
    label: "Unread",
    color: "var(--primary)",
    bgColor: "color-mix(in oklab, var(--primary) 12%, transparent)",
    dotColor: "var(--primary)",
  },
  queued: {
    label: "Queued",
    color: "var(--muted-foreground)",
    bgColor: "rgba(161, 161, 170, 0.1)",
    dotColor: "var(--muted-foreground)",
  },
  completed: {
    label: "Completed",
    color: "var(--status-live)",
    bgColor: "rgba(74, 222, 128, 0.1)",
    dotColor: "var(--status-live)",
  },
  cancelled: {
    label: "Cancelled",
    color: "var(--muted-foreground)",
    bgColor: "rgba(161, 161, 170, 0.1)",
    dotColor: "var(--muted-foreground)",
  },
};

export function StatusBadge({ status, label, showDot = true, className }: StatusBadgeProps) {
  // SAFE: Always returns a valid config object, never undefined
  const config = (status && typeof status === "string" && statusConfig[status]) || DEFAULT_CONFIG;

  return (
    <Badge
      variant="outline"
      className={cn("font-medium border-transparent gap-1.5", className)}
      style={{
        color: config.color,
        backgroundColor: config.bgColor,
      }}
    >
      {showDot && <span className="size-1.5 rounded-full animate-pulse" style={{ backgroundColor: config.dotColor }} />}
      {label || config.label}
    </Badge>
  );
}

export function StatusDot({
  status,
  className,
}: {
  status?: StatusType | string | null | undefined;
  className?: string;
}) {
  // SAFE: Always returns a valid config object, never undefined
  const config = (status && typeof status === "string" && statusConfig[status]) || DEFAULT_CONFIG;

  return (
    <span
      className={cn("inline-flex size-2 rounded-full", className)}
      style={{ backgroundColor: config.dotColor }}
      title={config.label}
    />
  );
}
