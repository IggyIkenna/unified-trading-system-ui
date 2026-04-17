"use client";

/**
 * /services/data/overview — Acquire tab landing page.
 * Shows pipeline stage summaries (Instruments → Raw → Processed),
 * per-category progress, active jobs, and alerts.
 */

import { CATEGORY_COLORS } from "@/components/data/shard-catalogue";
import { AlertRow } from "@/components/shared/alert-row";
import { PageHeader } from "@/components/shared/page-header";
import { StatusDot } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  useDataPipelineAlerts,
  useDataPipelineJobs,
  useDataPipelineStages,
} from "@/hooks/api/use-data-pipeline";
import { useScopedCategories } from "@/hooks/use-scoped-categories";
import {
  DATA_CATEGORY_LABELS,
  type DataCategory,
  type JobInfo,
  type PipelineStageSummary,
} from "@/lib/types/data-service";
import { cn } from "@/lib/utils";
import { formatPercent } from "@/lib/utils/formatters";
import {
  Activity,
  ArrowRight,
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock,
  Database,
  Lock,
  RefreshCw,
  Zap,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";

const STAGE_HREFS: Record<string, string> = {
  instruments: "/services/data/instruments",
  raw: "/services/data/raw",
  processing: "/services/data/processing",
  events: "/services/data/events",
};

const STAGE_ICONS: Record<string, React.ReactNode> = {
  instruments: <Database className="size-5" />,
  raw: <Activity className="size-5" />,
  processing: <RefreshCw className="size-5" />,
  events: <Zap className="size-5" />,
};

function jobStatusForDot(status: JobInfo["status"]): "live" | "in_progress" | "done" | "failed" | "idle" {
  switch (status) {
    case "running":
      return "live";
    case "queued":
      return "in_progress";
    case "completed":
      return "done";
    case "failed":
      return "failed";
    case "cancelled":
      return "idle";
    default:
      return "idle";
  }
}

function formatDuration(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function etaLabel(job: JobInfo): string {
  if (!job.estimatedCompletionAt) return "—";
  const eta = new Date(job.estimatedCompletionAt);
  const now = new Date();
  const diffMs = eta.getTime() - now.getTime();
  if (diffMs <= 0) return "Soon";
  return formatDuration(diffMs);
}

function StageCard({ stage }: { stage: PipelineStageSummary }) {
  const pct = stage.completionPct;
  const statusColor = pct >= 95 ? "text-emerald-400" : pct >= 80 ? "text-yellow-400" : "text-red-400";
  const borderColor = pct >= 95 ? "border-emerald-500/20" : pct >= 80 ? "border-yellow-500/20" : "border-red-500/20";

  return (
    <Link href={STAGE_HREFS[stage.stage]}>
      <Card className={cn("cursor-pointer hover:bg-accent/30 transition-colors", borderColor)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              {STAGE_ICONS[stage.stage]}
              <CardTitle className="text-sm font-medium">{stage.label}</CardTitle>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-3">
            <div className="flex items-end justify-between mb-1">
              <span className={cn("text-3xl font-bold font-mono", statusColor)}>{formatPercent(pct, 1)}</span>
              <span className="text-xs text-muted-foreground">
                {stage.completedShards.toLocaleString()} / {stage.totalShards.toLocaleString()} shards
              </span>
            </div>
            <Progress value={pct} className="h-2" />
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {stage.inProgressShards > 0 && (
              <span className="flex items-center gap-1">
                <StatusDot status="in_progress" className="size-1.5 animate-pulse" />
                {stage.inProgressShards} running
              </span>
            )}
            {stage.failedShards > 0 && (
              <span className="flex items-center gap-1 text-red-400">
                <StatusDot status="failed" className="size-1.5" />
                {stage.failedShards} failed
              </span>
            )}
            <span>
              Updated{" "}
              {new Date(stage.lastUpdated).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function CategoryProgressRow({ cat, stages }: { cat: DataCategory; stages: PipelineStageSummary[] }) {
  const label = DATA_CATEGORY_LABELS[cat];
  const colorClass = CATEGORY_COLORS[cat];

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className={cn("text-xs", colorClass)}>
          {label}
        </Badge>
        <div className="flex items-center gap-6 text-xs text-muted-foreground">
          {stages.map((stage) => {
            const catData = stage.byCategory.find((c) => c.category === cat);
            if (!catData) return null;
            const pct = catData.completionPct;
            return (
              <span
                key={stage.stage}
                className={cn(
                  "font-mono",
                  pct >= 95 ? "text-emerald-400" : pct >= 80 ? "text-yellow-400" : "text-red-400",
                )}
              >
                {formatPercent(pct, 0)}
              </span>
            );
          })}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {stages.map((stage) => {
          const catData = stage.byCategory.find((c) => c.category === cat);
          const pct = catData?.completionPct ?? 0;
          return (
            <div key={stage.stage} className="space-y-0.5">
              <div className="text-[10px] text-muted-foreground">{stage.label}</div>
              <Progress
                value={pct}
                className={cn(
                  "h-1.5",
                  pct >= 95 ? "[&>div]:bg-emerald-500" : pct >= 80 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-red-500",
                )}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActiveJobRow({ job }: { job: JobInfo }) {
  const eta = etaLabel(job);
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <StatusDot
          status={jobStatusForDot(job.status)}
          className={cn("size-2 flex-shrink-0", job.status === "running" && "animate-pulse")}
        />
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">
            <Badge variant="secondary" className="text-[10px] mr-1.5">
              {job.type}
            </Badge>
            {DATA_CATEGORY_LABELS[job.category]} · {job.venue}
          </div>
          <div className="text-xs text-muted-foreground">
            {job.dateRange.start} → {job.dateRange.end} · {job.workersActive}/{job.workersMax} workers
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 flex-shrink-0 ml-4">
        <div className="text-right">
          <div className="flex items-center gap-2">
            <Progress value={job.progressPct} className="h-1.5 w-20" />
            <span className="text-xs font-mono text-muted-foreground w-8">{job.progressPct}%</span>
          </div>
          {job.status === "running" && eta !== "—" && (
            <div className="text-[10px] text-muted-foreground mt-0.5">ETA {eta}</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AcquireOverviewPage() {
  const { data: stages = [] } = useDataPipelineStages();
  const { data: jobs = [] } = useDataPipelineJobs();
  const { data: alerts = [] } = useDataPipelineAlerts();
  const { subscribed, locked } = useScopedCategories();

  // Use scoped categories if available; fall back to all categories for internal users
  const categories = subscribed.length > 0 ? subscribed : (Object.keys(DATA_CATEGORY_LABELS) as DataCategory[]);
  const unreadAlerts = alerts.filter((a) => !a.read).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-8 md:px-6">
        <PageHeader
          className="mb-8"
          title="Acquire"
          description="Data pipeline — instruments → raw data → processed candles → events"
        >
          <Button variant="outline" size="sm">
            <RefreshCw className="size-4 mr-2" />
            Refresh
          </Button>
        </PageHeader>

        {/* Pipeline Stage Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stages.map((stage) => (
            <StageCard key={stage.stage} stage={stage} />
          ))}
        </div>

        {/* Column headers for category breakdown */}
        <Card className="mb-8">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Category Breakdown</CardTitle>
              <div className="flex items-center gap-6 text-[10px] text-muted-foreground pr-2">
                {stages.map((s) => (
                  <span key={s.stage} className="w-[calc(33%-4px)]">
                    {s.label}
                  </span>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {categories.map((cat) => (
              <CategoryProgressRow key={cat} cat={cat} stages={stages} />
            ))}
            {locked.length > 0 && (
              <>
                <div className="border-t border-border/50 pt-4">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <Lock className="size-3" />
                    Not subscribed
                  </div>
                  {locked.map((cat) => (
                    <div key={cat} className="flex items-center justify-between py-2 opacity-50">
                      <Badge variant="outline" className={cn("text-xs", CATEGORY_COLORS[cat])}>
                        {DATA_CATEGORY_LABELS[cat]}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Lock className="size-3" />
                        Upgrade to access
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Active Jobs + Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Jobs */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="size-4" />
                  Active Jobs
                  <Badge variant="secondary" className="text-xs">
                    {jobs.filter((j) => j.status === "running" || j.status === "queued").length}
                  </Badge>
                </CardTitle>
                <Link href="/services/data/raw">
                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                    View All
                    <ArrowRight className="ml-1 size-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {jobs.length === 0 ? (
                <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                  <CheckCircle2 className="size-4 text-emerald-400" />
                  No active jobs
                </div>
              ) : (
                <div>
                  {jobs.slice(0, 5).map((job) => (
                    <ActiveJobRow key={job.id} job={job} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Bell className="size-4" />
                  Alerts
                  {unreadAlerts > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {unreadAlerts} new
                    </Badge>
                  )}
                </CardTitle>
                <Link href="/services/observe/alerts">
                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                    View all in Observe
                    <ArrowRight className="ml-1 size-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {alerts.length === 0 ? (
                <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                  <CheckCircle2 className="size-4 text-emerald-400" />
                  No alerts
                </div>
              ) : (
                <div>
                  {alerts.slice(0, 5).map((alert) => (
                    <AlertRow
                      key={alert.id}
                      severity={alert.severity}
                      title={alert.title}
                      description={alert.message}
                      timestamp={alert.timestamp}
                      timestampMode="absolute"
                      unread={!alert.read}
                      actionHref={alert.actionHref}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
