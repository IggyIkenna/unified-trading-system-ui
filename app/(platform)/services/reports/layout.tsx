"use client"

import { ServiceTabs, REPORTS_TABS } from "@/components/shell/service-tabs"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { EntitlementGate } from "@/components/platform/entitlement-gate"
import { useAuth } from "@/hooks/use-auth"

export default function ReportsServiceLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  return (
    <>
      <ServiceTabs tabs={REPORTS_TABS} entitlements={user?.entitlements} />
      <EntitlementGate entitlement="reporting" serviceName="Reports">
        <ErrorBoundary>{children}</ErrorBoundary>
      </EntitlementGate>
    </>
  )
}
