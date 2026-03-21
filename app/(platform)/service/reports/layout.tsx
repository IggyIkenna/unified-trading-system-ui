"use client"

import { ServiceTabs, REPORTS_TABS } from "@/components/shell/service-tabs"
import { useAuth } from "@/hooks/use-auth"

export default function ReportsServiceLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  return (
    <>
      <ServiceTabs tabs={REPORTS_TABS} entitlements={user?.entitlements} />
      {children}
    </>
  )
}
