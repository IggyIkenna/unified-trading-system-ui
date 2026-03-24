"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface PnLValueProps {
  value: number;
  currency?: string;
  showSign?: boolean;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function PnLValue({
  value,
  currency = "$",
  showSign = true,
  showIcon = false,
  size = "md",
  className,
}: PnLValueProps) {
  const isPositive = value >= 0;
  const colorClass = isPositive ? "pnl-positive" : "pnl-negative";

  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-2xl",
  };

  const iconSizes = {
    sm: "size-3",
    md: "size-4",
    lg: "size-5",
    xl: "size-6",
  };

  const formatValue = (val: number) => {
    const absVal = Math.abs(val);
    if (absVal >= 1_000_000) {
      return `${(absVal / 1_000_000).toFixed(2)}m`;
    }
    if (absVal >= 1_000) {
      return `${(absVal / 1_000).toFixed(1)}k`;
    }
    return absVal.toFixed(2);
  };

  const Icon = isPositive ? TrendingUp : TrendingDown;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-mono tabular-nums font-medium",
        sizeClasses[size],
        colorClass,
        className,
      )}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {showSign && (isPositive ? "+" : "-")}
      {currency}
      {formatValue(value)}
    </span>
  );
}

// P&L Change percentage
export function PnLChange({
  value,
  size = "md",
  className,
}: {
  value: number;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const isPositive = value >= 0;
  const colorClass = isPositive ? "pnl-positive" : "pnl-negative";

  const sizeClasses = {
    sm: "text-xs",
    md: "text-xs",
    lg: "text-sm",
    xl: "text-base",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 font-medium tabular-nums",
        sizeClasses[size],
        colorClass,
        className,
      )}
    >
      {isPositive ? "+" : ""}
      {value.toFixed(2)}%
    </span>
  );
}
