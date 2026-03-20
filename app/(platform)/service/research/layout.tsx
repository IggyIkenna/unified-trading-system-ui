"use client"

import { ServiceTabs, RESEARCH_TABS } from "@/components/shell/service-tabs"

export default function ResearchServiceLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ServiceTabs serviceName="Research & Backtesting" tabs={RESEARCH_TABS} />
      {children}
    </>
  )
}
