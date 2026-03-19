/**
 * handlers/execution.ts — Execution service mock handlers.
 *
 * REAL endpoints (exist in openapi.json):
 *   GET /execution-service/api/orders — list orders
 *   GET /execution-results-api/api/orders — execution results
 *   GET /execution-results-api/api/fills — fills
 *
 * ASPIRATIONAL endpoints (mocked ahead of backend):
 *   GET /api/execution/algos — algo catalogue
 *   GET /api/execution/venues — venue connectivity matrix
 *   GET /api/execution/tca — TCA reports
 *   GET /api/execution/candidates — execution candidates
 *   GET /api/execution/algo-backtests — algo backtest results
 */

import { http, HttpResponse } from "msw"
import {
  MOCK_EXECUTION_ALGOS,
  MOCK_VENUES,
  MOCK_RECENT_ORDERS,
  MOCK_ALGO_BACKTESTS,
} from "@/lib/execution-platform-mock-data"
import { getPersonaFromRequest } from "@/lib/mocks/utils"

export const executionHandlers = [
  http.get("*/api/execution/algos", ({ request }) => {
    const persona = getPersonaFromRequest(request)
    if (!persona) return HttpResponse.json({ error: "Unauthorized" }, { status: 401 })
    return HttpResponse.json({ algos: MOCK_EXECUTION_ALGOS, total: MOCK_EXECUTION_ALGOS.length })
  }),

  http.get("*/api/execution/venues", ({ request }) => {
    const persona = getPersonaFromRequest(request)
    if (!persona) return HttpResponse.json({ error: "Unauthorized" }, { status: 401 })
    return HttpResponse.json({ venues: MOCK_VENUES, total: MOCK_VENUES.length })
  }),

  http.get("*/api/execution/orders", ({ request }) => {
    const persona = getPersonaFromRequest(request)
    if (!persona) return HttpResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Client-scoped: clients see only their org's orders
    const isInternal = persona.role === "internal" || persona.role === "admin"
    const orders = isInternal
      ? MOCK_RECENT_ORDERS
      : MOCK_RECENT_ORDERS.filter((o) => (o as unknown as Record<string, unknown>).clientId === persona.org.id)

    return HttpResponse.json({ orders, total: orders.length })
  }),

  http.get("*/api/execution/algo-backtests", ({ request }) => {
    const persona = getPersonaFromRequest(request)
    if (!persona) return HttpResponse.json({ error: "Unauthorized" }, { status: 401 })
    return HttpResponse.json({ backtests: MOCK_ALGO_BACKTESTS, total: MOCK_ALGO_BACKTESTS.length })
  }),
]
