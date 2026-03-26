import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GateCheckRow } from "@/components/shared/gate-check-row";
import { MetricCard } from "@/components/shared/metric-card";
import { FeatureStabilityPanel } from "./feature-stability-panel";
import { fmtNum, fmtPct, statusBg } from "./helpers";
import { PromoteWorkflowActions } from "./promote-workflow-actions";
import { RegimeAnalysisPanel } from "./regime-analysis-panel";
import { WalkForwardPanel } from "./walk-forward-panel";
import type { CandidateStrategy, GateCheck } from "./types";

export function ModelAssessmentTab({
  strategy,
}: {
  strategy: CandidateStrategy;
}) {
  const ml = strategy.mlMetrics;
  const m = strategy.metrics;

  const modelGates: GateCheck[] = [
    {
      id: "ic",
      label: "Information Coefficient",
      status: ml.informationCoefficient >= 0.03 ? "passed" : "failed",
      mandatory: true,
      threshold: "≥ 0.03",
      actual: fmtNum(ml.informationCoefficient, 3),
      category: "Signal Quality",
    },
    {
      id: "oos",
      label: "Out-of-Sample Ratio",
      status:
        ml.oosPerformance >= 0.8
          ? "passed"
          : ml.oosPerformance >= 0.6
            ? "warning"
            : "failed",
      mandatory: true,
      threshold: "≥ 0.80",
      actual: fmtNum(ml.oosPerformance),
      category: "Signal Quality",
    },
    {
      id: "auc",
      label: "AUC-ROC",
      status: ml.auc >= 0.7 ? "passed" : ml.auc >= 0.6 ? "warning" : "failed",
      mandatory: true,
      threshold: "≥ 0.70",
      actual: fmtNum(ml.auc),
      category: "Classification",
    },
    {
      id: "f1",
      label: "F1 Score",
      status: ml.f1 >= 0.6 ? "passed" : "warning",
      mandatory: false,
      threshold: "≥ 0.60",
      actual: fmtNum(ml.f1),
      category: "Classification",
    },
    {
      id: "sharpe",
      label: "Sharpe Ratio (Backtest)",
      status:
        m.sharpe >= 1.5 ? "passed" : m.sharpe >= 1.0 ? "warning" : "failed",
      mandatory: true,
      threshold: "≥ 1.50",
      actual: fmtNum(m.sharpe),
      category: "Backtest",
    },
    {
      id: "sortino",
      label: "Sortino Ratio",
      status:
        m.sortino >= 2.0 ? "passed" : m.sortino >= 1.5 ? "warning" : "failed",
      mandatory: true,
      threshold: "≥ 2.00",
      actual: fmtNum(m.sortino),
      category: "Backtest",
    },
    {
      id: "calmar",
      label: "Calmar Ratio",
      status:
        m.calmar >= 3.0 ? "passed" : m.calmar >= 2.0 ? "warning" : "failed",
      mandatory: true,
      threshold: "≥ 3.00",
      actual: fmtNum(m.calmar),
      category: "Backtest",
    },
    {
      id: "hit-rate",
      label: "Hit Rate",
      status: m.hitRate >= 0.6 ? "passed" : "warning",
      mandatory: false,
      threshold: "≥ 60%",
      actual: fmtPct(m.hitRate),
      category: "Backtest",
    },
    {
      id: "profit-factor",
      label: "Profit Factor",
      status:
        m.profitFactor >= 2.0
          ? "passed"
          : m.profitFactor >= 1.5
            ? "warning"
            : "failed",
      mandatory: true,
      threshold: "≥ 2.00",
      actual: fmtNum(m.profitFactor),
      category: "Backtest",
    },
    {
      id: "max-dd",
      label: "Max Drawdown",
      status:
        Math.abs(m.maxDrawdown) <= 0.1
          ? "passed"
          : Math.abs(m.maxDrawdown) <= 0.15
            ? "warning"
            : "failed",
      mandatory: true,
      threshold: "≤ 10%",
      actual: fmtPct(m.maxDrawdown),
      category: "Backtest",
    },
  ];

  const groupedGates = modelGates.reduce<Record<string, GateCheck[]>>(
    (acc, g) => {
      const cat = g.category ?? "Other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(g);
      return acc;
    },
    {},
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">
            Model & Signal Assessment — {strategy.name}
          </h3>
          <p className="text-sm text-muted-foreground">
            ML model performance, signal quality, and backtest validation
          </p>
        </div>
        <Badge
          variant="outline"
          className={statusBg(strategy.stages.model_assessment.status)}
        >
          {strategy.stages.model_assessment.status.replace("_", " ")}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {[
          {
            label: "IC",
            value: fmtNum(ml.informationCoefficient, 3),
            color:
              ml.informationCoefficient >= 0.03
                ? "text-emerald-400"
                : "text-amber-400",
          },
          {
            label: "AUC",
            value: fmtNum(ml.auc),
            color: ml.auc >= 0.7 ? "text-emerald-400" : "text-amber-400",
          },
          {
            label: "OOS Ratio",
            value: fmtNum(ml.oosPerformance),
            color:
              ml.oosPerformance >= 0.8 ? "text-emerald-400" : "text-amber-400",
          },
          {
            label: "F1",
            value: fmtNum(ml.f1),
            color: ml.f1 >= 0.6 ? "text-emerald-400" : "text-amber-400",
          },
          { label: "Features", value: `${ml.featureCount}`, color: "" },
          { label: "Training", value: ml.trainingPeriod, color: "" },
        ].map((item) => (
          <MetricCard
            key={item.label}
            tone="grid"
            density="compact"
            label={item.label}
            primary={item.value}
            primaryClassName={item.color}
          />
        ))}
        {[
          { label: "Sharpe", value: fmtNum(m.sharpe) },
          { label: "Sortino", value: fmtNum(m.sortino) },
          { label: "Calmar", value: fmtNum(m.calmar) },
          {
            label: "Max DD",
            value: fmtPct(m.maxDrawdown),
            color: "text-rose-400",
          },
          {
            label: "Return",
            value: fmtPct(m.totalReturn),
            color: "text-emerald-400",
          },
          { label: "Profit Factor", value: fmtNum(m.profitFactor) },
        ].map((item) => (
          <MetricCard
            key={item.label}
            tone="grid"
            density="compact"
            label={item.label}
            primary={item.value}
            primaryClassName={item.color}
          />
        ))}
      </div>

      {Object.entries(groupedGates).map(([category, gates]) => (
        <Card key={category}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{category}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {gates.map((gate) => (
                <GateCheckRow
                  key={gate.id}
                  status={gate.status}
                  title={gate.label}
                  required={gate.mandatory}
                  threshold={gate.threshold}
                  actual={gate.actual}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <RegimeAnalysisPanel strategy={strategy} />
      <WalkForwardPanel strategy={strategy} />
      <FeatureStabilityPanel strategy={strategy} />

      <PromoteWorkflowActions
        strategyId={strategy.id}
        strategyName={strategy.name}
        stage="model_assessment"
        currentStage={strategy.currentStage}
      />
    </div>
  );
}
