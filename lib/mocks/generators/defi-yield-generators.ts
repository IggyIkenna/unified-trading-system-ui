/**
 * DeFi yield curve generators — produce time-series data matching the
 * presentation_defi.html strategy APYs. Used by DeFi yield chart widgets
 * and the P&L context for realistic yield visualization.
 *
 * All APYs align with the presentation:
 *   Pure Lending USDT:       4.8%
 *   Pure Lending ETH:        2.0%
 *   BTC Basis:               6.4%
 *   ETH Staking Only:        5.8% (2.7% base + 1.2% EIGEN + 1.9% ETHFI)
 *   ETH Recursive:          38.2% (all rewards, 4x Ethena)
 *   USDT Hedged Simple:      6.1%
 *   USDT Hedged Recursive:  19.7% (all rewards, 2x Ethena)
 *   Ethena Benchmark:        9.8%
 */

export interface YieldDataPoint {
  date: string;
  apy_pct: number;
  cumulative_pnl_usd: number;
  daily_pnl_usd: number;
}

export interface StrategyYieldSeries {
  strategy_id: string;
  strategy_name: string;
  target_apy_pct: number;
  capital_usd: number;
  color: string;
  data: YieldDataPoint[];
}

/** Strategy definitions matching the presentation exactly */
const STRATEGY_DEFS: Array<{
  id: string;
  name: string;
  apy: number;
  capital: number;
  color: string;
  volatility: number; // APY daily noise amplitude
}> = [
  { id: "AAVE_LENDING_USDT", name: "Pure Lending USDT", apy: 4.8, capital: 1_000_000, color: "#3b82f6", volatility: 0.3 },
  { id: "AAVE_LENDING_ETH", name: "Pure Lending ETH", apy: 2.0, capital: 1_000_000, color: "#6366f1", volatility: 0.2 },
  { id: "BTC_BASIS", name: "BTC Basis Trade", apy: 6.4, capital: 2_000_000, color: "#f59e0b", volatility: 1.5 },
  { id: "ETH_STAKING", name: "ETH Staking Only", apy: 5.8, capital: 1_500_000, color: "#10b981", volatility: 0.5 },
  { id: "ETH_RECURSIVE", name: "ETH Recursive (All Rewards)", apy: 38.2, capital: 3_000_000, color: "#ef4444", volatility: 3.0 },
  { id: "USDT_HEDGED_SIMPLE", name: "USDT Hedged Simple", apy: 6.1, capital: 1_000_000, color: "#8b5cf6", volatility: 0.8 },
  { id: "USDT_HEDGED_RECURSIVE", name: "USDT Hedged Recursive", apy: 19.7, capital: 3_000_000, color: "#ec4899", volatility: 2.0 },
  { id: "ETHENA_BENCHMARK", name: "Ethena Benchmark (sUSDe)", apy: 9.8, capital: 10_000_000, color: "#64748b", volatility: 0.5 },
];

/** Deterministic seeded random */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Generate daily yield data points for a strategy over a date range.
 * APY fluctuates around the target with controlled noise, and
 * cumulative P&L grows accordingly.
 */
function generateStrategyYield(
  def: typeof STRATEGY_DEFS[0],
  days: number,
  startDate: Date,
): YieldDataPoint[] {
  const points: YieldDataPoint[] = [];
  let cumulativePnl = 0;
  const dailyBaseRate = def.apy / 365 / 100;

  for (let d = 0; d < days; d++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + d);

    // APY fluctuation: base + noise
    const noise = (seededRandom(d * 100 + def.apy * 1000) - 0.5) * 2 * def.volatility;
    const dailyApy = Math.max(0, def.apy + noise);
    const dailyRate = dailyApy / 365 / 100;
    const dailyPnl = def.capital * dailyRate;
    cumulativePnl += dailyPnl;

    points.push({
      date: date.toISOString().split("T")[0],
      apy_pct: Math.round(dailyApy * 100) / 100,
      cumulative_pnl_usd: Math.round(cumulativePnl * 100) / 100,
      daily_pnl_usd: Math.round(dailyPnl * 100) / 100,
    });
  }
  return points;
}

/**
 * Generate yield time-series for all strategies over the past N days.
 * Default: 90 days of history to show realistic curves.
 */
export function generateAllYieldSeries(days: number = 90): StrategyYieldSeries[] {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  return STRATEGY_DEFS.map((def) => ({
    strategy_id: def.id,
    strategy_name: def.name,
    target_apy_pct: def.apy,
    capital_usd: def.capital,
    color: def.color,
    data: generateStrategyYield(def, days, startDate),
  }));
}

/**
 * Generate yield data for a single strategy by ID.
 */
export function generateYieldForStrategy(strategyId: string, days: number = 90): StrategyYieldSeries | null {
  const def = STRATEGY_DEFS.find((d) => d.id === strategyId);
  if (!def) return null;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  return {
    strategy_id: def.id,
    strategy_name: def.name,
    target_apy_pct: def.apy,
    capital_usd: def.capital,
    color: def.color,
    data: generateStrategyYield(def, days, startDate),
  };
}

/**
 * Generate comparative yield summary (latest APY + cumulative P&L per strategy).
 * Used by KPI strips and summary tables.
 */
export function generateYieldSummary(days: number = 90): Array<{
  strategy_id: string;
  strategy_name: string;
  target_apy_pct: number;
  current_apy_pct: number;
  cumulative_pnl_usd: number;
  daily_pnl_usd: number;
  capital_usd: number;
  color: string;
  vs_ethena: number;
}> {
  const series = generateAllYieldSeries(days);
  const ethenaSeries = series.find((s) => s.strategy_id === "ETHENA_BENCHMARK");
  const ethenaLatest = ethenaSeries?.data[ethenaSeries.data.length - 1];

  return series.map((s) => {
    const latest = s.data[s.data.length - 1];
    return {
      strategy_id: s.strategy_id,
      strategy_name: s.strategy_name,
      target_apy_pct: s.target_apy_pct,
      current_apy_pct: latest?.apy_pct ?? s.target_apy_pct,
      cumulative_pnl_usd: latest?.cumulative_pnl_usd ?? 0,
      daily_pnl_usd: latest?.daily_pnl_usd ?? 0,
      capital_usd: s.capital_usd,
      color: s.color,
      vs_ethena: Math.round((s.target_apy_pct - (ethenaLatest?.apy_pct ?? 9.8)) * 100) / 100,
    };
  });
}

/** Map presentation strategy names to our canonical IDs */
export const STRATEGY_ID_MAP: Record<string, string> = {
  AAVE_LENDING: "AAVE_LENDING_USDT",
  BASIS_TRADE: "BTC_BASIS",
  STAKED_BASIS: "ETH_STAKING",
  RECURSIVE_STAKED_BASIS: "ETH_RECURSIVE",
  ETHENA_BENCHMARK: "ETHENA_BENCHMARK",
};

export { STRATEGY_DEFS };
