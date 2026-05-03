"use client";

/**
 * useTierZeroScenario — hook every cockpit widget reads through to get
 * scope-filtered mock data. Migration target for legacy widgets.
 *
 * Per the audit: "Make `StrategyAvailabilityResolver` gate not only the
 * summary panel but actual widget rendering. Ensure every major widget
 * filters its internal rows by `matchesScope(row, scope)` or by the
 * active scenario."
 *
 * The legacy widget tree (`components/widgets/*`) currently consumes its
 * own context-based providers (`useAccountsData`, `useDeFiData`,
 * `usePnLData`, etc). Each widget that gets migrated swaps that consumer
 * for `useTierZeroScenario(scope)` so:
 *   - the rows it shows respect the current chip combination
 *   - empty / unsupported / partial-match states surface explicitly
 *   - swapping persona / chips reshapes every migrated widget at once
 *
 * The legacy providers are kept as compatibility shims so a phased
 * migration is safe — widgets opt in one at a time.
 */

import * as React from "react";

import {
  resolveTierZeroScenario,
  type ResolvedTierZeroView,
  type ScenarioBacktestSummary,
  type ScenarioPosition,
  type ScenarioReleaseBundleSummary,
  type ScenarioStrategyInstance,
} from "@/lib/mocks/tier-zero-scenario";
import { useWorkspaceScope } from "@/lib/stores/workspace-scope-store";

/**
 * Reactive scope-resolved view. Re-runs when the scope changes; widgets
 * that read it re-render with new rows automatically.
 */
export function useTierZeroScenario(): ResolvedTierZeroView {
  const scope = useWorkspaceScope();
  return React.useMemo(() => resolveTierZeroScenario(scope), [scope]);
}

/**
 * Helpful per-collection selectors so callers can subscribe narrowly.
 */
export function useTierZeroStrategies(): readonly ScenarioStrategyInstance[] {
  return useTierZeroScenario().strategies;
}

export function useTierZeroPositions(): readonly ScenarioPosition[] {
  return useTierZeroScenario().positions;
}

export function useTierZeroBacktests(): readonly ScenarioBacktestSummary[] {
  return useTierZeroScenario().backtests;
}

export function useTierZeroBundles(): readonly ScenarioReleaseBundleSummary[] {
  return useTierZeroScenario().bundles;
}

/**
 * True iff the resolved view's status is `match` (rows present and matching).
 * Widgets gate their primary render path on this and fall through to
 * empty / unsupported / partial-match states otherwise.
 */
export function useTierZeroHasRows(): boolean {
  const view = useTierZeroScenario();
  return view.status === "match" && view.strategies.length > 0;
}
