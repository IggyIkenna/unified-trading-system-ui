/**
 * Static mock seed data — committed to git, provides the demo baseline.
 * Each organisation has distinct positions, orders, trades, alerts, and strategies.
 *
 * Reset interactive state (workspace layouts, filter selections) via resetDemo().
 * This file is NEVER cleared by reset — it's the permanent seed.
 */

import type { AlertType } from "@/lib/config/services/alerts.config";
export type { AlertType };

// ── Types ────────────────────────────────────────────────────────────────────

export interface SeedPosition {
  id: string;
  instrument: string;
  venue: string;
  side: "long" | "short";
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  unrealisedPnl: number;
  realisedPnl: number;
  orgId: string;
  clientId: string;
  strategyId: string;
  strategyName: string;
}

export interface SeedOrder {
  id: string;
  instrument: string;
  venue: string;
  side: "buy" | "sell";
  quantity: number;
  price: number;
  filledQty: number;
  status: "open" | "filled" | "partially_filled" | "cancelled";
  type: "limit" | "market" | "stop";
  timestamp: string;
  orgId: string;
  clientId: string;
  strategyId: string;
}

export interface SeedTrade {
  id: string;
  /** Links fills to a position row for drill-down */
  positionId: string;
  instrument: string;
  venue: string;
  side: "buy" | "sell";
  quantity: number;
  price: number;
  fees: number;
  total: number;
  tradeType: "Exchange" | "OTC" | "DeFi" | "Manual";
  status: "settled" | "pending";
  counterparty: string;
  timestamp: string;
  settlementDate: string;
  orgId: string;
  clientId: string;
  strategyId: string;
}

export interface SeedAlert {
  id: string;
  message: string;
  severity: "critical" | "high" | "medium" | "low";
  source: string;
  timestamp: string;
  orgId: string;
  strategyId: string;
  acknowledged: boolean;
  alertType: AlertType;
}

export interface SeedStrategy {
  id: string;
  name: string;
  archetype: string;
  status: "live" | "paused" | "shadow";
  sharpe: number;
  mtdReturn: number;
  aum: number;
  orgId: string;
  clientId: string;
}

export interface SeedPnlDay {
  date: string;
  pnl: number;
}

// ── Strategy definitions ─────────────────────────────────────────────────────

export const SEED_STRATEGIES: SeedStrategy[] = [
  // Odum Internal — Trading Desk Alpha
  {
    id: "strat-btc-mom-alpha",
    name: "BTC Momentum",
    archetype: "momentum",
    status: "live",
    sharpe: 1.82,
    mtdReturn: 4.2,
    aum: 8200000,
    orgId: "odum",
    clientId: "delta-one",
  },
  {
    id: "BASIS_TRADE",
    name: "Multi-Venue Basis Trade",
    archetype: "basis",
    status: "live",
    sharpe: 2.14,
    mtdReturn: 2.8,
    aum: 5100000,
    orgId: "odum",
    clientId: "delta-one",
  },
  // Odum Internal — Trading Desk Beta
  {
    id: "strat-ml-dir-beta",
    name: "ML Directional",
    archetype: "ml-directional",
    status: "live",
    sharpe: 1.45,
    mtdReturn: 3.1,
    aum: 6400000,
    orgId: "odum",
    clientId: "quant-fund",
  },
  {
    id: "strat-xexch-arb-beta",
    name: "Cross-Exchange Arb",
    archetype: "arbitrage",
    status: "live",
    sharpe: 3.21,
    mtdReturn: 1.2,
    aum: 3200000,
    orgId: "odum",
    clientId: "quant-fund",
  },
  // Odum Internal — DeFi Ops (canonical strategy_id matches backend factory keys)
  {
    id: "AAVE_LENDING",
    name: "AAVE Lending",
    archetype: "yield",
    status: "live",
    sharpe: 1.65,
    mtdReturn: 5.4,
    aum: 4800000,
    orgId: "odum",
    clientId: "defi-desk",
  },
  {
    id: "STAKED_BASIS",
    name: "Staked Basis (weETH)",
    archetype: "basis",
    status: "live",
    sharpe: 1.72,
    mtdReturn: 4.8,
    aum: 3200000,
    orgId: "odum",
    clientId: "defi-desk",
  },
  {
    id: "strat-flash-arb",
    name: "Flash Loan Arb",
    archetype: "arbitrage",
    status: "shadow",
    sharpe: 2.88,
    mtdReturn: 0.8,
    aum: 1200000,
    orgId: "odum",
    clientId: "defi-desk",
  },
  // Odum Internal — Sports Desk
  {
    id: "strat-sports-arb",
    name: "Sports Arb",
    archetype: "arbitrage",
    status: "live",
    sharpe: 1.92,
    mtdReturn: 2.1,
    aum: 2400000,
    orgId: "odum",
    clientId: "sports-desk",
  },

  // Apex Capital
  {
    id: "strat-btc-mom-apex",
    name: "BTC Momentum",
    archetype: "momentum",
    status: "live",
    sharpe: 1.55,
    mtdReturn: 3.6,
    aum: 12000000,
    orgId: "alpha-capital",
    clientId: "alpha-main",
  },
  {
    id: "strat-opts-vol-apex",
    name: "Options Vol",
    archetype: "volatility",
    status: "live",
    sharpe: 1.78,
    mtdReturn: 1.9,
    aum: 8500000,
    orgId: "alpha-capital",
    clientId: "alpha-main",
  },
  {
    id: "strat-xexch-apex",
    name: "Cross-Exchange Arb",
    archetype: "arbitrage",
    status: "live",
    sharpe: 2.95,
    mtdReturn: 0.9,
    aum: 5400000,
    orgId: "alpha-capital",
    clientId: "alpha-crypto",
  },

  // Zenith Partners
  {
    id: "strat-opts-zen",
    name: "Options Vol",
    archetype: "volatility",
    status: "live",
    sharpe: 2.05,
    mtdReturn: 2.4,
    aum: 9200000,
    orgId: "vertex-partners",
    clientId: "vertex-core",
  },
  {
    id: "strat-spreads-zen",
    name: "Spread Trading",
    archetype: "relative-value",
    status: "paused",
    sharpe: 1.32,
    mtdReturn: -0.4,
    aum: 3100000,
    orgId: "vertex-partners",
    clientId: "vertex-core",
  },

  // Meridian Fund
  {
    id: "strat-ml-dir-mer",
    name: "ML Directional",
    archetype: "ml-directional",
    status: "live",
    sharpe: 1.68,
    mtdReturn: 3.8,
    aum: 7600000,
    orgId: "meridian-fund",
    clientId: "meridian-systematic",
  },
  {
    id: "strat-eth-basis-mer",
    name: "ETH Basis Trade",
    archetype: "basis",
    status: "live",
    sharpe: 1.91,
    mtdReturn: 2.2,
    aum: 4200000,
    orgId: "meridian-fund",
    clientId: "meridian-systematic",
  },
  {
    id: "strat-disc-mer",
    name: "Discretionary Macro",
    archetype: "discretionary",
    status: "live",
    sharpe: 0.95,
    mtdReturn: 1.1,
    aum: 5800000,
    orgId: "meridian-fund",
    clientId: "meridian-discretionary",
  },

  // Atlas Ventures
  {
    id: "strat-btc-mom-atlas",
    name: "BTC Momentum",
    archetype: "momentum",
    status: "live",
    sharpe: 1.42,
    mtdReturn: 3.9,
    aum: 3800000,
    orgId: "atlas-ventures",
    clientId: "atlas-growth",
  },
  {
    id: "RECURSIVE_STAKED_BASIS",
    name: "Recursive Staked Basis (Hedged)",
    archetype: "yield",
    status: "live",
    sharpe: 1.88,
    mtdReturn: 6.2,
    aum: 2900000,
    orgId: "atlas-ventures",
    clientId: "atlas-defi",
  },

  // Elysium DeFi demo client retired 2026-04-21 (Wave 7 — venue dropped from UAC).

  // Odum Internal — TradFi Desk
  {
    id: "strat-cme-basis",
    name: "CME Basis Trade",
    archetype: "basis",
    status: "live",
    sharpe: 2.35,
    mtdReturn: 1.8,
    aum: 15000000,
    orgId: "odum",
    clientId: "tradfi-desk",
  },
  {
    id: "strat-equity-stat-arb",
    name: "Equity Stat Arb",
    archetype: "arbitrage",
    status: "live",
    sharpe: 1.72,
    mtdReturn: 2.4,
    aum: 8000000,
    orgId: "odum",
    clientId: "tradfi-desk",
  },

  // Apex Capital — Sports
  {
    id: "strat-sports-arb-apex",
    name: "Sports Live Arb",
    archetype: "arbitrage",
    status: "live",
    sharpe: 3.45,
    mtdReturn: 4.8,
    aum: 1800000,
    orgId: "alpha-capital",
    clientId: "alpha-sports",
  },

  // Meridian Fund — TradFi
  {
    id: "strat-commodity-trend",
    name: "Commodity Trend",
    archetype: "momentum",
    status: "live",
    sharpe: 1.28,
    mtdReturn: 3.2,
    aum: 6200000,
    orgId: "meridian-fund",
    clientId: "meridian-macro",
  },
];

// ── Positions ────────────────────────────────────────────────────────────────

function pos(
  id: string,
  instrument: string,
  venue: string,
  side: "long" | "short",
  qty: number,
  entry: number,
  current: number,
  orgId: string,
  clientId: string,
  stratId: string,
  stratName: string,
): SeedPosition {
  const mult = side === "long" ? 1 : -1;
  return {
    id,
    instrument,
    venue,
    side,
    quantity: qty,
    entryPrice: entry,
    currentPrice: current,
    unrealisedPnl: Math.round((current - entry) * qty * mult * 100) / 100,
    realisedPnl: Math.round((Math.random() * 4000 - 1000) * 100) / 100,
    orgId,
    clientId,
    strategyId: stratId,
    strategyName: stratName,
  };
}

export const SEED_POSITIONS: SeedPosition[] = [
  // Odum Internal — Desk Alpha (BTC Momentum + ETH Basis)
  pos(
    "pos-001",
    "BTC-USDT",
    "BINANCE-SPOT",
    "long",
    2.5,
    64200,
    67430,
    "odum",
    "delta-one",
    "strat-btc-mom-alpha",
    "BTC Momentum",
  ),
  pos(
    "pos-002",
    "BTC-PERP",
    "HYPERLIQUID",
    "long",
    1.8,
    65100,
    67430,
    "odum",
    "delta-one",
    "strat-btc-mom-alpha",
    "BTC Momentum",
  ),
  pos(
    "pos-003",
    "ETH-USDT",
    "BINANCE-SPOT",
    "long",
    15,
    3180,
    3420,
    "odum",
    "delta-one",
    "strat-btc-mom-alpha",
    "BTC Momentum",
  ),
  pos(
    "pos-004",
    "SOL-USDT",
    "BINANCE-SPOT",
    "long",
    120,
    132,
    145,
    "odum",
    "delta-one",
    "strat-btc-mom-alpha",
    "BTC Momentum",
  ),
  pos(
    "pos-005",
    "ETH-USDT",
    "BINANCE-SPOT",
    "long",
    25,
    3250,
    3420,
    "odum",
    "delta-one",
    "BASIS_TRADE",
    "Multi-Venue Basis Trade",
  ),
  pos(
    "pos-006",
    "ETH-PERP",
    "HYPERLIQUID",
    "short",
    25,
    3260,
    3420,
    "odum",
    "delta-one",
    "BASIS_TRADE",
    "Multi-Venue Basis Trade",
  ),
  // Odum Internal — Desk Beta (ML Directional + Cross-Exchange Arb)
  pos(
    "pos-007",
    "BTC-USDT",
    "BINANCE-SPOT",
    "long",
    1.2,
    66800,
    67430,
    "odum",
    "quant-fund",
    "strat-ml-dir-beta",
    "ML Directional",
  ),
  pos(
    "pos-008",
    "ETH-USDT",
    "BINANCE-SPOT",
    "short",
    10,
    3500,
    3420,
    "odum",
    "quant-fund",
    "strat-ml-dir-beta",
    "ML Directional",
  ),
  pos(
    "pos-009",
    "SOL-USDT",
    "HYPERLIQUID",
    "long",
    80,
    138,
    145,
    "odum",
    "quant-fund",
    "strat-ml-dir-beta",
    "ML Directional",
  ),
  pos(
    "pos-010",
    "MATIC-USDT",
    "BINANCE-SPOT",
    "long",
    5000,
    0.72,
    0.78,
    "odum",
    "quant-fund",
    "strat-ml-dir-beta",
    "ML Directional",
  ),
  pos(
    "pos-011",
    "BTC-USDT",
    "BINANCE-SPOT",
    "long",
    0.5,
    67200,
    67430,
    "odum",
    "quant-fund",
    "strat-xexch-arb-beta",
    "Cross-Exchange Arb",
  ),
  pos(
    "pos-012",
    "BTC-USDT",
    "HYPERLIQUID",
    "short",
    0.5,
    67280,
    67430,
    "odum",
    "quant-fund",
    "strat-xexch-arb-beta",
    "Cross-Exchange Arb",
  ),
  // Odum Internal — DeFi Ops (canonical instrument_id + venue_id)
  pos(
    "pos-013",
    "ETHERFI:LST:WEETH@ETHEREUM",
    "ETHERFI-ETHEREUM",
    "long",
    20,
    3200,
    3420,
    "odum",
    "defi-desk",
    "STAKED_BASIS",
    "Staked Basis (weETH)",
  ),
  pos(
    "pos-014",
    "AAVEV3-ETHEREUM:A_TOKEN:AUSDC@ETHEREUM",
    "AAVEV3-ETHEREUM",
    "long",
    50000,
    1.0,
    1.0,
    "odum",
    "defi-desk",
    "AAVE_LENDING",
    "AAVE Lending",
  ),
  pos(
    "pos-015",
    "HYPERLIQUID:PERPETUAL:ETH-USDC@LIN@HYPERLIQUID",
    "HYPERLIQUID",
    "short",
    20,
    3200,
    3420,
    "odum",
    "defi-desk",
    "STAKED_BASIS",
    "Staked Basis (weETH)",
  ),
  pos(
    "pos-016",
    "UNISWAPV3-ETHEREUM:SPOT_ASSET:UNI@ETHEREUM",
    "UNISWAPV3-ETHEREUM",
    "long",
    300,
    7.2,
    8.1,
    "odum",
    "defi-desk",
    "AAVE_LENDING",
    "AAVE Lending",
  ),

  // Apex Capital — Global Macro
  pos(
    "pos-017",
    "BTC-USDT",
    "BINANCE-SPOT",
    "long",
    5,
    63800,
    67430,
    "alpha-capital",
    "alpha-main",
    "strat-btc-mom-apex",
    "BTC Momentum",
  ),
  pos(
    "pos-018",
    "BTC-PERP",
    "HYPERLIQUID",
    "long",
    3,
    64500,
    67430,
    "alpha-capital",
    "alpha-main",
    "strat-btc-mom-apex",
    "BTC Momentum",
  ),
  pos(
    "pos-019",
    "ETH-USDT",
    "BINANCE-SPOT",
    "long",
    30,
    3100,
    3420,
    "alpha-capital",
    "alpha-main",
    "strat-btc-mom-apex",
    "BTC Momentum",
  ),
  pos(
    "pos-020",
    "BTC-26JUN26-70000-C",
    "DERIBIT",
    "long",
    2,
    2800,
    3100,
    "alpha-capital",
    "alpha-main",
    "strat-opts-vol-apex",
    "Options Vol",
  ),
  pos(
    "pos-021",
    "BTC-26JUN26-60000-P",
    "DERIBIT",
    "long",
    3,
    1200,
    980,
    "alpha-capital",
    "alpha-main",
    "strat-opts-vol-apex",
    "Options Vol",
  ),
  pos(
    "pos-022",
    "ETH-26JUN26-4000-C",
    "DERIBIT",
    "long",
    10,
    180,
    210,
    "alpha-capital",
    "alpha-main",
    "strat-opts-vol-apex",
    "Options Vol",
  ),
  // Apex Capital — Crypto Arb
  pos(
    "pos-023",
    "BTC-USDT",
    "BINANCE-SPOT",
    "long",
    1,
    67350,
    67430,
    "alpha-capital",
    "alpha-crypto",
    "strat-xexch-apex",
    "Cross-Exchange Arb",
  ),
  pos(
    "pos-024",
    "BTC-USDT",
    "HYPERLIQUID",
    "short",
    1,
    67410,
    67430,
    "alpha-capital",
    "alpha-crypto",
    "strat-xexch-apex",
    "Cross-Exchange Arb",
  ),
  pos(
    "pos-025",
    "ETH-USDT",
    "BINANCE-SPOT",
    "long",
    8,
    3415,
    3420,
    "alpha-capital",
    "alpha-crypto",
    "strat-xexch-apex",
    "Cross-Exchange Arb",
  ),

  // Zenith Partners — Options
  pos(
    "pos-026",
    "BTC-26JUN26-70000-C",
    "DERIBIT",
    "long",
    5,
    2600,
    3100,
    "vertex-partners",
    "vertex-core",
    "strat-opts-zen",
    "Options Vol",
  ),
  pos(
    "pos-027",
    "BTC-26JUN26-65000-P",
    "DERIBIT",
    "short",
    5,
    1800,
    1600,
    "vertex-partners",
    "vertex-core",
    "strat-opts-zen",
    "Options Vol",
  ),
  pos(
    "pos-028",
    "ETH-26JUN26-4000-C",
    "DERIBIT",
    "long",
    20,
    160,
    210,
    "vertex-partners",
    "vertex-core",
    "strat-opts-zen",
    "Options Vol",
  ),
  pos(
    "pos-029",
    "ETH-26JUN26-3000-P",
    "DERIBIT",
    "short",
    15,
    220,
    180,
    "vertex-partners",
    "vertex-core",
    "strat-opts-zen",
    "Options Vol",
  ),
  pos(
    "pos-030",
    "BTC-26JUN26-75000-C",
    "DERIBIT",
    "short",
    3,
    1400,
    1200,
    "vertex-partners",
    "vertex-core",
    "strat-opts-zen",
    "Options Vol",
  ),

  // Meridian Fund — Systematic
  pos(
    "pos-031",
    "BTC-USDT",
    "BINANCE-SPOT",
    "long",
    3,
    65400,
    67430,
    "meridian-fund",
    "meridian-systematic",
    "strat-ml-dir-mer",
    "ML Directional",
  ),
  pos(
    "pos-032",
    "ETH-USDT",
    "BINANCE-SPOT",
    "long",
    20,
    3280,
    3420,
    "meridian-fund",
    "meridian-systematic",
    "strat-ml-dir-mer",
    "ML Directional",
  ),
  pos(
    "pos-033",
    "SOL-USDT",
    "BINANCE-SPOT",
    "short",
    60,
    152,
    145,
    "meridian-fund",
    "meridian-systematic",
    "strat-ml-dir-mer",
    "ML Directional",
  ),
  pos(
    "pos-034",
    "ETH-USDT",
    "HYPERLIQUID",
    "long",
    12,
    3300,
    3420,
    "meridian-fund",
    "meridian-systematic",
    "strat-eth-basis-mer",
    "ETH Basis Trade",
  ),
  pos(
    "pos-035",
    "ETH-PERP",
    "HYPERLIQUID",
    "short",
    12,
    3310,
    3420,
    "meridian-fund",
    "meridian-systematic",
    "strat-eth-basis-mer",
    "ETH Basis Trade",
  ),
  // Meridian Fund — Discretionary
  pos(
    "pos-036",
    "BTC-USDT",
    "BINANCE-SPOT",
    "long",
    2,
    66000,
    67430,
    "meridian-fund",
    "meridian-discretionary",
    "strat-disc-mer",
    "Discretionary Macro",
  ),
  pos(
    "pos-037",
    "LINK-USDT",
    "BINANCE-SPOT",
    "long",
    500,
    14.2,
    15.8,
    "meridian-fund",
    "meridian-discretionary",
    "strat-disc-mer",
    "Discretionary Macro",
  ),

  // Atlas Ventures
  pos(
    "pos-038",
    "BTC-USDT",
    "BINANCE-SPOT",
    "long",
    1.5,
    65800,
    67430,
    "atlas-ventures",
    "atlas-growth",
    "strat-btc-mom-atlas",
    "BTC Momentum",
  ),
  pos(
    "pos-039",
    "SOL-USDT",
    "BINANCE-SPOT",
    "long",
    100,
    128,
    145,
    "atlas-ventures",
    "atlas-growth",
    "strat-btc-mom-atlas",
    "BTC Momentum",
  ),
  pos(
    "pos-040",
    "ETHERFI:LST:WEETH@ETHEREUM",
    "ETHERFI-ETHEREUM",
    "long",
    15,
    3150,
    3420,
    "atlas-ventures",
    "atlas-defi",
    "RECURSIVE_STAKED_BASIS",
    "Recursive Staked Basis (Hedged)",
  ),
  pos(
    "pos-041",
    "HYPERLIQUID:PERPETUAL:ETH-USDC@LIN@HYPERLIQUID",
    "HYPERLIQUID",
    "short",
    15,
    3260,
    3420,
    "atlas-ventures",
    "atlas-defi",
    "RECURSIVE_STAKED_BASIS",
    "Recursive Staked Basis (Hedged)",
  ),
  pos(
    "pos-042",
    "AAVEV3-ETHEREUM:A_TOKEN:AWEETH@ETHEREUM",
    "AAVEV3-ETHEREUM",
    "long",
    30,
    3350,
    3420,
    "atlas-ventures",
    "atlas-defi",
    "RECURSIVE_STAKED_BASIS",
    "Recursive Staked Basis (Hedged)",
  ),

  // Odum Internal — TradFi Desk (CME Basis + Equity Stat Arb)
  pos("pos-043", "ESM6", "CME", "long", 10, 5420, 5485, "odum", "tradfi-desk", "strat-cme-basis", "CME Basis Trade"),
  pos("pos-044", "NQM6", "CME", "short", 5, 19800, 19650, "odum", "tradfi-desk", "strat-cme-basis", "CME Basis Trade"),
  pos("pos-045", "CLN6", "CME", "long", 20, 72.4, 74.8, "odum", "tradfi-desk", "strat-cme-basis", "CME Basis Trade"),
  pos(
    "pos-046",
    "AAPL",
    "NASDAQ",
    "long",
    200,
    178.5,
    184.2,
    "odum",
    "tradfi-desk",
    "strat-equity-stat-arb",
    "Equity Stat Arb",
  ),
  pos(
    "pos-047",
    "MSFT",
    "NASDAQ",
    "short",
    150,
    422,
    418,
    "odum",
    "tradfi-desk",
    "strat-equity-stat-arb",
    "Equity Stat Arb",
  ),
  pos(
    "pos-048",
    "JPM",
    "NYSE",
    "long",
    300,
    198,
    205,
    "odum",
    "tradfi-desk",
    "strat-equity-stat-arb",
    "Equity Stat Arb",
  ),

  // Apex Capital — Sports Live Arb
  pos(
    "pos-049",
    "CHELSEA-ARSENAL",
    "MULTI_VENUE",
    "long",
    5000,
    1.85,
    1.92,
    "alpha-capital",
    "alpha-sports",
    "strat-sports-arb-apex",
    "Sports Live Arb",
  ),
  pos(
    "pos-050",
    "BARCELONA-REAL_MADRID",
    "MULTI_VENUE",
    "long",
    3000,
    2.1,
    2.25,
    "alpha-capital",
    "alpha-sports",
    "strat-sports-arb-apex",
    "Sports Live Arb",
  ),
  pos(
    "pos-051",
    "MAN_CITY-LIVERPOOL",
    "MULTI_VENUE",
    "short",
    4000,
    1.72,
    1.68,
    "alpha-capital",
    "alpha-sports",
    "strat-sports-arb-apex",
    "Sports Live Arb",
  ),

  // Meridian Fund — Commodity Trend
  pos(
    "pos-052",
    "GCQ6",
    "CME",
    "long",
    15,
    2340,
    2418,
    "meridian-fund",
    "meridian-macro",
    "strat-commodity-trend",
    "Commodity Trend",
  ),
  pos(
    "pos-053",
    "SIU6",
    "CME",
    "long",
    10,
    28.5,
    29.8,
    "meridian-fund",
    "meridian-macro",
    "strat-commodity-trend",
    "Commodity Trend",
  ),
  pos(
    "pos-054",
    "ZWN6",
    "CME",
    "short",
    8,
    580,
    565,
    "meridian-fund",
    "meridian-macro",
    "strat-commodity-trend",
    "Commodity Trend",
  ),

  // Elysium DeFi demo client retired 2026-04-21 (Wave 7 — venue dropped from UAC).
];

// ── Orders ───────────────────────────────────────────────────────────────────

function ord(
  id: string,
  inst: string,
  venue: string,
  side: "buy" | "sell",
  qty: number,
  price: number,
  filled: number,
  status: "open" | "filled" | "partially_filled" | "cancelled",
  type: "limit" | "market" | "stop",
  daysAgo: number,
  orgId: string,
  clientId: string,
  stratId: string,
): SeedOrder {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(Math.floor(Math.random() * 14) + 8);
  return {
    id,
    instrument: inst,
    venue,
    side,
    quantity: qty,
    price,
    filledQty: filled,
    status,
    type,
    timestamp: d.toISOString(),
    orgId,
    clientId,
    strategyId: stratId,
  };
}

export const SEED_ORDERS: SeedOrder[] = [
  // Odum Internal
  ord(
    "ord-001",
    "BTC-USDT",
    "BINANCE-SPOT",
    "buy",
    0.5,
    67500,
    0,
    "open",
    "limit",
    0,
    "odum",
    "delta-one",
    "strat-btc-mom-alpha",
  ),
  ord(
    "ord-002",
    "ETH-USDT",
    "BINANCE-SPOT",
    "buy",
    5,
    3380,
    5,
    "filled",
    "market",
    1,
    "odum",
    "delta-one",
    "strat-btc-mom-alpha",
  ),
  ord(
    "ord-003",
    "ETH-PERP",
    "HYPERLIQUID",
    "sell",
    5,
    3400,
    5,
    "filled",
    "limit",
    1,
    "odum",
    "delta-one",
    "BASIS_TRADE",
  ),
  ord(
    "ord-004",
    "SOL-USDT",
    "BINANCE-SPOT",
    "buy",
    50,
    140,
    30,
    "partially_filled",
    "limit",
    0,
    "odum",
    "quant-fund",
    "strat-ml-dir-beta",
  ),
  ord(
    "ord-005",
    "BTC-USDT",
    "BINANCE-SPOT",
    "sell",
    0.3,
    68000,
    0,
    "open",
    "limit",
    0,
    "odum",
    "quant-fund",
    "strat-xexch-arb-beta",
  ),
  ord(
    "ord-006",
    "ETHERFI:LST:WEETH@ETHEREUM",
    "ETHERFI-ETHEREUM",
    "buy",
    5,
    3410,
    5,
    "filled",
    "market",
    2,
    "odum",
    "defi-desk",
    "STAKED_BASIS",
  ),
  ord(
    "ord-007",
    "UNISWAPV3-ETHEREUM:SPOT_ASSET:UNI@ETHEREUM",
    "UNISWAPV3-ETHEREUM",
    "buy",
    10,
    100,
    0,
    "cancelled",
    "limit",
    3,
    "odum",
    "defi-desk",
    "AAVE_LENDING",
  ),
  // Apex Capital
  ord(
    "ord-008",
    "BTC-USDT",
    "BINANCE-SPOT",
    "buy",
    2,
    66800,
    2,
    "filled",
    "market",
    2,
    "alpha-capital",
    "alpha-main",
    "strat-btc-mom-apex",
  ),
  ord(
    "ord-009",
    "BTC-26JUN26-70000-C",
    "DERIBIT",
    "buy",
    1,
    2900,
    0,
    "open",
    "limit",
    0,
    "alpha-capital",
    "alpha-main",
    "strat-opts-vol-apex",
  ),
  ord(
    "ord-010",
    "BTC-USDT",
    "BINANCE-SPOT",
    "buy",
    0.5,
    67300,
    0.5,
    "filled",
    "limit",
    1,
    "alpha-capital",
    "alpha-crypto",
    "strat-xexch-apex",
  ),
  ord(
    "ord-011",
    "BTC-USDT",
    "HYPERLIQUID",
    "sell",
    0.5,
    67380,
    0.5,
    "filled",
    "limit",
    1,
    "alpha-capital",
    "alpha-crypto",
    "strat-xexch-apex",
  ),
  // Zenith Partners
  ord(
    "ord-012",
    "BTC-26JUN26-70000-C",
    "DERIBIT",
    "buy",
    2,
    2700,
    2,
    "filled",
    "limit",
    3,
    "vertex-partners",
    "vertex-core",
    "strat-opts-zen",
  ),
  ord(
    "ord-013",
    "ETH-26JUN26-3000-P",
    "DERIBIT",
    "sell",
    5,
    200,
    0,
    "open",
    "limit",
    0,
    "vertex-partners",
    "vertex-core",
    "strat-opts-zen",
  ),
  // Meridian Fund
  ord(
    "ord-014",
    "BTC-USDT",
    "BINANCE-SPOT",
    "buy",
    1,
    66200,
    1,
    "filled",
    "market",
    4,
    "meridian-fund",
    "meridian-systematic",
    "strat-ml-dir-mer",
  ),
  ord(
    "ord-015",
    "ETH-USDT",
    "BINANCE-SPOT",
    "sell",
    8,
    3450,
    0,
    "open",
    "limit",
    0,
    "meridian-fund",
    "meridian-systematic",
    "strat-ml-dir-mer",
  ),
  ord(
    "ord-016",
    "LINK-USDT",
    "BINANCE-SPOT",
    "buy",
    200,
    14.5,
    200,
    "filled",
    "limit",
    5,
    "meridian-fund",
    "meridian-discretionary",
    "strat-disc-mer",
  ),
  // Atlas Ventures
  ord(
    "ord-017",
    "BTC-USDT",
    "BINANCE-SPOT",
    "buy",
    0.5,
    66000,
    0.5,
    "filled",
    "market",
    3,
    "atlas-ventures",
    "atlas-growth",
    "strat-btc-mom-atlas",
  ),
  ord(
    "ord-018",
    "ETHERFI:LST:WEETH@ETHEREUM",
    "ETHERFI-ETHEREUM",
    "buy",
    5,
    3380,
    5,
    "filled",
    "market",
    2,
    "atlas-ventures",
    "atlas-defi",
    "RECURSIVE_STAKED_BASIS",
  ),
  ord(
    "ord-019",
    "UNISWAPV3-ETHEREUM:SPOT_ASSET:UNI@ETHEREUM",
    "UNISWAPV3-ETHEREUM",
    "buy",
    100,
    7.5,
    0,
    "open",
    "limit",
    0,
    "atlas-ventures",
    "atlas-defi",
    "RECURSIVE_STAKED_BASIS",
  ),
  // TradFi — CME Basis
  ord("ord-020", "ESM6", "CME", "buy", 5, 5440, 5, "filled", "market", 2, "odum", "tradfi-desk", "strat-cme-basis"),
  ord("ord-021", "NQM6", "CME", "sell", 3, 19750, 0, "open", "limit", 0, "odum", "tradfi-desk", "strat-cme-basis"),
  // TradFi — Equity Stat Arb
  ord(
    "ord-022",
    "AAPL",
    "NASDAQ",
    "buy",
    100,
    180,
    100,
    "filled",
    "limit",
    3,
    "odum",
    "tradfi-desk",
    "strat-equity-stat-arb",
  ),
  ord(
    "ord-023",
    "MSFT",
    "NASDAQ",
    "sell",
    50,
    420,
    0,
    "open",
    "limit",
    0,
    "odum",
    "tradfi-desk",
    "strat-equity-stat-arb",
  ),
  // Sports — Live Arb
  ord(
    "ord-024",
    "CHELSEA-ARSENAL",
    "MULTI_VENUE",
    "buy",
    2000,
    1.88,
    2000,
    "filled",
    "market",
    1,
    "alpha-capital",
    "alpha-sports",
    "strat-sports-arb-apex",
  ),
  ord(
    "ord-025",
    "MAN_CITY-LIVERPOOL",
    "MULTI_VENUE",
    "sell",
    1500,
    1.7,
    0,
    "open",
    "limit",
    0,
    "alpha-capital",
    "alpha-sports",
    "strat-sports-arb-apex",
  ),
  // Commodity Trend
  ord(
    "ord-026",
    "GCQ6",
    "CME",
    "buy",
    5,
    2360,
    5,
    "filled",
    "market",
    4,
    "meridian-fund",
    "meridian-macro",
    "strat-commodity-trend",
  ),
  ord(
    "ord-027",
    "ZWN6",
    "CME",
    "sell",
    3,
    575,
    0,
    "open",
    "limit",
    0,
    "meridian-fund",
    "meridian-macro",
    "strat-commodity-trend",
  ),

  // Elysium DeFi demo client retired 2026-04-21 (Wave 7 — venue dropped from UAC).
];

// ── Trades ───────────────────────────────────────────────────────────────────

function hashSeedString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function roundSeedQty(n: number): number {
  return Math.round(n * 10000) / 10000;
}

/** Split `total` into `parts` positive weights that sum to `total` (for 2–5 fills per position). */
function splitSeedQuantity(total: number, parts: number, seed: number): number[] {
  if (parts <= 1) return [roundSeedQty(total)];
  const weights: number[] = [];
  let wsum = 0;
  for (let i = 0; i < parts; i++) {
    const w = 0.5 + ((seed + i * 7919) % 1000) / 1000;
    weights.push(w);
    wsum += w;
  }
  const out: number[] = [];
  let acc = 0;
  for (let i = 0; i < parts - 1; i++) {
    const q = roundSeedQty((total * weights[i]!) / wsum);
    out.push(q);
    acc += q;
  }
  out.push(roundSeedQty(total - acc));
  return out;
}

function tradeTypeForVenue(venue: string): "Exchange" | "OTC" | "DeFi" | "Manual" {
  if (
    venue.startsWith("UNISWAPV3-") ||
    venue.startsWith("UNISWAPV4-") ||
    venue.startsWith("AAVEV3-") ||
    venue.startsWith("ETHERFI-") ||
    venue.startsWith("MORPHO-") ||
    venue.startsWith("CURVE-") ||
    venue.startsWith("BALANCER")
  ) {
    return "DeFi";
  }
  if (venue === "OTC Desk") return "OTC";
  if (
    venue.startsWith("CME") ||
    venue.startsWith("ICE") ||
    venue.startsWith("NYSE") ||
    venue.startsWith("NASDAQ") ||
    venue.startsWith("CBOE")
  )
    return "Exchange";
  if (venue === "MULTI_VENUE") return "Exchange"; // Sports
  return "Exchange";
}

function counterpartyLabelForVenue(venue: string): string {
  if (venue.startsWith("UNISWAPV4-")) return "Uniswap V4";
  if (venue.startsWith("UNISWAPV3-")) return "Uniswap V3";
  if (venue.startsWith("AAVEV3-")) return "Aave V3";
  if (venue.startsWith("ETHERFI-")) return "EtherFi";
  if (venue.startsWith("MORPHO-")) return "Morpho";
  if (venue.startsWith("CURVE-")) return "Curve";
  return venue;
}

/** One synthetic fill set per position: quantities sum to position size; sides match long/short. */
function buildSeedTradesForPositions(positions: SeedPosition[]): SeedTrade[] {
  const trades: SeedTrade[] = [];
  for (const pos of positions) {
    const h = hashSeedString(pos.id);
    const n = 2 + (h % 4);
    const quantities = splitSeedQuantity(pos.quantity, n, h);
    const type = tradeTypeForVenue(pos.venue);
    const counterparty = counterpartyLabelForVenue(pos.venue);
    for (let i = 0; i < n; i++) {
      const daysAgo = 1 + ((h + i * 3) % 20);
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      d.setHours(8 + (h % 12), 0, 0, 0);
      const sd = new Date(d);
      sd.setDate(sd.getDate() + 2);
      const priceJitter = 1 + (((h + i * 13) % 200) - 100) / 100000;
      const price = Math.round(pos.entryPrice * priceJitter * 100) / 100;
      const qty = quantities[i]!;
      const side: "buy" | "sell" = pos.side === "long" ? "buy" : "sell";
      const fees = Math.round(qty * price * 0.001 * 100) / 100;
      const total = Math.round((qty * price + (side === "buy" ? fees : -fees)) * 100) / 100;
      trades.push({
        id: `trd-${pos.id}-${i + 1}`,
        positionId: pos.id,
        instrument: pos.instrument,
        venue: pos.venue,
        side,
        quantity: qty,
        price,
        fees,
        total,
        tradeType: type,
        status: daysAgo > 2 ? "settled" : "pending",
        counterparty,
        timestamp: d.toISOString(),
        settlementDate: sd.toISOString(),
        orgId: pos.orgId,
        clientId: pos.clientId,
        strategyId: pos.strategyId,
      });
    }
  }
  return trades;
}

export const SEED_TRADES: SeedTrade[] = buildSeedTradesForPositions(SEED_POSITIONS);

// ── Alerts ───────────────────────────────────────────────────────────────────

function alrt(
  id: string,
  msg: string,
  sev: "critical" | "high" | "medium" | "low",
  src: string,
  hoursAgo: number,
  orgId: string,
  stratId: string,
  ack: boolean,
  type: AlertType = "GENERIC",
): SeedAlert {
  const d = new Date();
  d.setHours(d.getHours() - hoursAgo);
  return {
    id,
    message: msg,
    severity: sev,
    source: src,
    timestamp: d.toISOString(),
    orgId,
    strategyId: stratId,
    acknowledged: ack,
    alertType: type,
  };
}

export const SEED_ALERTS: SeedAlert[] = [
  alrt(
    "alert-001",
    "BTC Momentum position size exceeds 5% of NAV",
    "high",
    "risk-monitoring",
    2,
    "odum",
    "strat-btc-mom-alpha",
    false,
    "EXPOSURE_BREACH",
  ),
  alrt(
    "alert-002",
    "Hyperliquid venue latency spike (>500ms)",
    "medium",
    "venue-monitor",
    4,
    "odum",
    "BASIS_TRADE",
    true,
    "GENERIC",
  ),
  alrt(
    "alert-003",
    "AAVE Lending: Aave health factor below 1.5",
    "critical",
    "defi-monitor",
    1,
    "odum",
    "AAVE_LENDING",
    false,
    "HEALTH_FACTOR_CRITICAL",
  ),
  alrt(
    "alert-004",
    "ML Directional: signal confidence below 60%",
    "low",
    "strategy-health",
    6,
    "odum",
    "strat-ml-dir-beta",
    true,
    "FEATURE_STALE",
  ),
  alrt(
    "alert-005",
    "Sports Arb: missed fill on Bet365 leg",
    "medium",
    "execution-monitor",
    3,
    "odum",
    "strat-sports-arb",
    false,
    "GENERIC",
  ),
  alrt(
    "alert-006",
    "BTC Momentum: drawdown approaching -5% threshold",
    "high",
    "risk-monitoring",
    1,
    "alpha-capital",
    "strat-btc-mom-apex",
    false,
    "DRAWDOWN_LIMIT",
  ),
  alrt(
    "alert-007",
    "Cross-Exchange Arb: spread narrowed below minimum",
    "medium",
    "strategy-health",
    5,
    "alpha-capital",
    "strat-xexch-apex",
    true,
    "GENERIC",
  ),
  alrt(
    "alert-008",
    "Options Vol: margin utilisation at 78%",
    "high",
    "risk-monitoring",
    2,
    "alpha-capital",
    "strat-opts-vol-apex",
    false,
    "MARGIN_WARNING",
  ),
  alrt(
    "alert-009",
    "Options Vol: BTC implied vol spike +8% in 1h",
    "medium",
    "market-monitor",
    3,
    "vertex-partners",
    "strat-opts-zen",
    false,
    "RISK_WARNING",
  ),
  alrt(
    "alert-010",
    "Spread Trading paused — manual review required",
    "high",
    "strategy-health",
    12,
    "vertex-partners",
    "strat-spreads-zen",
    true,
    "GENERIC",
  ),
  alrt(
    "alert-011",
    "ML Directional: model retrain completed",
    "low",
    "ml-pipeline",
    8,
    "meridian-fund",
    "strat-ml-dir-mer",
    true,
    "GENERIC",
  ),
  alrt(
    "alert-012",
    "ETH Basis: funding rate inversion detected",
    "medium",
    "market-monitor",
    4,
    "meridian-fund",
    "strat-eth-basis-mer",
    false,
    "FUNDING_RATE_FLIP",
  ),
  alrt(
    "alert-013",
    "Recursive Staked Basis: gas price spike on Ethereum (>50 gwei)",
    "medium",
    "defi-monitor",
    2,
    "atlas-ventures",
    "RECURSIVE_STAKED_BASIS",
    false,
    "GENERIC",
  ),
  alrt(
    "alert-014",
    "BTC Momentum: daily P&L target reached (+$12K)",
    "low",
    "strategy-health",
    6,
    "atlas-ventures",
    "strat-btc-mom-atlas",
    true,
    "GENERIC",
  ),
  // DeFi-specific alerts (strategy IDs = DeFi factory keys where noted; empty = book-level)
  alrt(
    "alert-defi-001",
    "Health Factor Critical — RECURSIVE_STAKED_BASIS: HF dropped to 1.18 — liquidation risk",
    "critical",
    "defi-monitor",
    1,
    "odum",
    "RECURSIVE_STAKED_BASIS",
    false,
    "HEALTH_FACTOR_CRITICAL",
  ),
  alrt(
    "alert-defi-002",
    "Funding Rate Negative — ETH-USDC funding rate went negative on Hyperliquid: -0.02% (threshold: 0%)",
    "medium",
    "defi-monitor",
    3,
    "odum",
    "BASIS_TRADE",
    false,
    "FUNDING_RATE_FLIP",
  ),
  alrt(
    "alert-defi-003",
    "Treasury Low — Treasury allocation at 8% — below 15% minimum threshold",
    "high",
    "treasury-monitor",
    5,
    "odum",
    "",
    false,
    "EXPOSURE_BREACH",
  ),
  alrt(
    "alert-defi-004",
    "IL Exceeds Fees — UNISWAPV3-ETHEREUM ETH/USDC pool: impermanent loss ($420) exceeds accumulated fees ($180)",
    "medium",
    "defi-monitor",
    6,
    "odum",
    "AMM_LP",
    false,
    "RATE_DEVIATION",
  ),
  alrt(
    "alert-defi-005",
    "LST Depeg Warning — weETH/ETH exchange rate deviation 1.2% (threshold: 0.5%) — EtherFi oracle delay possible",
    "high",
    "defi-monitor",
    8,
    "odum",
    "STAKED_BASIS",
    false,
    "WEETH_DEPEG",
  ),
  // TradFi alerts
  alrt(
    "alert-tradfi-001",
    "CME Basis: ESM6 basis widened to 15bps — exceeds 10bps threshold",
    "high",
    "market-monitor",
    2,
    "odum",
    "strat-cme-basis",
    false,
    "RISK_WARNING",
  ),
  alrt(
    "alert-tradfi-002",
    "Equity Stat Arb: AAPL/MSFT pair z-score at 2.8σ — rebalance signal triggered",
    "medium",
    "strategy-health",
    4,
    "odum",
    "strat-equity-stat-arb",
    false,
    "RISK_WARNING",
  ),
  alrt(
    "alert-tradfi-003",
    "Commodity Trend: Gold (GCQ6) broke above 200-day MA — new long signal confirmed",
    "low",
    "strategy-health",
    6,
    "meridian-fund",
    "strat-commodity-trend",
    true,
    "GENERIC",
  ),
  // Sports alerts
  alrt(
    "alert-sports-001",
    "Sports Arb: Chelsea-Arsenal spread collapsed — book imbalance detected on Bet365 leg",
    "high",
    "execution-monitor",
    1,
    "alpha-capital",
    "strat-sports-arb-apex",
    false,
    "GENERIC",
  ),
  alrt(
    "alert-sports-002",
    "Sports Arb: Pinnacle line moved 3.2% on Barcelona-Real Madrid — recalculating arb window",
    "medium",
    "market-monitor",
    3,
    "alpha-capital",
    "strat-sports-arb-apex",
    false,
    "GENERIC",
  ),

  // ── Trade execution alerts ────────────────────────────────────────────────
  alrt(
    "alert-exec-001",
    "BTC Momentum: order rejected by Binance — insufficient margin (shortfall $4,200)",
    "critical",
    "execution-monitor",
    0,
    "odum",
    "strat-btc-mom-alpha",
    false,
    "PRE_TRADE_REJECTION",
  ),
  alrt(
    "alert-exec-002",
    "Cross-Exchange Arb: execution slippage 32bps on ETH-USDT leg (limit: 15bps) — P&L drag $1,840",
    "high",
    "execution-monitor",
    1,
    "alpha-capital",
    "strat-xexch-apex",
    false,
    "GENERIC",
  ),
  alrt(
    "alert-exec-003",
    "ETH Basis: partial fill on OKX — 680 / 1,000 contracts executed; residual 320 working",
    "high",
    "execution-monitor",
    2,
    "meridian-fund",
    "strat-eth-basis-mer",
    false,
    "GENERIC",
  ),
  alrt(
    "alert-exec-004",
    "ML Directional: fill confirmation delayed >5s on Bybit — latency P99 = 7.2s",
    "medium",
    "execution-monitor",
    1,
    "meridian-fund",
    "strat-ml-dir-mer",
    false,
    "GENERIC",
  ),
  alrt(
    "alert-exec-005",
    "Flash Loan Arb: smart contract gas estimate failed — transaction reverted on Arbitrum",
    "high",
    "execution-monitor",
    3,
    "odum",
    "strat-flash-arb",
    false,
    "TX_SIMULATION_FAILED",
  ),

  // ── Order management alerts ───────────────────────────────────────────────
  alrt(
    "alert-order-001",
    "BTC Momentum (Apex): limit order stuck pending >15min on Binance — manual cancellation required",
    "critical",
    "order-management",
    0,
    "alpha-capital",
    "strat-btc-mom-apex",
    false,
    "GENERIC",
  ),
  alrt(
    "alert-order-002",
    "Options Vol: IOC order missed — best bid moved 0.8% before fill; $6,300 opportunity cost",
    "high",
    "order-management",
    2,
    "alpha-capital",
    "strat-opts-vol-apex",
    false,
    "GENERIC",
  ),
  alrt(
    "alert-order-003",
    "Sports Arb: Pinnacle order timed out — no fill within 500ms window; arb window closed",
    "medium",
    "order-management",
    4,
    "alpha-capital",
    "strat-sports-arb-apex",
    false,
    "GENERIC",
  ),
  alrt(
    "alert-order-004",
    "CME Basis: 3 GTC orders pending settlement >48h — broker confirm required",
    "low",
    "order-management",
    18,
    "odum",
    "strat-cme-basis",
    true,
    "GENERIC",
  ),

  // ── Strategy risk alerts ──────────────────────────────────────────────────
  alrt(
    "alert-risk-001",
    "Equity Stat Arb: AAPL/MSFT pair correlation dropped to 0.52 (threshold: 0.70) — model invalidated",
    "critical",
    "risk-monitoring",
    1,
    "odum",
    "strat-equity-stat-arb",
    false,
    "RISK_CRITICAL",
  ),
  alrt(
    "alert-risk-002",
    "Options Vol (Zenith): 1-day VaR breach — current $420K exceeds $300K limit",
    "high",
    "risk-monitoring",
    3,
    "vertex-partners",
    "strat-opts-zen",
    false,
    "RISK_CRITICAL",
  ),
  alrt(
    "alert-risk-003",
    "Spread Trading: net delta exposure +$1.24M exceeds ±$800K directional limit",
    "high",
    "risk-monitoring",
    2,
    "vertex-partners",
    "strat-spreads-zen",
    false,
    "EXPOSURE_BREACH",
  ),
  alrt(
    "alert-risk-004",
    "Discretionary Macro: beta-adjusted gross exposure at 112% of NAV (limit: 100%)",
    "medium",
    "risk-monitoring",
    5,
    "meridian-fund",
    "strat-disc-mer",
    false,
    "EXPOSURE_BREACH",
  ),
  alrt(
    "alert-risk-005",
    "Commodity Trend: Gold (GCQ6) position concentration at 38% of book (limit: 25%)",
    "medium",
    "risk-monitoring",
    7,
    "meridian-fund",
    "strat-commodity-trend",
    false,
    "CONCENTRATION_LIMIT",
  ),

  // ── Circuit breaker / kill switch / compliance alerts ─────────────────────
  alrt(
    "alert-cb-001",
    "CIRCUIT_BREAKER_OPEN — BTC Momentum (Alpha): daily loss limit triggered at -$85,200 (limit: -$80K)",
    "critical",
    "CIRCUIT_BREAKER_risk-engine",
    1,
    "odum",
    "strat-btc-mom-alpha",
    false,
    "DRAWDOWN_LIMIT",
  ),
  alrt(
    "alert-cb-002",
    "AUTO_DELEVERAGE triggered — Recursive Staked Basis: health factor 1.18 < 1.20 floor",
    "critical",
    "AUTO_DELEVERAGE_defi-monitor",
    0,
    "atlas-ventures",
    "RECURSIVE_STAKED_BASIS",
    false,
    "LIQUIDATION_RISK",
  ),
  alrt(
    "alert-cb-003",
    "Equity Stat Arb: compliance flag — AAPL position exceeds 5% single-security AUM limit",
    "high",
    "compliance-engine",
    6,
    "odum",
    "strat-equity-stat-arb",
    false,
    "CONCENTRATION_LIMIT",
  ),
  alrt(
    "alert-cb-004",
    "ML Directional (Alpha): drawdown -4.8% approaching kill-switch threshold of -5.0%",
    "high",
    "risk-monitoring",
    2,
    "meridian-fund",
    "strat-ml-dir-mer",
    false,
    "DRAWDOWN_LIMIT",
  ),

  // ── Venue / market structure alerts ──────────────────────────────────────
  alrt(
    "alert-venue-001",
    "Binance WebSocket disconnected — tick data gap 45s; 6 strategies on stale quotes",
    "critical",
    "venue-monitor",
    0,
    "alpha-capital",
    "strat-btc-mom-apex",
    false,
    "GENERIC",
  ),
  alrt(
    "alert-venue-002",
    "Bybit API rate limit reached (1,200/1,200 req/min) — order submission suspended",
    "high",
    "venue-monitor",
    1,
    "alpha-capital",
    "strat-opts-vol-apex",
    false,
    "GENERIC",
  ),
  alrt(
    "alert-venue-003",
    "OKX WebSocket reconnecting — order book gap >30s; ETH Basis positions unmonitored",
    "medium",
    "venue-monitor",
    2,
    "meridian-fund",
    "strat-eth-basis-mer",
    false,
    "GENERIC",
  ),
  alrt(
    "alert-venue-004",
    "CME ESM6 trading halt — scheduled maintenance window 02:00–03:00 UTC",
    "low",
    "venue-monitor",
    10,
    "odum",
    "strat-cme-basis",
    true,
    "GENERIC",
  ),

  // ── P&L reconciliation alerts ─────────────────────────────────────────────
  alrt(
    "alert-recon-001",
    "Options Vol (Alpha): daily P&L mismatch — internal $124K vs prime broker $118K (delta: $6K)",
    "high",
    "reconciliation",
    4,
    "alpha-capital",
    "strat-opts-vol-apex",
    false,
    "GENERIC",
  ),
  alrt(
    "alert-recon-002",
    "BTC Momentum (Atlas): position reconciliation failed — 0.45 BTC discrepancy vs exchange snapshot",
    "medium",
    "reconciliation",
    8,
    "atlas-ventures",
    "strat-btc-mom-atlas",
    false,
    "GENERIC",
  ),
];

// ── Daily P&L per strategy (last 30 days) ────────────────────────────────────

function generateDailyPnl(days: number, avgDaily: number, vol: number): SeedPnlDay[] {
  const result: SeedPnlDay[] = [];
  for (let i = days; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    result.push({
      date: d.toISOString().split("T")[0],
      pnl: Math.round((avgDaily + (Math.random() - 0.5) * 2 * vol) * 100) / 100,
    });
  }
  return result;
}

export const SEED_PNL_DAILY: Record<string, SeedPnlDay[]> = {
  "strat-btc-mom-alpha": generateDailyPnl(30, 2800, 4000),
  BASIS_TRADE: generateDailyPnl(30, 1200, 1500),
  STAKED_BASIS: generateDailyPnl(30, 950, 1400),
  "strat-ml-dir-beta": generateDailyPnl(30, 1800, 3000),
  "strat-xexch-arb-beta": generateDailyPnl(30, 800, 500),
  AAVE_LENDING: generateDailyPnl(30, 1500, 2000),
  "strat-flash-arb": generateDailyPnl(30, 400, 600),
  "strat-sports-arb": generateDailyPnl(30, 600, 800),
  "strat-btc-mom-apex": generateDailyPnl(30, 4500, 6000),
  "strat-opts-vol-apex": generateDailyPnl(30, 2200, 3500),
  "strat-xexch-apex": generateDailyPnl(30, 1000, 700),
  "strat-opts-zen": generateDailyPnl(30, 3000, 4500),
  "strat-spreads-zen": generateDailyPnl(30, -200, 1200),
  "strat-ml-dir-mer": generateDailyPnl(30, 2400, 3800),
  "strat-eth-basis-mer": generateDailyPnl(30, 900, 1100),
  "strat-disc-mer": generateDailyPnl(30, 500, 2500),
  "strat-btc-mom-atlas": generateDailyPnl(30, 1800, 2800),
  RECURSIVE_STAKED_BASIS: generateDailyPnl(30, 1200, 1800),
  "strat-defi-atlas": generateDailyPnl(30, 1200, 1800),
  // TradFi strategies
  "strat-cme-basis": generateDailyPnl(30, 3200, 2000),
  "strat-equity-stat-arb": generateDailyPnl(30, 1600, 2400),
  // Sports strategies
  "strat-sports-arb-apex": generateDailyPnl(30, 900, 1200),
  // Commodity
  "strat-commodity-trend": generateDailyPnl(30, 2100, 3200),
};
