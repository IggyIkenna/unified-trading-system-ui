"use client";

import * as React from "react";
import {
  createChart,
  LineSeries,
  HistogramSeries,
  ColorType,
} from "lightweight-charts";
import type { IChartApi, ISeriesApi, Time } from "lightweight-charts";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type {
  EquityPoint,
  TradeMarker,
  EquityChartLayers,
} from "@/lib/backtest-analytics-types";
import { DEFAULT_EQUITY_LAYERS } from "@/lib/backtest-analytics-types";

interface EquityChartWithLayersProps {
  equityCurve: EquityPoint[];
  tradeMarkers?: TradeMarker[];
  height?: number;
  className?: string;
  initialLayers?: Partial<EquityChartLayers>;
}

export function EquityChartWithLayers({
  equityCurve,
  tradeMarkers = [],
  height = 340,
  className,
  initialLayers,
}: EquityChartWithLayersProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const chartRef = React.useRef<IChartApi | null>(null);

  const equitySeriesRef = React.useRef<ISeriesApi<"Line"> | null>(null);
  const buyHoldSeriesRef = React.useRef<ISeriesApi<"Line"> | null>(null);
  const markerSeriesRef = React.useRef<ISeriesApi<"Histogram"> | null>(null);
  const drawdownSeriesRef = React.useRef<ISeriesApi<"Histogram"> | null>(null);

  const [layers, setLayers] = React.useState<EquityChartLayers>({
    ...DEFAULT_EQUITY_LAYERS,
    ...initialLayers,
  });

  React.useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "rgba(255, 255, 255, 0.5)",
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.06)" },
        horzLines: { color: "rgba(255, 255, 255, 0.06)" },
      },
      crosshair: {
        mode: 1,
        vertLine: { color: "rgba(255, 255, 255, 0.2)", width: 1, style: 2 },
        horzLine: { color: "rgba(255, 255, 255, 0.2)", width: 1, style: 2 },
      },
      rightPriceScale: {
        borderColor: "rgba(255, 255, 255, 0.08)",
        scaleMargins: { top: 0.05, bottom: 0.15 },
      },
      timeScale: {
        borderColor: "rgba(255, 255, 255, 0.08)",
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: { vertTouchDrag: false },
    });

    const equitySeries = chart.addSeries(LineSeries, {
      color: "#10b981",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    const buyHoldSeries = chart.addSeries(LineSeries, {
      color: "#6366f1",
      lineWidth: 1,
      lineStyle: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    const markerSeries = chart.addSeries(HistogramSeries, {
      priceScaleId: "markers",
      priceFormat: { type: "volume" },
    });
    markerSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
    });

    const drawdownSeries = chart.addSeries(HistogramSeries, {
      priceScaleId: "drawdown",
      color: "rgba(239, 68, 68, 0.3)",
      priceFormat: { type: "volume" },
    });
    drawdownSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    chartRef.current = chart;
    equitySeriesRef.current = equitySeries;
    buyHoldSeriesRef.current = buyHoldSeries;
    markerSeriesRef.current = markerSeries;
    drawdownSeriesRef.current = drawdownSeries;

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, []);

  React.useEffect(() => {
    if (!equitySeriesRef.current || !buyHoldSeriesRef.current) return;
    if (!equityCurve.length) return;

    equitySeriesRef.current.setData(
      equityCurve.map((p) => ({
        time: p.time as Time,
        value: p.equity,
      })),
    );
    equitySeriesRef.current.applyOptions({
      visible: layers.equity,
    });

    buyHoldSeriesRef.current.setData(
      equityCurve.map((p) => ({
        time: p.time as Time,
        value: p.buy_hold,
      })),
    );
    buyHoldSeriesRef.current.applyOptions({
      visible: layers.buy_hold,
    });

    if (markerSeriesRef.current) {
      markerSeriesRef.current.setData(
        tradeMarkers.map((m) => ({
          time: m.time as Time,
          value: Math.abs(m.pnl) * 10,
          color:
            m.pnl >= 0 ? "rgba(16, 185, 129, 0.6)" : "rgba(239, 68, 68, 0.6)",
        })),
      );
      markerSeriesRef.current.applyOptions({
        visible: layers.trade_markers,
      });
    }

    if (drawdownSeriesRef.current) {
      drawdownSeriesRef.current.setData(
        equityCurve
          .filter((p) => p.drawdown_pct < 0)
          .map((p) => ({
            time: p.time as Time,
            value: Math.abs(p.drawdown_pct) * 100000,
            color: "rgba(239, 68, 68, 0.25)",
          })),
      );
      drawdownSeriesRef.current.applyOptions({
        visible: layers.runup_drawdown,
      });
    }

    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, [equityCurve, tradeMarkers, layers]);

  const toggles: {
    key: keyof EquityChartLayers;
    label: string;
    color: string;
  }[] = [
    { key: "equity", label: "Equity", color: "#10b981" },
    { key: "buy_hold", label: "Buy & Hold", color: "#6366f1" },
    { key: "trade_markers", label: "Signal Markers", color: "#f59e0b" },
    { key: "runup_drawdown", label: "Drawdowns", color: "#ef4444" },
  ];

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-4 px-1">
        {toggles.map((t) => (
          <label
            key={t.key}
            className="flex items-center gap-1.5 cursor-pointer text-xs"
          >
            <Checkbox
              checked={layers[t.key]}
              onCheckedChange={(checked) =>
                setLayers((prev) => ({ ...prev, [t.key]: !!checked }))
              }
              className="size-3.5"
            />
            <span className="flex items-center gap-1">
              <span
                className="inline-block size-2 rounded-full"
                style={{ backgroundColor: t.color }}
              />
              {t.label}
            </span>
          </label>
        ))}
      </div>
      <div ref={containerRef} style={{ height, width: "100%" }} />
    </div>
  );
}
