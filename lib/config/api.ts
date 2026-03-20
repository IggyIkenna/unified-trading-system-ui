/**
 * API Configuration
 * 
 * Centralized API endpoints, base URLs, and timeouts.
 * Source: lib/registry/openapi.json (298 endpoints)
 */

// Base URLs by environment
export const API_BASE_URLS = {
  production: "https://api.odum.io",
  staging: "https://api.staging.odum.io",
  development: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
  mock: "/api/mock", // MSW intercepts these
} as const

// Current environment
export const API_ENV = (process.env.NEXT_PUBLIC_API_ENV || "mock") as keyof typeof API_BASE_URLS

// Whether to use mock data (MSW)
export const USE_MOCK_API = process.env.NEXT_PUBLIC_MOCK_API !== "false"

// Service endpoints grouped by domain
export const ENDPOINTS = {
  // Auth & User Management
  auth: {
    login: "/auth/login",
    logout: "/auth/logout",
    profile: "/auth/profile",
    refresh: "/auth/refresh",
  },
  
  // Data Service
  data: {
    instruments: "/data/instruments",
    catalogue: "/data/catalogue",
    subscriptions: "/data/subscriptions",
    queryLog: "/data/query-log",
    shardAvailability: "/data/shard-availability",
    downloadStatus: "/data/download-status",
  },
  
  // Execution Service
  execution: {
    orders: "/execution/orders",
    fills: "/execution/fills",
    algos: "/execution/algos",
    venues: "/execution/venues",
    tca: "/execution/tca",
    benchmarks: "/execution/benchmarks",
  },
  
  // Position & Balance Service
  positions: {
    list: "/positions",
    byVenue: "/positions/by-venue",
    byInstrument: "/positions/by-instrument",
    historical: "/positions/historical",
    riskGroups: "/positions/risk-groups",
    margin: "/positions/margin",
  },
  
  // Strategy Service
  strategy: {
    list: "/strategies",
    detail: (id: string) => `/strategies/${id}`,
    configs: "/strategies/configs",
    backtests: "/strategies/backtests",
    candidates: "/strategies/candidates",
    results: "/strategies/results",
  },
  
  // ML Service
  ml: {
    models: "/ml/models",
    features: "/ml/features",
    experiments: "/ml/experiments",
    training: "/ml/training",
    inference: "/ml/inference",
    registry: "/ml/registry",
    validation: "/ml/validation",
    governance: "/ml/governance",
  },
  
  // Risk Service
  risk: {
    exposure: "/risk/exposure",
    limits: "/risk/limits",
    var: "/risk/var",
    greeks: "/risk/greeks",
    stress: "/risk/stress",
  },
  
  // Trading & P&L Service
  trading: {
    pnl: "/trading/pnl",
    attribution: "/trading/attribution",
    performance: "/trading/performance",
    liveState: "/trading/live-state",
  },
  
  // Market Data Service
  marketData: {
    candles: "/market-data/candles",
    book: "/market-data/book",
    trades: "/market-data/trades",
    ticker: "/market-data/ticker",
  },
  
  // Alerts Service
  alerts: {
    list: "/alerts",
    create: "/alerts",
    acknowledge: (id: string) => `/alerts/${id}/acknowledge`,
    resolve: (id: string) => `/alerts/${id}/resolve`,
  },
  
  // Reporting Service
  reporting: {
    reports: "/reports",
    settlement: "/reports/settlement",
    reconciliation: "/reports/reconciliation",
    invoicing: "/reports/invoicing",
  },
  
  // Deployment Service (ops/internal)
  deployment: {
    services: "/deployment/services",
    deployments: "/deployment/deployments",
    shards: "/deployment/shards",
    builds: "/deployment/builds",
  },
  
  // Service Status (ops/internal)
  serviceStatus: {
    health: "/service-status/health",
    freshness: "/service-status/freshness",
    overview: "/service-status/overview",
  },
  
  // Audit Service (ops/internal)
  audit: {
    compliance: "/audit/compliance",
    events: "/audit/events",
    dataHealth: "/audit/data-health",
  },
  
  // User Management (scoped)
  userManagement: {
    orgs: "/user-management/orgs",
    users: "/user-management/users",
    roles: "/user-management/roles",
    subscriptions: "/user-management/subscriptions",
  },
} as const

// Request timeouts (ms)
export const TIMEOUTS = {
  default: 30000,
  longRunning: 120000, // backtests, reports
  realtime: 5000, // market data, live state
} as const

// Retry configuration
export const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // ms
  retryStatusCodes: [408, 429, 500, 502, 503, 504],
} as const

/**
 * Build full API URL
 */
export function buildApiUrl(endpoint: string, env = API_ENV): string {
  const baseUrl = API_BASE_URLS[env]
  return `${baseUrl}${endpoint}`
}

/**
 * Get endpoint with path params
 */
export function withParams(endpoint: string, params: Record<string, string>): string {
  let result = endpoint
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(`:${key}`, encodeURIComponent(value))
  }
  return result
}
