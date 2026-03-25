"use client";

import { cn } from "@/lib/utils";

interface ProfitStructureChartProps {
  grossProfit: number;
  grossLoss: number;
  commission: number;
  netPnl: number;
  className?: string;
}

function BarSegment({
  label,
  value,
  maxVal,
  color,
}: {
  label: string;
  value: number;
  maxVal: number;
  color: string;
}) {
  const width = Math.min(Math.abs(value) / maxVal, 1) * 100;
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 text-xs text-muted-foreground text-right shrink-0">
        {label}
      </span>
      <div className="flex-1 h-6 bg-muted/30 rounded relative overflow-hidden">
        <div
          className="h-full rounded transition-all duration-500"
          style={{ width: `${width}%`, backgroundColor: color }}
        />
      </div>
      <span
        className={cn(
          "w-24 text-xs font-mono tabular-nums text-right shrink-0",
          value >= 0 ? "text-emerald-400" : "text-red-400",
        )}
      >
        {value >= 0 ? "+" : ""}$
        {Math.abs(value).toLocaleString(undefined, {
          maximumFractionDigits: 0,
        })}
      </span>
    </div>
  );
}

export function ProfitStructureChart({
  grossProfit,
  grossLoss,
  commission,
  netPnl,
  className,
}: ProfitStructureChartProps) {
  const maxVal = Math.max(grossProfit, Math.abs(grossLoss), 1);

  return (
    <div className={cn("space-y-2", className)}>
      <BarSegment
        label="Gross Profit"
        value={grossProfit}
        maxVal={maxVal}
        color="#10b981"
      />
      <BarSegment
        label="Gross Loss"
        value={grossLoss}
        maxVal={maxVal}
        color="#ef4444"
      />
      <BarSegment
        label="Commission"
        value={-commission}
        maxVal={maxVal}
        color="#6366f1"
      />
      <div className="border-t border-border/50 pt-2">
        <BarSegment
          label="Net P&L"
          value={netPnl}
          maxVal={maxVal}
          color={netPnl >= 0 ? "#10b981" : "#ef4444"}
        />
      </div>
    </div>
  );
}
