import { cn } from "@/lib/utils";

/** Semantic PnL text color from numeric sign (zero → muted). */
export function pnlColorClass(value: number): string {
  if (value > 0) return "text-pnl-positive";
  if (value < 0) return "text-pnl-negative";
  return "text-muted-foreground";
}

/** Combine base classes with PnL coloring by value. */
export function pnlClassName(value: number, className?: string): string {
  return cn(pnlColorClass(value), className);
}
