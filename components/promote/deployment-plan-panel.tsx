import { Rocket } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CandidateStrategy } from "./types";

const FALLBACK = {
  targetEnv: "Staging validation → production canary → full ramp per capital tab",
  rollbackConditions: [
    "Auto flatten if realized DD > policy",
    "VaR breach > 2σ vs model",
    "Data feed integrity < 95% for 15m",
  ],
  monitoringPlan: [
    { period: "24h", checks: ["Execution QA", "P&L bridge vs risk model"] },
    {
      period: "2w",
      checks: ["Risk attribution", "Slippage vs backtest band"],
    },
    { period: "1m", checks: ["Model drift dashboard", "MRM sign-off"] },
  ],
  escalationContacts: ["oncall@risk desk", "CIO office", "compliance hotline"],
};

function pickMonitoringWindows(plan: { period: string; checks: string[] }[]): {
  m24: { period: string; checks: string[] } | null;
  m2w: { period: string; checks: string[] } | null;
  rest: { period: string; checks: string[] }[];
} {
  if (plan.length === 0) {
    return { m24: null, m2w: null, rest: [] };
  }
  const m24 = plan.find((m) => /24h|0-24h|0-24h/i.test(m.period)) ?? plan[0] ?? null;
  const m2w =
    plan.find((m) => m !== m24 && /^(2w|1w|2wk|1wk|weekly)$/i.test(m.period.trim())) ??
    plan.find((m) => m !== m24) ??
    null;
  const used = new Set([m24?.period, m2w?.period].filter(Boolean) as string[]);
  const rest = plan.filter((m) => !used.has(m.period));
  return { m24, m2w, rest };
}

function MonitoringWindowCard({
  title,
  period,
  checks,
  className,
}: {
  title: string;
  period: string;
  checks: string[];
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-[8rem] flex-col rounded-lg border border-border/50 p-3", className)}>
      <p className="text-xs uppercase tracking-wide text-foreground/80">{title}</p>
      <p className="mb-2 font-mono text-sm text-cyan-400/90">{period}</p>
      <ul className="list-disc space-y-0.5 pl-4 text-muted-foreground">
        {checks.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
    </div>
  );
}

export function DeploymentPlanPanel({ strategy }: { strategy: CandidateStrategy }) {
  const p = strategy.deploymentPlan ?? FALLBACK;
  const { m24, m2w, rest } = pickMonitoringWindows(p.monitoringPlan);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Rocket className="size-4 text-amber-400" />
          Deployment plan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-xs text-muted-foreground">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="flex min-h-[8rem] flex-col rounded-lg border border-border/50 p-3">
            <p className="text-xs uppercase tracking-wide text-foreground/80">Target environment</p>
            <p className="mt-2 font-mono text-sm leading-relaxed text-foreground/90">{p.targetEnv}</p>
            {!strategy.deploymentPlan ? (
              <p className="mt-auto pt-2 text-[10px] leading-snug">
                Generic template: strategy has no custom deploymentPlan in mock data.
              </p>
            ) : null}
          </div>
          {m24 ? (
            <MonitoringWindowCard title="24h monitoring" period={m24.period} checks={m24.checks} />
          ) : (
            <div className="rounded-lg border border-dashed border-border/50 p-3 text-center text-muted-foreground">
              No 24h window in plan
            </div>
          )}
          {m2w ? (
            <MonitoringWindowCard title="2w monitoring" period={m2w.period} checks={m2w.checks} />
          ) : (
            <div className="rounded-lg border border-dashed border-border/50 p-3 text-center text-muted-foreground">
              No 2w window in plan
            </div>
          )}
        </div>

        {rest.length > 0 ? (
          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-foreground/80">Additional monitoring</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {rest.map((m) => (
                <MonitoringWindowCard key={m.period} title="Monitoring" period={m.period} checks={m.checks} />
              ))}
            </div>
          </div>
        ) : null}

        <div>
          <p className="mb-1 text-xs uppercase tracking-wide text-foreground/80">Rollback / kill switch</p>
          <ul className="list-disc space-y-1 pl-4">
            {p.rollbackConditions.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-1 text-xs uppercase tracking-wide text-foreground/80">Escalation</p>
          <p className="font-mono">{p.escalationContacts.join(" · ")}</p>
        </div>
      </CardContent>
    </Card>
  );
}
