"use client"

/**
 * ServiceTabs — consistent tab navigation for each service.
 * Renders as a horizontal tab bar below the lifecycle nav.
 * Each service defines its own tabs, but the layout is identical.
 */

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export interface ServiceTab {
  label: string
  href: string
  /** Match pathname prefix for active state (defaults to href) */
  matchPrefix?: string
}

interface ServiceTabsProps {
  tabs: ServiceTab[]
  className?: string
}

export function ServiceTabs({ tabs, className }: ServiceTabsProps) {
  const pathname = usePathname() || ""

  return (
    <div className={cn("border-b border-border bg-card/50", className)}>
      <div className="px-6 pt-3 pb-0">
        <nav className="flex gap-1 -mb-px" aria-label="Service sections">
          {tabs.map((tab) => {
            const matchPath = tab.matchPrefix || tab.href
            const isActive = pathname === tab.href || pathname.startsWith(matchPath + "/")
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "px-3 py-2 text-sm font-medium border-b-2 transition-colors",
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
      </div>
    </div>
  )
}

// Pre-defined tab configs for each service
export const DATA_TABS: ServiceTab[] = [
  { label: "Pipeline Status", href: "/service/data/overview" },
  { label: "Markets", href: "/service/data/markets" },
]

export const RESEARCH_TABS: ServiceTab[] = [
  { label: "Overview", href: "/service/research/overview" },
  { label: "ML Models", href: "/service/research/ml", matchPrefix: "/service/research/ml" },
  { label: "Strategy", href: "/service/research/strategy/backtests", matchPrefix: "/service/research/strategy" },
  { label: "Execution", href: "/service/research/execution/algos", matchPrefix: "/service/research/execution" },
]

export const TRADING_TABS: ServiceTab[] = [
  { label: "Overview", href: "/service/trading/overview" },
  { label: "Positions", href: "/service/trading/positions" },
  { label: "Risk", href: "/service/trading/risk" },
  { label: "Alerts", href: "/service/trading/alerts" },
  { label: "Markets", href: "/service/trading/markets" },
]

export const EXECUTION_TABS: ServiceTab[] = [
  { label: "Overview", href: "/service/execution/overview" },
  { label: "Algos", href: "/service/execution/algos" },
  { label: "Venues", href: "/service/execution/venues" },
  { label: "TCA", href: "/service/execution/tca" },
  { label: "Benchmarks", href: "/service/execution/benchmarks" },
]

export const REPORTS_TABS: ServiceTab[] = [
  { label: "Reports", href: "/service/reports/overview" },
  { label: "Executive", href: "/service/reports/executive" },
]
