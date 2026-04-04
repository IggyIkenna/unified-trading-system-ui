"use client";

import { PageHeader } from "@/components/shared/page-header";
import { ApiError } from "@/components/shared/api-error";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useMLAlerts,
  useMLPipelineStatus,
  useModelFamilies,
  useTrainingQueue,
  useUnifiedTrainingRuns,
} from "@/hooks/api/use-ml-models";
import type { ModelFamily, UnifiedTrainingRun } from "@/lib/types/ml";
import { Activity, AlertTriangle, Brain, CheckCircle2, Clock, Cpu, Layers, Play, XCircle } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";

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
  const {
    data: pipelineData,
    isLoading: pipelineLoading,
    isError: pipelineIsError,
    error: pipelineError,
  } = useMLPipelineStatus();
  const { data: runsData, isLoading: runsLoading, isError: runsIsError, error: runsError } = useUnifiedTrainingRuns();
  const { data: queueData, isLoading: queueLoading } = useTrainingQueue();
  const { data: alertsData } = useMLAlerts();
  const { data: familiesData, isLoading: famLoading } = useModelFamilies();

  const runs = (Array.isArray(runsData) ? runsData : []) as UnifiedTrainingRun[];
  const queue = queueData as {
    gpus: {
      gpu_type: string;
      total: number;
      in_use: number;
      available: number;
    }[];
    jobs_waiting: number;
    estimated_wait_minutes: number;
  } | null;
  const rawAlerts = Array.isArray(alertsData) ? alertsData : [];
  const alerts = rawAlerts.filter((a: { resolvedAt?: string | null }) => !a.resolvedAt);
  const families = ((familiesData as { data?: ModelFamily[] })?.data ?? []) as ModelFamily[];

  const stats = {
    total_model_families: 0,
    active_training_runs: 0,
    queued_jobs: 0,
    completed_today: 0,
    failed_today: 0,
    models_in_production: 0,
    models_in_shadow: 0,
    active_alerts: 0,
    ...(typeof pipelineData === "object" && pipelineData !== null ? (pipelineData as Record<string, number>) : {}),
  };

  const gpuTotalUsed = queue?.gpus?.reduce((s, g) => s + g.in_use, 0) ?? 0;
  const gpuTotalAll = Math.max(1, queue?.gpus?.reduce((s, g) => s + g.total, 0) ?? 1);

  const pageLoading = pipelineLoading || runsLoading || queueLoading || famLoading;
  const pageError = pipelineIsError || runsIsError;

  if (pageError) {
    const err =
      pipelineError instanceof Error
        ? pipelineError
        : runsError instanceof Error
          ? runsError
          : new Error("Request failed");
    return (
      <div className="min-h-screen bg-background p-6">
        <ApiError error={err} title="Could not load ML overview" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="platform-page-width space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <PageHeader
            title="ML Training Pipeline"
            description="Train, analyze, and register models for systematic trading"
          />
          <Link href="/services/research/ml/training">
            <Button>
              <Play className="size-4" />
              New Training Run
            </Button>
          </Link>
        </div>

        {/* KPI Strip */}
        {pageLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[88px] rounded-lg border border-border/50" />
            ))}
          </div>
        ) : (
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
        )}

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
              {pageLoading ? (
                <>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-[72px] w-full rounded-lg border border-border/50" />
                  ))}
                </>
              ) : (
                runs.slice(0, 5).map((run) => (
                  <Card key={run.id} className="border-border/50">
                    <CardContent className="pt-0 pb-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          {statusIcon(run.status)}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">{run.name}</span>
                              <Badge variant="outline" className={`${statusBadge(run.status)} text-[10px] shrink-0`}>
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
                          {run.status === "completed" && run.financial_metrics && (
                            <div className="flex items-center gap-3 text-xs">
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
                          {run.status === "failed" && <span className="text-[11px] text-red-400 font-mono">OOM</span>}
                          {run.status === "queued" && (
                            <span className="text-[11px] text-amber-400">Queue #{queue?.jobs_waiting ?? "—"}</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
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
                  <span className="text-muted-foreground">Total Utilization</span>
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
                  {(queue?.gpus ?? []).map((g) => (
                    <div key={g.gpu_type} className="flex items-center justify-between text-[11px]">
                      <span className="font-mono text-muted-foreground">{g.gpu_type}</span>
                      <span>
                        <span className="text-foreground font-medium">{g.available}</span>
                        <span className="text-muted-foreground">/{g.total} free</span>
                      </span>
                    </div>
                  ))}
                </div>
                {(queue?.jobs_waiting ?? 0) > 0 && (
                  <div className="rounded-md bg-amber-500/10 p-2 text-[11px] text-amber-400">
                    {queue?.jobs_waiting} jobs waiting · ~{queue?.estimated_wait_minutes}min est.
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
                    <div key={alert.id} className="rounded-md border border-border/50 p-2.5 space-y-1">
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
                      <p className="text-[11px] text-muted-foreground">{alert.message}</p>
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
                  <div key={f.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="truncate font-medium">{f.name}</span>
                    </div>
                    <Badge variant="outline" className={`${archetypeColor(f.archetype)} text-[9px] shrink-0`}>
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
