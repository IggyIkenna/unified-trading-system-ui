"use client";

import * as React from "react";
import { Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { usePromoteListFilters } from "@/components/promote/promote-list-filters-context";
import {
  getOverallProgress,
  promoteSlaBadge,
} from "@/components/promote/helpers";
import { STAGE_META } from "@/components/promote/stage-meta";
import type { PromotionStage } from "@/components/promote/types";
import { STAGE_ORDER } from "@/components/promote/types";
import { usePromoteLifecycleStore } from "@/lib/stores/promote-lifecycle-store";

/** ML Training–style chip hues (active / inactive), aligned to promotion stages. */
const STAGE_FILTER_CHIP: Record<
  "all" | PromotionStage,
  { active: string; inactive: string }
> = {
  all: {
    active:
      "border-primary bg-primary text-primary-foreground hover:bg-primary/90",
    inactive:
      "border-zinc-500/60 bg-zinc-900/90 text-zinc-100 hover:border-zinc-400 hover:bg-zinc-800 hover:text-white dark:border-zinc-600 dark:bg-zinc-950/90",
  },
  data_validation: {
    active:
      "border-slate-500 bg-slate-600 text-white shadow-sm hover:bg-slate-600/90",
    inactive:
      "border-slate-500/45 bg-slate-950/60 text-slate-100 hover:border-slate-400/70 hover:bg-slate-900/70 hover:text-white",
  },
  model_assessment: {
    active:
      "border-blue-500 bg-blue-600 text-white shadow-sm hover:bg-blue-600/90",
    inactive:
      "border-blue-500/45 bg-blue-950/60 text-blue-100 hover:border-blue-400/70 hover:bg-blue-900/70 hover:text-white",
  },
  risk_stress: {
    active:
      "border-amber-500 bg-amber-500 text-zinc-950 shadow-sm hover:bg-amber-500/90",
    inactive:
      "border-amber-500/45 bg-amber-950/50 text-amber-100 hover:border-amber-400/60 hover:bg-amber-950/80 hover:text-amber-50",
  },
  execution_readiness: {
    active:
      "border-cyan-500 bg-cyan-600 text-white shadow-sm hover:bg-cyan-600/90",
    inactive:
      "border-cyan-500/45 bg-cyan-950/55 text-cyan-100 hover:border-cyan-400/60 hover:bg-cyan-900/60 hover:text-white",
  },
  paper_trading: {
    active:
      "border-violet-500 bg-violet-600 text-white shadow-sm hover:bg-violet-600/90",
    inactive:
      "border-violet-500/45 bg-violet-950/55 text-violet-100 hover:border-violet-400/60 hover:bg-violet-900/60 hover:text-white",
  },
  governance: {
    active:
      "border-emerald-500 bg-emerald-600 text-white shadow-sm hover:bg-emerald-600/90",
    inactive:
      "border-emerald-500/45 bg-emerald-950/55 text-emerald-100 hover:border-emerald-400/60 hover:bg-emerald-900/60 hover:text-white",
  },
};

const STAGE_CHIP_SHORT: Record<PromotionStage, string> = {
  data_validation: "Data",
  model_assessment: "Model",
  risk_stress: "Risk",
  execution_readiness: "Exec",
  paper_trading: "Paper",
  governance: "Gov",
};

export function PromoteStrategyListPanel({
  className,
}: {
  className?: string;
}) {
  const {
    asset,
    setAsset,
    archetype,
    setArchetype,
    stageFilter,
    setStageFilter,
    submitterQ,
    setSubmitterQ,
    submittedFrom,
    setSubmittedFrom,
    submittedTo,
    setSubmittedTo,
    filtered,
    cohortWithoutStageFilter,
    assetClasses,
    archetypes,
  } = usePromoteListFilters();

  const selectedId = usePromoteLifecycleStore((s) => s.selectedId);
  const setSelectedId = usePromoteLifecycleStore((s) => s.setSelectedId);

  const chipItems = React.useMemo(() => {
    const rows: {
      key: "all" | PromotionStage;
      label: string;
      count: number;
    }[] = [
      { key: "all", label: "All", count: cohortWithoutStageFilter.length },
      ...STAGE_ORDER.map((stage) => ({
        key: stage,
        label: STAGE_CHIP_SHORT[stage],
        count: cohortWithoutStageFilter.filter((c) => c.currentStage === stage)
          .length,
      })),
    ];
    return rows;
  }, [cohortWithoutStageFilter]);

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <div className="flex shrink-0 flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
        <div className="grid min-w-0 flex-1 grid-cols-2 gap-2 min-[480px]:grid-cols-3 xl:grid-cols-4">
          {chipItems.map(({ key, label, count }) => {
            const chip = STAGE_FILTER_CHIP[key];
            const selected = stageFilter === key;
            return (
              <Button
                key={key}
                type="button"
                variant="ghost"
                className={cn(
                  "h-11 justify-center border px-2 text-sm font-medium shadow-none sm:px-3",
                  selected ? chip.active : chip.inactive,
                )}
                onClick={() => setStageFilter(key)}
              >
                <span className="truncate">{label}</span>
                {count > 0 && (
                  <span className="ml-1 tabular-nums text-xs opacity-90">
                    ({count})
                  </span>
                )}
              </Button>
            );
          })}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 lg:pt-0.5">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                type="button"
                size="icon"
                className="size-11 shrink-0"
                aria-label="More filters"
                title="More filters"
              >
                <Filter className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72" align="end">
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Asset class
                  </Label>
                  <select
                    className="mt-1 h-9 w-full rounded-md border border-border bg-background px-2 text-xs font-mono"
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
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Archetype
                  </Label>
                  <select
                    className="mt-1 h-9 w-full rounded-md border border-border bg-background px-2 text-xs font-mono"
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
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Submitter
                  </Label>
                  <Input
                    className="mt-1 h-8 text-xs font-mono"
                    placeholder="Name…"
                    value={submitterQ}
                    onChange={(e) => setSubmitterQ(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      From
                    </Label>
                    <Input
                      type="date"
                      className="mt-1 h-8 text-xs font-mono"
                      value={submittedFrom}
                      onChange={(e) => setSubmittedFrom(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">To</Label>
                    <Input
                      type="date"
                      className="mt-1 h-8 text-xs font-mono"
                      value={submittedTo}
                      onChange={(e) => setSubmittedTo(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <ScrollArea className="h-[min(60vh,calc(100vh-280px))] lg:h-[calc(100vh-220px)]">
        <div className="space-y-2 pr-2 pt-1">
          {filtered.map((c) => {
            const progress = getOverallProgress(c);
            const sla = promoteSlaBadge(c);
            const stageMeta = STAGE_META[c.currentStage];
            const active = selectedId === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedId(c.id)}
                className={cn(
                  "w-full cursor-pointer rounded-lg border p-3 text-left transition-colors",
                  active
                    ? "border-primary bg-primary/5"
                    : "border-border/50 hover:bg-muted/30",
                )}
              >
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="truncate pr-2 text-sm font-medium">
                    {c.name}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "shrink-0 text-xs",
                      c.stages[c.currentStage].status === "passed" &&
                        "border-emerald-500/30 bg-emerald-500/15 text-emerald-400",
                      c.stages[c.currentStage].status === "pending" &&
                        "border-amber-500/30 bg-amber-500/15 text-amber-400",
                      c.stages[c.currentStage].status === "failed" &&
                        "border-red-500/30 bg-red-500/15 text-red-400",
                    )}
                  >
                    {stageMeta.label}
                  </Badge>
                </div>
                <p className="mb-2 text-[11px] text-muted-foreground">
                  {c.archetype} · {c.assetClass}{" "}
                  <span className="font-mono text-muted-foreground/90">
                    v{c.version}
                  </span>
                </p>
                <div className="flex items-center gap-2">
                  <Progress value={progress} className="mb-0 h-1.5 flex-1" />
                  <span className="w-9 shrink-0 text-right font-mono text-[10px] text-muted-foreground">
                    {Math.round(progress)}%
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="font-mono">
                    {c.daysInCurrentStage ?? "—"}d / {c.slaDaysExpected ?? "—"}d
                    SLA
                  </span>
                  <Badge
                    variant="outline"
                    className={cn("text-[10px]", sla.className)}
                  >
                    {sla.label}
                  </Badge>
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="px-1 py-8 text-center text-xs text-muted-foreground">
              No strategies match filters.
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
