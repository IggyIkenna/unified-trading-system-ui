"use client";

/**
 * StrategyCatalogueSurface — shared Tier-1 / Tier-2 / Tier-3 primitive.
 *
 * Per plans/active/strategy_catalogue_3tier_surface_2026_04_21.plan.md. Single
 * component, four view modes driven by the `viewMode` prop:
 *
 *   - admin-universe   read-only catalogue of the full UAC-expressed universe
 *   - admin-editor     (scaffold only; disabled until Plan A Phase 3 PATCH ships)
 *   - client-reality   tiles for instances THIS org subscribes to
 *   - client-fomo      tearsheets for instances available via product-routing
 *                      but NOT yet subscribed
 *
 * Reads the real 5-dim catalogue from
 * `lib/registry/ui-reference-data.json` via
 * `loadStrategyCatalogue()`. Lifecycle columns (maturity / routing) remain
 * synthesised per-instanceId until Plan A Phase 3 ships the Firestore
 * lifecycle doc; performance overlay is Plan C's problem.
 */

import { useMemo, useState } from "react";

import { FamilyArchetypePicker } from "@/components/architecture-v2/family-archetype-picker";
import type { FamilyArchetypeSelection } from "@/components/architecture-v2/family-archetype-picker";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  EMPTY_CATALOGUE_FILTER,
  matchesFilter,
  type StrategyCatalogueFilter,
} from "@/lib/architecture-v2/catalogue-filter";
import {
  allowsAllocationCta,
  loadStrategyCatalogue,
  lookupVenueSetVariant,
  LIFECYCLE_UNKNOWN,
  MATURITY_PHASE_LABEL,
  PRODUCT_ROUTING_LABEL,
  PRODUCT_ROUTINGS,
  SHARE_CLASS_LABEL,
  STRATEGY_MATURITY_PHASES,
  type ProductRouting,
  type StrategyInstance,
  type StrategyMaturityPhase,
} from "@/lib/architecture-v2/lifecycle";

import {
  FomoTearsheetCard,
  type FomoInstanceSummary,
} from "./FomoTearsheetCard";
import {
  RealityPositionCard,
  type RealityInstanceSummary,
} from "./RealityPositionCard";

export type StrategyCatalogueViewMode =
  | "admin-universe"
  | "admin-editor"
  | "client-reality"
  | "client-fomo";

export interface StrategyCatalogueSurfaceProps {
  readonly viewMode: StrategyCatalogueViewMode;
  readonly filter?: StrategyCatalogueFilter;
  readonly onFilterChange?: (next: StrategyCatalogueFilter) => void;
  readonly subscribedInstanceIds?: readonly string[];
  readonly onInstanceSelect?: (instanceId: string) => void;
  readonly onRequestAllocation?: (instanceId: string) => void;
  /** Inline heading — callers can hide it when they render their own tabbed header. */
  readonly showHeading?: boolean;
}

// ─── Deterministic synthesisers (Plan A Phase 3 replaces these) ───────────────
//
// Real lifecycle state lives in Firestore keyed on instance_id. Until the
// PATCH endpoint ships, maturity + routing are deterministic hashes of the
// instance_id so the grid is populated and the FOMO CTA gate is testable.

function hashInstanceId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return h;
}

function synthesiseMaturity(id: string): StrategyMaturityPhase {
  const phases: readonly StrategyMaturityPhase[] = [
    "paper_stable",
    "live_early",
    "live_stable",
    "backtest_multi_year",
    "paper_14d",
    "backtest_1yr",
  ];
  return phases[hashInstanceId(id) % phases.length] ?? "paper_stable";
}

function synthesiseRouting(id: string): ProductRouting {
  return (
    PRODUCT_ROUTINGS[hashInstanceId(id) % PRODUCT_ROUTINGS.length] ?? "both"
  );
}

interface SyntheticPerformance {
  readonly sharpe: number;
  readonly maxDrawdownPct: number;
  readonly cagrPct: number;
  readonly liveAllocation: number;
  readonly livePnl: number;
}

function synthesisePerformance(id: string): SyntheticPerformance {
  // Deterministic-but-varied numbers so the scaffold renders non-uniform tiles.
  // Replaced by Plan C PerformanceOverlay + odum-paper series once those land.
  const h = hashInstanceId(id);
  return {
    sharpe: 0.8 + (h % 180) / 100, // 0.80 .. 2.60
    maxDrawdownPct: -((h % 22) + 3), // -3 .. -25
    cagrPct: 6 + (h % 24), // 6 .. 30
    liveAllocation: 250_000 + (h % 40) * 25_000, // 250k .. 1.225M
    livePnl: (h % 2 === 0 ? 1 : -1) * ((h % 32) + 2) * 1500, // ±3k .. ±51k
  };
}

function venueSetLabel(variantId: string): string {
  const variant = lookupVenueSetVariant(variantId);
  return variant?.label ?? variantId;
}

function venueList(variantId: string): readonly string[] {
  return lookupVenueSetVariant(variantId)?.venues ?? [];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function StrategyCatalogueSurface({
  viewMode,
  filter,
  onFilterChange,
  subscribedInstanceIds,
  onInstanceSelect,
  onRequestAllocation,
  showHeading = false,
}: StrategyCatalogueSurfaceProps) {
  const [localFilter, setLocalFilter] = useState<StrategyCatalogueFilter>(
    filter ?? EMPTY_CATALOGUE_FILTER,
  );
  const activeFilter = filter ?? localFilter;

  const handleFilterChange = (next: StrategyCatalogueFilter): void => {
    setLocalFilter(next);
    onFilterChange?.(next);
  };

  const pickerValue: FamilyArchetypeSelection = {
    family: activeFilter.family,
    archetype: activeFilter.archetype,
  };

  const handlePickerChange = (next: FamilyArchetypeSelection): void => {
    handleFilterChange({
      ...activeFilter,
      family: next.family,
      archetype: next.archetype,
    });
  };

  const catalogue = useMemo(() => loadStrategyCatalogue(), []);

  const filtered = useMemo(() => {
    return catalogue.filter((instance) => {
      const maturity = synthesiseMaturity(instance.instanceId);
      const routing = synthesiseRouting(instance.instanceId);
      return matchesFilter(activeFilter, {
        family: instance.family,
        archetype: instance.archetype,
        shareClass: instance.shareClass,
        maturityPhase: maturity,
        productRouting: routing,
      });
    });
  }, [catalogue, activeFilter]);

  const visible = useMemo(() => {
    const subs = new Set(subscribedInstanceIds ?? []);
    if (viewMode === "client-reality") {
      return filtered.filter((i) => subs.has(i.instanceId));
    }
    if (viewMode === "client-fomo") {
      return filtered.filter((i) => !subs.has(i.instanceId));
    }
    return filtered;
  }, [filtered, subscribedInstanceIds, viewMode]);

  return (
    <div className="space-y-4" data-testid={`strategy-catalogue-surface-${viewMode}`}>
      {showHeading ? (
        <header className="flex items-center gap-2">
          <h2 className="text-heading font-semibold">Strategy Catalogue</h2>
          <Badge variant="outline" className="font-mono text-[10px]">
            {viewMode}
          </Badge>
        </header>
      ) : null}

      <div
        className="flex flex-wrap items-center gap-2"
        data-testid="strategy-catalogue-filter-row"
      >
        <FamilyArchetypePicker
          value={pickerValue}
          onChange={handlePickerChange}
          idPrefix={`catalogue-${viewMode}`}
        />
        {viewMode === "admin-editor" ? (
          <Badge variant="outline" className="text-[10px] text-amber-500">
            Editor enabled when Plan A Phase 3 ships
          </Badge>
        ) : null}
      </div>

      {viewMode === "admin-universe" || viewMode === "admin-editor" ? (
        <AdminUniverseGrid
          instances={visible}
          editorMode={viewMode === "admin-editor"}
          onInstanceSelect={onInstanceSelect}
        />
      ) : null}

      {viewMode === "client-reality" ? (
        <RealityGrid
          instances={visible}
          onInstanceSelect={onInstanceSelect}
        />
      ) : null}

      {viewMode === "client-fomo" ? (
        <FomoGrid
          instances={visible}
          onInstanceSelect={onInstanceSelect}
          onRequestAllocation={onRequestAllocation}
        />
      ) : null}
    </div>
  );
}

// ─── Admin universe / editor (read-only for now) ──────────────────────────────

interface AdminUniverseGridProps {
  readonly instances: readonly StrategyInstance[];
  readonly editorMode: boolean;
  readonly onInstanceSelect?: (instanceId: string) => void;
}

function AdminUniverseGrid({
  instances,
  editorMode,
  onInstanceSelect,
}: AdminUniverseGridProps) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <table
        className="w-full text-left text-sm"
        data-testid="admin-universe-grid"
      >
        <thead className="bg-muted/40 text-[10px] uppercase text-muted-foreground">
          <tr>
            <th className="px-3 py-2">Instance</th>
            <th className="px-3 py-2">Family</th>
            <th className="px-3 py-2">Archetype</th>
            <th className="px-3 py-2">Venue set</th>
            <th className="px-3 py-2">Share class</th>
            <th
              className="px-3 py-2"
              title="Synthesised until Plan A Phase 3 PATCH ships"
            >
              Maturity
            </th>
            <th
              className="px-3 py-2"
              title="Synthesised until Plan A Phase 3 PATCH ships"
            >
              Routing
            </th>
            <th className="px-3 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {instances.length === 0 ? (
            <tr>
              <td className="px-3 py-6 text-center text-muted-foreground" colSpan={8}>
                No instances match the current filter.
              </td>
            </tr>
          ) : null}
          {instances.map((instance) => {
            const maturity = synthesiseMaturity(instance.instanceId);
            const routing = synthesiseRouting(instance.instanceId);
            return (
              <tr
                key={instance.instanceId}
                className="border-t border-border/60 hover:bg-accent/20"
                data-testid="admin-universe-row"
                data-instance-id={instance.instanceId}
              >
                <td className="px-3 py-2 font-mono text-[11px]">
                  {instance.instanceId}
                </td>
                <td className="px-3 py-2">{instance.family}</td>
                <td className="px-3 py-2">{instance.archetype}</td>
                <td className="px-3 py-2">
                  {venueSetLabel(instance.venueSetVariantId)}
                </td>
                <td className="px-3 py-2">
                  {instance.shareClass
                    ? SHARE_CLASS_LABEL[instance.shareClass]
                    : "—"}
                </td>
                <td className="px-3 py-2">
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {MATURITY_PHASE_LABEL[maturity]}
                  </Badge>
                </td>
                <td className="px-3 py-2">
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    {PRODUCT_ROUTING_LABEL[routing]}
                  </Badge>
                </td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    className="text-xs text-primary underline-offset-2 hover:underline disabled:text-muted-foreground disabled:no-underline"
                    disabled={editorMode}
                    title={
                      editorMode
                        ? "Enabled when Plan A Phase 3 PATCH endpoint ships"
                        : "Open instance detail"
                    }
                    onClick={() => onInstanceSelect?.(instance.instanceId)}
                  >
                    {editorMode ? "Edit (locked)" : "Details"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="border-t border-border/60 bg-muted/20 px-3 py-2 text-[10px] text-muted-foreground">
        {instances.length} instances · maturity + routing are synthesised until
        Plan A Phase 3 PATCH ships.
      </p>
    </div>
  );
}

// ─── Reality grid ─────────────────────────────────────────────────────────────

interface RealityGridProps {
  readonly instances: readonly StrategyInstance[];
  readonly onInstanceSelect?: (instanceId: string) => void;
}

function RealityGrid({ instances, onInstanceSelect }: RealityGridProps) {
  if (instances.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          You&apos;re not subscribed to any strategies yet. Switch to{" "}
          <span className="font-semibold">Explore</span> to see what&apos;s
          available.
        </CardContent>
      </Card>
    );
  }

  return (
    <div
      className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
      data-testid="reality-grid"
    >
      {instances.map((instance) => {
        const perf = synthesisePerformance(instance.instanceId);
        const summary: RealityInstanceSummary = {
          instanceId: instance.instanceId,
          family: instance.family,
          archetype: instance.archetype,
          venueSetLabel: venueSetLabel(instance.venueSetVariantId),
          shareClass: instance.shareClass,
          maturityPhase: synthesiseMaturity(instance.instanceId),
          liveAllocation: perf.liveAllocation,
          livePnl: perf.livePnl,
          venuesActive: venueList(instance.venueSetVariantId),
          terminalHref: `/services/trading/terminal?instance=${encodeURIComponent(instance.instanceId)}`,
          reportsHref: `/services/reports?instance=${encodeURIComponent(instance.instanceId)}`,
        };
        return (
          <div
            key={instance.instanceId}
            onClick={() => onInstanceSelect?.(instance.instanceId)}
            role={onInstanceSelect ? "button" : undefined}
            tabIndex={onInstanceSelect ? 0 : undefined}
          >
            <RealityPositionCard instance={summary} />
          </div>
        );
      })}
    </div>
  );
}

// ─── FOMO grid ────────────────────────────────────────────────────────────────

interface FomoGridProps {
  readonly instances: readonly StrategyInstance[];
  readonly onInstanceSelect?: (instanceId: string) => void;
  readonly onRequestAllocation?: (instanceId: string) => void;
}

function FomoGrid({
  instances,
  onInstanceSelect,
  onRequestAllocation,
}: FomoGridProps) {
  if (instances.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          No additional strategies routed to your tier right now. Contact your
          sales desk if you&apos;d like earlier-access eligibility.
        </CardContent>
      </Card>
    );
  }

  return (
    <div
      className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
      data-testid="fomo-grid"
    >
      {instances.map((instance) => {
        const maturity = synthesiseMaturity(instance.instanceId);
        const routing = synthesiseRouting(instance.instanceId);
        const perf = synthesisePerformance(instance.instanceId);
        const summary: FomoInstanceSummary = {
          instanceId: instance.instanceId,
          family: instance.family,
          archetype: instance.archetype,
          venueSetLabel: venueSetLabel(instance.venueSetVariantId),
          shareClass: instance.shareClass,
          maturityPhase: maturity,
          productRouting: routing,
          sharpe: perf.sharpe,
          maxDrawdownPct: perf.maxDrawdownPct,
          cagrPct: perf.cagrPct,
        };
        return (
          <div
            key={instance.instanceId}
            onClick={() => onInstanceSelect?.(instance.instanceId)}
            role={onInstanceSelect ? "button" : undefined}
            tabIndex={onInstanceSelect ? 0 : undefined}
          >
            <FomoTearsheetCard
              instance={summary}
              onRequestAllocation={onRequestAllocation}
            />
          </div>
        );
      })}
    </div>
  );
}

// Re-exports for consumers that want the synth helpers without re-importing
// from internals. `allowsAllocationCta` is re-exposed for the Phase-5 tests.
export {
  LIFECYCLE_UNKNOWN,
  STRATEGY_MATURITY_PHASES,
  allowsAllocationCta,
  synthesiseMaturity,
  synthesiseRouting,
};
