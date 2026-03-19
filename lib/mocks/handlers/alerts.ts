/**
 * handlers/alerts.ts — Alerting service mock handlers.
 *
 * REAL endpoints (exist in openapi.json):
 *   GET /alerting-service/api/alerts — list alerts
 *   POST /alerting-service/api/alerts — create alert
 *
 * ASPIRATIONAL endpoints (mocked ahead of backend):
 *   GET /api/alerts — alert list with severity/status filtering
 *   PATCH /api/alerts/:id/acknowledge — acknowledge alert
 *   PATCH /api/alerts/:id/resolve — resolve alert
 *   GET /api/alerts/summary — alert counts by severity
 */

import { http, HttpResponse } from "msw"
import { getPersonaFromRequest } from "@/lib/mocks/utils"

interface MockAlert {
  id: string
  severity: "critical" | "high" | "medium" | "low" | "info"
  status: "active" | "acknowledged" | "resolved" | "muted"
  title: string
  description: string
  source: string
  entity: string
  entityType: "strategy" | "venue" | "service" | "position"
  clientId: string
  timestamp: string
  value?: string
  threshold?: string
  recommendedAction?: string
}

const MOCK_ALERTS: MockAlert[] = [
  {
    id: "alert-001", severity: "critical", status: "active",
    title: "Kill Switch Armed — Inventory Skew",
    description: "ETH-PERP inventory skew exceeds 3σ threshold. Kill switch armed for Hyperliquid positions.",
    source: "risk-and-exposure-service", entity: "DEFI_ETH_RSB_SCE_8H", entityType: "strategy",
    clientId: "odum-internal", timestamp: new Date(Date.now() - 120000).toISOString(),
    value: "3.2σ", threshold: "3.0σ", recommendedAction: "Review ETH-PERP exposure and consider partial unwind",
  },
  {
    id: "alert-002", severity: "high", status: "active",
    title: "Feature Freshness SLA Breach",
    description: "features-delta-1-service last update 47min ago (SLA: 15min). Downstream models may use stale signals.",
    source: "features-delta-one-service", entity: "features-delta-1-service", entityType: "service",
    clientId: "odum-internal", timestamp: new Date(Date.now() - 300000).toISOString(),
    value: "47min", threshold: "15min", recommendedAction: "Check features-delta-1-service health and restart if needed",
  },
  {
    id: "alert-003", severity: "high", status: "active",
    title: "Margin Utilization Warning — Binance",
    description: "Cross-margin utilization at 78% on Binance. Approaching maintenance margin threshold.",
    source: "position-balance-monitor-service", entity: "Binance", entityType: "venue",
    clientId: "odum-internal", timestamp: new Date(Date.now() - 600000).toISOString(),
    value: "78%", threshold: "80%", recommendedAction: "Add collateral or reduce position sizes on Binance",
  },
  {
    id: "alert-004", severity: "medium", status: "active",
    title: "Reconciliation Break — Elysium SMA",
    description: "Position mismatch between execution-service and position-balance-monitor for Elysium SMA account.",
    source: "recon-service", entity: "CEFI_BTC_ML_DIR_HUF_4H", entityType: "strategy",
    clientId: "acme", timestamp: new Date(Date.now() - 1200000).toISOString(),
    recommendedAction: "Trigger manual reconciliation and verify fills",
  },
  {
    id: "alert-005", severity: "medium", status: "acknowledged",
    title: "LTV Near Threshold — Aave V3",
    description: "Aave V3 wstETH/WETH position LTV at 0.72 (max: 0.825). Health factor dropping.",
    source: "position-balance-monitor-service", entity: "Aave V3", entityType: "venue",
    clientId: "odum-internal", timestamp: new Date(Date.now() - 1800000).toISOString(),
    value: "LTV 0.72", threshold: "Max 0.825", recommendedAction: "Monitor health factor; consider partial repayment",
  },
  {
    id: "alert-006", severity: "low", status: "active",
    title: "Order Latency Spike — Deribit",
    description: "Deribit order submission p99 latency elevated to 450ms (normal: <200ms).",
    source: "execution-service", entity: "Deribit", entityType: "venue",
    clientId: "odum-internal", timestamp: new Date(Date.now() - 3600000).toISOString(),
    value: "450ms p99", threshold: "<200ms", recommendedAction: "Monitor; may resolve with next Deribit maintenance window",
  },
  {
    id: "alert-007", severity: "info", status: "resolved",
    title: "Model Retrained — BTC Direction v3.2.1",
    description: "Scheduled retrain completed. Accuracy improved from 0.68 to 0.72. Champion/challenger swap pending.",
    source: "ml-training-service", entity: "btc-dir-v3.2.1", entityType: "strategy",
    clientId: "odum-internal", timestamp: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "alert-008", severity: "low", status: "resolved",
    title: "Batch Pipeline Complete — Historical Backfill",
    description: "DeFi historical data backfill for Aave V3 completed. 180 days of lending rate data available.",
    source: "market-tick-data-service", entity: "market-tick-data-service", entityType: "service",
    clientId: "odum-internal", timestamp: new Date(Date.now() - 14400000).toISOString(),
  },
]

export const alertsHandlers = [
  http.get("*/api/alerts", ({ request }) => {
    const persona = getPersonaFromRequest(request)
    if (!persona) return HttpResponse.json({ error: "Unauthorized" }, { status: 401 })

    const isInternal = persona.role === "internal" || persona.role === "admin"
    const alerts = isInternal
      ? MOCK_ALERTS
      : MOCK_ALERTS.filter((a) => a.clientId === persona.org.id)

    return HttpResponse.json({ alerts, total: alerts.length })
  }),

  http.get("*/api/alerts/summary", ({ request }) => {
    const persona = getPersonaFromRequest(request)
    if (!persona) return HttpResponse.json({ error: "Unauthorized" }, { status: 401 })

    const isInternal = persona.role === "internal" || persona.role === "admin"
    const alerts = isInternal
      ? MOCK_ALERTS
      : MOCK_ALERTS.filter((a) => a.clientId === persona.org.id)

    const active = alerts.filter((a) => a.status === "active")
    return HttpResponse.json({
      total: alerts.length,
      active: active.length,
      critical: active.filter((a) => a.severity === "critical").length,
      high: active.filter((a) => a.severity === "high").length,
      medium: active.filter((a) => a.severity === "medium").length,
      low: active.filter((a) => a.severity === "low").length,
    })
  }),

  http.patch("*/api/alerts/:id/acknowledge", ({ request, params }) => {
    const persona = getPersonaFromRequest(request)
    if (!persona) return HttpResponse.json({ error: "Unauthorized" }, { status: 401 })
    return HttpResponse.json({ id: params.id, status: "acknowledged", acknowledgedBy: persona.id })
  }),

  http.patch("*/api/alerts/:id/resolve", ({ request, params }) => {
    const persona = getPersonaFromRequest(request)
    if (!persona) return HttpResponse.json({ error: "Unauthorized" }, { status: 401 })
    return HttpResponse.json({ id: params.id, status: "resolved", resolvedBy: persona.id })
  }),
]
