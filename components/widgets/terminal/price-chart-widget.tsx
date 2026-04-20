"use client";

import type { WidgetComponentProps } from "../widget-registry";
import { CandlestickChart, type IndicatorOverlay } from "@/components/trading/candlestick-chart";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTerminalData } from "./terminal-data-context";

const TIMEFRAMES = ["1m", "5m", "15m", "1H", "4H", "1D"];
const INDICATORS = [
  { id: "sma20", label: "SMA 20" },
  { id: "sma50", label: "SMA 50" },
  { id: "ema12", label: "EMA 12" },
  { id: "bb", label: "BB" },
];

export function PriceChartWidget(_props: WidgetComponentProps) {
  const {
    candleData,
    indicatorOverlays,
    chartType,
    setChartType,
    timeframe,
    setTimeframe,
    activeIndicators,
    toggleIndicator,
    selectedInstrument,
    isLoading,
    error,
  } = useTerminalData();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="animate-pulse text-sm text-zinc-400">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="text-sm text-rose-400">{error}</span>
      </div>
    );
  }

  return (
    // `absolute inset-0` positions the Card relative to the WidgetScroll Root
    // (which has position:relative), bypassing Radix ScrollArea's display:table
    // wrapper div that breaks flex-1 height propagation to chart children.
    <Card className="absolute inset-0 flex flex-col gap-0 border-0 rounded-none p-0 shadow-none overflow-hidden">
      <CardHeader className="pb-2 pt-2 px-3 shrink-0">
        <div className="flex items-center justify-end gap-1">
          {(["candles", "line"] as const).map((ct) => (
            <Button
              key={ct}
              variant={chartType === ct ? "secondary" : "ghost"}
              size="sm"
              className="h-6 px-2 text-micro"
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
              className="h-5 px-1.5 text-nano"
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
              className="h-5 px-1.5 text-nano"
              onClick={() => setTimeframe(tf)}
            >
              {tf}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
        {candleData.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            No chart data available for {selectedInstrument.symbol}
          </div>
        ) : (
          /* Candles and Line share one persistent LWC chart instance — no remount on switch */
          <div className="flex-1 min-h-0 relative">
            <CandlestickChart
              key={`${selectedInstrument.symbol}-${timeframe}`}
              absoluteFill
              className="absolute inset-0"
              displayType={chartType === "line" ? "line" : "candles"}
              data={
                candleData as Array<{
                  time: number;
                  open: number;
                  high: number;
                  low: number;
                  close: number;
                  volume?: number;
                }>
              }
              indicators={indicatorOverlays as unknown as IndicatorOverlay[]}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
