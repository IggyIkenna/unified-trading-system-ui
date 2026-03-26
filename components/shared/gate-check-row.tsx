/**
 * Status row with icon + title (+ optional Required badge) and either
 * threshold/actual metrics or a custom trailing column (e.g. stress scenarios).
 */
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  type GateStatus,
  statusBg,
  statusColor,
  StatusIcon,
} from "@/components/shared/gate-status";

export type GateCheckRowProps = {
  status: GateStatus;
  /** Primary label (e.g. gate name) */
  title: React.ReactNode;
  /** Renders an outline "Required" badge when true */
  required?: boolean;
  requiredLabel?: string;
  /** Shown as `{thresholdPrefix} {threshold}` when threshold is non-empty */
  threshold?: React.ReactNode;
  thresholdPrefix?: string;
  actual?: React.ReactNode;
  /** Extra classes on the actual value span */
  actualClassName?: string;
  /**
   * Custom right column; when set, threshold/actual block is not rendered.
   */
  trailing?: React.ReactNode;
  /** Classes for the trailing column wrapper */
  trailingClassName?: string;
  className?: string;
};

const ROW_SHELL =
  "flex min-w-0 flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between";

const DEFAULT_METRICS_WRAP =
  "flex shrink-0 flex-col gap-0.5 text-left font-mono text-xs sm:text-right sm:text-sm";

const DEFAULT_TRAILING_WRAP =
  "flex shrink-0 flex-col gap-1.5 sm:items-end sm:text-right";

function isNonEmpty(v: React.ReactNode): boolean {
  if (v == null) return false;
  if (typeof v === "string") return v.length > 0;
  return true;
}

export function GateCheckRow({
  status,
  title,
  required,
  requiredLabel = "Required",
  threshold,
  thresholdPrefix = "Threshold:",
  actual,
  actualClassName,
  trailing,
  trailingClassName,
  className,
}: GateCheckRowProps) {
  const showMetrics =
    trailing == null &&
    (isNonEmpty(threshold) ||
      isNonEmpty(actual) ||
      threshold === 0 ||
      actual === 0);

  return (
    <div className={cn(ROW_SHELL, statusBg(status), className)}>
      <div className="flex min-w-0 items-start gap-2 sm:items-center">
        <StatusIcon
          status={status}
          className="mt-0.5 size-4 shrink-0 sm:mt-0"
        />
        <div className="min-w-0 text-left">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-medium leading-snug">{title}</span>
            {required ? (
              <Badge variant="outline" className="px-1 text-xs">
                {requiredLabel}
              </Badge>
            ) : null}
          </div>
        </div>
      </div>
      {trailing != null ? (
        <div className={cn(DEFAULT_TRAILING_WRAP, trailingClassName)}>
          {trailing}
        </div>
      ) : showMetrics ? (
        <div className={DEFAULT_METRICS_WRAP}>
          {isNonEmpty(threshold) ? (
            <span className="text-muted-foreground">
              {thresholdPrefix} {threshold}
            </span>
          ) : null}
          {isNonEmpty(actual) ? (
            <span
              className={cn(
                "font-semibold",
                statusColor(status),
                actualClassName,
              )}
            >
              {actual}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
