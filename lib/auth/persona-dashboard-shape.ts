/**
 * Per-persona dashboard-tile visibility shape.
 *
 * Sibling to `persona-lifecycle-shape.ts`. Where that file governs the 4-stage
 * lifecycle-nav (Data · DART · Manage · Reports), THIS file governs the 6-tile
 * /dashboard product grid (DART Terminal · DART Research · Odum Signals ·
 * Reports · Investor Relations · Admin & Ops).
 *
 * 2026-04-28 tile split: legacy single `dart` tile split into `dart-terminal`
 * (Signals-In + DART-Full visible) and `dart-research` (DART-Full only;
 * padlocked-visible "locked" for Signals-In). FOMO behavior is default-on for
 * non-DART-Full users via the instrument-type gate (lib/architecture-v2/
 * user-instrument-types.ts), not a separate tier id.
 *
 * The two axes overlap but are NOT a 1:1 mapping:
 *   - Lifecycle-nav  = "how you work"         (stages of the pipeline)
 *   - Dashboard grid = "what products you own" (product-axis)
 *
 * SSOT: unified-trading-pm/codex/14-playbooks/dart/dart-terminal-vs-research.md
 */

import type { StageVisibility } from "./persona-lifecycle-shape";
import type { DashboardTileId } from "@/lib/config/services";

export type { StageVisibility } from "./persona-lifecycle-shape";
export type { DashboardTileId } from "@/lib/config/services";

export type DashboardTileVisibility = Record<DashboardTileId, StageVisibility>;

/** Sub-route-level visibility, keyed by tile id → sub-route key. */
export type DashboardSubRouteVisibility = Record<DashboardTileId, Record<string, StageVisibility>>;

// 2026-04-28 tile split: legacy single `dart` tile split into `dart-terminal`
// (Signals-In + DART-Full visible) and `dart-research` (DART-Full only;
// padlocked-visible for Signals-In). SSOT: codex/14-playbooks/dart/dart-terminal-vs-research.md.
const DEFAULT_TILE_SHAPE: DashboardTileVisibility = {
  "dart-terminal": "locked",
  "dart-research": "hidden",
  "odum-signals": "hidden",
  reports: "visible",
  "investor-relations": "hidden",
  admin: "hidden",
};

const DEFAULT_SUBROUTE_SHAPE: DashboardSubRouteVisibility = {
  "dart-terminal": {
    terminal: "locked",
    observe: "locked",
    "strategy-catalogue": "hidden",
    "signal-intake": "hidden",
    data: "hidden",
  },
  "dart-research": {
    "research-overview": "hidden",
    features: "hidden",
    "feature-etl": "hidden",
    quant: "hidden",
    strategies: "hidden",
    ml: "hidden",
    backtests: "hidden",
    signals: "hidden",
    "execution-research": "hidden",
    allocate: "hidden",
    promote: "hidden",
  },
  "odum-signals": {
    counterparties: "hidden",
    payloads: "hidden",
    "emission-history": "hidden",
    "rate-limits": "hidden",
  },
  reports: {
    "pnl-attribution": "visible",
    settlement: "visible",
    reconciliation: "visible",
    regulatory: "hidden",
    "own-account": "visible",
    catalogue: "visible",
  },
  "investor-relations": {
    board: "hidden",
    "dr-playbook": "hidden",
    security: "hidden",
    "ir-briefings": "hidden",
    "demo-preview": "hidden",
  },
  admin: {
    users: "hidden",
    orgs: "hidden",
    "strategy-universe": "hidden",
    "strategy-lifecycle-editor": "hidden",
    deployments: "hidden",
    "service-registry": "hidden",
    "system-health": "hidden",
    engagement: "hidden",
    "data-etl": "hidden",
    "audit-log": "hidden",
  },
};

function tileOverride(overrides: Partial<DashboardTileVisibility>): DashboardTileVisibility {
  return { ...DEFAULT_TILE_SHAPE, ...overrides };
}

function subRouteOverride(
  overrides: Partial<{
    [K in DashboardTileId]?: Partial<Record<string, StageVisibility>>;
  }>,
): DashboardSubRouteVisibility {
  const out: DashboardSubRouteVisibility = {
    "dart-terminal": { ...DEFAULT_SUBROUTE_SHAPE["dart-terminal"] },
    "dart-research": { ...DEFAULT_SUBROUTE_SHAPE["dart-research"] },
    "odum-signals": { ...DEFAULT_SUBROUTE_SHAPE["odum-signals"] },
    reports: { ...DEFAULT_SUBROUTE_SHAPE.reports },
    "investor-relations": { ...DEFAULT_SUBROUTE_SHAPE["investor-relations"] },
    admin: { ...DEFAULT_SUBROUTE_SHAPE.admin },
  };
  for (const [tileKey, chips] of Object.entries(overrides) as Array<
    [DashboardTileId, Partial<Record<string, StageVisibility>> | undefined]
  >) {
    if (!chips) continue;
    const merged = { ...out[tileKey] };
    for (const [chipKey, vis] of Object.entries(chips)) {
      if (vis !== undefined) merged[chipKey] = vis;
    }
    out[tileKey] = merged;
  }
  return out;
}

const ALL_VISIBLE_TILE: DashboardTileVisibility = {
  "dart-terminal": "visible",
  "dart-research": "visible",
  "odum-signals": "visible",
  reports: "visible",
  "investor-relations": "visible",
  admin: "visible",
};

const ALL_VISIBLE_SUBROUTES: DashboardSubRouteVisibility = {
  "dart-terminal": {
    terminal: "visible",
    observe: "visible",
    "strategy-catalogue": "visible",
    "signal-intake": "visible",
    data: "visible",
  },
  "dart-research": {
    "research-overview": "visible",
    features: "visible",
    "feature-etl": "visible",
    quant: "visible",
    strategies: "visible",
    ml: "visible",
    backtests: "visible",
    signals: "visible",
    "execution-research": "visible",
    allocate: "visible",
    promote: "visible",
  },
  "odum-signals": {
    counterparties: "visible",
    payloads: "visible",
    "emission-history": "visible",
    "rate-limits": "visible",
  },
  reports: {
    "pnl-attribution": "visible",
    settlement: "visible",
    reconciliation: "visible",
    regulatory: "visible",
    catalogue: "visible",
  },
  "investor-relations": {
    board: "visible",
    "dr-playbook": "visible",
    security: "visible",
    "ir-briefings": "visible",
    "demo-preview": "visible",
  },
  admin: {
    users: "visible",
    orgs: "visible",
    "strategy-universe": "visible",
    "strategy-lifecycle-editor": "visible",
    deployments: "visible",
    "service-registry": "visible",
    "system-health": "visible",
    engagement: "visible",
    "data-etl": "visible",
    "audit-log": "visible",
  },
};

// 2026-04-28 tile split: legacy `dart` tile entries migrated to `dart-terminal`
// (Signals-In + DART-Full visible) and `dart-research` (visible iff persona has
// strategy-full + ml-full; padlocked-visible "locked" otherwise; "hidden" if
// persona has no DART access at all). SSOT: codex/14-playbooks/dart/dart-terminal-vs-research.md
const PERSONA_TILE_SHAPES: Record<string, DashboardTileVisibility> = {
  // ── Admin + Internal — all 6 tiles visible
  admin: ALL_VISIBLE_TILE,
  "internal-trader": tileOverride({
    "dart-terminal": "visible",
    "dart-research": "visible",
    "odum-signals": "visible",
    reports: "visible",
    "investor-relations": "hidden",
    admin: "visible",
  }),
  "im-desk-operator": tileOverride({
    "dart-terminal": "visible",
    "dart-research": "visible",
    "odum-signals": "hidden",
    reports: "visible",
    "investor-relations": "visible",
    admin: "visible",
  }),

  // ── DART Full clients (have strategy-full + ml-full)
  "client-full": tileOverride({ "dart-terminal": "visible", "dart-research": "visible", reports: "visible" }),
  // client-premium has only basic trading entitlements — no strategy-full/ml-full
  "client-premium": tileOverride({ "dart-terminal": "visible", "dart-research": "locked", reports: "visible" }),
  // client-data-only has only data-basic — DART Research hidden entirely
  "client-data-only": tileOverride({ "dart-terminal": "visible", "dart-research": "hidden", reports: "hidden" }),
  "prospect-dart": tileOverride({ "dart-terminal": "visible", "dart-research": "visible", reports: "locked" }),

  // ── DART Signals-In (inbound) — DART Terminal visible, DART Research padlocked
  "prospect-signals-only": tileOverride({
    "dart-terminal": "visible",
    "dart-research": "locked",
    reports: "visible",
  }),

  // ── Odum Signals counterparty (outbound) — standalone tile
  "prospect-odum-signals": tileOverride({
    "dart-terminal": "hidden",
    "dart-research": "hidden",
    "odum-signals": "visible",
    reports: "hidden",
  }),

  // ── IM clients — Reports + IR (no DART)
  "client-im-pooled": tileOverride({
    "dart-terminal": "hidden",
    "dart-research": "hidden",
    reports: "visible",
    "investor-relations": "visible",
  }),
  "client-im-sma": tileOverride({
    "dart-terminal": "hidden",
    "dart-research": "hidden",
    reports: "visible",
    "investor-relations": "visible",
  }),
  "prospect-im": tileOverride({
    "dart-terminal": "hidden",
    "dart-research": "hidden",
    reports: "locked",
    "investor-relations": "locked",
  }),

  // ── Regulatory Umbrella
  "client-regulatory": tileOverride({
    "dart-terminal": "hidden",
    "dart-research": "hidden",
    reports: "visible",
  }),
  "prospect-regulatory": tileOverride({
    "dart-terminal": "hidden",
    "dart-research": "hidden",
    reports: "locked",
  }),
  "prospect-im-under-regulatory": tileOverride({
    "dart-terminal": "hidden",
    "dart-research": "hidden",
    reports: "locked",
    "investor-relations": "locked",
  }),

  // ── Investor Relations
  investor: tileOverride({
    "dart-terminal": "hidden",
    "dart-research": "hidden",
    reports: "hidden",
    "investor-relations": "visible",
  }),
  advisor: tileOverride({
    "dart-terminal": "hidden",
    "dart-research": "hidden",
    reports: "hidden",
    "investor-relations": "visible",
  }),

  // ── Legacy / niche
  "prospect-platform": tileOverride({
    "dart-terminal": "locked",
    "dart-research": "locked",
    reports: "hidden",
  }),
  // elysium-defi (Patrick base) has no strategy-full/ml-full — Research padlocked
  "elysium-defi": tileOverride({
    "dart-terminal": "visible",
    "dart-research": "locked",
    reports: "locked",
  }),

  // ── Real-prospect demo personas (2026-04-25 — landed alongside the per-prospect
  //    UAT redirect from www login). Without these the dashboard falls through to
  //    DEFAULT_TILE_SHAPE and shows DART locked + Reports visible only — both
  //    Desmond personas + Patrick's full-tier persona need explicit shapes.
  "desmond-dart-full": tileOverride({
    "dart-terminal": "visible",
    "dart-research": "visible",
    reports: "visible",
  }),
  "desmond-signals-in": tileOverride({
    "dart-terminal": "visible",
    "dart-research": "locked",
    reports: "visible",
  }),
  "elysium-defi-full": tileOverride({
    "dart-terminal": "visible",
    "dart-research": "visible",
    reports: "visible",
  }),

  // ── Generic prospect personas (pre-existing demo coverage; surfaced by the
  //    persona-shape registration gate 2026-04-25). prospect-dart-full mirrors
  //    desmond-dart-full; prospect-dart-signals-in mirrors desmond-signals-in;
  //    prospect-perp-funding is reg-umbrella + signals-in.
  "prospect-dart-full": tileOverride({
    "dart-terminal": "visible",
    "dart-research": "visible",
    reports: "visible",
  }),
  "prospect-dart-signals-in": tileOverride({
    "dart-terminal": "visible",
    "dart-research": "locked",
    reports: "visible",
  }),
  "prospect-perp-funding": tileOverride({
    "dart-terminal": "visible",
    "dart-research": "locked",
    reports: "visible",
  }),

  // ── Demo personas for general UAT demos (2026-04-25). Distinct from
  //    prospect-* personas which carry CRM-shaped context. demo-signals-client
  //    is a clean Signals-In showcase; demo-im-reports-only is a reports-only
  //    IM client view (no IR, no DART) for the allocator-view walkthrough.
  "demo-signals-client": tileOverride({
    "dart-terminal": "visible",
    "dart-research": "locked",
    reports: "visible",
  }),
  "demo-im-reports-only": tileOverride({
    "dart-terminal": "hidden",
    "dart-research": "hidden",
    reports: "visible",
  }),
};

// 2026-04-28 tile split: legacy `dart` subRouteOverride entries migrated.
// Terminal-side chips (terminal/observe/strategy-catalogue/signal-intake/data)
// move under `dart-terminal`. Research-side chips (research/promote which were
// inside the old single `dart` tile) move under `dart-research` (and the new
// research nav uses fine-grained chips: research-overview / features / ml /
// backtests / signals / etc — see DEFAULT_SUBROUTE_SHAPE).
const PERSONA_SUBROUTE_SHAPES: Record<string, DashboardSubRouteVisibility> = {
  admin: ALL_VISIBLE_SUBROUTES,
  "internal-trader": {
    ...ALL_VISIBLE_SUBROUTES,
    admin: {
      users: "visible",
      orgs: "visible",
      "strategy-universe": "visible",
      "strategy-lifecycle-editor": "visible",
      deployments: "visible",
      "service-registry": "visible",
      "system-health": "visible",
      engagement: "visible",
      "data-etl": "visible",
      "audit-log": "visible",
    },
  },
  "im-desk-operator": subRouteOverride({
    "dart-terminal": { terminal: "visible", observe: "visible", "strategy-catalogue": "visible" },
    reports: {
      "pnl-attribution": "visible",
      settlement: "visible",
      reconciliation: "visible",
      regulatory: "visible",
    },
    "investor-relations": {
      board: "visible",
      "dr-playbook": "visible",
      security: "visible",
      "ir-briefings": "visible",
      "demo-preview": "visible",
    },
    admin: {
      deployments: "visible",
      "audit-log": "visible",
      "strategy-universe": "visible",
      "system-health": "visible",
    },
  }),

  "client-full": subRouteOverride({
    "dart-terminal": {
      terminal: "visible",
      observe: "visible",
      "strategy-catalogue": "visible",
      "signal-intake": "visible",
    },
    "dart-research": {
      "research-overview": "visible",
      features: "visible",
      "feature-etl": "visible",
      quant: "visible",
      strategies: "visible",
      ml: "visible",
      backtests: "visible",
      signals: "visible",
      "execution-research": "visible",
      allocate: "visible",
      promote: "visible",
    },
    reports: {
      "pnl-attribution": "visible",
      settlement: "visible",
      reconciliation: "visible",
    },
  }),
  "client-premium": subRouteOverride({
    "dart-terminal": {
      terminal: "visible",
      observe: "visible",
      "strategy-catalogue": "visible",
    },
    // No research entitlements — chip set stays empty (default-hidden) under
    // padlocked `dart-research` tile.
    reports: {
      "pnl-attribution": "visible",
      settlement: "visible",
      reconciliation: "visible",
    },
  }),
  "client-data-only": subRouteOverride({
    "dart-terminal": { "strategy-catalogue": "visible" },
  }),
  "prospect-dart": subRouteOverride({
    "dart-terminal": {
      terminal: "locked",
      observe: "locked",
      "strategy-catalogue": "visible",
    },
    "dart-research": {
      "research-overview": "locked",
      features: "locked",
      "feature-etl": "locked",
      quant: "locked",
      strategies: "locked",
      ml: "locked",
      backtests: "locked",
      signals: "locked",
      "execution-research": "locked",
      allocate: "locked",
      promote: "locked",
    },
    reports: {
      "pnl-attribution": "locked",
      settlement: "locked",
      reconciliation: "locked",
    },
  }),

  // Signals-In — DART Terminal with Signal Intake + Observe; DART Research padlocked
  "prospect-signals-only": subRouteOverride({
    "dart-terminal": { "signal-intake": "visible", observe: "visible" },
    reports: { "pnl-attribution": "visible", settlement: "visible" },
  }),

  "prospect-odum-signals": subRouteOverride({
    "odum-signals": {
      counterparties: "visible",
      payloads: "visible",
      "emission-history": "visible",
      "rate-limits": "visible",
    },
  }),

  "client-im-pooled": subRouteOverride({
    reports: {
      "pnl-attribution": "visible",
      settlement: "visible",
      reconciliation: "visible",
      catalogue: "visible",
    },
    "investor-relations": {
      board: "visible",
      "ir-briefings": "visible",
    },
  }),
  "client-im-sma": subRouteOverride({
    reports: {
      "pnl-attribution": "visible",
      settlement: "visible",
      reconciliation: "visible",
      catalogue: "visible",
    },
    "investor-relations": {
      board: "visible",
      "ir-briefings": "visible",
    },
  }),
  "prospect-im": subRouteOverride({
    reports: { "pnl-attribution": "locked" },
    "investor-relations": { "ir-briefings": "locked" },
  }),

  "client-regulatory": subRouteOverride({
    reports: { regulatory: "visible", reconciliation: "visible" },
  }),
  "prospect-regulatory": subRouteOverride({
    reports: { regulatory: "locked" },
  }),
  "prospect-im-under-regulatory": subRouteOverride({
    reports: { regulatory: "locked", "pnl-attribution": "locked" },
    "investor-relations": { "ir-briefings": "locked" },
  }),

  investor: subRouteOverride({
    "investor-relations": {
      board: "visible",
      "dr-playbook": "visible",
      security: "visible",
      "ir-briefings": "visible",
      "demo-preview": "visible",
    },
  }),
  advisor: subRouteOverride({
    "investor-relations": {
      board: "visible",
      "ir-briefings": "visible",
      "demo-preview": "visible",
    },
  }),

  "prospect-platform": subRouteOverride({
    "dart-terminal": {
      terminal: "locked",
      "strategy-catalogue": "locked",
    },
  }),
  "elysium-defi": subRouteOverride({
    "dart-terminal": { terminal: "visible", observe: "visible" },
    // Research padlocked at tile level; sub-routes default to hidden.
    reports: { "pnl-attribution": "locked" },
  }),

  // ── Real-prospect demo personas (2026-04-25). DART Full / DeFi Full shapes
  //    mirror "client-full" — all DART Terminal + Research sub-routes visible,
  //    full Reports. Signals-In shape mirrors "prospect-signals-only" — DART
  //    Terminal with Signal Intake + Observe; DART Research padlocked at tile.
  "desmond-dart-full": subRouteOverride({
    "dart-terminal": {
      terminal: "visible",
      observe: "visible",
      "strategy-catalogue": "visible",
      "signal-intake": "visible",
    },
    "dart-research": {
      "research-overview": "visible",
      features: "visible",
      "feature-etl": "visible",
      quant: "visible",
      strategies: "visible",
      ml: "visible",
      backtests: "visible",
      signals: "visible",
      "execution-research": "visible",
      allocate: "visible",
      promote: "visible",
    },
    reports: {
      "pnl-attribution": "visible",
      settlement: "visible",
      reconciliation: "visible",
    },
  }),
  "desmond-signals-in": subRouteOverride({
    "dart-terminal": {
      terminal: "visible",
      observe: "visible",
      "signal-intake": "visible",
      "strategy-catalogue": "visible",
    },
    // No research entitlements — DART Research tile padlocked.
    reports: {
      "pnl-attribution": "visible",
      settlement: "visible",
      reconciliation: "visible",
    },
  }),
  "elysium-defi-full": subRouteOverride({
    "dart-terminal": {
      terminal: "visible",
      observe: "visible",
      "strategy-catalogue": "visible",
      "signal-intake": "visible",
    },
    "dart-research": {
      "research-overview": "visible",
      features: "visible",
      "feature-etl": "visible",
      quant: "visible",
      strategies: "visible",
      ml: "visible",
      backtests: "visible",
      signals: "visible",
      "execution-research": "visible",
      allocate: "visible",
      promote: "visible",
    },
    reports: {
      "pnl-attribution": "visible",
      settlement: "visible",
      reconciliation: "visible",
    },
  }),

  // ── Generic prospect personas (pre-existing; registered 2026-04-25 by the
  //    persona-shape gate). Mirrors the analogous client-full / Signals-In shapes.
  "prospect-dart-full": subRouteOverride({
    "dart-terminal": {
      terminal: "visible",
      observe: "visible",
      "strategy-catalogue": "visible",
      "signal-intake": "visible",
    },
    "dart-research": {
      "research-overview": "visible",
      features: "visible",
      "feature-etl": "visible",
      quant: "visible",
      strategies: "visible",
      ml: "visible",
      backtests: "visible",
      signals: "visible",
      "execution-research": "visible",
      allocate: "visible",
      promote: "visible",
    },
    reports: {
      "pnl-attribution": "visible",
      settlement: "visible",
      reconciliation: "visible",
    },
  }),
  "prospect-dart-signals-in": subRouteOverride({
    "dart-terminal": {
      terminal: "visible",
      observe: "visible",
      "signal-intake": "visible",
      "strategy-catalogue": "visible",
    },
    // No research entitlements — DART Research tile padlocked.
    reports: {
      "pnl-attribution": "visible",
      settlement: "visible",
      reconciliation: "visible",
    },
  }),
  "demo-signals-client": subRouteOverride({
    "dart-terminal": {
      terminal: "visible",
      observe: "visible",
      "signal-intake": "visible",
      "strategy-catalogue": "visible",
    },
    // No research entitlements — DART Research tile padlocked.
    reports: {
      "pnl-attribution": "visible",
      settlement: "visible",
      reconciliation: "visible",
    },
  }),
  "demo-im-reports-only": subRouteOverride({
    reports: {
      "pnl-attribution": "visible",
      settlement: "visible",
      reconciliation: "visible",
      regulatory: "locked",
      catalogue: "locked",
    },
  }),
  "prospect-perp-funding": subRouteOverride({
    "dart-terminal": {
      terminal: "visible",
      observe: "visible",
      "signal-intake": "visible",
      "strategy-catalogue": "visible",
    },
    // Reg-umbrella + signals-in — DART Research tile padlocked at tile level.
    reports: {
      "pnl-attribution": "visible",
      settlement: "visible",
      reconciliation: "visible",
      regulatory: "visible",
    },
  }),
};

/**
 * Persona IDs that have an explicit tile-shape entry. Exported so tests can
 * assert every persona in `PERSONAS` is registered (the alternative is silent
 * fall-through to DEFAULT_TILE_SHAPE which hides 3 of 5 tiles — see the
 * 2026-04-25 desmond / elysium-defi-full regression).
 */
export const REGISTERED_TILE_SHAPE_IDS: ReadonlySet<string> = new Set(Object.keys(PERSONA_TILE_SHAPES));

export const REGISTERED_SUBROUTE_SHAPE_IDS: ReadonlySet<string> = new Set(Object.keys(PERSONA_SUBROUTE_SHAPES));

/**
 * Derive a tile-shape from a user's entitlements when no PERSONA_TILE_SHAPES
 * entry exists for them.
 *
 * Funnel Coherence plan Workstream D1. The strict per-persona separation:
 *   - Admin / wildcard entitlements → all tiles visible
 *   - DART entitlements (`data-pro`, `execution-full`, `ml-full`,
 *     `strategy-full`) → DART tile + Reports tile
 *   - `investor-relations` (LP) → Investor Relations tile + Reports tile
 *   - `signals-broadcast` (counterparty) → Odum Signals tile + Reports tile
 *   - `reporting` only (IM allocator) → Reports tile ONLY
 *   - Otherwise → conservative default (Reports visible, DART locked)
 *
 * The entitlement-derived shape applies ONLY when the persona id is unknown
 * to PERSONA_TILE_SHAPES. Registered personas keep their explicit shape so
 * UAT demo bundles can override with intent.
 */
function entitlementDerivedShape(entitlements: ReadonlyArray<unknown>): DashboardTileVisibility | null {
  const flat = new Set<string>();
  for (const e of entitlements) {
    if (typeof e === "string") flat.add(e);
    else if (e && typeof e === "object" && "domain" in e && typeof (e as { domain: unknown }).domain === "string") {
      flat.add(`${(e as { domain: string }).domain}`);
    }
  }
  // Admin wildcard.
  if (flat.has("*")) return ALL_VISIBLE_TILE;

  const hasDart =
    flat.has("data-pro") ||
    flat.has("execution-full") ||
    flat.has("ml-full") ||
    flat.has("strategy-full") ||
    flat.has("trading-common") ||
    flat.has("trading-defi");
  const hasInvestorRelations =
    flat.has("investor-relations") || flat.has("investor-im") || flat.has("investor-platform");
  const hasSignalsBroadcast = flat.has("signals-broadcast") || flat.has("signals-counterparty");
  const hasReporting = flat.has("reporting");

  // IM allocator: reporting only — strict per-persona separation per
  // Decision 4. NOT DART, NOT Investor Relations, NOT Odum Signals.
  if (hasReporting && !hasDart && !hasInvestorRelations && !hasSignalsBroadcast) {
    return tileOverride({ reports: "visible" });
  }

  // Odum Signals counterparty — Odum Signals tile + Reports.
  if (hasSignalsBroadcast && !hasDart) {
    return tileOverride({ "odum-signals": "visible", reports: "visible" });
  }

  // Investor / LP — Investor Relations tile + Reports.
  if (hasInvestorRelations && !hasDart && !hasSignalsBroadcast) {
    return tileOverride({ "investor-relations": "visible", reports: "visible" });
  }

  // DART user — DART Terminal tile + Reports. DART Research tile depends on
  // whether the persona has the research entitlements (strategy-full + ml-full).
  if (hasDart) {
    const hasResearch = flat.has("ml-full") && flat.has("strategy-full");
    return tileOverride({
      "dart-terminal": "visible",
      "dart-research": hasResearch ? "visible" : "locked",
      reports: "visible",
    });
  }

  return null;
}

/**
 * Resolve the per-persona 5-tile visibility. Falls back to a conservative
 * DART-locked / Reports-visible shape for unknown personas.
 *
 * Resolution order:
 *   1. Registered PERSONA_TILE_SHAPES (UAT/demo bundles override anything).
 *   2. role === admin/internal → admin shape (all visible).
 *   3. Entitlement-derived shape (Workstream D1).
 *   4. Conservative DEFAULT_TILE_SHAPE.
 */
export function personaDashboardShape(
  persona: { id?: string; role?: string; entitlements?: ReadonlyArray<unknown> } | null | undefined,
): DashboardTileVisibility {
  if (!persona) return DEFAULT_TILE_SHAPE;
  if (persona.id && PERSONA_TILE_SHAPES[persona.id]) {
    return PERSONA_TILE_SHAPES[persona.id];
  }
  if (persona.role === "admin" || persona.role === "internal") {
    return PERSONA_TILE_SHAPES.admin;
  }
  if (persona.entitlements) {
    const derived = entitlementDerivedShape(persona.entitlements);
    if (derived) return derived;
  }
  return DEFAULT_TILE_SHAPE;
}

/**
 * Resolve per-persona sub-route chip visibility (tile × chip-key → vis).
 */
export function personaDashboardSubRoutes(
  persona: { id?: string; role?: string } | null | undefined,
): DashboardSubRouteVisibility {
  if (!persona) return DEFAULT_SUBROUTE_SHAPE;
  if (persona.id && PERSONA_SUBROUTE_SHAPES[persona.id]) {
    return PERSONA_SUBROUTE_SHAPES[persona.id];
  }
  if (persona.role === "admin" || persona.role === "internal") {
    return PERSONA_SUBROUTE_SHAPES.admin;
  }
  return DEFAULT_SUBROUTE_SHAPE;
}
