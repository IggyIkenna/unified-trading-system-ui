// =============================================================================
// Shared Backtest Analytics Types
// Used by BOTH Strategies tab (signal backtests) and Execution tab (trade backtests)
// =============================================================================

// ─── Direction Performance (All | Long | Short columns) ─────────────────────

export interface DirectionPerformance {
  net_profit: number;
  net_profit_pct: number;
  gross_profit: number;
  gross_profit_pct: number;
  gross_loss: number;
  profit_factor: number;
  commission_paid: number;
  expected_payoff: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  break_even_trades: number;
  win_rate: number;
  avg_pnl: number;
  avg_pnl_pct: number;
  avg_winning_trade: number;
  avg_winning_trade_pct: number;
  avg_losing_trade: number;
  avg_losing_trade_pct: number;
  ratio_avg_win_loss: number;
  largest_win: number;
  largest_win_pct: number;
  largest_win_as_pct_of_gross: number;
  largest_loss: number;
  largest_loss_pct: number;
  largest_loss_as_pct_of_gross: number;
  avg_bars_in_trades: number;
  avg_bars_in_winning: number;
  avg_bars_in_losing: number;
  sharpe: number;
  sortino: number;
  max_drawdown: number;
  max_drawdown_pct: number;
}

// ─── Equity Curve ───────────────────────────────────────────────────────────

export interface EquityPoint {
  time: number;
  equity: number;
  buy_hold: number;
  drawdown_pct: number;
}

// ─── Trade/Signal Markers on Equity Chart ───────────────────────────────────

export interface TradeMarker {
  time: number;
  direction: "long" | "short" | "close";
  pnl: number;
  pnl_pct: number;
}

// ─── P&L Distribution Histogram ─────────────────────────────────────────────

export interface PnlBucket {
  bucket: string;
  min_pct: number;
  max_pct: number;
  count: number;
}

// ─── Capital Efficiency ─────────────────────────────────────────────────────

export interface CapitalEfficiency {
  cagr: number;
  cagr_long: number;
  cagr_short: number;
  return_on_initial_capital: number;
  account_size_required: number;
  return_on_account_size: number;
  net_profit_pct_of_largest_loss: number;
}

// ─── Run-ups & Drawdowns ────────────────────────────────────────────────────

export interface RunupDrawdownStats {
  runups: {
    avg_duration_days: number;
    avg_amount: number;
    avg_pct: number;
    max_close_to_close: number;
    max_close_to_close_pct: number;
    max_intrabar: number;
    max_intrabar_pct: number;
  };
  drawdowns: {
    avg_duration_days: number;
    avg_amount: number;
    avg_pct: number;
    max_close_to_close: number;
    max_close_to_close_pct: number;
    max_intrabar: number;
    max_intrabar_pct: number;
    recovery_days: number;
  };
}

// ─── Benchmark Comparison ───────────────────────────────────────────────────

export interface BenchmarkComparison {
  buy_hold_return: number;
  buy_hold_return_pct: number;
  strategy_outperformance: number;
  strategy_outperformance_pct: number;
}

// ─── Monthly Returns (heatmap) ─────────────────────────────────────────────

export interface MonthlyReturn {
  year: number;
  /** 1–12 */
  month: number;
  return_pct: number;
}

// ─── KPI Bar ────────────────────────────────────────────────────────────────

export interface KpiBarItem {
  label: string;
  value: string;
  sub_value?: string;
  color?: "green" | "red" | "default";
}

// ─── Equity Chart Layer Toggle State ────────────────────────────────────────

export interface EquityChartLayers {
  equity: boolean;
  buy_hold: boolean;
  trade_markers: boolean;
  runup_drawdown: boolean;
}

export const DEFAULT_EQUITY_LAYERS: EquityChartLayers = {
  equity: true,
  buy_hold: true,
  trade_markers: true,
  runup_drawdown: false,
};

// ─── Full Analytics Bundle ──────────────────────────────────────────────────
// This is the shape each backtest detail view needs, whether Strategies or Execution.

export interface BacktestAnalytics {
  kpi: KpiBarItem[];
  equity_curve: EquityPoint[];
  trade_markers: TradeMarker[];
  pnl_distribution: PnlBucket[];
  avg_profit_pct: number;
  avg_loss_pct: number;
  performance_by_direction: {
    all: DirectionPerformance;
    long: DirectionPerformance;
    short: DirectionPerformance;
  };
  capital_efficiency: CapitalEfficiency;
  runup_drawdown: RunupDrawdownStats;
  benchmark: BenchmarkComparison;
  /** Calendar monthly returns for heatmap (typically 12–24 months) */
  monthly_returns: MonthlyReturn[];
}
