"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  AlertTriangle,
  Ban,
  BarChart3,
  CheckCircle2,
  Clock,
  Download,
  GitCompareArrows,
  HardDrive,
  Layers,
  Play,
  RefreshCw,
  RotateCcw,
  Settings2,
  Shield,
  Terminal,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ApiError } from "@/components/ui/api-error";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { UnifiedTrainingRun } from "@/lib/ml-types";
import { cn } from "@/lib/utils";

import {
  MLCompareSlotPicker,
  ML_COMPARE_MAX_OTHER_RUNS,
  RunAnalysisImportanceTab,
  RunAnalysisMetricsTab,
  RunAnalysisQualityTab,
  RunAnalysisRegimesTab,
  RunComparisonView,
} from "../../components/run-analysis-sections";
import { formatNumber } from "@/lib/utils/formatters";

const STATUS_COLORS: Record<string, string> = {
  running: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  completed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  failed: "bg-red-500/15 text-red-400 border-red-500/30",
  queued: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  cancelled: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  draft: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  running: <RefreshCw className="size-3 animate-spin" />,
  completed: <CheckCircle2 className="size-3" />,
  failed: <XCircle className="size-3" />,
  queued: <Clock className="size-3" />,
  cancelled: <XCircle className="size-3" />,
};

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={`gap-1 ${STATUS_COLORS[status] ?? ""}`}>
      {STATUS_ICONS[status]}
      {status}
    </Badge>
  );
}

function canShowRunDetailTab(run: UnifiedTrainingRun, tab: string, otherCompletedCount: number): boolean {
  if (["config", "features", "data", "logs"].includes(tab)) return true;
  if (run.status !== "completed" || !run.analysis) return false;
  if (tab === "compare") return otherCompletedCount > 0;
  if (["metrics", "importance", "regimes", "quality"].includes(tab)) return true;
  return false;
}

export function RunDetail({
  run,
  detailTab,
  onDetailTabChange,
  completedRuns,
  resourceData,
  onRetryPrefill,
  onCancelRun,
  cancelPending,
}: {
  run: UnifiedTrainingRun;
  detailTab: string;
  onDetailTabChange: (tab: string) => void;
  completedRuns: UnifiedTrainingRun[];
  resourceData: { time: number; gpu: number; memory: number }[];
  onRetryPrefill: () => void;
  onCancelRun: () => void;
  cancelPending: boolean;
}) {
  const lossData =
    run.analysis?.epoch_history?.map((e) => ({
      epoch: e.epoch,
      train: e.train_loss,
      val: e.val_loss,
    })) ?? generateSimpleLoss(run.current_epoch, run.train_loss, run.val_loss);

  const analysis = run.analysis;
  const otherCompleted = React.useMemo(() => completedRuns.filter((r) => r.id !== run.id), [completedRuns, run.id]);
  const [compareSlots, setCompareSlots] = React.useState<(string | null)[]>([]);

  React.useEffect(() => {
    if (otherCompleted.length === 0) {
      setCompareSlots([]);
      return;
    }
    setCompareSlots((prev) =>
      prev.map((id) => (id && otherCompleted.some((o) => o.id === id) ? id : null)).slice(0, ML_COMPARE_MAX_OTHER_RUNS),
    );
  }, [run.id, otherCompleted]);

  const compareRuns = React.useMemo(() => {
    const seen = new Set<string>();
    const out: UnifiedTrainingRun[] = [];
    for (const id of compareSlots) {
      if (!id || seen.has(id)) continue;
      seen.add(id);
      const r = otherCompleted.find((o) => o.id === id);
      if (r) out.push(r);
    }
    return out;
  }, [compareSlots, otherCompleted]);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">{run.name}</CardTitle>
              <StatusBadge status={run.status} />
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {run.config.architecture} · {run.config.gpu_type} · {run.duration ?? "—"}
              {run.status === "completed" && (
                <>
                  {" · "}
                  <Link
                    href={`/services/research/ml/analysis?run=${run.id}`}
                    className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                  >
                    Open full analysis page
                  </Link>
                </>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(run.status === "queued" || run.status === "running") && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                disabled={cancelPending}
                onClick={() => onCancelRun()}
              >
                <Ban className="size-3.5" />
                {cancelPending ? "Cancelling…" : "Cancel run"}
              </Button>
            )}
            {run.status === "failed" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => onRetryPrefill()}
              >
                <RotateCcw className="size-3.5" />
                Retry
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Progress metrics for running/completed */}
        {(run.status === "running" || run.status === "completed") && (
          <div className="grid grid-cols-5 gap-3 mb-5">
            {[
              {
                label: "Epoch",
                value: `${run.current_epoch}/${run.total_epochs}`,
              },
              { label: "Train Loss", value: formatNumber(run.train_loss, 4) },
              { label: "Val Loss", value: formatNumber(run.val_loss, 4) },
              {
                label: "Best Val",
                value: `${formatNumber(run.best_val_loss, 4)} @${run.best_epoch}`,
              },
              {
                label: run.status === "running" ? "ETA" : "Duration",
                value: run.status === "running" ? (run.estimated_time_remaining ?? "—") : (run.duration ?? "—"),
              },
            ].map((m) => (
              <div key={m.label} className="text-center p-2 rounded-md bg-muted/30">
                <p className="text-sm font-bold font-mono">{m.value}</p>
                <p className="text-[10px] text-muted-foreground">{m.label}</p>
              </div>
            ))}
          </div>
        )}

        {run.status === "running" && <Progress value={run.progress} className="h-1.5 mb-5" />}

        {/* Detail tabs: config / training data + post-run analysis (value lifted — persists across run selection) */}
        <Tabs value={detailTab} onValueChange={onDetailTabChange} className="w-full">
          <TabsList className="w-full h-auto min-h-9 flex flex-wrap justify-start gap-1 p-1">
            <TabsTrigger value="config" className="text-xs gap-1">
              <Settings2 className="size-3.5 shrink-0" />
              Config
            </TabsTrigger>
            <TabsTrigger value="features" className="text-xs gap-1">
              <Layers className="size-3.5 shrink-0" />
              Features
            </TabsTrigger>
            <TabsTrigger value="data" className="text-xs gap-1">
              <HardDrive className="size-3.5 shrink-0" />
              Data
            </TabsTrigger>
            <TabsTrigger value="logs" className="text-xs gap-1">
              <Terminal className="size-3.5 shrink-0" />
              Logs
            </TabsTrigger>
            <TabsTrigger value="metrics" className="text-xs gap-1" disabled={run.status !== "completed" || !analysis}>
              <TrendingUp className="size-3.5 shrink-0" />
              Metrics
            </TabsTrigger>
            <TabsTrigger
              value="importance"
              className="text-xs gap-1"
              disabled={run.status !== "completed" || !analysis}
            >
              <BarChart3 className="size-3.5 shrink-0" />
              Importance
            </TabsTrigger>
            <TabsTrigger value="regimes" className="text-xs gap-1" disabled={run.status !== "completed" || !analysis}>
              <Activity className="size-3.5 shrink-0" />
              Regimes
            </TabsTrigger>
            <TabsTrigger value="quality" className="text-xs gap-1" disabled={run.status !== "completed" || !analysis}>
              <Shield className="size-3.5 shrink-0" />
              Quality
            </TabsTrigger>
            <TabsTrigger
              value="compare"
              className="text-xs gap-1"
              disabled={run.status !== "completed" || !analysis || otherCompleted.length === 0}
            >
              <GitCompareArrows className="size-3.5 shrink-0" />
              Compare
            </TabsTrigger>
          </TabsList>

          {/* Config Tab */}
          <TabsContent value="config" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <ConfigSection
                title="Model"
                items={[
                  ["Architecture", run.config.architecture],
                  ["Target Variable", run.config.target_variable],
                  ["Target Type", run.config.target_type.replace(/_/g, " ")],
                  ["Model Family", run.config.model_family_id],
                  ["Version", run.config.version],
                ]}
              />
              <ConfigSection
                title="Training"
                items={[
                  ["GPU Type", run.config.gpu_type],
                  ["Priority", run.config.priority],
                  ["Instruments", run.config.instruments.join(", ")],
                  ["Timeframe", run.config.timeframe],
                  ["Created By", run.config.created_by],
                ]}
              />
            </div>

            <div className="rounded-lg border border-border/50 p-3 space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Hyperparameters</h4>
              <div className="grid grid-cols-3 gap-x-6 gap-y-1.5">
                {Object.entries(run.config.hyperparameters).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-mono">{k}</span>
                    <span className="font-mono font-medium">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>

            {run.config.walk_forward && (
              <div className="rounded-lg border border-border/50 p-3 space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Walk-Forward Validation
                </h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                  {[
                    ["Retrain Every", run.config.walk_forward.retrain_every],
                    ["Window", run.config.walk_forward.expanding_window ? "Expanding" : "Fixed"],
                    ["Embargo", `${run.config.walk_forward.embargo_days} days`],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="font-mono font-medium">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {run.config.version_note && (
              <div className="rounded-md bg-muted/30 p-3 text-xs text-muted-foreground italic">
                {run.config.version_note}
              </div>
            )}
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="mt-4">
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_80px_1fr_80px_140px] gap-2 px-3 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                <span>Feature</span>
                <span>Version</span>
                <span>Parameters</span>
                <span>Freshness</span>
                <span>Last Computed</span>
              </div>
              {run.config.feature_inputs.map((f) => (
                <div
                  key={f.feature_id}
                  className="grid grid-cols-[1fr_80px_1fr_80px_140px] gap-2 px-3 py-2.5 rounded-md border border-border/50 items-center"
                >
                  <span className="font-mono text-xs font-medium">{f.feature_name}</span>
                  <Badge variant="outline" className="text-[10px] font-mono w-fit">
                    {f.version}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground truncate">{f.parameters_summary}</span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] w-fit ${
                      f.freshness_status === "fresh"
                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                        : f.freshness_status === "stale"
                          ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                          : "bg-red-500/15 text-red-400 border-red-500/30"
                    }`}
                  >
                    {f.freshness_status}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {new Date(f.last_computed).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-3">
              {run.config.feature_inputs.length} features pinned to exact versions for reproducibility
            </p>
          </TabsContent>

          {/* Data Tab */}
          <TabsContent value="data" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-border/50 p-3 space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Training Window</h4>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-mono">{run.config.training_window.start}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="font-mono">{run.config.training_window.end}</span>
                </div>
              </div>
              <div className="rounded-lg border border-border/50 p-3 space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Validation Window
                </h4>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-mono">{run.config.validation_window.start}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="font-mono">{run.config.validation_window.end}</span>
                </div>
              </div>
            </div>

            <ConfigSection title="Instruments" items={run.config.instruments.map((inst) => [inst, "Included"])} />

            {/* Loss curve + resource charts */}
            {(run.status === "running" || run.status === "completed") && (
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-border/50 p-3">
                  <h4 className="text-xs font-medium mb-2">Loss Curves</h4>
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={lossData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
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
                          dataKey="train"
                          stroke="var(--chart-3)"
                          strokeWidth={1.5}
                          dot={false}
                          name="Train"
                        />
                        <Line
                          type="monotone"
                          dataKey="val"
                          stroke="var(--chart-5)"
                          strokeWidth={1.5}
                          dot={false}
                          name="Val"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                {run.status === "running" && (
                  <div className="rounded-lg border border-border/50 p-3">
                    <h4 className="text-xs font-medium mb-2">Resource Usage</h4>
                    <div className="h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={resourceData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                          <XAxis
                            dataKey="time"
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
                            domain={[0, 100]}
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
                          <Area
                            type="monotone"
                            dataKey="gpu"
                            stroke="var(--chart-2)"
                            fill="var(--chart-2)"
                            fillOpacity={0.15}
                            strokeWidth={1.5}
                            name="GPU %"
                          />
                          <Area
                            type="monotone"
                            dataKey="memory"
                            stroke="var(--chart-5)"
                            fill="var(--chart-5)"
                            fillOpacity={0.15}
                            strokeWidth={1.5}
                            name="Memory %"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="mt-4 space-y-3">
            <ScrollArea className="h-[300px] rounded-lg border border-border/50 bg-zinc-950 p-3">
              <div className="space-y-1 font-mono text-xs">
                {run.logs.map((log, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-zinc-500 shrink-0 w-[70px]">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span
                      className={`shrink-0 w-[50px] ${
                        log.level === "error"
                          ? "text-red-400"
                          : log.level === "warning"
                            ? "text-amber-400"
                            : "text-zinc-500"
                      }`}
                    >
                      [{log.level.toUpperCase()}]
                    </span>
                    <span
                      className={
                        log.level === "error"
                          ? "text-red-300"
                          : log.level === "warning"
                            ? "text-amber-300"
                            : "text-zinc-300"
                      }
                    >
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {run.artifacts.length > 0 && (
              <div>
                <h4 className="text-xs font-medium mb-2">Artifacts</h4>
                <p className="text-[10px] text-muted-foreground mb-2">Click to copy storage URI to clipboard</p>
                <div className="flex flex-wrap gap-2">
                  {run.artifacts.map((a) => (
                    <Button
                      key={a.id}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-auto gap-1 py-1.5 text-[11px] font-mono"
                      title={a.path}
                      onClick={() => {
                        void navigator.clipboard
                          .writeText(a.path)
                          .then(() => {
                            toast.success("Artifact path copied");
                          })
                          .catch(() => {
                            toast.error("Could not copy path");
                          });
                      }}
                    >
                      <Download className="size-3 shrink-0" />
                      {a.type} · {formatNumber(a.size / 1_000_000, 0)}MB
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {run.status === "completed" && analysis && (
            <>
              <TabsContent value="metrics" className="mt-4">
                <RunAnalysisMetricsTab analysis={analysis} />
              </TabsContent>
              <TabsContent value="importance" className="mt-4">
                <RunAnalysisImportanceTab analysis={analysis} />
              </TabsContent>
              <TabsContent value="regimes" className="mt-4">
                <RunAnalysisRegimesTab analysis={analysis} />
              </TabsContent>
              <TabsContent value="quality" className="mt-4">
                <RunAnalysisQualityTab analysis={analysis} />
              </TabsContent>
              <TabsContent value="compare" className="mt-4 space-y-3">
                {otherCompleted.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No other completed runs with analysis to compare.</p>
                ) : (
                  <>
                    <MLCompareSlotPicker
                      baselineRunId={run.id}
                      baselineName={run.name}
                      candidates={otherCompleted}
                      slots={compareSlots}
                      onSlotsChange={setCompareSlots}
                      maxSlots={ML_COMPARE_MAX_OTHER_RUNS}
                    />
                    {compareRuns.length > 0 ? (
                      <RunComparisonView baselineRun={run} compareRuns={compareRuns} />
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Add at least one comparison slot with <span className="font-medium">+</span> and choose a run to
                        compare.
                      </p>
                    )}
                  </>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function ConfigSection({ title, items }: { title: string; items: [string, string][] }) {
  return (
    <div className="rounded-lg border border-border/50 p-3 space-y-2">
      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</h4>
      <div className="space-y-1.5">
        {items.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{k}</span>
            <span className="font-mono font-medium text-right max-w-[60%] truncate">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function generateSimpleLoss(epochs: number, finalTrain: number, finalVal: number) {
  const data = [];
  for (let i = 1; i <= Math.max(epochs, 1); i++) {
    const p = i / Math.max(epochs, 1);
    const decay = Math.exp(-3 * p);
    data.push({
      epoch: i,
      train: Number((0.8 * decay + finalTrain * (1 - decay) + Math.sin(i * 7) * 0.005).toFixed(4)),
      val: Number((0.85 * decay + finalVal * (1 - decay) + Math.sin(i * 5) * 0.008).toFixed(4)),
    });
  }
  return data;
}
