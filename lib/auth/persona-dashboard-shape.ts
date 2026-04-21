/**
 * Per-persona dashboard-tile visibility shape.
 *
 * Sibling to `persona-lifecycle-shape.ts`. Where that file governs the 4-stage
 * lifecycle-nav (Data · DART · Manage · Reports), THIS file governs the 5-tile
 * /dashboard product grid (DART · Odum Signals · Reports · Investor Relations ·
 * Admin & Ops).
 *
 * The two axes overlap but are NOT a 1:1 mapping:
 *   - Lifecycle-nav  = "how you work"         (stages of the pipeline)
 *   - Dashboard grid = "what products you own" (product-axis)
 *
 * SSOT: unified-trading-pm/codex/09-strategy/architecture-v2/dashboard-services-grid.md
 */

import type { StageVisibility } from "./persona-lifecycle-shape";
import type { DashboardTileId } from "@/lib/config/services";

export type { StageVisibility } from "./persona-lifecycle-shape";

export type DashboardTileVisibility = Record<DashboardTileId, StageVisibility>;

/** Sub-route-level visibility, keyed by tile id → sub-route key. */
export type DashboardSubRouteVisibility = Record<
  DashboardTileId,
  Record<string, StageVisibility>
>;

const DEFAULT_TILE_SHAPE: DashboardTileVisibility = {
  dart: "locked",
  "odum-signals": "hidden",
  reports: "visible",
  "investor-relations": "hidden",
  admin: "hidden",
};

const DEFAULT_SUBROUTE_SHAPE: DashboardSubRouteVisibility = {
  dart: {
    terminal: "locked",
    research: "hidden",
    promote: "hidden",
    observe: "locked",
    "strategy-catalogue": "hidden",
    "signal-intake": "hidden",
    data: "hidden",
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
    catalogue: "hidden",
  },
  "investor-relations": {
    board: "hidden",
    "dr-playbook": "hidden",
    security: "hidden",
    "ir-briefings": "hidden",
  },
  admin: {
    users: "hidden",
    orgs: "hidden",
    "strategy-universe": "hidden",
    "strategy-lifecycle-editor": "hidden",
    deployments: "hidden",
    "service-registry": "hidden",
    "audit-log": "hidden",
  },
};

function tileOverride(
  overrides: Partial<DashboardTileVisibility>,
): DashboardTileVisibility {
  return { ...DEFAULT_TILE_SHAPE, ...overrides };
}

function subRouteOverride(
  overrides: Partial<{
    [K in DashboardTileId]?: Partial<Record<string, StageVisibility>>;
  }>,
): DashboardSubRouteVisibility {
  const out: DashboardSubRouteVisibility = {
    dart: { ...DEFAULT_SUBROUTE_SHAPE.dart },
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
  dart: "visible",
  "odum-signals": "visible",
  reports: "visible",
  "investor-relations": "visible",
  admin: "visible",
};

const ALL_VISIBLE_SUBROUTES: DashboardSubRouteVisibility = {
  dart: {
    terminal: "visible",
    research: "visible",
    promote: "visible",
    observe: "visible",
    "strategy-catalogue": "visible",
    "signal-intake": "visible",
    data: "visible",
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
  },
  admin: {
    users: "visible",
    orgs: "visible",
    "strategy-universe": "visible",
    "strategy-lifecycle-editor": "visible",
    deployments: "visible",
    "service-registry": "visible",
    "audit-log": "visible",
  },
};

const PERSONA_TILE_SHAPES: Record<string, DashboardTileVisibility> = {
  // ── Admin + Internal — all 5 tiles visible
  admin: ALL_VISIBLE_TILE,
  "internal-trader": tileOverride({
    dart: "visible",
    "odum-signals": "visible",
    reports: "visible",
    "investor-relations": "hidden",
    admin: "visible",
  }),
  "im-desk-operator": tileOverride({
    dart: "visible",
    "odum-signals": "hidden",
    reports: "visible",
    "investor-relations": "visible",
    admin: "visible",
  }),

  // ── DART Full clients
  "client-full": tileOverride({ dart: "visible", reports: "visible" }),
  "client-premium": tileOverride({ dart: "visible", reports: "visible" }),
  "client-data-only": tileOverride({ dart: "visible", reports: "hidden" }),
  "prospect-dart": tileOverride({ dart: "visible", reports: "locked" }),

  // ── DART Signals-In (inbound) — sees DART with ONLY Signal Intake sub-route
  "prospect-signals-only": tileOverride({
    dart: "visible",
    reports: "visible",
  }),

  // ── Odum Signals counterparty (outbound) — standalone tile
  "prospect-odum-signals": tileOverride({
    dart: "hidden",
    "odum-signals": "visible",
    reports: "hidden",
  }),

  // ── IM clients — Reports + IR
  "client-im-pooled": tileOverride({
    dart: "hidden",
    reports: "visible",
    "investor-relations": "visible",
  }),
  "client-im-sma": tileOverride({
    dart: "hidden",
    reports: "visible",
    "investor-relations": "visible",
  }),
  "prospect-im": tileOverride({
    dart: "hidden",
    reports: "locked",
    "investor-relations": "locked",
  }),

  // ── Regulatory Umbrella
  "client-regulatory": tileOverride({
    dart: "hidden",
    reports: "visible",
  }),
  "prospect-regulatory": tileOverride({
    dart: "hidden",
    reports: "locked",
  }),
  "prospect-im-under-regulatory": tileOverride({
    dart: "hidden",
    reports: "locked",
    "investor-relations": "locked",
  }),

  // ── Investor Relations
  investor: tileOverride({
    dart: "hidden",
    reports: "hidden",
    "investor-relations": "visible",
  }),
  advisor: tileOverride({
    dart: "hidden",
    reports: "hidden",
    "investor-relations": "visible",
  }),

  // ── Legacy / niche
  "prospect-platform": tileOverride({
    dart: "locked",
    reports: "hidden",
  }),
  "elysium-defi": tileOverride({
    dart: "visible",
    reports: "locked",
  }),
};

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
      "audit-log": "visible",
    },
  },
  "im-desk-operator": subRouteOverride({
    dart: { terminal: "visible", observe: "visible", "strategy-catalogue": "visible" },
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
    },
    admin: {
      deployments: "visible",
      "audit-log": "visible",
      "strategy-universe": "visible",
    },
  }),

  "client-full": subRouteOverride({
    dart: {
      terminal: "visible",
      research: "visible",
      promote: "visible",
      observe: "visible",
      "strategy-catalogue": "visible",
    },
    reports: {
      "pnl-attribution": "visible",
      settlement: "visible",
      reconciliation: "visible",
    },
  }),
  "client-premium": subRouteOverride({
    dart: {
      terminal: "visible",
      observe: "visible",
      "strategy-catalogue": "visible",
    },
    reports: {
      "pnl-attribution": "visible",
      settlement: "visible",
      reconciliation: "visible",
    },
  }),
  "client-data-only": subRouteOverride({
    dart: { "strategy-catalogue": "visible" },
  }),
  "prospect-dart": subRouteOverride({
    dart: {
      terminal: "locked",
      research: "locked",
      promote: "locked",
      observe: "locked",
      "strategy-catalogue": "visible",
    },
    reports: {
      "pnl-attribution": "locked",
      settlement: "locked",
      reconciliation: "locked",
    },
  }),

  // Signals-In — DART with ONLY Signal Intake chip; others hidden
  "prospect-signals-only": subRouteOverride({
    dart: { "signal-intake": "visible", observe: "visible" },
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
    },
  }),
  advisor: subRouteOverride({
    "investor-relations": {
      board: "visible",
      "ir-briefings": "visible",
    },
  }),

  "prospect-platform": subRouteOverride({
    dart: {
      terminal: "locked",
      "strategy-catalogue": "locked",
    },
  }),
  "elysium-defi": subRouteOverride({
    dart: { terminal: "visible", observe: "visible" },
    reports: { "pnl-attribution": "locked" },
  }),
};

/**
 * Resolve the per-persona 5-tile visibility. Falls back to a conservative
 * DART-locked / Reports-visible shape for unknown personas.
 */
export function personaDashboardShape(
  persona: { id?: string; role?: string } | null | undefined,
): DashboardTileVisibility {
  if (!persona) return DEFAULT_TILE_SHAPE;
  if (persona.id && PERSONA_TILE_SHAPES[persona.id]) {
    return PERSONA_TILE_SHAPES[persona.id];
  }
  if (persona.role === "admin" || persona.role === "internal") {
    return PERSONA_TILE_SHAPES.admin;
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
