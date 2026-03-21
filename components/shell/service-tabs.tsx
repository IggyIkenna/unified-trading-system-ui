"use client"

/**
 * ServiceTabs — Row 2 navigation.
 * Role-based contextual quick-nav that changes per active Row 1 (lifecycle) tab.
 * Each service defines its own tab set. Tabs support entitlement-based FOMO locking.
 */

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Lock } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export interface ServiceTab {
  label: string
  href: string
  /** Match pathname prefix for active state (defaults to href) */
  matchPrefix?: string
  /** Entitlement required to access this tab (undefined = always accessible) */
  requiredEntitlement?: string
}

interface ServiceTabsProps {
  tabs: ServiceTab[]
  /** Optional right-side slot for Live/As-Of toggle or other controls */
  rightSlot?: React.ReactNode
  /** User's current entitlements — used for FOMO locking */
  entitlements?: readonly string[]
  className?: string
}

export function ServiceTabs({ tabs, rightSlot, entitlements, className }: ServiceTabsProps) {
  const pathname = usePathname() || ""
  const hasWildcard = entitlements?.includes("*") ?? true

  return (
    <div className={cn("border-b border-border bg-card/30", className)}>
      <div className="flex items-center justify-between px-6">
        <nav className="flex gap-1 pt-3 pb-0 -mb-px overflow-x-auto" aria-label="Service sections">
          {tabs.map((tab) => {
            const matchPath = tab.matchPrefix || tab.href
            const isActive = pathname === tab.href || pathname.startsWith(matchPath + "/")
            const isLocked = tab.requiredEntitlement && !hasWildcard && !entitlements?.includes(tab.requiredEntitlement)

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
              )
            }

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                {tab.label}
              </Link>
            )
          })}
        </nav>

        {rightSlot && (
          <div className="flex items-center gap-2 pl-4 py-2 shrink-0">
            {rightSlot}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Acquire (Data Science / ETL) ─────────────────────────────────────────────
export const DATA_TABS: ServiceTab[] = [
  { label: "Pipeline Status", href: "/service/data/overview" },
  { label: "Coverage Matrix", href: "/service/data/coverage" },
  { label: "Missing Data", href: "/service/data/missing" },
  { label: "Venue Health", href: "/service/data/venues" },
  { label: "Markets", href: "/service/data/markets" },
  { label: "ETL Logs", href: "/service/data/logs" },
]

// ── Build (Quant Developer) ──────────────────────────────────────────────────
export const BUILD_TABS: ServiceTab[] = [
  { label: "Research Hub", href: "/service/research/overview" },
  { label: "Features", href: "/service/research/ml/features", requiredEntitlement: "ml-full" },
  { label: "ML Models", href: "/service/research/ml", matchPrefix: "/service/research/ml", requiredEntitlement: "ml-full" },
  { label: "Strategies", href: "/service/research/strategy/backtests", matchPrefix: "/service/research/strategy", requiredEntitlement: "strategy-full" },
  { label: "Backtests", href: "/service/research/strategy/compare", requiredEntitlement: "strategy-full" },
  { label: "Signals", href: "/service/research/ml/validation", requiredEntitlement: "ml-full" },
  { label: "Execution Research", href: "/service/research/execution/algos", matchPrefix: "/service/research/execution", requiredEntitlement: "execution-basic" },
]

// ── Promote (Trader + Risk Review) ───────────────────────────────────────────
export const PROMOTE_TABS: ServiceTab[] = [
  { label: "Review Queue", href: "/service/research/strategy/candidates" },
  { label: "Execution Analysis", href: "/service/research/execution/tca" },
  { label: "Risk Review", href: "/service/trading/risk" },
  { label: "Approval Status", href: "/service/research/strategy/handoff" },
]

// ── Run (Trader — Live) ──────────────────────────────────────────────────────
export const TRADING_TABS: ServiceTab[] = [
  { label: "Terminal", href: "/service/trading/overview" },
  { label: "Positions", href: "/service/trading/positions" },
  { label: "Orders", href: "/service/trading/orders" },
  { label: "Execution Analytics", href: "/service/execution/overview", matchPrefix: "/service/execution" },
  { label: "Accounts", href: "/service/trading/accounts" },
  { label: "Markets", href: "/service/trading/markets" },
]

// ── Observe (Risk / Ops) ─────────────────────────────────────────────────────
export const OBSERVE_TABS: ServiceTab[] = [
  { label: "Risk Dashboard", href: "/service/trading/risk" },
  { label: "Alerts", href: "/service/trading/alerts" },
  { label: "News", href: "/service/observe/news" },
  { label: "Strategy Health", href: "/service/observe/strategy-health" },
  { label: "System Health", href: "/health" },
]

// ── Manage (Back Office) ─────────────────────────────────────────────────────
export const MANAGE_TABS: ServiceTab[] = [
  { label: "Clients", href: "/manage/clients" },
  { label: "Mandates", href: "/manage/mandates" },
  { label: "Fees", href: "/manage/fees" },
  { label: "Users", href: "/manage/users" },
  { label: "Compliance", href: "/compliance" },
]

// ── Report (Executive) ───────────────────────────────────────────────────────
export const REPORTS_TABS: ServiceTab[] = [
  { label: "P&L", href: "/service/reports/overview" },
  { label: "Executive", href: "/service/reports/executive" },
  { label: "Settlement", href: "/service/reports/settlement" },
  { label: "Reconciliation", href: "/service/reports/reconciliation" },
  { label: "Regulatory", href: "/service/reports/regulatory" },
]

// ── Legacy aliases (for backward compatibility during transition) ─────────────
export const RESEARCH_TABS = BUILD_TABS
export const EXECUTION_TABS: ServiceTab[] = [
  { label: "Analytics", href: "/service/execution/overview" },
  { label: "Algos", href: "/service/execution/algos" },
  { label: "Venues", href: "/service/execution/venues" },
  { label: "TCA", href: "/service/execution/tca" },
  { label: "Benchmarks", href: "/service/execution/benchmarks" },
]

// ── Live/As-Of visibility per service ────────────────────────────────────────
export const LIVE_ASOF_VISIBLE: Record<string, boolean> = {
  acquire: true,
  build: true,
  promote: false,
  run: true,
  observe: true,
  manage: false,
  report: false,
}
