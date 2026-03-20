"use client"

import * as React from "react"
import {
  Activity,
  AlertTriangle,
  Brain,
  CheckCircle2,
  Clock,
  Cpu,
  FlaskConical,
  Layers,
  Play,
  RefreshCw,
  Zap,
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
  MODEL_FAMILIES,
  EXPERIMENTS,
  TRAINING_RUNS,
  FEATURE_PROVENANCE,
  ML_ALERTS,
} from "@/lib/ml-mock-data"
import type { Experiment, ModelFamily } from "@/lib/ml-types"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function archetypeColor(archetype: string) {
  switch (archetype) {
    case "DIRECTIONAL":
      return "bg-blue-500/15 text-blue-400 border-blue-500/30"
    case "MARKET_MAKING":
      return "bg-purple-500/15 text-purple-400 border-purple-500/30"
    case "ARBITRAGE":
      return "bg-cyan-500/15 text-cyan-400 border-cyan-500/30"
    case "YIELD":
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
    case "SPORTS_ML":
      return "bg-amber-500/15 text-amber-400 border-amber-500/30"
    case "PREDICTION_MARKET_ML":
      return "bg-pink-500/15 text-pink-400 border-pink-500/30"
    default:
      return "bg-zinc-500/15 text-zinc-400 border-zinc-500/30"
  }
}

function statusColor(status: string) {
  switch (status) {
    case "running":
    case "training":
      return "bg-blue-500/15 text-blue-400 border-blue-500/30"
    case "completed":
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
    case "failed":
      return "bg-red-500/15 text-red-400 border-red-500/30"
    case "queued":
      return "bg-amber-500/15 text-amber-400 border-amber-500/30"
    default:
      return "bg-zinc-500/15 text-zinc-400 border-zinc-500/30"
  }
}

function freshnessColor(status: string) {
  switch (status) {
    case "healthy":
      return "text-emerald-400"
    case "degraded":
      return "text-amber-400"
    case "stale":
      return "text-red-400"
    case "unavailable":
      return "text-red-500"
    default:
      return "text-muted-foreground"
  }
}

function alertSeverityColor(severity: string) {
  switch (severity) {
    case "critical":
      return "bg-red-500/15 text-red-400 border-red-500/30"
    case "warning":
      return "bg-amber-500/15 text-amber-400 border-amber-500/30"
    case "info":
      return "bg-blue-500/15 text-blue-400 border-blue-500/30"
    default:
      return "bg-zinc-500/15 text-zinc-400 border-zinc-500/30"
  }
}

// ---------------------------------------------------------------------------
// Train Model Form
// ---------------------------------------------------------------------------

interface TrainFormState {
  familyId: string
  name: string
  epochs: string
  batchSize: string
  learningRate: string
  optimizer: string
  gpuType: string
}

const INITIAL_FORM: TrainFormState = {
  familyId: "",
  name: "",
  epochs: "100",
  batchSize: "256",
  learningRate: "0.001",
  optimizer: "AdamW",
  gpuType: "A100",
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function MLOverviewPage() {
  const [experiments, setExperiments] = React.useState<Experiment[]>(EXPERIMENTS)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [form, setForm] = React.useState<TrainFormState>(INITIAL_FORM)

  // KPIs
  const totalFamilies = MODEL_FAMILIES.length
  const runningExperiments = experiments.filter((e) => e.status === "running").length
  const completedExperiments = experiments.filter((e) => e.status === "completed").length
  const unresolvedAlerts = ML_ALERTS.filter((a) => !a.resolvedAt).length

  function handleSubmitTraining() {
    if (!form.familyId || !form.name) return

    const newExp: Experiment = {
      id: `exp-${Date.now()}`,
      name: form.name,
      description: "New training experiment",
      modelFamilyId: form.familyId,
      status: "queued",
      progress: 0,
      datasetSnapshotId: "ds-auto-latest",
      featureSetVersionId: "fs-auto-latest",
      hyperparameters: {
        learning_rate: parseFloat(form.learningRate),
        batch_size: parseInt(form.batchSize),
      },
      trainingConfig: {
        epochs: parseInt(form.epochs),
        batchSize: parseInt(form.batchSize),
        learningRate: parseFloat(form.learningRate),
        optimizer: form.optimizer,
        lossFunction: "CrossEntropyWithLabelSmoothing",
        earlyStopping: true,
        earlyStoppingPatience: 15,
        gpuType: form.gpuType,
        numGpus: form.gpuType === "A100" ? 4 : 2,
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">ML Platform</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Model training, validation, and deployment operations
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Play className="size-4" />
            Train New Model
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/50">
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Model Families
                  </p>
                  <p className="text-3xl font-bold mt-1">{totalFamilies}</p>
                </div>
                <div className="rounded-lg bg-purple-500/10 p-2.5">
                  <Layers className="size-5 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Training Active
                  </p>
                  <p className="text-3xl font-bold mt-1">{runningExperiments}</p>
                </div>
                <div className="rounded-lg bg-blue-500/10 p-2.5">
                  <Cpu className="size-5 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Completed
                  </p>
                  <p className="text-3xl font-bold mt-1">{completedExperiments}</p>
                </div>
                <div className="rounded-lg bg-emerald-500/10 p-2.5">
                  <CheckCircle2 className="size-5 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Active Alerts
                  </p>
                  <p className="text-3xl font-bold mt-1">{unresolvedAlerts}</p>
                </div>
                <div className="rounded-lg bg-red-500/10 p-2.5">
                  <AlertTriangle className="size-5 text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Model Families Grid */}
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Brain className="size-5" />
            Model Families
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {MODEL_FAMILIES.map((family) => {
              const familyExps = experiments.filter((e) => e.modelFamilyId === family.id)
              const runningCount = familyExps.filter((e) => e.status === "running").length

              return (
                <Card key={family.id} className="border-border/50">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold">{family.name}</CardTitle>
                      <Badge variant="outline" className={archetypeColor(family.archetype)}>
                        {family.archetype.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {family.description}
                    </p>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-md bg-muted/30 p-2">
                        <p className="text-lg font-bold">{family.totalVersions}</p>
                        <p className="text-[10px] text-muted-foreground">Versions</p>
                      </div>
                      <div className="rounded-md bg-muted/30 p-2">
                        <p className="text-lg font-bold">{family.linkedStrategies.length}</p>
                        <p className="text-[10px] text-muted-foreground">Strategies</p>
                      </div>
                      <div className="rounded-md bg-muted/30 p-2">
                        <p className="text-lg font-bold">{runningCount}</p>
                        <p className="text-[10px] text-muted-foreground">Training</p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {family.currentChampion && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Champion</span>
                          <Badge variant="outline" className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-mono text-[10px]">
                            {family.currentChampion.replace("mv-", "")}
                          </Badge>
                        </div>
                      )}
                      {family.currentChallenger && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Challenger</span>
                          <Badge variant="outline" className="bg-blue-500/15 text-blue-400 border-blue-500/30 font-mono text-[10px]">
                            {family.currentChallenger.replace("mv-", "")}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Training Status */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FlaskConical className="size-5" />
              Training Status
            </h2>
            {experiments.slice(0, 6).map((exp) => {
              const run = TRAINING_RUNS.find((r) => r.experimentId === exp.id)
              return (
                <Card key={exp.id} className="border-border/50">
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{exp.name}</span>
                          <Badge variant="outline" className={statusColor(exp.status)}>
                            {exp.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          by {exp.createdBy} &middot;{" "}
                          {exp.startedAt
                            ? new Date(exp.startedAt).toLocaleDateString()
                            : "not started"}
                        </p>
                      </div>
                      <div className="text-right">
                        {exp.status === "running" && run && (
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">
                              Epoch {run.currentEpoch}/{run.totalEpochs}
                            </p>
                            <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full transition-all"
                                style={{ width: `${exp.progress}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                              ETA: {run.estimatedTimeRemaining}
                            </p>
                          </div>
                        )}
                        {exp.metrics && (
                          <div className="flex items-center gap-3 text-xs">
                            <span>
                              Acc: <span className="font-mono font-medium">{(exp.metrics.accuracy * 100).toFixed(1)}%</span>
                            </span>
                            <span>
                              Sharpe: <span className="font-mono font-medium">{exp.metrics.sharpe.toFixed(2)}</span>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Right sidebar: Feature Freshness + Alerts */}
          <div className="space-y-6">
            {/* Feature Freshness */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Zap className="size-4" />
                  Feature Freshness
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {FEATURE_PROVENANCE.map((fp) => (
                  <div
                    key={fp.featureName}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`size-2 rounded-full ${
                          fp.status === "healthy"
                            ? "bg-emerald-400"
                            : fp.status === "degraded"
                              ? "bg-amber-400"
                              : "bg-red-400"
                        }`}
                      />
                      <span className="font-mono text-xs">{fp.featureName}</span>
                    </div>
                    <span className={`text-xs font-mono ${freshnessColor(fp.status)}`}>
                      {fp.freshness}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Alerts */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="size-4" />
                  ML Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {ML_ALERTS.filter((a) => !a.resolvedAt).map((alert) => (
                  <div
                    key={alert.id}
                    className="rounded-lg border border-border/50 p-3 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={alertSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(alert.triggeredAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs">{alert.message}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Train New Model Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Train New Model</DialogTitle>
              <DialogDescription>
                Configure and launch a new training experiment.
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
                  placeholder="e.g., BTC Direction v3.4 - Wider context"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>

              <div className="rounded-lg border border-border/50 p-3 space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Training Configuration
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
                        <SelectItem value="RMSProp">RMSProp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">GPU Type</Label>
                  <Select
                    value={form.gpuType}
                    onValueChange={(v) => setForm((f) => ({ ...f, gpuType: v }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A100">A100 (4x)</SelectItem>
                      <SelectItem value="V100">V100 (2x)</SelectItem>
                      <SelectItem value="T4">T4 (1x)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmitTraining}
                disabled={!form.familyId || !form.name}
              >
                <Play className="size-4" />
                Start Training
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
