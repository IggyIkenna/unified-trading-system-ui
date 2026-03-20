"use client"

import { ServiceTabs, TRADING_TABS } from "@/components/shell/service-tabs"

export default function TradingServiceLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ServiceTabs serviceName="Live Trading Platform" tabs={TRADING_TABS} />
      {children}
    </>
  )
}
