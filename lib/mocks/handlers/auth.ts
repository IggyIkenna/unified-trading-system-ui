/**
 * handlers/auth.ts — Auth service mock handlers.
 *
 * REAL endpoints (exist in openapi.json): none (auth is external)
 *
 * ASPIRATIONAL endpoints (mocked for demo):
 *   POST /api/auth/login — demo persona login
 *   GET /api/auth/profile — current persona profile
 *   GET /api/auth/personas — list available demo personas
 */

import { http, HttpResponse } from "msw"
import { PERSONAS, getPersonaById, getPersonaByEmail } from "@/lib/mocks/fixtures/personas"
import { getPersonaFromRequest } from "@/lib/mocks/utils"

export const authHandlers = [
  http.post("*/api/auth/login", async ({ request }) => {
    const body = (await request.json()) as { email?: string; personaId?: string }

    let persona = null
    if (body.personaId) persona = getPersonaById(body.personaId)
    else if (body.email) persona = getPersonaByEmail(body.email)

    if (!persona) {
      return HttpResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    return HttpResponse.json({
      user: {
        id: persona.id,
        email: persona.email,
        displayName: persona.displayName,
        role: persona.role,
        org: persona.org,
        entitlements: persona.entitlements,
      },
      token: `demo-token-${persona.id}`,
    })
  }),

  http.get("*/api/auth/profile", ({ request }) => {
    const persona = getPersonaFromRequest(request)
    if (!persona) return HttpResponse.json({ error: "Unauthorized" }, { status: 401 })

    return HttpResponse.json({
      id: persona.id,
      email: persona.email,
      displayName: persona.displayName,
      role: persona.role,
      org: persona.org,
      entitlements: persona.entitlements,
    })
  }),

  http.get("*/api/auth/personas", () => {
    return HttpResponse.json({
      personas: PERSONAS.map((p) => ({
        id: p.id,
        displayName: p.displayName,
        role: p.role,
        org: p.org,
        description: p.description,
      })),
    })
  }),
]
