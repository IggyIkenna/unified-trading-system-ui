"use client";

/**
 * WorkspaceScopeStore — the unified Zustand store for DART cockpit scope.
 *
 * Per dart_ux_cockpit_refactor_2026_04_29.plan.md §4 / §4.1 / §4.2 / §4.3 / §17.
 *
 * Replaces (clean cut, no compatibility shims):
 *   - lib/stores/global-scope-store.ts (deleted)
 *   - lib/context/dashboard-filter-context.tsx (deleted)
 *
 * Persistence:
 *   - localStorage key `dart-workspace-scope` (Zustand persist middleware)
 *   - URL query parameters per §7 (hydrate-on-mount via WorkspaceScopeProvider)
 *
 * Telemetry:
 *   - Every mutation emits a `ScopeChangeEvent` via lib/analytics/track.ts
 *
 * Safety:
 *   - executionStream Live transitions go through guarded action with confirm
 *     dialog at the call-site (§4.3); URL hydration of `stream=live` silently
 *     downgrades to `paper` when the persona lacks live-trading entitlement.
 */

import { create, type StoreApi, type UseBoundStore } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import {
  EMPTY_WORKSPACE_SCOPE,
  parseWorkspaceScope,
  serializeWorkspaceScope,
  type ScopeChangeEvent,
  type ScopeChangeSource,
  type WorkspaceEngagement,
  type WorkspaceExecutionStream,
  type WorkspaceScope,
  type WorkspaceSurface,
  type TerminalMode,
  type ResearchStage,
  type WorkspaceMode,
} from "@/lib/architecture-v2/workspace-scope";
import { trackScopeChange } from "@/lib/analytics/track";

// ─────────────────────────────────────────────────────────────────────────────
// Store shape
// ─────────────────────────────────────────────────────────────────────────────

export interface WorkspaceScopeStore {
  readonly scope: WorkspaceScope;

  // Setters — every mutation accepts a `source` so analytics can attribute
  // funnel sequences. Callers should pass the precise source from
  // ScopeChangeSource (e.g. "scope-bar", "preset", "wizard").

  setAssetGroups: (next: WorkspaceScope["assetGroups"], source?: ScopeChangeSource) => void;
  setInstrumentTypes: (next: WorkspaceScope["instrumentTypes"], source?: ScopeChangeSource) => void;
  setFamilies: (next: WorkspaceScope["families"], source?: ScopeChangeSource) => void;
  setArchetypes: (next: WorkspaceScope["archetypes"], source?: ScopeChangeSource) => void;
  setStrategyIds: (next: WorkspaceScope["strategyIds"], source?: ScopeChangeSource) => void;
  setShareClasses: (next: WorkspaceScope["shareClasses"], source?: ScopeChangeSource) => void;
  setVenueOrProtocolIds: (next: WorkspaceScope["venueOrProtocolIds"], source?: ScopeChangeSource) => void;
  setAccountOrMandateId: (next: string | null, source?: ScopeChangeSource) => void;
  setSurface: (next: WorkspaceSurface, source?: ScopeChangeSource) => void;
  setTerminalMode: (next: TerminalMode | null, source?: ScopeChangeSource) => void;
  setResearchStage: (next: ResearchStage | null, source?: ScopeChangeSource) => void;
  setEngagement: (next: WorkspaceEngagement, source?: ScopeChangeSource) => void;
  /**
   * Set the execution stream. The §4.3 safety contract is enforced at the
   * call-site (confirm dialog + entitlement check) — this setter trusts the
   * caller has performed those checks.
   */
  setExecutionStream: (next: WorkspaceExecutionStream, source?: ScopeChangeSource) => void;
  setMode: (next: WorkspaceMode, source?: ScopeChangeSource) => void;
  setWorkspaceId: (next: string | null, source?: ScopeChangeSource) => void;
  setAsOfTs: (next: string | null, source?: ScopeChangeSource) => void;
  setOrganizationIds: (next: WorkspaceScope["organizationIds"], source?: ScopeChangeSource) => void;
  setClientIds: (next: WorkspaceScope["clientIds"], source?: ScopeChangeSource) => void;
  setUnderlyingIds: (next: WorkspaceScope["underlyingIds"], source?: ScopeChangeSource) => void;
  setCoverageStatuses: (next: WorkspaceScope["coverageStatuses"], source?: ScopeChangeSource) => void;
  setMaturityPhases: (next: WorkspaceScope["maturityPhases"], source?: ScopeChangeSource) => void;
  setProductRoutings: (next: WorkspaceScope["productRoutings"], source?: ScopeChangeSource) => void;
  setAvailabilityStates: (next: WorkspaceScope["availabilityStates"], source?: ScopeChangeSource) => void;

  /**
   * Bulk-set multiple scope fields at once. Emits a single ScopeChangeEvent
   * for the whole transition. Used by URL hydration + preset application.
   */
  applyScope: (next: Partial<WorkspaceScope>, source?: ScopeChangeSource) => void;

  /** Replace the entire scope. Used by URL hydration + reset. */
  replaceScope: (next: WorkspaceScope, source?: ScopeChangeSource) => void;

  /** Reset to EMPTY_WORKSPACE_SCOPE. */
  reset: (source?: ScopeChangeSource) => void;
}

const STORAGE_KEY = "dart-workspace-scope";
const STORE_VERSION = 1;

function emit(previous: WorkspaceScope, next: WorkspaceScope, source: ScopeChangeSource): void {
  if (previous === next) return;
  const event: ScopeChangeEvent = {
    previousScope: previous,
    nextScope: next,
    source,
    timestamp: new Date().toISOString(),
    userId: null, // populated by trackScopeChange via auth context if available
    sessionId: null,
  };
  trackScopeChange(event);
}

function makeSetter<K extends keyof WorkspaceScope>(
  set: StoreApi<WorkspaceScopeStore>["setState"],
  get: StoreApi<WorkspaceScopeStore>["getState"],
  field: K,
  defaultSource: ScopeChangeSource,
): (value: WorkspaceScope[K], source?: ScopeChangeSource) => void {
  return (value, source = defaultSource) => {
    const previous = get().scope;
    if (previous[field] === value) return;
    const next: WorkspaceScope = { ...previous, [field]: value };
    set({ scope: next });
    emit(previous, next, source);
  };
}

export const useWorkspaceScopeStore: UseBoundStore<StoreApi<WorkspaceScopeStore>> = create<WorkspaceScopeStore>()(
  persist(
    (set, get) => ({
      scope: { ...EMPTY_WORKSPACE_SCOPE },

      setAssetGroups: makeSetter(set, get, "assetGroups", "scope-bar"),
      setInstrumentTypes: makeSetter(set, get, "instrumentTypes", "scope-bar"),
      setFamilies: makeSetter(set, get, "families", "scope-bar"),
      setArchetypes: makeSetter(set, get, "archetypes", "scope-bar"),
      setStrategyIds: makeSetter(set, get, "strategyIds", "scope-bar"),
      setShareClasses: makeSetter(set, get, "shareClasses", "scope-bar"),
      setVenueOrProtocolIds: makeSetter(set, get, "venueOrProtocolIds", "scope-bar"),
      setAccountOrMandateId: makeSetter(set, get, "accountOrMandateId", "scope-bar"),
      setSurface: makeSetter(set, get, "surface", "surface-toggle"),
      setTerminalMode: makeSetter(set, get, "terminalMode", "terminal-mode-toggle"),
      setResearchStage: makeSetter(set, get, "researchStage", "research-stage-toggle"),
      setEngagement: makeSetter(set, get, "engagement", "engagement-toggle"),
      setExecutionStream: makeSetter(set, get, "executionStream", "execution-stream-toggle"),
      setMode: makeSetter(set, get, "mode", "scope-bar"),
      setWorkspaceId: makeSetter(set, get, "workspaceId", "scope-bar"),
      setAsOfTs: makeSetter(set, get, "asOfTs", "scope-bar"),
      setOrganizationIds: makeSetter(set, get, "organizationIds", "scope-bar"),
      setClientIds: makeSetter(set, get, "clientIds", "scope-bar"),
      setUnderlyingIds: makeSetter(set, get, "underlyingIds", "scope-bar"),
      setCoverageStatuses: makeSetter(set, get, "coverageStatuses", "scope-bar"),
      setMaturityPhases: makeSetter(set, get, "maturityPhases", "scope-bar"),
      setProductRoutings: makeSetter(set, get, "productRoutings", "scope-bar"),
      setAvailabilityStates: makeSetter(set, get, "availabilityStates", "scope-bar"),

      applyScope: (partial, source = "programmatic") => {
        const previous = get().scope;
        const next: WorkspaceScope = { ...previous, ...partial };
        set({ scope: next });
        emit(previous, next, source);
      },

      replaceScope: (next, source = "programmatic") => {
        const previous = get().scope;
        if (previous === next) return;
        set({ scope: next });
        emit(previous, next, source);
      },

      reset: (source = "reset") => {
        const previous = get().scope;
        const next = { ...EMPTY_WORKSPACE_SCOPE };
        set({ scope: next });
        emit(previous, next, source);
      },
    }),
    {
      name: STORAGE_KEY,
      version: STORE_VERSION,
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          // SSR-safe noop storage; client hydrate will populate.
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return window.localStorage;
      }),
      partialize: (state) => ({ scope: state.scope }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.warn("[workspace-scope-store] rehydration error — resetting", error);
          if (typeof window !== "undefined") {
            try {
              window.localStorage.removeItem(STORAGE_KEY);
            } catch {
              // Quota / disabled — silent.
            }
          }
        }
      },
    },
  ),
);

// ─────────────────────────────────────────────────────────────────────────────
// Public hook surface
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Read the current WorkspaceScope. Equivalent to
 * `useWorkspaceScopeStore((s) => s.scope)`.
 */
export function useWorkspaceScope(): WorkspaceScope {
  return useWorkspaceScopeStore((s) => s.scope);
}

/**
 * Read the full WorkspaceScopeStore (scope + setters). Use sparingly; prefer
 * `useWorkspaceScope()` for read-only consumers and select individual setters
 * via the store hook directly to minimise re-renders.
 */
export function useWorkspaceScopeActions(): Omit<WorkspaceScopeStore, "scope"> {
  return useWorkspaceScopeStore((s) => ({
    setAssetGroups: s.setAssetGroups,
    setInstrumentTypes: s.setInstrumentTypes,
    setFamilies: s.setFamilies,
    setArchetypes: s.setArchetypes,
    setStrategyIds: s.setStrategyIds,
    setShareClasses: s.setShareClasses,
    setVenueOrProtocolIds: s.setVenueOrProtocolIds,
    setAccountOrMandateId: s.setAccountOrMandateId,
    setSurface: s.setSurface,
    setTerminalMode: s.setTerminalMode,
    setResearchStage: s.setResearchStage,
    setEngagement: s.setEngagement,
    setExecutionStream: s.setExecutionStream,
    setMode: s.setMode,
    setWorkspaceId: s.setWorkspaceId,
    setAsOfTs: s.setAsOfTs,
    setOrganizationIds: s.setOrganizationIds,
    setClientIds: s.setClientIds,
    setUnderlyingIds: s.setUnderlyingIds,
    setCoverageStatuses: s.setCoverageStatuses,
    setMaturityPhases: s.setMaturityPhases,
    setProductRoutings: s.setProductRoutings,
    setAvailabilityStates: s.setAvailabilityStates,
    applyScope: s.applyScope,
    replaceScope: s.replaceScope,
    reset: s.reset,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// URL hydration helpers (called by WorkspaceScopeProvider)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hydrate the store from URL search parameters per §7. Returns the parsed
 * scope so the caller can react if needed (e.g. trigger a re-render).
 *
 * Per §4.3: `stream=live` is silently downgraded to `paper` when
 * `hasLiveTradingEntitlement` is false.
 */
export function hydrateScopeFromUrl(
  searchParams: URLSearchParams | Record<string, string | undefined>,
  options?: { hasLiveTradingEntitlement?: boolean },
): void {
  const parsed = parseWorkspaceScope(searchParams);
  const safeStream: WorkspaceExecutionStream =
    parsed.executionStream === "live" && !(options?.hasLiveTradingEntitlement ?? false)
      ? "paper"
      : parsed.executionStream;
  if (parsed.executionStream === "live" && safeStream === "paper") {
    console.warn(
      "[workspace-scope-store] stream=live in URL but persona lacks live-trading entitlement; downgraded to paper",
    );
  }
  const safe: WorkspaceScope = { ...parsed, executionStream: safeStream };
  useWorkspaceScopeStore.getState().replaceScope(safe, "url-hydration");
}

/** Serialize the active scope to a query-string suffix (no leading `?`). */
export function currentScopeQueryString(): string {
  const scope = useWorkspaceScopeStore.getState().scope;
  const params = new URLSearchParams(serializeWorkspaceScope(scope));
  return params.toString();
}
