import { Landmark, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { fmtNum, fmtPct, fmtUsd, statusBg } from "./helpers";
import { MetricCard } from "@/components/shared/metric-card";
import { PromoteWorkflowActions } from "./promote-workflow-actions";
import type { CandidateStrategy } from "./types";

export function CapitalAllocationTab({ strategy }: { strategy: CandidateStrategy }) {
  const c = strategy.capitalAllocation;

  if (!c) {
    return (
      <div className="space-y-6">
        <h3 className="font-semibold">Capital Allocation: {strategy.name}</h3>
        <p className="text-sm text-muted-foreground">No sizing proposal attached</p>
        <PromoteWorkflowActions
          strategyId={strategy.id}
          strategyName={strategy.name}
          stage="capital_allocation"
          currentStage={strategy.currentStage}
        />
      </div>
    );
  }

  const weeks = c.rampWeeks;
  const ramp = Array.from({ length: weeks }, (_, i) => Math.round(((i + 1) / weeks) * 100));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold">Capital Allocation: {strategy.name}</h3>
        <p className="text-sm text-muted-foreground">Sizing, ramp, risk budget, and limits</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard
          tone="panel"
          density="panel"
          label="Target ($)"
          primary={fmtUsd(c.proposedUsd)}
          secondary={
            c.conservativeSizingUsd !== undefined ? `Conservative ${fmtUsd(c.conservativeSizingUsd)}` : undefined
          }
          secondaryClassName="font-mono"
        />
        <MetricCard tone="panel" density="panel" label="% AUM" primary={`${fmtNum(c.proposedPctAum, 1)}%`} />
        <MetricCard
          tone="panel"
          density="panel"
          label="Kelly (optimal)"
          primary={fmtPct(c.kellyOptimal)}
          primaryClassName="text-cyan-400"
          secondary={c.halfKelly !== undefined ? `Half-Kelly ${fmtPct(c.halfKelly)}` : undefined}
          secondaryClassName="font-mono"
        />
        <MetricCard tone="panel" density="panel" label="Risk parity wt" primary={fmtPct(c.riskParityWeight)} />
      </div>

      {c.rampGateChecks && c.rampGateChecks.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Ramp gate checklist</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead>Week</TableHead>
                  <TableHead>Check</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {c.rampGateChecks.map((g) => (
                  <TableRow key={g.week} className="text-xs">
                    <TableCell className="font-mono">{g.week}</TableCell>
                    <TableCell>{g.label}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className={cn("text-xs", statusBg(g.status))}>
                        {g.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      {c.marginByVenue && c.marginByVenue.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Margin by venue</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead>Venue</TableHead>
                  <TableHead>Initial</TableHead>
                  <TableHead>Maintenance</TableHead>
                  <TableHead className="text-right">Util %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {c.marginByVenue.map((m) => (
                  <TableRow key={m.venue} className="text-xs font-mono">
                    <TableCell>{m.venue}</TableCell>
                    <TableCell>{m.initialUsd}</TableCell>
                    <TableCell>{m.maintenanceUsd}</TableCell>
                    <TableCell className="text-right">{m.utilizationPct}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="size-4 text-cyan-400" />
            Ramp schedule ({c.rampWeeks} weeks)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            {ramp.map((pct, i) => (
              <div key={`w-${i + 1}`} className="flex-1 min-w-[52px] space-y-1">
                <p className="text-xs text-center text-muted-foreground">W{i + 1}</p>
                <Progress value={pct} className="h-2" />
                <p className="text-center text-xs font-mono">{pct}%</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground font-mono">
            CIO cap {fmtUsd(c.cioMaxCap)} · halt if weekly loss &gt; 2× vol budget
          </p>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Landmark className="size-4" />
              Risk budget
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs font-mono space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">VaR budget</span>
              <span>{fmtNum(c.varBudgetPct, 1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Marginal VaR</span>
              <span>{fmtNum(c.marginalVar, 4)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Stress loss budget</span>
              <span>{fmtUsd(c.stressLossBudget)}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Position &amp; margin limits</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-2">
            <p>Per-instrument notional capped at 12% of sleeve NAV.</p>
            <p>Venue concentration ≤ 35% · asset-class sleeve ≤ policy matrix.</p>
            <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-400">
              Margin headroom 18% vs house minimum
            </Badge>
          </CardContent>
        </Card>
      </div>

      <PromoteWorkflowActions
        strategyId={strategy.id}
        strategyName={strategy.name}
        stage="capital_allocation"
        currentStage={strategy.currentStage}
      />
    </div>
  );
}
