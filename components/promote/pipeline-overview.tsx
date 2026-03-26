"use client";

import * as React from "react";
import { AlertTriangle, ChevronRight, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { usePromoteListFilters } from "@/components/promote/promote-list-filters-context";
import { HISTORICAL_APPROVALS_30D } from "./mock-fixtures";
import {
  fmtNum,
  fmtPct,
  getOverallProgress,
  promoteSlaBadge,
  statusBg,
} from "./helpers";
import { PromoteWorkflowActions } from "./promote-workflow-actions";
import { STAGE_META } from "./stage-meta";
import type { CandidateStrategy } from "./types";

export function PipelineOverview({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { filtered, candidates } = usePromoteListFilters();

  const pipelineDerived = React.useMemo(() => {
    const dwells = candidates.map((c) => c.daysInCurrentStage ?? 0);
    const avgDwell = dwells.length
      ? dwells.reduce((a, b) => a + b, 0) / dwells.length
      : 0;
    const modelRisk = candidates.filter(
      (c) =>
        c.currentStage === "model_assessment" ||
        c.currentStage === "risk_stress",
    );
    const velocityDays = modelRisk.length
      ? modelRisk.reduce((s, c) => s + (c.daysInCurrentStage ?? 0), 0) /
        modelRisk.length
      : avgDwell;
    return { avgDwell, velocityDays };
  }, [candidates]);

  const avgMaxDrawdown =
    filtered.length === 0
      ? 0
      : filtered.reduce((s, c) => s + c.metrics.maxDrawdown, 0) /
        filtered.length;

  const totalPassed = candidates.filter(
    (c) => c.stages.governance.status === "passed",
  ).length;
  const slaBreaches = candidates.filter((c) => {
    const d = c.daysInCurrentStage ?? 0;
    const lim = c.slaDaysExpected ?? 999;
    return d > lim;
  }).length;

  const selectedStrategy = selectedId
    ? candidates.find((c) => c.id === selectedId)
    : undefined;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-0 rounded-lg border border-border bg-card/30 p-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="border-l-2 border-cyan-500/20 px-2 py-2 text-center first:border-l-0">
          <p className="text-sm uppercase tracking-wider text-muted-foreground">
            Avg Sharpe
          </p>
          <p className="mt-1 font-mono text-2xl font-bold">
            {fmtNum(
              filtered.reduce((s, c) => s + c.metrics.sharpe, 0) /
                (filtered.length || 1),
            )}
          </p>
        </div>
        <div className="border-l-2 border-cyan-500/20 px-2 py-2 text-center">
          <p className="text-sm uppercase tracking-wider text-muted-foreground">
            Avg max DD
          </p>
          <p className="mt-1 font-mono text-2xl font-bold text-rose-400/90">
            {fmtPct(avgMaxDrawdown)}
          </p>
        </div>
        <div className="border-l-2 border-cyan-500/20 px-2 py-2 text-center">
          <p className="text-sm uppercase tracking-wider text-muted-foreground">
            Velocity
          </p>
          <p className="mt-1 font-mono text-2xl font-bold">
            {fmtNum(pipelineDerived.velocityDays, 1)}d
          </p>
        </div>
        <div className="border-l-2 border-cyan-500/20 px-2 py-2 text-center">
          <p className="text-sm uppercase tracking-wider text-muted-foreground">
            Approved 30d
          </p>
          <p className="mt-1 font-mono text-2xl font-bold text-emerald-400">
            {totalPassed + HISTORICAL_APPROVALS_30D}
          </p>
        </div>
        <div className="border-l-2 border-cyan-500/20 px-2 py-2 text-center">
          <p className="text-sm uppercase tracking-wider text-muted-foreground">
            In cohort
          </p>
          <p className="mt-1 font-mono text-2xl font-bold text-cyan-400/90">
            {filtered.length}
          </p>
        </div>
        <div className="border-l-2 border-cyan-500/20 px-2 py-2 text-center">
          <p className="text-sm uppercase tracking-wider text-muted-foreground">
            Past SLA
          </p>
          <p
            className={cn(
              "mt-1 font-mono text-2xl font-bold",
              slaBreaches > 0 ? "text-rose-400" : "text-muted-foreground",
            )}
          >
            {slaBreaches}
          </p>
        </div>
      </div>

      {slaBreaches > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs">
          <AlertTriangle className="size-4 text-rose-400 shrink-0" />
          <span>
            <span className="font-mono text-rose-400">{slaBreaches}</span>{" "}
            candidate(s) past SLA — escalation recommended
          </span>
        </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="size-4" />
            Promotion Queue
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Filter strategies from the left list; table shows the same cohort.
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="text-xs">
                <TableHead>Strategy</TableHead>
                <TableHead>Asset Class</TableHead>
                <TableHead>Sharpe</TableHead>
                <TableHead>Max DD</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>SLA</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => {
                const stageMeta = STAGE_META[c.currentStage];
                const progress = getOverallProgress(c);
                const sla = promoteSlaBadge(c);
                return (
                  <TableRow
                    key={c.id}
                    className={cn(
                      "text-xs cursor-pointer transition-colors",
                      selectedId === c.id && "bg-primary/5",
                    )}
                    onClick={() => onSelect(c.id)}
                  >
                    <TableCell>
                      <div>
                        <span className="font-medium">{c.name}</span>
                        <span className="text-muted-foreground ml-2 font-mono text-xs">
                          v{c.version}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {c.archetype}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {c.assetClass}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">
                      {fmtNum(c.metrics.sharpe)}
                    </TableCell>
                    <TableCell className="font-mono text-rose-400">
                      {fmtPct(c.metrics.maxDrawdown)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          statusBg(c.stages[c.currentStage].status),
                        )}
                      >
                        {stageMeta.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <Badge
                          variant="outline"
                          className={cn("text-xs", sla.className)}
                        >
                          {sla.label}
                        </Badge>
                        <p className="text-xs font-mono text-muted-foreground">
                          {c.daysInCurrentStage ?? "—"}d /{" "}
                          {c.slaDaysExpected ?? "—"}d
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-[100px]">
                        <Progress value={progress} className="h-1.5 flex-1" />
                        <span className="text-xs text-muted-foreground font-mono">
                          {Math.round(progress)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(c.submittedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(c.id);
                        }}
                      >
                        Select <ChevronRight className="size-3 ml-1" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedStrategy ? (
        <PromoteWorkflowActions
          strategyId={selectedStrategy.id}
          strategyName={selectedStrategy.name}
          stage={selectedStrategy.currentStage}
          currentStage={selectedStrategy.currentStage}
        />
      ) : (
        <p className="text-xs text-muted-foreground text-center">
          Select a strategy in the list or table to enable stage actions
        </p>
      )}
    </div>
  );
}
