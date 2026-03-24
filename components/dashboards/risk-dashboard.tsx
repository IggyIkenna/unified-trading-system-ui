"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Bell,
  Calculator,
  CheckCircle,
  Clock,
  Download,
  FlaskConical,
  Globe,
  Shield,
  TrendingDown,
  TrendingUp,
  XCircle,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RiskDashboardProps {
  currentPage: string;
}

// Mock data
const riskSummary = {
  overallStatus: "moderate",
  varUtilization: 72,
  exposureLimit: 85,
  activeBreaches: 2,
  pendingReviews: 5,
};

const varMetrics = {
  current: 12400000,
  limit: 18000000,
  percentile95: 14200000,
  percentile99: 16800000,
  historicalMax: 15600000,
  // CVaR / Expected Shortfall - average loss beyond VaR threshold
  cvar95: 17800000, // Expected loss given VaR 95% is breached
  cvar99: 21200000, // Expected loss given VaR 99% is breached
  // Component VaR by instrument
  componentVaR: [
    {
      instrument: "BTC",
      var95: 5200000,
      marginalVaR: 4800000,
      contributionPct: 36.6,
    },
    {
      instrument: "ETH",
      var95: 3800000,
      marginalVaR: 3500000,
      contributionPct: 26.8,
    },
    {
      instrument: "SOL",
      var95: 1900000,
      marginalVaR: 1750000,
      contributionPct: 13.4,
    },
    {
      instrument: "Options",
      var95: 2100000,
      marginalVaR: 1950000,
      contributionPct: 14.8,
    },
    {
      instrument: "Other",
      var95: 1200000,
      marginalVaR: 1100000,
      contributionPct: 8.4,
    },
  ],
};

const greeksData = {
  portfolio: {
    delta: 2450000,
    gamma: 125000,
    vega: 89000,
    theta: -12500,
    rho: 34000,
  },
  byAsset: [
    {
      asset: "BTC",
      delta: 1200000,
      gamma: 85000,
      vega: 45000,
      theta: -8000,
      rho: 15000,
    },
    {
      asset: "ETH",
      delta: 850000,
      gamma: 32000,
      vega: 28000,
      theta: -3200,
      rho: 12000,
    },
    {
      asset: "SOL",
      delta: 280000,
      gamma: 5500,
      vega: 12000,
      theta: -900,
      rho: 4500,
    },
    {
      asset: "AVAX",
      delta: 120000,
      gamma: 2500,
      vega: 4000,
      theta: -400,
      rho: 2500,
    },
  ],
};

const stressScenarios = [
  {
    scenario: "BTC -20%",
    impact: -28500000,
    portfolioDrawdown: -8.2,
    probability: "Low",
    status: "pass",
  },
  {
    scenario: "ETH -30%",
    impact: -18200000,
    portfolioDrawdown: -5.4,
    probability: "Low",
    status: "pass",
  },
  {
    scenario: "Crypto Crash (-50%)",
    impact: -62000000,
    portfolioDrawdown: -18.1,
    probability: "Very Low",
    status: "warning",
  },
  {
    scenario: "Liquidity Crisis",
    impact: -35000000,
    portfolioDrawdown: -10.2,
    probability: "Low",
    status: "warning",
  },
  {
    scenario: "Rate Spike +2%",
    impact: -8500000,
    portfolioDrawdown: -2.5,
    probability: "Medium",
    status: "pass",
  },
  {
    scenario: "Correlation Spike",
    impact: -22000000,
    portfolioDrawdown: -6.4,
    probability: "Low",
    status: "pass",
  },
];

const limitBreaches = [
  {
    id: "BR-001",
    type: "Drawdown Limit",
    strategy: "Basis Trading",
    severity: "high",
    breachValue: "5.2%",
    limitValue: "5.0%",
    time: "4 hours ago",
    status: "active",
  },
  {
    id: "BR-002",
    type: "Position Limit",
    strategy: "Alpha Momentum",
    severity: "medium",
    breachValue: "$67.2M",
    limitValue: "$60M",
    time: "6 hours ago",
    status: "action-required",
  },
  {
    id: "BR-003",
    type: "Concentration",
    strategy: "N/A",
    severity: "low",
    breachValue: "21.3%",
    limitValue: "20%",
    time: "1 day ago",
    status: "monitoring",
  },
];

const riskLimits = [
  {
    name: "Portfolio VaR (95%)",
    current: 14200000,
    limit: 18000000,
    status: "ok",
  },
  {
    name: "CVaR / ES (95%)",
    current: 17800000,
    limit: 22000000,
    status: "ok",
    tooltip: "Expected Shortfall: avg loss when VaR is breached",
  },
  { name: "Delta Exposure", current: 2450000, limit: 5000000, status: "ok" },
  {
    name: "Single Asset Conc.",
    current: 28,
    limit: 30,
    unit: "%",
    status: "warning",
  },
  { name: "Gross Leverage", current: 1.8, limit: 3.0, unit: "x", status: "ok" },
  {
    name: "Max Drawdown",
    current: 4.2,
    limit: 5.0,
    unit: "%",
    status: "warning",
  },
  {
    name: "Margin Utilization",
    current: 82,
    limit: 85,
    unit: "%",
    status: "warning",
  },
];

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (Math.abs(value) >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (Math.abs(value) >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

// Risk Dashboard Overview
function RiskOverview() {
  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Risk Dashboard</h1>
          <p className="text-xs text-muted-foreground">
            Portfolio risk metrics and limit monitoring
          </p>
        </div>
        <Badge
          variant={
            riskSummary.overallStatus === "low"
              ? "default"
              : riskSummary.overallStatus === "moderate"
                ? "secondary"
                : "destructive"
          }
          className="text-sm px-3 py-1"
        >
          {riskSummary.overallStatus.toUpperCase()} RISK
        </Badge>
      </div>

      {/* Key Risk Metrics */}
      <div className="grid gap-3 grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">
                VaR Utilization
              </span>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold mb-2">
              {riskSummary.varUtilization}%
            </div>
            <Progress value={riskSummary.varUtilization} className="h-1.5" />
            <div className="text-xs text-muted-foreground mt-1">
              {formatCurrency(varMetrics.current)} /{" "}
              {formatCurrency(varMetrics.limit)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">
                Exposure Limit
              </span>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold mb-2">
              {riskSummary.exposureLimit}%
            </div>
            <Progress
              value={riskSummary.exposureLimit}
              className={cn(
                "h-1.5",
                riskSummary.exposureLimit > 80 && "[&>div]:bg-warning",
              )}
            />
            <div className="text-xs text-warning mt-1">Approaching limit</div>
          </CardContent>
        </Card>

        <Card
          className={
            riskSummary.activeBreaches > 0 ? "border-destructive/30" : ""
          }
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">
                Active Breaches
              </span>
              <AlertTriangle
                className={`h-4 w-4 ${riskSummary.activeBreaches > 0 ? "text-destructive" : "text-muted-foreground"}`}
              />
            </div>
            <div
              className={`text-2xl font-bold ${riskSummary.activeBreaches > 0 ? "text-destructive" : ""}`}
            >
              {riskSummary.activeBreaches}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {riskSummary.pendingReviews} pending review
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">VaR (99%)</span>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">
              {formatCurrency(varMetrics.percentile99)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Max: {formatCurrency(varMetrics.historicalMax)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-xs text-muted-foreground"
                title="Conditional VaR / Expected Shortfall"
              >
                CVaR (95%)
              </span>
              <TrendingDown className="h-4 w-4 text-[var(--status-warning)]" />
            </div>
            <div className="text-2xl font-bold">
              {formatCurrency(varMetrics.cvar95)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              <span className="text-[var(--status-warning)]">
                +
                {Math.round(
                  (varMetrics.cvar95 / varMetrics.percentile95 - 1) * 100,
                )}
                %
              </span>{" "}
              beyond VaR
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Component VaR Summary - Marginal VaR by Instrument */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Component VaR / Marginal VaR by Instrument
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {varMetrics.componentVaR.map((item) => (
              <div key={item.instrument} className="flex items-center gap-3">
                <div className="w-16 text-sm font-medium">
                  {item.instrument}
                </div>
                <div className="flex-1 h-4 bg-muted/30 rounded overflow-hidden relative">
                  <div
                    className="absolute inset-y-0 left-0 bg-[var(--status-warning)]/60 rounded"
                    style={{ width: `${item.contributionPct}%` }}
                  />
                  <div
                    className="absolute inset-y-0 left-0 bg-[var(--status-warning)] rounded"
                    style={{
                      width: `${(item.marginalVaR / varMetrics.percentile95) * 100}%`,
                    }}
                  />
                </div>
                <div className="w-20 text-right text-sm font-mono tabular-nums">
                  {formatCurrency(item.marginalVaR)}
                </div>
                <div className="w-12 text-right text-xs text-muted-foreground">
                  {item.contributionPct}%
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-[var(--status-warning)]" />
              <span>Marginal VaR</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-[var(--status-warning)]/60" />
              <span>Component VaR Contribution</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 grid-cols-12">
        {/* Greeks Summary */}
        <Card className="col-span-5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Portfolio Greeks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                {
                  label: "Delta (Δ)",
                  value: greeksData.portfolio.delta,
                  format: formatCurrency,
                },
                {
                  label: "Gamma (Γ)",
                  value: greeksData.portfolio.gamma,
                  format: formatCurrency,
                },
                {
                  label: "Vega (ν)",
                  value: greeksData.portfolio.vega,
                  format: formatCurrency,
                },
                {
                  label: "Theta (Θ)",
                  value: greeksData.portfolio.theta,
                  format: formatCurrency,
                },
                {
                  label: "Rho (ρ)",
                  value: greeksData.portfolio.rho,
                  format: formatCurrency,
                },
              ].map((greek) => (
                <div
                  key={greek.label}
                  className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                >
                  <span className="text-sm font-medium">{greek.label}</span>
                  <span
                    className={cn(
                      "font-mono",
                      greek.value < 0 ? "text-negative" : "text-foreground",
                    )}
                  >
                    {greek.format(greek.value)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Risk Limits */}
        <Card className="col-span-7">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Risk Limits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {riskLimits.map((limit) => {
                const utilization =
                  limit.unit === "%" || limit.unit === "x"
                    ? (limit.current / limit.limit) * 100
                    : (limit.current / limit.limit) * 100;
                return (
                  <div key={limit.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">{limit.name}</span>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-sm font-mono",
                            limit.status === "warning" ? "text-warning" : "",
                          )}
                        >
                          {limit.unit === "$"
                            ? formatCurrency(limit.current)
                            : `${limit.current}${limit.unit || ""}`}
                          {" / "}
                          {limit.unit === "$"
                            ? formatCurrency(limit.limit)
                            : `${limit.limit}${limit.unit || ""}`}
                        </span>
                        {limit.status === "ok" ? (
                          <CheckCircle className="h-4 w-4 text-positive" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-warning" />
                        )}
                      </div>
                    </div>
                    <Progress
                      value={utilization}
                      className={cn(
                        "h-1.5",
                        utilization > 80 && "[&>div]:bg-warning",
                        utilization > 95 && "[&>div]:bg-destructive",
                      )}
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Breaches */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Recent Limit Breaches
            </CardTitle>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {limitBreaches.map((breach) => (
              <div
                key={breach.id}
                className="flex items-center justify-between py-3 border-b border-border/50 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      breach.severity === "high"
                        ? "bg-destructive"
                        : breach.severity === "medium"
                          ? "bg-warning"
                          : "bg-muted-foreground"
                    }`}
                  />
                  <div>
                    <div className="font-medium">{breach.type}</div>
                    <div className="text-xs text-muted-foreground">
                      {breach.strategy}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm">
                    <span className="text-destructive">
                      {breach.breachValue}
                    </span>
                    {" / "}
                    <span className="text-muted-foreground">
                      {breach.limitValue}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {breach.time}
                    <Badge
                      variant={
                        breach.status === "active" ? "destructive" : "outline"
                      }
                      className="text-[9px] ml-1"
                    >
                      {breach.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Greeks Page - detailed Greek analysis
function GreeksPage() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Portfolio Greeks</h1>
          <p className="text-xs text-muted-foreground">
            Detailed Greek analysis by asset and strategy
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-3.5 w-3.5 mr-1.5" />
          Export
        </Button>
      </div>

      {/* Portfolio Level Greeks */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Portfolio Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            {[
              {
                label: "Delta (Δ)",
                value: greeksData.portfolio.delta,
                description: "Directional exposure",
              },
              {
                label: "Gamma (Γ)",
                value: greeksData.portfolio.gamma,
                description: "Delta sensitivity",
              },
              {
                label: "Vega (ν)",
                value: greeksData.portfolio.vega,
                description: "Volatility exposure",
              },
              {
                label: "Theta (Θ)",
                value: greeksData.portfolio.theta,
                description: "Time decay",
              },
              {
                label: "Rho (ρ)",
                value: greeksData.portfolio.rho,
                description: "Rate sensitivity",
              },
            ].map((greek) => (
              <div key={greek.label} className="p-4 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground">
                  {greek.label}
                </div>
                <div
                  className={cn(
                    "text-xl font-bold mt-1",
                    greek.value < 0 ? "text-negative" : "",
                  )}
                >
                  {formatCurrency(greek.value)}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  {greek.description}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Greeks by Asset */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Greeks by Asset</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr className="text-muted-foreground">
                <th className="px-4 py-2 text-left font-medium">Asset</th>
                <th className="px-4 py-2 text-right font-medium">Delta (Δ)</th>
                <th className="px-4 py-2 text-right font-medium">Gamma (Γ)</th>
                <th className="px-4 py-2 text-right font-medium">Vega (ν)</th>
                <th className="px-4 py-2 text-right font-medium">Theta (Θ)</th>
                <th className="px-4 py-2 text-right font-medium">Rho (ρ)</th>
              </tr>
            </thead>
            <tbody>
              {greeksData.byAsset.map((row) => (
                <tr
                  key={row.asset}
                  className="border-b border-border/50 hover:bg-muted/30"
                >
                  <td className="px-4 py-3 font-medium">{row.asset}</td>
                  <td className="px-4 py-3 text-right font-mono">
                    {formatCurrency(row.delta)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {formatCurrency(row.gamma)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {formatCurrency(row.vega)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-negative">
                    {formatCurrency(row.theta)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {formatCurrency(row.rho)}
                  </td>
                </tr>
              ))}
              <tr className="bg-muted/50 font-medium">
                <td className="px-4 py-3">Total</td>
                <td className="px-4 py-3 text-right font-mono">
                  {formatCurrency(greeksData.portfolio.delta)}
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  {formatCurrency(greeksData.portfolio.gamma)}
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  {formatCurrency(greeksData.portfolio.vega)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-negative">
                  {formatCurrency(greeksData.portfolio.theta)}
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  {formatCurrency(greeksData.portfolio.rho)}
                </td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

// VaR Page
function VaRPage() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Value at Risk (VaR)</h1>
          <p className="text-xs text-muted-foreground">
            Portfolio VaR analysis and decomposition
          </p>
        </div>
        <Select defaultValue="historical">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="VaR Method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="historical">Historical VaR</SelectItem>
            <SelectItem value="parametric">Parametric VaR</SelectItem>
            <SelectItem value="montecarlo">Monte Carlo VaR</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">VaR (95%)</div>
            <div className="text-2xl font-bold mt-1">
              {formatCurrency(varMetrics.percentile95)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              1-day horizon
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">VaR (99%)</div>
            <div className="text-2xl font-bold mt-1">
              {formatCurrency(varMetrics.percentile99)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              1-day horizon
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">VaR Limit</div>
            <div className="text-2xl font-bold mt-1">
              {formatCurrency(varMetrics.limit)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {((varMetrics.current / varMetrics.limit) * 100).toFixed(0)}%
              utilized
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Historical Max</div>
            <div className="text-2xl font-bold mt-1">
              {formatCurrency(varMetrics.historicalMax)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Peak VaR</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">VaR by Asset Class</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            VaR decomposition chart placeholder
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Stress Tests Page
function StressTestsPage() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Stress Tests</h1>
          <p className="text-xs text-muted-foreground">
            Portfolio impact under various stress scenarios
          </p>
        </div>
        <Button size="sm">
          <Zap className="h-3.5 w-3.5 mr-1.5" />
          Run All Tests
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr className="text-muted-foreground">
                <th className="px-4 py-3 text-left font-medium">Scenario</th>
                <th className="px-4 py-3 text-right font-medium">P&L Impact</th>
                <th className="px-4 py-3 text-right font-medium">Drawdown</th>
                <th className="px-4 py-3 text-center font-medium">
                  Probability
                </th>
                <th className="px-4 py-3 text-center font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {stressScenarios.map((scenario) => (
                <tr
                  key={scenario.scenario}
                  className="border-b border-border/50 hover:bg-muted/30"
                >
                  <td className="px-4 py-3 font-medium">{scenario.scenario}</td>
                  <td className="px-4 py-3 text-right font-mono text-negative">
                    {formatCurrency(scenario.impact)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-negative">
                    -{scenario.portfolioDrawdown}%
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px]",
                        scenario.probability === "Very Low" &&
                          "border-positive/50 text-positive",
                        scenario.probability === "Low" &&
                          "border-muted-foreground",
                        scenario.probability === "Medium" &&
                          "border-warning/50 text-warning",
                      )}
                    >
                      {scenario.probability}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {scenario.status === "pass" ? (
                      <CheckCircle className="h-4 w-4 text-positive inline" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-warning inline" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

// What-If Scenario Analysis
function WhatIfPage() {
  const [btcMove, setBtcMove] = React.useState([0]);
  const [ethMove, setEthMove] = React.useState([0]);
  const [volMove, setVolMove] = React.useState([0]);

  const estimatedImpact =
    (btcMove[0] * 1200000 + ethMove[0] * 850000 + volMove[0] * 89000) / 100;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">What-If Analysis</h1>
          <p className="text-xs text-muted-foreground">
            Interactive scenario modeling
          </p>
        </div>
        <Button size="sm">
          <Calculator className="h-3.5 w-3.5 mr-1.5" />
          Calculate
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Scenario Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">BTC Price Move</label>
                <span className="text-sm font-mono">
                  {btcMove[0] > 0 ? "+" : ""}
                  {btcMove[0]}%
                </span>
              </div>
              <Slider
                value={btcMove}
                onValueChange={setBtcMove}
                min={-50}
                max={50}
                step={1}
                className="w-full"
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">ETH Price Move</label>
                <span className="text-sm font-mono">
                  {ethMove[0] > 0 ? "+" : ""}
                  {ethMove[0]}%
                </span>
              </div>
              <Slider
                value={ethMove}
                onValueChange={setEthMove}
                min={-50}
                max={50}
                step={1}
                className="w-full"
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Implied Vol Move</label>
                <span className="text-sm font-mono">
                  {volMove[0] > 0 ? "+" : ""}
                  {volMove[0]}%
                </span>
              </div>
              <Slider
                value={volMove}
                onValueChange={setVolMove}
                min={-50}
                max={100}
                step={5}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Estimated Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground">
                  Portfolio P&L Impact
                </div>
                <div
                  className={cn(
                    "text-3xl font-bold mt-1",
                    estimatedImpact >= 0 ? "text-positive" : "text-negative",
                  )}
                >
                  {estimatedImpact >= 0 ? "+" : ""}
                  {formatCurrency(estimatedImpact)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground">
                    New VaR (95%)
                  </div>
                  <div className="text-lg font-bold mt-1">
                    {formatCurrency(
                      varMetrics.percentile95 + Math.abs(estimatedImpact) * 0.1,
                    )}
                  </div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground">
                    Drawdown Impact
                  </div>
                  <div
                    className={cn(
                      "text-lg font-bold mt-1",
                      estimatedImpact < 0 ? "text-negative" : "text-positive",
                    )}
                  >
                    {estimatedImpact >= 0 ? "+" : ""}
                    {((estimatedImpact / 24500000) * 100).toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Limits Page
function LimitsPage() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Risk Limits</h1>
          <p className="text-xs text-muted-foreground">
            Limit configuration and monitoring
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-3.5 w-3.5 mr-1.5" />
          Export
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="space-y-6">
            {riskLimits.map((limit) => {
              const utilization =
                limit.unit === "%" || limit.unit === "x"
                  ? (limit.current / limit.limit) * 100
                  : (limit.current / limit.limit) * 100;
              return (
                <div key={limit.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{limit.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono">
                        {limit.unit === "$"
                          ? formatCurrency(limit.current)
                          : `${limit.current}${limit.unit || ""}`}
                        {" / "}
                        {limit.unit === "$"
                          ? formatCurrency(limit.limit)
                          : `${limit.limit}${limit.unit || ""}`}
                      </span>
                      <span
                        className={cn(
                          "text-sm",
                          utilization > 80
                            ? "text-warning"
                            : "text-muted-foreground",
                        )}
                      >
                        ({utilization.toFixed(0)}%)
                      </span>
                      {limit.status === "ok" ? (
                        <CheckCircle className="h-4 w-4 text-positive" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-warning" />
                      )}
                    </div>
                  </div>
                  <Progress
                    value={utilization}
                    className={cn(
                      "h-2",
                      utilization > 80 && "[&>div]:bg-warning",
                      utilization > 95 && "[&>div]:bg-destructive",
                    )}
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Breaches Page
function BreachesPage() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Limit Breaches</h1>
          <p className="text-xs text-muted-foreground">
            Active and historical limit breaches
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-3.5 w-3.5 mr-1.5" />
          Export
        </Button>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">
            Active ({limitBreaches.length})
          </TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="mt-4">
          <div className="space-y-3">
            {limitBreaches.map((breach) => (
              <Card
                key={breach.id}
                className={
                  breach.severity === "high" ? "border-destructive/30" : ""
                }
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "p-2 rounded-lg",
                          breach.severity === "high"
                            ? "bg-destructive/10"
                            : breach.severity === "medium"
                              ? "bg-warning/10"
                              : "bg-muted",
                        )}
                      >
                        <AlertTriangle
                          className={cn(
                            "h-4 w-4",
                            breach.severity === "high"
                              ? "text-destructive"
                              : breach.severity === "medium"
                                ? "text-warning"
                                : "text-muted-foreground",
                          )}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">
                            {breach.id}
                          </span>
                          <span className="font-medium">{breach.type}</span>
                          <Badge
                            variant={
                              breach.severity === "high"
                                ? "destructive"
                                : breach.severity === "medium"
                                  ? "outline"
                                  : "secondary"
                            }
                            className="text-[9px]"
                          >
                            {breach.severity.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {breach.strategy}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs">
                          <span>
                            Current:{" "}
                            <span className="text-destructive font-medium">
                              {breach.breachValue}
                            </span>
                          </span>
                          <span>
                            Limit:{" "}
                            <span className="font-medium">
                              {breach.limitValue}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          breach.status === "active" ? "destructive" : "outline"
                        }
                        className="text-[9px]"
                      >
                        {breach.status.toUpperCase()}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-2">
                        {breach.time}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="resolved" className="mt-4">
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              No resolved breaches to display
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function RiskDashboard({ currentPage }: RiskDashboardProps) {
  switch (currentPage) {
    case "greeks":
      return <GreeksPage />;
    case "var":
      return <VaRPage />;
    case "stress":
      return <StressTestsPage />;
    case "whatif":
      return <WhatIfPage />;
    case "limits":
      return <LimitsPage />;
    case "breaches":
      return <BreachesPage />;
    case "dashboard":
    default:
      return <RiskOverview />;
  }
}
