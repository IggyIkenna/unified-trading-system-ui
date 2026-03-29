"use client";

import { PageHeader } from "@/components/platform/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, BarChart3, GitCompareArrows, Layers, Shield, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import * as React from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ApiError } from "@/components/ui/api-error";
import { Skeleton } from "@/components/ui/skeleton";
import { useUnifiedTrainingRuns } from "@/hooks/api/use-ml-models";
import type { RunAnalysis, UnifiedTrainingRun } from "@/lib/ml-types";

import {
  MLCompareSlotPicker,
  ML_COMPARE_MAX_OTHER_RUNS,
  RunAnalysisImportanceTab,
  RunAnalysisMetricsTab,
  RunAnalysisQualityTab,
  RunAnalysisRegimesTab,
  RunComparisonView,
} from "../components/run-analysis-sections";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AnalysisPage() {
  return (
    <React.Suspense fallback={<div className="p-6 text-muted-foreground">Loading analysis...</div>}>
      <AnalysisContent />
    </React.Suspense>
  );
}

function AnalysisContent() {
  const searchParams = useSearchParams();
  const preselectedRun = searchParams.get("run");

  const { data: runsData, isLoading: runsLoading, isError: runsIsError, error: runsError } = useUnifiedTrainingRuns();

  const runs = React.useMemo(() => (Array.isArray(runsData) ? runsData : []) as UnifiedTrainingRun[], [runsData]);
  const completedRuns = React.useMemo(() => runs.filter((r) => r.status === "completed" && r.analysis), [runs]);

  const [selectedRunId, setSelectedRunId] = React.useState<string>("");
  const [compareMode, setCompareMode] = React.useState(false);
  /** Each slot is null until a run is chosen from the dropdown. */
  const [compareSlots, setCompareSlots] = React.useState<(string | null)[]>([]);

  React.useEffect(() => {
    if (completedRuns.length === 0) return;
    const pick =
      preselectedRun && completedRuns.some((r) => r.id === preselectedRun) ? preselectedRun : completedRuns[0].id;
    setSelectedRunId((cur) => (cur && completedRuns.some((r) => r.id === cur) ? cur : pick));
  }, [completedRuns, preselectedRun]);

  React.useEffect(() => {
    if (!compareMode) return;
    const others = completedRuns.filter((r) => r.id !== selectedRunId);
    setCompareSlots((prev) =>
      prev.map((id) => (id && others.some((o) => o.id === id) ? id : null)).slice(0, ML_COMPARE_MAX_OTHER_RUNS),
    );
  }, [compareMode, selectedRunId, completedRuns]);

  const selectedRun = completedRuns.find((r) => r.id === selectedRunId);
  const analysis = selectedRun?.analysis;
  const compareRuns = React.useMemo(() => {
    const others = completedRuns.filter((r) => r.id !== selectedRunId);
    const seen = new Set<string>();
    const out: UnifiedTrainingRun[] = [];
    for (const id of compareSlots) {
      if (!id || seen.has(id)) continue;
      seen.add(id);
      const r = others.find((o) => o.id === id);
      if (r) out.push(r);
    }
    return out;
  }, [compareSlots, completedRuns, selectedRunId]);

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
          error={runsError instanceof Error ? runsError : new Error("Failed to load runs")}
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
          <h2 className="text-lg font-semibold">No completed runs to analyze</h2>
          <p className="text-sm text-muted-foreground">Complete a training run first, then return here for analysis.</p>
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
      <div className="platform-page-width space-y-5 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/services/research/ml">
              <Button variant="ghost" size="icon" className="size-8">
                <ArrowLeft className="size-4" />
              </Button>
            </Link>
            <PageHeader title="Analysis" description="Post-training research, evaluation, and comparison" />
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
                if (!compareMode) {
                  setCompareSlots([]);
                }
              }}
            >
              <GitCompareArrows className="size-3.5" />
              {compareMode ? "Exit Compare" : "Compare"}
            </Button>
          </div>
        </div>

        {/* Compare mode selector */}
        {compareMode && selectedRun && (
          <div className="p-3 rounded-lg border border-purple-500/30 bg-purple-500/5">
            <MLCompareSlotPicker
              baselineRunId={selectedRun.id}
              baselineName={selectedRun.name}
              candidates={completedRuns.filter((r) => r.id !== selectedRun.id)}
              slots={compareSlots}
              onSlotsChange={setCompareSlots}
              maxSlots={ML_COMPARE_MAX_OTHER_RUNS}
            />
          </div>
        )}

        {compareMode && compareRuns.length > 0 ? (
          <RunComparisonView baselineRun={selectedRun!} compareRuns={compareRuns} />
        ) : compareMode ? (
          <Card className="border-border/50 p-8 text-center text-muted-foreground">
            <p className="text-sm">
              Use <span className="font-medium">+</span> above and pick a run from the dropdown to compare against the
              baseline.
            </p>
          </Card>
        ) : analysis ? (
          <SingleRunAnalysis analysis={analysis} />
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
// Single Run Analysis (scrollable dashboard; sections shared with Training tabs)
// ---------------------------------------------------------------------------

function SingleRunAnalysis({ analysis }: { analysis: RunAnalysis }) {
  const fm = analysis.financial_metrics;

  return (
    <div className="space-y-5">
      {fm && (
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="size-4" />
              Financial Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RunAnalysisMetricsTab analysis={analysis} />
          </CardContent>
        </Card>
      )}

      {analysis.feature_importance.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Layers className="size-4" />
              Feature Importance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RunAnalysisImportanceTab analysis={analysis} />
          </CardContent>
        </Card>
      )}

      {(analysis.regime_performance.length > 0 || analysis.walk_forward_folds.length > 0) && (
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="size-4" />
              Regimes & walk-forward
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RunAnalysisRegimesTab analysis={analysis} />
          </CardContent>
        </Card>
      )}

      {(analysis.prediction_distribution || analysis.data_integrity_checks.length > 0) && (
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="size-4" />
              Calibration & integrity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RunAnalysisQualityTab analysis={analysis} />
          </CardContent>
        </Card>
      )}

      {analysis.epoch_history.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Training Loss Curves</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={analysis.epoch_history.filter((_, i) => i % 3 === 0 || i === analysis.epoch_history.length - 1)}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                  <XAxis
                    dataKey="epoch"
                    tick={{
                      fill: "var(--foreground)",
                      fontSize: 10,
                    }}
                  />
                  <YAxis
                    tick={{
                      fill: "var(--foreground)",
                      fontSize: 10,
                    }}
                    domain={["auto", "auto"]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--background)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      fontSize: "11px",
                      color: "var(--foreground)",
                    }}
                    labelStyle={{ color: "var(--foreground)" }}
                    itemStyle={{ color: "var(--muted-foreground)" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="train_loss"
                    stroke="var(--chart-3)"
                    strokeWidth={1.5}
                    dot={false}
                    name="Train"
                  />
                  <Line
                    type="monotone"
                    dataKey="val_loss"
                    stroke="var(--chart-5)"
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
