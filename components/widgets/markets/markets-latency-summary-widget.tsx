"use client";

import * as React from "react";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, BarChart3, Database, LayoutGrid, LineChart, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
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
  } = useMarketsData();

  return (
    <div className="p-2 space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] text-muted-foreground">View</span>
          <div className="flex rounded-md border border-border overflow-hidden">
            <Button
              variant={latencyViewMode === "cross-section" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-none gap-1 h-7 text-[10px] px-2"
              onClick={() => setLatencyViewMode("cross-section")}
            >
              <LayoutGrid className="size-3" />
              Cross
            </Button>
            <Button
              variant={latencyViewMode === "time-series" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-none gap-1 h-7 text-[10px] px-2"
              onClick={() => setLatencyViewMode("time-series")}
            >
              <LineChart className="size-3" />
              Series
            </Button>
          </div>
          <span className="text-[10px] text-muted-foreground ml-1">Data</span>
          <div className="flex rounded-md border border-border overflow-hidden">
            <Button
              variant={latencyDataMode === "live" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-none gap-1 h-7 text-[10px] px-2"
              onClick={() => setLatencyDataMode("live")}
            >
              <Radio className="size-3" />
              Live
            </Button>
            <Button
              variant={latencyDataMode === "batch" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-none gap-1 h-7 text-[10px] px-2"
              onClick={() => setLatencyDataMode("batch")}
            >
              <Database className="size-3" />
              Batch
            </Button>
            <Button
              variant={latencyDataMode === "compare" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-none gap-1 h-7 text-[10px] px-2"
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
            className="h-7 text-[10px]"
            onClick={() => setSelectedLatencyService(null)}
          >
            Clear selection
          </Button>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-mono text-muted-foreground">Service latency (ms)</span>
        <Badge variant="outline" className="text-[10px] font-mono">
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
                    metric.status === "critical" && "bg-[var(--status-error)]",
                  )}
                />
                <div className="min-w-0">
                  <div className="text-xs font-medium truncate">{metric.service}</div>
                  <div className="text-[10px] text-muted-foreground">{metric.lifecycle.length} stages</div>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                {latencyDataMode === "compare" ? (
                  <>
                    <div className="text-center">
                      <div className="text-[9px] text-muted-foreground">p50</div>
                      <div className="font-mono text-[10px]">{metric.p50.toFixed(1)}</div>
                      <div
                        className={cn(
                          "text-[9px] font-mono",
                          deltaP50 > 0 ? "text-[var(--pnl-negative)]" : "text-[var(--pnl-positive)]",
                        )}
                      >
                        {deltaP50 > 0 ? "+" : ""}
                        {deltaP50.toFixed(1)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-[9px] text-muted-foreground">p95</div>
                      <div className="font-mono text-[10px]">{metric.p95.toFixed(1)}</div>
                      <div
                        className={cn(
                          "text-[9px] font-mono",
                          deltaP95 > 0 ? "text-[var(--pnl-negative)]" : "text-[var(--pnl-positive)]",
                        )}
                      >
                        {deltaP95 > 0 ? "+" : ""}
                        {deltaP95.toFixed(1)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-[9px] text-muted-foreground">p99</div>
                      <div
                        className={cn("font-mono text-[10px]", metric.p99 > 30 ? "text-[var(--status-warning)]" : "")}
                      >
                        {metric.p99.toFixed(1)}
                      </div>
                      <div
                        className={cn(
                          "text-[9px] font-mono",
                          deltaP99 > 0 ? "text-[var(--pnl-negative)]" : "text-[var(--pnl-positive)]",
                        )}
                      >
                        {deltaP99 > 0 ? "+" : ""}
                        {deltaP99.toFixed(1)}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-center">
                      <div className="text-[9px] text-muted-foreground">p50</div>
                      <div className="font-mono text-[10px]">{displayP50.toFixed(1)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[9px] text-muted-foreground">p95</div>
                      <div className="font-mono text-[10px]">{displayP95.toFixed(1)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[9px] text-muted-foreground">p99</div>
                      <div
                        className={cn("font-mono text-[10px]", displayP99 > 30 ? "text-[var(--status-warning)]" : "")}
                      >
                        {displayP99.toFixed(1)}
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
