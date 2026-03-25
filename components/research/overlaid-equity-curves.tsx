"use client";

import * as React from "react";
import { createChart, LineSeries, ColorType } from "lightweight-charts";
import type { IChartApi, ISeriesApi, Time } from "lightweight-charts";
import { cn } from "@/lib/utils";
import type { EquityPoint } from "@/lib/backtest-analytics-types";
import { bumpDuplicateTimes } from "@/lib/lightweight-charts-series";

export interface EquityCurveSeries {
  id: string;
  label: string;
  color: string;
  points: EquityPoint[];
}

interface OverlaidEquityCurvesProps {
  curves: EquityCurveSeries[];
  height?: number;
  className?: string;
  /** Normalize each series to 100 at first point (indexed performance) */
  normalize?: boolean;
}

function toChartData(
  points: EquityPoint[],
  normalize: boolean,
): { time: Time; value: number }[] {
  if (points.length === 0) return [];
  const base = points[0].equity || 1;
  return bumpDuplicateTimes(
    points.map((p) => ({
      time: p.time as Time,
      value: normalize ? (p.equity / base) * 100 : p.equity,
    })),
  );
}

export function OverlaidEquityCurves({
  curves,
  height = 260,
  className,
  normalize = true,
}: OverlaidEquityCurvesProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!containerRef.current || curves.length === 0) return;

    const chart: IChartApi = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "rgba(255, 255, 255, 0.5)",
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.06)" },
        horzLines: { color: "rgba(255, 255, 255, 0.06)" },
      },
      rightPriceScale: {
        borderColor: "rgba(255, 255, 255, 0.08)",
      },
      timeScale: {
        borderColor: "rgba(255, 255, 255, 0.08)",
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const seriesList: ISeriesApi<"Line">[] = [];
    curves.forEach((c) => {
      const line = chart.addSeries(LineSeries, {
        color: c.color,
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: true,
        title: c.label,
      });
      line.setData(toChartData(c.points, normalize));
      seriesList.push(line);
    });

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [curves, normalize]);

  if (curves.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Select completed backtests with equity data to compare.
      </p>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Indexed equity (overlay)
      </h4>
      <div className="flex flex-wrap gap-3 text-[10px]">
        {curves.map((c) => (
          <span key={c.id} className="flex items-center gap-1.5">
            <span
              className="size-2 rounded-full shrink-0"
              style={{ backgroundColor: c.color }}
            />
            <span className="text-muted-foreground">{c.label}</span>
          </span>
        ))}
      </div>
      <div ref={containerRef} style={{ height, width: "100%" }} />
    </div>
  );
}
