"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  Cpu,
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
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ApiError } from "@/components/ui/api-error";
import {
  Dialog,
  DialogContent,
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
  useCancelUnifiedTrainingRun,
  useCreateUnifiedTrainingRun,
  useModelFamilies,
  useTrainingQueue,
  useUnifiedTrainingRuns,
} from "@/hooks/api/use-ml-models";
import type { UnifiedTrainingRun } from "@/lib/ml-types";

import {
  ML_COMPARE_MAX_OTHER_RUNS,
  RunAnalysisImportanceTab,
  RunAnalysisMetricsTab,
  RunAnalysisQualityTab,
  RunAnalysisRegimesTab,
  RunComparisonView,
} from "../components/run-analysis-sections";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

/** Whether `tab` can be shown for this run (analysis tabs require completed + analysis; Compare needs another run). */
function canShowRunDetailTab(
  run: UnifiedTrainingRun,
  tab: string,
  otherCompletedCount: number,
): boolean {
  if (["config", "features", "data", "logs"].includes(tab)) return true;
  if (run.status !== "completed" || !run.analysis) return false;
  if (tab === "compare") return otherCompletedCount > 0;
  if (["metrics", "importance", "regimes", "quality"].includes(tab))
    return true;
  return false;
}

function generateResourceData(): {
  time: number;
  gpu: number;
  memory: number;
}[] {
  const data = [];
  for (let i = 0; i < 60; i++) {
    data.push({
      time: i,
      gpu: 80 + Math.random() * 15,
      memory: 70 + Math.random() * 10,
    });
  }
  return data;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TrainingPage() {
  const {
    data: runsData,
    isLoading: runsLoading,
    isError: runsIsError,
    error: runsError,
    refetch: refetchRuns,
  } = useUnifiedTrainingRuns();
  const { data: queueData, isLoading: queueLoading } = useTrainingQueue();
  const { data: familiesData } = useModelFamilies();
  const createRun = useCreateUnifiedTrainingRun();
  const cancelRun = useCancelUnifiedTrainingRun();

  function prefillNewRunFromFailed(run: UnifiedTrainingRun) {
    setNewName(`Retry: ${run.name}`);
    setNewFamilyId(run.model_family_id);
    setNewGpu(run.config.gpu_type);
    setNewPriority(run.config.priority);
    setNewOpen(true);
  }

  const runs = React.useMemo(
    () => (Array.isArray(runsData) ? runsData : []) as UnifiedTrainingRun[],
    [runsData],
  );
  const queue = queueData as {
    gpus: {
      gpu_type: string;
      total: number;
      in_use: number;
      available: number;
    }[];
  } | null;

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [detailTab, setDetailTab] = React.useState<string>("config");
  const [filterStatus, setFilterStatus] = React.useState<string>("all");
  const [newOpen, setNewOpen] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [newFamilyId, setNewFamilyId] = React.useState("");
  const [newGpu, setNewGpu] = React.useState("A100-80GB");
  const [newPriority, setNewPriority] = React.useState<
    "low" | "normal" | "high"
  >("normal");

  const families = React.useMemo(() => {
    const raw =
      (familiesData as { data?: { id: string; name: string }[] })?.data ?? [];
    return raw as { id: string; name: string }[];
  }, [familiesData]);

  React.useEffect(() => {
    if (runs.length > 0 && selectedId === null) setSelectedId(runs[0].id);
  }, [runs, selectedId]);

  React.useEffect(() => {
    if (families.length > 0 && !newFamilyId) {
      setNewFamilyId(families[0].id);
    }
  }, [families, newFamilyId]);

  const filteredRuns =
    filterStatus === "all"
      ? runs
      : runs.filter((r) => r.status === filterStatus);
  const selected = runs.find((r) => r.id === selectedId) ?? null;

  const completedRuns = React.useMemo(
    () => runs.filter((r) => r.status === "completed" && r.analysis),
    [runs],
  );

  React.useEffect(() => {
    if (!selected) return;
    const otherCompletedCount = completedRuns.filter(
      (r) => r.id !== selected.id,
    ).length;
    setDetailTab((prev) =>
      canShowRunDetailTab(selected, prev, otherCompletedCount)
        ? prev
        : "config",
    );
  }, [selectedId, selected, completedRuns]);

  const runningCount = runs.filter((r) => r.status === "running").length;
  const queuedCount = runs.filter((r) => r.status === "queued").length;
  const completedCount = runs.filter((r) => r.status === "completed").length;
  const failedCount = runs.filter((r) => r.status === "failed").length;
  const gpuUsed = (queue?.gpus ?? []).reduce((s, g) => s + g.in_use, 0);
  const gpuTotal = Math.max(
    1,
    (queue?.gpus ?? []).reduce((s, g) => s + g.total, 0),
  );

  const resourceData = React.useMemo(() => generateResourceData(), []);

  const pageLoading = runsLoading || queueLoading;

  if (runsIsError) {
    return (
      <div className="min-h-screen bg-background p-6">
        <ApiError
          error={
            runsError instanceof Error
              ? runsError
              : new Error("Failed to load training runs")
          }
          title="Could not load training"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-[1800px] space-y-5 p-6">
        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>New training run</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-1">
              <div className="space-y-1.5">
                <Label htmlFor="run-name">Run name</Label>
                <Input
                  id="run-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. BTC direction — ablation B"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Model family</Label>
                <Select value={newFamilyId} onValueChange={setNewFamilyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select family" />
                  </SelectTrigger>
                  <SelectContent>
                    {families.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>GPU type</Label>
                  <Select value={newGpu} onValueChange={setNewGpu}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A100-80GB">A100-80GB</SelectItem>
                      <SelectItem value="V100-32GB">V100-32GB</SelectItem>
                      <SelectItem value="A10G-24GB">A10G-24GB</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Priority</Label>
                  <Select
                    value={newPriority}
                    onValueChange={(v) =>
                      setNewPriority(v as "low" | "normal" | "high")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setNewOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={createRun.isPending || !newFamilyId}
                onClick={() => {
                  const name =
                    newName.trim() ||
                    `Queued run ${new Date().toISOString().slice(0, 16)}`;
                  createRun.mutate(
                    {
                      name,
                      model_family_id: newFamilyId,
                      config: {
                        gpu_type: newGpu,
                        priority: newPriority,
                      },
                    },
                    {
                      onSuccess: (data) => {
                        const row = data as { id?: string };
                        if (row?.id) setSelectedId(row.id);
                        setNewOpen(false);
                        setNewName("");
                      },
                    },
                  );
                }}
              >
                {createRun.isPending ? "Queueing…" : "Queue run"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* KPI strip + actions (replaces page title row) */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="order-1 flex shrink-0 items-center justify-end gap-2 sm:order-2 sm:pt-0.5">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => void refetchRuns()}
              disabled={pageLoading}
            >
              <RefreshCw className="size-3.5 mr-1.5" />
              Refresh
            </Button>
            <Button size="sm" type="button" onClick={() => setNewOpen(true)}>
              <Play className="size-3.5 mr-1.5" />
              New Run
            </Button>
          </div>
          {pageLoading ? (
            <div className="order-2 grid min-w-0 flex-1 grid-cols-2 gap-3 sm:order-1 sm:grid-cols-3 md:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-[72px] rounded-lg border border-border/50"
                />
              ))}
            </div>
          ) : (
            <div className="order-2 grid min-w-0 flex-1 grid-cols-2 gap-3 sm:order-1 sm:grid-cols-3 md:grid-cols-5">
              {[
                {
                  label: "Running",
                  value: runningCount,
                  icon: Activity,
                  color: "text-blue-400",
                  bg: "bg-blue-500/10",
                },
                {
                  label: "Queued",
                  value: queuedCount,
                  icon: Clock,
                  color: "text-amber-400",
                  bg: "bg-amber-500/10",
                },
                {
                  label: "Completed",
                  value: completedCount,
                  icon: CheckCircle2,
                  color: "text-emerald-400",
                  bg: "bg-emerald-500/10",
                },
                {
                  label: "Failed",
                  value: failedCount,
                  icon: XCircle,
                  color: "text-red-400",
                  bg: "bg-red-500/10",
                },
                {
                  label: "GPUs",
                  value: `${gpuUsed}/${gpuTotal}`,
                  icon: Cpu,
                  color: "text-cyan-400",
                  bg: "bg-cyan-500/10",
                },
              ].map((k) => (
                <Card key={k.label} className="border-border/50 p-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`rounded-md ${k.bg} p-1.5`}>
                      <k.icon className={`size-4 ${k.color}`} />
                    </div>
                    <div>
                      <p className="text-lg font-bold font-mono leading-none">
                        {k.value}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {k.label}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Main Layout: list + detail */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: Run List */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5">
              {["all", "running", "queued", "completed", "failed"].map((s) => (
                <Button
                  key={s}
                  variant={filterStatus === s ? "default" : "ghost"}
                  size="sm"
                  className="h-7 text-xs px-2.5"
                  onClick={() => setFilterStatus(s)}
                >
                  {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                  {s === "running" && runningCount > 0 && (
                    <span className="ml-1 text-[10px] opacity-70">
                      ({runningCount})
                    </span>
                  )}
                  {s === "queued" && queuedCount > 0 && (
                    <span className="ml-1 text-[10px] opacity-70">
                      ({queuedCount})
                    </span>
                  )}
                </Button>
              ))}
            </div>

            <ScrollArea className="h-[calc(100vh-260px)]">
              <div className="space-y-2 pr-2">
                {filteredRuns.map((run) => (
                  <div
                    key={run.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedId === run.id
                        ? "border-primary bg-primary/5"
                        : "border-border/50 hover:bg-muted/30"
                    }`}
                    onClick={() => setSelectedId(run.id)}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-medium text-sm truncate pr-2">
                        {run.name}
                      </span>
                      <StatusBadge status={run.status} />
                    </div>
                    <p className="text-[11px] text-muted-foreground mb-2">
                      {run.model_family_name} · {run.created_by}
                    </p>

                    {run.status === "running" && (
                      <>
                        <Progress value={run.progress} className="h-1.5 mb-1" />
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span className="font-mono">
                            Epoch {run.current_epoch}/{run.total_epochs}
                          </span>
                          <span>ETA: {run.estimated_time_remaining}</span>
                        </div>
                      </>
                    )}
                    {run.status === "completed" && run.financial_metrics && (
                      <div className="flex items-center gap-3 text-[11px]">
                        <span>
                          Sharpe:{" "}
                          <span className="font-mono font-medium text-emerald-400">
                            {run.financial_metrics.sharpe_ratio.toFixed(2)}
                          </span>
                        </span>
                        <span>
                          DirAcc:{" "}
                          <span className="font-mono font-medium">
                            {(
                              run.financial_metrics.directional_accuracy * 100
                            ).toFixed(1)}
                            %
                          </span>
                        </span>
                      </div>
                    )}
                    {run.status === "failed" && run.logs.length > 0 && (
                      <div className="flex items-center gap-1.5 text-[11px] text-red-400">
                        <AlertTriangle className="size-3" />
                        <span className="truncate">{run.logs[0].message}</span>
                      </div>
                    )}
                    {run.status === "queued" && (
                      <p className="text-[11px] text-amber-400">
                        {run.estimated_time_remaining}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Right: Detail Panel */}
          <div className="lg:col-span-2">
            {selected ? (
              <RunDetail
                run={selected}
                detailTab={detailTab}
                onDetailTabChange={setDetailTab}
                completedRuns={completedRuns}
                resourceData={resourceData}
                onRetryPrefill={() => prefillNewRunFromFailed(selected)}
                onCancelRun={() => {
                  cancelRun.mutate(selected.id, {
                    onSuccess: () => {
                      toast.success("Run cancelled");
                    },
                    onError: (err) => {
                      toast.error(
                        err instanceof Error
                          ? err.message
                          : "Could not cancel run",
                      );
                    },
                  });
                }}
                cancelPending={cancelRun.isPending}
              />
            ) : (
              <Card className="border-border/50 h-[600px] flex items-center justify-center text-muted-foreground">
                Select a run to view details
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Run Detail Component
// ---------------------------------------------------------------------------

function RunDetail({
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
  const otherCompleted = React.useMemo(
    () => completedRuns.filter((r) => r.id !== run.id),
    [completedRuns, run.id],
  );
  const [compareRunIds, setCompareRunIds] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (otherCompleted.length === 0) {
      setCompareRunIds([]);
      return;
    }
    setCompareRunIds((prev) => {
      const valid = prev.filter((id) =>
        otherCompleted.some((o) => o.id === id),
      );
      if (valid.length > 0) {
        return valid.slice(0, ML_COMPARE_MAX_OTHER_RUNS);
      }
      return [otherCompleted[0].id];
    });
  }, [run.id, otherCompleted]);

  const compareRuns = React.useMemo(
    () =>
      compareRunIds
        .map((id) => otherCompleted.find((r) => r.id === id))
        .filter((r): r is UnifiedTrainingRun => !!r),
    [compareRunIds, otherCompleted],
  );

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
              {run.config.architecture} · {run.config.gpu_type} ·{" "}
              {run.duration ?? "—"}
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
              { label: "Train Loss", value: run.train_loss.toFixed(4) },
              { label: "Val Loss", value: run.val_loss.toFixed(4) },
              {
                label: "Best Val",
                value: `${run.best_val_loss.toFixed(4)} @${run.best_epoch}`,
              },
              {
                label: run.status === "running" ? "ETA" : "Duration",
                value:
                  run.status === "running"
                    ? (run.estimated_time_remaining ?? "—")
                    : (run.duration ?? "—"),
              },
            ].map((m) => (
              <div
                key={m.label}
                className="text-center p-2 rounded-md bg-muted/30"
              >
                <p className="text-sm font-bold font-mono">{m.value}</p>
                <p className="text-[10px] text-muted-foreground">{m.label}</p>
              </div>
            ))}
          </div>
        )}

        {run.status === "running" && (
          <Progress value={run.progress} className="h-1.5 mb-5" />
        )}

        {/* Detail tabs: config / training data + post-run analysis (value lifted — persists across run selection) */}
        <Tabs
          value={detailTab}
          onValueChange={onDetailTabChange}
          className="w-full"
        >
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
            <TabsTrigger
              value="metrics"
              className="text-xs gap-1"
              disabled={run.status !== "completed" || !analysis}
            >
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
            <TabsTrigger
              value="regimes"
              className="text-xs gap-1"
              disabled={run.status !== "completed" || !analysis}
            >
              <Activity className="size-3.5 shrink-0" />
              Regimes
            </TabsTrigger>
            <TabsTrigger
              value="quality"
              className="text-xs gap-1"
              disabled={run.status !== "completed" || !analysis}
            >
              <Shield className="size-3.5 shrink-0" />
              Quality
            </TabsTrigger>
            <TabsTrigger
              value="compare"
              className="text-xs gap-1"
              disabled={
                run.status !== "completed" ||
                !analysis ||
                otherCompleted.length === 0
              }
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
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Hyperparameters
              </h4>
              <div className="grid grid-cols-3 gap-x-6 gap-y-1.5">
                {Object.entries(run.config.hyperparameters).map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-center justify-between text-xs"
                  >
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
                    [
                      "Window",
                      run.config.walk_forward.expanding_window
                        ? "Expanding"
                        : "Fixed",
                    ],
                    ["Embargo", `${run.config.walk_forward.embargo_days} days`],
                  ].map(([k, v]) => (
                    <div
                      key={k}
                      className="flex items-center justify-between text-xs"
                    >
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
                  <span className="font-mono text-xs font-medium">
                    {f.feature_name}
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono w-fit"
                  >
                    {f.version}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground truncate">
                    {f.parameters_summary}
                  </span>
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
              {run.config.feature_inputs.length} features pinned to exact
              versions for reproducibility
            </p>
          </TabsContent>

          {/* Data Tab */}
          <TabsContent value="data" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-border/50 p-3 space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Training Window
                </h4>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-mono">
                    {run.config.training_window.start}
                  </span>
                  <span className="text-muted-foreground">→</span>
                  <span className="font-mono">
                    {run.config.training_window.end}
                  </span>
                </div>
              </div>
              <div className="rounded-lg border border-border/50 p-3 space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Validation Window
                </h4>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-mono">
                    {run.config.validation_window.start}
                  </span>
                  <span className="text-muted-foreground">→</span>
                  <span className="font-mono">
                    {run.config.validation_window.end}
                  </span>
                </div>
              </div>
            </div>

            <ConfigSection
              title="Instruments"
              items={run.config.instruments.map((inst) => [inst, "Included"])}
            />

            {/* Loss curve + resource charts */}
            {(run.status === "running" || run.status === "completed") && (
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-border/50 p-3">
                  <h4 className="text-xs font-medium mb-2">Loss Curves</h4>
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={lossData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="var(--border)"
                          opacity={0.5}
                        />
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
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--border)"
                            opacity={0.5}
                          />
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
                <p className="text-[10px] text-muted-foreground mb-2">
                  Click to copy storage URI to clipboard
                </p>
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
                      {a.type} · {(a.size / 1_000_000).toFixed(0)}MB
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
                  <p className="text-xs text-muted-foreground">
                    No other completed runs with analysis to compare.
                  </p>
                ) : (
                  <>
                    <p className="text-[10px] text-muted-foreground">
                      This run is the baseline. Select up to{" "}
                      {ML_COMPARE_MAX_OTHER_RUNS} other runs to compare.
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                      {otherCompleted.map((r) => {
                        const checked = compareRunIds.includes(r.id);
                        const atCap =
                          !checked &&
                          compareRunIds.length >= ML_COMPARE_MAX_OTHER_RUNS;
                        return (
                          <label
                            key={r.id}
                            className={`flex items-center gap-2 text-xs cursor-pointer select-none ${atCap ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            <Checkbox
                              checked={checked}
                              disabled={atCap}
                              onCheckedChange={(v) => {
                                const on = v === true;
                                setCompareRunIds((prev) => {
                                  if (on) {
                                    if (prev.includes(r.id)) return prev;
                                    if (
                                      prev.length >= ML_COMPARE_MAX_OTHER_RUNS
                                    )
                                      return prev;
                                    return [...prev, r.id];
                                  }
                                  return prev.filter((id) => id !== r.id);
                                });
                              }}
                            />
                            <span
                              className="truncate max-w-[min(100%,260px)]"
                              title={r.name}
                            >
                              {r.name}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    {compareRuns.length > 0 ? (
                      <RunComparisonView
                        baselineRun={run}
                        compareRuns={compareRuns}
                      />
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Select at least one run to compare.
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

function ConfigSection({
  title,
  items,
}: {
  title: string;
  items: [string, string][];
}) {
  return (
    <div className="rounded-lg border border-border/50 p-3 space-y-2">
      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {title}
      </h4>
      <div className="space-y-1.5">
        {items.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{k}</span>
            <span className="font-mono font-medium text-right max-w-[60%] truncate">
              {v}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function generateSimpleLoss(
  epochs: number,
  finalTrain: number,
  finalVal: number,
) {
  const data = [];
  for (let i = 1; i <= Math.max(epochs, 1); i++) {
    const p = i / Math.max(epochs, 1);
    const decay = Math.exp(-3 * p);
    data.push({
      epoch: i,
      train: Number(
        (
          0.8 * decay +
          finalTrain * (1 - decay) +
          Math.sin(i * 7) * 0.005
        ).toFixed(4),
      ),
      val: Number(
        (
          0.85 * decay +
          finalVal * (1 - decay) +
          Math.sin(i * 5) * 0.008
        ).toFixed(4),
      ),
    });
  }
  return data;
}
