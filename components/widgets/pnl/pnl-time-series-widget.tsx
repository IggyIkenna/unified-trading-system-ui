"use client";

import * as React from "react";
import { PnLValue } from "@/components/trading/pnl-value";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { PNL_FACTOR_CHART_COLORS } from "@/lib/config/services/pnl.config";
import { Button } from "@/components/ui/button";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { usePnLData } from "./pnl-data-context";
import { formatNumber } from "@/lib/utils/formatters";
import { Layers, GitCompare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// ---------------------------------------------------------------------------
// Why percentage heights break inside WidgetScroll
// ---------------------------------------------------------------------------
// WidgetBody wraps every widget in a Radix ScrollArea (WidgetScroll).
// Radix's ScrollArea Viewport inserts an intermediate <div style="display:table">
// around children. CSS height:100% inside a display:table resolves to "auto"
// (content height), so flex-1 / h-full / height="100%" on ResponsiveContainer
// all produce 0px.
//
// Fix: walk up the DOM from a ref inside the widget to the ScrollArea Root
// (data-slot="widget-scroll"), which sits ABOVE the display:table wrapper and
// has the correct pixel height assigned by the grid. Observe that element with
// ResizeObserver and subtract the known chrome height to get the chart height.
// ---------------------------------------------------------------------------

/**
 * Walks up the DOM from `startEl` to find the nearest ancestor matching
 * `data-slot="widget-scroll"` (the Radix ScrollArea Root), observes its
 * height with a ResizeObserver, and returns (height - substractPx).
 *
 * Falls back to `fallback` until the first measurement fires.
 */
function useWidgetChartHeight(substractPx: number, fallback = 200): [React.RefObject<HTMLDivElement | null>, number] {
  const ref = React.useRef<HTMLDivElement>(null);
  const [height, setHeight] = React.useState(fallback);

  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Walk up to the WidgetScroll Root ([data-slot="widget-scroll"])
    let root: HTMLElement | null = el.parentElement;
    while (root && (root as HTMLElement).dataset.slot !== "widget-scroll") {
      root = root.parentElement;
    }
    if (!root) return;

    const measure = () => {
      const h = (root as HTMLElement).getBoundingClientRect().height;
      if (h > 0) setHeight(Math.max(h - substractPx, 80));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    return () => ro.disconnect();
  }, [substractPx]);

  return [ref, height];
}

// ---------------------------------------------------------------------------
// Chrome heights (px) subtracted from the scroll root to get chart height.
//
// WidgetWrapper chrome header (drag handle strip): ~26px
// PnlTimeSeriesWidget:
//   p-2 top+bottom = 16  |  header row = 32  |  gap-2 × 3 = 24
//   chips row = 22        |  footer text = 16
//   Total non-chart = 110px  →  use 115 for safety
//
// Backtest overlay (no chips row):
//   p-2 = 16  |  header row = 32  |  gap-2 × 2 = 16  |  footer = 16  |  gap-1 = 4
//   Total = 84px  →  use 90 for safety
// ---------------------------------------------------------------------------
const FACTORS_CHROME_PX = 115;
const BACKTEST_CHROME_PX = 90;

// ---------------------------------------------------------------------------
// Factor metadata — order: positive drivers first, then costs
// ---------------------------------------------------------------------------

const FACTORS: Array<{ key: string; label: string; isNegative: boolean }> = [
  { key: "Funding", label: "Funding", isNegative: false },
  { key: "Carry", label: "Carry", isNegative: false },
  { key: "Basis", label: "Basis", isNegative: false },
  { key: "Delta", label: "Delta", isNegative: false },
  { key: "Gamma", label: "Gamma", isNegative: false },
  { key: "Rebates", label: "Rebates", isNegative: false },
  { key: "Slippage", label: "Slippage", isNegative: true },
  { key: "Fees", label: "Fees", isNegative: true },
  { key: "Theta", label: "Theta", isNegative: true },
  { key: "Vega", label: "Vega", isNegative: true },
];

// ---------------------------------------------------------------------------
// Multi-line factor chart
// ---------------------------------------------------------------------------

function FactorLinesChart({ data }: { data: Array<Record<string, number | string>> }) {
  const C = PNL_FACTOR_CHART_COLORS;
  const [hidden, setHidden] = React.useState<Set<string>>(new Set());
  const [anchorRef, chartHeight] = useWidgetChartHeight(FACTORS_CHROME_PX);

  function toggleFactor(key: string) {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div ref={anchorRef} className="flex flex-col gap-2 flex-1">
      {/* Factor toggle chips */}
      <div className="flex flex-wrap gap-1 shrink-0">
        {FACTORS.map((f) => {
          const isHidden = hidden.has(f.key);
          return (
            <button
              key={f.key}
              onClick={() => toggleFactor(f.key)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-micro font-medium border transition-opacity ${
                isHidden ? "opacity-30" : "opacity-100"
              }`}
              style={{
                borderColor: C[f.key],
                color: isHidden ? "var(--muted-foreground)" : C[f.key],
                backgroundColor: isHidden ? "transparent" : `${C[f.key]}18`,
              }}
            >
              <span className="inline-block size-1.5 rounded-full" style={{ backgroundColor: C[f.key] }} />
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Pixel height from ResizeObserver on the ScrollArea Root */}
      <ResponsiveContainer width="100%" height={chartHeight}>
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
          <XAxis dataKey="time" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} interval="preserveStartEnd" />
          <YAxis
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            tickFormatter={(v: number) => `$${formatNumber(v / 1000, 0)}k`}
            width={58}
          />
          <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeWidth={1} strokeDasharray="4 2" />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              fontSize: "11px",
            }}
            formatter={(value: number, name: string) => [`${value >= 0 ? "+" : ""}$${value.toLocaleString()}`, name]}
          />
          {FACTORS.map((f) => (
            <Line
              key={f.key}
              type="monotone"
              dataKey={f.key}
              stroke={C[f.key]}
              strokeWidth={f.isNegative ? 1.5 : 2}
              dot={false}
              strokeDasharray={f.isNegative ? "4 2" : undefined}
              hide={hidden.has(f.key)}
              activeDot={{ r: 3, strokeWidth: 0 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      <p className="text-micro text-muted-foreground shrink-0">
        Cumulative P&L per factor · solid = positive drivers · dashed = cost factors · click chip to hide
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Backtest vs Live chart
// ---------------------------------------------------------------------------

function BacktestVsLiveChart({ data }: { data: Array<Record<string, number | string>> }) {
  const [anchorRef, chartHeight] = useWidgetChartHeight(BACKTEST_CHROME_PX);

  return (
    <div ref={anchorRef} className="flex-1">
      <ResponsiveContainer width="100%" height={chartHeight}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
          <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickFormatter={(v: number) => `$${formatNumber(v / 1000, 0)}k`}
            width={70}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name]}
          />
          <Legend wrapperStyle={{ fontSize: "11px" }} iconSize={10} />
          <Line
            type="monotone"
            dataKey="backtest"
            stroke="var(--chart-1)"
            strokeWidth={2}
            dot={false}
            name="Backtest"
          />
          <Line type="monotone" dataKey="live" stroke="var(--pnl-positive)" strokeWidth={2} dot={false} name="Live" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Widget root
// ---------------------------------------------------------------------------

export function PnlTimeSeriesWidget(_props: WidgetComponentProps) {
  const { timeSeriesData, timeSeriesNetPnL, backtestVsLive, isLoading } = usePnLData();
  const [overlay, setOverlay] = React.useState<"factors" | "backtest">("factors");

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-2 h-full">
        <div className="flex items-center justify-between shrink-0">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-5 w-28" />
        </div>
        <Skeleton className="flex-1 w-full rounded-lg" />
        <Skeleton className="h-3 w-64 shrink-0" />
      </div>
    );
  }

  if (timeSeriesData.length === 0 && backtestVsLive.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
        No P&L time series data available
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-2 gap-2">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1 p-0.5 bg-muted rounded-lg">
          <Button
            variant={overlay === "factors" ? "secondary" : "ghost"}
            size="sm"
            className="h-6 px-2 gap-1 text-[11px]"
            onClick={() => setOverlay("factors")}
          >
            <Layers className="size-3" />
            Factor Lines
          </Button>
          <Button
            variant={overlay === "backtest" ? "secondary" : "ghost"}
            size="sm"
            className="h-6 px-2 gap-1 text-[11px]"
            onClick={() => setOverlay("backtest")}
          >
            <GitCompare className="size-3" />
            Backtest vs Live
          </Button>
        </div>
        {overlay === "factors" && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Cumulative Net:</span>
            <PnLValue value={timeSeriesNetPnL} size="lg" showSign />
          </div>
        )}
      </div>

      {overlay === "factors" ? (
        <FactorLinesChart data={timeSeriesData} />
      ) : (
        <>
          <BacktestVsLiveChart data={backtestVsLive} />
          <p className="text-micro text-muted-foreground shrink-0">
            Blue = backtest prediction · Green = live result · Shaded gap = tracking error
          </p>
        </>
      )}
    </div>
  );
}
