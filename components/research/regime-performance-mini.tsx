"use client";

import { cn } from "@/lib/utils";

interface RegimePerformanceMiniProps {
  regimeSharpe: Record<string, number>;
  className?: string;
}

export function RegimePerformanceMini({
  regimeSharpe,
  className,
}: RegimePerformanceMiniProps) {
  const entries = Object.entries(regimeSharpe);
  if (entries.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-2", className)}>
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Regime Performance (Sharpe)
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {entries.map(([regime, sharpe]) => (
          <div
            key={regime}
            className="rounded-lg border border-border/50 bg-muted/15 px-2 py-2 text-center"
          >
            <span className="text-[10px] text-muted-foreground capitalize block mb-1">
              {regime}
            </span>
            <span
              className={cn(
                "text-sm font-bold tabular-nums",
                sharpe >= 1.5
                  ? "text-emerald-400"
                  : sharpe >= 0
                    ? "text-amber-400"
                    : "text-red-400",
              )}
            >
              {sharpe.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
