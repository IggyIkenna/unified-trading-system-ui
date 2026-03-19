/**
 * handlers/data.ts — Data Provision service mock handlers.
 *
 * REAL endpoints (exist in openapi.json):
 *   GET /market-data-api/api/instruments — instrument catalogue
 *   GET /market-data-api/api/instruments/:id — single instrument detail
 *
 * ASPIRATIONAL endpoints (mocked ahead of backend — see API_FRONTEND_GAPS.md):
 *   GET /api/data/catalogue — catalogue entries with freshness (not in openapi.json)
 *   GET /api/data/subscriptions — org subscriptions (not in openapi.json)
 *   GET /api/data/shard-availability — shard freshness heatmap (not in openapi.json)
 *   GET /api/data/venues — venue coverage summary (not in openapi.json)
 *   GET /api/data/etl/pipelines — ETL pipeline status (internal only)
 */

import { http, HttpResponse } from "msw"
import {
  MOCK_INSTRUMENTS,
  MOCK_CATALOGUE,
  MOCK_SUBSCRIPTIONS,
  MOCK_SHARD_AVAILABILITY,
  MOCK_VENUE_COVERAGE,
  MOCK_ETL_PIPELINES,
  MOCK_DATA_GAPS,
  ETL_SUMMARY,
  ADMIN_SUMMARY,
} from "@/lib/data-service-mock-data"
import { getPersonaFromRequest, scopeByEntitlement } from "@/lib/mocks/utils"

export const dataHandlers = [
  // Instruments catalogue — subscription-filtered
  http.get("*/api/data/instruments", ({ request }) => {
    const persona = getPersonaFromRequest(request)
    if (!persona) return HttpResponse.json({ error: "Unauthorized" }, { status: 401 })

    const scoped = scopeByEntitlement(MOCK_INSTRUMENTS as unknown[] as Record<string, unknown>[], [...persona.entitlements], {
      categoryField: "category",
      basicLimit: 180,
    })

    return HttpResponse.json({
      instruments: scoped,
      total: scoped.length,
      persona: persona.id,
    })
  }),

  // Catalogue entries (freshness, storage stats) — subscription-filtered
  http.get("*/api/data/catalogue", ({ request }) => {
    const persona = getPersonaFromRequest(request)
    if (!persona) return HttpResponse.json({ error: "Unauthorized" }, { status: 401 })

    const isWildcard = persona.entitlements.includes("*" as never)
    const hasDataPro = persona.entitlements.includes("data-pro" as never)

    let entries = MOCK_CATALOGUE
    if (!isWildcard && !hasDataPro) {
      entries = entries.filter(
        (e) => e.instrument.category.toLowerCase() === "cefi"
      )
    }

    return HttpResponse.json({
      catalogue: entries,
      total: entries.length,
    })
  }),

  // Subscriptions — org-scoped
  http.get("*/api/data/subscriptions", ({ request }) => {
    const persona = getPersonaFromRequest(request)
    if (!persona) return HttpResponse.json({ error: "Unauthorized" }, { status: 401 })

    const isInternal =
      persona.role === "internal" || persona.role === "admin"

    // Internal sees all subs, clients see their org's subs
    const subs = isInternal
      ? MOCK_SUBSCRIPTIONS
      : MOCK_SUBSCRIPTIONS.filter((s) => s.orgId === persona.org.id)

    return HttpResponse.json({ subscriptions: subs, total: subs.length })
  }),

  // Shard availability — shared infrastructure, subscription-filtered
  http.get("*/api/data/shard-availability", ({ request }) => {
    const persona = getPersonaFromRequest(request)
    if (!persona) return HttpResponse.json({ error: "Unauthorized" }, { status: 401 })

    const isWildcard = persona.entitlements.includes("*" as never)
    const hasDataPro = persona.entitlements.includes("data-pro" as never)

    let shards = MOCK_SHARD_AVAILABILITY
    if (!isWildcard && !hasDataPro) {
      shards = shards.filter((s) => s.category === "cefi")
    }

    return HttpResponse.json({ shards, total: shards.length })
  }),

  // Venue coverage — shared infrastructure
  http.get("*/api/data/venues", ({ request }) => {
    const persona = getPersonaFromRequest(request)
    if (!persona) return HttpResponse.json({ error: "Unauthorized" }, { status: 401 })

    const isWildcard = persona.entitlements.includes("*" as never)
    const hasDataPro = persona.entitlements.includes("data-pro" as never)

    let venues = MOCK_VENUE_COVERAGE
    if (!isWildcard && !hasDataPro) {
      venues = venues.filter((v) => v.category === "cefi")
    }

    return HttpResponse.json({ venues, total: venues.length })
  }),

  // ETL pipelines — internal only
  http.get("*/api/data/etl/pipelines", ({ request }) => {
    const persona = getPersonaFromRequest(request)
    if (!persona) return HttpResponse.json({ error: "Unauthorized" }, { status: 401 })

    if (persona.role !== "internal" && persona.role !== "admin") {
      return HttpResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return HttpResponse.json({
      pipelines: MOCK_ETL_PIPELINES,
      gaps: MOCK_DATA_GAPS,
      summary: ETL_SUMMARY,
    })
  }),

  // Admin summary stats — internal only
  http.get("*/api/data/admin/summary", ({ request }) => {
    const persona = getPersonaFromRequest(request)
    if (!persona) return HttpResponse.json({ error: "Unauthorized" }, { status: 401 })

    if (persona.role !== "internal" && persona.role !== "admin") {
      return HttpResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return HttpResponse.json(ADMIN_SUMMARY)
  }),
]
