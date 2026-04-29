/**
 * Deterministic 5-dim filter hash → integer in [0, 100). Used by
 * `useFilteredDashboardQuickStats` for mock filtered-slice quick-stats so the
 * numbers feel stable per-filter without a backend.
 *
 * Replaces the old `filterHashBucket(DashboardFilterState)` from the now-
 * deleted `lib/context/dashboard-filter-context.tsx`. Same algorithm; new
 * input shape (a 5-dim slice of the unified `WorkspaceScope`).
 */

import type { InstrumentTypeV2 } from "@/lib/architecture-v2/coverage";
import type { ShareClass, StrategyArchetype, StrategyFamily } from "@/lib/architecture-v2/enums";
import type { VenueSetVariantId } from "@/lib/architecture-v2/lifecycle";

export interface FiveDimFilter {
  readonly family: StrategyFamily | null;
  readonly archetype: StrategyArchetype | null;
  readonly venueSetVariant: VenueSetVariantId | null;
  readonly shareClass: ShareClass | null;
  readonly instrumentType: InstrumentTypeV2 | null;
}

export function filterHashBucket(filter: FiveDimFilter): number {
  const key = [
    filter.family ?? "*",
    filter.archetype ?? "*",
    filter.venueSetVariant ?? "*",
    filter.shareClass ?? "*",
    filter.instrumentType ?? "*",
  ].join("|");
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 100;
}
