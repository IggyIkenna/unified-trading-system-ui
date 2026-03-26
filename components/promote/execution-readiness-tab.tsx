import { Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { fmtNum, fmtUsd, statusBg, statusColor, StatusIcon } from "./helpers";
import { PromoteWorkflowActions } from "./promote-workflow-actions";
import type { CandidateStrategy, GateStatus } from "./types";

export function ExecutionReadinessTab({
  strategy,
}: {
  strategy: CandidateStrategy;
}) {
  const exec = strategy.executionReadiness;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">
            Execution Readiness — {strategy.name}
          </h3>
          <p className="text-sm text-muted-foreground">
            Venue connectivity, fill quality, capacity, and market impact
          </p>
        </div>
        <Badge
          variant="outline"
          className={statusBg(strategy.stages.execution_readiness.status)}
        >
          {strategy.stages.execution_readiness.status.replace("_", " ")}
        </Badge>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Avg Slippage
            </p>
            <p
              className={cn(
                "text-2xl font-bold font-mono mt-1",
                exec.avgSlippageBps <= 3
                  ? "text-emerald-400"
                  : "text-amber-400",
              )}
            >
              {exec.avgSlippageBps} bps
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Capacity
            </p>
            <p className="text-2xl font-bold font-mono mt-1">
              {fmtUsd(exec.capacityUsd)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Market Impact
            </p>
            <p
              className={cn(
                "text-2xl font-bold font-mono mt-1",
                exec.marketImpact <= 0.0005
                  ? "text-emerald-400"
                  : "text-amber-400",
              )}
            >
              {(exec.marketImpact * 10000).toFixed(1)} bps
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Venues Active
            </p>
            <p className="text-2xl font-bold font-mono mt-1">
              {exec.venues.filter((v) => v.connected).length}/
              {exec.venues.length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Globe className="size-4" />
            Venue Connectivity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="text-xs">
                <TableHead>Venue</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Latency (p99)</TableHead>
                <TableHead className="text-right">Fill Rate</TableHead>
                <TableHead>SLA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exec.venues.map((venue) => (
                <TableRow key={venue.name} className="text-xs">
                  <TableCell className="font-medium">{venue.name}</TableCell>
                  <TableCell>
                    {venue.connected ? (
                      <Badge
                        variant="outline"
                        className="text-xs bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                      >
                        Connected
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-xs bg-rose-500/15 text-rose-400 border-rose-500/30"
                      >
                        Disconnected
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {venue.connected ? (
                      <span
                        className={
                          venue.latencyMs <= 20
                            ? "text-emerald-400"
                            : "text-amber-400"
                        }
                      >
                        {venue.latencyMs}ms
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {venue.connected ? (
                      <span
                        className={
                          venue.fillRate >= 97
                            ? "text-emerald-400"
                            : "text-amber-400"
                        }
                      >
                        {venue.fillRate}%
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {venue.connected &&
                    venue.latencyMs <= 25 &&
                    venue.fillRate >= 96 ? (
                      <StatusIcon status="passed" className="size-4" />
                    ) : venue.connected ? (
                      <StatusIcon status="warning" className="size-4" />
                    ) : (
                      <StatusIcon status="failed" className="size-4" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Execution Gates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              {
                label: "All required venues connected",
                status: (exec.venues.filter((v) => v.connected).length >=
                exec.venues.length
                  ? "passed"
                  : "failed") as GateStatus,
                actual: `${exec.venues.filter((v) => v.connected).length}/${exec.venues.length}`,
              },
              {
                label: "Average fill rate ≥ 96%",
                status: (exec.venues
                  .filter((v) => v.connected)
                  .every((v) => v.fillRate >= 96)
                  ? "passed"
                  : "warning") as GateStatus,
                actual: `${fmtNum(
                  exec.venues
                    .filter((v) => v.connected)
                    .reduce((s, v) => s + v.fillRate, 0) /
                    (exec.venues.filter((v) => v.connected).length || 1),
                )}%`,
              },
              {
                label: "P99 latency ≤ 25ms (all venues)",
                status: (exec.venues
                  .filter((v) => v.connected)
                  .every((v) => v.latencyMs <= 25)
                  ? "passed"
                  : "warning") as GateStatus,
                actual: `Max: ${Math.max(...exec.venues.filter((v) => v.connected).map((v) => v.latencyMs), 0)}ms`,
              },
              {
                label: "Slippage ≤ 5 bps",
                status: (exec.avgSlippageBps <= 5
                  ? "passed"
                  : "failed") as GateStatus,
                actual: `${exec.avgSlippageBps} bps`,
              },
              {
                label: "Market impact ≤ 5 bps",
                status: (exec.marketImpact * 10000 <= 5
                  ? "passed"
                  : "failed") as GateStatus,
                actual: `${(exec.marketImpact * 10000).toFixed(1)} bps`,
              },
              {
                label: "Capacity supports target allocation",
                status: (exec.capacityUsd >= 10_000_000
                  ? "passed"
                  : "warning") as GateStatus,
                actual: fmtUsd(exec.capacityUsd),
              },
            ].map((gate) => (
              <div
                key={gate.label}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border",
                  statusBg(gate.status),
                )}
              >
                <div className="flex items-center gap-3">
                  <StatusIcon status={gate.status} className="size-4" />
                  <span className="text-sm font-medium">{gate.label}</span>
                </div>
                <span
                  className={cn("text-sm font-mono", statusColor(gate.status))}
                >
                  {gate.actual}
                </span>
              </div>
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
