/**
 * handlers/trading.ts — Trading / P&L service mock handlers.
 *
 * REAL endpoints (exist in openapi.json):
 *   GET /trading-analytics-api/api/pnl — P&L summary
 *   GET /trading-analytics-api/api/pnl/attribution — P&L attribution
 *
 * ASPIRATIONAL endpoints (mocked ahead of backend):
 *   GET /api/trading/pnl — aggregated P&L with factor breakdown
 *   GET /api/trading/timeseries — intraday P&L timeseries
 *   GET /api/trading/performance — strategy performance table
 *   GET /api/trading/live-batch-delta — live vs batch divergence
 */

import { http, HttpResponse } from "msw"
import {
  ORGANIZATIONS,
  CLIENTS,
  getAggregatedPnL,
  getAggregatedTimeSeries,
  getStrategyPerformance,
  getLiveBatchDelta,
  getToday,
} from "@/lib/trading-data"
import type { FilterContext } from "@/lib/trading-data"
import { getPersonaFromRequest } from "@/lib/mocks/utils"

function makeFilter(persona: { role: string; org: { id: string } }): FilterContext {
  const isInternal = persona.role === "internal" || persona.role === "admin"
  return {
    organizationIds: isInternal ? [] : [persona.org.id],
    clientIds: [],
    strategyIds: [],
    mode: "live",
    date: getToday(),
  }
}

export const tradingHandlers = [
  http.get("*/api/trading/organizations", ({ request }) => {
    const persona = getPersonaFromRequest(request)
    if (!persona) return HttpResponse.json({ error: "Unauthorized" }, { status: 401 })

    const isInternal = persona.role === "internal" || persona.role === "admin"
    const orgs = isInternal
      ? ORGANIZATIONS
      : ORGANIZATIONS.filter((o) => o.id === persona.org.id)

    return HttpResponse.json({ organizations: orgs, total: orgs.length })
  }),

  http.get("*/api/trading/clients", ({ request }) => {
    const persona = getPersonaFromRequest(request)
    if (!persona) return HttpResponse.json({ error: "Unauthorized" }, { status: 401 })

    const isInternal = persona.role === "internal" || persona.role === "admin"
    const clients = isInternal
      ? CLIENTS
      : CLIENTS.filter((c) => c.orgId === persona.org.id)

    return HttpResponse.json({ clients, total: clients.length })
  }),

  http.get("*/api/trading/pnl", ({ request }) => {
    const persona = getPersonaFromRequest(request)
    if (!persona) return HttpResponse.json({ error: "Unauthorized" }, { status: 401 })
    const pnl = getAggregatedPnL(makeFilter(persona))
    return HttpResponse.json(pnl)
  }),

  http.get("*/api/trading/timeseries", ({ request }) => {
    const persona = getPersonaFromRequest(request)
    if (!persona) return HttpResponse.json({ error: "Unauthorized" }, { status: 401 })
    const series = getAggregatedTimeSeries(makeFilter(persona))
    return HttpResponse.json({ timeseries: series })
  }),

  http.get("*/api/trading/performance", ({ request }) => {
    const persona = getPersonaFromRequest(request)
    if (!persona) return HttpResponse.json({ error: "Unauthorized" }, { status: 401 })
    const performance = getStrategyPerformance(makeFilter(persona))
    return HttpResponse.json({ strategies: performance, total: performance.length })
  }),

  http.get("*/api/trading/live-batch-delta", ({ request }) => {
    const persona = getPersonaFromRequest(request)
    if (!persona) return HttpResponse.json({ error: "Unauthorized" }, { status: 401 })
    const delta = getLiveBatchDelta(makeFilter(persona))
    return HttpResponse.json(delta)
  }),
]
