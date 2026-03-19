/**
 * handlers/risk.ts — Risk service mock handlers.
 *
 * REAL endpoints (exist in openapi.json):
 *   GET /risk-and-exposure-service/api/limits — global shard limits
 *   GET /risk-and-exposure-service/api/exposure — current exposure
 *
 * ASPIRATIONAL endpoints (mocked ahead of backend — see API_FRONTEND_GAPS.md):
 *   GET /api/risk/limits — risk limits hierarchy (Gap 1.1: no per-venue yet)
 *   GET /api/risk/var — VaR component breakdown
 *   GET /api/risk/greeks — portfolio Greeks
 *   GET /api/risk/stress — stress scenario analysis (Gap 3.3: NOT PLANNED)
 */

import { http, HttpResponse } from "msw"
import { getPersonaFromRequest } from "@/lib/mocks/utils"

const RISK_LIMITS = [
  { id: "rl-1", name: "Max Daily Loss", value: -245000, limit: -500000, unit: "USD", category: "exposure", entity: "Company", entityType: "company", level: 0, parentId: null },
  { id: "rl-2", name: "Max Gross Exposure", value: 12500000, limit: 25000000, unit: "USD", category: "exposure", entity: "Delta One Desk", entityType: "client", level: 1, parentId: "rl-1" },
  { id: "rl-3", name: "Max Net Exposure", value: 1200000, limit: 5000000, unit: "USD", category: "exposure", entity: "Delta One Desk", entityType: "client", level: 1, parentId: "rl-1" },
  { id: "rl-4", name: "Max Position Size", value: 0.035, limit: 0.05, unit: "ratio", category: "concentration", entity: "BTC Strategy", entityType: "strategy", level: 2, parentId: "rl-2" },
  { id: "rl-5", name: "Aave LTV", value: 0.72, limit: 0.825, unit: "ratio", category: "ltv", entity: "Aave V3 ETH", entityType: "strategy", level: 2, parentId: "rl-2" },
]

const VAR_COMPONENTS = [
  { instrument: "ETH-PERP", venue: "Hyperliquid", var95: 1200000, pct: 28, assetClass: "defi" },
  { instrument: "BTC-PERP", venue: "Binance", var95: 980000, pct: 23, assetClass: "cefi" },
  { instrument: "wstETH/ETH", venue: "Uniswap", var95: 620000, pct: 15, assetClass: "defi" },
  { instrument: "BTC Options", venue: "Deribit", var95: 540000, pct: 13, assetClass: "cefi" },
  { instrument: "SOL-PERP", venue: "Hyperliquid", var95: 320000, pct: 8, assetClass: "defi" },
  { instrument: "EUR/USD", venue: "LMAX", var95: 280000, pct: 7, assetClass: "tradfi" },
  { instrument: "SPX Options", venue: "CBOE", var95: 150000, pct: 4, assetClass: "tradfi" },
  { instrument: "NFL Futures", venue: "Pinnacle", var95: 60000, pct: 2, assetClass: "sports" },
]

const PORTFOLIO_GREEKS = {
  delta: -0.80,
  gamma: 0.044,
  vega: 12400,
  theta: -3200,
  rho: 890,
}

const STRESS_SCENARIOS = [
  { name: "GFC 2008", multiplier: 3.5, pnlImpact: -7200000, varImpact: 4100000, positionsBreaching: 8 },
  { name: "COVID March 2020", multiplier: 2.8, pnlImpact: -5100000, varImpact: 3200000, positionsBreaching: 6 },
  { name: "Crypto Black Thursday", multiplier: 4.2, pnlImpact: -8500000, varImpact: 5600000, positionsBreaching: 12 },
  { name: "UST/Luna Collapse", multiplier: 3.0, pnlImpact: -4200000, varImpact: 2800000, positionsBreaching: 4 },
  { name: "FTX Contagion", multiplier: 2.5, pnlImpact: -3800000, varImpact: 2100000, positionsBreaching: 5 },
]

export const riskHandlers = [
  http.get("*/api/risk/limits", ({ request }) => {
    const persona = getPersonaFromRequest(request)
    if (!persona) return HttpResponse.json({ error: "Unauthorized" }, { status: 401 })

    const isInternal = persona.role === "internal" || persona.role === "admin"
    const limits = isInternal
      ? RISK_LIMITS
      : RISK_LIMITS.filter((l) => l.level <= 1)

    return HttpResponse.json({ limits, total: limits.length })
  }),

  http.get("*/api/risk/var", ({ request }) => {
    const persona = getPersonaFromRequest(request)
    if (!persona) return HttpResponse.json({ error: "Unauthorized" }, { status: 401 })
    return HttpResponse.json({
      components: VAR_COMPONENTS,
      totalVar95: VAR_COMPONENTS.reduce((s, c) => s + c.var95, 0),
    })
  }),

  http.get("*/api/risk/greeks", ({ request }) => {
    const persona = getPersonaFromRequest(request)
    if (!persona) return HttpResponse.json({ error: "Unauthorized" }, { status: 401 })
    return HttpResponse.json(PORTFOLIO_GREEKS)
  }),

  http.get("*/api/risk/stress", ({ request }) => {
    const persona = getPersonaFromRequest(request)
    if (!persona) return HttpResponse.json({ error: "Unauthorized" }, { status: 401 })
    return HttpResponse.json({ scenarios: STRESS_SCENARIOS, total: STRESS_SCENARIOS.length })
  }),
]
