import { GitCompare, Target, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { fmtNum, fmtPct, statusBg } from "./helpers";
import { PromoteWorkflowActions } from "./promote-workflow-actions";
import type { CandidateStrategy, StrategyMetrics } from "./types";

function MetricRow({ label, champ, chall, delta }: { label: string; champ: string; chall: string; delta: string }) {
  return (
    <TableRow className="text-xs">
      <TableCell className="font-medium">{label}</TableCell>
      <TableCell className="font-mono text-muted-foreground">{champ}</TableCell>
      <TableCell className="font-mono">{chall}</TableCell>
      <TableCell className="font-mono text-cyan-400/90">{delta}</TableCell>
    </TableRow>
  );
}

function metricsRows(c: StrategyMetrics) {
  return {
    sharpe: fmtNum(c.sharpe),
    sortino: fmtNum(c.sortino),
    ret: fmtPct(c.totalReturn),
    dd: fmtPct(c.maxDrawdown),
    hit: fmtPct(c.hitRate),
  };
}

const BENCHMARKS = [
  { name: "BTC buy & hold", sharpe: 0.72, ret: "+112%", dd: "-64%" },
  { name: "12-1 momentum (EW)", sharpe: 0.95, ret: "+48%", dd: "-28%" },
  { name: "Equal-weight alt basket", sharpe: 0.41, ret: "+22%", dd: "-52%" },
];

function fmtDeltaNum(a: number, b: number, digits = 2) {
  const d = a - b;
  const s = d >= 0 ? "+" : "";
  return `${s}${fmtNum(d, digits)}`;
}

export function ChampionChallengerTab({ strategy }: { strategy: CandidateStrategy }) {
  const m = strategy.metrics;
  const chall = metricsRows(m);

  if (strategy.champion) {
    const cm = strategy.champion.metrics;
    const ch = metricsRows(cm);
    const verdict =
      m.sharpe > cm.sharpe + 0.05 ? "Challenger Wins" : m.sharpe < cm.sharpe - 0.05 ? "Champion Wins" : "Mixed Results";

    const champRegs = strategy.champion.regimePerformance;
    const challRegs = strategy.regimePerformance;
    const regimeRows: {
      regime: string;
      champSharpe: number;
      challSharpe: number;
      delta: number;
    }[] = [];
    if (champRegs && challRegs) {
      const n = Math.min(champRegs.length, challRegs.length);
      for (let i = 0; i < n; i++) {
        const row = challRegs[i];
        const cr = champRegs[i];
        if (!row || cr === undefined) break;
        regimeRows.push({
          regime: row.regime,
          champSharpe: cr.sharpe,
          challSharpe: row.sharpe,
          delta: row.sharpe - cr.sharpe,
        });
      }
    }

    const sharpeDiff = m.sharpe - cm.sharpe;
    const pseudoP = Math.max(0.02, Math.min(0.45, 0.5 - Math.abs(sharpeDiff) * 0.12));

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h3 className="font-semibold">Champion vs Challenger: {strategy.name}</h3>
            <p className="text-sm text-muted-foreground">Side-by-side production model vs candidate</p>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "text-xs font-mono",
              statusBg(verdict.includes("Challenger") ? "passed" : verdict.includes("Champion") ? "failed" : "warning"),
            )}
          >
            {verdict}
          </Badge>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <GitCompare className="size-4" />
              Head-to-head
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead>Metric</TableHead>
                  <TableHead>
                    Champion ({strategy.champion.name} v{strategy.champion.version})
                  </TableHead>
                  <TableHead>Challenger (candidate)</TableHead>
                  <TableHead>Δ (chall − champ)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <MetricRow
                  label="Sharpe"
                  champ={ch.sharpe}
                  chall={chall.sharpe}
                  delta={fmtDeltaNum(m.sharpe, cm.sharpe)}
                />
                <MetricRow
                  label="Sortino"
                  champ={ch.sortino}
                  chall={chall.sortino}
                  delta={fmtDeltaNum(m.sortino, cm.sortino)}
                />
                <MetricRow
                  label="Total return"
                  champ={ch.ret}
                  chall={chall.ret}
                  delta={fmtPct(m.totalReturn - cm.totalReturn)}
                />
                <MetricRow
                  label="Max drawdown"
                  champ={ch.dd}
                  chall={chall.dd}
                  delta={fmtPct(m.maxDrawdown - cm.maxDrawdown)}
                />
                <MetricRow label="Hit rate" champ={ch.hit} chall={chall.hit} delta={fmtPct(m.hitRate - cm.hitRate)} />
              </TableBody>
            </Table>
            <p className="text-xs text-muted-foreground mt-3 font-mono">
              Champion live since {strategy.champion.deployedSince} · deployed{" "}
              {fmtNum(strategy.champion.capitalDeployed / 1_000_000, 1)}M USD
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="size-4 text-cyan-400" />
              Statistical note (illustrative)
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1 font-mono">
            <p>
              Bootstrap Sharpe difference (OOS windows): Δ = {fmtNum(sharpeDiff, 3)} · illustrative p ≈{" "}
              {fmtNum(pseudoP, 2)}: not a substitute for production-grade DM / reality-check tests.
            </p>
          </CardContent>
        </Card>

        {regimeRows.length > 0 ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Regime-by-regime Sharpe</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="text-xs">
                    <TableHead>Regime</TableHead>
                    <TableHead className="text-right">Champion</TableHead>
                    <TableHead className="text-right">Challenger</TableHead>
                    <TableHead className="text-right">Δ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {regimeRows.map((r) => (
                    <TableRow key={r.regime} className="text-xs">
                      <TableCell className="font-medium">{r.regime}</TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {fmtNum(r.champSharpe)}
                      </TableCell>
                      <TableCell className="text-right font-mono">{fmtNum(r.challSharpe)}</TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-mono",
                          r.delta >= 0 ? "text-emerald-400/90" : "text-rose-400/90",
                        )}
                      >
                        {r.delta >= 0 ? "+" : ""}
                        {fmtNum(r.delta)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="size-4 text-cyan-400" />
                Regime lens
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              No aligned champion/challenger regime series: add matching regimePerformance on both sides for a
              head-to-head matrix.
            </CardContent>
          </Card>
        )}

        <PromoteWorkflowActions
          strategyId={strategy.id}
          strategyName={strategy.name}
          stage="champion"
          currentStage={strategy.currentStage}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="font-semibold">Champion vs Challenger: {strategy.name}</h3>
          <p className="text-sm text-muted-foreground">No production champion: benchmark & portfolio fit</p>
        </div>
        <Badge variant="outline" className="text-xs border-slate-500/40 text-slate-400">
          No champion
        </Badge>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="size-4" />
            Benchmark comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="text-xs">
                <TableHead>Benchmark</TableHead>
                <TableHead className="text-right">Sharpe</TableHead>
                <TableHead className="text-right">Return</TableHead>
                <TableHead className="text-right">Max DD</TableHead>
                <TableHead className="text-right">vs Candidate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {BENCHMARKS.map((b) => (
                <TableRow key={b.name} className="text-xs">
                  <TableCell>{b.name}</TableCell>
                  <TableCell className="text-right font-mono">{b.sharpe}</TableCell>
                  <TableCell className="text-right font-mono text-emerald-400/90">{b.ret}</TableCell>
                  <TableCell className="text-right font-mono text-rose-400/90">{b.dd}</TableCell>
                  <TableCell className="text-right font-mono text-cyan-400">
                    ΔSharpe {fmtNum(m.sharpe - b.sharpe, 2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Portfolio fit</CardTitle>
        </CardHeader>
        <CardContent className="text-xs space-y-2 text-muted-foreground">
          <p>
            Correlation to existing book{" "}
            <span className="font-mono text-foreground">{fmtNum(strategy.riskProfile.correlationToPortfolio)}</span> :{" "}
            {strategy.riskProfile.correlationToPortfolio < 0.3
              ? "strong diversifier slot."
              : "overlap with existing factors; size conservatively."}
          </p>
          <p>Liquidity score {strategy.riskProfile.liquidityScore} supports target ramp if execution gates clear.</p>
        </CardContent>
      </Card>

      <PromoteWorkflowActions
        strategyId={strategy.id}
        strategyName={strategy.name}
        stage="champion"
        currentStage={strategy.currentStage}
      />
    </div>
  );
}
