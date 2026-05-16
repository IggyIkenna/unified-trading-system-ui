/**
 * WorkspaceScope — the unified control-plane state for the DART cockpit.
 *
 * Per dart_ux_cockpit_refactor_2026_04_29.md §4 + §4.4:
 *   - Five filter axes (asset_group / instrument_type / family / archetype / strategy)
 *   - Share class (real product dimension for BTC-neutral / ETH-native / USD funds)
 *   - Surface (Terminal / Research / Reports / Signals / Ops / Dashboard)
 *   - Mode within surface (terminalMode / researchStage)
 *   - Engagement (monitor / replicate)
 *   - Execution stream (paper / live) — §4.3 safety contract applies on transitions
 *   - Workspace + as-of timestamp + venue/protocol + account/mandate context
 *   - Advanced axes applied implicitly by the §4.5 resolver (coverage / maturity /
 *     routing / availability)
 *
 * Replaces:
 *   - lib/stores/global-scope-store.ts (deleted in this refactor)
 *   - lib/context/dashboard-filter-context.tsx (deleted in this refactor)
 *
 * URL keys per §7. Round-trip every field; advanced fields normally hidden from
 * buyer-facing copy-paste links but always serializable for admin / QA debug.
 */

import type { ShareClass, StrategyArchetype, StrategyFamily, VenueAssetGroupV2 } from "./enums";
import type { ProductRouting, StrategyMaturityPhase, VenueSetVariantId } from "./lifecycle";

// ─────────────────────────────────────────────────────────────────────────────
// Type definitions
// ─────────────────────────────────────────────────────────────────────────────

export type WorkspaceSurface = "dashboard" | "terminal" | "research" | "reports" | "signals" | "ops";

export type TerminalMode = "command" | "markets" | "strategies" | "explain" | "ops";

export type ResearchStage = "discover" | "build" | "train" | "validate" | "allocate" | "promote";

export type WorkspaceEngagement = "monitor" | "replicate";

export type WorkspaceExecutionStream = "paper" | "live";

export type CoverageStatus = "SUPPORTED" | "PARTIAL" | "BLOCKED";

export type AvailabilityState = "PUBLIC" | "INVESTMENT_MANAGEMENT_RESERVED" | "CLIENT_EXCLUSIVE" | "RETIRED";

export type WorkspaceMode = "live" | "batch";

/**
 * Canonical WorkspaceScope shape. Every field optional except those with sane
 * defaults (`assetGroups: []`, `engagement: "monitor"`, etc.).
 */
export interface WorkspaceScope {
  // Five filter axes
  readonly assetGroups: readonly VenueAssetGroupV2[];
  readonly instrumentTypes: readonly string[];
  readonly families: readonly StrategyFamily[];
  readonly archetypes: readonly StrategyArchetype[];
  readonly strategyIds: readonly string[];

  // Share class + venue/account context
  readonly shareClasses: readonly ShareClass[];
  readonly venueOrProtocolIds: readonly string[];
  readonly accountOrMandateId: string | null;

  // Surface + foreground mode/stage
  readonly surface: WorkspaceSurface;
  readonly terminalMode: TerminalMode | null;
  readonly researchStage: ResearchStage | null;

  // Engagement dial + execution stream
  readonly engagement: WorkspaceEngagement;
  readonly executionStream: WorkspaceExecutionStream;

  // Workspace identity + temporal context
  readonly workspaceId: string | null;
  readonly asOfTs: string | null;

  // Live vs batch mode (preserved from prior global-scope-store; orthogonal to
  // executionStream which targets routing of replicate-engagement orders).
  readonly mode: WorkspaceMode;

  // Org/client cascade (preserved from prior global-scope-store)
  readonly organizationIds: readonly string[];
  readonly clientIds: readonly string[];
  readonly underlyingIds: readonly string[];

  // Advanced filters (applied implicitly by §4.5 resolver; usable for admin/QA)
  readonly coverageStatuses: readonly CoverageStatus[];
  readonly maturityPhases: readonly StrategyMaturityPhase[];
  readonly productRoutings: readonly ProductRouting[];
  readonly availabilityStates: readonly AvailabilityState[];
  readonly venueSetVariants: readonly VenueSetVariantId[];
}

export const EMPTY_WORKSPACE_SCOPE: WorkspaceScope = {
  assetGroups: [],
  instrumentTypes: [],
  families: [],
  archetypes: [],
  strategyIds: [],
  shareClasses: [],
  venueOrProtocolIds: [],
  accountOrMandateId: null,
  surface: "dashboard",
  terminalMode: null,
  researchStage: null,
  engagement: "monitor",
  executionStream: "paper",
  workspaceId: null,
  asOfTs: null,
  mode: "live",
  organizationIds: [],
  clientIds: [],
  underlyingIds: [],
  coverageStatuses: [],
  maturityPhases: [],
  productRoutings: [],
  availabilityStates: [],
  venueSetVariants: [],
};

// ─────────────────────────────────────────────────────────────────────────────
// Scope-change event contract (§4.2)
// ─────────────────────────────────────────────────────────────────────────────

export type ScopeChangeSource =
  | "dashboard-filter"
  | "scope-bar"
  | "preset"
  | "wizard"
  | "url-hydration"
  | "breadcrumb"
  | "widget-suggestion"
  | "route-redirect"
  | "surface-toggle"
  | "terminal-mode-toggle"
  | "research-stage-toggle"
  | "engagement-toggle"
  | "execution-stream-toggle"
  | "programmatic"
  | "reset";

export interface ScopeChangeEvent {
  readonly previousScope: WorkspaceScope;
  readonly nextScope: WorkspaceScope;
  readonly source: ScopeChangeSource;
  readonly timestamp: string; // ISO 8601
  readonly userId: string | null;
  readonly sessionId: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// URL serialization (§7)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * URL keys (kept short, every WorkspaceScope field round-trips per §7).
 * Advanced keys (cov / mat / route / avail / venue_set) round-trip on URL but
 * are normally applied implicitly by the resolver per persona.
 */
export const SCOPE_URL_KEYS = {
  surface: "surface",
  terminalMode: "tm",
  researchStage: "rs",
  assetGroups: "ag",
  instrumentTypes: "it",
  families: "fam",
  archetypes: "arch",
  strategyIds: "sid",
  shareClasses: "sc",
  venueOrProtocolIds: "venue",
  accountOrMandateId: "acc",
  engagement: "eng",
  executionStream: "stream",
  workspaceId: "ws",
  asOfTs: "as",
  mode: "mode",
  organizationIds: "org",
  clientIds: "client",
  underlyingIds: "und",
  coverageStatuses: "cov",
  maturityPhases: "mat",
  productRoutings: "route",
  availabilityStates: "avail",
  venueSetVariants: "venue_set",
} as const;

const VALID_SURFACES: ReadonlySet<WorkspaceSurface> = new Set([
  "dashboard",
  "terminal",
  "research",
  "reports",
  "signals",
  "ops",
]);

const VALID_TERMINAL_MODES: ReadonlySet<TerminalMode> = new Set(["command", "markets", "strategies", "explain", "ops"]);

const VALID_RESEARCH_STAGES: ReadonlySet<ResearchStage> = new Set([
  "discover",
  "build",
  "train",
  "validate",
  "allocate",
  "promote",
]);

const VALID_ENGAGEMENTS: ReadonlySet<WorkspaceEngagement> = new Set(["monitor", "replicate"]);

const VALID_STREAMS: ReadonlySet<WorkspaceExecutionStream> = new Set(["paper", "live"]);

const VALID_MODES: ReadonlySet<WorkspaceMode> = new Set(["live", "batch"]);

const VALID_ASSET_GROUPS: ReadonlySet<string> = new Set(["CEFI", "DEFI", "TRADFI", "SPORTS", "PREDICTION"]);

const VALID_COVERAGE: ReadonlySet<CoverageStatus> = new Set(["SUPPORTED", "PARTIAL", "BLOCKED"]);

const VALID_AVAILABILITY: ReadonlySet<AvailabilityState> = new Set([
  "PUBLIC",
  "INVESTMENT_MANAGEMENT_RESERVED",
  "CLIENT_EXCLUSIVE",
  "RETIRED",
]);

const VALID_ROUTINGS: ReadonlySet<ProductRouting> = new Set(["dart_only", "im_only", "both", "internal_only"]);

const VALID_SHARE_CLASSES: ReadonlySet<string> = new Set([
  "USDT",
  "USDC",
  "FDUSD",
  "USD",
  "GBP",
  "EUR",
  "ETH",
  "BTC",
  "SOL",
]);

function csvSet<T extends string>(raw: string | undefined, valid: ReadonlySet<string>): readonly T[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is T => valid.has(s)) as readonly T[];
}

function csvList(raw: string | undefined): readonly string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Serialize a WorkspaceScope to a `URLSearchParams`-compatible record. Empty
 * fields are omitted so the resulting query string is minimal.
 */
export function serializeWorkspaceScope(scope: WorkspaceScope): Record<string, string> {
  const out: Record<string, string> = {};
  if (scope.surface !== EMPTY_WORKSPACE_SCOPE.surface) out[SCOPE_URL_KEYS.surface] = scope.surface;
  if (scope.terminalMode) out[SCOPE_URL_KEYS.terminalMode] = scope.terminalMode;
  if (scope.researchStage) out[SCOPE_URL_KEYS.researchStage] = scope.researchStage;
  if (scope.assetGroups.length > 0) out[SCOPE_URL_KEYS.assetGroups] = scope.assetGroups.join(",");
  if (scope.instrumentTypes.length > 0) out[SCOPE_URL_KEYS.instrumentTypes] = scope.instrumentTypes.join(",");
  if (scope.families.length > 0) out[SCOPE_URL_KEYS.families] = scope.families.join(",");
  if (scope.archetypes.length > 0) out[SCOPE_URL_KEYS.archetypes] = scope.archetypes.join(",");
  if (scope.strategyIds.length > 0) out[SCOPE_URL_KEYS.strategyIds] = scope.strategyIds.join(",");
  if (scope.shareClasses.length > 0) out[SCOPE_URL_KEYS.shareClasses] = scope.shareClasses.join(",");
  if (scope.venueOrProtocolIds.length > 0) out[SCOPE_URL_KEYS.venueOrProtocolIds] = scope.venueOrProtocolIds.join(",");
  if (scope.accountOrMandateId) out[SCOPE_URL_KEYS.accountOrMandateId] = scope.accountOrMandateId;
  if (scope.engagement !== EMPTY_WORKSPACE_SCOPE.engagement) out[SCOPE_URL_KEYS.engagement] = scope.engagement;
  if (scope.executionStream !== EMPTY_WORKSPACE_SCOPE.executionStream)
    out[SCOPE_URL_KEYS.executionStream] = scope.executionStream;
  if (scope.workspaceId) out[SCOPE_URL_KEYS.workspaceId] = scope.workspaceId;
  if (scope.asOfTs) out[SCOPE_URL_KEYS.asOfTs] = scope.asOfTs;
  if (scope.mode !== EMPTY_WORKSPACE_SCOPE.mode) out[SCOPE_URL_KEYS.mode] = scope.mode;
  if (scope.organizationIds.length > 0) out[SCOPE_URL_KEYS.organizationIds] = scope.organizationIds.join(",");
  if (scope.clientIds.length > 0) out[SCOPE_URL_KEYS.clientIds] = scope.clientIds.join(",");
  if (scope.underlyingIds.length > 0) out[SCOPE_URL_KEYS.underlyingIds] = scope.underlyingIds.join(",");
  if (scope.coverageStatuses.length > 0) out[SCOPE_URL_KEYS.coverageStatuses] = scope.coverageStatuses.join(",");
  if (scope.maturityPhases.length > 0) out[SCOPE_URL_KEYS.maturityPhases] = scope.maturityPhases.join(",");
  if (scope.productRoutings.length > 0) out[SCOPE_URL_KEYS.productRoutings] = scope.productRoutings.join(",");
  if (scope.availabilityStates.length > 0) out[SCOPE_URL_KEYS.availabilityStates] = scope.availabilityStates.join(",");
  if (scope.venueSetVariants.length > 0) out[SCOPE_URL_KEYS.venueSetVariants] = scope.venueSetVariants.join(",");
  return out;
}

/**
 * Parse a `URLSearchParams` (or compatible record) into a WorkspaceScope. Unknown
 * values for discriminated-union keys are dropped silently; the surface renders
 * the unfiltered universe in that case.
 *
 * Note: this never honours `stream=live` blindly — the §4.3 safety contract is
 * enforced at the store level (URL-hydrated `live` is downgraded to `paper` when
 * the persona lacks live-trading entitlement).
 */
export function parseWorkspaceScope(
  source: URLSearchParams | Readonly<Record<string, string | undefined>>,
): WorkspaceScope {
  const get = (key: string): string | undefined => {
    if (source instanceof URLSearchParams) {
      return source.get(key) ?? undefined;
    }
    return source[key];
  };

  const surfaceRaw = get(SCOPE_URL_KEYS.surface);
  const surface =
    surfaceRaw && VALID_SURFACES.has(surfaceRaw as WorkspaceSurface)
      ? (surfaceRaw as WorkspaceSurface)
      : EMPTY_WORKSPACE_SCOPE.surface;

  const tmRaw = get(SCOPE_URL_KEYS.terminalMode);
  const terminalMode = tmRaw && VALID_TERMINAL_MODES.has(tmRaw as TerminalMode) ? (tmRaw as TerminalMode) : null;

  const rsRaw = get(SCOPE_URL_KEYS.researchStage);
  const researchStage = rsRaw && VALID_RESEARCH_STAGES.has(rsRaw as ResearchStage) ? (rsRaw as ResearchStage) : null;

  const engRaw = get(SCOPE_URL_KEYS.engagement);
  const engagement =
    engRaw && VALID_ENGAGEMENTS.has(engRaw as WorkspaceEngagement)
      ? (engRaw as WorkspaceEngagement)
      : EMPTY_WORKSPACE_SCOPE.engagement;

  const streamRaw = get(SCOPE_URL_KEYS.executionStream);
  const executionStream =
    streamRaw && VALID_STREAMS.has(streamRaw as WorkspaceExecutionStream)
      ? (streamRaw as WorkspaceExecutionStream)
      : EMPTY_WORKSPACE_SCOPE.executionStream;

  const modeRaw = get(SCOPE_URL_KEYS.mode);
  const mode =
    modeRaw && VALID_MODES.has(modeRaw as WorkspaceMode) ? (modeRaw as WorkspaceMode) : EMPTY_WORKSPACE_SCOPE.mode;

  return {
    assetGroups: csvSet<VenueAssetGroupV2>(get(SCOPE_URL_KEYS.assetGroups), VALID_ASSET_GROUPS),
    instrumentTypes: csvList(get(SCOPE_URL_KEYS.instrumentTypes)),
    families: csvList(get(SCOPE_URL_KEYS.families)) as readonly StrategyFamily[],
    archetypes: csvList(get(SCOPE_URL_KEYS.archetypes)) as readonly StrategyArchetype[],
    strategyIds: csvList(get(SCOPE_URL_KEYS.strategyIds)),
    shareClasses: csvSet<ShareClass>(get(SCOPE_URL_KEYS.shareClasses), VALID_SHARE_CLASSES),
    venueOrProtocolIds: csvList(get(SCOPE_URL_KEYS.venueOrProtocolIds)),
    accountOrMandateId: get(SCOPE_URL_KEYS.accountOrMandateId) ?? null,
    surface,
    terminalMode,
    researchStage,
    engagement,
    executionStream,
    workspaceId: get(SCOPE_URL_KEYS.workspaceId) ?? null,
    asOfTs: get(SCOPE_URL_KEYS.asOfTs) ?? null,
    mode,
    organizationIds: csvList(get(SCOPE_URL_KEYS.organizationIds)),
    clientIds: csvList(get(SCOPE_URL_KEYS.clientIds)),
    underlyingIds: csvList(get(SCOPE_URL_KEYS.underlyingIds)),
    coverageStatuses: csvSet<CoverageStatus>(get(SCOPE_URL_KEYS.coverageStatuses), VALID_COVERAGE),
    maturityPhases: csvList(get(SCOPE_URL_KEYS.maturityPhases)) as readonly StrategyMaturityPhase[],
    productRoutings: csvSet<ProductRouting>(get(SCOPE_URL_KEYS.productRoutings), VALID_ROUTINGS),
    availabilityStates: csvSet<AvailabilityState>(get(SCOPE_URL_KEYS.availabilityStates), VALID_AVAILABILITY),
    venueSetVariants: csvList(get(SCOPE_URL_KEYS.venueSetVariants)) as readonly VenueSetVariantId[],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// matchesScope predicate (generalises matchesFamily — replaces it where the
// caller only needs a quick "does this row pass the active scope" check).
// ─────────────────────────────────────────────────────────────────────────────

export interface ScopeMatchableRow {
  readonly strategy_id?: string;
  readonly strategy_family?: string;
  readonly strategy_archetype?: string;
  readonly asset_group?: string;
  readonly instrument_type?: string;
  readonly share_class?: string;
  readonly venue?: string;
  readonly protocol?: string;
}

function fieldMatches(rowValue: string | undefined, filter: readonly string[]): boolean {
  if (filter.length === 0) return true; // No filter = match all
  if (rowValue === undefined || rowValue === "") return true; // Tolerant of unpopulated rows
  return filter.includes(rowValue);
}

/**
 * True when every active filter axis on `scope` is satisfied by `row`.
 * Rows with unpopulated fields are kept (tolerant — useful for mock-heavy
 * surfaces). Use {@link matchesScopeStrict} when stricter behaviour is needed.
 */
export function matchesScope(row: ScopeMatchableRow, scope: WorkspaceScope): boolean {
  if (!fieldMatches(row.strategy_family, scope.families)) return false;
  if (!fieldMatches(row.strategy_archetype, scope.archetypes)) return false;
  if (!fieldMatches(row.asset_group, scope.assetGroups)) return false;
  if (!fieldMatches(row.instrument_type, scope.instrumentTypes)) return false;
  if (!fieldMatches(row.share_class, scope.shareClasses)) return false;
  if (
    scope.venueOrProtocolIds.length > 0 &&
    row.venue !== undefined &&
    row.protocol !== undefined &&
    !scope.venueOrProtocolIds.includes(row.venue) &&
    !scope.venueOrProtocolIds.includes(row.protocol)
  ) {
    return false;
  }
  if (scope.strategyIds.length > 0 && row.strategy_id !== undefined) {
    if (!scope.strategyIds.includes(row.strategy_id)) return false;
  }
  return true;
}

/**
 * Strict variant of {@link matchesScope} — rows with unpopulated fields fail
 * the filter when any axis is active. Use only when you trust the row data
 * is complete.
 */
export function matchesScopeStrict(row: ScopeMatchableRow, scope: WorkspaceScope): boolean {
  const hasAnyAxis =
    scope.families.length > 0 ||
    scope.archetypes.length > 0 ||
    scope.assetGroups.length > 0 ||
    scope.instrumentTypes.length > 0 ||
    scope.shareClasses.length > 0 ||
    scope.venueOrProtocolIds.length > 0 ||
    scope.strategyIds.length > 0;
  if (!hasAnyAxis) return true;

  if (scope.families.length > 0 && (row.strategy_family === undefined || row.strategy_family === "")) {
    return false;
  }
  if (scope.archetypes.length > 0 && (row.strategy_archetype === undefined || row.strategy_archetype === "")) {
    return false;
  }
  if (scope.assetGroups.length > 0 && (row.asset_group === undefined || row.asset_group === "")) {
    return false;
  }
  return matchesScope(row, scope);
}
