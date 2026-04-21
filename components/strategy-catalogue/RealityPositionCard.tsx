"use client";

/**
 * Reality position card — rendered in the "Your Subscriptions" tab of the
 * Tier-3 client catalogue for each instance the viewer's org subscribes to.
 *
 * Drill-through targets the DART terminal + Reports attribution for the
 * specific instance (the real URLs are wired by Plan B Phase 4; for now the
 * chips link to existing routes that already exist).
 */

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  MATURITY_PHASE_LABEL,
  SHARE_CLASS_LABEL,
  type ShareClass,
  type StrategyMaturityPhase,
} from "@/lib/architecture-v2/lifecycle-placeholder";
import type {
  StrategyArchetype,
  StrategyFamily,
} from "@/lib/architecture-v2";

import { PerformanceOverlayPlaceholder } from "./PerformanceOverlayPlaceholder";

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
}

export interface RealityPositionCardProps {
  readonly instance: RealityInstanceSummary;
}

function formatCurrency(value: number | null): string {
  if (value === null) return "—";
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}k`;
  return `${sign}$${abs.toFixed(0)}`;
}

export function RealityPositionCard({ instance }: RealityPositionCardProps) {
  const pnlTone =
    instance.livePnl === null
      ? "text-muted-foreground"
      : instance.livePnl >= 0
        ? "text-emerald-500"
        : "text-rose-500";

  return (
    <Card
      data-testid="reality-position-card"
      data-instance-id={instance.instanceId}
      className="gap-4 py-4"
    >
      <CardHeader className="gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <p className="text-xs font-mono text-muted-foreground">
              {instance.family} / {instance.archetype}
            </p>
            <p className="text-sm font-medium">{instance.venueSetLabel}</p>
          </div>
          <Badge variant="outline" className="font-mono text-[10px]">
            {MATURITY_PHASE_LABEL[instance.maturityPhase]}
          </Badge>
        </div>
        {instance.shareClass ? (
          <Badge variant="secondary" className="w-fit font-mono text-[10px]">
            {SHARE_CLASS_LABEL[instance.shareClass]}
          </Badge>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-3 px-6">
        <PerformanceOverlayPlaceholder
          instanceId={instance.instanceId}
          views={["backtest", "paper", "live"]}
          captionVariant="reality"
        />
        <dl className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <dt className="text-muted-foreground">Live P&amp;L</dt>
            <dd className={`font-mono ${pnlTone}`}>
              {formatCurrency(instance.livePnl)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Allocation</dt>
            <dd className="font-mono">
              {formatCurrency(instance.liveAllocation)}
            </dd>
          </div>
        </dl>
        {instance.venuesActive.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {instance.venuesActive.map((venue) => (
              <Badge
                key={venue}
                variant="outline"
                className="font-mono text-[10px]"
              >
                {venue}
              </Badge>
            ))}
          </div>
        ) : null}
        <div className="flex gap-2 pt-1">
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
    </Card>
  );
}
