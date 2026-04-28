import { Sigma } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/shared/metric-card";
import { clamp01, fmtNum, fmtPct, normalCdf } from "./helpers";
import type { CandidateStrategy } from "./types";

const PATHS_NOTIONAL = 1000;

export function MonteCarloPanel({ strategy }: { strategy: CandidateStrategy }) {
  const m = strategy.metrics;
  const sigmaMonth = Math.max(1e-6, Math.abs(m.dailyVaR) * Math.sqrt(21));
  const muMonth = m.totalReturn / 36;
  const z5 = (-0.05 - muMonth) / sigmaMonth;
  const z10 = (-0.1 - muMonth) / sigmaMonth;
  const pLoss5 = clamp01(normalCdf(z5));
  const pLoss10 = clamp01(normalCdf(z10));
  const ciLow = muMonth - 1.96 * sigmaMonth;
  const ciHigh = muMonth + 1.96 * sigmaMonth;
  const worstSim = m.maxDrawdown * (1.12 + Math.min(0.15, Math.abs(m.cvar)));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sigma className="size-4 text-cyan-400" />
          Monte Carlo (≈{PATHS_NOTIONAL} paths scale)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            variant="bordered"
            tone="panel"
            density="panelSm"
            label={<span className="text-xs uppercase">P(loss &gt; 5% in ~30d)</span>}
            primary={fmtPct(pLoss5)}
            primaryClassName="mt-1 text-amber-400"
            contentClassName="!px-3 !py-3"
          />
          <MetricCard
            variant="bordered"
            tone="panel"
            density="panelSm"
            label={<span className="text-xs uppercase">P(loss &gt; 10% in ~30d)</span>}
            primary={fmtPct(pLoss10)}
            primaryClassName="mt-1 text-rose-400"
            contentClassName="!px-3 !py-3"
          />
        </div>
        <MetricCard
          variant="bordered"
          tone="grid"
          density="compact"
          label={<span className="text-xs uppercase text-muted-foreground">95% CI: monthly return (parametric)</span>}
          body={
            <p className="font-mono">
              <span className="text-emerald-400">{fmtPct(ciLow)}</span>
              <span className="mx-2 text-muted-foreground">to</span>
              <span className="text-emerald-400">{fmtPct(ciHigh)}</span>
            </p>
          }
          secondary={
            <span className="font-mono">
              σ<sub className="align-baseline">m</sub> ≈ |dailyVaR|×√21 = {fmtNum(sigmaMonth, 4)}
            </span>
          }
          contentClassName="!px-3 !py-3 !text-left"
        />
        <MetricCard
          variant="bordered"
          tone="panel"
          density="panelSm"
          borderedSurfaceClassName="border-rose-500/20 bg-rose-500/5"
          label={<span className="text-xs uppercase text-muted-foreground">Worst path (scaled from max DD)</span>}
          primary={fmtPct(worstSim)}
          primaryClassName="text-lg text-rose-400"
          contentClassName="!px-3 !py-3 !text-left font-mono"
        />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Estimates derived from parametric VaR assumptions (daily VaR / CVaR): not a full path simulation.
        </p>
      </CardContent>
    </Card>
  );
}
