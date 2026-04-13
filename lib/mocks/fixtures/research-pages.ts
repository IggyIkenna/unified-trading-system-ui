/** Research pages — quant OHLCV, signals, strategy candidates. */

export const MOCK_INSTRUMENTS = [
  {
    symbol: "BTC-USD",
    venue: "BINANCE-SPOT",
    date: "2026-03-28",
    open: "84521.30",
    high: "85102.40",
    low: "83980.10",
    close: "84890.50",
    volume: "24,312",
  },
  {
    symbol: "ETH-USD",
    venue: "BINANCE-SPOT",
    date: "2026-03-28",
    open: "2041.80",
    high: "2078.20",
    low: "2028.40",
    close: "2065.90",
    volume: "182,401",
  },
  {
    symbol: "SOL-USD",
    venue: "BINANCE-SPOT",
    date: "2026-03-28",
    open: "138.42",
    high: "141.10",
    low: "137.20",
    close: "140.30",
    volume: "98,214",
  },
  {
    symbol: "AVAX-USD",
    venue: "COINBASE-SPOT",
    date: "2026-03-28",
    open: "24.12",
    high: "24.80",
    low: "23.94",
    close: "24.65",
    volume: "312,105",
  },
  {
    symbol: "MATIC-USD",
    venue: "COINBASE-SPOT",
    date: "2026-03-28",
    open: "0.5812",
    high: "0.5940",
    low: "0.5780",
    close: "0.5901",
    volume: "1,204,510",
  },
  {
    symbol: "BTC-USD",
    venue: "BINANCE-SPOT",
    date: "2026-03-27",
    open: "83812.20",
    high: "84680.10",
    low: "83420.30",
    close: "84521.30",
    volume: "21,892",
  },
  {
    symbol: "ETH-USD",
    venue: "BINANCE-SPOT",
    date: "2026-03-27",
    open: "2018.40",
    high: "2052.80",
    low: "2010.20",
    close: "2041.80",
    volume: "168,320",
  },
  {
    symbol: "SOL-USD",
    venue: "BINANCE-SPOT",
    date: "2026-03-27",
    open: "135.80",
    high: "139.20",
    low: "135.10",
    close: "138.42",
    volume: "87,412",
  },
  {
    symbol: "AVAX-USD",
    venue: "COINBASE-SPOT",
    date: "2026-03-27",
    open: "23.84",
    high: "24.30",
    low: "23.62",
    close: "24.12",
    volume: "298,410",
  },
  {
    symbol: "MATIC-USD",
    venue: "COINBASE-SPOT",
    date: "2026-03-27",
    open: "0.5724",
    high: "0.5830",
    low: "0.5698",
    close: "0.5812",
    volume: "1,102,840",
  },
];

export type SignalStatus = "active" | "inactive" | "error";

export interface Signal {
  name: string;
  strategy: string;
  direction: "long" | "short" | "flat";
  strength: number;
  last_fired: string;
  fire_count_24h: number;
  status: SignalStatus;
}

export const MOCK_SIGNALS: Signal[] = [
  {
    name: "momentum_breakout",
    strategy: "trend-follow-v3",
    direction: "long",
    strength: 0.82,
    last_fired: "2026-03-29T12:00:00.000Z",
    fire_count_24h: 14,
    status: "active",
  },
  {
    name: "mean_reversion_entry",
    strategy: "mean-rev-btc",
    direction: "short",
    strength: 0.65,
    last_fired: "2026-03-29T11:55:00.000Z",
    fire_count_24h: 8,
    status: "active",
  },
  {
    name: "funding_rate_arb",
    strategy: "funding-arb-v2",
    direction: "long",
    strength: 0.91,
    last_fired: "2026-03-29T12:01:15.000Z",
    fire_count_24h: 22,
    status: "active",
  },
  {
    name: "volatility_expansion",
    strategy: "vol-surface-v1",
    direction: "flat",
    strength: 0.0,
    last_fired: "2026-03-29T11:00:00.000Z",
    fire_count_24h: 0,
    status: "inactive",
  },
  {
    name: "cross_venue_spread",
    strategy: "stat-arb-eth",
    direction: "long",
    strength: 0.74,
    last_fired: "2026-03-29T11:59:00.000Z",
    fire_count_24h: 11,
    status: "active",
  },
  {
    name: "liquidation_cascade",
    strategy: "liq-hunter-v1",
    direction: "short",
    strength: 0.55,
    last_fired: "2026-03-29T10:45:00.000Z",
    fire_count_24h: 3,
    status: "active",
  },
  {
    name: "onchain_flow_divergence",
    strategy: "defi-flow-v1",
    direction: "flat",
    strength: 0.0,
    last_fired: "—",
    fire_count_24h: 0,
    status: "error",
  },
];

export type CandidateStatus = "pending" | "approved" | "rejected";

export interface StrategyCandidate {
  id: string;
  name: string;
  sharpe: number;
  maxDrawdown: number;
  winRate: number;
  totalReturn: number;
  status: CandidateStatus;
  submittedAt: string;
  submittedBy: string;
}

export const MOCK_CANDIDATES: StrategyCandidate[] = [
  {
    id: "sc-001",
    name: "ETH Basis Trade v3.2",
    sharpe: 1.82,
    maxDrawdown: -8.2,
    winRate: 58.4,
    totalReturn: 42.3,
    status: "pending",
    submittedAt: "2026-03-27",
    submittedBy: "Alice Chen",
  },
  {
    id: "sc-002",
    name: "BTC Momentum Breakout v2.1",
    sharpe: 1.54,
    maxDrawdown: -12.1,
    winRate: 52.8,
    totalReturn: 34.7,
    status: "pending",
    submittedAt: "2026-03-26",
    submittedBy: "Bob Kim",
  },
  {
    id: "sc-003",
    name: "Cross-Venue Stat Arb v1.4",
    sharpe: 2.31,
    maxDrawdown: -5.4,
    winRate: 64.2,
    totalReturn: 28.9,
    status: "approved",
    submittedAt: "2026-03-25",
    submittedBy: "Carol Wu",
  },
  {
    id: "sc-004",
    name: "Funding Rate Arb v2.0",
    sharpe: 1.96,
    maxDrawdown: -6.8,
    winRate: 61.0,
    totalReturn: 36.1,
    status: "pending",
    submittedAt: "2026-03-25",
    submittedBy: "David Lee",
  },
  {
    id: "sc-005",
    name: "Vol Surface Mean Rev v1.0",
    sharpe: 0.92,
    maxDrawdown: -18.5,
    winRate: 48.2,
    totalReturn: 12.4,
    status: "rejected",
    submittedAt: "2026-03-24",
    submittedBy: "Eve Park",
  },
  {
    id: "sc-006",
    name: "SOL Liquidation Hunter v1.2",
    sharpe: 1.67,
    maxDrawdown: -10.3,
    winRate: 55.6,
    totalReturn: 31.8,
    status: "approved",
    submittedAt: "2026-03-23",
    submittedBy: "Frank Zhou",
  },
];
