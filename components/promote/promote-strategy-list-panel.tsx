"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePromoteListFilters } from "@/components/promote/promote-list-filters-context";
import {
  getOverallProgress,
  promoteSlaBadge,
} from "@/components/promote/helpers";
import { STAGE_META } from "@/components/promote/stage-meta";
import { STAGE_ORDER } from "@/components/promote/types";
import { usePromoteLifecycleStore } from "@/lib/stores/promote-lifecycle-store";
import { cn } from "@/lib/utils";

const FILTER_SELECT =
  "mt-0.5 h-7 w-full min-w-0 rounded-md border border-border bg-background px-2 text-[11px] font-mono";

const PAGE_SIZE_OPTIONS = [10, 15, 25, 50] as const;

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
    paginatedList,
    cohortWithoutStageFilter,
    assetClasses,
    archetypes,
    listPage,
    setListPage,
    listTotalPages,
    pageSize,
    setPageSize,
  } = usePromoteListFilters();

  const selectedId = usePromoteLifecycleStore((s) => s.selectedId);
  const setSelectedId = usePromoteLifecycleStore((s) => s.setSelectedId);

  const stageOptions = React.useMemo(() => {
    const rows: { value: string; label: string }[] = [
      {
        value: "all",
        label: `All (${cohortWithoutStageFilter.length})`,
      },
      ...STAGE_ORDER.map((stage) => {
        const count = cohortWithoutStageFilter.filter(
          (c) => c.currentStage === stage,
        ).length;
        return {
          value: stage,
          label: `${STAGE_META[stage].label} (${count})`,
        };
      }),
    ];
    return rows;
  }, [cohortWithoutStageFilter]);

  return (
    <div className={cn("flex h-full min-h-0 flex-col gap-2", className)}>
      <div
        className={cn(
          "z-10 shrink-0 space-y-2 rounded-lg border border-border/50 bg-background/95 p-2 shadow-sm",
          "backdrop-blur supports-[backdrop-filter]:bg-background/85",
          "lg:sticky lg:top-2",
        )}
      >
        <div className="grid w-full grid-cols-1 gap-x-2 gap-y-2 sm:grid-cols-[minmax(0,3fr)_minmax(0,3fr)_minmax(0,3fr)_minmax(0,1fr)]">
          {/* Row 1: stage | asset | archetype | prev/next */}
          <div className="min-w-0">
            <Label
              htmlFor="promote-stage-filter"
              className="text-[10px] uppercase tracking-wide text-muted-foreground"
            >
              Stage
            </Label>
            <select
              id="promote-stage-filter"
              className={FILTER_SELECT}
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              aria-label="Filter by stage"
            >
              {stageOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-0">
            <Label
              htmlFor="promote-asset-filter"
              className="text-[10px] uppercase tracking-wide text-muted-foreground"
            >
              Asset class
            </Label>
            <select
              id="promote-asset-filter"
              className={FILTER_SELECT}
              value={asset}
              onChange={(e) => setAsset(e.target.value)}
              aria-label="Asset class"
            >
              {assetClasses.map((a) => (
                <option key={a} value={a}>
                  {a === "all" ? "All" : a}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-0">
            <Label
              htmlFor="promote-archetype-filter"
              className="text-[10px] uppercase tracking-wide text-muted-foreground"
            >
              Archetype
            </Label>
            <select
              id="promote-archetype-filter"
              className={FILTER_SELECT}
              value={archetype}
              onChange={(e) => setArchetype(e.target.value)}
              aria-label="Archetype"
            >
              {archetypes.map((a) => (
                <option key={a} value={a}>
                  {a === "all" ? "All" : a}
                </option>
              ))}
            </select>
          </div>
          <div className="flex min-w-0 flex-col justify-end">
            <span
              className="text-[10px] uppercase leading-none tracking-wide text-transparent select-none"
              aria-hidden
            >
              ·
            </span>
            <div className="mt-0.5 flex h-7 items-center justify-center gap-0.5">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-7 w-7 shrink-0"
                disabled={listPage <= 1}
                onClick={() => setListPage((p) => Math.max(1, p - 1))}
                aria-label="Previous page"
              >
                <ChevronLeft className="size-3.5" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-7 w-7 shrink-0"
                disabled={listPage >= listTotalPages}
                onClick={() =>
                  setListPage((p) => Math.min(listTotalPages, p + 1))
                }
                aria-label="Next page"
              >
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>

          {/* Row 2: search | from | to | page / size */}
          <div className="min-w-0">
            <Label
              htmlFor="promote-submitter-filter"
              className="text-[10px] uppercase tracking-wide text-muted-foreground"
            >
              Submitter
            </Label>
            <Input
              id="promote-submitter-filter"
              className="mt-0.5 h-7 w-full px-2 text-[11px] font-mono"
              placeholder="Name…"
              value={submitterQ}
              onChange={(e) => setSubmitterQ(e.target.value)}
            />
          </div>
          <div className="min-w-0">
            <Label
              htmlFor="promote-from-date"
              className="text-[10px] uppercase tracking-wide text-muted-foreground"
            >
              From
            </Label>
            <Input
              id="promote-from-date"
              type="date"
              className="mt-0.5 h-7 w-full min-w-0 text-[11px] font-mono"
              value={submittedFrom}
              onChange={(e) => setSubmittedFrom(e.target.value)}
            />
          </div>
          <div className="min-w-0">
            <Label
              htmlFor="promote-to-date"
              className="text-[10px] uppercase tracking-wide text-muted-foreground"
            >
              To
            </Label>
            <Input
              id="promote-to-date"
              type="date"
              className="mt-0.5 h-7 w-full min-w-0 text-[11px] font-mono"
              value={submittedTo}
              onChange={(e) => setSubmittedTo(e.target.value)}
            />
          </div>
          <div className="min-w-0">
            <Label
              htmlFor="promote-page-size"
              className="text-[10px] uppercase tracking-wide text-muted-foreground"
            >
              Page
            </Label>
            <div className="mt-0.5 flex h-7 min-w-0 items-center justify-center gap-0.5">
              <span className="shrink-0 text-center font-mono text-[10px] tabular-nums text-muted-foreground">
                {listPage}/{listTotalPages}
              </span>
              <select
                id="promote-page-size"
                className="h-7 w-9 max-w-full shrink-0 rounded-md border border-border bg-background py-0 pl-0.5 pr-0 text-center font-mono text-[10px] tabular-nums sm:w-10"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                aria-label="Strategies per page"
                title="Strategies per page"
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-2 pr-2 pt-1">
          {paginatedList.map((c) => {
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
