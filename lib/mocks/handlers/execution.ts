/**
 * Execution Service API Mock Handlers
 * 
 * Handles execution and TCA endpoints:
 * - GET /api/execution/venues
 * - GET /api/execution/algos
 * - GET /api/execution/orders
 * - GET /api/execution/tca
 * 
 * Scoping rules (from SHARDING_DIMENSIONS):
 * - Venue list is shared
 * - Orders and TCA are client-scoped (filtered by org)
 * - Internal users see aggregated cross-client view
 */

import { http, HttpResponse, delay } from "msw"
import { getCurrentPersona } from "../utils"
import { canAccessExecution } from "../fixtures/personas"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ""

// Mock venues (shared across all users)
const MOCK_VENUES = [
  { id: "binance", name: "Binance", type: "cefi", status: "online", latencyMs: 12 },
  { id: "bybit", name: "Bybit", type: "cefi", status: "online", latencyMs: 18 },
  { id: "okx", name: "OKX", type: "cefi", status: "online", latencyMs: 15 },
  { id: "deribit", name: "Deribit", type: "cefi", status: "online", latencyMs: 22 },
  { id: "coinbase", name: "Coinbase", type: "cefi", status: "degraded", latencyMs: 45 },
  { id: "hyperliquid", name: "Hyperliquid", type: "onchain", status: "online", latencyMs: 85 },
  { id: "databento", name: "Databento", type: "tradfi", status: "online", latencyMs: 8 },
]

// Mock algos
const MOCK_ALGOS = [
  { id: "twap", name: "TWAP", description: "Time-Weighted Average Price", enabled: true },
  { id: "vwap", name: "VWAP", description: "Volume-Weighted Average Price", enabled: true },
  { id: "iceberg", name: "Iceberg", description: "Hidden size execution", enabled: true },
  { id: "pov", name: "POV", description: "Percentage of Volume", enabled: true },
  { id: "sniper", name: "Sniper", description: "Liquidity seeking", enabled: false },
]

// Mock orders by org
const MOCK_ORDERS: Record<string, Array<{
  id: string
  symbol: string
  side: string
  qty: number
  filledQty: number
  price: number
  status: string
  venue: string
  algo: string
  createdAt: string
}>> = {
  odum: [
    { id: "ord-001", symbol: "BTCUSDT", side: "buy", qty: 10, filledQty: 10, price: 67420.5, status: "filled", venue: "binance", algo: "twap", createdAt: "2026-03-18T14:30:00Z" },
    { id: "ord-002", symbol: "ETHUSDT", side: "sell", qty: 50, filledQty: 35, price: 3890.25, status: "partial", venue: "bybit", algo: "vwap", createdAt: "2026-03-18T15:00:00Z" },
    { id: "ord-003", symbol: "SOLUSDT", side: "buy", qty: 1000, filledQty: 0, price: 142.80, status: "pending", venue: "okx", algo: "iceberg", createdAt: "2026-03-18T15:30:00Z" },
  ],
  acme: [
    { id: "ord-101", symbol: "BTCUSDT", side: "buy", qty: 5, filledQty: 5, price: 67400.0, status: "filled", venue: "binance", algo: "twap", createdAt: "2026-03-18T10:00:00Z" },
    { id: "ord-102", symbol: "ETHUSDT", side: "buy", qty: 25, filledQty: 25, price: 3885.50, status: "filled", venue: "binance", algo: "vwap", createdAt: "2026-03-18T11:00:00Z" },
  ],
  beta: [
    { id: "ord-201", symbol: "BTCUSDT", side: "sell", qty: 2, filledQty: 2, price: 67450.0, status: "filled", venue: "coinbase", algo: "twap", createdAt: "2026-03-17T09:00:00Z" },
  ],
}

export const executionHandlers = [
  // Get venues
  http.get(`${API_BASE}/api/execution/venues`, async () => {
    await delay(150)
    
    const persona = getCurrentPersona()
    
    // Check execution entitlement
    if (persona && !canAccessExecution(persona)) {
      return HttpResponse.json(
        { error: "Execution access not enabled for your subscription" },
        { status: 403 }
      )
    }
    
    return HttpResponse.json({
      venues: MOCK_VENUES,
    })
  }),
  
  // Get algos
  http.get(`${API_BASE}/api/execution/algos`, async () => {
    await delay(100)
    
    const persona = getCurrentPersona()
    
    if (persona && !canAccessExecution(persona)) {
      return HttpResponse.json(
        { error: "Execution access not enabled" },
        { status: 403 }
      )
    }
    
    return HttpResponse.json({
      algos: MOCK_ALGOS,
    })
  }),
  
  // Get orders (org-scoped)
  http.get(`${API_BASE}/api/execution/orders`, async ({ request }) => {
    await delay(200)
    
    const persona = getCurrentPersona()
    const url = new URL(request.url)
    const status = url.searchParams.get("status")
    const venue = url.searchParams.get("venue")
    
    if (persona && !canAccessExecution(persona)) {
      return HttpResponse.json(
        { error: "Execution access not enabled" },
        { status: 403 }
      )
    }
    
    let orders: typeof MOCK_ORDERS["odum"] = []
    
    if (!persona || persona.role === "internal") {
      // Internal users see all orders across all orgs
      orders = Object.values(MOCK_ORDERS).flat()
    } else {
      // Clients see only their org's orders
      orders = MOCK_ORDERS[persona.org.id] || []
    }
    
    // Apply filters
    if (status) {
      orders = orders.filter((o) => o.status === status)
    }
    if (venue) {
      orders = orders.filter((o) => o.venue === venue)
    }
    
    return HttpResponse.json({
      orders,
      total: orders.length,
    })
  }),
  
  // Get TCA metrics (org-scoped)
  http.get(`${API_BASE}/api/execution/tca`, async ({ request }) => {
    await delay(300)
    
    const persona = getCurrentPersona()
    const url = new URL(request.url)
    const period = url.searchParams.get("period") || "7d"
    
    if (persona && !canAccessExecution(persona)) {
      return HttpResponse.json(
        { error: "TCA access not enabled" },
        { status: 403 }
      )
    }
    
    // Generate different TCA metrics based on org
    const orgId = persona?.org.id || "odum"
    const baseSlippage = orgId === "odum" ? 0.02 : orgId === "acme" ? 0.035 : 0.045
    
    return HttpResponse.json({
      period,
      metrics: {
        avgSlippage: baseSlippage + Math.random() * 0.01,
        avgLatencyMs: 15 + Math.random() * 10,
        fillRate: 0.92 + Math.random() * 0.05,
        totalVolume: orgId === "odum" ? 15000000 : orgId === "acme" ? 5000000 : 1000000,
        orderCount: orgId === "odum" ? 1250 : orgId === "acme" ? 340 : 85,
      },
      byVenue: MOCK_VENUES.slice(0, 4).map((v) => ({
        venue: v.id,
        slippage: baseSlippage + Math.random() * 0.02,
        latencyMs: v.latencyMs + Math.random() * 5,
        fillRate: 0.9 + Math.random() * 0.08,
      })),
    })
  }),
]
