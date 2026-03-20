"use client"

import { ServiceTabs, TRADING_TABS } from "@/components/shell/service-tabs"

export default function TradingServiceLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ServiceTabs tabs={TRADING_TABS} />
      {children}
    </>
  )
}
