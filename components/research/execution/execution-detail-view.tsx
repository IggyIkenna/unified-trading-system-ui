"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Play, XCircle, Zap, BarChart3, GitCompare, Star, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatNumber, formatPercent, formatPnl } from "@/lib/utils/formatters";
import { EXECUTION_BACKTESTS, EXECUTION_EQUITY_CURVE, EXECUTION_COMPARE_CURVES } from "@/lib/build-mock-data";
import type { ExecutionBacktest } from "@/lib/build-mock-data";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend,
} from "recharts";
import { useToast } from "@/hooks/use-toast";
import { executionResultsToAnalytics } from "@/lib/execution-analytics-adapter";
import { KpiBar } from "@/components/research/kpi-bar";
import { EquityChartWithLayers } from "@/components/research/equity-chart-with-layers";
import { PerformanceSection } from "@/components/research/performance-section";
import { TradesAnalysisSection } from "@/components/research/trades-analysis-section";
import { CapitalEfficiencySection } from "@/components/research/capital-efficiency-section";
import { RunupsDrawdownsSection } from "@/components/research/runups-drawdowns-section";
import { MonthlyReturnsHeatmap } from "@/components/research/monthly-returns-heatmap";
import {
  MetricCard,
  StatusBadge,
  TOOLTIP_STYLE,
  TICK_STYLE,
  ALGO_COLORS,
  downloadExecutionTradesCsv,
} from "@/components/research/execution/status-helpers";

// ─── Results View ───────────────────────────────────────────────────────────

function ResultsView({
  bt,
  onPromote,
  isCandidate,
}: {
  bt: ExecutionBacktest;
  onPromote: () => void;
  isCandidate: boolean;
}) {
  const { toast } = useToast();
  const r = bt.results!;
  const equityCurve = EXECUTION_COMPARE_CURVES[bt.id] ?? EXECUTION_EQUITY_CURVE;

  const analytics = React.useMemo(() => executionResultsToAnalytics(r, equityCurve), [r, equityCurve]);
  const perf = analytics.performance_by_direction;

  const handleExportTradesCsv = () => {
    downloadExecutionTradesCsv(r.trades, `execution-trades-${bt.id.replace(/[^a-zA-Z0-9_-]/g, "_")}`);
    toast({
      title: "CSV export",
      description: `Downloaded ${r.trades.length} trade row(s) for ${bt.name}.`,
    });
  };

  return (
    <div className="space-y-4">
      {/* KPI Bar */}
      <KpiBar items={analytics.kpi} />

      <Tabs defaultValue="overview" className="space-y-4">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="trades">Trades</TabsTrigger>
            <TabsTrigger value="execution">Execution Quality</TabsTrigger>
            <TabsTrigger value="config">Config</TabsTrigger>
          </TabsList>
          {isCandidate ? (
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-400/30 gap-1">
              <Award className="size-3" /> Candidate
            </Badge>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-amber-400/30 text-amber-400 hover:bg-amber-400/10"
              onClick={onPromote}
            >
              <Award className="size-3.5" />
              Mark as Candidate
            </Button>
          )}
        </div>

        {/* ── Overview ────────────────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-4">
          {/* Equity chart with TV Lightweight Charts */}
          <EquityChartWithLayers
            equityCurve={analytics.equity_curve}
            tradeMarkers={analytics.trade_markers}
            height={280}
          />

          {/* Execution-specific summary */}
          <div className="rounded-lg border border-border/50 p-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {[
              {
                label: "Avg Slippage",
                value: `${formatNumber(r.avg_slippage_bps, 1)} bps`,
                good: r.avg_slippage_bps < 3,
              },
              {
                label: "Fill Rate",
                value: formatPercent(r.fill_rate_pct, 1),
                good: r.fill_rate_pct > 97,
              },
              {
                label: "Total Fees",
                value: `$${r.total_commission.toLocaleString()}`,
              },
              {
                label: "Impl. Shortfall",
                value: `${formatNumber(r.implementation_shortfall_bps, 1)} bps`,
                good: r.implementation_shortfall_bps < 3,
              },
            ].map((m) => (
              <div key={m.label}>
                <p className="text-xs text-muted-foreground">{m.label}</p>
                <p
                  className={cn(
                    "font-bold tabular-nums",
                    m.good === true ? "text-emerald-400" : m.good === false ? "text-red-400" : "",
                  )}
                >
                  {m.value}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard label="Sortino Ratio" value={formatNumber(r.sortino_ratio, 2)} isGood={r.sortino_ratio > 2} />
            <MetricCard label="Profit Factor" value={formatNumber(r.profit_factor, 2)} isGood={r.profit_factor > 1.5} />
            <MetricCard label="Total Trades" value={r.total_trades.toString()} />
            <MetricCard label="Avg Duration" value={`${formatNumber(r.avg_trade_duration_hours, 1)}h`} />
          </div>
        </TabsContent>

        {/* ── Performance (shared components) ─────────────────────────────────── */}
        <TabsContent value="performance" className="space-y-6">
          <PerformanceSection all={perf.all} long={perf.long} short={perf.short} benchmark={analytics.benchmark} />
          <MonthlyReturnsHeatmap monthlyReturns={analytics.monthly_returns} />
          <CapitalEfficiencySection data={analytics.capital_efficiency} />
          <RunupsDrawdownsSection data={analytics.runup_drawdown} />
        </TabsContent>

        {/* ── Trades (shared TradesAnalysis + full log) ───────────────────────── */}
        <TabsContent value="trades" className="space-y-4">
          <TradesAnalysisSection
            all={perf.all}
            long={perf.long}
            short={perf.short}
            pnlBuckets={analytics.pnl_distribution}
            avgProfitPct={analytics.avg_profit_pct}
            avgLossPct={analytics.avg_loss_pct}
          />

          {/* Full trade log */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Showing {r.trades.length} trades · {r.total_trades} total
            </p>
            <Button variant="outline" size="sm" className="text-xs gap-1" type="button" onClick={handleExportTradesCsv}>
              <BarChart3 className="size-3" /> Export CSV
            </Button>
          </div>
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Signal</TableHead>
                    <TableHead>Instrument</TableHead>
                    <TableHead className="text-right">Signal Price</TableHead>
                    <TableHead className="text-right">Fill Price</TableHead>
                    <TableHead className="text-right">Slippage</TableHead>
                    <TableHead className="text-right">Fill Time</TableHead>
                    <TableHead>Venue</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                    <TableHead className="text-right">P&amp;L</TableHead>
                    <TableHead className="text-right">Cum. P&amp;L</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {r.trades.map((t, idx) => (
                    <TableRow key={t.id}>
                      <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="text-xs font-mono">
                        {new Date(t.timestamp).toLocaleString("en-GB", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            t.signal === "LONG"
                              ? "border-emerald-400/30 text-emerald-400"
                              : t.signal === "SHORT"
                                ? "border-red-400/30 text-red-400"
                                : "border-border/50 text-muted-foreground",
                          )}
                        >
                          {t.signal}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{t.instrument}</TableCell>
                      <TableCell className="text-right text-xs tabular-nums font-mono">
                        {t.signal_price.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-xs tabular-nums font-mono">
                        {t.fill_price.toLocaleString()}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right text-xs tabular-nums",
                          t.slippage_bps > 5 ? "text-red-400" : t.slippage_bps < 2 ? "text-emerald-400" : "",
                        )}
                      >
                        {formatNumber(t.slippage_bps, 1)} bps
                      </TableCell>
                      <TableCell className="text-right text-xs tabular-nums">
                        {formatNumber(t.fill_time_ms / 1000, 1)}s
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {t.venue}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs tabular-nums text-muted-foreground">
                        ${t.commission}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right text-xs tabular-nums font-medium",
                          t.pnl === null ? "text-muted-foreground" : t.pnl > 0 ? "text-emerald-400" : "text-red-400",
                        )}
                      >
                        {t.pnl === null ? "—" : formatPnl(t.pnl, "USD", 0)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right text-xs tabular-nums font-mono",
                          t.cumulative_pnl >= 0 ? "text-emerald-400" : "text-red-400",
                        )}
                      >
                        {formatCurrency(t.cumulative_pnl, "USD", 0)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Execution Quality ────────────────────────────────────────────────── */}
        <TabsContent value="execution" className="space-y-4">
          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard
              label="Avg Slippage"
              value={`${formatNumber(r.avg_slippage_bps, 1)} bps`}
              isGood={r.avg_slippage_bps < 3}
            />
            <MetricCard
              label="Avg Fill Time"
              value={`${formatNumber(r.avg_fill_time_seconds, 1)}s`}
              isGood={r.avg_fill_time_seconds < 10}
            />
            <MetricCard label="Fill Rate" value={formatPercent(r.fill_rate_pct, 1)} isGood={r.fill_rate_pct > 97} />
            <MetricCard label="Maker %" value={formatPercent(r.maker_pct, 1)} isGood={r.maker_pct > 50} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard
              label="Total Slippage Cost"
              value={`$${r.total_slippage_cost.toLocaleString()}`}
              isGood={false}
            />
            <MetricCard
              label="Impl. Shortfall"
              value={`${formatNumber(r.implementation_shortfall_bps, 1)} bps`}
              isGood={r.implementation_shortfall_bps < 3}
            />
            <MetricCard label="Commission" value={`$${r.total_commission.toLocaleString()}`} />
            <MetricCard
              label="Partial Fill %"
              value={formatPercent(r.partial_fill_pct, 1)}
              isGood={r.partial_fill_pct < 15}
            />
          </div>

          {/* Slippage distribution */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Slippage Distribution</CardTitle>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>
                    Mean <span className="text-foreground font-medium">{formatNumber(r.slippage_mean_bps, 1)} bps</span>
                  </span>
                  <span>
                    Median{" "}
                    <span className="text-foreground font-medium">{formatNumber(r.slippage_median_bps, 1)} bps</span>
                  </span>
                  <span>
                    P95 <span className="text-foreground font-medium">{formatNumber(r.slippage_p95_bps, 1)} bps</span>
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={r.slippage_distribution} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis dataKey="label" tick={TICK_STYLE} />
                  <YAxis
                    tick={TICK_STYLE}
                    tickFormatter={(v) => `${v}`}
                    label={{
                      value: "Trades",
                      angle: -90,
                      position: "insideLeft",
                      style: TICK_STYLE,
                      offset: 10,
                    }}
                    width={50}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(v, _n, p) => [`${v} trades (${(p.payload as { pct: number }).pct}%)`, "Count"]}
                  />
                  <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                    {r.slippage_distribution.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={
                          entry.label === "0–1 bps"
                            ? "#10b981"
                            : entry.label === "1–3 bps"
                              ? "#22d3ee"
                              : entry.label === "3–5 bps"
                                ? "#f59e0b"
                                : "#ef4444"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Implementation Shortfall decomposition */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Implementation Shortfall Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm font-medium">
                <span>Total shortfall</span>
                <span className="font-mono text-red-400">
                  {formatNumber(r.is_breakdown.total_bps, 1)} bps ($
                  {r.is_breakdown.total_usd.toLocaleString()})
                </span>
              </div>
              {[
                {
                  label: "Delay cost",
                  bps: r.is_breakdown.delay_cost_bps,
                  usd: r.is_breakdown.delay_cost_usd,
                  color: "bg-amber-400",
                },
                {
                  label: "Market impact",
                  bps: r.is_breakdown.market_impact_bps,
                  usd: r.is_breakdown.market_impact_usd,
                  color: "bg-orange-500",
                },
                {
                  label: "Fees",
                  bps: r.is_breakdown.fees_bps,
                  usd: r.is_breakdown.fees_usd,
                  color: "bg-slate-400",
                },
              ].map((item) => {
                const widthPct = (item.bps / r.is_breakdown.total_bps) * 100;
                return (
                  <div key={item.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-mono text-muted-foreground">
                        {formatNumber(item.bps, 1)} bps · ${item.usd.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
                      <div className={cn("h-full rounded-full", item.color)} style={{ width: `${widthPct}%` }} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Venue Breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Venue Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Venue</TableHead>
                    <TableHead className="text-right">Fills</TableHead>
                    <TableHead className="text-right">Avg Slippage</TableHead>
                    <TableHead className="text-right">Maker %</TableHead>
                    <TableHead className="text-right">Avg Fill Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(r.venue_breakdown).map(([venue, data]) => (
                    <TableRow key={venue}>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {venue}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">{data.fills}</TableCell>
                      <TableCell
                        className={cn(
                          "text-right tabular-nums text-sm",
                          data.avg_slippage_bps < 2 ? "text-emerald-400" : "",
                        )}
                      >
                        {formatNumber(data.avg_slippage_bps, 1)} bps
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">
                        {formatPercent(data.maker_pct, 1)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">
                        {formatNumber(data.avg_fill_time_s, 1)}s
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Config ──────────────────────────────────────────────────────────── */}
        <TabsContent value="config">
          <Card>
            <CardContent className="p-4 space-y-3">
              {[
                { label: "Algorithm", value: bt.algo },
                { label: "Order Type", value: bt.order_type },
                { label: "Venues", value: bt.venues.join(", ") },
                { label: "Routing", value: bt.routing },
                { label: "Slippage Model", value: bt.slippage_model },
                {
                  label: "Execution Delay",
                  value: `${bt.execution_delay_ms}ms`,
                },
                { label: "Market Impact", value: bt.market_impact },
                { label: "Instrument", value: bt.instrument },
                {
                  label: "Date Range",
                  value: `${bt.date_range.start} → ${bt.date_range.end}`,
                },
                { label: "Strategy", value: bt.strategy_name },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between text-sm py-1.5 border-b border-border/40 last:border-0"
                >
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="font-medium">{row.value}</span>
                </div>
              ))}
              {Object.entries(bt.algo_params).length > 0 && (
                <>
                  <p className="text-xs font-medium text-muted-foreground pt-1">Algorithm Parameters</p>
                  {Object.entries(bt.algo_params).map(([k, v]) => (
                    <div
                      key={k}
                      className="flex items-center justify-between text-sm py-1 border-b border-border/30 last:border-0"
                    >
                      <span className="text-muted-foreground font-mono text-xs">{k}</span>
                      <span className="font-mono text-xs">{String(v)}</span>
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Compare Panel ──────────────────────────────────────────────────────────

export function ExecutionComparePanel({ selected, onClose }: { selected: string[]; onClose: () => void }) {
  const items = EXECUTION_BACKTESTS.filter((b) => selected.includes(b.id) && b.results).slice(0, 3);

  if (items.length < 2) return null;

  const METRICS = [
    { key: "sharpe_ratio", label: "Sharpe" },
    { key: "net_profit_pct", label: "Return %", pct: true },
    { key: "max_drawdown_pct", label: "Max DD %", pct: true, low: true },
    { key: "avg_slippage_bps", label: "Avg Slippage (bps)", low: true },
    { key: "avg_fill_time_seconds", label: "Fill Time (s)", low: true },
    { key: "fill_rate_pct", label: "Fill Rate %" },
    { key: "maker_pct", label: "Maker %" },
    {
      key: "implementation_shortfall_bps",
      label: "Impl. Shortfall (bps)",
      low: true,
    },
    { key: "total_commission", label: "Total Fees ($)", low: true },
  ];

  // Build combined equity curve for overlay
  const allDates = (EXECUTION_COMPARE_CURVES[items[0].id] ?? EXECUTION_EQUITY_CURVE).map((p) => p.date);
  const combinedCurve = allDates.map((date, i) => {
    const point: Record<string, string | number> = { date };
    items.forEach((bt) => {
      const curve = EXECUTION_COMPARE_CURVES[bt.id] ?? EXECUTION_EQUITY_CURVE;
      point[bt.id] = curve[i]?.equity ?? 100000;
    });
    return point;
  });

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <GitCompare className="size-4 text-primary" />
            Comparing {items.length} Execution Backtests
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Clear Compare
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Equity curves overlay */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Equity Curves (same signals, different execution)</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={combinedCurve}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="date" tick={TICK_STYLE} tickFormatter={(v) => v.slice(5)} interval={14} />
              <YAxis tick={TICK_STYLE} tickFormatter={(v) => `$${formatNumber(v / 1000, 0)}k`} width={50} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(v, name) => {
                  const bt = items.find((b) => b.id === name);
                  return [`$${Number(v).toLocaleString()}`, bt ? `${bt.algo}` : String(name)];
                }}
              />
              <Legend
                formatter={(value) => {
                  const bt = items.find((b) => b.id === value);
                  return bt ? bt.algo : value;
                }}
              />
              {items.map((bt) => (
                <Line
                  key={bt.id}
                  type="monotone"
                  dataKey={bt.id}
                  stroke={ALGO_COLORS[bt.algo] ?? "#64748b"}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Metrics comparison table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left text-xs text-muted-foreground font-medium pb-2 w-44">Metric</th>
                {items.map((b) => (
                  <th key={b.id} className="text-right text-xs font-medium pb-2 px-3">
                    <div>
                      <div style={{ color: ALGO_COLORS[b.algo] ?? "inherit" }}>{b.algo}</div>
                      <div className="text-muted-foreground font-normal">{b.order_type}</div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {METRICS.map((m) => {
                const values = items.map((b) => (b.results as unknown as Record<string, number>)?.[m.key] ?? 0);
                const best = m.low ? Math.min(...values) : Math.max(...values);
                return (
                  <tr key={m.key} className="border-t border-border/40">
                    <td className="text-xs text-muted-foreground py-2">{m.label}</td>
                    {items.map((b, i) => {
                      const val = values[i];
                      const isBest = val === best;
                      const display = m.pct ? formatPercent(val, 1) : formatNumber(val, 2);
                      return (
                        <td key={b.id} className="text-right py-2 px-3">
                          <span
                            className={cn(
                              "font-mono text-sm font-medium tabular-nums",
                              isBest ? "text-emerald-400" : "",
                            )}
                          >
                            {display}
                            {isBest && <Star className="inline ml-1 size-2.5 fill-emerald-400 text-emerald-400" />}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Net profit insight */}
        <div className="rounded-lg bg-muted/30 p-3 text-xs space-y-1">
          <p className="font-medium text-muted-foreground">Net Profit Comparison</p>
          {items.map((b) => (
            <div key={b.id} className="flex items-center justify-between">
              <span style={{ color: ALGO_COLORS[b.algo] ?? "inherit" }}>{b.algo}</span>
              <span className="font-mono font-medium">
                ${b.results!.net_profit.toLocaleString()} (+
                {formatNumber(b.results!.net_profit_pct, 1)}%)
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Detail View (orchestrates selected backtest display) ───────────────────

export function ExecutionDetailView({
  selectedBt,
  candidates,
  onPromote,
}: {
  selectedBt: ExecutionBacktest | null;
  candidates: Set<string>;
  onPromote: (bt: ExecutionBacktest) => void;
}) {
  if (!selectedBt) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Zap className="size-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Select a backtest to view results</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{selectedBt.name}</h2>
          <p className="text-sm text-muted-foreground">
            {selectedBt.strategy_name} · {selectedBt.instrument}
          </p>
        </div>
        <StatusBadge status={selectedBt.status} />
      </div>

      {selectedBt.status === "running" ? (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <Play className="size-8 text-blue-400 mx-auto animate-pulse" />
            <p className="text-sm font-medium">Backtest running…</p>
            <Progress value={92} className="max-w-xs mx-auto" />
            <p className="text-xs text-muted-foreground">92% complete</p>
          </CardContent>
        </Card>
      ) : selectedBt.status === "failed" ? (
        <Card className="border-red-400/30">
          <CardContent className="py-8 text-center">
            <XCircle className="size-8 text-red-400 mx-auto mb-2" />
            <p className="text-sm text-red-400">Backtest failed</p>
          </CardContent>
        </Card>
      ) : selectedBt.results ? (
        <ResultsView
          bt={selectedBt}
          onPromote={() => onPromote(selectedBt)}
          isCandidate={candidates.has(selectedBt.id)}
        />
      ) : null}
    </div>
  );
}
