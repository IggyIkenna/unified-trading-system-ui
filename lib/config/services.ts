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
  // --- Data ---
  {
    key: "data-catalogue",
    label: "Data Catalogue",
    description: "Instrument registry, download status, and data coverage across all venues.",
    href: "/portal/data",
    requiredEntitlements: ["data-basic"],
    category: "data",
    icon: "Database",
    internalOnly: false,
  },
  {
    key: "markets",
    label: "Markets",
    description: "OHLCV candles, order book snapshots, and real-time market data.",
    href: "/markets",
    requiredEntitlements: ["data-basic"],
    category: "data",
    icon: "LineChart",
    internalOnly: false,
  },

  // --- Trading ---
  {
    key: "trading",
    label: "Trading",
    description: "Live P&L, position monitoring, and performance attribution.",
    href: "/trading",
    requiredEntitlements: ["execution-basic"],
    category: "trading",
    icon: "TrendingUp",
    internalOnly: false,
  },
  {
    key: "positions",
    label: "Positions",
    description: "Real-time positions, balances, and margin across venues.",
    href: "/positions",
    requiredEntitlements: ["execution-basic"],
    category: "trading",
    icon: "Wallet",
    internalOnly: false,
  },
  {
    key: "execution",
    label: "Execution",
    description: "Order management, fills, and execution analytics.",
    href: "/execution",
    requiredEntitlements: ["execution-basic"],
    category: "trading",
    icon: "Zap",
    internalOnly: false,
  },
  {
    key: "risk",
    label: "Risk",
    description: "Exposure, VaR, Greeks, and risk limit monitoring.",
    href: "/risk",
    requiredEntitlements: ["execution-basic"],
    category: "trading",
    icon: "Shield",
    internalOnly: false,
  },
  {
    key: "alerts",
    label: "Alerts",
    description: "Alert management, severity filtering, and notifications.",
    href: "/alerts",
    requiredEntitlements: ["execution-basic"],
    category: "trading",
    icon: "Bell",
    internalOnly: false,
  },

  // --- Analytics ---
  {
    key: "strategy-platform",
    label: "Strategy Platform",
    description: "Strategy research, backtesting, and live deployment.",
    href: "/strategy-platform",
    requiredEntitlements: ["strategy-full"],
    category: "analytics",
    icon: "FlaskConical",
    internalOnly: false,
  },
  {
    key: "reports",
    label: "Reports",
    description: "P&L attribution, settlement, reconciliation, and invoicing.",
    href: "/reports",
    requiredEntitlements: ["reporting"],
    category: "analytics",
    icon: "FileText",
    internalOnly: false,
  },

  // --- ML ---
  {
    key: "ml",
    label: "ML Models",
    description: "Model training, inference, experiments, and feature engineering.",
    href: "/ml",
    requiredEntitlements: ["ml-full"],
    category: "ml",
    icon: "Brain",
    internalOnly: false,
  },

  // --- Ops (internal only) ---
  {
    key: "admin",
    label: "Admin",
    description: "System administration, user management, and org settings.",
    href: "/admin",
    requiredEntitlements: ["*"],
    category: "ops",
    icon: "Settings",
    internalOnly: true,
  },
  {
    key: "ops",
    label: "Operations",
    description: "Service health, system monitoring, and operational dashboards.",
    href: "/ops",
    requiredEntitlements: ["*"],
    category: "ops",
    icon: "Activity",
    internalOnly: true,
  },
  {
    key: "deployment",
    label: "Deployments",
    description: "Cloud deployments, build status, and shard management.",
    href: "/devops",
    requiredEntitlements: ["*"],
    category: "ops",
    icon: "Cloud",
    internalOnly: true,
  },
  {
    key: "compliance",
    label: "Compliance",
    description: "Audit logs, compliance checks, and regulatory reporting.",
    href: "/compliance",
    requiredEntitlements: ["*"],
    category: "ops",
    icon: "ClipboardCheck",
    internalOnly: true,
  },
  {
    key: "manage",
    label: "Manage",
    description: "User, org, and subscription management.",
    href: "/manage",
    requiredEntitlements: ["*"],
    category: "ops",
    icon: "Users",
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
