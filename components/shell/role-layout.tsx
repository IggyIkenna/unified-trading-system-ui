"use client"

import * as React from "react"
import { GlobalNavBar, type UserRole } from "@/components/trading/global-nav-bar"
import { ContextBar, useContextState, type ContextState } from "@/components/trading/context-bar"
import { LifecycleRail, type LifecyclePhase } from "@/components/trading/lifecycle-rail"
import { RequireAuth } from "@/components/shell/require-auth"

interface RoleLayoutProps {
  children: React.ReactNode
  currentRole: UserRole
  activeSurface?: string
  showLifecycleRail?: boolean
}

export function RoleLayout({
  children,
  currentRole,
  activeSurface = "trading",
  showLifecycleRail = true,
}: RoleLayoutProps) {
  const { context, setContext } = useContextState()
  const [lifecyclePhase, setLifecyclePhase] = React.useState<LifecyclePhase>("run")

  return (
    <RequireAuth>
    <div className="min-h-screen bg-background flex flex-col">
      {/* Global Navigation Bar - same across all roles */}
      <GlobalNavBar 
        activeSurface={activeSurface} 
        currentRole={currentRole}
      />

      {/* Context Bar - same across all roles */}
      <ContextBar context={context} onContextChange={setContext} />

      {/* Lifecycle Rail - optional based on role */}
      {showLifecycleRail && (
        <LifecycleRail activePhase={lifecyclePhase} onPhaseChange={setLifecyclePhase} />
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 space-y-4 overflow-auto">
        {children}
      </main>
    </div>
    </RequireAuth>
  )
}

// Export context hook for use in role pages
export { useContextState, type ContextState }
