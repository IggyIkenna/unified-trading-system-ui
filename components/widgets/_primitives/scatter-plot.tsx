"use client";

import { cn } from "@/lib/utils";
import * as React from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";

export interface ScatterPlotPoint {
  x: number;
  y: number;
  /** Optional label for tooltip / hover state. */
  label?: string;
}

export interface ScatterPlotSeries {
  id: string;
  name: string;
  data: ReadonlyArray<ScatterPlotPoint>;
  /** Hex / CSS colour. Default uses chart-1..chart-5 tokens by series index. */
  colour?: string;
  /** Mode: line (connected) or scatter (points only). Default: line. */
  mode?: "line" | "scatter";
}

export interface ScatterPlotProps {
  series: ReadonlyArray<ScatterPlotSeries>;
  xLabel?: string;
  yLabel?: string;
  /** X-axis kind. "time" formats x as ISO timestamps; "expiry" / "maturity" formats as days/months; "linear" raw numbers. */
  xKind?: "time" | "expiry" | "maturity" | "linear";
  /** Format the y-axis tick value for display. */
  formatY?: (v: number) => string;
  /** Format the x-axis tick value for display. */
  formatX?: (v: number) => string;
  height?: number | string;
  className?: string;
  emptyMessage?: string;
}

const DEFAULT_COLOURS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function defaultFormatY(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(2)}k`;
  if (Math.abs(v) < 0.01 && v !== 0) return v.toExponential(2);
  return v.toFixed(2);
}

function formatXTime(v: number): string {
  return new Date(v).toISOString().slice(5, 16).replace("T", " ");
}

function formatXExpiry(v: number): string {
  // Convention: x is days-to-expiry. Show as days < 90, then months.
  if (v < 90) return `${Math.round(v)}d`;
  if (v < 365) return `${(v / 30).toFixed(1)}m`;
  return `${(v / 365).toFixed(1)}y`;
}

function pickXFormatter(xKind: ScatterPlotProps["xKind"]): (v: number) => string {
  switch (xKind) {
    case "time":
      return formatXTime;
    case "expiry":
    case "maturity":
      return formatXExpiry;
    default:
      return (v) => v.toString();
  }
}

interface CustomTooltipProps extends TooltipProps<number, string> {
  formatY: (v: number) => string;
  formatX: (v: number) => string;
}

function ChartTooltip({ active, payload, formatY, formatX }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload as ScatterPlotPoint | undefined;
  if (!point) return null;
  return (
    <div className="rounded-md border border-border/60 bg-background/95 p-2 text-[10px] font-mono shadow-md backdrop-blur-sm">
      <div className="text-muted-foreground">{payload[0]?.name}</div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground/60">x:</span>
        <span className="font-medium">{formatX(point.x)}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground/60">y:</span>
        <span className="font-medium">{formatY(point.y)}</span>
      </div>
      {point.label && <div className="mt-0.5 text-muted-foreground/80">{point.label}</div>}
    </div>
  );
}

/**
 * Cross-asset-group XY plot primitive. Replaces the original plan's separate
 * `TermStructureChart` — term structure becomes `xKind="expiry"` here.
 *
 * Use cases across the DART terminal:
 *  - basis curve (xKind=expiry, yLabel=basis bps)
 *  - rates curve (xKind=maturity, yLabel=yield)
 *  - implied probability over time (xKind=time, yLabel=probability)
 *  - line movement over time (xKind=time, yLabel=odds)
 *  - OI vs funding scatter (xKind=linear, mode=scatter)
 */
export function ScatterPlot({
  series,
  xLabel,
  yLabel,
  xKind = "linear",
  formatY = defaultFormatY,
  formatX,
  height = 280,
  className,
  emptyMessage = "No data",
}: ScatterPlotProps) {
  const xFormatter = formatX ?? pickXFormatter(xKind);
  const allEmpty = series.every((s) => s.data.length === 0);

  const allLine = series.every((s) => (s.mode ?? "line") === "line");

  if (allEmpty) {
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

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {allLine ? (
          <LineChart margin={{ top: 8, right: 16, bottom: 24, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
            <XAxis
              dataKey="x"
              type="number"
              domain={["dataMin", "dataMax"]}
              tickFormatter={xFormatter}
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              label={
                xLabel
                  ? {
                      value: xLabel,
                      position: "insideBottom",
                      offset: -8,
                      fontSize: 10,
                      fill: "var(--muted-foreground)",
                    }
                  : undefined
              }
            />
            <YAxis
              tickFormatter={formatY}
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              label={
                yLabel
                  ? {
                      value: yLabel,
                      angle: -90,
                      position: "insideLeft",
                      offset: 10,
                      fontSize: 10,
                      fill: "var(--muted-foreground)",
                    }
                  : undefined
              }
            />
            <Tooltip content={<ChartTooltip formatY={formatY} formatX={xFormatter} />} />
            {series.length > 1 && <Legend wrapperStyle={{ fontSize: 10 }} />}
            {series.map((s, idx) => (
              <Line
                key={s.id}
                data={s.data as ScatterPlotPoint[]}
                dataKey="y"
                name={s.name}
                stroke={s.colour ?? DEFAULT_COLOURS[idx % DEFAULT_COLOURS.length]}
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        ) : (
          <ScatterChart margin={{ top: 8, right: 16, bottom: 24, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
            <XAxis
              dataKey="x"
              type="number"
              domain={["dataMin", "dataMax"]}
              tickFormatter={xFormatter}
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              label={
                xLabel
                  ? {
                      value: xLabel,
                      position: "insideBottom",
                      offset: -8,
                      fontSize: 10,
                      fill: "var(--muted-foreground)",
                    }
                  : undefined
              }
            />
            <YAxis
              dataKey="y"
              tickFormatter={formatY}
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              label={
                yLabel
                  ? {
                      value: yLabel,
                      angle: -90,
                      position: "insideLeft",
                      offset: 10,
                      fontSize: 10,
                      fill: "var(--muted-foreground)",
                    }
                  : undefined
              }
            />
            <Tooltip content={<ChartTooltip formatY={formatY} formatX={xFormatter} />} />
            {series.length > 1 && <Legend wrapperStyle={{ fontSize: 10 }} />}
            {series.map((s, idx) => (
              <Scatter
                key={s.id}
                data={s.data as ScatterPlotPoint[]}
                name={s.name}
                fill={s.colour ?? DEFAULT_COLOURS[idx % DEFAULT_COLOURS.length]}
                line={s.mode === "line"}
              />
            ))}
          </ScatterChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
