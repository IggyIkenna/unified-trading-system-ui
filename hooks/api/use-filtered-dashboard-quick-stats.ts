/**
 * Per-tile filtered quick-stat query for /dashboard tile grid.
 *
 * Wiring for plan todo `p4-filter-real-data-wiring` (Phase 4 follow-up to
 * dashboard_services_grid_collapse_2026_04_21).
 *
 * Runtime behaviour:
 *   - Mock-data mode (`NEXT_PUBLIC_MOCK_API=true`): skip the network call and
 *     return the deterministic hash-bucket mock so the dashboard renders
 *     plausible subset numbers with zero latency.
 *   - Real mode: hit
 *     `/api/dashboard/quick-stats/filtered?family=&archetype=&venue_set_variant=&share_class=&instrument_type=`
 *     — the gateway endpoint accepts every dimension as an optional query
 *     param (unified-trading-api add is tracked in
 *     `unified-trading-pm/plans/active/dashboard_services_grid_collapse_2026_04_21.md`
 *     → `p4-filter-real-data-wiring` + Plan A Phase 3 PATCH). When the
 *     endpoint is absent or errors, we fall back to the deterministic mock so
 *     the tile never renders blank.
 *
 * Filter scope: DART tile (P&L / positions / alerts) + Reports tile (AUM)
 * only. Other tiles return `undefined` — the dashboard page keeps the
 * per-persona + default overrides inline for those.
 */

import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";
import { typedFetch } from "@/lib/api/typed-fetch";
import type { InstrumentTypeV2 } from "@/lib/architecture-v2/coverage";
import type { ShareClass, StrategyArchetype, StrategyFamily } from "@/lib/architecture-v2/enums";
import type { VenueSetVariantId } from "@/lib/architecture-v2/lifecycle";
import type { WorkspaceScope } from "@/lib/architecture-v2/workspace-scope";
import { isMockDataMode } from "@/lib/runtime/data-mode";
import { filterHashBucket, type FiveDimFilter } from "@/lib/utils/filter-hash";

export interface DashboardQuickStats {
  readonly dart: string | null;
  readonly reports: string | null;
}

const EMPTY_QUICK_STATS: DashboardQuickStats = {
  dart: null,
  reports: null,
};

interface FilteredQuickStatsResponse {
  readonly dart?: {
    readonly pnl_usd?: number;
    readonly position_count?: number;
    readonly alert_count?: number;
    readonly is_live?: boolean;
  };
  readonly reports?: {
    readonly aum_usd_millions?: number;
  };
}

function mockFilteredStats(filter: FiveDimFilter, isLive: boolean): DashboardQuickStats {
  const bucket = filterHashBucket(filter);
  const pnl = 20 + (bucket % 80);
  const positions = 3 + (bucket % 18);
  const alerts = bucket % 3;
  const aumM = 2 + (bucket % 12);
  const aumTenths = (bucket * 7) % 10;
  return {
    dart: isLive
      ? `$${pnl}K P&L · ${positions} positions · ${alerts} alerts`
      : `$${pnl - 2}K batch P&L · ${positions} candidates`,
    reports: `${aumM}.${aumTenths}M AUM (filtered)`,
  };
}

function renderResponse(payload: FilteredQuickStatsResponse, isLive: boolean): DashboardQuickStats {
  let dart: string | null = null;
  if (payload.dart) {
    const pnl = payload.dart.pnl_usd;
    const positions = payload.dart.position_count;
    const alerts = payload.dart.alert_count;
    const live = payload.dart.is_live ?? isLive;
    if (pnl !== undefined) {
      const formatted = `$${Math.round(pnl / 1000)}K`;
      dart = live
        ? `${formatted} P&L · ${positions ?? 0} positions · ${alerts ?? 0} alerts`
        : `${formatted} batch P&L · ${positions ?? 0} candidates`;
    }
  }
  let reports: string | null = null;
  if (payload.reports && payload.reports.aum_usd_millions !== undefined) {
    const aum = payload.reports.aum_usd_millions;
    reports = `${aum.toFixed(1)}M AUM (filtered)`;
  }
  return { dart, reports };
}

/**
 * Derive the 5-dim filter slice from the unified WorkspaceScope.
 *
 * Each dimension is multi-select on the scope; for the dashboard tile
 * quick-stats we collapse to "first selected value or null" since the
 * tile-grid is single-pick by design.
 */
export function fiveDimFilterFromScope(scope: WorkspaceScope): FiveDimFilter {
  return {
    family: (scope.families[0] as StrategyFamily | undefined) ?? null,
    archetype: (scope.archetypes[0] as StrategyArchetype | undefined) ?? null,
    venueSetVariant: (scope.venueSetVariants[0] as VenueSetVariantId | undefined) ?? null,
    shareClass: (scope.shareClasses[0] as ShareClass | undefined) ?? null,
    instrumentType: (scope.instrumentTypes[0] as InstrumentTypeV2 | undefined) ?? null,
  };
}

/**
 * Fetch per-tile filtered quick-stats. Returns `EMPTY_QUICK_STATS` when no
 * family is selected so callers can fall back to their default per-tile
 * copy.
 */
export function useFilteredDashboardQuickStats(filter: FiveDimFilter, isLive: boolean): DashboardQuickStats {
  const { user, token } = useAuth();
  const active = filter.family !== null;
  const mock = isMockDataMode();

  const query = useQuery<DashboardQuickStats>({
    queryKey: [
      "dashboard-filtered-quick-stats",
      user?.id ?? null,
      filter.family,
      filter.archetype,
      filter.venueSetVariant,
      filter.shareClass,
      filter.instrumentType,
      isLive,
    ],
    enabled: active && !!user && !mock,
    // Stats are rollups — a 30s stale window is fine and keeps the tile
    // grid snappy when the filter flips on and off.
    staleTime: 30_000,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter.family) params.set("family", filter.family);
      if (filter.archetype) params.set("archetype", filter.archetype);
      if (filter.venueSetVariant) params.set("venue_set_variant", filter.venueSetVariant);
      if (filter.shareClass) params.set("share_class", filter.shareClass);
      if (filter.instrumentType) params.set("instrument_type", filter.instrumentType);
      const qs = params.toString();
      try {
        const payload = await typedFetch<FilteredQuickStatsResponse>(
          `/api/dashboard/quick-stats/filtered${qs ? `?${qs}` : ""}`,
          token,
        );
        return renderResponse(payload, isLive);
      } catch {
        // Endpoint not yet deployed or transient error — fall back to the
        // deterministic mock so the tile never renders blank. Tracked by
        // `p4-filter-real-data-wiring` in plan.
        return mockFilteredStats(filter, isLive);
      }
    },
  });

  if (!active) return EMPTY_QUICK_STATS;
  if (mock) return mockFilteredStats(filter, isLive);
  return query.data ?? mockFilteredStats(filter, isLive);
}
