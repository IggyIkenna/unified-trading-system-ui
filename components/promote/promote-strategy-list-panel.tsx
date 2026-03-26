"use client";

import * as React from "react";
import { ChevronRight, Filter, List } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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

const STAGE_CHIP_SHORT: Record<PromotionStage, string> = {
  data_validation: "Data",
  model_assessment: "Model",
  risk_stress: "Risk",
  execution_readiness: "Exec",
  paper_trading: "Paper",
  governance: "Gov",
};

export function PromoteStrategyListPanel({
  onStrategySelect,
  className,
}: {
  /** e.g. close mobile sheet after picking a strategy */
  onStrategySelect?: () => void;
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
    assetClasses,
    archetypes,
  } = usePromoteListFilters();

  const selectedId = usePromoteLifecycleStore((s) => s.selectedId);
  const setSelectedId = usePromoteLifecycleStore((s) => s.setSelectedId);

  const selectStrategy = (id: string) => {
    setSelectedId(id);
    onStrategySelect?.();
  };

  return (
    <div
      className={cn(
        "flex flex-col min-h-0 h-full max-h-full border-border",
        className,
      )}
    >
      <div className="shrink-0 p-3 space-y-3 border-b border-border bg-card/40">
        <div className="flex items-center gap-2 text-muted-foreground">
          <List className="size-4 shrink-0" />
          <span className="text-xs font-medium uppercase tracking-wide">
            Strategies
          </span>
          <span className="text-xs font-mono text-foreground/80">
            {filtered.length}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Button
            type="button"
            variant={stageFilter === "all" ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs px-2"
            onClick={() => setStageFilter("all")}
          >
            All
          </Button>
          {STAGE_ORDER.map((stage) => (
            <Button
              key={stage}
              type="button"
              variant={stageFilter === stage ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs px-2"
              onClick={() => setStageFilter(stage)}
            >
              {STAGE_CHIP_SHORT[stage]}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-2">
          <select
            className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs font-mono"
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
            className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs font-mono"
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

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 w-full text-xs">
              <Filter className="size-3.5 mr-1.5" />
              More filters
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72" align="start">
            <div className="space-y-3">
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
                  <Label className="text-xs text-muted-foreground">From</Label>
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

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-2 space-y-2 pb-4">
          {filtered.map((c) => {
            const progress = getOverallProgress(c);
            const sla = promoteSlaBadge(c);
            const stageMeta = STAGE_META[c.currentStage];
            const active = selectedId === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => selectStrategy(c.id)}
                className={cn(
                  "w-full text-left rounded-lg border border-border p-3 transition-colors",
                  "hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active &&
                    "bg-primary/5 border-l-2 border-l-primary pl-[calc(0.75rem-2px)]",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-semibold text-sm truncate">
                        {c.name}
                      </span>
                      <span className="text-xs font-mono text-muted-foreground shrink-0">
                        v{c.version}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {c.archetype} · {c.assetClass}
                    </p>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 min-w-0 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary/80 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground shrink-0 w-9 text-right">
                    {Math.round(progress)}%
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      c.stages[c.currentStage].status === "passed" &&
                        "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
                      c.stages[c.currentStage].status === "pending" &&
                        "bg-amber-500/15 text-amber-400 border-amber-500/30",
                      c.stages[c.currentStage].status === "failed" &&
                        "bg-rose-500/15 text-rose-400 border-rose-500/30",
                    )}
                  >
                    {stageMeta.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">
                    {c.daysInCurrentStage ?? "—"}d / {c.slaDaysExpected ?? "—"}d
                  </span>
                  <Badge
                    variant="outline"
                    className={cn("text-xs", sla.className)}
                  >
                    {sla.label}
                  </Badge>
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8 px-2">
              No strategies match filters.
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
