// =============================================================================
// Build Tab — Central Mock Data
// Covers: Overview, Features, Feature ETL, Execution (new pages)
// See: docs/build lifecycle tab/MOCK_DATA_TRACKING.md for full API contracts
// =============================================================================

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BuildOverviewStats {
  features: {
    total_defined: number;
    new_this_week: number;
    computed_pct: number;
    stale_count: number;
  };
  feature_etl: {
    overall_pct: number;
    shards_complete: number;
    shards_total: number;
    active_jobs: number;
  };
  models: {
    total_trained: number;
    active_jobs: number;
    champion_count: number;
    pending_retrain: number;
  };
  strategies: {
    total_run: number;
    candidates: number;
    new_this_week: number;
  };
  execution: {
    total_backtested: number;
    in_progress: number;
    best_sharpe: number;
  };
}

export interface BuildActiveJob {
  id: string;
  type:
    | "feature_computation"
    | "model_training"
    | "strategy_backtest"
    | "execution_backtest";
  name: string;
  description: string;
  progress_pct: number;
  eta_minutes: number | null;
  started_at: string;
  status: "running" | "paused" | "queued";
  detail: string;
}

export interface BuildAlert {
  id: string;
  severity: "critical" | "warning" | "info" | "success";
  message: string;
  detail: string | null;
  timestamp: string;
  source: "features" | "feature_etl" | "models" | "strategies" | "execution";
  action_href: string | null;
}

export interface BuildActivity {
  id: string;
  action: string;
  actor: string;
  timestamp: string;
  href: string | null;
}

export interface FeatureCatalogueEntry {
  id: string;
  name: string;
  display_name: string;
  shard: "CeFi" | "DeFi" | "TradFi" | "Sports" | "Prediction";
  feature_type:
    | "Delta-One"
    | "Volatility"
    | "On-Chain"
    | "Sports"
    | "Calendar"
    | "Multi-Timeframe"
    | "Cross-Instrument"
    | "Commodity"
    | "Microstructure";
  feature_group:
    | "Technical"
    | "Fundamental"
    | "Sentiment"
    | "Microstructure"
    | "Risk"
    | "ML-Derived";
  source_service: string;
  current_version: string;
  status: "active" | "stale" | "not_computed" | "deprecated";
  symbols: string[];
  last_computed: string | null;
  description: string;
  parameters: Record<string, unknown>;
  dependencies: string[];
  consumed_by_models: string[];
  tags: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface FeatureVersion {
  feature_id: string;
  version: string;
  changed_fields: string[];
  changed_by: string;
  changed_at: string;
  change_summary: string;
  models_using_this_version: string[];
}

export interface FeatureEtlService {
  id: string;
  name: string;
  shard: string;
  overall_pct: number;
  shards_complete: number;
  shards_total: number;
  active_jobs: number;
  failed_jobs: number;
  last_updated: string;
  by_category: Record<string, { pct: number; complete: number; total: number }>;
}

export interface FeatureEtlJob {
  id: string;
  service_id: string;
  shard: string;
  category: string;
  date_range: { start: string; end: string };
  progress_pct: number;
  status: "running" | "queued" | "complete" | "failed" | "paused";
  started_at: string;
  completed_at: string | null;
  error: string | null;
  shards_done: number;
  shards_total: number;
}

export interface FeatureEtlHeatmapCell {
  shard: string;
  feature_group: string;
  date: string;
  pct: number;
  status: "complete" | "partial" | "missing";
}

export interface ExecutionTrade {
  id: string;
  timestamp: string;
  signal: "LONG" | "SHORT" | "EXIT";
  instrument: string;
  signal_price: number;
  fill_price: number;
  slippage_bps: number;
  fill_time_ms: number;
  venue: string;
  algo: string;
  quantity: number;
  side: "buy" | "sell";
  commission: number;
  market_impact_bps: number;
  partial_fill_pct: number;
  pnl: number | null;
  cumulative_pnl: number;
  model_confidence: number | null;
}

export interface SlippageBucket {
  label: string;
  count: number;
  pct: number;
}

export interface ISBreakdown {
  total_bps: number;
  total_usd: number;
  delay_cost_bps: number;
  delay_cost_usd: number;
  market_impact_bps: number;
  market_impact_usd: number;
  fees_bps: number;
  fees_usd: number;
}

export interface DirectionStats {
  net_profit: number;
  net_profit_pct: number;
  sharpe_ratio: number;
  sortino_ratio: number;
  max_drawdown_pct: number;
  profit_factor: number;
  win_rate: number;
  total_trades: number;
  avg_winning_trade: number;
  avg_losing_trade: number;
  largest_winner: number;
  largest_loser: number;
  avg_trade_duration_hours: number;
  max_consec_wins: number;
  max_consec_losses: number;
  gross_profit: number;
  gross_loss: number;
  expectancy: number;
}

export interface ExecutionBacktestResults {
  net_profit: number;
  net_profit_pct: number;
  sharpe_ratio: number;
  sortino_ratio: number;
  max_drawdown_pct: number;
  profit_factor: number;
  win_rate: number;
  total_trades: number;
  avg_trade_duration_hours: number;
  avg_slippage_bps: number;
  total_slippage_cost: number;
  avg_fill_time_seconds: number;
  fill_rate_pct: number;
  partial_fill_pct: number;
  maker_pct: number;
  total_commission: number;
  implementation_shortfall_bps: number;
  venue_breakdown: Record<
    string,
    {
      fills: number;
      avg_slippage_bps: number;
      maker_pct: number;
      avg_fill_time_s: number;
    }
  >;
  // Extended fields
  buy_hold_return_pct: number;
  calmar_ratio: number;
  max_dd_duration_days: number;
  slippage_distribution: SlippageBucket[];
  slippage_mean_bps: number;
  slippage_median_bps: number;
  slippage_p95_bps: number;
  is_breakdown: ISBreakdown;
  by_direction: {
    all: DirectionStats;
    long: DirectionStats;
    short: DirectionStats;
  };
  trades: ExecutionTrade[];
}

export interface ExecutionBacktest {
  id: string;
  name: string;
  strategy_backtest_id: string;
  strategy_name: string;
  algo:
    | "TWAP"
    | "VWAP"
    | "Iceberg"
    | "Aggressive Limit"
    | "Passive Limit"
    | "Market Only";
  algo_params: Record<string, unknown>;
  order_type: "Limit" | "Market" | "Limit-then-Market";
  venues: string[];
  routing: "SOR" | "venue-specific" | "split";
  slippage_model: "fixed_bps" | "orderbook_based";
  execution_delay_ms: number;
  market_impact: "none" | "linear" | "square_root";
  date_range: { start: string; end: string };
  instrument: string;
  status: "complete" | "running" | "failed";
  created_at: string;
  created_by: string;
  results: ExecutionBacktestResults | null;
}

export interface EquityPoint {
  date: string;
  equity: number;
  drawdown: number;
}

// ─── Build Overview ───────────────────────────────────────────────────────────

export const BUILD_OVERVIEW_STATS: BuildOverviewStats = {
  features: {
    total_defined: 342,
    new_this_week: 7,
    computed_pct: 78,
    stale_count: 14,
  },
  feature_etl: {
    overall_pct: 78,
    shards_complete: 31,
    shards_total: 40,
    active_jobs: 3,
  },
  models: {
    total_trained: 47,
    active_jobs: 2,
    champion_count: 8,
    pending_retrain: 3,
  },
  strategies: {
    total_run: 128,
    candidates: 12,
    new_this_week: 5,
  },
  execution: {
    total_backtested: 64,
    in_progress: 1,
    best_sharpe: 2.41,
  },
};

export const BUILD_ACTIVE_JOBS: BuildActiveJob[] = [
  {
    id: "job-feat-cefi-001",
    type: "feature_computation",
    name: "CeFi Delta-One Features",
    description: "BTC, ETH, SOL — EMA, RSI, MACD indicators",
    progress_pct: 78,
    eta_minutes: 12,
    started_at: new Date(Date.now() - 3600000).toISOString(),
    status: "running",
    detail: "78% shards complete (31/40)",
  },
  {
    id: "job-model-btc-dir",
    type: "model_training",
    name: "BTC Direction v3.3.0-rc1",
    description: "Transformer architecture, 512-dim, 8 attention heads",
    progress_pct: 45,
    eta_minutes: 38,
    started_at: new Date(Date.now() - 7200000).toISOString(),
    status: "running",
    detail: "Epoch 29/65 — val_loss: 0.238",
  },
  {
    id: "job-exec-bt-003",
    type: "execution_backtest",
    name: "ETH Basis — TWAP 30m",
    description: "ETH-PERP vs ETH-USDT — BINANCE + OKX",
    progress_pct: 92,
    eta_minutes: 3,
    started_at: new Date(Date.now() - 1800000).toISOString(),
    status: "running",
    detail: "Running execution simulation — 92% complete",
  },
  {
    id: "job-strat-bt-007",
    type: "strategy_backtest",
    name: "Multi-Asset Momentum v2.1 — CeFi",
    description: "2023-01 to 2026-01 full backtest",
    progress_pct: 0,
    eta_minutes: null,
    started_at: new Date(Date.now() - 300000).toISOString(),
    status: "queued",
    detail: "Queued — waiting for feature data",
  },
];

export const BUILD_ALERTS: BuildAlert[] = [
  {
    id: "alert-001",
    severity: "critical",
    message: "Feature computation failed: DeFi On-Chain shard 8/12",
    detail: "RPC timeout on Ethereum node — retrying with fallback",
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    source: "feature_etl",
    action_href: "/services/research/feature-etl",
  },
  {
    id: "alert-002",
    severity: "warning",
    message: "14 features are stale (>24h since last computation)",
    detail:
      "Volatility features for TradFi shard not updated since market close",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    source: "features",
    action_href: "/services/research/features",
  },
  {
    id: "alert-003",
    severity: "warning",
    message:
      "Model validation: ETH Volatility Surface challenger below champion threshold",
    detail:
      "Challenger Sharpe 1.82 vs Champion 2.31 — insufficient improvement",
    timestamp: new Date(Date.now() - 14400000).toISOString(),
    source: "models",
    action_href: "/services/research/ml/validation",
  },
  {
    id: "alert-004",
    severity: "info",
    message:
      "Feature version update: ema_50 upgraded to v2.1 (window parameter change)",
    detail: "3 models pinned to v2.0 — retrain recommended",
    timestamp: new Date(Date.now() - 28800000).toISOString(),
    source: "features",
    action_href: "/services/research/features",
  },
  {
    id: "alert-005",
    severity: "success",
    message: "BTC Direction v3.2.1 passed all validation checks",
    detail: "Sharpe 2.41, Sortino 3.12, Max DD 8.3% — promoted to registry",
    timestamp: new Date(Date.now() - 43200000).toISOString(),
    source: "models",
    action_href: "/services/research/ml/registry",
  },
];

export const BUILD_RECENT_ACTIVITY: BuildActivity[] = [
  {
    id: "act-001",
    action: "Execution backtest completed: ETH Basis — VWAP 2h (Sharpe 1.94)",
    actor: "quant_researcher",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    href: "/services/research/execution",
  },
  {
    id: "act-002",
    action: "Model registered: BTC Direction v3.2.1 promoted to champion",
    actor: "ml_engineer",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    href: "/services/research/ml/registry",
  },
  {
    id: "act-003",
    action: "Feature updated: volatility_regime v1.3 → v1.4 (lookback 20→30)",
    actor: "quant_researcher",
    timestamp: new Date(Date.now() - 10800000).toISOString(),
    href: "/services/research/features",
  },
  {
    id: "act-004",
    action: "Strategy backtest launched: Cross-Exchange Stat Arb v2.5.3",
    actor: "strategy_team",
    timestamp: new Date(Date.now() - 14400000).toISOString(),
    href: "/services/research/strategies",
  },
  {
    id: "act-005",
    action:
      "Feature catalogue: 3 new Sports features added (match_form_5, odds_movement_1h, …)",
    actor: "sports_team",
    timestamp: new Date(Date.now() - 21600000).toISOString(),
    href: "/services/research/features",
  },
  {
    id: "act-006",
    action: "Feature ETL job completed: CeFi Volatility shard batch (Q4 2025)",
    actor: "system",
    timestamp: new Date(Date.now() - 28800000).toISOString(),
    href: "/services/research/feature-etl",
  },
  {
    id: "act-007",
    action:
      "Experiment created: ETH Vol Surface — 3 hyperparameter configurations",
    actor: "ml_engineer",
    timestamp: new Date(Date.now() - 36000000).toISOString(),
    href: "/services/research/ml/experiments",
  },
];

// ─── Feature Catalogue ────────────────────────────────────────────────────────

export const FEATURE_CATALOGUE: FeatureCatalogueEntry[] = [
  // CeFi — Technical
  {
    id: "feat-ema-20",
    name: "ema_20",
    display_name: "EMA-20",
    shard: "CeFi",
    feature_type: "Delta-One",
    feature_group: "Technical",
    source_service: "features-delta-one-service",
    current_version: "v2.0",
    status: "active",
    symbols: ["BTC-USDT", "ETH-USDT", "SOL-USDT", "BNB-USDT"],
    last_computed: new Date(Date.now() - 900000).toISOString(),
    description: "Exponential moving average over 20 periods",
    parameters: { window: 20, price_field: "close", smoothing: 2 },
    dependencies: [],
    consumed_by_models: ["mf-btc-direction", "mf-multi-momentum"],
    tags: ["trend", "moving-average", "standard"],
    created_by: "quant_team",
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2025-11-01T09:00:00Z",
  },
  {
    id: "feat-ema-50",
    name: "ema_50",
    display_name: "EMA-50",
    shard: "CeFi",
    feature_type: "Delta-One",
    feature_group: "Technical",
    source_service: "features-delta-one-service",
    current_version: "v2.1",
    status: "active",
    symbols: ["BTC-USDT", "ETH-USDT", "SOL-USDT", "BNB-USDT", "XRP-USDT"],
    last_computed: new Date(Date.now() - 1800000).toISOString(),
    description: "Exponential moving average over 50 periods",
    parameters: { window: 50, price_field: "close", smoothing: 2 },
    dependencies: [],
    consumed_by_models: ["mf-btc-direction", "mf-multi-momentum"],
    tags: ["trend", "moving-average", "standard"],
    created_by: "quant_team",
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2026-03-20T14:30:00Z",
  },
  {
    id: "feat-rsi-14",
    name: "rsi_14",
    display_name: "RSI-14",
    shard: "CeFi",
    feature_type: "Delta-One",
    feature_group: "Technical",
    source_service: "features-delta-one-service",
    current_version: "v1.3",
    status: "active",
    symbols: [
      "BTC-USDT",
      "ETH-USDT",
      "SOL-USDT",
      "BNB-USDT",
      "XRP-USDT",
      "DOGE-USDT",
    ],
    last_computed: new Date(Date.now() - 2700000).toISOString(),
    description:
      "Relative Strength Index over 14 periods — overbought/oversold indicator",
    parameters: { window: 14, price_field: "close" },
    dependencies: [],
    consumed_by_models: ["mf-btc-direction", "mf-multi-momentum"],
    tags: ["momentum", "oscillator", "standard"],
    created_by: "quant_team",
    created_at: "2024-01-20T11:00:00Z",
    updated_at: "2025-08-15T10:00:00Z",
  },
  {
    id: "feat-macd",
    name: "macd_signal",
    display_name: "MACD Signal",
    shard: "CeFi",
    feature_type: "Delta-One",
    feature_group: "Technical",
    source_service: "features-delta-one-service",
    current_version: "v1.5",
    status: "active",
    symbols: ["BTC-USDT", "ETH-USDT", "SOL-USDT"],
    last_computed: new Date(Date.now() - 3600000).toISOString(),
    description:
      "MACD signal line — difference between 12 and 26 period EMAs, smoothed by 9-period EMA",
    parameters: { fast: 12, slow: 26, signal: 9, price_field: "close" },
    dependencies: ["feat-ema-12", "feat-ema-26"],
    consumed_by_models: ["mf-btc-direction"],
    tags: ["momentum", "trend", "standard"],
    created_by: "quant_team",
    created_at: "2024-02-01T09:00:00Z",
    updated_at: "2025-10-10T12:00:00Z",
  },
  {
    id: "feat-order-imbalance",
    name: "order_imbalance",
    display_name: "Order Imbalance",
    shard: "CeFi",
    feature_type: "Microstructure",
    feature_group: "Microstructure",
    source_service: "features-microstructure-service",
    current_version: "v3.0",
    status: "active",
    symbols: ["BTC-USDT", "ETH-USDT", "SOL-USDT"],
    last_computed: new Date(Date.now() - 60000).toISOString(),
    description:
      "Order book imbalance ratio — (bid_vol - ask_vol) / (bid_vol + ask_vol) at top 5 levels",
    parameters: { levels: 5, window_seconds: 60 },
    dependencies: [],
    consumed_by_models: ["mf-eth-volatility"],
    tags: ["microstructure", "order-book", "high-frequency"],
    created_by: "mm_team",
    created_at: "2024-03-10T14:00:00Z",
    updated_at: "2026-01-05T08:00:00Z",
  },
  // CeFi — Volatility
  {
    id: "feat-vol-regime",
    name: "volatility_regime",
    display_name: "Volatility Regime",
    shard: "CeFi",
    feature_type: "Volatility",
    feature_group: "Risk",
    source_service: "features-volatility-service",
    current_version: "v1.4",
    status: "stale",
    symbols: ["BTC-USDT", "ETH-USDT", "SOL-USDT", "BNB-USDT"],
    last_computed: new Date(Date.now() - 90000000).toISOString(),
    description:
      "HMM-based volatility regime classifier: low / medium / high / extreme",
    parameters: { lookback: 30, n_states: 4, refit_interval_days: 7 },
    dependencies: ["feat-rsi-14", "feat-atr-14"],
    consumed_by_models: ["mf-eth-volatility", "mf-btc-direction"],
    tags: ["regime", "risk", "hmm"],
    created_by: "quant_team",
    created_at: "2024-04-01T10:00:00Z",
    updated_at: "2026-03-20T14:30:00Z",
  },
  {
    id: "feat-realized-vol",
    name: "realized_vol_30d",
    display_name: "Realized Volatility 30d",
    shard: "CeFi",
    feature_type: "Volatility",
    feature_group: "Risk",
    source_service: "features-volatility-service",
    current_version: "v2.0",
    status: "active",
    symbols: ["BTC-USDT", "ETH-USDT", "SOL-USDT"],
    last_computed: new Date(Date.now() - 3600000).toISOString(),
    description:
      "Annualised realised volatility over 30 days using close-to-close returns",
    parameters: { window_days: 30, annualise: true, scaling_factor: 365 },
    dependencies: [],
    consumed_by_models: ["mf-eth-volatility"],
    tags: ["volatility", "risk", "standard"],
    created_by: "risk_team",
    created_at: "2024-02-15T11:00:00Z",
    updated_at: "2025-12-01T09:00:00Z",
  },
  // DeFi — On-Chain
  {
    id: "feat-funding-rate",
    name: "funding_rate",
    display_name: "Funding Rate",
    shard: "DeFi",
    feature_type: "On-Chain",
    feature_group: "Fundamental",
    source_service: "features-defi-service",
    current_version: "v2.1",
    status: "active",
    symbols: ["ETH-PERP", "BTC-PERP", "SOL-PERP"],
    last_computed: new Date(Date.now() - 300000).toISOString(),
    description:
      "Perpetual futures funding rate — 8-hour rolling average from Binance, OKX, Hyperliquid",
    parameters: {
      exchanges: ["BINANCE", "OKX", "HYPERLIQUID"],
      rolling_window_hours: 8,
    },
    dependencies: [],
    consumed_by_models: [],
    tags: ["funding", "perpetuals", "defi", "basis"],
    created_by: "defi_team",
    created_at: "2024-05-01T09:00:00Z",
    updated_at: "2025-11-20T14:00:00Z",
  },
  {
    id: "feat-tvl-eth",
    name: "tvl_eth",
    display_name: "ETH TVL",
    shard: "DeFi",
    feature_type: "On-Chain",
    feature_group: "Fundamental",
    source_service: "features-defi-service",
    current_version: "v1.2",
    status: "active",
    symbols: ["ETH"],
    last_computed: new Date(Date.now() - 3600000).toISOString(),
    description:
      "Total Value Locked across Ethereum DeFi protocols — Aave, Uniswap, Compound",
    parameters: {
      protocols: ["aave", "uniswap", "compound", "curve"],
      currency: "USD",
    },
    dependencies: [],
    consumed_by_models: [],
    tags: ["tvl", "defi", "on-chain", "fundamental"],
    created_by: "defi_team",
    created_at: "2024-06-01T10:00:00Z",
    updated_at: "2025-09-30T11:00:00Z",
  },
  // TradFi — Technical
  {
    id: "feat-vix-regime",
    name: "vix_regime",
    display_name: "VIX Regime",
    shard: "TradFi",
    feature_type: "Volatility",
    feature_group: "Risk",
    source_service: "features-tradfi-service",
    current_version: "v1.0",
    status: "not_computed",
    symbols: ["SPX", "NDX"],
    last_computed: null,
    description: "VIX-based market regime: calm / elevated / stressed / crisis",
    parameters: { vix_thresholds: [15, 25, 35], smoothing_days: 3 },
    dependencies: [],
    consumed_by_models: [],
    tags: ["vix", "regime", "tradfi", "risk"],
    created_by: "tradfi_team",
    created_at: "2025-10-15T09:00:00Z",
    updated_at: "2025-10-15T09:00:00Z",
  },
  // Sports
  {
    id: "feat-match-form-5",
    name: "match_form_5",
    display_name: "Match Form (5 games)",
    shard: "Sports",
    feature_type: "Sports",
    feature_group: "Fundamental",
    source_service: "features-sports-service",
    current_version: "v1.0",
    status: "active",
    symbols: ["EPL/*", "LA_LIGA/*"],
    last_computed: new Date(Date.now() - 86400000).toISOString(),
    description:
      "Team form score over last 5 matches — weighted win/draw/loss with recency bias",
    parameters: {
      window: 5,
      win_weight: 3,
      draw_weight: 1,
      loss_weight: 0,
      recency_decay: 0.9,
    },
    dependencies: [],
    consumed_by_models: [],
    tags: ["sports", "football", "form", "momentum"],
    created_by: "sports_team",
    created_at: "2025-08-01T09:00:00Z",
    updated_at: "2026-03-22T10:00:00Z",
  },
  {
    id: "feat-odds-movement",
    name: "odds_movement_1h",
    display_name: "Odds Movement (1h)",
    shard: "Sports",
    feature_type: "Sports",
    feature_group: "Microstructure",
    source_service: "features-sports-service",
    current_version: "v1.1",
    status: "active",
    symbols: ["EPL/*", "LA_LIGA/*", "NBA/*"],
    last_computed: new Date(Date.now() - 3600000).toISOString(),
    description:
      "1-hour price movement in betting odds — sharp money indicator",
    parameters: { window_minutes: 60, exchanges: ["betfair", "betdaq"] },
    dependencies: [],
    consumed_by_models: [],
    tags: ["sports", "odds", "betting", "sharp-money"],
    created_by: "sports_team",
    created_at: "2025-09-01T10:00:00Z",
    updated_at: "2026-03-22T10:00:00Z",
  },
];

export const FEATURE_VERSIONS: Record<string, FeatureVersion[]> = {
  "feat-ema-50": [
    {
      feature_id: "feat-ema-50",
      version: "v2.1",
      changed_fields: ["parameters.smoothing"],
      changed_by: "quant_researcher",
      changed_at: "2026-03-20T14:30:00Z",
      change_summary: "Adjusted smoothing factor from 2 to 2.1 for reduced lag",
      models_using_this_version: ["mf-btc-direction", "mf-multi-momentum"],
    },
    {
      feature_id: "feat-ema-50",
      version: "v2.0",
      changed_fields: ["parameters.price_field"],
      changed_by: "quant_researcher",
      changed_at: "2025-11-01T09:00:00Z",
      change_summary:
        "Changed price field from 'open' to 'close' for consistency",
      models_using_this_version: [],
    },
    {
      feature_id: "feat-ema-50",
      version: "v1.0",
      changed_fields: [],
      changed_by: "quant_team",
      changed_at: "2024-01-15T10:00:00Z",
      change_summary: "Initial version",
      models_using_this_version: [],
    },
  ],
};

// ─── Feature ETL ─────────────────────────────────────────────────────────────

export const FEATURE_ETL_SERVICES: FeatureEtlService[] = [
  {
    id: "svc-delta-one",
    name: "features-delta-one-service",
    shard: "CeFi",
    overall_pct: 78,
    shards_complete: 31,
    shards_total: 40,
    active_jobs: 2,
    failed_jobs: 0,
    last_updated: new Date(Date.now() - 600000).toISOString(),
    by_category: {
      BTC: { pct: 95, complete: 19, total: 20 },
      ETH: { pct: 85, complete: 17, total: 20 },
      SOL: { pct: 70, complete: 14, total: 20 },
      BNB: { pct: 60, complete: 12, total: 20 },
      XRP: { pct: 40, complete: 8, total: 20 },
    },
  },
  {
    id: "svc-volatility",
    name: "features-volatility-service",
    shard: "CeFi",
    overall_pct: 62,
    shards_complete: 25,
    shards_total: 40,
    active_jobs: 1,
    failed_jobs: 0,
    last_updated: new Date(Date.now() - 1200000).toISOString(),
    by_category: {
      "Realized Vol": { pct: 90, complete: 18, total: 20 },
      "Implied Vol": { pct: 55, complete: 11, total: 20 },
      "Vol Regime": { pct: 40, complete: 8, total: 20 },
    },
  },
  {
    id: "svc-defi",
    name: "features-defi-service",
    shard: "DeFi",
    overall_pct: 91,
    shards_complete: 36,
    shards_total: 40,
    active_jobs: 0,
    failed_jobs: 0,
    last_updated: new Date(Date.now() - 300000).toISOString(),
    by_category: {
      "On-Chain": { pct: 100, complete: 20, total: 20 },
      "Funding Rates": { pct: 100, complete: 20, total: 20 },
      TVL: { pct: 80, complete: 16, total: 20 },
      "Protocol Metrics": { pct: 85, complete: 17, total: 20 },
    },
  },
  {
    id: "svc-microstructure",
    name: "features-microstructure-service",
    shard: "CeFi",
    overall_pct: 55,
    shards_complete: 22,
    shards_total: 40,
    active_jobs: 0,
    failed_jobs: 1,
    last_updated: new Date(Date.now() - 3600000).toISOString(),
    by_category: {
      "Order Book": { pct: 75, complete: 15, total: 20 },
      "Trade Flow": { pct: 60, complete: 12, total: 20 },
      "Spread Analysis": { pct: 30, complete: 6, total: 20 },
    },
  },
  {
    id: "svc-sports",
    name: "features-sports-service",
    shard: "Sports",
    overall_pct: 85,
    shards_complete: 34,
    shards_total: 40,
    active_jobs: 0,
    failed_jobs: 0,
    last_updated: new Date(Date.now() - 86400000).toISOString(),
    by_category: {
      EPL: { pct: 100, complete: 20, total: 20 },
      "La Liga": { pct: 100, complete: 20, total: 20 },
      NBA: { pct: 70, complete: 14, total: 20 },
      MLB: { pct: 70, complete: 14, total: 20 },
    },
  },
];

export const FEATURE_ETL_JOBS: FeatureEtlJob[] = [
  {
    id: "etl-job-001",
    service_id: "svc-delta-one",
    shard: "CeFi",
    category: "BTC",
    date_range: { start: "2025-01-01", end: "2026-03-23" },
    progress_pct: 78,
    status: "running",
    started_at: new Date(Date.now() - 3600000).toISOString(),
    completed_at: null,
    error: null,
    shards_done: 31,
    shards_total: 40,
  },
  {
    id: "etl-job-002",
    service_id: "svc-volatility",
    shard: "CeFi",
    category: "Implied Vol",
    date_range: { start: "2025-06-01", end: "2026-03-23" },
    progress_pct: 55,
    status: "running",
    started_at: new Date(Date.now() - 7200000).toISOString(),
    completed_at: null,
    error: null,
    shards_done: 22,
    shards_total: 40,
  },
  {
    id: "etl-job-003",
    service_id: "svc-microstructure",
    shard: "CeFi",
    category: "Spread Analysis",
    date_range: { start: "2025-10-01", end: "2026-03-23" },
    progress_pct: 0,
    status: "failed",
    started_at: new Date(Date.now() - 14400000).toISOString(),
    completed_at: new Date(Date.now() - 10800000).toISOString(),
    error: "RPC timeout — Ethereum node connection reset",
    shards_done: 0,
    shards_total: 40,
  },
  {
    id: "etl-job-004",
    service_id: "svc-delta-one",
    shard: "CeFi",
    category: "XRP",
    date_range: { start: "2025-01-01", end: "2026-03-23" },
    progress_pct: 0,
    status: "queued",
    started_at: "",
    completed_at: null,
    error: null,
    shards_done: 0,
    shards_total: 40,
  },
  {
    id: "etl-job-005",
    service_id: "svc-defi",
    shard: "DeFi",
    category: "On-Chain",
    date_range: { start: "2024-01-01", end: "2026-03-23" },
    progress_pct: 100,
    status: "complete",
    started_at: new Date(Date.now() - 86400000).toISOString(),
    completed_at: new Date(Date.now() - 72000000).toISOString(),
    error: null,
    shards_done: 40,
    shards_total: 40,
  },
  {
    id: "etl-job-006",
    service_id: "svc-sports",
    shard: "Sports",
    category: "EPL",
    date_range: { start: "2022-08-01", end: "2026-03-23" },
    progress_pct: 100,
    status: "complete",
    started_at: new Date(Date.now() - 172800000).toISOString(),
    completed_at: new Date(Date.now() - 158400000).toISOString(),
    error: null,
    shards_done: 40,
    shards_total: 40,
  },
];

export const FEATURE_ETL_HISTORY: FeatureEtlJob[] = [
  ...FEATURE_ETL_JOBS.filter(
    (j) => j.status === "complete" || j.status === "failed",
  ),
  {
    id: "etl-job-history-001",
    service_id: "svc-delta-one",
    shard: "CeFi",
    category: "ETH",
    date_range: { start: "2024-01-01", end: "2025-12-31" },
    progress_pct: 100,
    status: "complete",
    started_at: new Date(Date.now() - 259200000).toISOString(),
    completed_at: new Date(Date.now() - 244800000).toISOString(),
    error: null,
    shards_done: 40,
    shards_total: 40,
  },
];

// Heatmap: feature group × shard × (week of year) completion
export const FEATURE_ETL_HEATMAP: FeatureEtlHeatmapCell[] = (() => {
  const shards = ["CeFi", "DeFi", "TradFi", "Sports"];
  const groups = [
    "Technical",
    "Volatility",
    "Microstructure",
    "Fundamental",
    "Risk",
  ];
  const cells: FeatureEtlHeatmapCell[] = [];
  // Generate last 12 weeks of heatmap data
  for (let w = 11; w >= 0; w--) {
    const d = new Date(Date.now() - w * 7 * 86400000);
    const dateStr = d.toISOString().split("T")[0];
    for (const shard of shards) {
      for (const group of groups) {
        const basePct =
          shard === "DeFi"
            ? 92
            : shard === "Sports"
              ? 85
              : shard === "TradFi"
                ? 30
                : 70;
        const variation = Math.floor(Math.random() * 20) - 10;
        const pct = Math.max(0, Math.min(100, basePct + variation - w * 3));
        cells.push({
          shard,
          feature_group: group,
          date: dateStr,
          pct,
          status: pct === 100 ? "complete" : pct > 0 ? "partial" : "missing",
        });
      }
    }
  }
  return cells;
})();

// ─── Execution Backtests ──────────────────────────────────────────────────────

// Helper: generate realistic trades for a backtest
function generateTrades(
  count: number,
  instrument: string,
  algo: string,
  startDate: string,
  basePrice: number,
  avgSlippageBps: number,
  venues: string[],
): ExecutionTrade[] {
  const trades: ExecutionTrade[] = [];
  let cumPnl = 0;
  const startMs = new Date(startDate).getTime();
  const intervalMs = (90 * 24 * 3600 * 1000) / count;

  for (let i = 0; i < count; i++) {
    const ts = new Date(startMs + i * intervalMs);
    const isEntry = i % 2 === 0;
    const signal: ExecutionTrade["signal"] = isEntry
      ? Math.random() > 0.45
        ? "LONG"
        : "SHORT"
      : "EXIT";
    const priceVariation = basePrice * (1 + (Math.random() - 0.5) * 0.1);
    const slip = (Math.random() * avgSlippageBps * 2 * priceVariation) / 10000;
    const fillPrice = priceVariation + (signal === "EXIT" ? -slip : slip);
    const slipBps =
      Math.abs((fillPrice - priceVariation) / priceVariation) * 10000;
    const pnl = isEntry ? null : (Math.random() - 0.42) * 200;
    if (pnl !== null) cumPnl += pnl;
    const venue = venues[Math.floor(Math.random() * venues.length)];
    trades.push({
      id: `trade-${i + 1}`,
      timestamp: ts.toISOString(),
      signal,
      instrument,
      signal_price: Math.round(priceVariation * 100) / 100,
      fill_price: Math.round(fillPrice * 100) / 100,
      slippage_bps: Math.round(slipBps * 10) / 10,
      fill_time_ms: Math.round(200 + Math.random() * 2000),
      venue,
      algo,
      quantity: Math.round(0.1 + Math.random() * 0.9),
      side:
        signal === "LONG"
          ? "buy"
          : signal === "SHORT"
            ? "sell"
            : Math.random() > 0.5
              ? "buy"
              : "sell",
      commission: Math.round(2 + Math.random() * 15),
      market_impact_bps: Math.round(Math.random() * avgSlippageBps * 10) / 10,
      partial_fill_pct:
        Math.random() > 0.85 ? Math.round(Math.random() * 40) : 0,
      pnl,
      cumulative_pnl: Math.round(cumPnl * 100) / 100,
      model_confidence: isEntry
        ? Math.round((0.55 + Math.random() * 0.3) * 100) / 100
        : null,
    });
  }
  return trades;
}

function makeDirectionStats(
  netProfit: number,
  sharpe: number,
  maxDD: number,
  winRate: number,
  trades: number,
): DirectionStats {
  const grossProfit = netProfit * 1.6;
  const grossLoss = grossProfit - netProfit;
  return {
    net_profit: Math.round(netProfit),
    net_profit_pct: Math.round((netProfit / 100000) * 1000) / 10,
    sharpe_ratio: Math.round(sharpe * 100) / 100,
    sortino_ratio: Math.round(sharpe * 1.45 * 100) / 100,
    max_drawdown_pct: Math.round(maxDD * 10) / 10,
    profit_factor: Math.round((grossProfit / Math.abs(grossLoss)) * 100) / 100,
    win_rate: Math.round(winRate * 10) / 10,
    total_trades: trades,
    avg_winning_trade: Math.round(grossProfit / (trades * (winRate / 100))),
    avg_losing_trade: -Math.round(
      Math.abs(grossLoss) / (trades * (1 - winRate / 100)),
    ),
    largest_winner: Math.round(grossProfit * 0.08),
    largest_loser: -Math.round(Math.abs(grossLoss) * 0.11),
    avg_trade_duration_hours: Math.round((2 + Math.random() * 6) * 10) / 10,
    max_consec_wins: Math.floor(4 + Math.random() * 6),
    max_consec_losses: Math.floor(2 + Math.random() * 4),
    gross_profit: Math.round(grossProfit),
    gross_loss: -Math.round(Math.abs(grossLoss)),
    expectancy: Math.round((netProfit / trades) * 100) / 100,
  };
}

function makeSlippageDist(mean: number, totalTrades: number): SlippageBucket[] {
  const buckets = [
    { label: "0–1 bps", lo: 0, hi: 1 },
    { label: "1–3 bps", lo: 1, hi: 3 },
    { label: "3–5 bps", lo: 3, hi: 5 },
    { label: "5–10 bps", lo: 5, hi: 10 },
    { label: ">10 bps", lo: 10, hi: Infinity },
  ];
  // Simple lognormal-ish distribution centred around mean
  const weights =
    mean < 2
      ? [0.42, 0.32, 0.14, 0.09, 0.03]
      : mean < 3.5
        ? [0.28, 0.35, 0.2, 0.12, 0.05]
        : [0.15, 0.28, 0.28, 0.2, 0.09];
  return buckets.map((b, i) => {
    const count = Math.round(totalTrades * weights[i]);
    return {
      label: b.label,
      count,
      pct: Math.round((count / totalTrades) * 1000) / 10,
    };
  });
}

function buildEquityCurve(
  seed: number,
  bias: number,
  days = 90,
): EquityPoint[] {
  const points: EquityPoint[] = [];
  let equity = 100000;
  let maxEquity = equity;
  // Use a deterministic-ish approach based on seed
  let s = seed;
  const lcg = () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
  for (let i = 0; i < days; i++) {
    const d = new Date("2025-10-01");
    d.setDate(d.getDate() + i);
    const dailyReturn = (lcg() - (0.5 - bias)) * 0.015;
    equity *= 1 + dailyReturn;
    maxEquity = Math.max(maxEquity, equity);
    const drawdown = ((equity - maxEquity) / maxEquity) * 100;
    points.push({
      date: d.toISOString().split("T")[0],
      equity: Math.round(equity),
      drawdown: Math.round(drawdown * 100) / 100,
    });
  }
  return points;
}

export const EXECUTION_EQUITY_CURVE: EquityPoint[] = buildEquityCurve(
  42,
  0.055,
);

// Per-algo equity curves for compare panel (same signals, different execution)
export const EXECUTION_COMPARE_CURVES: Record<string, EquityPoint[]> = {
  "eb-001": buildEquityCurve(101, 0.058), // VWAP — best overall
  "eb-002": buildEquityCurve(202, 0.048), // TWAP — slightly lower
  "eb-003": buildEquityCurve(303, 0.072), // Aggressive Limit — best (BTC)
};

export const EXECUTION_BACKTESTS: ExecutionBacktest[] = [
  {
    id: "eb-001",
    name: "ETH Basis — VWAP 2h",
    strategy_backtest_id: "bt-eth-basis-001",
    strategy_name: "ETH Basis Trade v3.2.1",
    algo: "VWAP",
    algo_params: {
      window_minutes: 120,
      max_participation_rate: 0.15,
      min_fill_size: 0.1,
      price_limit_bps: 10,
    },
    order_type: "Limit-then-Market",
    venues: ["BINANCE", "OKX"],
    routing: "SOR",
    slippage_model: "orderbook_based",
    execution_delay_ms: 50,
    market_impact: "square_root",
    date_range: { start: "2025-10-01", end: "2026-01-01" },
    instrument: "ETH-PERP",
    status: "complete",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    created_by: "quant_researcher",
    results: {
      net_profit: 41820,
      net_profit_pct: 41.82,
      sharpe_ratio: 1.94,
      sortino_ratio: 2.81,
      max_drawdown_pct: 12.4,
      profit_factor: 2.18,
      win_rate: 62.3,
      total_trades: 847,
      avg_trade_duration_hours: 3.2,
      avg_slippage_bps: 1.8,
      total_slippage_cost: 3240,
      avg_fill_time_seconds: 8.4,
      fill_rate_pct: 98.2,
      partial_fill_pct: 12.1,
      maker_pct: 64.3,
      total_commission: 8460,
      implementation_shortfall_bps: 2.3,
      venue_breakdown: {
        BINANCE: {
          fills: 512,
          avg_slippage_bps: 1.6,
          maker_pct: 68.1,
          avg_fill_time_s: 7.2,
        },
        OKX: {
          fills: 335,
          avg_slippage_bps: 2.1,
          maker_pct: 59.1,
          avg_fill_time_s: 9.8,
        },
      },
      buy_hold_return_pct: 28.4,
      calmar_ratio: 3.37,
      max_dd_duration_days: 4.2,
      slippage_distribution: makeSlippageDist(1.8, 847),
      slippage_mean_bps: 1.8,
      slippage_median_bps: 1.4,
      slippage_p95_bps: 5.2,
      is_breakdown: {
        total_bps: 2.3,
        total_usd: 3890,
        delay_cost_bps: 0.6,
        delay_cost_usd: 1015,
        market_impact_bps: 1.1,
        market_impact_usd: 1860,
        fees_bps: 0.6,
        fees_usd: 1015,
      },
      by_direction: {
        all: makeDirectionStats(41820, 1.94, 12.4, 62.3, 847),
        long: makeDirectionStats(26140, 2.1, 9.8, 65.1, 498),
        short: makeDirectionStats(15680, 1.72, 10.2, 58.4, 349),
      },
      trades: generateTrades(60, "ETH-PERP", "VWAP", "2025-10-01", 2800, 1.8, [
        "BINANCE",
        "OKX",
      ]),
    },
  },
  {
    id: "eb-002",
    name: "ETH Basis — TWAP 30m",
    strategy_backtest_id: "bt-eth-basis-001",
    strategy_name: "ETH Basis Trade v3.2.1",
    algo: "TWAP",
    algo_params: { interval_minutes: 30, slice_count: 12, urgency: "medium" },
    order_type: "Limit",
    venues: ["BINANCE"],
    routing: "venue-specific",
    slippage_model: "orderbook_based",
    execution_delay_ms: 30,
    market_impact: "linear",
    date_range: { start: "2025-10-01", end: "2026-01-01" },
    instrument: "ETH-PERP",
    status: "complete",
    created_at: new Date(Date.now() - 172800000).toISOString(),
    created_by: "quant_researcher",
    results: {
      net_profit: 32150,
      net_profit_pct: 32.15,
      sharpe_ratio: 1.61,
      sortino_ratio: 2.24,
      max_drawdown_pct: 14.8,
      profit_factor: 1.87,
      win_rate: 59.1,
      total_trades: 847,
      avg_trade_duration_hours: 3.2,
      avg_slippage_bps: 2.9,
      total_slippage_cost: 5220,
      avg_fill_time_seconds: 14.2,
      fill_rate_pct: 96.5,
      partial_fill_pct: 18.4,
      maker_pct: 45.2,
      total_commission: 7820,
      implementation_shortfall_bps: 3.8,
      venue_breakdown: {
        BINANCE: {
          fills: 847,
          avg_slippage_bps: 2.9,
          maker_pct: 45.2,
          avg_fill_time_s: 14.2,
        },
      },
      buy_hold_return_pct: 28.4,
      calmar_ratio: 2.17,
      max_dd_duration_days: 6.1,
      slippage_distribution: makeSlippageDist(2.9, 847),
      slippage_mean_bps: 2.9,
      slippage_median_bps: 2.2,
      slippage_p95_bps: 7.8,
      is_breakdown: {
        total_bps: 3.8,
        total_usd: 5650,
        delay_cost_bps: 1.2,
        delay_cost_usd: 1785,
        market_impact_bps: 1.7,
        market_impact_usd: 2530,
        fees_bps: 0.9,
        fees_usd: 1340,
      },
      by_direction: {
        all: makeDirectionStats(32150, 1.61, 14.8, 59.1, 847),
        long: makeDirectionStats(19800, 1.74, 11.2, 61.8, 501),
        short: makeDirectionStats(12350, 1.41, 12.4, 55.4, 346),
      },
      trades: generateTrades(60, "ETH-PERP", "TWAP", "2025-10-01", 2800, 2.9, [
        "BINANCE",
      ]),
    },
  },
  {
    id: "eb-003",
    name: "BTC Direction — Aggressive Limit",
    strategy_backtest_id: "bt-btc-dir-001",
    strategy_name: "BTC Direction v3.2.1",
    algo: "Aggressive Limit",
    algo_params: {
      limit_offset_bps: 2,
      cancel_after_seconds: 30,
      fallback_to_market: true,
    },
    order_type: "Limit-then-Market",
    venues: ["BINANCE", "OKX", "BYBIT"],
    routing: "SOR",
    slippage_model: "orderbook_based",
    execution_delay_ms: 20,
    market_impact: "square_root",
    date_range: { start: "2025-10-01", end: "2026-01-01" },
    instrument: "BTC-USDT",
    status: "complete",
    created_at: new Date(Date.now() - 259200000).toISOString(),
    created_by: "ml_engineer",
    results: {
      net_profit: 89340,
      net_profit_pct: 89.34,
      sharpe_ratio: 2.41,
      sortino_ratio: 3.12,
      max_drawdown_pct: 8.3,
      profit_factor: 2.93,
      win_rate: 68.4,
      total_trades: 312,
      avg_trade_duration_hours: 8.7,
      avg_slippage_bps: 0.9,
      total_slippage_cost: 2810,
      avg_fill_time_seconds: 4.1,
      fill_rate_pct: 99.4,
      partial_fill_pct: 4.8,
      maker_pct: 38.2,
      total_commission: 12640,
      implementation_shortfall_bps: 1.1,
      venue_breakdown: {
        BINANCE: {
          fills: 148,
          avg_slippage_bps: 0.8,
          maker_pct: 40.5,
          avg_fill_time_s: 3.8,
        },
        OKX: {
          fills: 98,
          avg_slippage_bps: 1.0,
          maker_pct: 36.7,
          avg_fill_time_s: 4.4,
        },
        BYBIT: {
          fills: 66,
          avg_slippage_bps: 1.1,
          maker_pct: 36.4,
          avg_fill_time_s: 4.9,
        },
      },
      buy_hold_return_pct: 52.1,
      calmar_ratio: 10.76,
      max_dd_duration_days: 2.1,
      slippage_distribution: makeSlippageDist(0.9, 312),
      slippage_mean_bps: 0.9,
      slippage_median_bps: 0.7,
      slippage_p95_bps: 3.1,
      is_breakdown: {
        total_bps: 1.1,
        total_usd: 1890,
        delay_cost_bps: 0.3,
        delay_cost_usd: 516,
        market_impact_bps: 0.5,
        market_impact_usd: 860,
        fees_bps: 0.3,
        fees_usd: 516,
      },
      by_direction: {
        all: makeDirectionStats(89340, 2.41, 8.3, 68.4, 312),
        long: makeDirectionStats(54820, 2.61, 6.9, 71.2, 184),
        short: makeDirectionStats(34520, 2.08, 7.4, 64.5, 128),
      },
      trades: generateTrades(
        50,
        "BTC-USDT",
        "Aggressive Limit",
        "2025-10-01",
        65000,
        0.9,
        ["BINANCE", "OKX", "BYBIT"],
      ),
    },
  },
  {
    id: "eb-004",
    name: "ETH Basis — TWAP 30m (running)",
    strategy_backtest_id: "bt-eth-basis-002",
    strategy_name: "ETH Basis Trade v3.2.1",
    algo: "TWAP",
    algo_params: { interval_minutes: 30, slice_count: 12, urgency: "low" },
    order_type: "Limit",
    venues: ["BINANCE", "OKX"],
    routing: "SOR",
    slippage_model: "fixed_bps",
    execution_delay_ms: 50,
    market_impact: "none",
    date_range: { start: "2025-10-01", end: "2026-03-01" },
    instrument: "ETH-PERP",
    status: "running",
    created_at: new Date(Date.now() - 1800000).toISOString(),
    created_by: "quant_researcher",
    results: null,
  },
];

// ─── Feature Services (Finder-style catalogue) ────────────────────────────────
// Mirrors the real sharding YAML configs in deployment-service/configs/
// Hierarchy: Service → Category/Dimension → Feature Group → Individual Features

export interface FeatureGroupEntry {
  id: string;
  name: string;
  display_name: string;
  feature_count: number;
  computed_pct: number;
  status: "healthy" | "stale" | "computing" | "failed" | "not_started";
  last_computed: string | null;
  avg_compute_minutes: number;
  description: string;
}

export interface FeatureServiceDimension {
  id: string;
  name: string;
  display_name: string;
  groups: FeatureGroupEntry[];
  total_features: number;
  computed_pct: number;
}

export interface FeatureServiceNode {
  id: string;
  name: string;
  display_name: string;
  description: string;
  docker_image_suffix: string;
  categories: FeatureServiceDimension[];
  total_features: number;
  computed_pct: number;
  active_jobs: number;
  color: string;
}

export interface IndividualFeature {
  id: string;
  name: string;
  display_name: string;
  service_id: string;
  category_id: string;
  group_id: string;
  current_version: string;
  status: "active" | "stale" | "not_computed" | "deprecated";
  last_computed: string | null;
  description: string;
  parameters: Record<string, unknown>;
  symbols: string[];
  dependencies: string[];
  consumed_by_models: string[];
  tags: string[];
}

// ── Delta-One Service ─────────────────────────────────────────────────────────

const DELTA_ONE_GROUPS: FeatureGroupEntry[] = [
  {
    id: "technical_indicators",
    name: "technical_indicators",
    display_name: "Technical Indicators",
    feature_count: 48,
    computed_pct: 92,
    status: "healthy",
    last_computed: new Date(Date.now() - 3600000).toISOString(),
    avg_compute_minutes: 45,
    description:
      "RSI, MACD, Bollinger Bands, Stochastic, ATR and 40+ derived indicators",
  },
  {
    id: "moving_averages",
    name: "moving_averages",
    display_name: "Moving Averages",
    feature_count: 24,
    computed_pct: 100,
    status: "healthy",
    last_computed: new Date(Date.now() - 7200000).toISOString(),
    avg_compute_minutes: 15,
    description: "EMA, SMA, WMA, DEMA, TEMA across multiple timeframes",
  },
  {
    id: "price_momentum",
    name: "price_momentum",
    display_name: "Price Momentum",
    feature_count: 18,
    computed_pct: 88,
    status: "healthy",
    last_computed: new Date(Date.now() - 10800000).toISOString(),
    avg_compute_minutes: 20,
    description: "ROC, MFI, CMO, Williams %R, Aroon oscillators",
  },
  {
    id: "volume_profile",
    name: "volume_profile",
    display_name: "Volume Profile",
    feature_count: 12,
    computed_pct: 75,
    status: "stale",
    last_computed: new Date(Date.now() - 86400000).toISOString(),
    avg_compute_minutes: 30,
    description: "VWAP, volume at price levels, delta volume, buy/sell ratio",
  },
  {
    id: "funding_oi",
    name: "funding_oi",
    display_name: "Funding & Open Interest",
    feature_count: 8,
    computed_pct: 100,
    status: "healthy",
    last_computed: new Date(Date.now() - 1800000).toISOString(),
    avg_compute_minutes: 10,
    description:
      "Funding rate, OI change, OI-weighted price, rolling annualised funding",
  },
  {
    id: "liquidation_intensity",
    name: "liquidation_intensity",
    display_name: "Liquidation Intensity",
    feature_count: 6,
    computed_pct: 100,
    status: "healthy",
    last_computed: new Date(Date.now() - 3600000).toISOString(),
    avg_compute_minutes: 8,
    description: "Liquidation cascades, cascade risk score",
  },
  {
    id: "premium_basis",
    name: "premium_basis",
    display_name: "Premium & Basis",
    feature_count: 10,
    computed_pct: 95,
    status: "healthy",
    last_computed: new Date(Date.now() - 7200000).toISOString(),
    avg_compute_minutes: 12,
    description:
      "Spot-perp basis, basis momentum, annualised basis, cross-exchange basis spread",
  },
  {
    id: "orderbook_imbalance",
    name: "orderbook_imbalance",
    display_name: "Orderbook Imbalance",
    feature_count: 14,
    computed_pct: 60,
    status: "stale",
    last_computed: new Date(Date.now() - 172800000).toISOString(),
    avg_compute_minutes: 25,
    description: "Bid/ask depth ratio, order imbalance at multiple levels",
  },
  {
    id: "volatility_regime",
    name: "volatility_regime",
    display_name: "Volatility Regime",
    feature_count: 16,
    computed_pct: 82,
    status: "healthy",
    last_computed: new Date(Date.now() - 14400000).toISOString(),
    avg_compute_minutes: 35,
    description:
      "Parkinson, Garman-Klass, Yang-Zhang volatility estimators; regime labels",
  },
  {
    id: "correlation_features",
    name: "correlation_features",
    display_name: "Correlation Features",
    feature_count: 20,
    computed_pct: 70,
    status: "computing",
    last_computed: new Date(Date.now() - 21600000).toISOString(),
    avg_compute_minutes: 40,
    description:
      "Rolling pairwise correlations, DCC-GARCH estimates, beta to BTC/ETH",
  },
  {
    id: "regime_labels",
    name: "regime_labels",
    display_name: "Regime Labels",
    feature_count: 6,
    computed_pct: 85,
    status: "healthy",
    last_computed: new Date(Date.now() - 28800000).toISOString(),
    avg_compute_minutes: 15,
    description: "HMM-based market regime (trending/ranging/volatile)",
  },
  {
    id: "rolling_returns",
    name: "rolling_returns",
    display_name: "Rolling Returns",
    feature_count: 12,
    computed_pct: 100,
    status: "healthy",
    last_computed: new Date(Date.now() - 3600000).toISOString(),
    avg_compute_minutes: 10,
    description:
      "1h, 4h, 24h, 7d, 30d returns, log-returns, excess returns vs BTC",
  },
  {
    id: "price_levels",
    name: "price_levels",
    display_name: "Price Levels",
    feature_count: 10,
    computed_pct: 90,
    status: "healthy",
    last_computed: new Date(Date.now() - 7200000).toISOString(),
    avg_compute_minutes: 18,
    description:
      "Support/resistance proximity, ATH/ATL distance, round-number proximity",
  },
  {
    id: "swing_outcome_targets",
    name: "swing_outcome_targets",
    display_name: "Swing Outcome Targets",
    feature_count: 8,
    computed_pct: 78,
    status: "healthy",
    last_computed: new Date(Date.now() - 14400000).toISOString(),
    avg_compute_minutes: 20,
    description:
      "Forward return labels, classification targets, magnitude bins",
  },
  {
    id: "target_labels",
    name: "target_labels",
    display_name: "Target Labels",
    feature_count: 14,
    computed_pct: 88,
    status: "healthy",
    last_computed: new Date(Date.now() - 10800000).toISOString(),
    avg_compute_minutes: 22,
    description:
      "Binary classification labels, multi-class labels, regression targets",
  },
  {
    id: "time_features",
    name: "time_features",
    display_name: "Time Features",
    feature_count: 10,
    computed_pct: 100,
    status: "healthy",
    last_computed: new Date(Date.now() - 3600000).toISOString(),
    avg_compute_minutes: 5,
    description:
      "Hour of day, day of week, sin/cos encodings, session indicators",
  },
  {
    id: "vwap_features",
    name: "vwap_features",
    display_name: "VWAP Features",
    feature_count: 8,
    computed_pct: 95,
    status: "healthy",
    last_computed: new Date(Date.now() - 7200000).toISOString(),
    avg_compute_minutes: 12,
    description: "VWAP deviation, anchored VWAP, session VWAP, VWAP bands",
  },
];

const DELTA_ONE_CATEGORIES: FeatureServiceDimension[] = [
  {
    id: "CEFI",
    name: "CEFI",
    display_name: "CeFi",
    groups: DELTA_ONE_GROUPS,
    total_features: DELTA_ONE_GROUPS.reduce((s, g) => s + g.feature_count, 0),
    computed_pct: 87,
  },
  {
    id: "TRADFI",
    name: "TRADFI",
    display_name: "TradFi",
    groups: DELTA_ONE_GROUPS.filter(
      (g) =>
        !["funding_oi", "liquidation_intensity", "premium_basis"].includes(
          g.id,
        ),
    ),
    total_features: 180,
    computed_pct: 74,
  },
  {
    id: "DEFI",
    name: "DEFI",
    display_name: "DeFi",
    groups: DELTA_ONE_GROUPS.filter((g) => g.id !== "orderbook_imbalance"),
    total_features: 195,
    computed_pct: 58,
  },
];

// ── Volatility Service ────────────────────────────────────────────────────────

const VOL_GROUPS: FeatureGroupEntry[] = [
  {
    id: "options_iv",
    name: "options_iv",
    display_name: "Options IV",
    feature_count: 32,
    computed_pct: 88,
    status: "healthy",
    last_computed: new Date(Date.now() - 14400000).toISOString(),
    avg_compute_minutes: 20,
    description:
      "Implied volatility surface, skew, term structure, put/call IV spread",
  },
  {
    id: "options_term_structure",
    name: "options_term_structure",
    display_name: "Options Term Structure",
    feature_count: 18,
    computed_pct: 85,
    status: "healthy",
    last_computed: new Date(Date.now() - 21600000).toISOString(),
    avg_compute_minutes: 20,
    description:
      "VIX-equivalent term structure, forward variance, variance risk premium",
  },
  {
    id: "futures_basis",
    name: "futures_basis",
    display_name: "Futures Basis",
    feature_count: 14,
    computed_pct: 92,
    status: "healthy",
    last_computed: new Date(Date.now() - 7200000).toISOString(),
    avg_compute_minutes: 20,
    description:
      "Futures cash basis, annualised carry, rolling futures premium/discount",
  },
  {
    id: "futures_term_structure",
    name: "futures_term_structure",
    display_name: "Futures Term Structure",
    feature_count: 12,
    computed_pct: 90,
    status: "healthy",
    last_computed: new Date(Date.now() - 10800000).toISOString(),
    avg_compute_minutes: 20,
    description: "Contango/backwardation score, curve shape, spread",
  },
];

const VOL_CATEGORIES: FeatureServiceDimension[] = [
  {
    id: "CEFI",
    name: "CEFI",
    display_name: "CeFi",
    groups: VOL_GROUPS,
    total_features: 76,
    computed_pct: 89,
  },
  {
    id: "TRADFI",
    name: "TRADFI",
    display_name: "TradFi",
    groups: VOL_GROUPS.map((g) => ({ ...g, computed_pct: g.computed_pct - 5 })),
    total_features: 76,
    computed_pct: 84,
  },
];

// ── On-Chain Service ──────────────────────────────────────────────────────────

const ONCHAIN_GROUPS: FeatureGroupEntry[] = [
  {
    id: "macro_sentiment",
    name: "macro_sentiment",
    display_name: "Macro Sentiment",
    feature_count: 22,
    computed_pct: 95,
    status: "healthy",
    last_computed: new Date(Date.now() - 3600000).toISOString(),
    avg_compute_minutes: 10,
    description:
      "Fear & greed index, crypto market dominance, stablecoin supply growth, exchange flows",
  },
  {
    id: "lending_rates",
    name: "lending_rates",
    display_name: "Lending Rates",
    feature_count: 18,
    computed_pct: 100,
    status: "healthy",
    last_computed: new Date(Date.now() - 7200000).toISOString(),
    avg_compute_minutes: 10,
    description:
      "Aave/Compound/Morpho borrow/supply rates, utilisation ratio, rate differentials",
  },
  {
    id: "lst_yields",
    name: "lst_yields",
    display_name: "LST Yields",
    feature_count: 14,
    computed_pct: 88,
    status: "healthy",
    last_computed: new Date(Date.now() - 10800000).toISOString(),
    avg_compute_minutes: 10,
    description: "stETH, rETH, cbETH yield, LST premium/discount to ETH",
  },
];

const ONCHAIN_CATEGORIES: FeatureServiceDimension[] = [
  {
    id: "CEFI",
    name: "CEFI",
    display_name: "CeFi",
    groups: ONCHAIN_GROUPS,
    total_features: 54,
    computed_pct: 94,
  },
  {
    id: "DEFI",
    name: "DEFI",
    display_name: "DeFi",
    groups: ONCHAIN_GROUPS,
    total_features: 54,
    computed_pct: 91,
  },
];

// ── Sports Service ────────────────────────────────────────────────────────────

const SPORTS_GROUPS: FeatureGroupEntry[] = [
  {
    id: "team_form",
    name: "team_form",
    display_name: "Team Form",
    feature_count: 28,
    computed_pct: 96,
    status: "healthy",
    last_computed: new Date(Date.now() - 7200000).toISOString(),
    avg_compute_minutes: 15,
    description:
      "Last 5/10 results, form rating, points per game, goals scored/conceded trend",
  },
  {
    id: "h2h",
    name: "h2h",
    display_name: "Head-to-Head",
    feature_count: 16,
    computed_pct: 100,
    status: "healthy",
    last_computed: new Date(Date.now() - 14400000).toISOString(),
    avg_compute_minutes: 15,
    description: "Historical H2H record, goals in H2H, home/away H2H splits",
  },
  {
    id: "league_stats",
    name: "league_stats",
    display_name: "League Stats",
    feature_count: 20,
    computed_pct: 92,
    status: "healthy",
    last_computed: new Date(Date.now() - 21600000).toISOString(),
    avg_compute_minutes: 15,
    description:
      "League table position, points gap to top/bottom, goals per game",
  },
  {
    id: "halftime",
    name: "halftime",
    display_name: "Halftime Patterns",
    feature_count: 14,
    computed_pct: 88,
    status: "healthy",
    last_computed: new Date(Date.now() - 28800000).toISOString(),
    avg_compute_minutes: 15,
    description:
      "HT score predictors, comeback rate, first half scoring tendency",
  },
  {
    id: "goal_timing",
    name: "goal_timing",
    display_name: "Goal Timing",
    feature_count: 12,
    computed_pct: 85,
    status: "healthy",
    last_computed: new Date(Date.now() - 36000000).toISOString(),
    avg_compute_minutes: 15,
    description:
      "Early goal rate, late goal rate, goal distribution by minute bin",
  },
  {
    id: "season_context",
    name: "season_context",
    display_name: "Season Context",
    feature_count: 10,
    computed_pct: 90,
    status: "healthy",
    last_computed: new Date(Date.now() - 43200000).toISOString(),
    avg_compute_minutes: 15,
    description:
      "Season progress, title/relegation pressure, fixture congestion",
  },
  {
    id: "venue_context",
    name: "venue_context",
    display_name: "Venue Context",
    feature_count: 14,
    computed_pct: 98,
    status: "healthy",
    last_computed: new Date(Date.now() - 7200000).toISOString(),
    avg_compute_minutes: 15,
    description:
      "Home advantage, travel distance, pitch dimensions, crowd capacity",
  },
  {
    id: "referee",
    name: "referee",
    display_name: "Referee",
    feature_count: 10,
    computed_pct: 95,
    status: "healthy",
    last_computed: new Date(Date.now() - 14400000).toISOString(),
    avg_compute_minutes: 15,
    description:
      "Referee card rate, penalty rate, home/away bias, minutes added",
  },
  {
    id: "player_lineup",
    name: "player_lineup",
    display_name: "Player Lineup",
    feature_count: 22,
    computed_pct: 78,
    status: "stale",
    last_computed: new Date(Date.now() - 172800000).toISOString(),
    avg_compute_minutes: 15,
    description: "Key player absence, squad depth score, rotation likelihood",
  },
  {
    id: "odds",
    name: "odds",
    display_name: "Odds",
    feature_count: 18,
    computed_pct: 100,
    status: "healthy",
    last_computed: new Date(Date.now() - 3600000).toISOString(),
    avg_compute_minutes: 15,
    description:
      "Opening/closing odds, line movement, overround, implied probability features",
  },
  {
    id: "xg",
    name: "xg",
    display_name: "Expected Goals (xG)",
    feature_count: 20,
    computed_pct: 90,
    status: "healthy",
    last_computed: new Date(Date.now() - 21600000).toISOString(),
    avg_compute_minutes: 15,
    description: "xG, xGA, npxG, xG difference, shot quality metrics",
  },
  {
    id: "advanced_stats",
    name: "advanced_stats",
    display_name: "Advanced Stats",
    feature_count: 24,
    computed_pct: 82,
    status: "healthy",
    last_computed: new Date(Date.now() - 36000000).toISOString(),
    avg_compute_minutes: 15,
    description:
      "PPDA, progressive passes, pressing intensity, build-up style metrics",
  },
  {
    id: "weather",
    name: "weather",
    display_name: "Weather",
    feature_count: 8,
    computed_pct: 70,
    status: "stale",
    last_computed: new Date(Date.now() - 259200000).toISOString(),
    avg_compute_minutes: 15,
    description:
      "Temperature, wind speed, precipitation probability, pitch condition",
  },
];

const SPORTS_LEAGUE_NAMES: Record<string, string> = {
  EPL: "English Premier League",
  LA_LIGA: "La Liga",
  BUNDESLIGA: "Bundesliga",
  SERIE_A: "Serie A",
  LIGUE_1: "Ligue 1",
  CHAMPIONSHIP: "Championship",
  EREDIVISIE: "Eredivisie",
  PRIMEIRA_LIGA: "Primeira Liga",
};

const SPORTS_CATEGORIES: FeatureServiceDimension[] = Object.entries(
  SPORTS_LEAGUE_NAMES,
).map(([id, displayName], i) => ({
  id,
  name: id,
  display_name: displayName,
  groups: SPORTS_GROUPS,
  total_features: SPORTS_GROUPS.reduce((s, g) => s + g.feature_count, 0),
  computed_pct: 78 + ((i * 3) % 18),
}));

// ── Calendar Service ──────────────────────────────────────────────────────────

const CALENDAR_GROUPS: FeatureGroupEntry[] = [
  {
    id: "day_of_week",
    name: "day_of_week",
    display_name: "Day of Week",
    feature_count: 8,
    computed_pct: 100,
    status: "healthy",
    last_computed: new Date(Date.now() - 3600000).toISOString(),
    avg_compute_minutes: 2,
    description:
      "One-hot DOW encoding, sin/cos encoding, weekend flag, trading day flag",
  },
  {
    id: "fomc_events",
    name: "fomc_events",
    display_name: "FOMC Events",
    feature_count: 12,
    computed_pct: 100,
    status: "healthy",
    last_computed: new Date(Date.now() - 7200000).toISOString(),
    avg_compute_minutes: 2,
    description:
      "Days to/from FOMC, FOMC decision indicator, rate change magnitude",
  },
  {
    id: "earnings_calendar",
    name: "earnings_calendar",
    display_name: "Earnings Calendar",
    feature_count: 10,
    computed_pct: 95,
    status: "healthy",
    last_computed: new Date(Date.now() - 14400000).toISOString(),
    avg_compute_minutes: 2,
    description:
      "Days to earnings, earnings surprise (prev), pre/post earnings window flags",
  },
  {
    id: "macro_indicators",
    name: "macro_indicators",
    display_name: "Macro Indicators",
    feature_count: 16,
    computed_pct: 90,
    status: "healthy",
    last_computed: new Date(Date.now() - 21600000).toISOString(),
    avg_compute_minutes: 2,
    description:
      "CPI release proximity, NFP proximity, PMI flags, yield curve features",
  },
  {
    id: "holiday_calendar",
    name: "holiday_calendar",
    display_name: "Holiday Calendar",
    feature_count: 8,
    computed_pct: 100,
    status: "healthy",
    last_computed: new Date(Date.now() - 7200000).toISOString(),
    avg_compute_minutes: 2,
    description:
      "Market holiday flags (US, UK, EU, Asia), thin liquidity period indicator",
  },
];

const CALENDAR_CATEGORIES: FeatureServiceDimension[] = [
  {
    id: "UNIVERSAL",
    name: "UNIVERSAL",
    display_name: "Universal (all shards)",
    groups: CALENDAR_GROUPS,
    total_features: CALENDAR_GROUPS.reduce((s, g) => s + g.feature_count, 0),
    computed_pct: 97,
  },
];

// ── Assembled ─────────────────────────────────────────────────────────────────

export const FEATURE_SERVICES: FeatureServiceNode[] = [
  {
    id: "delta-one",
    name: "features-delta-one-service",
    display_name: "Delta-One",
    description:
      "Technical indicators, moving averages, momentum, volume, orderbook, volatility regime and target labels",
    docker_image_suffix: "features/delta-one-service",
    categories: DELTA_ONE_CATEGORIES,
    total_features: DELTA_ONE_CATEGORIES.reduce(
      (s, c) => s + c.total_features,
      0,
    ),
    computed_pct: 82,
    active_jobs: 2,
    color: "blue",
  },
  {
    id: "volatility",
    name: "features-volatility-service",
    display_name: "Volatility",
    description: "Options IV surfaces, term structure, futures basis and carry",
    docker_image_suffix: "features/volatility-service",
    categories: VOL_CATEGORIES,
    total_features: 152,
    computed_pct: 87,
    active_jobs: 0,
    color: "violet",
  },
  {
    id: "onchain",
    name: "features-onchain-service",
    display_name: "On-Chain",
    description:
      "DeFi lending rates, LST yields, macro sentiment from on-chain protocol data",
    docker_image_suffix: "features/onchain-service",
    categories: ONCHAIN_CATEGORIES,
    total_features: 108,
    computed_pct: 93,
    active_jobs: 1,
    color: "emerald",
  },
  {
    id: "sports",
    name: "features-sports-service",
    display_name: "Sports",
    description:
      "Team form, H2H, odds, xG, lineup, weather and advanced stats for 8 football leagues",
    docker_image_suffix: "features/sports-service",
    categories: SPORTS_CATEGORIES,
    total_features: SPORTS_CATEGORIES.reduce((s, c) => s + c.total_features, 0),
    computed_pct: 88,
    active_jobs: 0,
    color: "amber",
  },
  {
    id: "calendar",
    name: "features-calendar-service",
    display_name: "Calendar",
    description:
      "Universal temporal features: day-of-week, FOMC, earnings calendar, macro events, holiday flags",
    docker_image_suffix: "features/calendar-service",
    categories: CALENDAR_CATEGORIES,
    total_features: 54,
    computed_pct: 97,
    active_jobs: 0,
    color: "pink",
  },
];

// ── Sample individual features (leaf level, keyed by group id) ────────────────

export const SAMPLE_FEATURES_BY_GROUP: Record<string, IndividualFeature[]> = {
  technical_indicators: [
    {
      id: "rsi_14_1h",
      name: "rsi_14_1h",
      display_name: "RSI-14 (1h)",
      service_id: "delta-one",
      category_id: "CEFI",
      group_id: "technical_indicators",
      current_version: "v2.1",
      status: "active",
      last_computed: new Date(Date.now() - 3600000).toISOString(),
      description: "14-period RSI on 1h candles",
      parameters: { period: 14, timeframe: "1h" },
      symbols: ["BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT"],
      dependencies: [],
      consumed_by_models: ["btc-direction-v3", "eth-vol-surface-v2"],
      tags: ["momentum", "oscillator"],
    },
    {
      id: "rsi_14_4h",
      name: "rsi_14_4h",
      display_name: "RSI-14 (4h)",
      service_id: "delta-one",
      category_id: "CEFI",
      group_id: "technical_indicators",
      current_version: "v2.1",
      status: "active",
      last_computed: new Date(Date.now() - 7200000).toISOString(),
      description: "14-period RSI on 4h candles",
      parameters: { period: 14, timeframe: "4h" },
      symbols: ["BTC/USDT", "ETH/USDT", "SOL/USDT"],
      dependencies: [],
      consumed_by_models: ["btc-direction-v3"],
      tags: ["momentum", "oscillator"],
    },
    {
      id: "macd_12_26_9",
      name: "macd_12_26_9",
      display_name: "MACD (12,26,9)",
      service_id: "delta-one",
      category_id: "CEFI",
      group_id: "technical_indicators",
      current_version: "v1.3",
      status: "active",
      last_computed: new Date(Date.now() - 3600000).toISOString(),
      description: "MACD line, signal, and histogram (12/26/9)",
      parameters: { fast: 12, slow: 26, signal: 9 },
      symbols: ["BTC/USDT", "ETH/USDT"],
      dependencies: ["ema_12_1h", "ema_26_1h"],
      consumed_by_models: ["multi-asset-momentum-v2"],
      tags: ["momentum", "trend"],
    },
    {
      id: "bb_20_2",
      name: "bb_20_2",
      display_name: "Bollinger Bands (20,2)",
      service_id: "delta-one",
      category_id: "CEFI",
      group_id: "technical_indicators",
      current_version: "v1.0",
      status: "active",
      last_computed: new Date(Date.now() - 7200000).toISOString(),
      description: "20-period Bollinger Bands with 2σ",
      parameters: { period: 20, std_dev: 2 },
      symbols: ["BTC/USDT", "ETH/USDT", "SOL/USDT"],
      dependencies: ["sma_20"],
      consumed_by_models: [],
      tags: ["volatility", "mean-reversion"],
    },
    {
      id: "atr_14",
      name: "atr_14",
      display_name: "ATR-14",
      service_id: "delta-one",
      category_id: "CEFI",
      group_id: "technical_indicators",
      current_version: "v1.1",
      status: "stale",
      last_computed: new Date(Date.now() - 86400000).toISOString(),
      description: "14-period Average True Range",
      parameters: { period: 14 },
      symbols: ["BTC/USDT", "ETH/USDT"],
      dependencies: [],
      consumed_by_models: ["btc-direction-v3"],
      tags: ["volatility"],
    },
    {
      id: "stoch_14_3",
      name: "stoch_14_3",
      display_name: "Stochastic (14,3)",
      service_id: "delta-one",
      category_id: "CEFI",
      group_id: "technical_indicators",
      current_version: "v1.0",
      status: "active",
      last_computed: new Date(Date.now() - 3600000).toISOString(),
      description: "Slow stochastic oscillator %K and %D",
      parameters: { k_period: 14, d_period: 3 },
      symbols: ["BTC/USDT", "ETH/USDT"],
      dependencies: [],
      consumed_by_models: [],
      tags: ["momentum", "oscillator"],
    },
  ],
  moving_averages: [
    {
      id: "ema_20_1h",
      name: "ema_20_1h",
      display_name: "EMA-20 (1h)",
      service_id: "delta-one",
      category_id: "CEFI",
      group_id: "moving_averages",
      current_version: "v2.0",
      status: "active",
      last_computed: new Date(Date.now() - 3600000).toISOString(),
      description: "20-period EMA on 1h candles",
      parameters: { period: 20, timeframe: "1h" },
      symbols: ["BTC/USDT", "ETH/USDT", "SOL/USDT"],
      dependencies: [],
      consumed_by_models: ["btc-direction-v3", "multi-asset-momentum-v2"],
      tags: ["trend"],
    },
    {
      id: "ema_50_1h",
      name: "ema_50_1h",
      display_name: "EMA-50 (1h)",
      service_id: "delta-one",
      category_id: "CEFI",
      group_id: "moving_averages",
      current_version: "v2.1",
      status: "active",
      last_computed: new Date(Date.now() - 3600000).toISOString(),
      description: "50-period EMA on 1h candles",
      parameters: { period: 50, timeframe: "1h" },
      symbols: ["BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT"],
      dependencies: [],
      consumed_by_models: ["btc-direction-v3"],
      tags: ["trend"],
    },
    {
      id: "sma_200_1d",
      name: "sma_200_1d",
      display_name: "SMA-200 (1d)",
      service_id: "delta-one",
      category_id: "CEFI",
      group_id: "moving_averages",
      current_version: "v1.0",
      status: "active",
      last_computed: new Date(Date.now() - 86400000).toISOString(),
      description: "200-day SMA — macro trend filter",
      parameters: { period: 200, timeframe: "1d" },
      symbols: ["BTC/USDT", "ETH/USDT"],
      dependencies: [],
      consumed_by_models: [],
      tags: ["trend", "macro"],
    },
    {
      id: "ema_200_1h",
      name: "ema_200_1h",
      display_name: "EMA-200 (1h)",
      service_id: "delta-one",
      category_id: "CEFI",
      group_id: "moving_averages",
      current_version: "v1.0",
      status: "not_computed",
      last_computed: null,
      description: "200-period EMA on 1h candles",
      parameters: { period: 200, timeframe: "1h" },
      symbols: ["BTC/USDT"],
      dependencies: [],
      consumed_by_models: [],
      tags: ["trend"],
    },
  ],
  funding_oi: [
    {
      id: "funding_rate_8h",
      name: "funding_rate_8h",
      display_name: "Funding Rate (8h)",
      service_id: "delta-one",
      category_id: "CEFI",
      group_id: "funding_oi",
      current_version: "v1.2",
      status: "active",
      last_computed: new Date(Date.now() - 1800000).toISOString(),
      description: "8h perpetual funding rate",
      parameters: { window: "8h" },
      symbols: ["BTC-PERP", "ETH-PERP", "SOL-PERP"],
      dependencies: [],
      consumed_by_models: ["eth-basis-v3"],
      tags: ["derivatives", "sentiment"],
    },
    {
      id: "oi_change_24h",
      name: "oi_change_24h",
      display_name: "OI Change (24h)",
      service_id: "delta-one",
      category_id: "CEFI",
      group_id: "funding_oi",
      current_version: "v1.0",
      status: "active",
      last_computed: new Date(Date.now() - 3600000).toISOString(),
      description: "24h open interest change (%)",
      parameters: { window: "24h" },
      symbols: ["BTC-PERP", "ETH-PERP"],
      dependencies: [],
      consumed_by_models: ["btc-direction-v3"],
      tags: ["derivatives"],
    },
    {
      id: "annualised_funding",
      name: "annualised_funding",
      display_name: "Annualised Funding",
      service_id: "delta-one",
      category_id: "CEFI",
      group_id: "funding_oi",
      current_version: "v1.0",
      status: "active",
      last_computed: new Date(Date.now() - 3600000).toISOString(),
      description: "Annualised funding rate (8h rate × 3 × 365)",
      parameters: {},
      symbols: ["BTC-PERP", "ETH-PERP"],
      dependencies: ["funding_rate_8h"],
      consumed_by_models: ["eth-basis-v3"],
      tags: ["derivatives", "carry"],
    },
  ],
  team_form: [
    {
      id: "form_l5_pts",
      name: "form_l5_pts",
      display_name: "Form L5 (pts)",
      service_id: "sports",
      category_id: "EPL",
      group_id: "team_form",
      current_version: "v1.3",
      status: "active",
      last_computed: new Date(Date.now() - 7200000).toISOString(),
      description: "Points from last 5 matches",
      parameters: { window: 5 },
      symbols: ["EPL"],
      dependencies: [],
      consumed_by_models: ["sports-outcome-v2"],
      tags: ["form"],
    },
    {
      id: "form_l10_gd",
      name: "form_l10_gd",
      display_name: "Form L10 (GD)",
      service_id: "sports",
      category_id: "EPL",
      group_id: "team_form",
      current_version: "v1.1",
      status: "active",
      last_computed: new Date(Date.now() - 14400000).toISOString(),
      description: "Goal difference from last 10 matches",
      parameters: { window: 10 },
      symbols: ["EPL"],
      dependencies: [],
      consumed_by_models: ["sports-outcome-v2"],
      tags: ["form"],
    },
    {
      id: "ppg_season",
      name: "ppg_season",
      display_name: "PPG (Season)",
      service_id: "sports",
      category_id: "EPL",
      group_id: "team_form",
      current_version: "v1.0",
      status: "active",
      last_computed: new Date(Date.now() - 21600000).toISOString(),
      description: "Points per game for the current season",
      parameters: {},
      symbols: ["EPL"],
      dependencies: [],
      consumed_by_models: [],
      tags: ["form", "season"],
    },
  ],
  macro_sentiment: [
    {
      id: "fear_greed_index",
      name: "fear_greed_index",
      display_name: "Fear & Greed Index",
      service_id: "onchain",
      category_id: "CEFI",
      group_id: "macro_sentiment",
      current_version: "v1.0",
      status: "active",
      last_computed: new Date(Date.now() - 3600000).toISOString(),
      description: "Crypto Fear & Greed Index (0–100)",
      parameters: {},
      symbols: ["CRYPTO"],
      dependencies: [],
      consumed_by_models: ["btc-direction-v3", "multi-asset-momentum-v2"],
      tags: ["sentiment", "macro"],
    },
    {
      id: "stablecoin_supply_growth",
      name: "stablecoin_supply_growth",
      display_name: "Stablecoin Supply Growth",
      service_id: "onchain",
      category_id: "CEFI",
      group_id: "macro_sentiment",
      current_version: "v1.1",
      status: "active",
      last_computed: new Date(Date.now() - 7200000).toISOString(),
      description: "7d rolling stablecoin total supply growth (%)",
      parameters: { window: "7d" },
      symbols: ["STABLES"],
      dependencies: [],
      consumed_by_models: [],
      tags: ["macro", "liquidity"],
    },
  ],
  day_of_week: [
    {
      id: "dow_sin",
      name: "dow_sin",
      display_name: "Day of Week (sin)",
      service_id: "calendar",
      category_id: "UNIVERSAL",
      group_id: "day_of_week",
      current_version: "v1.0",
      status: "active",
      last_computed: new Date(Date.now() - 3600000).toISOString(),
      description: "Sine encoding of day-of-week (cyclical)",
      parameters: {},
      symbols: ["ALL"],
      dependencies: [],
      consumed_by_models: ["btc-direction-v3"],
      tags: ["temporal"],
    },
    {
      id: "dow_cos",
      name: "dow_cos",
      display_name: "Day of Week (cos)",
      service_id: "calendar",
      category_id: "UNIVERSAL",
      group_id: "day_of_week",
      current_version: "v1.0",
      status: "active",
      last_computed: new Date(Date.now() - 3600000).toISOString(),
      description: "Cosine encoding of day-of-week (cyclical)",
      parameters: {},
      symbols: ["ALL"],
      dependencies: [],
      consumed_by_models: ["btc-direction-v3"],
      tags: ["temporal"],
    },
    {
      id: "is_weekend",
      name: "is_weekend",
      display_name: "Is Weekend",
      service_id: "calendar",
      category_id: "UNIVERSAL",
      group_id: "day_of_week",
      current_version: "v1.0",
      status: "active",
      last_computed: new Date(Date.now() - 3600000).toISOString(),
      description: "Boolean flag: Saturday or Sunday",
      parameters: {},
      symbols: ["ALL"],
      dependencies: [],
      consumed_by_models: [],
      tags: ["temporal"],
    },
  ],
};
