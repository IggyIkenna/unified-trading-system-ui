"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { LifecycleNav } from "./lifecycle-nav"
import { Breadcrumbs } from "./breadcrumbs"
import { DebugFooter } from "./debug-footer"
import { CommandPalette } from "./command-palette"
import { RuntimeModeStrip } from "./runtime-mode-strip"
import { GuidedTour } from "@/components/platform/guided-tour"
import { cn } from "@/lib/utils"

interface UnifiedShellProps {
  children: React.ReactNode
  orgName?: string
  orgId?: string
  userName?: string
  userRole?: string
  className?: string
}

export function UnifiedShell({
  children,
  orgName = "Odum Internal",
  orgId = "odum-internal",
  userName = "Trader",
  userRole = "internal-trader",
  className,
}: UnifiedShellProps) {
  const pathname = usePathname() || ""
  const [cmdkOpen, setCmdkOpen] = React.useState(false)

  // Global Cmd+K shortcut
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setCmdkOpen(o => !o)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const publicRoutes = ["/", "/login", "/signup", "/services", "/pricing", "/docs", "/contact", "/presentation", "/demo", "/privacy", "/terms"]
  const isPublicRoute = publicRoutes.some(r => pathname === r || pathname.startsWith(r + "/"))

  if (isPublicRoute) {
    return <>{children}</>
  }

  return (
    <div className={cn("min-h-screen bg-background", className)}>
      <CommandPalette open={cmdkOpen} onOpenChange={setCmdkOpen} />
      <LifecycleNav
        orgName={orgName}
        orgId={orgId}
        userName={userName}
        userRole={userRole}
      />
      <RuntimeModeStrip />
      <Breadcrumbs />
      <main className="pb-10">
        {children}
      </main>
      <DebugFooter />
      <GuidedTour />
    </div>
  )
}
