"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PnLValue, PnLChange } from "@/components/trading/pnl-value"
import { EntityLink } from "@/components/trading/entity-link"
import {
  ArrowRight,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  FileText,
  BarChart3,
  Activity,
  Clock,
  Radio,
  Database,
  LineChart,
  LayoutGrid,
} from "lucide-react"
import { PNL_FACTORS, SERVICES } from "@/lib/reference-data"
import { ORGANIZATIONS, CLIENTS, STRATEGIES } from "@/lib/trading-data"
import { useTickers } from "@/hooks/api/use-market-data"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

// P&L Attribution waterfall component data
interface PnLComponent {
  name: string
  value: number
  percentage: number
  isNegative?: boolean
  category?: "structural" | "factor" | "diagnostic"
}

// Structural P&L - always shown at top
const structuralPnL: PnLComponent[] = [
  { name: "Realized", value: 847200, percentage: 81.4, category: "structural" },
  { name: "Unrealized", value: 193400, percentage: 18.6, category: "structural" },
]

// Residual - shown at bottom
const residualPnL: PnLComponent = { name: "Residual", value: 7300, percentage: 0.7, category: "diagnostic" }

// Colors for stacked chart factors
const FACTOR_COLORS: Record<string, string> = {
  Funding: "#10b981",
  Carry: "#3b82f6",
  Basis: "#8b5cf6",
  Delta: "#f59e0b",
  Gamma: "#ec4899",
  Vega: "#ef4444",
  Theta: "#f97316",
  Slippage: "#6b7280",
  Fees: "#94a3b8",
  Rebates: "#14b8a6",
}

// Generate mock time series data for stacked chart with cumulative drift
function generateTimeSeriesData(
  baseMultiplier: number = 1,
  isBatch: boolean = false,
  dateRange: string = "today"
): { data: Array<Record<string, number | string>>; netPnL: number } {
  const points = dateRange === "today" ? 24 : dateRange === "wtd" ? 7 : dateRange === "mtd" ? 30 : 12
  const labelFormat = dateRange === "today" ? (i: number) => `${i}:00` : 
                      dateRange === "wtd" ? (i: number) => ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i % 7] :
                      (i: number) => `Day ${i + 1}`
  
  // Timeframe multiplier - longer periods = more cumulative P&L
  const timeframeScale = dateRange === "today" ? 1 : dateRange === "wtd" ? 3.5 : dateRange === "mtd" ? 12 : 1
  
  // Seeded random for consistency per timeframe
  let seed = Math.floor(baseMultiplier * 1000) + (dateRange === "wtd" ? 500 : dateRange === "mtd" ? 1000 : 0)
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
  
  const data = []
  
  // Track cumulative values for drift
  let fundingCumulative = 0
  let carryCumulative = 0
  let basisCumulative = 0
  
  for (let i = 0; i < points; i++) {
    // Progressive drift - values grow over time (trending up)
    const progress = (i + 1) / points
    const driftFactor = 1 + progress * 0.5 // 50% growth over the period
    
    // Base values that grow with drift
    const fundingBase = (40000 + rand() * 20000) * baseMultiplier * timeframeScale
    const carryBase = (30000 + rand() * 15000) * baseMultiplier * timeframeScale
    const basisBase = (15000 + rand() * 10000) * baseMultiplier * timeframeScale
    
    // Apply drift to major positive factors
    fundingCumulative += fundingBase * driftFactor * (0.9 + rand() * 0.2)
    carryCumulative += carryBase * driftFactor * (0.9 + rand() * 0.2)
    basisCumulative += basisBase * driftFactor * (0.9 + rand() * 0.2)
    
    // Other factors with some variation
    const delta = (5000 + rand() * 8000) * baseMultiplier * timeframeScale * (0.8 + progress * 0.4)
    const gamma = (2000 + rand() * 5000) * baseMultiplier * timeframeScale * (0.8 + progress * 0.4)
    const rebates = (2000 + rand() * 2000) * baseMultiplier * timeframeScale * (0.9 + progress * 0.2)
    
    // Negative factors (costs) - also grow but slower
    const vega = (-1000 - rand() * 2000) * baseMultiplier * timeframeScale * (0.9 + progress * 0.2)
    const theta = (-1500 - rand() * 2500) * baseMultiplier * timeframeScale * (0.9 + progress * 0.2)
    const slippage = (-4000 - rand() * 3000) * baseMultiplier * timeframeScale * (0.9 + progress * 0.15)
    const fees = (-2500 - rand() * 2000) * baseMultiplier * timeframeScale * (0.9 + progress * 0.15)
    
    // Batch mode shows slightly different (historical) values
    const batchAdjust = isBatch ? 0.92 + rand() * 0.08 : 1
    
    data.push({
      time: labelFormat(i),
      Funding: Math.round(fundingCumulative / (i + 1) * batchAdjust),
      Carry: Math.round(carryCumulative / (i + 1) * batchAdjust),
      Basis: Math.round(basisCumulative / (i + 1) * batchAdjust),
      Delta: Math.round(delta * batchAdjust),
      Gamma: Math.round(gamma * batchAdjust),
      Vega: Math.round(vega * batchAdjust),
      Theta: Math.round(theta * batchAdjust),
      Slippage: Math.round(slippage * batchAdjust),
      Fees: Math.round(fees * batchAdjust),
      Rebates: Math.round(rebates * batchAdjust),
    })
  }
  
  // Calculate actual net P&L from the final data point (sum of all factors)
  const lastPoint = data[data.length - 1]
  const netPnL = Object.entries(lastPoint)
    .filter(([key]) => key !== "time")
    .reduce((sum, [, val]) => sum + (val as number), 0)
  
  return { data, netPnL }
}

// Generate P&L components based on filters
function generatePnLComponents(
  orgIds: string[],
  clientIds: string[],
  strategyIds: string[],
  isBatch: boolean
): PnLComponent[] {
  // Calculate a multiplier based on selected filters
  let multiplier = 1
  
  if (orgIds.length > 0) {
    multiplier *= 0.6 + (orgIds.length * 0.2)
  }
  if (clientIds.length > 0) {
    multiplier *= 0.5 + (clientIds.length * 0.25)
  }
  if (strategyIds.length > 0) {
    multiplier *= 0.3 + (strategyIds.length * 0.15)
  }
  
  // Batch mode shows historical snapshot (slightly different values)
  const batchAdjust = isBatch ? 0.92 : 1
  
  return [
    { name: PNL_FACTORS[0].label, value: Math.round(412000 * multiplier * batchAdjust), percentage: 39.6 },
    { name: PNL_FACTORS[1].label, value: Math.round(355000 * multiplier * batchAdjust), percentage: 34.1 },
    { name: PNL_FACTORS[2].label, value: Math.round(188000 * multiplier * batchAdjust), percentage: 18.1 },
    { name: PNL_FACTORS[3].label, value: Math.round(61000 * multiplier * batchAdjust), percentage: 5.9 },
    { name: PNL_FACTORS[4].label, value: Math.round(24000 * multiplier * batchAdjust), percentage: 2.3 },
    { name: PNL_FACTORS[5].label, value: Math.round(-8000 * multiplier * batchAdjust), percentage: -0.8, isNegative: true },
    { name: PNL_FACTORS[6].label, value: Math.round(-12000 * multiplier * batchAdjust), percentage: -1.2, isNegative: true },
    { name: PNL_FACTORS[7].label, value: Math.round(-61000 * multiplier * batchAdjust), percentage: -5.9, isNegative: true },
    { name: PNL_FACTORS[8].label, value: Math.round(-44000 * multiplier * batchAdjust), percentage: -4.2, isNegative: true },
    { name: PNL_FACTORS[9].label, value: Math.round(18000 * multiplier * batchAdjust), percentage: 1.7 },
  ]
}

// Generate strategy breakdown for a specific P&L factor
function generateStrategyBreakdown(factorName: string, totalValue: number, isBatch: boolean) {
  // Generate breakdown across strategies
  const strategies = STRATEGIES.slice(0, 6) // Top 6 strategies
  const parts: number[] = []
  let remaining = totalValue
  
  // Distribute the total across strategies with some randomness
  strategies.forEach((_, i) => {
    if (i === strategies.length - 1) {
      parts.push(remaining)
    } else {
      // Each strategy gets a portion with some randomness
      const portion = (remaining * (0.2 + Math.random() * 0.3))
      parts.push(portion)
      remaining -= portion
    }
  })
  
  const batchAdjust = isBatch ? 0.94 : 1
  
  return strategies.map((s, i) => ({
    id: s.id,
    name: s.name,
    client: CLIENTS.find(c => c.id === s.clientId)?.name || "Unknown",
    value: Math.round(parts[i] * batchAdjust),
    percentage: (parts[i] / totalValue) * 100,
  })).sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
}

// Generate time series for a single factor by strategy
function generateFactorTimeSeries(
  factorName: string, 
  baseValue: number,
  dateRange: string,
  isBatch: boolean
) {
  const points = dateRange === "today" ? 24 : dateRange === "wtd" ? 7 : dateRange === "mtd" ? 30 : 12
  const labelFormat = dateRange === "today" ? (i: number) => `${i}:00` : 
                      dateRange === "wtd" ? (i: number) => ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i % 7] :
                      (i: number) => `Day ${i + 1}`
  
  const strategies = STRATEGIES.slice(0, 5) // Top 5 for readability
  const data = []
  
  // Generate cumulative values per strategy with drift
  const strategyTotals = strategies.map(() => 0)
  
  for (let i = 0; i < points; i++) {
    const progress = (i + 1) / points
    const driftFactor = 1 + progress * 0.4
    const batchAdjust = isBatch ? 0.94 : 1
    
    const point: Record<string, string | number> = { time: labelFormat(i) }
    
    strategies.forEach((s, idx) => {
      // Each strategy contributes a portion
      const strategyShare = (0.15 + idx * 0.05) // Varying shares
      const value = (baseValue / points) * strategyShare * driftFactor * (0.8 + Math.random() * 0.4) * batchAdjust
      strategyTotals[idx] += value
      point[s.name] = Math.round(strategyTotals[idx] / (i + 1))
    })
    
    data.push(point)
  }
  
  return { data, strategies: strategies.map(s => s.name) }
}

// Generate client P&L based on filters
function generateClientPnL(orgIds: string[], clientIds: string[], isBatch: boolean) {
  const allClients = CLIENTS.map(c => {
    const org = ORGANIZATIONS.find(o => o.id === c.orgId)
    const strategies = STRATEGIES.filter(s => s.clientId === c.id)
    
    // Skip if filtered out
    if (orgIds.length > 0 && !orgIds.includes(c.orgId)) return null
    if (clientIds.length > 0 && !clientIds.includes(c.id)) return null
    
    // Generate PnL based on strategy count and type
    const basePnL = strategies.length * 85000 + Math.random() * 50000
    const batchAdjust = isBatch ? 0.94 : 1
    
    return {
      id: c.id,
      name: c.name,
      org: org?.name || "Unknown",
      pnl: Math.round(basePnL * batchAdjust),
      strategies: strategies.length,
      change: 5 + Math.random() * 10,
    }
  }).filter(Boolean) as Array<{ id: string; name: string; org: string; pnl: number; strategies: number; change: number }>
  
  return allClients.slice(0, 5)
}

// Venues by asset class
const CRYPTO_VENUES = ["Binance", "Coinbase", "Kraken", "OKX", "Bybit"]
const TRADFI_VENUES = ["NYSE", "NASDAQ", "CBOE", "IEX", "BATS"]
const DEFI_VENUES = ["Uniswap", "Curve", "Balancer", "SushiSwap", "1inch"]

// Order flow analytics types
interface OrderFlowEntry {
  id: string
  exchangeTime: string  // Exchange timestamp
  localTime: string     // Local receipt timestamp
  delayMs: number       // Latency in milliseconds
  type: "bid" | "ask" | "trade"
  side: "buy" | "sell"
  price: number
  size: number
  venue: string
  isOwn: boolean
  orderId?: string
  aggressor?: "buyer" | "seller"
  level?: number        // Book level (1-5) for bid/ask updates
}

// Live book update entry (combines book state + trade flow)
interface LiveBookUpdate {
  id: string
  exchangeTime: string
  localTime: string
  delayMs: number
  updateType: "book" | "trade"
  // For book updates - full 5-level snapshot
  bidLevels?: Array<{ price: number; size: number; updated?: boolean }>
  askLevels?: Array<{ price: number; size: number; updated?: boolean }>
  // For trades
  trade?: {
    price: number
    size: number
    side: "buy" | "sell"
    aggressor: "buyer" | "seller"
    isOwn: boolean
    orderId?: string
  }
  venue: string
}

// Generate live book updates with trades interspersed
function generateLiveBookUpdates(
  range: "1d" | "1w" | "1m",
  assetClass: "crypto" | "tradfi" | "defi",
  depth: number = 5
): LiveBookUpdate[] {
  const updates: LiveBookUpdate[] = []
  const count = range === "1d" ? 200 : range === "1w" ? 800 : 2000
  const venues = assetClass === "crypto" ? CRYPTO_VENUES : 
                 assetClass === "tradfi" ? TRADFI_VENUES : DEFI_VENUES
  const basePrice = assetClass === "crypto" ? 67000 : assetClass === "tradfi" ? 450 : 1800
  const tickSize = assetClass === "crypto" ? 0.01 : assetClass === "tradfi" ? 0.01 : 0.1
  
  let seed = 12345
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
  
  // Use a stable reference date to avoid hydration mismatches
  const now = new Date("2026-03-18T12:00:00Z").getTime()
  const rangeMs = range === "1d" ? 24 * 60 * 60 * 1000 : 
                  range === "1w" ? 7 * 24 * 60 * 60 * 1000 : 
                  30 * 24 * 60 * 60 * 1000
  
  // Track current book state
  let currentMid = basePrice
  
  for (let i = 0; i < count; i++) {
    const exchangeTs = new Date(now - (i / count) * rangeMs)
    const delayMs = Math.floor(0.5 + rand() * 15) // 0.5-15ms latency
    const localTs = new Date(exchangeTs.getTime() + delayMs)
    const isTrade = rand() > 0.7 // 30% are trades
    const venue = venues[Math.floor(rand() * venues.length)]
    
    // Slight price drift
    currentMid += (rand() - 0.48) * tickSize * 5
    
    if (isTrade) {
      const isOwn = rand() > 0.92
      const side = rand() > 0.5 ? "buy" : "sell"
      const aggressor = rand() > 0.5 ? "buyer" : "seller"
      const tradePrice = currentMid + (rand() - 0.5) * tickSize * 2
      
      updates.push({
        id: `upd-${i}`,
        exchangeTime: exchangeTs.toISOString(),
        localTime: localTs.toISOString(),
        delayMs,
        updateType: "trade",
        trade: {
          price: Math.round(tradePrice * 100) / 100,
          size: Math.round((0.01 + rand() * 2) * 10000) / 10000,
          side,
          aggressor,
          isOwn,
          orderId: isOwn ? `ORD-${Math.floor(rand() * 100000)}` : undefined,
        },
        venue,
      })
    } else {
      // Book update - generate depth levels each side
      const spread = tickSize * (1 + rand() * 3)
      const updatedBidLevel = Math.floor(rand() * depth)
      const updatedAskLevel = Math.floor(rand() * depth)
      
      const bidLevels = Array.from({ length: depth }, (_, j) => ({
        price: Math.round((currentMid - spread / 2 - j * tickSize) * 100) / 100,
        size: Math.round((5 + rand() * 100) * 1000) / 1000,
        updated: j === updatedBidLevel,
      }))
      
      const askLevels = Array.from({ length: depth }, (_, j) => ({
        price: Math.round((currentMid + spread / 2 + j * tickSize) * 100) / 100,
        size: Math.round((5 + rand() * 100) * 1000) / 1000,
        updated: j === updatedAskLevel,
      }))
      
      updates.push({
        id: `upd-${i}`,
        exchangeTime: exchangeTs.toISOString(),
        localTime: localTs.toISOString(),
        delayMs,
        updateType: "book",
        bidLevels,
        askLevels,
        venue,
      })
    }
  }
  
  return updates
}

// Generate mock order flow data (for Market Orders tab)
function generateOrderFlowData(
  range: "1d" | "1w" | "1m",
  assetClass: "crypto" | "tradfi" | "defi"
): OrderFlowEntry[] {
  const entries: OrderFlowEntry[] = []
  const count = range === "1d" ? 100 : range === "1w" ? 500 : 1500
  const venues = assetClass === "crypto" ? CRYPTO_VENUES : 
                 assetClass === "tradfi" ? TRADFI_VENUES : DEFI_VENUES
  const basePrice = assetClass === "crypto" ? 67000 : assetClass === "tradfi" ? 450 : 1800
  
  let seed = 12345
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
  
  // Use a stable reference date to avoid hydration mismatches
  const now = new Date("2026-03-18T12:00:00Z").getTime()
  const rangeMs = range === "1d" ? 24 * 60 * 60 * 1000 : 
                  range === "1w" ? 7 * 24 * 60 * 60 * 1000 : 
                  30 * 24 * 60 * 60 * 1000
  
  for (let i = 0; i < count; i++) {
    const exchangeTs = new Date(now - rand() * rangeMs)
    const delayMs = Math.floor(0.5 + rand() * 15)
    const localTs = new Date(exchangeTs.getTime() + delayMs)
    const isTrade = rand() > 0.4
    const side = rand() > 0.5 ? "buy" : "sell"
    const priceOffset = (rand() - 0.5) * basePrice * 0.003
    const isOwn = rand() > 0.92
    
    entries.push({
      id: `ord-${i}-${now}`,
      exchangeTime: exchangeTs.toISOString(),
      localTime: localTs.toISOString(),
      delayMs,
      type: isTrade ? "trade" : (side === "buy" ? "bid" : "ask"),
      side,
      price: Math.round((basePrice + priceOffset) * 100) / 100,
      size: Math.round((0.01 + rand() * 2) * 10000) / 10000,
      venue: venues[Math.floor(rand() * venues.length)],
      isOwn,
      orderId: isOwn ? `ORD-${Math.floor(rand() * 100000)}` : undefined,
      aggressor: isTrade ? (rand() > 0.5 ? "buyer" : "seller") : undefined,
      level: !isTrade ? Math.floor(rand() * 5) + 1 : undefined,
    })
  }
  
  return entries.sort((a, b) => new Date(b.exchangeTime).getTime() - new Date(a.exchangeTime).getTime())
}

// Recon runs — sourced from API at component level, see MarketsPage

// Latency metrics - using real service names from SERVICES with lifecycle breakdown
interface LatencyMetric {
  service: string
  serviceId: string
  p50: number
  p95: number
  p99: number
  status: "healthy" | "warning" | "critical"
  // Lifecycle breakdown (stages within the service)
  lifecycle: {
    stage: string
    p50: number
    p95: number
    p99: number
  }[]
  // Batch mode comparison
  batch: {
    p50: number
    p95: number
    p99: number
  }
  // Time series data (last 24 data points)
  timeSeries: { time: string; p50: number; p95: number; p99: number }[]
}

// latencyMetrics — sourced from API at component level, see MarketsPage
const _latencyMetricsPlaceholder: LatencyMetric[] = [
  {
    service: SERVICES.find(s => s.id === "execution-service")?.name || "Execution Service",
    serviceId: "execution-service",
    p50: 2.1, p95: 8.4, p99: 15.2, 
    status: "healthy",
    lifecycle: [
      { stage: "Order Validation", p50: 0.3, p95: 0.8, p99: 1.2 },
      { stage: "Risk Check", p50: 0.5, p95: 1.5, p99: 2.8 },
      { stage: "Route Selection", p50: 0.4, p95: 1.2, p99: 2.1 },
      { stage: "Exchange Submit", p50: 0.6, p95: 3.5, p99: 6.2 },
      { stage: "Ack Processing", p50: 0.3, p95: 1.4, p99: 2.9 },
    ],
    batch: { p50: 2.0, p95: 8.1, p99: 14.8 },
    timeSeries: Array.from({ length: 24 }, (_, i) => ({
      time: `${i}:00`,
      p50: 2.1 + Math.sin(i / 3) * 0.5,
      p95: 8.4 + Math.sin(i / 3) * 1.5,
      p99: 15.2 + Math.sin(i / 3) * 3,
    })),
  },
  { 
    service: SERVICES.find(s => s.id === "market-data-processing-service")?.name || "Market Data",
    serviceId: "market-data-processing-service",
    p50: 0.3, p95: 1.2, p99: 2.8,
    status: "healthy",
    lifecycle: [
      { stage: "Feed Ingestion", p50: 0.05, p95: 0.15, p99: 0.3 },
      { stage: "Normalization", p50: 0.08, p95: 0.25, p99: 0.5 },
      { stage: "Validation", p50: 0.05, p95: 0.2, p99: 0.4 },
      { stage: "Aggregation", p50: 0.07, p95: 0.35, p99: 0.8 },
      { stage: "Distribution", p50: 0.05, p95: 0.25, p99: 0.8 },
    ],
    batch: { p50: 0.35, p95: 1.5, p99: 3.2 },
    timeSeries: Array.from({ length: 24 }, (_, i) => ({
      time: `${i}:00`,
      p50: 0.3 + Math.sin(i / 4) * 0.1,
      p95: 1.2 + Math.sin(i / 4) * 0.3,
      p99: 2.8 + Math.sin(i / 4) * 0.6,
    })),
  },
  { 
    service: SERVICES.find(s => s.id === "pnl-attribution-service")?.name || "P&L Attribution",
    serviceId: "pnl-attribution-service",
    p50: 8.1, p95: 22.3, p99: 45.1,
    status: "healthy",
    lifecycle: [
      { stage: "Position Fetch", p50: 1.2, p95: 3.5, p99: 7.2 },
      { stage: "Price Lookup", p50: 0.8, p95: 2.1, p99: 4.5 },
      { stage: "Factor Calc", p50: 3.5, p95: 9.8, p99: 18.2 },
      { stage: "Attribution", p50: 1.8, p95: 4.5, p99: 9.8 },
      { stage: "Aggregation", p50: 0.8, p95: 2.4, p99: 5.4 },
    ],
    batch: { p50: 12.5, p95: 35.2, p99: 68.4 },
    timeSeries: Array.from({ length: 24 }, (_, i) => ({
      time: `${i}:00`,
      p50: 8.1 + Math.sin(i / 2) * 2,
      p95: 22.3 + Math.sin(i / 2) * 5,
      p99: 45.1 + Math.sin(i / 2) * 10,
    })),
  },
  { 
    service: SERVICES.find(s => s.id === "ml-inference-service")?.name || "ML Inference",
    serviceId: "ml-inference-service",
    p50: 4.2, p95: 12.1, p99: 28.4,
    status: "warning",
    lifecycle: [
      { stage: "Feature Extract", p50: 0.8, p95: 2.2, p99: 4.8 },
      { stage: "Model Load", p50: 0.3, p95: 0.8, p99: 1.5 },
      { stage: "Inference", p50: 2.4, p95: 7.2, p99: 16.8 },
      { stage: "Post-process", p50: 0.5, p95: 1.4, p99: 3.2 },
      { stage: "Response", p50: 0.2, p95: 0.5, p99: 2.1 },
    ],
    batch: { p50: 3.8, p95: 10.2, p99: 22.1 },
    timeSeries: Array.from({ length: 24 }, (_, i) => ({
      time: `${i}:00`,
      p50: 4.2 + Math.sin(i / 3) * 1.5 + (i > 12 && i < 18 ? 2 : 0),
      p95: 12.1 + Math.sin(i / 3) * 4 + (i > 12 && i < 18 ? 5 : 0),
      p99: 28.4 + Math.sin(i / 3) * 8 + (i > 12 && i < 18 ? 12 : 0),
    })),
  },
  { 
    service: SERVICES.find(s => s.id === "alerting-service")?.name || "Alerting Service",
    serviceId: "alerting-service",
    p50: 1.2, p95: 4.8, p99: 9.2,
    status: "healthy",
    lifecycle: [
      { stage: "Rule Eval", p50: 0.4, p95: 1.5, p99: 2.8 },
      { stage: "Threshold Check", p50: 0.2, p95: 0.8, p99: 1.5 },
      { stage: "Alert Format", p50: 0.2, p95: 0.6, p99: 1.2 },
      { stage: "Channel Route", p50: 0.3, p95: 1.2, p99: 2.4 },
      { stage: "Delivery", p50: 0.1, p95: 0.7, p99: 1.3 },
    ],
    batch: { p50: 1.5, p95: 5.8, p99: 11.2 },
    timeSeries: Array.from({ length: 24 }, (_, i) => ({
      time: `${i}:00`,
      p50: 1.2 + Math.sin(i / 4) * 0.3,
      p95: 4.8 + Math.sin(i / 4) * 1.2,
      p99: 9.2 + Math.sin(i / 4) * 2.5,
    })),
  },
]

export default function MarketsPage() {
  const { data: tickersData, isLoading: tickersLoading } = useTickers()

  // API-sourced data with fallbacks for complex generated structures
  const reconRuns: Array<any> = (tickersData as any)?.reconRuns ?? []
  const latencyMetrics: LatencyMetric[] = (tickersData as any)?.latencyMetrics ?? _latencyMetricsPlaceholder
  const structuralPnLApi: typeof structuralPnL = (tickersData as any)?.structuralPnL ?? structuralPnL
  const residualPnLApi: typeof residualPnL = (tickersData as any)?.residualPnL ?? residualPnL

  const [groupBy, setGroupBy] = React.useState("all")
  const [dateRange, setDateRange] = React.useState("today")
  const [viewMode, setViewMode] = React.useState<"cross-section" | "time-series">("cross-section")
  const [dataMode, setDataMode] = React.useState<"live" | "batch">("live")
  
  // Drill-down state for P&L component breakdown
  const [selectedFactor, setSelectedFactor] = React.useState<string | null>(null)
  
  // Latency drill-down state
  const [latencyView, setLatencyView] = React.useState<"summary" | "detail">("summary")
  const [selectedLatencyService, setSelectedLatencyService] = React.useState<string | null>(null)
  const [latencyViewMode, setLatencyViewMode] = React.useState<"cross-section" | "time-series">("cross-section")
  const [latencyDataMode, setLatencyDataMode] = React.useState<"live" | "batch" | "compare">("live")
  
  // Order flow analytics state
  const [orderFlowRange, setOrderFlowRange] = React.useState<"1d" | "1w" | "1m">("1d")
  const [orderFlowView, setOrderFlowView] = React.useState<"orders" | "book" | "own">("orders")
  const [assetClass, setAssetClass] = React.useState<"crypto" | "tradfi" | "defi">("crypto")
  const [bookDepth, setBookDepth] = React.useState<number>(5)
  
  // Context filters - these would typically come from the context bar
  const [selectedOrgIds, setSelectedOrgIds] = React.useState<string[]>([])
  const [selectedClientIds, setSelectedClientIds] = React.useState<string[]>([])
  const [selectedStrategyIds, setSelectedStrategyIds] = React.useState<string[]>([])
  
  // Calculate multiplier for data generation based on filters
  const filterMultiplier = React.useMemo(() => {
    let m = 1
    if (selectedOrgIds.length > 0) m *= 0.6 + selectedOrgIds.length * 0.2
    if (selectedClientIds.length > 0) m *= 0.5 + selectedClientIds.length * 0.25
    if (selectedStrategyIds.length > 0) m *= 0.3 + selectedStrategyIds.length * 0.15
    return m
  }, [selectedOrgIds, selectedClientIds, selectedStrategyIds])
  
  // Generate data based on current state
  const pnlComponents = React.useMemo(() => 
    generatePnLComponents(selectedOrgIds, selectedClientIds, selectedStrategyIds, dataMode === "batch"),
    [selectedOrgIds, selectedClientIds, selectedStrategyIds, dataMode]
  )
  
  const netPnL = pnlComponents.reduce((sum, c) => sum + c.value, 0)
  
  const clientPnL = React.useMemo(() =>
    generateClientPnL(selectedOrgIds, selectedClientIds, dataMode === "batch"),
    [selectedOrgIds, selectedClientIds, dataMode]
  )
  
  // Generate time series data with calculated net P&L
  const { data: timeSeriesData, netPnL: timeSeriesNetPnL } = React.useMemo(() =>
    generateTimeSeriesData(filterMultiplier, dataMode === "batch", dateRange),
    [filterMultiplier, dataMode, dateRange]
  )
  
  // Use time series net for time series view, otherwise use cross-section net
  const displayNetPnL = viewMode === "time-series" ? timeSeriesNetPnL : netPnL
  
  // Order flow data
  const orderFlowData = React.useMemo(() => 
    generateOrderFlowData(orderFlowRange, assetClass),
    [orderFlowRange, assetClass]
  )
  
  // Live book updates (combined book state + trades)
  const liveBookUpdates = React.useMemo(() =>
    generateLiveBookUpdates(orderFlowRange, assetClass, bookDepth),
    [orderFlowRange, assetClass, bookDepth]
  )
  
  // Filter for own orders only
  const ownOrders = React.useMemo(() =>
    orderFlowData.filter(o => o.isOwn),
    [orderFlowData]
  )
  
  // Strategy breakdown for selected factor
  const selectedFactorData = React.useMemo(() => {
    if (!selectedFactor) return null
    const factorComponent = pnlComponents.find(c => c.name === selectedFactor)
    if (!factorComponent) return null
    
    const breakdown = generateStrategyBreakdown(selectedFactor, factorComponent.value, dataMode === "batch")
    const timeSeries = generateFactorTimeSeries(selectedFactor, factorComponent.value, dateRange, dataMode === "batch")
    
    return {
      factor: factorComponent,
      breakdown,
      timeSeries: timeSeries.data,
      strategyNames: timeSeries.strategies,
    }
  }, [selectedFactor, pnlComponents, dataMode, dateRange])

  if (tickersLoading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>

  return (
    <div className="p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Market Intelligence</h1>
            <p className="text-sm text-muted-foreground">
              P&L attribution, reconciliation, and post-trade analytics
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
              <Button
                variant={viewMode === "cross-section" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2 gap-1.5"
                onClick={() => setViewMode("cross-section")}
              >
                <LayoutGrid className="size-3.5" />
                Cross-Section
              </Button>
              <Button
                variant={viewMode === "time-series" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2 gap-1.5"
                onClick={() => setViewMode("time-series")}
              >
                <LineChart className="size-3.5" />
                Time Series
              </Button>
            </div>

            {/* Live/Batch Mode Toggle */}
            <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
              <Button
                variant={dataMode === "live" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2 gap-1.5"
                onClick={() => setDataMode("live")}
              >
                <Radio className="size-3.5" />
                Live
              </Button>
              <Button
                variant={dataMode === "batch" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2 gap-1.5"
                onClick={() => setDataMode("batch")}
              >
                <Database className="size-3.5" />
                Batch
              </Button>
            </div>

            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="wtd">Week to Date</SelectItem>
                <SelectItem value="mtd">Month to Date</SelectItem>
                <SelectItem value="ytd">Year to Date</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="gap-2">
              <FileText className="size-4" />
              Generate Report
            </Button>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="pnl" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pnl" className="gap-2">
              <TrendingUp className="size-4" />
              P&L Attribution
            </TabsTrigger>
            <TabsTrigger value="desk" className="gap-2">
              <Activity className="size-4" />
              Trade Desk
            </TabsTrigger>
            <TabsTrigger value="recon" className="gap-2">
              <AlertTriangle className="size-4" />
              Reconciliation
            </TabsTrigger>
            <TabsTrigger value="latency" className="gap-2">
              <Clock className="size-4" />
              Latency
            </TabsTrigger>
          </TabsList>

          {/* P&L Attribution Tab */}
          <TabsContent value="pnl" className="space-y-6">
            {/* Group By Controls */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Group By:</span>
              <div className="flex gap-2">
                {["all", "client", "strategy", "venue", "asset"].map((g) => (
                  <Button
                    key={g}
                    variant={groupBy === g ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setGroupBy(g)}
                    className="capitalize"
                  >
                    {g === "all" ? "Total" : g}
                  </Button>
                ))}
              </div>
              
              {/* Data mode indicator */}
              <div className="ml-auto flex items-center gap-2">
                <Badge variant={dataMode === "live" ? "default" : "secondary"} className="gap-1">
                  {dataMode === "live" ? <Radio className="size-3" /> : <Database className="size-3" />}
                  {dataMode === "live" ? "Live Data" : "Batch Snapshot"}
                </Badge>
              </div>
            </div>

            {/* Time Series View */}
            {viewMode === "time-series" ? (
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">P&L Attribution Over Time</CardTitle>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Net:</span>
                      <PnLValue value={timeSeriesNetPnL} size="lg" showSign />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={timeSeriesData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                        <XAxis 
                          dataKey="time" 
                          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                        />
                        <YAxis 
                          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                          width={70}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--popover)",
                            border: "1px solid var(--border)",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                          formatter={(value: number, name: string) => [
                            `$${value.toLocaleString()}`,
                            name
                          ]}
                        />
                        <Legend 
                          wrapperStyle={{ fontSize: "11px" }}
                          iconSize={10}
                        />
                        {/* Positive factors - stacked */}
                        <Area type="monotone" dataKey="Funding" stackId="positive" fill={FACTOR_COLORS.Funding} stroke={FACTOR_COLORS.Funding} fillOpacity={0.7} />
                        <Area type="monotone" dataKey="Carry" stackId="positive" fill={FACTOR_COLORS.Carry} stroke={FACTOR_COLORS.Carry} fillOpacity={0.7} />
                        <Area type="monotone" dataKey="Basis" stackId="positive" fill={FACTOR_COLORS.Basis} stroke={FACTOR_COLORS.Basis} fillOpacity={0.7} />
                        <Area type="monotone" dataKey="Delta" stackId="positive" fill={FACTOR_COLORS.Delta} stroke={FACTOR_COLORS.Delta} fillOpacity={0.7} />
                        <Area type="monotone" dataKey="Gamma" stackId="positive" fill={FACTOR_COLORS.Gamma} stroke={FACTOR_COLORS.Gamma} fillOpacity={0.7} />
                        <Area type="monotone" dataKey="Rebates" stackId="positive" fill={FACTOR_COLORS.Rebates} stroke={FACTOR_COLORS.Rebates} fillOpacity={0.7} />
                        {/* Negative factors shown separately below zero */}
                        <Area type="monotone" dataKey="Vega" stackId="negative" fill={FACTOR_COLORS.Vega} stroke={FACTOR_COLORS.Vega} fillOpacity={0.7} />
                        <Area type="monotone" dataKey="Theta" stackId="negative" fill={FACTOR_COLORS.Theta} stroke={FACTOR_COLORS.Theta} fillOpacity={0.7} />
                        <Area type="monotone" dataKey="Slippage" stackId="negative" fill={FACTOR_COLORS.Slippage} stroke={FACTOR_COLORS.Slippage} fillOpacity={0.7} />
                        <Area type="monotone" dataKey="Fees" stackId="negative" fill={FACTOR_COLORS.Fees} stroke={FACTOR_COLORS.Fees} fillOpacity={0.7} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    Stacked area chart showing P&L attribution factors over time. 
                    Positive factors (Funding, Carry, Basis, Delta, Gamma, Rebates) stack upward.
                    Negative factors (Vega, Theta, Slippage, Fees) stack downward.
                  </p>
                </CardContent>
              </Card>
            ) : (
              /* Cross-Section View */
              <div className="grid grid-cols-12 gap-6">
                {/* P&L Waterfall */}
                <Card className="col-span-7">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">P&L Waterfall</CardTitle>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Net:</span>
                        <PnLValue value={netPnL} size="lg" showSign />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Structural P&L - Realized/Unrealized/Total */}
                    <div className="space-y-2 pb-3 border-b border-border">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Structural</p>
                      {structuralPnL.map((component) => {
                        const totalStruct = structuralPnL.reduce((s, c) => s + c.value, 0)
                        const maxStructVal = Math.max(...structuralPnL.map((c) => c.value))
                        const width = (component.value / maxStructVal) * 100
                        return (
                          <div key={component.name} className="p-2 -mx-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">{component.name}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-muted-foreground">
                                  {((component.value / totalStruct) * 100).toFixed(1)}%
                                </span>
                                <PnLValue value={component.value} size="sm" showSign />
                              </div>
                            </div>
                            <div className="h-5 bg-muted rounded-md overflow-hidden">
                              <div
                                className={`h-full rounded-md transition-all duration-300 ${
                                  component.name === "Realized" 
                                    ? "bg-[var(--pnl-positive)]/70"
                                    : "bg-[var(--accent-blue)]/60"
                                }`}
                                style={{ width: `${width}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                      {/* Total */}
                      <div className="flex items-center justify-between px-2 pt-1">
                        <span className="text-sm font-semibold">Total P&L</span>
                        <PnLValue value={structuralPnL.reduce((s, c) => s + c.value, 0)} size="md" showSign />
                      </div>
                    </div>
                    
                    {/* Factor Attribution */}
                    <div className="space-y-2 py-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Factor Attribution</p>
                      {pnlComponents.map((component) => {
                        const maxValue = Math.max(...pnlComponents.map((c) => Math.abs(c.value)))
                        const width = (Math.abs(component.value) / maxValue) * 100
                        const isSelected = selectedFactor === component.name

                        return (
                          <div 
                            key={component.name} 
                            className={`group cursor-pointer rounded-lg p-2 -mx-2 transition-colors ${
                              isSelected 
                                ? "bg-primary/10 ring-1 ring-primary/30" 
                                : "hover:bg-muted/50"
                            }`}
                            onClick={() => setSelectedFactor(isSelected ? null : component.name)}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-sm font-medium ${isSelected ? "text-primary" : ""}`}>
                                {component.name}
                              </span>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-muted-foreground">
                                  {component.percentage > 0 ? "+" : ""}
                                  {component.percentage.toFixed(1)}%
                                </span>
                                <PnLValue value={component.value} size="sm" showSign />
                              </div>
                            </div>
                            <div className="h-5 bg-muted rounded-md overflow-hidden">
                              <div
                                className={`h-full rounded-md transition-all duration-300 ${
                                  component.isNegative
                                    ? "bg-[var(--pnl-negative)]/60"
                                    : "bg-[var(--pnl-positive)]/60"
                                }`}
                                style={{ width: `${width}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    
                    {/* Residual - Diagnostic */}
                    <div className="pt-3 border-t border-dashed border-[var(--status-warning)]/40 space-y-2">
                      <div 
                        className="p-2 -mx-2 rounded-lg bg-[var(--status-warning)]/5 border border-dashed border-[var(--status-warning)]/30"
                        title="Unexplained P&L — large residual indicates a missing risk factor."
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[var(--status-warning)]">
                              {residualPnL.name}
                            </span>
                            <span className="text-xs text-muted-foreground">(unexplained)</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground">
                              {residualPnL.percentage.toFixed(1)}%
                            </span>
                            <PnLValue value={residualPnL.value} size="sm" showSign />
                          </div>
                        </div>
                        <div className="h-4 bg-muted rounded-md overflow-hidden">
                          <div
                            className="h-full rounded-md bg-[var(--status-warning)]/50"
                            style={{ width: `${(Math.abs(residualPnL.value) / Math.max(...pnlComponents.map((c) => Math.abs(c.value)))) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Net Total */}
                    <div className="pt-4 border-t border-border">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">NET P&L</span>
                        <PnLValue value={netPnL} size="lg" showSign />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* P&L by Client */}
                <Card className="col-span-5">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">By Client</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {clientPnL.length > 0 ? clientPnL.map((client) => (
                      <div
                        key={client.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div>
                            <EntityLink
                              type="client"
                              id={client.id}
                              label={client.name}
                              className="font-medium"
                            />
                            <p className="text-xs text-muted-foreground">
                              {client.strategies} strategies • {client.org}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <PnLValue value={client.pnl} size="sm" showSign />
                          <PnLChange value={client.change} size="sm" className="justify-end" />
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-4 text-sm text-muted-foreground">
                        No clients match current filters
                      </div>
                    )}

                    <Button variant="ghost" className="w-full gap-2 mt-2">
                      View All Clients
                      <ArrowRight className="size-4" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Component Detail / Drill-down */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {selectedFactorData 
                      ? `${selectedFactorData.factor.name} Breakdown by Strategy`
                      : "Component Breakdown"
                    }
                  </CardTitle>
                  {selectedFactorData && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSelectedFactor(null)}
                    >
                      Clear Selection
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {selectedFactorData ? (
                  <div className="space-y-6">
                    {/* Strategy breakdown table */}
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground">By Strategy</h4>
                        {selectedFactorData.breakdown.map((item, idx) => {
                          const maxVal = Math.max(...selectedFactorData.breakdown.map(b => Math.abs(b.value)))
                          const width = (Math.abs(item.value) / maxVal) * 100
                          const isNegative = item.value < 0
                          
                          return (
                            <div key={item.id} className="group">
                              <div className="flex items-center justify-between mb-1">
                                <div>
                                  <EntityLink type="strategy" id={item.id} label={item.name} className="text-sm font-medium" />
                                  <span className="text-xs text-muted-foreground ml-2">({item.client})</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">{item.percentage.toFixed(1)}%</span>
                                  <PnLValue value={item.value} size="sm" showSign />
                                </div>
                              </div>
                              <div className="h-4 bg-muted rounded overflow-hidden">
                                <div 
                                  className={`h-full rounded transition-all ${isNegative ? "bg-[var(--pnl-negative)]/60" : "bg-[var(--pnl-positive)]/60"}`}
                                  style={{ width: `${width}%` }}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      
                      {/* Time series chart for this factor */}
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-3">Over Time</h4>
                        <div className="h-[200px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={selectedFactorData.timeSeries}>
                              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                              <XAxis dataKey="time" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                              <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} width={50} />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "var(--popover)",
                                  border: "1px solid var(--border)",
                                  borderRadius: "8px",
                                  fontSize: "11px",
                                }}
                                formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name]}
                              />
                              {selectedFactorData.strategyNames.map((name, idx) => {
                                const colors = ["#10b981", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6"]
                                return (
                                  <Area 
                                    key={name}
                                    type="monotone" 
                                    dataKey={name} 
                                    stackId="1"
                                    fill={colors[idx % colors.length]} 
                                    stroke={colors[idx % colors.length]}
                                    fillOpacity={0.6}
                                  />
                                )
                              })}
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      Showing {selectedFactorData.factor.name} attribution across top strategies. 
                      Total: <PnLValue value={selectedFactorData.factor.value} size="sm" showSign className="inline" />
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {viewMode === "time-series" 
                      ? "Time series view shows how each P&L factor contributes over time. Toggle filters above to see different slices of data."
                      : "Click any P&L component in the waterfall to drill down into per-strategy attribution with time series visualization."
                    }
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trade Desk Tab - Order Flow Analytics */}
          <TabsContent value="desk" className="space-y-6">
            {/* Controls */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex gap-2">
                {(["orders", "book", "own"] as const).map((view) => (
                  <Button
                    key={view}
                    variant={orderFlowView === view ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setOrderFlowView(view)}
                  >
                    {view === "orders" ? "Market Orders" : view === "book" ? "Live Book" : "My Orders"}
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-4">
                {/* Asset Class Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Asset:</span>
                  <Select value={assetClass} onValueChange={(v) => setAssetClass(v as "crypto" | "tradfi" | "defi")}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="crypto">Crypto</SelectItem>
                      <SelectItem value="tradfi">TradFi</SelectItem>
                      <SelectItem value="defi">DeFi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Date Range */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Range:</span>
                  <Select value={orderFlowRange} onValueChange={(v) => setOrderFlowRange(v as "1d" | "1w" | "1m")}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1d">1 Day</SelectItem>
                      <SelectItem value="1w">1 Week</SelectItem>
                      <SelectItem value="1m">1 Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Book Depth Selector - only show for Live Book view */}
                {orderFlowView === "book" && assetClass !== "defi" && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Depth:</span>
                    <Select value={bookDepth.toString()} onValueChange={(v) => setBookDepth(parseInt(v))}>
                      <SelectTrigger className="w-[80px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            {/* DeFi Notice */}
            {assetClass === "defi" && orderFlowView === "book" && (
              <Card className="border-amber-500/30 bg-amber-500/5">
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="size-5 text-amber-500" />
                    <div>
                      <p className="text-sm font-medium">DeFi Market Structure</p>
                      <p className="text-xs text-muted-foreground">
                        DeFi protocols use AMM (Automated Market Makers) rather than traditional order books. 
                        Showing swap/liquidity pool data instead.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Market Orders View */}
            {orderFlowView === "orders" && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Market Order Flow</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {assetClass === "crypto" ? "Crypto" : assetClass === "tradfi" ? "TradFi" : "DeFi"}
                      </Badge>
                      <Badge variant="outline">{orderFlowData.length} orders</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="max-h-[500px] overflow-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 sticky top-0">
                          <tr>
                            <th className="text-left p-2 font-medium">Exch Time</th>
                            <th className="text-left p-2 font-medium">Local</th>
                            <th className="text-right p-2 font-medium">Delay</th>
                            <th className="text-left p-2 font-medium">Type</th>
                            <th className="text-left p-2 font-medium">Side</th>
                            <th className="text-right p-2 font-medium">Price</th>
                            <th className="text-right p-2 font-medium">Size</th>
                            <th className="text-left p-2 font-medium">Venue</th>
                            <th className="text-left p-2 font-medium">Aggressor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orderFlowData.slice(0, 100).map((order) => (
                            <tr 
                              key={order.id} 
                              className={`border-t border-border hover:bg-muted/30 ${order.isOwn ? "bg-yellow-500/10" : ""}`}
                            >
                              <td className="p-2 font-mono text-xs">
                                {new Date(order.exchangeTime).toLocaleTimeString()}
                              </td>
                              <td className="p-2 font-mono text-xs text-muted-foreground">
                                {new Date(order.localTime).toLocaleTimeString()}
                              </td>
                              <td className="p-2 text-right font-mono text-xs text-muted-foreground">
                                {order.delayMs}ms
                              </td>
                              <td className="p-2">
                                <Badge variant={order.type === "trade" ? "default" : "outline"} className="text-xs">
                                  {order.type}
                                </Badge>
                              </td>
                              <td className="p-2">
                                <span className={order.side === "buy" ? "text-[var(--pnl-positive)]" : "text-[var(--pnl-negative)]"}>
                                  {order.side.toUpperCase()}
                                </span>
                              </td>
                              <td className="p-2 text-right font-mono">${order.price.toLocaleString()}</td>
                              <td className="p-2 text-right font-mono">{order.size.toFixed(4)}</td>
                              <td className="p-2 text-muted-foreground text-xs">{order.venue}</td>
                              <td className="p-2">
                                {order.aggressor && (
                                  <span className={`text-xs ${order.aggressor === "buyer" ? "text-[var(--pnl-positive)]" : "text-[var(--pnl-negative)]"}`}>
                                    {order.aggressor}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Showing latest 100 of {orderFlowData.length} orders. Yellow rows indicate own orders.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Live Book View - HFT Style - Flattened Table */}
            {orderFlowView === "book" && assetClass !== "defi" && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Live Order Book + Trades</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {assetClass === "crypto" ? CRYPTO_VENUES.join(", ") : TRADFI_VENUES.join(", ")}
                      </Badge>
                      <Badge variant="outline">{liveBookUpdates.length} updates</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-hidden bg-black/20">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs font-mono">
                        <thead className="bg-muted/30 sticky top-0">
                          <tr>
                            <th className="text-left p-1.5 font-medium whitespace-nowrap">Exch Time</th>
                            <th className="text-right p-1.5 font-medium whitespace-nowrap">Delay</th>
                            <th className="text-left p-1.5 font-medium whitespace-nowrap">Venue</th>
                            {/* Bids - reverse order (depth to 1) so best bid is near center */}
                            {Array.from({ length: bookDepth }, (_, i) => (
                              <th key={`bid-h-${i}`} className="text-right p-1.5 font-medium text-[var(--pnl-positive)] whitespace-nowrap">
                                Bid {bookDepth - i}
                              </th>
                            ))}
                            {/* Gap / Trade column */}
                            <th className="text-center p-1.5 font-medium whitespace-nowrap w-32 bg-muted/20">Trade</th>
                            {/* Asks - order 1 to depth */}
                            {Array.from({ length: bookDepth }, (_, i) => (
                              <th key={`ask-h-${i}`} className="text-left p-1.5 font-medium text-[var(--pnl-negative)] whitespace-nowrap">
                                Ask {i + 1}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/20">
                          {liveBookUpdates.slice(0, 100).map((update) => (
                            <tr 
                              key={update.id} 
                              className={
                                update.updateType === "trade" 
                                  ? update.trade?.isOwn 
                                    ? "bg-yellow-500/15" 
                                    : "bg-cyan-500/10"
                                  : "hover:bg-muted/20"
                              }
                            >
                              <td className="p-1.5 whitespace-nowrap">
                                {new Date(update.exchangeTime).toLocaleTimeString()}
                              </td>
                              <td className={`p-1.5 text-right whitespace-nowrap ${update.delayMs > 10 ? "text-amber-500" : "text-green-500"}`}>
                                {update.delayMs}ms
                              </td>
                              <td className="p-1.5 text-muted-foreground whitespace-nowrap">{update.venue}</td>
                              
                              {/* Bid levels 5 to 1 (reversed) */}
                              {update.updateType === "book" && update.bidLevels ? (
                                <>
                                  {[...update.bidLevels].reverse().map((level, i) => (
                                    <td 
                                      key={`bid-${i}`} 
                                      className={`p-1.5 text-right whitespace-nowrap ${
                                        level.updated ? "bg-[var(--pnl-positive)]/25 font-bold" : ""
                                      }`}
                                    >
                                      <span className="text-[var(--pnl-positive)]">${level.price.toLocaleString()}</span>
                                      <span className="text-muted-foreground ml-1">/{level.size.toFixed(1)}</span>
                                    </td>
                                  ))}
                                </>
                              ) : (
                                /* Empty bid cells for trade rows */
                                Array.from({ length: bookDepth }).map((_, i) => (
                                  <td key={`bid-empty-${i}`} className="p-1.5 text-center text-muted-foreground/30">-</td>
                                ))
                              )}
                              
                              {/* Center Trade column */}
                              <td className="p-1.5 text-center whitespace-nowrap">
                                {update.trade ? (
                                  <div className={`flex items-center justify-center gap-1 ${
                                    update.trade.isOwn ? "text-yellow-400" : "text-cyan-400"
                                  }`}>
                                    <span className={update.trade.side === "buy" ? "text-[var(--pnl-positive)]" : "text-[var(--pnl-negative)]"}>
                                      {update.trade.side === "buy" ? "B" : "S"}
                                    </span>
                                    <span className="font-bold">${update.trade.price.toLocaleString()}</span>
                                    <span className="text-muted-foreground">x{update.trade.size.toFixed(2)}</span>
                                    <span className={`text-[10px] ${
                                      update.trade.aggressor === "buyer" ? "text-[var(--pnl-positive)]" : "text-[var(--pnl-negative)]"
                                    }`}>
                                      {update.trade.aggressor === "buyer" ? "B" : "S"}
                                    </span>
                                    {update.trade.isOwn && <span className="text-yellow-400 font-bold">*</span>}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground/30">-</span>
                                )}
                              </td>
                              
                              {/* Ask levels 1 to 5 */}
                              {update.updateType === "book" && update.askLevels ? (
                                <>
                                  {update.askLevels.map((level, i) => (
                                    <td 
                                      key={`ask-${i}`} 
                                      className={`p-1.5 text-left whitespace-nowrap ${
                                        level.updated ? "bg-[var(--pnl-negative)]/25 font-bold" : ""
                                      }`}
                                    >
                                      <span className="text-[var(--pnl-negative)]">${level.price.toLocaleString()}</span>
                                      <span className="text-muted-foreground ml-1">/{level.size.toFixed(1)}</span>
                                    </td>
                                  ))}
                                </>
                              ) : (
                                /* Empty ask cells for trade rows */
                                Array.from({ length: bookDepth }).map((_, i) => (
                                  <td key={`ask-empty-${i}`} className="p-1.5 text-center text-muted-foreground/30">-</td>
                                ))
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-6 text-xs text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-cyan-500/40 rounded" /> Market Trade
                    </span>
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500/40 rounded" /> Own Trade (*)
                    </span>
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-[var(--pnl-positive)]/40 rounded" /> Updated Bid
                    </span>
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-[var(--pnl-negative)]/40 rounded" /> Updated Ask
                    </span>
                    <span className="ml-auto">Trade: B/S = Side, last letter = Aggressor</span>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* DeFi AMM View */}
            {orderFlowView === "book" && assetClass === "defi" && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Liquidity Pool Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="max-h-[500px] overflow-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 sticky top-0">
                          <tr>
                            <th className="text-left p-2 font-medium">Time</th>
                            <th className="text-left p-2 font-medium">Pool</th>
                            <th className="text-left p-2 font-medium">Action</th>
                            <th className="text-right p-2 font-medium">Amount In</th>
                            <th className="text-right p-2 font-medium">Amount Out</th>
                            <th className="text-right p-2 font-medium">Price Impact</th>
                            <th className="text-right p-2 font-medium">Gas</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orderFlowData.slice(0, 50).map((order, idx) => (
                            <tr 
                              key={order.id} 
                              className={`border-t border-border hover:bg-muted/30 ${order.isOwn ? "bg-yellow-500/10" : ""}`}
                            >
                              <td className="p-2 font-mono text-xs">
                                {new Date(order.exchangeTime).toLocaleTimeString()}
                              </td>
                              <td className="p-2 text-xs">{order.venue}</td>
                              <td className="p-2">
                                <Badge variant="outline" className="text-xs">
                                  {order.type === "trade" ? "Swap" : "LP"}
                                </Badge>
                              </td>
                              <td className="p-2 text-right font-mono">{order.size.toFixed(4)} ETH</td>
                              <td className="p-2 text-right font-mono">${order.price.toLocaleString()}</td>
                              <td className="p-2 text-right font-mono text-muted-foreground">
                                {(Math.random() * 0.5).toFixed(2)}%
                              </td>
                              <td className="p-2 text-right font-mono text-muted-foreground">
                                {Math.floor(20 + Math.random() * 50)} gwei
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    DeFi swaps and liquidity pool activity. No traditional order book - AMM pricing.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* My Orders View */}
            {orderFlowView === "own" && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">My Orders</CardTitle>
                    <Badge variant="outline">{ownOrders.length} orders</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {ownOrders.length > 0 ? (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="max-h-[500px] overflow-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50 sticky top-0">
                            <tr>
                              <th className="text-left p-2 font-medium">Order ID</th>
                              <th className="text-left p-2 font-medium">Exch Time</th>
                              <th className="text-left p-2 font-medium">Local</th>
                              <th className="text-right p-2 font-medium">Delay</th>
                              <th className="text-left p-2 font-medium">Type</th>
                              <th className="text-left p-2 font-medium">Side</th>
                              <th className="text-right p-2 font-medium">Price</th>
                              <th className="text-right p-2 font-medium">Size</th>
                              <th className="text-left p-2 font-medium">Venue</th>
                              <th className="text-left p-2 font-medium">Aggressor</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ownOrders.map((order) => (
                              <tr key={order.id} className="border-t border-border hover:bg-muted/30 bg-yellow-500/5">
                                <td className="p-2 font-mono text-xs text-yellow-500">{order.orderId}</td>
                                <td className="p-2 font-mono text-xs">
                                  {new Date(order.exchangeTime).toLocaleTimeString()}
                                </td>
                                <td className="p-2 font-mono text-xs text-muted-foreground">
                                  {new Date(order.localTime).toLocaleTimeString()}
                                </td>
                                <td className="p-2 text-right font-mono text-xs text-muted-foreground">
                                  {order.delayMs}ms
                                </td>
                                <td className="p-2">
                                  <Badge variant={order.type === "trade" ? "default" : "outline"} className="text-xs">
                                    {order.type === "trade" ? "Fill" : order.type}
                                  </Badge>
                                </td>
                                <td className="p-2">
                                  <span className={order.side === "buy" ? "text-[var(--pnl-positive)]" : "text-[var(--pnl-negative)]"}>
                                    {order.side.toUpperCase()}
                                  </span>
                                </td>
                                <td className="p-2 text-right font-mono">${order.price.toLocaleString()}</td>
                                <td className="p-2 text-right font-mono">{order.size.toFixed(4)}</td>
                                <td className="p-2 text-muted-foreground text-xs">{order.venue}</td>
                                <td className="p-2">
                                  {order.aggressor && (
                                    <span className={`text-xs ${order.aggressor === "buyer" ? "text-[var(--pnl-positive)]" : "text-[var(--pnl-negative)]"}`}>
                                      {order.aggressor}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="size-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Orders</h3>
                      <p className="text-sm text-muted-foreground">
                        No orders placed in the selected time range.
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-3">
                    Your order history with execution details. Shows exchange time, local receipt time, and latency.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Reconciliation Tab */}
          <TabsContent value="recon" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Reconciliation Runs</CardTitle>
                  <Badge variant="outline" className="gap-1">
                    <AlertTriangle className="size-3" />
                    2 Open Breaks
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reconRuns.map((run) => (
                    <div
                      key={run.date}
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-sm font-mono">{run.date}</div>
                        <Badge
                          variant={run.breaks === 0 ? "default" : run.resolved === run.breaks ? "secondary" : "destructive"}
                        >
                          {run.breaks === 0
                            ? "Clean"
                            : `${run.resolved}/${run.breaks} Resolved`}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-6">
                        {run.totalValue > 0 && (
                          <span className="text-sm text-muted-foreground">
                            Break Value: ${(run.totalValue / 1000).toFixed(1)}k
                          </span>
                        )}
                        <ArrowRight className="size-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Latency Tab - Comprehensive View */}
          <TabsContent value="latency" className="space-y-6">
            {/* Controls Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* View Mode Toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">View:</span>
                  <div className="flex rounded-md border border-border overflow-hidden">
                    <Button
                      variant={latencyViewMode === "cross-section" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setLatencyViewMode("cross-section")}
                      className="rounded-none gap-1.5"
                    >
                      <LayoutGrid className="size-3.5" />
                      Cross-Section
                    </Button>
                    <Button
                      variant={latencyViewMode === "time-series" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setLatencyViewMode("time-series")}
                      className="rounded-none gap-1.5"
                    >
                      <LineChart className="size-3.5" />
                      Time Series
                    </Button>
                  </div>
                </div>
                {/* Data Mode Toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Data:</span>
                  <div className="flex rounded-md border border-border overflow-hidden">
                    <Button
                      variant={latencyDataMode === "live" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setLatencyDataMode("live")}
                      className="rounded-none gap-1.5"
                    >
                      <Radio className="size-3.5" />
                      Live
                    </Button>
                    <Button
                      variant={latencyDataMode === "batch" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setLatencyDataMode("batch")}
                      className="rounded-none gap-1.5"
                    >
                      <Database className="size-3.5" />
                      Batch
                    </Button>
                    <Button
                      variant={latencyDataMode === "compare" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setLatencyDataMode("compare")}
                      className="rounded-none gap-1.5"
                    >
                      <BarChart3 className="size-3.5" />
                      Compare
                    </Button>
                  </div>
                </div>
              </div>
              {/* Back button when in detail view */}
              {selectedLatencyService && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedLatencyService(null)}
                >
                  Back to Summary
                </Button>
              )}
            </div>

            {/* Summary View */}
            {!selectedLatencyService && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Service Latency (ms)</CardTitle>
                    <Badge variant="outline" className="font-mono">
                      {latencyDataMode === "live" ? "Live" : latencyDataMode === "batch" ? "Batch (Simulated)" : "Live vs Batch"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {latencyMetrics.map((metric) => {
                      const displayP50 = latencyDataMode === "batch" ? metric.batch.p50 : metric.p50
                      const displayP95 = latencyDataMode === "batch" ? metric.batch.p95 : metric.p95
                      const displayP99 = latencyDataMode === "batch" ? metric.batch.p99 : metric.p99
                      const deltaP50 = metric.p50 - metric.batch.p50
                      const deltaP95 = metric.p95 - metric.batch.p95
                      const deltaP99 = metric.p99 - metric.batch.p99
                      
                      return (
                        <div
                          key={metric.service}
                          onClick={() => setSelectedLatencyService(metric.serviceId)}
                          className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`size-2.5 rounded-full ${
                                metric.status === "healthy"
                                  ? "bg-[var(--status-live)]"
                                  : metric.status === "warning"
                                  ? "bg-[var(--status-warning)]"
                                  : "bg-[var(--status-error)]"
                              }`}
                            />
                            <div>
                              <span className="font-medium">{metric.service}</span>
                              <div className="text-xs text-muted-foreground">{metric.lifecycle.length} stages</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            {latencyDataMode === "compare" ? (
                              /* Compare Mode - Show Live vs Batch with Deltas */
                              <>
                                <div className="text-center">
                                  <div className="text-xs text-muted-foreground mb-1">p50</div>
                                  <div className="font-mono text-sm">{metric.p50.toFixed(1)}ms</div>
                                  <div className={`text-xs font-mono ${deltaP50 > 0 ? "text-[var(--pnl-negative)]" : "text-[var(--pnl-positive)]"}`}>
                                    {deltaP50 > 0 ? "+" : ""}{deltaP50.toFixed(1)}ms
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="text-xs text-muted-foreground mb-1">p95</div>
                                  <div className="font-mono text-sm">{metric.p95.toFixed(1)}ms</div>
                                  <div className={`text-xs font-mono ${deltaP95 > 0 ? "text-[var(--pnl-negative)]" : "text-[var(--pnl-positive)]"}`}>
                                    {deltaP95 > 0 ? "+" : ""}{deltaP95.toFixed(1)}ms
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="text-xs text-muted-foreground mb-1">p99</div>
                                  <div className={`font-mono text-sm ${metric.p99 > 30 ? "text-[var(--status-warning)]" : ""}`}>
                                    {metric.p99.toFixed(1)}ms
                                  </div>
                                  <div className={`text-xs font-mono ${deltaP99 > 0 ? "text-[var(--pnl-negative)]" : "text-[var(--pnl-positive)]"}`}>
                                    {deltaP99 > 0 ? "+" : ""}{deltaP99.toFixed(1)}ms
                                  </div>
                                </div>
                              </>
                            ) : (
                              /* Standard View - Live or Batch */
                              <>
                                <div className="text-center">
                                  <div className="text-xs text-muted-foreground mb-1">p50</div>
                                  <div className="font-mono text-sm">{displayP50.toFixed(1)}ms</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-xs text-muted-foreground mb-1">p95</div>
                                  <div className="font-mono text-sm">{displayP95.toFixed(1)}ms</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-xs text-muted-foreground mb-1">p99</div>
                                  <div className={`font-mono text-sm ${displayP99 > 30 ? "text-[var(--status-warning)]" : ""}`}>
                                    {displayP99.toFixed(1)}ms
                                  </div>
                                </div>
                              </>
                            )}
                            <ArrowRight className="size-4 text-muted-foreground ml-2" />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Detail View - Service Drill-Down */}
            {selectedLatencyService && (() => {
              const metric = latencyMetrics.find(m => m.serviceId === selectedLatencyService)
              if (!metric) return null
              
              return (
                <div className="space-y-6">
                  {/* Service Header */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={`size-3 rounded-full ${
                            metric.status === "healthy"
                              ? "bg-[var(--status-live)]"
                              : metric.status === "warning"
                              ? "bg-[var(--status-warning)]"
                              : "bg-[var(--status-error)]"
                          }`}
                        />
                        <CardTitle className="text-xl">{metric.service}</CardTitle>
                        <Badge variant="outline" className="ml-auto">
                          {latencyDataMode === "live" ? "Live" : latencyDataMode === "batch" ? "Batch" : "Compare"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-6">
                        <div className="text-center p-4 rounded-lg bg-muted/30">
                          <div className="text-sm text-muted-foreground mb-1">p50</div>
                          <div className="text-2xl font-mono font-bold">{metric.p50.toFixed(1)}ms</div>
                          {latencyDataMode === "compare" && (
                            <div className={`text-sm font-mono ${metric.p50 - metric.batch.p50 > 0 ? "text-[var(--pnl-negative)]" : "text-[var(--pnl-positive)]"}`}>
                              vs batch: {metric.p50 - metric.batch.p50 > 0 ? "+" : ""}{(metric.p50 - metric.batch.p50).toFixed(1)}ms
                            </div>
                          )}
                        </div>
                        <div className="text-center p-4 rounded-lg bg-muted/30">
                          <div className="text-sm text-muted-foreground mb-1">p95</div>
                          <div className="text-2xl font-mono font-bold">{metric.p95.toFixed(1)}ms</div>
                          {latencyDataMode === "compare" && (
                            <div className={`text-sm font-mono ${metric.p95 - metric.batch.p95 > 0 ? "text-[var(--pnl-negative)]" : "text-[var(--pnl-positive)]"}`}>
                              vs batch: {metric.p95 - metric.batch.p95 > 0 ? "+" : ""}{(metric.p95 - metric.batch.p95).toFixed(1)}ms
                            </div>
                          )}
                        </div>
                        <div className="text-center p-4 rounded-lg bg-muted/30">
                          <div className="text-sm text-muted-foreground mb-1">p99</div>
                          <div className={`text-2xl font-mono font-bold ${metric.p99 > 30 ? "text-[var(--status-warning)]" : ""}`}>
                            {metric.p99.toFixed(1)}ms
                          </div>
                          {latencyDataMode === "compare" && (
                            <div className={`text-sm font-mono ${metric.p99 - metric.batch.p99 > 0 ? "text-[var(--pnl-negative)]" : "text-[var(--pnl-positive)]"}`}>
                              vs batch: {metric.p99 - metric.batch.p99 > 0 ? "+" : ""}{(metric.p99 - metric.batch.p99).toFixed(1)}ms
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Cross-Section View: Lifecycle Breakdown */}
                  {latencyViewMode === "cross-section" && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Lifecycle Breakdown</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {metric.lifecycle.map((stage, idx) => {
                            const totalP50 = metric.lifecycle.reduce((sum, s) => sum + s.p50, 0)
                            const percentage = (stage.p50 / totalP50) * 100
                            
                            return (
                              <div key={stage.stage} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono text-muted-foreground w-4">{idx + 1}</span>
                                    <span className="font-medium">{stage.stage}</span>
                                  </div>
                                  <div className="flex items-center gap-6 font-mono text-sm">
                                    <span className="text-muted-foreground w-16 text-right">{stage.p50.toFixed(2)}ms</span>
                                    <span className="text-muted-foreground w-16 text-right">{stage.p95.toFixed(2)}ms</span>
                                    <span className={`w-16 text-right ${stage.p99 > 5 ? "text-[var(--status-warning)]" : ""}`}>
                                      {stage.p99.toFixed(2)}ms
                                    </span>
                                  </div>
                                </div>
                                {/* Bar visualization */}
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-[var(--accent-blue)] rounded-full transition-all"
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-muted-foreground w-12 text-right">
                                    {percentage.toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                        {/* Headers for columns */}
                        <div className="flex items-center justify-end gap-6 mt-4 pt-3 border-t text-xs text-muted-foreground font-mono">
                          <span className="w-16 text-right">p50</span>
                          <span className="w-16 text-right">p95</span>
                          <span className="w-16 text-right">p99</span>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Time Series View */}
                  {latencyViewMode === "time-series" && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Latency Over Time (24h)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={metric.timeSeries}>
                              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                              <XAxis 
                                dataKey="time" 
                                stroke="var(--muted-foreground)"
                                fontSize={11}
                                tickLine={false}
                              />
                              <YAxis 
                                stroke="var(--muted-foreground)"
                                fontSize={11}
                                tickLine={false}
                                tickFormatter={(v) => `${v}ms`}
                              />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: "var(--card)", 
                                  border: "1px solid var(--border)",
                                  borderRadius: "8px"
                                }}
                                formatter={(value: number) => [`${value.toFixed(2)}ms`]}
                              />
                              <Legend />
                              <Area
                                type="monotone"
                                dataKey="p99"
                                stackId="1"
                                stroke="var(--status-warning)"
                                fill="var(--status-warning)"
                                fillOpacity={0.2}
                                name="p99"
                              />
                              <Area
                                type="monotone"
                                dataKey="p95"
                                stackId="2"
                                stroke="var(--accent-blue)"
                                fill="var(--accent-blue)"
                                fillOpacity={0.3}
                                name="p95"
                              />
                              <Area
                                type="monotone"
                                dataKey="p50"
                                stackId="3"
                                stroke="var(--pnl-positive)"
                                fill="var(--pnl-positive)"
                                fillOpacity={0.4}
                                name="p50"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Compare Mode: Side-by-Side Table */}
                  {latencyDataMode === "compare" && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Live vs Batch Comparison by Stage</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left p-2 font-medium">Stage</th>
                                <th className="text-center p-2 font-medium" colSpan={3}>Live</th>
                                <th className="text-center p-2 font-medium" colSpan={3}>Batch</th>
                                <th className="text-center p-2 font-medium" colSpan={3}>Delta</th>
                              </tr>
                              <tr className="border-b text-xs text-muted-foreground">
                                <th className="p-2"></th>
                                <th className="p-2">p50</th>
                                <th className="p-2">p95</th>
                                <th className="p-2">p99</th>
                                <th className="p-2">p50</th>
                                <th className="p-2">p95</th>
                                <th className="p-2">p99</th>
                                <th className="p-2">p50</th>
                                <th className="p-2">p95</th>
                                <th className="p-2">p99</th>
                              </tr>
                            </thead>
                            <tbody>
                              {metric.lifecycle.map((stage, idx) => {
                                // Simulate batch values (slightly different)
                                const batchP50 = stage.p50 * (0.9 + Math.random() * 0.2)
                                const batchP95 = stage.p95 * (0.85 + Math.random() * 0.3)
                                const batchP99 = stage.p99 * (0.8 + Math.random() * 0.4)
                                
                                return (
                                  <tr key={stage.stage} className="border-b hover:bg-muted/30">
                                    <td className="p-2 font-medium">{stage.stage}</td>
                                    <td className="p-2 font-mono text-center">{stage.p50.toFixed(2)}</td>
                                    <td className="p-2 font-mono text-center">{stage.p95.toFixed(2)}</td>
                                    <td className="p-2 font-mono text-center">{stage.p99.toFixed(2)}</td>
                                    <td className="p-2 font-mono text-center text-muted-foreground">{batchP50.toFixed(2)}</td>
                                    <td className="p-2 font-mono text-center text-muted-foreground">{batchP95.toFixed(2)}</td>
                                    <td className="p-2 font-mono text-center text-muted-foreground">{batchP99.toFixed(2)}</td>
                                    <td className={`p-2 font-mono text-center ${stage.p50 - batchP50 > 0 ? "text-[var(--pnl-negative)]" : "text-[var(--pnl-positive)]"}`}>
                                      {(stage.p50 - batchP50) > 0 ? "+" : ""}{(stage.p50 - batchP50).toFixed(2)}
                                    </td>
                                    <td className={`p-2 font-mono text-center ${stage.p95 - batchP95 > 0 ? "text-[var(--pnl-negative)]" : "text-[var(--pnl-positive)]"}`}>
                                      {(stage.p95 - batchP95) > 0 ? "+" : ""}{(stage.p95 - batchP95).toFixed(2)}
                                    </td>
                                    <td className={`p-2 font-mono text-center ${stage.p99 - batchP99 > 0 ? "text-[var(--pnl-negative)]" : "text-[var(--pnl-positive)]"}`}>
                                      {(stage.p99 - batchP99) > 0 ? "+" : ""}{(stage.p99 - batchP99).toFixed(2)}
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )
            })()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
