import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Global scope store — shared data-scoping state lifted out of per-page ContextBar.
 * Row 1 selectors (Org / Client / Family→Archetype / Strategy) write to this store.
 * Row 2 Live/As-Of toggle writes to this store.
 * All service pages read from it instead of maintaining local state.
 *
 * Field map (post v2 redesign — see docs/audits/global-filters-v2.md §6):
 *   - assetGroupIds       — legacy 5-asset-group filter (CeFi/DeFi/TradFi/Sports/Prediction).
 *                           Top bar no longer writes to it; data hooks still honor it. The
 *                           field stays so an Asset Class pill can be reintroduced as a
 *                           single-component edit. Renamed from `strategyFamilyIds` (v1→v2
 *                           migrate below).
 *   - strategyFamilyIdsV2 — multi-select of v2 families (e.g. "CARRY_AND_YIELD"). Written
 *                           by the Family→Archetype pill.
 *   - strategyArchetypeIds— multi-select of v2 archetypes (e.g. "CARRY_BASIS_PERP"). Written
 *                           by the Family→Archetype pill.
 *   - strategyFamily / strategyArchetype — older single-pick fields kept for the
 *                           architecture-v2 picker and signals dashboard. Top bar does
 *                           not touch these.
 */

export interface GlobalScopeState {
  organizationIds: string[];
  clientIds: string[];
  strategyIds: string[];
  /** Legacy 5-asset-group filter; kept for reversibility (see docs/audits/global-filters-v2.md §10). */
  assetGroupIds: string[];
  /** v2 multi-select of strategy families. */
  strategyFamilyIdsV2: string[];
  /** v2 multi-select of strategy archetypes. */
  strategyArchetypeIds: string[];
  /** v2 single-family picker selection (used by architecture-v2 picker, not top bar). */
  strategyFamily?: string;
  /** v2 single-archetype picker selection (used by architecture-v2 picker, not top bar). */
  strategyArchetype?: string;
  underlyingIds: string[];
  mode: "live" | "batch";
  asOfDatetime?: string;
}

interface GlobalScopeActions {
  scope: GlobalScopeState;
  setOrganizationIds: (ids: string[]) => void;
  setClientIds: (ids: string[]) => void;
  setStrategyIds: (ids: string[]) => void;
  setAssetGroupIds: (ids: string[]) => void;
  setStrategyFamilyIdsV2: (ids: string[]) => void;
  setStrategyArchetypeIds: (ids: string[]) => void;
  setStrategyFamily: (family: string | undefined) => void;
  setStrategyArchetype: (archetype: string | undefined) => void;
  setUnderlyingIds: (ids: string[]) => void;
  setMode: (mode: "live" | "batch") => void;
  setAsOfDatetime: (dt: string | undefined) => void;
  clearAll: () => void;
  reset: () => void;
}

const STORAGE_KEY = "unified-global-scope";

const INITIAL_SCOPE: GlobalScopeState = {
  organizationIds: [],
  clientIds: [],
  strategyIds: [],
  assetGroupIds: [],
  strategyFamilyIdsV2: [],
  strategyArchetypeIds: [],
  strategyFamily: undefined,
  strategyArchetype: undefined,
  underlyingIds: [],
  mode: "live",
  asOfDatetime: undefined,
};

export const useGlobalScope = create<GlobalScopeActions>()(
  persist(
    (set) => ({
      scope: { ...INITIAL_SCOPE },
      setOrganizationIds: (ids) => set((s) => ({ scope: { ...s.scope, organizationIds: ids } })),
      setClientIds: (ids) => set((s) => ({ scope: { ...s.scope, clientIds: ids } })),
      setStrategyIds: (ids) => set((s) => ({ scope: { ...s.scope, strategyIds: ids } })),
      setAssetGroupIds: (ids) => set((s) => ({ scope: { ...s.scope, assetGroupIds: ids } })),
      setStrategyFamilyIdsV2: (ids) => set((s) => ({ scope: { ...s.scope, strategyFamilyIdsV2: ids } })),
      setStrategyArchetypeIds: (ids) => set((s) => ({ scope: { ...s.scope, strategyArchetypeIds: ids } })),
      setStrategyFamily: (family) =>
        set((s) => ({
          scope: {
            ...s.scope,
            strategyFamily: family,
            // Changing family invalidates archetype selection (v2 cascading picker invariant).
            strategyArchetype: family === undefined ? undefined : s.scope.strategyArchetype,
          },
        })),
      setStrategyArchetype: (archetype) => set((s) => ({ scope: { ...s.scope, strategyArchetype: archetype } })),
      setUnderlyingIds: (ids) => set((s) => ({ scope: { ...s.scope, underlyingIds: ids } })),
      setMode: (mode) =>
        set((s) => ({
          scope: {
            ...s.scope,
            mode,
            asOfDatetime: mode === "live" ? undefined : (s.scope.asOfDatetime ?? new Date().toISOString().slice(0, 16)),
          },
        })),
      setAsOfDatetime: (dt) => set((s) => ({ scope: { ...s.scope, asOfDatetime: dt } })),
      clearAll: () => {
        localStorage.removeItem(STORAGE_KEY);
        set({ scope: { ...INITIAL_SCOPE } });
      },
      reset: () => {
        localStorage.removeItem(STORAGE_KEY);
        set({ scope: { ...INITIAL_SCOPE } });
      },
    }),
    {
      name: STORAGE_KEY,
      version: 2,
      migrate: (persistedState: unknown, version: number) => {
        const s = (persistedState ?? {}) as { scope?: Partial<GlobalScopeState> & { strategyFamilyIds?: unknown } };
        const saved = s.scope ?? {};
        // v0 → v1 normalised the basic shape. v1 → v2 renames the misnamed legacy
        // `strategyFamilyIds` (which holds asset groups, not families) to
        // `assetGroupIds` and adds the v2 multi-select fields.
        if (version < 2) {
          return {
            scope: {
              ...INITIAL_SCOPE,
              mode: saved.mode === "live" || saved.mode === "batch" ? saved.mode : INITIAL_SCOPE.mode,
              organizationIds: Array.isArray(saved.organizationIds) ? saved.organizationIds : [],
              clientIds: Array.isArray(saved.clientIds) ? saved.clientIds : [],
              strategyIds: Array.isArray(saved.strategyIds) ? saved.strategyIds : [],
              assetGroupIds: Array.isArray(saved.strategyFamilyIds)
                ? (saved.strategyFamilyIds as string[])
                : Array.isArray(saved.assetGroupIds)
                  ? saved.assetGroupIds
                  : [],
              strategyFamilyIdsV2: Array.isArray(saved.strategyFamilyIdsV2) ? saved.strategyFamilyIdsV2 : [],
              strategyArchetypeIds: Array.isArray(saved.strategyArchetypeIds) ? saved.strategyArchetypeIds : [],
              strategyFamily: typeof saved.strategyFamily === "string" ? saved.strategyFamily : undefined,
              strategyArchetype: typeof saved.strategyArchetype === "string" ? saved.strategyArchetype : undefined,
              underlyingIds: Array.isArray(saved.underlyingIds) ? saved.underlyingIds : [],
            },
          };
        }
        return persistedState;
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.warn("[global-scope-store] rehydration error — resetting", error);
          localStorage.removeItem(STORAGE_KEY);
        }
      },
    },
  ),
);
