"use client"

import { ServiceTabs, MANAGE_TABS } from "@/components/shell/service-tabs"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { useAuth } from "@/hooks/use-auth"

export default function ManageLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  return (
    <>
      <ServiceTabs tabs={MANAGE_TABS} entitlements={user?.entitlements} />
      <ErrorBoundary>{children}</ErrorBoundary>
    </>
  )
}
