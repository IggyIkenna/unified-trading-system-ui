import type {
  ExecutionAlgo,
  Venue,
  ExecutionOrder,
  TCAReport,
  AlgoBacktest,
  VenueMatrix,
  ExecutionCandidate,
  ExecutionMetricsSnapshot,
} from "./execution-platform-types"

// ============================================================================
// Execution Algos
// ============================================================================

export const MOCK_EXECUTION_ALGOS: ExecutionAlgo[] = [
  {
    id: "algo-twap-v2",
    name: "TWAP Standard",
    type: "TWAP",
    version: "2.1.0",
    description: "Time-weighted average price algo with adaptive slice sizing",
    params: {
      aggressiveness: 0.5,
      minFillRate: 0.95,
      maxSpread: 10,
      timeHorizon: 3600,
    },
    supportedVenues: ["binance", "okx", "bybit", "deribit"],
    supportedInstruments: ["*-PERP", "*-SPOT", "*-USDT"],
    metrics: {
      avgSlippage: 1.2,
      avgFillRate: 98.5,
      avgLatency: 45,
      costVsBenchmark: 0.8,
    },
    status: "live",
    lastUpdated: "2024-03-15T10:00:00Z",
  },
  {
    id: "algo-vwap-v3",
    name: "VWAP Adaptive",
    type: "VWAP",
    version: "3.0.1",
    description: "Volume-weighted average price with real-time volume prediction",
    params: {
      aggressiveness: 0.6,
      minFillRate: 0.92,
      maxSpread: 15,
      participationRate: 0.15,
    },
    supportedVenues: ["binance", "okx", "hyperliquid"],
    supportedInstruments: ["ETH-*", "BTC-*", "SOL-*"],
    metrics: {
      avgSlippage: 0.9,
      avgFillRate: 96.2,
      avgLatency: 52,
      costVsBenchmark: -0.3,
    },
    status: "live",
    lastUpdated: "2024-03-14T15:30:00Z",
  },
  {
    id: "algo-is-v1",
    name: "Implementation Shortfall",
    type: "IS",
    version: "1.2.0",
    description: "Minimizes implementation shortfall with urgency-aware scheduling",
    params: {
      aggressiveness: 0.7,
      minFillRate: 0.90,
      maxSpread: 20,
    },
    supportedVenues: ["binance", "okx", "deribit", "bybit"],
    supportedInstruments: ["*-PERP"],
    metrics: {
      avgSlippage: 1.5,
      avgFillRate: 94.8,
      avgLatency: 38,
      costVsBenchmark: -1.2,
    },
    status: "live",
    lastUpdated: "2024-03-10T09:00:00Z",
  },
  {
    id: "algo-sniper-v2",
    name: "Sniper",
    type: "SNIPER",
    version: "2.0.0",
    description: "Aggressive opportunistic algo for capturing favorable prices",
    params: {
      aggressiveness: 0.9,
      minFillRate: 0.85,
      maxSpread: 5,
    },
    supportedVenues: ["binance", "hyperliquid"],
    supportedInstruments: ["ETH-PERP", "BTC-PERP"],
    metrics: {
      avgSlippage: 0.5,
      avgFillRate: 88.3,
      avgLatency: 12,
      costVsBenchmark: -2.1,
    },
    status: "testing",
    lastUpdated: "2024-03-16T11:00:00Z",
  },
  {
    id: "algo-iceberg-v1",
    name: "Iceberg",
    type: "ICEBERG",
    version: "1.1.0",
    description: "Hide large orders by exposing only a fraction at a time",
    params: {
      aggressiveness: 0.3,
      minFillRate: 0.98,
      maxSpread: 8,
    },
    supportedVenues: ["binance", "okx", "deribit"],
    supportedInstruments: ["*"],
    metrics: {
      avgSlippage: 2.1,
      avgFillRate: 99.1,
      avgLatency: 120,
      costVsBenchmark: 1.5,
    },
    status: "live",
    lastUpdated: "2024-03-12T14:00:00Z",
  },
]

// ============================================================================
// Venues
// ============================================================================

export const MOCK_VENUES: Venue[] = [
  {
    id: "binance",
    name: "Binance",
    type: "CEX",
    region: "Global",
    connectivity: {
      status: "connected",
      latency: 12,
      lastHeartbeat: "2024-03-18T11:59:58Z",
    },
    capabilities: {
      orderTypes: ["LIMIT", "MARKET", "STOP", "STOP_LIMIT"],
      maxOrderSize: 10000000,
      minOrderSize: 10,
      tickSize: 0.01,
      makerFee: 1,
      takerFee: 2,
    },
    volume: {
      daily: 45000000000,
      weekly: 315000000000,
      marketShare: 35.2,
    },
    quality: {
      fillRate: 99.2,
      avgSlippage: 0.8,
      rejectRate: 0.3,
      latencyP50: 8,
      latencyP99: 45,
    },
  },
  {
    id: "okx",
    name: "OKX",
    type: "CEX",
    region: "Global",
    connectivity: {
      status: "connected",
      latency: 18,
      lastHeartbeat: "2024-03-18T11:59:57Z",
    },
    capabilities: {
      orderTypes: ["LIMIT", "MARKET", "STOP", "STOP_LIMIT", "TRAILING"],
      maxOrderSize: 8000000,
      minOrderSize: 5,
      tickSize: 0.01,
      makerFee: 0.8,
      takerFee: 1.5,
    },
    volume: {
      daily: 28000000000,
      weekly: 196000000000,
      marketShare: 22.1,
    },
    quality: {
      fillRate: 98.8,
      avgSlippage: 1.1,
      rejectRate: 0.5,
      latencyP50: 12,
      latencyP99: 55,
    },
  },
  {
    id: "hyperliquid",
    name: "Hyperliquid",
    type: "DEX",
    region: "On-chain",
    connectivity: {
      status: "connected",
      latency: 45,
      lastHeartbeat: "2024-03-18T11:59:55Z",
    },
    capabilities: {
      orderTypes: ["LIMIT", "MARKET"],
      maxOrderSize: 5000000,
      minOrderSize: 1,
      tickSize: 0.1,
      makerFee: 0,
      takerFee: 2.5,
    },
    volume: {
      daily: 8500000000,
      weekly: 59500000000,
      marketShare: 8.4,
    },
    quality: {
      fillRate: 97.5,
      avgSlippage: 1.8,
      rejectRate: 1.2,
      latencyP50: 35,
      latencyP99: 120,
    },
  },
  {
    id: "deribit",
    name: "Deribit",
    type: "CEX",
    region: "EU",
    connectivity: {
      status: "connected",
      latency: 25,
      lastHeartbeat: "2024-03-18T11:59:56Z",
    },
    capabilities: {
      orderTypes: ["LIMIT", "MARKET", "STOP"],
      maxOrderSize: 15000000,
      minOrderSize: 100,
      tickSize: 0.5,
      makerFee: 0,
      takerFee: 3,
    },
    volume: {
      daily: 4200000000,
      weekly: 29400000000,
      marketShare: 4.2,
    },
    quality: {
      fillRate: 99.5,
      avgSlippage: 0.6,
      rejectRate: 0.2,
      latencyP50: 18,
      latencyP99: 65,
    },
  },
  {
    id: "bybit",
    name: "Bybit",
    type: "CEX",
    region: "Global",
    connectivity: {
      status: "degraded",
      latency: 85,
      lastHeartbeat: "2024-03-18T11:59:45Z",
    },
    capabilities: {
      orderTypes: ["LIMIT", "MARKET", "STOP", "STOP_LIMIT"],
      maxOrderSize: 6000000,
      minOrderSize: 10,
      tickSize: 0.05,
      makerFee: 1,
      takerFee: 2,
    },
    volume: {
      daily: 18000000000,
      weekly: 126000000000,
      marketShare: 14.2,
    },
    quality: {
      fillRate: 98.2,
      avgSlippage: 1.4,
      rejectRate: 0.8,
      latencyP50: 15,
      latencyP99: 80,
    },
  },
]

// ============================================================================
// Recent Orders
// ============================================================================

export const MOCK_RECENT_ORDERS: ExecutionOrder[] = [
  {
    id: "ord-001",
    instrument: "ETH-PERP",
    side: "BUY",
    quantity: 125000,
    filledQty: 125000,
    avgPrice: 3245.50,
    algo: "VWAP",
    venue: "binance",
    createdAt: "2024-03-18T11:45:00Z",
    updatedAt: "2024-03-18T11:52:00Z",
    filledAt: "2024-03-18T11:52:00Z",
    status: "filled",
    tca: {
      arrivalPrice: 3244.20,
      vwap: 3245.80,
      twap: 3245.40,
      slippage: 4.0,
      marketImpact: 2.5,
      timingCost: 0.8,
      totalCost: 7.3,
    },
  },
  {
    id: "ord-002",
    instrument: "BTC-PERP",
    side: "SELL",
    quantity: 85000,
    filledQty: 72000,
    avgPrice: 68420.00,
    limitPrice: 68400.00,
    algo: "TWAP",
    venue: "okx",
    createdAt: "2024-03-18T11:30:00Z",
    updatedAt: "2024-03-18T11:55:00Z",
    status: "partial",
    tca: {
      arrivalPrice: 68450.00,
      vwap: 68415.00,
      twap: 68425.00,
      slippage: -4.4,
      marketImpact: 1.2,
      timingCost: 1.5,
      totalCost: -1.7,
    },
  },
  {
    id: "ord-003",
    instrument: "SOL-PERP",
    side: "BUY",
    quantity: 45000,
    filledQty: 45000,
    avgPrice: 142.85,
    algo: "SNIPER",
    venue: "hyperliquid",
    createdAt: "2024-03-18T11:50:00Z",
    updatedAt: "2024-03-18T11:50:02Z",
    filledAt: "2024-03-18T11:50:02Z",
    status: "filled",
    tca: {
      arrivalPrice: 142.90,
      vwap: 142.88,
      twap: 142.86,
      slippage: -3.5,
      marketImpact: 0.8,
      timingCost: 0.2,
      totalCost: -2.5,
    },
  },
]

// ============================================================================
// Algo Backtests
// ============================================================================

export const MOCK_ALGO_BACKTESTS: AlgoBacktest[] = [
  {
    id: "bt-exec-001",
    algoId: "algo-vwap-v3",
    algoVersion: "3.0.1",
    testPeriod: {
      start: "2024-01-01",
      end: "2024-03-15",
      numOrders: 12450,
    },
    instruments: ["ETH-PERP", "BTC-PERP", "SOL-PERP"],
    venues: ["binance", "okx", "hyperliquid"],
    metrics: {
      avgSlippage: 0.92,
      slippageP50: 0.65,
      slippageP95: 2.8,
      avgFillRate: 96.4,
      avgLatency: 48,
      costVsVWAP: -0.15,
      costVsTWAP: 0.22,
      costVsArrival: 0.85,
    },
    byVolatility: {
      low: { slippage: 0.45, fillRate: 98.2 },
      medium: { slippage: 0.88, fillRate: 96.5 },
      high: { slippage: 1.85, fillRate: 93.1 },
    },
    byOrderSize: {
      small: { slippage: 0.32, fillRate: 99.1 },
      medium: { slippage: 0.75, fillRate: 97.2 },
      large: { slippage: 1.95, fillRate: 92.8 },
    },
    status: "completed",
    completedAt: "2024-03-16T08:00:00Z",
  },
  {
    id: "bt-exec-002",
    algoId: "algo-sniper-v2",
    algoVersion: "2.0.0",
    testPeriod: {
      start: "2024-02-01",
      end: "2024-03-15",
      numOrders: 8200,
    },
    instruments: ["ETH-PERP", "BTC-PERP"],
    venues: ["binance", "hyperliquid"],
    metrics: {
      avgSlippage: 0.48,
      slippageP50: 0.25,
      slippageP95: 1.6,
      avgFillRate: 88.5,
      avgLatency: 11,
      costVsVWAP: -2.2,
      costVsTWAP: -1.8,
      costVsArrival: -0.5,
    },
    byVolatility: {
      low: { slippage: 0.22, fillRate: 92.5 },
      medium: { slippage: 0.45, fillRate: 89.2 },
      high: { slippage: 0.88, fillRate: 82.1 },
    },
    byOrderSize: {
      small: { slippage: 0.18, fillRate: 94.2 },
      medium: { slippage: 0.42, fillRate: 88.5 },
      large: { slippage: 1.12, fillRate: 78.5 },
    },
    status: "completed",
    completedAt: "2024-03-16T10:00:00Z",
  },
]

// ============================================================================
// Execution Candidates
// ============================================================================

export const MOCK_EXECUTION_CANDIDATES: ExecutionCandidate[] = [
  {
    id: "exec-cand-001",
    algoId: "algo-vwap-v3.1",
    algoVersion: "3.1.0",
    sourceBacktest: "bt-exec-001",
    metrics: {
      avgSlippage: 0.78,
      avgFillRate: 97.2,
      costVsBenchmark: -0.42,
      latencyP99: 52,
    },
    champion: {
      algoId: "algo-vwap-v3",
      metrics: {
        avgSlippage: 0.92,
        avgFillRate: 96.4,
        costVsBenchmark: -0.15,
      },
      improvement: {
        slippage: 15.2,
        fillRate: 0.8,
        cost: 180,
      },
    },
    checks: {
      backtestCoverage: true,
      stressTest: true,
      latencyTest: true,
      venueCompatibility: true,
    },
    status: "approved",
    reviewedBy: "alice@odum.com",
    reviewedAt: "2024-03-17T14:00:00Z",
    notes: "Improved volume prediction model shows consistent gains.",
  },
  {
    id: "exec-cand-002",
    algoId: "algo-sniper-v2.1",
    algoVersion: "2.1.0",
    sourceBacktest: "bt-exec-002",
    metrics: {
      avgSlippage: 0.42,
      avgFillRate: 90.1,
      costVsBenchmark: -2.5,
      latencyP99: 15,
    },
    champion: {
      algoId: "algo-sniper-v2",
      metrics: {
        avgSlippage: 0.48,
        avgFillRate: 88.5,
        costVsBenchmark: -2.2,
      },
      improvement: {
        slippage: 12.5,
        fillRate: 1.8,
        cost: 13.6,
      },
    },
    checks: {
      backtestCoverage: true,
      stressTest: true,
      latencyTest: false,
      venueCompatibility: true,
    },
    status: "pending",
    notes: "Pending latency test on Hyperliquid under high load.",
  },
]

// ============================================================================
// Metrics Snapshot
// ============================================================================

export const MOCK_EXECUTION_METRICS: ExecutionMetricsSnapshot = {
  timestamp: "2024-03-18T12:00:00Z",
  ordersExecuted: 1245,
  volumeTraded: 185000000,
  avgSlippage: 0.95,
  avgFillRate: 97.2,
  avgLatency: 28,
  rejects: 12,
  timeouts: 3,
  partialFills: 45,
  byVenue: {
    binance: { orders: 520, volume: 82000000, slippage: 0.75, latency: 12 },
    okx: { orders: 380, volume: 58000000, slippage: 0.92, latency: 18 },
    hyperliquid: { orders: 215, volume: 28000000, slippage: 1.35, latency: 45 },
    deribit: { orders: 85, volume: 12000000, slippage: 0.55, latency: 22 },
    bybit: { orders: 45, volume: 5000000, slippage: 1.82, latency: 85 },
  },
  byAlgo: {
    TWAP: { orders: 320, volume: 48000000, slippage: 1.1, fillRate: 98.5 },
    VWAP: { orders: 480, volume: 72000000, slippage: 0.85, fillRate: 96.8 },
    IS: { orders: 180, volume: 32000000, slippage: 1.4, fillRate: 95.2 },
    SNIPER: { orders: 145, volume: 18000000, slippage: 0.45, fillRate: 88.5 },
    ICEBERG: { orders: 85, volume: 12000000, slippage: 1.8, fillRate: 99.2 },
    POV: { orders: 0, volume: 0, slippage: 0, fillRate: 0 },
    ARRIVAL: { orders: 0, volume: 0, slippage: 0, fillRate: 0 },
    CLOSE: { orders: 35, volume: 3000000, slippage: 0.65, fillRate: 97.8 },
    ADAPTIVE: { orders: 0, volume: 0, slippage: 0, fillRate: 0 },
  },
}
