"use client"

/**
 * Unified Shell
 * 
 * Wrapper component that provides the lifecycle navigation shell.
 * This is the strategic destination architecture - not an optional mode.
 * 
 * During transition:
 * - Old routes remain accessible
 * - Legacy nav available via fallback
 * - Architecture converges on lifecycle model
 */

import * as React from "react"
import { usePathname } from "next/navigation"
import { LifecycleNav, LaneIndicator } from "./lifecycle-nav"
import { GlobalNavBar } from "@/components/trading/global-nav-bar"
import { getRouteMapping } from "@/lib/lifecycle-mapping"
import { cn } from "@/lib/utils"

interface UnifiedShellProps {
  children: React.ReactNode
  orgName?: string
  orgId?: string
  userName?: string
  userRole?: string
  useLegacyNav?: boolean // Fallback during transition
  className?: string
}

export function UnifiedShell({
  children,
  orgName = "Odum Internal",
  orgId = "odum-internal",
  userName = "Trader",
  userRole = "internal-trader",
  useLegacyNav = false,
  className,
}: UnifiedShellProps) {
  const pathname = usePathname() || ""
  
  // Get current route mapping for lane indicator
  const routeMapping = getRouteMapping(pathname)
  
  // Public routes don't get the shell
  const publicRoutes = ["/", "/login", "/signup", "/services", "/pricing", "/docs", "/contact", "/presentation", "/demo", "/privacy", "/terms"]
  const isPublicRoute = publicRoutes.some(r => pathname === r || pathname.startsWith(r + "/"))
  
  if (isPublicRoute) {
    return <>{children}</>
  }

  return (
    <div className={cn("min-h-screen bg-background", className)}>
      {/* Navigation */}
      {useLegacyNav ? (
        <GlobalNavBar userName={userName} />
      ) : (
        <LifecycleNav
          orgName={orgName}
          orgId={orgId}
          userName={userName}
          userRole={userRole}
        />
      )}
      
      {/* Context bar with lane indicators */}
      {routeMapping && routeMapping.lanes.length > 0 && !useLegacyNav && (
        <div className="flex items-center justify-between px-4 py-1.5 bg-muted/30 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{routeMapping.label}</span>
            <LaneIndicator lanes={routeMapping.lanes} />
          </div>
          {routeMapping.secondaryStage && (
            <span className="text-[10px] text-muted-foreground">
              Also relates to: {routeMapping.secondaryStage}
            </span>
          )}
        </div>
      )}
      
      {/* Main content */}
      <main>
        {children}
      </main>
    </div>
  )
}

// Hook to check if we should use lifecycle nav
export function useLifecycleNav() {
  const [useLegacy, setUseLegacy] = React.useState(false)
  
  React.useEffect(() => {
    // Check localStorage for user preference during transition
    const pref = localStorage.getItem("nav-preference")
    if (pref === "legacy") {
      setUseLegacy(true)
    }
  }, [])
  
  return { useLegacy, setUseLegacy }
}
