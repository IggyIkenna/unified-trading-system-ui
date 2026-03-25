"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  useStrategyBacktests,
  useStrategyTemplates,
} from "@/hooks/api/use-strategies";
import type {
  BacktestRun,
  StrategyTemplate,
  StrategySignal,
  SignalQualityMetrics,
} from "@/lib/strategy-platform-types";
import type { BacktestAnalytics } from "@/lib/backtest-analytics-types";
import {
  BACKTEST_ANALYTICS,
  BACKTEST_SIGNALS,
  BACKTEST_SIGNAL_QUALITY,
  BACKTEST_RUNS as MOCK_BACKTEST_RUNS,
  STRATEGY_TEMPLATES,
  computeFullConfluenceAllStrategies,
  computeSignalOverlap,
  generateSyntheticPriceSeries,
} from "@/lib/strategy-platform-mock-data";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Clock,
  FlaskConical,
  GitCompare,
  Play,
  Plus,
  Search,
  XCircle,
  Zap,
  Star,
  ChevronLeft,
} from "lucide-react";

import { KpiBar } from "@/components/research/kpi-bar";
import { EquityChartWithLayers } from "@/components/research/equity-chart-with-layers";
import { PerformanceSection } from "@/components/research/performance-section";
import { TradesAnalysisSection } from "@/components/research/trades-analysis-section";
import { CapitalEfficiencySection } from "@/components/research/capital-efficiency-section";
import { RunupsDrawdownsSection } from "@/components/research/runups-drawdowns-section";
import { MonthlyReturnsHeatmap } from "@/components/research/monthly-returns-heatmap";
import { SignalConfidenceHistogram } from "@/components/research/signal-confidence-histogram";
import { RegimePerformanceMini } from "@/components/research/regime-performance-mini";
import {
  OverlaidEquityCurves,
  type EquityCurveSeries,
} from "@/components/research/overlaid-equity-curves";
import { SignalOverlayChart } from "@/components/research/signal-overlay-chart";
import { SignalOverlapPanel } from "@/components/research/signal-overlap-panel";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  completed: {
    label: "Complete",
    color: "text-emerald-400",
    badgeClass: "border-emerald-400/30 text-emerald-400",
    icon: CheckCircle2,
  },
  running: {
    label: "Running",
    color: "text-blue-400",
    badgeClass: "border-blue-400/30 text-blue-400",
    icon: Play,
  },
  queued: {
    label: "Queued",
    color: "text-muted-foreground",
    badgeClass: "text-muted-foreground",
    icon: Clock,
  },
  failed: {
    label: "Failed",
    color: "text-red-400",
    badgeClass: "border-red-400/30 text-red-400",
    icon: XCircle,
  },
  cancelled: {
    label: "Cancelled",
    color: "text-muted-foreground",
    badgeClass: "text-muted-foreground",
    icon: XCircle,
  },
} as const;

function StatusBadge({ status }: { status: string }) {
  const cfg =
    STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.queued;
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={cn("text-xs gap-1", cfg.badgeClass)}>
      <Icon className="size-3" />
      {cfg.label}
    </Badge>
  );
}

// ─── New Backtest Dialog ──────────────────────────────────────────────────────

function NewBacktestDialog({
  templates,
  open,
  onClose,
}: {
  templates: StrategyTemplate[];
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = React.useState("");
  const [instrument, setInstrument] = React.useState("BTC-USDT");
  const [dateStart, setDateStart] = React.useState("2024-01-01");
  const [dateEnd, setDateEnd] = React.useState("2026-01-01");
  const [strategyType, setStrategyType] = React.useState("ml");
  const [signalThreshold, setSignalThreshold] = React.useState("0.65");
  const [modelVersion, setModelVersion] = React.useState("");
  const [warmupBars, setWarmupBars] = React.useState("64");
  const [maxConcurrent, setMaxConcurrent] = React.useState("4");
  const [maxPositionPct, setMaxPositionPct] = React.useState("12");
  const [maxDdStopPct, setMaxDdStopPct] = React.useState("8");
  const [portfolioMode, setPortfolioMode] = React.useState(false);
  const [shard, setShard] = React.useState("SHARD_1");
  const [saveAsTemplate, setSaveAsTemplate] = React.useState(false);

  const picked = templates.find((t) => t.id === selectedTemplate);
  const modelChoices =
    picked?.linkedModels && picked.linkedModels.length > 0
      ? picked.linkedModels
      : ["model-family/latest", "model-family/v2.1.0-rc"];

  React.useEffect(() => {
    if (!picked) return;
    setModelVersion(picked.linkedModels?.[0] ?? "model-family/latest");
  }, [picked]);

  React.useEffect(() => {
    if (!open || templates.length === 0) return;
    setSelectedTemplate((prev) => {
      if (prev && templates.some((t) => t.id === prev)) return prev;
      return templates[0].id;
    });
  }, [open, templates]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="size-5 text-amber-400" />
            New Strategy Backtest
          </DialogTitle>
          <DialogDescription>
            Configure signal backtest (minimal slippage). Wire-up to API in a
            later iteration; this form captures the full institutional parameter
            surface.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] px-6">
          <div className="space-y-5 py-2 pr-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Strategy Type</Label>
                <Select value={strategyType} onValueChange={setStrategyType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ml">ML-Based</SelectItem>
                    <SelectItem value="rule">Rule-Based</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Shard</Label>
                <Select value={shard} onValueChange={setShard}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SHARD_1">SHARD_1 (CeFi core)</SelectItem>
                    <SelectItem value="SHARD_2">
                      SHARD_2 (Alt venues)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Strategy Template</Label>
              <Select
                value={selectedTemplate}
                onValueChange={setSelectedTemplate}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a strategy template…" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{t.name}</span>
                        <span className="text-muted-foreground text-xs">
                          {t.archetype}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {strategyType === "ml" && (
              <div className="space-y-2">
                <Label>Model version</Label>
                <Select value={modelVersion} onValueChange={setModelVersion}>
                  <SelectTrigger>
                    <SelectValue placeholder="Registry version" />
                  </SelectTrigger>
                  <SelectContent>
                    {modelChoices.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Signal Threshold</Label>
                <Input
                  type="number"
                  step="0.05"
                  min="0.5"
                  max="0.95"
                  value={signalThreshold}
                  onChange={(e) => setSignalThreshold(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Warmup bars</Label>
                <Input
                  type="number"
                  min="0"
                  value={warmupBars}
                  onChange={(e) => setWarmupBars(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Max concurrent signals</Label>
                <Input
                  type="number"
                  min="1"
                  value={maxConcurrent}
                  onChange={(e) => setMaxConcurrent(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Instrument</Label>
                <Select value={instrument} onValueChange={setInstrument}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "BTC-USDT",
                      "ETH-USDT",
                      "SOL-USDT",
                      "ETH-PERP",
                      "BTC-PERP",
                    ].map((i) => (
                      <SelectItem key={i} value={i}>
                        {i}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2">
              <div>
                <p className="text-sm font-medium">Portfolio mode</p>
                <p className="text-xs text-muted-foreground">
                  One backtest, multiple symbols (cross-asset limits)
                </p>
              </div>
              <Switch
                checked={portfolioMode}
                onCheckedChange={setPortfolioMode}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Max position (% notional)</Label>
                <Input
                  type="number"
                  min="0"
                  value={maxPositionPct}
                  onChange={(e) => setMaxPositionPct(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Max DD stop (%)</Label>
                <Input
                  type="number"
                  min="0"
                  value={maxDdStopPct}
                  onChange={(e) => setMaxDdStopPct(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={dateStart}
                  onChange={(e) => setDateStart(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={dateEnd}
                  onChange={(e) => setDateEnd(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-border/50 px-3 py-2">
              <Checkbox
                id="save-as-template"
                checked={saveAsTemplate}
                onCheckedChange={(c) => setSaveAsTemplate(c === true)}
              />
              <label
                htmlFor="save-as-template"
                className="text-sm text-muted-foreground cursor-pointer"
              >
                Save as template (demo — local only until API exists)
              </label>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter className="px-6 py-4 border-t shrink-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (saveAsTemplate) {
                toast({
                  title: "Template saved (demo)",
                  description:
                    "Registry write will connect when the strategy API is wired.",
                });
              }
              setSaveAsTemplate(false);
              onClose();
            }}
            disabled={!selectedTemplate}
            className="gap-2"
          >
            <Play className="size-4" />
            Launch Backtest
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Backtest List Item ───────────────────────────────────────────────────────

function BacktestListItem({
  bt,
  isSelected,
  isCompareSelected,
  onSelect,
  onToggleCompare,
}: {
  bt: BacktestRun;
  isSelected: boolean;
  isCompareSelected: boolean;
  onSelect: () => void;
  onToggleCompare: () => void;
}) {
  const kind = bt.strategyKind ?? "ml";
  return (
    <div
      onClick={onSelect}
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border/50 hover:bg-muted/30",
      )}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleCompare();
        }}
        title="Add to compare"
        className={cn(
          "mt-0.5 flex items-center justify-center size-5 rounded border transition-colors shrink-0",
          isCompareSelected
            ? "bg-primary border-primary text-primary-foreground"
            : "border-border hover:border-primary",
        )}
      >
        {isCompareSelected && <CheckCircle2 className="size-3" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium truncate">
            {bt.configName ?? bt.templateName ?? bt.id}
          </span>
          <StatusBadge status={bt.status} />
          {bt.isCandidate && (
            <Badge
              variant="outline"
              className="text-[10px] h-5 gap-0.5 border-amber-400/40 text-amber-400"
            >
              <Star className="size-2.5" />
              Candidate
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
          <Badge variant="secondary" className="text-[10px] h-4">
            {bt.archetype}
          </Badge>
          <Badge variant="outline" className="text-[10px] h-4 font-normal">
            {kind === "ml" ? "ML" : "Rule"}
          </Badge>
          <span className="text-[10px] px-1 rounded bg-muted/30 font-mono">
            {bt.shard}
          </span>
          <span>{bt.instrument ?? "—"}</span>
          <span>·</span>
          <span>{bt.venue}</span>
        </div>
        {bt.metrics && (
          <div className="flex items-center gap-3 mt-1.5 text-xs">
            <span
              className={cn(
                "font-mono tabular-nums",
                bt.metrics.sharpe > 1.5
                  ? "text-emerald-400"
                  : "text-muted-foreground",
              )}
            >
              Sharpe {bt.metrics.sharpe.toFixed(2)}
            </span>
            <span
              className={cn(
                "font-mono tabular-nums",
                bt.metrics.totalReturn > 0
                  ? "text-emerald-400"
                  : "text-red-400",
              )}
            >
              {(bt.metrics.totalReturn * 100).toFixed(1)}%
            </span>
            <span className="font-mono tabular-nums text-muted-foreground">
              {bt.metrics.hitRate
                ? `${(bt.metrics.hitRate * 100).toFixed(0)}% hit`
                : ""}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Signal List View ─────────────────────────────────────────────────────────

function SignalListView({ signals }: { signals: StrategySignal[] }) {
  const [page, setPage] = React.useState(0);
  const PAGE_SIZE = 30;
  const displayed = signals.slice(0, (page + 1) * PAGE_SIZE);

  const cumulativeByIndex = React.useMemo(() => {
    const out: number[] = [];
    let acc = 0;
    for (const s of signals) {
      acc += s.pnl_usd ?? 0;
      out.push(acc);
    }
    return out;
  }, [signals]);

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-muted-foreground">
              <th className="text-left py-2 pr-2">#</th>
              <th className="text-left py-2 pr-2">Timestamp</th>
              <th className="text-left py-2 pr-2">Dir</th>
              <th className="text-left py-2 pr-2">Instrument</th>
              <th className="text-right py-2 px-2">Conf</th>
              <th className="text-right py-2 px-2">P&L</th>
              <th className="text-right py-2 px-2">Cum. P&L</th>
              <th className="text-right py-2 px-2">MFE</th>
              <th className="text-right py-2 px-2">MAE</th>
              <th className="text-left py-2 px-2">Regime</th>
              <th className="text-left py-2">Result</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((s, i) => (
              <tr key={s.id} className="border-t border-border/20">
                <td className="py-1.5 pr-2 text-muted-foreground">{i + 1}</td>
                <td className="py-1.5 pr-2 font-mono tabular-nums">
                  {new Date(s.timestamp).toLocaleString(undefined, {
                    month: "short",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="py-1.5 pr-2">
                  <span
                    className={cn(
                      "font-medium",
                      s.direction === "LONG"
                        ? "text-emerald-400"
                        : s.direction === "SHORT"
                          ? "text-red-400"
                          : "text-muted-foreground",
                    )}
                  >
                    {s.direction}
                  </span>
                </td>
                <td className="py-1.5 pr-2">{s.instrument}</td>
                <td className="py-1.5 px-2 text-right font-mono tabular-nums">
                  {s.confidence.toFixed(2)}
                </td>
                <td
                  className={cn(
                    "py-1.5 px-2 text-right font-mono tabular-nums",
                    s.pnl_usd != null && s.pnl_usd >= 0
                      ? "text-emerald-400"
                      : "text-red-400",
                  )}
                >
                  {s.pnl_usd != null
                    ? `${s.pnl_usd >= 0 ? "+" : ""}$${s.pnl_usd.toFixed(0)}`
                    : "—"}
                </td>
                <td
                  className={cn(
                    "py-1.5 px-2 text-right font-mono tabular-nums",
                    cumulativeByIndex[i] >= 0
                      ? "text-emerald-400/90"
                      : "text-red-400/90",
                  )}
                >
                  {cumulativeByIndex[i] >= 0 ? "+" : ""}$
                  {cumulativeByIndex[i].toFixed(0)}
                </td>
                <td className="py-1.5 px-2 text-right font-mono tabular-nums text-emerald-400/70">
                  {s.mfe_pct != null ? `+${s.mfe_pct}%` : "—"}
                </td>
                <td className="py-1.5 px-2 text-right font-mono tabular-nums text-red-400/70">
                  {s.mae_pct != null ? `${s.mae_pct}%` : "—"}
                </td>
                <td className="py-1.5 px-2 capitalize text-muted-foreground">
                  {s.regime_at_signal ?? "—"}
                </td>
                <td className="py-1.5">
                  {s.outcome === "win" ? (
                    <Badge
                      variant="outline"
                      className="text-[10px] h-4 border-emerald-400/30 text-emerald-400"
                    >
                      Win
                    </Badge>
                  ) : s.outcome === "loss" ? (
                    <Badge
                      variant="outline"
                      className="text-[10px] h-4 border-red-400/30 text-red-400"
                    >
                      Loss
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {displayed.length < signals.length && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setPage((p) => p + 1)}
        >
          Load more ({signals.length - displayed.length} remaining)
        </Button>
      )}
    </div>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function DetailPanel({
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
  const [viewMode, setViewMode] = React.useState<"metrics" | "signals">(
    "metrics",
  );
  const perf = analytics.performance_by_direction;

  const executionHandoffHref = `/services/research/execution?from=strategies&strategyBacktestId=${encodeURIComponent(bt.id)}`;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b">
        <Button
          variant="ghost"
          size="sm"
          className="size-7 p-0"
          onClick={onClose}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold truncate">
            {bt.configName ?? bt.templateName ?? bt.id}
          </h3>
          <p className="text-xs text-muted-foreground">
            {bt.instrument} · {bt.venue} · {bt.dateWindow.start} →{" "}
            {bt.dateWindow.end}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1 text-xs h-7"
          asChild
        >
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
              description: `${bt.configName ?? bt.id} — full lineage capture when the promote API is available.`,
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
      <div className="flex-1 overflow-y-auto px-4 pb-6 mt-3">
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
            <Accordion
              type="multiple"
              defaultValue={["performance", "signals-analysis"]}
              className="space-y-1"
            >
              {/* Performance */}
              <AccordionItem
                value="performance"
                className="border rounded-lg px-3"
              >
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
                    <MonthlyReturnsHeatmap
                      monthlyReturns={analytics.monthly_returns}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Signals Analysis */}
              <AccordionItem
                value="signals-analysis"
                className="border rounded-lg px-3"
              >
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
                    <RegimePerformanceMini
                      regimeSharpe={quality.regime_sharpe}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Capital Efficiency */}
              <AccordionItem
                value="capital-efficiency"
                className="border rounded-lg px-3"
              >
                <AccordionTrigger className="text-xs font-semibold uppercase tracking-wider">
                  Capital Efficiency
                </AccordionTrigger>
                <AccordionContent>
                  <CapitalEfficiencySection
                    data={analytics.capital_efficiency}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* Run-ups & Drawdowns */}
              <AccordionItem
                value="runups-drawdowns"
                className="border rounded-lg px-3"
              >
                <AccordionTrigger className="text-xs font-semibold uppercase tracking-wider">
                  Run-ups & Drawdowns
                </AccordionTrigger>
                <AccordionContent>
                  <RunupsDrawdownsSection data={analytics.runup_drawdown} />
                </AccordionContent>
              </AccordionItem>

              {/* Configuration */}
              <AccordionItem
                value="configuration"
                className="border rounded-lg px-3"
              >
                <AccordionTrigger className="text-xs font-semibold uppercase tracking-wider">
                  Configuration
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg border bg-muted/20 p-2.5">
                        <span className="text-muted-foreground block text-[10px]">
                          Config Version
                        </span>
                        <span className="font-mono">{bt.configVersion}</span>
                      </div>
                      <div className="rounded-lg border bg-muted/20 p-2.5">
                        <span className="text-muted-foreground block text-[10px]">
                          Code Commit
                        </span>
                        <span className="font-mono">{bt.codeCommitHash}</span>
                      </div>
                      <div className="rounded-lg border bg-muted/20 p-2.5">
                        <span className="text-muted-foreground block text-[10px]">
                          Data Source
                        </span>
                        <span className="font-mono">{bt.dataSource}</span>
                      </div>
                      <div className="rounded-lg border bg-muted/20 p-2.5">
                        <span className="text-muted-foreground block text-[10px]">
                          As-of Date
                        </span>
                        <span className="font-mono">{bt.asOfDate}</span>
                      </div>
                      <div className="rounded-lg border bg-muted/20 p-2.5">
                        <span className="text-muted-foreground block text-[10px]">
                          Testing Stage
                        </span>
                        <span className="font-mono">{bt.testingStage}</span>
                      </div>
                      <div className="rounded-lg border bg-muted/20 p-2.5">
                        <span className="text-muted-foreground block text-[10px]">
                          Duration
                        </span>
                        <span className="font-mono">
                          {bt.durationMs
                            ? `${(bt.durationMs / 60000).toFixed(1)}m`
                            : "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Compare Panel ────────────────────────────────────────────────────────────

const COMPARE_COLORS = ["#22c55e", "#3b82f6", "#f97316"];

function ComparePanel({
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

  const priceSeed =
    items.reduce((acc, b) => acc + b.id.charCodeAt(0), 0) +
    (items[0]?.instrument?.length ?? 0);
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
      fmt: (n) => n.toFixed(2),
      good: "high",
    },
    {
      label: "Hit rate",
      get: (b) => BACKTEST_SIGNAL_QUALITY[b.id]?.hit_rate ?? 0,
      fmt: (n) => `${(n * 100).toFixed(1)}%`,
      good: "high",
    },
    {
      label: "Avg confidence",
      get: (b) => BACKTEST_SIGNAL_QUALITY[b.id]?.avg_confidence ?? 0,
      fmt: (n) => n.toFixed(2),
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

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {equityCurves.length >= 2 && (
          <OverlaidEquityCurves curves={equityCurves} height={260} normalize />
        )}

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
                  {p.a.configName ?? p.a.id.slice(0, 8)} vs{" "}
                  {p.b.configName ?? p.b.id.slice(0, 8)}
                </p>
                <p className="text-lg font-bold tabular-nums text-primary">
                  {p.pct}%
                </p>
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
              {fullConfluence.all_agree_pct.toFixed(1)}% of directional signals
              in{" "}
              <span className="text-foreground font-medium">
                {items[0].configName ?? items[0].id}
              </span>{" "}
              align with every other strategy (same instrument & direction
              within 48h).
            </p>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left text-xs text-muted-foreground font-medium pb-2 w-32">
                  Metric
                </th>
                {items.map((b) => (
                  <th
                    key={b.id}
                    className="text-right text-xs font-medium pb-2 px-3 max-w-[140px]"
                  >
                    <div className="truncate">{b.configName ?? b.id}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SIGNAL_METRICS.map((row) => {
                const values = items.map((b) => row.get(b));
                const best =
                  row.good === "high"
                    ? Math.max(...values)
                    : Math.min(...values);
                return (
                  <tr key={row.label} className="border-t border-border/40">
                    <td className="text-xs text-muted-foreground py-2">
                      {row.label}
                    </td>
                    {items.map((b, i) => {
                      const val = values[i];
                      const isBest =
                        val === best && values.some((v) => v !== 0);
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
                const values = items.map(
                  (b) =>
                    (b.metrics as unknown as Record<string, number>)?.[
                      metric.key
                    ] ?? 0,
                );
                const best =
                  metric.good === "high"
                    ? Math.max(...values)
                    : Math.min(...values);
                return (
                  <tr key={metric.key} className="border-t border-border/40">
                    <td className="text-xs text-muted-foreground py-2">
                      {metric.label}
                    </td>
                    {items.map((b, i) => {
                      const val = values[i];
                      const isBest = val === best;
                      const display = metric.pct
                        ? `${(val * 100).toFixed(1)}%`
                        : val.toFixed(2);
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
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full gap-1 text-xs"
          asChild
        >
          <Link href={compareExecutionHref}>
            <Zap className="size-3" />
            Send best ({bestBySharpe.configName ?? bestBySharpe.id.slice(0, 8)})
            to Execution
          </Link>
        </Button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type SortKey = "recent" | "sharpe" | "return" | "name";

export default function StrategiesPage() {
  const [search, setSearch] = React.useState("");
  const [archetypeFilter, setArchetypeFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [shardFilter, setShardFilter] = React.useState("all");
  const [strategyKindFilter, setStrategyKindFilter] = React.useState("all");
  const [sortKey, setSortKey] = React.useState<SortKey>("recent");
  const [newBacktestOpen, setNewBacktestOpen] = React.useState(false);
  const [compareSelected, setCompareSelected] = React.useState<string[]>([]);
  const [selectedBt, setSelectedBt] = React.useState<string | null>(null);

  const { data: backtestsData, isLoading: btLoading } = useStrategyBacktests();
  const { data: templatesData } = useStrategyTemplates();

  const backtests: BacktestRun[] = React.useMemo(() => {
    const raw =
      (backtestsData as Record<string, unknown>)?.data ??
      (backtestsData as Record<string, unknown>)?.backtests ??
      [];
    const arr = raw as BacktestRun[];
    if (arr.length > 0) return arr;
    return MOCK_BACKTEST_RUNS;
  }, [backtestsData]);

  const templates: StrategyTemplate[] = React.useMemo(() => {
    const raw =
      (templatesData as Record<string, unknown>)?.data ??
      (templatesData as Record<string, unknown>)?.templates ??
      [];
    const arr = raw as StrategyTemplate[];
    if (arr.length > 0) return arr;
    return STRATEGY_TEMPLATES;
  }, [templatesData]);

  const archetypes = [
    ...new Set(backtests.map((b) => b.archetype).filter(Boolean)),
  ];
  const shards = [...new Set(backtests.map((b) => b.shard).filter(Boolean))];

  const filtered = React.useMemo(() => {
    let items = backtests;
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (b) =>
          (b.configName ?? "").toLowerCase().includes(q) ||
          (b.archetype ?? "").toLowerCase().includes(q) ||
          (b.instrument ?? "").toLowerCase().includes(q) ||
          (b.shard ?? "").toLowerCase().includes(q),
      );
    }
    if (archetypeFilter !== "all")
      items = items.filter((b) => b.archetype === archetypeFilter);
    if (statusFilter !== "all")
      items = items.filter((b) => b.status === statusFilter);
    if (shardFilter !== "all")
      items = items.filter((b) => b.shard === shardFilter);
    if (strategyKindFilter !== "all") {
      items = items.filter(
        (b) => (b.strategyKind ?? "ml") === strategyKindFilter,
      );
    }

    const sorted = [...items];
    switch (sortKey) {
      case "sharpe":
        sorted.sort(
          (a, b) => (b.metrics?.sharpe ?? -999) - (a.metrics?.sharpe ?? -999),
        );
        break;
      case "return":
        sorted.sort(
          (a, b) =>
            (b.metrics?.totalReturn ?? -999) - (a.metrics?.totalReturn ?? -999),
        );
        break;
      case "name":
        sorted.sort((a, b) =>
          (a.configName ?? a.templateName ?? "").localeCompare(
            b.configName ?? b.templateName ?? "",
          ),
        );
        break;
      case "recent":
      default:
        sorted.sort((a, b) => {
          const ta = new Date(a.startedAt ?? 0).getTime();
          const tb = new Date(b.startedAt ?? 0).getTime();
          return tb - ta;
        });
    }
    return sorted;
  }, [
    backtests,
    search,
    archetypeFilter,
    statusFilter,
    shardFilter,
    strategyKindFilter,
    sortKey,
  ]);

  const toggleCompare = (id: string) => {
    setCompareSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < 3
          ? [...prev, id]
          : prev,
    );
  };

  const selectedBacktest = selectedBt
    ? (backtests.find((b) => b.id === selectedBt) ?? null)
    : null;

  const showCompare = compareSelected.length >= 2 && !selectedBt;
  const showDetail = selectedBacktest && !showCompare;

  const detailAnalytics: BacktestAnalytics | null =
    showDetail && selectedBt ? (BACKTEST_ANALYTICS[selectedBt] ?? null) : null;
  const detailSignals: StrategySignal[] =
    showDetail && selectedBt ? (BACKTEST_SIGNALS[selectedBt] ?? []) : [];
  const detailQuality: SignalQualityMetrics | null =
    showDetail && selectedBt
      ? (BACKTEST_SIGNAL_QUALITY[selectedBt] ?? null)
      : null;

  // Summary counts
  const complete = backtests.filter((b) => b.status === "completed").length;
  const candidates = backtests.filter((b) => (b as any).isCandidate).length;
  const bestSharpe = backtests
    .filter((b) => b.status === "completed" && b.metrics)
    .reduce((max, b) => Math.max(max, b.metrics?.sharpe ?? 0), 0);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar: search, filters, actions */}
      <div className="flex flex-col gap-3 px-6 pt-6 pb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] max-w-md flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search backtests…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={archetypeFilter} onValueChange={setArchetypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Archetype" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Archetypes</SelectItem>
              {archetypes.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Complete</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="queued">Queued</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={shardFilter} onValueChange={setShardFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Shard" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Shards</SelectItem>
              {shards.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={strategyKindFilter}
            onValueChange={setStrategyKindFilter}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Strategy kind" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ML & Rule</SelectItem>
              <SelectItem value="ml">ML only</SelectItem>
              <SelectItem value="rule">Rule only</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={sortKey}
            onValueChange={(v) => setSortKey(v as SortKey)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recent first</SelectItem>
              <SelectItem value="sharpe">Sharpe (high)</SelectItem>
              <SelectItem value="return">Total return</SelectItem>
              <SelectItem value="name">Name (A–Z)</SelectItem>
            </SelectContent>
          </Select>
          {compareSelected.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {compareSelected.length} selected for compare
            </Badge>
          )}
        </div>
        <div className="flex shrink-0 items-center justify-end gap-2 sm:justify-start">
          {compareSelected.length >= 2 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => setSelectedBt(null)}
            >
              <GitCompare className="size-4" />
              Compare ({compareSelected.length})
            </Button>
          )}
          <Button size="sm" onClick={() => setNewBacktestOpen(true)}>
            <Plus className="size-4 mr-1" />
            New Backtest
          </Button>
        </div>
      </div>

      {/* Two-Panel Layout */}
      <div className="flex-1 flex min-h-0 px-6 pb-6 gap-4">
        {/* Left Panel: Backtest List */}
        <div
          className={cn(
            "flex flex-col gap-2 overflow-y-auto pr-1",
            showDetail || showCompare ? "w-[340px] shrink-0" : "flex-1",
          )}
        >
          {btLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FlaskConical className="size-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">
                  {backtests.length === 0
                    ? "No strategy backtests yet. Launch your first one."
                    : "No backtests match your filters."}
                </p>
              </CardContent>
            </Card>
          ) : (
            filtered.map((bt) => (
              <BacktestListItem
                key={bt.id}
                bt={bt}
                isSelected={selectedBt === bt.id}
                isCompareSelected={compareSelected.includes(bt.id)}
                onSelect={() => setSelectedBt(bt.id)}
                onToggleCompare={() => toggleCompare(bt.id)}
              />
            ))
          )}
        </div>

        {/* Right Panel: Detail or Compare */}
        {(showDetail || showCompare) && (
          <div className="flex-1 border rounded-lg overflow-hidden bg-card min-w-0">
            {showDetail &&
            selectedBacktest &&
            detailAnalytics &&
            detailQuality ? (
              <DetailPanel
                bt={selectedBacktest}
                analytics={detailAnalytics}
                signals={detailSignals}
                quality={detailQuality}
                onClose={() => setSelectedBt(null)}
              />
            ) : showCompare ? (
              <ComparePanel
                selected={compareSelected}
                backtests={backtests}
                onClose={() => setCompareSelected([])}
              />
            ) : null}
          </div>
        )}
      </div>

      <NewBacktestDialog
        templates={templates}
        open={newBacktestOpen}
        onClose={() => setNewBacktestOpen(false)}
      />
    </div>
  );
}
