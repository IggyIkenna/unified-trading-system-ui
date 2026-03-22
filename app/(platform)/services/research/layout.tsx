"use client"

import { ServiceTabs, BUILD_TABS, LIVE_ASOF_VISIBLE } from "@/components/shell/service-tabs"
import { LiveAsOfToggle } from "@/components/platform/live-asof-toggle"
import { GlobalScopeFilters } from "@/components/platform/global-scope-filters"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { EntitlementGate } from "@/components/platform/entitlement-gate"
import { useAuth } from "@/hooks/use-auth"

export default function ResearchServiceLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  return (
    <>
      <ServiceTabs
        tabs={BUILD_TABS}
        entitlements={user?.entitlements}
        rightSlot={
          <div className="flex items-center gap-3">
            <GlobalScopeFilters />
            {LIVE_ASOF_VISIBLE.build && <LiveAsOfToggle />}
          </div>
        }
      />
      <EntitlementGate entitlement="strategy-full" serviceName="Research & Backtesting">
        <ErrorBoundary>{children}</ErrorBoundary>
      </EntitlementGate>
    </>
  )
}
