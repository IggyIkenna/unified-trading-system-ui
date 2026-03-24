"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: number;
  changeLabel?: string;
  sparklineData?: number[];
  status?: "healthy" | "warning" | "critical" | "neutral";
  className?: string;
  onClick?: () => void;
  accentColor?: string;
}

export function KPICard({
  title,
  value,
  subtitle,
  change,
  changeLabel,
  sparklineData,
  status = "neutral",
  className,
  onClick,
}: KPICardProps) {
  const statusColors = {
    healthy: "border-l-[var(--status-live)]",
    warning: "border-l-[var(--status-warning)]",
    critical: "border-l-[var(--status-critical)]",
    neutral: "border-l-transparent",
  };

  const changeColor =
    change === undefined
      ? "text-muted-foreground"
      : change > 0
        ? "pnl-positive"
        : change < 0
          ? "pnl-negative"
          : "text-muted-foreground";

  const ChangeIcon =
    change === undefined
      ? null
      : change > 0
        ? TrendingUp
        : change < 0
          ? TrendingDown
          : Minus;

  return (
    <Card
      className={cn(
        "p-4 border-l-2 bg-card cursor-pointer transition-all duration-150 ease-out hover:shadow-[0_2px_8px_rgba(0,0,0,0.4)]",
        statusColors[status],
        className,
      )}
      onClick={onClick}
    >
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </span>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold font-mono tabular-nums">
            {value}
          </span>
          {sparklineData && sparklineData.length > 0 && (
            <Sparkline data={sparklineData} className="h-6 w-16" />
          )}
        </div>
        {(subtitle || change !== undefined) && (
          <div className="flex items-center gap-2 text-xs">
            {change !== undefined && (
              <span className={cn("flex items-center gap-0.5", changeColor)}>
                {ChangeIcon && <ChangeIcon className="size-3" />}
                {change > 0 ? "+" : ""}
                {change}%
                {changeLabel && (
                  <span className="text-muted-foreground ml-1">
                    {changeLabel}
                  </span>
                )}
              </span>
            )}
            {subtitle && (
              <span className="text-muted-foreground">{subtitle}</span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

// Inline Sparkline Component
function Sparkline({
  data,
  className,
}: {
  data: number[];
  className?: string;
}) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const height = 24;
  const width = 64;
  const padding = 2;

  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * (width - padding * 2);
    const y =
      height - padding - ((value - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  const isPositive = data[data.length - 1] >= data[0];

  return (
    <svg
      className={className}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      <polyline
        fill="none"
        stroke={isPositive ? "var(--pnl-positive)" : "var(--pnl-negative)"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points.join(" ")}
      />
    </svg>
  );
}

// Larger Sparkline for table cells
export function SparklineCell({
  data,
  className,
}: {
  data: number[];
  className?: string;
}) {
  return <Sparkline data={data} className={cn("h-4 w-12", className)} />;
}
