"use client";

import { useExecutionDataStatusContext } from "@/components/ops/deployment/data-status/execution-data-status-context";
import { getCompletionColor } from "@/components/ops/deployment/data-status/execution-data-status-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/shared/spinner";
import { CheckCircle2, Database, Rocket, XCircle } from "lucide-react";
import { formatPercent } from "@/lib/utils/formatters";

export function ExecutionDataStatusSummary() {
  const { data, fetchMissingShards, loadingMissingShards } = useExecutionDataStatusContext();

  if (!data) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl font-mono flex items-center gap-2">
              <Database className="h-5 w-5" />
              Execution Results Status
            </CardTitle>
            <CardDescription className="mt-1">
              {data.version} • {data.strategy_count} strategies • {data.total_configs} configs
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-3xl font-mono font-bold" style={{ color: getCompletionColor(data.completion_pct) }}>
              {formatPercent(data.completion_pct, 1)}
            </div>
            <div className="text-xs text-[var(--color-text-muted)]">
              {data.configs_with_results} / {data.total_configs} configs have results
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-2 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${data.completion_pct}%`,
              backgroundColor: getCompletionColor(data.completion_pct),
            }}
          />
        </div>

        {data.completion_pct >= 100 ? (
          <div className="mt-4 flex items-center justify-center p-3 rounded-lg bg-[var(--color-status-success-bg)] border border-[var(--color-status-success-border)]">
            <CheckCircle2 className="h-4 w-4 text-[var(--color-accent-green)] mr-2" />
            <span className="text-sm text-[var(--color-accent-green)]">All configs have execution results</span>
          </div>
        ) : (
          <div className="mt-4 flex items-center justify-between p-3 rounded-lg bg-[var(--color-status-error-bg)] border border-[var(--color-status-error-border)]">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-[var(--color-accent-red)]" />
              <span className="text-sm">
                <strong>{data.missing_count}</strong> configs missing results
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void fetchMissingShards()}
              disabled={loadingMissingShards}
              className="border-[var(--color-accent-red)] text-[var(--color-accent-red)] hover:bg-[var(--color-status-error-bg)]"
            >
              {loadingMissingShards ? <Spinner className="h-4 w-4 mr-2" /> : <Rocket className="h-4 w-4 mr-2" />}
              Deploy Missing
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
