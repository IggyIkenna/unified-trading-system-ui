"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { LifecycleNav } from "./lifecycle-nav"
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

  const publicRoutes = ["/", "/login", "/signup", "/services", "/pricing", "/docs", "/contact", "/presentation", "/demo", "/privacy", "/terms"]
  const isPublicRoute = publicRoutes.some(r => pathname === r || pathname.startsWith(r + "/"))

  if (isPublicRoute) {
    return <>{children}</>
  }

  return (
    <div className={cn("min-h-screen bg-background", className)}>
      <LifecycleNav
        orgName={orgName}
        orgId={orgId}
        userName={userName}
        userRole={userRole}
      />
      <main>
        {children}
      </main>
    </div>
  )
}
