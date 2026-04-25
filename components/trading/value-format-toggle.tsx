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
          "flex items-center gap-1 px-2 py-1 text-xs transition-colors border border-transparent",
          format === "dollar"
            ? "bg-primary/10 text-primary font-medium border-primary"
            : "text-muted-foreground hover:text-foreground",
        )}
        title="Show values in dollars"
      >
        <DollarSign className="size-3" />
      </button>
      <div className="w-px h-4 bg-border" />
      <button
        onClick={() => onFormatChange("percent")}
        className={cn(
          "flex items-center gap-1 px-2 py-1 text-xs transition-colors border border-transparent",
          format === "percent"
            ? "bg-primary/10 text-primary font-medium border-primary"
            : "text-muted-foreground hover:text-foreground",
        )}
        title="Show values as percentage"
      >
        <Percent className="size-3" />
      </button>
    </div>
  );
}

// Module-level subscription so every useValueFormat() consumer shares one
// value-format state. Using local useState meant the toggle button and the
// chart's formatter held independent copies and never synced.
let sharedFormat: ValueFormat = "dollar";
const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const getSnapshot = () => sharedFormat;
function setSharedFormat(next: ValueFormat) {
  if (sharedFormat === next) return;
  sharedFormat = next;
  listeners.forEach((l) => l());
}

// Hook for managing value format state (shared across all consumers).
export function useValueFormat(initial: ValueFormat = "dollar") {
  // Initialize on first mount only — subsequent callers join the existing state.
  const initRef = React.useRef(false);
  if (!initRef.current) {
    initRef.current = true;
    if (sharedFormat === "dollar" && initial !== "dollar") setSharedFormat(initial);
  }
  const format = React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const formatValue = React.useCallback(
    (dollarValue: number, baseValue: number): string => {
      if (format === "percent") {
        if (baseValue === 0) return "0.00%";
        const pct = (dollarValue / baseValue) * 100;
        return `${pct >= 0 ? "+" : ""}${formatNumber(pct, 2)}%`;
      }
      if (Math.abs(dollarValue) >= 1000000) return `$${formatNumber(dollarValue / 1000000, 2)}M`;
      if (Math.abs(dollarValue) >= 1000) return `$${formatNumber(dollarValue / 1000, 0)}k`;
      return formatCurrency(dollarValue, "USD", 0);
    },
    [format],
  );

  return { format, setFormat: setSharedFormat, formatValue };
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
