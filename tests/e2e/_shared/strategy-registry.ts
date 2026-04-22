import type { PersonaKey } from "./persona";

/**
 * Strategy registry — SSOT for per-archetype test configuration.
 *
 * Every trading archetype surfaces in the UI one of two ways:
 *
 *   1. `execution` — dedicated route + widget the operator drives through
 *      (e.g. YIELD_ROTATION_LENDING renders DeFi Lending Widget under
 *      /services/trading/defi). These get hand-written fixture JSONs in
 *      tests/e2e/fixtures/strategies/ and a dedicated spec file that
 *      exercises the widget inputs end-to-end.
 *
 *   2. `detail-view` — archetype has no dedicated action surface, only the
 *      generic /services/trading/strategies/[id] detail page (KPIs + tabs
 *      + archetype analytics panel). Covered by the parametric
 *      `tests/e2e/strategies/_detail-view.spec.ts` which reads this
 *      registry directly.
 *
 * Keep this file aligned with lib/mocks/fixtures/strategy-instances.ts. The
 * `instanceIds` list is the exhaustive set of mock catalog entries for each
 * archetype — `primaryInstanceId` is the one the detail-view spec drives.
 */

export type ArchetypeCoverage = "execution" | "detail-view";

/**
 * SSOT sub-mode flag — used when an archetype fans out into multiple
 * execution surfaces in architecture-v2. Currently only
 * `MARKET_MAKING_CONTINUOUS` uses it:
 *   - `clob_mm`: order-book quoting (no dedicated UI widget yet; detail-view)
 *   - `amm_lp`:  concentrated-liquidity LP (execution via defi-liquidity-widget)
 */
export type ArchetypeSubMode = "amm_lp" | "clob_mm";

export interface StrategyRegistryEntry {
  /** Canonical archetype id (matches strategy-instances.ts `archetype` field). */
  readonly archetype: string;
  /** How this archetype surfaces in the UI. */
  readonly coverage: ArchetypeCoverage;
  /**
   * Optional SSOT sub-mode discriminator. Today only set for
   * MARKET_MAKING_CONTINUOUS, which has an AMM LP execution surface but
   * folds CLOB MM detail-view coverage under the same archetype per
   * architecture-v2 SSOT.
   */
  readonly subMode?: ArchetypeSubMode;
  /** Short description for docs + test-report summaries. */
  readonly description: string;
  /** Persona seeded into localStorage before navigation. */
  readonly persona: PersonaKey;
  /**
   * Route to exercise.
   *
   * For `execution` coverage this is a literal path (e.g.
   * "/services/trading/defi"). For `detail-view` coverage it's a function
   * of the instance id — the detail-view spec builds the URL via
   * `buildRoute(primaryInstanceId)`.
   */
  readonly buildRoute: (instanceId: string) => string;
  /** `data-testid` that must be present to consider the page rendered. */
  readonly rootSelector: string;
  /** Fixture slug for `execution` coverage (points at `fixtures/strategies/<slug>.json`). */
  readonly fixtureSlug?: string;
  /** Playbook path (for humans; not used at runtime). */
  readonly playbook?: string;
  /** Instance id the detail-view spec drives by default. */
  readonly primaryInstanceId: string;
  /** Every instance id for this archetype from the mock catalog. */
  readonly instanceIds: readonly string[];
  /**
   * Default widget-input values captured per archetype (for
   * `execution` coverage). Mirror whatever fields the fixture scenarios
   * reference — kept here so the values are discoverable even if a human
   * wants to spin up a manual run.
   */
  readonly defaultInputs?: Readonly<Record<string, string | number>>;
  /**
   * Archetype-specific assertions the detail-view spec runs in addition
   * to the standard page-header + tabs checks.
   */
  readonly detailViewKpis?: readonly string[];
}

const strategiesRoute = (instanceId: string): string =>
  `/services/trading/strategies/${encodeURIComponent(instanceId)}`;

export const STRATEGY_REGISTRY: Readonly<Record<string, StrategyRegistryEntry>> = Object.freeze({
  // ──────────────────────────────────────────────────────────────────────
  // Execution-surface archetypes — each has a dedicated fixture + spec
  // ──────────────────────────────────────────────────────────────────────
  YIELD_ROTATION_LENDING: {
    archetype: "YIELD_ROTATION_LENDING",
    coverage: "execution",
    description: "Supply/withdraw liquidity across lending protocols to chase best supply APY.",
    persona: "internal-trader",
    buildRoute: () => "/services/trading/defi",
    rootSelector: '[data-testid="defi-lending-widget"]',
    fixtureSlug: "yield-rotation-lending",
    playbook: "docs/trading/defi/playbooks/yield-rotation-lending.md",
    primaryInstanceId: "YIELD_ROTATION_LENDING@aave-multichain-usdc-prod",
    instanceIds: [
      "YIELD_ROTATION_LENDING@aave-multichain-usdc-prod",
      "YIELD_ROTATION_LENDING@aave-compound-morpho-usdc-ethereum-prod",
      "YIELD_ROTATION_LENDING@kamino-solana-usdc-prod",
    ],
    defaultInputs: { operation: "LEND", amount: 1000 },
  },

  YIELD_STAKING_SIMPLE: {
    archetype: "YIELD_STAKING_SIMPLE",
    coverage: "execution",
    description: "Stake an underlying asset on a validator protocol for protocol yield.",
    persona: "internal-trader",
    buildRoute: () => "/services/trading/defi/staking",
    rootSelector: '[data-testid="defi-staking-widget"]',
    fixtureSlug: "yield-staking-simple",
    playbook: "docs/trading/defi/playbooks/yield-staking-simple.md",
    primaryInstanceId: "YIELD_STAKING_SIMPLE@lido-steth-ethereum-eth-prod",
    instanceIds: [
      "YIELD_STAKING_SIMPLE@lido-steth-ethereum-eth-prod",
      "YIELD_STAKING_SIMPLE@jito-jitosol-solana-sol-prod",
    ],
    defaultInputs: { operation: "STAKE", amount: 10 },
  },

  CARRY_BASIS_PERP: {
    archetype: "CARRY_BASIS_PERP",
    coverage: "execution",
    description: "Spot long hedged by perp short to capture funding-rate carry.",
    persona: "internal-trader",
    buildRoute: () => "/services/trading/strategies/carry-basis",
    rootSelector: '[data-testid="defi-swap-widget"]',
    fixtureSlug: "carry-basis-perp",
    playbook: "docs/trading/defi/playbooks/carry-basis-perp.md",
    primaryInstanceId: "CARRY_BASIS_PERP@binance-btc-usdt-prod",
    instanceIds: [
      "CARRY_BASIS_PERP@binance-btc-usdt-prod",
      "CARRY_BASIS_PERP@binance-bybit-btc-usdt-prod",
      "CARRY_BASIS_PERP@uniswap-hyperliquid-eth-usdt-prod",
      "CARRY_BASIS_PERP@lido-hyperliquid-steth-usdt-prod",
    ],
    defaultInputs: { amountIn: 90_000, slippage: 0.5, perpAsset: "ETH", perpSize: 25 },
  },

  CARRY_STAKED_BASIS: {
    archetype: "CARRY_STAKED_BASIS",
    coverage: "execution",
    description: "Stable → weETH swap + perp short hedge for LST yield + funding carry.",
    persona: "internal-trader",
    buildRoute: () => "/services/trading/strategies/staked-basis",
    rootSelector: '[data-testid="defi-swap-widget"]',
    fixtureSlug: "carry-staked-basis",
    playbook: "docs/trading/defi/playbooks/carry-staked-basis.md",
    primaryInstanceId: "CARRY_STAKED_BASIS@lido-aave-hyperliquid-eth-prod",
    instanceIds: [
      "CARRY_STAKED_BASIS@lido-aave-hyperliquid-eth-prod",
      "CARRY_STAKED_BASIS@jito-kamino-drift-sol-usdc-prod",
    ],
    defaultInputs: { swapAmount: 50_000, pledgeAmount: 10, borrowAmount: 15_000, perpSize: 10 },
  },

  // ──────────────────────────────────────────────────────────────────────
  // Detail-view archetypes — exercised via the parametric detail spec
  // ──────────────────────────────────────────────────────────────────────
  CARRY_BASIS_DATED: {
    archetype: "CARRY_BASIS_DATED",
    coverage: "detail-view",
    description: "Spot long vs. dated futures short for fixed-maturity basis carry.",
    persona: "internal-trader",
    buildRoute: strategiesRoute,
    rootSelector: '[class*="max-w-"]',
    primaryInstanceId: "CARRY_BASIS_DATED@binance-deribit-btc-dated-usdt-prod",
    instanceIds: [
      "CARRY_BASIS_DATED@binance-deribit-btc-dated-usdt-prod",
      "CARRY_BASIS_DATED@binance-deribit-btc-fixed-dec25-usdt-prod",
      "CARRY_BASIS_DATED@deribit-btc-parity-synthetic-usdt-prod",
      "CARRY_BASIS_DATED@ibkr-cme-spy-es-dated-usd-prod",
      "CARRY_BASIS_DATED@ibkr-ice-brent-fixed-feb26-usd-prod",
    ],
    // Primary instance is CeFi (binance-deribit), so the DeFi-only KPI
    // panel (Health Factor / APY) does not render. Generic KPIs suffice.
  },

  CARRY_RECURSIVE_STAKED: {
    archetype: "CARRY_RECURSIVE_STAKED",
    coverage: "detail-view",
    description: "Leverage LST via recursive deposit→borrow loops for amplified staking yield.",
    persona: "internal-trader",
    buildRoute: strategiesRoute,
    rootSelector: '[class*="max-w-"]',
    primaryInstanceId: "CARRY_RECURSIVE_STAKED@lido-aave-steth-ltv70-ethereum-prod",
    instanceIds: [
      "CARRY_RECURSIVE_STAKED@lido-aave-steth-ltv70-ethereum-prod",
      "CARRY_RECURSIVE_STAKED@jito-kamino-jitosol-ltv70-solana-prod",
    ],
    detailViewKpis: ["Health Factor", "APY (Current)"],
  },

  ARBITRAGE_PRICE_DISPERSION: {
    archetype: "ARBITRAGE_PRICE_DISPERSION",
    coverage: "detail-view",
    description: "Cross-venue / cross-instrument price-dispersion arbitrage.",
    persona: "internal-trader",
    buildRoute: strategiesRoute,
    rootSelector: '[class*="max-w-"]',
    primaryInstanceId: "ARBITRAGE_PRICE_DISPERSION@binance-bybit-btc-usdt-prod",
    instanceIds: [
      "ARBITRAGE_PRICE_DISPERSION@binance-bybit-btc-usdt-prod",
      "ARBITRAGE_PRICE_DISPERSION@binance-bybit-btc-perp-usdt-prod",
      "ARBITRAGE_PRICE_DISPERSION@multi-cex-btc-funding-usdt-prod",
      "ARBITRAGE_PRICE_DISPERSION@deribit-okx-btc-vol-usdt-prod",
      "ARBITRAGE_PRICE_DISPERSION@multi-dex-eth-usdc-ethereum-prod",
      "ARBITRAGE_PRICE_DISPERSION@hyperliquid-gmx-eth-perp-usdc-prod",
      "ARBITRAGE_PRICE_DISPERSION@uniswap-flashloan-eth-usdc-ethereum-prod",
      "ARBITRAGE_PRICE_DISPERSION@cme-es-nq-dated-ratio-usd-prod",
      "ARBITRAGE_PRICE_DISPERSION@cme-es-calendar-fixed-dec25-mar26-usd-prod",
      "ARBITRAGE_PRICE_DISPERSION@cboe-spy-surface-noarb-usd-prod",
      "ARBITRAGE_PRICE_DISPERSION@unity-epl-1x2-usd-prod",
      "ARBITRAGE_PRICE_DISPERSION@betfair-smarkets-epl-1x2-gbp-prod",
      "ARBITRAGE_PRICE_DISPERSION@polymarket-unity-elections-usdc-prod",
    ],
  },

  LIQUIDATION_CAPTURE: {
    archetype: "LIQUIDATION_CAPTURE",
    coverage: "detail-view",
    description: "Capture liquidation-cascade inefficiencies on perp & lending venues.",
    persona: "internal-trader",
    buildRoute: strategiesRoute,
    rootSelector: '[class*="max-w-"]',
    primaryInstanceId: "LIQUIDATION_CAPTURE@hyperliquid-btc-perp-bidladder-usdt-prod",
    instanceIds: [
      "LIQUIDATION_CAPTURE@hyperliquid-btc-perp-bidladder-usdt-prod",
      "LIQUIDATION_CAPTURE@aave-ethereum-eth-usdc-prod",
      "LIQUIDATION_CAPTURE@aave-arbitrum-eth-usdc-prod",
      "LIQUIDATION_CAPTURE@kamino-solana-sol-usdc-prod",
      "LIQUIDATION_CAPTURE@gmx-arbitrum-eth-perp-usdc-prod",
    ],
  },

  MARKET_MAKING_CONTINUOUS: {
    archetype: "MARKET_MAKING_CONTINUOUS",
    // Parametric detail-view spec iterates all 6 instances (CLOB MM + AMM LP).
    // The AMM LP sub-mode additionally has an execution spec that drives
    // the defi-liquidity-widget via the market-making-continuous-amm-lp
    // fixture — see `subMode` + `fixtureSlug` below.
    coverage: "detail-view",
    subMode: "amm_lp",
    description: "Two-sided quoting on continuous venues for spread + rebate capture (sub-modes: CLOB MM, AMM LP).",
    persona: "internal-trader",
    buildRoute: strategiesRoute,
    rootSelector: '[class*="max-w-"]',
    fixtureSlug: "market-making-continuous-amm-lp",
    playbook: "docs/trading/defi/playbooks/market-making-continuous-amm-lp.md",
    primaryInstanceId: "MARKET_MAKING_CONTINUOUS@binance-btc-usdt-mm-usdt-prod",
    instanceIds: [
      "MARKET_MAKING_CONTINUOUS@binance-btc-usdt-mm-usdt-prod",
      "MARKET_MAKING_CONTINUOUS@hyperliquid-eth-perp-mm-usdt-prod",
      "MARKET_MAKING_CONTINUOUS@deribit-btc-option-mm-usdt-prod",
      "MARKET_MAKING_CONTINUOUS@uniswap-v3-weth-usdc-ethereum-active-usdc-prod",
      "MARKET_MAKING_CONTINUOUS@curve-3pool-ethereum-passive-usdc-prod",
      "MARKET_MAKING_CONTINUOUS@betfair-direct-epl-1x2-mm-gbp-prod",
    ],
    defaultInputs: { operation: "ADD_LIQUIDITY", amount: 5, feeTier: 0.05 },
    detailViewKpis: ["Avg Spread Captured", "Inventory Turnover", "Fill Rate"],
  },

  MARKET_MAKING_EVENT_SETTLED: {
    archetype: "MARKET_MAKING_EVENT_SETTLED",
    coverage: "detail-view",
    description: "Event-settled market making (sports & prediction order books).",
    persona: "internal-trader",
    buildRoute: strategiesRoute,
    rootSelector: '[class*="max-w-"]',
    primaryInstanceId: "MARKET_MAKING_EVENT_SETTLED@betfair-direct-epl-1x2-mm-gbp-prod",
    instanceIds: [
      "MARKET_MAKING_EVENT_SETTLED@betfair-direct-epl-1x2-mm-gbp-prod",
      "MARKET_MAKING_EVENT_SETTLED@betfair-direct-atp-match-winner-mm-gbp-prod",
      "MARKET_MAKING_EVENT_SETTLED@smarkets-direct-epl-1x2-mm-gbp-prod",
      "MARKET_MAKING_EVENT_SETTLED@polymarket-us-election-mm-usdc-prod",
    ],
    detailViewKpis: ["Avg Spread Captured", "Fill Rate"],
  },

  ML_DIRECTIONAL_CONTINUOUS: {
    archetype: "ML_DIRECTIONAL_CONTINUOUS",
    coverage: "detail-view",
    description: "ML-driven directional signals on continuous instruments.",
    persona: "internal-trader",
    buildRoute: strategiesRoute,
    rootSelector: '[class*="max-w-"]',
    primaryInstanceId: "ML_DIRECTIONAL_CONTINUOUS@binance-btc-usdt-5m-usdt-prod",
    instanceIds: [
      "ML_DIRECTIONAL_CONTINUOUS@binance-btc-usdt-5m-usdt-prod",
      "ML_DIRECTIONAL_CONTINUOUS@binance-btc-perp-5m-usdt-prod",
      "ML_DIRECTIONAL_CONTINUOUS@hyperliquid-eth-perp-5m-usdt-v2-prod",
      "ML_DIRECTIONAL_CONTINUOUS@deribit-btc-dated-daily-usdt-prod",
      "ML_DIRECTIONAL_CONTINUOUS@deribit-btc-atm_call-daily-usdt-prod",
      "ML_DIRECTIONAL_CONTINUOUS@uniswap-ethereum-weth-usdc-5m-usdc-prod",
      "ML_DIRECTIONAL_CONTINUOUS@gmx-arbitrum-eth-perp-5m-usdc-prod",
      "ML_DIRECTIONAL_CONTINUOUS@ibkr-spy-1m-usd-prod",
      "ML_DIRECTIONAL_CONTINUOUS@cme-es-dated-1m-usd-prod",
      "ML_DIRECTIONAL_CONTINUOUS@ice-brent-dated-daily-usd-prod",
      "ML_DIRECTIONAL_CONTINUOUS@ibkr-cboe-spy-atm_call-daily-usd-prod",
    ],
  },

  ML_DIRECTIONAL_EVENT_SETTLED: {
    archetype: "ML_DIRECTIONAL_EVENT_SETTLED",
    coverage: "detail-view",
    description: "ML-driven directional signals on event-settled instruments.",
    persona: "internal-trader",
    buildRoute: strategiesRoute,
    rootSelector: '[class*="max-w-"]',
    primaryInstanceId: "ML_DIRECTIONAL_EVENT_SETTLED@unity-epl-1x2-usd-prod",
    instanceIds: [
      "ML_DIRECTIONAL_EVENT_SETTLED@unity-epl-1x2-usd-prod",
      "ML_DIRECTIONAL_EVENT_SETTLED@unity-nba-moneyline-usd-prod",
      "ML_DIRECTIONAL_EVENT_SETTLED@unity-nfl-moneyline-value-usd-prod",
      "ML_DIRECTIONAL_EVENT_SETTLED@unity-mlb-moneyline-value-usd-prod",
      "ML_DIRECTIONAL_EVENT_SETTLED@betfair-direct-epl-1x2-gbp-prod",
      "ML_DIRECTIONAL_EVENT_SETTLED@polymarket-us-election-president-usdc-prod",
    ],
  },

  RULES_DIRECTIONAL_CONTINUOUS: {
    archetype: "RULES_DIRECTIONAL_CONTINUOUS",
    coverage: "detail-view",
    description: "Rule-based directional signals on continuous instruments.",
    persona: "internal-trader",
    buildRoute: strategiesRoute,
    rootSelector: '[class*="max-w-"]',
    primaryInstanceId: "RULES_DIRECTIONAL_CONTINUOUS@binance-btc-usdt-15m-macd-usdt-prod",
    instanceIds: [
      "RULES_DIRECTIONAL_CONTINUOUS@binance-btc-usdt-15m-macd-usdt-prod",
      "RULES_DIRECTIONAL_CONTINUOUS@binance-btc-perp-15m-ta-funding-usdt-prod",
      "RULES_DIRECTIONAL_CONTINUOUS@hyperliquid-btc-perp-5m-vwap-usdt-prod",
      "RULES_DIRECTIONAL_CONTINUOUS@gmx-arbitrum-eth-perp-1h-ta-usdc-prod",
      "RULES_DIRECTIONAL_CONTINUOUS@ibkr-spy-daily-donchian-usd-prod",
      "RULES_DIRECTIONAL_CONTINUOUS@cme-es-dated-1m-ta-usd-prod",
    ],
  },

  RULES_DIRECTIONAL_EVENT_SETTLED: {
    archetype: "RULES_DIRECTIONAL_EVENT_SETTLED",
    coverage: "detail-view",
    description: "Rule-based directional signals on event-settled instruments.",
    persona: "internal-trader",
    buildRoute: strategiesRoute,
    rootSelector: '[class*="max-w-"]',
    primaryInstanceId: "RULES_DIRECTIONAL_EVENT_SETTLED@unity-epl-xg-diff-usd-prod",
    instanceIds: [
      "RULES_DIRECTIONAL_EVENT_SETTLED@unity-epl-xg-diff-usd-prod",
      "RULES_DIRECTIONAL_EVENT_SETTLED@unity-nba-rest-days-rule-usd-prod",
      "RULES_DIRECTIONAL_EVENT_SETTLED@polymarket-btc-price-band-rule-usdc-prod",
    ],
  },

  EVENT_DRIVEN: {
    archetype: "EVENT_DRIVEN",
    coverage: "detail-view",
    description: "Event-reaction strategies (macro releases, earnings, unlocks, lineups).",
    persona: "internal-trader",
    buildRoute: strategiesRoute,
    rootSelector: '[class*="max-w-"]',
    primaryInstanceId: "EVENT_DRIVEN@binance-btc-usdt-nfp-usdt-prod",
    instanceIds: [
      "EVENT_DRIVEN@binance-btc-usdt-nfp-usdt-prod",
      "EVENT_DRIVEN@binance-btc-perp-fomc-usdt-prod",
      "EVENT_DRIVEN@deribit-btc-option-fomc-straddle-usdt-prod",
      "EVENT_DRIVEN@uniswap-ethereum-arb-token-unlock-usdc-prod",
      "EVENT_DRIVEN@aave-ethereum-governance-rate-update-usdc-prod",
      "EVENT_DRIVEN@ibkr-aapl-earnings-usd-prod",
      "EVENT_DRIVEN@cme-es-dated-nfp-usd-prod",
      "EVENT_DRIVEN@cboe-vix-cpi-usd-prod",
      "EVENT_DRIVEN@unity-epl-lineup-release-usd-prod",
      "EVENT_DRIVEN@polymarket-us-election-debate-usdc-prod",
    ],
  },

  VOL_TRADING_OPTIONS: {
    archetype: "VOL_TRADING_OPTIONS",
    coverage: "detail-view",
    description: "Options-vol trading (delta-hedged variance / skew strategies).",
    persona: "internal-trader",
    buildRoute: strategiesRoute,
    rootSelector: '[class*="max-w-"]',
    primaryInstanceId: "VOL_TRADING_OPTIONS@deribit-btc-vol-usdt-prod",
    instanceIds: [
      "VOL_TRADING_OPTIONS@deribit-btc-vol-usdt-prod",
      "VOL_TRADING_OPTIONS@deribit-btc-skew-usdt-prod",
      "VOL_TRADING_OPTIONS@ibkr-cboe-spy-vol-usd-prod",
    ],
  },

  STAT_ARB_PAIRS_FIXED: {
    archetype: "STAT_ARB_PAIRS_FIXED",
    coverage: "detail-view",
    description: "Fixed-pair stat-arb (mean reversion on a pre-selected pair).",
    persona: "internal-trader",
    buildRoute: strategiesRoute,
    rootSelector: '[class*="max-w-"]',
    primaryInstanceId: "STAT_ARB_PAIRS_FIXED@binance-btc-eth-spot-usdt-prod",
    instanceIds: [
      "STAT_ARB_PAIRS_FIXED@binance-btc-eth-spot-usdt-prod",
      "STAT_ARB_PAIRS_FIXED@binance-btc-eth-perp-usdt-prod",
      "STAT_ARB_PAIRS_FIXED@uniswap-ethereum-eth-wbtc-usdc-prod",
      "STAT_ARB_PAIRS_FIXED@hyperliquid-sol-eth-perp-usdc-prod",
      "STAT_ARB_PAIRS_FIXED@ibkr-goog-meta-daily-usd-prod",
      "STAT_ARB_PAIRS_FIXED@ibkr-aapl-msft-1h-usd-prod",
      "STAT_ARB_PAIRS_FIXED@ibkr-tlt-ief-daily-usd-prod",
      "STAT_ARB_PAIRS_FIXED@cme-es-nq-dated-zscore-usd-prod",
      "STAT_ARB_PAIRS_FIXED@ice-brent-cme-wti-dated-usd-prod",
    ],
  },

  STAT_ARB_CROSS_SECTIONAL: {
    archetype: "STAT_ARB_CROSS_SECTIONAL",
    coverage: "detail-view",
    description: "Cross-sectional stat-arb (ranked basket longs vs shorts).",
    persona: "internal-trader",
    buildRoute: strategiesRoute,
    rootSelector: '[class*="max-w-"]',
    primaryInstanceId: "STAT_ARB_CROSS_SECTIONAL@binance-alt-basket-momentum-usdt-prod",
    instanceIds: [
      "STAT_ARB_CROSS_SECTIONAL@binance-alt-basket-momentum-usdt-prod",
      "STAT_ARB_CROSS_SECTIONAL@hyperliquid-alt-perp-momentum-usdt-prod",
      "STAT_ARB_CROSS_SECTIONAL@hyperliquid-dex-alt-perp-momentum-usdc-prod",
      "STAT_ARB_CROSS_SECTIONAL@ibkr-sp500-momentum-usd-prod",
      "STAT_ARB_CROSS_SECTIONAL@ibkr-sp500-sector-rotation-usd-prod",
    ],
  },
});

export type ArchetypeKey = keyof typeof STRATEGY_REGISTRY;

export function getRegistryEntry(archetype: string): StrategyRegistryEntry {
  const entry = STRATEGY_REGISTRY[archetype];
  if (!entry) {
    throw new Error(`[strategy-registry] unknown archetype: ${archetype}`);
  }
  return entry;
}

export function listArchetypes(coverage?: ArchetypeCoverage): readonly StrategyRegistryEntry[] {
  const entries = Object.values(STRATEGY_REGISTRY);
  return coverage ? entries.filter((e) => e.coverage === coverage) : entries;
}
