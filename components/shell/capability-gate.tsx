"use client"

import * as React from "react"
import { useAppAccess } from "@/hooks/use-app-access"

interface CapabilityGateProps {
  capability?: string
  anyOf?: string[]
  fallback?: React.ReactNode
  children: React.ReactNode
}

/**
 * Inline guard — renders children only if the user has the required capability.
 * Use for hiding individual buttons, sections, or nav items.
 *
 * <CapabilityGate capability="trading.execute">
 *   <PlaceOrderButton />
 * </CapabilityGate>
 *
 * <CapabilityGate anyOf={["reports.view", "reports.export"]}>
 *   <ReportsSection />
 * </CapabilityGate>
 */
export function CapabilityGate({
  capability,
  anyOf,
  fallback = null,
  children,
}: CapabilityGateProps) {
  const { hasCapability, hasAnyCapability, loading } = useAppAccess()

  if (loading) return null

  if (capability && hasCapability(capability)) {
    return <>{children}</>
  }

  if (anyOf && hasAnyCapability(...anyOf)) {
    return <>{children}</>
  }

  if (!capability && !anyOf) {
    return <>{children}</>
  }

  return <>{fallback}</>
}
