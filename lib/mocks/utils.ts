/**
 * MSW Utilities
 * 
 * Helper functions for mock handlers:
 * - getPersonaFromRequest: Extract persona from request headers
 * - scopeByEntitlement: Filter data by persona entitlements
 */

import { DEMO_PERSONAS, getDefaultPersona, type DemoPersona } from "./fixtures/personas"
import type { Entitlement } from "@/lib/config/auth"

/**
 * Extract persona from request headers
 * 
 * In the mock API, we use X-Persona-Id header to determine which demo persona
 * is making the request. In production, this would be derived from the auth token.
 */
export function getPersonaFromRequest(request: Request): DemoPersona {
  const personaId = request.headers.get("X-Persona-Id")
  
  if (personaId) {
    const persona = DEMO_PERSONAS.find((p) => p.id === personaId)
    if (persona) return persona
  }
  
  // Check for email in Authorization header (simplified demo auth)
  const authHeader = request.headers.get("Authorization")
  if (authHeader) {
    const email = authHeader.replace("Bearer ", "").replace("demo:", "")
    const persona = DEMO_PERSONAS.find((p) => p.email === email)
    if (persona) return persona
  }
  
  // Default to internal-trader for backwards compatibility during development
  return getDefaultPersona()
}

/**
 * Check if persona has required entitlement
 */
export function hasEntitlement(persona: DemoPersona, required: Entitlement): boolean {
  if (persona.entitlements.includes("*")) return true
  return persona.entitlements.includes(required)
}

/**
 * Filter array by entitlement requirement
 * 
 * @param data - Array of items
 * @param persona - Current persona
 * @param entitlementFn - Function to get required entitlement for each item
 * @returns Filtered array of items the persona can access
 */
export function filterByEntitlement<T>(
  data: T[],
  persona: DemoPersona,
  entitlementFn: (item: T) => Entitlement
): T[] {
  if (persona.entitlements.includes("*")) return data
  
  return data.filter((item) => {
    const required = entitlementFn(item)
    return persona.entitlements.includes(required)
  })
}

/**
 * Scope data by client organization
 * 
 * Internal users see all orgs, client users see only their own org's data.
 */
export function scopeByOrg<T extends { orgId?: string; clientId?: string }>(
  data: T[],
  persona: DemoPersona
): T[] {
  // Internal users see everything
  if (persona.role === "internal") return data
  
  // Client users see only their org's data
  return data.filter((item) => {
    const itemOrgId = item.orgId || item.clientId
    return itemOrgId === persona.org.id
  })
}

/**
 * Scope instruments by subscription tier
 * 
 * Basic tier: 180 instruments, CEFI only
 * Pro tier: 2400 instruments, all categories
 */
export function scopeInstruments<T extends { category?: string }>(
  instruments: T[],
  persona: DemoPersona,
  limit: number = 180
): T[] {
  if (persona.entitlements.includes("*") || persona.entitlements.includes("data-pro")) {
    return instruments // Full access
  }
  
  // Basic tier: CEFI only, limited count
  const cefiOnly = instruments.filter((i) => i.category === "cefi")
  return cefiOnly.slice(0, limit)
}

/**
 * Add pagination to response
 */
export function paginate<T>(
  data: T[],
  page: number = 1,
  pageSize: number = 50
): { items: T[]; total: number; page: number; pageSize: number; totalPages: number } {
  const total = data.length
  const totalPages = Math.ceil(total / pageSize)
  const start = (page - 1) * pageSize
  const items = data.slice(start, start + pageSize)
  
  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
  }
}

/**
 * Create a delayed response for realistic latency simulation
 */
export function delay(ms: number = 100): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Create an error response
 */
export function errorResponse(status: number, message: string, code?: string) {
  return new Response(
    JSON.stringify({
      error: {
        status,
        message,
        code: code || `ERR_${status}`,
      },
    }),
    {
      status,
      headers: {
        "Content-Type": "application/json",
      },
    }
  )
}

/**
 * Create a success response
 */
export function jsonResponse<T>(data: T, status: number = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  })
}
