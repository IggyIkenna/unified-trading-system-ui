/**
 * Strategy Catalogue filter state — URL-serialisable.
 *
 * Per Plan B p1-strategy-catalogue-filter-types. Shared across admin-universe,
 * admin-editor (future), client-reality, client-fomo view modes of
 * <StrategyCatalogueSurface>. Deep-linkable via `?family=...&archetype=...&...`.
 *
 * When mounted under /dashboard, sync with DashboardFilterContext (Plan
 * dashboard_services_grid_collapse Phase 4). Outside of dashboard context the
 * filter state is local to the surface.
 */

import type {
  ProductRouting,
  ShareClass,
  StrategyMaturityPhase,
  VenueSetVariantId,
} from "./lifecycle-placeholder";
import type { StrategyArchetype, StrategyFamily } from "./enums";

export type AllocationStatus =
  | "subscribed"
  | "available"
  | "coming_soon"
  | "not_routed";

export interface StrategyCatalogueFilter {
  readonly family?: StrategyFamily;
  readonly archetype?: StrategyArchetype;
  readonly venueSetVariant?: VenueSetVariantId;
  readonly shareClass?: ShareClass;
  readonly maturityPhase?: StrategyMaturityPhase;
  readonly productRouting?: ProductRouting;
  readonly allocationStatus?: AllocationStatus;
}

export const EMPTY_CATALOGUE_FILTER: StrategyCatalogueFilter = {};

/**
 * Serialise a filter into a `URLSearchParams`-compatible record. Empty fields
 * are omitted so the resulting query string is minimal.
 */
export function serialiseCatalogueFilter(
  filter: StrategyCatalogueFilter,
): Record<string, string> {
  const out: Record<string, string> = {};
  if (filter.family) out.family = filter.family;
  if (filter.archetype) out.archetype = filter.archetype;
  if (filter.venueSetVariant) out.venue_set = filter.venueSetVariant;
  if (filter.shareClass) out.share_class = filter.shareClass;
  if (filter.maturityPhase) out.maturity = filter.maturityPhase;
  if (filter.productRouting) out.routing = filter.productRouting;
  if (filter.allocationStatus) out.allocation = filter.allocationStatus;
  return out;
}

/**
 * Parse a URLSearchParams-like reader into a filter. Unknown values for
 * discriminated-union keys are dropped silently; the surface renders the
 * unfiltered universe in that case.
 */
export function parseCatalogueFilter(
  source: URLSearchParams | Readonly<Record<string, string | undefined>>,
): StrategyCatalogueFilter {
  const get = (key: string): string | undefined => {
    if (source instanceof URLSearchParams) {
      return source.get(key) ?? undefined;
    }
    return source[key];
  };

  const out: {
    family?: StrategyFamily;
    archetype?: StrategyArchetype;
    venueSetVariant?: VenueSetVariantId;
    shareClass?: ShareClass;
    maturityPhase?: StrategyMaturityPhase;
    productRouting?: ProductRouting;
    allocationStatus?: AllocationStatus;
  } = {};

  const family = get("family");
  if (family) out.family = family as StrategyFamily;

  const archetype = get("archetype");
  if (archetype) out.archetype = archetype as StrategyArchetype;

  const venueSet = get("venue_set");
  if (venueSet) out.venueSetVariant = venueSet;

  const shareClass = get("share_class");
  if (shareClass && ["btc", "eth", "usd", "usdt"].includes(shareClass)) {
    out.shareClass = shareClass as ShareClass;
  }

  const maturity = get("maturity");
  if (maturity) out.maturityPhase = maturity as StrategyMaturityPhase;

  const routing = get("routing");
  if (routing && ["dart_only", "im_only", "both", "internal_only"].includes(routing)) {
    out.productRouting = routing as ProductRouting;
  }

  const allocation = get("allocation");
  if (
    allocation &&
    ["subscribed", "available", "coming_soon", "not_routed"].includes(allocation)
  ) {
    out.allocationStatus = allocation as AllocationStatus;
  }

  return out;
}

/**
 * True when every field on `filter` is also satisfied by `instance`. Used to
 * server-/client-side filter the universe grid.
 */
export function matchesFilter(
  filter: StrategyCatalogueFilter,
  instance: {
    readonly family: StrategyFamily;
    readonly archetype: StrategyArchetype;
    readonly venueSetVariantId?: VenueSetVariantId;
    readonly shareClass?: ShareClass | null;
    readonly maturityPhase?: StrategyMaturityPhase;
    readonly productRouting?: ProductRouting;
    readonly allocationStatus?: AllocationStatus;
  },
): boolean {
  if (filter.family && instance.family !== filter.family) return false;
  if (filter.archetype && instance.archetype !== filter.archetype) return false;
  if (
    filter.venueSetVariant &&
    instance.venueSetVariantId !== filter.venueSetVariant
  ) {
    return false;
  }
  if (filter.shareClass && instance.shareClass !== filter.shareClass) return false;
  if (filter.maturityPhase && instance.maturityPhase !== filter.maturityPhase) {
    return false;
  }
  if (filter.productRouting && instance.productRouting !== filter.productRouting) {
    return false;
  }
  if (
    filter.allocationStatus &&
    instance.allocationStatus !== filter.allocationStatus
  ) {
    return false;
  }
  return true;
}
