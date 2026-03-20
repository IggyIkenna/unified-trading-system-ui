"use client"

import { ServiceTabs, EXECUTION_TABS } from "@/components/shell/service-tabs"

export default function ExecutionServiceLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ServiceTabs tabs={EXECUTION_TABS} />
      {children}
    </>
  )
}
