"use client";

import * as React from "react";
import { createChart, CandlestickSeries, HistogramSeries, ColorType, createSeriesMarkers } from "lightweight-charts";
import type {
  IChartApi,
  ISeriesApi,
  Time,
  ISeriesMarkersPluginApi,
  SeriesMarker,
  CandlestickData,
} from "lightweight-charts";
import { cn } from "@/lib/utils";
import { bumpDuplicateTimes } from "@/lib/lightweight-charts-series";
import type { StrategySignal } from "@/lib/types/strategy-platform";

/** Close-only bar input (e.g. from `generateSyntheticPriceSeries`) — converted to OHLC in-chart */
export interface PriceBarPoint {
  time: number;
  value: number;
}

export interface SignalOverlayStrategy {
  id: string;
  label: string;
  color: string;
  signals: StrategySignal[];
}

interface SignalOverlayChartProps {
  priceSeries: PriceBarPoint[];
  strategies: SignalOverlayStrategy[];
  height?: number;
  subtitle?: string;
  className?: string;
  /** Show volume histogram under the main pane (TradingView-style) */
  showVolume?: boolean;
}

/** Build OHLC from a synthetic close series (deterministic wicks from bar range). */
function pricePointsToCandlesticks(points: PriceBarPoint[]): CandlestickData<Time>[] {
  if (points.length === 0) return [];
  const out: CandlestickData<Time>[] = [];
  for (let i = 0; i < points.length; i++) {
    const close = points[i].value;
    const open = i === 0 ? close : points[i - 1].value;
    const range = Math.max(Math.abs(close - open), close * 0.0006);
    const high = Math.max(open, close) + range * 0.55;
    const low = Math.min(open, close) - range * 0.55;
    out.push({
      time: points[i].time as Time,
      open,
      high,
      low,
      close,
    });
  }
  return out;
}

function snapToNearestBarTime(signalTimeSec: number, barTimes: number[]): number {
  if (barTimes.length === 0) return signalTimeSec;
  let best = barTimes[0];
  let bestD = Infinity;
  for (const t of barTimes) {
    const d = Math.abs(t - signalTimeSec);
    if (d < bestD) {
      bestD = d;
      best = t;
    }
  }
  return best;
}

function buildMarkers(strategies: SignalOverlayStrategy[], barTimes: number[]): SeriesMarker<Time>[] {
  const markers: SeriesMarker<Time>[] = [];
  for (const st of strategies) {
    for (const s of st.signals) {
      if (s.direction !== "LONG" && s.direction !== "SHORT") continue;
      const raw = Math.floor(new Date(s.timestamp).getTime() / 1000);
      const t = snapToNearestBarTime(raw, barTimes) as Time;
      const isLong = s.direction === "LONG";
      markers.push({
        time: t,
        position: isLong ? "belowBar" : "aboveBar",
        color: st.color,
        shape: isLong ? "arrowUp" : "arrowDown",
        size: 1,
      });
    }
  }
  const sorted = [...markers].sort((a, b) => (a.time as number) - (b.time as number));
  return bumpDuplicateTimes(sorted);
}

export function SignalOverlayChart({
  priceSeries,
  strategies,
  height = 320,
  subtitle,
  className,
  showVolume = true,
}: SignalOverlayChartProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const chartRef = React.useRef<IChartApi | null>(null);
  const candleRef = React.useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeRef = React.useRef<ISeriesApi<"Histogram"> | null>(null);
  const markersRef = React.useRef<ISeriesMarkersPluginApi<Time> | null>(null);

  const candleData = React.useMemo(() => bumpDuplicateTimes(pricePointsToCandlesticks(priceSeries)), [priceSeries]);

  const barTimes = React.useMemo(() => priceSeries.map((p) => p.time), [priceSeries]);

  const markers = React.useMemo(() => buildMarkers(strategies, barTimes), [strategies, barTimes]);

  React.useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "rgba(255, 255, 255, 0.55)",
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.06)" },
        horzLines: { color: "rgba(255, 255, 255, 0.06)" },
      },
      crosshair: {
        mode: 1,
        vertLine: { color: "rgba(255, 255, 255, 0.25)", width: 1, style: 2 },
        horzLine: { color: "rgba(255, 255, 255, 0.25)", width: 1, style: 2 },
      },
      rightPriceScale: {
        borderColor: "rgba(255, 255, 255, 0.08)",
        scaleMargins: showVolume ? { top: 0.08, bottom: 0.22 } : { top: 0.08, bottom: 0.05 },
      },
      timeScale: {
        borderColor: "rgba(255, 255, 255, 0.08)",
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: { vertTouchDrag: false },
    });

    const candle = chart.addSeries(CandlestickSeries, {
      upColor: "#10b981",
      downColor: "#ef4444",
      borderUpColor: "#10b981",
      borderDownColor: "#ef4444",
      wickUpColor: "#10b981",
      wickDownColor: "#ef4444",
    });

    let volume: ISeriesApi<"Histogram"> | null = null;
    if (showVolume) {
      volume = chart.addSeries(HistogramSeries, {
        color: "#26a69a",
        priceFormat: { type: "volume" },
        priceScaleId: "",
      });
      volume.priceScale().applyOptions({
        scaleMargins: { top: 0.82, bottom: 0 },
      });
    }

    const markersApi = createSeriesMarkers(candle, []);

    chartRef.current = chart;
    candleRef.current = candle;
    volumeRef.current = volume;
    markersRef.current = markersApi;

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
      markersApi.detach();
      chart.remove();
      chartRef.current = null;
      candleRef.current = null;
      volumeRef.current = null;
      markersRef.current = null;
    };
  }, [showVolume]);

  React.useEffect(() => {
    if (!candleRef.current || !chartRef.current) return;
    if (candleData.length === 0) return;

    candleRef.current.setData(candleData);

    if (volumeRef.current && showVolume) {
      const volData = candleData.map((d) => {
        const up = d.close >= d.open;
        return {
          time: d.time,
          value: Math.abs(d.close - d.open) * 1200 + Math.abs(d.close) * 0.02,
          color: up ? "rgba(16, 185, 129, 0.45)" : "rgba(239, 68, 68, 0.45)",
        };
      });
      volumeRef.current.setData(volData);
    }

    markersRef.current?.setMarkers(markers);
    chartRef.current.timeScale().fitContent();
  }, [candleData, markers, showVolume]);

  return (
    <div className={cn("space-y-2", className)}>
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Price & Signal Overlay</h4>
        {subtitle ? <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p> : null}
      </div>
      <div className="flex flex-wrap gap-3 text-[10px] mb-1">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <span className="size-2 rounded-sm bg-emerald-500/80" />
          OHLC (synthetic)
        </span>
        {strategies.map((s) => (
          <span key={s.id} className="flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
      <div ref={containerRef} style={{ height, width: "100%" }} />
    </div>
  );
}
