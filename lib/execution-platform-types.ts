// Execution Platform Types
// TCA, Algo comparison, Venue analysis, Benchmark evaluation

// ============================================================================
// Core Execution Types
// ============================================================================

export type ExecutionAlgoType = 
  | "TWAP"
  | "VWAP"
  | "POV"
  | "IS"  // Implementation Shortfall
  | "ARRIVAL"
  | "CLOSE"
  | "ICEBERG"
  | "SNIPER"
  | "ADAPTIVE"

export type VenueType =
  | "CEX"      // Centralized Exchange
  | "DEX"      // Decentralized Exchange
  | "OTC"      // Over-the-counter
  | "DARK"     // Dark pool
  | "LIT"      // Lit exchange

export type OrderType = "LIMIT" | "MARKET" | "STOP" | "STOP_LIMIT" | "TRAILING"

export type Side = "BUY" | "SELL"

export type ExecutionStatus = 
  | "pending"
  | "active"
  | "filled"
  | "partial"
  | "cancelled"
  | "rejected"

// ============================================================================
// Execution Algo Definition
// ============================================================================

export interface ExecutionAlgo {
  id: string
  name: string
  type: ExecutionAlgoType
  version: string
  description: string
  
  // Parameters
  params: {
    aggressiveness: number  // 0-1
    minFillRate: number
    maxSpread: number
    participationRate?: number  // For POV
    timeHorizon?: number  // seconds
    priceLimit?: number
  }
  
  // Supported conditions
  supportedVenues: string[]
  supportedInstruments: string[]  // patterns like "ETH-*", "BTC-PERP"
  
  // Performance metrics
  metrics: {
    avgSlippage: number  // bps
    avgFillRate: number  // percentage
    avgLatency: number   // ms
    costVsBenchmark: number  // bps vs VWAP/TWAP
  }
  
  // Status
  status: "live" | "testing" | "deprecated"
  lastUpdated: string
}

// ============================================================================
// Venue Definition
// ============================================================================

export interface Venue {
  id: string
  name: string
  type: VenueType
  region: string
  
  // Connectivity
  connectivity: {
    status: "connected" | "degraded" | "disconnected"
    latency: number  // ms
    lastHeartbeat: string
  }
  
  // Capabilities
  capabilities: {
    orderTypes: OrderType[]
    maxOrderSize: number
    minOrderSize: number
    tickSize: number
    makerFee: number  // bps
    takerFee: number  // bps
  }
  
  // Volume metrics
  volume: {
    daily: number
    weekly: number
    marketShare: number  // percentage
  }
  
  // Quality metrics
  quality: {
    fillRate: number
    avgSlippage: number
    rejectRate: number
    latencyP50: number
    latencyP99: number
  }
}

// ============================================================================
// Execution Order
// ============================================================================

export interface ExecutionOrder {
  id: string
  parentOrderId?: string  // For child orders
  
  // Order details
  instrument: string
  side: Side
  quantity: number
  filledQty: number
  avgPrice: number
  limitPrice?: number
  
  // Routing
  algo: ExecutionAlgoType
  venue: string
  
  // Timing
  createdAt: string
  updatedAt: string
  filledAt?: string
  
  // Status
  status: ExecutionStatus
  
  // TCA metrics
  tca: {
    arrivalPrice: number
    vwap: number
    twap: number
    slippage: number  // bps
    marketImpact: number  // bps
    timingCost: number  // bps
    totalCost: number  // bps
  }
}

// ============================================================================
// TCA Analysis
// ============================================================================

export interface TCAReport {
  id: string
  orderId: string
  instrument: string
  
  // Benchmark comparisons
  benchmarks: {
    arrivalPrice: { value: number; cost: number }
    vwap: { value: number; cost: number }
    twap: { value: number; cost: number }
    close: { value: number; cost: number }
  }
  
  // Cost breakdown
  costBreakdown: {
    spread: number
    marketImpact: number
    timing: number
    fees: number
    total: number
  }
  
  // Execution quality
  quality: {
    fillRate: number
    participationRate: number
    timeToFill: number  // seconds
    numFills: number
    avgFillSize: number
  }
  
  // Market conditions during execution
  marketConditions: {
    volatility: number
    spread: number
    depth: number
    trend: "up" | "down" | "sideways"
  }
}

// ============================================================================
// Algo Backtest
// ============================================================================

export interface AlgoBacktest {
  id: string
  algoId: string
  algoVersion: string
  
  // Test parameters
  testPeriod: {
    start: string
    end: string
    numOrders: number
  }
  
  // Instruments tested
  instruments: string[]
  venues: string[]
  
  // Aggregate metrics
  metrics: {
    avgSlippage: number
    slippageP50: number
    slippageP95: number
    avgFillRate: number
    avgLatency: number
    costVsVWAP: number
    costVsTWAP: number
    costVsArrival: number
  }
  
  // Breakdown by conditions
  byVolatility: {
    low: { slippage: number; fillRate: number }
    medium: { slippage: number; fillRate: number }
    high: { slippage: number; fillRate: number }
  }
  
  byOrderSize: {
    small: { slippage: number; fillRate: number }
    medium: { slippage: number; fillRate: number }
    large: { slippage: number; fillRate: number }
  }
  
  // Status
  status: "completed" | "running" | "failed"
  completedAt?: string
}

// ============================================================================
// Venue Matrix
// ============================================================================

export interface VenueMatrix {
  instrument: string
  venues: Array<{
    venueId: string
    venueName: string
    
    // Pricing
    bestBid: number
    bestAsk: number
    spread: number
    
    // Depth
    bidDepth: number
    askDepth: number
    
    // Quality
    fillProbability: number
    expectedSlippage: number
    
    // Fees
    makerFee: number
    takerFee: number
    
    // Recommendation
    score: number  // 0-100
    recommended: boolean
  }>
  
  // Optimal routing
  optimalRoute: {
    venueId: string
    allocation: number
  }[]
}

// ============================================================================
// Execution Candidate (for promotion)
// ============================================================================

export interface ExecutionCandidate {
  id: string
  algoId: string
  algoVersion: string
  
  // Source
  sourceBacktest: string
  
  // Metrics
  metrics: {
    avgSlippage: number
    avgFillRate: number
    costVsBenchmark: number
    latencyP99: number
  }
  
  // Champion comparison
  champion?: {
    algoId: string
    metrics: {
      avgSlippage: number
      avgFillRate: number
      costVsBenchmark: number
    }
    improvement: {
      slippage: number  // percentage improvement
      fillRate: number
      cost: number
    }
  }
  
  // Validation
  checks: {
    backtestCoverage: boolean
    stressTest: boolean
    latencyTest: boolean
    venueCompatibility: boolean
  }
  
  // Review
  status: "pending" | "approved" | "rejected"
  reviewedBy?: string
  reviewedAt?: string
  notes?: string
}

// ============================================================================
// Real-time Execution Metrics
// ============================================================================

export interface ExecutionMetricsSnapshot {
  timestamp: string
  
  // Volume
  ordersExecuted: number
  volumeTraded: number
  
  // Quality
  avgSlippage: number
  avgFillRate: number
  avgLatency: number
  
  // Issues
  rejects: number
  timeouts: number
  partialFills: number
  
  // By venue
  byVenue: Record<string, {
    orders: number
    volume: number
    slippage: number
    latency: number
  }>
  
  // By algo
  byAlgo: Record<ExecutionAlgoType, {
    orders: number
    volume: number
    slippage: number
    fillRate: number
  }>
}
