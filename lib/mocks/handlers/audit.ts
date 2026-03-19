/**
 * handlers/audit.ts — Audit / compliance service mock handlers (internal-only).
 *
 * REAL endpoints (exist in openapi.json):
 *   GET /batch-audit-api/api/compliance/checks — compliance check results
 *   GET /batch-audit-api/api/data-health — data health summary
 *   GET /batch-audit-api/api/etl/status — ETL pipeline status
 *
 * ASPIRATIONAL endpoints (mocked ahead of backend):
 *   GET /api/audit/events — audit event stream
 *   GET /api/audit/compliance — compliance status summary
 *   GET /api/audit/data-health — data pipeline health
 */

import { http, HttpResponse } from "msw"
import { getPersonaFromRequest } from "@/lib/mocks/utils"

const AUDIT_EVENTS = [
  { id: "evt-001", type: "strategy_deployed", entity: "CEFI_BTC_ML_DIR_HUF_4H", actor: "system", timestamp: "2026-03-18T14:00:00Z", details: "Strategy promoted from staging to live" },
  { id: "evt-002", type: "config_changed", entity: "risk-limits", actor: "admin@odum.io", timestamp: "2026-03-18T13:30:00Z", details: "Max daily loss limit changed from $400K to $500K" },
  { id: "evt-003", type: "model_retrained", entity: "btc-dir-v3.2.1", actor: "ml-training-service", timestamp: "2026-03-18T12:00:00Z", details: "Scheduled retrain completed. Accuracy: 0.72" },
  { id: "evt-004", type: "alert_triggered", entity: "alerting-service", actor: "system", timestamp: "2026-03-18T11:45:00Z", details: "Kill switch armed — ETH-PERP inventory skew 3.2σ" },
  { id: "evt-005", type: "user_login", entity: "admin@odum.io", actor: "admin@odum.io", timestamp: "2026-03-18T09:00:00Z", details: "Login from 192.168.1.1" },
  { id: "evt-006", type: "deployment_started", entity: "market-tick-data-service", actor: "devops@odum.io", timestamp: "2026-03-18T06:00:00Z", details: "Daily backfill deployment (48 shards)" },
  { id: "evt-007", type: "reconciliation_break", entity: "recon-service", actor: "system", timestamp: "2026-03-18T05:30:00Z", details: "Position mismatch detected: Binance BTC 0.002 diff" },
  { id: "evt-008", type: "settlement_confirmed", entity: "settlement-service", actor: "finance@odum.io", timestamp: "2026-03-17T16:00:00Z", details: "Alpha Capital March profit share $312K settled" },
]

const COMPLIANCE_STATUS = {
  fca: { status: "compliant", referenceNumber: "975797", lastAudit: "2026-03-01", nextAudit: "2026-06-01" },
  mifid: { status: "compliant", reportingActive: true, lastSubmission: "2026-03-18T08:00:00Z" },
  bestExecution: { status: "monitoring", checksToday: 1842, breaches: 0, avgSlippage: 0.0012 },
  dataProtection: { status: "compliant", gdprReview: "2026-01-15", dataRetentionDays: 2190 },
}

const DATA_HEALTH = [
  { pipeline: "instruments-service", status: "healthy", lastRun: "2026-03-18T14:00:00Z", recordsProcessed: 2400, errors: 0, coveragePct: 100 },
  { pipeline: "market-tick-data-service", status: "healthy", lastRun: "2026-03-18T14:55:00Z", recordsProcessed: 48000000, errors: 12, coveragePct: 99.9 },
  { pipeline: "features-delta-one-service", status: "degraded", lastRun: "2026-03-18T14:12:00Z", recordsProcessed: 1200000, errors: 45, coveragePct: 98.5 },
  { pipeline: "ml-training-service", status: "healthy", lastRun: "2026-03-18T12:00:00Z", recordsProcessed: 5000, errors: 0, coveragePct: 100 },
  { pipeline: "pnl-attribution-service", status: "healthy", lastRun: "2026-03-18T14:30:00Z", recordsProcessed: 8500, errors: 2, coveragePct: 99.8 },
]

export const auditHandlers = [
  http.get("*/api/audit/events", ({ request }) => {
    const persona = getPersonaFromRequest(request)
    if (!persona) return HttpResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (persona.role !== "internal" && persona.role !== "admin") {
      return HttpResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    return HttpResponse.json({ events: AUDIT_EVENTS, total: AUDIT_EVENTS.length })
  }),

  http.get("*/api/audit/compliance", ({ request }) => {
    const persona = getPersonaFromRequest(request)
    if (!persona) return HttpResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (persona.role !== "internal" && persona.role !== "admin") {
      return HttpResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    return HttpResponse.json(COMPLIANCE_STATUS)
  }),

  http.get("*/api/audit/data-health", ({ request }) => {
    const persona = getPersonaFromRequest(request)
    if (!persona) return HttpResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (persona.role !== "internal" && persona.role !== "admin") {
      return HttpResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    return HttpResponse.json({ pipelines: DATA_HEALTH, total: DATA_HEALTH.length })
  }),
]
