"use client";

import type { ReactNode } from "react";

/**
 * ServiceTabs — Row 2 navigation.
 * Role-based contextual quick-nav that changes per active Row 1 (lifecycle) tab.
 * Each service defines its own tab set. Tabs support entitlement-based FOMO locking.
 */

import { TabSectionHelp } from "@/components/shell/tab-section-help";
import { DATA_SERVICE_SECTION_LABELS } from "@/lib/config/services/data-service.config";
import { cn } from "@/lib/utils";
import { isServiceTabActive } from "@/lib/utils/nav-helpers";
import type { LucideIcon } from "lucide-react";
import {
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
  requiredEntitlement?: string;
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
  /** User's current entitlements — used for FOMO locking */
  entitlements?: readonly string[];
  className?: string;
  /** When `"end"`, tab links align to the right (e.g. promote detail toolbar). */
  tabsAlign?: "start" | "end";
  /** When true, tabs share full row width equally (each tab flex-1, centered). */
  tabsSpread?: boolean;
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
}: ServiceTabsProps) {
  const pathname = usePathname() || "";
  const hasWildcard = entitlements?.includes("*") ?? true;
  const alignEnd = tabsAlign === "end" && !tabsSpread;

  const tabItemClass = tabsSpread
    ? "flex min-w-0 flex-1 basis-0 items-center justify-center px-1.5 py-2 sm:px-2"
    : "inline-flex items-center gap-1.5 px-3 py-2 whitespace-nowrap";

  return (
    <div className={cn("border-b border-border bg-card/30", className)}>
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
              tab.requiredEntitlement && !hasWildcard && !entitlements?.includes(tab.requiredEntitlement);

            if (isLocked) {
              return (
                <TabRow key={tab.href} tab={tab} isActive={false} tabItemClass={tabItemClass}>
                  <span
                    className={cn(
                      "flex min-w-0 flex-1 items-center gap-1 text-sm font-medium cursor-not-allowed text-muted-foreground/40",
                    )}
                    title={`Upgrade to access ${tab.label}`}
                  >
                    <TabLabel tab={tab} spread={tabsSpread} />
                    <Lock className="size-3 shrink-0" />
                  </span>
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
];

// Strategy sub-tabs — shown inside Strategy section pages
export const STRATEGY_SUB_TABS: ServiceTab[] = [
  { label: "Overview", href: "/services/research/strategy/overview" },
  { label: "Backtests", href: "/services/research/strategy/backtests" },
  { label: "Compare", href: "/services/research/strategy/compare" },
  { label: "Results", href: "/services/research/strategy/results" },
  { label: "Heatmap", href: "/services/research/strategy/heatmap" },
  { label: "Candidates", href: "/services/research/strategy/candidates" },
  { label: "Handoff", href: "/services/research/strategy/handoff" },
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
  { label: "Strategies", href: "/services/trading/strategies", icon: Layers, requiredEntitlement: "strategy-families" },
  { label: "Instructions", href: "/services/trading/instructions", icon: ScrollText },
  // ── DeFi family ───────────────────────────────────────────────────────────
  {
    label: "DeFi",
    href: "/services/trading/defi",
    icon: Cpu,
    group: "DeFi",
    familyGroup: "DeFi",
    familyIcon: "Layers",
    exact: true,
    requiredEntitlement: "defi-trading",
  },
  {
    label: "Bundles",
    href: "/services/trading/bundles",
    icon: GitFork,
    group: "DeFi",
    familyGroup: "DeFi",
  },
  {
    label: "Staking",
    href: "/services/trading/defi/staking",
    icon: Layers,
    group: "DeFi",
    familyGroup: "DeFi",
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
    requiredEntitlement: "sports-trading",
  },
  {
    label: "Place Bets",
    href: "/services/trading/sports/bet",
    icon: Zap,
    group: "Sports",
    familyGroup: "Sports",
  },
  {
    label: "Accumulators",
    href: "/services/trading/sports/accumulators",
    icon: GitFork,
    group: "Sports",
    familyGroup: "Sports",
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
    requiredEntitlement: "options-trading",
  },
  {
    label: "Combo Builder",
    href: "/services/trading/options/combos",
    icon: GitFork,
    group: "Options & Futures",
    familyGroup: "Options & Futures",
  },
  {
    label: "Pricing",
    href: "/services/trading/options/pricing",
    matchPrefix: "/services/trading/options/pricing",
    icon: LineChart,
    group: "Options & Futures",
    familyGroup: "Options & Futures",
  },
  // ── Predictions family ────────────────────────────────────────────────────
  {
    label: "Predictions",
    href: "/services/trading/predictions",
    icon: Lightbulb,
    requiredEntitlement: "predictions-trading",
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
];

// ── Manage (Back Office) ─────────────────────────────────────────────────────
export const MANAGE_TABS: ServiceTab[] = [
  { label: "Clients", href: "/services/manage/clients" },
  { label: "Mandates", href: "/services/manage/mandates" },
  { label: "Fees", href: "/services/manage/fees" },
  { label: "Users", href: "/services/manage/users" },
  { label: "Compliance", href: "/services/manage/compliance" },
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
// Grouped: User Management | Operations | Configuration
export const ADMIN_TABS: ServiceTab[] = [
  // ── User Management ─────────────────────────────────────────────────────
  { label: "Users", href: "/admin/users", exact: true },
  { label: "Access Requests", href: "/admin/users/requests" },
  { label: "Catalogue", href: "/admin/users/catalogue", requiredEntitlement: "admin" },
  { label: "Onboard", href: "/admin/users/onboard" },
  { label: "Templates", href: "/admin/users/templates", requiredEntitlement: "admin" },
  { label: "Firebase Users", href: "/admin/users/firebase", requiredEntitlement: "admin" },
  { label: "Health Checks", href: "/admin/users/health-checks", requiredEntitlement: "admin" },
  { label: "Organisations", href: "/admin/organizations", matchPrefix: "/admin/organizations" },
  // ── Operations ──────────────────────────────────────────────────────────
  { label: "Services", href: "/ops/services", group: "Operations" },
  { label: "Jobs", href: "/ops/jobs" },
  { label: "Deployment & Readiness", href: "/devops" },
  { label: "Approvals", href: "/approvals" },
  // ── Configuration ───────────────────────────────────────────────────────
  { label: "Config", href: "/config", group: "Configuration" },
  { label: "Data Admin", href: "/admin/data" },
];

// Alias — user management IS the admin section
export const USER_MGMT_TABS = ADMIN_TABS;

// ── Legacy aliases (for backward compatibility during transition) ─────────────
export const RESEARCH_TABS = BUILD_TABS;
export const EXECUTE_TABS: ServiceTab[] = [
  { label: "Analytics", href: "/services/execution/overview" },
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
