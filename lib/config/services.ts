/**
 * Service registry — defines platform services, their entitlements,
 * and nav categorisation.
 *
 * Source: lib/registry/system-topology.json + SHARDING_DIMENSIONS §Layer 3
 */

import type { Entitlement } from "./auth"

export interface ServiceDefinition {
  /** Machine key (matches SERVICE_ENDPOINTS keys where applicable) */
  key: string
  /** Human-readable label */
  label: string
  /** Short description for cards / tooltips */
  description: string
  /** Route path within the platform (relative to /platform prefix) */
  href: string
  /** Entitlements required to access (empty = shared/public, ["*"] = internal only) */
  requiredEntitlements: readonly Entitlement[] | readonly ["*"]
  /** Nav category for grouping */
  category: "data" | "trading" | "analytics" | "ml" | "ops"
  /** Icon name (lucide-react) */
  icon: string
  /** Whether this service is internal-only (ops) */
  internalOnly: boolean
}

export const SERVICE_REGISTRY: readonly ServiceDefinition[] = [
  // --- 6 External Services (matching engagement model tiers) ---
  {
    key: "data",
    label: "Data",
    description: "Instrument catalogue, market data, venue coverage, and data freshness monitoring across all asset classes.",
    href: "/services/data/overview",
    requiredEntitlements: ["data-basic"],
    category: "data",
    icon: "Database",
    internalOnly: false,
  },
  {
    key: "research",
    label: "Research & Backtesting",
    description: "ML model training, signal configuration, strategy backtesting, feature engineering, and promotion pipeline.",
    href: "/services/research/overview",
    requiredEntitlements: ["strategy-full"],
    category: "analytics",
    icon: "FlaskConical",
    internalOnly: false,
  },
  {
    key: "execution",
    label: "Execution",
    description: "Order routing, fills, execution algorithms, venue analytics, and TCA.",
    href: "/services/execution/overview",
    requiredEntitlements: ["execution-basic"],
    category: "trading",
    icon: "Zap",
    internalOnly: false,
  },
  {
    key: "trading",
    label: "Trading",
    description: "Live P&L, positions, risk monitoring, alerts, and T+1 backtest-vs-live alignment.",
    href: "/services/trading/overview",
    requiredEntitlements: ["execution-basic"],
    category: "trading",
    icon: "TrendingUp",
    internalOnly: false,
  },
  {
    key: "reports",
    label: "Reports & Compliance",
    description: "P&L attribution, settlement, reconciliation, regulatory reporting, and audit trails.",
    href: "/services/reports/overview",
    requiredEntitlements: ["reporting"],
    category: "analytics",
    icon: "FileText",
    internalOnly: false,
  },
  {
    key: "manage",
    label: "Account Management",
    description: "Client onboarding, mandates, fee schedules, and subscription management.",
    href: "/services/manage/clients",
    requiredEntitlements: ["reporting"],
    category: "analytics",
    icon: "Users",
    internalOnly: false,
  },

  // --- 2 Internal Services (admin only) ---
  {
    key: "admin",
    label: "Admin",
    description: "System administration, user management, org settings, and compliance controls.",
    href: "/admin",
    requiredEntitlements: ["*"],
    category: "ops",
    icon: "Settings",
    internalOnly: true,
  },
  {
    key: "devops",
    label: "DevOps",
    description: "Service health, deployments, build status, and operational monitoring.",
    href: "/devops",
    requiredEntitlements: ["*"],
    category: "ops",
    icon: "Cloud",
    internalOnly: true,
  },
] as const

/** Get services visible to a given set of entitlements */
export function getVisibleServices(
  entitlements: readonly string[],
  role: string
): ServiceDefinition[] {
  const isWildcard = entitlements.includes("*")
  const isAdminOrInternal = role === "admin" || role === "internal"

  return SERVICE_REGISTRY.filter((svc) => {
    // Internal-only services require admin/internal role
    if (svc.internalOnly && !isAdminOrInternal) return false
    // Wildcard = see everything
    if (isWildcard) return true
    // Check entitlement overlap
    if (svc.requiredEntitlements[0] === "*") return false
    return (svc.requiredEntitlements as readonly string[]).some((e) =>
      entitlements.includes(e)
    )
  })
}
