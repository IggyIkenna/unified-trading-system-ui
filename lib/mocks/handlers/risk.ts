/**
 * Risk MSW Handler
 * 
 * Mock handlers for risk service.
 * All data is client-scoped via org context.
 * 
 * REAL endpoints (exist in openapi.json):
 *   GET /api/risk/limits — global shard limits
 *   GET /api/risk/exposure — current exposure
 * 
 * ASPIRATIONAL endpoints (mocked ahead of backend — see API_FRONTEND_GAPS.md):
 *   GET /api/risk/summary — aggregated risk dashboard
 *   GET /api/risk/limits/venues — per-venue breakdown (Gap 1.1, NOT STARTED)
 *   GET /api/risk/var — VaR component breakdown (not in openapi.json yet)
 *   GET /api/risk/greeks — portfolio Greeks (not in openapi.json yet)
 *   GET /api/risk/stress — stress scenario analysis (Gap 3.3, NOT PLANNED)
 */

import { http, HttpResponse, delay } from "msw"
import { API_CONFIG } from "@/lib/config"
import { getPersonaFromRequest, generateMockId } from "../utils"

// =============================================================================
// MOCK DATA GENERATORS
// =============================================================================

function generateRiskLimits(count: number) {
  const types = ["position", "exposure", "var", "drawdown", "concentration"]
  const scopes = ["portfolio", "venue", "category", "instrument"]
  
  return Array.from({ length: count }, (_, i) => {
    const limit = Math.random() * 1000000 + 100000
    const current = limit * (Math.random() * 0.9 + 0.1)
    const utilization = (current / limit) * 100
    const status = utilization > 90 ? "breach" : utilization > 75 ? "warning" : "ok"
    
    return {
      id: generateMockId(),
      name: `${scopes[i % scopes.length]}-${types[i % types.length]}-limit-${i + 1}`,
      type: types[i % types.length],
      scope: scopes[i % scopes.length],
      scopeValue: scopes[i % scopes.length] === "venue" ? ["Binance", "Coinbase", "Kraken"][i % 3] : undefined,
      limit,
      current,
      utilizationPercent: utilization,
      status,
      warningThreshold: 75,
      breachThreshold: 90,
      updatedAt: new Date().toISOString(),
    }
  })
}

function generateExposure() {
  const long = Math.random() * 5000000 + 1000000
  const short = Math.random() * 3000000 + 500000
  
  return {
    gross: long + short,
    net: long - short,
    long,
    short,
    byVenue: {
      Binance: Math.random() * 2000000,
      Coinbase: Math.random() * 1500000,
      Kraken: Math.random() * 1000000,
      OKX: Math.random() * 800000,
      Bybit: Math.random() * 600000,
    },
    byCategory: {
      Spot: Math.random() * 3000000,
      Perpetual: Math.random() * 2000000,
      Options: Math.random() * 1000000,
      Lending: Math.random() * 500000,
    },
    byRiskGroup: {
      "Core Holdings": Math.random() * 3000000,
      Tactical: Math.random() * 1500000,
      Hedges: Math.random() * 1000000,
      Yield: Math.random() * 500000,
    },
  }
}

function generateVaR() {
  const var95 = Math.random() * 100000 + 50000
  return {
    var95,
    var99: var95 * 1.4,
    cvar95: var95 * 1.2,
    cvar99: var95 * 1.6,
    horizon: "1d",
    method: "historical" as const,
    confidence: 0.95,
    byVenue: {
      Binance: var95 * 0.35,
      Coinbase: var95 * 0.25,
      Kraken: var95 * 0.2,
      OKX: var95 * 0.12,
      Bybit: var95 * 0.08,
    },
    breakdown: [
      { component: "BTC", contribution: 0.4, marginalVar: var95 * 0.45, componentVar: var95 * 0.35 },
      { component: "ETH", contribution: 0.25, marginalVar: var95 * 0.3, componentVar: var95 * 0.22 },
      { component: "SOL", contribution: 0.15, marginalVar: var95 * 0.18, componentVar: var95 * 0.15 },
      { component: "Other", contribution: 0.2, marginalVar: var95 * 0.25, componentVar: var95 * 0.18 },
    ],
  }
}

function generateGreeks() {
  return {
    delta: Math.random() * 2000000 - 1000000,
    gamma: Math.random() * 50000,
    theta: Math.random() * -20000,
    vega: Math.random() * 100000,
    rho: Math.random() * 30000,
  }
}

function generateStressScenarios() {
  return [
    {
      id: generateMockId(),
      name: "2022 Crypto Winter",
      description: "Simulates conditions from the 2022 crypto market crash",
      type: "historical" as const,
      impact: -450000,
      impactPercent: -15.5,
      assumptions: { btcDrop: -0.4, ethDrop: -0.5, altDrop: -0.7 },
      results: [
        { metric: "Portfolio Value", baseline: 3000000, stressed: 2550000, change: -450000, changePercent: -15 },
        { metric: "VaR 95%", baseline: 75000, stressed: 180000, change: 105000, changePercent: 140 },
      ],
    },
    {
      id: generateMockId(),
      name: "Black Swan -30%",
      description: "Hypothetical 30% market-wide drawdown",
      type: "hypothetical" as const,
      impact: -900000,
      impactPercent: -30,
      assumptions: { marketDrop: -0.3, volatilitySpike: 2.5 },
      results: [
        { metric: "Portfolio Value", baseline: 3000000, stressed: 2100000, change: -900000, changePercent: -30 },
        { metric: "Margin Utilization", baseline: 45, stressed: 85, change: 40, changePercent: 89 },
      ],
    },
    {
      id: generateMockId(),
      name: "Liquidity Crisis",
      description: "Major exchange liquidity crunch scenario",
      type: "hypothetical" as const,
      impact: -180000,
      impactPercent: -6,
      assumptions: { spreadWidening: 5, slippage: 0.02 },
      results: [
        { metric: "Execution Cost", baseline: 10000, stressed: 50000, change: 40000, changePercent: 400 },
        { metric: "Exit Time", baseline: 2, stressed: 12, change: 10, changePercent: 500 },
      ],
    },
  ]
}

function generateRiskSummary(limits: ReturnType<typeof generateRiskLimits>) {
  const breached = limits.filter(l => l.status === "breach").length
  const warning = limits.filter(l => l.status === "warning").length
  
  return {
    overallStatus: breached > 0 ? "critical" : warning > 0 ? "warning" : "ok",
    totalLimits: limits.length,
    breachedLimits: breached,
    warningLimits: warning,
    portfolioVar: 75000,
    netExposure: 2500000,
    grossExposure: 6500000,
    lastUpdated: new Date().toISOString(),
  }
}

// =============================================================================
// HANDLERS
// =============================================================================

export const riskHandlers = [
  // GET /api/risk/summary (ASPIRATIONAL)
  http.get(`${API_CONFIG.baseUrl}/api/risk/summary`, async ({ request }) => {
    await delay(150)
    
    const persona = getPersonaFromRequest(request)
    const limitCount = persona.role === "internal" ? 25 : 15
    const limits = generateRiskLimits(limitCount)
    const summary = generateRiskSummary(limits)
    
    return HttpResponse.json(summary)
  }),

  // GET /api/risk/limits (REAL)
  http.get(`${API_CONFIG.baseUrl}/api/risk/limits`, async ({ request }) => {
    await delay(150)
    
    const persona = getPersonaFromRequest(request)
    const url = new URL(request.url)
    
    const limitCount = persona.role === "internal" ? 25 : 15
    let limits = generateRiskLimits(limitCount)
    
    // Apply filters
    const scope = url.searchParams.get("scope")
    const status = url.searchParams.get("status")
    
    if (scope) limits = limits.filter(l => l.scope === scope)
    if (status) limits = limits.filter(l => l.status === status)
    
    return HttpResponse.json(limits)
  }),

  // GET /api/risk/exposure (REAL)
  http.get(`${API_CONFIG.baseUrl}/api/risk/exposure`, async ({ request }) => {
    await delay(100)
    
    const exposure = generateExposure()
    return HttpResponse.json(exposure)
  }),

  // GET /api/risk/var (ASPIRATIONAL)
  http.get(`${API_CONFIG.baseUrl}/api/risk/var`, async ({ request }) => {
    await delay(200)
    
    const varMetrics = generateVaR()
    return HttpResponse.json(varMetrics)
  }),

  // GET /api/risk/greeks (ASPIRATIONAL)
  http.get(`${API_CONFIG.baseUrl}/api/risk/greeks`, async ({ request }) => {
    await delay(100)
    
    const greeks = generateGreeks()
    return HttpResponse.json(greeks)
  }),

  // GET /api/risk/stress (ASPIRATIONAL)
  http.get(`${API_CONFIG.baseUrl}/api/risk/stress`, async ({ request }) => {
    await delay(300)
    
    const url = new URL(request.url)
    const type = url.searchParams.get("type")
    
    let scenarios = generateStressScenarios()
    if (type) scenarios = scenarios.filter(s => s.type === type)
    
    return HttpResponse.json(scenarios)
  }),
]
