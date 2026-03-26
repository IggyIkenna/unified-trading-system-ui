import { Activity, TestTube } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { fmtNum, fmtPct, fmtUsd, statusBg } from "./helpers";
import { PromoteWorkflowActions } from "./promote-workflow-actions";
import type { CandidateStrategy } from "./types";

export function PaperTradingTab({ strategy }: { strategy: CandidateStrategy }) {
  const pt = strategy.paperTrading;

  if (!pt) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="font-semibold">Paper Trading — {strategy.name}</h3>
          <p className="text-sm text-muted-foreground">
            Shadow book not scheduled for this candidate
          </p>
        </div>
        <div className="rounded-lg border border-slate-500/30 bg-slate-500/5 p-8 text-center text-sm text-muted-foreground">
          <TestTube className="size-8 mx-auto mb-2 opacity-40 text-slate-400" />
          No paper trading run — stage will unlock when shadow period is
          scheduled.
        </div>
        <PromoteWorkflowActions
          strategyId={strategy.id}
          strategyName={strategy.name}
          stage="paper_trading"
          currentStage={strategy.currentStage}
        />
      </div>
    );
  }

  const progress = Math.min(
    100,
    (pt.daysCompleted / Math.max(pt.daysRequired, 1)) * 100,
  );
  const divOk = pt.divergenceRatio >= 0.7;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="font-semibold text-cyan-400/90">
            Paper Trading — {strategy.name}
          </h3>
          <p className="text-sm text-muted-foreground">
            Shadow mode · simulated fills · live data
          </p>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "text-xs capitalize",
            pt.status === "completed" && statusBg("passed"),
            pt.status === "running" && "border-cyan-500/40 text-cyan-400",
            pt.status === "failed" && statusBg("failed"),
          )}
        >
          {pt.status === "running"
            ? "Running"
            : pt.status === "completed"
              ? "Completed"
              : "Failed"}
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs uppercase text-muted-foreground">
              Shadow P&amp;L
            </p>
            <p
              className={cn(
                "text-xl font-mono font-bold mt-1",
                pt.pnl >= 0 ? "text-emerald-400" : "text-rose-400",
              )}
            >
              {fmtUsd(pt.pnl)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs uppercase text-muted-foreground">
              Paper Sharpe
            </p>
            <p className="text-xl font-mono font-bold mt-1 text-cyan-400">
              {fmtNum(pt.sharpe)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs uppercase text-muted-foreground">
              Backtest Sharpe (same window)
            </p>
            <p className="text-xl font-mono font-bold mt-1">
              {fmtNum(pt.backtestSharpeForPeriod)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs uppercase text-muted-foreground">
              Divergence ratio
            </p>
            <p
              className={cn(
                "text-xl font-mono font-bold mt-1",
                divOk ? "text-emerald-400" : "text-amber-400",
              )}
            >
              {fmtNum(pt.divergenceRatio)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="size-4" />
            Progress vs required duration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-xs font-mono text-muted-foreground">
            {pt.daysCompleted} / {pt.daysRequired} sessions · started{" "}
            {pt.startDate}
            {pt.endDate ? ` · ended ${pt.endDate}` : ""}
          </p>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Execution simulation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fill rate</span>
              <span>{fmtNum(pt.fillRate, 1)}%</span>
            </div>
            {pt.partialFillRate !== undefined ? (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Partial fill rate</span>
                <span>{fmtNum(pt.partialFillRate, 1)}%</span>
              </div>
            ) : null}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg slippage</span>
              <span>{pt.avgSlippageBps} bps</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Latency impact</span>
              <span className="text-cyan-400">{pt.latencyImpactBps} bps</span>
            </div>
            {pt.queuePositionSummary ? (
              <p className="text-xs text-muted-foreground pt-1 border-t border-border/40">
                {pt.queuePositionSummary}
              </p>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Operational stability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Uptime</span>
              <span className="text-emerald-400">{fmtNum(pt.uptime, 2)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Errors</span>
              <span
                className={
                  pt.errorCount === 0 ? "text-emerald-400" : "text-amber-400"
                }
              >
                {pt.errorCount}
              </span>
            </div>
            {pt.feedInterruptions !== undefined ? (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Feed interruptions
                </span>
                <span>{pt.feedInterruptions}</span>
              </div>
            ) : null}
            {pt.recoveryTimeMinutes !== undefined ? (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Recovery (median min)
                </span>
                <span>{pt.recoveryTimeMinutes}</span>
              </div>
            ) : null}
            <Badge
              variant="outline"
              className={cn(
                "text-xs mt-2",
                divOk ? statusBg("passed") : statusBg("warning"),
              )}
            >
              {divOk
                ? "Divergence within tolerance"
                : "Excessive divergence — investigate"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {(pt.returnDivergencePct !== undefined ||
        pt.maxDdDivergencePct !== undefined ||
        pt.hitRateDivergencePct !== undefined) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              Backtest vs paper (path divergence)
            </CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-3 gap-3 text-xs font-mono">
            {pt.returnDivergencePct !== undefined ? (
              <div className="rounded-lg border border-border/50 p-3">
                <p className="text-xs text-muted-foreground">Return gap</p>
                <p className="text-lg mt-1">
                  {fmtNum(pt.returnDivergencePct, 1)}%
                </p>
              </div>
            ) : null}
            {pt.maxDdDivergencePct !== undefined ? (
              <div className="rounded-lg border border-border/50 p-3">
                <p className="text-xs text-muted-foreground">Max DD gap</p>
                <p className="text-lg mt-1">
                  {fmtNum(pt.maxDdDivergencePct, 1)}%
                </p>
              </div>
            ) : null}
            {pt.hitRateDivergencePct !== undefined ? (
              <div className="rounded-lg border border-border/50 p-3">
                <p className="text-xs text-muted-foreground">Hit rate gap</p>
                <p className="text-lg mt-1">
                  {fmtNum(pt.hitRateDivergencePct, 1)}%
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {pt.dailyPnlUsd && pt.dailyPnlUsd.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              Daily shadow P&amp;L (USD)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-0.5 h-24">
              {pt.dailyPnlUsd.map((v, i) => {
                const maxAbs = Math.max(
                  ...pt.dailyPnlUsd!.map((x) => Math.abs(x)),
                  1,
                );
                const h = Math.min(100, (Math.abs(v) / maxAbs) * 100);
                return (
                  <div
                    key={i}
                    className={cn(
                      "flex-1 min-w-0 rounded-t",
                      v >= 0 ? "bg-emerald-500/60" : "bg-rose-500/60",
                    )}
                    style={{ height: `${h}%` }}
                    title={`Day ${i + 1}: ${fmtUsd(v)}`}
                  />
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-2 font-mono">
              {pt.dailyPnlUsd.length} sessions shown
            </p>
          </CardContent>
        </Card>
      ) : null}

      <PromoteWorkflowActions
        strategyId={strategy.id}
        strategyName={strategy.name}
        stage="paper_trading"
        currentStage={strategy.currentStage}
      />
    </div>
  );
}
