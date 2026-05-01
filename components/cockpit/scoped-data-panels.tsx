"use client";

/**
 * Scoped data panels — every cockpit panel here reads through
 * `resolveTierZeroScenario(scope)` so toggling any chip on the DartScopeBar
 * visibly changes the rows.
 *
 * Per the audit:
 *
 *   "Every filter/dropdown/button should do one of four things:
 *     1. Filter real mock data and visibly change rows/cards/charts.
 *     2. Change the active workflow state.
 *     3. Show a clear empty state.
 *     4. Show a clear unsupported state.
 *    It should never silently do nothing."
 *
 * This file ships:
 *   - <ScopedStrategyTablePanel />   — strategy instances filtered by scope
 *   - <ScopedPositionsPanel />        — open positions filtered by scope
 *   - <ScopedBacktestsPanel />        — historical backtest summaries
 *   - <ScopedReleaseBundlesPanel />   — release bundles in scope
 *   - <ScopeStatusBanner />           — empty / unsupported / partial match
 *
 * Mounted on Terminal/Command + Terminal/Strategies + Research/Validate.
 */

import * as React from "react";
import { AlertTriangle, Eye, FileText, ListTree, ServerOff, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { resolveTierZeroScenario, suggestNearestScenarios } from "@/lib/mocks/tier-zero-scenario";
import { useWorkspaceScope } from "@/lib/stores/workspace-scope-store";
import { cn } from "@/lib/utils";

const fmtUsd = (n: number): string => {
  const sign = n >= 0 ? "+" : "−";
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}K`;
  return `${sign}$${abs.toFixed(0)}`;
};

const fmtNotional = (n: number): string => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// ScopeStatusBanner — surfaces empty / unsupported / partial-match cleanly
// ─────────────────────────────────────────────────────────────────────────────

export function ScopeStatusBanner({ className }: { readonly className?: string }) {
  const scope = useWorkspaceScope();
  const view = React.useMemo(() => resolveTierZeroScenario(scope), [scope]);

  if (view.status === "match") return null;

  const suggestions = view.status === "unsupported" ? suggestNearestScenarios(scope, 3) : [];

  return (
    <Card
      className={cn(
        "border-amber-500/30 bg-amber-500/5",
        view.status === "unsupported" && "border-rose-500/30 bg-rose-500/5",
        className,
      )}
      data-testid="scope-status-banner"
      data-status={view.status}
    >
      <CardContent className="p-2.5 flex flex-wrap items-start gap-3">
        <div className="flex items-center gap-2">
          {view.status === "unsupported" ? (
            <ServerOff className="size-4 text-rose-400" aria-hidden />
          ) : (
            <AlertTriangle className="size-4 text-amber-400" aria-hidden />
          )}
          <div className="space-y-0.5">
            <p className="text-xs font-semibold tracking-tight">
              {view.status === "unsupported"
                ? "Combination not available in Tier Zero demo"
                : view.status === "partial_match"
                  ? "No rows match the current chip combination"
                  : "No data in scope"}
            </p>
            <p className="text-[11px] text-muted-foreground/80">
              {view.status === "unsupported"
                ? "Pick a closer scenario or clear chips that aren't covered by Tier Zero."
                : view.status === "partial_match"
                  ? "Scope axes overlap a scenario but the chip combination filtered every row out."
                  : "Try selecting a preset to populate the cockpit."}
            </p>
          </div>
        </div>
        {suggestions.length > 0 ? (
          <div className="flex items-center gap-1 text-[10px] font-mono ml-auto">
            <span className="text-muted-foreground/70">try:</span>
            {suggestions.map((sc) => (
              <Badge
                key={sc.id}
                variant="outline"
                className="text-[9px] font-mono"
                data-testid={`scope-suggestion-${sc.id}`}
              >
                {sc.label}
              </Badge>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Strategy table — filters by every scope axis
// ─────────────────────────────────────────────────────────────────────────────

const MATURITY_TONE: Record<string, string> = {
  smoke: "border-zinc-500/40 bg-zinc-500/10 text-zinc-300",
  backtest_30d: "border-zinc-500/40 bg-zinc-500/10 text-zinc-300",
  paper_1d: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  paper_14d: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  pilot: "border-violet-500/40 bg-violet-500/10 text-violet-300",
  live_stable: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
};

const STATUS_TONE: Record<string, string> = {
  live: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  paper: "border-sky-500/40 bg-sky-500/10 text-sky-300",
  paused: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  candidate: "border-zinc-500/40 bg-zinc-500/10 text-zinc-300",
};

export function ScopedStrategyTablePanel({ className }: { readonly className?: string }) {
  const scope = useWorkspaceScope();
  const view = React.useMemo(() => resolveTierZeroScenario(scope), [scope]);

  return (
    <Card
      className={cn("border-border/50 bg-gradient-to-br from-background to-muted/15", className)}
      data-testid="scoped-strategy-table"
      data-status={view.status}
      data-row-count={view.strategies.length}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ListTree className="size-3.5 text-cyan-400" aria-hidden />
            <h3 className="text-sm font-semibold tracking-tight">Strategies in scope</h3>
            <Badge variant="outline" className="text-[9px] font-mono">
              {view.strategies.length} of {view.matchedScenarios.flatMap((s) => s.strategies).length || 0}
            </Badge>
          </div>
          <Badge variant="secondary" className="text-[9px] font-mono">
            {view.matchedScenarios.length} scenario{view.matchedScenarios.length === 1 ? "" : "s"} matched
          </Badge>
        </div>

        {view.status === "unsupported" || view.status === "partial_match" ? (
          <ScopeStatusBanner />
        ) : view.strategies.length === 0 ? (
          <p className="text-[10px] text-muted-foreground/60 italic" data-testid="scoped-strategy-table-empty">
            No strategies in scope. Pick a preset or clear chips.
          </p>
        ) : (
          <ul className="space-y-1">
            {view.strategies.map((s) => (
              <li
                key={s.id}
                className="rounded border border-border/40 bg-muted/5 px-2 py-1.5"
                data-testid={`scoped-strategy-row-${s.id}`}
                data-asset-group={s.assetGroup}
                data-family={s.family}
                data-archetype={s.archetype}
                data-share-class={s.shareClass}
                data-venue={s.venue}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                    <span className="text-xs font-semibold tracking-tight truncate">{s.label}</span>
                    <Badge variant="secondary" className="text-[9px] font-mono">
                      {s.assetGroup}
                    </Badge>
                    <Badge variant="secondary" className="text-[9px] font-mono">
                      {s.venue}
                    </Badge>
                    <Badge variant="secondary" className="text-[9px] font-mono">
                      {s.shareClass}
                    </Badge>
                    <Badge variant="outline" className={cn("text-[9px] font-mono", MATURITY_TONE[s.maturity])}>
                      {s.maturity}
                    </Badge>
                    <Badge variant="outline" className={cn("text-[9px] font-mono", STATUS_TONE[s.status])}>
                      {s.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 text-[10px] font-mono">
                    <span className="text-muted-foreground/70">NAV {fmtNotional(s.nav)}</span>
                    <span className={s.mtdPnlUsd >= 0 ? "text-emerald-300" : "text-rose-300"}>
                      MTD {fmtUsd(s.mtdPnlUsd)}
                    </span>
                  </div>
                </div>
                <p className="text-[9px] text-muted-foreground/60 mt-0.5">
                  {s.archetype} · {s.family}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Positions panel — filters by every scope axis
// ─────────────────────────────────────────────────────────────────────────────

export function ScopedPositionsPanel({ className }: { readonly className?: string }) {
  const scope = useWorkspaceScope();
  const view = React.useMemo(() => resolveTierZeroScenario(scope), [scope]);

  return (
    <Card
      className={cn("border-border/50 bg-gradient-to-br from-background to-muted/15", className)}
      data-testid="scoped-positions-panel"
      data-row-count={view.positions.length}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-3.5 text-emerald-400" aria-hidden />
            <h3 className="text-sm font-semibold tracking-tight">Open positions in scope</h3>
            <Badge variant="outline" className="text-[9px] font-mono">
              {view.positions.length}
            </Badge>
          </div>
        </div>
        {view.positions.length === 0 ? (
          <p className="text-[10px] text-muted-foreground/60 italic" data-testid="scoped-positions-empty">
            No open positions in scope.
          </p>
        ) : (
          <ul className="space-y-1">
            {view.positions.map((p) => (
              <li
                key={p.id}
                className="rounded border border-border/40 bg-muted/5 px-2 py-1.5 flex items-center justify-between gap-2"
                data-testid={`scoped-position-row-${p.id}`}
                data-asset-group={p.assetGroup}
                data-venue={p.venue}
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[9px] font-mono",
                      p.side === "long" ? "border-emerald-500/40 text-emerald-300" : "border-rose-500/40 text-rose-300",
                    )}
                  >
                    {p.side}
                  </Badge>
                  <span className="text-xs font-mono">{p.symbol}</span>
                  <Badge variant="secondary" className="text-[9px] font-mono">
                    {p.assetGroup}
                  </Badge>
                  <Badge variant="secondary" className="text-[9px] font-mono">
                    {p.venue}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono shrink-0">
                  <span className="text-muted-foreground/70">{fmtNotional(p.notional)}</span>
                  <span className={p.unrealisedPnlUsd >= 0 ? "text-emerald-300" : "text-rose-300"}>
                    {fmtUsd(p.unrealisedPnlUsd)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Backtest summaries panel — Research/Validate side
// ─────────────────────────────────────────────────────────────────────────────

export function ScopedBacktestsPanel({ className }: { readonly className?: string }) {
  const scope = useWorkspaceScope();
  const view = React.useMemo(() => resolveTierZeroScenario(scope), [scope]);

  return (
    <Card
      className={cn("border-border/50 bg-gradient-to-br from-background to-muted/15", className)}
      data-testid="scoped-backtests-panel"
      data-row-count={view.backtests.length}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Eye className="size-3.5 text-cyan-400" aria-hidden />
          <h3 className="text-sm font-semibold tracking-tight">Backtest summaries in scope</h3>
          <Badge variant="outline" className="text-[9px] font-mono">
            {view.backtests.length}
          </Badge>
        </div>
        {view.backtests.length === 0 ? (
          <p className="text-[10px] text-muted-foreground/60 italic" data-testid="scoped-backtests-empty">
            No backtest summaries match this scope.
          </p>
        ) : (
          <ul className="space-y-1">
            {view.backtests.map((b) => (
              <li
                key={b.id}
                className="rounded border border-border/40 bg-muted/5 px-2 py-1.5 flex items-center justify-between gap-2"
                data-testid={`scoped-backtest-row-${b.id}`}
                data-asset-group={b.assetGroup}
                data-archetype={b.archetype}
                data-proof-goal={b.proofGoal}
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                  <Badge variant="secondary" className="text-[9px] font-mono">
                    {b.archetype}
                  </Badge>
                  <Badge variant="outline" className="text-[9px] font-mono">
                    {b.proofGoal}
                  </Badge>
                  <Badge variant="secondary" className="text-[9px] font-mono">
                    {b.assetGroup}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono shrink-0">
                  <span className="text-emerald-300">signal {b.signalSharpe.toFixed(2)}</span>
                  <span className="text-muted-foreground/40">→</span>
                  <span className="text-cyan-300">operating {b.operatingSharpe.toFixed(2)}</span>
                  <span className="text-rose-300">−{b.costOfRealityBps} bps</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Release-bundle summaries — Research/Promote + Terminal/Strategies side
// ─────────────────────────────────────────────────────────────────────────────

export function ScopedReleaseBundlesPanel({ className }: { readonly className?: string }) {
  const scope = useWorkspaceScope();
  const view = React.useMemo(() => resolveTierZeroScenario(scope), [scope]);

  return (
    <Card
      className={cn("border-border/50 bg-gradient-to-br from-background to-muted/15", className)}
      data-testid="scoped-release-bundles-panel"
      data-row-count={view.bundles.length}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <FileText className="size-3.5 text-violet-400" aria-hidden />
          <h3 className="text-sm font-semibold tracking-tight">Release bundles in scope</h3>
          <Badge variant="outline" className="text-[9px] font-mono">
            {view.bundles.length}
          </Badge>
        </div>
        {view.bundles.length === 0 ? (
          <p className="text-[10px] text-muted-foreground/60 italic" data-testid="scoped-release-bundles-empty">
            No release bundles in scope.
          </p>
        ) : (
          <ul className="space-y-1">
            {view.bundles.map((b) => (
              <li
                key={b.releaseId}
                className="rounded border border-border/40 bg-muted/5 px-2 py-1.5 flex items-center justify-between gap-2"
                data-testid={`scoped-bundle-row-${b.releaseId}`}
                data-asset-group={b.assetGroup}
                data-archetype={b.archetype}
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                  <span className="text-[10px] font-mono truncate">{b.releaseId}</span>
                  <Badge variant="secondary" className="text-[9px] font-mono">
                    {b.archetype}
                  </Badge>
                  <Badge variant="secondary" className="text-[9px] font-mono">
                    {b.assetGroup}
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono shrink-0">
                  <Badge variant="outline" className={cn("text-[9px] font-mono", MATURITY_TONE[b.maturityPhase])}>
                    {b.maturityPhase}
                  </Badge>
                  {b.approvedBy ? (
                    <span className="text-muted-foreground/70">by {b.approvedBy}</span>
                  ) : (
                    <span className="text-amber-300/80">pending approval</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
