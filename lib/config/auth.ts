/**
 * Auth Configuration
 * 
 * Demo personas, roles, and entitlement definitions.
 * Source: context/SHARDING_DIMENSIONS.md §Layer 3
 */

// All possible entitlements in the system
export const ENTITLEMENTS = {
  // Data tier
  "data-basic": "Access 180 instruments, CEFI only",
  "data-pro": "Access 2400 instruments, all categories",
  
  // Feature tier
  "features-all": "Access to all computed features",
  
  // ML tier
  "ml-full": "All models, targets, training access",
  
  // Execution tier
  "execution-basic": "Basic algos (TWAP, VWAP)",
  "execution-full": "All algos + SOR + dark pool access",
  
  // Strategy tier
  "strategy-full": "Full strategy suite access",
  
  // Analytics
  "reporting": "P&L, settlement, attribution reports",
  "tca": "Transaction cost analysis",
  
  // Admin
  "admin": "Admin dashboard access",
  "ops": "Operations dashboard access",
  
  // Wildcard
  "*": "Full access to everything",
} as const

export type Entitlement = keyof typeof ENTITLEMENTS

// User roles
export const ROLES = {
  internal: {
    label: "Internal",
    description: "Odum staff with full system access",
    defaultEntitlements: ["*"] as Entitlement[],
  },
  client: {
    label: "Client",
    description: "External organization user",
    defaultEntitlements: [] as Entitlement[], // Set per subscription
  },
  prospect: {
    label: "Prospect",
    description: "Demo/trial user",
    defaultEntitlements: ["data-basic"] as Entitlement[],
  },
} as const

export type Role = keyof typeof ROLES

// Organization interface
export interface Organization {
  id: string
  name: string
  mode: "admin" | "client" | "demo"
  cloudPreference?: "gcp" | "aws" | "both"
  linkedCloudAccount?: string
  planTier: "enterprise" | "institutional" | "professional" | "trial"
}

// Auth user with full context
export interface AuthUser {
  email: string
  name?: string
  role: Role
  org: Organization
  entitlements: Entitlement[]
}

// Persona for demo mode
export interface DemoPersona {
  id: string
  email: string
  name: string
  role: Role
  org: Organization
  entitlements: Entitlement[]
  description: string
}

// Subscription tiers and what they include
export const SUBSCRIPTION_TIERS = {
  "data-basic": {
    label: "Data Basic",
    includes: ["data-basic"],
    instrumentLimit: 180,
    categories: ["cefi"],
  },
  "data-pro": {
    label: "Data Pro",
    includes: ["data-pro", "features-all"],
    instrumentLimit: 2400,
    categories: ["cefi", "tradfi", "defi", "onchain_perps", "prediction_market"],
  },
  "execution-basic": {
    label: "Execution Basic",
    includes: ["execution-basic"],
    algos: ["TWAP", "VWAP"],
  },
  "execution-full": {
    label: "Execution Full",
    includes: ["execution-full", "tca"],
    algos: ["TWAP", "VWAP", "ICEBERG", "SOR", "DARK"],
  },
  "ml-full": {
    label: "ML Suite",
    includes: ["ml-full", "features-all"],
    models: ["lstm", "xgboost", "lightgbm", "ensemble"],
    targets: ["return", "volatility", "direction", "regime"],
  },
  "strategy-full": {
    label: "Strategy Suite",
    includes: ["strategy-full", "ml-full", "execution-full", "features-all"],
    features: ["backtests", "live-deployment", "backtest-live-diff"],
  },
  reporting: {
    label: "Reporting",
    includes: ["reporting"],
    reports: ["pnl", "settlement", "attribution"],
  },
} as const

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS

/**
 * Check if user has required entitlement
 */
export function hasEntitlement(user: AuthUser, required: Entitlement): boolean {
  if (user.entitlements.includes("*")) return true
  return user.entitlements.includes(required)
}

/**
 * Check if user has any of the required entitlements
 */
export function hasAnyEntitlement(user: AuthUser, required: Entitlement[]): boolean {
  if (user.entitlements.includes("*")) return true
  return required.some((e) => user.entitlements.includes(e))
}

/**
 * Check if user has all of the required entitlements
 */
export function hasAllEntitlements(user: AuthUser, required: Entitlement[]): boolean {
  if (user.entitlements.includes("*")) return true
  return required.every((e) => user.entitlements.includes(e))
}

/**
 * Check if user is internal
 */
export function isInternal(user: AuthUser): boolean {
  return user.role === "internal"
}

/**
 * Check if user can access ops pages
 */
export function canAccessOps(user: AuthUser): boolean {
  return isInternal(user) || hasEntitlement(user, "ops")
}

/**
 * Check if user can access admin pages
 */
export function canAccessAdmin(user: AuthUser): boolean {
  return isInternal(user) || hasEntitlement(user, "admin")
}
