"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { GlobalNavBar } from "./global-nav-bar"
import { LifecycleRail } from "./lifecycle-rail"
import { BreadcrumbNav, type BreadcrumbItem } from "./breadcrumb-nav"
import { ContextBar, type ContextState, useContextState } from "./context-bar"

type LifecyclePhase =
  | "design"
  | "simulate"
  | "promote"
  | "run"
  | "monitor"
  | "explain"
  | "reconcile"

interface AppShellProps {
  activeSurface?: string
  activePhase?: LifecyclePhase
  breadcrumbs?: BreadcrumbItem[]
  showLifecycleRail?: boolean
  showContextBar?: boolean
  // Control which context levels are available for this surface
  contextLevels?: {
    organization?: boolean
    client?: boolean
    strategy?: boolean
    underlying?: boolean
  }
  // Initial context state
  initialContext?: Partial<ContextState>
  // Callback when context changes
  onContextChange?: (context: ContextState) => void
  children: React.ReactNode
  className?: string
  sidebar?: React.ReactNode
}

export function AppShell({
  activeSurface = "trading",
  activePhase = "run",
  breadcrumbs,
  showLifecycleRail = true,
  showContextBar = true,
  contextLevels = { organization: true, client: true, strategy: true, underlying: true },
  initialContext,
  onContextChange,
  children,
  className,
  sidebar,
}: AppShellProps) {
  const { context, setContext } = useContextState(initialContext)

  const handleContextChange = React.useCallback(
    (newContext: ContextState) => {
      setContext(newContext)
      onContextChange?.(newContext)
    },
    [setContext, onContextChange]
  )

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Global Navigation - 40px */}
      <GlobalNavBar activeSurface={activeSurface} />

      {/* Context Bar - Hierarchical filter selection */}
      {showContextBar && (
        <ContextBar
          context={context}
          onContextChange={handleContextChange}
          availableLevels={contextLevels}
        />
      )}

      {/* Lifecycle Rail - optional */}
      {showLifecycleRail && <LifecycleRail activePhase={activePhase} />}

      {/* Breadcrumb Navigation */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <BreadcrumbNav items={breadcrumbs} className="border-b border-border" />
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Optional Sidebar */}
        {sidebar && (
          <aside className="w-56 border-r border-border bg-[#0a0a0b] flex-shrink-0 overflow-y-auto">
            {sidebar}
          </aside>
        )}

        {/* Content */}
        <main
          className={cn(
            "flex-1 overflow-y-auto p-6",
            className
          )}
        >
          {children}
        </main>
      </div>
    </div>
  )
}

// Re-export context types for convenience
export type { ContextState }
export { useContextState }
