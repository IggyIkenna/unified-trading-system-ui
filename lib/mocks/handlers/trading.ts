/**
 * Trading MSW Handler
 * 
 * Mock handlers for trading/P&L data.
 * All data is client-scoped via org context.
 * 
 * REAL endpoints (exist in openapi.json):
 *   GET /api/trading/pnl/summary — P&L summary
 *   GET /api/trading/performance — performance metrics
 * 
 * ASPIRATIONAL endpoints (mocked ahead of backend):
 *   GET /api/trading/pnl/timeseries — historical P&L
 *   GET /api/trading/pnl/attribution — P&L breakdown
 *   GET /api/trading/activity — trading activity stats
 *   GET /api/trading/pnl/daily — daily P&L for calendar
 */

import { http, HttpResponse, delay } from "msw"
import { API_CONFIG } from "@/lib/config"
import { getPersonaFromRequest } from "../utils"

// =============================================================================
// MOCK DATA GENERATORS
// =============================================================================

function generatePnLSummary(scale: number = 1) {
  const realizedPnL = (Math.random() * 200000 - 50000) * scale
  const unrealizedPnL = (Math.random() * 100000 - 30000) * scale
  const fees = Math.abs(realizedPnL) * 0.001
  
  return {
    totalPnL: realizedPnL + unrealizedPnL,
    realizedPnL,
    unrealizedPnL,
    todayPnL: (Math.random() * 20000 - 5000) * scale,
    mtdPnL: (Math.random() * 80000 - 20000) * scale,
    ytdPnL: realizedPnL * 0.8,
    fees,
    netPnL: realizedPnL + unrealizedPnL - fees,
  }
}

function generatePnLTimeSeries(days: number, interval: string) {
  const points = interval === "1h" ? days * 24 : 
                 interval === "1d" ? days :
                 interval === "1w" ? Math.ceil(days / 7) :
                 Math.ceil(days / 30)
  
  let cumulative = 0
  return Array.from({ length: points }, (_, i) => {
    const daily = Math.random() * 10000 - 3000
    cumulative += daily
    const realized = daily * (0.3 + Math.random() * 0.4)
    
    return {
      timestamp: new Date(Date.now() - (points - i) * (interval === "1h" ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000)).toISOString(),
      cumulative,
      daily,
      realized,
      unrealized: daily - realized,
    }
  })
}

function generatePnLAttribution() {
  return {
    byVenue: {
      Binance: Math.random() * 50000 - 10000,
      Coinbase: Math.random() * 40000 - 8000,
      Kraken: Math.random() * 30000 - 6000,
      OKX: Math.random() * 25000 - 5000,
      Bybit: Math.random() * 20000 - 4000,
    },
    byCategory: {
      Spot: Math.random() * 60000 - 15000,
      Perpetual: Math.random() * 50000 - 12000,
      Options: Math.random() * 30000 - 8000,
      Lending: Math.random() * 10000,
    },
    byStrategy: {
      "Momentum Alpha": Math.random() * 40000 - 5000,
      "Mean Reversion": Math.random() * 35000 - 8000,
      "Arbitrage": Math.random() * 25000,
      "Market Making": Math.random() * 20000 - 3000,
      "Yield Farming": Math.random() * 15000,
    },
    byInstrument: {
      BTC: Math.random() * 45000 - 10000,
      ETH: Math.random() * 35000 - 8000,
      SOL: Math.random() * 25000 - 6000,
      AVAX: Math.random() * 15000 - 4000,
      Other: Math.random() * 20000 - 5000,
    },
  }
}

function generatePerformanceMetrics(scale: number = 1) {
  return {
    totalReturn: (Math.random() * 0.4 - 0.1) * scale,
    annualizedReturn: (Math.random() * 0.5 - 0.1) * scale,
    sharpeRatio: 1 + Math.random() * 2,
    sortinoRatio: 1.2 + Math.random() * 2.5,
    maxDrawdown: -(Math.random() * 0.15 + 0.05),
    maxDrawdownDuration: Math.floor(Math.random() * 30) + 5,
    winRate: 0.45 + Math.random() * 0.2,
    profitFactor: 1.1 + Math.random() * 1.5,
    avgWin: 2000 + Math.random() * 3000,
    avgLoss: -(1500 + Math.random() * 2000),
    payoffRatio: 1.2 + Math.random() * 0.8,
    calmarRatio: 0.5 + Math.random() * 2,
    volatility: 0.1 + Math.random() * 0.2,
    beta: 0.8 + Math.random() * 0.4,
    alpha: Math.random() * 0.1 - 0.02,
  }
}

function generateTradingActivity() {
  const totalTrades = Math.floor(Math.random() * 5000) + 1000
  return {
    totalTrades,
    buyTrades: Math.floor(totalTrades * (0.45 + Math.random() * 0.1)),
    sellTrades: Math.floor(totalTrades * (0.45 + Math.random() * 0.1)),
    avgTradeSize: 5000 + Math.random() * 15000,
    totalVolume: totalTrades * (5000 + Math.random() * 15000),
    avgHoldingPeriod: Math.random() * 48 + 2, // hours
    turnover: Math.random() * 5 + 1,
  }
}

function generateDailyPnL(days: number) {
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000)
    return {
      date: date.toISOString().split("T")[0],
      pnl: Math.random() * 15000 - 5000,
      trades: Math.floor(Math.random() * 100) + 10,
      volume: Math.random() * 500000 + 50000,
      fees: Math.random() * 500 + 50,
    }
  })
}

// =============================================================================
// HANDLERS
// =============================================================================

export const tradingHandlers = [
  // GET /api/trading/pnl/summary (REAL)
  http.get(`${API_CONFIG.baseUrl}/api/trading/pnl/summary`, async ({ request }) => {
    await delay(100)
    
    const persona = getPersonaFromRequest(request)
    const scale = persona.role === "internal" ? 2 : 1
    const summary = generatePnLSummary(scale)
    
    return HttpResponse.json(summary)
  }),

  // GET /api/trading/pnl/timeseries (ASPIRATIONAL)
  http.get(`${API_CONFIG.baseUrl}/api/trading/pnl/timeseries`, async ({ request }) => {
    await delay(200)
    
    const url = new URL(request.url)
    const interval = url.searchParams.get("interval") || "1d"
    const days = 30 // Default to 30 days
    
    const timeSeries = generatePnLTimeSeries(days, interval)
    return HttpResponse.json(timeSeries)
  }),

  // GET /api/trading/pnl/attribution (ASPIRATIONAL)
  http.get(`${API_CONFIG.baseUrl}/api/trading/pnl/attribution`, async ({ request }) => {
    await delay(150)
    
    const attribution = generatePnLAttribution()
    return HttpResponse.json(attribution)
  }),

  // GET /api/trading/performance (REAL)
  http.get(`${API_CONFIG.baseUrl}/api/trading/performance`, async ({ request }) => {
    await delay(150)
    
    const persona = getPersonaFromRequest(request)
    const scale = persona.role === "internal" ? 1.2 : 1
    const metrics = generatePerformanceMetrics(scale)
    
    return HttpResponse.json(metrics)
  }),

  // GET /api/trading/activity (ASPIRATIONAL)
  http.get(`${API_CONFIG.baseUrl}/api/trading/activity`, async ({ request }) => {
    await delay(100)
    
    const activity = generateTradingActivity()
    return HttpResponse.json(activity)
  }),

  // GET /api/trading/pnl/daily (ASPIRATIONAL)
  http.get(`${API_CONFIG.baseUrl}/api/trading/pnl/daily`, async ({ request }) => {
    await delay(150)
    
    const url = new URL(request.url)
    const startDate = url.searchParams.get("start")
    const endDate = url.searchParams.get("end")
    
    // Default to last 90 days
    const days = startDate && endDate 
      ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (24 * 60 * 60 * 1000))
      : 90
    
    const dailyPnL = generateDailyPnL(Math.min(days, 365))
    return HttpResponse.json(dailyPnL)
  }),
]
