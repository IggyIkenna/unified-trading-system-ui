"use client";

import { cn } from "@/lib/utils";
import type { KpiBarItem } from "@/lib/backtest-analytics-types";

interface KpiBarProps {
  items: KpiBarItem[];
  className?: string;
}

const COLOR_MAP = {
  green: "text-emerald-400",
  red: "text-red-400",
  default: "text-foreground",
} as const;

export function KpiBar({ items, className }: KpiBarProps) {
  return (
    <div
      className={cn(
        "sticky top-0 z-10 flex items-center gap-6 rounded-lg border bg-card/95 px-4 py-3 backdrop-blur-sm",
        className,
      )}
    >
      {items.map((item, i) => (
        <div
          key={item.label}
          className={cn(
            "flex flex-col gap-0.5",
            i < items.length - 1 && "border-r border-border/50 pr-6",
          )}
        >
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            {item.label}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span
              className={cn(
                "text-lg font-bold tabular-nums",
                COLOR_MAP[item.color ?? "default"],
              )}
            >
              {item.value}
            </span>
            {item.sub_value && (
              <span
                className={cn(
                  "text-xs font-medium tabular-nums",
                  COLOR_MAP[item.color ?? "default"],
                )}
              >
                {item.sub_value}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
