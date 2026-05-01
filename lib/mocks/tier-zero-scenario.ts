"use client";

/**
 * TierZeroScenario matrix — the SSOT for what's mocked end-to-end across
 * every preset / asset_group / archetype combination.
 *
 * Per the audit: "the cockpit reacts; the full product does not yet behave
 * exhaustively. Every filter/dropdown should do one of four things: filter
 * real mock data, change workflow state, show a clean empty state, or show
 * a clean unsupported state. It must NEVER silently do nothing."
 *
 * One `TierZeroScenario` record per supported demo combination. The resolver
 * `resolveTierZeroScenario(scope)` picks the matching scenarios from the
 * registry and merges their data so every widget can render from one
 * canonical answer.
 *
 * `matchesScope<T>` is the generic axis-by-axis filter every panel uses to
 * decide which rows survive the active scope.
 */

import type { ShareClass, StrategyArchetype, StrategyFamily } from "@/lib/architecture-v2/enums";
import type { WorkspaceScope } from "@/lib/architecture-v2/workspace-scope";

import type { AssetGroup, StrategyEvent } from "./cockpit-ops-store";

// ─────────────────────────────────────────────────────────────────────────────
// Row shapes — what each cockpit panel reads from the scenario
// ─────────────────────────────────────────────────────────────────────────────

export interface ScenarioStrategyInstance {
  readonly id: string;
  readonly label: string;
  readonly assetGroup: AssetGroup;
  readonly family: StrategyFamily;
  readonly archetype: StrategyArchetype;
  readonly venue: string;
  readonly shareClass: ShareClass;
  readonly maturity: "smoke" | "backtest_30d" | "paper_1d" | "paper_14d" | "pilot" | "live_stable";
  readonly nav: number;
  readonly mtdPnlUsd: number;
  readonly status: "live" | "paper" | "paused" | "candidate";
}

export interface ScenarioPosition {
  readonly id: string;
  readonly strategyId: string;
  readonly assetGroup: AssetGroup;
  readonly venue: string;
  readonly symbol: string;
  readonly side: "long" | "short";
  readonly notional: number;
  readonly unrealisedPnlUsd: number;
}

export interface ScenarioBacktestSummary {
  readonly id: string;
  readonly strategyId: string;
  readonly archetype: StrategyArchetype;
  readonly assetGroup: AssetGroup;
  readonly proofGoal: "signal" | "execution" | "gas" | "liquidation" | "treasury" | "promotion";
  readonly signalSharpe: number;
  readonly operatingSharpe: number;
  readonly costOfRealityBps: number;
}

export interface ScenarioReleaseBundleSummary {
  readonly releaseId: string;
  readonly strategyId: string;
  readonly archetype: StrategyArchetype;
  readonly assetGroup: AssetGroup;
  readonly maturityPhase: "smoke" | "backtest_30d" | "paper_1d" | "paper_14d" | "pilot" | "live_stable";
  readonly approvedBy?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// TierZeroScenario — one record per preset / archetype / asset-group cluster
// ─────────────────────────────────────────────────────────────────────────────

export interface TierZeroScenario {
  readonly id: string;
  readonly label: string;
  /** Asset groups this scenario covers (empty = "any"). */
  readonly assetGroups: readonly AssetGroup[];
  readonly families: readonly StrategyFamily[];
  readonly archetypes: readonly StrategyArchetype[];
  readonly venues: readonly string[];
  readonly shareClasses: readonly ShareClass[];

  readonly strategies: readonly ScenarioStrategyInstance[];
  readonly positions: readonly ScenarioPosition[];
  readonly backtests: readonly ScenarioBacktestSummary[];
  readonly bundles: readonly ScenarioReleaseBundleSummary[];
  /** Pre-canned event tapes — used for replay; ScenarioEngine fires them. */
  readonly canonicalEventTone: readonly StrategyEvent["tone"][];
}

// ─────────────────────────────────────────────────────────────────────────────
// 8 scenarios mapped 1:1 to the WorkspacePresets
// ─────────────────────────────────────────────────────────────────────────────

const ARBITRAGE_COMMAND: TierZeroScenario = {
  id: "tier0-arbitrage-command",
  label: "Arbitrage Command",
  assetGroups: ["CEFI", "DEFI"],
  families: ["ARBITRAGE_STRUCTURAL"],
  archetypes: ["ARBITRAGE_PRICE_DISPERSION", "CARRY_BASIS_PERP"],
  venues: ["binance", "okx", "deribit", "aave_v3", "uniswap_v3"],
  shareClasses: ["USDT", "USDC"],
  strategies: [
    {
      id: "arb-cefi-defi-spot",
      label: "Arbitrage — Binance / Aave",
      assetGroup: "CEFI",
      family: "ARBITRAGE_STRUCTURAL",
      archetype: "ARBITRAGE_PRICE_DISPERSION",
      venue: "binance",
      shareClass: "USDT",
      maturity: "live_stable",
      nav: 12_400_000,
      mtdPnlUsd: 184_200,
      status: "live",
    },
    {
      id: "arb-okx-uniswap",
      label: "Arbitrage — OKX / Uniswap v3",
      assetGroup: "DEFI",
      family: "ARBITRAGE_STRUCTURAL",
      archetype: "ARBITRAGE_PRICE_DISPERSION",
      venue: "okx",
      shareClass: "USDC",
      maturity: "paper_14d",
      nav: 4_200_000,
      mtdPnlUsd: 38_400,
      status: "paper",
    },
    {
      id: "carry-basis-binance",
      label: "Carry — Binance perp basis",
      assetGroup: "CEFI",
      family: "ARBITRAGE_STRUCTURAL",
      archetype: "CARRY_BASIS_PERP",
      venue: "binance",
      shareClass: "USDT",
      maturity: "live_stable",
      nav: 8_900_000,
      mtdPnlUsd: 92_140,
      status: "live",
    },
  ],
  positions: [
    {
      id: "pos-arb-1",
      strategyId: "arb-cefi-defi-spot",
      assetGroup: "CEFI",
      venue: "binance",
      symbol: "BTC-PERP",
      side: "short",
      notional: 4_500_000,
      unrealisedPnlUsd: 12_400,
    },
    {
      id: "pos-arb-2",
      strategyId: "arb-cefi-defi-spot",
      assetGroup: "DEFI",
      venue: "aave_v3",
      symbol: "wstETH",
      side: "long",
      notional: 4_500_000,
      unrealisedPnlUsd: 11_280,
    },
    {
      id: "pos-carry-1",
      strategyId: "carry-basis-binance",
      assetGroup: "CEFI",
      venue: "binance",
      symbol: "BTC-USDT-PERP",
      side: "short",
      notional: 3_200_000,
      unrealisedPnlUsd: 6_140,
    },
  ],
  backtests: [
    {
      id: "bt-arb-promo",
      strategyId: "arb-cefi-defi-spot",
      archetype: "ARBITRAGE_PRICE_DISPERSION",
      assetGroup: "CEFI",
      proofGoal: "promotion",
      signalSharpe: 2.4,
      operatingSharpe: 1.55,
      costOfRealityBps: 830,
    },
    {
      id: "bt-carry-exec",
      strategyId: "carry-basis-binance",
      archetype: "CARRY_BASIS_PERP",
      assetGroup: "CEFI",
      proofGoal: "execution",
      signalSharpe: 1.9,
      operatingSharpe: 1.62,
      costOfRealityBps: 280,
    },
  ],
  bundles: [
    {
      releaseId: "rb-arbitrage-cefi-defi-v3.2.1",
      strategyId: "arb-cefi-defi-spot",
      archetype: "ARBITRAGE_PRICE_DISPERSION",
      assetGroup: "CEFI",
      maturityPhase: "live_stable",
      approvedBy: "approver-femi",
    },
    {
      releaseId: "rb-carry-basis-perp-v2.8.0",
      strategyId: "carry-basis-binance",
      archetype: "CARRY_BASIS_PERP",
      assetGroup: "CEFI",
      maturityPhase: "live_stable",
      approvedBy: "approver-femi",
    },
  ],
  canonicalEventTone: ["info", "success", "warn"],
};

const DEFI_YIELD_RISK: TierZeroScenario = {
  id: "tier0-defi-yield-risk",
  label: "DeFi Yield & Risk",
  assetGroups: ["DEFI"],
  families: ["CARRY_AND_YIELD"],
  archetypes: [
    "YIELD_ROTATION_LENDING",
    "YIELD_STAKING_SIMPLE",
    "CARRY_RECURSIVE_STAKED",
    "CARRY_STAKED_BASIS",
    "LIQUIDATION_CAPTURE",
  ],
  venues: ["aave_v3", "morpho", "lido", "jito", "compound_v3", "uniswap_v3"],
  shareClasses: ["USDT", "USDC", "ETH"],
  strategies: [
    {
      id: "yield-rot-aave-morpho",
      label: "Yield rotation — Aave / Morpho",
      assetGroup: "DEFI",
      family: "CARRY_AND_YIELD",
      archetype: "YIELD_ROTATION_LENDING",
      venue: "aave_v3",
      shareClass: "USDC",
      maturity: "live_stable",
      nav: 6_800_000,
      mtdPnlUsd: 51_200,
      status: "live",
    },
    {
      id: "stk-eth-lido",
      label: "Staking — Lido stETH",
      assetGroup: "DEFI",
      family: "CARRY_AND_YIELD",
      archetype: "YIELD_STAKING_SIMPLE",
      venue: "lido",
      shareClass: "ETH",
      maturity: "live_stable",
      nav: 3_200_000,
      mtdPnlUsd: 18_400,
      status: "live",
    },
    {
      id: "rec-stk-pufeth",
      label: "Recursive staked — pufETH",
      assetGroup: "DEFI",
      family: "CARRY_AND_YIELD",
      archetype: "CARRY_RECURSIVE_STAKED",
      venue: "aave_v3",
      shareClass: "ETH",
      maturity: "paper_14d",
      nav: 1_400_000,
      mtdPnlUsd: 9_180,
      status: "paper",
    },
    {
      id: "liq-cap-compound",
      label: "Liquidation capture — Compound v3",
      assetGroup: "DEFI",
      family: "CARRY_AND_YIELD",
      archetype: "LIQUIDATION_CAPTURE",
      venue: "compound_v3",
      shareClass: "USDC",
      maturity: "live_stable",
      nav: 2_000_000,
      mtdPnlUsd: 38_400,
      status: "live",
    },
  ],
  positions: [
    {
      id: "pos-yield-1",
      strategyId: "yield-rot-aave-morpho",
      assetGroup: "DEFI",
      venue: "morpho",
      symbol: "USDC supply",
      side: "long",
      notional: 6_800_000,
      unrealisedPnlUsd: 0,
    },
    {
      id: "pos-stk-1",
      strategyId: "stk-eth-lido",
      assetGroup: "DEFI",
      venue: "lido",
      symbol: "stETH",
      side: "long",
      notional: 3_200_000,
      unrealisedPnlUsd: 6_400,
    },
  ],
  backtests: [
    {
      id: "bt-yield-gas",
      strategyId: "yield-rot-aave-morpho",
      archetype: "YIELD_ROTATION_LENDING",
      assetGroup: "DEFI",
      proofGoal: "gas",
      signalSharpe: 1.6,
      operatingSharpe: 1.41,
      costOfRealityBps: 190,
    },
    {
      id: "bt-rec-stk-liq",
      strategyId: "rec-stk-pufeth",
      archetype: "CARRY_RECURSIVE_STAKED",
      assetGroup: "DEFI",
      proofGoal: "liquidation",
      signalSharpe: 1.8,
      operatingSharpe: 1.22,
      costOfRealityBps: 580,
    },
  ],
  bundles: [
    {
      releaseId: "rb-yield-rotation-v4.1.0",
      strategyId: "yield-rot-aave-morpho",
      archetype: "YIELD_ROTATION_LENDING",
      assetGroup: "DEFI",
      maturityPhase: "live_stable",
    },
    {
      releaseId: "rb-staked-eth-v1.6.0",
      strategyId: "stk-eth-lido",
      archetype: "YIELD_STAKING_SIMPLE",
      assetGroup: "DEFI",
      maturityPhase: "live_stable",
    },
  ],
  canonicalEventTone: ["info", "success", "warn"],
};

const VOL_LAB: TierZeroScenario = {
  id: "tier0-vol-lab",
  label: "Volatility Research Lab",
  assetGroups: ["CEFI"],
  families: ["VOL_TRADING"],
  archetypes: ["VOL_TRADING_OPTIONS"],
  venues: ["deribit", "cme"],
  shareClasses: ["USDT", "USD"],
  strategies: [
    {
      id: "vol-deribit",
      label: "Vol trading — Deribit ATM straddle",
      assetGroup: "CEFI",
      family: "VOL_TRADING",
      archetype: "VOL_TRADING_OPTIONS",
      venue: "deribit",
      shareClass: "USDT",
      maturity: "paper_14d",
      nav: 1_800_000,
      mtdPnlUsd: 24_140,
      status: "paper",
    },
    {
      id: "vol-cme",
      label: "Vol trading — CME ES options",
      assetGroup: "CEFI",
      family: "VOL_TRADING",
      archetype: "VOL_TRADING_OPTIONS",
      venue: "cme",
      shareClass: "USD",
      maturity: "paper_1d",
      nav: 4_500_000,
      mtdPnlUsd: 12_400,
      status: "paper",
    },
  ],
  positions: [
    {
      id: "pos-vol-1",
      strategyId: "vol-deribit",
      assetGroup: "CEFI",
      venue: "deribit",
      symbol: "BTC-25APR-70K-C",
      side: "long",
      notional: 350_000,
      unrealisedPnlUsd: 4_200,
    },
  ],
  backtests: [
    {
      id: "bt-vol-promo",
      strategyId: "vol-deribit",
      archetype: "VOL_TRADING_OPTIONS",
      assetGroup: "CEFI",
      proofGoal: "promotion",
      signalSharpe: 2.1,
      operatingSharpe: 1.32,
      costOfRealityBps: 720,
    },
  ],
  bundles: [
    {
      releaseId: "rb-vol-deribit-straddle-v0.9.2",
      strategyId: "vol-deribit",
      archetype: "VOL_TRADING_OPTIONS",
      assetGroup: "CEFI",
      maturityPhase: "paper_14d",
    },
  ],
  canonicalEventTone: ["info", "success", "warn"],
};

const SPORTS_PREDICTION: TierZeroScenario = {
  id: "tier0-sports-prediction",
  label: "Sports / Prediction Desk",
  assetGroups: ["SPORTS", "PREDICTION"],
  families: ["EVENT_DRIVEN", "ML_DIRECTIONAL"],
  archetypes: ["EVENT_DRIVEN", "ML_DIRECTIONAL_EVENT_SETTLED", "MARKET_MAKING_EVENT_SETTLED"],
  venues: ["api_football", "footystats", "polymarket", "kalshi"],
  shareClasses: ["USD"],
  strategies: [
    {
      id: "evt-sports",
      label: "Event-driven — Premier League",
      assetGroup: "SPORTS",
      family: "EVENT_DRIVEN",
      archetype: "EVENT_DRIVEN",
      venue: "api_football",
      shareClass: "USD",
      maturity: "paper_14d",
      nav: 800_000,
      mtdPnlUsd: 14_800,
      status: "paper",
    },
    {
      id: "ml-event-settled",
      label: "ML event-settled — fixture predictor",
      assetGroup: "SPORTS",
      family: "ML_DIRECTIONAL",
      archetype: "ML_DIRECTIONAL_EVENT_SETTLED",
      venue: "footystats",
      shareClass: "USD",
      maturity: "paper_1d",
      nav: 600_000,
      mtdPnlUsd: 4_120,
      status: "paper",
    },
    {
      id: "mm-prediction",
      label: "Market-making — Polymarket",
      assetGroup: "PREDICTION",
      family: "EVENT_DRIVEN",
      archetype: "MARKET_MAKING_EVENT_SETTLED",
      venue: "polymarket",
      shareClass: "USD",
      maturity: "paper_14d",
      nav: 350_000,
      mtdPnlUsd: 8_240,
      status: "paper",
    },
  ],
  positions: [
    {
      id: "pos-evt-1",
      strategyId: "evt-sports",
      assetGroup: "SPORTS",
      venue: "api_football",
      symbol: "ARS-LIV-fixture-2026-05-04",
      side: "long",
      notional: 40_000,
      unrealisedPnlUsd: 12_400,
    },
  ],
  backtests: [
    {
      id: "bt-evt-signal",
      strategyId: "evt-sports",
      archetype: "EVENT_DRIVEN",
      assetGroup: "SPORTS",
      proofGoal: "signal",
      signalSharpe: 1.7,
      operatingSharpe: 1.44,
      costOfRealityBps: 240,
    },
  ],
  bundles: [
    {
      releaseId: "rb-event-driven-sports-v0.7.1",
      strategyId: "evt-sports",
      archetype: "EVENT_DRIVEN",
      assetGroup: "SPORTS",
      maturityPhase: "paper_14d",
    },
  ],
  canonicalEventTone: ["info", "success", "warn"],
};

const ML_DIRECTIONAL: TierZeroScenario = {
  id: "tier0-ml-directional",
  label: "ML directional — research",
  assetGroups: ["CEFI"],
  families: ["ML_DIRECTIONAL"],
  archetypes: ["ML_DIRECTIONAL_CONTINUOUS"],
  venues: ["binance"],
  shareClasses: ["USDT"],
  strategies: [
    {
      id: "ml-directional-btc",
      label: "ML directional — xgboost BTC",
      assetGroup: "CEFI",
      family: "ML_DIRECTIONAL",
      archetype: "ML_DIRECTIONAL_CONTINUOUS",
      venue: "binance",
      shareClass: "USDT",
      maturity: "paper_14d",
      nav: 2_400_000,
      mtdPnlUsd: 18_140,
      status: "paper",
    },
  ],
  positions: [
    {
      id: "pos-ml-1",
      strategyId: "ml-directional-btc",
      assetGroup: "CEFI",
      venue: "binance",
      symbol: "BTC-USDT",
      side: "long",
      notional: 1_200_000,
      unrealisedPnlUsd: 4_140,
    },
  ],
  backtests: [
    {
      id: "bt-ml-signal",
      strategyId: "ml-directional-btc",
      archetype: "ML_DIRECTIONAL_CONTINUOUS",
      assetGroup: "CEFI",
      proofGoal: "signal",
      signalSharpe: 1.8,
      operatingSharpe: 1.45,
      costOfRealityBps: 320,
    },
  ],
  bundles: [
    {
      releaseId: "rb-ml-directional-btc-v1.4.0",
      strategyId: "ml-directional-btc",
      archetype: "ML_DIRECTIONAL_CONTINUOUS",
      assetGroup: "CEFI",
      maturityPhase: "paper_14d",
    },
  ],
  canonicalEventTone: ["info", "success"],
};

const TRADFI_PAIRS: TierZeroScenario = {
  id: "tier0-tradfi-pairs",
  label: "TradFi pairs — CME index carry",
  assetGroups: ["TRADFI"],
  families: ["ARBITRAGE_STRUCTURAL"],
  archetypes: ["STAT_ARB_PAIRS_FIXED"],
  venues: ["cme"],
  shareClasses: ["USD"],
  strategies: [
    {
      id: "stat-arb-es-nq",
      label: "Stat-arb — ES/NQ pairs",
      assetGroup: "TRADFI",
      family: "ARBITRAGE_STRUCTURAL",
      archetype: "STAT_ARB_PAIRS_FIXED",
      venue: "cme",
      shareClass: "USD",
      maturity: "paper_14d",
      nav: 5_000_000,
      mtdPnlUsd: -41_000,
      status: "paused",
    },
  ],
  positions: [],
  backtests: [
    {
      id: "bt-stat-arb",
      strategyId: "stat-arb-es-nq",
      archetype: "STAT_ARB_PAIRS_FIXED",
      assetGroup: "TRADFI",
      proofGoal: "execution",
      signalSharpe: 1.4,
      operatingSharpe: 0.92,
      costOfRealityBps: 480,
    },
  ],
  bundles: [
    {
      releaseId: "rb-stat-arb-es-nq-v0.5.3",
      strategyId: "stat-arb-es-nq",
      archetype: "STAT_ARB_PAIRS_FIXED",
      assetGroup: "TRADFI",
      maturityPhase: "paper_14d",
    },
  ],
  canonicalEventTone: ["info", "warn", "error"],
};

export const TIER_ZERO_SCENARIOS: readonly TierZeroScenario[] = [
  ARBITRAGE_COMMAND,
  DEFI_YIELD_RISK,
  VOL_LAB,
  SPORTS_PREDICTION,
  ML_DIRECTIONAL,
  TRADFI_PAIRS,
];

// ─────────────────────────────────────────────────────────────────────────────
// matchesScope — generic axis-by-axis filter every panel uses
// ─────────────────────────────────────────────────────────────────────────────

export interface ScopeMatchableRow {
  readonly assetGroup?: AssetGroup;
  readonly family?: StrategyFamily;
  readonly archetype?: StrategyArchetype;
  readonly venue?: string;
  readonly shareClass?: ShareClass;
}

/**
 * True iff `row` matches every non-empty axis on `scope`. Empty scope axes
 * are treated as "any" (don't filter on that axis). This is the SSOT
 * matcher used by every cockpit panel that renders rows.
 */
export function matchesScope(row: ScopeMatchableRow, scope: WorkspaceScope): boolean {
  if (scope.assetGroups.length > 0 && row.assetGroup && !scope.assetGroups.includes(row.assetGroup)) {
    return false;
  }
  if (scope.families.length > 0 && row.family && !scope.families.includes(row.family)) {
    return false;
  }
  if (scope.archetypes.length > 0 && row.archetype && !scope.archetypes.includes(row.archetype)) {
    return false;
  }
  if (scope.shareClasses.length > 0 && row.shareClass && !scope.shareClasses.includes(row.shareClass)) {
    return false;
  }
  if (
    scope.venueOrProtocolIds &&
    scope.venueOrProtocolIds.length > 0 &&
    row.venue &&
    !scope.venueOrProtocolIds.includes(row.venue)
  ) {
    return false;
  }
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Resolved view — what the cockpit reads after scope is applied
// ─────────────────────────────────────────────────────────────────────────────

export interface ResolvedTierZeroView {
  readonly matchedScenarios: readonly TierZeroScenario[];
  readonly strategies: readonly ScenarioStrategyInstance[];
  readonly positions: readonly ScenarioPosition[];
  readonly backtests: readonly ScenarioBacktestSummary[];
  readonly bundles: readonly ScenarioReleaseBundleSummary[];
  /**
   * Resolution status. The cockpit uses this to render appropriate empty /
   * unsupported states instead of silently rendering no rows:
   *   - `match`         — at least one scenario fully matches the scope.
   *   - `partial_match` — scope matches some scenarios but axes remove rows.
   *   - `unsupported`   — scope axes have no overlap with any tier-zero
   *                       scenario (e.g. SPORTS + VOL_TRADING + deribit).
   *   - `empty`         — scope is wide-open; nothing to render meaningfully.
   */
  readonly status: "match" | "partial_match" | "unsupported" | "empty";
}

/**
 * Resolve the active scope into a tier-zero view. Every cockpit panel that
 * renders rows reads through this. The status field controls whether the
 * panel renders match / partial-match / unsupported / empty states.
 */
export function resolveTierZeroScenario(scope: WorkspaceScope): ResolvedTierZeroView {
  // Step 1 — find scenarios where scope axes intersect scenario axes.
  const matched = TIER_ZERO_SCENARIOS.filter((sc) => scenarioOverlapsScope(sc, scope));

  // Wide-open scope: surface every scenario.
  const scopeIsWideOpen =
    scope.assetGroups.length === 0 &&
    scope.families.length === 0 &&
    scope.archetypes.length === 0 &&
    scope.shareClasses.length === 0 &&
    (!scope.venueOrProtocolIds || scope.venueOrProtocolIds.length === 0);

  if (scopeIsWideOpen) {
    const allStrategies = TIER_ZERO_SCENARIOS.flatMap((s) => s.strategies);
    const allPositions = TIER_ZERO_SCENARIOS.flatMap((s) => s.positions);
    const allBacktests = TIER_ZERO_SCENARIOS.flatMap((s) => s.backtests);
    const allBundles = TIER_ZERO_SCENARIOS.flatMap((s) => s.bundles);
    return {
      matchedScenarios: TIER_ZERO_SCENARIOS,
      strategies: allStrategies,
      positions: allPositions,
      backtests: allBacktests,
      bundles: allBundles,
      status: allStrategies.length > 0 ? "match" : "empty",
    };
  }

  // No scenario overlaps the scope axes at all → unsupported combo.
  if (matched.length === 0) {
    return {
      matchedScenarios: [],
      strategies: [],
      positions: [],
      backtests: [],
      bundles: [],
      status: "unsupported",
    };
  }

  // Apply per-axis matchesScope on each scenario's row collections.
  const strategies = matched.flatMap((s) => s.strategies).filter((r) => matchesScope(r, scope));
  const positions = matched.flatMap((s) => s.positions).filter((r) => matchesScope(r, scope));
  const backtests = matched.flatMap((s) => s.backtests).filter((r) => matchesScope(r, scope));
  const bundles = matched.flatMap((s) => s.bundles).filter((r) => matchesScope(r, scope));

  const totalRows = strategies.length + positions.length + backtests.length + bundles.length;
  const status: ResolvedTierZeroView["status"] = totalRows === 0 ? "partial_match" : "match";

  return {
    matchedScenarios: matched,
    strategies,
    positions,
    backtests,
    bundles,
    status,
  };
}

/**
 * True iff the scenario covers any axis the scope is filtering on. Scope axes
 * with non-overlapping values rule the scenario out; scope axes the scenario
 * doesn't cover (e.g. shareClass) are treated as "any".
 */
function scenarioOverlapsScope(scenario: TierZeroScenario, scope: WorkspaceScope): boolean {
  if (scope.assetGroups.length > 0) {
    const overlap = scope.assetGroups.some((ag) => scenario.assetGroups.includes(ag as AssetGroup));
    if (!overlap) return false;
  }
  if (scope.families.length > 0) {
    const overlap = scope.families.some((f) => scenario.families.includes(f as StrategyFamily));
    if (!overlap) return false;
  }
  if (scope.archetypes.length > 0) {
    const overlap = scope.archetypes.some((a) => scenario.archetypes.includes(a as StrategyArchetype));
    if (!overlap) return false;
  }
  if (scope.shareClasses.length > 0) {
    const overlap = scope.shareClasses.some((s) => scenario.shareClasses.includes(s as ShareClass));
    if (!overlap) return false;
  }
  if (scope.venueOrProtocolIds && scope.venueOrProtocolIds.length > 0) {
    const overlap = scope.venueOrProtocolIds.some((v) => scenario.venues.includes(v));
    if (!overlap) return false;
  }
  return true;
}

/**
 * Suggest the closest matching scenarios when resolution returns
 * `unsupported`. The cockpit's unsupported-state banner uses these to
 * recommend "try Arbitrage Command or DeFi Yield & Risk".
 */
export function suggestNearestScenarios(scope: WorkspaceScope, max = 3): readonly TierZeroScenario[] {
  // Score each scenario by how many scope axes it covers.
  const scored = TIER_ZERO_SCENARIOS.map((sc) => {
    let score = 0;
    if (scope.assetGroups.length > 0 && scope.assetGroups.some((ag) => sc.assetGroups.includes(ag as AssetGroup))) {
      score += 4;
    }
    if (scope.families.length > 0 && scope.families.some((f) => sc.families.includes(f as StrategyFamily))) {
      score += 3;
    }
    if (scope.archetypes.length > 0 && scope.archetypes.some((a) => sc.archetypes.includes(a as StrategyArchetype))) {
      score += 2;
    }
    if (scope.shareClasses.length > 0 && scope.shareClasses.some((s) => sc.shareClasses.includes(s as ShareClass))) {
      score += 1;
    }
    return { sc, score };
  });
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map(({ sc }) => sc);
}
