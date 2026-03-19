/**
 * Auth configuration — roles, entitlements, subscription tiers.
 *
 * Source: context/SHARDING_DIMENSIONS.md §Layer 3
 */

/** User roles in the system */
export type UserRole = "internal" | "client" | "admin"

/** Subscription entitlement keys (from SHARDING_DIMENSIONS §Subscription Tiers) */
export const ENTITLEMENTS = [
  "data-basic",
  "data-pro",
  "execution-basic",
  "execution-full",
  "ml-full",
  "strategy-full",
  "reporting",
] as const

export type Entitlement = (typeof ENTITLEMENTS)[number]

/** Wildcard entitlement for internal/admin users */
export const ALL_ENTITLEMENTS = "*" as const

export interface Org {
  id: string
  name: string
}

export interface AuthPersona {
  id: string
  email: string
  password: string
  displayName: string
  role: UserRole
  org: Org
  entitlements: readonly Entitlement[] | readonly [typeof ALL_ENTITLEMENTS]
  description: string
}

/** Subscription tier metadata for marketing / pricing pages */
export const SUBSCRIPTION_TIERS = [
  {
    key: "data-basic" as const,
    name: "Data Basic",
    instruments: 180,
    categories: ["CEFI"],
    features: false,
    ml: false,
    strategy: false,
    execution: false,
    analytics: false,
  },
  {
    key: "data-pro" as const,
    name: "Data Pro",
    instruments: 2400,
    categories: ["CEFI", "TRADFI", "DEFI"],
    features: true,
    ml: false,
    strategy: false,
    execution: false,
    analytics: false,
  },
  {
    key: "execution-basic" as const,
    name: "Execution Basic",
    instruments: null,
    categories: null,
    features: true,
    ml: false,
    strategy: false,
    execution: "Basic algos (TWAP, VWAP)",
    analytics: false,
  },
  {
    key: "execution-full" as const,
    name: "Execution Full",
    instruments: null,
    categories: null,
    features: true,
    ml: false,
    strategy: false,
    execution: "All algos + SOR + dark pool",
    analytics: "TCA, fill analysis",
  },
  {
    key: "ml-full" as const,
    name: "ML Full",
    instruments: null,
    categories: null,
    features: true,
    ml: true,
    strategy: false,
    execution: false,
    analytics: "Model performance",
  },
  {
    key: "strategy-full" as const,
    name: "Strategy Full",
    instruments: null,
    categories: null,
    features: true,
    ml: true,
    strategy: true,
    execution: true,
    analytics: "Backtest↔live diff",
  },
  {
    key: "reporting" as const,
    name: "Reporting",
    instruments: null,
    categories: null,
    features: false,
    ml: false,
    strategy: false,
    execution: false,
    analytics: "P&L, settlement, attribution",
  },
] as const
