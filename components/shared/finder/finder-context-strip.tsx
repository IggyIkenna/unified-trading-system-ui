"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { FinderContextStats } from "@/components/shared/finder/types";

export interface FinderContextStripProps {
  stats: FinderContextStats;
}

function formatMetricValue(
  value: string | number,
  format?: "number" | "percent" | "time",
): string {
  if (typeof value === "string") return value;
  switch (format) {
    case "percent":
      return `${value}%`;
    case "number":
      return value.toLocaleString();
    case "time":
      return String(value);
    default:
      return typeof value === "number" ? value.toLocaleString() : String(value);
  }
}

export function FinderContextStrip({ stats }: FinderContextStripProps) {
  return (
    <div className="flex items-center gap-0 px-4 py-2.5 border-b border-border/40 bg-muted/20 text-xs">
      {/* Left: name + badges */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className="font-semibold truncate">{stats.name}</span>
        {stats.badges?.map((badge) => (
          <Badge
            key={badge.label}
            variant="outline"
            className={cn("text-[10px] shrink-0", badge.variant)}
          >
            {badge.icon}
            {badge.label}
          </Badge>
        ))}
      </div>

      {/* Right: metrics */}
      <div className="flex items-center gap-5 shrink-0">
        {stats.metrics?.map((metric) => (
          <div key={metric.label} className="text-right">
            <span className="font-bold tabular-nums text-foreground">
              {formatMetricValue(metric.value, metric.format)}
            </span>
            <span className="text-muted-foreground ml-1">{metric.label}</span>
          </div>
        ))}

        {/* Optional progress bar */}
        {stats.progressBar && (
          <div className="flex items-center gap-2">
            <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={cn("h-full rounded-full", stats.progressBar.color)}
                style={{ width: `${stats.progressBar.value}%` }}
              />
            </div>
            <span className="font-bold tabular-nums text-foreground w-8 text-right">
              {stats.progressBar.value}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
