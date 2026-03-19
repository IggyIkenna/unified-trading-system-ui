/**
 * handlers/strategy.ts — Strategy service mock handlers.
 *
 * REAL endpoints (exist in openapi.json):
 *   GET /trading-analytics-api/api/strategies — list strategies
 *
 * ASPIRATIONAL endpoints (mocked ahead of backend):
 *   GET /api/strategy/templates — strategy template catalogue
 *   GET /api/strategy/configs — active strategy configurations
 *   GET /api/strategy/backtests — backtest run results
 *   GET /api/strategy/candidates — promotion candidates
 *   GET /api/strategy/alerts — strategy alerts
 */

import { http, HttpResponse } from "msw"
import {
  STRATEGY_TEMPLATES,
  STRATEGY_CONFIGS,
  BACKTEST_RUNS,
  STRATEGY_CANDIDATES,
  STRATEGY_ALERTS,
} from "@/lib/strategy-platform-mock-data"
import { getPersonaFromRequest } from "@/lib/mocks/utils"

export const strategyHandlers = [
  http.get("*/api/strategy/templates", ({ request }) => {
    const persona = getPersonaFromRequest(request)
    if (!persona) return HttpResponse.json({ error: "Unauthorized" }, { status: 401 })
    return HttpResponse.json({ templates: STRATEGY_TEMPLATES, total: STRATEGY_TEMPLATES.length })
  }),

  http.get("*/api/strategy/configs", ({ request }) => {
    const persona = getPersonaFromRequest(request)
    if (!persona) return HttpResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Client-scoped
    const isInternal = persona.role === "internal" || persona.role === "admin"
    const configs = isInternal
      ? STRATEGY_CONFIGS
      : STRATEGY_CONFIGS.filter((c) => c.clientId === persona.org.id)

    return HttpResponse.json({ configs, total: configs.length })
  }),

  http.get("*/api/strategy/backtests", ({ request }) => {
    const persona = getPersonaFromRequest(request)
    if (!persona) return HttpResponse.json({ error: "Unauthorized" }, { status: 401 })
    return HttpResponse.json({ backtests: BACKTEST_RUNS, total: BACKTEST_RUNS.length })
  }),

  http.get("*/api/strategy/candidates", ({ request }) => {
    const persona = getPersonaFromRequest(request)
    if (!persona) return HttpResponse.json({ error: "Unauthorized" }, { status: 401 })
    return HttpResponse.json({ candidates: STRATEGY_CANDIDATES, total: STRATEGY_CANDIDATES.length })
  }),

  http.get("*/api/strategy/alerts", ({ request }) => {
    const persona = getPersonaFromRequest(request)
    if (!persona) return HttpResponse.json({ error: "Unauthorized" }, { status: 401 })
    return HttpResponse.json({ alerts: STRATEGY_ALERTS, total: STRATEGY_ALERTS.length })
  }),
]
