/**
 * Service registry — 5 top-level product tiles shown on /dashboard.
 *
 * 2026-04-21 collapse (plans/active/dashboard_services_grid_collapse_2026_04_21.plan.md):
 *   - 11 tiles → 5 tiles
 *   - Folded-away as DART sub-routes: data · research · promote · observe · strategy-catalogue
 *   - Odum Signals disambiguated: top-level tile = COUNTERPARTY-OUTBOUND broadcast only;
 *     inbound Signal Intake moves into DART sub-routes (for Signals-In clients)
 *
 * Axes:
 *   - Top-nav (lifecycle-nav.tsx) = lifecycle axis (Data · DART · Manage · Reports)
 *   - This registry                = product axis  (what a user bought)
 *
 * SSOT: unified-trading-pm/codex/09-strategy/architecture-v2/dashboard-services-grid.md
 */

import type { Entitlement } from "./auth";

export type LifecycleStage = "acquire" | "build" | "promote" | "run" | "execute" | "observe" | "manage" | "report";

/** Sub-route chip rendered under an unlocked tile. */
export interface ServiceSubRoute {
  /** Machine key — stable id used by persona-dashboard-shape. */
  key: string;
  /** Short label shown on the chip. */
  label: string;
  /** Route path. */
  href: string;
  /** Icon name (lucide-react). */
  icon: string;
  /** Entitlements required to unlock the chip (empty = inherit tile's, ["*"] = internal). */
  requiredEntitlements: readonly Entitlement[] | readonly ["*"] | readonly [];
  /** Terse description for tooltips. */
  description?: string;
}

export interface ServiceDefinition {
  key: string;
  label: string;
  description: string;
  href: string;
  lifecycleStage: LifecycleStage;
  requiredEntitlements: readonly Entitlement[] | readonly ["*"];
  icon: string;
  internalOnly: boolean;
  /** Chip-row sub-routes rendered under the tile when unlocked. */
  subRoutes: readonly ServiceSubRoute[];
}

export const SERVICE_REGISTRY: readonly ServiceDefinition[] = [
  // ─── DART Research (DART-Full only — padlocked-visible for Signals-In) ─────
  // SSOT: unified-trading-pm/codex/14-playbooks/dart/dart-terminal-vs-research.md
  // Lifecycle stages: Develop / Train / Validate / Allocate / Promote.
  // Strategy lists within each stage use family → archetype → asset_group.
  // 2026-04-29: Research listed BEFORE Terminal so the dashboard renders the
  // research workbench tile to the LEFT of the live-trading tile (research
  // comes first in the build → run → observe lifecycle, and that ordering
  // matches the user's mental model).
  {
    key: "dart-research",
    label: "DART Research",
    description:
      "Research workbench — feature engineering, ML training, backtesting, validation, allocator research, candidate promotion.",
    // 2026-04-30 (Phase 9): tile routes into the unified workspace shell with
    // surface=research seeded so the journey rail anchors at "discover".
    href: "/services/workspace?surface=research&rs=discover",
    lifecycleStage: "build",
    requiredEntitlements: ["strategy-full", "ml-full"] as readonly Entitlement[],
    icon: "FlaskConical",
    internalOnly: false,
    subRoutes: [
      {
        key: "research-overview",
        label: "Overview",
        href: "/services/research/overview",
        icon: "FlaskConical",
        requiredEntitlements: ["strategy-full", "ml-full"] as readonly Entitlement[],
        description: "Research hub landing page.",
      },
      // ── Develop ───────────────────────────────────────────────────────────
      {
        key: "features",
        label: "Features",
        href: "/services/research/features",
        icon: "Database",
        requiredEntitlements: ["strategy-full", "ml-full"] as readonly Entitlement[],
        description: "Feature catalogue + provenance (Develop).",
      },
      {
        key: "feature-etl",
        label: "Feature ETL",
        href: "/services/research/feature-etl",
        icon: "Workflow",
        requiredEntitlements: ["strategy-full", "ml-full"] as readonly Entitlement[],
        description: "Feature ETL pipeline (Develop).",
      },
      {
        key: "quant",
        label: "Quant Workspace",
        href: "/services/research/quant",
        icon: "Calculator",
        requiredEntitlements: ["strategy-full", "ml-full"] as readonly Entitlement[],
        description: "Quantitative research workbench (Develop).",
      },
      {
        key: "strategies",
        label: "Strategies",
        href: "/services/research/strategies",
        icon: "Layers",
        requiredEntitlements: ["strategy-full", "ml-full"] as readonly Entitlement[],
        description: "Strategy development — family → archetype → asset_group (Develop).",
      },
      // ── Train ─────────────────────────────────────────────────────────────
      {
        key: "ml",
        label: "ML Pipeline",
        href: "/services/research/ml",
        icon: "Cpu",
        requiredEntitlements: ["strategy-full", "ml-full"] as readonly Entitlement[],
        description: "Model training, registry, monitoring, governance (Train).",
      },
      // ── Validate ──────────────────────────────────────────────────────────
      {
        key: "backtests",
        label: "Backtests",
        href: "/services/research/strategy/backtests",
        icon: "PlayCircle",
        requiredEntitlements: ["strategy-full", "ml-full"] as readonly Entitlement[],
        description: "Strategy backtest runner (Validate).",
      },
      {
        key: "signals",
        label: "Signals (Validation)",
        href: "/services/research/signals",
        icon: "Radio",
        requiredEntitlements: ["strategy-full", "ml-full"] as readonly Entitlement[],
        description: "Signal monitor + validation — surfaced from previously-orphan path (Validate).",
      },
      {
        key: "execution-research",
        label: "Execution Research",
        href: "/services/research/execution",
        icon: "Zap",
        requiredEntitlements: ["strategy-full", "ml-full"] as readonly Entitlement[],
        description: "Execution algos, venue benchmarks, slippage simulation (Validate).",
      },
      // ── Allocate (Research) ───────────────────────────────────────────────
      {
        key: "allocate",
        label: "Allocate (Research)",
        href: "/services/research/allocate",
        icon: "PieChart",
        requiredEntitlements: ["strategy-full", "ml-full"] as readonly Entitlement[],
        description:
          "Research-time allocator workbench — regime-aware allocation backtests, model selection, shadow-vs-primary diff. Distinct from operational allocator at /services/investment-management/allocator.",
      },
      // ── Promote ───────────────────────────────────────────────────────────
      {
        key: "promote",
        label: "Promote",
        href: "/services/research/strategy/candidates",
        icon: "ArrowUpCircle",
        requiredEntitlements: ["strategy-full", "ml-full"] as readonly Entitlement[],
        description: "Candidate review + approval queue + handoff to live (Promote).",
      },
    ],
  },

  // ─── DART Terminal (Signals-In + DART-Full visible) ────────────────────────
  // SSOT: unified-trading-pm/codex/14-playbooks/dart/dart-terminal-vs-research.md
  // Trading-day surfaces: terminal, observe, catalogue, signal-intake, data.
  // Visible to anyone with execution-basic / execution-full. Listed AFTER
  // Research so the dashboard renders research-first (left) → terminal (right).
  {
    key: "dart-terminal",
    label: "DART Terminal",
    description:
      "Live trading surfaces — terminal, positions, orders, P&L, observe, strategy catalogue, signal intake.",
    // 2026-04-30 (Phase 9): tile routes into the unified workspace shell with
    // surface=terminal + tm=command so the cockpit lands on the live
    // command mode by default.
    href: "/services/workspace?surface=terminal&tm=command",
    lifecycleStage: "run",
    requiredEntitlements: ["execution-basic", "execution-full", "data-basic", "data-pro"] as readonly Entitlement[],
    icon: "TrendingUp",
    internalOnly: false,
    subRoutes: [
      {
        key: "terminal",
        label: "Terminal",
        href: "/services/trading/terminal",
        icon: "Activity",
        requiredEntitlements: ["execution-basic", "execution-full"] as readonly Entitlement[],
        description: "Positions, orders, P&L, emergency manual intervention.",
      },
      {
        key: "observe",
        label: "Observe",
        href: "/services/observe/risk",
        icon: "Eye",
        requiredEntitlements: ["execution-basic", "execution-full"] as readonly Entitlement[],
        description: "Risk, alerts, strategy health, system health.",
      },
      {
        key: "strategy-catalogue",
        label: "Catalogue",
        href: "/services/strategy-catalogue",
        icon: "Layers",
        requiredEntitlements: ["strategy-full", "execution-full"] as readonly Entitlement[],
        description: "Reality + FOMO view of the shared Tier-3 strategy catalogue primitive.",
      },
      {
        key: "signal-intake",
        label: "Signal Intake",
        href: "/services/signals/dashboard",
        icon: "Radio",
        requiredEntitlements: ["execution-full"] as readonly Entitlement[],
        description: "Inbound webhooks for DART Signals-In clients.",
      },
      {
        key: "data",
        label: "Data",
        href: "/services/data/overview",
        icon: "Database",
        requiredEntitlements: ["*"],
        description: "Instrument catalogue + data freshness (admin/internal only).",
      },
    ],
  },

  // ─── Odum Signals (counterparty-outbound only) ─────────────────────────────
  {
    key: "odum-signals",
    label: "Odum Signals",
    description:
      "External counterparty signal broadcast — webhook/REST delivery, HMAC-signed payloads, rate-limited per counterparty.",
    href: "/services/signals/counterparties",
    lifecycleStage: "run",
    requiredEntitlements: ["execution-full"] as readonly Entitlement[],
    icon: "Radio",
    internalOnly: false,
    subRoutes: [
      {
        key: "counterparties",
        label: "Counterparties",
        href: "/services/signals/counterparties",
        icon: "Users",
        requiredEntitlements: [],
        description: "Subscribed counterparties + delivery status.",
      },
      {
        key: "payloads",
        label: "Payloads",
        href: "/services/signals/payloads",
        icon: "FileCode",
        requiredEntitlements: [],
        description: "Signal payload schemas + examples.",
      },
      {
        key: "emission-history",
        label: "Emission History",
        href: "/services/signals/history",
        icon: "History",
        requiredEntitlements: [],
        description: "Emitted-signal audit trail.",
      },
      {
        key: "rate-limits",
        label: "Rate Limits",
        href: "/services/signals/rate-limits",
        icon: "Gauge",
        requiredEntitlements: [],
        description: "Per-counterparty rate-limit config.",
      },
    ],
  },

  // ─── Reports ──────────────────────────────────────────────────────────────
  {
    key: "reports",
    label: "Reports",
    description: "P&L attribution, executive summary, settlement, reconciliation, and regulatory reporting.",
    href: "/services/reports/overview",
    lifecycleStage: "report",
    requiredEntitlements: ["reporting"],
    icon: "FileText",
    internalOnly: false,
    subRoutes: [
      {
        key: "pnl-attribution",
        label: "P&L Attribution",
        href: "/services/reports/overview",
        icon: "BarChart3",
        requiredEntitlements: [],
        description: "Strategy × venue × instrument attribution.",
      },
      {
        key: "settlement",
        label: "Settlement",
        href: "/services/reports/settlement",
        icon: "Receipt",
        requiredEntitlements: [],
        description: "Pending + settled trade flows.",
      },
      {
        key: "reconciliation",
        label: "Reconciliation",
        href: "/services/reports/reconciliation",
        icon: "Scale",
        requiredEntitlements: [],
        description: "Position + cash reconciliation.",
      },
      {
        key: "regulatory",
        label: "Regulatory",
        href: "/services/reports/regulatory",
        icon: "ShieldCheck",
        requiredEntitlements: [],
        description: "Compliance + regulatory reporting.",
      },
      {
        key: "own-account",
        label: "Own-account",
        href: "/services/reports/own-account",
        icon: "Wallet",
        requiredEntitlements: [],
        description: "Your org's perf + invoices (gated on connected venue credentials).",
      },
      {
        key: "catalogue",
        label: "Strategy catalogue",
        href: "/services/reports/strategy-catalogue",
        icon: "Layers",
        requiredEntitlements: [],
        description: "Tier-3 strategy catalogue — FOMO tearsheets + Reality allocations for IM personas.",
      },
    ],
  },

  // ─── Investor Relations ───────────────────────────────────────────────────
  {
    key: "investor-relations",
    label: "Investor Relations",
    description: "Board presentations, disaster recovery playbook, security posture, and operational resilience.",
    href: "/investor-relations",
    lifecycleStage: "report",
    requiredEntitlements: ["investor-relations"],
    icon: "Presentation",
    internalOnly: false,
    subRoutes: [
      {
        key: "board",
        label: "Board Materials",
        href: "/investor-relations/board",
        icon: "Presentation",
        requiredEntitlements: [],
        description: "Quarterly board packs.",
      },
      {
        key: "dr-playbook",
        label: "DR Playbook",
        href: "/investor-relations/dr",
        icon: "LifeBuoy",
        requiredEntitlements: [],
        description: "Disaster recovery runbook.",
      },
      {
        key: "security",
        label: "Security Posture",
        href: "/investor-relations/security",
        icon: "ShieldCheck",
        requiredEntitlements: [],
        description: "Security posture + audits.",
      },
      {
        key: "ir-briefings",
        label: "IR Briefings",
        href: "/investor-relations/briefings",
        icon: "Newspaper",
        requiredEntitlements: [],
        description: "Investor briefings + Q&A.",
      },
      {
        key: "demo-preview",
        label: "Demo Preview",
        href: "/demo/preview",
        icon: "PlayCircle",
        requiredEntitlements: [],
        description: "Static mock showcase of the platform — IR-safe, no live data.",
      },
    ],
  },

  // ─── Admin & Ops (internal-only) ──────────────────────────────────────────
  {
    key: "admin",
    label: "Admin & Ops",
    description:
      "Client onboarding, mandates, fee schedules, user management, deployments, service registry, operational monitoring.",
    href: "/admin",
    lifecycleStage: "manage",
    requiredEntitlements: ["*"],
    icon: "Settings",
    internalOnly: true,
    subRoutes: [
      {
        key: "users",
        label: "Users",
        href: "/admin/users",
        icon: "Users",
        requiredEntitlements: ["*"],
        description: "User + role management.",
      },
      {
        key: "orgs",
        label: "Orgs",
        href: "/admin/organizations",
        icon: "Building2",
        requiredEntitlements: ["*"],
        description: "Client org onboarding + mandates.",
      },
      {
        key: "strategy-universe",
        label: "Strategy Universe",
        href: "/admin/strategy-universe",
        icon: "Layers",
        requiredEntitlements: ["*"],
        description: "Tier-1 read-only catalogue of every UAC-expressed instance.",
      },
      {
        key: "strategy-lifecycle-editor",
        label: "Strategy Lifecycle Editor",
        href: "/admin/strategy-lifecycle-editor",
        icon: "Edit",
        requiredEntitlements: ["*"],
        description: "Tier-2 maturity-phase + product-routing editor (enabled post Plan A Phase 3).",
      },
      {
        key: "deployments",
        label: "Deployments",
        href: "/admin/deployments",
        icon: "Rocket",
        requiredEntitlements: ["*"],
        description: "Service deployments + version state.",
      },
      {
        key: "service-registry",
        label: "Service Registry",
        href: "/admin/service-registry",
        icon: "Network",
        requiredEntitlements: ["*"],
        description: "67-repo service catalog + health.",
      },
      {
        key: "system-health",
        label: "System Health",
        href: "/admin/system-health",
        icon: "HeartPulse",
        requiredEntitlements: ["*"],
        description: "Fleet-wide health × tier × mode × env matrix.",
      },
      {
        key: "engagement",
        label: "Engagement Tracker",
        href: "/engagement",
        icon: "Activity",
        requiredEntitlements: ["*"],
        description: "Client engagement telemetry + funnel metrics.",
      },
      {
        key: "data-etl",
        label: "Data ETL Console",
        href: "/internal/data-etl",
        icon: "Database",
        requiredEntitlements: ["*"],
        description: "Internal ETL ops + manual pipeline triggers.",
      },
      {
        key: "audit-log",
        label: "Audit Log",
        href: "/admin/audit",
        icon: "ScrollText",
        requiredEntitlements: ["*"],
        description: "System-wide audit trail.",
      },
    ],
  },
] as const;

/** Dashboard tile ids — mirrors SERVICE_REGISTRY keys.
 *
 * SSOT: unified-trading-pm/codex/14-playbooks/dart/dart-terminal-vs-research.md
 * Legacy single `dart` tile was split 2026-04-28 into `dart-terminal`
 * (Signals-In + DART-Full visible) and `dart-research` (DART-Full only;
 * padlocked-visible for Signals-In). FOMO behavior is default-on for
 * non-DART-Full users via the instrument-type gate (lib/architecture-v2/
 * user-instrument-types.ts), not a separate tier id.
 */
export type DashboardTileId =
  | "dart-terminal"
  | "dart-research"
  | "odum-signals"
  | "reports"
  | "investor-relations"
  | "admin";

/** Get services visible to a given set of entitlements. */
export function getVisibleServices(entitlements: readonly string[], role: string): ServiceDefinition[] {
  const isWildcard = entitlements.includes("*");
  const isAdminOrInternal = role === "admin" || role === "internal";

  return SERVICE_REGISTRY.filter((svc) => {
    if (svc.internalOnly && !isAdminOrInternal) return false;
    if (isWildcard) return true;
    if (svc.requiredEntitlements[0] === "*") return false;
    return (svc.requiredEntitlements as readonly string[]).some((e) => entitlements.includes(e));
  });
}

/**
 * Filter `service.subRoutes` by entitlement overlap. A chip stays in the result
 * list with `locked = true` when entitlements are missing, so callers can
 * render a padlocked chip (tempt-logic) instead of hiding it entirely. Callers
 * that want hidden-entirely filtering should additionally apply
 * `personaDashboardSubRoutes()` to drop "hidden" entries.
 */
export function getAccessibleSubRoutes(
  service: ServiceDefinition,
  entitlements: readonly string[],
  role: string,
): Array<ServiceSubRoute & { locked: boolean }> {
  const isWildcard = entitlements.includes("*");
  const isAdminOrInternal = role === "admin" || role === "internal";

  return service.subRoutes.map((sub) => {
    const req = sub.requiredEntitlements;
    let locked = false;
    if (req.length === 0) {
      // Inherit tile-level gate — a user who sees the tile sees the chip.
      locked = false;
    } else if (req[0] === "*") {
      locked = !isAdminOrInternal;
    } else if (!isWildcard) {
      locked = !(req as readonly string[]).some((e) => entitlements.includes(e));
    }
    return { ...sub, locked };
  });
}
