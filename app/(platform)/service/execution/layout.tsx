"use client"

import { ServiceTabs, EXECUTION_TABS, LIVE_ASOF_VISIBLE } from "@/components/shell/service-tabs"
import { LiveAsOfToggle } from "@/components/platform/live-asof-toggle"
import { useAuth } from "@/hooks/use-auth"

export default function ExecutionServiceLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  return (
    <>
      <ServiceTabs
        tabs={EXECUTION_TABS}
        entitlements={user?.entitlements}
        rightSlot={LIVE_ASOF_VISIBLE.run ? <LiveAsOfToggle /> : undefined}
      />
      {children}
    </>
  )
}
