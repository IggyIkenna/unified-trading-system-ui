/**
 * Static mock seed data — committed to git, provides the demo baseline.
 * Each organisation has distinct positions, orders, trades, alerts, and strategies.
 *
 * Reset interactive state (workspace layouts, filter selections) via resetDemo().
 * This file is NEVER cleared by reset — it's the permanent seed.
 */

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
    id: "strat-eth-basis-alpha",
    name: "ETH Basis Trade",
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
  // Odum Internal — DeFi Ops
  {
    id: "strat-defi-yield",
    name: "DeFi Yield Farm",
    archetype: "yield",
    status: "live",
    sharpe: 1.65,
    mtdReturn: 5.4,
    aum: 4800000,
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
    id: "strat-defi-atlas",
    name: "DeFi Yield Farm",
    archetype: "yield",
    status: "live",
    sharpe: 1.88,
    mtdReturn: 6.2,
    aum: 2900000,
    orgId: "atlas-ventures",
    clientId: "atlas-defi",
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
    "Binance",
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
    "Hyperliquid",
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
    "Binance",
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
    "Binance",
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
    "Binance",
    "long",
    25,
    3250,
    3420,
    "odum",
    "delta-one",
    "strat-eth-basis-alpha",
    "ETH Basis Trade",
  ),
  pos(
    "pos-006",
    "ETH-PERP",
    "Hyperliquid",
    "short",
    25,
    3260,
    3420,
    "odum",
    "delta-one",
    "strat-eth-basis-alpha",
    "ETH Basis Trade",
  ),
  // Odum Internal — Desk Beta (ML Directional + Cross-Exchange Arb)
  pos(
    "pos-007",
    "BTC-USDT",
    "Binance",
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
    "Binance",
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
    "Hyperliquid",
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
    "Binance",
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
    "Binance",
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
    "Hyperliquid",
    "short",
    0.5,
    67280,
    67430,
    "odum",
    "quant-fund",
    "strat-xexch-arb-beta",
    "Cross-Exchange Arb",
  ),
  // Odum Internal — DeFi Ops
  pos("pos-013", "WETH", "Uniswap", "long", 20, 3200, 3420, "odum", "defi-desk", "strat-defi-yield", "DeFi Yield Farm"),
  pos("pos-014", "USDC", "Aave", "long", 50000, 1.0, 1.0, "odum", "defi-desk", "strat-defi-yield", "DeFi Yield Farm"),
  pos("pos-015", "AAVE", "Uniswap", "long", 45, 92, 105, "odum", "defi-desk", "strat-defi-yield", "DeFi Yield Farm"),
  pos("pos-016", "UNI", "Uniswap", "long", 300, 7.2, 8.1, "odum", "defi-desk", "strat-defi-yield", "DeFi Yield Farm"),

  // Apex Capital — Global Macro
  pos(
    "pos-017",
    "BTC-USDT",
    "Binance",
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
    "Hyperliquid",
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
    "Binance",
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
    "BTC-CALL-70K",
    "Deribit",
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
    "BTC-PUT-60K",
    "Deribit",
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
    "ETH-CALL-4K",
    "Deribit",
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
    "Binance",
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
    "Hyperliquid",
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
    "Binance",
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
    "BTC-CALL-70K",
    "Deribit",
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
    "BTC-PUT-65K",
    "Deribit",
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
    "ETH-CALL-4K",
    "Deribit",
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
    "ETH-PUT-3K",
    "Deribit",
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
    "BTC-CALL-75K",
    "Deribit",
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
    "Binance",
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
    "Binance",
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
    "Binance",
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
    "Hyperliquid",
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
    "Hyperliquid",
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
    "Binance",
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
    "Binance",
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
    "Binance",
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
    "Binance",
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
    "WETH",
    "Uniswap",
    "long",
    15,
    3150,
    3420,
    "atlas-ventures",
    "atlas-defi",
    "strat-defi-atlas",
    "DeFi Yield Farm",
  ),
  pos(
    "pos-041",
    "UNI",
    "Uniswap",
    "long",
    400,
    6.8,
    8.1,
    "atlas-ventures",
    "atlas-defi",
    "strat-defi-atlas",
    "DeFi Yield Farm",
  ),
  pos(
    "pos-042",
    "AAVE",
    "Aave",
    "long",
    30,
    88,
    105,
    "atlas-ventures",
    "atlas-defi",
    "strat-defi-atlas",
    "DeFi Yield Farm",
  ),
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
    "Binance",
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
    "Binance",
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
    "Hyperliquid",
    "sell",
    5,
    3400,
    5,
    "filled",
    "limit",
    1,
    "odum",
    "delta-one",
    "strat-eth-basis-alpha",
  ),
  ord(
    "ord-004",
    "SOL-USDT",
    "Binance",
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
    "Binance",
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
  ord("ord-006", "WETH", "Uniswap", "buy", 5, 3410, 5, "filled", "market", 2, "odum", "defi-desk", "strat-defi-yield"),
  ord(
    "ord-007",
    "AAVE",
    "Uniswap",
    "buy",
    10,
    100,
    0,
    "cancelled",
    "limit",
    3,
    "odum",
    "defi-desk",
    "strat-defi-yield",
  ),
  // Apex Capital
  ord(
    "ord-008",
    "BTC-USDT",
    "Binance",
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
    "BTC-CALL-70K",
    "Deribit",
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
    "Binance",
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
    "Hyperliquid",
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
    "BTC-CALL-70K",
    "Deribit",
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
    "ETH-PUT-3K",
    "Deribit",
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
    "Binance",
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
    "Binance",
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
    "Binance",
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
    "Binance",
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
    "WETH",
    "Uniswap",
    "buy",
    5,
    3380,
    5,
    "filled",
    "market",
    2,
    "atlas-ventures",
    "atlas-defi",
    "strat-defi-atlas",
  ),
  ord(
    "ord-019",
    "UNI",
    "Uniswap",
    "buy",
    100,
    7.5,
    0,
    "open",
    "limit",
    0,
    "atlas-ventures",
    "atlas-defi",
    "strat-defi-atlas",
  ),
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
  if (venue === "Uniswap" || venue === "Aave") return "DeFi";
  if (venue === "OTC Desk") return "OTC";
  return "Exchange";
}

/** One synthetic fill set per position: quantities sum to position size; sides match long/short. */
function buildSeedTradesForPositions(positions: SeedPosition[]): SeedTrade[] {
  const trades: SeedTrade[] = [];
  for (const pos of positions) {
    const h = hashSeedString(pos.id);
    const n = 2 + (h % 4);
    const quantities = splitSeedQuantity(pos.quantity, n, h);
    const type = tradeTypeForVenue(pos.venue);
    const counterparty = pos.venue === "Uniswap" ? "Uniswap V3" : pos.venue === "Aave" ? "Aave V3" : pos.venue;
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
  ),
  alrt(
    "alert-002",
    "Hyperliquid venue latency spike (>500ms)",
    "medium",
    "venue-monitor",
    4,
    "odum",
    "strat-eth-basis-alpha",
    true,
  ),
  alrt(
    "alert-003",
    "DeFi Yield Farm: Aave health factor below 1.5",
    "critical",
    "defi-monitor",
    1,
    "odum",
    "strat-defi-yield",
    false,
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
  ),
  alrt(
    "alert-013",
    "DeFi Yield Farm: gas price spike on Ethereum (>50 gwei)",
    "medium",
    "defi-monitor",
    2,
    "atlas-ventures",
    "strat-defi-atlas",
    false,
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
  "strat-eth-basis-alpha": generateDailyPnl(30, 1200, 1500),
  "strat-ml-dir-beta": generateDailyPnl(30, 1800, 3000),
  "strat-xexch-arb-beta": generateDailyPnl(30, 800, 500),
  "strat-defi-yield": generateDailyPnl(30, 1500, 2000),
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
  "strat-defi-atlas": generateDailyPnl(30, 1200, 1800),
};
