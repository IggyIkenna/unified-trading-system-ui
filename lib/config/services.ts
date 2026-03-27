/**
 * Service registry — defines the 8 platform services, their lifecycle stages,
 * entitlements, and routing.
 *
 * SSOT: CITADEL_VISION_2026_03_22.md § Service Architecture
 * Lifecycle: Acquire → Build → Promote → Run → Observe → Report
 *
 * Each service maps to exactly one lifecycle stage and has a single entry route.
 * Navigation goes directly to the first tab of each service (no card landing pages).
 */

import type { Entitlement } from "./auth";

export type LifecycleStage =
  | "acquire"
  | "build"
  | "promote"
  | "run"
  | "execute"
  | "observe"
  | "manage"
  | "report";

export interface ServiceDefinition {
  /** Machine key */
  key: string;
  /** Human-readable label */
  label: string;
  /** Short description for cards / tooltips */
  description: string;
  /** Route path — entry point (first tab of service) */
  href: string;
  /** Lifecycle stage this service belongs to */
  lifecycleStage: LifecycleStage;
  /** Entitlements required to access (empty = shared/public, ["*"] = internal only) */
  requiredEntitlements: readonly Entitlement[] | readonly ["*"];
  /** Icon name (lucide-react) */
  icon: string;
  /** Whether this service is internal-only (admin/ops) */
  internalOnly: boolean;
}

export const SERVICE_REGISTRY: readonly ServiceDefinition[] = [
  // --- 7 External Services (matching engagement model tiers) ---
  {
    key: "data",
    label: "Data",
    description:
      "Instrument catalogue, market data, venue coverage, and data freshness monitoring across all asset classes.",
    href: "/services/data/overview",
    lifecycleStage: "acquire",
    requiredEntitlements: ["data-basic"],
    icon: "Database",
    internalOnly: false,
  },
  {
    key: "research",
    label: "Research & Backtesting",
    description:
      "ML model training, signal configuration, strategy backtesting, feature engineering, and research pipeline.",
    href: "/services/research/overview",
    lifecycleStage: "build",
    requiredEntitlements: ["strategy-full"],
    icon: "FlaskConical",
    internalOnly: false,
  },
  {
    key: "promote",
    label: "Promote",
    description:
      "Multi-day strategy review, candidate basket, risk analysis, and approval queue for production deployment.",
    href: "/services/research/strategy/candidates",
    lifecycleStage: "promote",
    requiredEntitlements: ["strategy-full"],
    icon: "ArrowUpCircle",
    internalOnly: false,
  },
  {
    key: "trading",
    label: "Trading",
    description:
      "Live trading terminal, positions, orders, account balances, market overview, and strategy monitoring.",
    href: "/services/trading/overview",
    lifecycleStage: "run",
    requiredEntitlements: ["execution-basic"],
    icon: "TrendingUp",
    internalOnly: false,
  },
  {
    key: "observe",
    label: "Observe",
    description:
      "Risk dashboard, alerts, news feed, strategy health monitoring, and system health.",
    href: "/services/trading/risk",
    lifecycleStage: "observe",
    requiredEntitlements: ["execution-basic"],
    icon: "Eye",
    internalOnly: false,
  },
  {
    key: "reports",
    label: "Reports",
    description:
      "P&L attribution, executive summary, settlement, reconciliation, and regulatory reporting.",
    href: "/services/reports/overview",
    lifecycleStage: "report",
    requiredEntitlements: ["reporting"],
    icon: "FileText",
    internalOnly: false,
  },

  // --- Investor Relations (board / shareholder / investor access) ---
  {
    key: "investor-relations",
    label: "Investor Relations",
    description:
      "Board presentations, disaster recovery playbook, security posture, and operational resilience documentation.",
    href: "/investor-relations",
    lifecycleStage: "report",
    requiredEntitlements: ["investor-relations"],
    icon: "Presentation",
    internalOnly: false,
  },

  // --- 1 Internal Service (admin only) ---
  {
    key: "admin",
    label: "Admin & Ops",
    description:
      "Client onboarding, mandates, fee schedules, user management, deployments, service registry, and operational monitoring.",
    href: "/admin",
    lifecycleStage: "manage",
    requiredEntitlements: ["*"],
    icon: "Settings",
    internalOnly: true,
  },
] as const;

/** Get services visible to a given set of entitlements */
export function getVisibleServices(
  entitlements: readonly string[],
  role: string,
): ServiceDefinition[] {
  const isWildcard = entitlements.includes("*");
  const isAdminOrInternal = role === "admin" || role === "internal";

  return SERVICE_REGISTRY.filter((svc) => {
    // Internal-only services require admin/internal role
    if (svc.internalOnly && !isAdminOrInternal) return false;
    // Wildcard = see everything
    if (isWildcard) return true;
    // Check entitlement overlap
    if (svc.requiredEntitlements[0] === "*") return false;
    return (svc.requiredEntitlements as readonly string[]).some((e) =>
      entitlements.includes(e),
    );
  });
}
