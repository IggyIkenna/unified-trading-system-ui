"use client";

import { cn } from "@/lib/utils";
import * as React from "react";

export interface ContinuousHeatmapPoint {
  /** X axis numeric value (continuous — e.g. timestamp ms, price level). */
  x: number;
  /** Y axis numeric value (continuous — e.g. price level, IV bucket). */
  y: number;
  /** Magnitude (the value being colour-coded). Negative permitted in diverging mode. */
  v: number;
  /** Optional tooltip label override. */
  label?: string;
}

export interface ContinuousHeatmapProps {
  points: ReadonlyArray<ContinuousHeatmapPoint>;
  /** X-axis bucket count. Default 32. */
  xBuckets?: number;
  /** Y-axis bucket count. Default 24. */
  yBuckets?: number;
  /** Colour scale. "log" recommended for liquidation heatmaps with skewed magnitudes. */
  scale?: "linear" | "log";
  /** Diverging colours around zero. Default false (sequential). */
  diverging?: boolean;
  /** Format the v-value for tooltip. Default: humanised k/M/B. */
  formatV?: (v: number) => string;
  /** Format x for tick label. Default: rounded number; if `xKind="time"` formats as MM-DD HH:mm. */
  formatX?: (x: number) => string;
  /** Format y for tick label. Default: rounded number. */
  formatY?: (y: number) => string;
  /** When set to "time", the x axis is formatted as a timestamp. */
  xKind?: "time" | "linear";
  xLabel?: string;
  yLabel?: string;
  height?: number | string;
  className?: string;
  emptyMessage?: string;
  onCellClick?: (cell: { xMin: number; xMax: number; yMin: number; yMax: number; vSum: number }) => void;
}

function defaultFormatV(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(v / 1_000).toFixed(1)}k`;
  return `$${v.toFixed(0)}`;
}

function defaultFormatTime(x: number): string {
  return new Date(x).toISOString().slice(5, 16).replace("T", " ");
}

/**
 * Continuous × continuous heatmap primitive (numeric axes, log/linear/diverging
 * colour). Distinct from `CategoricalMatrix` (discrete categorical axes).
 *
 * Bins points into a grid of `xBuckets × yBuckets` and colour-codes each
 * cell by aggregate magnitude. Designed for the Coinglass-style liquidation
 * heatmap where x = time, y = price level, cell = aggregate liquidation
 * notional (log-scaled).
 *
 * Pure-SVG render, no recharts dependency — recharts cells lose precision
 * at large bucket counts.
 */
export function ContinuousHeatmap({
  points,
  xBuckets = 32,
  yBuckets = 24,
  scale = "log",
  diverging = false,
  formatV = defaultFormatV,
  formatX,
  formatY,
  xKind = "linear",
  xLabel,
  yLabel,
  height = 280,
  className,
  emptyMessage = "No data",
  onCellClick,
}: ContinuousHeatmapProps) {
  const xFmt = React.useMemo(
    () => formatX ?? (xKind === "time" ? defaultFormatTime : (x: number) => x.toString()),
    [formatX, xKind],
  );
  const yFmt = React.useMemo(() => formatY ?? ((y: number) => y.toString()), [formatY]);

  const grid = React.useMemo(() => {
    if (points.length === 0) return null;
    let xMin = Number.POSITIVE_INFINITY;
    let xMax = Number.NEGATIVE_INFINITY;
    let yMin = Number.POSITIVE_INFINITY;
    let yMax = Number.NEGATIVE_INFINITY;
    for (const p of points) {
      if (p.x < xMin) xMin = p.x;
      if (p.x > xMax) xMax = p.x;
      if (p.y < yMin) yMin = p.y;
      if (p.y > yMax) yMax = p.y;
    }
    if (xMin === xMax) xMax = xMin + 1;
    if (yMin === yMax) yMax = yMin + 1;
    const cells: number[][] = Array.from({ length: yBuckets }, () => Array<number>(xBuckets).fill(0));
    const xStep = (xMax - xMin) / xBuckets;
    const yStep = (yMax - yMin) / yBuckets;
    for (const p of points) {
      const xi = Math.min(xBuckets - 1, Math.floor((p.x - xMin) / xStep));
      const yi = Math.min(yBuckets - 1, Math.floor((p.y - yMin) / yStep));
      cells[yi][xi] += p.v;
    }
    let vMin = Number.POSITIVE_INFINITY;
    let vMax = Number.NEGATIVE_INFINITY;
    for (const row of cells) {
      for (const v of row) {
        if (v === 0) continue;
        if (v < vMin) vMin = v;
        if (v > vMax) vMax = v;
      }
    }
    if (!Number.isFinite(vMin)) vMin = 0;
    if (!Number.isFinite(vMax)) vMax = 0;
    return { cells, xMin, xMax, yMin, yMax, vMin, vMax, xStep, yStep };
  }, [points, xBuckets, yBuckets]);

  // X-axis tick labels — show at most 6 evenly-spaced. Computed
  // unconditionally before any early return to satisfy rules-of-hooks; when
  // grid is null the result is unused.
  const xTicks = React.useMemo(() => {
    if (!grid) return [];
    const count = Math.min(6, xBuckets);
    const out: { idx: number; label: string }[] = [];
    for (let i = 0; i < count; i++) {
      const idx = Math.floor((i / (count - 1)) * (xBuckets - 1));
      out.push({ idx, label: xFmt(grid.xMin + idx * grid.xStep) });
    }
    return out;
  }, [xBuckets, grid, xFmt]);

  if (grid === null) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-md border border-dashed border-border/40 bg-muted/10 text-xs text-muted-foreground",
          className,
        )}
        style={{ height }}
      >
        {emptyMessage}
      </div>
    );
  }

  function pickFill(v: number): string {
    if (v === 0) return "transparent";
    let intensity: number;
    if (diverging) {
      const range = Math.max(Math.abs(grid!.vMin), Math.abs(grid!.vMax));
      if (range === 0) return "transparent";
      intensity = scale === "log" ? Math.log1p(Math.abs(v)) / Math.log1p(range) : Math.abs(v) / range;
      const alpha = 0.05 + Math.min(1, intensity) * 0.6;
      return v > 0 ? `rgba(16, 185, 129, ${alpha})` : `rgba(239, 68, 68, ${alpha})`;
    }
    if (grid!.vMax === 0) return "transparent";
    intensity = scale === "log" ? Math.log1p(v) / Math.log1p(grid!.vMax) : v / grid!.vMax;
    const alpha = 0.05 + Math.min(1, intensity) * 0.7;
    return `rgba(239, 68, 68, ${alpha})`;
  }

  return (
    <div className={cn("w-full flex flex-col", className)} style={{ height }}>
      {(xLabel || yLabel) && (
        <div className="flex items-center justify-between px-2 text-[10px] text-muted-foreground/80">
          <span>{yLabel ?? ""}</span>
          <span>{xLabel ?? ""}</span>
        </div>
      )}
      <div className="flex-1 overflow-hidden">
        <svg
          viewBox={`0 0 ${xBuckets} ${yBuckets}`}
          preserveAspectRatio="none"
          className="w-full h-full"
          style={{ display: "block" }}
        >
          {grid.cells.map((row, yi) =>
            row.map((v, xi) => {
              if (v === 0) return null;
              const cellY = yBuckets - 1 - yi; // flip so larger y values render at the top
              return (
                <rect
                  key={`${xi}-${yi}`}
                  x={xi}
                  y={cellY}
                  width={1}
                  height={1}
                  fill={pickFill(v)}
                  className={onCellClick ? "cursor-pointer" : undefined}
                  onClick={
                    onCellClick
                      ? () =>
                          onCellClick({
                            xMin: grid.xMin + xi * grid.xStep,
                            xMax: grid.xMin + (xi + 1) * grid.xStep,
                            yMin: grid.yMin + yi * grid.yStep,
                            yMax: grid.yMin + (yi + 1) * grid.yStep,
                            vSum: v,
                          })
                      : undefined
                  }
                >
                  <title>{`x: ${xFmt(grid.xMin + xi * grid.xStep)} y: ${yFmt(grid.yMin + yi * grid.yStep)} → ${formatV(v)}`}</title>
                </rect>
              );
            }),
          )}
        </svg>
      </div>
      <div className="flex justify-between text-[9px] font-mono tabular-nums text-muted-foreground/70 pt-1 px-1">
        {xTicks.map((t, i) => (
          <span key={i}>{t.label}</span>
        ))}
      </div>
    </div>
  );
}
