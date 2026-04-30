"use client";

/**
 * FOMO tearsheet card — rendered in the "Explore" tab of the Tier-3 client
 * catalogue for instances the viewer is NOT subscribed to.
 *
 * Live line on the overlay is always `odum-live`'s representative-account run,
 * never another client's flow. See memory/project_fomo_tearsheets_show_live_is_odum_own_run_2026_04_21.md.
 *
 * Allocation CTA is gated by product-routing (must reach the viewer's tier)
 * AND maturity ≥ `paper_stable` (`allowsAllocationCta`).
 */

import { ArrowRight, ArrowUpRight, CheckCircle2, FileText, Lock } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  allowsAllocationCta,
  MATURITY_PHASE_LABEL,
  PRODUCT_ROUTING_LABEL,
  SHARE_CLASS_LABEL,
  type ProductRouting,
  type StrategyMaturityPhase,
} from "@/lib/architecture-v2/lifecycle";
import type { ShareClass, StrategyArchetype, StrategyFamily } from "@/lib/architecture-v2";
import type { StrategyAccess } from "@/lib/entitlements/strategy-route";
import { formatArchetype, formatFamily, getArchetypePlanTier } from "@/lib/strategy-display";

import { ExclusiveLockBadge } from "./ExclusiveLockBadge";
import { PerformanceOverlay } from "./PerformanceOverlay";
import { SubscribeButton } from "./SubscribeButton";
import { VersionLineageBadge } from "./VersionLineageBadge";
import type { PerformanceSeriesResponse } from "@/lib/api/performance-overlay";

export interface FomoInstanceSummary {
  readonly instanceId: string;
  readonly family: StrategyFamily;
  readonly archetype: StrategyArchetype;
  readonly venueSetLabel: string;
  readonly shareClass: ShareClass | null;
  readonly maturityPhase: StrategyMaturityPhase;
  readonly productRouting: ProductRouting;
  readonly sharpe: number | null;
  readonly maxDrawdownPct: number | null;
  readonly cagrPct: number | null;
  /** Plan D — current version index (0 = genesis). Optional: omit to skip
   * the lineage badge for callers that haven't wired version metadata. */
  readonly versionIndex?: number;
  /** Plan D — parent version index. `null` ⇒ this is the genesis. */
  readonly parentVersionIndex?: number | null;
  /** Plan D — current exclusive holder client_id. When set AND not equal to
   * the caller's clientId, the SubscribeButton renders disabled and the
   * <ExclusiveLockBadge> appears in the header. */
  readonly existingExclusiveHolder?: string | null;
}

export interface FomoTearsheetCardProps {
  readonly instance: FomoInstanceSummary;
  readonly onRequestAllocation?: (instanceId: string) => void;
  /** Per-instance access state from `resolveSlotAccess`. Drives lock badge,
   * card opacity, and allocation-CTA gating. Defaults to "terminal" so
   * legacy callers that don't pass it render the unlocked allocation flow.
   * The grid (StrategyCatalogueSurface) computes access per-instance and
   * passes it through. */
  readonly access?: StrategyAccess;
  /** Whether the viewer's org is already subscribed to this instance.
   * Subscribed instances render with a green checkmark badge instead of the
   * upgrade lock. */
  readonly isSubscribed?: boolean;
  /** Plan D — caller's client_id (UAC `Org.id` / org slug). Required for the
   * SubscribeButton CTA swap. When omitted, the legacy "Request allocation"
   * CTA renders. */
  readonly callerClientId?: string;
  /** Plan D — caller's entitlements (already on `useAuth().user.entitlements`).
   * The CTA swap requires `strategy-full` or `ml-full` (DART Full tier). */
  readonly callerEntitlements?: readonly string[];
  /** Test-only: pre-computed series, bypasses the live fetch. */
  readonly performanceOverride?: PerformanceSeriesResponse;
}

/** Plan D — caller is on DART Full tier when they hold either the broad
 * strategy-full entitlement or an ML wildcard. Wildcard entitlement (`*`)
 * also qualifies for admin / odum-internal personas. */
function hasDartFullEntitlement(entitlements: readonly string[] | undefined): boolean {
  if (!entitlements) return false;
  return entitlements.includes("*") || entitlements.includes("strategy-full") || entitlements.includes("ml-full");
}

/** Plan D — DART surface is reachable when the routing includes `dart_only`
 * or `both`. `internal_only` and `im_only` do not qualify. */
function isDartRouted(routing: ProductRouting): boolean {
  return routing === "dart_only" || routing === "both";
}

function formatStat(value: number | null, suffix: string, digits = 2): string {
  if (value === null) return "-";
  return `${value.toFixed(digits)}${suffix}`;
}

export function FomoTearsheetCard({
  instance,
  onRequestAllocation,
  access = "terminal",
  isSubscribed = false,
  callerClientId,
  callerEntitlements,
  performanceOverride,
}: FomoTearsheetCardProps) {
  const ctaEnabled = allowsAllocationCta(instance.maturityPhase);
  const planTier = getArchetypePlanTier(instance.archetype);
  const isTerminalAccess = access === "terminal";
  const isReportsOnly = access === "reports-only";
  const isLockedVisible = access === "locked-visible";

  // Plan D — CTA swap gate: DART-routed instance + DART Full entitlements
  // + caller clientId provided + maturity-allows-allocation. When all four
  // hold, render <SubscribeButton>; otherwise fall back to the legacy
  // "Request allocation" CTA so IM-only and pre-paper-stable strategies
  // still surface their original flow.
  const dartRouted = isDartRouted(instance.productRouting);
  const hasDartFull = hasDartFullEntitlement(callerEntitlements);
  const useSubscribeCta = dartRouted && hasDartFull && !!callerClientId && ctaEnabled && !isLockedVisible;
  const heldByOther =
    !!instance.existingExclusiveHolder && instance.existingExclusiveHolder !== callerClientId && !isSubscribed;

  return (
    <Card
      data-testid="fomo-tearsheet-card"
      data-instance-id={instance.instanceId}
      data-access={access}
      data-subscribed={isSubscribed ? "true" : "false"}
      data-cta-mode={useSubscribeCta ? "subscribe" : "request-allocation"}
      className={`gap-4 py-4 ${isLockedVisible ? "opacity-60" : ""}`}
    >
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
          <div className="flex flex-col items-end gap-1">
            <Badge variant="outline" className="font-mono text-[10px]">
              {MATURITY_PHASE_LABEL[instance.maturityPhase]}
            </Badge>
            {heldByOther && instance.existingExclusiveHolder ? (
              <ExclusiveLockBadge holder={instance.existingExclusiveHolder} compact />
            ) : null}
            {isSubscribed ? (
              <Badge className="gap-0.5 border-emerald-300 bg-emerald-100 text-[10px] text-emerald-800">
                <CheckCircle2 className="size-2.5" aria-hidden />
                Subscribed
              </Badge>
            ) : isTerminalAccess ? (
              <Badge className="border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700">Available</Badge>
            ) : isReportsOnly ? (
              <Badge className="gap-0.5 border-amber-200 bg-amber-50 text-[10px] text-amber-700">
                <FileText className="size-2.5" aria-hidden />
                Reports only
              </Badge>
            ) : planTier === "full-only" ? (
              <Badge className="gap-0.5 border-amber-200 bg-amber-50 text-[10px] text-amber-700">
                <Lock className="size-2.5" aria-hidden />
                DART Full only
              </Badge>
            ) : (
              <Badge className="gap-0.5 border-zinc-300 bg-zinc-100 text-[10px] text-zinc-600">
                <Lock className="size-2.5" aria-hidden />
                Locked
              </Badge>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {instance.shareClass ? (
            <Badge variant="secondary" className="font-mono text-[10px]">
              {SHARE_CLASS_LABEL[instance.shareClass]}
            </Badge>
          ) : null}
          <Badge variant="secondary" className="font-mono text-[10px]">
            {PRODUCT_ROUTING_LABEL[instance.productRouting]}
          </Badge>
        </div>
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
        <dl className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <dt className="text-muted-foreground">Sharpe</dt>
            <dd className="font-mono">{formatStat(instance.sharpe, "")}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">MDD</dt>
            <dd className="font-mono">{formatStat(instance.maxDrawdownPct, "%")}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">CAGR</dt>
            <dd className="font-mono">{formatStat(instance.cagrPct, "%")}</dd>
          </div>
        </dl>
        <div className="flex gap-2">
          {isLockedVisible ? (
            <Button size="sm" className="flex-1" variant="outline" asChild>
              <Link
                href={`/contact?service=dart-full&action=unlock&instance=${encodeURIComponent(instance.instanceId)}`}
                data-testid="fomo-contact-unlock-cta"
              >
                Contact us to unlock
                <ArrowUpRight className="ml-1 size-3" aria-hidden />
              </Link>
            </Button>
          ) : useSubscribeCta && callerClientId && callerEntitlements ? (
            <div className="flex-1" data-testid="fomo-subscribe-cta-wrapper">
              <SubscribeButton
                instanceId={instance.instanceId}
                productRouting={instance.productRouting === "both" ? ["DART", "IM"] : ["DART"]}
                callerClientId={callerClientId}
                callerEntitlements={callerEntitlements}
                existingExclusiveHolder={instance.existingExclusiveHolder ?? null}
                initiallySubscribed={isSubscribed}
              />
            </div>
          ) : (
            <Button
              size="sm"
              className="flex-1"
              disabled={!ctaEnabled || !onRequestAllocation || isSubscribed}
              onClick={() => onRequestAllocation?.(instance.instanceId)}
              data-testid="fomo-request-allocation-cta"
            >
              {isSubscribed ? "Already subscribed" : "Request allocation"}
              {!isSubscribed ? <ArrowUpRight className="ml-1 size-3" aria-hidden /> : null}
            </Button>
          )}
          <Button size="sm" variant="outline" asChild>
            <Link href={`/services/reports/strategy/${instance.instanceId}`} data-testid="fomo-view-returns-cta">
              View returns
              <ArrowRight className="ml-1 size-3" aria-hidden />
            </Link>
          </Button>
        </div>
        {!ctaEnabled && !isLockedVisible && !isSubscribed ? (
          <p className="text-[10px] text-muted-foreground">Allocation opens at paper-stable maturity or later.</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
