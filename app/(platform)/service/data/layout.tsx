"use client"

import { ServiceTabs, DATA_TABS } from "@/components/shell/service-tabs"

export default function DataServiceLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ServiceTabs tabs={DATA_TABS} />
      {children}
    </>
  )
}
