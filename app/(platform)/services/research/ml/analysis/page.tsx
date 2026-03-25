"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpDown,
  BarChart3,
  CheckCircle2,
  GitCompareArrows,
  Layers,
  Shield,
  TrendingUp,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ApiError } from "@/components/ui/api-error";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useMLRunComparison,
  useUnifiedTrainingRuns,
} from "@/hooks/api/use-ml-models";
import type {
  RunAnalysis,
  RunComparison,
  UnifiedTrainingRun,
} from "@/lib/ml-types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function metricColor(
  value: number,
  thresholds: { good: number; warn: number; direction: "higher" | "lower" },
) {
  if (thresholds.direction === "higher") {
    if (value >= thresholds.good) return "text-emerald-400";
    if (value >= thresholds.warn) return "text-amber-400";
    return "text-red-400";
  }
  if (value <= thresholds.good) return "text-emerald-400";
  if (value <= thresholds.warn) return "text-amber-400";
  return "text-red-400";
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AnalysisPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-6 text-muted-foreground">Loading analysis...</div>
      }
    >
      <AnalysisContent />
    </React.Suspense>
  );
}

function AnalysisContent() {
  const searchParams = useSearchParams();
  const preselectedRun = searchParams.get("run");

  const {
    data: runsData,
    isLoading: runsLoading,
    isError: runsIsError,
    error: runsError,
  } = useUnifiedTrainingRuns();

  const runs = (
    Array.isArray(runsData) ? runsData : []
  ) as UnifiedTrainingRun[];
  const completedRuns = React.useMemo(
    () => runs.filter((r) => r.status === "completed" && r.analysis),
    [runs],
  );

  const [selectedRunId, setSelectedRunId] = React.useState<string>("");
  const [compareMode, setCompareMode] = React.useState(false);
  const [compareRunId, setCompareRunId] = React.useState<string>("");

  React.useEffect(() => {
    if (completedRuns.length === 0) return;
    const pick =
      preselectedRun && completedRuns.some((r) => r.id === preselectedRun)
        ? preselectedRun
        : completedRuns[0].id;
    setSelectedRunId((cur) =>
      cur && completedRuns.some((r) => r.id === cur) ? cur : pick,
    );
  }, [completedRuns, preselectedRun]);

  const selectedRun = completedRuns.find((r) => r.id === selectedRunId);
  const analysis = selectedRun?.analysis;
  const compareRun = compareMode
    ? completedRuns.find((r) => r.id === compareRunId)
    : null;

  if (runsLoading) {
    return (
      <div className="min-h-screen bg-background p-6 space-y-4">
        <Skeleton className="h-10 w-72 rounded-md" />
        <Skeleton className="h-[420px] w-full rounded-lg border border-border/50" />
      </div>
    );
  }

  if (runsIsError) {
    return (
      <div className="min-h-screen bg-background p-6">
        <ApiError
          error={
            runsError instanceof Error
              ? runsError
              : new Error("Failed to load runs")
          }
          title="Could not load analysis"
        />
      </div>
    );
  }

  if (completedRuns.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-2">
          <BarChart3 className="size-10 text-muted-foreground mx-auto" />
          <h2 className="text-lg font-semibold">
            No completed runs to analyze
          </h2>
          <p className="text-sm text-muted-foreground">
            Complete a training run first, then return here for analysis.
          </p>
          <Link href="/services/research/ml/training">
            <Button variant="outline" size="sm" className="mt-2">
              Go to Training
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl space-y-5 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/services/research/ml">
              <Button variant="ghost" size="icon" className="size-8">
                <ArrowLeft className="size-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Analysis</h1>
              <p className="text-xs text-muted-foreground">
                Post-training research, evaluation, and comparison
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedRunId} onValueChange={setSelectedRunId}>
              <SelectTrigger className="w-[280px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {completedRuns.map((r) => (
                  <SelectItem key={r.id} value={r.id} className="text-xs">
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={compareMode ? "default" : "outline"}
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => {
                setCompareMode(!compareMode);
                if (!compareMode && completedRuns.length > 1) {
                  setCompareRunId(
                    completedRuns.find((r) => r.id !== selectedRunId)?.id ?? "",
                  );
                }
              }}
            >
              <GitCompareArrows className="size-3.5" />
              {compareMode ? "Exit Compare" : "Compare"}
            </Button>
          </div>
        </div>

        {/* Compare mode selector */}
        {compareMode && (
          <div className="flex items-center gap-3 p-3 rounded-lg border border-purple-500/30 bg-purple-500/5">
            <span className="text-xs text-muted-foreground">
              Comparing with:
            </span>
            <Select value={compareRunId} onValueChange={setCompareRunId}>
              <SelectTrigger className="w-[280px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {completedRuns
                  .filter((r) => r.id !== selectedRunId)
                  .map((r) => (
                    <SelectItem key={r.id} value={r.id} className="text-xs">
                      {r.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {compareMode && compareRun ? (
          <ComparisonView runA={selectedRun!} runB={compareRun} />
        ) : analysis ? (
          <SingleRunAnalysis run={selectedRun!} analysis={analysis} />
        ) : (
          <Card className="border-border/50 p-8 text-center text-muted-foreground">
            <p>No analysis data available for this run.</p>
          </Card>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single Run Analysis (scrollable dashboard)
// ---------------------------------------------------------------------------

function SingleRunAnalysis({
  run,
  analysis,
}: {
  run: UnifiedTrainingRun;
  analysis: RunAnalysis;
}) {
  const fm = analysis.financial_metrics;

  return (
    <div className="space-y-5">
      {/* Financial Metrics Summary */}
      {fm && (
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="size-4" />
              Financial Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3">
              {[
                {
                  label: "Sharpe",
                  value: fm.sharpe_ratio.toFixed(2),
                  ...thresholds("sharpe"),
                },
                {
                  label: "Dir. Acc",
                  value: `${(fm.directional_accuracy * 100).toFixed(1)}%`,
                  ...thresholds("dir_acc"),
                },
                {
                  label: "Profit Factor",
                  value: fm.profit_factor.toFixed(2),
                  ...thresholds("pf"),
                },
                {
                  label: "Hit Rate",
                  value: `${(fm.hit_rate * 100).toFixed(1)}%`,
                  ...thresholds("hit_rate"),
                },
                {
                  label: "Sortino",
                  value: fm.sortino_ratio.toFixed(2),
                  ...thresholds("sortino"),
                },
                {
                  label: "Info Ratio",
                  value: fm.information_ratio.toFixed(2),
                  ...thresholds("ir"),
                },
                {
                  label: "Max DD",
                  value: `${fm.max_drawdown_pct.toFixed(1)}%`,
                  ...thresholds("dd"),
                },
                {
                  label: "Calibration",
                  value: fm.calibration_score.toFixed(2),
                  ...thresholds("cal"),
                },
                {
                  label: "Stability",
                  value: fm.stability_score.toFixed(2),
                  ...thresholds("stability"),
                },
              ].map((m) => (
                <div
                  key={m.label}
                  className="text-center p-2 rounded-md bg-muted/30"
                >
                  <p
                    className={`text-lg font-bold font-mono ${metricColor(parseFloat(m.value), { good: m.good, warn: m.warn, direction: m.dir })}`}
                  >
                    {m.value}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{m.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feature Importance */}
      {analysis.feature_importance.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Layers className="size-4" />
              Feature Importance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] mb-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analysis.feature_importance}
                  layout="vertical"
                  margin={{ left: 120 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    opacity={0.3}
                  />
                  <XAxis
                    type="number"
                    domain={[0, "auto"]}
                    tick={{
                      fill: "hsl(var(--muted-foreground))",
                      fontSize: 10,
                    }}
                  />
                  <YAxis
                    type="category"
                    dataKey="feature_name"
                    tick={{
                      fill: "hsl(var(--muted-foreground))",
                      fontSize: 11,
                    }}
                    width={115}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "11px",
                    }}
                    formatter={(v: number) => `${(v * 100).toFixed(1)}%`}
                  />
                  <Bar dataKey="importance_score" radius={[0, 4, 4, 0]}>
                    {analysis.feature_importance.map((f, i) => (
                      <Cell
                        key={f.feature_id}
                        fill={i < 3 ? "#3b82f6" : i < 5 ? "#6366f1" : "#71717a"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5">
              {analysis.feature_importance
                .filter((f) => f.insight)
                .map((f) => (
                  <div
                    key={f.feature_id}
                    className="flex items-start gap-2 text-[11px] text-muted-foreground"
                  >
                    <span className="font-mono font-medium text-foreground shrink-0">
                      {f.feature_name}:
                    </span>
                    <span className="italic">{f.insight}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Regime Performance */}
        {analysis.regime_performance.length > 0 && (
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="size-4" />
                Regime Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-[100px_1fr_1fr_1fr_1fr] gap-2 px-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                <span>Regime</span>
                <span>Sharpe</span>
                <span>Dir. Acc</span>
                <span>Max DD</span>
                <span>Samples</span>
              </div>
              {analysis.regime_performance.map((rp) => (
                <div key={rp.regime}>
                  <div className="grid grid-cols-[100px_1fr_1fr_1fr_1fr] gap-2 px-2 py-1.5 rounded-md items-center hover:bg-muted/20">
                    <span className="text-xs font-medium capitalize">
                      {rp.regime}
                    </span>
                    <span
                      className={`text-xs font-mono ${metricColor(rp.sharpe_ratio, { good: 1.5, warn: 0.5, direction: "higher" })}`}
                    >
                      {rp.sharpe_ratio.toFixed(2)}
                    </span>
                    <span
                      className={`text-xs font-mono ${metricColor(rp.directional_accuracy, { good: 0.6, warn: 0.5, direction: "higher" })}`}
                    >
                      {(rp.directional_accuracy * 100).toFixed(1)}%
                    </span>
                    <span
                      className={`text-xs font-mono ${metricColor(rp.max_drawdown_pct, { good: 5, warn: 15, direction: "lower" })}`}
                    >
                      {rp.max_drawdown_pct.toFixed(1)}%
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">
                      {rp.sample_count}
                    </span>
                  </div>
                  {rp.warning && (
                    <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] text-amber-400">
                      <AlertTriangle className="size-3 shrink-0" />
                      <span>{rp.warning}</span>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Walk-Forward Folds */}
        {analysis.walk_forward_folds.length > 0 && (
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <ArrowUpDown className="size-4" />
                Walk-Forward Folds ({analysis.walk_forward_folds.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[180px] mb-3">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analysis.walk_forward_folds}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                      opacity={0.3}
                    />
                    <XAxis
                      dataKey="fold_number"
                      tick={{
                        fill: "hsl(var(--muted-foreground))",
                        fontSize: 10,
                      }}
                      label={{
                        value: "Fold",
                        position: "bottom",
                        offset: -5,
                        fontSize: 10,
                      }}
                    />
                    <YAxis
                      tick={{
                        fill: "hsl(var(--muted-foreground))",
                        fontSize: 10,
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "11px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="sharpe_ratio"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Sharpe"
                    />
                    <Line
                      type="monotone"
                      dataKey="directional_accuracy"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Dir. Acc"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1">
                {analysis.walk_forward_folds.map((f) => (
                  <div
                    key={f.fold_number}
                    className="grid grid-cols-[40px_1fr_1fr_80px_80px_60px] gap-2 px-2 py-1 text-[11px] items-center hover:bg-muted/20 rounded"
                  >
                    <span className="font-mono text-muted-foreground">
                      F{f.fold_number}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {f.train_start} → {f.train_end}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {f.test_start} → {f.test_end}
                    </span>
                    <span
                      className={`font-mono ${metricColor(f.sharpe_ratio, { good: 2.0, warn: 1.0, direction: "higher" })}`}
                    >
                      SR {f.sharpe_ratio.toFixed(2)}
                    </span>
                    <span className="font-mono">
                      {(f.directional_accuracy * 100).toFixed(1)}%
                    </span>
                    <span className="font-mono text-muted-foreground">
                      {f.sample_count}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Prediction Distribution + Data Integrity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {analysis.prediction_distribution && (
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Prediction Calibration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analysis.prediction_distribution.buckets
                      .slice(0, -1)
                      .map((b, i) => ({
                        bucket: `${(b * 100).toFixed(0)}-${(analysis.prediction_distribution!.buckets[i + 1] * 100).toFixed(0)}%`,
                        actual:
                          analysis.prediction_distribution!
                            .actual_positive_rate[i] * 100,
                        count:
                          analysis.prediction_distribution!.predicted_count[i],
                      }))}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                      opacity={0.3}
                    />
                    <XAxis
                      dataKey="bucket"
                      tick={{
                        fill: "hsl(var(--muted-foreground))",
                        fontSize: 9,
                      }}
                    />
                    <YAxis
                      tick={{
                        fill: "hsl(var(--muted-foreground))",
                        fontSize: 10,
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "11px",
                      }}
                    />
                    <Bar
                      dataKey="actual"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                      name="Actual Positive Rate %"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                Well-calibrated model: bars should roughly match bucket
                midpoints (diagonal pattern).
              </p>
            </CardContent>
          </Card>
        )}

        {analysis.data_integrity_checks.length > 0 && (
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="size-4" />
                Data Integrity Checks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {analysis.data_integrity_checks.map((check) => (
                <div
                  key={check.check_name}
                  className="flex items-start gap-2.5 py-1.5"
                >
                  {check.status === "pass" && (
                    <CheckCircle2 className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                  )}
                  {check.status === "warn" && (
                    <AlertTriangle className="size-4 text-amber-400 shrink-0 mt-0.5" />
                  )}
                  {check.status === "fail" && (
                    <XCircle className="size-4 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="text-xs font-medium">
                      {check.check_name.replace(/_/g, " ")}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {check.message}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Loss Curves */}
      {analysis.epoch_history.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Training Loss Curves</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={analysis.epoch_history.filter(
                    (_, i) =>
                      i % 3 === 0 || i === analysis.epoch_history.length - 1,
                  )}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    opacity={0.3}
                  />
                  <XAxis
                    dataKey="epoch"
                    tick={{
                      fill: "hsl(var(--muted-foreground))",
                      fontSize: 10,
                    }}
                  />
                  <YAxis
                    tick={{
                      fill: "hsl(var(--muted-foreground))",
                      fontSize: 10,
                    }}
                    domain={["auto", "auto"]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "11px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="train_loss"
                    stroke="#3b82f6"
                    strokeWidth={1.5}
                    dot={false}
                    name="Train"
                  />
                  <Line
                    type="monotone"
                    dataKey="val_loss"
                    stroke="#f59e0b"
                    strokeWidth={1.5}
                    dot={false}
                    name="Validation"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Comparison View
// ---------------------------------------------------------------------------

function ComparisonView({
  runA,
  runB,
}: {
  runA: UnifiedTrainingRun;
  runB: UnifiedTrainingRun;
}) {
  const { data: compData, isLoading: compLoading } = useMLRunComparison(
    runA.id,
    runB.id,
  );
  const comparisons = (
    Array.isArray(compData) ? compData : []
  ) as RunComparison[];
  const fmA = runA.analysis?.financial_metrics;
  const fmB = runB.analysis?.financial_metrics;

  return (
    <div className="space-y-5">
      {/* Header cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-blue-500/30 bg-blue-500/5 p-4">
          <p className="text-xs text-blue-400 font-medium mb-1">Run A</p>
          <p className="font-semibold text-sm">{runA.name}</p>
          <p className="text-[11px] text-muted-foreground">
            {runA.config.architecture}
          </p>
        </Card>
        <Card className="border-purple-500/30 bg-purple-500/5 p-4">
          <p className="text-xs text-purple-400 font-medium mb-1">Run B</p>
          <p className="font-semibold text-sm">{runB.name}</p>
          <p className="text-[11px] text-muted-foreground">
            {runB.config.architecture}
          </p>
        </Card>
      </div>

      {/* Metric-by-metric comparison with significance */}
      {fmA && fmB && (
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Side-by-Side Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-[120px_1fr_1fr_80px_80px_80px] gap-2 px-2 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider border-b border-border/50 mb-2">
              <span>Metric</span>
              <span>Run A</span>
              <span>Run B</span>
              <span>Δ</span>
              <span>p-value</span>
              <span>Sig?</span>
            </div>
            {[
              {
                label: "Sharpe Ratio",
                a: fmA.sharpe_ratio,
                b: fmB.sharpe_ratio,
                key: "sharpe_ratio",
              },
              {
                label: "Dir. Accuracy",
                a: fmA.directional_accuracy,
                b: fmB.directional_accuracy,
                key: "directional_accuracy",
                pct: true,
              },
              {
                label: "Profit Factor",
                a: fmA.profit_factor,
                b: fmB.profit_factor,
                key: "profit_factor",
              },
              {
                label: "Max Drawdown",
                a: fmA.max_drawdown_pct,
                b: fmB.max_drawdown_pct,
                key: "max_drawdown_pct",
                lower: true,
                suffix: "%",
              },
              {
                label: "Calibration",
                a: fmA.calibration_score,
                b: fmB.calibration_score,
                key: "calibration_score",
              },
              {
                label: "Stability",
                a: fmA.stability_score,
                b: fmB.stability_score,
                key: "stability_score",
              },
              {
                label: "Sortino",
                a: fmA.sortino_ratio,
                b: fmB.sortino_ratio,
                key: "sortino_ratio",
              },
              {
                label: "Info Ratio",
                a: fmA.information_ratio,
                b: fmB.information_ratio,
                key: "information_ratio",
              },
            ].map((row) => {
              const comp = comparisons.find((c) => c.metric === row.key);
              const delta = row.b - row.a;
              const better = row.lower ? delta < 0 : delta > 0;
              const fmt = (v: number) =>
                row.pct
                  ? `${(v * 100).toFixed(1)}%`
                  : `${v.toFixed(2)}${row.suffix ?? ""}`;

              return (
                <div
                  key={row.key}
                  className="grid grid-cols-[120px_1fr_1fr_80px_80px_80px] gap-2 px-2 py-2 items-center rounded hover:bg-muted/20"
                >
                  <span className="text-xs text-muted-foreground">
                    {row.label}
                  </span>
                  <span className="text-xs font-mono text-blue-400">
                    {fmt(row.a)}
                  </span>
                  <span className="text-xs font-mono text-purple-400">
                    {fmt(row.b)}
                  </span>
                  <span
                    className={`text-xs font-mono ${better ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {delta > 0 ? "+" : ""}
                    {row.pct
                      ? `${(delta * 100).toFixed(1)}%`
                      : delta.toFixed(2)}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">
                    {compLoading ? "…" : comp ? comp.p_value.toFixed(3) : "—"}
                  </span>
                  <span>
                    {compLoading ? (
                      <span className="text-[10px] text-muted-foreground">
                        …
                      </span>
                    ) : comp ? (
                      comp.is_significant ? (
                        <Badge
                          variant="outline"
                          className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]"
                        >
                          Yes
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-zinc-500/15 text-zinc-400 border-zinc-500/30 text-[10px]"
                        >
                          No
                        </Badge>
                      )
                    ) : (
                      <span className="text-[10px] text-muted-foreground">
                        —
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Config Diff */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Configuration Differences</CardTitle>
        </CardHeader>
        <CardContent>
          <ConfigDiffTable runA={runA} runB={runB} />
        </CardContent>
      </Card>
    </div>
  );
}

function ConfigDiffTable({
  runA,
  runB,
}: {
  runA: UnifiedTrainingRun;
  runB: UnifiedTrainingRun;
}) {
  const diffs: { key: string; a: string; b: string }[] = [];

  if (runA.config.architecture !== runB.config.architecture) {
    diffs.push({
      key: "Architecture",
      a: runA.config.architecture,
      b: runB.config.architecture,
    });
  }
  if (runA.config.target_variable !== runB.config.target_variable) {
    diffs.push({
      key: "Target",
      a: runA.config.target_variable,
      b: runB.config.target_variable,
    });
  }
  if (runA.config.timeframe !== runB.config.timeframe) {
    diffs.push({
      key: "Timeframe",
      a: runA.config.timeframe,
      b: runB.config.timeframe,
    });
  }

  const allHpKeys = new Set([
    ...Object.keys(runA.config.hyperparameters),
    ...Object.keys(runB.config.hyperparameters),
  ]);
  for (const k of allHpKeys) {
    const va = String(runA.config.hyperparameters[k] ?? "—");
    const vb = String(runB.config.hyperparameters[k] ?? "—");
    if (va !== vb) diffs.push({ key: `hp.${k}`, a: va, b: vb });
  }

  if (diffs.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No configuration differences found.
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {diffs.map((d) => (
        <div
          key={d.key}
          className="grid grid-cols-[140px_1fr_1fr] gap-2 px-2 py-1.5 text-xs rounded hover:bg-muted/20"
        >
          <span className="font-mono text-muted-foreground">{d.key}</span>
          <span className="font-mono text-blue-400">{d.a}</span>
          <span className="font-mono text-purple-400">{d.b}</span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Threshold config for metric coloring
// ---------------------------------------------------------------------------

function thresholds(metric: string): {
  good: number;
  warn: number;
  dir: "higher" | "lower";
} {
  const t: Record<
    string,
    { good: number; warn: number; dir: "higher" | "lower" }
  > = {
    sharpe: { good: 2.0, warn: 1.0, dir: "higher" },
    dir_acc: { good: 65, warn: 55, dir: "higher" },
    pf: { good: 1.5, warn: 1.0, dir: "higher" },
    hit_rate: { good: 60, warn: 50, dir: "higher" },
    sortino: { good: 2.5, warn: 1.0, dir: "higher" },
    ir: { good: 1.0, warn: 0.5, dir: "higher" },
    dd: { good: 10, warn: 20, dir: "lower" },
    cal: { good: 0.9, warn: 0.8, dir: "higher" },
    stability: { good: 0.85, warn: 0.7, dir: "higher" },
  };
  return t[metric] ?? { good: 0, warn: 0, dir: "higher" };
}
