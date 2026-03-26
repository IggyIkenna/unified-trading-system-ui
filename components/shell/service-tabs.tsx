"use client";

/**
 * ServiceTabs — Row 2 navigation.
 * Role-based contextual quick-nav that changes per active Row 1 (lifecycle) tab.
 * Each service defines its own tab set. Tabs support entitlement-based FOMO locking.
 */

import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface ServiceTab {
  label: string;
  href: string;
  /** Match pathname prefix for active state (defaults to href) */
  matchPrefix?: string;
  /** If true, only `href` matches (no prefix) — use for section index routes like `/ml` vs `/ml/training` */
  exact?: boolean;
  /** Entitlement required to access this tab (undefined = always accessible) */
  requiredEntitlement?: string;
  /** When true, tab is visible but not navigable (e.g. promote lifecycle gating) */
  navDisabled?: boolean;
  navDisabledTitle?: string;
}

interface ServiceTabsProps {
  tabs: ServiceTab[];
  /** Optional right-side slot for Live/As-Of toggle or other controls */
  rightSlot?: React.ReactNode;
  /** User's current entitlements — used for FOMO locking */
  entitlements?: readonly string[];
  className?: string;
}

export function ServiceTabs({
  tabs,
  rightSlot,
  entitlements,
  className,
}: ServiceTabsProps) {
  const pathname = usePathname() || "";
  const hasWildcard = entitlements?.includes("*") ?? true;

  return (
    <div className={cn("border-b border-border bg-card/30", className)}>
      <div className="flex items-center justify-between px-6">
        <nav
          className="flex gap-1 pt-3 pb-0 -mb-px overflow-x-auto [-webkit-overflow-scrolling:touch]"
          aria-label="Service sections"
        >
          {tabs.map((tab) => {
            const matchPath = tab.matchPrefix || tab.href;
            const isActive = tab.exact
              ? pathname === tab.href || pathname === `${tab.href}/`
              : pathname === tab.href || pathname.startsWith(matchPath + "/");
            const isLocked =
              tab.requiredEntitlement &&
              !hasWildcard &&
              !entitlements?.includes(tab.requiredEntitlement);

            if (isLocked) {
              return (
                <span
                  key={tab.href}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium border-b-2 border-transparent text-muted-foreground/40 cursor-not-allowed"
                  title={`Upgrade to access ${tab.label}`}
                >
                  {tab.label}
                  <Lock className="size-3" />
                </span>
              );
            }

            if (tab.navDisabled) {
              return (
                <span
                  key={tab.href}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium border-b-2 border-transparent text-muted-foreground/40 cursor-not-allowed whitespace-nowrap"
                  title={tab.navDisabledTitle ?? "Not available"}
                >
                  {tab.label}
                  <Lock className="size-3 shrink-0" />
                </span>
              );
            }

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        {rightSlot && (
          <div className="flex items-center gap-2 pl-4 py-2 shrink-0">
            {rightSlot}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Acquire (Data Science / ETL) ─────────────────────────────────────────────
export const DATA_TABS: ServiceTab[] = [
  { label: "Overview", href: "/services/data/overview" },
  { label: "Instruments", href: "/services/data/instruments" },
  { label: "Raw Data", href: "/services/data/raw" },
  { label: "Events", href: "/services/data/events" },
  { label: "Processing", href: "/services/data/processing" },
  { label: "Coverage", href: "/services/data/coverage" },
  { label: "Gaps & Quality", href: "/services/data/gaps" },
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
export const TRADING_TABS: ServiceTab[] = [
  { label: "Overview", href: "/services/trading/overview" },
  { label: "Terminal", href: "/services/trading/terminal" },
  { label: "DeFi Ops", href: "/services/trading/defi" },
  { label: "Options & Futures", href: "/services/trading/options" },
  { label: "Sports", href: "/services/trading/sports" },
  { label: "Predictions", href: "/services/trading/predictions" },
  { label: "Bundles", href: "/services/trading/bundles" },
  { label: "Instructions", href: "/services/trading/instructions" },
  { label: "Positions", href: "/services/trading/positions" },
  { label: "Orders", href: "/services/trading/orders" },
  { label: "Alerts", href: "/services/trading/alerts" },
  { label: "Book Trade", href: "/services/trading/book" },
  { label: "Accounts", href: "/services/trading/accounts" },
  { label: "P&L Breakdown", href: "/services/trading/pnl" },
  { label: "Risk", href: "/services/trading/risk" },
  { label: "Markets", href: "/services/trading/markets" },
];

// ── Observe (Risk / Ops) ─────────────────────────────────────────────────────
export const OBSERVE_TABS: ServiceTab[] = [
  { label: "Risk Dashboard", href: "/services/observe/risk" },
  { label: "Alerts", href: "/services/observe/alerts" },
  { label: "News", href: "/services/observe/news" },
  { label: "Strategy Health", href: "/services/observe/strategy-health" },
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
  { label: "Executive", href: "/services/reports/executive" },
  { label: "Settlement", href: "/services/reports/settlement" },
  { label: "Reconciliation", href: "/services/reports/reconciliation" },
  { label: "Regulatory", href: "/services/reports/regulatory" },
];

// ── Admin/Ops (Internal Operations) ─────────────────────────────────────────
export const ADMIN_TABS: ServiceTab[] = [
  { label: "Users", href: "/admin/users" },
  { label: "Access Requests", href: "/admin/users/requests" },
  { label: "Onboard", href: "/admin/users/onboard" },
  { label: "Catalogue", href: "/admin/users/catalogue" },
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
