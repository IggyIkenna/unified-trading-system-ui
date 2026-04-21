"use client";

import { TerminalDataProvider } from "@/components/widgets/terminal/terminal-data-context";
import { WidgetGrid } from "@/components/widgets/widget-grid";
import { useTerminalPageData } from "@/components/widgets/terminal/use-terminal-page-data";
import { AlertTriangle, ShieldAlert } from "lucide-react";

import { FamilyArchetypePicker } from "@/components/architecture-v2";
import { HealthBar } from "@/components/platform/health-bar";
import type {
  StrategyArchetype,
  StrategyFamily,
} from "@/lib/architecture-v2";
import { useGlobalScope } from "@/lib/stores/global-scope-store";

export default function TradingPage() {
  const { terminalData, errors } = useTerminalPageData();
  const strategyFamily = useGlobalScope((s) => s.scope.strategyFamily);
  const strategyArchetype = useGlobalScope((s) => s.scope.strategyArchetype);
  const setStrategyFamily = useGlobalScope((s) => s.setStrategyFamily);
  const setStrategyArchetype = useGlobalScope((s) => s.setStrategyArchetype);

  return (
    <div className="h-full bg-background flex flex-col">
      {/*
        Phase 11 reposition — terminal is analytics + reconciliation first.
        Manual execution is emergency-only. See codex:
        unified-trading-pm/codex/09-strategy/architecture-v2/dart-tab-structure.md § 5.
      */}
      <div
        className="flex items-start gap-3 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-200"
        data-testid="trading-terminal-emergency-banner"
      >
        <ShieldAlert className="size-4 shrink-0 mt-0.5 text-amber-400" aria-hidden />
        <span>
          <strong className="text-amber-100">Analytics + Reconciliation surface.</strong> Manual
          trading is for emergency use only — routine execution runs through strategy schedulers.
          The Family / Archetype picker below scopes all views. Manual-order actions are
          audit-logged.
        </span>
      </div>
      {(errors.tickers || errors.positions || errors.alerts) && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive mx-4 mt-4">
          <AlertTriangle className="size-4 shrink-0" />
          <span>
            Some data failed to load
            {errors.tickers ? " (tickers)" : ""}
            {errors.positions ? " (positions)" : ""}
            {errors.alerts ? " (alerts)" : ""}. Parts of the terminal may show stale or missing data.
          </span>
        </div>
      )}
      {/* System health strip — DART-scoped overview. Moved here from /dashboard
          2026-04-21 per user directive: health signals are DART-relevant only. */}
      <div
        className="flex items-center gap-3 border-b bg-muted/10 px-4 py-2"
        data-testid="trading-terminal-health-strip"
      >
        <HealthBar />
      </div>
      <div
        className="flex items-center gap-3 border-b bg-muted/10 px-4 py-2 text-xs text-muted-foreground"
        data-testid="trading-terminal-family-archetype-scope"
      >
        <span className="font-medium uppercase tracking-wide">Scope</span>
        <FamilyArchetypePicker
          idPrefix="trading-terminal"
          availabilityFilter="allowed"
          value={{
            family: strategyFamily as StrategyFamily | undefined,
            archetype: strategyArchetype as StrategyArchetype | undefined,
          }}
          onChange={(next) => {
            setStrategyFamily(next.family);
            setStrategyArchetype(next.archetype);
          }}
        />
      </div>
      <div className="flex-1 overflow-auto p-2">
        <TerminalDataProvider value={terminalData}>
          <WidgetGrid tab="terminal" />
        </TerminalDataProvider>
      </div>
    </div>
  );
}
