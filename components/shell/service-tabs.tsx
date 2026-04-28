"use client";

import type { ReactNode } from "react";

/**
 * ServiceTabs — Row 2 navigation.
 * Role-based contextual quick-nav that changes per active Row 1 (lifecycle) tab.
 * Each service defines its own tab set. Tabs support entitlement-based FOMO locking.
 */

import { TabSectionHelp } from "@/components/shell/tab-section-help";
import { DATA_SERVICE_SECTION_LABELS } from "@/lib/config/services/data-service.config";
import {
  checkTradingEntitlement,
  isTradingEntitlement,
  type EntitlementOrWildcard,
  type StrategyFamilyEntitlement,
  type TradingEntitlement,
} from "@/lib/config/auth";
import { type Phase } from "@/lib/phase/types";
import { cn } from "@/lib/utils";
import { isServiceTabActive } from "@/lib/utils/nav-helpers";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  Bell,
  BookMarked,
  BookOpen,
  Building2,
  ClipboardList,
  Cpu,
  Database,
  DollarSign,
  GitFork,
  Layers,
  LayoutDashboard,
  Lightbulb,
  LineChart,
  Lock,
  MonitorDot,
  Receipt,
  ScrollText,
  ShieldAlert,
  TrendingUp,
  Trophy,
  Wallet,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Exposed as a path literal so orphan-audit GENERIC_PATH_STRING_RE can track
// /services/dart/locked — the lockedRedirectTo values include query strings which break the scanner.
const DART_FULL_LOCKED_PAGE = "/services/dart/locked";

export interface ServiceTab {
  label: string;
  href: string;
  /** Lucide icon component — used by vertical nav layouts */
  icon?: LucideIcon;
  /** Match pathname prefix for active state (defaults to href) */
  matchPrefix?: string;
  /** If true, only `href` matches (no prefix) — use for section index routes like `/ml` vs `/ml/training` */
  exact?: boolean;
  /** Entitlement required to access this tab (undefined = always accessible) */
  requiredEntitlement?: string | TradingEntitlement;
  /** When locked, navigate here instead of showing a cursor-not-allowed span */
  lockedRedirectTo?: string;
  /** When true, tab is visible but not navigable (e.g. promote lifecycle gating) */
  navDisabled?: boolean;
  navDisabledTitle?: string;
  /** Visual group separator — renders a divider above this item in vertical nav */
  group?: string;
  /** Strategy family group key — tabs with the same familyGroup are rendered under a collapsible header */
  familyGroup?: string;
  /** Icon name hint for the family group header (used by first tab in a family) */
  familyIcon?: string;
}

interface ServiceTabsProps {
  tabs: ServiceTab[];
  /** Optional right-side slot for Live/As-Of toggle or other controls */
  rightSlot?: React.ReactNode;
  /** User's current entitlements — used for FOMO locking. Accepts the full
   * union written to `AuthPersona.entitlements` so callers can pass
   * `user.entitlements` directly without filtering. */
  entitlements?: readonly (EntitlementOrWildcard | TradingEntitlement | StrategyFamilyEntitlement)[];
  className?: string;
  /** When `"end"`, tab links align to the right (e.g. promote detail toolbar). */
  tabsAlign?: "start" | "end";
  /** When true, tabs share full row width equally (each tab flex-1, centered). */
  tabsSpread?: boolean;
  /**
   * G1.1 phase unification: optional phase attribute emitted as `data-phase`
   * on the tab container. Phased surfaces pass this so Playwright can assert
   * the DOM structure is identical across phase toggles. DO NOT rewrite tab
   * URLs based on this — each tab row is a distinct logical surface; phase
   * routing happens upstream in the layout via `usePhaseBinding`.
   */
  phase?: Phase;
}

function TabLabel({ tab, spread }: { tab: ServiceTab; spread: boolean }) {
  const Icon = tab.icon;
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1.5", spread && "max-w-full justify-center")}>
      {Icon ? <Icon className="size-3.5 shrink-0 opacity-90" aria-hidden /> : null}
      <span className={cn(spread && "truncate")}>{tab.label}</span>
    </span>
  );
}

function TabRow({
  tab,
  isActive,
  tabItemClass,
  children,
}: {
  tab: ServiceTab;
  isActive: boolean;
  tabItemClass: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        tabItemClass,
        "gap-0.5 border-b-2 transition-colors",
        isActive
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
      )}
    >
      {children}
      <TabSectionHelp href={tab.href} tabLabel={tab.label} className="shrink-0 self-center mr-0.5" />
    </div>
  );
}

export function ServiceTabs({
  tabs,
  rightSlot,
  entitlements,
  className,
  tabsAlign = "start",
  tabsSpread = false,
  phase,
}: ServiceTabsProps) {
  const pathname = usePathname() || "";
  const hasWildcard = (entitlements as readonly unknown[] | undefined)?.includes("*") ?? true;
  const alignEnd = tabsAlign === "end" && !tabsSpread;

  const tabItemClass = tabsSpread
    ? "flex min-w-0 flex-1 basis-0 items-center justify-center px-1.5 py-2 sm:px-2"
    : "inline-flex items-center gap-1.5 px-3 py-2 whitespace-nowrap";

  return (
    <div
      className={cn("border-b border-border bg-card/30", className)}
      data-testid="service-tabs-root"
      {...(phase ? { "data-phase": phase } : {})}
    >
      <div
        className={cn(
          "flex flex-wrap items-center gap-2 px-4 sm:px-6",
          alignEnd && !rightSlot && "justify-end",
          (!alignEnd || rightSlot) && !tabsSpread && "justify-between",
          tabsSpread && !rightSlot && "min-w-0",
        )}
      >
        <nav
          className={cn(
            "flex gap-1 pt-3 pb-0 -mb-px overflow-x-auto [-webkit-overflow-scrolling:touch] scrollbar-none",
            alignEnd && "justify-end",
            tabsSpread && "min-w-0 w-full flex-1 justify-stretch gap-0.5 sm:gap-1",
          )}
          aria-label="Service sections"
        >
          {tabs.map((tab) => {
            const isActive = isServiceTabActive(pathname, tab);
            const isLocked =
              tab.requiredEntitlement &&
              !hasWildcard &&
              (isTradingEntitlement(tab.requiredEntitlement)
                ? !checkTradingEntitlement((entitlements as never) ?? [], tab.requiredEntitlement)
                : !(entitlements as readonly string[] | undefined)?.includes(tab.requiredEntitlement as string));

            if (isLocked) {
              const lockedInner = (
                <>
                  <TabLabel tab={tab} spread={tabsSpread} />
                  <Lock className="size-3 shrink-0" />
                </>
              );
              return (
                <TabRow key={tab.href} tab={tab} isActive={false} tabItemClass={tabItemClass}>
                  {tab.lockedRedirectTo ? (
                    <Link
                      href={tab.lockedRedirectTo}
                      className="flex min-w-0 flex-1 items-center gap-1 text-sm font-medium text-muted-foreground/40 hover:text-muted-foreground/60"
                      title={`Upgrade to access ${tab.label}`}
                    >
                      {lockedInner}
                    </Link>
                  ) : (
                    <span
                      className="flex min-w-0 flex-1 items-center gap-1 text-sm font-medium cursor-not-allowed text-muted-foreground/40"
                      title={`Upgrade to access ${tab.label}`}
                    >
                      {lockedInner}
                    </span>
                  )}
                </TabRow>
              );
            }

            if (tab.navDisabled) {
              return (
                <TabRow key={tab.href} tab={tab} isActive={false} tabItemClass={tabItemClass}>
                  <span
                    className={cn(
                      "flex min-w-0 flex-1 items-center gap-1 text-sm font-medium cursor-not-allowed text-muted-foreground/40",
                    )}
                    title={tab.navDisabledTitle ?? "Not available"}
                  >
                    <TabLabel tab={tab} spread={tabsSpread} />
                    <Lock className="size-3 shrink-0" />
                  </span>
                </TabRow>
              );
            }

            return (
              <TabRow key={tab.href} tab={tab} isActive={isActive} tabItemClass={tabItemClass}>
                <Link
                  href={tab.href}
                  className={cn("flex min-w-0 flex-1 items-center text-sm font-medium", tabsSpread && "justify-center")}
                >
                  <TabLabel tab={tab} spread={tabsSpread} />
                </Link>
              </TabRow>
            );
          })}
        </nav>

        {rightSlot && <div className="flex items-center gap-2 py-2 shrink-0 ml-auto">{rightSlot}</div>}
      </div>
    </div>
  );
}

// ── Acquire (Data Science / ETL) ─────────────────────────────────────────────
const DS = DATA_SERVICE_SECTION_LABELS;
export const DATA_TABS: ServiceTab[] = [
  { label: DS.overview, href: "/services/data/overview" },
  { label: DS.instruments, href: "/services/data/instruments" },
  { label: DS.raw, href: "/services/data/raw" },
  { label: DS.processing, href: "/services/data/processing" },
  { label: DS.events, href: "/services/data/events" },
  { label: DS.coverage, href: "/services/data/coverage" },
  { label: DS.gaps, href: "/services/data/gaps" },
  { label: "Completeness", href: "/services/data/completeness" },
  { label: DS.valuation, href: "/services/data/valuation" },
];

// ── Build (Quant Developer) ──────────────────────────────────────────────────
export const BUILD_TABS: ServiceTab[] = [
  { label: "Overview", href: "/services/research/overview" },
  {
    label: "Features",
    href: "/services/research/features",
    matchPrefix: "/services/research/features",
  },
  {
    label: "Feature ETL",
    href: "/services/research/feature-etl",
    matchPrefix: "/services/research/feature-etl",
  },
  {
    label: "Models",
    href: "/services/research/ml",
    matchPrefix: "/services/research/ml",
  },
  {
    label: "Strategies",
    href: "/services/research/strategies",
    matchPrefix: "/services/research/strategies",
  },
  {
    label: "Execution",
    href: "/services/research/execution",
    matchPrefix: "/services/research/execution",
  },
  { label: "Quant Workspace", href: "/services/research/quant" },
];

/** ML Models — second row under Build, same visual style as Strategy sub-tabs */
export const ML_SUB_TABS: ServiceTab[] = [
  {
    label: "Pipeline",
    href: "/services/research/ml",
    matchPrefix: "/services/research/ml",
    exact: true,
  },
  {
    label: "Training",
    href: "/services/research/ml/training",
    matchPrefix: "/services/research/ml/training",
  },
  {
    label: "Analysis",
    href: "/services/research/ml/analysis",
    matchPrefix: "/services/research/ml/analysis",
  },
  {
    label: "Model Registry",
    href: "/services/research/ml/registry",
    matchPrefix: "/services/research/ml/registry",
  },
  {
    label: "Grid Config",
    href: "/services/research/ml/grid-config",
    matchPrefix: "/services/research/ml/grid-config",
  },
  {
    label: "Monitoring",
    href: "/services/research/ml/monitoring",
    matchPrefix: "/services/research/ml/monitoring",
  },
  {
    label: "Governance",
    href: "/services/research/ml/governance",
    matchPrefix: "/services/research/ml/governance",
  },
  {
    label: "Config",
    href: "/services/research/ml/config",
    matchPrefix: "/services/research/ml/config",
  },
];

// Strategy sub-tabs — shown inside Strategy section pages.
// v2 family/archetype/allocator/unity/venues tabs are appended after the
// legacy catalog/backtest tabs so existing links keep working.
/**
 * Strategy Catalogue service sub-tabs (Phase 10 UI). Separate from the
 * research-side STRATEGY_SUB_TABS — this service is a sibling to Research /
 * Trading / Investment Management and owns the fixed combinatoric universe.
 *
 * SSOT: `unified-trading-pm/codex/09-strategy/architecture-v2/cross-cutting/strategy-availability-and-locking.md`.
 */
export const STRATEGY_CATALOGUE_SUB_TABS: ServiceTab[] = [
  {
    label: "Overview",
    href: "/services/strategy-catalogue",
    exact: true,
  },
  {
    label: "Coverage",
    href: "/services/strategy-catalogue/coverage",
    matchPrefix: "/services/strategy-catalogue/coverage",
  },
  {
    label: "By combination",
    href: "/services/strategy-catalogue/coverage/by-combination",
  },
  {
    label: "Blocked",
    href: "/services/strategy-catalogue/coverage/blocked",
  },
  {
    label: "Admin · Lock state",
    href: "/services/strategy-catalogue/admin/lock-state",
    requiredEntitlement: "admin",
  },
];

export const STRATEGY_SUB_TABS: ServiceTab[] = [
  { label: "Overview", href: "/services/research/strategy/overview" },
  {
    label: "Families",
    href: "/services/research/strategy/families",
    matchPrefix: "/services/research/strategy/families",
  },
  { label: "Catalog", href: "/services/research/strategy/catalog", matchPrefix: "/services/research/strategy/catalog" },
  // G2.10: Allocator removed from research sub-tabs (rule 03 same-system-principle —
  // allocator is a commercial surface at /services/investment-management/allocator
  // or /services/trading-platform/allocator, resolved via audience claim).
  { label: "Unity", href: "/services/research/strategy/unity" },
  { label: "Venues", href: "/services/research/strategy/venues" },
  { label: "Policies", href: "/services/research/strategy/execution-policies" },
  { label: "Backtests", href: "/services/research/strategy/backtests" },
  { label: "Compare", href: "/services/research/strategy/compare" },
  { label: "Results", href: "/services/research/strategy/results" },
  { label: "Heatmap", href: "/services/research/strategy/heatmap" },
  { label: "Candidates", href: "/services/research/strategy/candidates" },
  { label: "Handoff", href: "/services/research/strategy/handoff" },
  { label: "Sports", href: "/services/research/strategy/sports" },
];

// ── Run (Trader — Live) ──────────────────────────────────────────────────────
// Group 1: Shared — relevant to all asset classes (monitoring + trading + analysis)
// Group 2: Strategy families — collapsible groups for DeFi, Sports, Options, Predictions
export const TRADING_TABS: ServiceTab[] = [
  // ── Shared (top-level, always visible) ────────────────────────────────────
  {
    label: "Overview",
    href: "/services/trading/overview",
    icon: LayoutDashboard,
  },
  { label: "Terminal", href: "/services/trading/terminal", icon: MonitorDot },
  { label: "Book", href: "/services/trading/book", icon: BookMarked },
  { label: "Orders", href: "/services/trading/orders", icon: ClipboardList },
  { label: "Positions", href: "/services/trading/positions", icon: BookOpen },
  { label: "Alerts", href: "/services/trading/alerts", icon: Bell },
  { label: "Risk", href: "/services/trading/risk", icon: ShieldAlert },
  { label: "P&L", href: "/services/trading/pnl", icon: BarChart3 },
  { label: "Accounts", href: "/services/trading/accounts", icon: Wallet },
  { label: "Instructions", href: "/services/trading/instructions", icon: ScrollText },
  {
    label: "Markets",
    href: "/services/trading/markets",
    icon: Activity,
    requiredEntitlement: { domain: "trading-common", tier: "basic" } as TradingEntitlement,
  },
  { label: "Strategies", href: "/services/trading/strategies", icon: Layers, requiredEntitlement: "strategy-families" },
  // ── DART umbrella sub-tabs (Phase 11) ─────────────────────────────────────
  // Strategy Config requires strategy-full entitlement (ml-full is further
  // enforced at the page level). DART Signals-In personas never see it.
  {
    label: "Strategy Config",
    href: "/services/trading/strategy-config",
    requiredEntitlement: "strategy-full",
    lockedRedirectTo: `${DART_FULL_LOCKED_PAGE}?from=research`,
  },
  // Signal Intake — inbound signal webhooks for Signals-In + admin cross-client view
  { label: "Signal Intake", href: "/services/signals/dashboard" },
  // Observe — risk/alerts/health/live-PnL folded into DART
  { label: "Observe", href: "/services/observe/risk" },
  // Deployment — runtime profile + chaos + kill-switch (links to deployment-ui)
  {
    label: "Deployment",
    href: "/services/trading/deployment",
    requiredEntitlement: "strategy-full",
    lockedRedirectTo: `${DART_FULL_LOCKED_PAGE}?from=promote`,
  },
  // ── DeFi family ───────────────────────────────────────────────────────────
  {
    label: "DeFi",
    href: "/services/trading/defi",
    icon: Cpu,
    group: "DeFi",
    familyGroup: "DeFi",
    familyIcon: "Layers",
    exact: true,
    requiredEntitlement: { domain: "trading-defi", tier: "basic" } as TradingEntitlement,
  },
  {
    label: "Bundles",
    href: "/services/trading/defi/bundles",
    icon: GitFork,
    group: "DeFi",
    familyGroup: "DeFi",
    requiredEntitlement: { domain: "trading-defi", tier: "basic" } as TradingEntitlement,
  },
  {
    label: "Staking",
    href: "/services/trading/defi/staking",
    icon: Layers,
    group: "DeFi",
    familyGroup: "DeFi",
    requiredEntitlement: { domain: "trading-defi", tier: "basic" } as TradingEntitlement,
  },
  // ── Sports family ─────────────────────────────────────────────────────────
  {
    label: "Sports",
    href: "/services/trading/sports",
    icon: Trophy,
    group: "Sports",
    familyGroup: "Sports",
    familyIcon: "Trophy",
    exact: true,
    requiredEntitlement: { domain: "trading-sports", tier: "basic" } as TradingEntitlement,
  },
  {
    label: "Place Bets",
    href: "/services/trading/sports/bet",
    icon: Zap,
    group: "Sports",
    familyGroup: "Sports",
    requiredEntitlement: { domain: "trading-sports", tier: "basic" } as TradingEntitlement,
  },
  {
    label: "Accumulators",
    href: "/services/trading/sports/accumulators",
    icon: GitFork,
    group: "Sports",
    familyGroup: "Sports",
    requiredEntitlement: { domain: "trading-sports", tier: "basic" } as TradingEntitlement,
  },
  // ── Options & Futures family ──────────────────────────────────────────────
  {
    label: "Options",
    href: "/services/trading/options",
    icon: TrendingUp,
    group: "Options & Futures",
    familyGroup: "Options & Futures",
    familyIcon: "BarChart3",
    exact: true,
    requiredEntitlement: { domain: "trading-options", tier: "basic" } as TradingEntitlement,
  },
  {
    label: "Combo Builder",
    href: "/services/trading/options/combos",
    icon: GitFork,
    group: "Options & Futures",
    familyGroup: "Options & Futures",
    requiredEntitlement: { domain: "trading-options", tier: "basic" } as TradingEntitlement,
  },
  {
    label: "Pricing",
    href: "/services/trading/options/pricing",
    matchPrefix: "/services/trading/options/pricing",
    icon: LineChart,
    group: "Options & Futures",
    familyGroup: "Options & Futures",
    requiredEntitlement: { domain: "trading-options", tier: "basic" } as TradingEntitlement,
  },
  // ── Predictions family ────────────────────────────────────────────────────
  {
    label: "Predictions",
    href: "/services/trading/predictions",
    icon: Lightbulb,
    requiredEntitlement: { domain: "trading-predictions", tier: "basic" } as TradingEntitlement,
    group: "Predictions",
    familyGroup: "Predictions",
    familyIcon: "TrendingUp",
    exact: true,
  },
  {
    label: "Aggregators",
    href: "/services/trading/predictions/aggregators",
    icon: GitFork,
    group: "Predictions",
    familyGroup: "Predictions",
    requiredEntitlement: { domain: "trading-predictions", tier: "basic" } as TradingEntitlement,
  },
];

// ── Observe (Risk / Ops) ─────────────────────────────────────────────────────
export const OBSERVE_TABS: ServiceTab[] = [
  { label: "Risk Dashboard", href: "/services/observe/risk" },
  { label: "Alerts", href: "/services/observe/alerts" },
  { label: "News", href: "/services/observe/news" },
  { label: "Strategy Health", href: "/services/observe/strategy-health" },
  { label: "Scenarios", href: "/services/observe/scenarios" },
  { label: "System Health", href: "/services/observe/health" },
  { label: "Event Audit", href: "/services/observe/event-audit" },
  { label: "Position Recon", href: "/services/observe/reconciliation" },
  { label: "Recovery", href: "/services/observe/recovery" },
];

// ── Manage (Back Office) ─────────────────────────────────────────────────────
export const MANAGE_TABS: ServiceTab[] = [
  { label: "Clients", href: "/services/manage/clients" },
  { label: "Mandates", href: "/services/manage/mandates" },
  { label: "Fees", href: "/services/manage/fees" },
  { label: "Users", href: "/services/manage/users" },
  { label: "Compliance", href: "/services/manage/compliance" },
  { label: "Best Execution", href: "/services/manage/best-execution" },
];

// ── Report (Executive) ───────────────────────────────────────────────────────
export const REPORTS_TABS: ServiceTab[] = [
  { label: "P&L", href: "/services/reports/overview" },
  { label: "Performance", href: "/services/reports/performance", icon: TrendingUp },
  { label: "Trades", href: "/services/reports/trades", icon: ScrollText },
  { label: "Executive", href: "/services/reports/executive" },
  { label: "IBOR", href: "/services/reports/ibor", icon: Database },
  { label: "NAV", href: "/services/reports/nav", icon: DollarSign },
  { label: "Fund Ops", href: "/services/reports/fund-operations", icon: Building2 },
  { label: "Settlement", href: "/services/reports/settlement" },
  { label: "Analytics", href: "/services/reports/analytics", icon: BarChart3 },
  { label: "Reconciliation", href: "/services/reports/reconciliation" },
  { label: "Regulatory", href: "/services/reports/regulatory" },
  { label: "Invoices", href: "/services/reports/invoices", icon: Receipt },
];

// ── Admin/Ops (Internal Operations) ─────────────────────────────────────────
// Consolidates all admin + ops surfaces into one tab bar to avoid sprawl.
// Grouped: User Management | Apps & Integrations | Audit & Compliance |
// Operations | Configuration.
//
// Wave 3 follow-up (plan p6-admin-nav-wiring, 2026-04-20): all 12 migrated
// user-management-ui pages + the `persona-override` deep-link (accessed per
// user from `users/[id]`) are now reachable from this bar. Destructive-action
// tabs gate via `hasAdminPermission(user, "admin:X")` at the page level —
// tab-level `requiredEntitlement: "admin"` is the coarse role gate only.
export const ADMIN_TABS: ServiceTab[] = [
  // ── User Management ─────────────────────────────────────────────────────
  { label: "Users", href: "/admin/users", exact: true, group: "Users" },
  { label: "Access Requests", href: "/admin/requests", matchPrefix: "/admin/requests" },
  { label: "Catalogue", href: "/admin/users/catalogue", requiredEntitlement: "admin" },
  { label: "Onboard", href: "/admin/onboard", matchPrefix: "/admin/onboard" },
  { label: "Templates", href: "/admin/templates", matchPrefix: "/admin/templates", requiredEntitlement: "admin" },
  {
    label: "Firebase Users",
    href: "/admin/firebase-users",
    matchPrefix: "/admin/firebase-users",
    requiredEntitlement: "admin",
  },
  { label: "Groups", href: "/admin/groups", matchPrefix: "/admin/groups", requiredEntitlement: "admin" },
  {
    label: "Questionnaires",
    href: "/admin/questionnaires",
    matchPrefix: "/admin/questionnaires",
    requiredEntitlement: "admin",
  },
  {
    label: "Strategy Evaluations",
    href: "/admin/strategy-evaluations",
    matchPrefix: "/admin/strategy-evaluations",
    requiredEntitlement: "admin",
  },
  {
    label: "Notifications",
    href: "/admin/notifications",
    matchPrefix: "/admin/notifications",
    requiredEntitlement: "admin",
  },
  { label: "Organisations", href: "/admin/organizations", matchPrefix: "/admin/organizations" },
  // ── Apps & Integrations ─────────────────────────────────────────────────
  { label: "Apps", href: "/admin/apps", matchPrefix: "/admin/apps", group: "Apps", requiredEntitlement: "admin" },
  { label: "GitHub", href: "/admin/github", matchPrefix: "/admin/github", requiredEntitlement: "admin" },
  // ── Audit & Compliance ──────────────────────────────────────────────────
  {
    label: "Audit Log",
    href: "/admin/audit-log",
    matchPrefix: "/admin/audit-log",
    group: "Audit",
    requiredEntitlement: "admin",
  },
  {
    label: "Health Checks",
    href: "/admin/health-checks",
    matchPrefix: "/admin/health-checks",
    requiredEntitlement: "admin",
  },
  // ── Operations ──────────────────────────────────────────────────────────
  { label: "Services", href: "/ops/services", group: "System" },
  { label: "Jobs", href: "/ops/jobs" },
  { label: "Signal Counterparties", href: "/services/signals/counterparties", requiredEntitlement: "admin" },
  { label: "Deployment & Readiness", href: "/devops" },
  { label: "Approvals", href: "/approvals" },
  // ── Configuration ───────────────────────────────────────────────────────
  { label: "Config", href: "/config", group: "Configuration" },
  { label: "Data Admin", href: "/admin/data" },
];

// Alias — user management IS the admin section
export const USER_MGMT_TABS = ADMIN_TABS;

// 2026-04-28 tile split SSOT: codex/14-playbooks/dart/dart-terminal-vs-research.md.
// RESEARCH_TABS lives under the new DART Research dashboard tile (DART-Full +
// admin only; padlocked-visible "locked" for Signals-In). Mirrors BUILD_TABS
// today — preserved as a separate export so subsequent commits can lifecycle-
// group it (Develop / Train / Validate / Allocate / Promote) without churning
// research-page imports of BUILD_TABS.
export const RESEARCH_TABS = BUILD_TABS;

// 2026-04-28: TERMINAL_TABS is the chip set for the new DART Terminal tile
// (Signals-In + DART-Full + admin visible). Live trading surfaces only —
// Terminal, Observe, Strategy Catalogue (read for Signals-In, manage for
// DART-Full), Signal Intake. Sub-routes track the SERVICE_REGISTRY
// dart-terminal entry in lib/config/services.ts.
export const TERMINAL_TABS: ServiceTab[] = [
  { label: "Terminal", href: "/services/trading/terminal" },
  { label: "Observe", href: "/services/observe/risk", matchPrefix: "/services/observe" },
  {
    label: "Strategy Catalogue",
    href: "/services/strategy-catalogue",
    matchPrefix: "/services/strategy-catalogue",
  },
  { label: "Signal Intake", href: "/services/signals/dashboard", matchPrefix: "/services/signals/dashboard" },
];
export const EXECUTE_TABS: ServiceTab[] = [
  { label: "Overview", href: "/services/execution/overview" },
  { label: "Algos", href: "/services/execution/algos" },
  { label: "Venues", href: "/services/execution/venues" },
  { label: "TCA", href: "/services/execution/tca" },
  { label: "Benchmarks", href: "/services/execution/benchmarks" },
  { label: "Candidates", href: "/services/execution/candidates" },
  { label: "Handoff", href: "/services/execution/handoff" },
];

// Legacy alias
export const EXECUTION_TABS = EXECUTE_TABS;

// ── Live/As-Of visibility per service ────────────────────────────────────────
export const LIVE_ASOF_VISIBLE: Record<string, boolean> = {
  acquire: false,
  build: true,
  promote: false,
  run: true,
  execute: true,
  observe: true,
  manage: false,
  report: false,
};
