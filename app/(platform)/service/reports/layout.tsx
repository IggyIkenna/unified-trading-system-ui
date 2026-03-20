"use client"

import { ServiceTabs, REPORTS_TABS } from "@/components/shell/service-tabs"

export default function ReportsServiceLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ServiceTabs serviceName="Reports" tabs={REPORTS_TABS} />
      {children}
    </>
  )
}
