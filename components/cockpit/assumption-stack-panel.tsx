"use client";

/**
 * AssumptionStackPanel — visualises the 9-layer Odum AssumptionStack inline
 * in the cockpit shell.
 *
 * Per dart_ux_cockpit_refactor_2026_04_29.plan §4.9 (the assumption-stack
 * USP layer):
 *
 *   "Most platforms backtest signals. DART simulates the operating system
 *    around the strategy. Execution, gas, treasury, liquidation, client
 *    flows, routing, portfolio rebalancing, and reporting assumptions are
 *    versioned into the strategy lifecycle, then carried from research
 *    into paper and live trading."
 *
 * Surfaces:
 *   - Research/Validate           — author / edit assumptions before promotion
 *   - Research/Promote            — frozen stack inside the bundle
 *   - Terminal/Explain            — bundle + active overrides + assumption drift
 *
 * Behaviour: each of the 9 layers gets its own status pill (`complete` /
 * `partial` / `missing` / `not_applicable`). The headline `SimulationReadinessScore`
 * tells the user "is this strategy ready for promotion?" without leaking the
 * underlying config shape. A drift report (when supplied) shows per-layer
 * deviation — answers "is live behaving like the simulation said it would?"
 */

import {
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Database,
  FileBarChart,
  GitBranch,
  Layers,
  Network,
  ShieldCheck,
  Sliders,
  TrendingDown,
  TrendingUp,
  Wallet,
  Wrench,
  Zap
} from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  evaluateSimulationReadiness,
  type AssumptionDriftReport,
  type AssumptionLayerKey,
  type AssumptionStack,
  type LayerReadiness,
} from "@/lib/architecture-v2/assumption-stack";
import { cn } from "@/lib/utils";

const LAYER_LABEL: Record<AssumptionLayerKey, string> = {
  execution: "Execution",
  gas_fees: "Gas / chain costs",
  treasury: "Treasury policy",
  client_flows: "Deposits / withdrawals",
  liquidation: "Liquidation & margin",
  portfolio_rebalance: "Portfolio rebalance",
  venue_routing: "Venue routing",
  risk: "Risk limits",
  reporting: "Reporting basis",
};

const LAYER_ICON: Record<AssumptionLayerKey, React.ComponentType<{ className?: string }>> = {
  execution: Zap,
  gas_fees: Cpu,
  treasury: Wallet,
  client_flows: Database,
  liquidation: ShieldCheck,
  portfolio_rebalance: Sliders,
  venue_routing: Network,
  risk: AlertTriangle,
  reporting: FileBarChart,
};

const READINESS_TONE: Record<LayerReadiness, string> = {
  complete: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  partial: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  missing: "border-rose-500/40 bg-rose-500/10 text-rose-300",
  not_applicable: "border-border/40 bg-muted/15 text-muted-foreground/70",
};

const READINESS_LABEL: Record<LayerReadiness, string> = {
  complete: "complete",
  partial: "partial",
  missing: "missing",
  not_applicable: "n/a",
};

interface AssumptionStackPanelProps {
  readonly stack: AssumptionStack;
  readonly drift?: AssumptionDriftReport;
  readonly className?: string;
}

export function AssumptionStackPanel({ stack, drift, className }: AssumptionStackPanelProps) {
  const readiness = React.useMemo(() => evaluateSimulationReadiness(stack), [stack]);

  const allLayers: readonly AssumptionLayerKey[] = [
    "execution",
    "gas_fees",
    "treasury",
    "client_flows",
    "liquidation",
    "portfolio_rebalance",
    "venue_routing",
    "risk",
    "reporting",
  ];

  return (
    <Card
      className={cn("border-border/50 bg-gradient-to-br from-background to-muted/15", className)}
      data-testid="assumption-stack-panel"
      data-stack-id={stack.id}
      data-readiness-score={readiness.score}
    >
      <CardContent className="p-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers className="size-3.5 text-cyan-400" aria-hidden />
            <h3 className="text-sm font-semibold tracking-tight">Assumption stack</h3>
            <Badge variant="outline" className="text-[9px] font-mono">
              v{stack.version}
            </Badge>
          </div>
          <SimulationReadinessBadge score={readiness.score} blockers={readiness.blockers.length} />
        </div>

        <p className="text-[11px] leading-snug text-muted-foreground">
          The full operating environment this strategy was simulated under. Every layer is content-hashed and carried
          with the bundle from research → paper → live. Backtest-to-live continuity with real operating assumptions.
        </p>

        {/* 3 × 3 grid of layer chips */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2" data-testid="assumption-stack-layers">
          {allLayers.map((layer) => {
            const status = readiness.perLayer[layer];
            const Icon = LAYER_ICON[layer];
            const driftDelta = drift?.perLayerDrift[layer];
            const isAlert = drift?.alerts.includes(layer) ?? false;
            return (
              <div
                key={layer}
                className={cn("rounded border p-2 space-y-1", READINESS_TONE[status])}
                data-testid={`assumption-layer-${layer}`}
                data-readiness={status}
                data-alert={isAlert}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Icon className="size-3 shrink-0" aria-hidden />
                    <span className="text-[11px] font-semibold tracking-tight truncate">{LAYER_LABEL[layer]}</span>
                  </div>
                  <Badge variant="outline" className="text-[9px] font-mono border-current/40 bg-transparent">
                    {READINESS_LABEL[status]}
                  </Badge>
                </div>
                <p className="text-[10px] text-foreground/70 leading-snug">{layerSummary(stack, layer)}</p>
                {driftDelta !== undefined && status !== "not_applicable" ? (
                  <div className="flex items-center gap-1 pt-0.5 border-t border-current/10">
                    <span className="text-[9px] font-mono text-muted-foreground/70">drift:</span>
                    <span
                      className={cn(
                        "text-[10px] font-mono",
                        driftDelta > 1 ? "text-rose-300" : driftDelta < -1 ? "text-cyan-300" : "text-emerald-300",
                      )}
                    >
                      {driftDelta > 0 ? "+" : ""}
                      {driftDelta.toFixed(1)}
                    </span>
                    {isAlert ? <AlertTriangle className="size-2.5 text-amber-400" aria-hidden /> : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        {/* Footer — provenance + change-detection cue */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-border/30 text-[9px] font-mono text-muted-foreground/80">
          <div className="flex items-center gap-1.5">
            <GitBranch className="size-2.5" aria-hidden />
            <span>{stack.id}</span>
            <span aria-hidden className="text-muted-foreground/30">
              ·
            </span>
            <span title={stack.hash}>{stack.hash.slice(0, 22)}…</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Wrench className="size-2.5" aria-hidden />
            <span>created by {stack.createdBy}</span>
            <span aria-hidden className="text-muted-foreground/30">
              ·
            </span>
            <span>{new Date(stack.createdAt).toISOString().slice(0, 10)}</span>
          </div>
        </div>

        {drift !== undefined ? <DriftSummary drift={drift} /> : null}
      </CardContent>
    </Card>
  );
}

function SimulationReadinessBadge({ score, blockers }: { readonly score: number; readonly blockers: number }) {
  const tone =
    score >= 95
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
      : score >= 70
        ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
        : "border-rose-500/40 bg-rose-500/10 text-rose-300";
  return (
    <Badge
      variant="outline"
      className={cn("text-[10px] font-mono inline-flex items-center gap-1", tone)}
      data-testid="simulation-readiness-score"
      data-score={score}
    >
      {blockers === 0 ? (
        <CheckCircle2 className="size-3" aria-hidden />
      ) : (
        <AlertTriangle className="size-3" aria-hidden />
      )}
      simulation readiness {score}%
      {blockers > 0 ? (
        <span className="text-rose-300/80">
          · {blockers} blocker{blockers === 1 ? "" : "s"}
        </span>
      ) : null}
    </Badge>
  );
}

function DriftSummary({ drift }: { readonly drift: AssumptionDriftReport }) {
  const tone =
    drift.adherenceScore >= 90
      ? "border-emerald-500/30 bg-emerald-500/5"
      : drift.adherenceScore >= 75
        ? "border-amber-500/30 bg-amber-500/5"
        : "border-rose-500/30 bg-rose-500/5";
  return (
    <div
      className={cn("rounded border px-2.5 py-1.5 flex items-center justify-between gap-2", tone)}
      data-testid="assumption-drift-summary"
      data-adherence={drift.adherenceScore}
    >
      <div className="flex items-center gap-1.5 text-[10px]">
        {drift.adherenceScore >= 90 ? (
          <TrendingUp className="size-3.5 text-emerald-300" aria-hidden />
        ) : (
          <TrendingDown className="size-3.5 text-amber-300" aria-hidden />
        )}
        <span className="uppercase tracking-wider text-muted-foreground/70">live drift vs simulation</span>
        <span className="font-mono">adherence {drift.adherenceScore}/100</span>
      </div>
      {drift.alerts.length > 0 ? (
        <div className="flex items-center gap-1 text-[9px] text-amber-300">
          <AlertTriangle className="size-3" aria-hidden />
          {drift.alerts.length} layer{drift.alerts.length === 1 ? "" : "s"} drifting
        </div>
      ) : (
        <span className="text-[9px] text-emerald-300 inline-flex items-center gap-1">
          <CheckCircle2 className="size-3" aria-hidden />
          live tracking simulation
        </span>
      )}
    </div>
  );
}

function layerSummary(stack: AssumptionStack, layer: AssumptionLayerKey): string {
  switch (layer) {
    case "execution": {
      const e = stack.executionAssumptions;
      return `${e.slippageBps} bps · ${e.latencyMs}ms · ${e.slippageModel}`;
    }
    case "gas_fees":
      return stack.gasFeeAssumptions
        ? `${stack.gasFeeAssumptions.baseFeeGwei}+${stack.gasFeeAssumptions.priorityFeeGwei} gwei · ${stack.gasFeeAssumptions.chainIds.length} chain(s)`
        : "—";
    case "treasury":
      return `${stack.treasuryPolicy.shareClass} · max ${stack.treasuryPolicy.maxGrossLeverage}× gross`;
    case "client_flows":
      return stack.depositWithdrawalAssumptions
        ? `${(stack.depositWithdrawalAssumptions.redemptionStress.pct * 100).toFixed(0)}% in ${stack.depositWithdrawalAssumptions.redemptionStress.days}d stress`
        : "—";
    case "liquidation":
      return stack.liquidationAssumptions
        ? `${(stack.liquidationAssumptions.maintenanceMarginPct * 100).toFixed(0)}% maint · ${(stack.liquidationAssumptions.priceShockPct * 100).toFixed(0)}% shock`
        : "—";
    case "portfolio_rebalance":
      return stack.portfolioRebalanceAssumptions
        ? `${stack.portfolioRebalanceAssumptions.method} · ${stack.portfolioRebalanceAssumptions.cadence}`
        : "—";
    case "venue_routing":
      return `${stack.venueRoutingAssumptions.mode} · ${stack.venueRoutingAssumptions.approvedVenues.length} venues`;
    case "risk":
      return `max DD ${(stack.riskAssumptions.maxDrawdownPct * 100).toFixed(0)}% · max conc ${(stack.riskAssumptions.maxConcentrationPct * 100).toFixed(0)}%`;
    case "reporting":
      return `${stack.reportingAssumptions.pnlBasis} · ${stack.reportingAssumptions.navFrequency} NAV`;
  }
}
