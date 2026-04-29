"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { KillSwitchPanel } from "@/components/trading/kill-switch-panel";
import { useWorkspaceScope } from "@/lib/stores/workspace-scope-store";
import { useReconciliationSnapshot } from "@/hooks/api/use-reconciliation";
import type { StrategyAllocation, DriftTimePoint } from "@/lib/mocks/fixtures/position-recon";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils/formatters";
import { AlertOctagon, AlertTriangle, Info } from "lucide-react";
import * as React from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  BarChart,
} from "recharts";

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatUsd(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `$${formatNumber(v / 1_000_000, 1)}M`;
  if (Math.abs(v) >= 1_000) return `$${formatNumber(v / 1_000, 1)}K`;
  return `$${formatNumber(v, 0)}`;
}

function severityColor(severity: StrategyAllocation["severity"]): string {
  if (severity === "critical") return "text-rose-400";
  if (severity === "warning") return "text-amber-400";
  return "text-emerald-400";
}

function severityBg(severity: StrategyAllocation["severity"]): string {
  if (severity === "critical") return "bg-rose-500/20 text-rose-400 border-rose-500/30";
  if (severity === "warning") return "bg-amber-500/20 text-amber-400 border-amber-500/30";
  return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
}

function driftColor(pct: number): string {
  if (pct > 5) return "text-rose-400";
  if (pct > 2) return "text-amber-400";
  return "text-emerald-400";
}

// ── KPI Strip ───────────────────────────────────────────────────────────────

function ReconKpiStrip({ kpis }: { kpis: { totalEquity: number; allocatedPct: number; unallocatedPct: number; worstDriftPct: number; activeAlerts: number } }) {
  const cards = [
    { label: "Total Equity", value: formatUsd(kpis.totalEquity), tone: "neutral" as const },
    { label: "Allocated", value: `${formatNumber(kpis.allocatedPct, 1)}%`, tone: "neutral" as const },
    { label: "Unallocated", value: `${formatNumber(kpis.unallocatedPct, 1)}%`, tone: "neutral" as const },
    {
      label: "Worst Drift",
      value: `${formatNumber(kpis.worstDriftPct, 1)}%`,
      tone: (kpis.worstDriftPct > 5 ? "critical" : kpis.worstDriftPct > 2 ? "warning" : "normal") as
        | "critical"
        | "warning"
        | "normal",
    },
    { label: "Active Alerts", value: String(kpis.activeAlerts), tone: "warning" as const },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
      {cards.map((c) => (
        <Card key={c.label} className="border-border">
          <CardContent className="p-3 space-y-1">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{c.label}</span>
            <div
              className={cn(
                "text-lg font-mono font-semibold",
                c.tone === "critical" && "text-rose-400",
                c.tone === "warning" && "text-amber-400",
                c.tone === "normal" && "text-emerald-400",
              )}
            >
              {c.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Equity Allocation Bar Chart ─────────────────────────────────────────────

function EquityAllocationChart({ allocations }: { allocations: StrategyAllocation[] }) {
  const data = allocations.map((s) => ({
    name: s.strategyName,
    target: s.targetEquity,
    actual: s.actualEquity,
    driftPct: s.driftPct,
    severity: s.severity,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Equity Allocation: Target vs Actual</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 10, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                tickFormatter={(v: number) => formatUsd(v)}
              />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                width={110}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "11px",
                }}
                formatter={(value: number, name: string) => [formatUsd(value), name === "target" ? "Target" : "Actual"]}
                labelFormatter={(label: string) => label}
              />
              <Bar dataKey="target" fill="transparent" stroke="#6b7280" strokeWidth={2} barSize={18} name="Target" />
              <Bar dataKey="actual" fill="#3b82f6" opacity={0.7} barSize={18} name="Actual" />
              <Legend wrapperStyle={{ fontSize: "10px" }} iconSize={8} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {data.map((d) => (
            <span key={d.name} className={cn("text-[10px] font-mono", driftColor(d.driftPct))}>
              {d.name}: {formatUsd(d.target)} target / {formatUsd(d.actual)} actual ({d.driftPct > 0 ? "-" : "+"}
              {formatNumber(d.driftPct, 1)}%)
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Delta Residual Table ────────────────────────────────────────────────────

function DeltaResidualTable({ allocations }: { allocations: StrategyAllocation[] }) {
  const grouped = React.useMemo(() => {
    const groups: Record<string, StrategyAllocation[]> = {};
    for (const alloc of allocations) {
      if (!groups[alloc.shareClass]) groups[alloc.shareClass] = [];
      groups[alloc.shareClass].push(alloc);
    }
    return groups;
  }, [allocations]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Delta Residual</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="text-[10px]">Strategy</TableHead>
              <TableHead className="text-[10px]">Share Class</TableHead>
              <TableHead className="text-[10px] text-right">Target Delta</TableHead>
              <TableHead className="text-[10px] text-right">Actual Delta</TableHead>
              <TableHead className="text-[10px] text-right">Residual</TableHead>
              <TableHead className="text-[10px] text-center">Severity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(grouped).map(([shareClass, allocations]) => (
              <React.Fragment key={shareClass}>
                <TableRow className="bg-muted/10">
                  <TableCell colSpan={6} className="text-[10px] font-semibold uppercase tracking-wider py-1.5">
                    {shareClass}
                  </TableCell>
                </TableRow>
                {allocations.map((alloc) => {
                  const residual = alloc.actualDelta - alloc.targetDelta;
                  return (
                    <TableRow key={alloc.strategyId}>
                      <TableCell className="text-[11px] font-medium">{alloc.strategyName}</TableCell>
                      <TableCell className="text-[11px] font-mono">{alloc.shareClass}</TableCell>
                      <TableCell className="text-[11px] font-mono text-right">
                        {alloc.targetDelta >= 0 ? "+" : ""}
                        {formatNumber(alloc.targetDelta, 2)}
                      </TableCell>
                      <TableCell className="text-[11px] font-mono text-right">
                        {alloc.actualDelta >= 0 ? "+" : ""}
                        {formatNumber(alloc.actualDelta, 2)}
                      </TableCell>
                      <TableCell className={cn("text-[11px] font-mono text-right", severityColor(alloc.severity))}>
                        {residual >= 0 ? "+" : ""}
                        {formatNumber(residual, 2)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0", severityBg(alloc.severity))}>
                          {alloc.severity}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ── Drift Time Series Chart ─────────────────────────────────────────────────

const DRIFT_COLORS: Record<string, string> = {
  ethBasis: "#10b981",
  btcMM: "#3b82f6",
  ethOptMM: "#f59e0b",
  ethYieldArb: "#ef4444",
  btcTrend: "#8b5cf6",
};

const DRIFT_LABELS: Record<string, string> = {
  ethBasis: "ETH Basis",
  btcMM: "BTC MM",
  ethOptMM: "ETH Opt MM",
  ethYieldArb: "ETH Yield Arb",
  btcTrend: "BTC Trend",
};

function DriftTimeSeriesChart({ driftTimeSeries }: { driftTimeSeries: DriftTimePoint[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Drift Over Time (deviation %)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={driftTimeSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                tickFormatter={(v: number) => `${v}%`}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "11px",
                }}
                formatter={(value: number, name: string) => [`${formatNumber(value, 1)}%`, DRIFT_LABELS[name] ?? name]}
              />
              {/* Warning threshold */}
              <ReferenceLine y={2} stroke="#f59e0b" strokeDasharray="6 3" strokeWidth={1} />
              {/* Critical threshold */}
              <ReferenceLine y={5} stroke="#ef4444" strokeDasharray="6 3" strokeWidth={1} />
              {Object.entries(DRIFT_COLORS).map(([key, color]) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={color}
                  strokeWidth={2}
                  dot={{ r: 2, fill: color }}
                  name={key}
                />
              ))}
              <Legend
                wrapperStyle={{ fontSize: "10px" }}
                iconSize={8}
                formatter={(value: string) => DRIFT_LABELS[value] ?? value}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Close All Positions Section ─────────────────────────────────────────────

function CloseAllPositions({
  disabled,
  kpis,
  allocations,
}: {
  disabled: boolean;
  kpis: { totalEquity: number; worstDriftPct: number };
  allocations: StrategyAllocation[];
}) {
  const [showKillSwitch, setShowKillSwitch] = React.useState(false);
  const driftingCount = allocations.filter((s) => s.severity !== "normal").length;
  const totalDriftCost = Math.round(kpis.totalEquity * (kpis.worstDriftPct / 100) * 0.03);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Button
          variant="destructive"
          className="gap-2"
          disabled={disabled}
          onClick={() => setShowKillSwitch(!showKillSwitch)}
        >
          <AlertOctagon className="size-4" />
          Close All Positions
        </Button>
        {!disabled && (
          <div className="text-xs text-muted-foreground max-w-md text-right">
            Your portfolio has {formatNumber(kpis.worstDriftPct, 1)}% drift across {driftingCount} strategies. Closing
            all will cost ~{formatUsd(totalDriftCost)}.
          </div>
        )}
      </div>
      {showKillSwitch && !disabled && <KillSwitchPanel />}
    </div>
  );
}

// ── Batch Mode Banner ───────────────────────────────────────────────────────

function BatchModeBanner() {
  return (
    <div className="flex items-center gap-3 p-4 rounded-lg border border-sky-500/30 bg-sky-500/5">
      <Info className="size-5 text-sky-400 shrink-0" />
      <div>
        <p className="text-sm font-medium text-sky-400">Position reconciliation is only available in live mode</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Switch to Live mode using the toggle above to view real-time position drift and take action.
        </p>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────

export default function PositionReconPage() {
  const scope = useWorkspaceScope();
  const isBatchMode = scope.mode === "batch";
  const { data: snapshot, isLoading } = useReconciliationSnapshot();

  const allocations = snapshot?.allocations ?? [];
  const kpis = snapshot?.kpis ?? { totalEquity: 0, totalTarget: 0, allocatedPct: 0, unallocatedPct: 0, worstDriftPct: 0, activeAlerts: 0 };
  const driftTimeSeries = snapshot?.driftTimeSeries ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-muted-foreground">Loading reconciliation data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header + Close All */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold">Position Reconciliation</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Target vs actual position drift across all strategies
          </p>
        </div>
        <CloseAllPositions disabled={isBatchMode} kpis={kpis} allocations={allocations} />
      </div>

      {isBatchMode && <BatchModeBanner />}

      {/* KPI Strip */}
      <ReconKpiStrip kpis={kpis} />

      {/* Two-column layout: Allocation + Delta */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <EquityAllocationChart allocations={allocations} />
        <DeltaResidualTable allocations={allocations} />
      </div>

      {/* Drift time series — full width */}
      <DriftTimeSeriesChart driftTimeSeries={driftTimeSeries} />

      {/* Warning banner when critical drift */}
      {!isBatchMode && allocations.some((s) => s.severity === "critical") && (
        <div className="flex items-center gap-3 p-4 rounded-lg border border-rose-500/30 bg-rose-500/5">
          <AlertTriangle className="size-5 text-rose-400 shrink-0" />
          <div>
            <p className="text-sm font-medium text-rose-400">Critical drift detected</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {allocations.filter((s) => s.severity === "critical")
                .map((s) => `${s.strategyName} (${formatNumber(s.driftPct, 1)}%)`)
                .join(", ")}{" "}
              -- consider reducing exposure or closing positions.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
