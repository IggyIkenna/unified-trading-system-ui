// =============================================================================
// Shared Backtest Analytics Mock Data Generators
// Used by BOTH Strategies and Execution tabs
// =============================================================================

import type {
  BacktestAnalytics,
  DirectionPerformance,
  EquityPoint,
  TradeMarker,
  PnlBucket,
  CapitalEfficiency,
  RunupDrawdownStats,
  BenchmarkComparison,
  KpiBarItem,
  MonthlyReturn,
} from "./backtest-analytics-types";

// ─── Seeded random for deterministic mocks ──────────────────────────────────

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// ─── Equity Curve Generator ─────────────────────────────────────────────────

export function generateEquityCurve(
  seed: number,
  days: number = 90,
  initialCapital: number = 100000,
  targetReturn: number = 0.23,
): EquityPoint[] {
  const rng = seededRandom(seed);
  const points: EquityPoint[] = [];

  const startTime = Math.floor(new Date("2026-01-01").getTime() / 1000);
  const dailyDrift = targetReturn / days;
  const volatility = 0.015;

  let equity = initialCapital;
  let buyHold = initialCapital;
  let peak = initialCapital;
  const buyHoldDrift = 0.18 / days;

  for (let i = 0; i < days; i++) {
    const shock = (rng() - 0.5) * 2 * volatility;
    equity *= 1 + dailyDrift + shock;
    buyHold *= 1 + buyHoldDrift + (rng() - 0.5) * 0.02;
    peak = Math.max(peak, equity);
    const drawdown = (equity - peak) / peak;

    points.push({
      time: startTime + i * 86400,
      equity: Math.round(equity * 100) / 100,
      buy_hold: Math.round(buyHold * 100) / 100,
      drawdown_pct: Math.round(drawdown * 10000) / 10000,
    });
  }

  return points;
}

// ─── Trade Markers Generator ────────────────────────────────────────────────

export function generateTradeMarkers(
  seed: number,
  days: number = 90,
  avgTradesPerDay: number = 1.5,
): TradeMarker[] {
  const rng = seededRandom(seed);
  const markers: TradeMarker[] = [];
  const startTime = Math.floor(new Date("2026-01-01").getTime() / 1000);
  const totalTrades = Math.round(days * avgTradesPerDay);

  for (let i = 0; i < totalTrades; i++) {
    const day = Math.floor(rng() * days);
    const hour = Math.floor(rng() * 24);
    const isLong = rng() > 0.4;
    const isWin = rng() > 0.38;
    const magnitude = rng() * 3 + 0.5;
    const pnl = isWin ? magnitude : -magnitude * 0.7;

    markers.push({
      time: startTime + day * 86400 + hour * 3600,
      direction: isLong ? "long" : "short",
      pnl: Math.round(pnl * 100) / 100,
      pnl_pct: Math.round(pnl * 100) / 10000,
    });
  }

  return markers.sort((a, b) => a.time - b.time);
}

// ─── P&L Distribution Generator ─────────────────────────────────────────────

export function generatePnlDistribution(
  seed: number,
  totalTrades: number = 130,
): { buckets: PnlBucket[]; avgProfitPct: number; avgLossPct: number } {
  const rng = seededRandom(seed);

  const bucketDefs = [
    { bucket: "-5% to -4%", min_pct: -5, max_pct: -4 },
    { bucket: "-4% to -3%", min_pct: -4, max_pct: -3 },
    { bucket: "-3% to -2%", min_pct: -3, max_pct: -2 },
    { bucket: "-2% to -1%", min_pct: -2, max_pct: -1 },
    { bucket: "-1% to 0%", min_pct: -1, max_pct: 0 },
    { bucket: "0% to 1%", min_pct: 0, max_pct: 1 },
    { bucket: "1% to 2%", min_pct: 1, max_pct: 2 },
    { bucket: "2% to 3%", min_pct: 2, max_pct: 3 },
    { bucket: "3% to 4%", min_pct: 3, max_pct: 4 },
    { bucket: "4% to 5%", min_pct: 4, max_pct: 5 },
    { bucket: "5% to 6%", min_pct: 5, max_pct: 6 },
  ];

  const weights = [3, 8, 15, 18, 12, 10, 14, 10, 6, 3, 1];
  const total = weights.reduce((s, w) => s + w, 0);

  const buckets: PnlBucket[] = bucketDefs.map((def, i) => ({
    ...def,
    count: Math.max(
      1,
      Math.round((weights[i] / total) * totalTrades * (0.8 + rng() * 0.4)),
    ),
  }));

  const lossBuckets = buckets.filter((b) => b.max_pct <= 0);
  const profitBuckets = buckets.filter((b) => b.min_pct >= 0);

  const totalLosses = lossBuckets.reduce((s, b) => s + b.count, 0);
  const totalProfits = profitBuckets.reduce((s, b) => s + b.count, 0);

  const avgLossPct =
    totalLosses > 0
      ? lossBuckets.reduce(
          (s, b) => s + ((b.min_pct + b.max_pct) / 2) * b.count,
          0,
        ) / totalLosses
      : 0;

  const avgProfitPct =
    totalProfits > 0
      ? profitBuckets.reduce(
          (s, b) => s + ((b.min_pct + b.max_pct) / 2) * b.count,
          0,
        ) / totalProfits
      : 0;

  return {
    buckets,
    avgProfitPct: Math.round(avgProfitPct * 100) / 100,
    avgLossPct: Math.round(avgLossPct * 100) / 100,
  };
}

// ─── Direction Performance Generator ────────────────────────────────────────

export function generateDirectionPerformance(
  seed: number,
  totalTrades: number = 65,
  netProfit: number = 23400,
): DirectionPerformance {
  const rng = seededRandom(seed);
  const winRate = 0.55 + rng() * 0.15;
  const winning = Math.round(totalTrades * winRate);
  const losing = totalTrades - winning;
  const breakEven = Math.round(rng() * 3);
  const grossProfit = netProfit * (1.5 + rng() * 0.5);
  const grossLoss = grossProfit - netProfit;
  const commission = grossProfit * 0.01 * (0.5 + rng());
  const avgWin = winning > 0 ? grossProfit / winning : 0;
  const avgLoss = losing > 0 ? grossLoss / losing : 0;
  const largestWin = avgWin * (1.5 + rng() * 2);
  const largestLoss = avgLoss * (1.5 + rng() * 1.5);

  return {
    net_profit: Math.round(netProfit),
    net_profit_pct: Math.round((netProfit / 100000) * 10000) / 100,
    gross_profit: Math.round(grossProfit),
    gross_profit_pct: Math.round((grossProfit / 100000) * 10000) / 100,
    gross_loss: Math.round(-grossLoss),
    profit_factor:
      grossLoss > 0 ? Math.round((grossProfit / grossLoss) * 100) / 100 : 0,
    commission_paid: Math.round(commission),
    expected_payoff: Math.round(netProfit / totalTrades),
    total_trades: totalTrades,
    winning_trades: winning,
    losing_trades: losing,
    break_even_trades: breakEven,
    win_rate: Math.round(winRate * 1000) / 10,
    avg_pnl: Math.round(netProfit / totalTrades),
    avg_pnl_pct: Math.round((netProfit / totalTrades / 100000) * 10000) / 100,
    avg_winning_trade: Math.round(avgWin),
    avg_winning_trade_pct: Math.round((avgWin / 100000) * 10000) / 100,
    avg_losing_trade: Math.round(-avgLoss),
    avg_losing_trade_pct: Math.round((avgLoss / 100000) * 10000) / 100,
    ratio_avg_win_loss:
      avgLoss > 0 ? Math.round((avgWin / avgLoss) * 100) / 100 : 0,
    largest_win: Math.round(largestWin),
    largest_win_pct: Math.round((largestWin / 100000) * 10000) / 100,
    largest_win_as_pct_of_gross:
      grossProfit > 0 ? Math.round((largestWin / grossProfit) * 1000) / 10 : 0,
    largest_loss: Math.round(-largestLoss),
    largest_loss_pct: Math.round((largestLoss / 100000) * 10000) / 100,
    largest_loss_as_pct_of_gross:
      grossLoss > 0 ? Math.round((largestLoss / grossLoss) * 1000) / 10 : 0,
    avg_bars_in_trades: Math.round(5 + rng() * 8),
    avg_bars_in_winning: Math.round(7 + rng() * 10),
    avg_bars_in_losing: Math.round(3 + rng() * 5),
    sharpe: Math.round((1.5 + rng() * 1.5) * 100) / 100,
    sortino: Math.round((2.0 + rng() * 2.0) * 100) / 100,
    max_drawdown: Math.round((3000 + rng() * 9000) * 100) / 100,
    max_drawdown_pct: Math.round((3 + rng() * 9) * 100) / 100,
  };
}

// ─── Capital Efficiency Generator ───────────────────────────────────────────

export function generateCapitalEfficiency(
  seed: number,
  netProfit: number = 23400,
  maxDrawdown: number = 12400,
): CapitalEfficiency {
  const rng = seededRandom(seed);
  const cagr = 0.15 + rng() * 0.25;

  return {
    cagr: Math.round(cagr * 10000) / 100,
    cagr_long: Math.round(cagr * (0.55 + rng() * 0.2) * 10000) / 100,
    cagr_short: Math.round(cagr * (0.2 + rng() * 0.2) * 10000) / 100,
    return_on_initial_capital: Math.round((netProfit / 100000) * 10000) / 100,
    account_size_required: Math.round(maxDrawdown),
    return_on_account_size:
      maxDrawdown > 0 ? Math.round((netProfit / maxDrawdown) * 100) / 100 : 0,
    net_profit_pct_of_largest_loss:
      Math.round((netProfit / (maxDrawdown * 0.3)) * 100) / 100,
  };
}

// ─── Run-ups & Drawdowns Generator ──────────────────────────────────────────

export function generateRunupDrawdownStats(seed: number): RunupDrawdownStats {
  const rng = seededRandom(seed);

  return {
    runups: {
      avg_duration_days: Math.round(8 + rng() * 12),
      avg_amount: Math.round((5000 + rng() * 10000) * 100) / 100,
      avg_pct: Math.round((3 + rng() * 5) * 100) / 100,
      max_close_to_close: Math.round((12000 + rng() * 15000) * 100) / 100,
      max_close_to_close_pct: Math.round((6 + rng() * 8) * 100) / 100,
      max_intrabar: Math.round((15000 + rng() * 20000) * 100) / 100,
      max_intrabar_pct: Math.round((8 + rng() * 10) * 100) / 100,
    },
    drawdowns: {
      avg_duration_days: Math.round(4 + rng() * 8),
      avg_amount: Math.round((3000 + rng() * 6000) * 100) / 100,
      avg_pct: Math.round((2 + rng() * 4) * 100) / 100,
      max_close_to_close: Math.round((8000 + rng() * 12000) * 100) / 100,
      max_close_to_close_pct: Math.round((5 + rng() * 8) * 100) / 100,
      max_intrabar: Math.round((10000 + rng() * 15000) * 100) / 100,
      max_intrabar_pct: Math.round((6 + rng() * 10) * 100) / 100,
      recovery_days: Math.round(5 + rng() * 10),
    },
  };
}

// ─── Monthly Returns (heatmap) ────────────────────────────────────────────────

export function generateMonthlyReturns(
  seed: number,
  months: number = 18,
): MonthlyReturn[] {
  const rng = seededRandom(seed);
  const out: MonthlyReturn[] = [];
  const now = new Date();
  let y = now.getUTCFullYear();
  let m = now.getUTCMonth() + 1;

  for (let i = 0; i < months; i++) {
    const drift = (rng() - 0.48) * 8;
    out.push({
      year: y,
      month: m,
      return_pct: Math.round(drift * 100) / 100,
    });
    m -= 1;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
  }
  return out.reverse();
}

// ─── Benchmark Generator ────────────────────────────────────────────────────

export function generateBenchmark(
  seed: number,
  strategyReturn: number = 23400,
): BenchmarkComparison {
  const rng = seededRandom(seed);
  const buyHold = strategyReturn * (0.5 + rng() * 0.6);

  return {
    buy_hold_return: Math.round(buyHold),
    buy_hold_return_pct: Math.round((buyHold / 100000) * 10000) / 100,
    strategy_outperformance: Math.round(strategyReturn - buyHold),
    strategy_outperformance_pct:
      Math.round(((strategyReturn - buyHold) / 100000) * 10000) / 100,
  };
}

// ─── Full Analytics Bundle ──────────────────────────────────────────────────

export function generateBacktestAnalytics(
  seed: number,
  opts?: {
    days?: number;
    totalTrades?: number;
    netProfit?: number;
    label?: string;
  },
): BacktestAnalytics {
  const days = opts?.days ?? 90;
  const totalTrades = opts?.totalTrades ?? 130;
  const netProfit = opts?.netProfit ?? 23400;

  const equity = generateEquityCurve(seed, days, 100000, netProfit / 100000);
  const markers = generateTradeMarkers(seed + 1, days, totalTrades / days);
  const { buckets, avgProfitPct, avgLossPct } = generatePnlDistribution(
    seed + 2,
    totalTrades,
  );

  const allPerf = generateDirectionPerformance(
    seed + 3,
    totalTrades,
    netProfit,
  );
  const longPerf = generateDirectionPerformance(
    seed + 4,
    Math.round(totalTrades * 0.58),
    netProfit * 0.68,
  );
  const shortPerf = generateDirectionPerformance(
    seed + 5,
    Math.round(totalTrades * 0.42),
    netProfit * 0.32,
  );

  const maxDD = Math.abs(allPerf.max_drawdown);
  const capEff = generateCapitalEfficiency(seed + 6, netProfit, maxDD);
  const runDD = generateRunupDrawdownStats(seed + 7);
  const benchmark = generateBenchmark(seed + 8, netProfit);
  const monthlyReturns = generateMonthlyReturns(seed + 9, 18);

  const profitPct = Math.round((netProfit / 100000) * 10000) / 100;

  const kpi: KpiBarItem[] = [
    {
      label: "Total P&L",
      value: `$${netProfit.toLocaleString()}`,
      sub_value: `${profitPct > 0 ? "+" : ""}${profitPct}%`,
      color: netProfit >= 0 ? "green" : "red",
    },
    {
      label: "Max Drawdown",
      value: `${allPerf.max_drawdown_pct}%`,
      color: "red",
    },
    {
      label: opts?.label === "execution" ? "Total Trades" : "Total Signals",
      value: String(totalTrades),
    },
    {
      label: "Win Rate",
      value: `${allPerf.win_rate}%`,
      color: allPerf.win_rate >= 50 ? "green" : "red",
    },
    {
      label: "Profit Factor",
      value: String(allPerf.profit_factor),
      color: allPerf.profit_factor >= 1.5 ? "green" : "default",
    },
  ];

  return {
    kpi,
    equity_curve: equity,
    trade_markers: markers,
    pnl_distribution: buckets,
    avg_profit_pct: avgProfitPct,
    avg_loss_pct: avgLossPct,
    performance_by_direction: {
      all: allPerf,
      long: longPerf,
      short: shortPerf,
    },
    capital_efficiency: capEff,
    runup_drawdown: runDD,
    benchmark,
    monthly_returns: monthlyReturns,
  };
}
