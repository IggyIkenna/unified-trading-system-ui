"use client";

/**
 * Reality position card — rendered in the "Your Subscriptions" tab of the
 * Tier-3 client catalogue for each instance the viewer's org subscribes to.
 *
 * Drill-through targets the DART terminal + Reports attribution for the
 * specific instance (the real URLs are wired by Plan B Phase 4; for now the
 * chips link to existing routes that already exist).
 *
 * Plan D Phase 4 additions:
 *   - "Unsubscribe" overflow action with destructive confirm dialog
 *   - "Fork for research" primary action that opens a <ForkDialog> modal
 *     in-place (placement audit replaced the standalone /fork page)
 *   - <VersionLineageBadge> in the header
 */

import * as React from "react";
import Link from "next/link";
import { ArrowRight, GitFork, MoreVertical } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MATURITY_PHASE_LABEL, SHARE_CLASS_LABEL, type StrategyMaturityPhase } from "@/lib/architecture-v2/lifecycle";
import type { ShareClass, StrategyArchetype, StrategyFamily } from "@/lib/architecture-v2";
import { unsubscribeFromInstance, type SubscriptionType } from "@/lib/api/strategy-subscriptions";
import { formatArchetype, formatFamily } from "@/lib/strategy-display";

import { ForkDialog, type ForkDialogField } from "./ForkDialog";
import { PerformanceOverlay } from "./PerformanceOverlay";
import { VersionLineageBadge } from "./VersionLineageBadge";
import type { PerformanceSeriesResponse } from "@/lib/api/performance-overlay";

export interface RealityInstanceSummary {
  readonly instanceId: string;
  readonly family: StrategyFamily;
  readonly archetype: StrategyArchetype;
  readonly venueSetLabel: string;
  readonly shareClass: ShareClass | null;
  readonly maturityPhase: StrategyMaturityPhase;
  readonly liveAllocation: number | null;
  readonly livePnl: number | null;
  readonly venuesActive: readonly string[];
  readonly terminalHref: string;
  readonly reportsHref: string;
  /** Plan D — current version index (0 = genesis). */
  readonly versionIndex?: number;
  /** Plan D — parent version index. `null` ⇒ genesis. */
  readonly parentVersionIndex?: number | null;
  /** Plan D — subscription type from the StrategyInstanceSubscription record.
   * Drives Fork eligibility: `dart_exclusive` permits forking; `im_allocation`
   * + `signals_in` do not. Defaults to `dart_exclusive` for legacy callers
   * that don't pass it (preserves the pre-Plan-D fork-anywhere behaviour). */
  readonly subscriptionType?: SubscriptionType;
}

export interface RealityPositionCardProps {
  readonly instance: RealityInstanceSummary;
  /** Plan D — caller's clientId required for the Unsubscribe + Fork API
   * calls. When omitted, both actions render disabled. */
  readonly callerClientId?: string;
  /** Plan D — fields exposed on the ForkDialog. Defaults to a minimal set;
   * callers wiring real config-diffs supply the full list. */
  readonly forkDialogFields?: readonly ForkDialogField[];
  /** Plan D — fired after a successful unsubscribe so the parent grid can
   * remove the row optimistically. */
  readonly onUnsubscribed?: (instanceId: string) => void;
  /** Plan D — fired after a successful fork with the new version_id. */
  readonly onForked?: (instanceId: string, versionId: string) => void;
  /** Test-only: pre-computed series, bypasses the live fetch. */
  readonly performanceOverride?: PerformanceSeriesResponse;
}

function formatCurrency(value: number | null): string {
  if (value === null) return "-";
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}k`;
  return `${sign}$${abs.toFixed(0)}`;
}

export function RealityPositionCard({
  instance,
  callerClientId,
  forkDialogFields,
  onUnsubscribed,
  onForked,
  performanceOverride,
}: RealityPositionCardProps) {
  const pnlTone =
    instance.livePnl === null ? "text-muted-foreground" : instance.livePnl >= 0 ? "text-emerald-500" : "text-rose-500";

  const subscriptionType = instance.subscriptionType ?? "dart_exclusive";
  const forkAllowed = subscriptionType === "dart_exclusive";
  // IM_ALLOCATION subscriptions cannot fork — pooled routing has no
  // per-client config-diff surface. signals_in tenants cannot fork either
  // (read-only signal tap). Both render the action disabled with a tooltip.
  const forkDisabled = !callerClientId || !forkAllowed;
  const unsubscribeDisabled = !callerClientId;

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [forkOpen, setForkOpen] = React.useState(false);
  const [unsubBusy, setUnsubBusy] = React.useState(false);
  const [unsubError, setUnsubError] = React.useState<string | null>(null);

  const onConfirmUnsubscribe = async () => {
    if (!callerClientId) return;
    setUnsubBusy(true);
    setUnsubError(null);
    try {
      await unsubscribeFromInstance({ instanceId: instance.instanceId, clientId: callerClientId });
      onUnsubscribed?.(instance.instanceId);
      setConfirmOpen(false);
    } catch (err) {
      setUnsubError((err as Error).message);
    } finally {
      setUnsubBusy(false);
    }
  };

  const fields: readonly ForkDialogField[] = forkDialogFields ?? [
    { name: "config.notional_usd", currentValue: "" },
    { name: "config.max_drawdown_pct", currentValue: "" },
  ];

  return (
    <Card data-testid="reality-position-card" data-instance-id={instance.instanceId} className="gap-4 py-4">
      <CardHeader className="gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <p className="text-xs text-muted-foreground">
              {formatFamily(instance.family)} / {formatArchetype(instance.archetype)}
            </p>
            <p className="text-sm font-medium">{instance.venueSetLabel}</p>
            {instance.versionIndex !== undefined ? (
              <div className="pt-0.5">
                <VersionLineageBadge
                  versionIndex={instance.versionIndex}
                  parentVersionIndex={instance.parentVersionIndex ?? null}
                  compact
                />
              </div>
            ) : null}
          </div>
          <div className="flex items-start gap-1">
            <Badge variant="outline" className="font-mono text-[10px]">
              {MATURITY_PHASE_LABEL[instance.maturityPhase]}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  aria-label="Open instance actions"
                  data-testid="reality-overflow-trigger"
                >
                  <MoreVertical className="size-3" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  disabled={unsubscribeDisabled}
                  onSelect={(e) => {
                    e.preventDefault();
                    setConfirmOpen(true);
                  }}
                  data-testid="reality-unsubscribe-action"
                  className="text-destructive focus:text-destructive"
                >
                  Unsubscribe
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {instance.shareClass ? (
          <Badge variant="secondary" className="w-fit font-mono text-[10px]">
            {SHARE_CLASS_LABEL[instance.shareClass]}
          </Badge>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-3 px-6">
        <PerformanceOverlay
          instanceId={instance.instanceId}
          mode="stitched"
          views={["backtest", "paper", "live"]}
          heightClass="h-32"
          showStats={false}
          showViewToggles={false}
          seriesOverride={performanceOverride}
        />
        <dl className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <dt className="text-muted-foreground">Live P&amp;L</dt>
            <dd className={`font-mono ${pnlTone}`}>{formatCurrency(instance.livePnl)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Allocation</dt>
            <dd className="font-mono">{formatCurrency(instance.liveAllocation)}</dd>
          </div>
        </dl>
        {instance.venuesActive.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {instance.venuesActive.map((venue) => (
              <Badge key={venue} variant="outline" className="font-mono text-[10px]">
                {venue}
              </Badge>
            ))}
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button
            size="sm"
            variant="outline"
            disabled={forkDisabled}
            onClick={() => setForkOpen(true)}
            title={
              !callerClientId
                ? "Sign in required"
                : !forkAllowed
                  ? "Fork is only available for DART exclusive subscriptions"
                  : ""
            }
            data-testid="reality-fork-action"
          >
            <GitFork className="mr-1 size-3" aria-hidden />
            Fork for research
          </Button>
          <Link
            href={instance.terminalHref}
            className="flex items-center gap-1 text-xs text-primary underline-offset-2 hover:underline"
            data-testid="reality-drill-terminal"
          >
            Terminal <ArrowRight className="size-3" aria-hidden />
          </Link>
          <Link
            href={instance.reportsHref}
            className="flex items-center gap-1 text-xs text-primary underline-offset-2 hover:underline"
            data-testid="reality-drill-reports"
          >
            Reports <ArrowRight className="size-3" aria-hidden />
          </Link>
        </div>
      </CardContent>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent data-testid="reality-unsubscribe-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle>Unsubscribe from this strategy?</AlertDialogTitle>
            <AlertDialogDescription>
              The exclusive lock will be released and another client can subscribe. Active positions stay open until you
              unwind them; this action only stops new signals.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {unsubError ? (
            <p role="alert" className="text-xs text-destructive">
              {unsubError}
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={unsubBusy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={unsubBusy}
              onClick={(e) => {
                e.preventDefault();
                void onConfirmUnsubscribe();
              }}
              data-testid="reality-unsubscribe-confirm-action"
            >
              Unsubscribe
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {callerClientId ? (
        <ForkDialog
          instanceId={instance.instanceId}
          clientId={callerClientId}
          fields={fields}
          open={forkOpen}
          onOpenChange={setForkOpen}
          onForked={(versionId) => onForked?.(instance.instanceId, versionId)}
        />
      ) : null}
    </Card>
  );
}
