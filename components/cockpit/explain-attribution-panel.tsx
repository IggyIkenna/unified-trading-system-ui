"use client";

/**
 * ExplainAttributionPanel — bundle + override side-by-side P&L attribution.
 *
 * Per dart_ux_cockpit_refactor_2026_04_29.plan.md §4.8.3 rule 2:
 * "Explain mode and Reports MUST show both the approved release bundle AND
 *  any runtime overrides active during the reporting period. Performance
 *  attribution that hides overrides is forbidden."
 *
 * This panel surfaces three columns:
 *   1. Bundle baseline P&L     (what the immutable bundle would have done)
 *   2. Override deltas         (per-override P&L impact, signed)
 *   3. Realised P&L            (sum — what actually happened)
 *
 * The buyer reads top-to-bottom: "the strategy made $X — of which $Y was the
 * approved bundle and $Z was the live overrides Desmond authored."
 *
 * Demo numbers — production wires this to the attribution-service stream.
 */

import * as React from "react";
import { ArrowRight, Calculator, Layers, Minus, Plus, Sparkle, TrendingDown, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { RuntimeOverride } from "@/lib/architecture-v2/runtime-override";
import type { StrategyReleaseBundle } from "@/lib/architecture-v2/strategy-release-bundle";
import { cn } from "@/lib/utils";

interface OverrideAttributionRow {
  readonly override: RuntimeOverride;
  /** Estimated P&L impact in bundle's share-class currency. Sign matters. */
  readonly pnlDeltaUsd: number;
  /** One-line buyer explanation. */
  readonly note: string;
}

interface ExplainAttributionPanelProps {
  readonly bundle: StrategyReleaseBundle;
  readonly activeOverrides: readonly RuntimeOverride[];
  /** Realised P&L the bundle would have produced with no overrides. */
  readonly bundleBaselinePnlUsd?: number;
  readonly className?: string;
}

const fmtUsd = (n: number): string => {
  const sign = n >= 0 ? "+" : "−";
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}K`;
  return `${sign}$${abs.toFixed(0)}`;
};

const OVERRIDE_COPY: Partial<Record<RuntimeOverride["overrideType"], string>> = {
  size_multiplier: "Position scaled — opportunity P&L scaled by the same factor",
  venue_disable: "Routing diverted — fills land elsewhere; basis differs",
  execution_preset: "Different fill profile — slippage / urgency shifted",
  risk_limit_tightening: "Lower risk ceiling — trades clipped or skipped",
  treasury_route: "Treasury rerouted — funding cost / yield differs",
  pause_entries: "No new entries — opportunity P&L missed",
  exit_only: "Reduce-only — exit-side P&L only",
  kill_switch: "Flatten — realised on liquidation, no further P&L",
};

export function ExplainAttributionPanel({
  bundle,
  activeOverrides,
  bundleBaselinePnlUsd = 18_420,
  className,
}: ExplainAttributionPanelProps) {
  // Synthesise per-override attribution for the demo — production reads from
  // the attribution stream.
  const rows: readonly OverrideAttributionRow[] = React.useMemo(() => {
    return activeOverrides.map((ov) => {
      let pnlDeltaUsd = 0;
      switch (ov.overrideType) {
        case "size_multiplier": {
          const m = ov.value.multiplier;
          // Bundle baseline scales by (m - 1) because override reduced size.
          pnlDeltaUsd = bundleBaselinePnlUsd * (m - 1);
          break;
        }
        case "venue_disable":
          pnlDeltaUsd = -842;
          break;
        case "execution_preset":
          pnlDeltaUsd = 215;
          break;
        case "risk_limit_tightening":
          pnlDeltaUsd = -510;
          break;
        case "treasury_route":
          pnlDeltaUsd = -120;
          break;
        case "pause_entries":
          pnlDeltaUsd = -2_300;
          break;
        case "exit_only":
          pnlDeltaUsd = -1_180;
          break;
        case "kill_switch":
          pnlDeltaUsd = -bundleBaselinePnlUsd * 0.1;
          break;
      }
      return {
        override: ov,
        pnlDeltaUsd,
        note: OVERRIDE_COPY[ov.overrideType] ?? "Override applied",
      };
    });
  }, [activeOverrides, bundleBaselinePnlUsd]);

  const overridesTotalUsd = rows.reduce((sum, r) => sum + r.pnlDeltaUsd, 0);
  const realisedUsd = bundleBaselinePnlUsd + overridesTotalUsd;

  return (
    <Card
      className={cn("border-border/50 bg-gradient-to-br from-background to-muted/15", className)}
      data-testid="explain-attribution-panel"
    >
      <CardContent className="p-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Calculator className="size-3.5 text-cyan-400" aria-hidden />
            <h3 className="text-sm font-semibold tracking-tight">Performance attribution — bundle + overrides</h3>
          </div>
          <Badge variant="outline" className="text-[9px] font-mono">
            §4.8.3 — overrides surfaced by contract
          </Badge>
        </div>

        <p className="text-[11px] leading-snug text-muted-foreground">
          Realised P&L = bundle baseline + active runtime overrides. Hiding overrides is forbidden — every basis point
          of P&L from a live mutation appears in this column with the audit reference.
        </p>

        {/* Three-column attribution */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr_auto_1fr] gap-2.5 items-stretch">
          {/* Column 1: Bundle baseline */}
          <div
            className="rounded border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-2"
            data-testid="attribution-bundle-column"
          >
            <div className="flex items-center gap-2">
              <Layers className="size-3.5 text-emerald-400" aria-hidden />
              <span className="text-[10px] uppercase tracking-wider text-emerald-300">Bundle baseline</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Approved {bundle.releaseId} ({bundle.promotionStatus})
            </p>
            <div className="text-2xl font-mono font-semibold text-emerald-300">{fmtUsd(bundleBaselinePnlUsd)}</div>
            <p className="text-[10px] leading-snug text-emerald-300/70">
              What the immutable bundle would have produced with zero runtime mutations.
            </p>
          </div>

          <div className="hidden lg:flex items-center justify-center">
            <Plus className="size-5 text-muted-foreground/60" aria-hidden />
          </div>

          {/* Column 2: Override deltas */}
          <div
            className="rounded border border-amber-500/30 bg-amber-500/5 p-3 space-y-2"
            data-testid="attribution-overrides-column"
          >
            <div className="flex items-center gap-2">
              <Sparkle className="size-3.5 text-amber-400" aria-hidden />
              <span className="text-[10px] uppercase tracking-wider text-amber-300">Override deltas</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {rows.length} active override{rows.length === 1 ? "" : "s"}
            </p>
            <div
              className={cn(
                "text-2xl font-mono font-semibold",
                overridesTotalUsd >= 0 ? "text-emerald-300" : "text-rose-300",
              )}
            >
              {fmtUsd(overridesTotalUsd)}
            </div>
            <ul className="space-y-1 pt-1 border-t border-amber-500/20">
              {rows.length === 0 ? (
                <li className="text-[10px] text-muted-foreground/70 italic">No active overrides during this period.</li>
              ) : (
                rows.map((r) => <OverrideRow key={r.override.overrideId} row={r} />)
              )}
            </ul>
          </div>

          <div className="hidden lg:flex items-center justify-center">
            <ArrowRight className="size-5 text-muted-foreground/60" aria-hidden />
          </div>

          {/* Column 3: Realised */}
          <div
            className="rounded border border-cyan-500/30 bg-cyan-500/5 p-3 space-y-2"
            data-testid="attribution-realised-column"
          >
            <div className="flex items-center gap-2">
              {realisedUsd >= 0 ? (
                <TrendingUp className="size-3.5 text-cyan-400" aria-hidden />
              ) : (
                <TrendingDown className="size-3.5 text-rose-400" aria-hidden />
              )}
              <span className="text-[10px] uppercase tracking-wider text-cyan-300">Realised P&L</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {bundle.shareClass} · {bundle.accountOrMandateId}
            </p>
            <div
              className={cn("text-2xl font-mono font-semibold", realisedUsd >= 0 ? "text-cyan-300" : "text-rose-300")}
            >
              {fmtUsd(realisedUsd)}
            </div>
            <p className="text-[10px] leading-snug text-cyan-300/70">
              What actually happened — bundle + overrides, reconciled against fills.
            </p>
          </div>
        </div>

        {/* Detailed reconciliation row */}
        <div
          className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-border/40 font-mono text-[10px]"
          data-testid="attribution-reconciliation-row"
        >
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground/70">bundle:</span>
            <span className={bundleBaselinePnlUsd >= 0 ? "text-emerald-300" : "text-rose-300"}>
              {fmtUsd(bundleBaselinePnlUsd)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Plus className="size-3 text-muted-foreground/50" aria-hidden />
            <span className="text-muted-foreground/70">overrides:</span>
            <span className={overridesTotalUsd >= 0 ? "text-emerald-300" : "text-rose-300"}>
              {fmtUsd(overridesTotalUsd)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Minus className="size-3 text-muted-foreground/50 rotate-90" aria-hidden />
            <span className="text-muted-foreground/70">= realised:</span>
            <span className={realisedUsd >= 0 ? "text-cyan-300" : "text-rose-300"}>{fmtUsd(realisedUsd)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function OverrideRow({ row }: { readonly row: OverrideAttributionRow }) {
  const positive = row.pnlDeltaUsd >= 0;
  return (
    <li
      className="space-y-0.5"
      data-testid={`attribution-override-row-${row.override.overrideId}`}
      data-override-type={row.override.overrideType}
    >
      <div className="flex items-center justify-between gap-1.5">
        <span className="font-mono text-[9px] text-amber-200/90 truncate">{row.override.overrideType}</span>
        <span className={cn("font-mono text-[10px]", positive ? "text-emerald-300" : "text-rose-300")}>
          {fmtUsd(row.pnlDeltaUsd)}
        </span>
      </div>
      <p className="text-[9px] leading-snug text-muted-foreground/70 truncate">{row.note}</p>
    </li>
  );
}
