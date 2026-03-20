"use client"

/**
 * Platform Layout
 * 
 * Shell for THE product - same for internal AND client users.
 * Auth required, sidebar, entitlement-driven navigation.
 */

import * as React from "react"
import { RequireAuth } from "@/components/shell/require-auth"
import { UnifiedShell } from "@/components/shell/unified-shell"
import { useAuth } from "@/hooks/use-auth"

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = useAuth()
  
  // Default values for shell - will be replaced by persona data
  const orgName = user?.org || "Odum Research"
  const userName = user?.email?.split("@")[0] || "Trader"
  const userRole = user?.role || "internal-trader"
  
  return (
    <RequireAuth loginHref="/login">
      <UnifiedShell
        orgName={orgName}
        userName={userName}
        userRole={userRole}
      >
        {children}
      </UnifiedShell>
    </RequireAuth>
  )
}
