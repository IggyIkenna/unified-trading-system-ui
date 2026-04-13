"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatNumber } from "@/lib/utils/formatters";
import { DollarSign, Percent } from "lucide-react";

export type ValueFormat = "dollar" | "percent";

interface ValueFormatToggleProps {
  format: ValueFormat;
  onFormatChange: (format: ValueFormat) => void;
  className?: string;
}

export function ValueFormatToggle({ format, onFormatChange, className }: ValueFormatToggleProps) {
  return (
    <div className={cn("flex items-center border border-border rounded-md overflow-hidden", className)}>
      <button
        onClick={() => onFormatChange("dollar")}
        className={cn(
          "flex items-center gap-1 px-2 py-1 text-xs transition-colors",
          format === "dollar"
            ? "bg-secondary text-foreground font-medium"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
        )}
        title="Show values in dollars"
      >
        <DollarSign className="size-3" />
      </button>
      <div className="w-px h-4 bg-border" />
      <button
        onClick={() => onFormatChange("percent")}
        className={cn(
          "flex items-center gap-1 px-2 py-1 text-xs transition-colors",
          format === "percent"
            ? "bg-secondary text-foreground font-medium"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
        )}
        title="Show values as percentage"
      >
        <Percent className="size-3" />
      </button>
    </div>
  );
}

// Hook for managing value format state
export function useValueFormat(initial: ValueFormat = "dollar") {
  const [format, setFormat] = React.useState<ValueFormat>(initial);

  const formatValue = React.useCallback(
    (dollarValue: number, baseValue: number): string => {
      if (format === "percent") {
        if (baseValue === 0) return "0.00%";
        const pct = (dollarValue / baseValue) * 100;
        return `${pct >= 0 ? "+" : ""}${formatNumber(pct, 2)}%`;
      }
      // Dollar format
      if (Math.abs(dollarValue) >= 1000000) return `$${formatNumber(dollarValue / 1000000, 2)}M`;
      if (Math.abs(dollarValue) >= 1000) return `$${formatNumber(dollarValue / 1000, 0)}k`;
      return formatCurrency(dollarValue, "USD", 0);
    },
    [format],
  );

  return { format, setFormat, formatValue };
}

// Combined component with value display
interface FormattedValueProps {
  value: number;
  baseValue: number;
  format: ValueFormat;
  className?: string;
  showBothOnHover?: boolean;
}

export function FormattedValue({ value, baseValue, format, className, showBothOnHover = true }: FormattedValueProps) {
  const formatDollar = (v: number) => {
    if (Math.abs(v) >= 1000000) return `$${formatNumber(v / 1000000, 2)}M`;
    if (Math.abs(v) >= 1000) return `$${formatNumber(v / 1000, 0)}k`;
    return formatCurrency(v, "USD", 0);
  };

  const formatPct = (v: number, base: number) => {
    if (base === 0) return "0.00%";
    const pct = (v / base) * 100;
    return `${pct >= 0 ? "+" : ""}${formatNumber(pct, 2)}%`;
  };

  const primary = format === "dollar" ? formatDollar(value) : formatPct(value, baseValue);
  const secondary = format === "dollar" ? formatPct(value, baseValue) : formatDollar(value);

  if (!showBothOnHover) {
    return <span className={className}>{primary}</span>;
  }

  return (
    <span className={cn("group relative cursor-default", className)} title={secondary}>
      {primary}
      <span className="absolute left-0 top-full mt-1 hidden group-hover:block px-2 py-1 bg-popover border border-border rounded text-xs shadow-lg whitespace-nowrap z-10">
        {secondary}
      </span>
    </span>
  );
}
