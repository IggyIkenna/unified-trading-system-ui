/**
 * Strategy Architecture v2 — enums.
 *
 * SSOT: unified-api-contracts/unified_api_contracts/internal/architecture_v2/enums.py
 *
 * TODO(architecture-v2-phase-9-followup): wire this file to auto-generation via
 * `unified-api-contracts/scripts/generate_ui_reference_data.py` so it is
 * regenerated whenever the Python SSOT changes. Tracking issue: embed v2
 * enums into `ui-reference-data.json` and swap this hand-maintained file for
 * a generated output under `lib/registry/generated.ts`. Until then, any edit
 * to the Python enums MUST be mirrored here and the mirror test in
 * `tests/unit/lib/architecture-v2/enums.test.ts` will fail loudly if the
 * archetype-to-family map diverges.
 */
export type StrategyFamilyV2 =
  | "ML_DIRECTIONAL"
  | "RULES_DIRECTIONAL"
  | "CARRY_AND_YIELD"
  | "ARBITRAGE_STRUCTURAL"
  | "MARKET_MAKING"
  | "EVENT_DRIVEN"
  | "VOL_TRADING"
  | "STAT_ARB_PAIRS";

export const STRATEGY_FAMILIES_V2: readonly StrategyFamilyV2[] = [
  "ML_DIRECTIONAL",
  "RULES_DIRECTIONAL",
  "CARRY_AND_YIELD",
  "ARBITRAGE_STRUCTURAL",
  "MARKET_MAKING",
  "EVENT_DRIVEN",
  "VOL_TRADING",
  "STAT_ARB_PAIRS",
] as const;

export type StrategyArchetypeV2 =
  | "ML_DIRECTIONAL_CONTINUOUS"
  | "ML_DIRECTIONAL_EVENT_SETTLED"
  | "RULES_DIRECTIONAL_CONTINUOUS"
  | "RULES_DIRECTIONAL_EVENT_SETTLED"
  | "CARRY_BASIS_DATED"
  | "CARRY_BASIS_PERP"
  | "CARRY_STAKED_BASIS"
  | "CARRY_RECURSIVE_STAKED"
  | "YIELD_ROTATION_LENDING"
  | "YIELD_STAKING_SIMPLE"
  | "ARBITRAGE_PRICE_DISPERSION"
  | "LIQUIDATION_CAPTURE"
  | "MARKET_MAKING_CONTINUOUS"
  | "MARKET_MAKING_EVENT_SETTLED"
  | "EVENT_DRIVEN"
  | "VOL_TRADING_OPTIONS"
  | "STAT_ARB_PAIRS_FIXED"
  | "STAT_ARB_CROSS_SECTIONAL";

export const STRATEGY_ARCHETYPES_V2: readonly StrategyArchetypeV2[] = [
  "ML_DIRECTIONAL_CONTINUOUS",
  "ML_DIRECTIONAL_EVENT_SETTLED",
  "RULES_DIRECTIONAL_CONTINUOUS",
  "RULES_DIRECTIONAL_EVENT_SETTLED",
  "CARRY_BASIS_DATED",
  "CARRY_BASIS_PERP",
  "CARRY_STAKED_BASIS",
  "CARRY_RECURSIVE_STAKED",
  "YIELD_ROTATION_LENDING",
  "YIELD_STAKING_SIMPLE",
  "ARBITRAGE_PRICE_DISPERSION",
  "LIQUIDATION_CAPTURE",
  "MARKET_MAKING_CONTINUOUS",
  "MARKET_MAKING_EVENT_SETTLED",
  "EVENT_DRIVEN",
  "VOL_TRADING_OPTIONS",
  "STAT_ARB_PAIRS_FIXED",
  "STAT_ARB_CROSS_SECTIONAL",
] as const;

export const ARCHETYPE_TO_FAMILY: Readonly<Record<StrategyArchetypeV2, StrategyFamilyV2>> = {
  ML_DIRECTIONAL_CONTINUOUS: "ML_DIRECTIONAL",
  ML_DIRECTIONAL_EVENT_SETTLED: "ML_DIRECTIONAL",
  RULES_DIRECTIONAL_CONTINUOUS: "RULES_DIRECTIONAL",
  RULES_DIRECTIONAL_EVENT_SETTLED: "RULES_DIRECTIONAL",
  CARRY_BASIS_DATED: "CARRY_AND_YIELD",
  CARRY_BASIS_PERP: "CARRY_AND_YIELD",
  CARRY_STAKED_BASIS: "CARRY_AND_YIELD",
  CARRY_RECURSIVE_STAKED: "CARRY_AND_YIELD",
  YIELD_ROTATION_LENDING: "CARRY_AND_YIELD",
  YIELD_STAKING_SIMPLE: "CARRY_AND_YIELD",
  ARBITRAGE_PRICE_DISPERSION: "ARBITRAGE_STRUCTURAL",
  LIQUIDATION_CAPTURE: "ARBITRAGE_STRUCTURAL",
  MARKET_MAKING_CONTINUOUS: "MARKET_MAKING",
  MARKET_MAKING_EVENT_SETTLED: "MARKET_MAKING",
  EVENT_DRIVEN: "EVENT_DRIVEN",
  VOL_TRADING_OPTIONS: "VOL_TRADING",
  STAT_ARB_PAIRS_FIXED: "STAT_ARB_PAIRS",
  STAT_ARB_CROSS_SECTIONAL: "STAT_ARB_PAIRS",
};

export type AllocatorArchetype =
  | "FIXED"
  | "PNL_WEIGHTED"
  | "SHARPE_WEIGHTED"
  | "RISK_PARITY"
  | "KELLY"
  | "MIN_CVAR"
  | "REGIME_AWARE"
  | "MANUAL";

export const ALLOCATOR_ARCHETYPES: readonly AllocatorArchetype[] = [
  "FIXED",
  "PNL_WEIGHTED",
  "SHARPE_WEIGHTED",
  "RISK_PARITY",
  "KELLY",
  "MIN_CVAR",
  "REGIME_AWARE",
  "MANUAL",
] as const;

export type VenueCategoryV2 = "CEFI" | "DEFI" | "SPORTS" | "TRADFI" | "PREDICTION";

export const VENUE_CATEGORIES_V2: readonly VenueCategoryV2[] = [
  "CEFI",
  "DEFI",
  "SPORTS",
  "TRADFI",
  "PREDICTION",
] as const;

export type VenueRoutingMode = "SOR_AT_EXECUTION" | "STRATEGY_PICKED" | "META_BROKER";

export type CommissionStructureType =
  | "FLAT"
  | "TIERED"
  | "PERCENT"
  | "COMMISSION_ON_WIN"
  | "MAKER_TAKER";

export type ShareClass =
  | "USDT"
  | "USDC"
  | "FDUSD"
  | "USD"
  | "GBP"
  | "EUR"
  | "ETH"
  | "BTC"
  | "SOL";

export type InstructionActionV2 =
  | "TRADE"
  | "SWAP"
  | "LEND"
  | "BORROW"
  | "STAKE"
  | "UNSTAKE"
  | "QUOTE"
  | "TRANSFER"
  | "BRIDGE"
  | "ATOMIC"
  | "CANCEL";

export type AccountActionV2 =
  | "CLOSE_ALL"
  | "CLOSE_ALL_FOR_STRATEGY"
  | "SET_MARGIN_MODE"
  | "SET_LEVERAGE"
  | "EMERGENCY_LIQUIDATE"
  | "TRANSFER_SUBACCOUNT"
  | "WITHDRAW"
  | "DEPOSIT_ACK"
  | "ROTATE_CREDENTIAL"
  | "PAUSE"
  | "RESUME";

export type KillSwitchReason =
  | "DISABLED"
  | "DAILY_LOSS_BREACH"
  | "MAX_DRAWDOWN_BREACH"
  | "DATA_STALE"
  | "KILL_SWITCH_TRIGGERED"
  | "COINTEGRATION_BREAKDOWN"
  | "GREEK_LIMIT_BREACH"
  | "VENUE_UNAVAILABLE";

export type RiskGateLayer =
  | "STRATEGY_SELF_CHECK"
  | "RISK_PREFLIGHT"
  | "EXECUTION_PRETRADE"
  | "VENUE_SIDE";

export type RiskGateDecision = "APPROVED" | "REJECTED" | "RESIZED" | "DEFERRED";
