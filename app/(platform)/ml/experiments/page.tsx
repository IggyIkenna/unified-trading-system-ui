"use client"

import * as React from "react"
import {
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Filter,
  FlaskConical,
  GitCompare,
  Play,
  Search,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { EXPERIMENTS, MODEL_FAMILIES, FEATURE_SET_VERSIONS, DATASET_SNAPSHOTS } from "@/lib/ml-mock-data"
import type { Experiment } from "@/lib/ml-types"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusColor(status: string) {
  switch (status) {
    case "running":
      return "bg-blue-500/15 text-blue-400 border-blue-500/30"
    case "completed":
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
    case "failed":
      return "bg-red-500/15 text-red-400 border-red-500/30"
    case "queued":
      return "bg-amber-500/15 text-amber-400 border-amber-500/30"
    case "cancelled":
      return "bg-zinc-500/15 text-zinc-400 border-zinc-500/30"
    case "draft":
      return "bg-zinc-500/15 text-zinc-400 border-zinc-500/30"
    default:
      return "bg-zinc-500/15 text-zinc-400 border-zinc-500/30"
  }
}

function fmtPct(v: number) {
  return `${(v * 100).toFixed(1)}%`
}

function fmtNum(v: number, decimals = 2) {
  return v.toFixed(decimals)
}

type SortField = "accuracy" | "sharpe" | "loss" | "maxDrawdown" | "directionalAccuracy"

// ---------------------------------------------------------------------------
// Filter State
// ---------------------------------------------------------------------------

interface FilterState {
  familyId: string
  status: string
  search: string
}

const EMPTY_FILTERS: FilterState = {
  familyId: "",
  status: "",
  search: "",
}

// ---------------------------------------------------------------------------
// New Experiment Form
// ---------------------------------------------------------------------------

interface ExperimentFormState {
  familyId: string
  name: string
  description: string
  featureSetId: string
  datasetId: string
  epochs: string
  batchSize: string
  learningRate: string
  optimizer: string
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
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ExperimentsPage() {
  const [experiments, setExperiments] = React.useState<Experiment[]>(EXPERIMENTS)
  const [filters, setFilters] = React.useState<FilterState>(EMPTY_FILTERS)
  const [sortField, setSortField] = React.useState<SortField>("sharpe")
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc")
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [form, setForm] = React.useState<ExperimentFormState>(INITIAL_FORM)
  const [compareSet, setCompareSet] = React.useState<Set<string>>(new Set())

  // Filter
  const filtered = experiments.filter((exp) => {
    if (filters.familyId && exp.modelFamilyId !== filters.familyId) return false
    if (filters.status && exp.status !== filters.status) return false
    if (filters.search) {
      const q = filters.search.toLowerCase()
      if (!exp.name.toLowerCase().includes(q) && !exp.description.toLowerCase().includes(q))
        return false
    }
    return true
  })

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (!a.metrics && !b.metrics) return 0
    if (!a.metrics) return 1
    if (!b.metrics) return -1
    const aM = a.metrics
    const bM = b.metrics
    let aV: number, bV: number
    switch (sortField) {
      case "accuracy":
        aV = aM.accuracy; bV = bM.accuracy; break
      case "sharpe":
        aV = aM.sharpe; bV = bM.sharpe; break
      case "loss":
        aV = aM.loss; bV = bM.loss; break
      case "maxDrawdown":
        aV = aM.maxDrawdown; bV = bM.maxDrawdown; break
      case "directionalAccuracy":
        aV = aM.directionalAccuracy; bV = bM.directionalAccuracy; break
    }
    return sortDir === "desc" ? bV - aV : aV - bV
  })

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"))
    } else {
      setSortField(field)
      setSortDir(field === "loss" || field === "maxDrawdown" ? "asc" : "desc")
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ArrowUpDown className="size-3 opacity-30" />
    return sortDir === "desc" ? (
      <ChevronDown className="size-3" />
    ) : (
      <ChevronUp className="size-3" />
    )
  }

  function toggleCompare(id: string) {
    setCompareSet((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function handleSubmitExperiment() {
    if (!form.familyId || !form.name) return

    const newExp: Experiment = {
      id: `exp-${Date.now()}`,
      name: form.name,
      description: form.description || "New experiment",
      modelFamilyId: form.familyId,
      status: "queued",
      progress: 0,
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
      metrics: null,
      startedAt: null,
      completedAt: null,
      createdBy: "current_user",
      createdAt: new Date().toISOString(),
    }

    setExperiments((prev) => [newExp, ...prev])
    setForm(INITIAL_FORM)
    setDialogOpen(false)
  }

  const activeFilterCount = Object.values(filters).filter(Boolean).length
  const compareExps = experiments.filter((e) => compareSet.has(e.id) && e.metrics)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Experiment Tracking</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {filtered.length} experiments &middot;{" "}
              {experiments.filter((e) => e.status === "running").length} running
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <FlaskConical className="size-4" />
            New Experiment
          </Button>
        </div>

        {/* Filter Bar */}
        <Card className="border-border/50">
          <CardContent className="pt-0">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium">
                <Filter className="size-3.5" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {activeFilterCount}
                  </Badge>
                )}
              </div>

              <Select
                value={filters.familyId}
                onValueChange={(v) => setFilters((f) => ({ ...f, familyId: v === "__all__" ? "" : v }))}
              >
                <SelectTrigger size="sm" className="w-48">
                  <SelectValue placeholder="Model Family" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Families</SelectItem>
                  {MODEL_FAMILIES.map((fam) => (
                    <SelectItem key={fam.id} value={fam.id}>
                      {fam.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.status}
                onValueChange={(v) => setFilters((f) => ({ ...f, status: v === "__all__" ? "" : v }))}
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
                  onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                  className="pl-8 h-8 text-sm"
                />
              </div>

              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setFilters(EMPTY_FILTERS)}>
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
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="text-xs text-muted-foreground w-8"></TableHead>
                  <TableHead className="text-xs text-muted-foreground">Name</TableHead>
                  <TableHead className="text-xs text-muted-foreground">Family</TableHead>
                  <TableHead className="text-xs text-muted-foreground">Status</TableHead>
                  <TableHead
                    className="text-xs text-muted-foreground cursor-pointer select-none"
                    onClick={() => handleSort("accuracy")}
                  >
                    <span className="flex items-center gap-1">
                      Accuracy <SortIcon field="accuracy" />
                    </span>
                  </TableHead>
                  <TableHead
                    className="text-xs text-muted-foreground cursor-pointer select-none"
                    onClick={() => handleSort("sharpe")}
                  >
                    <span className="flex items-center gap-1">
                      Sharpe <SortIcon field="sharpe" />
                    </span>
                  </TableHead>
                  <TableHead
                    className="text-xs text-muted-foreground cursor-pointer select-none"
                    onClick={() => handleSort("loss")}
                  >
                    <span className="flex items-center gap-1">
                      Loss <SortIcon field="loss" />
                    </span>
                  </TableHead>
                  <TableHead
                    className="text-xs text-muted-foreground cursor-pointer select-none"
                    onClick={() => handleSort("maxDrawdown")}
                  >
                    <span className="flex items-center gap-1">
                      Max DD <SortIcon field="maxDrawdown" />
                    </span>
                  </TableHead>
                  <TableHead
                    className="text-xs text-muted-foreground cursor-pointer select-none"
                    onClick={() => handleSort("directionalAccuracy")}
                  >
                    <span className="flex items-center gap-1">
                      Dir. Acc <SortIcon field="directionalAccuracy" />
                    </span>
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground">Created By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((exp) => {
                  const m = exp.metrics
                  const family = MODEL_FAMILIES.find((f) => f.id === exp.modelFamilyId)
                  return (
                    <TableRow
                      key={exp.id}
                      className={`border-border/30 ${compareSet.has(exp.id) ? "bg-blue-500/5" : ""}`}
                    >
                      <TableCell>
                        <button
                          onClick={() => toggleCompare(exp.id)}
                          className="p-0.5 rounded hover:bg-muted"
                          title={
                            compareSet.has(exp.id) ? "Remove from comparison" : "Add to comparison"
                          }
                        >
                          <GitCompare
                            className={`size-3.5 ${compareSet.has(exp.id) ? "text-blue-400" : "text-muted-foreground"}`}
                          />
                        </button>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{exp.name}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{exp.id}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {family?.name ?? exp.modelFamilyId}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className={statusColor(exp.status)}>
                            {exp.status}
                          </Badge>
                          {exp.status === "running" && (
                            <span className="text-xs text-muted-foreground">{exp.progress}%</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {m ? fmtPct(m.accuracy) : "--"}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {m ? fmtNum(m.sharpe) : "--"}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {m ? fmtNum(m.loss, 3) : "--"}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-red-400">
                        {m ? fmtPct(m.maxDrawdown) : "--"}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {m ? fmtPct(m.directionalAccuracy) : "--"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {exp.createdBy}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
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
                          {exp.name.length > 25 ? `${exp.name.slice(0, 25)}...` : exp.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(
                      [
                        { key: "accuracy", label: "Accuracy", fmt: fmtPct },
                        { key: "sharpe", label: "Sharpe", fmt: (v: number) => fmtNum(v) },
                        { key: "loss", label: "Loss", fmt: (v: number) => fmtNum(v, 3) },
                        { key: "directionalAccuracy", label: "Dir. Accuracy", fmt: fmtPct },
                        { key: "maxDrawdown", label: "Max Drawdown", fmt: fmtPct },
                        { key: "calibration", label: "Calibration", fmt: fmtPct },
                        { key: "precision", label: "Precision", fmt: fmtPct },
                        { key: "recall", label: "Recall", fmt: fmtPct },
                        { key: "stabilityScore", label: "Stability", fmt: fmtPct },
                      ] as const
                    ).map((metric) => {
                      const values = compareExps.map(
                        (e) => e.metrics![metric.key as keyof typeof e.metrics] as number
                      )
                      const best =
                        metric.key === "loss" || metric.key === "maxDrawdown"
                          ? Math.min(...values)
                          : Math.max(...values)

                      return (
                        <tr key={metric.key} className="border-b border-border/30">
                          <td className="py-2 pr-4 text-muted-foreground text-xs">
                            {metric.label}
                          </td>
                          {compareExps.map((exp) => {
                            const val = exp.metrics![metric.key as keyof typeof exp.metrics] as number
                            const isBest = val === best
                            return (
                              <td
                                key={exp.id}
                                className={`text-right py-2 px-3 font-mono ${isBest ? "text-emerald-400 font-bold" : ""}`}
                              >
                                {metric.fmt(val)}
                              </td>
                            )
                          })}
                        </tr>
                      )
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
                    {MODEL_FAMILIES.map((fam) => (
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
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  placeholder="Brief description of hypothesis..."
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Feature Set</Label>
                  <Select
                    value={form.featureSetId}
                    onValueChange={(v) => setForm((f) => ({ ...f, featureSetId: v }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {FEATURE_SET_VERSIONS.map((fs) => (
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
                    onValueChange={(v) => setForm((f) => ({ ...f, datasetId: v }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {DATASET_SNAPSHOTS.map((ds) => (
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
                      onChange={(e) => setForm((f) => ({ ...f, epochs: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Batch Size</Label>
                    <Input
                      type="number"
                      value={form.batchSize}
                      onChange={(e) => setForm((f) => ({ ...f, batchSize: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Learning Rate</Label>
                    <Input
                      type="number"
                      step="0.0001"
                      value={form.learningRate}
                      onChange={(e) => setForm((f) => ({ ...f, learningRate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Optimizer</Label>
                    <Select
                      value={form.optimizer}
                      onValueChange={(v) => setForm((f) => ({ ...f, optimizer: v }))}
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
  )
}
