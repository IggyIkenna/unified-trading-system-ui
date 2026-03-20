/**
 * Auth API Mock Handlers
 * 
 * Handles authentication endpoints:
 * - POST /api/auth/login
 * - POST /api/auth/logout
 * - GET /api/auth/me
 * - POST /api/auth/switch-persona
 */

import { http, HttpResponse, delay } from "msw"
import { 
  DEMO_PERSONAS, 
  getPersonaById, 
  getPersonaByEmail,
  getDefaultPersona 
} from "../fixtures/personas"
import { getCurrentPersonaId, setCurrentPersona, clearCurrentPersona } from "../utils"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ""

export const authHandlers = [
  // Login endpoint
  http.post(`${API_BASE}/api/auth/login`, async ({ request }) => {
    await delay(300) // Simulate network latency
    
    const body = await request.json() as { email?: string; password?: string }
    const { email } = body
    
    if (!email) {
      return HttpResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }
    
    // Look up persona by email
    const persona = getPersonaByEmail(email) || getDefaultPersona()
    
    // Set the current persona
    setCurrentPersona(persona.id)
    
    return HttpResponse.json({
      success: true,
      user: {
        id: persona.id,
        email: persona.email,
        name: persona.name,
        role: persona.role,
        org: persona.org,
        entitlements: persona.entitlements,
      },
    })
  }),
  
  // Logout endpoint
  http.post(`${API_BASE}/api/auth/logout`, async () => {
    await delay(100)
    clearCurrentPersona()
    
    return HttpResponse.json({ success: true })
  }),
  
  // Get current user
  http.get(`${API_BASE}/api/auth/me`, async () => {
    await delay(150)
    
    const personaId = getCurrentPersonaId()
    if (!personaId) {
      return HttpResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }
    
    const persona = getPersonaById(personaId)
    if (!persona) {
      clearCurrentPersona()
      return HttpResponse.json(
        { error: "Session invalid" },
        { status: 401 }
      )
    }
    
    return HttpResponse.json({
      user: {
        id: persona.id,
        email: persona.email,
        name: persona.name,
        role: persona.role,
        org: persona.org,
        entitlements: persona.entitlements,
      },
    })
  }),
  
  // Switch persona (demo mode only)
  http.post(`${API_BASE}/api/auth/switch-persona`, async ({ request }) => {
    await delay(200)
    
    const body = await request.json() as { personaId?: string }
    const { personaId } = body
    
    if (!personaId) {
      return HttpResponse.json(
        { error: "personaId is required" },
        { status: 400 }
      )
    }
    
    const persona = getPersonaById(personaId)
    if (!persona) {
      return HttpResponse.json(
        { error: "Invalid persona ID" },
        { status: 400 }
      )
    }
    
    setCurrentPersona(persona.id)
    
    return HttpResponse.json({
      success: true,
      user: {
        id: persona.id,
        email: persona.email,
        name: persona.name,
        role: persona.role,
        org: persona.org,
        entitlements: persona.entitlements,
      },
    })
  }),
  
  // Get available personas (demo mode)
  http.get(`${API_BASE}/api/auth/personas`, async () => {
    await delay(100)
    
    return HttpResponse.json({
      personas: DEMO_PERSONAS.map((p) => ({
        id: p.id,
        name: p.name,
        email: p.email,
        role: p.role,
        org: p.org.name,
        description: p.description,
      })),
    })
  }),
]
