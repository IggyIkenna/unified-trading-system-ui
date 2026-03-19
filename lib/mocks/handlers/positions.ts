/**
 * Positions MSW Handler
 * 
 * Mock handlers for position-balance-monitor service.
 * All data is client-scoped via org context.
 * 
 * REAL endpoints (exist in openapi.json):
 *   GET /api/positions — current positions
 *   GET /api/positions/summary — position aggregates
 * 
 * ASPIRATIONAL endpoints (mocked ahead of backend):
 *   GET /api/positions/risk-groups — grouped by risk category
 *   GET /api/positions/margin — margin information
 *   GET /api/positions/history — historical snapshots
 */

import { http, HttpResponse, delay } from "msw"
import { API_CONFIG } from "@/lib/config"
import { getPersonaFromRequest, scopeDataByPersona, generateMockId } from "../utils"

// =============================================================================
// MOCK DATA
// =============================================================================

const VENUES = ["Binance", "Coinbase", "Kraken", "OKX", "Bybit", "Deribit"]
const CATEGORIES = ["Spot", "Perpetual", "Options", "Lending"]
const SYMBOLS = ["BTC", "ETH", "SOL", "AVAX", "MATIC", "ARB", "OP", "LINK", "UNI", "AAVE"]

function generatePositions(count: number, orgId: string) {
  return Array.from({ length: count }, (_, i) => {
    const side = Math.random() > 0.5 ? "long" : "short"
    const quantity = Math.floor(Math.random() * 1000) + 10
    const averagePrice = Math.random() * 50000 + 100
    const currentPrice = averagePrice * (1 + (Math.random() - 0.5) * 0.1)
    const marketValue = quantity * currentPrice
    const costBasis = quantity * averagePrice
    const unrealizedPnL = marketValue - costBasis
    
    return {
      id: generateMockId(),
      instrumentId: `${SYMBOLS[i % SYMBOLS.length]}-${CATEGORIES[i % CATEGORIES.length]}`,
      symbol: SYMBOLS[i % SYMBOLS.length],
      venue: VENUES[i % VENUES.length],
      category: CATEGORIES[i % CATEGORIES.length],
      side,
      quantity,
      averagePrice,
      currentPrice,
      marketValue,
      unrealizedPnL,
      unrealizedPnLPercent: (unrealizedPnL / costBasis) * 100,
      realizedPnL: Math.random() * 10000 - 5000,
      costBasis,
      exposure: side === "long" ? marketValue : -marketValue,
      riskGroup: ["Core Holdings", "Tactical", "Hedges", "Yield"][i % 4],
      openedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    }
  })
}

function generatePositionSummary(positions: ReturnType<typeof generatePositions>) {
  const longPositions = positions.filter(p => p.side === "long")
  const shortPositions = positions.filter(p => p.side === "short")
  
  return {
    totalPositions: positions.length,
    longPositions: longPositions.length,
    shortPositions: shortPositions.length,
    totalMarketValue: positions.reduce((sum, p) => sum + p.marketValue, 0),
    totalUnrealizedPnL: positions.reduce((sum, p) => sum + p.unrealizedPnL, 0),
    totalRealizedPnL: positions.reduce((sum, p) => sum + p.realizedPnL, 0),
    netExposure: positions.reduce((sum, p) => sum + p.exposure, 0),
    grossExposure: positions.reduce((sum, p) => sum + Math.abs(p.exposure), 0),
  }
}

function generateRiskGroups(positions: ReturnType<typeof generatePositions>) {
  const groups = ["Core Holdings", "Tactical", "Hedges", "Yield"]
  return groups.map(name => {
    const groupPositions = positions.filter(p => p.riskGroup === name)
    const totalMarketValue = groupPositions.reduce((sum, p) => sum + p.marketValue, 0)
    const limit = totalMarketValue * 1.5
    
    return {
      id: generateMockId(),
      name,
      positions: groupPositions,
      totalMarketValue,
      unrealizedPnL: groupPositions.reduce((sum, p) => sum + p.unrealizedPnL, 0),
      exposure: groupPositions.reduce((sum, p) => sum + p.exposure, 0),
      limit,
      utilizationPercent: (totalMarketValue / limit) * 100,
    }
  })
}

function generateMarginInfo() {
  const availableMargin = Math.random() * 1000000 + 500000
  const usedMargin = availableMargin * (Math.random() * 0.6 + 0.2)
  
  return {
    availableMargin,
    usedMargin,
    marginUtilization: (usedMargin / availableMargin) * 100,
    maintenanceMargin: usedMargin * 0.5,
    marginCallThreshold: 0.8,
    equity: availableMargin + Math.random() * 200000,
  }
}

// =============================================================================
// HANDLERS
// =============================================================================

export const positionsHandlers = [
  // GET /api/positions
  http.get(`${API_CONFIG.baseUrl}/api/positions`, async ({ request }) => {
    await delay(150)
    
    const persona = getPersonaFromRequest(request)
    const url = new URL(request.url)
    const orgId = url.searchParams.get("orgId") || persona.org?.id || "default"
    
    // Generate positions based on persona tier
    const positionCount = persona.role === "internal" ? 50 : 
                          persona.entitlements?.includes("execution-full") ? 30 : 10
    
    let positions = generatePositions(positionCount, orgId)
    
    // Apply filters
    const venue = url.searchParams.get("venue")
    const category = url.searchParams.get("category")
    const riskGroup = url.searchParams.get("riskGroup")
    const side = url.searchParams.get("side")
    
    if (venue) positions = positions.filter(p => p.venue === venue)
    if (category) positions = positions.filter(p => p.category === category)
    if (riskGroup) positions = positions.filter(p => p.riskGroup === riskGroup)
    if (side) positions = positions.filter(p => p.side === side)
    
    return HttpResponse.json(positions)
  }),

  // GET /api/positions/summary
  http.get(`${API_CONFIG.baseUrl}/api/positions/summary`, async ({ request }) => {
    await delay(100)
    
    const persona = getPersonaFromRequest(request)
    const url = new URL(request.url)
    const orgId = url.searchParams.get("orgId") || persona.org?.id || "default"
    
    const positionCount = persona.role === "internal" ? 50 : 30
    const positions = generatePositions(positionCount, orgId)
    const summary = generatePositionSummary(positions)
    
    return HttpResponse.json(summary)
  }),

  // GET /api/positions/risk-groups (ASPIRATIONAL)
  http.get(`${API_CONFIG.baseUrl}/api/positions/risk-groups`, async ({ request }) => {
    await delay(150)
    
    const persona = getPersonaFromRequest(request)
    const url = new URL(request.url)
    const orgId = url.searchParams.get("orgId") || persona.org?.id || "default"
    
    const positionCount = persona.role === "internal" ? 50 : 30
    const positions = generatePositions(positionCount, orgId)
    const riskGroups = generateRiskGroups(positions)
    
    return HttpResponse.json(riskGroups)
  }),

  // GET /api/positions/margin (ASPIRATIONAL)
  http.get(`${API_CONFIG.baseUrl}/api/positions/margin`, async ({ request }) => {
    await delay(100)
    
    const margin = generateMarginInfo()
    return HttpResponse.json(margin)
  }),

  // GET /api/positions/history (ASPIRATIONAL)
  http.get(`${API_CONFIG.baseUrl}/api/positions/history`, async ({ request }) => {
    await delay(200)
    
    const persona = getPersonaFromRequest(request)
    const url = new URL(request.url)
    const orgId = url.searchParams.get("orgId") || persona.org?.id || "default"
    
    // Generate historical snapshots
    const snapshots = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      const positions = generatePositions(20, orgId)
      return {
        timestamp: date.toISOString(),
        positions,
        summary: generatePositionSummary(positions),
      }
    })
    
    return HttpResponse.json(snapshots)
  }),
]
