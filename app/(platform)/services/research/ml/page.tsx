"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle2,
  Clock,
  Cpu,
  FlaskConical,
  Layers,
  Package,
  Play,
  XCircle,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useExperiments,
  useModelFamilies,
  useTrainingRuns,
  useFeatureProvenance,
  useMLMonitoring,
} from "@/hooks/api/use-ml-models";
import type { Experiment, ModelFamily, TrainingRun } from "@/lib/ml-types";
import {
  UNIFIED_TRAINING_RUNS,
  GPU_QUEUE_STATUS,
  ML_PIPELINE_STATUS,
  ML_ALERTS,
  MODEL_FAMILIES,
} from "@/lib/ml-mock-data";

function statusIcon(status: string) {
  switch (status) {
    case "running":
      return <Activity className="size-3.5 text-blue-400 animate-pulse" />;
    case "completed":
      return <CheckCircle2 className="size-3.5 text-emerald-400" />;
    case "failed":
      return <XCircle className="size-3.5 text-red-400" />;
    case "queued":
      return <Clock className="size-3.5 text-amber-400" />;
    default:
      return <Clock className="size-3.5 text-zinc-400" />;
  }
}

function statusBadge(status: string) {
  const colors: Record<string, string> = {
    running: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    completed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    failed: "bg-red-500/15 text-red-400 border-red-500/30",
    queued: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  };
  return colors[status] ?? "bg-zinc-500/15 text-zinc-400 border-zinc-500/30";
}

function archetypeColor(archetype: string) {
  const colors: Record<string, string> = {
    DIRECTIONAL: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    MARKET_MAKING: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    ARBITRAGE: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    YIELD: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    SPORTS_ML: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    PREDICTION_MARKET_ML: "bg-pink-500/15 text-pink-400 border-pink-500/30",
  };
  return colors[archetype] ?? "bg-zinc-500/15 text-zinc-400 border-zinc-500/30";
}

export default function MLOverviewPage() {
  const stats = ML_PIPELINE_STATUS;
  const runs = UNIFIED_TRAINING_RUNS;
  const queue = GPU_QUEUE_STATUS;
  const alerts = ML_ALERTS.filter((a) => !a.resolvedAt);
  const families = MODEL_FAMILIES;

  const gpuTotalUsed = queue.gpus.reduce((s, g) => s + g.in_use, 0);
  const gpuTotalAll = queue.gpus.reduce((s, g) => s + g.total, 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              ML Training Pipeline
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Train, analyze, and register models for systematic trading
            </p>
          </div>
          <Link href="/services/research/ml/training">
            <Button>
              <Play className="size-4" />
              New Training Run
            </Button>
          </Link>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            {
              label: "Model Families",
              value: stats.total_model_families,
              icon: Layers,
              color: "text-purple-400",
              bg: "bg-purple-500/10",
            },
            {
              label: "Training Active",
              value: stats.active_training_runs,
              icon: Cpu,
              color: "text-blue-400",
              bg: "bg-blue-500/10",
            },
            {
              label: "Queued",
              value: stats.queued_jobs,
              icon: Clock,
              color: "text-amber-400",
              bg: "bg-amber-500/10",
            },
            {
              label: "Completed",
              value: stats.completed_today,
              icon: CheckCircle2,
              color: "text-emerald-400",
              bg: "bg-emerald-500/10",
            },
            {
              label: "In Production",
              value: stats.models_in_production,
              icon: Activity,
              color: "text-cyan-400",
              bg: "bg-cyan-500/10",
            },
            {
              label: "Active Alerts",
              value: stats.active_alerts,
              icon: AlertTriangle,
              color: alerts.length > 0 ? "text-red-400" : "text-zinc-400",
              bg: alerts.length > 0 ? "bg-red-500/10" : "bg-zinc-500/10",
            },
          ].map((kpi) => (
            <Card key={kpi.label} className="border-border/50">
              <CardContent className="pt-0 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      {kpi.label}
                    </p>
                    <p className="text-2xl font-bold mt-0.5">{kpi.value}</p>
                  </div>
                  <div className={`rounded-lg ${kpi.bg} p-2`}>
                    <kpi.icon className={`size-4 ${kpi.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Navigation Cards — the 3 sub-pages */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Link href="/services/research/ml/training" className="group">
            <Card className="border-border/50 h-full transition-colors hover:border-blue-500/50 hover:bg-blue-500/5">
              <CardContent className="pt-4 pb-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="rounded-lg bg-blue-500/10 p-2.5">
                    <FlaskConical className="size-5 text-blue-400" />
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground group-hover:text-blue-400 transition-colors" />
                </div>
                <h3 className="font-semibold">Training</h3>
                <p className="text-xs text-muted-foreground">
                  Configure, launch, and monitor training runs. Full config:
                  architecture, features, data windows, hyperparameters.
                </p>
                <div className="flex gap-2 pt-1">
                  <Badge
                    variant="outline"
                    className="bg-blue-500/15 text-blue-400 border-blue-500/30 text-[10px]"
                  >
                    {stats.active_training_runs} active
                  </Badge>
                  <Badge
                    variant="outline"
                    className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[10px]"
                  >
                    {stats.queued_jobs} queued
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/services/research/ml/analysis" className="group">
            <Card className="border-border/50 h-full transition-colors hover:border-purple-500/50 hover:bg-purple-500/5">
              <CardContent className="pt-4 pb-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="rounded-lg bg-purple-500/10 p-2.5">
                    <BarChart3 className="size-5 text-purple-400" />
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground group-hover:text-purple-400 transition-colors" />
                </div>
                <h3 className="font-semibold">Analysis</h3>
                <p className="text-xs text-muted-foreground">
                  Deep-dive into completed runs. Feature importance, regime
                  performance, walk-forward folds, significance tests.
                </p>
                <div className="flex gap-2 pt-1">
                  <Badge
                    variant="outline"
                    className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]"
                  >
                    {stats.completed_today} ready to analyze
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/services/research/ml/registry" className="group">
            <Card className="border-border/50 h-full transition-colors hover:border-emerald-500/50 hover:bg-emerald-500/5">
              <CardContent className="pt-4 pb-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="rounded-lg bg-emerald-500/10 p-2.5">
                    <Package className="size-5 text-emerald-400" />
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground group-hover:text-emerald-400 transition-colors" />
                </div>
                <h3 className="font-semibold">Model Registry</h3>
                <p className="text-xs text-muted-foreground">
                  Browse registered models. Version history, lineage, validation
                  status, deployment state.
                </p>
                <div className="flex gap-2 pt-1">
                  <Badge
                    variant="outline"
                    className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]"
                  >
                    {stats.models_in_production} live
                  </Badge>
                  {stats.models_in_shadow > 0 && (
                    <Badge
                      variant="outline"
                      className="bg-blue-500/15 text-blue-400 border-blue-500/30 text-[10px]"
                    >
                      {stats.models_in_shadow} shadow
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Recent Runs */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <Activity className="size-4" />
                Recent Training Runs
              </h2>
              <Link href="/services/research/ml/training">
                <Button variant="ghost" size="sm" className="text-xs">
                  View all
                </Button>
              </Link>
            </div>
            <div className="space-y-2">
              {runs.slice(0, 5).map((run) => (
                <Card key={run.id} className="border-border/50">
                  <CardContent className="pt-0 pb-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        {statusIcon(run.status)}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">
                              {run.name}
                            </span>
                            <Badge
                              variant="outline"
                              className={`${statusBadge(run.status)} text-[10px] shrink-0`}
                            >
                              {run.status}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            {run.model_family_name} · {run.created_by}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {run.status === "running" && (
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground font-mono">
                              Epoch {run.current_epoch}/{run.total_epochs}
                            </p>
                            <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full transition-all"
                                style={{ width: `${run.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                        {run.status === "completed" &&
                          run.financial_metrics && (
                            <div className="flex items-center gap-3 text-xs">
                              <span>
                                Sharpe:{" "}
                                <span className="font-mono font-medium text-emerald-400">
                                  {run.financial_metrics.sharpe_ratio.toFixed(
                                    2,
                                  )}
                                </span>
                              </span>
                              <span>
                                DirAcc:{" "}
                                <span className="font-mono font-medium">
                                  {(
                                    run.financial_metrics.directional_accuracy *
                                    100
                                  ).toFixed(1)}
                                  %
                                </span>
                              </span>
                            </div>
                          )}
                        {run.status === "failed" && (
                          <span className="text-[11px] text-red-400 font-mono">
                            OOM
                          </span>
                        )}
                        {run.status === "queued" && (
                          <span className="text-[11px] text-amber-400">
                            Queue #{queue.jobs_waiting}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            {/* GPU Resources */}
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Cpu className="size-4" />
                  GPU Resources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Total Utilization
                  </span>
                  <span className="font-mono font-medium">
                    {gpuTotalUsed}/{gpuTotalAll} GPUs
                  </span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${(gpuTotalUsed / gpuTotalAll) * 100}%` }}
                  />
                </div>
                <div className="space-y-1.5">
                  {queue.gpus.map((g) => (
                    <div
                      key={g.gpu_type}
                      className="flex items-center justify-between text-[11px]"
                    >
                      <span className="font-mono text-muted-foreground">
                        {g.gpu_type}
                      </span>
                      <span>
                        <span className="text-foreground font-medium">
                          {g.available}
                        </span>
                        <span className="text-muted-foreground">
                          /{g.total} free
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
                {queue.jobs_waiting > 0 && (
                  <div className="rounded-md bg-amber-500/10 p-2 text-[11px] text-amber-400">
                    {queue.jobs_waiting} jobs waiting · ~
                    {queue.estimated_wait_minutes}min est.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Alerts */}
            {alerts.length > 0 && (
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="size-4 text-red-400" />
                    Active Alerts ({alerts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="rounded-md border border-border/50 p-2.5 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${alert.severity === "warning" ? "bg-amber-500/15 text-amber-400 border-amber-500/30" : "bg-red-500/15 text-red-400 border-red-500/30"}`}
                        >
                          {alert.severity}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(alert.triggeredAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {alert.message}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Model Families Mini */}
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Brain className="size-4" />
                  Model Families ({families.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {families.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="truncate font-medium">{f.name}</span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`${archetypeColor(f.archetype)} text-[9px] shrink-0`}
                    >
                      {f.archetype.replace(/_/g, " ")}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
