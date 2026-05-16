"use client";

/**
 * useScopedData — the unified scope-reactive data hook for widgets.
 *
 * Per dart_ux_cockpit_refactor_2026_04_29.plan §10 + §11 + Phase 5 of §17.
 *
 * Replaces the per-asset-group hooks (`useOptionsData`, `useDeFiData`,
 * `useSportsData`, `usePredictionsData`, etc.) with a single hook that
 * derives its filter from the active `WorkspaceScope`. Caller can pass a
 * `slice` to narrow further:
 *
 *   const { matchesScope } = useScopedData({ instrumentTypes: ["option"] });
 *
 * Phase 5 SCOPE: ship the hook + the matchesScope predicate it returns.
 * Per-widget data fetching stays under each widget's existing data context;
 * those contexts can call `useScopedData()` to get the active scope slice
 * for their internal filtering. Phase 11+ migrates per-widget data fetching
 * onto a unified `ScopedDataProvider`.
 */

import * as React from "react";

import {
  matchesScope as runtimeMatchesScope,
  type ScopeMatchableRow,
  type WorkspaceScope,
} from "@/lib/architecture-v2/workspace-scope";
import { useWorkspaceScope } from "@/lib/stores/workspace-scope-store";

/**
 * Optional narrowing slice — caller can declare additional filter axes
 * the cockpit-wide scope doesn't already cover. Most widgets won't need
 * this; legacy compatibility shims (useOptionsData etc.) use it to add
 * an instrument-type pin on top of the active scope.
 */
export interface ScopeSlice {
  readonly assetGroups?: readonly string[];
  readonly instrumentTypes?: readonly string[];
  readonly families?: readonly string[];
  readonly archetypes?: readonly string[];
  readonly shareClasses?: readonly string[];
  readonly venueOrProtocolIds?: readonly string[];
  readonly strategyIds?: readonly string[];
}

export interface ScopedDataReturn {
  /** The active workspace scope. */
  readonly scope: WorkspaceScope;
  /** The merged scope (cockpit scope ∪ slice) — useful for downstream filtering. */
  readonly mergedScope: WorkspaceScope;
  /**
   * Filter a row by the merged scope. Returns true if the row passes every
   * active filter axis (or the row's relevant field is unpopulated).
   */
  readonly matchesScope: (row: ScopeMatchableRow) => boolean;
  /**
   * Apply the merged scope filter to an array of rows. Convenience wrapper
   * for the common `data.filter(matchesScope)` pattern.
   */
  readonly filterRows: <T extends ScopeMatchableRow>(rows: readonly T[]) => readonly T[];
}

function mergeSlice(scope: WorkspaceScope, slice: ScopeSlice | undefined): WorkspaceScope {
  if (!slice) return scope;
  return {
    ...scope,
    assetGroups: slice.assetGroups
      ? (Array.from(new Set([...scope.assetGroups, ...slice.assetGroups])) as WorkspaceScope["assetGroups"])
      : scope.assetGroups,
    instrumentTypes: slice.instrumentTypes
      ? Array.from(new Set([...scope.instrumentTypes, ...slice.instrumentTypes]))
      : scope.instrumentTypes,
    families: slice.families
      ? (Array.from(new Set([...scope.families, ...slice.families])) as WorkspaceScope["families"])
      : scope.families,
    archetypes: slice.archetypes
      ? (Array.from(new Set([...scope.archetypes, ...slice.archetypes])) as WorkspaceScope["archetypes"])
      : scope.archetypes,
    shareClasses: slice.shareClasses
      ? (Array.from(new Set([...scope.shareClasses, ...slice.shareClasses])) as WorkspaceScope["shareClasses"])
      : scope.shareClasses,
    venueOrProtocolIds: slice.venueOrProtocolIds
      ? Array.from(new Set([...scope.venueOrProtocolIds, ...slice.venueOrProtocolIds]))
      : scope.venueOrProtocolIds,
    strategyIds: slice.strategyIds
      ? Array.from(new Set([...scope.strategyIds, ...slice.strategyIds]))
      : scope.strategyIds,
  };
}

export function useScopedData(slice?: ScopeSlice): ScopedDataReturn {
  const scope = useWorkspaceScope();

  const mergedScope = React.useMemo(() => mergeSlice(scope, slice), [scope, slice]);

  const matchesScopeFn = React.useCallback(
    (row: ScopeMatchableRow) => runtimeMatchesScope(row, mergedScope),
    [mergedScope],
  );

  const filterRows = React.useCallback(
    <T extends ScopeMatchableRow>(rows: readonly T[]): readonly T[] => rows.filter(matchesScopeFn),
    [matchesScopeFn],
  );

  return {
    scope,
    mergedScope,
    matchesScope: matchesScopeFn,
    filterRows,
  };
}
