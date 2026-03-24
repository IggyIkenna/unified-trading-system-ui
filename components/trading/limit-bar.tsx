"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

interface LimitBarProps {
  label: string;
  value?: number | null;
  limit?: number | null;
  unit?: string;
  showPercentage?: boolean;
  showStatus?: boolean;
  className?: string;
}

function getUtilization(
  value: number | undefined | null,
  limit: number | undefined | null,
): number {
  const safeValue = value ?? 0;
  const safeLimit = limit ?? 1;
  if (safeLimit === 0) return 0;
  return Math.min((safeValue / safeLimit) * 100, 100);
}

function getStatus(utilization: number): "healthy" | "warning" | "critical" {
  if (utilization < 70) return "healthy";
  if (utilization < 90) return "warning";
  return "critical";
}

const statusConfig = {
  healthy: {
    color: "var(--risk-healthy)",
    bgColor: "rgba(74, 222, 128, 0.2)",
    icon: CheckCircle2,
    label: "healthy",
  },
  warning: {
    color: "var(--risk-warning)",
    bgColor: "rgba(251, 191, 36, 0.2)",
    icon: AlertTriangle,
    label: "WARNING",
  },
  critical: {
    color: "var(--risk-critical)",
    bgColor: "rgba(248, 113, 113, 0.2)",
    icon: XCircle,
    label: "CRITICAL",
  },
};

export function LimitBar({
  label,
  value,
  limit,
  unit = "",
  showPercentage = true,
  showStatus = true,
  className,
}: LimitBarProps) {
  const safeValue = value ?? 0;
  const safeLimit = limit ?? 1;
  const utilization = getUtilization(safeValue, safeLimit);
  const status = getStatus(utilization);
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  const formatValue = (val: number | undefined | null): string => {
    if (val == null || typeof val !== "number" || isNaN(val)) return "-";
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}m`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(1)}k`;
    return val.toFixed(unit === "%" ? 0 : 2);
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <div className="flex items-center gap-2">
          <span className="font-mono tabular-nums">
            {unit === "$" && "$"}
            {formatValue(value)}
            {unit && unit !== "$" && unit}
            {" / "}
            {unit === "$" && "$"}
            {formatValue(limit)}
            {unit && unit !== "$" && unit}
          </span>
          {showPercentage && (
            <span
              className="font-mono tabular-nums text-xs px-1.5 py-0.5 rounded"
              style={{
                color: config.color,
                backgroundColor: config.bgColor,
              }}
            >
              ({utilization.toFixed(0)}%)
            </span>
          )}
        </div>
      </div>
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        {/* Warning threshold marker at 70% */}
        <div
          className="absolute top-0 bottom-0 w-px bg-muted-foreground/30"
          style={{ left: "70%" }}
        />
        {/* Critical threshold marker at 90% */}
        <div
          className="absolute top-0 bottom-0 w-px bg-muted-foreground/30"
          style={{ left: "90%" }}
        />
        {/* Progress bar */}
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${utilization}%`,
            backgroundColor: config.color,
          }}
        />
      </div>
      {showStatus && (
        <div
          className="flex items-center gap-1 text-xs"
          style={{ color: config.color }}
        >
          <StatusIcon className="size-3" />
          <span>{config.label}</span>
        </div>
      )}
    </div>
  );
}

// Compact limit display for tables
export function LimitCell({
  value,
  limit,
  unit = "",
}: {
  value?: number;
  limit?: number;
  unit?: string;
}) {
  const utilization = getUtilization(value ?? 0, limit ?? 1);
  const status = getStatus(utilization);
  const config = statusConfig[status];

  const formatValue = (val: number | undefined | null): string => {
    if (val == null || typeof val !== "number" || isNaN(val)) return "-";
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}m`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(0)}k`;
    return val.toFixed(0);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${utilization}%`,
            backgroundColor: config.color,
          }}
        />
      </div>
      <span className="font-mono text-xs tabular-nums text-muted-foreground">
        {unit === "$" && "$"}
        {formatValue(value)}
      </span>
    </div>
  );
}
