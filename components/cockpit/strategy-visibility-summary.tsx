"use client";

/**
 * StrategyVisibilitySummary — runs the StrategyAvailabilityResolver against
 * a representative spread of strategy instances and surfaces the count per
 * visibility state in the cockpit shell.
 *
 * Per audit fix #5 + polish #3: the resolver is the visibility gate.
 * Reads from the shared `useStrategyVisibility` hook so this surface, the
 * locked-preview hide-when-empty rule, and the per-preset visibility badge
 * all read from one canonical decision pipeline.
 *
 * Per dart_ux_cockpit_refactor_2026_04_29.plan §4.5 + §4.6 four-state
 * taxonomy.
 */

import { CheckCircle2, ExternalLink, EyeOff, Lock, ShieldQuestion } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { StrategyVisibilityState } from "@/lib/architecture-v2/strategy-availability-resolver";
import { useStrategyVisibility } from "@/lib/cockpit/use-strategy-visibility";
import { useWorkspaceScope } from "@/lib/stores/workspace-scope-store";
import { cn } from "@/lib/utils";

const STATE_LABEL: Record<StrategyVisibilityState, string> = {
  owned: "owned",
  available_to_request: "available to request",
  locked_by_tier: "locked by tier",
  locked_by_workflow: "locked by workflow",
  hidden: "hidden",
  admin_only: "admin only",
  read_only: "read only",
};

const STATE_TONE: Record<StrategyVisibilityState, string> = {
  owned: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  available_to_request: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300",
  locked_by_tier: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  locked_by_workflow: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  hidden: "border-border/40 bg-muted/20 text-muted-foreground/70",
  admin_only: "border-violet-500/40 bg-violet-500/10 text-violet-300",
  read_only: "border-sky-500/40 bg-sky-500/10 text-sky-300",
};

const STATE_ICON: Record<StrategyVisibilityState, React.ComponentType<{ className?: string }>> = {
  owned: CheckCircle2,
  available_to_request: ExternalLink,
  locked_by_tier: Lock,
  locked_by_workflow: Lock,
  hidden: EyeOff,
  admin_only: ShieldQuestion,
  read_only: ShieldQuestion,
};

interface StrategyVisibilitySummaryProps {
  readonly className?: string;
}

export function StrategyVisibilitySummary({ className }: StrategyVisibilitySummaryProps) {
  const scope = useWorkspaceScope();
  const { counts, totalVisible, totalInstances } = useStrategyVisibility();
  const surfaceLabel = scope.surface;

  // Order matters — owned first, then upgrade pathways, then internal-only states.
  const ordered: readonly StrategyVisibilityState[] = [
    "owned",
    "available_to_request",
    "read_only",
    "locked_by_tier",
    "locked_by_workflow",
    "admin_only",
    "hidden",
  ];

  return (
    <Card
      className={cn("border-border/40 bg-muted/5", className)}
      data-testid="strategy-visibility-summary"
      data-surface={surfaceLabel}
    >
      <CardContent className="p-2.5 flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
          Strategy availability for you on <span className="font-mono">{surfaceLabel}</span>
        </span>
        <span className="text-[10px] text-muted-foreground/60">
          ({totalVisible} of {totalInstances} visible)
        </span>
        <span aria-hidden className="text-muted-foreground/30">
          ·
        </span>
        {ordered.map((state) => {
          const n = counts[state];
          if (n === 0) return null;
          const Icon = STATE_ICON[state];
          return (
            <Badge
              key={state}
              variant="outline"
              className={cn("gap-1 font-mono text-[9px]", STATE_TONE[state])}
              data-testid={`visibility-count-${state}`}
              data-count={n}
            >
              <Icon className="size-3" aria-hidden />
              {n} {STATE_LABEL[state]}
            </Badge>
          );
        })}
      </CardContent>
    </Card>
  );
}
