"use client";

import * as React from "react";
import type { WidgetComponentProps } from "../widget-registry";
import { KpiSummaryWidget, type KpiMetric, CollapsibleSection } from "@/components/shared";
import { useRiskData, formatCurrency } from "./risk-data-context";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { STRATEGY_RISK_PROFILES, MOCK_PORTFOLIO_DELTA } from "@/lib/mocks/fixtures/defi-risk";
import { STRATEGY_DISPLAY_NAMES, type RiskLevel } from "@/lib/types/defi";
import { WidgetScroll } from "@/components/shared/widget-scroll";
import { cn } from "@/lib/utils";
import { LayoutGrid, LineChart as LineChartIcon } from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const RISK_LEVEL_COLORS: Record<RiskLevel, string> = {
  low: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  high: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  critical: "bg-red-600/30 text-red-400 border-red-600/40",
};

function RiskLevelBadge({ level }: { level: RiskLevel }) {
  return (
    <Badge variant="outline" className={cn("text-[9px] font-mono uppercase px-1.5 py-0", RISK_LEVEL_COLORS[level])}>
      {level}
    </Badge>
  );
}

/** Returns true when any DeFi strategy has active positions (mock: always true for demo). */
function useHasDefiStrategies(): boolean {
  return STRATEGY_RISK_PROFILES.length > 0;
}

// ---------------------------------------------------------------------------
// DeFi Risk Time Series Mock Data (7 data points each)
// ---------------------------------------------------------------------------

const DEFI_RISK_TIME_SERIES = [
  { time: "03-24", healthFactor: 1.85, netDeltaUsd: 360000, treasuryPct: 17.5 },
  { time: "03-25", healthFactor: 1.62, netDeltaUsd: 345000, treasuryPct: 18.2 },
  { time: "03-26", healthFactor: 1.35, netDeltaUsd: 310000, treasuryPct: 16.8 },
  { time: "03-27", healthFactor: 1.18, netDeltaUsd: 380000, treasuryPct: 15.1 },
  { time: "03-28", healthFactor: 1.28, netDeltaUsd: 355000, treasuryPct: 16.5 },
  { time: "03-29", healthFactor: 1.42, netDeltaUsd: 340000, treasuryPct: 17.0 },
  { time: "03-30", healthFactor: 1.52, netDeltaUsd: 360000, treasuryPct: 17.5 },
];

const RISK_CHART_COLORS = {
  healthFactor: "#10b981",
  netDeltaUsd: "#3b82f6",
  treasuryPct: "#f59e0b",
};

function DeFiRiskTimeSeriesChart() {
  return (
    <div className="space-y-3">
      {/* Health Factor */}
      <div>
        <p className="text-[10px] text-muted-foreground mb-1 px-1">Health Factor</p>
        <div className="h-[140px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={DEFI_RISK_TIME_SERIES}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
              <YAxis
                domain={[1.0, 2.0]}
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                tickFormatter={(v: number) => v.toFixed(2)}
                width={45}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "11px",
                }}
                formatter={(value: number) => [value.toFixed(2), "Health Factor"]}
              />
              {/* Liquidation threshold line */}
              <Line
                type="monotone"
                dataKey={() => 1.0}
                stroke="#ef4444"
                strokeDasharray="6 3"
                strokeWidth={1}
                dot={false}
                name="Liquidation"
              />
              <Line
                type="monotone"
                dataKey="healthFactor"
                stroke={RISK_CHART_COLORS.healthFactor}
                strokeWidth={2}
                dot={{ r: 3, fill: RISK_CHART_COLORS.healthFactor }}
                name="Health Factor"
              />
              <Legend wrapperStyle={{ fontSize: "10px" }} iconSize={8} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Net Delta USD */}
      <div>
        <p className="text-[10px] text-muted-foreground mb-1 px-1">Net Delta USD</p>
        <div className="h-[140px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={DEFI_RISK_TIME_SERIES}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                tickFormatter={(v: number) => `$${formatNumber(v / 1000, 0)}k`}
                width={55}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "11px",
                }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, "Net Delta USD"]}
              />
              <Line
                type="monotone"
                dataKey="netDeltaUsd"
                stroke={RISK_CHART_COLORS.netDeltaUsd}
                strokeWidth={2}
                dot={{ r: 3, fill: RISK_CHART_COLORS.netDeltaUsd }}
                name="Net Delta USD"
              />
              <Legend wrapperStyle={{ fontSize: "10px" }} iconSize={8} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Treasury % */}
      <div>
        <p className="text-[10px] text-muted-foreground mb-1 px-1">Treasury %</p>
        <div className="h-[140px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={DEFI_RISK_TIME_SERIES}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                tickFormatter={(v: number) => `${v}%`}
                width={45}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "11px",
                }}
                formatter={(value: number) => [`${value.toFixed(1)}%`, "Treasury %"]}
              />
              <Line
                type="monotone"
                dataKey="treasuryPct"
                stroke={RISK_CHART_COLORS.treasuryPct}
                strokeWidth={2}
                dot={{ r: 3, fill: RISK_CHART_COLORS.treasuryPct }}
                name="Treasury %"
              />
              <Legend wrapperStyle={{ fontSize: "10px" }} iconSize={8} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export function RiskKpiStripWidget(_props: WidgetComponentProps) {
  const {
    totalVar95,
    totalVar99,
    totalES95,
    totalES99,
    criticalCount,
    warningCount,
    killedStrategies,
    regimeMultiplier,
    varSummary,
  } = useRiskData();

  const hasDefi = useHasDefiStrategies();
  const [defiRiskView, setDefiRiskView] = React.useState<"table" | "chart">("table");

  const baseMetrics: KpiMetric[] = [
    { label: "Firm P&L", value: "+$1.04M", sentiment: "positive" },
    { label: "Net Exposure", value: "$5.2M", sentiment: "neutral" },
    { label: "Margin Used", value: "47%", sentiment: "neutral" },
    {
      label: `VaR 95%${regimeMultiplier !== 1 ? ` (×${formatNumber(regimeMultiplier, 1)})` : ""}`,
      value: formatCurrency(-totalVar95),
      sentiment: "negative",
    },
    {
      label: `ES 95%${regimeMultiplier !== 1 ? ` (×${formatNumber(regimeMultiplier, 1)})` : ""}`,
      value: formatCurrency(-totalES95),
      sentiment: "negative",
    },
    {
      label: "Active Alerts",
      value: String(criticalCount + warningCount),
      sentiment: warningCount > 0 ? "negative" : "neutral",
    },
    {
      label: `VaR 99%${regimeMultiplier !== 1 ? ` (×${formatNumber(regimeMultiplier, 1)})` : ""}`,
      value: formatCurrency(-totalVar99),
      sentiment: "negative",
    },
    {
      label: `ES 99%${regimeMultiplier !== 1 ? ` (×${formatNumber(regimeMultiplier, 1)})` : ""}`,
      value: formatCurrency(-totalES99),
      sentiment: "negative",
    },
    { label: "Kill Switches", value: String(killedStrategies.size + 1), sentiment: "negative" },
  ];

  const extendedMetrics: KpiMetric[] = varSummary
    ? [
        { label: "Hist VaR 99%", value: formatCurrency(-Number(varSummary.historical_var_99 ?? 0)), sentiment: "negative" },
        { label: "Param VaR 99%", value: formatCurrency(-Number(varSummary.parametric_var_99 ?? 0)), sentiment: "negative" },
        { label: "CVaR 99%", value: formatCurrency(-Number(varSummary.cvar_99 ?? 0)), sentiment: "negative" },
      ]
    : [];

  const metrics = [...baseMetrics, ...extendedMetrics].slice(0, 9);

  return (
    <WidgetScroll axes="vertical">
      <KpiSummaryWidget metrics={metrics} storageKey="uts-risk-kpi-strip-layout" />

      {hasDefi && (
        <div className="space-y-3 px-3 pb-3">
          {/* DeFi Delta Composite Summary */}
          <CollapsibleSection title="DeFi Delta Exposure" defaultOpen={true}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="rounded-lg border border-border bg-muted/30 p-2">
                <span className="text-[10px] text-muted-foreground block">Delta USD</span>
                <span className="text-sm font-mono font-semibold">
                  {MOCK_PORTFOLIO_DELTA.total_delta_usd > 0 ? "+" : ""}
                  {formatCurrency(MOCK_PORTFOLIO_DELTA.total_delta_usd)}
                </span>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-2">
                <span className="text-[10px] text-muted-foreground block">Delta ETH</span>
                <span className="text-sm font-mono font-semibold">
                  {MOCK_PORTFOLIO_DELTA.total_delta_eth > 0 ? "+" : ""}
                  {formatNumber(MOCK_PORTFOLIO_DELTA.total_delta_eth, 1)}
                </span>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-2">
                <span className="text-[10px] text-muted-foreground block">Delta SOL</span>
                <span className="text-sm font-mono font-semibold">
                  {formatNumber(MOCK_PORTFOLIO_DELTA.total_delta_sol, 1)}
                </span>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-2">
                <span className="text-[10px] text-muted-foreground block">Liq. Cost %</span>
                <span
                  className={cn(
                    "text-sm font-mono font-semibold",
                    MOCK_PORTFOLIO_DELTA.total_liquidation_cost_pct > 1
                      ? "text-rose-400"
                      : MOCK_PORTFOLIO_DELTA.total_liquidation_cost_pct > 0.5
                        ? "text-amber-400"
                        : "text-emerald-400",
                  )}
                >
                  {formatPercent(MOCK_PORTFOLIO_DELTA.total_liquidation_cost_pct, 2)}
                </span>
              </div>
            </div>
          </CollapsibleSection>

          {/* DeFi Strategy Risk — Table/Chart Toggle */}
          <CollapsibleSection
            title="DeFi Strategy Risk Profiles"
            defaultOpen={true}
            count={STRATEGY_RISK_PROFILES.length}
          >
            <div className="flex items-center gap-1 p-1 bg-muted rounded-lg w-fit mb-2">
              <Button
                variant={defiRiskView === "table" ? "secondary" : "ghost"}
                size="sm"
                className="h-6 px-2 gap-1 text-[11px]"
                onClick={() => setDefiRiskView("table")}
              >
                <LayoutGrid className="size-3" />
                Table
              </Button>
              <Button
                variant={defiRiskView === "chart" ? "secondary" : "ghost"}
                size="sm"
                className="h-6 px-2 gap-1 text-[11px]"
                onClick={() => setDefiRiskView("chart")}
              >
                <LineChartIcon className="size-3" />
                Chart
              </Button>
            </div>

            {defiRiskView === "table" ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-[10px]">Strategy</TableHead>
                    <TableHead className="text-[10px] text-center">Protocol</TableHead>
                    <TableHead className="text-[10px] text-center">Coin</TableHead>
                    <TableHead className="text-[10px] text-center">Basis</TableHead>
                    <TableHead className="text-[10px] text-center">Funding</TableHead>
                    <TableHead className="text-[10px] text-right">Liq. Risk</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {STRATEGY_RISK_PROFILES.map((profile) => (
                    <TableRow key={profile.strategy_id}>
                      <TableCell className="text-[11px] font-medium">
                        {STRATEGY_DISPLAY_NAMES[profile.strategy_id]}
                      </TableCell>
                      <TableCell className="text-center">
                        <RiskLevelBadge level={profile.protocol_risk} />
                      </TableCell>
                      <TableCell className="text-center">
                        <RiskLevelBadge level={profile.coin_isolated_risk} />
                      </TableCell>
                      <TableCell className="text-center">
                        <RiskLevelBadge level={profile.basis_risk} />
                      </TableCell>
                      <TableCell className="text-center">
                        <RiskLevelBadge level={profile.funding_rate_risk} />
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={cn(
                            "font-mono text-[11px]",
                            profile.liquidity_risk_pct > 1
                              ? "text-rose-400"
                              : profile.liquidity_risk_pct > 0.5
                                ? "text-amber-400"
                                : "text-emerald-400",
                          )}
                        >
                          {formatPercent(profile.liquidity_risk_pct, 0)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <DeFiRiskTimeSeriesChart />
            )}
          </CollapsibleSection>
        </div>
      )}
    </WidgetScroll>
  );
}
