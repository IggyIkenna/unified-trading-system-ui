/**
 * IA-explainer content — single source of truth for the buyer-facing
 * "how is DART laid out?" copy that renders in the wizard step 0 +
 * /help/system-map page.
 *
 * Per dart_ux_cockpit_refactor_2026_04_29.md §15.2 + Phase 7 of §17.
 *
 * The two surfaces source from this module so wording can't drift between
 * the wizard and the help page.
 */

export interface SurfaceExplainer {
  readonly id: string;
  readonly label: string;
  readonly tagline: string;
  readonly description: string;
}

export interface ModeOrStageExplainer {
  readonly id: string;
  readonly label: string;
  readonly description: string;
}

export interface OwnershipRow {
  readonly concept: string;
  readonly owner: string;
}

export const SURFACE_EXPLAINERS: readonly SurfaceExplainer[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    tagline: "Where you land",
    description:
      "Your starting point. Recommended cockpit, scope summary, quick actions, and links into the deeper surfaces.",
  },
  {
    id: "terminal",
    label: "DART Terminal",
    tagline: "Live trading + execution",
    description:
      "Five buyer-facing modes — Command (live P&L, positions, alerts), Markets (spreads, vol, liquidity), Strategies (running / paper / promoted), Explain (P&L attribution, drift), Ops (service health, audit).",
  },
  {
    id: "research",
    label: "DART Research",
    tagline: "From idea to live",
    description:
      "Six journey stages reading left-to-right: Discover → Build → Train → Validate → Allocate → Promote. Old per-tool surfaces (ML training, allocator backtests) remain reachable as deep links.",
  },
  {
    id: "reports",
    label: "Reports",
    tagline: "Client-safe reporting",
    description: "P&L attribution, executive summary, settlement, reconciliation, regulatory reporting.",
  },
  {
    id: "signals",
    label: "Signals",
    tagline: "External signal intake",
    description:
      "Signals-In counterparty intake, payload validation, instruction mapping, paper/live execution mapping, fill tagging.",
  },
];

export const TERMINAL_MODE_EXPLAINERS: readonly ModeOrStageExplainer[] = [
  {
    id: "command",
    label: "Command",
    description: "Live P&L, positions, orders, fills, alerts, exceptions, kill-switches.",
  },
  {
    id: "markets",
    label: "Markets",
    description: "Spreads, order books, liquidity, funding, basis, vol, venue health, sports / prediction event prices.",
  },
  {
    id: "strategies",
    label: "Strategies",
    description: "Running / paper / promoted / paused, config versions, signal flow, allocation state.",
  },
  {
    id: "explain",
    label: "Explain",
    description: "P&L attribution, execution quality, slippage, batch/live drift, latency cost, failed-opportunity analysis.",
  },
  {
    id: "ops",
    label: "Ops",
    description: "Service health, incidents, logs, feed health, data freshness, deployment state, audit trail.",
  },
];

export const RESEARCH_STAGE_EXPLAINERS: readonly ModeOrStageExplainer[] = [
  {
    id: "discover",
    label: "Discover",
    description: "Strategy universe — catalogue, families, archetypes, asset-group coverage, locked previews.",
  },
  {
    id: "build",
    label: "Build",
    description: "Data and features — feature pipelines, dataset coverage, instrument mapping, freshness.",
  },
  {
    id: "train",
    label: "Train",
    description: "Models — ML experiments, feature importance, training runs, candidate scoring, model lineage.",
  },
  {
    id: "validate",
    label: "Validate",
    description: "Test before deployment — backtests, paper, slippage, fill simulation, stress, batch/live drift.",
  },
  {
    id: "allocate",
    label: "Allocate",
    description: "Capital and mandate fit — allocation candidates, risk contribution, correlation, drawdown profile.",
  },
  {
    id: "promote",
    label: "Promote",
    description: "Move to paper / live — promotion readiness, config versions, approval state, deployment handoff.",
  },
];

/**
 * Per §15 ownership-rules table — which surface owns which concept. Buyers
 * don't need to memorise this; the help page surfaces it so engineers,
 * agents, and curious prospects can resolve "where does X live?".
 */
export const OWNERSHIP_TABLE: readonly OwnershipRow[] = [
  { concept: "Strategy universe", owner: "Catalogue / Research Discover" },
  { concept: "Building / testing strategies", owner: "DART Research" },
  { concept: "Live / paper strategy operation", owner: "DART Terminal" },
  { concept: "P&L · risk · attribution", owner: "Terminal Explain / Reports" },
  { concept: "External signals", owner: "Signals-In / Strategy Intake" },
  { concept: "Health · logs · incidents", owner: "Ops" },
  { concept: "Client-ready reporting", owner: "Reports" },
];

/** Headline copy for the system-map page + wizard step 0. */
export const SYSTEM_MAP_HEADLINE = "How DART is laid out";
export const SYSTEM_MAP_SUBHEAD =
  "Six surfaces, one shared scope. Pick where you want to start — the cockpit follows you.";
