import { Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { GateCheckRow } from "@/components/shared/gate-check-row";
import { fmtNum, fmtUsd, statusBg, StatusIcon } from "./helpers";
import { MetricCard } from "@/components/shared/metric-card";
import { PromoteWorkflowActions } from "./promote-workflow-actions";
import type { CandidateStrategy, GateStatus } from "./types";
import { formatNumber } from "@/lib/utils/formatters";

const LATENCY_CAP_MS = 25;
const FILL_FLOOR_PCT = 96;

type ExecMetricCard = {
  label: string;
  value: string;
  color?: string;
  hint?: string;
};

export function ExecutionReadinessTab({ strategy }: { strategy: CandidateStrategy }) {
  const exec = strategy.executionReadiness;
  const connected = exec.venues.filter((v) => v.connected);
  const nConn = connected.length;
  const nVenues = exec.venues.length;

  const avgLatencyMs = nConn > 0 ? connected.reduce((s, v) => s + v.latencyMs, 0) / nConn : 0;
  const avgFillPct = nConn > 0 ? connected.reduce((s, v) => s + v.fillRate, 0) / nConn : 0;
  const maxLatencyMs = nConn > 0 ? Math.max(...connected.map((v) => v.latencyMs)) : 0;
  const minFillPct = nConn > 0 ? Math.min(...connected.map((v) => v.fillRate)) : 0;

  const summaryMetrics: ExecMetricCard[] = [
    {
      label: "Avg slippage",
      value: `${exec.avgSlippageBps} bps`,
      color: exec.avgSlippageBps <= 3 ? "text-emerald-400" : "text-amber-400",
      hint: "Across connected venues",
    },
    {
      label: "Avg latency",
      value: nConn > 0 ? `${fmtNum(avgLatencyMs, 1)} ms` : "—",
      color:
        nConn === 0
          ? "text-muted-foreground"
          : avgLatencyMs <= 15
            ? "text-emerald-400"
            : avgLatencyMs <= LATENCY_CAP_MS
              ? "text-amber-400"
              : "text-rose-400",
      hint: `p99 cap ${LATENCY_CAP_MS} ms`,
    },
    {
      label: "Avg fill",
      value: nConn > 0 ? `${fmtNum(avgFillPct, 1)}%` : "—",
      color:
        nConn === 0
          ? "text-muted-foreground"
          : avgFillPct >= 97
            ? "text-emerald-400"
            : avgFillPct >= FILL_FLOOR_PCT
              ? "text-amber-400"
              : "text-rose-400",
      hint: `Floor ${FILL_FLOOR_PCT}%`,
    },
    {
      label: "Capacity",
      value: fmtUsd(exec.capacityUsd),
      hint: "Estimated deployable",
    },
    {
      label: "Mkt impact",
      value: `${formatNumber(exec.marketImpact * 10000, 1)} bps`,
      color: exec.marketImpact <= 0.0005 ? "text-emerald-400" : "text-amber-400",
      hint: "Estimated one-way",
    },
    {
      label: "Venues live",
      value: `${nConn}/${nVenues}`,
      color: nConn === nVenues ? "text-emerald-400" : nConn > 0 ? "text-amber-400" : "text-rose-400",
      hint: "Connected / configured",
    },
    {
      label: "Max latency",
      value: nConn > 0 ? `${maxLatencyMs} ms` : "—",
      color:
        nConn === 0 ? "text-muted-foreground" : maxLatencyMs <= LATENCY_CAP_MS ? "text-emerald-400" : "text-rose-400",
      hint: "Worst connected venue",
    },
    {
      label: "Min fill",
      value: nConn > 0 ? `${minFillPct}%` : "—",
      color:
        nConn === 0 ? "text-muted-foreground" : minFillPct >= FILL_FLOOR_PCT ? "text-emerald-400" : "text-rose-400",
      hint: "Weakest connected venue",
    },
    {
      label: "Disconnected",
      value: `${nVenues - nConn}`,
      color: nVenues - nConn === 0 ? "text-emerald-400" : "text-rose-400",
      hint: "Venues not connected",
    },
    {
      label: "Cap / venue",
      value: nVenues > 0 ? fmtUsd(Math.round(exec.capacityUsd / nVenues)) : fmtUsd(0),
      hint: "Capacity split evenly",
    },
    {
      label: "Slippage vs 5 bps",
      value: `${fmtNum((exec.avgSlippageBps / 5) * 100, 0)}%`,
      color: exec.avgSlippageBps <= 5 ? "text-emerald-400" : "text-rose-400",
      hint: "% of gate threshold",
    },
    {
      label: "Impact vs 5 bps",
      value: `${fmtNum(((exec.marketImpact * 10000) / 5) * 100, 0)}%`,
      color: exec.marketImpact * 10000 <= 5 ? "text-emerald-400" : "text-rose-400",
      hint: "% of gate threshold",
    },
  ];

  const executionGates: {
    label: string;
    status: GateStatus;
    actual: string;
    threshold: string;
  }[] = [
    {
      label: "All required venues connected",
      status: (nConn >= nVenues ? "passed" : "failed") as GateStatus,
      actual: `${nConn}/${nVenues}`,
      threshold: "100% connected",
    },
    {
      label: "Average fill rate ≥ 96%",
      status: (connected.every((v) => v.fillRate >= FILL_FLOOR_PCT) ? "passed" : "warning") as GateStatus,
      actual: `${fmtNum(avgFillPct)}%`,
      threshold: `≥ ${FILL_FLOOR_PCT}% each`,
    },
    {
      label: `P99 latency ≤ ${LATENCY_CAP_MS}ms (all venues)`,
      status: (connected.every((v) => v.latencyMs <= LATENCY_CAP_MS) ? "passed" : "warning") as GateStatus,
      actual: `Max: ${maxLatencyMs}ms`,
      threshold: `≤ ${LATENCY_CAP_MS}ms each`,
    },
    {
      label: "Slippage ≤ 5 bps",
      status: (exec.avgSlippageBps <= 5 ? "passed" : "failed") as GateStatus,
      actual: `${exec.avgSlippageBps} bps`,
      threshold: "≤ 5 bps",
    },
    {
      label: "Market impact ≤ 5 bps",
      status: (exec.marketImpact * 10000 <= 5 ? "passed" : "failed") as GateStatus,
      actual: `${formatNumber(exec.marketImpact * 10000, 1)} bps`,
      threshold: "≤ 5 bps",
    },
    {
      label: "Capacity supports target allocation",
      status: (exec.capacityUsd >= 10_000_000 ? "passed" : "warning") as GateStatus,
      actual: fmtUsd(exec.capacityUsd),
      threshold: "≥ $10M",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Execution Readiness — {strategy.name}</h3>
          <p className="text-sm text-muted-foreground">Venue connectivity, fill quality, capacity, and market impact</p>
        </div>
        <Badge variant="outline" className={statusBg(strategy.stages.execution_readiness.status)}>
          {strategy.stages.execution_readiness.status.replace("_", " ")}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {summaryMetrics.map((item) => (
          <MetricCard
            key={item.label}
            tone="grid"
            density="default"
            label={item.label}
            primary={item.value}
            primaryClassName={item.color}
            hint={item.hint}
          />
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Globe className="size-4" />
            Venue Connectivity
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table className="table-fixed w-full min-w-[720px]">
            <colgroup>
              <col className="w-[16%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
            </colgroup>
            <TableHeader>
              <TableRow className="text-xs">
                <TableHead>Venue</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Latency (p99)</TableHead>
                <TableHead className="text-right">SLA headroom</TableHead>
                <TableHead className="text-right">Fill rate</TableHead>
                <TableHead className="text-right">Fill cushion</TableHead>
                <TableHead className="text-center">Gate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exec.venues.map((venue) => {
                const latencyHeadroom = venue.connected ? LATENCY_CAP_MS - venue.latencyMs : null;
                const fillCushion = venue.connected ? venue.fillRate - FILL_FLOOR_PCT : null;
                const gateStatus =
                  venue.connected && venue.latencyMs <= LATENCY_CAP_MS && venue.fillRate >= FILL_FLOOR_PCT
                    ? ("passed" as const)
                    : venue.connected
                      ? ("warning" as const)
                      : ("failed" as const);

                return (
                  <TableRow key={venue.name} className="text-xs">
                    <TableCell className="truncate font-medium">{venue.name}</TableCell>
                    <TableCell>
                      {venue.connected ? (
                        <Badge
                          variant="outline"
                          className="text-xs bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                        >
                          Connected
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs bg-rose-500/15 text-rose-400 border-rose-500/30">
                          Disconnected
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {venue.connected ? (
                        <span className={venue.latencyMs <= 20 ? "text-emerald-400" : "text-amber-400"}>
                          {venue.latencyMs}ms
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {latencyHeadroom !== null ? (
                        <span
                          className={
                            latencyHeadroom >= 8
                              ? "text-emerald-400"
                              : latencyHeadroom >= 0
                                ? "text-amber-400"
                                : "text-rose-400"
                          }
                        >
                          {latencyHeadroom < 0 ? "-" : ""}
                          {Math.abs(latencyHeadroom)}ms
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {venue.connected ? (
                        <span className={venue.fillRate >= 97 ? "text-emerald-400" : "text-amber-400"}>
                          {venue.fillRate}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {fillCushion !== null ? (
                        <span
                          className={
                            fillCushion >= 1
                              ? "text-emerald-400"
                              : fillCushion >= 0
                                ? "text-amber-400"
                                : "text-rose-400"
                          }
                        >
                          {fillCushion >= 0 ? "+" : "-"}
                          {fmtNum(Math.abs(fillCushion), 1)}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {gateStatus === "passed" ? (
                        <StatusIcon status="passed" className="mx-auto size-4" />
                      ) : gateStatus === "warning" ? (
                        <StatusIcon status="warning" className="mx-auto size-4" />
                      ) : (
                        <StatusIcon status="failed" className="mx-auto size-4" />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Execution Gates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {executionGates.map((gate) => (
              <GateCheckRow
                key={gate.label}
                status={gate.status}
                title={gate.label}
                threshold={gate.threshold}
                actual={gate.actual}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <PromoteWorkflowActions
        strategyId={strategy.id}
        strategyName={strategy.name}
        stage="execution_readiness"
        currentStage={strategy.currentStage}
      />
    </div>
  );
}
