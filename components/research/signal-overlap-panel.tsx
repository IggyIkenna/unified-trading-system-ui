"use client";

import type { SignalOverlapMetrics } from "@/lib/types/strategy-platform";
import { cn } from "@/lib/utils";

interface SignalOverlapPanelProps {
  metrics: SignalOverlapMetrics;
  labelA: string;
  labelB: string;
  className?: string;
}

export function SignalOverlapPanel({ metrics, labelA, labelB, className }: SignalOverlapPanelProps) {
  return (
    <div className={cn("rounded-lg border border-border/50 bg-muted/10 p-3 space-y-3", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Signal overlap</h4>
        <span className="text-lg font-bold tabular-nums text-primary">{metrics.overlap_pct}%</span>
      </div>
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Directional signals within tolerance window, same instrument. Comparing{" "}
        <span className="text-foreground font-medium">{labelA}</span> vs{" "}
        <span className="text-foreground font-medium">{labelB}</span>.
      </p>
      {metrics.confluence_zones.length > 0 && (
        <div>
          <p className="text-[10px] font-medium text-emerald-400/90 mb-1">Confluence zones</p>
          <ul className="text-[10px] text-muted-foreground space-y-1">
            {metrics.confluence_zones.map((z, i) => (
              <li key={i}>
                {z.direction}{" "}
                <span className="font-mono">
                  {z.start.slice(0, 10)} → {z.end.slice(0, 10)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {metrics.divergence_zones.length > 0 && (
        <div>
          <p className="text-[10px] font-medium text-amber-400/90 mb-1">Divergence zones</p>
          <ul className="text-[10px] text-muted-foreground space-y-1">
            {metrics.divergence_zones.map((z, i) => (
              <li key={i}>
                {z.a_direction} vs {z.b_direction}{" "}
                <span className="font-mono">
                  {z.start.slice(0, 10)} → {z.end.slice(0, 10)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
