"use client";

// CandlestickChart v5.0 - supports candle/line display switching via displayType prop
import * as React from "react";
import { createChart, CandlestickSeries, HistogramSeries, LineSeries, AreaSeries, ColorType } from "lightweight-charts";
import type { IChartApi, ISeriesApi, CandlestickData, Time, LineData } from "lightweight-charts";
import { cn } from "@/lib/utils";

export interface IndicatorOverlay {
  id: string;
  label: string;
  color: string;
  data: Array<{ time: number; value: number | null }>;
  lineWidth?: number;
  lineStyle?: number;
}

interface CandlestickChartProps {
  data: Array<{
    time: number; // Unix timestamp in SECONDS (not milliseconds)
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
  }>;
  indicators?: IndicatorOverlay[];
  /** Fixed height in px. Omit to fill the parent (parent must establish height, e.g. flex-1 min-h-0). */
  height?: number;
  className?: string;
  /**
   * Use inside a `relative` flex slot with `className="absolute inset-0"` so the chart gets a real box size
   * (flex + Lightweight Charts often leave `clientHeight` too small).
   */
  absoluteFill?: boolean;
  /**
   * "candles" shows candlestick + volume histogram (default).
   * "line" shows an area chart of close prices using the same chart instance — no remount on switch.
   */
  displayType?: "candles" | "line";
}

export function CandlestickChart({
  data,
  indicators = [],
  height,
  className,
  absoluteFill = false,
  displayType = "candles",
}: CandlestickChartProps) {
  /** Layout box — lightweight-charts sets inline px size on the mount node, which breaks `absolute inset-0` stretch. */
  const chartOuterRef = React.useRef<HTMLDivElement>(null);
  const chartContainerRef = React.useRef<HTMLDivElement>(null);
  const chartRef = React.useRef<IChartApi | null>(null);
  const candlestickSeriesRef = React.useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = React.useRef<ISeriesApi<"Histogram"> | null>(null);
  const areaSeriesRef = React.useRef<ISeriesApi<"Area"> | null>(null);
  const indicatorSeriesRef = React.useRef<Map<string, ISeriesApi<"Line">>>(new Map());

  // Initialize chart + keep size in sync (autoSize breaks inside flex + Radix ScrollArea)
  React.useLayoutEffect(() => {
    const inner = chartContainerRef.current;
    const outer = chartOuterRef.current;
    if (!inner || !outer) return;

    const fixedH = height !== undefined ? height : null;
    const readSize = () => {
      if (fixedH !== null) {
        const w = Math.max(1, Math.floor(outer.getBoundingClientRect().width));
        return { w, h: fixedH };
      }
      /* Measure the outer wrapper — the inner node gets explicit px height from the library. */
      const r = outer.getBoundingClientRect();
      const w = Math.max(1, Math.floor(r.width));
      const h = Math.max(120, Math.floor(r.height));
      return { w, h };
    };

    const { w: initW, h: initH } = readSize();
    const chart = createChart(inner, {
      autoSize: false,
      width: initW,
      height: initH,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "rgba(255, 255, 255, 0.5)",
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.1)" },
        horzLines: { color: "rgba(255, 255, 255, 0.1)" },
      },
      crosshair: {
        mode: 1,
        vertLine: { color: "rgba(255, 255, 255, 0.3)", width: 1, style: 2 },
        horzLine: { color: "rgba(255, 255, 255, 0.3)", width: 1, style: 2 },
      },
      rightPriceScale: {
        borderColor: "rgba(255, 255, 255, 0.1)",
      },
      timeScale: {
        borderColor: "rgba(255, 255, 255, 0.1)",
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: { vertTouchDrag: false },
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#10b981",
      downColor: "#ef4444",
      borderUpColor: "#10b981",
      borderDownColor: "#ef4444",
      wickUpColor: "#10b981",
      wickDownColor: "#ef4444",
    });

    /* Paired with volume overlay */
    candlestickSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.1, bottom: 0.4 },
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: "#26a69a",
      priceFormat: { type: "volume" },
      priceScaleId: "",
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.7, bottom: 0 },
    });

    /* Area series for line chart mode — same chart instance, toggled via displayType */
    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: "#10b981",
      topColor: "rgba(16, 185, 129, 0.3)",
      bottomColor: "rgba(16, 185, 129, 0)",
      lineWidth: 2,
    });
    areaSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.05, bottom: 0.05 },
    });

    // Set initial visibility based on displayType at mount time
    const isLine = displayType === "line";
    candlestickSeries.applyOptions({ visible: !isLine });
    volumeSeries.applyOptions({ visible: !isLine });
    areaSeries.applyOptions({ visible: isLine });

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;
    volumeSeriesRef.current = volumeSeries;
    areaSeriesRef.current = areaSeries;

    const syncSize = () => {
      const c = chartRef.current;
      if (!c) return;
      const { w, h } = readSize();
      c.resize(w, h);
    };

    const ro = new ResizeObserver(() => {
      syncSize();
    });
    ro.observe(outer);
    ro.observe(inner);
    syncSize();
    let rafOuter = 0;
    let rafInner = 0;
    rafOuter = requestAnimationFrame(() => {
      syncSize();
      rafInner = requestAnimationFrame(() => {
        syncSize();
      });
    });
    const t50 = window.setTimeout(syncSize, 50);
    const t200 = window.setTimeout(syncSize, 200);

    return () => {
      window.clearTimeout(t50);
      window.clearTimeout(t200);
      cancelAnimationFrame(rafOuter);
      cancelAnimationFrame(rafInner);
      ro.disconnect();
      chart.remove();
      indicatorSeriesRef.current.clear();
    };

    // displayType initial value is intentionally captured at mount; subsequent changes handled below
  }, [height]);

  // Toggle candle/line display without recreating the chart instance
  React.useEffect(() => {
    const cs = candlestickSeriesRef.current;
    const vs = volumeSeriesRef.current;
    const as = areaSeriesRef.current;
    if (!cs || !vs || !as) return;

    const isLine = displayType === "line";
    cs.applyOptions({ visible: !isLine });
    vs.applyOptions({ visible: !isLine });
    as.applyOptions({ visible: isLine });

    if (isLine) {
      as.priceScale().applyOptions({ scaleMargins: { top: 0.05, bottom: 0.05 } });
    } else {
      cs.priceScale().applyOptions({ scaleMargins: { top: 0.1, bottom: 0.4 } });
      vs.priceScale().applyOptions({ scaleMargins: { top: 0.7, bottom: 0 } });
    }
  }, [displayType]);

  // Update candle, volume, and area series data
  React.useEffect(() => {
    if (!candlestickSeriesRef.current || !volumeSeriesRef.current) return;
    if (!data || !Array.isArray(data) || data.length === 0) return;

    const validData = data.filter((d) => typeof d.time === "number" && !isNaN(d.time));
    if (validData.length === 0) return;

    const candlestickData: CandlestickData[] = validData.map((d) => ({
      time: d.time as Time,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    const volumeData = validData.map((d) => ({
      time: d.time as Time,
      value: d.volume || 0,
      color: d.close >= d.open ? "rgba(16, 185, 129, 0.5)" : "rgba(239, 68, 68, 0.5)",
    }));

    const areaData = validData.map((d) => ({
      time: d.time as Time,
      value: d.close,
    }));

    candlestickSeriesRef.current.setData(candlestickData);
    volumeSeriesRef.current.setData(volumeData);
    if (areaSeriesRef.current) {
      areaSeriesRef.current.setData(areaData);
    }

    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, [data]);

  // Update indicator overlays
  React.useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const currentIds = new Set(indicators.map((i) => i.id));
    const existingMap = indicatorSeriesRef.current;

    // Remove indicators that are no longer present
    for (const [id, series] of existingMap) {
      if (!currentIds.has(id)) {
        chart.removeSeries(series);
        existingMap.delete(id);
      }
    }

    // Add or update indicators
    for (const indicator of indicators) {
      const lineData: LineData[] = indicator.data
        .filter((d) => d.value !== null && typeof d.time === "number")
        .map((d) => ({ time: d.time as Time, value: d.value as number }));

      if (lineData.length === 0) continue;

      let series = existingMap.get(indicator.id);
      if (!series) {
        series = chart.addSeries(LineSeries, {
          color: indicator.color,
          lineWidth: (indicator.lineWidth ?? 1) as 1 | 2 | 3 | 4,
          lineStyle: indicator.lineStyle ?? 0,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        });
        existingMap.set(indicator.id, series);
      }
      series.setData(lineData);
    }
  }, [indicators]);

  const fillParent = height === undefined;
  const pctFill = fillParent && !absoluteFill;

  return (
    <div
      ref={chartOuterRef}
      className={cn(
        "min-w-0",
        absoluteFill && className,
        pctFill && "h-full w-full min-h-[120px]",
        !absoluteFill && !pctFill && className,
      )}
      style={!fillParent ? { height, width: "100%" } : pctFill ? { width: "100%", height: "100%" } : undefined}
    >
      <div ref={chartContainerRef} className="min-h-0 h-full w-full" />
    </div>
  );
}
