"use client";

import { cn } from "@/lib/utils";
import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";

export interface DepthLevel {
  /** Price level. */
  price: number;
  /** Order quantity at this level. */
  size: number;
}

export interface DepthAreaChartProps {
  bids: ReadonlyArray<DepthLevel>;
  asks: ReadonlyArray<DepthLevel>;
  /** Format the price tick / tooltip. Default: 2dp. */
  formatPrice?: (p: number) => string;
  /** Format the size axis. Default: humanised k/M. */
  formatSize?: (s: number) => string;
  /** Show midpoint reference line. Default: true. */
  showMid?: boolean;
  /** Number of levels to render per side (defaults to all). */
  depthLimit?: number;
  height?: number | string;
  className?: string;
  emptyMessage?: string;
}

const COLOUR_BID = "var(--pnl-positive, #10b981)";
const COLOUR_ASK = "var(--pnl-negative, #ef4444)";

function defaultFormatPrice(p: number): string {
  if (p >= 1000) return p.toFixed(0);
  if (p >= 1) return p.toFixed(2);
  return p.toFixed(6);
}

function defaultFormatSize(s: number): string {
  if (Math.abs(s) >= 1_000_000) return `${(s / 1_000_000).toFixed(2)}M`;
  if (Math.abs(s) >= 1_000) return `${(s / 1_000).toFixed(1)}k`;
  return s.toFixed(2);
}

interface CustomTooltipProps extends TooltipProps<number, string> {
  formatPrice: (p: number) => string;
  formatSize: (s: number) => string;
}

function ChartTooltip({ active, payload, label, formatPrice, formatSize }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-md border border-border/60 bg-background/95 p-2 text-[10px] font-mono shadow-md backdrop-blur-sm space-y-0.5">
      <div className="text-muted-foreground">Price: {formatPrice(Number(label))}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex justify-between gap-3">
          <span style={{ color: p.color }}>{p.name}</span>
          <span>{formatSize(Number(p.value))}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Cumulative bid/ask depth area chart — Coinglass-style "depth curve" form.
 *
 * Sibling of the laddered `components/trading/order-book.tsx` (NOT a
 * replacement). Use this for the depth-curve UI; use `OrderBook` for the
 * ladder UI. Both should coexist in the DART terminal — Coinglass-style
 * orderbook depth, sports book depth (cross-asset analogue), and Polymarket
 * outcome book all consume this primitive.
 */
export function DepthAreaChart({
  bids,
  asks,
  formatPrice = defaultFormatPrice,
  formatSize = defaultFormatSize,
  showMid = true,
  depthLimit,
  height = 260,
  className,
  emptyMessage = "No book depth",
}: DepthAreaChartProps) {
  const data = React.useMemo(() => {
    if (bids.length === 0 && asks.length === 0) return [];
    const bidsLimited = depthLimit ? bids.slice(0, depthLimit) : bids;
    const asksLimited = depthLimit ? asks.slice(0, depthLimit) : asks;
    // Bids descending by price; cumulate from best bid downward.
    const sortedBids = [...bidsLimited].sort((a, b) => b.price - a.price);
    const sortedAsks = [...asksLimited].sort((a, b) => a.price - b.price);
    let cumBid = 0;
    const bidPoints = sortedBids
      .map((b) => {
        cumBid += b.size;
        return { price: b.price, bid: cumBid, ask: null as number | null };
      })
      .reverse();
    let cumAsk = 0;
    const askPoints = sortedAsks.map((a) => {
      cumAsk += a.size;
      return { price: a.price, bid: null as number | null, ask: cumAsk };
    });
    return [...bidPoints, ...askPoints];
  }, [bids, asks, depthLimit]);

  const mid = React.useMemo(() => {
    if (bids.length === 0 || asks.length === 0) return undefined;
    const bestBid = Math.max(...bids.map((b) => b.price));
    const bestAsk = Math.min(...asks.map((a) => a.price));
    return (bestBid + bestAsk) / 2;
  }, [bids, asks]);

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

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 24, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
          <XAxis
            dataKey="price"
            type="number"
            domain={["dataMin", "dataMax"]}
            tickFormatter={formatPrice}
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          />
          <YAxis tickFormatter={formatSize} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
          <Tooltip content={<ChartTooltip formatPrice={formatPrice} formatSize={formatSize} />} />
          <Area
            dataKey="bid"
            name="Bid"
            type="stepAfter"
            stroke={COLOUR_BID}
            fill={COLOUR_BID}
            fillOpacity={0.18}
            isAnimationActive={false}
            connectNulls={false}
          />
          <Area
            dataKey="ask"
            name="Ask"
            type="stepAfter"
            stroke={COLOUR_ASK}
            fill={COLOUR_ASK}
            fillOpacity={0.18}
            isAnimationActive={false}
            connectNulls={false}
          />
          {showMid && mid !== undefined && (
            <ReferenceLine
              x={mid}
              stroke="var(--muted-foreground)"
              strokeDasharray="2 2"
              label={{ value: `Mid ${formatPrice(mid)}`, fontSize: 10, fill: "var(--muted-foreground)" }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
