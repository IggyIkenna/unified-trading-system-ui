"use client"

import { ServiceTabs, TRADING_TABS, LIVE_ASOF_VISIBLE } from "@/components/shell/service-tabs"
import { LiveAsOfToggle } from "@/components/platform/live-asof-toggle"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { useAuth } from "@/hooks/use-auth"

export default function TradingServiceLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  return (
    <>
      <ServiceTabs
        tabs={TRADING_TABS}
        entitlements={user?.entitlements}
        rightSlot={LIVE_ASOF_VISIBLE.run ? <LiveAsOfToggle /> : undefined}
      />
      <ErrorBoundary>{children}</ErrorBoundary>
    </>
  )
}
