"use client";

import * as React from "react";
import { formatDistanceToNow, format } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  RotateCcw,
  RefreshCw,
  AlertTriangle,
  Cpu,
  Server,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  FEATURE_ETL_SERVICES,
  FEATURE_ETL_JOBS,
  FEATURE_ETL_HISTORY,
  FEATURE_ETL_HEATMAP,
} from "@/lib/build-mock-data";
import type { FeatureEtlJob } from "@/lib/build-mock-data";
import Link from "next/link";

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
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {FEATURE_ETL_SERVICES.map((svc) => (
          <Card key={svc.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="size-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-mono">
                    {svc.name}
                  </CardTitle>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
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
              </div>
              <CardDescription className="text-xs">
                Shard: {svc.shard}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Overall */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Overall</span>
                  <span className="font-medium tabular-nums">
                    {svc.shards_complete}/{svc.shards_total} shards (
                    {svc.overall_pct}%)
                  </span>
                </div>
                <Progress value={svc.overall_pct} className="h-2" />
              </div>

              {/* By category */}
              <div className="space-y-1.5">
                {Object.entries(svc.by_category).map(([cat, data]) => (
                  <div key={cat} className="space-y-0.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{cat}</span>
                      <span className="tabular-nums">{data.pct}%</span>
                    </div>
                    <Progress value={data.pct} className="h-1" />
                  </div>
                ))}
              </div>

              <div className="text-xs text-muted-foreground pt-1">
                Updated{" "}
                {formatDistanceToNow(new Date(svc.last_updated), {
                  addSuffix: true,
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs gap-1"
              >
                <Play className="size-3" />
                Trigger Compute
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Active Jobs Tab ──────────────────────────────────────────────────────────

function ActiveJobs() {
  const running = FEATURE_ETL_JOBS.filter(
    (j) => j.status === "running" || j.status === "queued",
  );
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
                <div
                  key={job.id}
                  className="rounded-lg border border-red-400/20 p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">
                        {job.shard} — {job.category}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {job.service_id}
                      </p>
                    </div>
                    <JobStatusBadge status={job.status} />
                  </div>
                  {job.error && (
                    <p className="text-xs text-red-400 bg-red-400/10 rounded p-2">
                      {job.error}
                    </p>
                  )}
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
            <p className="text-sm text-muted-foreground text-center py-8">
              No active jobs
            </p>
          ) : (
            <div className="space-y-3">
              {running.map((job) => (
                <div
                  key={job.id}
                  className="rounded-lg border border-border/50 p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">
                        {job.shard} — {job.category}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {job.service_id} · {job.date_range.start} →{" "}
                        {job.date_range.end}
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
  const filteredCells = FEATURE_ETL_HEATMAP.filter(
    (c) => c.shard === selectedShard,
  );

  const dates = [...new Set(filteredCells.map((c) => c.date))].sort();
  const groups = [...new Set(filteredCells.map((c) => c.feature_group))];

  function getPct(group: string, date: string): number {
    return (
      filteredCells.find((c) => c.feature_group === group && c.date === date)
        ?.pct ?? 0
    );
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
                <th className="text-left text-xs font-medium text-muted-foreground p-1 w-[140px]">
                  Feature Group
                </th>
                {dates.map((d) => (
                  <th
                    key={d}
                    className="text-xs font-medium text-muted-foreground p-1 min-w-[36px]"
                  >
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
                          className={cn(
                            "w-full h-6 rounded transition-colors",
                            cellColor(pct),
                          )}
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

function HistoryView() {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Service</TableHead>
              <TableHead>Shard / Category</TableHead>
              <TableHead>Date Range</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Completed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {FEATURE_ETL_HISTORY.map((job) => (
              <TableRow key={job.id}>
                <TableCell className="font-mono text-xs">
                  {job.service_id}
                </TableCell>
                <TableCell>
                  <span className="text-xs">
                    {job.shard} — {job.category}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {job.date_range.start} → {job.date_range.end}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={job.progress_pct} className="h-1.5 w-20" />
                    <span className="text-xs tabular-nums">
                      {job.progress_pct}%
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <JobStatusBadge status={job.status} />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {job.completed_at
                    ? formatDistanceToNow(new Date(job.completed_at), {
                        addSuffix: true,
                      })
                    : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FeatureEtlPage() {
  const totalActive = FEATURE_ETL_SERVICES.reduce(
    (sum, s) => sum + s.active_jobs,
    0,
  );
  const totalFailed = FEATURE_ETL_SERVICES.reduce(
    (sum, s) => sum + s.failed_jobs,
    0,
  );
  const overallPct = Math.round(
    FEATURE_ETL_SERVICES.reduce((sum, s) => sum + s.overall_pct, 0) /
      FEATURE_ETL_SERVICES.length,
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Feature ETL</h1>
          <p className="text-muted-foreground mt-1">
            Feature computation pipeline — track progress, manage jobs, and
            monitor completion.
          </p>
        </div>
        <Button size="sm" asChild>
          <Link href="/services/research/features">View Feature Catalogue</Link>
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Overall Completion",
            value: `${overallPct}%`,
            sub: `${FEATURE_ETL_SERVICES.length} services`,
            color: "text-emerald-400",
          },
          {
            label: "Active Jobs",
            value: String(totalActive),
            sub: "Currently running",
            color: totalActive > 0 ? "text-blue-400" : "text-muted-foreground",
          },
          {
            label: "Failed Jobs",
            value: String(totalFailed),
            sub: "Require attention",
            color: totalFailed > 0 ? "text-red-400" : "text-muted-foreground",
          },
          {
            label: "Services",
            value: String(FEATURE_ETL_SERVICES.length),
            sub: "Compute services",
            color: "text-primary",
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className={cn("text-2xl font-bold tabular-nums", s.color)}>
                {s.value}
              </p>
              <p className="text-sm font-medium mt-0.5">{s.label}</p>
              <p className="text-xs text-muted-foreground">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alert banner for failed jobs */}
      {totalFailed > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-red-400/30 bg-red-400/5 p-3">
          <AlertTriangle className="size-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-400">
            {totalFailed} feature computation job{totalFailed > 1 ? "s" : ""}{" "}
            failed. Check the Active Jobs tab to retry.
          </p>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="progress" className="space-y-4">
        <TabsList>
          <TabsTrigger value="progress">Progress Overview</TabsTrigger>
          <TabsTrigger value="jobs">
            Active Jobs
            {totalActive > 0 && (
              <Badge
                variant="outline"
                className="ml-1.5 text-xs border-emerald-400/30 text-emerald-400"
              >
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
