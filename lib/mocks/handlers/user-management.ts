/**
 * handlers/user-management.ts — User & org management mock handlers.
 *
 * REAL endpoints (exist in openapi.json):
 *   POST /deployment-api/api/user-management/* — user management
 *
 * ASPIRATIONAL endpoints (mocked ahead of backend):
 *   GET /api/users/organizations — list orgs
 *   GET /api/users/organizations/:orgId/members — list org members
 *   GET /api/users/subscriptions — org subscription details
 */

import { http, HttpResponse } from "msw"
import { getPersonaFromRequest } from "@/lib/mocks/utils"

const MOCK_ORGANIZATIONS = [
  { id: "odum-internal", name: "Odum Research", type: "internal", status: "active", memberCount: 12, subscriptionTier: "full-platform", createdAt: "2024-01-01" },
  { id: "acme", name: "Alpha Capital", type: "client", status: "active", memberCount: 5, subscriptionTier: "execution-full", createdAt: "2025-06-15" },
  { id: "beta", name: "Beta Fund", type: "client", status: "active", memberCount: 2, subscriptionTier: "data-basic", createdAt: "2026-01-10" },
  { id: "vertex", name: "Vertex Partners", type: "client", status: "onboarding", memberCount: 1, subscriptionTier: "data-pro", createdAt: "2026-03-01" },
]

const MOCK_MEMBERS: Record<string, Array<{ id: string; email: string; name: string; role: string; lastLogin: string }>> = {
  "odum-internal": [
    { id: "u-001", email: "admin@odum.io", name: "Iggy Ikenna", role: "admin", lastLogin: "2026-03-18T14:00:00Z" },
    { id: "u-002", email: "trader@odum.io", name: "Alex Trader", role: "internal", lastLogin: "2026-03-18T13:30:00Z" },
    { id: "u-003", email: "quant@odum.io", name: "Sam Quant", role: "internal", lastLogin: "2026-03-18T12:00:00Z" },
    { id: "u-004", email: "devops@odum.io", name: "Jordan DevOps", role: "internal", lastLogin: "2026-03-18T06:00:00Z" },
  ],
  "acme": [
    { id: "u-010", email: "pm@alphacap.com", name: "Chris PM", role: "client", lastLogin: "2026-03-18T10:00:00Z" },
    { id: "u-011", email: "trader@alphacap.com", name: "Pat Trader", role: "client", lastLogin: "2026-03-18T09:00:00Z" },
    { id: "u-012", email: "compliance@alphacap.com", name: "Morgan Compliance", role: "client", lastLogin: "2026-03-15T14:00:00Z" },
  ],
  "beta": [
    { id: "u-020", email: "analyst@betafund.com", name: "Riley Analyst", role: "client", lastLogin: "2026-03-17T11:00:00Z" },
  ],
  "vertex": [
    { id: "u-030", email: "cio@vertex.com", name: "Taylor CIO", role: "client", lastLogin: "2026-03-18T08:00:00Z" },
  ],
}

const MOCK_SUBSCRIPTIONS = [
  { orgId: "acme", tier: "execution-full", entitlements: ["data-pro", "execution-full", "ml-full", "strategy-full", "reporting"], startDate: "2025-06-15", renewalDate: "2026-06-15", monthlyFee: 25000 },
  { orgId: "beta", tier: "data-basic", entitlements: ["data-basic"], startDate: "2026-01-10", renewalDate: "2027-01-10", monthlyFee: 2500 },
  { orgId: "vertex", tier: "data-pro", entitlements: ["data-pro"], startDate: "2026-03-01", renewalDate: "2027-03-01", monthlyFee: 8000 },
]

export const userManagementHandlers = [
  http.get("*/api/users/organizations", ({ request }) => {
    const persona = getPersonaFromRequest(request)
    if (!persona) return HttpResponse.json({ error: "Unauthorized" }, { status: 401 })

    const isInternal = persona.role === "internal" || persona.role === "admin"
    const orgs = isInternal
      ? MOCK_ORGANIZATIONS
      : MOCK_ORGANIZATIONS.filter((o) => o.id === persona.org.id)

    return HttpResponse.json({ organizations: orgs, total: orgs.length })
  }),

  http.get("*/api/users/organizations/:orgId/members", ({ request, params }) => {
    const persona = getPersonaFromRequest(request)
    if (!persona) return HttpResponse.json({ error: "Unauthorized" }, { status: 401 })

    const orgId = params.orgId as string
    const isInternal = persona.role === "internal" || persona.role === "admin"

    if (!isInternal && orgId !== persona.org.id) {
      return HttpResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const members = MOCK_MEMBERS[orgId] || []
    return HttpResponse.json({ members, total: members.length })
  }),

  http.get("*/api/users/subscriptions", ({ request }) => {
    const persona = getPersonaFromRequest(request)
    if (!persona) return HttpResponse.json({ error: "Unauthorized" }, { status: 401 })

    const isInternal = persona.role === "internal" || persona.role === "admin"
    const subs = isInternal
      ? MOCK_SUBSCRIPTIONS
      : MOCK_SUBSCRIPTIONS.filter((s) => s.orgId === persona.org.id)

    return HttpResponse.json({ subscriptions: subs, total: subs.length })
  }),
]
