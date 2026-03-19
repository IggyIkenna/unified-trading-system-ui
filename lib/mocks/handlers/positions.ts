/**
 * handlers/positions.ts — Position service mock handlers.
 *
 * REAL endpoints (exist in openapi.json):
 *   GET /position-balance-monitor-service/api/positions — list positions
 *
 * ASPIRATIONAL endpoints (mocked ahead of backend):
 *   GET /api/positions — positions with protocol details (Gap 1.2: missing entry_price)
 *   GET /api/positions/summary — portfolio summary (aggregated KPIs)
 *   GET /api/positions/balances — account balances by venue
 */

import { http, HttpResponse } from "msw"
import { STRATEGIES } from "@/lib/strategy-registry"
import { getPersonaFromRequest } from "@/lib/mocks/utils"

function getAllPositions() {
  return STRATEGIES.flatMap((s) =>
    (s.instruments || []).map((inst, i) => ({
      id: `${s.id}-pos-${i}`,
      strategyId: s.id,
      strategyName: s.name,
      clientId: (s as unknown as Record<string, unknown>).clientId as string || "odum-internal",
      underlying: inst.key.split("_")[0] || "UNKNOWN",
      venue: inst.venue || "UNKNOWN",
      instrument: inst.key || "UNKNOWN",
      category: inst.type?.includes("Perp") ? "DEFI" : "CEFI",
      side: (i % 2 === 0 ? "LONG" : "SHORT") as "LONG" | "SHORT",
      size: Math.round((i + 1) * 1.5 * 100) / 100,
      notional: Math.round((i + 1) * 15000),
      currentPrice: Math.round((50000 + i * 1000) * 100) / 100,
      unrealizedPnL: Math.round((i % 3 === 0 ? 1 : -1) * (i + 1) * 500),
      unrealizedPnLPct: Math.round((i % 3 === 0 ? 1 : -1) * (i + 1) * 0.8 * 100) / 100,
      margin: Math.round((i + 1) * 5000),
      leverage: Math.round((1 + i * 0.5) * 10) / 10,
    }))
  )
}

const MOCK_BALANCES = [
  { venue: "Binance", free: 1240000, locked: 810000, total: 2050000, utilization: 39.5 },
  { venue: "Hyperliquid", free: 452000, locked: 348000, total: 800000, utilization: 43.5 },
  { venue: "Aave V3", free: 0, locked: 513000, total: 513000, utilization: 100 },
  { venue: "Deribit", free: 320000, locked: 180000, total: 500000, utilization: 36 },
  { venue: "OKX", free: 210000, locked: 90000, total: 300000, utilization: 30 },
  { venue: "Uniswap", free: 0, locked: 285000, total: 285000, utilization: 100 },
  { venue: "Lido", free: 0, locked: 398000, total: 398000, utilization: 100 },
]

export const positionsHandlers = [
  http.get("*/api/positions", ({ request }) => {
    const persona = getPersonaFromRequest(request)
    if (!persona) return HttpResponse.json({ error: "Unauthorized" }, { status: 401 })

    const isInternal = persona.role === "internal" || persona.role === "admin"
    let positions = getAllPositions()
    if (!isInternal) {
      positions = positions.filter((p) => p.clientId === persona.org.id)
    }

    return HttpResponse.json({ positions, total: positions.length })
  }),

  http.get("*/api/positions/summary", ({ request }) => {
    const persona = getPersonaFromRequest(request)
    if (!persona) return HttpResponse.json({ error: "Unauthorized" }, { status: 401 })

    const isInternal = persona.role === "internal" || persona.role === "admin"
    let positions = getAllPositions()
    if (!isInternal) {
      positions = positions.filter((p) => p.clientId === persona.org.id)
    }

    const totalNotional = positions.reduce((s, p) => s + p.notional, 0)
    const totalPnL = positions.reduce((s, p) => s + p.unrealizedPnL, 0)
    const totalMargin = positions.reduce((s, p) => s + p.margin, 0)

    return HttpResponse.json({
      totalPositions: positions.length,
      totalNotional,
      totalPnL,
      totalMargin,
      longExposure: positions.filter((p) => p.side === "LONG").reduce((s, p) => s + p.notional, 0),
      shortExposure: positions.filter((p) => p.side === "SHORT").reduce((s, p) => s + p.notional, 0),
    })
  }),

  http.get("*/api/positions/balances", ({ request }) => {
    const persona = getPersonaFromRequest(request)
    if (!persona) return HttpResponse.json({ error: "Unauthorized" }, { status: 401 })
    return HttpResponse.json({ balances: MOCK_BALANCES, total: MOCK_BALANCES.length })
  }),
]
