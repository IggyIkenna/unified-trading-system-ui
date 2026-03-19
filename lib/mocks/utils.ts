/**
 * MSW mock utilities — persona extraction and entitlement scoping.
 */

import type { DefaultBodyType, StrictRequest } from "msw"
import type { Entitlement } from "@/lib/config/auth"
import { getPersonaById } from "@/lib/mocks/fixtures/personas"

const PERSONA_HEADER = "x-demo-persona"
const DEFAULT_PERSONA_ID = "internal-trader"

/**
 * Extract persona from request.
 * In demo mode, persona is passed via x-demo-persona header or defaults.
 */
export function getPersonaFromRequest(req: StrictRequest<DefaultBodyType>) {
  const personaId = req.headers.get(PERSONA_HEADER) ?? DEFAULT_PERSONA_ID
  return getPersonaById(personaId) ?? getPersonaById(DEFAULT_PERSONA_ID)!
}

/**
 * Check if persona has a specific entitlement.
 */
export function personaHasEntitlement(
  entitlements: readonly string[],
  required: Entitlement
): boolean {
  if (entitlements.includes("*")) return true
  return entitlements.includes(required)
}

/**
 * Filter a data array based on persona's subscription tier.
 * Items with `category` field are filtered by allowed categories.
 */
export function scopeByEntitlement<T extends Record<string, unknown>>(
  data: T[],
  entitlements: readonly string[],
  options?: {
    /** Field name containing category (default: "category") */
    categoryField?: string
    /** Max items for basic tier */
    basicLimit?: number
  }
): T[] {
  const { categoryField = "category", basicLimit } = options ?? {}

  // Wildcard = everything
  if (entitlements.includes("*")) return data

  // data-pro = all categories
  const hasDataPro = entitlements.includes("data-pro")

  let filtered = data
  if (!hasDataPro) {
    // data-basic = CEFI only
    filtered = data.filter((item) => {
      const cat = item[categoryField]
      if (typeof cat !== "string") return true
      return cat.toUpperCase() === "CEFI"
    })
  }

  // Apply basic limit if specified
  if (basicLimit && !hasDataPro) {
    filtered = filtered.slice(0, basicLimit)
  }

  return filtered
}
