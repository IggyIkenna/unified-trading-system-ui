/**
 * Strategy Architecture v2 — block-list metadata (10 entries).
 *
 * Mirrors `codex/09-strategy/architecture-v2/category-instrument-coverage.md`
 * § BL-1 through BL-10. Every BLOCKED cell in `coverage.ts` references one of
 * these entries; this module is the narrative-and-remediation side of that
 * reference.
 */

import type { StrategyArchetype } from "./enums";

export interface BlockListEntry {
  /** Short id — matches `CoverageCell.blockListRefs[]` tokens. */
  readonly id: string;
  /** One-line summary used as section heading. */
  readonly summary: string;
  /** Archetypes affected — by-name list, rendered as chips. */
  readonly archetypesAffected: readonly StrategyArchetype[];
  /** Explanation paragraphs — each rendered as its own <p>. */
  readonly explanation: readonly string[];
  /** Plain-language remediation steps. */
  readonly remediation: string;
  /** Cross-reference to UAC gap numbers that relate. */
  readonly uacGapRefs: readonly number[];
  /** Representative cells (human-readable) that this entry blocks. */
  readonly affectedCells: readonly string[];
}

export const BLOCK_LIST: readonly BlockListEntry[] = [
  {
    id: "BL-1",
    summary: "No supported DeFi options venue",
    archetypesAffected: [
      "ML_DIRECTIONAL_CONTINUOUS",
      "RULES_DIRECTIONAL_CONTINUOUS",
      "ARBITRAGE_PRICE_DISPERSION",
      "MARKET_MAKING_CONTINUOUS",
      "VOL_TRADING_OPTIONS",
    ],
    explanation: [
      "Lyra and Dopex were archived 2026-03. No replacement DeFi options venue is currently declared.",
    ],
    remediation:
      "Evaluate Aevo, Premia, or Hegic — or formally accept DeFi options as out-of-scope.",
    uacGapRefs: [6],
    affectedCells: [
      "(ML_DIRECTIONAL_CONTINUOUS, DeFi, option)",
      "(RULES_DIRECTIONAL_CONTINUOUS, DeFi, option)",
      "(ARBITRAGE_PRICE_DISPERSION, DeFi, option)",
      "(MARKET_MAKING_CONTINUOUS, DeFi, option)",
      "(VOL_TRADING_OPTIONS, DeFi, option)",
    ],
  },
  {
    id: "BL-2",
    summary: "No DeFi dated-future venue",
    archetypesAffected: ["ML_DIRECTIONAL_CONTINUOUS", "CARRY_BASIS_DATED"],
    explanation: [
      "Deribit is CeFi. No on-chain dated-future venue currently supported.",
    ],
    remediation:
      "Track emerging on-chain dated-future venues (e.g., perps protocols adding expiry). Not currently a priority.",
    uacGapRefs: [],
    affectedCells: [
      "(ML_DIRECTIONAL_CONTINUOUS, DeFi, dated_future)",
      "(CARRY_BASIS_DATED, DeFi, spot + dated_future)",
    ],
  },
  {
    id: "BL-3",
    summary: "CeFi lending out-of-scope",
    archetypesAffected: ["YIELD_ROTATION_LENDING"],
    explanation: [
      "Binance Earn / Bybit lending have withdrawal lockups + counterparty risk.",
    ],
    remediation:
      "Decision: excluded from our product. Revisit only if a clearing model emerges.",
    uacGapRefs: [],
    affectedCells: ["(YIELD_ROTATION_LENDING, CeFi, lending)"],
  },
  {
    id: "BL-4",
    summary: "CeFi directional options via rules (non-standard)",
    archetypesAffected: ["RULES_DIRECTIONAL_CONTINUOUS"],
    explanation: [
      "Directional options via rules is a degenerate case.",
    ],
    remediation:
      "Use VOL_TRADING_OPTIONS for vol-metric rules, or ML_DIRECTIONAL_CONTINUOUS with expression=`atm_call` for directional options.",
    uacGapRefs: [6],
    affectedCells: [
      "(RULES_DIRECTIONAL_CONTINUOUS, CeFi, option)",
      "(RULES_DIRECTIONAL_CONTINUOUS, TradFi, option)",
    ],
  },
  {
    id: "BL-5",
    summary: "Kalshi execution adapter pending",
    archetypesAffected: [
      "ML_DIRECTIONAL_EVENT_SETTLED",
      "RULES_DIRECTIONAL_EVENT_SETTLED",
      "MARKET_MAKING_EVENT_SETTLED",
    ],
    explanation: ["Data + pricing live; execution adapter not built."],
    remediation:
      "Build Kalshi execution adapter following the interface-credential convention (see execution-service codex).",
    uacGapRefs: [],
    affectedCells: [
      "(ML_DIRECTIONAL_EVENT_SETTLED, Sports & Prediction, event_settled) via Kalshi",
      "(RULES_DIRECTIONAL_EVENT_SETTLED, Sports & Prediction, event_settled) via Kalshi",
      "(MARKET_MAKING_EVENT_SETTLED, Sports & Prediction, event_settled) via Kalshi",
    ],
  },
  {
    id: "BL-6",
    summary: "Unity cannot quote (Feed Connector is place-only)",
    archetypesAffected: ["MARKET_MAKING_EVENT_SETTLED"],
    explanation: [
      "Unity's Java Feed Connector accepts PLACE_BET / CANCEL but does not expose a quoting API.",
      "Unity child books quote internally; we cannot add our own bids/offers through Unity.",
    ],
    remediation:
      "Permanent architectural constraint — quote on venues that expose a quoting API (Pinnacle, Betfair Exchange). Unity remains place-only.",
    uacGapRefs: [],
    affectedCells: [
      "(MARKET_MAKING_EVENT_SETTLED, Sports & Prediction, event_settled) via Unity",
    ],
  },
  {
    id: "BL-7",
    summary: "DeFi perp MM not exposed as third-party role",
    archetypesAffected: ["MARKET_MAKING_CONTINUOUS"],
    explanation: [
      "Hyperliquid / GMX have protocol-level MM incentives; no third-party-MM role comparable to CLOB MM.",
    ],
    remediation:
      "Not a product gap — protocol-level MM roles are inaccessible by design. Pursue CeFi perp MM instead.",
    uacGapRefs: [],
    affectedCells: ["(MARKET_MAKING_CONTINUOUS, DeFi, perp)"],
  },
  {
    id: "BL-8",
    summary: "DeFi cross-sectional basket (multi-leg gas efficiency)",
    archetypesAffected: ["STAT_ARB_CROSS_SECTIONAL"],
    explanation: [
      "Atomic multi-token basket trade on DeFi is gas-prohibitive on EVM.",
    ],
    remediation:
      "Requires a specialised router (1inch Pathfinder style) not currently declared. Track EVM gas evolution + L2 adoption.",
    uacGapRefs: [7],
    affectedCells: ["(STAT_ARB_CROSS_SECTIONAL, DeFi, spot)"],
  },
  {
    id: "BL-9",
    summary: "TradFi cross-sectional on futures basket",
    archetypesAffected: ["STAT_ARB_CROSS_SECTIONAL"],
    explanation: [
      "Multi-leg cross-sectional on CME futures basket requires batch-order capability not declared for CME adapter.",
    ],
    remediation:
      "Extend the CME adapter with `MultiLegOrderCapability` (UAC gap #7). Medium-effort adapter work.",
    uacGapRefs: [7],
    affectedCells: ["(STAT_ARB_CROSS_SECTIONAL, TradFi, dated_future)"],
  },
  {
    id: "BL-10",
    summary: "Dated-future auto-roll + combo creation not yet live",
    archetypesAffected: [
      "ML_DIRECTIONAL_CONTINUOUS",
      "RULES_DIRECTIONAL_CONTINUOUS",
      "STAT_ARB_PAIRS_FIXED",
      "STAT_ARB_CROSS_SECTIONAL",
      "ARBITRAGE_PRICE_DISPERSION",
      "EVENT_DRIVEN",
      "CARRY_BASIS_DATED",
    ],
    explanation: [
      "The end-to-end flow (features-service liquidity measure → representative-future-service state transition → REPRESENTATIVE_FUTURE_CHANGED event → strategy-service roll emission → execution-service combo resolution with synthetic-price guardrails) is specced but not yet implemented.",
      "Until it ships, dated-future strategies run on fixed-contract slot labels only (`-fixed-{contract}-`), and ops manually rotate to the next expiry. Workable for a handful of strategies; does not scale.",
    ],
    remediation:
      "Phase 11 of the active finalization plan — RepresentativeFutureRegistry in UAC, representative-future-service scaffold, REPRESENTATIVE_FUTURE_CHANGED event, FUTURES_ROLL instruction, execution-service combo auto-creation, circuit breakers.",
    uacGapRefs: [11],
    affectedCells: [
      "(any -dated- slot, any category, dated_future) — functional but requires manual roll",
    ],
  },
] as const;

export function blockListEntryById(id: string): BlockListEntry | undefined {
  return BLOCK_LIST.find((entry) => entry.id === id);
}
