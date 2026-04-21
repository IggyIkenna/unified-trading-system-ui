"use client";

/**
 * TradingFamilyFilterBanner — reusable filter banner for trading surfaces
 * (orders / positions / P&L). Mirrors the signals-dashboard pattern: picks
 * (family, archetype) and persists to `useGlobalScope` so downstream
 * data-contexts can apply the filter.
 *
 * Phase 3 wave-B of `ui_unification_v2_sanitisation_2026_04_20.plan.md` §
 * p3-wire-picker-orders-positions. Placement: top of page, above WidgetGrid.
 *
 * `testIdPrefix` distinguishes banners across pages
 * (e.g. "orders" → `orders-family-picker`).
 */

import { FamilyArchetypePicker } from "./family-archetype-picker";
import type { StrategyArchetype, StrategyFamily } from "@/lib/architecture-v2";
import { useGlobalScope } from "@/lib/stores/global-scope-store";
import { useMemo } from "react";

export interface TradingFamilyFilterBannerProps {
  /** Prefix for data-testid attributes (e.g. "orders", "positions", "pnl"). */
  readonly testIdPrefix: string;
  /** Optional label override; defaults to "Strategy filter". */
  readonly label?: string;
  /** Optional total / filtered counts to surface next to the banner. */
  readonly counts?: {
    readonly total: number;
    readonly filtered: number;
  };
}

export function TradingFamilyFilterBanner({
  testIdPrefix,
  label = "Strategy filter",
  counts,
}: TradingFamilyFilterBannerProps) {
  const { scope, setStrategyFamily, setStrategyArchetype } = useGlobalScope();

  const value = useMemo(
    () => ({
      family: scope.strategyFamily as StrategyFamily | undefined,
      archetype: scope.strategyArchetype as StrategyArchetype | undefined,
    }),
    [scope.strategyFamily, scope.strategyArchetype],
  );

  const isActive = value.family !== undefined || value.archetype !== undefined;

  return (
    <div
      className="flex flex-wrap items-center gap-3 rounded-md border border-border/60 bg-muted/10 px-3 py-2 text-xs text-muted-foreground"
      data-testid={`${testIdPrefix}-family-picker`}
    >
      <span className="font-medium uppercase tracking-wide">{label}</span>
      <FamilyArchetypePicker
        idPrefix={testIdPrefix}
        availabilityFilter="all"
        value={value}
        onChange={(next) => {
          setStrategyFamily(next.family);
          setStrategyArchetype(next.archetype);
        }}
      />
      {isActive && counts ? (
        <span
          className="font-mono text-[10px] text-amber-500"
          data-testid={`${testIdPrefix}-family-picker-count`}
        >
          {counts.filtered} of {counts.total} rows
        </span>
      ) : null}
      {isActive ? (
        <button
          type="button"
          onClick={() => {
            setStrategyFamily(undefined);
            setStrategyArchetype(undefined);
          }}
          className="text-xs text-primary hover:underline"
          data-testid={`${testIdPrefix}-family-picker-clear`}
        >
          Clear
        </button>
      ) : null}
    </div>
  );
}
