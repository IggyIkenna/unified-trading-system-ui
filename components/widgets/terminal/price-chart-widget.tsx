"use client";

import * as React from "react";
import type { WidgetComponentProps } from "../widget-registry";
import { CandlestickChart } from "@/components/trading/candlestick-chart";
import { DepthChart } from "@/components/trading/order-book";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTerminalData } from "./terminal-data-context";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import dynamic from "next/dynamic";

const OptionsChain = dynamic(
  () => import("@/components/trading/options-chain").then((m) => ({ default: m.OptionsChain })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
        Loading options chain...
      </div>
    ),
  },
);
const VolSurfaceChart = dynamic(
  () => import("@/components/trading/vol-surface-chart").then((m) => ({ default: m.VolSurfaceChart })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
        Loading vol surface...
      </div>
    ),
  },
);

const TIMEFRAMES = ["1m", "5m", "15m", "1H", "4H", "1D"];
const INDICATORS = [
  { id: "sma20", label: "SMA 20" },
  { id: "sma50", label: "SMA 50" },
  { id: "ema12", label: "EMA 12" },
  { id: "bb", label: "BB" },
];

export function PriceChartWidget(_props: WidgetComponentProps) {
  const {
    selectedInstrument,
    livePrice,
    candleData,
    indicatorOverlays,
    bids,
    asks,
    chartType,
    setChartType,
    timeframe,
    setTimeframe,
    activeIndicators,
    toggleIndicator,
  } = useTerminalData();

  return (
    <Card className="h-full border-0 rounded-none flex flex-col">
      <CardHeader className="pb-2 pt-2 px-3 shrink-0">
        <div className="flex items-center justify-end gap-1">
          {(["candles", "line", "depth", "options"] as const).map((ct) => (
            <Button
              key={ct}
              variant={chartType === ct ? "secondary" : "ghost"}
              size="sm"
              className="h-6 px-2 text-[10px]"
              onClick={() => setChartType(ct)}
            >
              {ct.charAt(0).toUpperCase() + ct.slice(1)}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-1 mt-1">
          {INDICATORS.map((ind) => (
            <Button
              key={ind.id}
              variant={activeIndicators.has(ind.id) ? "secondary" : "ghost"}
              size="sm"
              className="h-5 px-1.5 text-[9px]"
              onClick={() => toggleIndicator(ind.id)}
            >
              {ind.label}
            </Button>
          ))}
          <div className="w-px h-4 bg-border mx-1" />
          {TIMEFRAMES.map((tf) => (
            <Button
              key={tf}
              variant={timeframe === tf ? "secondary" : "ghost"}
              size="sm"
              className="h-5 px-1.5 text-[9px]"
              onClick={() => setTimeframe(tf)}
            >
              {tf}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 p-0">
        {chartType === "candles" && (
          <div className="h-full p-2">
            <CandlestickChart
              data={candleData as never}
              overlays={indicatorOverlays as never}
              symbol={selectedInstrument.symbol}
              venue={selectedInstrument.venue}
              timeframe={timeframe}
            />
          </div>
        )}
        {chartType === "line" && (
          <div className="h-full p-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={candleData.map((c) => ({
                  time: (c as Record<string, unknown>).time,
                  value: (c as Record<string, unknown>).close,
                }))}
              >
                <defs>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--pnl-positive)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--pnl-positive)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    fontSize: 11,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="var(--pnl-positive)"
                  fill="url(#lineGrad)"
                  strokeWidth={1.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
        {chartType === "depth" && (
          <div className="h-full p-2">
            <DepthChart bids={bids} asks={asks} midPrice={livePrice} />
          </div>
        )}
        {chartType === "options" && (
          <div className="h-full p-2 space-y-4 overflow-auto">
            <OptionsChain underlying={selectedInstrument.symbol} venue={selectedInstrument.venue} />
            <VolSurfaceChart underlying={selectedInstrument.symbol} venue={selectedInstrument.venue} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
