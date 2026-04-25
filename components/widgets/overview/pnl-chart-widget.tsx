"use client";

import { LiveBatchComparison, type ViewMode } from "@/components/trading/live-batch-comparison";
import { StatusDot } from "@/components/shared/status-badge";
import { type ValueFormat, useValueFormat } from "@/components/trading/value-format-toggle";
import { DateRangePicker } from "@/components/shared/date-range-picker";
import { generateMonthlyTimeSeries, MONTHLY_TS_START } from "@/lib/mocks/fixtures/trading-data";
import type { TimeSeriesPoint } from "@/lib/mocks/fixtures/trading-data";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/shared/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGlobalScope } from "@/lib/stores/global-scope-store";
import { cn } from "@/lib/utils";
import { formatPercent } from "@/lib/utils/formatters";
import { ArrowLeftRight, Database, DollarSign, Minus, Percent, Radio, SplitSquareVertical } from "lucide-react";
import * as React from "react";
import type { WidgetComponentProps } from "../widget-registry";
import { useOverviewDataSafe } from "./overview-data-context";

type MetricKey = "pnl" | "nav" | "exposure";

const METRIC_TITLES: Record<MetricKey, string> = {
  pnl: "Cumulative P&L",
  nav: "Net Asset Value",
  exposure: "Net Exposure",
};

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function filterToRange(pts: TimeSeriesPoint[], from: string, to: string): TimeSeriesPoint[] {
  // Timestamps are "MM/DD HH:mm"; extract "MM/DD" and compare to the date's "MM/DD".
  const fromMD = from.slice(5).replace("-", "/"); // "2026-03-20" → "03/20"
  const toMD = to.slice(5).replace("-", "/");
  return pts.filter((p) => {
    const md = p.timestamp.slice(0, 5);
    return md >= fromMD && md <= toMD;
  });
}

// Radix ScrollArea wraps Viewport content in display:table, which breaks
// height propagation through flex/h-full. Walk up to the ScrollArea Root
// (data-slot="widget-scroll") for the extrinsic height and observe the actual
// header row to subtract its real height — needed because the legend wraps to
// a second line on narrow widgets and a fixed-px chrome estimate either
// over-clips the chart or overflows and produces a vertical scrollbar.
//
// Returns a chart ref + header ref + computed chart height in pixels.
const PADDING_PX = 32 + 16; // pt-5 + pb-3 + gap-4
function useChartPixelHeight(): {
  chartRef: (node: HTMLDivElement | null) => void;
  headerRef: (node: HTMLDivElement | null) => void;
  chartHeight: number;
} {
  const [rootHeight, setRootHeight] = React.useState(0);
  const [headerHeight, setHeaderHeight] = React.useState(0);
  const rootCleanupRef = React.useRef<(() => void) | null>(null);
  const headerCleanupRef = React.useRef<(() => void) | null>(null);

  const chartRef = React.useCallback((node: HTMLDivElement | null) => {
    rootCleanupRef.current?.();
    rootCleanupRef.current = null;
    if (!node) return;
    let root: HTMLElement | null = node.parentElement;
    while (root && root.dataset.slot !== "widget-scroll") {
      root = root.parentElement;
    }
    if (!root) return;
    const target = root;
    const measure = () => {
      const h = target.getBoundingClientRect().height;
      if (h > 0) setRootHeight(h);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(target);
    rootCleanupRef.current = () => ro.disconnect();
  }, []);

  const headerRef = React.useCallback((node: HTMLDivElement | null) => {
    headerCleanupRef.current?.();
    headerCleanupRef.current = null;
    if (!node) return;
    const measure = () => {
      const h = node.getBoundingClientRect().height;
      if (h > 0) setHeaderHeight(h);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    headerCleanupRef.current = () => ro.disconnect();
  }, []);

  // Subtract a couple of extra px so the chart never quite fills the viewport
  // — keeps the parent ScrollArea from showing a 1-2px sliver of vertical scroll.
  const chartHeight = Math.max(rootHeight - headerHeight - PADDING_PX - 4, 120);
  return { chartRef, headerRef, chartHeight };
}

export function PnLChartWidget(_props: WidgetComponentProps) {
  const ctx = useOverviewDataSafe();
  const { scope: context } = useGlobalScope();
  const today = getToday();
  const [dateRange, setDateRange] = React.useState({ from: MONTHLY_TS_START, to: today });
  const [activeTab, setActiveTab] = React.useState<MetricKey>("pnl");
  const [viewMode, setViewMode] = React.useState<ViewMode>("split");
  const { format: valueFormat, setFormat: setValueFormat } = useValueFormat("dollar");
  const { chartRef, headerRef, chartHeight } = useChartPixelHeight();

  const { timeseriesLoading, liveBatchLoading, formatCurrency } = ctx || {
    timeseriesLoading: false,
    liveBatchLoading: false,
    formatCurrency: (v: number) => v.toString(),
  };

  // Generate full walks up to the range end, then slice to the selected window.
  const monthlyLive = React.useMemo(() => generateMonthlyTimeSeries(dateRange.to, "live"), [dateRange.to]);
  const monthlyBatch = React.useMemo(() => generateMonthlyTimeSeries(dateRange.to, "batch"), [dateRange.to]);

  const liveByMetric = React.useMemo(
    () => ({
      pnl: filterToRange(monthlyLive.pnl, dateRange.from, dateRange.to),
      nav: filterToRange(monthlyLive.nav, dateRange.from, dateRange.to),
      exposure: filterToRange(monthlyLive.exposure, dateRange.from, dateRange.to),
    }),
    [monthlyLive, dateRange.from, dateRange.to],
  );
  const batchByMetric = React.useMemo(
    () => ({
      pnl: filterToRange(monthlyBatch.pnl, dateRange.from, dateRange.to),
      nav: filterToRange(monthlyBatch.nav, dateRange.from, dateRange.to),
      exposure: filterToRange(monthlyBatch.exposure, dateRange.from, dateRange.to),
    }),
    [monthlyBatch, dateRange.from, dateRange.to],
  );

  const hasData = liveByMetric.pnl.length > 0;

  const liveData = liveByMetric[activeTab];
  const batchData = batchByMetric[activeTab];
  const latestLive = liveData[liveData.length - 1]?.value ?? 0;
  const latestBatch = batchData[batchData.length - 1]?.value ?? 0;
  const latestDelta = latestLive - latestBatch;
  const deltaPercent = latestBatch !== 0 ? (latestDelta / Math.abs(latestBatch)) * 100 : 0;

  // Per-metric percent semantics:
  //   P&L      → value / startingNAV * 100         (cumulative return on capital)
  //   NAV      → (value - firstNAV) / firstNAV * 100      (% change since start)
  //   Exposure → (value - firstExposure) / firstExposure * 100  (% change since start)
  // Keeps each chart visually meaningful: P&L starts ≈0% and grows, NAV/Exposure
  // open at 0% and trend up/down, instead of the previous one-size-fits-all
  // (v / totalNav) which made NAV a flat ~100% line.
  const startingNav = monthlyLive.nav[0]?.value ?? monthlyBatch.nav[0]?.value ?? 0;
  const percentBaseline = activeTab === "pnl" ? startingNav : (liveData[0]?.value ?? batchData[0]?.value ?? 0);

  const formatChart = React.useCallback(
    (v: number) => {
      if (valueFormat === "dollar") return formatCurrency(v);
      if (!percentBaseline) return "0.00%";
      const pct = activeTab === "pnl" ? (v / percentBaseline) * 100 : ((v - percentBaseline) / percentBaseline) * 100;
      return `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;
    },
    [valueFormat, formatCurrency, percentBaseline, activeTab],
  );

  // Delta in percent mode is a *difference*, not a level — format as a linear
  // fraction of the baseline regardless of the per-metric semantics above.
  const formatDelta = React.useCallback(
    (delta: number) => {
      if (valueFormat === "dollar") return formatCurrency(delta);
      if (!percentBaseline) return "0.00%";
      const pct = (delta / percentBaseline) * 100;
      return `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;
    },
    [valueFormat, formatCurrency, percentBaseline],
  );

  if (!ctx)
    return (
      <div className="flex h-full items-center justify-center p-3 text-xs text-muted-foreground">
        Navigate to Overview tab
      </div>
    );

  if (!timeseriesLoading && !liveBatchLoading && !hasData) {
    return (
      <div className="flex h-full items-center justify-center p-3 text-xs text-muted-foreground">
        No time series data available for the selected scope.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col px-3 pt-5 pb-3 gap-4 overflow-hidden">
      <div ref={headerRef} className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <h3 className="text-base font-semibold">{METRIC_TITLES[activeTab]}</h3>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <StatusDot status="live" className="size-2" />
              <span className="text-muted-foreground">Live</span>
              <span className="font-medium">{formatChart(latestLive)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <StatusDot status="batch" className="size-2" />
              <span className="text-muted-foreground">Batch</span>
              <span className="font-medium">{formatChart(latestBatch)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ArrowLeftRight className="size-3 text-muted-foreground" />
              <span className="text-muted-foreground">Delta</span>
              <span
                className={cn(
                  "font-medium",
                  latestDelta >= 0 ? "text-[var(--pnl-positive)]" : "text-[var(--pnl-negative)]",
                )}
              >
                {latestDelta >= 0 ? "+" : ""}
                {formatDelta(latestDelta)}
                <span className="text-muted-foreground ml-1">
                  ({deltaPercent >= 0 ? "+" : ""}
                  {formatPercent(deltaPercent, 1)})
                </span>
              </span>
            </div>
          </div>
          <Badge variant="outline" className="text-micro">
            {context.mode === "live" ? (
              <span className="flex items-center gap-1">
                <Radio className="size-2.5 animate-pulse text-[var(--status-live)]" />
                Live
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Database className="size-2.5" />
                Batch ({context.asOfDatetime?.split("T")[0]})
              </span>
            )}
          </Badge>
          {(timeseriesLoading || liveBatchLoading) && <Spinner size="sm" className="size-3.5 text-muted-foreground" />}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MetricKey)}>
            <TabsList className="h-8">
              <TabsTrigger value="pnl">P&L</TabsTrigger>
              <TabsTrigger value="nav">NAV</TabsTrigger>
              <TabsTrigger value="exposure">Exposure</TabsTrigger>
            </TabsList>
          </Tabs>
          <Tabs value={valueFormat} onValueChange={(v) => setValueFormat(v as ValueFormat)}>
            <TabsList className="h-8">
              <TabsTrigger value="dollar" className="gap-1">
                <DollarSign className="size-3" />
              </TabsTrigger>
              <TabsTrigger value="percent" className="gap-1">
                <Percent className="size-3" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <TabsList className="h-8">
              <TabsTrigger
                value="live"
                className="gap-1"
                style={
                  viewMode === "live"
                    ? {
                        backgroundColor: "color-mix(in oklab, var(--status-live) 15%, transparent)",
                        color: "var(--status-live)",
                      }
                    : undefined
                }
              >
                <Radio className="size-3" />
                Live
              </TabsTrigger>
              <TabsTrigger
                value="batch"
                className="gap-1"
                style={
                  viewMode === "batch"
                    ? {
                        backgroundColor: "color-mix(in oklab, var(--primary) 15%, transparent)",
                        color: "var(--primary)",
                      }
                    : undefined
                }
              >
                <Database className="size-3" />
                Batch
              </TabsTrigger>
              <TabsTrigger
                value="split"
                className="gap-1"
                style={
                  viewMode === "split"
                    ? {
                        backgroundColor: "color-mix(in oklab, var(--chart-5) 15%, transparent)",
                        color: "var(--chart-5)",
                      }
                    : undefined
                }
              >
                <SplitSquareVertical className="size-3" />
                Split
              </TabsTrigger>
              <TabsTrigger
                value="delta"
                className="gap-1"
                style={
                  viewMode === "delta"
                    ? {
                        backgroundColor: "color-mix(in oklab, var(--pnl-negative) 15%, transparent)",
                        color: "var(--pnl-negative)",
                      }
                    : undefined
                }
              >
                <Minus className="size-3" />
                Delta
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <DateRangePicker
            from={dateRange.from}
            to={dateRange.to}
            minDate={MONTHLY_TS_START}
            maxDate={today}
            onChange={(from, to) => setDateRange({ from, to })}
          />
        </div>
      </div>

      <div ref={chartRef} style={{ height: chartHeight }} className="w-full">
        <LiveBatchComparison
          liveData={liveData}
          batchData={batchData}
          valueFormatter={formatChart}
          viewMode={viewMode}
          height={chartHeight}
          animationId={activeTab}
        />
      </div>
    </div>
  );
}
