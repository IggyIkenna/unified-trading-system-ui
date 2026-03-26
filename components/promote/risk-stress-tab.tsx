import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { fmtNum, fmtPct, statusBg, statusColor, StatusIcon } from "./helpers";
import { ModelDriftPanel } from "./model-drift-panel";
import { MonteCarloPanel } from "./monte-carlo-panel";
import { PortfolioImpactPanel } from "./portfolio-impact-panel";
import { PromoteWorkflowActions } from "./promote-workflow-actions";
import type { CandidateStrategy, GateStatus } from "./types";

export function RiskStressTab({ strategy }: { strategy: CandidateStrategy }) {
  const risk = strategy.riskProfile;
  const m = strategy.metrics;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">
            Risk & Stress Testing — {strategy.name}
          </h3>
          <p className="text-sm text-muted-foreground">
            Value-at-risk, tail risk, stress scenarios, and portfolio impact
          </p>
        </div>
        <Badge
          variant="outline"
          className={statusBg(strategy.stages.risk_stress.status)}
        >
          {strategy.stages.risk_stress.status.replace("_", " ")}
        </Badge>
      </div>

      <div className="grid grid-cols-6 gap-3">
        {[
          {
            label: "Daily VaR (95%)",
            value: fmtPct(m.dailyVaR),
            color: "text-rose-400",
          },
          {
            label: "CVaR (99%)",
            value: fmtPct(m.cvar),
            color: "text-rose-400",
          },
          {
            label: "Tail Ratio",
            value: fmtNum(m.tailRatio),
            color: m.tailRatio >= 1.2 ? "text-emerald-400" : "text-amber-400",
          },
          {
            label: "Worst Day",
            value: fmtPct(risk.worstDay),
            color: "text-rose-400",
          },
          {
            label: "Worst Week",
            value: fmtPct(risk.worstWeek),
            color: "text-rose-400",
          },
          {
            label: "Worst Month",
            value: fmtPct(risk.worstMonth),
            color: "text-rose-400",
          },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="pt-4 pb-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {item.label}
              </p>
              <p className={cn("text-xl font-bold font-mono mt-1", item.color)}>
                {item.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Correlation to Portfolio
            </p>
            <p
              className={cn(
                "text-2xl font-bold font-mono mt-1",
                risk.correlationToPortfolio <= 0.2
                  ? "text-emerald-400"
                  : risk.correlationToPortfolio <= 0.4
                    ? "text-amber-400"
                    : "text-rose-400",
              )}
            >
              {fmtNum(risk.correlationToPortfolio)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              {risk.correlationToPortfolio <= 0.2
                ? "Low — excellent diversifier"
                : "Moderate correlation"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Concentration Risk
            </p>
            <p
              className={cn(
                "text-2xl font-bold font-mono mt-1",
                risk.concentrationRisk <= 0.15
                  ? "text-emerald-400"
                  : "text-amber-400",
              )}
            >
              {fmtPct(risk.concentrationRisk)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              Max single-name exposure
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Liquidity Score
            </p>
            <p
              className={cn(
                "text-2xl font-bold font-mono mt-1",
                risk.liquidityScore >= 90
                  ? "text-emerald-400"
                  : "text-amber-400",
              )}
            >
              {risk.liquidityScore}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              Ability to exit within SLA
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="size-4" />
            Historical Stress Scenarios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {risk.stressScenarios.map((scenario) => (
              <div
                key={scenario.name}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border",
                  statusBg(scenario.status),
                )}
              >
                <div className="flex items-center gap-3">
                  <StatusIcon status={scenario.status} className="size-4" />
                  <span className="text-sm font-medium">{scenario.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-mono text-rose-400">
                    {fmtPct(scenario.impact)}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn("text-[10px]", statusBg(scenario.status))}
                  >
                    {scenario.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Risk Gate Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              {
                label: "Daily VaR within limit (≤ 3%)",
                status: (Math.abs(m.dailyVaR) <= 0.03
                  ? "passed"
                  : "failed") as GateStatus,
                actual: fmtPct(m.dailyVaR),
                threshold: "≤ 3%",
              },
              {
                label: "CVaR within limit (≤ 5%)",
                status: (Math.abs(m.cvar) <= 0.05
                  ? "passed"
                  : "failed") as GateStatus,
                actual: fmtPct(m.cvar),
                threshold: "≤ 5%",
              },
              {
                label: "All stress scenarios within tolerance",
                status: (risk.stressScenarios.every(
                  (s) => s.status === "passed",
                )
                  ? "passed"
                  : risk.stressScenarios.some((s) => s.status === "failed")
                    ? "failed"
                    : "pending") as GateStatus,
                actual: `${risk.stressScenarios.filter((s) => s.status === "passed").length}/${risk.stressScenarios.length}`,
                threshold: "All passed",
              },
              {
                label: "Portfolio correlation acceptable",
                status: (risk.correlationToPortfolio <= 0.4
                  ? "passed"
                  : "failed") as GateStatus,
                actual: fmtNum(risk.correlationToPortfolio),
                threshold: "≤ 0.40",
              },
              {
                label: "Liquidity score above minimum",
                status: (risk.liquidityScore >= 80
                  ? "passed"
                  : "failed") as GateStatus,
                actual: `${risk.liquidityScore}`,
                threshold: "≥ 80",
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
                <div className="flex items-center gap-4 text-sm font-mono">
                  <span className="text-muted-foreground text-xs">
                    {gate.threshold}
                  </span>
                  <span className={statusColor(gate.status)}>
                    {gate.actual}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <ModelDriftPanel strategy={strategy} />
      <MonteCarloPanel strategy={strategy} />
      <PortfolioImpactPanel strategy={strategy} />

      <PromoteWorkflowActions
        strategyId={strategy.id}
        strategyName={strategy.name}
        stage="risk_stress"
        currentStage={strategy.currentStage}
      />
    </div>
  );
}
