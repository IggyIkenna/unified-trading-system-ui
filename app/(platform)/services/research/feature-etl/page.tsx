"use client";

import { PageHeader } from "@/components/platform/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { FeatureEtlJob } from "@/lib/build-mock-data";
import {
  FEATURE_ETL_HEATMAP,
  FEATURE_ETL_HISTORY,
  FEATURE_ETL_JOBS,
  FEATURE_ETL_SERVICES,
} from "@/lib/build-mock-data";
import { cn } from "@/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";
import { format, formatDistanceToNow } from "date-fns";
import { CheckCircle2, Clock, Cpu, Play, RefreshCw, RotateCcw, Server, XCircle } from "lucide-react";
import * as React from "react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const JOB_STATUS_CONFIG = {
  running: {
    label: "Running",
    color: "text-emerald-400",
    badgeClass: "border-emerald-400/30 text-emerald-400",
    icon: Play,
  },
  queued: {
    label: "Queued",
    color: "text-muted-foreground",
    badgeClass: "text-muted-foreground",
    icon: Clock,
  },
  complete: {
    label: "Complete",
    color: "text-blue-400",
    badgeClass: "border-blue-400/30 text-blue-400",
    icon: CheckCircle2,
  },
  failed: {
    label: "Failed",
    color: "text-red-400",
    badgeClass: "border-red-400/30 text-red-400",
    icon: XCircle,
  },
  paused: {
    label: "Paused",
    color: "text-amber-400",
    badgeClass: "border-amber-400/30 text-amber-400",
    icon: Clock,
  },
} as const;

function JobStatusBadge({ status }: { status: FeatureEtlJob["status"] }) {
  const cfg = JOB_STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={cn("text-xs gap-1", cfg.badgeClass)}>
      <Icon className="size-3" />
      {cfg.label}
    </Badge>
  );
}

// ─── Progress Overview Tab ────────────────────────────────────────────────────

function ProgressOverview() {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="divide-y divide-border/60">
          {FEATURE_ETL_SERVICES.map((svc) => (
            <div key={svc.id} className="px-4 py-3 space-y-3">
              {/* Row 1: identity + overall progress + actions */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <Server className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate font-mono text-xs font-medium">{svc.name}</span>
                  <Badge variant="secondary" className="shrink-0 text-[10px]">
                    {svc.shard}
                  </Badge>
                </div>
                <div className="flex min-w-[140px] max-w-[220px] flex-1 flex-col gap-0.5 sm:min-w-[180px]">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>
                      {svc.shards_complete}/{svc.shards_total} shards
                    </span>
                    <span className="tabular-nums font-medium text-foreground">{svc.overall_pct}%</span>
                  </div>
                  <Progress value={svc.overall_pct} className="h-1.5" />
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "shrink-0 text-[10px]",
                    svc.active_jobs > 0
                      ? "border-emerald-400/30 text-emerald-400"
                      : svc.failed_jobs > 0
                        ? "border-red-400/30 text-red-400"
                        : "text-muted-foreground",
                  )}
                >
                  {svc.active_jobs > 0
                    ? `${svc.active_jobs} running`
                    : svc.failed_jobs > 0
                      ? `${svc.failed_jobs} failed`
                      : "idle"}
                </Badge>
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(svc.last_updated), {
                    addSuffix: true,
                  })}
                </span>
                <Button variant="outline" size="sm" className="h-7 shrink-0 gap-1 text-[10px]">
                  <Play className="size-3" />
                  Trigger
                </Button>
              </div>
              {/* Row 2: category breakdown — compact grid */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {Object.entries(svc.by_category).map(([cat, data]) => (
                  <div key={cat} className="space-y-0.5">
                    <div className="flex items-center justify-between gap-1 text-[10px] text-muted-foreground">
                      <span className="truncate">{cat}</span>
                      <span className="tabular-nums text-foreground">{data.pct}%</span>
                    </div>
                    <Progress value={data.pct} className="h-1" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Active Jobs Tab ──────────────────────────────────────────────────────────

function ActiveJobs() {
  const running = FEATURE_ETL_JOBS.filter((j) => j.status === "running" || j.status === "queued");
  const failed = FEATURE_ETL_JOBS.filter((j) => j.status === "failed");

  return (
    <div className="space-y-5">
      {failed.length > 0 && (
        <Card className="border-red-400/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-red-400">
              <XCircle className="size-4" />
              Failed Jobs ({failed.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {failed.map((job) => (
                <div key={job.id} className="rounded-lg border border-red-400/20 p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">
                        {job.shard} — {job.category}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{job.service_id}</p>
                    </div>
                    <JobStatusBadge status={job.status} />
                  </div>
                  {job.error && <p className="text-xs text-red-400 bg-red-400/10 rounded p-2">{job.error}</p>}
                  <Button size="sm" variant="outline" className="gap-1 text-xs">
                    <RotateCcw className="size-3" />
                    Retry
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Cpu className="size-4 text-primary" />
              Active & Queued ({running.length})
            </CardTitle>
            <Button size="sm" variant="outline" className="gap-1 text-xs">
              <RefreshCw className="size-3" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {running.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No active jobs</p>
          ) : (
            <div className="space-y-3">
              {running.map((job) => (
                <div key={job.id} className="rounded-lg border border-border/50 p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">
                        {job.shard} — {job.category}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {job.service_id} · {job.date_range.start} → {job.date_range.end}
                      </p>
                    </div>
                    <JobStatusBadge status={job.status} />
                  </div>
                  {job.status === "running" && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {job.shards_done}/{job.shards_total} shards
                        </span>
                        <span>{job.progress_pct}%</span>
                      </div>
                      <Progress value={job.progress_pct} className="h-1.5" />
                    </div>
                  )}
                  {job.status === "running" && job.started_at && (
                    <p className="text-xs text-muted-foreground">
                      Started{" "}
                      {formatDistanceToNow(new Date(job.started_at), {
                        addSuffix: true,
                      })}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Heatmap Tab ──────────────────────────────────────────────────────────────

function HeatmapView() {
  const [selectedShard, setSelectedShard] = React.useState("CeFi");

  const shards = [...new Set(FEATURE_ETL_HEATMAP.map((c) => c.shard))];
  const filteredCells = FEATURE_ETL_HEATMAP.filter((c) => c.shard === selectedShard);

  const dates = [...new Set(filteredCells.map((c) => c.date))].sort();
  const groups = [...new Set(filteredCells.map((c) => c.feature_group))];

  function getPct(group: string, date: string): number {
    return filteredCells.find((c) => c.feature_group === group && c.date === date)?.pct ?? 0;
  }

  function cellColor(pct: number): string {
    if (pct === 100) return "bg-emerald-500/80";
    if (pct >= 75) return "bg-emerald-500/50";
    if (pct >= 50) return "bg-amber-500/50";
    if (pct >= 25) return "bg-amber-500/30";
    if (pct > 0) return "bg-red-500/30";
    return "bg-muted";
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={selectedShard} onValueChange={setSelectedShard}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {shards.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* Legend */}
        <div className="flex items-center gap-3 ml-auto text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="size-3 rounded bg-emerald-500/80" />
            100%
          </div>
          <div className="flex items-center gap-1">
            <div className="size-3 rounded bg-emerald-500/50" />
            75%+
          </div>
          <div className="flex items-center gap-1">
            <div className="size-3 rounded bg-amber-500/50" />
            50%+
          </div>
          <div className="flex items-center gap-1">
            <div className="size-3 rounded bg-amber-500/30" />
            25%+
          </div>
          <div className="flex items-center gap-1">
            <div className="size-3 rounded bg-muted border" />
            0%
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 overflow-x-auto">
          <table className="w-full border-separate border-spacing-0.5">
            <thead>
              <tr>
                <th className="text-left text-xs font-medium text-muted-foreground p-1 w-[140px]">Feature Group</th>
                {dates.map((d) => (
                  <th key={d} className="text-xs font-medium text-muted-foreground p-1 min-w-[36px]">
                    {format(new Date(d), "MM/dd")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <tr key={group}>
                  <td className="text-xs font-medium p-1 pr-3">{group}</td>
                  {dates.map((d) => {
                    const pct = getPct(group, d);
                    return (
                      <td key={d} className="p-0.5">
                        <div
                          title={`${group} — ${d}: ${pct}%`}
                          className={cn("w-full h-6 rounded transition-colors", cellColor(pct))}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── History Tab ─────────────────────────────────────────────────────────────

const historyColumns: ColumnDef<FeatureEtlJob>[] = [
  {
    accessorKey: "service_id",
    header: "Service",
    cell: ({ row }) => <span className="font-mono text-xs">{row.original.service_id}</span>,
  },
  {
    id: "shard_category",
    header: "Shard / Category",
    cell: ({ row }) => (
      <span className="text-xs">
        {row.original.shard} — {row.original.category}
      </span>
    ),
  },
  {
    id: "date_range",
    header: "Date Range",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {row.original.date_range.start} → {row.original.date_range.end}
      </span>
    ),
  },
  {
    accessorKey: "progress_pct",
    header: "Progress",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Progress value={row.original.progress_pct} className="h-1.5 w-20" />
        <span className="text-xs tabular-nums">{row.original.progress_pct}%</span>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <JobStatusBadge status={row.original.status} />,
  },
  {
    id: "completed",
    header: "Completed",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {row.original.completed_at
          ? formatDistanceToNow(new Date(row.original.completed_at), {
              addSuffix: true,
            })
          : "—"}
      </span>
    ),
  },
];

function HistoryView() {
  return (
    <Card>
      <CardContent className="p-0 pt-2">
        <DataTable
          columns={historyColumns}
          data={FEATURE_ETL_HISTORY}
          enableColumnVisibility={false}
          emptyMessage="No history yet."
          className="px-2 pb-2"
        />
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FeatureEtlPage() {
  const totalActive = FEATURE_ETL_SERVICES.reduce((sum, s) => sum + s.active_jobs, 0);
  const totalFailed = FEATURE_ETL_SERVICES.reduce((sum, s) => sum + s.failed_jobs, 0);
  const overallPct = Math.round(
    FEATURE_ETL_SERVICES.reduce((sum, s) => sum + s.overall_pct, 0) / FEATURE_ETL_SERVICES.length,
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Feature ETL"
          description="Feature computation pipeline — track progress, manage jobs, and
            monitor completion."
        />
        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:max-w-md sm:items-end">
          <div className="flex flex-wrap items-baseline justify-end gap-x-4 gap-y-1 text-sm">
            <div className="flex items-baseline gap-1.5">
              <span className="text-muted-foreground">Completion</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help font-bold tabular-nums text-emerald-400 underline decoration-dotted underline-offset-2">
                    {overallPct}%
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs">
                  Average pipeline completion across all registered feature ETL services (shard-weighted).
                </TooltipContent>
              </Tooltip>
              <span className="text-xs text-muted-foreground">({FEATURE_ETL_SERVICES.length} services)</span>
            </div>
            <Separator orientation="vertical" className="hidden h-4 sm:block" />
            <div className="flex items-baseline gap-1.5">
              <span className="text-muted-foreground">Active</span>
              <span
                className={cn("font-bold tabular-nums", totalActive > 0 ? "text-blue-400" : "text-muted-foreground")}
              >
                {totalActive}
              </span>
            </div>
            <Separator orientation="vertical" className="hidden h-4 sm:block" />
            <div className="flex items-baseline gap-1.5">
              <span className="text-muted-foreground">Failed</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className={cn(
                      "cursor-help font-bold tabular-nums underline decoration-dotted underline-offset-2",
                      totalFailed > 0 ? "text-red-400" : "text-muted-foreground",
                    )}
                  >
                    {totalFailed}
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs">
                  Jobs in a failed state across services; retry from the Active Jobs tab.
                </TooltipContent>
              </Tooltip>
            </div>
            <Separator orientation="vertical" className="hidden h-4 sm:block" />
            <div className="flex items-baseline gap-1.5">
              <span className="text-muted-foreground">Services</span>
              <span className="font-bold tabular-nums text-foreground">{FEATURE_ETL_SERVICES.length}</span>
            </div>
          </div>
          <div className="w-full sm:w-[200px]">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Pipeline avg</span>
              <span className="tabular-nums">{overallPct}%</span>
            </div>
            <Progress value={overallPct} className="mt-0.5 h-1" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="progress" className="space-y-4">
        <TabsList>
          <TabsTrigger value="progress">Progress Overview</TabsTrigger>
          <TabsTrigger value="jobs">
            Active Jobs
            {totalActive > 0 && (
              <Badge variant="outline" className="ml-1.5 text-xs border-emerald-400/30 text-emerald-400">
                {totalActive}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="heatmap">Completion Heatmap</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="progress">
          <ProgressOverview />
        </TabsContent>
        <TabsContent value="jobs">
          <ActiveJobs />
        </TabsContent>
        <TabsContent value="heatmap">
          <HeatmapView />
        </TabsContent>
        <TabsContent value="history">
          <HistoryView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
