import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { GateCheckRow } from "@/components/shared/gate-check-row";
import { fmtNum, fmtPct, statusBg } from "./helpers";
import { ModelDriftPanel } from "./model-drift-panel";
import { MonteCarloPanel } from "./monte-carlo-panel";
import { PortfolioImpactPanel } from "./portfolio-impact-panel";
import { MetricCard } from "@/components/shared/metric-card";
import { PromoteWorkflowActions } from "./promote-workflow-actions";
import type { CandidateStrategy, GateStatus } from "./types";

type RiskMetricCard = {
  label: string;
  value: string;
  color?: string;
  hint?: string;
};

export function RiskStressTab({ strategy }: { strategy: CandidateStrategy }) {
  const risk = strategy.riskProfile;
  const m = strategy.metrics;

  const stressPassed = risk.stressScenarios.filter(
    (s) => s.status === "passed",
  ).length;
  const stressTotal = risk.stressScenarios.length;
  const maxStressImpact =
    risk.stressScenarios.length > 0
      ? Math.min(...risk.stressScenarios.map((s) => s.impact))
      : 0;

  const row1Metrics: RiskMetricCard[] = [
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
  ];

  const row2Metrics: RiskMetricCard[] = [
    {
      label: "Correlation",
      value: fmtNum(risk.correlationToPortfolio),
      color:
        risk.correlationToPortfolio <= 0.2
          ? "text-emerald-400"
          : risk.correlationToPortfolio <= 0.4
            ? "text-amber-400"
            : "text-rose-400",
      hint:
        risk.correlationToPortfolio <= 0.2
          ? "Low — strong diversifier"
          : "Moderate vs portfolio",
    },
    {
      label: "Concentration",
      value: fmtPct(risk.concentrationRisk),
      color:
        risk.concentrationRisk <= 0.15 ? "text-emerald-400" : "text-amber-400",
      hint: "Max single-name exposure",
    },
    {
      label: "Liquidity",
      value: `${risk.liquidityScore}`,
      color: risk.liquidityScore >= 90 ? "text-emerald-400" : "text-amber-400",
      hint: "Exit capacity vs SLA",
    },
    {
      label: "Stress pass",
      value: `${stressPassed}/${stressTotal}`,
      color:
        stressPassed === stressTotal
          ? "text-emerald-400"
          : stressPassed > 0
            ? "text-amber-400"
            : "text-rose-400",
      hint: "Scenarios within tolerance",
    },
    {
      label: "Max stress",
      value: fmtPct(maxStressImpact),
      color: "text-rose-400",
      hint: "Worst scenario P&L",
    },
    {
      label: "Win / loss",
      value: fmtNum(m.winLossRatio),
      color: m.winLossRatio >= 1.2 ? "text-emerald-400" : "text-amber-400",
      hint: "Avg win ÷ avg loss",
    },
  ];

  const riskGates: {
    label: string;
    status: GateStatus;
    actual: string;
    threshold: string;
  }[] = [
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
      status: (Math.abs(m.cvar) <= 0.05 ? "passed" : "failed") as GateStatus,
      actual: fmtPct(m.cvar),
      threshold: "≤ 5%",
    },
    {
      label: "All stress scenarios within tolerance",
      status: (risk.stressScenarios.every((s) => s.status === "passed")
        ? "passed"
        : risk.stressScenarios.some((s) => s.status === "failed")
          ? "failed"
          : "pending") as GateStatus,
      actual: `${stressPassed}/${stressTotal}`,
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
      status: (risk.liquidityScore >= 80 ? "passed" : "failed") as GateStatus,
      actual: `${risk.liquidityScore}`,
      threshold: "≥ 80",
    },
  ];

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

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {[...row1Metrics, ...row2Metrics].map((item) => (
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
            <AlertTriangle className="size-4" />
            Historical Stress Scenarios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {risk.stressScenarios.map((scenario) => (
              <GateCheckRow
                key={scenario.name}
                status={scenario.status}
                title={scenario.name}
                trailing={
                  <>
                    <span className="font-mono text-sm text-rose-400">
                      {fmtPct(scenario.impact)}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn("w-fit text-xs", statusBg(scenario.status))}
                    >
                      {scenario.status}
                    </Badge>
                  </>
                }
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Risk Gate Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {riskGates.map((gate) => (
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
