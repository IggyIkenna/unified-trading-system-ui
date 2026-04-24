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
  StrategyMaturityPhase,
  VenueSetVariantId,
} from "./lifecycle";
import type {
  ShareClass,
  StrategyArchetype,
  StrategyFamily,
  VenueCategoryV2,
} from "./enums";

export type AllocationStatus =
  | "subscribed"
  | "available"
  | "coming_soon"
  | "not_routed";

export type CoverageStatus = "SUPPORTED" | "PARTIAL" | "BLOCKED";

export interface StrategyCatalogueFilter {
  readonly family?: StrategyFamily;
  /** Multi-family filter — used by questionnaire seeding. Superset of `family`. */
  readonly families?: readonly StrategyFamily[];
  readonly archetype?: StrategyArchetype;
  readonly venueSetVariant?: VenueSetVariantId;
  readonly shareClass?: ShareClass;
  /** Multi-share-class filter from questionnaire share_class_preference. */
  readonly shareClasses?: readonly ShareClass[];
  readonly maturityPhase?: StrategyMaturityPhase;
  readonly productRouting?: ProductRouting;
  readonly allocationStatus?: AllocationStatus;
  /** Venue category filter — from questionnaire categories axis. */
  readonly venueCategories?: readonly VenueCategoryV2[];
  /** Coverage status filter — from questionnaire risk_profile axis. */
  readonly coverageStatuses?: readonly CoverageStatus[];
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
  if (filter.families?.length) out.families = filter.families.join(",");
  if (filter.archetype) out.archetype = filter.archetype;
  if (filter.venueSetVariant) out.venue_set = filter.venueSetVariant;
  if (filter.shareClass) out.share_class = filter.shareClass;
  if (filter.shareClasses?.length) out.share_classes = filter.shareClasses.join(",");
  if (filter.maturityPhase) out.maturity = filter.maturityPhase;
  if (filter.productRouting) out.routing = filter.productRouting;
  if (filter.allocationStatus) out.allocation = filter.allocationStatus;
  if (filter.venueCategories?.length) out.venue_categories = filter.venueCategories.join(",");
  if (filter.coverageStatuses?.length) out.coverage_statuses = filter.coverageStatuses.join(",");
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
    families?: readonly StrategyFamily[];
    archetype?: StrategyArchetype;
    venueSetVariant?: VenueSetVariantId;
    shareClass?: ShareClass;
    shareClasses?: readonly ShareClass[];
    maturityPhase?: StrategyMaturityPhase;
    productRouting?: ProductRouting;
    allocationStatus?: AllocationStatus;
    venueCategories?: readonly VenueCategoryV2[];
    coverageStatuses?: readonly CoverageStatus[];
  } = {};

  const family = get("family");
  if (family) out.family = family as StrategyFamily;

  const familiesRaw = get("families");
  if (familiesRaw) out.families = familiesRaw.split(",").filter(Boolean) as StrategyFamily[];

  const archetype = get("archetype");
  if (archetype) out.archetype = archetype as StrategyArchetype;

  const venueSet = get("venue_set");
  if (venueSet) out.venueSetVariant = venueSet;

  const VALID_SHARE_CLASSES = ["USDT", "USDC", "FDUSD", "USD", "GBP", "EUR", "ETH", "BTC", "SOL"] as const;

  const shareClass = get("share_class");
  if (shareClass && (VALID_SHARE_CLASSES as readonly string[]).includes(shareClass)) {
    out.shareClass = shareClass as ShareClass;
  }

  const shareClassesRaw = get("share_classes");
  if (shareClassesRaw) {
    const parsed = shareClassesRaw.split(",").filter((s) => (VALID_SHARE_CLASSES as readonly string[]).includes(s));
    if (parsed.length) out.shareClasses = parsed as ShareClass[];
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

  const venueCatsRaw = get("venue_categories");
  if (venueCatsRaw) {
    const valid: string[] = ["CEFI", "DEFI", "SPORTS", "TRADFI", "PREDICTION"];
    const parsed = venueCatsRaw.split(",").filter((c) => valid.includes(c));
    if (parsed.length) out.venueCategories = parsed as VenueCategoryV2[];
  }

  const coverageRaw = get("coverage_statuses");
  if (coverageRaw) {
    const valid: string[] = ["SUPPORTED", "PARTIAL", "BLOCKED"];
    const parsed = coverageRaw.split(",").filter((c) => valid.includes(c));
    if (parsed.length) out.coverageStatuses = parsed as CoverageStatus[];
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
    readonly venueCategory?: VenueCategoryV2 | null;
    readonly coverageStatus?: CoverageStatus | null;
  },
): boolean {
  if (filter.family && instance.family !== filter.family) return false;
  if (filter.families?.length && !filter.families.includes(instance.family)) return false;
  if (filter.archetype && instance.archetype !== filter.archetype) return false;
  if (
    filter.venueSetVariant &&
    instance.venueSetVariantId !== filter.venueSetVariant
  ) {
    return false;
  }
  if (filter.shareClass && instance.shareClass !== filter.shareClass) return false;
  if (
    filter.shareClasses?.length &&
    instance.shareClass &&
    !filter.shareClasses.includes(instance.shareClass)
  ) {
    return false;
  }
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
  if (
    filter.venueCategories?.length &&
    instance.venueCategory &&
    !filter.venueCategories.includes(instance.venueCategory)
  ) {
    return false;
  }
  if (
    filter.coverageStatuses?.length &&
    instance.coverageStatus &&
    !filter.coverageStatuses.includes(instance.coverageStatus)
  ) {
    return false;
  }
  return true;
}
