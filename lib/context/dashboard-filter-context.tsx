"use client";

/**
 * DashboardFilterContext — 5-dim strategy-instance filter shared across the
 * /dashboard tile grid. Tile sub-route chips thread the active filter onto
 * their href query-string so DART sub-tabs + Reports render pre-filtered
 * (Plan B `<FamilyArchetypePicker>` wiring already parses the params).
 *
 * State persists per-user in localStorage under
 * `dashboardFilter:<user.id>` + a sibling `dashboardFilter:<user.id>:expanded`
 * flag for the strip's collapsed-by-default disclosure.
 *
 * SSOTs:
 *   - plans/active/dashboard_services_grid_collapse_2026_04_21.plan.md Phase 4
 *   - codex/09-strategy/architecture-v2/dashboard-services-grid.md §4
 *   - lib/architecture-v2/lifecycle.ts (5-dim catalogue, auto-generated from UAC)
 */

import * as React from "react";

import type { InstrumentTypeV2 } from "@/lib/architecture-v2/coverage";
import type {
  ShareClass,
  StrategyArchetype,
  StrategyFamily,
} from "@/lib/architecture-v2/enums";
import type { VenueSetVariantId } from "@/lib/architecture-v2/lifecycle";

export interface DashboardFilterState {
  readonly family: StrategyFamily | null;
  readonly archetype: StrategyArchetype | null;
  readonly venueSetVariant: VenueSetVariantId | null;
  readonly shareClass: ShareClass | null;
  readonly instrumentType: InstrumentTypeV2 | null;
}

export const EMPTY_FILTER: DashboardFilterState = {
  family: null,
  archetype: null,
  venueSetVariant: null,
  shareClass: null,
  instrumentType: null,
};

export interface DashboardFilterContextValue {
  readonly filter: DashboardFilterState;
  readonly setFilter: (next: Partial<DashboardFilterState>) => void;
  readonly clear: () => void;
  readonly expanded: boolean;
  readonly setExpanded: (next: boolean) => void;
  readonly isActive: boolean;
  /** `family=X&archetype=Y&...` — empty when no field is set. */
  readonly queryString: string;
}

const DashboardFilterContext =
  React.createContext<DashboardFilterContextValue | null>(null);

function filterStorageKey(userId: string | null | undefined): string | null {
  if (!userId) return null;
  return `dashboardFilter:${userId}`;
}

function expandedStorageKey(userId: string | null | undefined): string | null {
  const key = filterStorageKey(userId);
  return key === null ? null : `${key}:expanded`;
}

function isFilterActive(filter: DashboardFilterState): boolean {
  return (
    filter.family !== null ||
    filter.archetype !== null ||
    filter.venueSetVariant !== null ||
    filter.shareClass !== null ||
    filter.instrumentType !== null
  );
}

export function filterToQueryString(filter: DashboardFilterState): string {
  const params = new URLSearchParams();
  if (filter.family) params.set("family", filter.family);
  if (filter.archetype) params.set("archetype", filter.archetype);
  if (filter.venueSetVariant)
    params.set("venue_set_variant", filter.venueSetVariant);
  if (filter.shareClass) params.set("share_class", filter.shareClass);
  if (filter.instrumentType)
    params.set("instrument_type", filter.instrumentType);
  return params.toString();
}

export function appendFilterToHref(
  href: string,
  filter: DashboardFilterState,
): string {
  const qs = filterToQueryString(filter);
  if (qs.length === 0) return href;
  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}${qs}`;
}

/**
 * Deterministic hash → integer in [0, 100). Used for mock filtered-slice
 * quick-stats so the numbers feel stable per-filter without a backend.
 */
export function filterHashBucket(filter: DashboardFilterState): number {
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

function readFilter(userId: string | null | undefined): DashboardFilterState {
  if (typeof window === "undefined") return EMPTY_FILTER;
  const key = filterStorageKey(userId);
  if (key === null) return EMPTY_FILTER;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return EMPTY_FILTER;
    const parsed = JSON.parse(raw) as Partial<DashboardFilterState>;
    return {
      family: parsed.family ?? null,
      archetype: parsed.archetype ?? null,
      venueSetVariant: parsed.venueSetVariant ?? null,
      shareClass: parsed.shareClass ?? null,
      instrumentType: parsed.instrumentType ?? null,
    };
  } catch {
    return EMPTY_FILTER;
  }
}

function writeFilter(
  userId: string | null | undefined,
  next: DashboardFilterState,
): void {
  if (typeof window === "undefined") return;
  const key = filterStorageKey(userId);
  if (key === null) return;
  try {
    if (!isFilterActive(next)) {
      window.localStorage.removeItem(key);
      return;
    }
    window.localStorage.setItem(key, JSON.stringify(next));
  } catch {
    // Silent — storage full / disabled; in-memory state still works.
  }
}

function readExpanded(userId: string | null | undefined): boolean {
  if (typeof window === "undefined") return false;
  const key = expandedStorageKey(userId);
  if (key === null) return false;
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function writeExpanded(
  userId: string | null | undefined,
  value: boolean,
): void {
  if (typeof window === "undefined") return;
  const key = expandedStorageKey(userId);
  if (key === null) return;
  try {
    if (value) window.localStorage.setItem(key, "1");
    else window.localStorage.removeItem(key);
  } catch {
    // Silent — see writeFilter.
  }
}

export interface DashboardFilterProviderProps {
  readonly userId: string | null | undefined;
  readonly children: React.ReactNode;
}

export function DashboardFilterProvider({
  userId,
  children,
}: DashboardFilterProviderProps) {
  const [filter, setFilterState] =
    React.useState<DashboardFilterState>(EMPTY_FILTER);
  const [expanded, setExpandedState] = React.useState<boolean>(false);

  React.useEffect(() => {
    setFilterState(readFilter(userId));
    setExpandedState(readExpanded(userId));
  }, [userId]);

  const setFilter = React.useCallback(
    (next: Partial<DashboardFilterState>) => {
      setFilterState((prev) => {
        const merged: DashboardFilterState = {
          family: next.family === undefined ? prev.family : next.family,
          archetype:
            next.archetype === undefined ? prev.archetype : next.archetype,
          venueSetVariant:
            next.venueSetVariant === undefined
              ? prev.venueSetVariant
              : next.venueSetVariant,
          shareClass:
            next.shareClass === undefined ? prev.shareClass : next.shareClass,
          instrumentType:
            next.instrumentType === undefined
              ? prev.instrumentType
              : next.instrumentType,
        };
        writeFilter(userId, merged);
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("dashboardFilter.changed", {
              detail: { filter: merged, userId: userId ?? null },
            }),
          );
        }
        return merged;
      });
    },
    [userId],
  );

  const clear = React.useCallback(() => {
    setFilterState(EMPTY_FILTER);
    writeFilter(userId, EMPTY_FILTER);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("dashboardFilter.changed", {
          detail: { filter: EMPTY_FILTER, userId: userId ?? null },
        }),
      );
    }
  }, [userId]);

  const setExpanded = React.useCallback(
    (next: boolean) => {
      setExpandedState(next);
      writeExpanded(userId, next);
    },
    [userId],
  );

  const value = React.useMemo<DashboardFilterContextValue>(
    () => ({
      filter,
      setFilter,
      clear,
      expanded,
      setExpanded,
      isActive: isFilterActive(filter),
      queryString: filterToQueryString(filter),
    }),
    [filter, setFilter, clear, expanded, setExpanded],
  );

  return (
    <DashboardFilterContext.Provider value={value}>
      {children}
    </DashboardFilterContext.Provider>
  );
}

export function useDashboardFilterContext(): DashboardFilterContextValue {
  const ctx = React.useContext(DashboardFilterContext);
  if (!ctx) {
    throw new Error(
      "useDashboardFilterContext must be used within DashboardFilterProvider",
    );
  }
  return ctx;
}

export function useOptionalDashboardFilterContext():
  | DashboardFilterContextValue
  | null {
  return React.useContext(DashboardFilterContext);
}
