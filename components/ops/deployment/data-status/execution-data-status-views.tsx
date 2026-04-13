"use client";

import { Layers, FileCode, Clock, Cpu } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useExecutionDataStatusContext } from "@/components/ops/deployment/data-status/execution-data-status-context";
import { ExecutionDataStatusBreakdownList } from "@/components/ops/deployment/data-status/execution-data-status-breakdown-list";
import type { ViewMode } from "@/components/ops/deployment/data-status/execution-data-status-types";

export function ExecutionDataStatusViews() {
  const { data, viewMode, setViewMode, expandedBreakdowns, toggleBreakdown } = useExecutionDataStatusContext();

  if (!data) return null;

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--color-text-muted)]">
          Drill down by attribute to diagnose patterns in missing results
        </p>
        <div className="flex items-center bg-[var(--color-bg-tertiary)] rounded-lg p-1">
          {(
            [
              {
                id: "hierarchy" as const,
                label: "Hierarchy",
                icon: <Layers className="h-3.5 w-3.5" />,
              },
              {
                id: "by_mode" as const,
                label: "Mode",
                icon: <FileCode className="h-3.5 w-3.5" />,
              },
              {
                id: "by_timeframe" as const,
                label: "Timeframe",
                icon: <Clock className="h-3.5 w-3.5" />,
              },
              {
                id: "by_algo" as const,
                label: "Algorithm",
                icon: <Cpu className="h-3.5 w-3.5" />,
              },
            ] as const
          ).map(({ id, label, icon }) => (
            <Button
              key={id}
              variant={viewMode === id ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode(id as ViewMode)}
              className="flex items-center gap-1.5 text-xs font-medium"
            >
              {icon}
              {label}
            </Button>
          ))}
        </div>
      </div>

      {viewMode === "by_mode" && data.breakdown_by_mode && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileCode className="h-4 w-4" />
              Breakdown by Mode
            </CardTitle>
            <CardDescription>Compare SCE vs HUF or other execution modes</CardDescription>
          </CardHeader>
          <CardContent>
            <ExecutionDataStatusBreakdownList
              breakdown={data.breakdown_by_mode}
              labelKey="mode"
              icon={<FileCode className="h-4 w-4 text-[var(--color-accent-purple)]" />}
              expandedBreakdowns={expandedBreakdowns}
              toggleBreakdown={toggleBreakdown}
            />
          </CardContent>
        </Card>
      )}

      {viewMode === "by_timeframe" && data.breakdown_by_timeframe && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Breakdown by Timeframe
            </CardTitle>
            <CardDescription>Compare 5M vs 15M vs 1H etc.</CardDescription>
          </CardHeader>
          <CardContent>
            <ExecutionDataStatusBreakdownList
              breakdown={data.breakdown_by_timeframe}
              labelKey="timeframe"
              icon={<Clock className="h-4 w-4 text-[var(--color-accent-cyan)]" />}
              expandedBreakdowns={expandedBreakdowns}
              toggleBreakdown={toggleBreakdown}
            />
          </CardContent>
        </Card>
      )}

      {viewMode === "by_algo" && data.breakdown_by_algo && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              Breakdown by Algorithm
            </CardTitle>
            <CardDescription>Compare TWAP vs VWAP vs Iceberg etc. - identify algo-specific issues</CardDescription>
          </CardHeader>
          <CardContent>
            <ExecutionDataStatusBreakdownList
              breakdown={data.breakdown_by_algo}
              labelKey="algo"
              icon={<Cpu className="h-4 w-4 text-[var(--color-accent-amber)]" />}
              expandedBreakdowns={expandedBreakdowns}
              toggleBreakdown={toggleBreakdown}
            />
          </CardContent>
        </Card>
      )}
    </>
  );
}
