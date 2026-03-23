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
  const instruments = ["BTC-PERP", "ETH-PERP", "SOL-USDT", "BNB-USDT", "XRP-USDT", "DOGE-USDT", "ADA-USDT", "AVAX-USDT", "LINK-USDT", "DOT-USDT"]
  const venues = ["Binance", "OKX", "Hyperliquid", "Deribit", "Bybit"]
  const allPositions = perf.filter(p => p.status === "live").map((s, i) => ({
    id: `pos-${i}`,
    strategy_id: s.id,
    strategy_name: s.name,
    instrument: instruments[i % instruments.length],
    side: (s.pnl >= 0 ? "LONG" : "SHORT") as "LONG" | "SHORT",
    quantity: Math.abs(s.exposure) / (42000 / ((i % 5) + 1)),
    entry_price: 42000 / ((i % 5) + 1),
    current_price: 42000 / ((i % 5) + 1) * (1 + s.pnl / Math.max(s.nav, 1)),
    pnl: s.pnl,
    pnl_pct: s.nav > 0 ? (s.pnl / s.nav) * 100 : 0,
    unrealized_pnl: s.pnl,
    venue: venues[i % venues.length],
    margin: s.exposure * 0.22,
    leverage: Math.round(s.exposure / Math.max(s.nav * 0.3, 1)),
    updated_at: new Date().toISOString(),
    health_factor: s.assetClass === "DeFi" ? 1.45 : undefined,
    // Dashboard VenueMargin fields
    venueLabel: venues[i % venues.length],
    used: s.exposure * 0.22,
    available: s.nav - s.exposure * 0.22,
    total: s.nav,
    utilization: Math.round((s.exposure * 0.22 / Math.max(s.nav, 1)) * 100),
    trend: (s.pnlChange > 1 ? "up" : s.pnlChange < -1 ? "down" : "stable") as "up" | "down" | "stable",
    marginCallDistance: Math.max(5, 30 - Math.round((s.exposure * 0.22 / Math.max(s.nav, 1)) * 30)),
    lastUpdate: new Date().toISOString(),
  }))

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
    // Map execution-platform mock shape to OrderRecord shape with edge/instant P&L
    const liveStrategies = perf.filter(s => s.status === "live")
    return json(MOCK_RECENT_ORDERS.map((o, i) => {
      const strategy = liveStrategies[i % liveStrategies.length]
      const fillPrice = o.avgPrice ?? o.limitPrice ?? 0
      const markPrice = fillPrice * (1 + (i % 3 === 0 ? -0.002 : 0.003))
      const side = o.side.toUpperCase()
      const edgeBps = side === "BUY"
        ? ((markPrice - fillPrice) / fillPrice) * 10000
        : ((fillPrice - markPrice) / fillPrice) * 10000
      const instantPnl = side === "BUY"
        ? (markPrice - fillPrice) * (o.filledQty ?? 0) / fillPrice
        : (fillPrice - markPrice) * (o.filledQty ?? 0) / fillPrice
      return {
        order_id: o.id,
        instrument: o.instrument,
        side,
        type: o.algo ?? "MARKET",
        price: fillPrice,
        mark_price: Math.round(markPrice * 100) / 100,
        quantity: o.quantity,
        filled: o.filledQty ?? 0,
        status: o.status.toUpperCase(),
        venue: o.venue,
        strategy_id: strategy?.id ?? "",
        strategy_name: strategy?.name ?? "",
        edge_bps: Math.round(edgeBps * 10) / 10,
        instant_pnl: Math.round(instantPnl),
        created_at: o.createdAt,
      }
    }))
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
      { name: "Market Crash -20%", multiplier: -0.2, pnlImpact: -2400000, varImpact: -3100000, positionsBreaching: 12, largestLoss: "BTC-PERP: -$850K" },
      { name: "Vol Spike +50%", multiplier: 1.5, pnlImpact: -800000, varImpact: -1200000, positionsBreaching: 5, largestLoss: "ETH-PERP: -$320K" },
      { name: "Rate Hike 100bp", multiplier: 0.01, pnlImpact: -350000, varImpact: -500000, positionsBreaching: 3, largestLoss: "SOL-PERP: -$120K" },
    ] })
  }
  if (route === "/api/risk/var-summary") {
    return json({ portfolioVaR: 185000, cVar: 245000, marginalVaR: [{ asset: "BTC", mvar: 0.45 }, { asset: "ETH", mvar: 0.30 }] })
  }
  if (route.startsWith("/api/risk/stress-test")) {
    return json({ scenario: "custom", pnlImpact: -1200000, positions: 24, worstPosition: { instrument: "BTC-PERP", loss: -450000 } })
  }
  if (route === "/api/risk/regime") {
    return json({ regime: "normal", current: "normal", confidence: 0.78, indicators: { vix: 18.5, btcVol: 42, corrIndex: 0.65 } })
  }
  if (route === "/api/risk/correlation-matrix") {
    const assets = ["BTC", "ETH", "SOL", "BNB"]
    return json({ assets, matrix: assets.map((_, i) => assets.map((_, j) => i === j ? 1 : 0.3 + Math.random() * 0.5)) })
  }
  if (route === "/api/risk/venue-circuit-breakers") {
    return json(["Binance", "OKX", "Hyperliquid", "Deribit"].map(v => ({ venue: v, status: "armed", tripCount: 0, lastTrip: null })))
  }
  if (route === "/api/risk/circuit-breaker" || route === "/api/risk/kill-switch") {
    return json({ ok: true })
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
  if (route === "/api/ml/model-families") return json(MODEL_FAMILIES)
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
  if (route === "/api/reporting/reports") return json([])
  if (route === "/api/reporting/settlements") return json([])
  if (route === "/api/reporting/reconciliation") return json({ breaks: [], total: 0 })
  if (route === "/api/reporting/regulatory") return json([])
  if (route === "/api/reporting/pnl-attribution") return json({ factors: [], total: 0 })
  if (route === "/api/reporting/executive-summary") return json({ aum: 45000000, pnlMtd: 1200000, sharpe: 2.1, strategies: 12 })
  if (route === "/api/reporting/invoices") return json([])
  if (route.startsWith("/api/reporting/reconciliation/")) return json({ ok: true })
  if (route === "/api/reporting/generate") return json({ ok: true, reportId: "rpt-mock-001" })
  if (route === "/api/reporting/schedules") return json([])

  // --- Service Status ---
  if (route === "/api/service-status/health") {
    return json({
      status: "healthy",
      services: [
        { name: "instruments-service", freshness: 5, sla: 30, status: "live" },
        { name: "market-tick-data-service", freshness: 2, sla: 10, status: "live" },
        { name: "features-service", freshness: 12, sla: 30, status: "live" },
        { name: "strategy-service", freshness: 8, sla: 30, status: "live" },
        { name: "execution-service", freshness: 1, sla: 5, status: "live" },
        { name: "risk-monitoring-service", freshness: 25, sla: 30, status: "warning" },
        { name: "alerting-service", freshness: 3, sla: 10, status: "live" },
        { name: "position-monitor", freshness: 45, sla: 30, status: "critical" },
      ],
    })
  }
  if (route === "/api/service-status/feature-freshness") {
    return json({
      features: [
        { name: "order_imbalance", freshness: "fresh", lastUpdated: new Date().toISOString() },
        { name: "funding_rate", freshness: "fresh", lastUpdated: new Date().toISOString() },
        { name: "volatility_regime", freshness: "stale", lastUpdated: new Date(Date.now() - 300000).toISOString() },
      ],
    })
  }
  if (route === "/api/service-status/activity") {
    return json({ events: [], totalToday: 142 })
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
