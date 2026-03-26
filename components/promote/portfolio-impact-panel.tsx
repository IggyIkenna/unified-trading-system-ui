import { Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PORTFOLIO_PRE_ADD_MAX_CORRELATION } from "./mock-fixtures";
import { fmtNum, fmtPct } from "./helpers";
import type { CandidateStrategy } from "./types";

export function PortfolioImpactPanel({
  strategy,
}: {
  strategy: CandidateStrategy;
}) {
  const r = strategy.riskProfile;
  const cap = strategy.capitalAllocation;
  const marginalFromSizing = cap?.marginalVar;
  const marginalFallback = r.correlationToPortfolio * 0.012 + 0.004;
  const marginal = marginalFromSizing ?? marginalFallback;
  const divBenefit =
    r.correlationToPortfolio < 0.25
      ? "Net diversification benefit"
      : "Marginal crowding risk";
  const rhoPre = PORTFOLIO_PRE_ADD_MAX_CORRELATION;
  const rhoPost = clamp(rhoPre + r.correlationToPortfolio * 0.08, 0, 0.99);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Layers className="size-4 text-cyan-400" />
          Portfolio Impact
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border/60 p-3">
            <p className="text-xs uppercase text-muted-foreground">
              Marginal VaR{" "}
              {marginalFromSizing !== undefined ? "(from sizing)" : "(est.)"}
            </p>
            <p className="text-lg font-mono font-bold mt-1">
              {fmtPct(marginal)}
            </p>
          </div>
          <div className="rounded-lg border border-border/60 p-3">
            <p className="text-xs uppercase text-muted-foreground">
              Correlation to book
            </p>
            <p className="text-lg font-mono font-bold mt-1">
              {fmtNum(r.correlationToPortfolio)}
            </p>
          </div>
        </div>
        <div className="rounded-lg border border-border/50 p-3">
          <p className="text-xs text-muted-foreground mb-2">
            Before / after (illustrative)
          </p>
          <div className="flex justify-between font-mono">
            <span>ρ max (pre)</span>
            <span>{fmtNum(rhoPre)}</span>
          </div>
          <div className="flex justify-between font-mono mt-1">
            <span>ρ max (post)</span>
            <span className="text-amber-400">{fmtNum(rhoPost)}</span>
          </div>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          {divBenefit} based on correlation and sizing inputs.
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Illustrative portfolio metrics — not a production risk engine;
          pre-book ρ from portfolio SSOT mock.
        </p>
      </CardContent>
    </Card>
  );
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}
