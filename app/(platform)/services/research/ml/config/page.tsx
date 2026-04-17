"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMLConfig, useMLPipelineStatus, useTrainingQueue } from "@/hooks/api/use-ml-models";
import { Cpu, Database, Settings, Zap } from "lucide-react";

export default function MLConfigPage() {
  const { data: configData, isLoading: cfgLoading } = useMLConfig();
  const { data: pipelineData, isLoading: pipLoading } = useMLPipelineStatus();
  const { data: queueData, isLoading: queueLoading } = useTrainingQueue();

  const isLoading = cfgLoading || pipLoading || queueLoading;

  const pipeline = pipelineData as Record<string, number> | null;
  const queue = queueData as {
    gpus: { gpu_type: string; total: number; in_use: number; available: number }[];
    jobs_waiting: number;
    estimated_wait_minutes: number;
  } | null;

  if (isLoading) {
    return (
      <div className="platform-page-width space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="platform-page-width space-y-6 p-6">
      <PageHeader
        title="ML Pipeline Config"
        description="Current ML pipeline configuration, feature sets, training schedule, and drift thresholds"
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Settings className="size-4" />
              Pipeline Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Model Families", value: pipeline?.total_model_families ?? 0 },
              { label: "Active Training", value: pipeline?.active_training_runs ?? 0 },
              { label: "Queued Jobs", value: pipeline?.queued_jobs ?? 0 },
              { label: "Models in Production", value: pipeline?.models_in_production ?? 0 },
              { label: "Models in Shadow", value: pipeline?.models_in_shadow ?? 0 },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-mono font-medium">{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Cpu className="size-4" />
              GPU Resources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(queue?.gpus ?? []).map((g) => (
              <div key={g.gpu_type} className="flex items-center justify-between text-xs">
                <span className="font-mono text-muted-foreground">{g.gpu_type}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium">{g.available}/{g.total} free</span>
                  <Badge variant="outline" className="text-[9px]">
                    {g.in_use} in use
                  </Badge>
                </div>
              </div>
            ))}
            {(queue?.jobs_waiting ?? 0) > 0 && (
              <div className="rounded-md bg-amber-500/10 p-2 text-[11px] text-amber-400">
                {queue?.jobs_waiting} jobs waiting, ~{queue?.estimated_wait_minutes}min estimated
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Zap className="size-4" />
              Training Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Retrain Frequency", value: "Weekly (Sun 02:00 UTC)" },
              { label: "Walk-Forward Window", value: "180 days rolling" },
              { label: "Validation Split", value: "80/10/10 (train/val/test)" },
              { label: "Max Concurrent Jobs", value: "4" },
              { label: "Auto-Promote Threshold", value: "Sharpe > 1.5, DirAcc > 60%" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-mono text-[11px]">{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Database className="size-4" />
              Drift Thresholds
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Accuracy Drop", value: "4% below baseline", severity: "warning" },
              { label: "Accuracy Critical", value: "8% below baseline", severity: "critical" },
              { label: "Feature Freshness SLA", value: "5 minutes", severity: "warning" },
              { label: "Inference Latency P99", value: "< 15ms", severity: "warning" },
              { label: "Shadow Test Duration", value: "7 days minimum", severity: "info" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px]">{item.value}</span>
                  <Badge
                    variant="outline"
                    className={`text-[9px] ${item.severity === "critical"
                        ? "bg-red-500/15 text-red-400 border-red-500/30"
                        : item.severity === "warning"
                          ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                          : "bg-blue-500/15 text-blue-400 border-blue-500/30"
                      }`}
                  >
                    {item.severity}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
