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

/**
 * - `fluid` — width-first: as many cards side-by-side as fit, then wrap (`auto-fit` + `minmax`).
 * - `single-row` — one row; horizontal scroll if the container is narrower than N × min card width.
 * - `single-column` — stacked.
 * - `cols-2` / `cols-3` — fixed column counts (rows grow as needed).
 */
export type KpiLayoutMode = "fluid" | "single-row" | "single-column" | "cols-2" | "cols-3";

interface KpiStripProps {
  metrics: KpiMetric[];
  columns?: 2 | 3 | 4 | 5 | 6;
  /** @deprecated Prefer `layoutMode="fluid"`. When true, behaves like `layoutMode="fluid"`. */
  responsive?: boolean;
  layoutMode?: KpiLayoutMode;
  /** Fill the widget: full width/height, min-height 0 for grid children. */
  fill?: boolean;
  className?: string;
}

const GRID_COLS: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
};

/** Width-first: prefer tiles in a row; narrow containers collapse to one column. */
const FLUID_GRID =
  "grid w-full min-w-0 [grid-template-columns:repeat(auto-fit,minmax(min(100%,8.75rem),1fr))] gap-2 content-start";

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

function resolveLayoutMode(
  layoutMode: KpiLayoutMode | undefined,
  responsive: boolean | undefined,
): "legacy-fixed" | KpiLayoutMode {
  if (layoutMode) return layoutMode;
  if (responsive) return "fluid";
  return "legacy-fixed";
}

function KpiCard({ m }: { m: KpiMetric }) {
  const s = deriveSentiment(m);
  return (
    <div className="min-w-0 rounded-md border border-border/50 bg-transparent px-3 py-2 space-y-0.5">
      <div className="text-[10px] text-muted-foreground truncate">{m.label}</div>
      <div className="flex items-baseline gap-1.5 min-w-0">
        {m.prefix && <span className="text-[10px] text-muted-foreground shrink-0">{m.prefix}</span>}
        <span className={cn("text-sm font-mono font-semibold truncate", SENTIMENT_COLOR[s])}>{m.value}</span>
        {m.changePercent !== undefined && (
          <span className={cn("flex items-center gap-0.5 text-[10px] shrink-0", SENTIMENT_COLOR[s])}>
            {s === "positive" && <TrendingUp className="size-2.5" />}
            {s === "negative" && <TrendingDown className="size-2.5" />}
            {s === "neutral" && <Minus className="size-2.5" />}
            {formatPercent(Math.abs(m.changePercent), 1)}
          </span>
        )}
      </div>
    </div>
  );
}

export function KpiStrip({ metrics, columns, responsive, layoutMode, fill, className }: KpiStripProps) {
  const cols = columns ?? Math.min(metrics.length, 6);
  const mode = resolveLayoutMode(layoutMode, responsive);
  const n = metrics.length;

  const gridClassName = React.useMemo(() => {
    if (mode === "legacy-fixed") {
      return cn("grid w-full min-w-0 gap-2 content-start", GRID_COLS[cols]);
    }
    switch (mode) {
      case "fluid":
        return FLUID_GRID;
      case "single-column":
        return "grid w-full min-w-0 grid-cols-1 gap-2 content-start";
      case "cols-2":
        return "grid w-full min-w-0 grid-cols-2 gap-2 content-start";
      case "cols-3":
        return "grid w-full min-w-0 grid-cols-3 gap-2 content-start";
      default:
        return FLUID_GRID;
    }
  }, [mode, cols]);

  if (mode === "single-row") {
    return (
      <div
        className={cn(
          "w-full min-w-0 overflow-x-auto overflow-y-visible",
          fill && "h-full min-h-0 flex flex-col",
          className,
        )}
      >
        <div
          className={cn("grid gap-2", fill && "min-h-0 flex-1")}
          style={{
            gridTemplateColumns: n > 0 ? `repeat(${n}, minmax(8.75rem, 1fr))` : undefined,
            minWidth: "100%",
          }}
        >
          {metrics.map((m, idx) => (
            <KpiCard key={idx} m={m} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full min-w-0", fill && "h-full min-h-0 flex flex-col", className)}>
      <div className={cn(gridClassName, fill && "h-full min-h-0")}>
        {metrics.map((m, idx) => (
          <KpiCard key={idx} m={m} />
        ))}
      </div>
    </div>
  );
}
