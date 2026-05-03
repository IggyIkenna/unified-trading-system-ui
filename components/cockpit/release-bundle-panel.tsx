"use client";

/**
 * ReleaseBundlePanel — visualises the StrategyReleaseBundle + active
 * RuntimeOverride layer for a single strategy.
 *
 * Per dart_ux_cockpit_refactor_2026_04_29.plan.md §4.8 + §4.9.
 *
 * The panel embodies the "operating rule" of the cockpit:
 *   StrategyReleaseBundle decides what's approved to run.
 *   RuntimeOverride decides what changed live.
 *   The two MUST be visible side by side — performance attribution that
 *   hides overrides is forbidden (§4.8.3 rule 2).
 *
 * Phase 9 SCOPE: ship the panel as a typed read-only render of a Bundle +
 * its overrides, plus a "Promote a new bundle" CTA. Bundle creation +
 * override authoring forms are follow-up work; this surface is the
 * INSPECTION view that Promote / Terminal-Strategies / Explain modes
 * embed.
 */

import * as React from "react";
import { CheckCircle2, GitBranch, History, Lock, Shield } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  PROMOTION_STATUS_TO_MATURITY,
  type ReleaseBundlePromotionStatus,
  type StrategyReleaseBundle,
} from "@/lib/architecture-v2/strategy-release-bundle";
import { type RuntimeOverride } from "@/lib/architecture-v2/runtime-override";
import { useCockpitOpsStore } from "@/lib/mocks/cockpit-ops-store";
import { cn } from "@/lib/utils";

interface ReleaseBundlePanelProps {
  readonly bundle: StrategyReleaseBundle;
  readonly activeOverrides?: readonly RuntimeOverride[];
  readonly className?: string;
}

const STATUS_TONE: Record<ReleaseBundlePromotionStatus, string> = {
  draft: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30",
  candidate: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  approved_for_paper: "bg-sky-500/10 text-sky-400 border-sky-500/30",
  paper: "bg-sky-500/10 text-sky-400 border-sky-500/30",
  approved_for_pilot: "bg-violet-500/10 text-violet-400 border-violet-500/30",
  pilot: "bg-violet-500/10 text-violet-400 border-violet-500/30",
  approved_for_live: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  live: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  paused: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  monitor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  retired: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30",
  rolled_back: "bg-rose-500/10 text-rose-400 border-rose-500/30",
};

export function ReleaseBundlePanel({ bundle, activeOverrides = [], className }: ReleaseBundlePanelProps) {
  const maturity = PROMOTION_STATUS_TO_MATURITY[bundle.promotionStatus];
  // Merge in any RuntimeOverrides authored this session (via
  // RuntimeOverrideAuthoring → useCockpitOpsStore.appendRuntimeOverride).
  // The submit click → bundle-panel reflection is the demo's "click does
  // something" loop.
  const sessionOverrides = useCockpitOpsStore((s) =>
    s.runtimeOverrides.filter((o) => o.releaseId === bundle.releaseId),
  );
  const mergedOverrides: readonly RuntimeOverride[] = React.useMemo(
    () => [...activeOverrides, ...sessionOverrides],
    [activeOverrides, sessionOverrides],
  );
  const overrideCount = mergedOverrides.length;

  return (
    <Card className={cn("border-border/50", className)} data-testid="release-bundle-panel">
      <CardContent className="p-4 space-y-3">
        {/* Header: bundle id + status */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <GitBranch className="size-3.5 text-primary/70" aria-hidden />
              <h3 className="text-sm font-semibold tracking-tight font-mono">{bundle.releaseId}</h3>
            </div>
            <p className="text-[10px] text-muted-foreground/70 font-mono">
              {bundle.strategyId} · v{bundle.strategyVersion}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className={cn("text-[10px] font-mono", STATUS_TONE[bundle.promotionStatus])}>
              {bundle.promotionStatus}
            </Badge>
            <Badge variant="secondary" className="text-[10px] font-mono">
              {maturity}
            </Badge>
          </div>
        </div>

        {/* Version pins grid */}
        <section className="space-y-1.5" data-testid="release-bundle-versions">
          <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground">Version pins</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[10px] font-mono">
            <PinRow label="Research config" value={bundle.researchConfigVersion} />
            <PinRow label="Execution config" value={bundle.executionConfigVersion} />
            <PinRow label="Risk config" value={bundle.riskConfigVersion} />
            {bundle.featureSetVersion ? <PinRow label="Feature set" value={bundle.featureSetVersion} /> : null}
            {bundle.modelVersion ? <PinRow label="Model" value={bundle.modelVersion} /> : null}
            {bundle.treasuryPolicyConfigVersion ? (
              <PinRow label="Treasury policy" value={bundle.treasuryPolicyConfigVersion} />
            ) : null}
            <PinRow label="Venue set" value={bundle.venueSetVersion} />
            <PinRow label="Instrument universe" value={bundle.instrumentUniverseVersion} />
            <PinRow label="Data assumptions" value={bundle.dataAssumptionVersion} />
          </div>
        </section>

        {/* Validation evidence */}
        <section className="space-y-1.5" data-testid="release-bundle-validation">
          <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1">
            <CheckCircle2 className="size-2.5 text-emerald-500/70" aria-hidden />
            Validation evidence
          </h4>
          <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
            <Badge variant="outline" className="font-mono">
              {bundle.validationRunIds.length} validation runs
            </Badge>
            <Badge variant="outline" className="font-mono">
              {bundle.backtestRunIds.length} backtests
            </Badge>
            {bundle.paperRunIds && bundle.paperRunIds.length > 0 ? (
              <Badge variant="outline" className="font-mono">
                {bundle.paperRunIds.length} paper runs
              </Badge>
            ) : null}
            {bundle.pilotRunIds && bundle.pilotRunIds.length > 0 ? (
              <Badge variant="outline" className="font-mono">
                {bundle.pilotRunIds.length} pilot runs
              </Badge>
            ) : null}
          </div>
        </section>

        {/* Override guardrails */}
        <section className="space-y-1.5" data-testid="release-bundle-guardrails">
          <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1">
            <Shield className="size-2.5 text-amber-500/70" aria-hidden />
            Override guardrails
          </h4>
          <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
            <Badge variant="outline" className="font-mono">
              size [{bundle.runtimeOverrideGuardrails.sizeMultiplierRange[0]},{" "}
              {bundle.runtimeOverrideGuardrails.sizeMultiplierRange[1]}]
            </Badge>
            <GuardrailFlag label="venue disable" allowed={bundle.runtimeOverrideGuardrails.venueDisableAllowed} />
            <GuardrailFlag label="risk tightening" allowed={bundle.runtimeOverrideGuardrails.riskTighteningAllowed} />
            <GuardrailFlag label="pause entries" allowed={bundle.runtimeOverrideGuardrails.pauseEntriesAllowed} />
            <GuardrailFlag label="exit-only" allowed={bundle.runtimeOverrideGuardrails.exitOnlyAllowed} />
            <GuardrailFlag
              label="treasury route"
              allowed={bundle.runtimeOverrideGuardrails.treasuryRouteOverridesAllowed}
            />
            <Badge variant="outline" className="font-mono">
              {bundle.runtimeOverrideGuardrails.executionPresets.length} approved presets
            </Badge>
          </div>
        </section>

        {/* Active runtime overrides — non-empty case shows what's been mutated live */}
        <section className="space-y-1.5" data-testid="release-bundle-overrides">
          <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1">
            <History className="size-2.5 text-rose-500/70" aria-hidden />
            Active overrides {overrideCount > 0 ? `(${overrideCount})` : ""}
          </h4>
          {overrideCount === 0 ? (
            <p className="text-[10px] text-muted-foreground/70">
              None. The bundle is running as approved with no live mutations.
            </p>
          ) : (
            <div className="space-y-1">
              {mergedOverrides.map((ov) => (
                <div
                  key={ov.overrideId}
                  className="flex items-center justify-between gap-2 px-2 py-1 rounded bg-rose-500/5 border border-rose-500/20 text-[10px]"
                  data-testid={`release-bundle-override-${ov.overrideId}`}
                >
                  <div className="flex items-center gap-1.5">
                    <Lock className="size-2.5 text-rose-500/60" aria-hidden />
                    <span className="font-mono font-medium">{ov.overrideType}</span>
                    <span className="text-muted-foreground/70">{ov.reason}</span>
                  </div>
                  <span className="text-muted-foreground/60 font-mono">
                    {ov.createdBy} · {new Date(ov.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Audit + reproducibility hashes */}
        <section className="flex flex-wrap items-center gap-2 text-[9px] text-muted-foreground/50 font-mono pt-1 border-t border-border/30">
          <span>
            created: {bundle.createdBy} · {new Date(bundle.createdAt).toLocaleDateString()}
          </span>
          {bundle.approvedBy ? <span>· approved: {bundle.approvedBy}</span> : null}
          {bundle.acceptedByTerminal ? <span>· accepted: {bundle.acceptedByTerminal}</span> : null}
          <span>· content: {bundle.contentHash.slice(0, 12)}…</span>
          <span>· lineage: {bundle.lineageHash.slice(0, 12)}…</span>
        </section>
      </CardContent>
    </Card>
  );
}

function PinRow({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="flex items-center justify-between gap-1 px-1.5 py-1 rounded bg-muted/20 border border-border/30">
      <span className="text-muted-foreground/70 truncate">{label}</span>
      <span className="font-medium truncate">{value}</span>
    </div>
  );
}

function GuardrailFlag({ label, allowed }: { readonly label: string; readonly allowed: boolean }) {
  return (
    <Badge
      variant="outline"
      className={
        allowed
          ? "text-[10px] font-mono border-emerald-500/30 bg-emerald-500/10 text-emerald-400/90"
          : "text-[10px] font-mono border-zinc-500/30 bg-muted/30 text-muted-foreground/70"
      }
    >
      {allowed ? "✓" : "✗"} {label}
    </Badge>
  );
}
