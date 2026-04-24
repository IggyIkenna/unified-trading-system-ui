/**
 * Strategy display-name formatting utilities.
 *
 * SSOT: unified-trading-pm/codex/06-coding-standards/strategy-display-conventions.md
 *
 * Rules:
 * - Never render raw UNDERSCORE_IDs to clients — always use these formatters.
 * - Admin universe table may show the monospace slot label as a subtitle/hover
 *   for copy-paste, but the primary label must be formatted.
 * - Bespoke archetype names are final once reviewed by Ikenna (P0.3 gate).
 *   Update ARCHETYPE_DISPLAY_NAMES if names change after that review.
 */

// ── Bespoke display names for the 18 archetypes ───────────────────────────

export const ARCHETYPE_DISPLAY_NAMES: Readonly<Record<string, string>> = {
  ML_DIRECTIONAL_CONTINUOUS: "ML Directional — Continuous",
  ML_DIRECTIONAL_EVENT_SETTLED: "ML Directional — Event Settled",
  RULES_DIRECTIONAL_CONTINUOUS: "Rules Directional — Continuous",
  RULES_DIRECTIONAL_EVENT_SETTLED: "Rules Directional — Event Settled",
  CARRY_BASIS_DATED: "Basis Carry — Dated Futures",
  CARRY_BASIS_PERP: "Basis Carry — Funding Rate (Perp)",
  CARRY_STAKED_BASIS: "Staked Basis Carry",
  CARRY_RECURSIVE_STAKED: "Recursive Staked Carry",
  YIELD_ROTATION_LENDING: "Lending Yield Rotation",
  YIELD_STAKING_SIMPLE: "Simple Staking Yield",
  ARBITRAGE_PRICE_DISPERSION: "Price Dispersion Arbitrage",
  LIQUIDATION_CAPTURE: "Liquidation Capture",
  MARKET_MAKING_CONTINUOUS: "Market Making — Continuous",
  MARKET_MAKING_EVENT_SETTLED: "Market Making — Event Settled",
  EVENT_DRIVEN: "Event Driven",
  VOL_TRADING_OPTIONS: "Volatility Trading — Options",
  STAT_ARB_PAIRS_FIXED: "Statistical Arbitrage — Fixed Pairs",
  STAT_ARB_CROSS_SECTIONAL: "Statistical Arbitrage — Cross-Sectional",
} as const;

// ── Bespoke display names for the 8 families ─────────────────────────────

export const FAMILY_DISPLAY_NAMES: Readonly<Record<string, string>> = {
  ML_DIRECTIONAL: "ML Directional",
  RULES_DIRECTIONAL: "Rules Directional",
  CARRY_AND_YIELD: "Carry & Yield",
  ARBITRAGE_STRUCTURAL: "Structural Arbitrage",
  MARKET_MAKING: "Market Making",
  EVENT_DRIVEN: "Event Driven",
  VOL_TRADING: "Volatility Trading",
  STAT_ARB_PAIRS: "Statistical Arbitrage",
} as const;

// ── Acronyms to preserve through title-casing ─────────────────────────────

const ACRONYMS: ReadonlySet<string> = new Set([
  "ML", "BTC", "ETH", "SOL", "USD", "USDT", "USDC", "GBP", "EUR",
  "DeFi", "CeFi", "TradFi", "LP", "IV", "DEX", "CEX", "OKX", "ERC20",
  "AAVE", "GMX", "IBKR", "CME", "CBOE", "ICE", "SPY", "ES", "NQ",
]);

const MIXED_CASE_ACRONYMS: ReadonlySet<string> = new Set(["DeFi", "CeFi", "TradFi"]);

function titleToken(token: string): string {
  const upper = token.toUpperCase();
  if (ACRONYMS.has(upper)) return upper;
  for (const mixed of MIXED_CASE_ACRONYMS) {
    if (mixed.toLowerCase() === token.toLowerCase()) return mixed;
  }
  if (!token) return token;
  return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
}

function genericFormat(raw: string): string {
  return raw
    .split("_")
    .filter(Boolean)
    .map(titleToken)
    .join(" ");
}

// ── Public formatters ─────────────────────────────────────────────────────

/** "ML_DIRECTIONAL" → "ML Directional" */
export function formatFamily(family: string): string {
  return FAMILY_DISPLAY_NAMES[family] ?? genericFormat(family);
}

/** "CARRY_BASIS_PERP" → "Basis Carry — Funding Rate (Perp)" */
export function formatArchetype(archetype: string): string {
  return ARCHETYPE_DISPLAY_NAMES[archetype] ?? genericFormat(archetype);
}

/**
 * "hyperliquid+binance" → "Hyperliquid + Binance"
 * "multi-cex" → "Multi CEX"
 */
export function formatVenueScope(scope: string): string {
  return scope
    .split("+")
    .map((v) =>
      v
        .split("-")
        .map(titleToken)
        .join(" ")
    )
    .join(" + ");
}

/** "spot" → "Spot" | "dated_future" → "Dated Future" | "lp" → "LP" */
export function formatInstrumentType(type: string): string {
  const map: Record<string, string> = {
    spot: "Spot",
    perp: "Perp",
    dated_future: "Dated Future",
    option: "Option",
    lending: "Lending",
    staking: "Staking",
    lp: "LP",
    event_settled: "Event Settled",
  };
  return map[type] ?? genericFormat(type);
}

/** "usdt" → "USDT" | "eth" → "ETH" */
export function formatShareClass(cls: string): string {
  return cls.toUpperCase();
}

/**
 * Format a full slot label for human display.
 *
 * "CARRY_BASIS_PERP@binance-btc-usdt-prod"
 * → "Basis Carry — Funding Rate (Perp) · Binance BTC USDT"
 *
 * Strips env suffix (prod/paper/backtest/smoke) and version suffix (-v2).
 */
export function formatSlotLabel(slotLabel: string): string {
  const atIdx = slotLabel.indexOf("@");
  if (atIdx === -1) return formatArchetype(slotLabel);

  const archetypePart = slotLabel.slice(0, atIdx);
  const scopePart = slotLabel.slice(atIdx + 1);

  const envSuffixes = new Set(["prod", "paper", "backtest", "smoke"]);

  // Strip env suffix and version suffix (-vN)
  const tokens = scopePart
    .replace(/-v\d+(-|$)/, "$1")
    .split("-")
    .filter((t) => !envSuffixes.has(t) && Boolean(t));

  // First token(s) before the first known instrument keyword are the venue scope
  const instrumentKeywords = new Set(["btc", "eth", "sol", "usdt", "usdc", "usd", "gbp", "eur",
    "perp", "spot", "dated", "option", "lp", "staking", "lending", "usdc",
    "1x2", "epl", "surface"]);

  // Heuristic: venue scope is tokens before the first "asset" or "instrument" keyword
  // Simple approach: join all tokens with spaces and title-case
  const readable = tokens.map(titleToken).join(" ");

  return `${formatArchetype(archetypePart)} · ${readable}`;
}

// ── Plan tier classification ───────────────────────────────────────────────

/**
 * Which plan tier a given archetype belongs to.
 * - `"both"` = available in DART Signals-In and DART Full.
 * - `"full-only"` = requires ML training pipeline (strategy-full + ml-full entitlements).
 */
export type StrategyPlanTier = "both" | "full-only";

export const ARCHETYPE_PLAN_TIER: Readonly<Record<string, StrategyPlanTier>> = {
  ML_DIRECTIONAL_CONTINUOUS: "full-only",
  ML_DIRECTIONAL_EVENT_SETTLED: "full-only",
  EVENT_DRIVEN: "full-only",
  VOL_TRADING_OPTIONS: "full-only",
} as const;

/** Returns "full-only" for ML-dependent archetypes, "both" for everything else. */
export function getArchetypePlanTier(archetype: string): StrategyPlanTier {
  return ARCHETYPE_PLAN_TIER[archetype] ?? "both";
}
