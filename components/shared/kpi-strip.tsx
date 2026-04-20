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
  /**
   * Tighter spacing: `gap-1` (vs `gap-2`), `py-1 px-1` tiles (vs `py-2 px-3`), smaller grid min track.
   * Used by `KpiSummaryWidget`.
   */
  compact?: boolean;
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
const FLUID_GRID_GAP = "gap-2";
const FLUID_GRID_GAP_COMPACT = "gap-1";
// Reduced min-track so a single tile is narrow — titles are short labels + numbers.
const FLUID_MIN_TRACK = "5.5rem";
const FLUID_MIN_TRACK_COMPACT = "4rem";

function fluidGridClass(compact: boolean): string {
  const gap = compact ? FLUID_GRID_GAP_COMPACT : FLUID_GRID_GAP;
  // grid-template-columns is applied via inline style — Tailwind's extractor can't
  // reliably parse nested commas/parens in arbitrary values (same pattern as single-row).
  return `grid w-full min-w-0 ${gap} content-start items-start`;
}

function fluidGridStyle(compact: boolean): React.CSSProperties {
  const min = compact ? FLUID_MIN_TRACK_COMPACT : FLUID_MIN_TRACK;
  return { gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${min}), 1fr))` };
}

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

function KpiCard({ m, compact }: { m: KpiMetric; compact?: boolean }) {
  const s = deriveSentiment(m);
  return (
    <div
      className={cn(
        "min-w-0 rounded-md border border-border/50 bg-transparent space-y-0.5",
        compact ? "px-1 py-1" : "px-3 py-2",
      )}
    >
      <div className="text-[10px] text-muted-foreground truncate text-center">{m.label}</div>
      <div className="flex items-baseline justify-center gap-1.5 min-w-0">
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

export function KpiStrip({ metrics, columns, responsive, layoutMode, fill, compact, className }: KpiStripProps) {
  const cols = columns ?? Math.min(metrics.length, 6);
  const mode = resolveLayoutMode(layoutMode, responsive);
  const n = metrics.length;
  const gap = compact ? "gap-1" : "gap-2";
  const minTrack = compact ? FLUID_MIN_TRACK_COMPACT : FLUID_MIN_TRACK;

  const isFluid =
    mode === "fluid" ||
    (mode !== "single-row" &&
      mode !== "single-column" &&
      mode !== "cols-2" &&
      mode !== "cols-3" &&
      mode !== "legacy-fixed");

  const gridClassName = React.useMemo(() => {
    if (mode === "legacy-fixed") {
      return cn("grid w-full min-w-0 content-start items-start", gap, GRID_COLS[cols]);
    }
    switch (mode) {
      case "fluid":
        return fluidGridClass(!!compact);
      case "single-column":
        return cn("grid w-full min-w-0 grid-cols-1 content-start items-start", gap);
      case "cols-2":
        return cn("grid w-full min-w-0 grid-cols-2 content-start items-start", gap);
      case "cols-3":
        return cn("grid w-full min-w-0 grid-cols-3 content-start items-start", gap);
      default:
        return fluidGridClass(!!compact);
    }
  }, [mode, cols, compact, gap]);

  const gridStyle = React.useMemo<React.CSSProperties | undefined>(
    () => (isFluid ? fluidGridStyle(!!compact) : undefined),
    [isFluid, compact],
  );

  if (mode === "single-row") {
    return (
      <div className={cn("w-full min-w-0 overflow-x-auto overflow-y-visible", className)}>
        <div
          className={cn("grid items-start", gap)}
          style={{
            gridTemplateColumns: n > 0 ? `repeat(${n}, minmax(${minTrack}, 1fr))` : undefined,
            minWidth: "100%",
          }}
        >
          {metrics.map((m, idx) => (
            <KpiCard key={idx} m={m} compact={compact} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full min-w-0", className)}>
      <div className={cn(gridClassName)} style={gridStyle}>
        {metrics.map((m, idx) => (
          <KpiCard key={idx} m={m} compact={compact} />
        ))}
      </div>
    </div>
  );
}
