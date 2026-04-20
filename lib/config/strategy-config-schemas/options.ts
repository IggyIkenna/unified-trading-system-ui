/**
 * Shared option sets for strategy config schemas.
 *
 * These are the selectable values for dropdown and multi-select fields.
 * Aligned with backend reference data (UAC venues, chain enums, algo library).
 * When the backend adds a new venue or chain, update the relevant array here.
 */

// ---------------------------------------------------------------------------
// Chains
// ---------------------------------------------------------------------------

// SOLANA is an L1, not an EVM L2 — it appears in CHAIN_OPTIONS (Kamino lending / LIQ,
// Jito / Marinade staking, Orca / Jupiter DEX) but NOT in L2_CHAIN_OPTIONS.
// Per codex category-instrument-coverage.md §10 / §12 — Kamino (Solana) is SUPPORTED
// for LIQUIDATION_CAPTURE; Jito / Marinade (Solana) are SUPPORTED for YIELD_STAKING_SIMPLE.
// It is opt-in per strategy: single-chain DeFi strategies keep ETHEREUM defaults;
// multichain / cross-chain strategies may include it explicitly where Solana venues apply.
export const CHAIN_OPTIONS = ["ETHEREUM", "ARBITRUM", "BASE", "OPTIMISM", "POLYGON", "SOLANA"];
export const L2_CHAIN_OPTIONS = ["ARBITRUM", "OPTIMISM", "BASE"];

// ---------------------------------------------------------------------------
// DeFi tokens / assets
// ---------------------------------------------------------------------------

export const LENDING_BASKET_OPTIONS = ["USDC", "USDT", "DAI"];
export const LST_TOKEN_OPTIONS = ["weETH", "mSOL"];
export const BENCHMARK_TOKEN_OPTIONS = ["sUSDe", "stETH", "rETH"];
export const LP_POOL_OPTIONS = ["ETH-USDC", "ETH-USDT", "BTC-USDC", "SOL-USDC", "ARB-ETH"];

// ---------------------------------------------------------------------------
// DeFi coin baskets (per strategy variant)
// ---------------------------------------------------------------------------

export const BASIS_COIN_OPTIONS = ["ETH", "BTC", "SOL", "MATIC", "ARB", "OP", "AVAX", "LINK"];
export const BTC_COIN_OPTIONS = ["BTC", "WBTC", "cbBTC"];
export const SOL_COIN_OPTIONS = ["SOL", "mSOL", "jitoSOL"];

// ---------------------------------------------------------------------------
// Venues
// ---------------------------------------------------------------------------

export const PERP_VENUE_OPTIONS = ["HYPERLIQUID", "BINANCE-FUTURES", "OKX", "BYBIT", "ASTER"];
export const PERP_VENUE_SINGLE_OPTIONS = ["HYPERLIQUID", "BINANCE-FUTURES", "OKX", "BYBIT"];
export const CEFI_VENUE_OPTIONS = ["BINANCE", "OKX", "BYBIT", "COINBASE", "HYPERLIQUID", "ASTER"];
export const OPTIONS_VENUE_OPTIONS = ["DERIBIT", "OKX", "BINANCE"];
export const PREDICTION_VENUE_OPTIONS = ["POLYMARKET", "KALSHI", "BETFAIR"];

// ---------------------------------------------------------------------------
// DeFi providers
// ---------------------------------------------------------------------------

export const FLASH_LOAN_PROVIDER_OPTIONS = ["MORPHO", "AAVE"];
export const BRIDGE_PROVIDER_OPTIONS = ["ACROSS", "SOCKET", "LAYERZERO", "STARGATE"];
export const REWARD_MODE_OPTIONS = ["all", "eigen_only", "ethfi_only"];

// ---------------------------------------------------------------------------
// Liquidation capture
// ---------------------------------------------------------------------------

// Aligned with codex category-instrument-coverage.md §12 LIQUIDATION_CAPTURE:
// - AAVE_V3 (SUPPORTED — Ethereum + Arbitrum / Optimism / Polygon / Base)
// - KAMINO (SUPPORTED — Solana program-level mechanic, not EVM flash-loan)
// - COMPOUND_V3 / EULER / MORPHO (PARTIAL — per-protocol deployments in flight)
// - GMX_V2 (PARTIAL — perp liquidator role; separate economics from lending)
// SPARK is not listed in codex coverage and was dropped.
export const LIQUIDATION_TARGET_PROTOCOLS = ["AAVE_V3", "COMPOUND_V3", "EULER", "MORPHO", "KAMINO", "GMX_V2"];
export const MEV_POLICY_OPTIONS = ["FLASHBOTS", "PUBLIC", "MEV_BLOCKER"];

// ---------------------------------------------------------------------------
// CeFi execution
// ---------------------------------------------------------------------------

export const ALGO_OPTIONS = ["TWAP", "VWAP", "ICEBERG", "SOR", "MARKET"];
export const MODEL_FAMILY_OPTIONS = ["LightGBM", "XGBoost", "CatBoost", "Ridge", "Huber", "Poisson"];
export const EVENT_TYPE_OPTIONS = ["CPI", "FOMC", "NFP", "EARNINGS", "GDP"];
export const COMMODITY_FACTOR_OPTIONS = ["rig_count", "cot_positioning", "storage", "price_momentum", "weather"];
export const TRADFI_INSTRUMENT_OPTIONS = ["SPY", "QQQ", "IWM", "EURUSD", "CL", "NG"];
export const REGIME_MODEL_OPTIONS = ["HMM_3STATE", "HMM_5STATE"];
