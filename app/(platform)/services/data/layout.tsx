"use client"

import { ServiceTabs, DATA_TABS, LIVE_ASOF_VISIBLE } from "@/components/shell/service-tabs"
import { LiveAsOfToggle } from "@/components/platform/live-asof-toggle"
import { GlobalScopeFilters } from "@/components/platform/global-scope-filters"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { EntitlementGate } from "@/components/platform/entitlement-gate"
import { useAuth } from "@/hooks/use-auth"

export default function DataServiceLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  return (
    <>
      <ServiceTabs
        tabs={DATA_TABS}
        entitlements={user?.entitlements}
        rightSlot={
          <div className="flex items-center gap-3">
            <GlobalScopeFilters />
            {LIVE_ASOF_VISIBLE.acquire && <LiveAsOfToggle />}
          </div>
        }
      />
      <EntitlementGate entitlement="data-basic" serviceName="Data">
        <ErrorBoundary>{children}</ErrorBoundary>
      </EntitlementGate>
    </>
  )
}
