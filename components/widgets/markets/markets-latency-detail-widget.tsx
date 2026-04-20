"use client";

import * as React from "react";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { CollapsibleSection } from "@/components/shared/collapsible-section";
import { KpiStrip } from "@/components/shared/kpi-strip";
import { Spinner } from "@/components/shared/spinner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";
import { useMarketsData } from "./markets-data-context";

/** Deterministic simulated batch per stage (avoids Math.random hydration drift). */
function simulatedBatchMs(live: number, idx: number, field: "p50" | "p95" | "p99"): number {
  const base = field === "p50" ? 0.92 : field === "p95" ? 0.9 : 0.88;
  const step = 0.008 * (idx + 1);
  return live * (base - step);
}

export function MarketsLatencyDetailWidget(_props: WidgetComponentProps) {
  const { latencyMetrics, selectedLatencyService, latencyViewMode, latencyDataMode, isLoading, isError } =
    useMarketsData();

  const metric = React.useMemo(
    () => latencyMetrics.find((m) => m.serviceId === selectedLatencyService),
    [latencyMetrics, selectedLatencyService],
  );

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
        <p className="text-sm">Failed to load latency data</p>
      </div>
    );
  }

  if (!metric) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center text-sm text-muted-foreground">
        <p>Select a service in Latency Summary to view breakdown and charts.</p>
      </div>
    );
  }

  const kpiMetrics = [
    { label: "p50", value: `${formatNumber(metric.p50, 1)}ms` },
    { label: "p95", value: `${formatNumber(metric.p95, 1)}ms` },
    {
      label: "p99",
      value: `${formatNumber(metric.p99, 1)}ms`,
      sentiment: (metric.p99 > 30 ? "negative" : "neutral") as "negative" | "neutral",
    },
  ];

  return (
    <div className="p-2 space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={cn(
            "size-2.5 rounded-full shrink-0",
            metric.status === "healthy" && "bg-[var(--status-live)]",
            metric.status === "warning" && "bg-[var(--status-warning)]",
            metric.status === "critical" && "bg-[var(--status-critical)]",
          )}
        />
        <span className="text-sm font-medium truncate">{metric.service}</span>
        <Badge variant="outline" className="text-micro ml-auto">
          {latencyDataMode === "live" ? "Live" : latencyDataMode === "batch" ? "Batch" : "Compare"}
        </Badge>
      </div>

      <KpiStrip metrics={kpiMetrics} columns={3} className="rounded-md" />

      {latencyDataMode === "compare" && (
        <div className="text-micro text-muted-foreground px-0.5">
          Compare row uses live vs simulated batch multipliers per stage (stable).
        </div>
      )}

      {latencyViewMode === "cross-section" && (
        <Card className="border-border/60">
          <CardHeader className="py-2 px-3">
            <span className="text-xs font-medium">Lifecycle breakdown</span>
          </CardHeader>
          <CardContent className="px-3 pb-3 pt-0 space-y-2">
            {metric.lifecycle.map((stage, idx) => {
              const totalP50 = metric.lifecycle.reduce((s, x) => s + x.p50, 0);
              const percentage = (stage.p50 / totalP50) * 100;
              return (
                <div key={stage.stage} className="space-y-1">
                  <div className="flex items-center justify-between gap-2 text-micro">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-mono text-muted-foreground w-3">{idx + 1}</span>
                      <span className="font-medium truncate">{stage.stage}</span>
                    </div>
                    <div className="flex gap-3 font-mono text-micro shrink-0">
                      <span className="text-muted-foreground w-12 text-right">{formatNumber(stage.p50, 2)}</span>
                      <span className="text-muted-foreground w-12 text-right">{formatNumber(stage.p95, 2)}</span>
                      <span className={cn("w-12 text-right", stage.p99 > 5 ? "text-[var(--status-warning)]" : "")}>
                        {formatNumber(stage.p99, 2)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-chart-3 rounded-full" style={{ width: `${percentage}%` }} />
                    </div>
                    <span className="text-nano text-muted-foreground w-10 text-right">
                      {formatPercent(percentage, 0)}
                    </span>
                  </div>
                </div>
              );
            })}
            <div className="flex justify-end gap-3 pt-2 border-t text-nano text-muted-foreground font-mono">
              <span className="w-12 text-right">p50</span>
              <span className="w-12 text-right">p95</span>
              <span className="w-12 text-right">p99</span>
            </div>
          </CardContent>
        </Card>
      )}

      {latencyViewMode === "time-series" && (
        <Card className="border-border/60">
          <CardHeader className="py-2 px-3">
            <span className="text-xs font-medium">Latency over time (24h)</span>
          </CardHeader>
          <CardContent className="px-2 pb-2">
            <div className="h-[220px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metric.timeSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="time" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={(v) => `${v}ms`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      fontSize: "11px",
                    }}
                    formatter={(value: number) => [`${formatNumber(value, 2)}ms`]}
                  />
                  <Legend wrapperStyle={{ fontSize: "10px" }} />
                  <Area
                    type="monotone"
                    dataKey="p99"
                    stackId="1"
                    stroke="var(--status-warning)"
                    fill="var(--status-warning)"
                    fillOpacity={0.2}
                    name="p99"
                  />
                  <Area
                    type="monotone"
                    dataKey="p95"
                    stackId="2"
                    stroke="var(--chart-3)"
                    fill="var(--chart-3)"
                    fillOpacity={0.3}
                    name="p95"
                  />
                  <Area
                    type="monotone"
                    dataKey="p50"
                    stackId="3"
                    stroke="var(--pnl-positive)"
                    fill="var(--pnl-positive)"
                    fillOpacity={0.4}
                    name="p50"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {latencyDataMode === "compare" && (
        <CollapsibleSection title="Live vs batch by stage" defaultOpen count={metric.lifecycle.length}>
          <div className="overflow-x-auto px-1 pb-2">
            <table className="w-full text-micro">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-1.5 font-medium">Stage</th>
                  <th className="text-center p-1.5 font-medium" colSpan={3}>
                    Live
                  </th>
                  <th className="text-center p-1.5 font-medium" colSpan={3}>
                    Batch
                  </th>
                  <th className="text-center p-1.5 font-medium" colSpan={3}>
                    Delta
                  </th>
                </tr>
                <tr className="border-b text-muted-foreground">
                  <th className="p-1" />
                  <th className="p-1">p50</th>
                  <th className="p-1">p95</th>
                  <th className="p-1">p99</th>
                  <th className="p-1">p50</th>
                  <th className="p-1">p95</th>
                  <th className="p-1">p99</th>
                  <th className="p-1">p50</th>
                  <th className="p-1">p95</th>
                  <th className="p-1">p99</th>
                </tr>
              </thead>
              <tbody>
                {metric.lifecycle.map((stage, idx) => {
                  const b50 = simulatedBatchMs(stage.p50, idx, "p50");
                  const b95 = simulatedBatchMs(stage.p95, idx, "p95");
                  const b99 = simulatedBatchMs(stage.p99, idx, "p99");
                  return (
                    <tr key={stage.stage} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="p-1.5 font-medium">{stage.stage}</td>
                      <td className="p-1.5 font-mono text-center">{formatNumber(stage.p50, 2)}</td>
                      <td className="p-1.5 font-mono text-center">{formatNumber(stage.p95, 2)}</td>
                      <td className="p-1.5 font-mono text-center">{formatNumber(stage.p99, 2)}</td>
                      <td className="p-1.5 font-mono text-center text-muted-foreground">{formatNumber(b50, 2)}</td>
                      <td className="p-1.5 font-mono text-center text-muted-foreground">{formatNumber(b95, 2)}</td>
                      <td className="p-1.5 font-mono text-center text-muted-foreground">{formatNumber(b99, 2)}</td>
                      <td
                        className={cn(
                          "p-1.5 font-mono text-center",
                          stage.p50 - b50 > 0 ? "text-[var(--pnl-negative)]" : "text-[var(--pnl-positive)]",
                        )}
                      >
                        {(stage.p50 - b50 > 0 ? "+" : "") + formatNumber(stage.p50 - b50, 2)}
                      </td>
                      <td
                        className={cn(
                          "p-1.5 font-mono text-center",
                          stage.p95 - b95 > 0 ? "text-[var(--pnl-negative)]" : "text-[var(--pnl-positive)]",
                        )}
                      >
                        {(stage.p95 - b95 > 0 ? "+" : "") + formatNumber(stage.p95 - b95, 2)}
                      </td>
                      <td
                        className={cn(
                          "p-1.5 font-mono text-center",
                          stage.p99 - b99 > 0 ? "text-[var(--pnl-negative)]" : "text-[var(--pnl-positive)]",
                        )}
                      >
                        {(stage.p99 - b99 > 0 ? "+" : "") + formatNumber(stage.p99 - b99, 2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
}
