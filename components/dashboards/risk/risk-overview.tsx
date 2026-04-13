"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Activity, AlertTriangle, BarChart3, Calculator, CheckCircle, Clock, Shield, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { greeksData, limitBreaches, riskLimits, riskSummary, varMetrics } from "./risk-data";
import { formatCurrency } from "./risk-utils";

export function RiskOverview() {
  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Risk Dashboard</h1>
          <p className="text-xs text-muted-foreground">Portfolio risk metrics and limit monitoring</p>
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
              <span className="text-xs text-muted-foreground">VaR Utilization</span>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold mb-2">{riskSummary.varUtilization}%</div>
            <Progress value={riskSummary.varUtilization} className="h-1.5" />
            <div className="text-xs text-muted-foreground mt-1">
              {formatCurrency(varMetrics.current)} / {formatCurrency(varMetrics.limit)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Exposure Limit</span>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold mb-2">{riskSummary.exposureLimit}%</div>
            <Progress
              value={riskSummary.exposureLimit}
              className={cn("h-1.5", riskSummary.exposureLimit > 80 && "[&>div]:bg-warning")}
            />
            <div className="text-xs text-warning mt-1">Approaching limit</div>
          </CardContent>
        </Card>

        <Card className={riskSummary.activeBreaches > 0 ? "border-destructive/30" : ""}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Active Breaches</span>
              <AlertTriangle
                className={`h-4 w-4 ${riskSummary.activeBreaches > 0 ? "text-destructive" : "text-muted-foreground"}`}
              />
            </div>
            <div className={`text-2xl font-bold ${riskSummary.activeBreaches > 0 ? "text-destructive" : ""}`}>
              {riskSummary.activeBreaches}
            </div>
            <div className="text-xs text-muted-foreground mt-1">{riskSummary.pendingReviews} pending review</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">VaR (99%)</span>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{formatCurrency(varMetrics.percentile99)}</div>
            <div className="text-xs text-muted-foreground mt-1">Max: {formatCurrency(varMetrics.historicalMax)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground" title="Conditional VaR / Expected Shortfall">
                CVaR (95%)
              </span>
              <TrendingDown className="h-4 w-4 text-[var(--status-warning)]" />
            </div>
            <div className="text-2xl font-bold">{formatCurrency(varMetrics.cvar95)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              <span className="text-[var(--status-warning)]">
                +{Math.round((varMetrics.cvar95 / varMetrics.percentile95 - 1) * 100)}%
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
                <div className="w-16 text-sm font-medium">{item.instrument}</div>
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
                <div className="w-20 text-right text-sm font-mono tabular-nums">{formatCurrency(item.marginalVaR)}</div>
                <div className="w-12 text-right text-xs text-muted-foreground">{item.contributionPct}%</div>
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
                  <span className={cn("font-mono", greek.value < 0 ? "text-negative" : "text-foreground")}>
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
                        <span className={cn("text-sm font-mono", limit.status === "warning" ? "text-warning" : "")}>
                          {limit.unit === "$" ? formatCurrency(limit.current) : `${limit.current}${limit.unit || ""}`}
                          {" / "}
                          {limit.unit === "$" ? formatCurrency(limit.limit) : `${limit.limit}${limit.unit || ""}`}
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
                    <div className="text-xs text-muted-foreground">{breach.strategy}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm">
                    <span className="text-destructive">{breach.breachValue}</span>
                    {" / "}
                    <span className="text-muted-foreground">{breach.limitValue}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {breach.time}
                    <Badge variant={breach.status === "active" ? "destructive" : "outline"} className="text-[9px] ml-1">
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
