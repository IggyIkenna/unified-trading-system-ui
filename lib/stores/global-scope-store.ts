import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Global scope store — shared data-scoping state lifted out of per-page ContextBar.
 * Row 1 selectors (Org / Client / Strategy) write to this store.
 * Row 2 Live/As-Of toggle writes to this store.
 * All service pages read from it instead of maintaining local state.
 */

export interface GlobalScopeState {
  organizationIds: string[];
  clientIds: string[];
  strategyIds: string[];
  strategyFamilyIds: string[];
  /** v2 single-family picker selection (distinct from legacy `strategyFamilyIds` tag list). */
  strategyFamily?: string;
  /** v2 single-archetype picker selection. */
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
  setStrategyFamilyIds: (ids: string[]) => void;
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
  strategyFamilyIds: [],
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
      setStrategyFamilyIds: (ids) => set((s) => ({ scope: { ...s.scope, strategyFamilyIds: ids } })),
      setStrategyFamily: (family) =>
        set((s) => ({
          scope: {
            ...s.scope,
            strategyFamily: family,
            // Changing family invalidates archetype selection (v2 cascading picker invariant).
            strategyArchetype:
              family === undefined ? undefined : s.scope.strategyArchetype,
          },
        })),
      setStrategyArchetype: (archetype) =>
        set((s) => ({ scope: { ...s.scope, strategyArchetype: archetype } })),
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
      version: 1,
      migrate: (persistedState: unknown, version: number) => {
        if (version < 1) {
          const s = (persistedState ?? {}) as { scope?: Partial<GlobalScopeState> };
          const saved = s.scope ?? {};
          return {
            scope: {
              ...INITIAL_SCOPE,
              mode: saved.mode === "live" || saved.mode === "batch" ? saved.mode : INITIAL_SCOPE.mode,
              organizationIds: Array.isArray(saved.organizationIds) ? saved.organizationIds : [],
              clientIds: Array.isArray(saved.clientIds) ? saved.clientIds : [],
              strategyIds: Array.isArray(saved.strategyIds) ? saved.strategyIds : [],
              strategyFamilyIds: Array.isArray(saved.strategyFamilyIds) ? saved.strategyFamilyIds : [],
              strategyFamily: typeof saved.strategyFamily === "string" ? saved.strategyFamily : undefined,
              strategyArchetype:
                typeof saved.strategyArchetype === "string" ? saved.strategyArchetype : undefined,
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
