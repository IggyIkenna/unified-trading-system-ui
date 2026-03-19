/**
 * handlers/service-status.ts — Service health & status mock handlers.
 *
 * REAL endpoints (exist in openapi.json):
 *   GET /deployment-api/api/service-status/overview — all services overview
 *   GET /deployment-api/api/service-status/:service/status — single service status
 *
 * ASPIRATIONAL endpoints (mocked ahead of backend):
 *   GET /api/service-status/overview — aggregate health dashboard
 *   GET /api/service-status/features — feature service freshness
 */

import { http, HttpResponse } from "msw"
import { getPersonaFromRequest } from "@/lib/mocks/utils"

const SERVICE_HEALTH = [
  { name: "execution-service", tier: "T3", status: "healthy", latencyP50: 12, latencyP99: 45, errorRate: 0.001, uptime: 99.99, version: "0.4.12", lastHealthCheck: "2026-03-18T14:59:00Z" },
  { name: "risk-and-exposure-service", tier: "T3", status: "healthy", latencyP50: 8, latencyP99: 32, errorRate: 0.000, uptime: 99.99, version: "0.2.5", lastHealthCheck: "2026-03-18T14:59:00Z" },
  { name: "pnl-attribution-service", tier: "T3", status: "healthy", latencyP50: 15, latencyP99: 52, errorRate: 0.002, uptime: 99.95, version: "0.1.9", lastHealthCheck: "2026-03-18T14:58:00Z" },
  { name: "strategy-service", tier: "T3", status: "healthy", latencyP50: 10, latencyP99: 38, errorRate: 0.001, uptime: 99.98, version: "0.3.8", lastHealthCheck: "2026-03-18T14:59:00Z" },
  { name: "features-delta-one-service", tier: "T2", status: "degraded", latencyP50: 25, latencyP99: 180, errorRate: 0.015, uptime: 99.80, version: "0.3.1", lastHealthCheck: "2026-03-18T14:45:00Z" },
  { name: "market-tick-data-service", tier: "T1", status: "healthy", latencyP50: 5, latencyP99: 18, errorRate: 0.000, uptime: 99.99, version: "0.5.2", lastHealthCheck: "2026-03-18T14:59:00Z" },
  { name: "ml-inference-service", tier: "T2", status: "healthy", latencyP50: 4, latencyP99: 15, errorRate: 0.001, uptime: 99.97, version: "0.2.0", lastHealthCheck: "2026-03-18T14:58:00Z" },
  { name: "alerting-service", tier: "T3", status: "healthy", latencyP50: 6, latencyP99: 22, errorRate: 0.000, uptime: 99.99, version: "0.2.3", lastHealthCheck: "2026-03-18T14:59:00Z" },
  { name: "recon-service", tier: "T3", status: "healthy", latencyP50: 20, latencyP99: 85, errorRate: 0.003, uptime: 99.92, version: "0.1.4", lastHealthCheck: "2026-03-18T14:57:00Z" },
  { name: "client-reporting-api", tier: "T3", status: "healthy", latencyP50: 30, latencyP99: 120, errorRate: 0.002, uptime: 99.90, version: "0.1.2", lastHealthCheck: "2026-03-18T14:56:00Z" },
]

const FEATURE_FRESHNESS = [
  { service: "features-delta-one-service", feature: "technical_indicators", lastUpdated: "2026-03-18T14:12:00Z", sla: "15min", status: "breached", coveragePct: 98.5 },
  { service: "features-delta-one-service", feature: "moving_averages", lastUpdated: "2026-03-18T14:12:00Z", sla: "15min", status: "breached", coveragePct: 99.0 },
  { service: "features-volatility-service", feature: "volatility_realized", lastUpdated: "2026-03-18T14:55:00Z", sla: "15min", status: "ok", coveragePct: 97.2 },
  { service: "features-cross-instrument-service", feature: "correlations", lastUpdated: "2026-03-18T14:50:00Z", sla: "30min", status: "ok", coveragePct: 95.0 },
  { service: "features-multi-timeframe-service", feature: "momentum", lastUpdated: "2026-03-18T14:48:00Z", sla: "30min", status: "ok", coveragePct: 96.5 },
  { service: "features-calendar-service", feature: "temporal", lastUpdated: "2026-03-18T00:00:00Z", sla: "24h", status: "ok", coveragePct: 100 },
]

export const serviceStatusHandlers = [
  http.get("*/api/service-status/overview", ({ request }) => {
    const persona = getPersonaFromRequest(request)
    if (!persona) return HttpResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Client sees health of subscribed services only
    const isInternal = persona.role === "internal" || persona.role === "admin"
    const services = isInternal
      ? SERVICE_HEALTH
      : SERVICE_HEALTH.filter((s) => !["recon-service", "client-reporting-api"].includes(s.name))

    const healthy = services.filter((s) => s.status === "healthy").length
    const degraded = services.filter((s) => s.status === "degraded").length

    return HttpResponse.json({
      services,
      total: services.length,
      summary: { healthy, degraded, down: 0 },
    })
  }),

  http.get("*/api/service-status/features", ({ request }) => {
    const persona = getPersonaFromRequest(request)
    if (!persona) return HttpResponse.json({ error: "Unauthorized" }, { status: 401 })

    return HttpResponse.json({
      features: FEATURE_FRESHNESS,
      total: FEATURE_FRESHNESS.length,
      breached: FEATURE_FRESHNESS.filter((f) => f.status === "breached").length,
    })
  }),
]
