/**
 * Strategy Service API Mock Handlers
 * 
 * Handles strategy and backtest endpoints:
 * - GET /api/strategies
 * - GET /api/strategies/:id
 * - GET /api/backtests
 * - GET /api/backtests/:id
 * 
 * Scoping rules (from SHARDING_DIMENSIONS):
 * - Strategies are client-scoped (each org has own strategies)
 * - Internal users see all strategies + can view any client's
 * - Backtest results follow same scoping as strategies
 */

import { http, HttpResponse, delay } from "msw"
import { getCurrentPersona } from "../utils"
import { canAccessStrategies } from "../fixtures/personas"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ""

// Mock strategies by org
const MOCK_STRATEGIES: Record<string, Array<{
  id: string
  name: string
  description: string
  status: "live" | "paper" | "backtest" | "draft"
  pnl30d: number
  sharpe: number
  maxDrawdown: number
  instruments: string[]
  createdAt: string
  updatedAt: string
}>> = {
  odum: [
    { id: "strat-001", name: "BTC Momentum Alpha", description: "Cross-exchange momentum strategy", status: "live", pnl30d: 125000, sharpe: 2.4, maxDrawdown: -0.08, instruments: ["BTCUSDT", "BTC-PERPETUAL"], createdAt: "2025-01-15", updatedAt: "2026-03-18" },
    { id: "strat-002", name: "ETH Basis Trade", description: "Spot-perp basis arbitrage", status: "live", pnl30d: 78000, sharpe: 3.1, maxDrawdown: -0.03, instruments: ["ETHUSDT", "ETH-USD"], createdAt: "2025-03-01", updatedAt: "2026-03-18" },
    { id: "strat-003", name: "Multi-Asset Vol", description: "Cross-asset volatility harvesting", status: "paper", pnl30d: 0, sharpe: 1.8, maxDrawdown: -0.12, instruments: ["BTCUSDT", "ETHUSDT", "SOLUSDT"], createdAt: "2026-02-01", updatedAt: "2026-03-17" },
    { id: "strat-004", name: "Funding Rate Arb", description: "Funding rate arbitrage across venues", status: "live", pnl30d: 45000, sharpe: 4.2, maxDrawdown: -0.02, instruments: ["BTCUSDT"], createdAt: "2025-06-01", updatedAt: "2026-03-18" },
  ],
  acme: [
    { id: "strat-101", name: "Conservative Momentum", description: "Low-risk momentum following", status: "live", pnl30d: 32000, sharpe: 1.6, maxDrawdown: -0.05, instruments: ["BTCUSDT"], createdAt: "2025-09-01", updatedAt: "2026-03-18" },
    { id: "strat-102", name: "Market Neutral ETH", description: "Delta-neutral ETH strategy", status: "paper", pnl30d: 0, sharpe: 1.2, maxDrawdown: -0.07, instruments: ["ETHUSDT"], createdAt: "2026-01-15", updatedAt: "2026-03-15" },
  ],
  beta: [
    { id: "strat-201", name: "Simple Trend", description: "Basic trend following", status: "draft", pnl30d: 0, sharpe: 0, maxDrawdown: 0, instruments: ["BTCUSDT"], createdAt: "2026-03-01", updatedAt: "2026-03-10" },
  ],
}

// Mock backtests
const MOCK_BACKTESTS: Record<string, Array<{
  id: string
  strategyId: string
  strategyName: string
  status: "running" | "completed" | "failed"
  startDate: string
  endDate: string
  totalReturn: number
  sharpe: number
  maxDrawdown: number
  trades: number
  winRate: number
  createdAt: string
}>> = {
  odum: [
    { id: "bt-001", strategyId: "strat-001", strategyName: "BTC Momentum Alpha", status: "completed", startDate: "2024-01-01", endDate: "2025-12-31", totalReturn: 0.85, sharpe: 2.1, maxDrawdown: -0.12, trades: 1240, winRate: 0.58, createdAt: "2026-03-15" },
    { id: "bt-002", strategyId: "strat-003", strategyName: "Multi-Asset Vol", status: "running", startDate: "2025-01-01", endDate: "2026-03-01", totalReturn: 0, sharpe: 0, maxDrawdown: 0, trades: 0, winRate: 0, createdAt: "2026-03-18" },
  ],
  acme: [
    { id: "bt-101", strategyId: "strat-101", strategyName: "Conservative Momentum", status: "completed", startDate: "2024-06-01", endDate: "2025-05-31", totalReturn: 0.42, sharpe: 1.5, maxDrawdown: -0.08, trades: 320, winRate: 0.52, createdAt: "2026-02-01" },
  ],
  beta: [],
}

export const strategyHandlers = [
  // Get strategies
  http.get(`${API_BASE}/api/strategies`, async ({ request }) => {
    await delay(200)
    
    const persona = getCurrentPersona()
    const url = new URL(request.url)
    const status = url.searchParams.get("status")
    const orgFilter = url.searchParams.get("org")
    
    if (persona && !canAccessStrategies(persona)) {
      return HttpResponse.json(
        { error: "Strategy access not enabled for your subscription" },
        { status: 403 }
      )
    }
    
    let strategies: typeof MOCK_STRATEGIES["odum"] = []
    
    if (!persona || persona.role === "internal") {
      // Internal users can see all or filter by org
      if (orgFilter) {
        strategies = MOCK_STRATEGIES[orgFilter] || []
      } else {
        strategies = Object.values(MOCK_STRATEGIES).flat()
      }
    } else {
      // Clients see only their org's strategies
      strategies = MOCK_STRATEGIES[persona.org.id] || []
    }
    
    // Apply status filter
    if (status) {
      strategies = strategies.filter((s) => s.status === status)
    }
    
    return HttpResponse.json({
      strategies,
      total: strategies.length,
    })
  }),
  
  // Get single strategy
  http.get(`${API_BASE}/api/strategies/:id`, async ({ params }) => {
    await delay(150)
    
    const { id } = params as { id: string }
    const persona = getCurrentPersona()
    
    if (persona && !canAccessStrategies(persona)) {
      return HttpResponse.json(
        { error: "Strategy access not enabled" },
        { status: 403 }
      )
    }
    
    // Find strategy across all orgs
    let strategy = null
    let strategyOrg = null
    
    for (const [orgId, strategies] of Object.entries(MOCK_STRATEGIES)) {
      const found = strategies.find((s) => s.id === id)
      if (found) {
        strategy = found
        strategyOrg = orgId
        break
      }
    }
    
    if (!strategy) {
      return HttpResponse.json(
        { error: "Strategy not found" },
        { status: 404 }
      )
    }
    
    // Check access - clients can only see their own strategies
    if (persona && persona.role !== "internal" && strategyOrg !== persona.org.id) {
      return HttpResponse.json(
        { error: "Access denied" },
        { status: 403 }
      )
    }
    
    return HttpResponse.json({
      strategy,
      org: strategyOrg,
    })
  }),
  
  // Get backtests
  http.get(`${API_BASE}/api/backtests`, async ({ request }) => {
    await delay(200)
    
    const persona = getCurrentPersona()
    const url = new URL(request.url)
    const strategyId = url.searchParams.get("strategyId")
    const status = url.searchParams.get("status")
    
    if (persona && !canAccessStrategies(persona)) {
      return HttpResponse.json(
        { error: "Backtest access not enabled" },
        { status: 403 }
      )
    }
    
    let backtests: typeof MOCK_BACKTESTS["odum"] = []
    
    if (!persona || persona.role === "internal") {
      backtests = Object.values(MOCK_BACKTESTS).flat()
    } else {
      backtests = MOCK_BACKTESTS[persona.org.id] || []
    }
    
    // Apply filters
    if (strategyId) {
      backtests = backtests.filter((b) => b.strategyId === strategyId)
    }
    if (status) {
      backtests = backtests.filter((b) => b.status === status)
    }
    
    return HttpResponse.json({
      backtests,
      total: backtests.length,
    })
  }),
  
  // Get single backtest
  http.get(`${API_BASE}/api/backtests/:id`, async ({ params }) => {
    await delay(150)
    
    const { id } = params as { id: string }
    const persona = getCurrentPersona()
    
    if (persona && !canAccessStrategies(persona)) {
      return HttpResponse.json(
        { error: "Backtest access not enabled" },
        { status: 403 }
      )
    }
    
    // Find backtest
    let backtest = null
    let backtestOrg = null
    
    for (const [orgId, backtests] of Object.entries(MOCK_BACKTESTS)) {
      const found = backtests.find((b) => b.id === id)
      if (found) {
        backtest = found
        backtestOrg = orgId
        break
      }
    }
    
    if (!backtest) {
      return HttpResponse.json(
        { error: "Backtest not found" },
        { status: 404 }
      )
    }
    
    // Check access
    if (persona && persona.role !== "internal" && backtestOrg !== persona.org.id) {
      return HttpResponse.json(
        { error: "Access denied" },
        { status: 403 }
      )
    }
    
    return HttpResponse.json({
      backtest,
      org: backtestOrg,
    })
  }),
]
