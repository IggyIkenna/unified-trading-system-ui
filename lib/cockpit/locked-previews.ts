/**
 * LockedPreview model — scope-specific FOMO copy.
 *
 * Per dart_ux_cockpit_refactor_2026_04_29.plan §12 + Phase 7 of §17.
 *
 * Cockpit FOMO ≠ Catalogue FOMO:
 *   - Cockpit FOMO = workflow / capability FOMO. "What I could do with my
 *     existing strategies if I upgraded my tier or completed an
 *     onboarding step." CTA = upgrade-tier or complete-questionnaire.
 *   - Catalogue FOMO = strategy-instance / allocation FOMO. Stricter:
 *     pre-maturity instances are HIDDEN, not greyed. CTA = request
 *     allocation through a human-gated workflow.
 *
 * This file ships the LockedPreview model + a curated registry mapping
 * `(scope.assetGroups × scope.families)` to scope-specific copy. Phase 5
 * widget metadata + Phase 6 preset wiring decide WHERE these locked
 * previews show up; this module owns the COPY.
 */

import type { WorkspaceScope } from "@/lib/architecture-v2/workspace-scope";

export interface LockedPreview {
  readonly id: string;
  readonly title: string;
  readonly buyerValue: string;
  readonly lockedCapabilities: readonly string[];
  readonly cta: string;
  readonly ctaHref: string;
  /** Predicate that decides whether this preview is relevant to the active scope. */
  readonly scopeMatch: (scope: WorkspaceScope) => boolean;
}

export const LOCKED_PREVIEWS: readonly LockedPreview[] = [
  // Arbitrage — surfaces when scope.families includes ARBITRAGE_STRUCTURAL.
  {
    id: "arbitrage-promotion-checks",
    title: "Arbitrage Promotion Checks",
    buyerValue:
      "Validate whether a spread strategy is live-compatible before deployment.",
    lockedCapabilities: [
      "Execution-aware backtest checks",
      "Legging risk analysis",
      "Stale-quote detection",
      "Venue liquidity checks",
      "Batch/live drift comparison",
    ],
    cta: "Request DART Full access",
    ctaHref: "/help/system-map",
    scopeMatch: (scope) =>
      scope.families.includes("ARBITRAGE_STRUCTURAL") || scope.families.length === 0,
  },

  // DeFi — surfaces when scope.assetGroups includes DEFI.
  {
    id: "defi-yield-research",
    title: "DeFi Yield Research",
    buyerValue:
      "Unlock lending rotation, recursive collateral, staking basis, and protocol-risk-aware allocation across Aave, Morpho, Lido, Jito, Kamino, Hyperliquid.",
    lockedCapabilities: [
      "Lending-rate rotation engine",
      "Recursive collateral simulator",
      "Staked-basis carry analytics",
      "Protocol risk dashboard",
      "Liquidation-aware position sizing",
    ],
    cta: "Request DART Full access",
    ctaHref: "/help/system-map",
    scopeMatch: (scope) => scope.assetGroups.includes("DEFI"),
  },

  // Volatility — surfaces when scope.instrumentTypes includes option, OR family=VOL_TRADING.
  {
    id: "volatility-lab",
    title: "Volatility Lab",
    buyerValue:
      "Unlock term-structure, dispersion, 0DTE gamma, synthetic delta, and cross-asset volatility-spread research workflows.",
    lockedCapabilities: [
      "Term-structure surface",
      "Dispersion screening",
      "0DTE gamma scanner",
      "Synthetic delta builder",
      "Cross-asset vol-spread",
    ],
    cta: "Request DART Full access",
    ctaHref: "/help/system-map",
    scopeMatch: (scope) =>
      scope.instrumentTypes.includes("option") || scope.families.includes("VOL_TRADING"),
  },

  // Signals-In — surfaces when surface=signals or scope hints external strategy interest.
  {
    id: "signal-quality-analytics",
    title: "Signal Quality Analytics",
    buyerValue:
      "Measure signal freshness, rejection causes, execution mapping, and downstream P&L attribution before scaling external capital.",
    lockedCapabilities: [
      "Freshness monitoring per counterparty",
      "Rejection root-cause analysis",
      "Instruction-mapping verification",
      "Per-version P&L attribution",
      "Latency-cost decomposition",
    ],
    cta: "Request DART Full access",
    ctaHref: "/help/system-map",
    scopeMatch: (scope) => scope.surface === "signals",
  },

  // Sports — surfaces when scope.assetGroups includes SPORTS or PREDICTION.
  {
    id: "sports-execution-simulation",
    title: "Sports Execution Simulation",
    buyerValue:
      "Unlock event-driven backtesting with realistic settlement, partial fills, and book-level slippage on Betfair / DraftKings / Polymarket / Kalshi.",
    lockedCapabilities: [
      "Settlement-window simulator",
      "Bet-ladder fill realism",
      "Cross-book arbitrage backtest",
      "Event-risk pre-trade checks",
    ],
    cta: "Request DART Full access",
    ctaHref: "/help/system-map",
    scopeMatch: (scope) =>
      scope.assetGroups.includes("SPORTS") || scope.assetGroups.includes("PREDICTION"),
  },
];

/**
 * Pick locked previews relevant to the active scope. Returns an ordered
 * list (most-relevant first). Caller decides how many to render.
 */
export function previewsForScope(scope: WorkspaceScope): readonly LockedPreview[] {
  return LOCKED_PREVIEWS.filter((p) => p.scopeMatch(scope));
}
