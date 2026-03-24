"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  Play,
  Pause,
  RotateCcw,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Calendar,
  Timer,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { DATA_FLOWS, SERVICES } from "@/lib/reference-data";
import { useBatchJobs } from "@/hooks/api/use-audit";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api/fetch";

// Batch job types from system topology
interface BatchJob {
  id: string;
  name: string;
  domain: string;
  service: string;
  status: "running" | "completed" | "failed" | "queued" | "cancelled";
  progress: number;
  startedAt: string;
  duration: string;
  runDate: string; // The date being processed
  records: number;
  errors: number;
  lastSuccess: string;
  schedule: string;
}

// Generate fallback jobs from DATA_FLOWS (used when API returns no data)
const fallbackJobs: BatchJob[] = DATA_FLOWS.filter(
  (f) => f.mode === "batch",
).map((flow, idx) => ({
  id: `job-${flow.id}`,
  name: flow.id.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
  domain: flow.domain,
  service: flow.service || "Unknown",
  status:
    idx === 0
      ? "running"
      : idx === 1
        ? "queued"
        : idx % 5 === 0
          ? "failed"
          : "completed",
  progress: idx === 0 ? 67 : idx === 1 ? 0 : 100,
  startedAt: idx === 0 ? "2m ago" : idx === 1 ? "-" : "1h ago",
  duration:
    idx === 0
      ? "2m 14s"
      : idx === 1
        ? "-"
        : `${Math.floor(Math.random() * 10) + 1}m ${Math.floor(Math.random() * 60)}s`,
  runDate: "2026-03-17",
  records: Math.floor(Math.random() * 100000) + 10000,
  errors: idx % 5 === 0 ? Math.floor(Math.random() * 100) : 0,
  lastSuccess: idx % 5 === 0 ? "2d ago" : "1h ago",
  schedule: "Every hour",
}));

function getStatusIcon(status: BatchJob["status"]) {
  switch (status) {
    case "running":
      return (
        <Loader2
          className="size-4 animate-spin"
          style={{ color: "var(--status-live)" }}
        />
      );
    case "completed":
      return (
        <CheckCircle2
          className="size-4"
          style={{ color: "var(--pnl-positive)" }}
        />
      );
    case "failed":
      return (
        <XCircle className="size-4" style={{ color: "var(--pnl-negative)" }} />
      );
    case "queued":
      return <Clock className="size-4 text-muted-foreground" />;
    case "cancelled":
      return <XCircle className="size-4 text-muted-foreground" />;
  }
}

export default function JobsPage() {
  const { token } = useAuth();
  const { data: apiJobs, refetch } = useBatchJobs();

  // Use API data if available, otherwise fall back to reference-data-derived mock
  const batchJobs: BatchJob[] =
    ((apiJobs as Record<string, unknown>)?.jobs as BatchJob[]) ?? fallbackJobs;

  const runningJobs = batchJobs.filter((j) => j.status === "running");
  const queuedJobs = batchJobs.filter((j) => j.status === "queued");
  const failedJobs = batchJobs.filter((j) => j.status === "failed");
  const completedJobs = batchJobs.filter((j) => j.status === "completed");

  const handleTriggerJob = async (jobId: string) => {
    try {
      await apiFetch(`/api/audit/batch-jobs/${jobId}/trigger`, token, {
        method: "POST",
      });
      toast.success(`Job ${jobId} triggered`);
      refetch();
    } catch {
      toast.error(`Failed to trigger job ${jobId}`);
    }
  };

  const handleCancelJob = async (jobId: string) => {
    try {
      await apiFetch(`/api/audit/batch-jobs/${jobId}/cancel`, token, {
        method: "POST",
      });
      toast.success(`Job ${jobId} cancelled`);
      refetch();
    } catch {
      toast.error(`Failed to cancel job ${jobId}`);
    }
  };

  return (
    <div className="p-6">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Batch Jobs</h1>
            <p className="text-sm text-muted-foreground">
              Monitor batch processing jobs, schedules, and data pipelines
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-md">
              <Calendar className="size-4 text-muted-foreground" />
              <span className="text-sm">2026-03-17</span>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input placeholder="Search jobs..." className="pl-8 w-64" />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetch();
                toast.info("Refreshing jobs...");
              }}
            >
              <RefreshCw className="size-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Running</p>
                  <p
                    className="text-2xl font-semibold"
                    style={{ color: "var(--status-live)" }}
                  >
                    {runningJobs.length}
                  </p>
                </div>
                <Loader2
                  className="size-8 animate-spin"
                  style={{ color: "var(--status-live)" }}
                />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Queued</p>
                  <p className="text-2xl font-semibold">{queuedJobs.length}</p>
                </div>
                <Clock className="size-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-semibold pnl-positive">
                    {completedJobs.length}
                  </p>
                </div>
                <CheckCircle2
                  className="size-8"
                  style={{ color: "var(--pnl-positive)" }}
                />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Failed</p>
                  <p className="text-2xl font-semibold pnl-negative">
                    {failedJobs.length}
                  </p>
                </div>
                <XCircle
                  className="size-8"
                  style={{ color: "var(--pnl-negative)" }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Running Jobs with Progress */}
        {runningJobs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Loader2
                  className="size-4 animate-spin"
                  style={{ color: "var(--status-live)" }}
                />
                Running Jobs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {runningJobs.map((job) => (
                <div key={job.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium">{job.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {job.service} | Started {job.startedAt}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-mono">{job.progress}%</p>
                        <p className="text-xs text-muted-foreground">
                          {job.records.toLocaleString()} records
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          title="Pause"
                          onClick={() => toast.info(`Pausing ${job.name}...`)}
                        >
                          <Pause className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          title="Cancel"
                          onClick={() => handleCancelJob(job.id)}
                        >
                          <XCircle className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <Progress value={job.progress} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Jobs Table */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Jobs ({batchJobs.length})</TabsTrigger>
            <TabsTrigger value="failed">
              Failed ({failedJobs.length})
              {failedJobs.length > 0 && (
                <span className="ml-1 size-2 rounded-full bg-[var(--pnl-negative)]" />
              )}
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedJobs.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <JobsTable jobs={batchJobs} onTrigger={handleTriggerJob} />
          </TabsContent>
          <TabsContent value="failed">
            <JobsTable jobs={failedJobs} onTrigger={handleTriggerJob} />
          </TabsContent>
          <TabsContent value="completed">
            <JobsTable jobs={completedJobs} onTrigger={handleTriggerJob} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function JobsTable({
  jobs,
  onTrigger,
}: {
  jobs: BatchJob[];
  onTrigger?: (jobId: string) => void;
}) {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Job</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Run Date</TableHead>
            <TableHead className="text-right">Records</TableHead>
            <TableHead className="text-right">Errors</TableHead>
            <TableHead className="text-right">Duration</TableHead>
            <TableHead>Last Success</TableHead>
            <TableHead>Schedule</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => (
            <TableRow key={job.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{job.name}</p>
                  <p className="text-xs text-muted-foreground">{job.service}</p>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getStatusIcon(job.status)}
                  <Badge
                    variant="outline"
                    className={cn(
                      job.status === "completed" &&
                        "border-[var(--pnl-positive)]/30 text-[var(--pnl-positive)]",
                      job.status === "failed" &&
                        "border-[var(--pnl-negative)]/30 text-[var(--pnl-negative)]",
                      job.status === "running" &&
                        "border-[var(--status-live)]/30 text-[var(--status-live)]",
                    )}
                  >
                    {job.status}
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="font-mono text-sm">{job.runDate}</TableCell>
              <TableCell className="text-right font-mono">
                {job.records.toLocaleString()}
              </TableCell>
              <TableCell className="text-right">
                <span
                  className={cn(
                    "font-mono",
                    job.errors > 0 && "text-[var(--pnl-negative)]",
                  )}
                >
                  {job.errors}
                </span>
              </TableCell>
              <TableCell className="text-right font-mono text-sm">
                {job.duration}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {job.lastSuccess}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {job.schedule}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    title="Rerun"
                    onClick={() => onTrigger?.(job.id)}
                  >
                    <RotateCcw className="size-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
