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
 * Until Plan A Phase 2 materialises the 5-dim StrategyInstance + lifecycle
 * JSON, this surface reads from the existing 99-entry
 * lib/mocks/fixtures/strategy-instances.ts fixture and renders unknown
 * maturity / routing / venue-set-variant columns as "—" with a tooltip.
 */

import { useMemo, useState } from "react";

import { FamilyArchetypePicker } from "@/components/architecture-v2/family-archetype-picker";
import type { FamilyArchetypeSelection } from "@/components/architecture-v2/family-archetype-picker";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type {
  StrategyArchetype,
  StrategyFamily,
} from "@/lib/architecture-v2";
import {
  EMPTY_CATALOGUE_FILTER,
  matchesFilter,
  type StrategyCatalogueFilter,
} from "@/lib/architecture-v2/catalogue-filter";
import {
  LIFECYCLE_UNKNOWN,
  MATURITY_PHASE_LABEL,
  PRODUCT_ROUTING_LABEL,
  SHARE_CLASS_LABEL,
  type ProductRouting,
  type ShareClass,
  type StrategyMaturityPhase,
} from "@/lib/architecture-v2/lifecycle-placeholder";
import { STRATEGY_INSTANCES } from "@/lib/mocks/fixtures/strategy-instances";

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
  readonly subscribedClientIds?: readonly string[];
  readonly onInstanceSelect?: (instanceId: string) => void;
  readonly onRequestAllocation?: (instanceId: string) => void;
  /** Inline heading — callers can hide it when they render their own tabbed header. */
  readonly showHeading?: boolean;
}

// ─── Placeholder data wiring ──────────────────────────────────────────────────
//
// Until Plan A Phase 2 ships the regenerated ui-reference-data.json, every
// lifecycle / product-routing / venue-set column falls back to a fixed mock
// value rendered as "—" in admin-universe (with tooltip) and as the same
// placeholder in client-reality / client-fomo.

function synthesiseMaturity(id: string): StrategyMaturityPhase {
  // Deterministic-but-arbitrary assignment based on id hash so the grid is
  // not entirely uniform during scaffold. Replaced by real lifecycle once
  // Plan A Phase 3 PATCH endpoint writes to Firestore.
  const hash = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const phases: readonly StrategyMaturityPhase[] = [
    "paper_stable",
    "live_early",
    "live_stable",
    "backtest_multi_year",
  ];
  return phases[hash % phases.length] ?? "paper_stable";
}

function synthesiseRouting(assetClass: string): ProductRouting {
  if (assetClass === "Sports") return "im_only";
  if (assetClass === "DeFi") return "both";
  return "dart_only";
}

function synthesiseShareClass(id: string): ShareClass | null {
  const lower = id.toLowerCase();
  if (lower.includes("btc")) return "btc";
  if (lower.includes("eth")) return "eth";
  if (lower.includes("usdt")) return "usdt";
  if (lower.includes("usd")) return "usd";
  return null;
}

function toFilterFromPicker(
  selection: FamilyArchetypeSelection,
): StrategyCatalogueFilter {
  return {
    family: selection.family,
    archetype: selection.archetype,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function StrategyCatalogueSurface({
  viewMode,
  filter,
  onFilterChange,
  subscribedClientIds,
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

  const filtered = useMemo(() => {
    return STRATEGY_INSTANCES.filter((instance) => {
      const maturity = synthesiseMaturity(instance.id);
      const routing = synthesiseRouting(instance.assetClass);
      const shareClass = synthesiseShareClass(instance.id);
      return matchesFilter(activeFilter, {
        family: instance.family as StrategyFamily,
        archetype: instance.archetype as StrategyArchetype,
        shareClass,
        maturityPhase: maturity,
        productRouting: routing,
      });
    });
  }, [activeFilter]);

  const visible = useMemo(() => {
    const subs = new Set(subscribedClientIds ?? []);
    if (viewMode === "client-reality") {
      return filtered.filter((i) => subs.has(i.clientId));
    }
    if (viewMode === "client-fomo") {
      return filtered.filter((i) => !subs.has(i.clientId));
    }
    return filtered;
  }, [filtered, subscribedClientIds, viewMode]);

  return (
    <div className="space-y-4" data-testid={`strategy-catalogue-surface-${viewMode}`}>
      {showHeading ? (
        <header className="flex items-center gap-2">
          <h2 className="text-heading font-semibold">
            Strategy Catalogue
          </h2>
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
  readonly instances: ReadonlyArray<(typeof STRATEGY_INSTANCES)[number]>;
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
            <th className="px-3 py-2" title="Populated by Plan A / Phase 2">
              Venue set
            </th>
            <th className="px-3 py-2" title="Populated by Plan A / Phase 2">
              Share class
            </th>
            <th className="px-3 py-2" title="Populated by Plan A / Phase 2">
              Maturity
            </th>
            <th className="px-3 py-2" title="Populated by Plan A / Phase 2">
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
            const maturity = synthesiseMaturity(instance.id);
            const routing = synthesiseRouting(instance.assetClass);
            const shareClass = synthesiseShareClass(instance.id);
            return (
              <tr
                key={instance.id}
                className="border-t border-border/60 hover:bg-accent/20"
                data-testid="admin-universe-row"
                data-instance-id={instance.id}
              >
                <td className="px-3 py-2 font-mono text-[11px]">
                  {instance.id}
                </td>
                <td className="px-3 py-2">{instance.family}</td>
                <td className="px-3 py-2">{instance.archetype}</td>
                <td
                  className="px-3 py-2 text-muted-foreground"
                  title="Populated by Plan A / Phase 2"
                >
                  —
                </td>
                <td className="px-3 py-2">
                  {shareClass ? SHARE_CLASS_LABEL[shareClass] : "—"}
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
                    onClick={() => onInstanceSelect?.(instance.id)}
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
        {instances.length} instances · lifecycle columns populated by Plan A
        Phase 2; maturity + routing are placeholder values until then.
      </p>
    </div>
  );
}

// ─── Reality grid ─────────────────────────────────────────────────────────────

interface RealityGridProps {
  readonly instances: ReadonlyArray<(typeof STRATEGY_INSTANCES)[number]>;
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
        const summary: RealityInstanceSummary = {
          instanceId: instance.id,
          family: instance.family as StrategyFamily,
          archetype: instance.archetype as StrategyArchetype,
          venueSetLabel: instance.venues.join(" · ") || "—",
          shareClass: synthesiseShareClass(instance.id),
          maturityPhase: synthesiseMaturity(instance.id),
          liveAllocation: instance.performance.netExposure,
          livePnl: instance.performance.pnlTotal,
          venuesActive: instance.venues,
          terminalHref: `/services/trading/terminal?instance=${encodeURIComponent(instance.id)}`,
          reportsHref: `/services/reports?instance=${encodeURIComponent(instance.id)}`,
        };
        return (
          <div
            key={instance.id}
            onClick={() => onInstanceSelect?.(instance.id)}
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
  readonly instances: ReadonlyArray<(typeof STRATEGY_INSTANCES)[number]>;
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
        const maturity = synthesiseMaturity(instance.id);
        const routing = synthesiseRouting(instance.assetClass);
        const summary: FomoInstanceSummary = {
          instanceId: instance.id,
          family: instance.family as StrategyFamily,
          archetype: instance.archetype as StrategyArchetype,
          venueSetLabel: instance.venues.join(" · ") || "—",
          shareClass: synthesiseShareClass(instance.id),
          maturityPhase: maturity,
          productRouting: routing,
          sharpe: instance.performance.sharpe,
          maxDrawdownPct: instance.performance.maxDrawdown,
          cagrPct: instance.performance.returnPct,
        };
        return (
          <div
            key={instance.id}
            onClick={() => onInstanceSelect?.(instance.id)}
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

export { LIFECYCLE_UNKNOWN };
