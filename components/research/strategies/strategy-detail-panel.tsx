"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { BacktestRun, StrategySignal, SignalQualityMetrics } from "@/lib/types/strategy-platform";
import type { BacktestAnalytics } from "@/lib/types/backtest-analytics";
import {
  BACKTEST_ANALYTICS,
  BACKTEST_SIGNALS,
  BACKTEST_SIGNAL_QUALITY,
  computeFullConfluenceAllStrategies,
  computeSignalOverlap,
  generateSyntheticPriceSeries,
} from "@/lib/mocks/fixtures/strategy-platform";
import { cn } from "@/lib/utils";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";
import { ChevronLeft, GitCompare, Star, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { KpiBar } from "@/components/research/kpi-bar";
import { EquityChartWithLayers } from "@/components/research/equity-chart-with-layers";
import { PerformanceSection } from "@/components/research/performance-section";
import { TradesAnalysisSection } from "@/components/research/trades-analysis-section";
import { CapitalEfficiencySection } from "@/components/research/capital-efficiency-section";
import { RunupsDrawdownsSection } from "@/components/research/runups-drawdowns-section";
import { MonthlyReturnsHeatmap } from "@/components/research/monthly-returns-heatmap";
import { SignalConfidenceHistogram } from "@/components/research/signal-confidence-histogram";
import { RegimePerformanceMini } from "@/components/research/regime-performance-mini";
import { OverlaidEquityCurves, type EquityCurveSeries } from "@/components/research/overlaid-equity-curves";
import { SignalOverlayChart } from "@/components/research/signal-overlay-chart";
import { SignalOverlapPanel } from "@/components/research/signal-overlap-panel";

import { SignalListView } from "./strategy-list-panel";
import { WidgetScroll } from "@/components/shared/widget-scroll";

// ─── Detail Panel ─────────────────────────────────────────────────────────────

export function DetailPanel({
  bt,
  analytics,
  signals,
  quality,
  onClose,
}: {
  bt: BacktestRun;
  analytics: BacktestAnalytics;
  signals: StrategySignal[];
  quality: SignalQualityMetrics;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [viewMode, setViewMode] = React.useState<"metrics" | "signals">("metrics");
  const perf = analytics.performance_by_direction;

  const executionHandoffHref = `/services/research/execution?from=strategies&strategyBacktestId=${encodeURIComponent(bt.id)}`;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b">
        <Button variant="ghost" size="sm" className="size-7 p-0" onClick={onClose}>
          <ChevronLeft className="size-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold truncate">{bt.configName ?? bt.templateName ?? bt.id}</h3>
          <p className="text-xs text-muted-foreground">
            {bt.instrument} · {bt.venue} · {bt.dateWindow.start} → {bt.dateWindow.end}
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1 text-xs h-7" asChild>
          <Link href={executionHandoffHref}>
            <Zap className="size-3" />
            Send to Execution
          </Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1 text-xs h-7"
          onClick={() =>
            toast({
              title: "Marked as candidate (demo)",
              description: `${bt.configName ?? bt.id}: full lineage capture when the promote API is available.`,
            })
          }
        >
          <Star className="size-3" />
          Candidate
        </Button>
      </div>

      {/* KPI Bar (pinned) */}
      <KpiBar items={analytics.kpi} className="mx-4 mt-3 rounded-lg" />

      {/* View Toggle */}
      <div className="flex items-center gap-1 px-4 mt-3">
        <Button
          variant={viewMode === "metrics" ? "default" : "ghost"}
          size="sm"
          className="text-xs h-7"
          onClick={() => setViewMode("metrics")}
        >
          Metrics
        </Button>
        <Button
          variant={viewMode === "signals" ? "default" : "ghost"}
          size="sm"
          className="text-xs h-7"
          onClick={() => setViewMode("signals")}
        >
          List of Signals ({signals.length})
        </Button>
      </div>

      {/* Content */}
      <WidgetScroll className="flex-1" viewportClassName="px-4 pb-6 mt-3">
        {viewMode === "signals" ? (
          <SignalListView signals={signals} />
        ) : (
          <div className="space-y-3">
            {/* Equity Chart */}
            <EquityChartWithLayers
              equityCurve={analytics.equity_curve}
              tradeMarkers={analytics.trade_markers}
              height={280}
            />

            {/* Accordion Sections */}
            <Accordion type="multiple" defaultValue={["performance", "signals-analysis"]} className="space-y-1">
              {/* Performance */}
              <AccordionItem value="performance" className="border rounded-lg px-3">
                <AccordionTrigger className="text-xs font-semibold uppercase tracking-wider">
                  Performance
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-6">
                    <PerformanceSection
                      all={perf.all}
                      long={perf.long}
                      short={perf.short}
                      benchmark={analytics.benchmark}
                    />
                    <MonthlyReturnsHeatmap monthlyReturns={analytics.monthly_returns} />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Signals Analysis */}
              <AccordionItem value="signals-analysis" className="border rounded-lg px-3">
                <AccordionTrigger className="text-xs font-semibold uppercase tracking-wider">
                  Signals Analysis
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-5">
                    <TradesAnalysisSection
                      all={perf.all}
                      long={perf.long}
                      short={perf.short}
                      pnlBuckets={analytics.pnl_distribution}
                      avgProfitPct={analytics.avg_profit_pct}
                      avgLossPct={analytics.avg_loss_pct}
                      signalMode
                    />
                    <SignalConfidenceHistogram
                      distribution={quality.confidence_distribution}
                      highConfidenceHitRate={quality.high_confidence_hit_rate}
                      overallHitRate={quality.hit_rate}
                    />
                    <RegimePerformanceMini regimeSharpe={quality.regime_sharpe} />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Capital Efficiency */}
              <AccordionItem value="capital-efficiency" className="border rounded-lg px-3">
                <AccordionTrigger className="text-xs font-semibold uppercase tracking-wider">
                  Capital Efficiency
                </AccordionTrigger>
                <AccordionContent>
                  <CapitalEfficiencySection data={analytics.capital_efficiency} />
                </AccordionContent>
              </AccordionItem>

              {/* Run-ups & Drawdowns */}
              <AccordionItem value="runups-drawdowns" className="border rounded-lg px-3">
                <AccordionTrigger className="text-xs font-semibold uppercase tracking-wider">
                  Run-ups & Drawdowns
                </AccordionTrigger>
                <AccordionContent>
                  <RunupsDrawdownsSection data={analytics.runup_drawdown} />
                </AccordionContent>
              </AccordionItem>

              {/* Configuration */}
              <AccordionItem value="configuration" className="border rounded-lg px-3">
                <AccordionTrigger className="text-xs font-semibold uppercase tracking-wider">
                  Configuration
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg border bg-muted/20 p-2.5">
                        <span className="text-muted-foreground block text-[10px]">Config Version</span>
                        <span className="font-mono">{bt.configVersion}</span>
                      </div>
                      <div className="rounded-lg border bg-muted/20 p-2.5">
                        <span className="text-muted-foreground block text-[10px]">Code Commit</span>
                        <span className="font-mono">{bt.codeCommitHash}</span>
                      </div>
                      <div className="rounded-lg border bg-muted/20 p-2.5">
                        <span className="text-muted-foreground block text-[10px]">Data Source</span>
                        <span className="font-mono">{bt.dataSource}</span>
                      </div>
                      <div className="rounded-lg border bg-muted/20 p-2.5">
                        <span className="text-muted-foreground block text-[10px]">As-of Date</span>
                        <span className="font-mono">{bt.asOfDate}</span>
                      </div>
                      <div className="rounded-lg border bg-muted/20 p-2.5">
                        <span className="text-muted-foreground block text-[10px]">Testing Stage</span>
                        <span className="font-mono">{bt.testingStage}</span>
                      </div>
                      <div className="rounded-lg border bg-muted/20 p-2.5">
                        <span className="text-muted-foreground block text-[10px]">Duration</span>
                        <span className="font-mono">
                          {bt.durationMs ? `${formatNumber(bt.durationMs / 60000, 1)}m` : "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}
      </WidgetScroll>
    </div>
  );
}

// ─── Compare Panel ────────────────────────────────────────────────────────────

const COMPARE_COLORS = ["#22c55e", "#3b82f6", "#f97316"];

export function ComparePanel({
  selected,
  backtests,
  onClose,
}: {
  selected: string[];
  backtests: BacktestRun[];
  onClose: () => void;
}) {
  const items = backtests.filter((b) => selected.includes(b.id)).slice(0, 3);
  if (items.length < 2) return null;

  const METRICS = [
    { key: "sharpe", label: "Sharpe Ratio", good: "high" as const },
    { key: "sortino", label: "Sortino Ratio", good: "high" as const },
    {
      key: "totalReturn",
      label: "Total Return",
      good: "high" as const,
      pct: true,
    },
    {
      key: "maxDrawdown",
      label: "Max Drawdown",
      good: "low" as const,
      pct: true,
    },
    { key: "hitRate", label: "Win Rate", good: "high" as const, pct: true },
    { key: "profitFactor", label: "Profit Factor", good: "high" as const },
    { key: "alpha", label: "Alpha", good: "high" as const, pct: true },
  ];

  const equityCurves: EquityCurveSeries[] = items
    .map((b, i) => {
      const a = BACKTEST_ANALYTICS[b.id];
      if (!a?.equity_curve?.length) return null;
      return {
        id: b.id,
        label: b.configName ?? b.templateName ?? b.id,
        color: COMPARE_COLORS[i % COMPARE_COLORS.length],
        points: a.equity_curve,
      };
    })
    .filter((x): x is EquityCurveSeries => x !== null);

  const overlayStrategies = items.map((b, i) => ({
    id: b.id,
    label: b.configName ?? b.templateName ?? b.id,
    color: COMPARE_COLORS[i % COMPARE_COLORS.length],
    signals: BACKTEST_SIGNALS[b.id] ?? [],
  }));

  const priceSeed = items.reduce((acc, b) => acc + b.id.charCodeAt(0), 0) + (items[0]?.instrument?.length ?? 0);
  const priceSeries = generateSyntheticPriceSeries(priceSeed, 720, 65200);

  const overlapPairs: { a: BacktestRun; b: BacktestRun; pct: number }[] = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const ia = items[i];
      const ib = items[j];
      const sigA = BACKTEST_SIGNALS[ia.id] ?? [];
      const sigB = BACKTEST_SIGNALS[ib.id] ?? [];
      const om = computeSignalOverlap(ia.id, ib.id, sigA, sigB);
      overlapPairs.push({ a: ia, b: ib, pct: om.overlap_pct });
    }
  }

  const firstOverlap =
    items.length >= 2
      ? computeSignalOverlap(
          items[0].id,
          items[1].id,
          BACKTEST_SIGNALS[items[0].id] ?? [],
          BACKTEST_SIGNALS[items[1].id] ?? [],
        )
      : null;

  const fullConfluence = computeFullConfluenceAllStrategies(
    items.map((b) => ({
      id: b.id,
      signals: BACKTEST_SIGNALS[b.id] ?? [],
    })),
  );

  const bestBySharpe = items.reduce((best, b) => {
    const sh = b.metrics?.sharpe ?? -Infinity;
    const prev = best?.metrics?.sharpe ?? -Infinity;
    return sh >= prev ? b : best;
  }, items[0]);

  const compareExecutionHref = `/services/research/execution?from=strategies&strategyBacktestIds=${items.map((b) => encodeURIComponent(b.id)).join(",")}&strategyBacktestId=${encodeURIComponent(bestBySharpe.id)}`;

  const SIGNAL_METRICS: {
    label: string;
    get: (b: BacktestRun) => number;
    fmt: (n: number) => string;
    good: "high" | "low";
  }[] = [
    {
      label: "Signals / day",
      get: (b) => BACKTEST_SIGNAL_QUALITY[b.id]?.signals_per_day ?? 0,
      fmt: (n) => formatNumber(n, 2),
      good: "high",
    },
    {
      label: "Hit rate",
      get: (b) => BACKTEST_SIGNAL_QUALITY[b.id]?.hit_rate ?? 0,
      fmt: (n) => formatPercent(n * 100, 1),
      good: "high",
    },
    {
      label: "Avg confidence",
      get: (b) => BACKTEST_SIGNAL_QUALITY[b.id]?.avg_confidence ?? 0,
      fmt: (n) => formatNumber(n, 2),
      good: "high",
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <GitCompare className="size-4 text-primary" />
          Comparing {items.length} Backtests
        </h3>
        <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
          Clear
        </Button>
      </div>

      <WidgetScroll className="flex-1" viewportClassName="p-4 space-y-6">
        {equityCurves.length >= 2 && <OverlaidEquityCurves curves={equityCurves} height={260} normalize />}

        <SignalOverlayChart
          priceSeries={priceSeries}
          strategies={overlayStrategies}
          height={260}
          subtitle={`Synthetic ${items[0]?.instrument ?? "price"} path with signal markers`}
        />

        {overlapPairs.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {overlapPairs.map((p) => (
              <div
                key={`${p.a.id}-${p.b.id}`}
                className="rounded-lg border border-border/50 bg-muted/10 px-2 py-2 text-center"
              >
                <p className="text-[10px] text-muted-foreground truncate">
                  {p.a.configName ?? p.a.id.slice(0, 8)} vs {p.b.configName ?? p.b.id.slice(0, 8)}
                </p>
                <p className="text-lg font-bold tabular-nums text-primary">{p.pct}%</p>
                <p className="text-[10px] text-muted-foreground">overlap</p>
              </div>
            ))}
          </div>
        )}

        {firstOverlap && items.length >= 2 && (
          <SignalOverlapPanel
            metrics={firstOverlap}
            labelA={items[0].configName ?? items[0].id}
            labelB={items[1].configName ?? items[1].id}
          />
        )}

        {fullConfluence.anchor > 0 && fullConfluence.all_agree_pct >= 25 && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2.5 text-sm">
            <p className="font-medium text-emerald-400">Full confluence</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatNumber(fullConfluence.all_agree_pct, 1)}% of directional signals in{" "}
              <span className="text-foreground font-medium">{items[0].configName ?? items[0].id}</span> align with every
              other strategy (same instrument & direction within 48h).
            </p>
          </div>
        )}

        <WidgetScroll axes="horizontal" scrollbarSize="thin">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left text-xs text-muted-foreground font-medium pb-2 w-32">Metric</th>
                {items.map((b) => (
                  <th key={b.id} className="text-right text-xs font-medium pb-2 px-3 max-w-[140px]">
                    <div className="truncate">{b.configName ?? b.id}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SIGNAL_METRICS.map((row) => {
                const values = items.map((b) => row.get(b));
                const best = row.good === "high" ? Math.max(...values) : Math.min(...values);
                return (
                  <tr key={row.label} className="border-t border-border/40">
                    <td className="text-xs text-muted-foreground py-2">{row.label}</td>
                    {items.map((b, i) => {
                      const val = values[i];
                      const isBest = val === best && values.some((v) => v !== 0);
                      return (
                        <td key={b.id} className="text-right py-2 px-3">
                          <span
                            className={cn(
                              "font-mono text-sm font-medium tabular-nums",
                              isBest ? "text-emerald-400" : "",
                            )}
                          >
                            {row.fmt(val)}
                            {isBest && " ★"}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              {METRICS.map((metric) => {
                const values = items.map((b) => (b.metrics as unknown as Record<string, number>)?.[metric.key] ?? 0);
                const best = metric.good === "high" ? Math.max(...values) : Math.min(...values);
                return (
                  <tr key={metric.key} className="border-t border-border/40">
                    <td className="text-xs text-muted-foreground py-2">{metric.label}</td>
                    {items.map((b, i) => {
                      const val = values[i];
                      const isBest = val === best;
                      const display = metric.pct ? formatPercent(val * 100, 1) : formatNumber(val, 2);
                      return (
                        <td key={b.id} className="text-right py-2 px-3">
                          <span
                            className={cn(
                              "font-mono text-sm font-medium tabular-nums",
                              isBest ? "text-emerald-400" : "",
                            )}
                          >
                            {display}
                            {isBest && " ★"}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </WidgetScroll>

        <Button variant="outline" size="sm" className="w-full gap-1 text-xs" asChild>
          <Link href={compareExecutionHref}>
            <Zap className="size-3" />
            Send best ({bestBySharpe.configName ?? bestBySharpe.id.slice(0, 8)}) to Execution
          </Link>
        </Button>
      </WidgetScroll>
    </div>
  );
}
