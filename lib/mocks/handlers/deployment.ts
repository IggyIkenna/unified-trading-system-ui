/**
 * handlers/deployment.ts — Deployment service mock handlers (internal-only).
 *
 * REAL endpoints (exist in openapi.json):
 *   GET /deployment-api/api/services — list services with sharding configs
 *   GET /deployment-api/api/deployments — list deployments
 *   POST /deployment-api/api/deployments — create deployment
 *   GET /deployment-api/api/data-status — data completion status
 *   GET /deployment-api/api/cloud-builds/triggers — build triggers
 *   GET /deployment-api/api/checklists — pre-deployment checklists
 *
 * These endpoints are available in the backend deployment-api (92 total endpoints).
 * Only a subset is mocked here for the ops demo.
 */

import { http, HttpResponse } from "msw"
import { getPersonaFromRequest } from "@/lib/mocks/utils"

const MOCK_SERVICES = [
  { name: "execution-service", version: "0.4.12", status: "healthy", shards: ["cefi", "defi"], instances: 3, lastDeploy: "2026-03-18T10:00:00Z" },
  { name: "strategy-service", version: "0.3.8", status: "healthy", shards: ["cefi", "defi", "sports"], instances: 2, lastDeploy: "2026-03-17T14:00:00Z" },
  { name: "risk-and-exposure-service", version: "0.2.5", status: "healthy", shards: ["cefi", "defi"], instances: 2, lastDeploy: "2026-03-18T08:00:00Z" },
  { name: "market-tick-data-service", version: "0.5.2", status: "degraded", shards: ["cefi", "defi", "tradfi", "sports"], instances: 4, lastDeploy: "2026-03-18T06:00:00Z" },
  { name: "features-delta-one-service", version: "0.3.1", status: "healthy", shards: ["cefi", "defi"], instances: 2, lastDeploy: "2026-03-17T20:00:00Z" },
  { name: "ml-inference-service", version: "0.2.0", status: "healthy", shards: ["cefi"], instances: 1, lastDeploy: "2026-03-16T12:00:00Z" },
  { name: "pnl-attribution-service", version: "0.1.9", status: "healthy", shards: ["cefi", "defi"], instances: 2, lastDeploy: "2026-03-18T04:00:00Z" },
  { name: "alerting-service", version: "0.2.3", status: "healthy", shards: [], instances: 1, lastDeploy: "2026-03-15T16:00:00Z" },
  { name: "position-balance-monitor-service", version: "0.3.4", status: "healthy", shards: ["cefi", "defi"], instances: 2, lastDeploy: "2026-03-18T02:00:00Z" },
  { name: "instruments-service", version: "0.4.0", status: "healthy", shards: ["cefi", "defi", "tradfi"], instances: 1, lastDeploy: "2026-03-14T10:00:00Z" },
]

const MOCK_DEPLOYMENTS = [
  { id: "dep-001", service: "market-tick-data-service", status: "running", totalShards: 48, completedShards: 32, failedShards: 2, startedAt: "2026-03-18T06:00:00Z", tag: "daily-backfill" },
  { id: "dep-002", service: "features-delta-one-service", status: "completed", totalShards: 12, completedShards: 12, failedShards: 0, startedAt: "2026-03-17T20:00:00Z", completedAt: "2026-03-17T21:30:00Z", tag: "feature-refresh" },
  { id: "dep-003", service: "execution-service", status: "completed", totalShards: 6, completedShards: 6, failedShards: 0, startedAt: "2026-03-18T10:00:00Z", completedAt: "2026-03-18T10:15:00Z", tag: "hotfix-v0.4.12" },
]

const MOCK_BUILD_TRIGGERS = [
  { id: "trig-001", service: "execution-service", type: "service", branch: "main", lastBuild: { status: "SUCCESS", duration: "3m 42s", finishedAt: "2026-03-18T09:58:00Z" } },
  { id: "trig-002", service: "strategy-service", type: "service", branch: "main", lastBuild: { status: "SUCCESS", duration: "4m 15s", finishedAt: "2026-03-17T13:45:00Z" } },
  { id: "trig-003", service: "unified-trading-library", type: "library", branch: "main", lastBuild: { status: "SUCCESS", duration: "2m 30s", finishedAt: "2026-03-18T08:00:00Z" } },
  { id: "trig-004", service: "market-tick-data-service", type: "service", branch: "staging", lastBuild: { status: "FAILURE", duration: "5m 12s", finishedAt: "2026-03-18T05:50:00Z" } },
]

export const deploymentHandlers = [
  http.get("*/api/deployment/services", ({ request }) => {
    const persona = getPersonaFromRequest(request)
    if (!persona) return HttpResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (persona.role !== "internal" && persona.role !== "admin") {
      return HttpResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    return HttpResponse.json({ services: MOCK_SERVICES, total: MOCK_SERVICES.length })
  }),

  http.get("*/api/deployment/deployments", ({ request }) => {
    const persona = getPersonaFromRequest(request)
    if (!persona) return HttpResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (persona.role !== "internal" && persona.role !== "admin") {
      return HttpResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    return HttpResponse.json({ deployments: MOCK_DEPLOYMENTS, total: MOCK_DEPLOYMENTS.length })
  }),

  http.get("*/api/deployment/builds", ({ request }) => {
    const persona = getPersonaFromRequest(request)
    if (!persona) return HttpResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (persona.role !== "internal" && persona.role !== "admin") {
      return HttpResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    return HttpResponse.json({ triggers: MOCK_BUILD_TRIGGERS, total: MOCK_BUILD_TRIGGERS.length })
  }),
]
