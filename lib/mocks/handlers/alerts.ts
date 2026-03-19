/**
 * Alerts MSW Handler
 * 
 * Mock handlers for alerting service.
 * All data is client-scoped via org context.
 * 
 * REAL endpoints (exist in openapi.json):
 *   GET /api/alerts — list alerts
 *   GET /api/alerts/:id — get alert details
 * 
 * ASPIRATIONAL endpoints (mocked ahead of backend):
 *   GET /api/alerts/stats — alert statistics
 *   GET /api/alerts/rules — alert rules
 *   POST /api/alerts/:id/acknowledge — acknowledge alert
 *   POST /api/alerts/:id/resolve — resolve alert
 *   POST /api/alerts/:id/snooze — snooze alert
 */

import { http, HttpResponse, delay } from "msw"
import { API_CONFIG } from "@/lib/config"
import { getPersonaFromRequest, generateMockId } from "../utils"

// =============================================================================
// TYPES
// =============================================================================

type AlertType = "risk" | "execution" | "system" | "compliance" | "position" | "market"
type AlertSeverity = "critical" | "high" | "medium" | "low" | "info"
type AlertStatus = "active" | "acknowledged" | "resolved" | "snoozed"

// =============================================================================
// MOCK DATA GENERATORS
// =============================================================================

const ALERT_TEMPLATES: Array<{ type: AlertType; severity: AlertSeverity; title: string; message: string }> = [
  { type: "risk", severity: "critical", title: "Position Limit Breach", message: "BTC position exceeds maximum allowed limit of $500,000" },
  { type: "risk", severity: "high", title: "VaR Threshold Warning", message: "Portfolio VaR approaching 95% threshold" },
  { type: "execution", severity: "medium", title: "Slippage Alert", message: "Order execution slippage exceeded 0.5% on Binance" },
  { type: "execution", severity: "low", title: "Order Partially Filled", message: "Large order only 65% filled after 30 minutes" },
  { type: "system", severity: "critical", title: "API Connection Lost", message: "Lost connection to Coinbase API" },
  { type: "system", severity: "high", title: "High Latency Detected", message: "Market data latency exceeding 500ms" },
  { type: "compliance", severity: "high", title: "Trade Reporting Delay", message: "Regulatory trade report delayed by 15 minutes" },
  { type: "position", severity: "medium", title: "Margin Call Warning", message: "Account approaching maintenance margin requirement" },
  { type: "market", severity: "info", title: "Unusual Volume", message: "ETH volume 3x above average in last hour" },
  { type: "market", severity: "low", title: "Spread Widening", message: "BTC/USD spread widened to 0.1% on Kraken" },
]

function generateAlerts(count: number, orgId: string): Array<{
  id: string
  type: AlertType
  severity: AlertSeverity
  status: AlertStatus
  title: string
  message: string
  source: string
  createdAt: string
  updatedAt: string
  acknowledgedBy?: string
  acknowledgedAt?: string
  resolvedBy?: string
  resolvedAt?: string
  snoozedUntil?: string
}> {
  const statuses: AlertStatus[] = ["active", "acknowledged", "resolved", "snoozed"]
  
  return Array.from({ length: count }, (_, i) => {
    const template = ALERT_TEMPLATES[i % ALERT_TEMPLATES.length]
    const status = statuses[i % statuses.length]
    const createdAt = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
    
    return {
      id: generateMockId(),
      type: template.type,
      severity: template.severity,
      status,
      title: template.title,
      message: template.message,
      source: ["risk-engine", "execution-service", "monitoring", "compliance-checker"][i % 4],
      createdAt: createdAt.toISOString(),
      updatedAt: new Date(createdAt.getTime() + Math.random() * 60 * 60 * 1000).toISOString(),
      ...(status === "acknowledged" && {
        acknowledgedBy: "trader@example.com",
        acknowledgedAt: new Date(createdAt.getTime() + 10 * 60 * 1000).toISOString(),
      }),
      ...(status === "resolved" && {
        resolvedBy: "trader@example.com",
        resolvedAt: new Date(createdAt.getTime() + 30 * 60 * 1000).toISOString(),
      }),
      ...(status === "snoozed" && {
        snoozedUntil: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      }),
    }
  })
}

function generateAlertStats(alerts: ReturnType<typeof generateAlerts>) {
  const bySeverity: Record<AlertSeverity, number> = { critical: 0, high: 0, medium: 0, low: 0, info: 0 }
  const byType: Record<AlertType, number> = { risk: 0, execution: 0, system: 0, compliance: 0, position: 0, market: 0 }
  
  alerts.forEach(a => {
    bySeverity[a.severity]++
    byType[a.type]++
  })
  
  return {
    total: alerts.length,
    active: alerts.filter(a => a.status === "active").length,
    acknowledged: alerts.filter(a => a.status === "acknowledged").length,
    resolved: alerts.filter(a => a.status === "resolved").length,
    bySeverity,
    byType,
  }
}

function generateAlertRules() {
  return [
    {
      id: generateMockId(),
      name: "Position Limit Alert",
      type: "risk" as AlertType,
      severity: "critical" as AlertSeverity,
      condition: "position_value > limit",
      threshold: 500000,
      enabled: true,
      channels: ["email", "slack"] as ("email" | "slack")[],
      recipients: ["risk-team@example.com"],
      cooldown: 60,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: generateMockId(),
      name: "High Slippage Alert",
      type: "execution" as AlertType,
      severity: "medium" as AlertSeverity,
      condition: "slippage > threshold",
      threshold: 0.005,
      enabled: true,
      channels: ["slack"] as ("slack")[],
      recipients: ["trading-desk@example.com"],
      cooldown: 15,
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]
}

// =============================================================================
// HANDLERS
// =============================================================================

export const alertsHandlers = [
  // GET /api/alerts (REAL)
  http.get(`${API_CONFIG.baseUrl}/api/alerts`, async ({ request }) => {
    await delay(150)
    
    const persona = getPersonaFromRequest(request)
    const url = new URL(request.url)
    const orgId = url.searchParams.get("orgId") || persona.org?.id || "default"
    
    const alertCount = persona.role === "internal" ? 30 : 15
    let alerts = generateAlerts(alertCount, orgId)
    
    // Apply filters
    const type = url.searchParams.get("type") as AlertType | null
    const severity = url.searchParams.get("severity") as AlertSeverity | null
    const status = url.searchParams.get("status") as AlertStatus | null
    const limit = url.searchParams.get("limit")
    
    if (type) alerts = alerts.filter(a => a.type === type)
    if (severity) alerts = alerts.filter(a => a.severity === severity)
    if (status) alerts = alerts.filter(a => a.status === status)
    if (limit) alerts = alerts.slice(0, parseInt(limit))
    
    return HttpResponse.json(alerts)
  }),

  // GET /api/alerts/:id (REAL)
  http.get(`${API_CONFIG.baseUrl}/api/alerts/:id`, async ({ request, params }) => {
    await delay(100)
    
    const alerts = generateAlerts(1, "default")
    const alert = { ...alerts[0], id: params.id as string }
    
    return HttpResponse.json(alert)
  }),

  // GET /api/alerts/stats (ASPIRATIONAL)
  http.get(`${API_CONFIG.baseUrl}/api/alerts/stats`, async ({ request }) => {
    await delay(100)
    
    const persona = getPersonaFromRequest(request)
    const alertCount = persona.role === "internal" ? 30 : 15
    const alerts = generateAlerts(alertCount, "default")
    const stats = generateAlertStats(alerts)
    
    return HttpResponse.json(stats)
  }),

  // GET /api/alerts/rules (ASPIRATIONAL)
  http.get(`${API_CONFIG.baseUrl}/api/alerts/rules`, async ({ request }) => {
    await delay(150)
    
    const rules = generateAlertRules()
    return HttpResponse.json(rules)
  }),

  // POST /api/alerts/:id/acknowledge (ASPIRATIONAL)
  http.post(`${API_CONFIG.baseUrl}/api/alerts/:id/acknowledge`, async ({ request, params }) => {
    await delay(100)
    
    return HttpResponse.json({
      id: params.id,
      status: "acknowledged",
      acknowledgedAt: new Date().toISOString(),
    })
  }),

  // POST /api/alerts/:id/resolve (ASPIRATIONAL)
  http.post(`${API_CONFIG.baseUrl}/api/alerts/:id/resolve`, async ({ request, params }) => {
    await delay(100)
    
    return HttpResponse.json({
      id: params.id,
      status: "resolved",
      resolvedAt: new Date().toISOString(),
    })
  }),

  // POST /api/alerts/:id/snooze (ASPIRATIONAL)
  http.post(`${API_CONFIG.baseUrl}/api/alerts/:id/snooze`, async ({ request, params }) => {
    await delay(100)
    
    const body = await request.json() as { durationMinutes?: number }
    const durationMinutes = body.durationMinutes || 60
    
    return HttpResponse.json({
      id: params.id,
      status: "snoozed",
      snoozedUntil: new Date(Date.now() + durationMinutes * 60 * 1000).toISOString(),
    })
  }),
]
