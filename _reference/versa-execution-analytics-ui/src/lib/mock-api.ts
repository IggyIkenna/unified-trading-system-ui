// MOCK_MODE must be evaluated in the app, not here (library build-time eval issue)
const MOCK_DELAY_MS =
  typeof import.meta !== "undefined"
    ? parseInt(import.meta.env?.VITE_MOCK_DELAY_MS || "60", 10)
    : 60;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function jsonResponse<T>(d: T, s = 200): Response {
  return new Response(JSON.stringify(d), {
    status: s,
    headers: { "Content-Type": "application/json" },
  });
}

// ---------------------------------------------------------------------------
// Backtest-job state tracker (for status-polling simulation)
// ---------------------------------------------------------------------------

const mockJobState: Record<string, { callCount: number }> = {};

// ---------------------------------------------------------------------------
// RESULTS — matches ResultSummary shape from src/api/types.ts
// ---------------------------------------------------------------------------

const MOCK_RESULTS_LIST = [
  {
    result_id: "run-001",
    config_id: "statarb_day_twap_v2",
    strategy_id: "statarb_v2",
    run_id: "run-001",
    run_path: "gs://execution-store/runs/run-001/",
    bucket: "execution-store",
    date: "2024-03-31",
    category: "crypto",
    asset: "BTC",
    strategy_description: "StatArb",
    mode: "day",
    timeframe: "1h",
    algorithm: "TWAP",
    instruction_type: "TRADE",
    net_alpha_bps: 12.4,
    gross_alpha_bps: 18.7,
    total_costs_bps: 6.3,
    net_alpha_usd: 18420.5,
    total_notional_usd: 1485000,
    pnl: 18420.5,
    sharpe_ratio: 2.31,
    win_rate: 0.618,
    total_trades: 847,
  },
  {
    result_id: "run-002",
    config_id: "mr_day_vwap_v2",
    strategy_id: "mr_v3",
    run_id: "run-002",
    run_path: "gs://execution-store/runs/run-002/",
    bucket: "execution-store",
    date: "2024-03-31",
    category: "crypto",
    asset: "ETH",
    strategy_description: "MeanReversion",
    mode: "day",
    timeframe: "4h",
    algorithm: "VWAP",
    instruction_type: "TRADE",
    net_alpha_bps: 8.9,
    gross_alpha_bps: 14.2,
    total_costs_bps: 5.3,
    net_alpha_usd: 9820.3,
    total_notional_usd: 1102000,
    pnl: 9820.3,
    sharpe_ratio: 1.84,
    win_rate: 0.589,
    total_trades: 412,
  },
  {
    result_id: "run-003",
    config_id: "trend_night_adaptive_v2",
    strategy_id: "trend_v1",
    run_id: "run-003",
    run_path: "gs://execution-store/runs/run-003/",
    bucket: "execution-store",
    date: "2024-03-31",
    category: "defi",
    asset: "UNI",
    strategy_description: "TrendFollowing",
    mode: "night",
    timeframe: "8h",
    algorithm: "ADAPTIVE_TWAP",
    instruction_type: "TRADE",
    net_alpha_bps: 6.2,
    gross_alpha_bps: 11.8,
    total_costs_bps: 5.6,
    net_alpha_usd: 5240.7,
    total_notional_usd: 845000,
    pnl: 5240.7,
    sharpe_ratio: 1.42,
    win_rate: 0.557,
    total_trades: 183,
  },
  {
    result_id: "run-004",
    config_id: "mm_day_benchmark_v1",
    strategy_id: "mm_v2",
    run_id: "run-004",
    run_path: "gs://execution-store/runs/run-004/",
    bucket: "execution-store",
    date: "2024-03-31",
    category: "equities",
    asset: "AAPL",
    strategy_description: "MarketMaking",
    mode: "day",
    timeframe: "1h",
    algorithm: "BENCHMARK_FILL",
    instruction_type: "TRADE",
    net_alpha_bps: 3.8,
    gross_alpha_bps: 7.2,
    total_costs_bps: 3.4,
    net_alpha_usd: 3890.2,
    total_notional_usd: 1023000,
    pnl: 3890.2,
    sharpe_ratio: 1.12,
    win_rate: 0.531,
    total_trades: 2847,
  },
  {
    result_id: "run-005",
    config_id: "statarb_night_vwap_v2",
    strategy_id: "statarb_v2",
    run_id: "run-005",
    run_path: "gs://execution-store/runs/run-005/",
    bucket: "execution-store",
    date: "2024-03-30",
    category: "crypto",
    asset: "SOL",
    strategy_description: "StatArb",
    mode: "night",
    timeframe: "4h",
    algorithm: "VWAP",
    instruction_type: "TRADE",
    net_alpha_bps: -2.1,
    gross_alpha_bps: 4.8,
    total_costs_bps: 6.9,
    net_alpha_usd: -1420.0,
    total_notional_usd: 676190,
    pnl: -1420.0,
    sharpe_ratio: 0.34,
    win_rate: 0.472,
    total_trades: 294,
  },
  {
    result_id: "run-006",
    config_id: "mr_night_adaptive_v2",
    strategy_id: "mr_v3",
    run_id: "run-006",
    run_path: "gs://execution-store/runs/run-006/",
    bucket: "execution-store",
    date: "2024-03-30",
    category: "defi",
    asset: "AAVE",
    strategy_description: "MeanReversion",
    mode: "night",
    timeframe: "8h",
    algorithm: "ADAPTIVE_TWAP",
    instruction_type: "LEND",
    net_alpha_bps: 15.3,
    gross_alpha_bps: 22.1,
    total_costs_bps: 6.8,
    net_alpha_usd: 22890.0,
    total_notional_usd: 1495000,
    pnl: 22890.0,
    sharpe_ratio: 3.12,
    win_rate: 0.701,
    total_trades: 156,
  },
];

const MOCK_FILTERS = {
  categories: ["crypto", "equities", "defi"],
  assets: ["BTC", "ETH", "UNI", "AAPL", "SOL", "AAVE"],
  strategies: [
    "StatArb",
    "MeanReversion",
    "TrendFollowing",
    "MarketMaking",
  ],
  algorithms: ["TWAP", "VWAP", "ADAPTIVE_TWAP", "BENCHMARK_FILL"],
  timeframes: ["1h", "4h", "8h"],
  instruction_types: ["TRADE", "LEND"],
  modes: ["day", "night"],
};

// ---------------------------------------------------------------------------
// EXECUTION ALPHA — matches ExecutionAlphaData shape from DeepDive.tsx
// ---------------------------------------------------------------------------

function makeMockExecutionAlpha(runId: string) {
  const base = 43000 + MOCK_RESULTS_LIST.findIndex((r) => r.run_id === runId) * 500;
  const entryFills = Array.from({ length: 12 }, (_, i) => ({
    order_id: `ord-${runId}-e${i + 1}`,
    timestamp: new Date(Date.UTC(2024, 0, 2, 9, 30) + i * 3600000).toISOString(),
    fill_price: base + Math.sin(i / 3) * 200 + (i % 2 === 0 ? -30 : 20),
    benchmark_price: base + Math.sin(i / 3) * 200,
    slippage_bps: (i % 2 === 0 ? -3.1 : 8.4) + i * 0.7,
    notional_usd: 10000 + i * 1500,
    notional: 10000 + i * 1500,
    direction: 1,
    net_alpha_bps: (i % 2 === 0 ? -3.1 : 8.4) + i * 0.7,
    quantity: 0.15 + i * 0.02,
    alpha_bps: (i % 2 === 0 ? -3.1 : 8.4) + i * 0.7,
  }));

  const exitFills = Array.from({ length: 10 }, (_, i) => ({
    order_id: `ord-${runId}-x${i + 1}`,
    timestamp: new Date(Date.UTC(2024, 0, 2, 11, 0) + i * 3600000).toISOString(),
    fill_price: base + 150 + Math.sin(i / 3) * 180 + (i % 2 === 0 ? 25 : -15),
    benchmark_price: base + 150 + Math.sin(i / 3) * 180,
    slippage_bps: (i % 2 === 0 ? 5.2 : -2.8) + i * 0.5,
    notional_usd: 10200 + i * 1400,
    notional: 10200 + i * 1400,
    direction: -1,
    net_alpha_bps: (i % 2 === 0 ? 5.2 : -2.8) + i * 0.5,
    quantity: 0.15 + i * 0.02,
    alpha_bps: (i % 2 === 0 ? 5.2 : -2.8) + i * 0.5,
    exit_type: i % 3 === 0 ? "TP" : i % 3 === 1 ? "SL" : "CANDLE_CLOSE",
  }));

  const equityCurve = Array.from({ length: 50 }, (_, i) => {
    const cumAlphaUsd = 200 * i + Math.sin(i / 5) * 800;
    return {
      timestamp: new Date(Date.UTC(2024, 0, 2, 9, 30) + i * 1800000).toISOString(),
      cumulative_alpha_usd: cumAlphaUsd,
      cumulative_alpha_bps: cumAlphaUsd / 100,
      cumulative_notional_usd: 10000 + i * 3000,
      fill_type: i % 4 === 0 ? "EXIT" : "ENTRY",
    };
  });

  return {
    available: true,
    run_path: `gs://execution-store/runs/${runId}/`,
    summary: {
      vw_entry_slippage_bps: 4.2,
      vw_exit_slippage_bps: 3.1,
      vw_net_alpha_bps: 12.4,
      total_notional_usd: 148500,
      total_costs_bps: 6.3,
      num_entries: entryFills.length,
      num_exits: exitFills.length,
      tp_hits: exitFills.filter((f) => f.exit_type === "TP").length,
      sl_hits: exitFills.filter((f) => f.exit_type === "SL").length,
      candle_close_exits: exitFills.filter((f) => f.exit_type === "CANDLE_CLOSE").length,
      // For the Analysis page shape (different field names)
      vw_gross_entry_alpha_bps: 8.2,
      vw_gross_exit_alpha_bps: 4.2,
      vw_total_costs_bps: 6.3,
      net_alpha_usd: 18420.5,
      benchmark_price: base,
    },
    entry_fills: entryFills,
    exit_fills: exitFills,
    equity_curve: equityCurve,
  };
}

// ---------------------------------------------------------------------------
// RESULT DETAILS (for /results/:id)
// ---------------------------------------------------------------------------

function makeMockResultDetails(runId: string) {
  const idx = MOCK_RESULTS_LIST.findIndex((r) => r.run_id === runId);
  const base = idx >= 0 ? MOCK_RESULTS_LIST[idx] : MOCK_RESULTS_LIST[0];
  const basePrice = 42000 + idx * 500;

  const orders = Array.from({ length: 20 }, (_, j) => ({
    id: `order-${runId}-${j + 1}`,
    timestamp: new Date(Date.UTC(2024, 0, 2) + j * 3600000).toISOString(),
    side: j % 3 === 0 ? "SELL" : "BUY",
    price: basePrice + (Math.sin(j) * 500),
    amount: 0.1 + (j % 5) * 0.12,
    status: (["FILLED", "FILLED", "FILLED", "REJECTED"] as const)[j % 4],
    exec_algorithm: (["TWAP", "VWAP", "ADAPTIVE_TWAP"] as const)[j % 3],
    parent_order_id: j > 0 ? `order-${runId}-${j}` : undefined,
  }));

  const fills = Array.from({ length: 40 }, (_, j) => ({
    order_id: `order-${runId}-${Math.floor(j / 2) + 1}`,
    timestamp: new Date(Date.UTC(2024, 0, 2) + j * 1800000).toISOString(),
    side: j % 2 === 0 ? "buy" : "sell",
    price: basePrice + Math.sin(j / 4) * 300,
    quantity: 0.05 + (j % 4) * 0.05,
    alpha_bps: (j % 3 === 0 ? -4.2 : 7.8) + j * 0.3,
  }));

  const equity_curve = Array.from({ length: 90 }, (_, k) => ({
    timestamp: new Date(Date.UTC(2024, 0, 1) + k * 86400000).toISOString(),
    portfolio_value: 100000 * (1 + (idx + 1) * 0.0015 * k + 0.01 * Math.sin(k / 5)),
    cash: 50000 + k * 200,
    positions_value: 50000 * (1 + (idx + 1) * 0.002 * k),
  }));

  return {
    summary: base,
    orders,
    fills,
    equity_curve,
    timeline: [],
    execution_alpha: makeMockExecutionAlpha(runId),
  };
}

// ---------------------------------------------------------------------------
// RECON BREAKS
// ---------------------------------------------------------------------------

const MOCK_RECON_BREAKS = [
  {
    break_id: "brk-001",
    strategy: "StatArb",
    date: "2024-01-15",
    type: "POSITION_MISMATCH",
    expected_qty: 0.42,
    actual_qty: 0.38,
    delta_qty: -0.04,
    symbol: "BTC-USDT",
    venue: "BINANCE",
    severity: "HIGH",
    resolved: false,
  },
  {
    break_id: "brk-002",
    strategy: "MeanReversion",
    date: "2024-01-14",
    type: "PNL_BREAK",
    expected_qty: 1250.4,
    actual_qty: 1198.8,
    delta_qty: -51.6,
    symbol: "ETH-USD",
    venue: "COINBASE",
    severity: "MEDIUM",
    resolved: false,
  },
  {
    break_id: "brk-003",
    strategy: "TrendFollowing",
    date: "2024-01-13",
    type: "FILL_MISMATCH",
    expected_qty: 0.15,
    actual_qty: 0.15,
    delta_qty: 0.0,
    symbol: "UNI-USDT",
    venue: "BINANCE",
    severity: "LOW",
    resolved: true,
  },
  {
    break_id: "brk-004",
    strategy: "MarketMaking",
    date: "2024-01-12",
    type: "FEE_DISCREPANCY",
    expected_qty: 12.4,
    actual_qty: 18.7,
    delta_qty: 6.3,
    symbol: "AAPL",
    venue: "NYSE",
    severity: "MEDIUM",
    resolved: false,
  },
];

// ---------------------------------------------------------------------------
// BACKTEST RESULTS (legacy endpoint)
// ---------------------------------------------------------------------------

const MOCK_BACKTEST_RESULTS = [
  {
    id: "bt-001",
    strategy: "StatArb_v3",
    status: "completed",
    sharpe: 2.34,
    maxDrawdown: 0.042,
    totalReturn: 0.187,
    tradeCount: 8472,
    winRate: 0.623,
    profitFactor: 2.1,
    startDate: "2024-01-01",
    endDate: "2024-03-31",
    equity: Array.from({ length: 60 }, (_, i) => ({
      date: new Date(Date.UTC(2024, 0, 1) + i * 86400000).toISOString().slice(0, 10),
      value: 1000000 + i * 3100 + (i % 7) * 1200,
    })),
    venues: [
      { venue: "Binance", trades: 4210, pnl: 156000 },
      { venue: "OKX", trades: 2180, pnl: 89000 },
      { venue: "Bybit", trades: 2082, pnl: 43000 },
    ],
    dailyPnl: Array.from({ length: 60 }, (_, i) => ({
      date: new Date(Date.UTC(2024, 0, 1) + i * 86400000).toISOString().slice(0, 10),
      pnl: (i % 3 === 0 ? -15000 : 22000) + i * 400,
      cumPnl: i * 3100 + (i % 5) * 2000,
    })),
  },
  {
    id: "bt-002",
    strategy: "MeanReversion_v3",
    status: "completed",
    sharpe: 1.84,
    maxDrawdown: 0.098,
    totalReturn: 0.142,
    tradeCount: 412,
    winRate: 0.589,
    profitFactor: 1.72,
    startDate: "2024-01-01",
    endDate: "2024-03-31",
    equity: Array.from({ length: 60 }, (_, i) => ({
      date: new Date(Date.UTC(2024, 0, 1) + i * 86400000).toISOString().slice(0, 10),
      value: 800000 + i * 1900 + (i % 9) * 800,
    })),
    venues: [
      { venue: "Coinbase", trades: 280, pnl: 71000 },
      { venue: "Kraken", trades: 132, pnl: 42000 },
    ],
    dailyPnl: Array.from({ length: 60 }, (_, i) => ({
      date: new Date(Date.UTC(2024, 0, 1) + i * 86400000).toISOString().slice(0, 10),
      pnl: (i % 4 === 0 ? -8000 : 14000) + i * 250,
      cumPnl: i * 1900 + (i % 6) * 1000,
    })),
  },
];

// ---------------------------------------------------------------------------
// CONFIGS
// ---------------------------------------------------------------------------

const MOCK_CONFIGS = [
  {
    path: "configs/v2/statarb_day_twap.json",
    filename: "statarb_day_twap.json",
    version: "V2",
    strategyBase: "StatArb",
    mode: "day",
    timeframe: "1h",
  },
  {
    path: "configs/v2/statarb_day_vwap.json",
    filename: "statarb_day_vwap.json",
    version: "V2",
    strategyBase: "StatArb",
    mode: "day",
    timeframe: "4h",
  },
  {
    path: "configs/v2/mr_day_vwap.json",
    filename: "mr_day_vwap.json",
    version: "V2",
    strategyBase: "MeanReversion",
    mode: "day",
    timeframe: "4h",
  },
  {
    path: "configs/v2/mr_night_adaptive.json",
    filename: "mr_night_adaptive.json",
    version: "V2",
    strategyBase: "MeanReversion",
    mode: "night",
    timeframe: "8h",
  },
  {
    path: "configs/v2/trend_night_adaptive.json",
    filename: "trend_night_adaptive.json",
    version: "V2",
    strategyBase: "TrendFollowing",
    mode: "night",
    timeframe: "8h",
  },
  {
    path: "configs/v1/mm_day_benchmark.json",
    filename: "mm_day_benchmark.json",
    version: "V1",
    strategyBase: "MarketMaking",
    mode: "day",
    timeframe: "1h",
  },
];

const MOCK_CONFIG_CONTENT = {
  config_id: "statarb_day_twap_v2",
  strategy_id: "statarb_v2",
  config_version: "V2",
  category: "crypto",
  asset: "BTC",
  strategy_base: "StatArb",
  execution_mode: "day",
  timeframe: "1h",
  timeframe_seconds: 3600,
  instruments: {
    primary: ["BINANCE:SPOT:BTC-USDT", "COINBASE:SPOT:BTC-USD"],
    related_balance: ["BINANCE:SPOT:USDT", "COINBASE:SPOT:USD"],
  },
  execution: {
    entry: { algorithm: "TWAP", params: { horizon_seconds: 600, urgency: 0.4 } },
    exit: { algorithm: "TWAP", params: { horizon_seconds: 300, urgency: 0.6 } },
  },
  venue: "BINANCE",
};

// ---------------------------------------------------------------------------
// INSTRUMENTS
// ---------------------------------------------------------------------------

const MOCK_INSTRUMENT_CATEGORIES = [
  {
    category: "crypto",
    venues: ["BINANCE", "COINBASE", "KRAKEN", "OKX"],
    instrumentTypes: ["SPOT", "PERPETUAL", "FUTURES"],
    dates: ["2024-01-01", "2024-01-02", "2024-01-03"],
  },
  {
    category: "equities",
    venues: ["NYSE", "NASDAQ"],
    instrumentTypes: ["STOCK"],
    dates: ["2024-01-02", "2024-01-03", "2024-01-04"],
  },
  {
    category: "defi",
    venues: ["UNISWAP_V3", "AAVE_V3", "CURVE"],
    instrumentTypes: ["POOL", "LEND_TOKEN"],
    dates: ["2024-01-01", "2024-01-02"],
  },
];

const MOCK_INSTRUMENTS_DATA = [
  {
    instrument_key: "BINANCE:SPOT:BTC-USDT",
    instrumentId: "BINANCE:SPOT:BTC-USDT",
    instrumentType: "SPOT",
    instrument_type: "SPOT",
    venue: "BINANCE",
    symbol: "BTC-USDT",
    base_currency: "BTC",
    quote_currency: "USDT",
    baseCurrency: "BTC",
    quoteCurrency: "USDT",
    minSize: 0.00001,
    maxSize: 9000,
    tickSize: 0.01,
    tick_size: 0.01,
    lot_size: 0.00001,
  },
  {
    instrument_key: "BINANCE:SPOT:ETH-USDT",
    instrumentId: "BINANCE:SPOT:ETH-USDT",
    instrumentType: "SPOT",
    instrument_type: "SPOT",
    venue: "BINANCE",
    symbol: "ETH-USDT",
    base_currency: "ETH",
    quote_currency: "USDT",
    baseCurrency: "ETH",
    quoteCurrency: "USDT",
    minSize: 0.0001,
    maxSize: 10000,
    tickSize: 0.01,
    tick_size: 0.01,
    lot_size: 0.0001,
  },
  {
    instrument_key: "BINANCE:PERPETUAL:BTC-USDT-PERP",
    instrumentId: "BINANCE:PERPETUAL:BTC-USDT-PERP",
    instrumentType: "PERPETUAL",
    instrument_type: "PERPETUAL",
    venue: "BINANCE",
    symbol: "BTCUSDT",
    base_currency: "BTC",
    quote_currency: "USDT",
    baseCurrency: "BTC",
    quoteCurrency: "USDT",
    minSize: 0.001,
    contractSize: 1,
    fundingRate: 0.0001,
    tick_size: 0.1,
  },
  {
    instrument_key: "COINBASE:SPOT:BTC-USD",
    instrumentId: "COINBASE:SPOT:BTC-USD",
    instrumentType: "SPOT",
    instrument_type: "SPOT",
    venue: "COINBASE",
    symbol: "BTC-USD",
    base_currency: "BTC",
    quote_currency: "USD",
    baseCurrency: "BTC",
    quoteCurrency: "USD",
    minSize: 0.0001,
    maxSize: 500,
    tickSize: 0.01,
    tick_size: 0.01,
  },
  {
    instrument_key: "NYSE:STOCK:AAPL",
    instrumentId: "NYSE:STOCK:AAPL",
    instrumentType: "STOCK",
    instrument_type: "STOCK",
    venue: "NYSE",
    symbol: "AAPL",
    base_currency: "USD",
    quote_currency: "USD",
    minSize: 1,
    maxSize: 10000000,
    tickSize: 0.01,
    tick_size: 0.01,
    lot_size: 1,
  },
  {
    instrument_key: "NASDAQ:STOCK:MSFT",
    instrumentId: "NASDAQ:STOCK:MSFT",
    instrumentType: "STOCK",
    instrument_type: "STOCK",
    venue: "NASDAQ",
    symbol: "MSFT",
    base_currency: "USD",
    quote_currency: "USD",
    minSize: 1,
    maxSize: 10000000,
    tickSize: 0.01,
    tick_size: 0.01,
    lot_size: 1,
  },
  {
    instrument_key: "UNISWAP_V3:POOL:WBTC-USDC-0.3@ethereum",
    instrumentId: "UNISWAP_V3:POOL:WBTC-USDC-0.3@ethereum",
    instrumentType: "POOL",
    instrument_type: "POOL",
    venue: "UNISWAP_V3",
    symbol: "WBTC/USDC",
    base_currency: "WBTC",
    quote_currency: "USDC",
    chain: "ethereum",
    feeTier: 3000,
    pool_fee_tier: 3000,
    tick_size: 0.01,
  },
  {
    instrument_key: "KRAKEN:SPOT:ETH-USD",
    instrumentId: "KRAKEN:SPOT:ETH-USD",
    instrumentType: "SPOT",
    instrument_type: "SPOT",
    venue: "KRAKEN",
    symbol: "ETH/USD",
    base_currency: "ETH",
    quote_currency: "USD",
    baseCurrency: "ETH",
    quoteCurrency: "USD",
    minSize: 0.002,
    tick_size: 0.01,
  },
];

// ---------------------------------------------------------------------------
// TICK DATA
// ---------------------------------------------------------------------------

const MOCK_TICK_CATEGORIES = [
  {
    category: "crypto",
    instrumentTypes: ["SPOT", "PERPETUAL"],
    dates: [
      "2024-01-01",
      "2024-01-02",
      "2024-01-03",
      "2024-01-04",
      "2024-01-05",
    ],
  },
  {
    category: "equities",
    instrumentTypes: ["STOCK"],
    dates: ["2024-01-02", "2024-01-03", "2024-01-04", "2024-01-05"],
  },
];

function generateTicks(basePrice = 43000) {
  return Array.from({ length: 500 }, (_, i) => {
    const ts = Date.UTC(2024, 0, 2, 9, 30) + i * 10000;
    return {
      timestamp: ts,
      timestamp_formatted: new Date(ts).toLocaleTimeString(),
      price:
        basePrice +
        Math.sin(i / 20) * 200 +
        (i % 2 === 0 ? -25 : 25) +
        i * 0.5,
      size: 0.01 + (i % 10) * 0.2,
      side: i % 2 === 0 ? "buy" : "sell",
    };
  });
}

// ---------------------------------------------------------------------------
// STRATEGIES + INSTRUCTIONS
// ---------------------------------------------------------------------------

const MOCK_STRATEGIES = [
  {
    strategyId: "statarb_v2",
    dates: ["2024-01-02", "2024-01-03", "2024-01-04", "2024-01-05"],
  },
  {
    strategyId: "mr_v3",
    dates: ["2024-01-02", "2024-01-03", "2024-01-04", "2024-01-05"],
  },
  {
    strategyId: "trend_v1",
    dates: ["2024-01-03", "2024-01-04", "2024-01-05"],
  },
  {
    strategyId: "mm_v2",
    dates: ["2024-01-02", "2024-01-03", "2024-01-04"],
  },
];

function generateInstructions(strategyId: string, date: string) {
  return Array.from({ length: 50 }, (_, i) => {
    const hour = 9 + Math.floor(i / 6);
    const minute = (i % 6) * 10;
    const ts = new Date(
      `${date}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00Z`,
    ).toISOString();
    return {
      timestamp: ts,
      timestamp_formatted: new Date(ts).toLocaleTimeString(),
      instruction_id: `inst-${strategyId}-${date}-${i + 1}`,
      instruction_type: i % 7 === 0 ? "HEARTBEAT" : "TRADE",
      direction: i % 2 === 0 ? 1 : -1,
      instrument_id: [
        "BINANCE:SPOT:BTC-USDT",
        "COINBASE:SPOT:ETH-USD",
        "KRAKEN:SPOT:ETH-USD",
      ][i % 3],
      strategy_id: strategyId,
      quantity: 0.1 + (i % 8) * 0.1,
      benchmark_price: 43000 + Math.sin(i / 5) * 500 + i * 10,
    };
  });
}

// ---------------------------------------------------------------------------
// BUCKETS + PREFIXES
// ---------------------------------------------------------------------------

const MOCK_BUCKETS = [
  {
    name: "execution-store-prod",
    location: "ASIA-NORTHEAST1",
    storage_class: "STANDARD",
  },
  {
    name: "execution-store-staging",
    location: "ASIA-NORTHEAST1",
    storage_class: "STANDARD",
  },
  {
    name: "backtest-results-dev",
    location: "US-CENTRAL1",
    storage_class: "NEARLINE",
  },
];

const MOCK_PREFIXES = [
  { prefix: "runs/2024-Q1/", name: "2024-Q1", has_results: true },
  { prefix: "runs/2024-Q1/statarb/", name: "statarb", has_results: true },
  { prefix: "runs/2024-Q1/mr/", name: "mr", has_results: true },
  { prefix: "runs/2024-Q1/trend/", name: "trend", has_results: true },
  { prefix: "runs/2024-Q1/mm/", name: "mm", has_results: false },
];

// ---------------------------------------------------------------------------
// DEPLOYMENT
// ---------------------------------------------------------------------------

const MOCK_DEPLOYMENT = {
  deployment_id: "dep-mock-001",
  service: "execution-services",
  status: "completed",
  total_shards: 24,
  completed_shards: 22,
  failed_shards: 1,
  running_shards: 0,
  pending_shards: 1,
  created_at: "2024-01-15T08:00:00Z",
  updated_at: "2024-01-15T09:30:00Z",
  shards: [
    {
      shard_id: "shard-001",
      dimensions: { strategy: "StatArb", date: "2024-01-02" },
      cli_args: ["--strategy", "StatArb", "--date", "2024-01-02"],
      status: "completed",
    },
    {
      shard_id: "shard-002",
      dimensions: { strategy: "StatArb", date: "2024-01-03" },
      cli_args: ["--strategy", "StatArb", "--date", "2024-01-03"],
      status: "completed",
    },
    {
      shard_id: "shard-003",
      dimensions: { strategy: "MeanReversion", date: "2024-01-02" },
      cli_args: ["--strategy", "MeanReversion", "--date", "2024-01-02"],
      status: "failed",
    },
  ],
};

// ---------------------------------------------------------------------------
// DATA-STATUS response (matches DataStatusResponse from deploymentClient.ts)
// ---------------------------------------------------------------------------

const MOCK_DATA_STATUS = {
  config_path: "gs://execution-store-prod/configs/v2/",
  version: "v2",
  total_configs: 12,
  configs_with_results: 9,
  missing_count: 3,
  completion_pct: 75.0,
  strategy_count: 3,
  strategies: [
    {
      strategy: "StatArb",
      total: 4,
      with_results: 4,
      completion_pct: 100.0,
      result_dates: ["2024-01-02", "2024-01-03", "2024-01-04", "2024-01-05"],
      result_date_count: 4,
      modes: [
        {
          mode: "day",
          total: 4,
          with_results: 4,
          completion_pct: 100.0,
          timeframes: [
            {
              timeframe: "1h",
              total: 2,
              with_results: 2,
              completion_pct: 100.0,
              missing_configs: [],
              configs: [
                {
                  config_file: "statarb_day_twap.json",
                  algo_name: "TWAP",
                  result_strategy_id: "statarb_v2",
                  has_results: true,
                  result_dates: ["2024-01-02", "2024-01-03", "2024-01-04", "2024-01-05"],
                  dates_found_count: 4,
                  completion_pct: 100.0,
                },
              ],
            },
          ],
        },
      ],
    },
    {
      strategy: "MeanReversion",
      total: 4,
      with_results: 3,
      completion_pct: 75.0,
      result_dates: ["2024-01-02", "2024-01-03", "2024-01-04"],
      result_date_count: 3,
      modes: [
        {
          mode: "day",
          total: 2,
          with_results: 2,
          completion_pct: 100.0,
          timeframes: [
            {
              timeframe: "4h",
              total: 1,
              with_results: 1,
              completion_pct: 100.0,
              missing_configs: [],
              configs: [
                {
                  config_file: "mr_day_vwap.json",
                  algo_name: "VWAP",
                  result_strategy_id: "mr_v3",
                  has_results: true,
                  result_dates: ["2024-01-02", "2024-01-03", "2024-01-04"],
                  dates_found_count: 3,
                  completion_pct: 75.0,
                },
              ],
            },
          ],
        },
      ],
    },
    {
      strategy: "TrendFollowing",
      total: 4,
      with_results: 2,
      completion_pct: 50.0,
      result_dates: ["2024-01-03", "2024-01-04"],
      result_date_count: 2,
      modes: [
        {
          mode: "night",
          total: 2,
          with_results: 2,
          completion_pct: 100.0,
          timeframes: [
            {
              timeframe: "8h",
              total: 1,
              with_results: 1,
              completion_pct: 100.0,
              missing_configs: [],
              configs: [
                {
                  config_file: "trend_night_adaptive.json",
                  algo_name: "ADAPTIVE_TWAP",
                  result_strategy_id: "trend_v1",
                  has_results: true,
                  result_dates: ["2024-01-03", "2024-01-04"],
                  dates_found_count: 2,
                  completion_pct: 50.0,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  breakdown_by_mode: {
    day: { total: 8, with_results: 7, missing_count: 1, completion_pct: 87.5, missing_samples: [] },
    night: { total: 4, with_results: 2, missing_count: 2, completion_pct: 50.0, missing_samples: ["trend_night_adaptive.json:2024-01-02"] },
  },
  breakdown_by_timeframe: {
    "1h": { total: 4, with_results: 4, missing_count: 0, completion_pct: 100.0, missing_samples: [] },
    "4h": { total: 4, with_results: 3, missing_count: 1, completion_pct: 75.0, missing_samples: [] },
    "8h": { total: 4, with_results: 2, missing_count: 2, completion_pct: 50.0, missing_samples: [] },
  },
  breakdown_by_algo: {
    TWAP: { total: 4, with_results: 4, missing_count: 0, completion_pct: 100.0, missing_samples: [] },
    VWAP: { total: 4, with_results: 3, missing_count: 1, completion_pct: 75.0, missing_samples: [] },
    ADAPTIVE_TWAP: { total: 4, with_results: 2, missing_count: 2, completion_pct: 50.0, missing_samples: [] },
  },
  date_filter: { start: "2024-01-01", end: "2024-03-31" },
};

// ---------------------------------------------------------------------------
// MISSING SHARDS response
// ---------------------------------------------------------------------------

const MOCK_MISSING_SHARDS = {
  missing_shards: [
    {
      config_gcs: "gs://execution-store-prod/configs/v2/mr_day_vwap.json",
      date: "2024-01-05",
      strategy: "MeanReversion",
      mode: "day",
      timeframe: "4h",
      algo: "VWAP",
    },
    {
      config_gcs: "gs://execution-store-prod/configs/v2/trend_night_adaptive.json",
      date: "2024-01-01",
      strategy: "TrendFollowing",
      mode: "night",
      timeframe: "8h",
      algo: "ADAPTIVE_TWAP",
    },
    {
      config_gcs: "gs://execution-store-prod/configs/v2/trend_night_adaptive.json",
      date: "2024-01-02",
      strategy: "TrendFollowing",
      mode: "night",
      timeframe: "8h",
      algo: "ADAPTIVE_TWAP",
    },
  ],
  total_missing: 3,
  total_configs: 12,
  total_dates: 90,
  breakdown: {
    by_strategy: { MeanReversion: 1, TrendFollowing: 2 },
    by_mode: { day: 1, night: 2 },
    by_timeframe: { "4h": 1, "8h": 2 },
    by_algo: { VWAP: 1, ADAPTIVE_TWAP: 2 },
    by_date: { "2024-01-05": 1, "2024-01-01": 1, "2024-01-02": 1 },
  },
  filters: {
    config_path: "gs://execution-store-prod/configs/v2/",
    start_date: "2024-01-01",
    end_date: "2024-03-31",
    strategy: null,
    mode: null,
    timeframe: null,
    algo: null,
  },
};

// ---------------------------------------------------------------------------
// ROUTE HANDLERS
// ---------------------------------------------------------------------------

function handleCoreRoutes(path: string): Response | null {
  // Health
  if (path.endsWith("/health"))
    return jsonResponse({ status: "healthy", mock: true, version: "1.0.0-mock" });

  // Recon
  if (path.includes("/recon/breaks"))
    return jsonResponse({
      breaks: MOCK_RECON_BREAKS,
      total: MOCK_RECON_BREAKS.length,
    });

  // Backtest results (legacy)
  if (path.includes("/backtest/results"))
    return jsonResponse({
      results: MOCK_BACKTEST_RESULTS,
      total: MOCK_BACKTEST_RESULTS.length,
    });

  // Config sources
  if (path.includes("/config/sources"))
    return jsonResponse({ sources: ["gs://execution-store-prod/configs/v2/", "gs://execution-store-staging/configs/v2/"] });

  // CPU cores
  if (path.includes("/config/system/cores"))
    return jsonResponse({ cores: 8, recommended_workers: 6, max_safe_workers: 12 });

  // Buckets
  if (path.includes("/results/buckets"))
    return jsonResponse({ buckets: MOCK_BUCKETS, project_id: "unified-trading-prod" });

  // Prefixes
  if (path.includes("/results/prefixes"))
    return jsonResponse({ prefixes: MOCK_PREFIXES, bucket: "execution-store-prod" });

  // Files
  if (path.includes("/results/files"))
    return jsonResponse({
      files: [
        { name: "run-001/execution_alpha.json", size: 48200, updated: "2024-03-31T18:00:00Z" },
        { name: "run-002/execution_alpha.json", size: 32100, updated: "2024-03-31T18:00:00Z" },
        { name: "run-003/execution_alpha.json", size: 21400, updated: "2024-03-31T18:00:00Z" },
        { name: "run-004/execution_alpha.json", size: 68900, updated: "2024-03-31T18:00:00Z" },
      ],
    });

  // Backtest status (polling — cycles through states)
  const statusMatch = path.match(/\/backtest\/status\/([^/?]+)/);
  if (statusMatch) {
    const jobId = statusMatch[1];
    const state = mockJobState[jobId] ?? { callCount: 0 };
    state.callCount++;
    mockJobState[jobId] = state;
    const progress = Math.min(100, state.callCount * 20);
    const status = progress < 100 ? "running" : "completed";
    return jsonResponse({
      job_id: jobId,
      status,
      progress,
      gcs_result_path:
        status === "completed"
          ? `gs://execution-store/runs/${jobId}/`
          : undefined,
    });
  }

  // Runs / backtests list
  if (path.includes("/runs") || path.includes("/backtests"))
    return jsonResponse({
      runs: MOCK_RESULTS_LIST,
      total: MOCK_RESULTS_LIST.length,
    });

  // Instruments (top-level — not under /data/)
  if (
    path.includes("/instruments") &&
    !path.includes("/data/instruments") &&
    !path.includes("/tick-data")
  )
    return jsonResponse({ instruments: MOCK_INSTRUMENTS_DATA });

  // Configs (top-level — not under /data/configs)
  if (
    path.includes("/configs") &&
    !path.includes("/data/configs") &&
    !path.includes("/config/")
  )
    return jsonResponse({ configs: MOCK_CONFIGS });

  // Tick data (top-level)
  if (path.includes("/tick-data") && !path.includes("/data/"))
    return jsonResponse({
      data: generateTicks(43000),
    });

  return null;
}

function handleDeploymentRoutes(path: string): Response | null {
  // List deployments
  if (path.match(/\/deployments$/) || path.match(/\/deployments\?/))
    return jsonResponse({
      deployments: [MOCK_DEPLOYMENT],
      total: 1,
    });

  // Single deployment by ID
  if (path.match(/\/deployments\//))
    return jsonResponse(MOCK_DEPLOYMENT);

  // Services list
  if (path.includes("/services") && !path.includes("/service-status"))
    return jsonResponse({
      services: [
        { name: "execution-services", status: "healthy", version: "2.1.0" },
      ],
    });

  // Service status — data-status
  if (path.includes("/data-status"))
    return jsonResponse(MOCK_DATA_STATUS);

  // Service status — missing-shards
  if (path.includes("/missing-shards"))
    return jsonResponse(MOCK_MISSING_SHARDS);

  // Service status (generic)
  if (path.includes("/service-status"))
    return jsonResponse({
      service: "execution-services",
      health: "healthy",
      version: "2.1.0",
    });

  // List directories
  if (path.includes("/list-directories"))
    return jsonResponse({
      directories: [
        "gs://execution-store-prod/configs/v2/",
        "gs://execution-store-prod/configs/v1/",
        "gs://execution-store-staging/configs/v2/",
      ],
    });

  // Discover configs
  if (path.includes("/discover-configs"))
    return jsonResponse({
      count: MOCK_CONFIGS.length,
      configs: MOCK_CONFIGS.map((c) => c.path),
    });

  // Config buckets
  if (path.includes("/config-buckets"))
    return jsonResponse({
      default_bucket: "gs://execution-store-prod/configs/v2/",
      buckets: [
        { name: "execution-store-prod", path: "gs://execution-store-prod/configs/v2/" },
        { name: "execution-store-staging", path: "gs://execution-store-staging/configs/v2/" },
      ],
    });

  return null;
}

function handleDataAssetRoutes(path: string): Response | null {
  // /data/instruments/data — returns actual instrument objects
  if (path.includes("/data/instruments/data"))
    return jsonResponse({ instruments: MOCK_INSTRUMENTS_DATA });

  // /data/instruments — returns categories (for cascading dropdowns)
  if (path.includes("/data/instruments"))
    return jsonResponse({ categories: MOCK_INSTRUMENT_CATEGORIES });

  // /data/tick-data/ticks — returns tick array
  if (path.includes("/data/tick-data/ticks"))
    return jsonResponse({ ticks: generateTicks(43000) });

  // /data/tick-data/instruments — returns instrument list for the tick page
  if (path.includes("/data/tick-data/instruments"))
    return jsonResponse({
      instruments: [
        { instrumentId: "BINANCE:SPOT:BTC-USDT", instrumentType: "SPOT" },
        { instrumentId: "BINANCE:SPOT:ETH-USDT", instrumentType: "SPOT" },
        { instrumentId: "BINANCE:PERPETUAL:BTC-USDT-PERP", instrumentType: "PERPETUAL" },
        { instrumentId: "COINBASE:SPOT:BTC-USD", instrumentType: "SPOT" },
        { instrumentId: "KRAKEN:SPOT:ETH-USD", instrumentType: "SPOT" },
      ],
    });

  // /data/tick-data — category overview
  if (path.includes("/data/tick-data"))
    return jsonResponse({ categories: MOCK_TICK_CATEGORIES });

  // /data/strategies
  if (path.includes("/data/strategies"))
    return jsonResponse({ strategies: MOCK_STRATEGIES });

  // /data/instructions
  if (path.includes("/data/instructions"))
    return jsonResponse({
      instructions: generateInstructions("statarb_v2", "2024-01-02"),
      total: 50,
    });

  return null;
}

function handleDataRoutes(path: string): Response | null {
  // Local default directory
  if (path.includes("/results/local-default-directory"))
    return jsonResponse({
      path: "/tmp/backtest-results",
      directory: "/tmp/backtest-results",
      reason: "default",
      exists: true,
    });

  // Execution alpha (both Analysis page and DeepDive use this)
  if (path.includes("/results/execution_alpha"))
    return jsonResponse(makeMockExecutionAlpha("run-001"));

  // Result details by ID (e.g. /results/run-001)
  const resultDetailMatch = path.match(/\/results\/([^/?]+)$/);
  if (resultDetailMatch && !path.includes("/results/buckets") && !path.includes("/results/prefixes") && !path.includes("/results/files")) {
    const runId = resultDetailMatch[1];
    return jsonResponse(makeMockResultDetails(runId));
  }

  // Results list (must come AFTER the detail match since both contain "/results")
  if (path.endsWith("/results") || path.match(/\/results\?/))
    return jsonResponse({
      results: MOCK_RESULTS_LIST,
      total: MOCK_RESULTS_LIST.length,
      filters: MOCK_FILTERS,
    });

  // Config validation
  if (path.includes("/data/configs/validate"))
    return jsonResponse({ valid: true, errors: [] });

  // Config content
  if (path.includes("/data/configs/content"))
    return jsonResponse({ config: MOCK_CONFIG_CONTENT, validation_errors: [] });

  // Config list
  if (path.includes("/data/configs"))
    return jsonResponse({ configs: MOCK_CONFIGS });

  // Config generate
  if (
    path.includes("/config/generate-all") ||
    path.includes("/config/generate")
  )
    return jsonResponse({
      success: true,
      total_configs: MOCK_CONFIGS.length,
      total_strategies: 4,
      generated: MOCK_CONFIGS.map((c) => c.path),
    });

  // Data asset routes (instruments, tick-data, etc.)
  const assetRoute = handleDataAssetRoutes(path);
  if (assetRoute) return assetRoute;

  // Backtest run / cancel
  if (path.includes("/backtest/run") || path.includes("/backtest/cancel")) {
    const jobId = `mock-job-${Date.now()}`;
    return jsonResponse({ job_id: jobId, status: "queued", message: "Backtest queued" });
  }

  return null;
}

// ---------------------------------------------------------------------------
// MAIN HANDLER
// ---------------------------------------------------------------------------

async function handle(url: string, _init?: RequestInit): Promise<Response> {
  await new Promise((r) => setTimeout(r, MOCK_DELAY_MS));
  const path = url.replace(/^https?:\/\/[^/]+/, "").replace(/\?.*$/, "");

  const result =
    handleCoreRoutes(path) ??
    handleDeploymentRoutes(path) ??
    handleDataRoutes(path);

  if (result) return result;

  console.warn("[MOCK exec-analytics] unhandled:", path, "| full url:", url);
  return jsonResponse({});
}

// ---------------------------------------------------------------------------
// INSTALL
// ---------------------------------------------------------------------------

export function installMockHandlers(mockMode = false) {
  if (!mockMode) return;
  const orig = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : (input as Request).url;
    if (url.includes("/api/")) return handle(url, init);
    return orig(input, init);
  };
  console.info(
    "%c[MOCK MODE] execution-analytics-ui",
    "color:#fbbf24;font-weight:bold",
  );
}
