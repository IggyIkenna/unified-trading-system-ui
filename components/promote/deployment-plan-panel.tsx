import { Rocket } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CandidateStrategy } from "./types";

const FALLBACK = {
  targetEnv:
    "Staging validation → production canary → full ramp per capital tab",
  rollbackConditions: [
    "Auto flatten if realized DD > policy",
    "VaR breach > 2σ vs model",
    "Data feed integrity < 95% for 15m",
  ],
  monitoringPlan: [
    { period: "24h", checks: ["Execution QA", "P&L bridge vs risk model"] },
    { period: "1w", checks: ["Risk attribution", "Slippage vs backtest band"] },
    { period: "1m", checks: ["Model drift dashboard", "MRM sign-off"] },
  ],
  escalationContacts: ["oncall@risk desk", "CIO office", "compliance hotline"],
};

export function DeploymentPlanPanel({
  strategy,
}: {
  strategy: CandidateStrategy;
}) {
  const p = strategy.deploymentPlan ?? FALLBACK;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Rocket className="size-4 text-amber-400" />
          Deployment plan
        </CardTitle>
      </CardHeader>
      <CardContent className="text-xs space-y-4 text-muted-foreground">
        <div>
          <p className="text-xs uppercase tracking-wide text-foreground/80 mb-1">
            Target environment
          </p>
          <p className="font-mono">{p.targetEnv}</p>
          {!strategy.deploymentPlan ? (
            <p className="text-xs mt-1">
              Generic template — strategy has no custom deploymentPlan in mock
              data.
            </p>
          ) : null}
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-foreground/80 mb-1">
            Rollback / kill switch
          </p>
          <ul className="list-disc pl-4 space-y-1">
            {p.rollbackConditions.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-foreground/80 mb-2">
            Monitoring
          </p>
          <div className="space-y-2">
            {p.monitoringPlan.map((m) => (
              <div
                key={m.period}
                className="rounded-lg border border-border/50 p-2"
              >
                <p className="text-xs font-mono text-cyan-400/90 mb-1">
                  {m.period}
                </p>
                <ul className="list-disc pl-4 space-y-0.5">
                  {m.checks.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-foreground/80 mb-1">
            Escalation
          </p>
          <p className="font-mono">{p.escalationContacts.join(" · ")}</p>
        </div>
      </CardContent>
    </Card>
  );
}
