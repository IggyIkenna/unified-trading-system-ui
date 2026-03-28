"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Unified data/KPI card for dashboards. Replaces ad-hoc card patterns
 * with consistent sizing (sm/md/lg) and optional status accent border.
 *
 * Usage:
 *   <DataCard label="Total AUM" value="$48.2M" />
 *   <DataCard label="P&L" value="+$245K" status="healthy" change="+1.84%" />
 *   <DataCard size="sm" label="Orders" value="1,247" />
 */

type CardSize = "sm" | "md" | "lg";
type CardStatus = "healthy" | "warning" | "critical" | "neutral" | "active";

const SIZE_CLASSES: Record<CardSize, string> = {
  sm: "min-h-[5rem] p-3 gap-1",
  md: "min-h-[6.5rem] p-4 gap-2",
  lg: "min-h-[8rem] p-5 gap-3",
};

const VALUE_SIZE: Record<CardSize, string> = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-3xl",
};

const STATUS_BORDER: Record<CardStatus, string> = {
  healthy: "border-l-2 border-l-[#4ade80]",
  warning: "border-l-2 border-l-[#fbbf24]",
  critical: "border-l-2 border-l-[#f87171]",
  neutral: "",
  active: "border-l-2 border-l-[#22d3ee]",
};

const CHANGE_COLOR: Record<string, string> = {
  positive: "text-[#4ade80]",
  negative: "text-[#f87171]",
  neutral: "text-muted-foreground",
};

export interface DataCardProps {
  label: string;
  value: React.ReactNode;
  /** Optional sub-value or description */
  subtitle?: React.ReactNode;
  /** Percentage or delta change indicator */
  change?: string;
  /** Status accent on left border */
  status?: CardStatus;
  /** Card size: sm (compact KPI), md (standard), lg (feature) */
  size?: CardSize;
  /** Custom slot below value */
  footer?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function DataCard({
  label,
  value,
  subtitle,
  change,
  status,
  size = "md",
  footer,
  className,
  onClick,
}: DataCardProps) {
  const changeDirection = change
    ? change.startsWith("+")
      ? "positive"
      : change.startsWith("-")
        ? "negative"
        : "neutral"
    : null;

  return (
    <div
      className={cn(
        "flex flex-col rounded-lg border border-border/50 bg-card",
        SIZE_CLASSES[size],
        status && STATUS_BORDER[status],
        onClick && "cursor-pointer hover:bg-muted/30 transition-colors",
        className,
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <p className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="flex items-baseline gap-2">
        <span className={cn("font-mono font-bold", VALUE_SIZE[size])}>
          {value}
        </span>
        {change && changeDirection && (
          <span className={cn("text-xs font-medium", CHANGE_COLOR[changeDirection])}>
            {change}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      )}
      {footer}
    </div>
  );
}
