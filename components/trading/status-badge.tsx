"use client";

// StatusBadge v3.0 - fully hardened with safe fallbacks
import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type StatusType =
  | "live"
  | "paused"
  | "warning"
  | "critical"
  | "pending"
  | "running"
  | "done"
  | "failed"
  | "idle"
  | "staging"
  | "development"
  | "blocked"
  | "in_progress";

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

const statusConfig: Record<
  string,
  { label: string; color: string; bgColor: string; dotColor: string }
> = {
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
};

export function StatusBadge({
  status,
  label,
  showDot = true,
  className,
}: StatusBadgeProps) {
  // SAFE: Always returns a valid config object, never undefined
  const config =
    (status && typeof status === "string" && statusConfig[status]) ||
    DEFAULT_CONFIG;

  return (
    <Badge
      variant="outline"
      className={cn("font-medium border-transparent gap-1.5", className)}
      style={{
        color: config.color,
        backgroundColor: config.bgColor,
      }}
    >
      {showDot && (
        <span
          className="size-1.5 rounded-full animate-pulse"
          style={{ backgroundColor: config.dotColor }}
        />
      )}
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
  const config =
    (status && typeof status === "string" && statusConfig[status]) ||
    DEFAULT_CONFIG;

  return (
    <span
      className={cn("inline-flex size-2 rounded-full", className)}
      style={{ backgroundColor: config.dotColor }}
      title={config.label}
    />
  );
}
