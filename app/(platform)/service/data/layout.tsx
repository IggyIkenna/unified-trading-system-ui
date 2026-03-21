"use client"

import { ServiceTabs, DATA_TABS, LIVE_ASOF_VISIBLE } from "@/components/shell/service-tabs"
import { LiveAsOfToggle } from "@/components/platform/live-asof-toggle"
import { useAuth } from "@/hooks/use-auth"

export default function DataServiceLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  return (
    <>
      <ServiceTabs
        tabs={DATA_TABS}
        entitlements={user?.entitlements}
        rightSlot={LIVE_ASOF_VISIBLE.acquire ? <LiveAsOfToggle /> : undefined}
      />
      {children}
    </>
  )
}
