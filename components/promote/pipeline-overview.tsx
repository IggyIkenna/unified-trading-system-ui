"use client";

import * as React from "react";
import { AlertTriangle, ChevronRight, Filter, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { HISTORICAL_APPROVALS_30D } from "./mock-fixtures";
import { fmtNum, fmtPct, getOverallProgress, statusBg } from "./helpers";
import { PromoteWorkflowActions } from "./promote-workflow-actions";
import { STAGE_META } from "./stage-meta";
import type { CandidateStrategy, PromotionStage } from "./types";
import { STAGE_ORDER } from "./types";

function stagePassed(c: CandidateStrategy, s: PromotionStage) {
  return c.stages[s].status === "passed";
}

function slaBadge(c: CandidateStrategy) {
  const d = c.daysInCurrentStage ?? 0;
  const lim = c.slaDaysExpected ?? 7;
  if (d > lim) return { label: "Breach", className: statusBg("failed") };
  if (d >= lim - 1) return { label: "At risk", className: statusBg("warning") };
  return { label: "On track", className: statusBg("passed") };
}

export function PipelineOverview({
  candidates,
  selectedId,
  onSelect,
}: {
  candidates: CandidateStrategy[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [asset, setAsset] = React.useState<string>("all");
  const [archetype, setArchetype] = React.useState<string>("all");
  const [stageFilter, setStageFilter] = React.useState<string>("all");
  const [submitterQ, setSubmitterQ] = React.useState("");
  const [submittedFrom, setSubmittedFrom] = React.useState("");
  const [submittedTo, setSubmittedTo] = React.useState("");

  const assetClasses = React.useMemo(
    () => ["all", ...new Set(candidates.map((c) => c.assetClass))],
    [candidates],
  );
  const archetypes = React.useMemo(
    () => ["all", ...new Set(candidates.map((c) => c.archetype))].sort(),
    [candidates],
  );

  const pipelineDerived = React.useMemo(() => {
    const n = candidates.length || 1;
    const conversion = {} as Record<PromotionStage, number>;
    STAGE_ORDER.forEach((stage, idx) => {
      const denom =
        idx === 0
          ? n
          : candidates.filter((c) => stagePassed(c, STAGE_ORDER[idx - 1]!))
              .length;
      const num = candidates.filter((c) => stagePassed(c, stage)).length;
      conversion[stage] = denom > 0 ? Math.round((num / denom) * 100) : 0;
    });
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
    return { conversion, avgDwell, velocityDays };
  }, [candidates]);

  const filtered = React.useMemo(() => {
    const fromMs = submittedFrom ? new Date(submittedFrom).getTime() : null;
    const toMs = submittedTo
      ? new Date(submittedTo).getTime() + 86_400_000 - 1
      : null;
    return candidates.filter((c) => {
      if (asset !== "all" && c.assetClass !== asset) return false;
      if (archetype !== "all" && c.archetype !== archetype) return false;
      if (stageFilter !== "all" && c.currentStage !== stageFilter) return false;
      if (
        submitterQ.trim() &&
        !c.submittedBy.toLowerCase().includes(submitterQ.trim().toLowerCase())
      )
        return false;
      const sub = new Date(c.submittedAt).getTime();
      if (fromMs !== null && !Number.isNaN(fromMs) && sub < fromMs)
        return false;
      if (toMs !== null && !Number.isNaN(toMs) && sub > toMs) return false;
      return true;
    });
  }, [
    candidates,
    asset,
    archetype,
    stageFilter,
    submitterQ,
    submittedFrom,
    submittedTo,
  ]);

  const pipelineCounts = STAGE_ORDER.map((stage) => ({
    stage,
    count: filtered.filter((c) => c.currentStage === stage).length,
    ...STAGE_META[stage],
  }));

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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {pipelineCounts.map((p, idx) => {
          const Icon = p.icon;
          return (
            <Card key={p.stage} className="relative overflow-hidden">
              <CardContent className="pt-4 pb-3 px-3 sm:px-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="size-4 text-muted-foreground shrink-0" />
                  <span className="text-[11px] sm:text-xs font-medium leading-tight">
                    {p.label}
                  </span>
                </div>
                <div className="text-2xl font-bold font-mono">{p.count}</div>
                <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
                  {p.description}
                </p>
                <div className="mt-2 flex items-center justify-between text-[9px] font-mono text-muted-foreground">
                  <span>Conv</span>
                  <span className="text-cyan-400/90">
                    {pipelineDerived.conversion[p.stage]}%
                  </span>
                </div>
                {idx < pipelineCounts.length - 1 && (
                  <ChevronRight className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 size-4 text-muted-foreground/30 z-10" />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              In Pipeline (view)
            </p>
            <p className="text-2xl font-bold font-mono mt-1">
              {filtered.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Avg Sharpe
            </p>
            <p className="text-2xl font-bold font-mono mt-1">
              {fmtNum(
                filtered.reduce((s, c) => s + c.metrics.sharpe, 0) /
                  (filtered.length || 1),
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Avg stage dwell (cohort)
            </p>
            <p className="text-2xl font-bold font-mono mt-1 text-cyan-400">
              {fmtNum(pipelineDerived.avgDwell, 1)}d
            </p>
            <p className="text-[9px] text-muted-foreground mt-1">
              From daysInCurrentStage in mock data
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Velocity (model / risk stage)
            </p>
            <p className="text-2xl font-bold font-mono mt-1">
              {fmtNum(pipelineDerived.velocityDays, 1)}d
            </p>
            <p className="text-[9px] text-muted-foreground mt-1">
              Mean dwell when current stage is model or risk
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Approved (30d)
            </p>
            <p className="text-2xl font-bold font-mono mt-1 text-emerald-400">
              {totalPassed + HISTORICAL_APPROVALS_30D}
            </p>
          </CardContent>
        </Card>
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
        <CardHeader className="pb-2 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="size-4" />
              Promotion Queue
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Filter className="size-3.5" />
                <span className="text-[10px] uppercase tracking-wide">
                  Filters
                </span>
              </div>
              <select
                className="h-8 rounded-md border border-border bg-background px-2 text-[10px] font-mono"
                value={asset}
                onChange={(e) => setAsset(e.target.value)}
                aria-label="Asset class"
              >
                {assetClasses.map((a) => (
                  <option key={a} value={a}>
                    {a === "all" ? "All asset classes" : a}
                  </option>
                ))}
              </select>
              <select
                className="h-8 rounded-md border border-border bg-background px-2 text-[10px] font-mono max-w-[160px]"
                value={archetype}
                onChange={(e) => setArchetype(e.target.value)}
                aria-label="Archetype"
              >
                {archetypes.map((a) => (
                  <option key={a} value={a}>
                    {a === "all" ? "All archetypes" : a}
                  </option>
                ))}
              </select>
              <select
                className="h-8 rounded-md border border-border bg-background px-2 text-[10px] font-mono"
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                aria-label="Stage"
              >
                <option value="all">All stages</option>
                {STAGE_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {STAGE_META[s].label}
                  </option>
                ))}
              </select>
              <Input
                placeholder="Submitter…"
                value={submitterQ}
                onChange={(e) => setSubmitterQ(e.target.value)}
                className="h-8 w-[140px] text-[10px] font-mono"
              />
              <Input
                type="date"
                value={submittedFrom}
                onChange={(e) => setSubmittedFrom(e.target.value)}
                className="h-8 w-[128px] text-[10px] font-mono"
                aria-label="Submitted from"
              />
              <Input
                type="date"
                value={submittedTo}
                onChange={(e) => setSubmittedTo(e.target.value)}
                className="h-8 w-[128px] text-[10px] font-mono"
                aria-label="Submitted to"
              />
            </div>
          </div>
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
                const sla = slaBadge(c);
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
                        <span className="text-muted-foreground ml-2 font-mono text-[10px]">
                          v{c.version}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {c.archetype}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
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
                          "text-[10px]",
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
                          className={cn("text-[9px]", sla.className)}
                        >
                          {sla.label}
                        </Badge>
                        <p className="text-[9px] font-mono text-muted-foreground">
                          {c.daysInCurrentStage ?? "—"}d /{" "}
                          {c.slaDaysExpected ?? "—"}d
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-[100px]">
                        <Progress value={progress} className="h-1.5 flex-1" />
                        <span className="text-[10px] text-muted-foreground font-mono">
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
                        className="h-6 px-2 text-[10px]"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(c.id);
                        }}
                      >
                        Review <ChevronRight className="size-3 ml-1" />
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
        <p className="text-[10px] text-muted-foreground text-center">
          Select a strategy to enable stage actions
        </p>
      )}
    </div>
  );
}
