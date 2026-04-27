"use client";

import { Calendar, Radio } from "lucide-react";
import type { WidgetComponentProps } from "../widget-registry";
import { CandlestickChart, type IndicatorOverlay } from "@/components/trading/candlestick-chart";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGlobalScope } from "@/lib/stores/global-scope-store";
import { useTerminalData } from "./terminal-data-context";

const TIMEFRAMES = ["1m", "5m", "15m", "1H", "4H", "1D"];
const INDICATORS = [
  { id: "sma20", label: "SMA 20" },
  { id: "sma50", label: "SMA 50" },
  { id: "ema12", label: "EMA 12" },
  { id: "bb", label: "BB" },
];

const QUICK_DATES: Array<{ label: string; offsetDays: number }> = [
  { label: "Yest", offsetDays: -1 },
  { label: "2d", offsetDays: -2 },
  { label: "1w", offsetDays: -7 },
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
    loadMoreCandles,
    isLoadingMoreHistory,
  } = useTerminalData();

  const scopeMode = useGlobalScope((s) => s.scope.mode);
  const asOfDatetime = useGlobalScope((s) => s.scope.asOfDatetime);
  const setMode = useGlobalScope((s) => s.setMode);
  const setAsOfDatetime = useGlobalScope((s) => s.setAsOfDatetime);

  const dateInputValue = asOfDatetime ? asOfDatetime.slice(0, 10) : new Date().toISOString().slice(0, 10);

  const handleDateChange = (iso: string) => {
    if (!iso) return;
    if (scopeMode !== "batch") setMode("batch");
    setAsOfDatetime(`${iso}T20:00:00.000Z`);
  };

  const handleQuickDate = (offsetDays: number) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + offsetDays);
    if (scopeMode !== "batch") setMode("batch");
    setAsOfDatetime(`${d.toISOString().slice(0, 10)}T20:00:00.000Z`);
  };

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
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Mode + date controls — Live / As-Of date / quick offsets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center border border-border rounded-md overflow-hidden">
              <button
                type="button"
                onClick={() => setMode("live")}
                className={
                  "flex items-center gap-1 px-2 py-0.5 text-nano transition-colors " +
                  (scopeMode === "live"
                    ? "bg-emerald-500/10 text-emerald-400 font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary")
                }
              >
                <Radio className="size-3" />
                Live
              </button>
              <div className="w-px h-3 bg-border" />
              <button
                type="button"
                onClick={() => setMode("batch")}
                className={
                  "flex items-center gap-1 px-2 py-0.5 text-nano transition-colors " +
                  (scopeMode === "batch"
                    ? "bg-sky-500/10 text-sky-400 font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary")
                }
              >
                <Calendar className="size-3" />
                As-Of
              </button>
            </div>
            <div className="flex items-center gap-1 px-1.5 py-0.5 border border-border rounded-md">
              <Calendar className="size-3 text-muted-foreground" />
              <input
                type="date"
                aria-label="As-of date"
                value={dateInputValue}
                onChange={(e) => handleDateChange(e.target.value)}
                className="bg-transparent text-nano border-none focus:outline-none w-[7.5rem]"
              />
            </div>
            <div className="flex items-center gap-1">
              {QUICK_DATES.map(({ label, offsetDays }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => handleQuickDate(offsetDays)}
                  className="px-1.5 py-0.5 text-nano text-muted-foreground hover:text-foreground hover:bg-secondary rounded"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {/* Candles / Line */}
          <div className="flex items-center gap-1">
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
              key={`${selectedInstrument.venue}:${selectedInstrument.symbol}`}
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
              onLoadMoreLeft={loadMoreCandles}
            />
            {isLoadingMoreHistory && (
              <div className="absolute left-2 top-2 z-10 rounded bg-background/80 px-2 py-1 text-nano text-muted-foreground">
                Loading older history…
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
