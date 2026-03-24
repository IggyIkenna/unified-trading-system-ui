"use client";

import * as React from "react";
import { Filter, FlaskConical, GitCompare, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";

import {
  useExperiments,
  useModelFamilies,
  useFeatureProvenance,
  useDatasets,
  useCreateTrainingJob,
} from "@/hooks/api/use-ml-models";
import type {
  Experiment,
  ModelFamily,
  FeatureSetVersion,
  DatasetSnapshot,
} from "@/lib/ml-types";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/components/ui/api-error";
import { EmptyState } from "@/components/ui/empty-state";
import { ExportDropdown } from "@/components/ui/export-dropdown";
import type { ExportColumn } from "@/lib/utils/export";

// ---------------------------------------------------------------------------
// Export columns
// ---------------------------------------------------------------------------

const experimentExportColumns: ExportColumn[] = [
  { key: "name", header: "Name" },
  { key: "modelFamily", header: "Model Family" },
  { key: "status", header: "Status" },
  { key: "accuracy", header: "Accuracy", format: "percent" },
  { key: "sharpe", header: "Sharpe Ratio", format: "number" },
  { key: "loss", header: "Loss", format: "number" },
  { key: "maxDrawdown", header: "Max Drawdown", format: "percent" },
  { key: "directionalAccuracy", header: "Dir. Accuracy", format: "percent" },
  { key: "createdBy", header: "Created By" },
  { key: "createdAt", header: "Created At" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusColor(status: string) {
  switch (status) {
    case "running":
      return "bg-blue-500/15 text-blue-400 border-blue-500/30";
    case "completed":
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    case "failed":
      return "bg-red-500/15 text-red-400 border-red-500/30";
    case "queued":
      return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    case "cancelled":
      return "bg-zinc-500/15 text-zinc-400 border-zinc-500/30";
    case "draft":
      return "bg-zinc-500/15 text-zinc-400 border-zinc-500/30";
    default:
      return "bg-zinc-500/15 text-zinc-400 border-zinc-500/30";
  }
}

function fmtPct(v: number) {
  return `${(v * 100).toFixed(1)}%`;
}

function fmtNum(v: number, decimals = 2) {
  return v.toFixed(decimals);
}

// ---------------------------------------------------------------------------
// Filter State
// ---------------------------------------------------------------------------

interface FilterState {
  familyId: string;
  status: string;
  search: string;
}

const EMPTY_FILTERS: FilterState = {
  familyId: "",
  status: "",
  search: "",
};

// ---------------------------------------------------------------------------
// New Experiment Form
// ---------------------------------------------------------------------------

interface ExperimentFormState {
  familyId: string;
  name: string;
  description: string;
  featureSetId: string;
  datasetId: string;
  epochs: string;
  batchSize: string;
  learningRate: string;
  optimizer: string;
}

const INITIAL_FORM: ExperimentFormState = {
  familyId: "",
  name: "",
  description: "",
  featureSetId: "",
  datasetId: "",
  epochs: "100",
  batchSize: "256",
  learningRate: "0.001",
  optimizer: "AdamW",
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ExperimentsPage() {
  const {
    data: experimentsData,
    isLoading: experimentsLoading,
    isError: experimentsIsError,
    error: experimentsError,
    refetch: experimentsRefetch,
  } = useExperiments();
  const { data: familiesData, isLoading: familiesLoading } = useModelFamilies();
  const { data: featuresData, isLoading: featuresLoading } =
    useFeatureProvenance();
  const { data: datasetsData, isLoading: datasetsLoading } = useDatasets();
  const createJob = useCreateTrainingJob();

  const experiments: Experiment[] =
    (experimentsData as any)?.data ??
    (experimentsData as any)?.experiments ??
    [];
  const modelFamilies: ModelFamily[] =
    (familiesData as any)?.data ?? (familiesData as any)?.families ?? [];
  const featureSetVersions: FeatureSetVersion[] =
    (featuresData as any)?.data ?? (featuresData as any)?.features ?? [];
  const datasetSnapshots: DatasetSnapshot[] =
    (datasetsData as any)?.data ?? (datasetsData as any)?.datasets ?? [];

  const [filters, setFilters] = React.useState<FilterState>(EMPTY_FILTERS);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [form, setForm] = React.useState<ExperimentFormState>(INITIAL_FORM);
  const [compareSet, setCompareSet] = React.useState<Set<string>>(new Set());

  // Filter
  const filtered = experiments.filter((exp) => {
    if (filters.familyId && exp.modelFamilyId !== filters.familyId)
      return false;
    if (filters.status && exp.status !== filters.status) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (
        !exp.name.toLowerCase().includes(q) &&
        !exp.description.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  function toggleCompare(id: string) {
    setCompareSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const experimentColumns: ColumnDef<Experiment, unknown>[] = React.useMemo(
    () => [
      {
        id: "compare",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <button
            onClick={() => toggleCompare(row.original.id)}
            className="p-0.5 rounded hover:bg-muted"
            title={
              compareSet.has(row.original.id)
                ? "Remove from comparison"
                : "Add to comparison"
            }
          >
            <GitCompare
              className={`size-3.5 ${compareSet.has(row.original.id) ? "text-blue-400" : "text-muted-foreground"}`}
            />
          </button>
        ),
      },
      {
        accessorKey: "name",
        header: "Name",
        enableSorting: false,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-sm">{row.original.name}</p>
            <p className="text-[10px] text-muted-foreground font-mono">
              {row.original.id}
            </p>
          </div>
        ),
      },
      {
        id: "family",
        header: "Family",
        enableSorting: false,
        cell: ({ row }) => {
          const family = modelFamilies.find(
            (f) => f.id === row.original.modelFamilyId,
          );
          return (
            <span className="text-muted-foreground text-xs">
              {family?.name ?? row.original.modelFamilyId}
            </span>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <Badge
              variant="outline"
              className={statusColor(row.original.status)}
            >
              {row.original.status}
            </Badge>
            {row.original.status === "running" && (
              <span className="text-xs text-muted-foreground">
                {row.original.progress}%
              </span>
            )}
          </div>
        ),
      },
      {
        id: "accuracy",
        header: "Accuracy",
        accessorFn: (row) => row.metrics?.accuracy ?? -Infinity,
        cell: ({ row }) => (
          <span className="font-mono text-sm">
            {row.original.metrics
              ? fmtPct(row.original.metrics.accuracy)
              : "--"}
          </span>
        ),
      },
      {
        id: "sharpe",
        header: "Sharpe",
        accessorFn: (row) => row.metrics?.sharpe ?? -Infinity,
        cell: ({ row }) => (
          <span className="font-mono text-sm">
            {row.original.metrics ? fmtNum(row.original.metrics.sharpe) : "--"}
          </span>
        ),
      },
      {
        id: "loss",
        header: "Loss",
        accessorFn: (row) => row.metrics?.loss ?? Infinity,
        cell: ({ row }) => (
          <span className="font-mono text-sm">
            {row.original.metrics ? fmtNum(row.original.metrics.loss, 3) : "--"}
          </span>
        ),
      },
      {
        id: "maxDrawdown",
        header: "Max DD",
        accessorFn: (row) => row.metrics?.maxDrawdown ?? Infinity,
        cell: ({ row }) => (
          <span className="font-mono text-sm text-red-400">
            {row.original.metrics
              ? fmtPct(row.original.metrics.maxDrawdown)
              : "--"}
          </span>
        ),
      },
      {
        id: "directionalAccuracy",
        header: "Dir. Acc",
        accessorFn: (row) => row.metrics?.directionalAccuracy ?? -Infinity,
        cell: ({ row }) => (
          <span className="font-mono text-sm">
            {row.original.metrics
              ? fmtPct(row.original.metrics.directionalAccuracy)
              : "--"}
          </span>
        ),
      },
      {
        accessorKey: "createdBy",
        header: "Created By",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-muted-foreground text-xs">
            {row.original.createdBy}
          </span>
        ),
      },
    ],
     
    [compareSet, modelFamilies],
  );

  function handleSubmitExperiment() {
    if (!form.familyId || !form.name) return;

    createJob.mutate({
      name: form.name,
      description: form.description || "New experiment",
      modelFamilyId: form.familyId,
      datasetSnapshotId: form.datasetId || "ds-auto-latest",
      featureSetVersionId: form.featureSetId || "fs-auto-latest",
      hyperparameters: {
        learning_rate: parseFloat(form.learningRate),
        batch_size: parseInt(form.batchSize),
        optimizer: form.optimizer,
      },
      trainingConfig: {
        epochs: parseInt(form.epochs),
        batchSize: parseInt(form.batchSize),
        learningRate: parseFloat(form.learningRate),
        optimizer: form.optimizer,
        lossFunction: "CrossEntropyWithLabelSmoothing",
        earlyStopping: true,
        earlyStoppingPatience: 15,
        gpuType: "A100",
        numGpus: 4,
      },
    });
    setForm(INITIAL_FORM);
    setDialogOpen(false);
  }

  const isLoading =
    experimentsLoading || familiesLoading || featuresLoading || datasetsLoading;
  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const compareExps = experiments.filter(
    (e) => compareSet.has(e.id) && e.metrics,
  );

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (experimentsIsError) {
    return (
      <div className="p-6">
        <ApiError
          error={experimentsError}
          onRetry={() => experimentsRefetch()}
        />
      </div>
    );
  }

  if (experiments.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          title="No experiments"
          description="Start your first ML experiment to begin tracking model performance."
          action={{
            label: "New Experiment",
            onClick: () => setDialogOpen(true),
          }}
          icon={FlaskConical}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Experiment Tracking
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {filtered.length} experiments &middot;{" "}
              {experiments.filter((e) => e.status === "running").length} running
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ExportDropdown
              data={filtered.map((exp) => {
                const family = modelFamilies.find(
                  (f) => f.id === exp.modelFamilyId,
                );
                return {
                  name: exp.name,
                  modelFamily: family?.name ?? exp.modelFamilyId,
                  status: exp.status,
                  accuracy: exp.metrics?.accuracy ?? null,
                  sharpe: exp.metrics?.sharpe ?? null,
                  loss: exp.metrics?.loss ?? null,
                  maxDrawdown: exp.metrics?.maxDrawdown ?? null,
                  directionalAccuracy: exp.metrics?.directionalAccuracy ?? null,
                  createdBy: exp.createdBy,
                  createdAt: exp.createdAt,
                } as Record<string, unknown>;
              })}
              columns={experimentExportColumns}
              filename="ml-experiments"
            />
            <Button onClick={() => setDialogOpen(true)}>
              <FlaskConical className="size-4" />
              New Experiment
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <Card className="border-border/50">
          <CardContent className="pt-0">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium">
                <Filter className="size-3.5" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0"
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </div>

              <Select
                value={filters.familyId}
                onValueChange={(v) =>
                  setFilters((f) => ({
                    ...f,
                    familyId: v === "__all__" ? "" : v,
                  }))
                }
              >
                <SelectTrigger size="sm" className="w-48">
                  <SelectValue placeholder="Model Family" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Families</SelectItem>
                  {modelFamilies.map((fam) => (
                    <SelectItem key={fam.id} value={fam.id}>
                      {fam.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.status}
                onValueChange={(v) =>
                  setFilters((f) => ({
                    ...f,
                    status: v === "__all__" ? "" : v,
                  }))
                }
              >
                <SelectTrigger size="sm" className="w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Status</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="queued">Queued</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search experiments..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, search: e.target.value }))
                  }
                  className="pl-8 h-8 text-sm"
                />
              </div>

              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilters(EMPTY_FILTERS)}
                >
                  <X className="size-3" />
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Experiment Table */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FlaskConical className="size-4" />
              Experiments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={experimentColumns}
              data={filtered}
              emptyMessage="No experiments found"
            />
          </CardContent>
        </Card>

        {/* Side-by-Side Comparison */}
        {compareExps.length >= 2 && (
          <Card className="border-blue-500/30 bg-blue-500/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <GitCompare className="size-4 text-blue-400" />
                  Experiment Comparison ({compareExps.length})
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCompareSet(new Set())}
                >
                  <X className="size-3" />
                  Clear
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-2 pr-4 text-xs text-muted-foreground font-medium">
                        Metric
                      </th>
                      {compareExps.map((exp) => (
                        <th
                          key={exp.id}
                          className="text-right py-2 px-3 text-xs text-muted-foreground font-medium min-w-[120px]"
                        >
                          {exp.name.length > 25
                            ? `${exp.name.slice(0, 25)}...`
                            : exp.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(
                      [
                        { key: "accuracy", label: "Accuracy", fmt: fmtPct },
                        {
                          key: "sharpe",
                          label: "Sharpe",
                          fmt: (v: number) => fmtNum(v),
                        },
                        {
                          key: "loss",
                          label: "Loss",
                          fmt: (v: number) => fmtNum(v, 3),
                        },
                        {
                          key: "directionalAccuracy",
                          label: "Dir. Accuracy",
                          fmt: fmtPct,
                        },
                        {
                          key: "maxDrawdown",
                          label: "Max Drawdown",
                          fmt: fmtPct,
                        },
                        {
                          key: "calibration",
                          label: "Calibration",
                          fmt: fmtPct,
                        },
                        { key: "precision", label: "Precision", fmt: fmtPct },
                        { key: "recall", label: "Recall", fmt: fmtPct },
                        {
                          key: "stabilityScore",
                          label: "Stability",
                          fmt: fmtPct,
                        },
                      ] as const
                    ).map((metric) => {
                      const values = compareExps.map(
                        (e) =>
                          e.metrics![
                            metric.key as keyof typeof e.metrics
                          ] as number,
                      );
                      const best =
                        metric.key === "loss" || metric.key === "maxDrawdown"
                          ? Math.min(...values)
                          : Math.max(...values);

                      return (
                        <tr
                          key={metric.key}
                          className="border-b border-border/30"
                        >
                          <td className="py-2 pr-4 text-muted-foreground text-xs">
                            {metric.label}
                          </td>
                          {compareExps.map((exp) => {
                            const val = exp.metrics![
                              metric.key as keyof typeof exp.metrics
                            ] as number;
                            const isBest = val === best;
                            return (
                              <td
                                key={exp.id}
                                className={`text-right py-2 px-3 font-mono ${isBest ? "text-emerald-400 font-bold" : ""}`}
                              >
                                {metric.fmt(val)}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {compareExps.length === 1 && (
          <Card className="border-blue-500/30 bg-blue-500/5">
            <CardContent className="flex items-center justify-center py-6">
              <p className="text-sm text-muted-foreground">
                Select at least 2 experiments to compare side-by-side
              </p>
            </CardContent>
          </Card>
        )}

        {/* New Experiment Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>New Experiment</DialogTitle>
              <DialogDescription>
                Configure model type, features, target, and hyperparameters.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Model Family</Label>
                <Select
                  value={form.familyId}
                  onValueChange={(v) => setForm((f) => ({ ...f, familyId: v }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select model family..." />
                  </SelectTrigger>
                  <SelectContent>
                    {modelFamilies.map((fam) => (
                      <SelectItem key={fam.id} value={fam.id}>
                        {fam.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Experiment Name</Label>
                <Input
                  placeholder="e.g., ETH Vol - Larger Context Window"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  placeholder="Brief description of hypothesis..."
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Feature Set</Label>
                  <Select
                    value={form.featureSetId}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, featureSetId: v }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {featureSetVersions.map((fs) => (
                        <SelectItem key={fs.id} value={fs.id}>
                          {fs.name} v{fs.version}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Dataset</Label>
                  <Select
                    value={form.datasetId}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, datasetId: v }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {datasetSnapshots.map((ds) => (
                        <SelectItem key={ds.id} value={ds.id}>
                          {ds.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-lg border border-border/50 p-3 space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Hyperparameters
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Epochs</Label>
                    <Input
                      type="number"
                      value={form.epochs}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, epochs: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Batch Size</Label>
                    <Input
                      type="number"
                      value={form.batchSize}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, batchSize: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Learning Rate</Label>
                    <Input
                      type="number"
                      step="0.0001"
                      value={form.learningRate}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, learningRate: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Optimizer</Label>
                    <Select
                      value={form.optimizer}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, optimizer: v }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AdamW">AdamW</SelectItem>
                        <SelectItem value="Adam">Adam</SelectItem>
                        <SelectItem value="SGD">SGD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmitExperiment}
                disabled={!form.familyId || !form.name}
              >
                <FlaskConical className="size-4" />
                Create Experiment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
