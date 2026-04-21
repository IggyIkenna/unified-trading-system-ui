"use client";

import * as React from "react";
import { Activity, CheckCircle2, XCircle, Play, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/shared/spinner";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { runHealthChecks, listHealthCheckHistory } from "@/lib/admin/api/admin";
import { formatDateTime } from "@/lib/admin/utils";
import type {
  HealthCheckItem,
  HealthCheckResult,
  HealthCheckHistoryEntry,
} from "@/lib/admin/api/types";

type ResultFilter = "all" | "ok" | "failed";

export default function HealthChecksPage() {
  const [result, setResult] = React.useState<HealthCheckResult | null>(null);
  const [running, setRunning] = React.useState(false);
  const [error, setError] = React.useState("");
  const [resultFilter, setResultFilter] = React.useState<ResultFilter>("all");

  const [history, setHistory] = React.useState<HealthCheckHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = React.useState(true);

  const fetchHistory = React.useCallback(async () => {
    try {
      setHistoryLoading(true);
      const res = await listHealthCheckHistory();
      setHistory(res.data.runs);
    } catch {
      /* non-critical */
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  async function handleRun() {
    setRunning(true);
    setError("");
    setResult(null);
    try {
      const res = await runHealthChecks();
      setResult(res.data);
      await fetchHistory();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to run health checks",
      );
    } finally {
      setRunning(false);
    }
  }

  const filteredChecks = React.useMemo(() => {
    if (!result) return [];
    if (resultFilter === "all") return result.checks;
    if (resultFilter === "ok") return result.checks.filter((c) => c.ok);
    return result.checks.filter((c) => !c.ok);
  }, [result, resultFilter]);

  function renderCheck(check: HealthCheckItem) {
    return (
      <Card key={check.provider}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{check.provider}</CardTitle>
            {check.ok ? (
              <Badge className="gap-1 bg-emerald-600/15 text-emerald-400 border-emerald-600/20">
                <CheckCircle2 className="size-3" />
                OK
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1">
                <XCircle className="size-3" />
                Failed
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{check.message}</p>
          {Boolean(check.details) && (
            <pre className="mt-2 rounded-md bg-muted p-2 text-xs overflow-auto max-h-32">
              {JSON.stringify(
                check.details as Record<string, unknown>,
                null,
                2,
              )}
            </pre>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Health Checks</h1>
          <p className="text-sm text-muted-foreground">
            Verify connectivity to external providers
          </p>
        </div>
        <Button size="sm" onClick={handleRun} disabled={running}>
          {running ? (
            <Spinner className="mr-2 size-4" />
          ) : (
            <Play className="mr-2 size-4" />
          )}
          Run Health Checks
        </Button>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {result && (
        <>
          <div className="flex items-center gap-3">
            <Badge
              className={
                result.ok
                  ? "bg-emerald-600/15 text-emerald-400 border-emerald-600/20"
                  : "bg-destructive/15 text-destructive"
              }
            >
              {result.ok ? "All Healthy" : "Issues Detected"}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {formatDateTime(result.checked_at)}
            </span>
            <Select
              value={resultFilter}
              onValueChange={(v) => setResultFilter(v as ResultFilter)}
            >
              <SelectTrigger className="w-32 ml-auto">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="ok">OK only</SelectItem>
                <SelectItem value="failed">Failed only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredChecks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No checks match the current filter.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredChecks.map(renderCheck)}
            </div>
          )}
        </>
      )}

      {!result && !running && !error && (
        <EmptyState
          icon={Activity}
          title="No results yet"
          description='Click "Run Health Checks" to test all provider connections.'
        />
      )}

      <Separator />

      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Clock className="size-4 text-muted-foreground" />
          History
        </h2>
        {historyLoading ? (
          <Spinner className="size-5" />
        ) : history.length === 0 ? (
          <p className="text-sm text-muted-foreground">No previous runs.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {history.slice(0, 9).map((run) => (
              <Card key={run.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(run.checked_at)}
                    </span>
                    {run.ok ? (
                      <Badge className="gap-1 bg-emerald-600/15 text-emerald-400 border-emerald-600/20 text-xs">
                        <CheckCircle2 className="size-3" />
                        Pass
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="gap-1 text-xs">
                        <XCircle className="size-3" />
                        Fail
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {run.checks.filter((c) => c.ok).length}/{run.checks.length}{" "}
                    providers healthy
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
