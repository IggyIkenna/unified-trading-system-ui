import { Sigma } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
          <div className="rounded-lg border border-border/60 p-3">
            <p className="text-[10px] uppercase text-muted-foreground">
              P(loss &gt; 5% in ~30d)
            </p>
            <p className="text-xl font-mono font-bold mt-1 text-amber-400">
              {fmtPct(pLoss5)}
            </p>
          </div>
          <div className="rounded-lg border border-border/60 p-3">
            <p className="text-[10px] uppercase text-muted-foreground">
              P(loss &gt; 10% in ~30d)
            </p>
            <p className="text-xl font-mono font-bold mt-1 text-rose-400">
              {fmtPct(pLoss10)}
            </p>
          </div>
        </div>
        <div className="rounded-lg border border-border/50 p-3 font-mono">
          <p className="text-muted-foreground text-[10px] uppercase mb-1">
            95% CI — monthly return (parametric)
          </p>
          <p>
            <span className="text-emerald-400">{fmtPct(ciLow)}</span>
            <span className="text-muted-foreground mx-2">to</span>
            <span className="text-emerald-400">{fmtPct(ciHigh)}</span>
          </p>
          <p className="text-[10px] text-muted-foreground mt-2">
            σ<sub className="align-baseline">m</sub> ≈ |dailyVaR|×√21 ={" "}
            {fmtNum(sigmaMonth, 4)}
          </p>
        </div>
        <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 font-mono">
          <p className="text-[10px] uppercase text-muted-foreground mb-1">
            Worst path (scaled from max DD)
          </p>
          <p className="text-rose-400 text-lg font-bold">{fmtPct(worstSim)}</p>
        </div>
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Estimates derived from parametric VaR assumptions (daily VaR / CVaR) —
          not a full path simulation.
        </p>
      </CardContent>
    </Card>
  );
}
