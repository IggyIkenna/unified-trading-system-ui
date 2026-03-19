/**
 * handlers/reporting.ts — Reporting / settlement service mock handlers.
 *
 * REAL endpoints (exist in openapi.json):
 *   GET /trading-analytics-api/api/reports — list reports
 *   GET /trading-analytics-api/api/settlement — settlement status
 *   GET /trading-analytics-api/api/reconciliation — recon status
 *
 * ASPIRATIONAL endpoints (mocked ahead of backend):
 *   GET /api/reporting/reports — client reports with status
 *   GET /api/reporting/settlements — settlement tracking
 *   GET /api/reporting/reconciliation — reconciliation breaks
 */

import { http, HttpResponse } from "msw"
import { getPersonaFromRequest } from "@/lib/mocks/utils"

const MOCK_REPORTS = [
  { id: "rpt-001", name: "Daily Performance Report", clientId: "acme", client: "Alpha Capital", date: "2026-03-18", status: "ready", format: "PDF", generated: "1h ago" },
  { id: "rpt-002", name: "Weekly Risk Summary", clientId: "acme", client: "Alpha Capital", date: "2026-03-17", status: "sent", format: "PDF", generated: "1d ago" },
  { id: "rpt-003", name: "Monthly P&L Attribution", clientId: "acme", client: "Alpha Capital", date: "2026-03-01", status: "ready", format: "PDF", generated: "18d ago" },
  { id: "rpt-004", name: "Daily Performance Report", clientId: "beta", client: "Beta Fund", date: "2026-03-18", status: "generating", format: "PDF", generated: "pending" },
  { id: "rpt-005", name: "Execution Quality (TCA)", clientId: "odum-internal", client: "Odum Research", date: "2026-03-18", status: "ready", format: "CSV", generated: "2h ago" },
  { id: "rpt-006", name: "Fee Schedule Summary", clientId: "acme", client: "Alpha Capital", date: "2026-03-15", status: "sent", format: "PDF", generated: "3d ago" },
  { id: "rpt-007", name: "Compliance Evidence Pack", clientId: "odum-internal", client: "Odum Research", date: "2026-03-18", status: "ready", format: "PDF", generated: "4h ago" },
]

const MOCK_SETTLEMENTS = [
  { id: "sett-001", clientId: "acme", client: "Alpha Capital", date: "2026-03-18", amount: 142500, status: "pending", type: "profit_share", dueDate: "2026-03-21" },
  { id: "sett-002", clientId: "acme", client: "Alpha Capital", date: "2026-03-15", amount: 25000, status: "confirmed", type: "fee", dueDate: "2026-03-18" },
  { id: "sett-003", clientId: "beta", client: "Beta Fund", date: "2026-03-18", amount: 8500, status: "pending", type: "fee", dueDate: "2026-03-21" },
  { id: "sett-004", clientId: "acme", client: "Alpha Capital", date: "2026-03-01", amount: 312000, status: "settled", type: "profit_share", dueDate: "2026-03-04" },
]

const MOCK_RECON_BREAKS = [
  { id: "recon-001", entity: "CEFI_BTC_ML_DIR_HUF_4H", type: "position_mismatch", venue: "Binance", expected: 1.500, actual: 1.498, diff: 0.002, status: "open", detectedAt: "2026-03-18T14:30:00Z" },
  { id: "recon-002", entity: "DEFI_ETH_RSB_SCE_8H", type: "pnl_divergence", venue: "Hyperliquid", expected: 12500, actual: 12340, diff: 160, status: "investigating", detectedAt: "2026-03-18T12:00:00Z" },
]

export const reportingHandlers = [
  http.get("*/api/reporting/reports", ({ request }) => {
    const persona = getPersonaFromRequest(request)
    if (!persona) return HttpResponse.json({ error: "Unauthorized" }, { status: 401 })

    const isInternal = persona.role === "internal" || persona.role === "admin"
    const reports = isInternal
      ? MOCK_REPORTS
      : MOCK_REPORTS.filter((r) => r.clientId === persona.org.id)

    return HttpResponse.json({ reports, total: reports.length })
  }),

  http.get("*/api/reporting/settlements", ({ request }) => {
    const persona = getPersonaFromRequest(request)
    if (!persona) return HttpResponse.json({ error: "Unauthorized" }, { status: 401 })

    const isInternal = persona.role === "internal" || persona.role === "admin"
    const settlements = isInternal
      ? MOCK_SETTLEMENTS
      : MOCK_SETTLEMENTS.filter((s) => s.clientId === persona.org.id)

    return HttpResponse.json({ settlements, total: settlements.length })
  }),

  http.get("*/api/reporting/reconciliation", ({ request }) => {
    const persona = getPersonaFromRequest(request)
    if (!persona) return HttpResponse.json({ error: "Unauthorized" }, { status: 401 })

    if (persona.role !== "internal" && persona.role !== "admin") {
      return HttpResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return HttpResponse.json({ breaks: MOCK_RECON_BREAKS, total: MOCK_RECON_BREAKS.length })
  }),
]
