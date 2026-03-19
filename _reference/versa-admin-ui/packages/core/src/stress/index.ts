/**
 * Stress data generators for UI trader acceptance testing.
 *
 * Each scenario produces mock data that exercises edge cases:
 * - BIG_DRAWDOWN: Large negative P&L, margin calls, circuit breaker triggers
 * - BIG_TICKS: High-frequency tick data with rapid price swings
 * - MISSING_DATA: Null/undefined fields, empty arrays, partial responses
 * - BAD_SCHEMAS: Malformed data that tests schema validation
 * - STALE_DATA: Timestamps from far past, expired sessions, stale caches
 * - HIGH_CARDINALITY: Thousands of items testing pagination/virtualization
 */

export type StressScenario =
  | "BIG_DRAWDOWN"
  | "BIG_TICKS"
  | "MISSING_DATA"
  | "BAD_SCHEMAS"
  | "STALE_DATA"
  | "HIGH_CARDINALITY";

export const ALL_STRESS_SCENARIOS: readonly StressScenario[] = [
  "BIG_DRAWDOWN",
  "BIG_TICKS",
  "MISSING_DATA",
  "BAD_SCHEMAS",
  "STALE_DATA",
  "HIGH_CARDINALITY",
] as const;

export interface StressDataSet {
  scenario: StressScenario;
  health: StressHealth;
  positions: StressPosition[];
  deployments: StressDeployment[];
  alerts: StressAlert[];
  orders: StressOrder[];
  logs: StressLogEntry[];
  strategies: StressStrategy[];
  experiments: StressExperiment[];
  settlements: StressSettlement[];
  reports: StressReport[];
}

export interface StressHealth {
  overall: string;
  services: Array<{
    name: string;
    status: string;
    latency: number | null;
    uptime: number;
    lastCheck: string;
  }>;
}

export interface StressPosition {
  id: string;
  symbol: string;
  side: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  venue: string;
  settled: boolean;
}

export interface StressDeployment {
  id: string;
  service: string;
  status: string;
  created_at: string;
  updated_at: string;
  total_shards: number;
  completed_shards: number;
  failed_shards: number;
  parameters: Record<string, string>;
}

export interface StressAlert {
  alert_id: string;
  rule_id: string;
  rule_name: string;
  severity: string;
  message: string;
  triggered_at: string;
  resolved_at: string | null;
  service: string;
}

export interface StressOrder {
  id: string;
  symbol: string;
  side: string;
  price: number;
  quantity: number;
  status: string;
  venue: string;
  timestamp: string;
}

export interface StressLogEntry {
  id: string;
  timestamp: string;
  level: string;
  service: string;
  message: string;
  trace_id: string;
}

export interface StressStrategy {
  id: string;
  name: string;
  type: string;
  status: string;
  sharpe: number | null;
  dailyPnl: number | null;
  monthlyReturn: number | null;
  venues: string[];
  updatedAt: string;
}

export interface StressExperiment {
  id: string;
  name: string;
  model: string;
  status: string;
  accuracy: number | null;
  loss: number | null;
  epochs: number;
  dataset: string;
  createdAt: string;
  completedAt: string | null;
}

export interface StressSettlement {
  settlement_id: string;
  strategy_id: string;
  settlement_type: string;
  period_start: string;
  period_end: string;
  expected_amount: number;
  actual_amount: number | null;
  status: string;
  discrepancy_bps: number | null;
}

export interface StressReport {
  id: string;
  name: string;
  client: string;
  type: string;
  status: string;
  period: string;
  generatedAt: string;
  deliveredAt: string | null;
}

// ---- Generators per scenario ----

function generateBigDrawdown(): StressDataSet {
  const now = new Date().toISOString();
  return {
    scenario: "BIG_DRAWDOWN",
    health: {
      overall: "critical",
      services: [
        {
          name: "execution-engine",
          status: "error",
          latency: 450.2,
          uptime: 87.3,
          lastCheck: now,
        },
        {
          name: "risk-manager",
          status: "critical",
          latency: 1200.0,
          uptime: 92.1,
          lastCheck: now,
        },
        {
          name: "market-data-feed",
          status: "warning",
          latency: 89.4,
          uptime: 95.8,
          lastCheck: now,
        },
        {
          name: "order-router",
          status: "error",
          latency: null,
          uptime: 78.2,
          lastCheck: now,
        },
        {
          name: "settlement-service",
          status: "healthy",
          latency: 2.1,
          uptime: 99.9,
          lastCheck: now,
        },
      ],
    },
    positions: [
      {
        id: "p-dd-001",
        symbol: "BTC/USDT",
        side: "long",
        quantity: 50.0,
        entryPrice: 68500,
        currentPrice: 42100,
        unrealizedPnl: -1320000,
        venue: "Binance",
        settled: false,
      },
      {
        id: "p-dd-002",
        symbol: "ETH/USDT",
        side: "long",
        quantity: 800.0,
        entryPrice: 3520,
        currentPrice: 2180,
        unrealizedPnl: -1072000,
        venue: "OKX",
        settled: false,
      },
      {
        id: "p-dd-003",
        symbol: "SOL/USDT",
        side: "long",
        quantity: 15000,
        entryPrice: 148.5,
        currentPrice: 62.3,
        unrealizedPnl: -1293000,
        venue: "Bybit",
        settled: false,
      },
      {
        id: "p-dd-004",
        symbol: "AAPL",
        side: "short",
        quantity: 2000,
        entryPrice: 178.0,
        currentPrice: 195.4,
        unrealizedPnl: -34800,
        venue: "NYSE",
        settled: false,
      },
      {
        id: "p-dd-005",
        symbol: "EUR/USD",
        side: "long",
        quantity: 5000000,
        entryPrice: 1.092,
        currentPrice: 1.051,
        unrealizedPnl: -205000,
        venue: "Reuters",
        settled: false,
      },
    ],
    deployments: [
      {
        id: "dep-dd-001",
        service: "risk-manager",
        status: "failed",
        created_at: now,
        updated_at: now,
        total_shards: 200,
        completed_shards: 12,
        failed_shards: 188,
        parameters: { compute: "vm", mode: "emergency", cloud_provider: "gcp" },
      },
      {
        id: "dep-dd-002",
        service: "execution-engine",
        status: "failed",
        created_at: now,
        updated_at: now,
        total_shards: 150,
        completed_shards: 0,
        failed_shards: 150,
        parameters: {
          compute: "cloud_run",
          mode: "live",
          cloud_provider: "gcp",
        },
      },
    ],
    alerts: [
      {
        alert_id: "a-dd-001",
        rule_id: "r-margin",
        rule_name: "Margin Call",
        severity: "critical",
        message: "Portfolio margin below 15% threshold. Current: 3.2%",
        triggered_at: now,
        resolved_at: null,
        service: "risk-manager",
      },
      {
        alert_id: "a-dd-002",
        rule_id: "r-drawdown",
        rule_name: "Max Drawdown Breach",
        severity: "critical",
        message: "Drawdown -38.7% exceeds -25% limit",
        triggered_at: now,
        resolved_at: null,
        service: "risk-manager",
      },
      {
        alert_id: "a-dd-003",
        rule_id: "r-circuit",
        rule_name: "Circuit Breaker Open",
        severity: "critical",
        message: "All trading halted — circuit breaker triggered",
        triggered_at: now,
        resolved_at: null,
        service: "execution-engine",
      },
      {
        alert_id: "a-dd-004",
        rule_id: "r-liquidity",
        rule_name: "Liquidity Crisis",
        severity: "warning",
        message: "Order book depth < 10% of normal on 3 venues",
        triggered_at: now,
        resolved_at: null,
        service: "market-data-feed",
      },
    ],
    orders: [
      {
        id: "o-dd-001",
        symbol: "BTC/USDT",
        side: "sell",
        price: 42100,
        quantity: 50.0,
        status: "rejected",
        venue: "Binance",
        timestamp: now,
      },
      {
        id: "o-dd-002",
        symbol: "ETH/USDT",
        side: "sell",
        price: 2180,
        quantity: 800.0,
        status: "rejected",
        venue: "OKX",
        timestamp: now,
      },
    ],
    logs: Array.from({ length: 50 }, (_, i) => ({
      id: `log-dd-${String(i).padStart(3, "0")}`,
      timestamp: new Date(Date.now() - i * 2000).toISOString(),
      level: i < 20 ? "ERROR" : i < 35 ? "WARN" : "INFO",
      service: ["risk-manager", "execution-engine", "market-data-feed"][i % 3],
      message:
        i < 20
          ? "Emergency liquidation failed — insufficient liquidity"
          : "Risk threshold breach detected",
      trace_id: `trace-dd-${i}`,
    })),
    strategies: [
      {
        id: "s-dd-001",
        name: "StatArb v3",
        type: "StatisticalArbitrage",
        status: "halted",
        sharpe: -4.21,
        dailyPnl: -1320000,
        monthlyReturn: -0.387,
        venues: ["Binance", "OKX"],
        updatedAt: now,
      },
      {
        id: "s-dd-002",
        name: "FundingArb v4",
        type: "FundingArbitrage",
        status: "halted",
        sharpe: -2.87,
        dailyPnl: -450000,
        monthlyReturn: -0.215,
        venues: ["Binance", "Bybit"],
        updatedAt: now,
      },
    ],
    experiments: [
      {
        id: "exp-dd-001",
        name: "Crisis Model Retrain",
        model: "XGBoost",
        status: "failed",
        accuracy: null,
        loss: 9.87,
        epochs: 10,
        dataset: "crash_2026",
        createdAt: now,
        completedAt: null,
      },
    ],
    settlements: [
      {
        settlement_id: "s-dd-001",
        strategy_id: "statarb-v3",
        settlement_type: "MARGIN_CALL",
        period_start: now,
        period_end: now,
        expected_amount: -2500000,
        actual_amount: null,
        status: "PENDING",
        discrepancy_bps: null,
      },
    ],
    reports: [
      {
        id: "rpt-dd-001",
        name: "Emergency Drawdown Report",
        client: "All Clients",
        type: "emergency",
        status: "generating",
        period: "2026-03-16",
        generatedAt: now,
        deliveredAt: null,
      },
    ],
  };
}

function generateBigTicks(): StressDataSet {
  const now = new Date().toISOString();
  const tickCount = 500;
  return {
    scenario: "BIG_TICKS",
    health: {
      overall: "warning",
      services: [
        {
          name: "market-data-feed",
          status: "warning",
          latency: 120.5,
          uptime: 97.2,
          lastCheck: now,
        },
        {
          name: "execution-engine",
          status: "healthy",
          latency: 3.2,
          uptime: 99.8,
          lastCheck: now,
        },
        {
          name: "risk-manager",
          status: "healthy",
          latency: 1.8,
          uptime: 99.9,
          lastCheck: now,
        },
      ],
    },
    positions: Array.from({ length: 50 }, (_, i) => ({
      id: `p-bt-${String(i).padStart(3, "0")}`,
      symbol: ["BTC/USDT", "ETH/USDT", "SOL/USDT", "AAPL", "MSFT", "EUR/USD"][
        i % 6
      ],
      side: i % 2 === 0 ? "long" : "short",
      quantity: Math.random() * 100,
      entryPrice: 45000 + Math.random() * 10000,
      currentPrice:
        45000 + Math.random() * 10000 + (Math.random() - 0.5) * 5000,
      unrealizedPnl: (Math.random() - 0.5) * 50000,
      venue: ["Binance", "OKX", "Bybit", "NYSE", "CME"][i % 5],
      settled: false,
    })),
    deployments: [
      {
        id: "dep-bt-001",
        service: "market-tick-data-service",
        status: "running",
        created_at: now,
        updated_at: now,
        total_shards: 500,
        completed_shards: 312,
        failed_shards: 0,
        parameters: {
          compute: "cloud_run",
          mode: "live",
          cloud_provider: "gcp",
        },
      },
    ],
    alerts: [
      {
        alert_id: "a-bt-001",
        rule_id: "r-tick-rate",
        rule_name: "Tick Rate Spike",
        severity: "warning",
        message: `Tick rate ${tickCount}/sec exceeds 200/sec threshold`,
        triggered_at: now,
        resolved_at: null,
        service: "market-data-feed",
      },
    ],
    orders: Array.from({ length: 200 }, (_, i) => ({
      id: `o-bt-${String(i).padStart(4, "0")}`,
      symbol: ["BTC/USDT", "ETH/USDT"][i % 2],
      side: i % 2 === 0 ? "buy" : "sell",
      price: 45000 + Math.sin(i * 0.1) * 2000,
      quantity: Math.random() * 5,
      status: "filled",
      venue: "Binance",
      timestamp: new Date(Date.now() - i * 50).toISOString(),
    })),
    logs: Array.from({ length: 100 }, (_, i) => ({
      id: `log-bt-${String(i).padStart(3, "0")}`,
      timestamp: new Date(Date.now() - i * 100).toISOString(),
      level: "INFO",
      service: "market-data-feed",
      message: `Tick processed: BTC/USDT @ ${(45000 + Math.sin(i * 0.1) * 2000).toFixed(2)}`,
      trace_id: `trace-bt-${i}`,
    })),
    strategies: [
      {
        id: "s-bt-001",
        name: "HFT Market Making",
        type: "MarketMaking",
        status: "live",
        sharpe: 4.82,
        dailyPnl: 87200,
        monthlyReturn: 0.045,
        venues: ["Binance"],
        updatedAt: now,
      },
    ],
    experiments: [],
    settlements: [],
    reports: [],
  };
}

function generateMissingData(): StressDataSet {
  const now = new Date().toISOString();
  return {
    scenario: "MISSING_DATA",
    health: {
      overall: "unknown",
      services: [
        {
          name: "execution-engine",
          status: "unknown",
          latency: null,
          uptime: 0,
          lastCheck: "",
        },
        {
          name: "risk-manager",
          status: "",
          latency: null,
          uptime: 0,
          lastCheck: now,
        },
      ],
    },
    positions: [
      {
        id: "",
        symbol: "",
        side: "",
        quantity: 0,
        entryPrice: 0,
        currentPrice: 0,
        unrealizedPnl: 0,
        venue: "",
        settled: false,
      },
      {
        id: "p-md-001",
        symbol: "BTC/USDT",
        side: "long",
        quantity: 2.5,
        entryPrice: 67200,
        currentPrice: 67800,
        unrealizedPnl: 1500,
        venue: "Binance",
        settled: false,
      },
    ],
    deployments: [],
    alerts: [],
    orders: [],
    logs: [],
    strategies: [
      {
        id: "s-md-001",
        name: "",
        type: "",
        status: "",
        sharpe: null,
        dailyPnl: null,
        monthlyReturn: null,
        venues: [],
        updatedAt: "",
      },
    ],
    experiments: [
      {
        id: "exp-md-001",
        name: "",
        model: "",
        status: "",
        accuracy: null,
        loss: null,
        epochs: 0,
        dataset: "",
        createdAt: "",
        completedAt: null,
      },
    ],
    settlements: [
      {
        settlement_id: "",
        strategy_id: "",
        settlement_type: "",
        period_start: "",
        period_end: "",
        expected_amount: 0,
        actual_amount: null,
        status: "",
        discrepancy_bps: null,
      },
    ],
    reports: [],
  };
}

function generateBadSchemas(): StressDataSet {
  const now = new Date().toISOString();
  return {
    scenario: "BAD_SCHEMAS",
    health: {
      overall: "healthy",
      services: [
        {
          name: "execution-engine",
          status: "healthy",
          latency: 1.2,
          uptime: 99.97,
          lastCheck: "not-a-date",
        },
        {
          name: "risk-manager",
          status: 12345 as unknown as string,
          latency: "fast" as unknown as number,
          uptime: 99.99,
          lastCheck: now,
        },
      ],
    },
    positions: [
      {
        id: "p-bs-001",
        symbol: "INVALID/PAIR",
        side: "sideways",
        quantity: -10,
        entryPrice: -100,
        currentPrice: NaN,
        unrealizedPnl: Infinity,
        venue: "",
        settled: false,
      },
      {
        id: "p-bs-002",
        symbol: "BTC/USDT",
        side: "long",
        quantity: Number.MAX_SAFE_INTEGER,
        entryPrice: 67200,
        currentPrice: 67800,
        unrealizedPnl: 1e15,
        venue: "Binance",
        settled: false,
      },
    ],
    deployments: [
      {
        id: "dep-bs-001",
        service: "",
        status: "unknown_status_value",
        created_at: "invalid-date",
        updated_at: "2099-99-99T99:99:99Z",
        total_shards: -1,
        completed_shards: -5,
        failed_shards: -3,
        parameters: {},
      },
    ],
    alerts: [
      {
        alert_id: "a-bs-001",
        rule_id: "",
        rule_name: "",
        severity: "mega-critical",
        message: "A".repeat(5000),
        triggered_at: now,
        resolved_at: null,
        service: "",
      },
    ],
    orders: [
      {
        id: "o-bs-001",
        symbol: "???",
        side: "buy",
        price: 0,
        quantity: 0,
        status: "unknown",
        venue: "FakeVenue",
        timestamp: "yesterday",
      },
    ],
    logs: [
      {
        id: "log-bs-001",
        timestamp: "not-iso",
        level: "TRACE",
        service: "",
        message: "<script>alert('xss')</script>",
        trace_id: "",
      },
      {
        id: "log-bs-002",
        timestamp: now,
        level: "INFO",
        service: "test",
        message: "\x00\x01\x02 null bytes",
        trace_id: "t-1",
      },
    ],
    strategies: [
      {
        id: "s-bs-001",
        name: "A".repeat(1000),
        type: "",
        status: "quantum",
        sharpe: NaN,
        dailyPnl: -Infinity,
        monthlyReturn: 999.99,
        venues: Array(100).fill("FakeVenue"),
        updatedAt: now,
      },
    ],
    experiments: [],
    settlements: [],
    reports: [],
  };
}

function generateStaleData(): StressDataSet {
  const staleDate = "2020-01-01T00:00:00Z";
  const veryOld = "1970-01-01T00:00:00Z";
  return {
    scenario: "STALE_DATA",
    health: {
      overall: "warning",
      services: [
        {
          name: "execution-engine",
          status: "healthy",
          latency: 1.2,
          uptime: 99.97,
          lastCheck: staleDate,
        },
        {
          name: "risk-manager",
          status: "healthy",
          latency: 0.8,
          uptime: 99.99,
          lastCheck: veryOld,
        },
        {
          name: "market-data-feed",
          status: "stale",
          latency: 45000,
          uptime: 12.5,
          lastCheck: "2024-06-15T00:00:00Z",
        },
      ],
    },
    positions: [
      {
        id: "p-st-001",
        symbol: "BTC/USDT",
        side: "long",
        quantity: 2.5,
        entryPrice: 3800,
        currentPrice: 3800,
        unrealizedPnl: 0,
        venue: "Binance",
        settled: false,
      },
      {
        id: "p-st-002",
        symbol: "ETH/USDT",
        side: "short",
        quantity: 12,
        entryPrice: 130,
        currentPrice: 130,
        unrealizedPnl: 0,
        venue: "OKX",
        settled: false,
      },
    ],
    deployments: [
      {
        id: "dep-st-001",
        service: "instruments-service",
        status: "running",
        created_at: staleDate,
        updated_at: staleDate,
        total_shards: 48,
        completed_shards: 12,
        failed_shards: 0,
        parameters: { compute: "vm", mode: "batch", cloud_provider: "gcp" },
      },
    ],
    alerts: [
      {
        alert_id: "a-st-001",
        rule_id: "r-stale",
        rule_name: "Stale Data",
        severity: "warning",
        message: "Market data feed last update was 6+ years ago",
        triggered_at: staleDate,
        resolved_at: null,
        service: "market-data-feed",
      },
    ],
    orders: [
      {
        id: "o-st-001",
        symbol: "BTC/USDT",
        side: "buy",
        price: 3800,
        quantity: 1.0,
        status: "filled",
        venue: "Binance",
        timestamp: veryOld,
      },
    ],
    logs: Array.from({ length: 20 }, (_, i) => ({
      id: `log-st-${String(i).padStart(3, "0")}`,
      timestamp: new Date(Date.parse(staleDate) + i * 3600000).toISOString(),
      level: "WARN",
      service: "market-data-feed",
      message: "Data freshness check failed — last update too old",
      trace_id: `trace-st-${i}`,
    })),
    strategies: [
      {
        id: "s-st-001",
        name: "StatArb v1 (legacy)",
        type: "StatisticalArbitrage",
        status: "live",
        sharpe: 0.12,
        dailyPnl: 50,
        monthlyReturn: 0.001,
        venues: ["MtGox"],
        updatedAt: staleDate,
      },
    ],
    experiments: [
      {
        id: "exp-st-001",
        name: "Ancient Model",
        model: "LinearRegression",
        status: "completed",
        accuracy: 0.51,
        loss: 0.98,
        epochs: 5,
        dataset: "data_2019",
        createdAt: veryOld,
        completedAt: staleDate,
      },
    ],
    settlements: [
      {
        settlement_id: "s-st-001",
        strategy_id: "legacy-v1",
        settlement_type: "DAILY",
        period_start: staleDate,
        period_end: staleDate,
        expected_amount: 100,
        actual_amount: 100,
        status: "CONFIRMED",
        discrepancy_bps: 0,
      },
    ],
    reports: [
      {
        id: "rpt-st-001",
        name: "January 2020 Report",
        client: "Legacy Client",
        type: "monthly",
        status: "delivered",
        period: "2020-01",
        generatedAt: staleDate,
        deliveredAt: staleDate,
      },
    ],
  };
}

function generateHighCardinality(): StressDataSet {
  const now = new Date().toISOString();
  const count = 2000;
  const venues = [
    "Binance",
    "OKX",
    "Bybit",
    "Kraken",
    "Coinbase",
    "NYSE",
    "NASDAQ",
    "CME",
    "EUREX",
    "LSE",
  ];
  const symbols = [
    "BTC/USDT",
    "ETH/USDT",
    "SOL/USDT",
    "AAPL",
    "MSFT",
    "GOOGL",
    "AMZN",
    "EUR/USD",
    "GBP/USD",
    "JPY/USD",
  ];

  return {
    scenario: "HIGH_CARDINALITY",
    health: {
      overall: "healthy",
      services: Array.from({ length: 50 }, (_, i) => ({
        name: `service-${String(i).padStart(3, "0")}`,
        status: i % 10 === 0 ? "warning" : "healthy",
        latency: Math.random() * 10,
        uptime: 95 + Math.random() * 5,
        lastCheck: now,
      })),
    },
    positions: Array.from({ length: count }, (_, i) => ({
      id: `p-hc-${String(i).padStart(5, "0")}`,
      symbol: symbols[i % symbols.length],
      side: i % 2 === 0 ? "long" : "short",
      quantity: Math.random() * 100,
      entryPrice: 40000 + Math.random() * 30000,
      currentPrice: 40000 + Math.random() * 30000,
      unrealizedPnl: (Math.random() - 0.5) * 100000,
      venue: venues[i % venues.length],
      settled: i % 3 === 0,
    })),
    deployments: Array.from({ length: 500 }, (_, i) => ({
      id: `dep-hc-${String(i).padStart(4, "0")}`,
      service: `service-${String(i % 50).padStart(3, "0")}`,
      status: ["completed", "running", "failed", "queued"][i % 4],
      created_at: new Date(Date.now() - i * 3600000).toISOString(),
      updated_at: new Date(Date.now() - i * 1800000).toISOString(),
      total_shards: Math.floor(Math.random() * 200) + 10,
      completed_shards: Math.floor(Math.random() * 100),
      failed_shards: i % 4 === 2 ? Math.floor(Math.random() * 20) : 0,
      parameters: {
        compute: "cloud_run",
        mode: "batch",
        cloud_provider: "gcp",
      },
    })),
    alerts: Array.from({ length: 500 }, (_, i) => ({
      alert_id: `a-hc-${String(i).padStart(4, "0")}`,
      rule_id: `r-${i % 20}`,
      rule_name: `Rule ${i % 20}`,
      severity: ["info", "warning", "critical"][i % 3],
      message: `Alert ${i}: threshold breached on service-${i % 50}`,
      triggered_at: new Date(Date.now() - i * 60000).toISOString(),
      resolved_at:
        i % 2 === 0 ? new Date(Date.now() - i * 30000).toISOString() : null,
      service: `service-${String(i % 50).padStart(3, "0")}`,
    })),
    orders: Array.from({ length: count }, (_, i) => ({
      id: `o-hc-${String(i).padStart(5, "0")}`,
      symbol: symbols[i % symbols.length],
      side: i % 2 === 0 ? "buy" : "sell",
      price: 40000 + Math.random() * 30000,
      quantity: Math.random() * 10,
      status: ["filled", "partial", "cancelled"][i % 3],
      venue: venues[i % venues.length],
      timestamp: new Date(Date.now() - i * 1000).toISOString(),
    })),
    logs: Array.from({ length: count }, (_, i) => ({
      id: `log-hc-${String(i).padStart(5, "0")}`,
      timestamp: new Date(Date.now() - i * 500).toISOString(),
      level: ["INFO", "WARN", "ERROR", "DEBUG"][i % 4],
      service: `service-${String(i % 50).padStart(3, "0")}`,
      message: `Log entry ${i}: processing batch ${Math.floor(i / 10)}`,
      trace_id: `trace-hc-${i}`,
    })),
    strategies: Array.from({ length: 200 }, (_, i) => ({
      id: `s-hc-${String(i).padStart(4, "0")}`,
      name: `Strategy-${i}`,
      type: [
        "StatisticalArbitrage",
        "FundingArbitrage",
        "MarketMaking",
        "Momentum",
      ][i % 4],
      status: ["live", "paused", "backtesting"][i % 3],
      sharpe: Math.random() * 5 - 1,
      dailyPnl: (Math.random() - 0.5) * 200000,
      monthlyReturn: (Math.random() - 0.3) * 0.1,
      venues: venues.slice(0, (i % 5) + 1),
      updatedAt: now,
    })),
    experiments: Array.from({ length: 100 }, (_, i) => ({
      id: `exp-hc-${String(i).padStart(4, "0")}`,
      name: `Experiment ${i}`,
      model: ["XGBoost", "LSTM", "RandomForest", "LightGBM"][i % 4],
      status: ["completed", "running", "failed"][i % 3],
      accuracy: i % 3 !== 2 ? Math.random() * 0.3 + 0.7 : null,
      loss: Math.random() * 0.5,
      epochs: Math.floor(Math.random() * 200) + 10,
      dataset: `dataset_${i}`,
      createdAt: new Date(Date.now() - i * 86400000).toISOString(),
      completedAt:
        i % 3 === 0 ? new Date(Date.now() - i * 43200000).toISOString() : null,
    })),
    settlements: Array.from({ length: 200 }, (_, i) => ({
      settlement_id: `sett-hc-${String(i).padStart(4, "0")}`,
      strategy_id: `strategy-${i % 50}`,
      settlement_type: [
        "FUNDING_8H",
        "STAKING_YIELD",
        "DAILY",
        "SEASONAL_WEEKLY",
      ][i % 4],
      period_start: new Date(Date.now() - (i + 1) * 86400000).toISOString(),
      period_end: new Date(Date.now() - i * 86400000).toISOString(),
      expected_amount: (Math.random() - 0.3) * 10000,
      actual_amount: i % 3 === 0 ? (Math.random() - 0.3) * 10000 : null,
      status: ["CONFIRMED", "PENDING", "DISCREPANCY"][i % 3],
      discrepancy_bps: i % 3 === 2 ? Math.random() * 100 : null,
    })),
    reports: Array.from({ length: 100 }, (_, i) => ({
      id: `rpt-hc-${String(i).padStart(4, "0")}`,
      name: `Client ${i % 20} Report`,
      client: `Client ${i % 20}`,
      type: ["monthly", "quarterly", "annual"][i % 3],
      status: ["delivered", "pending", "generating"][i % 3],
      period: `2026-${String((i % 12) + 1).padStart(2, "0")}`,
      generatedAt: new Date(Date.now() - i * 86400000).toISOString(),
      deliveredAt:
        i % 3 === 0 ? new Date(Date.now() - i * 43200000).toISOString() : null,
    })),
  };
}

const GENERATORS: Record<StressScenario, () => StressDataSet> = {
  BIG_DRAWDOWN: generateBigDrawdown,
  BIG_TICKS: generateBigTicks,
  MISSING_DATA: generateMissingData,
  BAD_SCHEMAS: generateBadSchemas,
  STALE_DATA: generateStaleData,
  HIGH_CARDINALITY: generateHighCardinality,
};

/**
 * Generate a complete stress data set for the given scenario.
 * Returns realistic-shaped data that exercises edge cases specific to the scenario.
 */
export function generateStressData(scenario: StressScenario): StressDataSet {
  const generator = GENERATORS[scenario];
  return generator();
}
