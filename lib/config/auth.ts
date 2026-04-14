/**
 * Auth configuration — roles, entitlements, subscription tiers.
 *
 * Source: context/SHARDING_DIMENSIONS.md §Layer 3
 */

/** User roles in the system */
export type UserRole = "internal" | "client" | "admin";

/** Subscription entitlement keys (from SHARDING_DIMENSIONS §Subscription Tiers) */
export const ENTITLEMENTS = [
  "data-basic",
  "data-pro",
  "execution-basic",
  "execution-full",
  "ml-full",
  "strategy-full",
  "strategy-families",
  "markets-data",
  "defi-trading",
  "defi-bundles",
  "defi-staking",
  "sports-trading",
  "predictions-trading",
  "options-trading",
  "reporting",
  "investor-relations",
  "investor-board",
  "investor-plan",
  "investor-platform",
  "investor-im",
  "investor-regulatory",
] as const;

export type Entitlement = (typeof ENTITLEMENTS)[number];

/** Wildcard entitlement for internal/admin users */
export const ALL_ENTITLEMENTS = "*" as const;

/** Entitlement or wildcard — used in persona definitions and auth checks */
export type EntitlementOrWildcard = Entitlement | typeof ALL_ENTITLEMENTS;

export interface Org {
  id: string;
  name: string;
}

export interface AuthPersona {
  id: string;
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
  org: Org;
  entitlements: readonly EntitlementOrWildcard[];
  description: string;
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
] as const;

// ---------------------------------------------------------------------------
// Client Persona Tier (derived from entitlements)
// ---------------------------------------------------------------------------

/**
 * CLIENT_TIERS map the set of entitlements a client user has onto a named tier
 * used for display ("Client Full", "Client Premium", "Data Only", etc.).
 *
 * Rule:
 *  - Client Full     = data-pro + execution-full + ml-full + strategy-full + reporting (all 5)
 *  - Client Premium  = data-pro + execution-full + strategy-full (no ml, no reporting)
 *  - DeFi Client     = defi-trading (main entitlement)
 *  - Data Pro        = data-pro only
 *  - Data Basic      = data-basic only
 *  - Custom          = anything else
 */
export type ClientTier = "Client Full" | "Client Premium" | "DeFi Client" | "Data Pro" | "Data Basic" | "Custom";

export function deriveClientTier(entitlements: readonly EntitlementOrWildcard[]): ClientTier {
  const set = new Set(entitlements);
  if (set.has("*")) return "Client Full"; // internal/admin — treat as full
  if (set.has("defi-trading")) return "DeFi Client";
  const hasMl = set.has("ml-full");
  const hasReporting = set.has("reporting");
  const hasExecutionFull = set.has("execution-full");
  const hasStrategyFull = set.has("strategy-full");
  const hasDataPro = set.has("data-pro");
  if (hasDataPro && hasExecutionFull && hasMl && hasStrategyFull && hasReporting) return "Client Full";
  if (hasDataPro && hasExecutionFull && hasStrategyFull && !hasMl) return "Client Premium";
  if (hasDataPro) return "Data Pro";
  if (set.has("data-basic")) return "Data Basic";
  return "Custom";
}

/**
 * What each tier unlocks (for display in tier badge tooltips / settings pages).
 */
export const CLIENT_TIER_FEATURES: Record<ClientTier, string[]> = {
  "Client Full": [
    "Data (all classes)",
    "Execution (full SOR + algos)",
    "ML Research",
    "Strategy Families",
    "Reporting & Attribution",
  ],
  "Client Premium": ["Data (all classes)", "Execution (full SOR + algos)", "Strategy Families"],
  "DeFi Client": ["DeFi Trading (lending, basis, staking)", "Data Pro", "Execution Full", "Reports"],
  "Data Pro": ["Data (2400+ instruments, all classes)", "Features & signals (read-only)"],
  "Data Basic": ["Data (180 instruments, CEFI only)"],
  Custom: ["Custom entitlement bundle — contact support"],
};
