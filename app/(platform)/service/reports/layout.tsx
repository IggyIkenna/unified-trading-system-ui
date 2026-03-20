"use client"

import { ServiceTabs, REPORTS_TABS } from "@/components/shell/service-tabs"

export default function ReportsServiceLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ServiceTabs tabs={REPORTS_TABS} />
      {children}
    </>
  )
}
