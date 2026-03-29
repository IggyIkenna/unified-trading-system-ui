"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatPercent } from "@/lib/utils/formatters";

export interface KpiMetric {
  label: string;
  value: string | number;
  /** Previous value — used to compute trend arrow */
  previousValue?: number;
  /** Explicit change percentage (+2.3, -0.5 etc) */
  changePercent?: number;
  /** Positive = green, negative = red, neutral = muted */
  sentiment?: "positive" | "negative" | "neutral";
  /** Compact suffix (e.g. "M", "K", "%") already baked into `value` */
  prefix?: string;
}

interface KpiStripProps {
  metrics: KpiMetric[];
  columns?: 2 | 3 | 4 | 5 | 6;
  className?: string;
}

const GRID_COLS: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
};

function deriveSentiment(m: KpiMetric): "positive" | "negative" | "neutral" {
  if (m.sentiment) return m.sentiment;
  if (m.changePercent !== undefined) {
    if (m.changePercent > 0) return "positive";
    if (m.changePercent < 0) return "negative";
    return "neutral";
  }
  return "neutral";
}

const SENTIMENT_COLOR = {
  positive: "text-emerald-400",
  negative: "text-rose-400",
  neutral: "text-muted-foreground",
};

export function KpiStrip({ metrics, columns, className }: KpiStripProps) {
  const cols = columns ?? Math.min(metrics.length, 6);

  return (
    <div className={cn("grid gap-px bg-border/40 rounded", GRID_COLS[cols], className)}>
      {metrics.map((m, idx) => {
        const s = deriveSentiment(m);
        return (
          <div key={idx} className="bg-card px-3 py-2 space-y-0.5 first:rounded-l last:rounded-r">
            <div className="text-[10px] text-muted-foreground truncate">{m.label}</div>
            <div className="flex items-baseline gap-1.5">
              {m.prefix && <span className="text-[10px] text-muted-foreground">{m.prefix}</span>}
              <span className={cn("text-sm font-mono font-semibold", SENTIMENT_COLOR[s])}>{m.value}</span>
              {m.changePercent !== undefined && (
                <span className={cn("flex items-center gap-0.5 text-[10px]", SENTIMENT_COLOR[s])}>
                  {s === "positive" && <TrendingUp className="size-2.5" />}
                  {s === "negative" && <TrendingDown className="size-2.5" />}
                  {s === "neutral" && <Minus className="size-2.5" />}
                  {formatPercent(Math.abs(m.changePercent), 1)}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
