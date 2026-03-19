/**
 * Demo Personas
 * 
 * Three demo personas for testing role-based scoping:
 * - internal-trader: Odum staff, full access
 * - client-full: External client with full subscription
 * - client-data-only: External client with basic data subscription
 * 
 * Source: REFACTORING_PLAN §2.3, SHARDING_DIMENSIONS §Layer 3
 */

import type { DemoPersona, Organization, Entitlement } from "@/lib/config/auth"

// Organizations
export const ORGANIZATIONS: Record<string, Organization> = {
  odum: {
    id: "odum",
    name: "Odum Research",
    mode: "admin",
    cloudPreference: "both",
    planTier: "enterprise",
  },
  acme: {
    id: "acme",
    name: "Acme Capital",
    mode: "client",
    cloudPreference: "aws",
    linkedCloudAccount: "aws:123456789012",
    planTier: "institutional",
  },
  beta: {
    id: "beta",
    name: "Beta Investments",
    mode: "client",
    cloudPreference: "gcp",
    linkedCloudAccount: "gcp:beta-prod",
    planTier: "professional",
  },
  demo: {
    id: "demo",
    name: "Demo Org",
    mode: "demo",
    cloudPreference: "gcp",
    planTier: "trial",
  },
}

// Demo Personas
export const DEMO_PERSONAS: DemoPersona[] = [
  {
    id: "internal-trader",
    email: "trader@odum.io",
    name: "Alex Trader",
    role: "internal",
    org: ORGANIZATIONS.odum,
    entitlements: ["*"] as Entitlement[],
    description: "Odum internal trader with full system access",
  },
  {
    id: "client-full",
    email: "pm@acme.com",
    name: "Morgan Portfolio",
    role: "client",
    org: ORGANIZATIONS.acme,
    entitlements: [
      "data-pro",
      "execution-full",
      "ml-full",
      "strategy-full",
      "reporting",
      "tca",
    ] as Entitlement[],
    description: "Acme Capital PM with full subscription",
  },
  {
    id: "client-data-only",
    email: "analyst@beta.com",
    name: "Jamie Analyst",
    role: "client",
    org: ORGANIZATIONS.beta,
    entitlements: ["data-basic"] as Entitlement[],
    description: "Beta Investments analyst with data-only subscription",
  },
]

// Lookup functions
export function getPersonaById(id: string): DemoPersona | undefined {
  return DEMO_PERSONAS.find((p) => p.id === id)
}

export function getPersonaByEmail(email: string): DemoPersona | undefined {
  return DEMO_PERSONAS.find((p) => p.email === email)
}

export function getDefaultPersona(): DemoPersona {
  return DEMO_PERSONAS[0] // internal-trader
}

// Get instrument count limit by persona
export function getInstrumentLimit(persona: DemoPersona): number {
  if (persona.entitlements.includes("*") || persona.entitlements.includes("data-pro")) {
    return 2400
  }
  return 180
}

// Get accessible categories by persona
export function getAccessibleCategories(persona: DemoPersona): string[] {
  if (persona.entitlements.includes("*") || persona.entitlements.includes("data-pro")) {
    return ["cefi", "tradfi", "defi", "onchain_perps", "prediction_market"]
  }
  return ["cefi"]
}

// Check if persona can access ML features
export function canAccessML(persona: DemoPersona): boolean {
  return persona.entitlements.includes("*") || persona.entitlements.includes("ml-full")
}

// Check if persona can access execution
export function canAccessExecution(persona: DemoPersona): boolean {
  return persona.entitlements.includes("*") || 
         persona.entitlements.includes("execution-basic") ||
         persona.entitlements.includes("execution-full")
}

// Check if persona can access strategies
export function canAccessStrategies(persona: DemoPersona): boolean {
  return persona.entitlements.includes("*") || persona.entitlements.includes("strategy-full")
}
