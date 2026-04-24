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

import { ArrowRight, ArrowUpRight, Lock } from "lucide-react";
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
import type {
  ShareClass,
  StrategyArchetype,
  StrategyFamily,
} from "@/lib/architecture-v2";
import { formatArchetype, formatFamily, getArchetypePlanTier } from "@/lib/strategy-display";

import { PerformanceOverlay } from "./PerformanceOverlay";
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
}

export interface FomoTearsheetCardProps {
  readonly instance: FomoInstanceSummary;
  readonly onRequestAllocation?: (instanceId: string) => void;
  /** Test-only: pre-computed series, bypasses the live fetch. */
  readonly performanceOverride?: PerformanceSeriesResponse;
}

function formatStat(value: number | null, suffix: string, digits = 2): string {
  if (value === null) return "—";
  return `${value.toFixed(digits)}${suffix}`;
}

export function FomoTearsheetCard({
  instance,
  onRequestAllocation,
  performanceOverride,
}: FomoTearsheetCardProps) {
  const ctaEnabled = allowsAllocationCta(instance.maturityPhase);
  const planTier = getArchetypePlanTier(instance.archetype);

  return (
    <Card
      data-testid="fomo-tearsheet-card"
      data-instance-id={instance.instanceId}
      className="gap-4 py-4"
    >
      <CardHeader className="gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <p className="text-xs text-muted-foreground">
              {formatFamily(instance.family)} / {formatArchetype(instance.archetype)}
            </p>
            <p className="text-sm font-medium">{instance.venueSetLabel}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="outline" className="font-mono text-[10px]">
              {MATURITY_PHASE_LABEL[instance.maturityPhase]}
            </Badge>
            {planTier === "full-only" ? (
              <Badge className="gap-0.5 border-amber-200 bg-amber-50 text-[10px] text-amber-700">
                <Lock className="size-2.5" aria-hidden />
                DART Full only
              </Badge>
            ) : (
              <Badge className="border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700">
                Full + Signals-In
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
            <dd className="font-mono">
              {formatStat(instance.maxDrawdownPct, "%")}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">CAGR</dt>
            <dd className="font-mono">{formatStat(instance.cagrPct, "%")}</dd>
          </div>
        </dl>
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1"
            disabled={!ctaEnabled || !onRequestAllocation}
            onClick={() => onRequestAllocation?.(instance.instanceId)}
            data-testid="fomo-request-allocation-cta"
          >
            Request allocation
            <ArrowUpRight className="ml-1 size-3" aria-hidden />
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link
              href={`/services/reports/strategy/${instance.instanceId}`}
              data-testid="fomo-view-returns-cta"
            >
              View returns
              <ArrowRight className="ml-1 size-3" aria-hidden />
            </Link>
          </Button>
        </div>
        {!ctaEnabled ? (
          <p className="text-[10px] text-muted-foreground">
            Allocation opens at paper-stable maturity or later.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
