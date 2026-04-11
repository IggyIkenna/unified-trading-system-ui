"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Spinner } from "@/components/shared/spinner";
import { ApiError } from "@/components/shared/api-error";
import { CheckCircle2, XCircle, AlertCircle, RefreshCw, Activity, PlayCircle } from "lucide-react";
import { useRunHealthChecks, useHealthCheckHistory } from "@/hooks/api/use-user-management";
import type { HealthCheckResult, HealthCheckHistoryEntry, HealthCheckItem } from "@/lib/types/user-management";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Helpers — HealthCheckItem uses ok: boolean
// ---------------------------------------------------------------------------

function checkStatus(check: HealthCheckItem): "healthy" | "down" {
  return check.ok ? "healthy" : "down";
}

function statusIcon(status: "healthy" | "down" | "degraded") {
  if (status === "healthy") return <CheckCircle2 className="size-4 text-emerald-400" />;
  if (status === "degraded") return <AlertCircle className="size-4 text-amber-400" />;
  return <XCircle className="size-4 text-rose-400" />;
}

function statusBadge(status: "healthy" | "down" | "degraded") {
  if (status === "healthy")
    return <Badge className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-400/30">Healthy</Badge>;
  if (status === "degraded")
    return <Badge className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-400/30">Degraded</Badge>;
  return <Badge variant="destructive" className="text-[10px]">Down</Badge>;
}

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ---------------------------------------------------------------------------
// Provider health card
// ---------------------------------------------------------------------------

function HealthCard({ check }: { check: HealthCheckItem }) {
  const st = checkStatus(check);
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-3 px-4">
        <CardTitle className="text-sm font-medium">{check.provider}</CardTitle>
        {statusIcon(st)}
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-2">
        {statusBadge(st)}
        {check.details?.latency_ms !== undefined && (
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Latency</span>
              <span className="font-mono">{check.details.latency_ms}ms</span>
            </div>
          </div>
        )}
        {check.message && (
          <p className="text-[10px] text-muted-foreground leading-relaxed">{check.message}</p>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ProviderHealthChecksPage() {
  const runMutation = useRunHealthChecks();
  const { data: historyData, isLoading: historyLoading, isError: historyError, error: historyErr, refetch } =
    useHealthCheckHistory();

  const [latestResult, setLatestResult] = React.useState<HealthCheckResult | null>(null);
  const [running, setRunning] = React.useState(false);

  const history: HealthCheckHistoryEntry[] = historyData?.history ?? [];

  function handleRun() {
    setRunning(true);
    runMutation.mutate(undefined, {
      onSuccess: (result) => {
        setLatestResult((result as { result?: HealthCheckResult }).result ?? result as unknown as HealthCheckResult);
        toast.success("Health checks complete");
        refetch();
        setRunning(false);
      },
      onError: (err) => {
        toast.error(`Health check failed: ${err.message}`);
        setRunning(false);
      },
    });
  }

  const displayChecks = latestResult?.checks ?? (history[0]?.checks ?? []);
  const overallStatus: "healthy" | "down" | "degraded" = displayChecks.every((c) => c.ok)
    ? "healthy"
    : displayChecks.some((c) => !c.ok)
      ? "down"
      : "degraded";

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title={<span className="flex items-center gap-2"><Activity className="size-5" />Provider Health Checks</span>}
        description="Real-time status of all provisioning providers (GitHub, Slack, M365, GCP, AWS, Portal)."
      >
        <Button size="sm" onClick={handleRun} disabled={running}>
          {running ? <Spinner size="sm" className="mr-1.5" /> : <PlayCircle className="size-3.5 mr-1.5" />}
          Run Checks
        </Button>
      </PageHeader>

      {/* Overall status banner */}
      {displayChecks.length > 0 && (
        <div
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium",
            overallStatus === "healthy" && "bg-emerald-500/10 text-emerald-400",
            overallStatus === "degraded" && "bg-amber-500/10 text-amber-400",
            overallStatus === "down" && "bg-rose-500/10 text-rose-400",
          )}
        >
          {statusIcon(overallStatus)}
          <span>
            {overallStatus === "healthy"
              ? "All providers healthy"
              : overallStatus === "degraded"
                ? "Some providers degraded"
                : "One or more providers unreachable"}
          </span>
          {latestResult && (
            <span className="ml-auto text-[10px] text-muted-foreground font-normal">
              Last run {formatTimeAgo(latestResult.checked_at)}
            </span>
          )}
        </div>
      )}

      {/* Provider cards grid */}
      {running && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner size="sm" /> Running checks...
        </div>
      )}

      {!running && displayChecks.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayChecks.map((check) => (
            <HealthCard key={check.provider} check={check} />
          ))}
        </div>
      )}

      {!running && displayChecks.length === 0 && (
        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm gap-2">
          <Activity className="size-8 opacity-30" />
          <span>No health check results. Run checks to see provider status.</span>
        </div>
      )}

      {/* History table */}
      <div>
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <RefreshCw className="size-4" /> Check History
        </h2>

        {historyLoading && <Spinner size="sm" />}
        {historyError && <ApiError error={historyErr} onRetry={() => void refetch()} />}

        {!historyLoading && !historyError && history.length > 0 && (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Run At</TableHead>
                  <TableHead>Overall</TableHead>
                  <TableHead>Healthy</TableHead>
                  <TableHead>Degraded</TableHead>
                  <TableHead>Down</TableHead>
                  <TableHead>Triggered By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((entry) => {
                  const checks = entry.checks ?? [];
                  const healthyCount = checks.filter((c) => c.ok).length;
                  const downCount = checks.filter((c) => !c.ok).length;
                  const degradedCount = 0;
                  const overall: "healthy" | "down" | "degraded" =
                    downCount > 0 ? "down" : degradedCount > 0 ? "degraded" : "healthy";
                  return (
                    <TableRow key={entry.id} className="hover:bg-muted/20">
                      <TableCell className="text-xs text-muted-foreground">
                        {formatTimeAgo(entry.checked_at)}
                      </TableCell>
                      <TableCell>{statusBadge(overall)}</TableCell>
                      <TableCell>
                        <span className="text-xs text-emerald-400 font-mono">{healthyCount}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-amber-400 font-mono">{degradedCount}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-rose-400 font-mono">{downCount}</span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {(entry as unknown as Record<string, string>).triggered_by ?? "System"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
