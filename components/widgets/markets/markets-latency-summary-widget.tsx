"use client";

import * as React from "react";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { Spinner } from "@/components/shared/spinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowRight, BarChart3, Database, LayoutGrid, LineChart, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils/formatters";
import { useMarketsData } from "./markets-data-context";

export function MarketsLatencySummaryWidget(_props: WidgetComponentProps) {
  const {
    latencyMetrics,
    latencyDataMode,
    setLatencyDataMode,
    latencyViewMode,
    setLatencyViewMode,
    selectedLatencyService,
    setSelectedLatencyService,
    isLoading,
    isError,
  } = useMarketsData();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-muted-foreground">
        <Spinner className="size-5" />
        <span className="text-sm">Loading…</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground px-4 text-center">
        <AlertCircle className="size-8 text-destructive" />
        <p className="text-sm">Failed to load latency metrics</p>
      </div>
    );
  }

  if (latencyMetrics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center text-sm text-muted-foreground">
        <p>No latency data available</p>
      </div>
    );
  }

  return (
    <div className="p-2 space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-micro text-muted-foreground">View</span>
          <div className="flex rounded-md border border-border overflow-hidden">
            <Button
              variant={latencyViewMode === "cross-section" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-none gap-1 h-7 text-micro px-2"
              onClick={() => setLatencyViewMode("cross-section")}
            >
              <LayoutGrid className="size-3" />
              Cross
            </Button>
            <Button
              variant={latencyViewMode === "time-series" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-none gap-1 h-7 text-micro px-2"
              onClick={() => setLatencyViewMode("time-series")}
            >
              <LineChart className="size-3" />
              Series
            </Button>
          </div>
          <span className="text-micro text-muted-foreground ml-1">Data</span>
          <div className="flex rounded-md border border-border overflow-hidden">
            <Button
              variant={latencyDataMode === "live" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-none gap-1 h-7 text-micro px-2"
              onClick={() => setLatencyDataMode("live")}
            >
              <Radio className="size-3" />
              Live
            </Button>
            <Button
              variant={latencyDataMode === "batch" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-none gap-1 h-7 text-micro px-2"
              onClick={() => setLatencyDataMode("batch")}
            >
              <Database className="size-3" />
              Batch
            </Button>
            <Button
              variant={latencyDataMode === "compare" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-none gap-1 h-7 text-micro px-2"
              onClick={() => setLatencyDataMode("compare")}
            >
              <BarChart3 className="size-3" />
              Compare
            </Button>
          </div>
        </div>
        {selectedLatencyService && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-micro"
            onClick={() => setSelectedLatencyService(null)}
          >
            Clear selection
          </Button>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="text-micro font-mono text-muted-foreground">Service latency (ms)</span>
        <Badge variant="outline" className="text-micro font-mono">
          {latencyDataMode === "live" ? "Live" : latencyDataMode === "batch" ? "Batch (sim)" : "Live vs batch"}
        </Badge>
      </div>

      <div className="space-y-2">
        {latencyMetrics.map((metric) => {
          const displayP50 = latencyDataMode === "batch" ? metric.batch.p50 : metric.p50;
          const displayP95 = latencyDataMode === "batch" ? metric.batch.p95 : metric.p95;
          const displayP99 = latencyDataMode === "batch" ? metric.batch.p99 : metric.p99;
          const deltaP50 = metric.p50 - metric.batch.p50;
          const deltaP95 = metric.p95 - metric.batch.p95;
          const deltaP99 = metric.p99 - metric.batch.p99;
          const isSelected = selectedLatencyService === metric.serviceId;

          return (
            <button
              key={metric.serviceId}
              type="button"
              onClick={() => setSelectedLatencyService(metric.serviceId)}
              className={cn(
                "w-full flex items-center justify-between p-3 rounded-lg border text-left transition-colors",
                isSelected ? "border-primary bg-muted/40" : "border-border hover:bg-muted/50",
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={cn(
                    "size-2 rounded-full shrink-0",
                    metric.status === "healthy" && "bg-[var(--status-live)]",
                    metric.status === "warning" && "bg-[var(--status-warning)]",
                    metric.status === "critical" && "bg-[var(--status-critical)]",
                  )}
                />
                <div className="min-w-0">
                  <div className="text-xs font-medium truncate">{metric.service}</div>
                  <div className="text-micro text-muted-foreground">{metric.lifecycle.length} stages</div>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                {latencyDataMode === "compare" ? (
                  <>
                    <div className="text-center">
                      <div className="text-nano text-muted-foreground">p50</div>
                      <div className="font-mono text-micro">{formatNumber(metric.p50, 1)}</div>
                      <div
                        className={cn(
                          "text-nano font-mono",
                          deltaP50 > 0 ? "text-[var(--pnl-negative)]" : "text-[var(--pnl-positive)]",
                        )}
                      >
                        {deltaP50 > 0 ? "+" : ""}
                        {formatNumber(deltaP50, 1)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-nano text-muted-foreground">p95</div>
                      <div className="font-mono text-micro">{formatNumber(metric.p95, 1)}</div>
                      <div
                        className={cn(
                          "text-nano font-mono",
                          deltaP95 > 0 ? "text-[var(--pnl-negative)]" : "text-[var(--pnl-positive)]",
                        )}
                      >
                        {deltaP95 > 0 ? "+" : ""}
                        {formatNumber(deltaP95, 1)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-nano text-muted-foreground">p99</div>
                      <div
                        className={cn("font-mono text-micro", metric.p99 > 30 ? "text-[var(--status-warning)]" : "")}
                      >
                        {formatNumber(metric.p99, 1)}
                      </div>
                      <div
                        className={cn(
                          "text-nano font-mono",
                          deltaP99 > 0 ? "text-[var(--pnl-negative)]" : "text-[var(--pnl-positive)]",
                        )}
                      >
                        {deltaP99 > 0 ? "+" : ""}
                        {formatNumber(deltaP99, 1)}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-center">
                      <div className="text-nano text-muted-foreground">p50</div>
                      <div className="font-mono text-micro">{formatNumber(displayP50, 1)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-nano text-muted-foreground">p95</div>
                      <div className="font-mono text-micro">{formatNumber(displayP95, 1)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-nano text-muted-foreground">p99</div>
                      <div
                        className={cn("font-mono text-micro", displayP99 > 30 ? "text-[var(--status-warning)]" : "")}
                      >
                        {formatNumber(displayP99, 1)}
                      </div>
                    </div>
                  </>
                )}
                <ArrowRight className="size-3.5 text-muted-foreground hidden sm:block" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
