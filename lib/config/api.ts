/**
 * API configuration — service endpoints grouped by domain.
 *
 * Base URL comes from NEXT_PUBLIC_API_BASE_URL (default: "" for same-origin).
 * Each service prefix matches the openapi.json tag structure.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? ""

/** Default timeout for API requests (ms) */
export const API_TIMEOUT = 30_000

/** Per-service endpoint prefixes (from openapi.json path prefixes) */
export const SERVICE_ENDPOINTS = {
  // --- Core trading ---
  execution: `${API_BASE}/execution-service`,
  executionResults: `${API_BASE}/execution-results-api`,
  positions: `${API_BASE}/position-balance-monitor-service`,
  risk: `${API_BASE}/risk-and-exposure-service`,
  pnl: `${API_BASE}/pnl-attribution-service`,
  strategy: `${API_BASE}/trading-analytics-api`,

  // --- Data pipeline ---
  data: `${API_BASE}/market-data-api`,
  marketTick: `${API_BASE}/market-tick-data-service`,

  // --- ML ---
  mlInference: `${API_BASE}/ml-inference-api`,
  mlTraining: `${API_BASE}/ml-training-api`,

  // --- Platform features ---
  alerting: `${API_BASE}/alerting-service`,
  reporting: `${API_BASE}/client-reporting-api`,

  // --- Ops / internal ---
  deployment: `${API_BASE}/deployment-api`,
  deploymentService: `${API_BASE}/deployment-service`,
  config: `${API_BASE}/config-api`,
  audit: `${API_BASE}/batch-audit-api`,
  analytics: `${API_BASE}/trading-analytics-api`,
} as const

export type ServiceKey = keyof typeof SERVICE_ENDPOINTS
