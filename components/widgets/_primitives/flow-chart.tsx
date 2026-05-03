"use client";

import { cn } from "@/lib/utils";
import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";

export interface FlowChartBucket {
  /** Time-bucket key (ms epoch or ISO date string converted to ms). */
  t: number;
  /** Inflow magnitude (positive). */
  inflow: number;
  /** Outflow magnitude (positive — rendered as negative bars). */
  outflow: number;
  /** Optional pre-computed net (inflow − outflow). Auto-derived if absent. */
  net?: number;
}

export interface FlowChartProps {
  data: ReadonlyArray<FlowChartBucket>;
  /** Y-axis label. Default: "Flow ($)". */
  yLabel?: string;
  /** Format the y-axis values + tooltip. Default: humanised k/M/B. */
  formatY?: (v: number) => string;
  /** Show net cumulative line overlaying bars. Default: true. */
  showNet?: boolean;
  /** Format the x-axis time tick. Default: MM-DD HH:mm. */
  formatX?: (t: number) => string;
  height?: number | string;
  className?: string;
  emptyMessage?: string;
}

const COLOUR_INFLOW = "var(--pnl-positive, #10b981)";
const COLOUR_OUTFLOW = "var(--pnl-negative, #ef4444)";
const COLOUR_NET = "var(--chart-3, #f59e0b)";

function defaultFormatY(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(v / 1_000).toFixed(1)}k`;
  return `$${v.toFixed(0)}`;
}

function defaultFormatX(t: number): string {
  return new Date(t).toISOString().slice(5, 16).replace("T", " ");
}

interface CustomTooltipProps extends TooltipProps<number, string> {
  formatY: (v: number) => string;
  formatX: (t: number) => string;
}

function ChartTooltip({ active, payload, formatY, formatX }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0]?.payload as (FlowChartBucket & { _outflowNeg: number }) | undefined;
  if (!data) return null;
  return (
    <div className="rounded-md border border-border/60 bg-background/95 p-2 text-[10px] font-mono shadow-md backdrop-blur-sm space-y-0.5">
      <div className="text-muted-foreground">{formatX(data.t)}</div>
      <div className="flex justify-between gap-3">
        <span style={{ color: COLOUR_INFLOW }}>Inflow</span>
        <span>{formatY(data.inflow)}</span>
      </div>
      <div className="flex justify-between gap-3">
        <span style={{ color: COLOUR_OUTFLOW }}>Outflow</span>
        <span>{formatY(-data.outflow)}</span>
      </div>
      <div className="flex justify-between gap-3 border-t border-border/40 pt-0.5">
        <span style={{ color: COLOUR_NET }}>Net</span>
        <span>{formatY(data.net ?? data.inflow - data.outflow)}</span>
      </div>
    </div>
  );
}

/**
 * Directional inflow/outflow chart with optional cumulative net overlay.
 *
 * Inflows render as positive green bars; outflows as negative red bars (so
 * the zero line splits direction visually). The optional net line shows
 * cumulative inflow − outflow over time.
 *
 * Cross-asset-group use cases per the DART terminal plan:
 *  - exchange flows (CMC + Coinglass)
 *  - ETF flows (TradFi P4, crypto ETF P7)
 *  - bridge flows (P7)
 *  - sports handle (sports book volume by side)
 *  - stablecoin supply changes (DefiLlama P2)
 *  - Polymarket OutcomeVolumeChart (P3a, swap inflow/outflow → Yes/No)
 */
export function FlowChart({
  data,
  yLabel = "Flow ($)",
  formatY = defaultFormatY,
  showNet = true,
  formatX = defaultFormatX,
  height = 280,
  className,
  emptyMessage = "No flow data",
}: FlowChartProps) {
  const enriched = React.useMemo(
    () =>
      data.map((d) => ({
        ...d,
        _outflowNeg: -d.outflow,
        net: d.net ?? d.inflow - d.outflow,
      })),
    [data],
  );

  if (data.length === 0) {
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

  const Chart = showNet ? ComposedChart : BarChart;

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <Chart data={enriched} margin={{ top: 8, right: 16, bottom: 24, left: 8 }} stackOffset="sign">
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
          <XAxis
            dataKey="t"
            type="number"
            domain={["dataMin", "dataMax"]}
            tickFormatter={formatX}
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          />
          <YAxis
            tickFormatter={formatY}
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            label={{
              value: yLabel,
              angle: -90,
              position: "insideLeft",
              offset: 10,
              fontSize: 10,
              fill: "var(--muted-foreground)",
            }}
          />
          <Tooltip content={<ChartTooltip formatY={formatY} formatX={formatX} />} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <Bar dataKey="inflow" name="Inflow" fill={COLOUR_INFLOW} stackId="flow" isAnimationActive={false} />
          <Bar dataKey="_outflowNeg" name="Outflow" fill={COLOUR_OUTFLOW} stackId="flow" isAnimationActive={false} />
          {showNet && (
            <Line
              dataKey="net"
              name="Net"
              type="monotone"
              stroke={COLOUR_NET}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          )}
        </Chart>
      </ResponsiveContainer>
    </div>
  );
}
