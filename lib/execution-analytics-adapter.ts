/**
 * Adapter: ExecutionBacktestResults → BacktestAnalytics
 *
 * Bridges the execution mock data shape to the shared BacktestAnalytics type
 * used by all components in components/research/. This allows the Execution tab
 * to reuse KpiBar, EquityChartWithLayers, PerformanceSection, TradesAnalysisSection,
 * CapitalEfficiencySection, RunupsDrawdownsSection, and MonthlyReturnsHeatmap
 * without modifying any shared component.
 */

import type {
  BacktestAnalytics,
  DirectionPerformance,
  EquityPoint as SharedEquityPoint,
  TradeMarker,
  PnlBucket,
  CapitalEfficiency,
  RunupDrawdownStats,
  BenchmarkComparison,
  MonthlyReturn,
  KpiBarItem,
} from "@/lib/types/backtest-analytics";
import type {
  ExecutionBacktestResults,
  DirectionStats,
  EquityPoint as ExecEquityPoint,
  ExecutionTrade,
} from "@/lib/mocks/fixtures/build-data";

function mapDirectionStats(d: DirectionStats): DirectionPerformance {
  return {
    net_profit: d.net_profit,
    net_profit_pct: d.net_profit_pct,
    gross_profit: d.gross_profit,
    gross_profit_pct: d.gross_profit > 0 ? (d.gross_profit / 100000) * 100 : 0,
    gross_loss: d.gross_loss,
    profit_factor: d.profit_factor,
    commission_paid: 0,
    expected_payoff: d.expectancy,
    total_trades: d.total_trades,
    winning_trades: Math.round(d.total_trades * (d.win_rate / 100)),
    losing_trades: d.total_trades - Math.round(d.total_trades * (d.win_rate / 100)),
    break_even_trades: 0,
    win_rate: d.win_rate,
    avg_pnl: d.total_trades > 0 ? d.net_profit / d.total_trades : 0,
    avg_pnl_pct: d.total_trades > 0 ? d.net_profit_pct / d.total_trades : 0,
    avg_winning_trade: d.avg_winning_trade,
    avg_winning_trade_pct: d.avg_winning_trade > 0 ? (d.avg_winning_trade / 100000) * 100 : 0,
    avg_losing_trade: d.avg_losing_trade,
    avg_losing_trade_pct: d.avg_losing_trade !== 0 ? (d.avg_losing_trade / 100000) * 100 : 0,
    ratio_avg_win_loss: d.avg_losing_trade !== 0 ? Math.abs(d.avg_winning_trade / d.avg_losing_trade) : 0,
    largest_win: d.largest_winner,
    largest_win_pct: (d.largest_winner / 100000) * 100,
    largest_win_as_pct_of_gross: d.gross_profit > 0 ? (d.largest_winner / d.gross_profit) * 100 : 0,
    largest_loss: d.largest_loser,
    largest_loss_pct: (Math.abs(d.largest_loser) / 100000) * 100,
    largest_loss_as_pct_of_gross: d.gross_loss !== 0 ? (Math.abs(d.largest_loser) / Math.abs(d.gross_loss)) * 100 : 0,
    avg_bars_in_trades: Math.round(d.avg_trade_duration_hours / 4),
    avg_bars_in_winning: Math.round((d.avg_trade_duration_hours / 4) * 0.8),
    avg_bars_in_losing: Math.round((d.avg_trade_duration_hours / 4) * 1.3),
    sharpe: d.sharpe_ratio,
    sortino: d.sortino_ratio,
    max_drawdown: 0,
    max_drawdown_pct: d.max_drawdown_pct,
  };
}

function convertEquityCurve(points: ExecEquityPoint[], buyHoldReturnPct: number): SharedEquityPoint[] {
  if (!points.length) return [];
  const startEquity = points[0].equity;
  const buyHoldStart = startEquity;
  const dailyBH = buyHoldReturnPct / 100 / points.length;

  return points.map((p, i) => ({
    time: new Date(p.date).getTime() / 1000,
    equity: p.equity,
    buy_hold: Math.round(buyHoldStart * (1 + dailyBH * i)),
    drawdown_pct: p.drawdown / 100,
  }));
}

function extractTradeMarkers(trades: ExecutionTrade[]): TradeMarker[] {
  return trades
    .filter((t) => t.pnl !== null)
    .map((t) => ({
      time: new Date(t.timestamp).getTime() / 1000,
      direction:
        t.signal === "EXIT" ? ("close" as const) : t.signal === "LONG" ? ("long" as const) : ("short" as const),
      pnl: t.pnl ?? 0,
      pnl_pct: t.pnl !== null ? (t.pnl / 100000) * 100 : 0,
    }));
}

function buildPnlDistribution(trades: ExecutionTrade[]): PnlBucket[] {
  const pnlTrades = trades.filter((t) => t.pnl !== null);
  const buckets: PnlBucket[] = [
    { bucket: "< -2%", min_pct: -100, max_pct: -2, count: 0 },
    { bucket: "-2% to -1%", min_pct: -2, max_pct: -1, count: 0 },
    { bucket: "-1% to 0%", min_pct: -1, max_pct: 0, count: 0 },
    { bucket: "0% to 1%", min_pct: 0, max_pct: 1, count: 0 },
    { bucket: "1% to 2%", min_pct: 1, max_pct: 2, count: 0 },
    { bucket: "> 2%", min_pct: 2, max_pct: 100, count: 0 },
  ];

  for (const t of pnlTrades) {
    const pct = (t.pnl! / 100000) * 100;
    for (const b of buckets) {
      if (pct >= b.min_pct && pct < b.max_pct) {
        b.count++;
        break;
      }
    }
    if (pnlTrades.length > 0 && pct >= 100) {
      buckets[buckets.length - 1].count++;
    }
  }

  return buckets;
}

function buildMonthlyReturns(equityCurve: ExecEquityPoint[]): MonthlyReturn[] {
  if (equityCurve.length < 2) return [];
  const byMonth = new Map<string, { start: number; end: number }>();

  for (const p of equityCurve) {
    const d = new Date(p.date);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    const existing = byMonth.get(key);
    if (!existing) {
      byMonth.set(key, { start: p.equity, end: p.equity });
    } else {
      existing.end = p.equity;
    }
  }

  const results: MonthlyReturn[] = [];
  for (const [key, { start, end }] of byMonth) {
    const [year, month] = key.split("-").map(Number);
    results.push({
      year,
      month,
      return_pct: ((end - start) / start) * 100,
    });
  }

  return results;
}

export function executionResultsToAnalytics(
  r: ExecutionBacktestResults,
  equityCurve: ExecEquityPoint[],
): BacktestAnalytics {
  const allDir = mapDirectionStats(r.by_direction.all);
  const longDir = mapDirectionStats(r.by_direction.long);
  const shortDir = mapDirectionStats(r.by_direction.short);

  allDir.commission_paid = r.total_commission;

  const kpi: KpiBarItem[] = [
    {
      label: "Net Profit",
      value: `$${r.net_profit.toLocaleString()}`,
      sub_value: `${r.net_profit_pct >= 0 ? "+" : ""}${r.net_profit_pct.toFixed(1)}%`,
      color: r.net_profit >= 0 ? "green" : "red",
    },
    {
      label: "Sharpe",
      value: r.sharpe_ratio.toFixed(2),
      color: r.sharpe_ratio > 1.5 ? "green" : r.sharpe_ratio < 0.5 ? "red" : "default",
    },
    {
      label: "Max DD",
      value: `${r.max_drawdown_pct.toFixed(1)}%`,
      color: r.max_drawdown_pct < 10 ? "green" : "red",
    },
    {
      label: "Win Rate",
      value: `${r.win_rate.toFixed(1)}%`,
      color: r.win_rate > 55 ? "green" : r.win_rate < 40 ? "red" : "default",
    },
    {
      label: "Avg Slippage",
      value: `${r.avg_slippage_bps.toFixed(1)} bps`,
      color: r.avg_slippage_bps < 3 ? "green" : "red",
    },
    {
      label: "Fill Rate",
      value: `${r.fill_rate_pct.toFixed(1)}%`,
      color: r.fill_rate_pct > 97 ? "green" : "red",
    },
  ];

  const sharedEquity = convertEquityCurve(equityCurve, r.buy_hold_return_pct);
  const tradeMarkers = extractTradeMarkers(r.trades);
  const pnlDist = buildPnlDistribution(r.trades);
  const monthlyReturns = buildMonthlyReturns(equityCurve);

  const winningTrades = r.trades.filter((t) => t.pnl !== null && t.pnl > 0);
  const losingTrades = r.trades.filter((t) => t.pnl !== null && t.pnl < 0);
  const avgProfitPct =
    winningTrades.length > 0
      ? (winningTrades.reduce((s, t) => s + (t.pnl ?? 0), 0) / winningTrades.length / 100000) * 100
      : 0;
  const avgLossPct =
    losingTrades.length > 0
      ? (losingTrades.reduce((s, t) => s + (t.pnl ?? 0), 0) / losingTrades.length / 100000) * 100
      : 0;

  const startEq = equityCurve[0]?.equity ?? 100000;
  const endEq = equityCurve[equityCurve.length - 1]?.equity ?? startEq;
  const daysSpan = equityCurve.length || 90;
  const years = daysSpan / 365;
  const cagr = years > 0 ? (Math.pow(endEq / startEq, 1 / years) - 1) * 100 : 0;

  const capitalEfficiency: CapitalEfficiency = {
    cagr,
    cagr_long: cagr * 0.65,
    cagr_short: cagr * 0.35,
    return_on_initial_capital: r.net_profit_pct,
    account_size_required: Math.round(startEq * (1 + r.max_drawdown_pct / 100) * 1.2),
    return_on_account_size: r.net_profit_pct * 0.85,
    net_profit_pct_of_largest_loss:
      r.by_direction.all.largest_loser !== 0 ? Math.abs(r.net_profit / r.by_direction.all.largest_loser) : 0,
  };

  const runupDrawdown: RunupDrawdownStats = {
    runups: {
      avg_duration_days: Math.round(daysSpan / 8),
      avg_amount: Math.round(r.net_profit * 0.15),
      avg_pct: r.net_profit_pct * 0.12,
      max_close_to_close: Math.round(r.net_profit * 0.35),
      max_close_to_close_pct: r.net_profit_pct * 0.3,
      max_intrabar: Math.round(r.net_profit * 0.4),
      max_intrabar_pct: r.net_profit_pct * 0.35,
    },
    drawdowns: {
      avg_duration_days: Math.round(r.max_dd_duration_days * 0.6),
      avg_amount: Math.round(startEq * (r.max_drawdown_pct / 100) * 0.5),
      avg_pct: r.max_drawdown_pct * 0.5,
      max_close_to_close: Math.round(startEq * (r.max_drawdown_pct / 100)),
      max_close_to_close_pct: r.max_drawdown_pct,
      max_intrabar: Math.round(startEq * (r.max_drawdown_pct / 100) * 1.15),
      max_intrabar_pct: r.max_drawdown_pct * 1.15,
      recovery_days: r.max_dd_duration_days,
    },
  };

  const buyHoldEnd = startEq * (1 + r.buy_hold_return_pct / 100);
  const benchmark: BenchmarkComparison = {
    buy_hold_return: Math.round(buyHoldEnd - startEq),
    buy_hold_return_pct: r.buy_hold_return_pct,
    strategy_outperformance: r.net_profit - Math.round(buyHoldEnd - startEq),
    strategy_outperformance_pct: r.net_profit_pct - r.buy_hold_return_pct,
  };

  return {
    kpi,
    equity_curve: sharedEquity,
    trade_markers: tradeMarkers,
    pnl_distribution: pnlDist,
    avg_profit_pct: avgProfitPct,
    avg_loss_pct: avgLossPct,
    performance_by_direction: {
      all: allDir,
      long: longDir,
      short: shortDir,
    },
    capital_efficiency: capitalEfficiency,
    runup_drawdown: runupDrawdown,
    benchmark,
    monthly_returns: monthlyReturns,
  };
}
