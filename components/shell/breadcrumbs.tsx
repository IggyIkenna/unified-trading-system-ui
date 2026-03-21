"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { getRouteMapping, lifecycleStages } from "@/lib/lifecycle-mapping"

export function Breadcrumbs() {
  const pathname = usePathname() || ""

  // Don't show on dashboard or top-level routes
  if (!pathname.startsWith("/services/")) return null

  const mapping = getRouteMapping(pathname)
  if (!mapping) return null

  const stage = lifecycleStages[mapping.primaryStage]

  // Build crumbs from URL segments: /services/data/coverage -> ["data", "coverage"]
  const segments = pathname.replace("/services/", "").split("/").filter(Boolean)
  const serviceName = segments[0] // e.g. "data", "trading", "research", "execution", "manage", "reports", "observe"
  const pageName = segments.length > 1 ? segments[segments.length - 1] : null

  // Service display names
  const serviceLabels: Record<string, string> = {
    data: "Data",
    research: "Research",
    execution: "Execution",
    trading: "Trading",
    observe: "Observe",
    manage: "Manage",
    reports: "Reports",
  }

  // Capitalize and clean page name
  const formatLabel = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, " ")

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 px-6 py-2 text-xs text-muted-foreground border-b border-border/50 bg-background/50">
      <Link href="/dashboard" className="hover:text-foreground transition-colors">
        {stage.label}
      </Link>
      <ChevronRight className="size-3" />
      <Link href={`/services/${serviceName}`} className="hover:text-foreground transition-colors">
        {serviceLabels[serviceName] ?? formatLabel(serviceName)}
      </Link>
      {pageName && pageName !== "overview" && pageName !== serviceName && (
        <>
          <ChevronRight className="size-3" />
          <span className="text-foreground font-medium">{mapping.label || formatLabel(pageName)}</span>
        </>
      )}
    </nav>
  )
}
