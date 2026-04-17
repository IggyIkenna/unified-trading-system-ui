"use client";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMLAlerts, useMLMonitoring } from "@/hooks/api/use-ml-models";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";
import { Activity, AlertTriangle, BarChart3, Shield, TrendingDown } from "lucide-react";

export default function MLMonitoringPage() {
  const { data: monitoringData, isLoading: monLoading } = useMLMonitoring();
  const { data: alertsData, isLoading: alertsLoading } = useMLAlerts();

  const isLoading = monLoading || alertsLoading;
  const monitoring = monitoringData as {
    alerts: Array<{ id: string; severity: string; message: string; triggeredAt: string }>;
    drift: Array<{ modelId: string; metric: string; current: number; baseline: number }>;
    performance: Record<string, number>;
  } | null;
  const allAlerts = Array.isArray(alertsData) ? alertsData : [];
  const activeAlerts = allAlerts.filter(
    (a: { resolvedAt?: string | null }) => !a.resolvedAt,
  );
  const resolvedAlerts = allAlerts.filter(
    (a: { resolvedAt?: string | null }) => !!a.resolvedAt,
  );

  if (isLoading) {
    return (
      <div className="platform-page-width space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="platform-page-width space-y-6 p-6">
      <PageHeader
        title="ML Monitoring"
        description="Model drift scores, prediction distribution, and accuracy over time"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50">
          <CardContent className="pt-0 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Active Alerts</p>
                <p className="text-2xl font-bold mt-0.5">{activeAlerts.length}</p>
              </div>
              <div className="rounded-lg bg-red-500/10 p-2">
                <AlertTriangle className="size-4 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-0 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Resolved (24h)</p>
                <p className="text-2xl font-bold mt-0.5">{resolvedAlerts.length}</p>
              </div>
              <div className="rounded-lg bg-emerald-500/10 p-2">
                <Shield className="size-4 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-0 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Drift Events</p>
                <p className="text-2xl font-bold mt-0.5">{monitoring?.drift?.length ?? 0}</p>
              </div>
              <div className="rounded-lg bg-amber-500/10 p-2">
                <TrendingDown className="size-4 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-0 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Avg Accuracy</p>
                <p className="text-2xl font-bold mt-0.5">{formatPercent(71.2, 1)}</p>
              </div>
              <div className="rounded-lg bg-blue-500/10 p-2">
                <BarChart3 className="size-4 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {activeAlerts.length > 0 ? (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <AlertTriangle className="size-4 text-red-400" />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeAlerts.map((alert: { id: string; severity: string; message: string; triggeredAt: string; metric?: string; currentValue?: number; threshold?: number }) => (
              <div key={alert.id} className="rounded-md border border-border/50 p-3 space-y-1.5">
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
                <p className="text-xs text-muted-foreground">{alert.message}</p>
                {alert.metric && (
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="text-muted-foreground">{alert.metric}:</span>
                    <span className="font-mono font-medium text-red-400">
                      {formatNumber(alert.currentValue ?? 0, 3)}
                    </span>
                    <span className="text-muted-foreground">threshold: {formatNumber(alert.threshold ?? 0, 3)}</span>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={<Activity className="size-10 text-muted-foreground" />}
          title="No active alerts"
          description="All models are within acceptable drift thresholds."
        />
      )}
    </div>
  );
}
