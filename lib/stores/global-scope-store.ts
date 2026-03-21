import { create } from "zustand"

/**
 * Global scope store — shared data-scoping state lifted out of per-page ContextBar.
 * Row 1 selectors (Org / Client / Strategy) write to this store.
 * Row 2 Live/As-Of toggle writes to this store.
 * All service pages read from it instead of maintaining local state.
 */

export interface GlobalScopeState {
  organizationIds: string[]
  clientIds: string[]
  strategyIds: string[]
  underlyingIds: string[]
  mode: "live" | "batch"
  asOfDatetime?: string
}

interface GlobalScopeActions {
  scope: GlobalScopeState
  setOrganizationIds: (ids: string[]) => void
  setClientIds: (ids: string[]) => void
  setStrategyIds: (ids: string[]) => void
  setUnderlyingIds: (ids: string[]) => void
  setMode: (mode: "live" | "batch") => void
  setAsOfDatetime: (dt: string | undefined) => void
  clearAll: () => void
  reset: () => void
}

const INITIAL_SCOPE: GlobalScopeState = {
  organizationIds: [],
  clientIds: [],
  strategyIds: [],
  underlyingIds: [],
  mode: "live",
  asOfDatetime: undefined,
}

export const useGlobalScope = create<GlobalScopeActions>((set) => ({
  scope: { ...INITIAL_SCOPE },
  setOrganizationIds: (ids) => set((s) => ({ scope: { ...s.scope, organizationIds: ids } })),
  setClientIds: (ids) => set((s) => ({ scope: { ...s.scope, clientIds: ids } })),
  setStrategyIds: (ids) => set((s) => ({ scope: { ...s.scope, strategyIds: ids } })),
  setUnderlyingIds: (ids) => set((s) => ({ scope: { ...s.scope, underlyingIds: ids } })),
  setMode: (mode) => set((s) => ({
    scope: {
      ...s.scope,
      mode,
      asOfDatetime: mode === "live" ? undefined : s.scope.asOfDatetime ?? new Date().toISOString().slice(0, 16),
    },
  })),
  setAsOfDatetime: (dt) => set((s) => ({ scope: { ...s.scope, asOfDatetime: dt } })),
  clearAll: () => set({ scope: { ...INITIAL_SCOPE } }),
  reset: () => set({ scope: { ...INITIAL_SCOPE } }),
}))
