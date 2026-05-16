"use client";

/**
 * StrategyScenarioTapePanel — runs full strategy lifecycles end-to-end.
 *
 * Per the audit: "have you tried replicating the strategy archetypes e2e —
 * client deposits, decisions, rebalancing, kill switches, alerts e2e
 * across asset groups and venues and archetypes?".
 *
 * 8 scripted scenarios cover all 5 asset groups + 8 archetypes:
 *   ARBITRAGE_PRICE_DISPERSION (CEFI+DEFI), CARRY_BASIS_PERP (CEFI),
 *   YIELD_ROTATION_LENDING (DEFI), VOL_TRADING_OPTIONS (CEFI),
 *   ML_DIRECTIONAL_CONTINUOUS (CEFI), EVENT_DRIVEN (SPORTS),
 *   LIQUIDATION_CAPTURE (DEFI), STAT_ARB_PAIRS_FIXED (TRADFI).
 *
 * Each scenario fires its scripted tape via the strategy-scenario-engine
 * which dispatches into useCockpitOpsStore. The tape renders here in
 * reverse-chronological order with type-coded badges and signed P&L
 * impact. Active scenarios show a progress bar (cursor / totalEvents).
 */

import * as React from "react";
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  CircleDot,
  PlayCircle,
  ShieldOff,
  TrendingDown,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCockpitOpsStore, type StrategyEvent } from "@/lib/mocks/cockpit-ops-store";
import {
  ensureScenarioEngineTickerStarted,
  startStrategyScenario,
  STRATEGY_SCENARIOS,
} from "@/lib/mocks/strategy-scenario-engine";
import { cn } from "@/lib/utils";

const KIND_ICON: Record<StrategyEvent["kind"], React.ComponentType<{ className?: string }>> = {
  client_deposit: ArrowDownCircle,
  client_withdrawal: ArrowUpCircle,
  signal_fired: Zap,
  entry_decision: PlayCircle,
  exit_decision: CheckCircle2,
  rebalance: CircleDot,
  alert: AlertTriangle,
  kill_switch_trip: ShieldOff,
  venue_degraded: AlertTriangle,
  drift_warning: TrendingDown,
  settlement: Wallet,
};

const TONE_CLASS: Record<StrategyEvent["tone"], string> = {
  info: "border-cyan-500/30 bg-cyan-500/5",
  success: "border-emerald-500/30 bg-emerald-500/5",
  warn: "border-amber-500/30 bg-amber-500/5",
  error: "border-rose-500/30 bg-rose-500/5",
};

const TONE_TEXT: Record<StrategyEvent["tone"], string> = {
  info: "text-cyan-300",
  success: "text-emerald-300",
  warn: "text-amber-300",
  error: "text-rose-300",
};

interface StrategyScenarioTapePanelProps {
  readonly className?: string;
}

export function StrategyScenarioTapePanel({ className }: StrategyScenarioTapePanelProps) {
  React.useEffect(() => {
    ensureScenarioEngineTickerStarted();
  }, []);
  const events = useCockpitOpsStore((s) => s.strategyEvents);
  const active = useCockpitOpsStore((s) => s.activeScenarios);
  const [selectedScenario, setSelectedScenario] = React.useState<string>(STRATEGY_SCENARIOS[0]?.id ?? "");

  const handleStart = React.useCallback(() => {
    if (selectedScenario) startStrategyScenario(selectedScenario);
  }, [selectedScenario]);

  const totalPnl = React.useMemo(() => {
    return events.reduce((sum, e) => sum + (e.pnlImpactUsd ?? 0), 0);
  }, [events]);

  const groupCount: Record<string, number> = events.reduce<Record<string, number>>((acc, e) => {
    acc[e.assetGroup] = (acc[e.assetGroup] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <Card
      className={cn("border-border/50 bg-gradient-to-br from-background to-muted/15", className)}
      data-testid="strategy-scenario-tape-panel"
    >
      <CardContent className="p-3 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Zap className="size-3.5 text-violet-400" aria-hidden />
            <h3 className="text-sm font-semibold tracking-tight">Strategy lifecycle replay</h3>
            <Badge variant="outline" className="text-[9px] font-mono">
              {STRATEGY_SCENARIOS.length} scenarios across 5 asset groups
            </Badge>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-mono">
            {Object.entries(groupCount).map(([ag, n]) => (
              <Badge
                key={ag}
                variant="secondary"
                className="text-[9px] font-mono"
                data-testid={`scenario-asset-group-${ag}`}
              >
                {ag}: {n}
              </Badge>
            ))}
            {events.length > 0 ? (
              <span
                className={cn("ml-2 font-mono", totalPnl >= 0 ? "text-emerald-300" : "text-rose-300")}
                data-testid="scenario-total-pnl"
              >
                cumulative: {totalPnl >= 0 ? "+" : ""}${totalPnl.toLocaleString()}
              </span>
            ) : null}
          </div>
        </div>

        <p className="text-[11px] leading-snug text-muted-foreground">
          Replays the full strategy lifecycle — client deposits, signal firings, entry decisions, rebalances, drift
          warnings, alerts, exits, and (occasionally) kill-switch trips — across all 5 asset groups and 8 archetypes.
          Each scenario fires step-by-step on the 1s tick.
        </p>

        {/* Scenario picker + Run button */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 items-end">
          <div className="space-y-1">
            <label htmlFor="scenario-select" className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
              Scenario
            </label>
            <Select value={selectedScenario} onValueChange={setSelectedScenario}>
              <SelectTrigger id="scenario-select" className="h-8 text-xs" data-testid="scenario-select-trigger">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STRATEGY_SCENARIOS.map((sc) => (
                  <SelectItem key={sc.id} value={sc.id} className="text-xs" data-testid={`scenario-option-${sc.id}`}>
                    [{sc.assetGroup}] {sc.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" onClick={handleStart} className="h-8 text-xs" data-testid="scenario-run-button">
            <PlayCircle className="size-3 mr-1" aria-hidden />
            Run scenario
          </Button>
        </div>

        {/* Selected scenario blurb */}
        {STRATEGY_SCENARIOS.find((s) => s.id === selectedScenario)?.description ? (
          <p className="text-[10px] text-muted-foreground/70 italic">
            {STRATEGY_SCENARIOS.find((s) => s.id === selectedScenario)?.description}
          </p>
        ) : null}

        {/* Active scenarios — progress strip */}
        {active.length > 0 ? (
          <div className="space-y-1.5" data-testid="scenario-active-list">
            {active.map((sc) => {
              const pct = sc.totalEvents > 0 ? Math.round((sc.cursor / sc.totalEvents) * 100) : 0;
              return (
                <div
                  key={sc.id}
                  className={cn(
                    "rounded border p-2 space-y-1",
                    sc.status === "completed"
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : "border-cyan-500/30 bg-cyan-500/5",
                  )}
                  data-testid={`scenario-active-${sc.id}`}
                  data-status={sc.status}
                  data-cursor={sc.cursor}
                >
                  <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                    <span className="truncate">{sc.label}</span>
                    <span className={sc.status === "completed" ? "text-emerald-300" : "text-cyan-300"}>
                      {sc.cursor} / {sc.totalEvents} · {sc.status}
                    </span>
                  </div>
                  <div className="h-1 w-full rounded-full bg-muted/30 overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all",
                        sc.status === "completed" ? "bg-emerald-400" : "bg-cyan-400",
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        {/* Event tape — newest first */}
        {events.length === 0 ? (
          <p className="text-[10px] text-muted-foreground/60 italic" data-testid="scenario-tape-empty">
            No events yet. Pick a scenario above and click Run scenario.
          </p>
        ) : (
          <ul className="space-y-1.5 max-h-96 overflow-auto" data-testid="scenario-tape-events">
            {events.map((e) => {
              const Icon = KIND_ICON[e.kind] ?? CircleDot;
              return (
                <li
                  key={e.id}
                  className={cn("rounded border px-2 py-1.5 space-y-0.5", TONE_CLASS[e.tone])}
                  data-testid={`scenario-event-${e.id}`}
                  data-kind={e.kind}
                  data-asset-group={e.assetGroup}
                  data-archetype={e.archetype}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Icon className={cn("size-3 shrink-0", TONE_TEXT[e.tone])} aria-hidden />
                      <Badge
                        variant="outline"
                        className={cn("text-[9px] font-mono", TONE_CLASS[e.tone], TONE_TEXT[e.tone])}
                      >
                        {e.kind}
                      </Badge>
                      <Badge variant="secondary" className="text-[9px] font-mono">
                        {e.assetGroup}
                      </Badge>
                      <Badge variant="secondary" className="text-[9px] font-mono">
                        {e.venue}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 text-[9px] font-mono">
                      {e.pnlImpactUsd !== undefined && e.pnlImpactUsd !== 0 ? (
                        <span className={e.pnlImpactUsd >= 0 ? "text-emerald-300" : "text-rose-300"}>
                          {e.pnlImpactUsd >= 0 ? "+" : ""}${e.pnlImpactUsd.toLocaleString()}
                        </span>
                      ) : null}
                      <span className="text-muted-foreground/60">{new Date(e.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-foreground/90 leading-snug">{e.summary}</p>
                  {e.detail ? <p className="text-[9px] text-muted-foreground/70 leading-snug">{e.detail}</p> : null}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
