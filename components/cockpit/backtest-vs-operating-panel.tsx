"use client";

/**
 * BacktestVsOperatingPanel — visualises the Odum USP claim.
 *
 * Per dart_ux_cockpit_refactor_2026_04_29.plan.md §4.9:
 *
 *   "A normal backtest answers 'did the signal make money on historical
 *    prices?'. DART must answer 'would this strategy still work after
 *    execution costs, gas fees, treasury movement, portfolio rebalancing,
 *    liquidation risk, client deposits and withdrawals, venue constraints,
 *    routing rules, risk limits, and reporting assumptions are applied?'"
 *
 * This panel renders the side-by-side: signal-only Sharpe + return vs
 * operating-adjusted Sharpe + return, with a per-layer attribution column
 * showing which assumption layer ate which basis points.
 *
 * Surfaced in Research/Validate. Demo numbers — production wires this to
 * the simulation-service stream.
 */

import * as React from "react";
import { ArrowRight, Sigma, TrendingDown, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { AssumptionLayerKey } from "@/lib/architecture-v2/assumption-stack";
import { cn } from "@/lib/utils";

interface BacktestVsOperatingPanelProps {
  readonly className?: string;
  /** Headline backtest stats — signal-only, no operating costs. */
  readonly backtest?: BacktestSnapshot;
  /** Operating-adjusted stats — what survives after the assumption stack. */
  readonly operating?: BacktestSnapshot;
  /** Per-layer cost-of-reality attribution in basis points (signed). */
  readonly attribution?: ReadonlyArray<{ layer: AssumptionLayerKey; deltaBps: number; note: string }>;
}

interface BacktestSnapshot {
  readonly annualisedReturnPct: number;
  readonly sharpe: number;
  readonly maxDrawdownPct: number;
  readonly hitRatePct: number;
  readonly trades: number;
}

const DEFAULT_BACKTEST: BacktestSnapshot = {
  annualisedReturnPct: 22.6,
  sharpe: 2.4,
  maxDrawdownPct: 4.2,
  hitRatePct: 64,
  trades: 1840,
};

const DEFAULT_OPERATING: BacktestSnapshot = {
  annualisedReturnPct: 14.1,
  sharpe: 1.55,
  maxDrawdownPct: 5.8,
  hitRatePct: 58,
  trades: 1840,
};

const DEFAULT_ATTRIBUTION: ReadonlyArray<{ layer: AssumptionLayerKey; deltaBps: number; note: string }> = [
  { layer: "execution", deltaBps: -310, note: "Slippage + commission across 1,840 trades" },
  { layer: "gas_fees", deltaBps: -180, note: "ETH+L2 gas across DeFi legs (assumed 18 gwei base)" },
  { layer: "liquidation", deltaBps: -90, note: "Reserved buffer to avoid forced rebalance" },
  { layer: "client_flows", deltaBps: -110, note: "15% liquidity buffer to absorb redemptions" },
  { layer: "treasury", deltaBps: -65, note: "Hedge ratio + leverage cap drag" },
  { layer: "venue_routing", deltaBps: -45, note: "SOR routing tax (avoiding venue concentration)" },
  { layer: "risk", deltaBps: -30, note: "Hard limit clipping on tail-event days" },
  { layer: "reporting", deltaBps: 0, note: "Reporting basis itself is P&L-neutral" },
];

const LAYER_LABEL: Partial<Record<AssumptionLayerKey, string>> = {
  execution: "Execution",
  gas_fees: "Gas",
  treasury: "Treasury",
  client_flows: "Client flows",
  liquidation: "Liquidation",
  portfolio_rebalance: "Portfolio",
  venue_routing: "Routing",
  risk: "Risk limits",
  reporting: "Reporting",
};

const fmtBps = (n: number): string => (n >= 0 ? `+${n} bps` : `${n} bps`);

export function BacktestVsOperatingPanel({
  className,
  backtest = DEFAULT_BACKTEST,
  operating = DEFAULT_OPERATING,
  attribution = DEFAULT_ATTRIBUTION,
}: BacktestVsOperatingPanelProps) {
  const totalBpsLost = attribution.reduce((sum, row) => sum + row.deltaBps, 0);

  return (
    <Card
      className={cn("border-border/50 bg-gradient-to-br from-background to-muted/15", className)}
      data-testid="backtest-vs-operating-panel"
    >
      <CardContent className="p-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sigma className="size-3.5 text-cyan-400" aria-hidden />
            <h3 className="text-sm font-semibold tracking-tight">Backtest vs operating simulation</h3>
          </div>
          <Badge variant="outline" className="text-[9px] font-mono">
            §4.9 — assumption-complete sim
          </Badge>
        </div>

        <p className="text-[11px] leading-snug text-muted-foreground">
          A signal that prints money on historical prices is not a strategy. The right column shows what survives after
          every assumption layer is applied — execution, gas, treasury, liquidation, client flows, routing, risk, and
          reporting basis.
        </p>

        {/* Three-column comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-3 items-stretch">
          <SnapshotCard
            label="Signal-only backtest"
            tone="emerald"
            snapshot={backtest}
            note="Historical prices only. No execution, no gas, no treasury, no client flows. Naive."
          />
          <div className="hidden lg:flex items-center justify-center" aria-hidden>
            <ArrowRight className="size-5 text-muted-foreground/60" />
          </div>
          <SnapshotCard
            label="Operating-adjusted simulation"
            tone="cyan"
            snapshot={operating}
            note="Same signal, applied through the full 9-layer assumption stack. This is what live actually has to clear."
          />
        </div>

        {/* Attribution rows */}
        <section className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between gap-2 px-0.5">
            <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
              Cost of reality (per layer)
            </h4>
            <span className="text-[10px] font-mono" data-testid="cost-of-reality-total">
              total:{" "}
              <span className={totalBpsLost < 0 ? "text-rose-300" : "text-emerald-300"}>{fmtBps(totalBpsLost)}</span>
            </span>
          </div>
          <ul className="space-y-1" data-testid="cost-of-reality-rows">
            {attribution.map((row) => {
              const positive = row.deltaBps >= 0;
              return (
                <li
                  key={row.layer}
                  className="flex items-center justify-between gap-2 rounded border border-border/30 bg-muted/5 px-2 py-1"
                  data-testid={`cost-of-reality-${row.layer}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[11px] font-medium text-foreground/90 w-24 truncate shrink-0">
                      {LAYER_LABEL[row.layer] ?? row.layer}
                    </span>
                    <span className="text-[10px] text-muted-foreground/80 truncate">{row.note}</span>
                  </div>
                  <span
                    className={cn("text-[10px] font-mono shrink-0", positive ? "text-emerald-300" : "text-rose-300")}
                  >
                    {fmtBps(row.deltaBps)}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      </CardContent>
    </Card>
  );
}

function SnapshotCard({
  label,
  tone,
  snapshot,
  note,
}: {
  readonly label: string;
  readonly tone: "emerald" | "cyan";
  readonly snapshot: BacktestSnapshot;
  readonly note: string;
}) {
  const toneClass =
    tone === "emerald"
      ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-300"
      : "border-cyan-500/30 bg-cyan-500/5 text-cyan-300";
  const sharpeIcon = snapshot.sharpe >= 2 ? TrendingUp : TrendingDown;
  const SharpeIcon = sharpeIcon;
  return (
    <div className={cn("rounded border p-3 space-y-2", toneClass)} data-testid={`snapshot-${tone}`}>
      <div className="flex items-center gap-1.5">
        <SharpeIcon className="size-3.5" aria-hidden />
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Annualised return" value={`${snapshot.annualisedReturnPct.toFixed(1)}%`} />
        <Stat label="Sharpe" value={snapshot.sharpe.toFixed(2)} />
        <Stat label="Max drawdown" value={`${snapshot.maxDrawdownPct.toFixed(1)}%`} />
        <Stat label="Hit rate" value={`${snapshot.hitRatePct}%`} />
      </div>
      <p className="text-[10px] text-foreground/70 leading-snug pt-1 border-t border-current/15">{note}</p>
    </div>
  );
}

function Stat({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground/60">{label}</p>
      <p className="text-base font-mono font-semibold">{value}</p>
    </div>
  );
}
