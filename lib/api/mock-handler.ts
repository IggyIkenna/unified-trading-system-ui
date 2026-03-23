/**
 * Client-side mock fetch interceptor for static visual preview mode.
 *
 * When NEXT_PUBLIC_MOCK_API=true, this intercepts all /api/* fetch calls
 * and returns realistic mock data without requiring any backend services.
 *
 * Install once at app startup via installMockHandler().
 */

import { ORGANIZATIONS, CLIENTS, STRATEGIES, ACCOUNTS, getAggregatedPnL, getAggregatedTimeSeries, getLiveBatchDelta, getStrategyPerformance } from "@/lib/trading-data"
import { MOCK_EXECUTION_ALGOS, MOCK_VENUES, MOCK_RECENT_ORDERS, MOCK_ALGO_BACKTESTS, MOCK_EXECUTION_METRICS, MOCK_EXECUTION_CANDIDATES } from "@/lib/execution-platform-mock-data"
import { MODEL_FAMILIES, EXPERIMENTS, TRAINING_RUNS, MODEL_VERSIONS, DATASET_SNAPSHOTS, FEATURE_SET_VERSIONS, VALIDATION_PACKAGES, DEPLOYMENT_CANDIDATES, LIVE_DEPLOYMENTS } from "@/lib/ml-mock-data"
import { STRATEGY_TEMPLATES, BACKTEST_RUNS, STRATEGY_CANDIDATES, STRATEGY_ALERTS } from "@/lib/strategy-platform-mock-data"
import { MOCK_CATALOGUE, MOCK_INSTRUMENTS, MOCK_SHARD_AVAILABILITY } from "@/lib/data-service-mock-data"

export const MOCK_MODE = typeof window !== "undefined" && process.env.NEXT_PUBLIC_MOCK_API === "true"

function json(data: unknown, delay = 50): Promise<Response> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }))
    }, delay)
  })
}

function getToday(): string {
  return new Date().toISOString().split("T")[0]
}

const defaultFilter = {
  organizationIds: [] as string[],
  clientIds: [] as string[],
  strategyIds: [] as string[],
  mode: "live" as const,
  date: getToday(),
}

function mockRoute(path: string, opts?: RequestInit): Promise<Response> | null {
  // Strip query params for matching
  const route = path.split("?")[0]

  // ─── Shared computed data (single source of truth for all endpoints) ───
  // All position/PnL/exposure numbers derive from this so they're consistent
  const perf = getStrategyPerformance(defaultFilter)
  const totalExposure = perf.reduce((s, p) => s + p.exposure, 0)
  const totalNav = perf.reduce((s, p) => s + p.nav, 0)
  const totalPnl = perf.reduce((s, p) => s + p.pnl, 0)
  const totalMargin = totalExposure * 0.22 // ~22% margin usage
  const liveCount = perf.filter(p => p.status === "live").length
  const pausedCount = perf.filter(p => p.status === "paused" || p.status === "stopped").length

  // Generate one position per strategy (consistent with perf data)
  // Map strategy names to domain-correct instruments and venues
  function getStrategyInstrumentAndVenue(name: string): { instrument: string; venue: string } {
    const n = name.toLowerCase()
    // Sports strategies
    if (n.includes("nba")) return { instrument: "NBA:GAME:LAL-GSW", venue: "betfair" }
    if (n.includes("nfl")) return { instrument: "NFL:GAME:KC-SF", venue: "pinnacle" }
    if (n.includes("football") && !n.includes("market")) return { instrument: "EPL:MATCH:MUN-LIV", venue: "bet365" }
    if (n.includes("epl")) return { instrument: "EPL:MATCH:MUN-LIV", venue: "betfair" }
    if (n.includes("la liga") || n.includes("laliga")) return { instrument: "LALIGA:MATCH:BAR-RMA", venue: "pinnacle" }
    // Prediction market strategies
    if (n.includes("prediction") && n.includes("cefi")) return { instrument: "POLYMARKET:BINARY:BTC-100K@YES", venue: "polymarket" }
    if (n.includes("prediction")) return { instrument: "KALSHI:BINARY:FED-RATE-CUT@YES", venue: "kalshi" }
    // DeFi strategies
    if (n.includes("morpho")) return { instrument: "MORPHO:SUPPLY:USDC", venue: "morpho" }
    if (n.includes("uniswap") || n.includes("uni v3") || n.includes("lp")) return { instrument: "UNISWAPV3:LP:ETH-USDC", venue: "uniswap" }
    if (n.includes("aave") || n.includes("lending") && n.includes("aave")) return { instrument: "AAVE_V3:SUPPLY:USDT", venue: "aave" }
    if (n.includes("recursive") || n.includes("staked basis")) return { instrument: "AAVE_V3:SUPPLY:WEETH", venue: "aave" }
    if (n.includes("eth basis")) return { instrument: "ETH-PERP", venue: "hyperliquid" }
    // CeFi strategies — match by asset name in strategy
    if (n.includes("btc") && n.includes("basis")) return { instrument: "BTC-PERP", venue: "binance" }
    if (n.includes("btc") && n.includes("market making")) return { instrument: "BTC-USDT", venue: "binance" }
    if (n.includes("btc")) return { instrument: "BTC-PERP", venue: "binance" }
    if (n.includes("eth") && n.includes("options")) return { instrument: "ETH-OPTIONS", venue: "deribit" }
    if (n.includes("eth") && n.includes("momentum")) return { instrument: "ETH-PERP", venue: "binance" }
    if (n.includes("eth") && n.includes("mean rev")) return { instrument: "ETH-USDT", venue: "okx" }
    if (n.includes("eth")) return { instrument: "ETH-PERP", venue: "binance" }
    if (n.includes("sol")) return { instrument: "SOL-PERP", venue: "binance" }
    if (n.includes("doge")) return { instrument: "DOGE-USDT", venue: "binance" }
    if (n.includes("avax")) return { instrument: "AVAX-PERP", venue: "binance" }
    if (n.includes("link")) return { instrument: "LINK-PERP", venue: "hyperliquid" }
    if (n.includes("arb") && n.includes("mean")) return { instrument: "ARB-USDT", venue: "okx" }
    if (n.includes("spy")) return { instrument: "SPY", venue: "ibkr" }
    if (n.includes("bond")) return { instrument: "TLT", venue: "ibkr" }
    if (n.includes("multi-venue") || n.includes("arbitrage")) return { instrument: "BTC-USDT", venue: "binance" }
    // Fallback
    return { instrument: "BTC-PERP", venue: "binance" }
  }

  const allPositions = perf.filter(p => p.status === "live").map((s, i) => {
    const { instrument, venue } = getStrategyInstrumentAndVenue(s.name)
    const basePrice = instrument.includes("BTC") ? 42000 : instrument.includes("ETH") ? 3200 : instrument.includes("SOL") ? 145 : instrument.includes("SPY") ? 520 : instrument.includes("TLT") ? 92 : 1
    return {
      id: `pos-${i}`,
      strategy_id: s.id,
      strategy_name: s.name,
      instrument,
      side: (s.pnl >= 0 ? "LONG" : "SHORT") as "LONG" | "SHORT",
      quantity: basePrice > 0 ? Math.abs(s.exposure) / basePrice : Math.abs(s.exposure),
      entry_price: basePrice,
      current_price: basePrice * (1 + s.pnl / Math.max(s.nav, 1)),
      pnl: s.pnl,
      pnl_pct: s.nav > 0 ? (s.pnl / s.nav) * 100 : 0,
      unrealized_pnl: s.pnl,
      venue,
      margin: s.exposure * 0.22,
      leverage: Math.round(s.exposure / Math.max(s.nav * 0.3, 1)),
      updated_at: new Date().toISOString(),
      health_factor: s.assetClass === "DeFi" ? 1.45 : undefined,
      venueLabel: venue,
      used: s.exposure * 0.22,
      available: s.nav - s.exposure * 0.22,
      total: s.nav,
      utilization: Math.round((s.exposure * 0.22 / Math.max(s.nav, 1)) * 100),
      trend: (s.pnlChange > 1 ? "up" : s.pnlChange < -1 ? "down" : "stable") as "up" | "down" | "stable",
      marginCallDistance: Math.max(5, 30 - Math.round((s.exposure * 0.22 / Math.max(s.nav, 1)) * 30)),
      lastUpdate: new Date().toISOString(),
    }
  })

  // Venue-level balance aggregation (from ACCOUNTS, consistent)
  const totalAccountBalance = ACCOUNTS.reduce((s, a) => s + a.balanceUSD, 0)
  const totalAccountMarginUsed = ACCOUNTS.reduce((s, a) => s + a.marginUsed, 0)

  // --- Positions ---
  if (route === "/api/positions/active") {
    return json({ positions: allPositions })
  }

  if (route === "/api/positions/summary") {
    const byVenue: Record<string, number> = {}
    let longCount = 0
    let shortCount = 0
    allPositions.forEach(p => {
      byVenue[p.venue] = (byVenue[p.venue] || 0) + 1
      if (p.side === "LONG") longCount++; else shortCount++
    })
    return json({
      totalPositions: allPositions.length,
      totalExposure,
      totalUnrealizedPnl: totalPnl,
      totalMargin,
      byVenue,
      bySide: { long: longCount, short: shortCount },
    })
  }

  if (route === "/api/positions/balances") {
    return json(ACCOUNTS.map(a => ({
      venue: a.venue,
      account: a.name,
      free: a.marginAvailable,
      locked: a.marginUsed,
      total: a.balanceUSD,
      currency: "USD",
    })))
  }

  // --- Trading ---
  if (route === "/api/trading/organizations") {
    return json({ organizations: ORGANIZATIONS, total: ORGANIZATIONS.length })
  }
  if (route === "/api/trading/clients") {
    return json({ clients: CLIENTS, total: CLIENTS.length })
  }
  if (route === "/api/trading/pnl") {
    return json(getAggregatedPnL(defaultFilter))
  }
  if (route === "/api/trading/timeseries") {
    const ts = getAggregatedTimeSeries(defaultFilter)
    return json({ timeseries: ts })
  }
  if (route === "/api/trading/performance") {
    // Enrich with fields the strategies page needs (performance sub-object, venues, etc.)
    const perf = getStrategyPerformance(defaultFilter)
    const enriched = perf.map((s, i) => ({
      ...s,
      description: `${s.archetype} strategy on ${s.assetClass}`,
      strategyType: s.archetype,
      version: "1.0.0",
      venues: STRATEGIES[i]?.venues ?? ["Binance"],
      instructionTypes: ["LIMIT", "MARKET"],
      dataArchitecture: { executionMode: s.executionMode ?? "event_driven" },
      performance: {
        sharpe: s.sharpe,
        returnPct: s.pnlChange ?? 0,
        maxDrawdown: s.maxDrawdown,
        pnlMTD: s.pnl,
      },
      sparklineData: Array.from({ length: 20 }, (_, j) => s.pnl * (0.5 + Math.sin(j * 0.3) * 0.5)),
    }))
    return json({ strategies: enriched, total: enriched.length })
  }
  if (route === "/api/trading/live-batch-delta") {
    return json(getLiveBatchDelta(defaultFilter))
  }

  // --- Market Data ---
  if (route === "/api/market-data/tickers") {
    const tickers = ["BTC-USDT", "ETH-USDT", "SOL-USDT", "BNB-USDT", "XRP-USDT", "DOGE-USDT", "ADA-USDT", "AVAX-USDT"].map((sym, i) => ({
      symbol: sym,
      venue: i % 2 === 0 ? "Binance" : "OKX",
      last: 40000 / (i + 1),
      bid: 40000 / (i + 1) - 5,
      ask: 40000 / (i + 1) + 5,
      volume24h: 1000000000 / (i + 1),
      change24h: (i % 3 === 0 ? -1 : 1) * (1.5 + i * 0.3),
      high24h: 41000 / (i + 1),
      low24h: 39000 / (i + 1),
      timestamp: new Date().toISOString(),
    }))
    return json(tickers)
  }
  if (route === "/api/market-data/candles") {
    const candles = Array.from({ length: 100 }, (_, i) => {
      const base = 40000 + Math.sin(i * 0.15) * 2000
      return {
        timestamp: new Date(Date.now() - (100 - i) * 3600000).toISOString(),
        open: base,
        high: base + 200 + Math.random() * 300,
        low: base - 200 - Math.random() * 300,
        close: base + (Math.random() - 0.5) * 400,
        volume: 1000000 + Math.random() * 5000000,
      }
    })
    return json({ candles })
  }
  if (route === "/api/market-data/orderbook") {
    const mid = 42000
    return json({
      bids: Array.from({ length: 20 }, (_, i) => ({ price: mid - i * 5, size: 10 + Math.random() * 50 })),
      asks: Array.from({ length: 20 }, (_, i) => ({ price: mid + i * 5, size: 10 + Math.random() * 50 })),
      timestamp: new Date().toISOString(),
    })
  }
  if (route === "/api/market-data/trades") {
    return json({
      trades: Array.from({ length: 50 }, (_, i) => ({
        id: `t-${i}`,
        price: 42000 + (Math.random() - 0.5) * 100,
        size: Math.random() * 5,
        side: i % 2 === 0 ? "buy" : "sell",
        timestamp: new Date(Date.now() - i * 30000).toISOString(),
      })),
    })
  }

  // --- Derivatives ---
  if (route === "/api/derivatives/options-chain") {
    const strikes = [35000, 37500, 40000, 42500, 45000, 47500, 50000]
    return json({
      options: strikes.flatMap(strike => ["call", "put"].map(type => ({
        strike,
        type,
        expiry: "2026-04-25",
        bid: type === "call" ? Math.max(0, 42000 - strike) + 500 : Math.max(0, strike - 42000) + 500,
        ask: type === "call" ? Math.max(0, 42000 - strike) + 700 : Math.max(0, strike - 42000) + 700,
        iv: 0.55 + Math.random() * 0.2,
        delta: type === "call" ? 0.5 : -0.5,
        gamma: 0.001,
        theta: -50,
        vega: 120,
        volume: Math.round(Math.random() * 1000),
        openInterest: Math.round(Math.random() * 5000),
      }))),
    })
  }
  if (route === "/api/derivatives/vol-surface") {
    return json({
      surface: [7, 14, 30, 60, 90].map(dte => ({
        dte,
        strikes: [0.8, 0.9, 0.95, 1.0, 1.05, 1.1, 1.2].map(moneyness => ({
          moneyness,
          iv: 0.4 + (moneyness - 1) * (moneyness - 1) * 2 + dte * 0.001,
        })),
      })),
    })
  }
  if (route === "/api/derivatives/portfolio-greeks") {
    return json({
      portfolio: { delta: 12.5, gamma: 0.45, theta: -2400, vega: 85000, rho: 1200 },
      per_underlying: [
        { underlying: "BTC", delta: 8.2, gamma: 0.3, theta: -1600, vega: 55000, rho: 800 },
        { underlying: "ETH", delta: 4.3, gamma: 0.15, theta: -800, vega: 30000, rho: 400 },
      ],
    })
  }

  // --- Execution ---
  if (route === "/api/execution/orders") {
    // Generate 24 TCA-enriched orders across venues and algos
    const tcaVenues = ["binance", "okx", "hyperliquid", "deribit"]
    const tcaAlgos = ["TWAP", "VWAP", "IS", "Sniper"]
    const tcaInstruments = ["BTC-PERP", "ETH-PERP", "SOL-PERP", "BTC-USDT", "ETH-USDT", "DOGE-USDT", "AVAX-PERP", "LINK-PERP"]
    const tcaOrders = Array.from({ length: 24 }, (_, i) => {
      const instrument = tcaInstruments[i % tcaInstruments.length]
      const venue = tcaVenues[i % tcaVenues.length]
      const algo = tcaAlgos[i % tcaAlgos.length]
      const side = i % 3 === 0 ? "SELL" : "BUY"
      const basePrice = instrument.includes("BTC") ? 42000 : instrument.includes("ETH") ? 3200 : instrument.includes("SOL") ? 145 : instrument.includes("DOGE") ? 0.18 : instrument.includes("AVAX") ? 38 : instrument.includes("LINK") ? 16 : 100
      const arrivalPrice = basePrice * (1 + (Math.sin(i * 0.7) * 0.002))
      const slippageBps = parseFloat(((Math.sin(i * 1.3) * 3) + 1.5).toFixed(1))
      const avgFillPrice = arrivalPrice * (1 + slippageBps / 10000 * (side === "BUY" ? 1 : -1))
      const quantity = instrument.includes("BTC") ? 0.5 + i * 0.1 : instrument.includes("ETH") ? 2 + i * 0.5 : 10 + i * 5
      const fillRate = parseFloat((95 + Math.random() * 5).toFixed(1))
      const durationMs = 500 + Math.round(Math.random() * 4500)
      const marketImpact = parseFloat((slippageBps * 0.4).toFixed(1))
      const timingCost = parseFloat((slippageBps * 0.25).toFixed(1))
      const totalCost = parseFloat((Math.abs(slippageBps) + marketImpact * 0.3).toFixed(1))
      const vwap = arrivalPrice * (1 + (Math.random() - 0.5) * 0.001)
      const twap = arrivalPrice * (1 + (Math.random() - 0.5) * 0.0008)
      return {
        id: `ord-tca-${i + 1}`,
        order_id: `ord-tca-${i + 1}`,
        instrument,
        venue,
        algo,
        side,
        type: algo,
        quantity,
        price: arrivalPrice,
        avgPrice: parseFloat(avgFillPrice.toFixed(4)),
        filled: Math.round(quantity * fillRate / 100 * 100) / 100,
        status: "FILLED",
        fillRate,
        durationMs,
        strategy_id: `strat-${i % 6}`,
        strategy_name: `Strategy ${i % 6}`,
        edge_bps: parseFloat((-slippageBps).toFixed(1)),
        instant_pnl: Math.round((avgFillPrice - arrivalPrice) * quantity * (side === "SELL" ? -1 : 1)),
        created_at: new Date(Date.now() - i * 1800000).toISOString(),
        tca: {
          slippage: slippageBps,
          marketImpact,
          timingCost,
          totalCost,
          arrivalPrice: parseFloat(arrivalPrice.toFixed(4)),
          vwap: parseFloat(vwap.toFixed(4)),
          twap: parseFloat(twap.toFixed(4)),
          implementationShortfall: parseFloat((slippageBps + marketImpact).toFixed(1)),
        },
      }
    })
    return json({
      data: tcaOrders,
      tcaBreakdown: [
        { name: "Spread Cost", value: 1.8, color: "#3b82f6" },
        { name: "Market Impact", value: 1.2, color: "#8b5cf6" },
        { name: "Timing Cost", value: 0.6, color: "#f59e0b" },
        { name: "Fees", value: 0.8, color: "#6b7280" },
      ],
      executionTimeline: Array.from({ length: 20 }, (_, i) => ({
        time: new Date(Date.now() - (20 - i) * 3600000).toISOString(),
        slippage: parseFloat((1.5 + Math.sin(i * 0.5) * 2).toFixed(1)),
        volume: Math.round(500000 + Math.random() * 2000000),
      })),
      slippageDistribution: [
        { range: "<-2bps", count: 3 }, { range: "-2 to 0", count: 5 }, { range: "0 to 2", count: 8 },
        { range: "2 to 4", count: 5 }, { range: "4 to 6", count: 2 }, { range: ">6bps", count: 1 },
      ],
    })
  }
  if (route === "/api/execution/algos") {
    return json({ data: MOCK_EXECUTION_ALGOS })
  }
  if (route === "/api/execution/venues") {
    return json({ data: MOCK_VENUES })
  }
  if (route === "/api/execution/backtests") {
    return json(MOCK_ALGO_BACKTESTS)
  }
  if (route === "/api/execution/metrics") {
    return json({ data: { ordersExecuted: 847, volumeTraded: 124500000, avgSlippage: 1.2, avgFillRate: 98.5, avgLatency: 32, rejects: 3 } })
  }
  if (route === "/api/execution/candidates") {
    return json(MOCK_EXECUTION_CANDIDATES)
  }
  if (route.startsWith("/api/execution/handoff")) {
    return json({ handoffs: [], total: 0 })
  }
  if (route === "/api/compliance/pre-trade-check") {
    return json({ approved: true, checks: [{ rule: "position-limit", passed: true }, { rule: "concentration", passed: true }] })
  }

  // --- Instruments ---
  if (route === "/api/instruments/list") {
    // Also include venue-level aggregation for data overview page
    const venueMap: Record<string, { venue: string; category: string; instruments: number; coverage: number }> = {}
    MOCK_INSTRUMENTS.forEach(inst => {
      if (!venueMap[inst.venue]) venueMap[inst.venue] = { venue: inst.venue, category: inst.category, instruments: 0, coverage: 85 + Math.random() * 15 }
      venueMap[inst.venue].instruments++
    })
    return json({
      instruments: MOCK_INSTRUMENTS, total: MOCK_INSTRUMENTS.length, persona: "admin",
      venues: Object.values(venueMap),
    })
  }
  if (route === "/api/instruments/catalogue") {
    return json({ catalogue: MOCK_CATALOGUE, total: MOCK_CATALOGUE.length })
  }

  // --- Alerts ---
  if (route === "/api/alerts/active") {
    // Notification bell uses this — return unacknowledged alerts
    const unacked = STRATEGY_ALERTS.filter(a => !a.acknowledgedAt)
    return json({ alerts: unacked.map(a => ({
      id: a.id,
      severity: a.severity === "critical" ? "critical" : a.severity === "warning" ? "high" : "medium",
      title: a.message,
      timestamp: a.triggeredAt,
      source: "strategy-service",
    })), total: unacked.length })
  }
  if (route === "/api/alerts/list") {
    return json({ data: STRATEGY_ALERTS.map(a => ({
      id: a.id,
      severity: a.severity === "critical" ? "critical" : a.severity === "warning" ? "high" : "medium",
      status: a.resolvedAt ? "resolved" : a.acknowledgedAt ? "acknowledged" : "active",
      title: a.message,
      description: a.message,
      source: "strategy-service",
      entity: a.configId ?? "unknown",
      entityType: "strategy" as const,
      timestamp: a.triggeredAt,
      value: a.details ? JSON.stringify(a.details) : undefined,
      threshold: undefined,
      recommendedAction: "Review strategy configuration",
    })) })
  }
  if (route === "/api/alerts/summary") {
    // Use same severity mapping as /api/alerts/list (critical→critical, warning→high, info→medium)
    const critCount = STRATEGY_ALERTS.filter(a => a.severity === "critical").length
    const highCount = STRATEGY_ALERTS.filter(a => a.severity === "warning").length
    const medCount = STRATEGY_ALERTS.filter(a => a.severity === "info").length
    const unacked = STRATEGY_ALERTS.filter(a => !a.acknowledgedAt).length
    return json({ total: STRATEGY_ALERTS.length, critical: critCount, high: highCount, medium: medCount, warning: highCount, info: medCount, unacknowledged: unacked })
  }
  // Acknowledge / escalate / resolve — mutate STRATEGY_ALERTS in place
  if (route === "/api/alerts/acknowledge" || route === "/api/alerts/escalate" || route === "/api/alerts/resolve") {
    const action = route.split("/").pop() as string
    // alertId from POST body
    let alertId: string | undefined
    try { alertId = opts?.body ? JSON.parse(opts.body as string).alertId : undefined } catch { /* noop */ }
    const alert = alertId ? STRATEGY_ALERTS.find(a => a.id === alertId) : undefined
    if (alert) {
      if (action === "acknowledge") alert.acknowledgedAt = new Date().toISOString()
      if (action === "resolve") { alert.acknowledgedAt = alert.acknowledgedAt ?? new Date().toISOString(); alert.resolvedAt = new Date().toISOString() }
      if (action === "escalate") {
        if (alert.severity === "info") alert.severity = "warning"
        else if (alert.severity === "warning") alert.severity = "critical"
      }
    }
    return json({ ok: true })
  }
  // Bell uses /api/alerts/{id}/acknowledge
  if (route.match(/^\/api\/alerts\/[^/]+\/acknowledge$/)) {
    const alertId = route.split("/")[3]
    const alert = STRATEGY_ALERTS.find(a => a.id === alertId)
    if (alert) alert.acknowledgedAt = new Date().toISOString()
    return json({ ok: true })
  }

  // --- Risk ---
  if (route === "/api/risk/limits") {
    return json({ limits: [
      { id: "rl-1", name: "Max Position Size", value: 2500000, limit: 5000000, unit: "USD", category: "exposure", entity: "Odum Research", entityType: "company", level: 0 },
      { id: "rl-2", name: "Max Drawdown", value: 3.2, limit: 10, unit: "%", category: "exposure", entity: "Quant Fund", entityType: "client", level: 1, parentId: "rl-1" },
      { id: "rl-3", name: "Leverage Limit", value: 7.5, limit: 10, unit: "x", category: "margin", entity: "Delta One", entityType: "account", level: 1, parentId: "rl-1" },
      { id: "rl-4", name: "Concentration Limit", value: 28, limit: 30, unit: "%", category: "concentration", entity: "BTC-PERP", entityType: "instrument", level: 2, parentId: "rl-3" },
      { id: "rl-5", name: "DeFi LTV", value: 0.72, limit: 0.85, unit: "ratio", category: "ltv", entity: "Aave V3", entityType: "strategy", level: 1, parentId: "rl-1" },
    ] })
  }
  if (route === "/api/risk/var") {
    return json({ portfolioVaR: 185000, confidence: 0.99, horizon: "1D", method: "Historical", breakdown: [{ asset: "BTC", var: 95000 }, { asset: "ETH", var: 55000 }, { asset: "SOL", var: 35000 }] })
  }
  if (route === "/api/risk/greeks") {
    return json({ portfolio: { delta: 12.5, gamma: 0.45, theta: -2400, vega: 85000, rho: 1200 }, positions: [], timeSeries: [], secondOrder: { volga: 0.02, vanna: 0.01, slide: 0.005 } })
  }
  if (route === "/api/risk/stress") {
    return json({ scenarios: [
      { id: "covid-crash", name: "COVID Crash (Mar 2020)", description: "60% equity drawdown, crypto -50%", multiplier: -0.5, pnlImpact: -3200000, varImpact: -4200000, positionsBreaching: 18, largestLoss: "BTC-PERP: -$1.2M" },
      { id: "btc-may-2021", name: "BTC Flash Crash (May 2021)", description: "BTC -35% in 24h, cascading liquidations", multiplier: -0.35, pnlImpact: -1800000, varImpact: -2500000, positionsBreaching: 14, largestLoss: "BTC-PERP: -$850K" },
      { id: "ftx-collapse", name: "FTX Collapse (Nov 2022)", description: "Exchange failure, liquidity crisis", multiplier: -0.4, pnlImpact: -2600000, varImpact: -3400000, positionsBreaching: 16, largestLoss: "ETH-PERP: -$720K" },
      { id: "rate-hike", name: "Fed Rate Shock (+200bp)", description: "Aggressive tightening, duration risk", multiplier: 0.02, pnlImpact: -900000, varImpact: -1300000, positionsBreaching: 8, largestLoss: "TLT: -$380K" },
      { id: "market-crash-20", name: "Market Crash -20%", description: "Broad market selloff across all asset classes", multiplier: -0.2, pnlImpact: -2400000, varImpact: -3100000, positionsBreaching: 12, largestLoss: "BTC-PERP: -$850K" },
      { id: "vol-spike", name: "Vol Spike +50%", description: "Volatility surge, option gamma squeeze", multiplier: 1.5, pnlImpact: -800000, varImpact: -1200000, positionsBreaching: 5, largestLoss: "ETH-PERP: -$320K" },
    ] })
  }
  if (route === "/api/risk/var-summary") {
    return json({ historical_var_99: 2100000, parametric_var_99: 1850000, cvar_99: 2450000, monte_carlo_var_99: 1920000, marginalVaR: [{ asset: "BTC", mvar: 0.45 }, { asset: "ETH", mvar: 0.30 }] })
  }
  if (route.startsWith("/api/risk/stress-test")) {
    return json({ scenario: "custom", pnlImpact: -1200000, positions: 24, worstPosition: { instrument: "BTC-PERP", loss: -450000 } })
  }
  if (route === "/api/risk/regime") {
    return json({ regime: "normal", current: "normal", confidence: 0.78, indicators: { vix: 18.5, btcVol: 42, corrIndex: 0.65 } })
  }
  if (route === "/api/risk/correlation-matrix") {
    return json({
      labels: ["BTC", "ETH", "SOL", "SPY", "TLT"],
      matrix: [
        [1, 0.85, 0.72, 0.35, -0.15],
        [0.85, 1, 0.78, 0.32, -0.12],
        [0.72, 0.78, 1, 0.28, -0.10],
        [0.35, 0.32, 0.28, 1, -0.45],
        [-0.15, -0.12, -0.10, -0.45, 1],
      ],
    })
  }
  if (route === "/api/risk/venue-circuit-breakers") {
    return json(["Binance", "OKX", "Hyperliquid", "Deribit"].map(v => ({ venue: v, status: "armed", tripCount: 0, lastTrip: null })))
  }
  if (route === "/api/risk/circuit-breaker" || route === "/api/risk/kill-switch") {
    return json({ ok: true })
  }
  if (route === "/api/risk/exposure-types") {
    return json({
      riskTypes: [
        { id: "delta", name: "Delta", category: "first_order", currentValue: 12.5, threshold: 25, unit: "notional_pct", status: "OK", subscribedStrategies: ["CEFI_BTC_MM", "DEFI_ETH_BASIS", "TRADFI_SPY_ML"] },
        { id: "gamma", name: "Gamma", category: "second_order", currentValue: 0.45, threshold: 1.0, unit: "notional_pct", status: "OK", subscribedStrategies: ["CEFI_ETH_OPT_MM"] },
        { id: "vega", name: "Vega", category: "second_order", currentValue: 85000, threshold: 200000, unit: "usd", status: "OK", subscribedStrategies: ["CEFI_ETH_OPT_MM"] },
        { id: "theta", name: "Theta", category: "second_order", currentValue: -2400, threshold: -5000, unit: "usd_per_day", status: "OK", subscribedStrategies: ["CEFI_ETH_OPT_MM"] },
        { id: "funding", name: "Funding Rate", category: "first_order", currentValue: 0.012, threshold: -0.01, unit: "pct_8h", status: "OK", subscribedStrategies: ["DEFI_ETH_BASIS", "DEFI_ETH_STAKED_BASIS"] },
        { id: "basis", name: "Basis Spread", category: "first_order", currentValue: 0.15, threshold: 0.5, unit: "pct", status: "OK", subscribedStrategies: ["DEFI_ETH_BASIS"] },
        { id: "aave_liquidation", name: "Aave Health Factor", category: "structural", currentValue: 1.45, threshold: 1.2, unit: "ratio", status: "WARNING", subscribedStrategies: ["DEFI_ETH_RECURSIVE_BASIS"] },
        { id: "protocol_risk", name: "Protocol Risk (LST Depeg)", category: "structural", currentValue: 0.3, threshold: 2.0, unit: "pct_deviation", status: "OK", subscribedStrategies: ["DEFI_ETH_STAKED_BASIS", "DEFI_ETH_RECURSIVE_BASIS"] },
        { id: "liquidity", name: "Liquidity", category: "structural", currentValue: 15000000, threshold: 5000000, unit: "usd", status: "OK", subscribedStrategies: ["DEFI_ETH_BASIS", "CEFI_BTC_MM"] },
        { id: "venue_protocol", name: "Venue Protocol Risk", category: "operational", currentValue: 0, threshold: 1, unit: "incidents", status: "OK", subscribedStrategies: ["ALL"] },
        { id: "concentration", name: "Concentration", category: "operational", currentValue: 35, threshold: 50, unit: "pct", status: "OK", subscribedStrategies: ["CEFI_BTC_MM"] },
        { id: "adverse_selection", name: "Adverse Selection", category: "domain_specific", currentValue: 12, threshold: 25, unit: "pct_toxic", status: "OK", subscribedStrategies: ["CEFI_BTC_MM"] },
        { id: "bankroll_dd", name: "Bankroll Drawdown", category: "domain_specific", currentValue: 4.2, threshold: 20, unit: "pct", status: "OK", subscribedStrategies: ["SPORTS_NFL_ARB", "SPORTS_NBA_ML"] },
        { id: "suspension", name: "Market Suspension", category: "domain_specific", currentValue: 0, threshold: 1, unit: "active_suspensions", status: "OK", subscribedStrategies: ["SPORTS_BETFAIR_MM"] },
        { id: "model_confidence", name: "Model Confidence Decay", category: "domain_specific", currentValue: 0.82, threshold: 0.6, unit: "score", status: "OK", subscribedStrategies: ["TRADFI_SPY_ML", "SPORTS_NBA_ML"] },
        { id: "borrow_cost", name: "Borrow Cost (WETH APR)", category: "first_order", currentValue: 3.2, threshold: 8.0, unit: "pct_annual", status: "OK", subscribedStrategies: ["DEFI_ETH_RECURSIVE_BASIS"] },
        { id: "flash_liquidity", name: "Flash Loan Availability", category: "structural", currentValue: 50000000, threshold: 10000000, unit: "usd", status: "OK", subscribedStrategies: ["DEFI_ETH_RECURSIVE_BASIS"] },
        { id: "regime", name: "Market Regime", category: "structural", currentValue: 0.78, threshold: 0.4, unit: "normal_prob", status: "OK", subscribedStrategies: ["TRADFI_BOND_MR"] },
      ],
      totalTypes: 23,
      populatedTypes: 18,
    })
  }
  if (route === "/api/risk/defi-health") {
    return json({
      currentHF: 1.45,
      currentLTV: 0.69,
      thresholds: { deleverage: 1.5, emergency: 1.2, liquidation: 1.0 },
      timeSeries: [
        { timestamp: "2026-03-16T00:00:00Z", hf: 1.82 },
        { timestamp: "2026-03-17T00:00:00Z", hf: 1.75 },
        { timestamp: "2026-03-18T00:00:00Z", hf: 1.68 },
        { timestamp: "2026-03-19T00:00:00Z", hf: 1.55 },
        { timestamp: "2026-03-20T00:00:00Z", hf: 1.48 },
        { timestamp: "2026-03-21T00:00:00Z", hf: 1.42 },
        { timestamp: "2026-03-22T00:00:00Z", hf: 1.45 },
      ],
      distanceToLiquidation: [
        { venue: "Aave V3 (Ethereum)", healthFactor: 1.45, distancePct: 31, status: "warning" },
        { venue: "Morpho (Ethereum)", healthFactor: 1.72, distancePct: 42, status: "ok" },
      ],
      collateralDebt: {
        totalCollateral: 2850000,
        totalDebt: 1965000,
        netEquity: 885000,
        leverage: 3.22,
      },
    })
  }

  // --- Analytics / Strategy ---
  if (route === "/api/analytics/strategy-configs") {
    return json(STRATEGY_TEMPLATES)
  }
  if (route === "/api/analytics/strategy-candidates") {
    return json(STRATEGY_CANDIDATES)
  }
  if (route.match(/\/api\/analytics\/strategies\/[^/]+\/promote/) || route.match(/\/api\/analytics\/strategies\/[^/]+\/reject/)) {
    return json({ ok: true })
  }
  if (route.match(/\/api\/analytics\/strategies\/[^/]+\/scale/)) {
    return json({ ok: true })
  }
  if (route === "/api/analytics/strategy-handoffs") {
    return json([])
  }
  if (route === "/api/analytics/strategies/health") {
    // Let the hook use its built-in SEED_STRATEGIES fallback
    return json({ data: [] })
  }

  // --- ML ---
  if (route === "/api/ml/model-families") {
    // Enrich with activeExperiments and deployedVersions counts
    const enriched = MODEL_FAMILIES.map((fam, i) => ({
      ...fam,
      activeExperiments: [3, 1, 2, 1, 4, 2][i] ?? 1,
      deployedVersions: [2, 1, 1, 1, 2, 1][i] ?? 1,
    }))
    return json({ data: enriched, families: enriched })
  }
  if (route === "/api/ml/experiments") return json(EXPERIMENTS)
  if (route.match(/\/api\/ml\/experiments\/[^/]+$/)) return json(EXPERIMENTS[0])
  if (route === "/api/ml/training-runs") return json(TRAINING_RUNS)
  if (route === "/api/ml/training-jobs") return json({ ok: true, jobId: "job-mock-001" })
  if (route === "/api/ml/versions") return json(MODEL_VERSIONS)
  if (route.match(/\/api\/ml\/models\/[^/]+\/promote/)) return json({ ok: true })
  if (route === "/api/ml/deployments") return json(LIVE_DEPLOYMENTS)
  if (route === "/api/ml/features") return json(FEATURE_SET_VERSIONS)
  if (route === "/api/ml/datasets") return json(DATASET_SNAPSHOTS)
  if (route === "/api/ml/validation-results") return json(VALIDATION_PACKAGES)
  if (route === "/api/ml/monitoring") return json({ alerts: [], drift: [], performance: {} })
  if (route === "/api/ml/governance") return json({ policies: [], approvals: [] })
  if (route === "/api/ml/config") return json({ hyperparameters: {}, featureFlags: {} })

  // --- Reports ---
  if (route === "/api/reporting/reports") {
    // Build per-client portfolio summary that sums to $45.2M AUM
    const clientAums = [12500000, 9800000, 7600000, 5400000, 3900000, 2800000, 1500000, 900000, 500000, 200000, 60000, 40000]
    const portfolioSummary = CLIENTS.slice(0, 12).map((c, i) => ({
      clientId: c.id,
      name: c.name,
      aum: clientAums[i] ?? 500000,
      mtdReturn: parseFloat((1.0 + Math.sin(i * 0.8) * 3.5).toFixed(1)),
      ytdReturn: parseFloat((6 + Math.sin(i * 0.5) * 8).toFixed(1)),
    }))
    // Force average mtdReturn ≈ 3.2%
    const avgMtd = portfolioSummary.reduce((s, c) => s + c.mtdReturn, 0) / portfolioSummary.length
    const mtdDelta = 3.2 - avgMtd
    portfolioSummary.forEach(c => { c.mtdReturn = parseFloat((c.mtdReturn + mtdDelta).toFixed(1)) })
    return json({
      data: Array.from({ length: 47 }, (_, i) => ({
        id: `rpt-${i + 1}`,
        clientId: portfolioSummary[i % portfolioSummary.length].clientId,
        type: ["daily-pnl", "risk-summary", "execution-quality", "regulatory-mifid", "settlement-summary"][i % 5],
        name: `${["Daily PnL", "Risk Summary", "Execution Quality", "MiFID II", "Settlement"][i % 5]} Report`,
        status: i < 40 ? "delivered" : "pending",
        generatedAt: new Date(Date.now() - i * 86400000).toISOString(),
        format: i % 3 === 0 ? "pdf" : "xlsx",
      })),
      portfolioSummary,
      invoices: CLIENTS.slice(0, 5).map((c, i) => ({
        id: `inv-${i + 1}`,
        clientId: c.id,
        amount: 5000 + i * 2500,
        status: i < 3 ? "paid" : "pending",
        dueDate: new Date(Date.now() + (30 - i * 7) * 86400000).toISOString().split("T")[0],
      })),
    })
  }
  if (route === "/api/reporting/settlements") {
    return json({
      settlements: CLIENTS.slice(0, 6).flatMap((c, ci) =>
        Array.from({ length: 3 }, (_, i) => ({
          id: `stl-${ci * 3 + i + 1}`,
          clientId: c.id,
          amount: 50000 + Math.round((ci * 30000 + i * 80000)),
          currency: "USD",
          status: (["pending", "confirming", "settled"] as const)[i % 3],
          settledAt: i === 2 ? new Date(Date.now() - i * 86400000).toISOString() : null,
          venue: ["binance", "okx", "deribit"][i % 3],
        }))
      ),
      accountBalances: ACCOUNTS.map(a => ({
        venue: a.venue,
        currency: "USD",
        balance: a.balanceUSD,
        available: a.marginAvailable,
        locked: a.marginUsed,
      })),
      recentTransfers: [
        { time: new Date(Date.now() - 120000).toISOString(), from: "Binance", to: "OKX", amount: "$250,000", status: "confirmed" as const, confirmations: "12/12", txHash: "0xabc...def" },
        { time: new Date(Date.now() - 3600000).toISOString(), from: "OKX", to: "Deribit", amount: "$180,000", status: "settled" as const, confirmations: "6/6", txHash: "0x123...456" },
        { time: new Date(Date.now() - 600000).toISOString(), from: "Hyperliquid", to: "Binance", amount: "$320,000", status: "confirming" as const, confirmations: "4/12", txHash: "0x789...abc" },
      ],
    })
  }
  if (route === "/api/reporting/reconciliation") return json({ breaks: [], total: 0 })
  if (route === "/api/reporting/regulatory") return json([])
  if (route === "/api/reporting/pnl-attribution") return json({ factors: [], total: 0 })
  if (route === "/api/reporting/executive-summary") return json({ aum: 45200000, pnlMtd: 1446400, sharpe: 2.1, strategies: 12 })
  if (route === "/api/reporting/invoices") return json([])
  if (route.startsWith("/api/reporting/reconciliation/")) return json({ ok: true })
  if (route === "/api/reporting/generate") return json({ ok: true, reportId: "rpt-mock-001" })
  if (route === "/api/reporting/schedules") return json([])

  // --- Service Status ---
  if (route === "/api/service-status/health") {
    const now = new Date().toISOString()
    return json({
      data: [
        { name: "instruments-service", tier: "core", category: "data", status: "healthy", coveragePct: 99.2, lastRun: "5s ago", shardsComplete: 48, shardsTotal: 48, shardsFailed: 0, latencyP50: 8, latencyP99: 28, errorRate: 0, lastHealthCheck: now, uptime: "99.99%", version: "0.4.12", cpuPct: 15, memoryPct: 30, connections: 12, queueDepth: 0 },
        { name: "market-tick-data-service", tier: "core", category: "data", status: "healthy", coveragePct: 98.8, lastRun: "2s ago", shardsComplete: 120, shardsTotal: 122, shardsFailed: 0, latencyP50: 5, latencyP99: 22, errorRate: 0, lastHealthCheck: now, uptime: "99.99%", version: "0.3.8", cpuPct: 45, memoryPct: 55, connections: 64, queueDepth: 1 },
        { name: "features-service", tier: "core", category: "data", status: "healthy", coveragePct: 97.5, lastRun: "12s ago", shardsComplete: 95, shardsTotal: 98, shardsFailed: 1, latencyP50: 22, latencyP99: 85, errorRate: 0.3, lastHealthCheck: now, uptime: "99.95%", version: "0.2.9", cpuPct: 58, memoryPct: 62, connections: 18, queueDepth: 4 },
        { name: "strategy-service", tier: "critical", category: "trading", status: "healthy", coveragePct: 100, lastRun: "8s ago", shardsComplete: 24, shardsTotal: 24, shardsFailed: 0, latencyP50: 18, latencyP99: 62, errorRate: 0, lastHealthCheck: now, uptime: "99.99%", version: "0.5.1", cpuPct: 28, memoryPct: 41, connections: 22, queueDepth: 0, requiredForTier: "Tier 1" },
        { name: "execution-service", tier: "critical", category: "trading", status: "healthy", coveragePct: 100, lastRun: "1s ago", shardsComplete: 16, shardsTotal: 16, shardsFailed: 0, latencyP50: 12, latencyP99: 45, errorRate: 0.1, lastHealthCheck: now, uptime: "99.98%", version: "0.6.3", cpuPct: 34, memoryPct: 52, connections: 48, queueDepth: 3, requiredForTier: "Tier 1" },
        { name: "risk-monitoring-service", tier: "critical", category: "risk", status: "warning", coveragePct: 95.0, lastRun: "25s ago", shardsComplete: 18, shardsTotal: 20, shardsFailed: 2, latencyP50: 35, latencyP99: 180, errorRate: 1.2, lastHealthCheck: now, uptime: "99.7%", version: "0.3.4", cpuPct: 72, memoryPct: 68, connections: 31, queueDepth: 12, requiredForTier: "Tier 1", lastError: "Upstream timeout from position-monitor" },
        { name: "alerting-service", tier: "support", category: "ops", status: "healthy", coveragePct: 100, lastRun: "3s ago", shardsComplete: 8, shardsTotal: 8, shardsFailed: 0, latencyP50: 10, latencyP99: 38, errorRate: 0, lastHealthCheck: now, uptime: "99.99%", version: "0.4.5", cpuPct: 12, memoryPct: 22, connections: 6, queueDepth: 0 },
        { name: "position-monitor-service", tier: "support", category: "risk", status: "healthy", coveragePct: 99.5, lastRun: "4s ago", shardsComplete: 32, shardsTotal: 32, shardsFailed: 0, latencyP50: 20, latencyP99: 65, errorRate: 0.2, lastHealthCheck: now, uptime: "99.95%", version: "0.2.1", cpuPct: 38, memoryPct: 45, connections: 14, queueDepth: 2 },
        { name: "features-onchain-service", tier: "core", category: "data", status: "healthy", coveragePct: 96.8, lastRun: "15s ago", shardsComplete: 28, shardsTotal: 30, shardsFailed: 0, latencyP50: 30, latencyP99: 120, errorRate: 0.5, lastHealthCheck: now, uptime: "99.9%", version: "0.1.7", cpuPct: 40, memoryPct: 48, connections: 8, queueDepth: 2 },
        { name: "ml-inference-service", tier: "core", category: "ml", status: "healthy", coveragePct: 99.0, lastRun: "6s ago", shardsComplete: 10, shardsTotal: 10, shardsFailed: 0, latencyP50: 15, latencyP99: 55, errorRate: 0, lastHealthCheck: now, uptime: "99.97%", version: "0.2.4", cpuPct: 65, memoryPct: 72, connections: 10, queueDepth: 0 },
        { name: "reporting-service", tier: "support", category: "ops", status: "healthy", coveragePct: 100, lastRun: "10s ago", shardsComplete: 4, shardsTotal: 4, shardsFailed: 0, latencyP50: 25, latencyP99: 95, errorRate: 0, lastHealthCheck: now, uptime: "99.98%", version: "0.3.2", cpuPct: 20, memoryPct: 35, connections: 8, queueDepth: 0 },
        { name: "deployment-service", tier: "support", category: "ops", status: "healthy", coveragePct: 100, lastRun: "30s ago", shardsComplete: 2, shardsTotal: 2, shardsFailed: 0, latencyP50: 40, latencyP99: 150, errorRate: 0, lastHealthCheck: now, uptime: "99.99%", version: "0.5.0", cpuPct: 8, memoryPct: 18, connections: 3, queueDepth: 0 },
      ],
    })
  }
  if (route === "/api/service-status/feature-freshness") {
    const now = new Date().toISOString()
    const fiveMinAgo = new Date(Date.now() - 300000).toISOString()
    const tenMinAgo = new Date(Date.now() - 600000).toISOString()
    return json({
      data: [
        { service: "features-service", freshness: 8, sla: 30, status: "healthy", region: "asia-northeast1", lastUpdate: now },
        { service: "features-service", freshness: 12, sla: 30, status: "healthy", region: "us-central1", lastUpdate: now },
        { service: "features-onchain-service", freshness: 25, sla: 30, status: "healthy", region: "asia-northeast1", lastUpdate: fiveMinAgo },
        { service: "market-tick-data-service", freshness: 2, sla: 10, status: "healthy", region: "asia-northeast1", lastUpdate: now },
        { service: "market-tick-data-service", freshness: 5, sla: 10, status: "healthy", region: "us-central1", lastUpdate: now },
        { service: "instruments-service", freshness: 15, sla: 60, status: "healthy", region: "Global", lastUpdate: fiveMinAgo },
        { service: "ml-inference-service", freshness: 45, sla: 30, status: "degraded", region: "asia-northeast1", lastUpdate: tenMinAgo },
        { service: "position-monitor", freshness: 120, sla: 30, status: "unhealthy", region: "asia-northeast1", lastUpdate: tenMinAgo },
      ],
    })
  }
  if (route === "/api/service-status/activity") {
    const now = new Date().toISOString()
    return json({
      data: [
        { id: "log-001", service: "execution-service", severity: "info", message: "Order batch processed: 24 orders filled", timestamp: now, correlationId: "corr-a1b2c3" },
        { id: "log-002", service: "risk-and-exposure-service", severity: "warn", message: "Position limit 85% utilized for strategy trend-follow-v3", timestamp: new Date(Date.now() - 60000).toISOString(), correlationId: "corr-d4e5f6" },
        { id: "log-003", service: "position-monitor", severity: "error", message: "Connection pool exhausted — reconnecting", timestamp: new Date(Date.now() - 120000).toISOString(), correlationId: "corr-g7h8i9" },
        { id: "log-004", service: "strategy-service", severity: "info", message: "Signal generated: momentum_breakout LONG BTC-USDT", timestamp: new Date(Date.now() - 180000).toISOString(), correlationId: "corr-j0k1l2" },
        { id: "log-005", service: "alerting-service", severity: "info", message: "Telegram notification sent: daily PnL summary", timestamp: new Date(Date.now() - 300000).toISOString() },
        { id: "log-006", service: "features-service", severity: "info", message: "Feature batch published: 12 features, avg latency 8ms", timestamp: new Date(Date.now() - 420000).toISOString() },
        { id: "log-007", service: "position-monitor", severity: "critical", message: "Health check failed 3 consecutive times", timestamp: new Date(Date.now() - 600000).toISOString(), correlationId: "corr-m3n4o5" },
        { id: "log-008", service: "market-tick-data-service", severity: "info", message: "WebSocket reconnected to Binance after 2s gap", timestamp: new Date(Date.now() - 900000).toISOString() },
      ],
      totalToday: 142,
    })
  }
  if (route === "/api/service-status/services") {
    return json([
      { name: "instruments-service", version: "0.4.12", uptime: "14d 6h", status: "running" },
      { name: "market-tick-data-service", version: "0.3.8", uptime: "14d 6h", status: "running" },
      { name: "strategy-service", version: "0.5.1", uptime: "14d 6h", status: "running" },
      { name: "execution-service", version: "0.6.3", uptime: "14d 6h", status: "running" },
    ])
  }

  // --- Audit ---
  if (route === "/api/audit/events") return json([])
  if (route === "/api/audit/compliance") return json({ status: "compliant", checks: [] })
  if (route === "/api/audit/data-health") return json({ status: "healthy", gaps: 0 })
  if (route === "/api/audit/batch-jobs") return json([])

  // --- Users / Orgs ---
  if (route === "/api/users/organizations") {
    return json({ data: ORGANIZATIONS.map((o, i) => ({
      ...o, status: "active", memberCount: 3 + i * 2,
      subscriptionTier: i === 0 ? "enterprise" : i === 1 ? "institutional" : "professional",
      monthlyFee: [0, 15000, 8000][i] ?? 5000,
      apiKeys: 2 + i, usageGb: 12 + i * 8,
    })) })
  }
  if (route.startsWith("/api/users/organizations/")) return json({ data: [] })
  if (route === "/api/users/subscriptions") {
    return json({ data: ORGANIZATIONS.map((o, i) => ({
      orgId: o.id, tier: i === 0 ? "enterprise" : i === 1 ? "institutional" : "professional",
      entitlements: i === 0 ? ["*"] : i === 1 ? ["data-pro", "execution-full", "strategy-full", "reporting"] : ["data-basic"],
      startDate: "2025-06-01", renewalDate: "2026-06-01",
      monthlyFee: [0, 15000, 8000][i] ?? 5000,
    })) })
  }

  // --- Config ---
  if (route === "/api/config/mandates") return json([])
  if (route === "/api/config/fee-schedules") return json([])
  if (route === "/api/config/reload") return json({ ok: true })
  if (route === "/api/config/strategies") return json({ ok: true })

  // --- Documents ---
  if (route === "/api/documents/list") return json([])

  // --- Deployment ---
  if (route === "/api/deployment/services") return json([])
  if (route === "/api/deployment/deployments") return json([])
  if (route === "/api/deployment/builds") return json([])

  // --- News ---
  if (route === "/api/news/feed") return json({ data: [] })

  // --- Chat ---
  if (route.startsWith("/api/chat")) return json({ message: "Mock mode — chat unavailable" })

  // --- Provisioning (user lifecycle management) ---
  const provisioningUsers = [
    {
      id: "admin", firebase_uid: "admin-uid", name: "Admin", email: "admin@odum.internal",
      role: "admin", github_handle: "odum-admin", product_slugs: ["data-pro", "execution-full", "ml-full", "strategy-full", "reporting"],
      status: "active", provisioned_at: "2026-01-10T09:00:00Z", last_modified: "2026-03-20T12:00:00Z",
      services: { github: "provisioned", slack: "provisioned", microsoft365: "provisioned", gcp: "provisioned", aws: "provisioned", portal: "provisioned" },
    },
    {
      id: "internal-trader", firebase_uid: "trader-uid", name: "Internal Trader", email: "trader@odum.internal",
      role: "collaborator", github_handle: "odum-trader", product_slugs: ["data-pro", "execution-full", "strategy-full"],
      status: "active", provisioned_at: "2026-01-12T09:00:00Z", last_modified: "2026-03-18T15:00:00Z",
      services: { github: "provisioned", slack: "provisioned", microsoft365: "provisioned", gcp: "provisioned", aws: "provisioned", portal: "provisioned" },
    },
    {
      id: "ops-user", firebase_uid: "ops-uid", name: "Ops Manager", email: "ops@odum.internal",
      role: "operations", slack_handle: "ops-mgr", product_slugs: ["reporting"],
      status: "active", provisioned_at: "2026-02-05T09:00:00Z", last_modified: "2026-03-15T10:00:00Z",
      services: { github: "provisioned", slack: "provisioned", microsoft365: "provisioned", gcp: "provisioned", aws: "provisioned", portal: "provisioned" },
    },
    {
      id: "client-full", firebase_uid: "client-full-uid", name: "Portfolio Manager", email: "pm@alphacapital.com",
      role: "client", product_slugs: ["data-pro", "execution-full", "ml-full", "strategy-full", "reporting"],
      status: "active", provisioned_at: "2026-02-20T09:00:00Z", last_modified: "2026-03-10T12:00:00Z",
      services: { github: "not_applicable", slack: "not_applicable", microsoft365: "not_applicable", gcp: "not_applicable", aws: "not_applicable", portal: "provisioned" },
    },
    {
      id: "client-data-only", firebase_uid: "client-basic-uid", name: "Data Analyst", email: "analyst@betafund.com",
      role: "client", product_slugs: ["data-basic"],
      status: "active", provisioned_at: "2026-03-01T09:00:00Z", last_modified: "2026-03-01T09:00:00Z",
      services: { github: "not_applicable", slack: "not_applicable", microsoft365: "not_applicable", gcp: "not_applicable", aws: "not_applicable", portal: "provisioned" },
    },
    {
      id: "client-premium", firebase_uid: "client-premium-uid", name: "CIO", email: "cio@vertex.com",
      role: "client", product_slugs: ["data-pro", "execution-full", "strategy-full"],
      status: "active", provisioned_at: "2026-02-15T09:00:00Z", last_modified: "2026-03-05T09:00:00Z",
      services: { github: "not_applicable", slack: "not_applicable", microsoft365: "not_applicable", gcp: "not_applicable", aws: "not_applicable", portal: "provisioned" },
    },
  ]

  // Matches auth-api MockStateStore access_requests seed
  const provisioningRequests = [
    {
      id: "req-001", requester_email: "newtrader@vertex.com", requester_name: "New Trader",
      org_id: "vertex", requested_entitlements: ["execution-full", "ml-full"],
      reason: "Need execution and ML access for Q2 strategy deployment",
      status: "pending", admin_note: "", reviewed_by: "",
      created_at: "2026-03-22T14:00:00Z", updated_at: "2026-03-22T14:00:00Z",
    },
    {
      id: "req-002", requester_email: "analyst@betafund.com", requester_name: "Beta Researcher",
      org_id: "beta", requested_entitlements: ["data-pro", "strategy-full"],
      reason: "Upgrading from data-basic to run backtests",
      status: "pending", admin_note: "", reviewed_by: "",
      created_at: "2026-03-21T10:00:00Z", updated_at: "2026-03-21T10:00:00Z",
    },
    {
      id: "req-003", requester_email: "ops@alphacapital.com", requester_name: "Alpha Ops Manager",
      org_id: "acme", requested_entitlements: ["reporting"], requested_role: "operations",
      reason: "Need reporting access for compliance audit",
      status: "approved", admin_note: "Approved — compliance requirement", reviewed_by: "admin@odum.internal",
      created_at: "2026-03-19T09:00:00Z", updated_at: "2026-03-20T11:00:00Z",
    },
  ]

  if (route === "/api/auth/provisioning/users") {
    return json({ users: provisioningUsers, total: provisioningUsers.length })
  }
  if (route.match(/^\/api\/auth\/provisioning\/users\/[^/]+$/) && !route.includes("onboard") && !route.includes("quota")) {
    const userId = route.split("/").pop()
    const user = provisioningUsers.find(u => u.firebase_uid === userId || u.id === userId)
    return json({ user: user ?? provisioningUsers[0] })
  }
  if (route === "/api/auth/provisioning/users/onboard") {
    const body = opts?.body ? JSON.parse(opts.body as string) : {}
    const newUser = {
      id: (body.email ?? "new").split("@")[0], firebase_uid: `uid-${Date.now()}`,
      name: body.name ?? "New User", email: body.email ?? "new@example.com",
      role: body.role ?? "collaborator", product_slugs: body.product_slugs ?? [],
      status: "active", provisioned_at: new Date().toISOString(), last_modified: new Date().toISOString(),
      services: { github: "provisioned", slack: "provisioned", microsoft365: "provisioned", gcp: "provisioned", aws: "provisioned", portal: "provisioned" },
    }
    return json({
      user: newUser,
      provisioning_steps: [
        { service: "github", label: "GitHub", status: "success", message: "GitHub org/team mappings processed." },
        { service: "slack", label: "Slack", status: "success", message: "Slack invite processed." },
        { service: "microsoft365", label: "Microsoft 365", status: "success", message: "M365 user created." },
        { service: "gcp", label: "GCP IAM", status: "success", message: "GCP IAM binding upserted." },
        { service: "aws", label: "AWS IAM", status: "success", message: "AWS breakglass disabled." },
        { service: "portal", label: "Portal", status: "success", message: "Portal provisioning processed." },
      ],
    })
  }
  if (route === "/api/auth/provisioning/users/quota-check") {
    return json({ quota: { ok: true, checks: [], message: "" } })
  }
  if (route === "/api/auth/provisioning/access-templates") {
    return json({ templates: [], total: 0 })
  }
  if (route === "/api/auth/provisioning/access-requests") {
    if (opts?.method === "POST") {
      const body = opts.body ? JSON.parse(opts.body as string) : {}
      return json({
        request: {
          id: `req-${Date.now()}`, requester_email: "you@example.com", requester_name: "You",
          org_id: "", requested_entitlements: body.requested_entitlements ?? [],
          reason: body.reason ?? "", status: "pending", admin_note: "", reviewed_by: "",
          created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        },
      })
    }
    // Support ?status= filter
    const urlObj = new URL(route, "http://localhost")
    const statusFilter = urlObj.searchParams.get("status")
    const filtered = statusFilter ? provisioningRequests.filter(r => r.status === statusFilter) : provisioningRequests
    return json({ requests: filtered, total: filtered.length })
  }
  if (route.match(/^\/api\/auth\/provisioning\/access-requests\/[^/]+\/review$/)) {
    const reqId = route.split("/").at(-2)
    const body = opts?.body ? JSON.parse(opts.body as string) : {}
    const existing = provisioningRequests.find(r => r.id === reqId)
    return json({
      request: {
        ...(existing ?? provisioningRequests[0]),
        status: body.action === "deny" ? "denied" : "approved",
        admin_note: body.admin_note ?? "",
        reviewed_by: "admin@odum.internal",
        updated_at: new Date().toISOString(),
      },
    })
  }

  // --- Health ---
  if (route === "/api/health") return json({ status: "healthy", mock: true })

  return null
}

/**
 * Install the mock fetch handler.
 * Call once from the root layout/provider when NEXT_PUBLIC_MOCK_API=true.
 */
export function installMockHandler(): void {
  if (typeof window === "undefined") return

  const originalFetch = window.fetch.bind(window)
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url
    if (url.startsWith("/api/")) {
      const mockResponse = mockRoute(url, init)
      if (mockResponse) {
        return mockResponse
      }
      // Unhandled /api/ route — return empty 200 to prevent 502 errors
      console.warn(`[mock] Unhandled API route: ${url}`)
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }
    return originalFetch(input, init)
  }

  console.info("[mock] Static visual preview mode active — all API calls intercepted")
}
