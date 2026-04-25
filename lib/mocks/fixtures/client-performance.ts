/**
 * Mock fixture data for the Client Performance dashboard.
 * Mirrors the backend mock_performance_data.py structure.
 */

// ── Client list ─────────────────────────────────────────────────────────────

export interface ClientInfo {
  id: string;
  name: string;
  venue: string;
  currency: string;
  tranche: string;
  is_active: boolean;
  is_underwater: boolean;
  organisation_id?: string;
  organisation_name?: string;
  organisation_type?: string;
  strategy_id?: string;
  strategy_name?: string;
}

export interface OrganisationInfo {
  id: string;
  name: string;
  type: string;
}

export interface StrategyInfo {
  id: string;
  name: string;
  description?: string;
  /** Primary execution category — CEFI / DEFI / TRADFI / SPORTS / PREDICTION / CROSS_CATEGORY. */
  category?: string;
  family?: string;
  archetype?: string;
}

export interface ClientsResponse {
  clients: ClientInfo[];
  organisations: OrganisationInfo[];
  strategies: StrategyInfo[];
}

export const MOCK_ORGANISATIONS: OrganisationInfo[] = [
  { id: "odum", name: "Odum Capital", type: "internal" },
  { id: "prism", name: "Prism Capital", type: "client" },
  { id: "namnar", name: "Namnar", type: "client" },
  { id: "eqvilent", name: "Eqvilent", type: "client" },
  { id: "steadyhash", name: "Steady Hash", type: "client" },
  { id: "gpd", name: "GPD Capital", type: "client" },
  { id: "shaun_lim", name: "Shaun Lim", type: "client" },
  { id: "anu", name: "Anu", type: "client" },
  { id: "ik", name: "IK Group", type: "client" },
  { id: "yoav", name: "Yoav", type: "client" },
  { id: "guy_asraf", name: "Guy Asraf", type: "client" },
];

export const MOCK_STRATEGIES: StrategyInfo[] = [
  { id: "mean_reversion_top20", name: "Mean Reversion Top 20", description: "Perpetual futures mean reversion on top 20 crypto assets", category: "CEFI", family: "STAT_ARB_PAIRS", archetype: "STAT_ARB_CROSS_SECTIONAL" },
  { id: "defi_btc_yield", name: "DeFi BTC Yield", description: "BTC-denominated yield via DeFi protocols and fund-of-fund allocation", category: "DEFI", family: "CARRY_AND_YIELD", archetype: "YIELD_ROTATION_LENDING" },
];

export const MOCK_CLIENTS: ClientInfo[] = [
  { id: "PR", name: "Prism Capital", venue: "okx", currency: "USDT", tranche: "managed", is_active: true, is_underwater: false, organisation_id: "prism", organisation_name: "Prism Capital", organisation_type: "client", strategy_id: "mean_reversion_top20", strategy_name: "Mean Reversion Top 20" },
  { id: "ET", name: "Eqvilent", venue: "binance", currency: "USDT", tranche: "managed", is_active: true, is_underwater: false, organisation_id: "eqvilent", organisation_name: "Eqvilent", organisation_type: "client", strategy_id: "mean_reversion_top20", strategy_name: "Mean Reversion Top 20" },
  { id: "STD", name: "Steady Hash", venue: "okx", currency: "USDT", tranche: "managed", is_active: true, is_underwater: false, organisation_id: "steadyhash", organisation_name: "Steady Hash", organisation_type: "client", strategy_id: "mean_reversion_top20", strategy_name: "Mean Reversion Top 20" },
  { id: "NN", name: "Namnar", venue: "okx", currency: "USDT", tranche: "managed", is_active: true, is_underwater: false, organisation_id: "namnar", organisation_name: "Namnar", organisation_type: "client", strategy_id: "mean_reversion_top20", strategy_name: "Mean Reversion Top 20" },
  { id: "ODUM_PROP", name: "Odum Prop (Flagship)", venue: "binance", currency: "USDT", tranche: "managed", is_active: true, is_underwater: false, organisation_id: "odum", organisation_name: "Odum Capital", organisation_type: "internal", strategy_id: "mean_reversion_top20", strategy_name: "Mean Reversion Top 20" },
  { id: "GP", name: "GPD Capital", venue: "okx", currency: "USDT", tranche: "managed", is_active: true, is_underwater: true, organisation_id: "gpd", organisation_name: "GPD Capital", organisation_type: "client", strategy_id: "mean_reversion_top20", strategy_name: "Mean Reversion Top 20" },
  { id: "SL", name: "Shaun Lim (USDT)", venue: "okx", currency: "USDT", tranche: "managed", is_active: true, is_underwater: true, organisation_id: "shaun_lim", organisation_name: "Shaun Lim", organisation_type: "client", strategy_id: "mean_reversion_top20", strategy_name: "Mean Reversion Top 20" },
  { id: "SL2", name: "Shaun Lim (BTC)", venue: "okx", currency: "BTC", tranche: "managed", is_active: true, is_underwater: true, organisation_id: "shaun_lim", organisation_name: "Shaun Lim", organisation_type: "client", strategy_id: "mean_reversion_top20", strategy_name: "Mean Reversion Top 20" },
  { id: "ANU", name: "Anu", venue: "okx", currency: "BTC", tranche: "managed", is_active: true, is_underwater: true, organisation_id: "anu", organisation_name: "Anu", organisation_type: "client", strategy_id: "mean_reversion_top20", strategy_name: "Mean Reversion Top 20" },
  { id: "IK", name: "IK Pooled", venue: "okx", currency: "USDT", tranche: "managed", is_active: true, is_underwater: true, organisation_id: "ik", organisation_name: "IK Group", organisation_type: "client", strategy_id: "mean_reversion_top20", strategy_name: "Mean Reversion Top 20" },
  { id: "YOAV", name: "Yoav", venue: "n/a", currency: "BTC", tranche: "fund_of_fund", is_active: true, is_underwater: false, organisation_id: "yoav", organisation_name: "Yoav", organisation_type: "client", strategy_id: "defi_btc_yield", strategy_name: "DeFi BTC Yield" },
  { id: "GUY_ASRAF", name: "Guy Asraf", venue: "n/a", currency: "BTC", tranche: "fund_of_fund", is_active: true, is_underwater: false, organisation_id: "guy_asraf", organisation_name: "Guy Asraf", organisation_type: "client", strategy_id: "defi_btc_yield", strategy_name: "DeFi BTC Yield" },
];

// ── Equity curve ────────────────────────────────────────────────────────────

export interface EquityCurvePoint {
  timestamp: string;
  equity_usd: number;
  hwm_usd: number;
  drawdown_pct: number;
}

function generateEquityCurve(startEquity: number, months: number, monthlyReturnAvg: number): EquityCurvePoint[] {
  const points: EquityCurvePoint[] = [];
  let equity = startEquity;
  let hwm = startEquity;
  const base = new Date("2025-07-10T00:00:00Z");

  // Seeded pseudo-random for determinism
  let seed = 42;
  const random = () => {
    seed = (seed * 16807 + 0) % 2147483647;
    return seed / 2147483647;
  };
  const gaussRandom = () => {
    const u1 = random();
    const u2 = random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  };

  for (let day = 0; day < months * 30; day++) {
    const dailyReturn = monthlyReturnAvg / 30 + gaussRandom() * 0.005;
    equity *= 1 + dailyReturn;
    hwm = Math.max(hwm, equity);
    const dd = hwm > 0 ? (equity - hwm) / hwm : 0;

    const dt = new Date(base.getTime() + day * 86400000);
    points.push({
      timestamp: dt.toISOString(),
      equity_usd: Math.round(equity * 100) / 100,
      hwm_usd: Math.round(hwm * 100) / 100,
      drawdown_pct: Math.round(dd * 10000) / 10000,
    });
  }
  return points;
}

// ── Monthly returns ─────────────────────────────────────────────────────────

export interface MonthlyReturn {
  year: number;
  month: number;
  return_pct: number;
  pnl_usd: number;
  opening_equity: number;
  closing_equity: number;
}

function generateMonthlyReturns(months: number): MonthlyReturn[] {
  const records: MonthlyReturn[] = [];
  let equity = 300000;
  const baseMonth = 7;
  const baseYear = 2025;

  let seed = 42;
  const random = () => {
    seed = (seed * 16807 + 0) % 2147483647;
    return seed / 2147483647;
  };
  const gaussRandom = () => {
    const u1 = random();
    const u2 = random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  };

  for (let i = 0; i < months; i++) {
    const month = ((baseMonth - 1 + i) % 12) + 1;
    const year = baseYear + Math.floor((baseMonth - 1 + i) / 12);
    const ret = 0.02 + gaussRandom() * 0.03;
    const opening = equity;
    const closing = equity * (1 + ret);
    const pnl = closing - opening;
    equity = closing;

    records.push({
      year,
      month,
      return_pct: Math.round(ret * 10000) / 10000,
      pnl_usd: Math.round(pnl * 100) / 100,
      opening_equity: Math.round(opening * 100) / 100,
      closing_equity: Math.round(closing * 100) / 100,
    });
  }
  return records;
}

// ── Performance summary ─────────────────────────────────────────────────────

export interface PerformanceStats {
  total_return_pct: number;
  annualized_return_pct: number;
  sharpe_ratio: number;
  sortino_ratio: number;
  max_drawdown_pct: number;
  calmar_ratio: number;
  volatility_pct: number;
  win_rate: number;
  profit_factor: number;
  avg_win_pct: number;
  avg_loss_pct: number;
  best_month_pct: number;
  worst_month_pct: number;
  total_trades: number;
  winning_days: number;
  losing_days: number;
  tracking_days: number;
}

export interface PerformanceSummary {
  client_id: string;
  client_name?: string;
  venue?: string;
  currency?: string;
  period_label?: string;
  current_equity_usd: number;
  current_hwm_usd?: number;
  free_balance_usd?: number;
  locked_balance_usd?: number;
  unrealized_pnl_usd?: number;
  source?: string;
  timestamp?: string;
  asset_count?: number;
  position_count?: number;
  equity_source?: string;
  trade_count?: number;
   
  equity_curve: any[];
   
  monthly_returns: any[];
   
  stats: Record<string, any>;
}

const CLIENT_PARAMS: Record<string, [number, number]> = {
  PR: [300000, 0.021],
  ET: [2020000, 0.0085],
  STD: [512000, 0.0083],
  NN: [111000, 0.018],
  ODUM_PROP: [280000, 0.025],
  GP: [409000, -0.005],
};

export function getMockPerformanceSummary(clientId: string): PerformanceSummary {
  const [start, avgRet] = CLIENT_PARAMS[clientId] ?? [100000, 0.015];
  const equityCurve = generateEquityCurve(start, 9, avgRet);
  const monthlyReturns = generateMonthlyReturns(9);
  const currentEq = equityCurve.length > 0 ? equityCurve[equityCurve.length - 1].equity_usd : start;
  const client = MOCK_CLIENTS.find((c) => c.id === clientId);

  const hwm = equityCurve.length > 0 ? Math.max(...equityCurve.map((p) => p.equity_usd)) : start;

  return {
    client_id: clientId,
    client_name: client?.name ?? clientId,
    venue: client?.venue ?? "unknown",
    currency: "USD",
    period_label: "all",
    current_equity_usd: currentEq,
    current_hwm_usd: hwm,
    free_balance_usd: Math.round(currentEq * 0.35 * 100) / 100,
    locked_balance_usd: Math.round(currentEq * 0.15 * 100) / 100,
    unrealized_pnl_usd: Math.round((currentEq - start) * 0.4 * 100) / 100,
    equity_source: client?.venue === "binance" ? "binance_income" : "okx_bills",
    trade_count: 20200,
    equity_curve: equityCurve,
    monthly_returns: monthlyReturns,
    stats: {
      total_return_pct: 0.2101,
      annualized_return_pct: 0.2845,
      sharpe_ratio: 1.87,
      sortino_ratio: 2.41,
      max_drawdown_pct: -0.0834,
      calmar_ratio: 3.41,
      volatility_pct: 0.152,
      win_rate: 0.7259,
      profit_factor: 1.56,
      avg_win_pct: 0.0031,
      avg_loss_pct: -0.0055,
      best_month_pct: 0.0693,
      worst_month_pct: -0.0234,
      total_trades: 20200,
      winning_days: 196,
      losing_days: 72,
      tracking_days: 270,
    },
  };
}

// ── Positions ───────────────────────────────────────────────────────────────

export interface PositionRecord {
  symbol: string;
  side: string;
  quantity: number;
  entry_price: number;
  mark_price: number;
  unrealized_pnl: number;
  leverage: number;
  liquidation_price: number;
  notional_usd: number;
  margin_used: number;
}

export const MOCK_POSITIONS: PositionRecord[] = [
  { symbol: "BTC/USDT:USDT", side: "long", quantity: 0.45, entry_price: 94200, mark_price: 96800, unrealized_pnl: 1170, leverage: 3, liquidation_price: 78500, notional_usd: 43560, margin_used: 14520 },
  { symbol: "ETH/USDT:USDT", side: "long", quantity: 5.2, entry_price: 3420, mark_price: 3510, unrealized_pnl: 468, leverage: 2, liquidation_price: 2100, notional_usd: 18252, margin_used: 9126 },
  { symbol: "SOL/USDT:USDT", side: "short", quantity: 120, entry_price: 185, mark_price: 178.5, unrealized_pnl: 780, leverage: 5, liquidation_price: 210, notional_usd: 21420, margin_used: 4284 },
];

// ── Coin breakdown ──────────────────────────────────────────────────────────

export interface CoinBreakdown {
  symbol: string;
  quantity: number;
  avg_entry_price?: number;
  current_price?: number;
  cost_basis_usd?: number;
  market_value_usd?: number;
  realized_pnl?: number;
  unrealized_pnl?: number;
  total_pnl?: number;
  allocation_pct?: number;
  trade_count?: number;
}

export const MOCK_COIN_BREAKDOWN: CoinBreakdown[] = [
  { symbol: "BTC", quantity: 3.45, avg_entry_price: 88200, current_price: 96800, cost_basis_usd: 304290, market_value_usd: 333960, realized_pnl: 12450, unrealized_pnl: 29670, total_pnl: 42120, allocation_pct: 0.52, trade_count: 847 },
  { symbol: "ETH", quantity: 42.8, avg_entry_price: 3180, current_price: 3510, cost_basis_usd: 136104, market_value_usd: 150228, realized_pnl: 5820, unrealized_pnl: 14124, total_pnl: 19944, allocation_pct: 0.23, trade_count: 1234 },
  { symbol: "SOL", quantity: 580, avg_entry_price: 145, current_price: 178.5, cost_basis_usd: 84100, market_value_usd: 103530, realized_pnl: 3240, unrealized_pnl: 19430, total_pnl: 22670, allocation_pct: 0.16, trade_count: 456 },
  { symbol: "USDT", quantity: 58200, avg_entry_price: 1, current_price: 1, cost_basis_usd: 58200, market_value_usd: 58200, realized_pnl: 0, unrealized_pnl: 0, total_pnl: 0, allocation_pct: 0.09, trade_count: 0 },
];

// ── Trades ───────────────────────────────────────────────────────────────────

export interface TradeRecord {
  trade_id: string;
  venue: string;
  symbol: string;
  side: "BUY" | "SELL";
  quantity: number;
  price: number;
  fee: number;
  fee_currency: string;
  realized_pnl: number;
  timestamp: string;
  order_id: string;
  trade_type: string;
  notional_usd: number;
  /** Shard dimension: strategy identifier */
  strategy_id?: string;
  /** Shard dimension: client display name */
  client_name?: string;
  /** Shard dimension: domain category */
  category?: string;
}

export const MOCK_TRADES: TradeRecord[] = [
  { trade_id: "t-001", venue: "binance", symbol: "BTC/USDT", side: "BUY", quantity: 0.15, price: 95200, fee: 4.28, fee_currency: "USDT", realized_pnl: 0, timestamp: "2026-04-05T14:23:11+00:00", order_id: "o-8812", trade_type: "LIMIT", notional_usd: 14280 },
  { trade_id: "t-002", venue: "binance", symbol: "ETH/USDT", side: "SELL", quantity: 2.5, price: 3505, fee: 2.63, fee_currency: "USDT", realized_pnl: 312.5, timestamp: "2026-04-05T13:45:22+00:00", order_id: "o-8813", trade_type: "MARKET", notional_usd: 8762.5 },
  { trade_id: "t-003", venue: "okx", symbol: "SOL/USDT", side: "BUY", quantity: 50, price: 177.8, fee: 2.67, fee_currency: "USDT", realized_pnl: 0, timestamp: "2026-04-05T12:10:05+00:00", order_id: "o-8814", trade_type: "LIMIT", notional_usd: 8890 },
  { trade_id: "t-004", venue: "binance", symbol: "BTC/USDT", side: "SELL", quantity: 0.08, price: 96750, fee: 2.32, fee_currency: "USDT", realized_pnl: 204, timestamp: "2026-04-05T10:32:18+00:00", order_id: "o-8815", trade_type: "MARKET", notional_usd: 7740 },
  { trade_id: "t-005", venue: "okx", symbol: "BTC/USDT", side: "BUY", quantity: 0.25, price: 94800, fee: 7.11, fee_currency: "USDT", realized_pnl: 0, timestamp: "2026-04-04T22:15:44+00:00", order_id: "o-8816", trade_type: "LIMIT", notional_usd: 23700 },
  { trade_id: "t-006", venue: "binance", symbol: "DOGE/USDT", side: "BUY", quantity: 15000, price: 0.1823, fee: 0.82, fee_currency: "USDT", realized_pnl: 0, timestamp: "2026-04-04T18:45:30+00:00", order_id: "o-8817", trade_type: "LIMIT", notional_usd: 2734.5 },
  { trade_id: "t-007", venue: "okx", symbol: "ETH/USDT", side: "BUY", quantity: 3, price: 3385, fee: 3.05, fee_currency: "USDT", realized_pnl: 0, timestamp: "2026-04-04T15:20:12+00:00", order_id: "o-8818", trade_type: "MARKET", notional_usd: 10155 },
  { trade_id: "t-008", venue: "binance", symbol: "SOL/USDT", side: "SELL", quantity: 80, price: 182.3, fee: 4.38, fee_currency: "USDT", realized_pnl: 560, timestamp: "2026-04-04T11:05:33+00:00", order_id: "o-8819", trade_type: "LIMIT", notional_usd: 14584 },
];

// ── Balance breakdown ───────────────────────────────────────────────────────

export interface BalanceEntry {
  currency: string;
  free: string;
  locked: string;
  total: string;
  usd_value: string;
}

export interface BalanceBreakdown {
  total_equity_usd: number;
  balances: BalanceEntry[];
}

export const MOCK_BALANCE_BREAKDOWN: BalanceBreakdown = {
  total_equity_usd: 645918,
  balances: [
    { currency: "USDT", free: "412000.00", locked: "58200.00", total: "470200.00", usd_value: "470200.00" },
    { currency: "BTC", free: "0.85", locked: "0.45", total: "1.30", usd_value: "125840.00" },
    { currency: "ETH", free: "8.2", locked: "5.2", total: "13.4", usd_value: "47034.00" },
    { currency: "SOL", free: "15.0", locked: "0.0", total: "15.0", usd_value: "2677.50" },
    { currency: "BNB", free: "1.2", locked: "0.0", total: "1.2", usd_value: "166.50" },
  ],
};
