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
import {
  useCancelUnifiedTrainingRun,
  useCreateUnifiedTrainingRun,
  useModelFamilies,
  useUnifiedTrainingRuns,
} from "@/hooks/api/use-ml-models";
import type { UnifiedTrainingRun } from "@/lib/types/ml";
import { mockRange } from "@/lib/mocks/generators/deterministic";
import { cn } from "@/lib/utils";

import { RunDetail } from "./components/training-run-detail";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";

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

/** Run-list filter chips: distinct hues + always-readable text (inactive + hover). */
const RUN_FILTER_CHIP: Record<
  "all" | "running" | "queued" | "completed" | "failed",
  { active: string; inactive: string }
> = {
  all: {
    active: "border-primary bg-primary text-primary-foreground hover:bg-primary/90",
    inactive:
      "border-zinc-500/60 bg-zinc-900/90 text-zinc-100 hover:border-zinc-400 hover:bg-zinc-800 hover:text-white",
  },
  running: {
    active: "border-blue-500 bg-blue-600 text-white shadow-sm hover:bg-blue-600/90",
    inactive:
      "border-blue-500/45 bg-blue-950/60 text-blue-100 hover:border-blue-400/70 hover:bg-blue-900/70 hover:text-white",
  },
  queued: {
    active: "border-amber-500 bg-amber-500 text-zinc-950 shadow-sm hover:bg-amber-500/90",
    inactive:
      "border-amber-500/45 bg-amber-950/50 text-amber-100 hover:border-amber-400/60 hover:bg-amber-950/80 hover:text-amber-50",
  },
  completed: {
    active: "border-emerald-500 bg-emerald-600 text-white shadow-sm hover:bg-emerald-600/90",
    inactive:
      "border-emerald-500/45 bg-emerald-950/55 text-emerald-100 hover:border-emerald-400/60 hover:bg-emerald-900/60 hover:text-white",
  },
  failed: {
    active: "border-red-500 bg-red-600 text-white shadow-sm hover:bg-red-600/90",
    inactive:
      "border-red-500/45 bg-red-950/55 text-red-100 hover:border-red-400/60 hover:bg-red-900/60 hover:text-white",
  },
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
function canShowRunDetailTab(run: UnifiedTrainingRun, tab: string, otherCompletedCount: number): boolean {
  if (["config", "features", "data", "logs"].includes(tab)) return true;
  if (run.status !== "completed" || !run.analysis) return false;
  if (tab === "compare") return otherCompletedCount > 0;
  if (["metrics", "importance", "regimes", "quality"].includes(tab)) return true;
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
      gpu: mockRange(80, 95, i, 1),
      memory: mockRange(70, 80, i, 2),
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

  const runs = React.useMemo(() => (Array.isArray(runsData) ? runsData : []) as UnifiedTrainingRun[], [runsData]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [detailTab, setDetailTab] = React.useState<string>("config");
  const [filterStatus, setFilterStatus] = React.useState<string>("all");
  const [newOpen, setNewOpen] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [newFamilyId, setNewFamilyId] = React.useState("");
  const [newGpu, setNewGpu] = React.useState("A100-80GB");
  const [newPriority, setNewPriority] = React.useState<"low" | "normal" | "high">("normal");

  const families = React.useMemo(() => {
    const raw = (familiesData as { data?: { id: string; name: string }[] })?.data ?? [];
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

  const filteredRuns = filterStatus === "all" ? runs : runs.filter((r) => r.status === filterStatus);
  const selected = runs.find((r) => r.id === selectedId) ?? null;

  const completedRuns = React.useMemo(() => runs.filter((r) => r.status === "completed" && r.analysis), [runs]);

  React.useEffect(() => {
    if (!selected) return;
    const otherCompletedCount = completedRuns.filter((r) => r.id !== selected.id).length;
    setDetailTab((prev) => (canShowRunDetailTab(selected, prev, otherCompletedCount) ? prev : "config"));
  }, [selectedId, selected, completedRuns]);

  const runningCount = runs.filter((r) => r.status === "running").length;
  const queuedCount = runs.filter((r) => r.status === "queued").length;
  const completedCount = runs.filter((r) => r.status === "completed").length;
  const failedCount = runs.filter((r) => r.status === "failed").length;

  const resourceData = React.useMemo(() => generateResourceData(), []);

  if (runsIsError) {
    return (
      <div className="min-h-screen bg-background p-6">
        <ApiError
          error={runsError instanceof Error ? runsError : new Error("Failed to load training runs")}
          title="Could not load training"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="platform-page-width space-y-5 p-6">
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
                  <Select value={newPriority} onValueChange={(v) => setNewPriority(v as "low" | "normal" | "high")}>
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
              <Button type="button" variant="outline" onClick={() => setNewOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                disabled={createRun.isPending || !newFamilyId}
                onClick={() => {
                  const name = newName.trim() || `Queued run ${new Date().toISOString().slice(0, 16)}`;
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

        {/* Main Layout: list + detail */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: Run List */}
          <div className="space-y-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
              <div className="grid min-w-0 flex-1 grid-cols-2 gap-2 min-[520px]:grid-cols-3 xl:grid-cols-5">
                {[
                  {
                    key: "all" as const,
                    label: "All",
                    count: undefined as number | undefined,
                  },
                  {
                    key: "running" as const,
                    label: "Running",
                    count: runningCount,
                  },
                  {
                    key: "queued" as const,
                    label: "Queued",
                    count: queuedCount,
                  },
                  {
                    key: "completed" as const,
                    label: "Completed",
                    count: completedCount,
                  },
                  {
                    key: "failed" as const,
                    label: "Failed",
                    count: failedCount,
                  },
                ].map(({ key, label, count }) => {
                  const chip = RUN_FILTER_CHIP[key];
                  const selected = filterStatus === key;
                  return (
                    <Button
                      key={key}
                      type="button"
                      variant="ghost"
                      className={cn(
                        "h-11 justify-center border px-3 text-sm font-medium shadow-none sm:px-4",
                        selected ? chip.active : chip.inactive,
                      )}
                      onClick={() => setFilterStatus(key)}
                    >
                      <span className="truncate">{label}</span>
                      {count !== undefined && count > 0 && (
                        <span className="ml-1.5 tabular-nums text-xs opacity-90">({count})</span>
                      )}
                    </Button>
                  );
                })}
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 lg:pt-0.5">
                <Button
                  variant="outline"
                  type="button"
                  size="icon"
                  className="size-11 shrink-0"
                  aria-label="Refresh training runs"
                  title="Refresh"
                  onClick={() => void refetchRuns()}
                  disabled={runsLoading}
                >
                  <RefreshCw className="size-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  className="size-11 shrink-0"
                  aria-label="New training run"
                  title="New run"
                  onClick={() => setNewOpen(true)}
                >
                  <Play className="size-4" />
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[calc(100vh-220px)]">
              <div className="space-y-2 pr-2">
                {filteredRuns.map((run) => (
                  <div
                    key={run.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedId === run.id ? "border-primary bg-primary/5" : "border-border/50 hover:bg-muted/30"
                    }`}
                    onClick={() => setSelectedId(run.id)}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-medium text-sm truncate pr-2">{run.name}</span>
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
                            {formatNumber(run.financial_metrics.sharpe_ratio, 2)}
                          </span>
                        </span>
                        <span>
                          DirAcc:{" "}
                          <span className="font-mono font-medium">
                            {formatPercent(run.financial_metrics.directional_accuracy * 100, 1)}
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
                      <p className="text-[11px] text-amber-400">{run.estimated_time_remaining}</p>
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
                      toast.error(err instanceof Error ? err.message : "Could not cancel run");
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
