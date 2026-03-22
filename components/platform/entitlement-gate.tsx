"use client"

/**
 * EntitlementGate — wraps service page content.
 * If user has the required entitlement, renders children.
 * Otherwise, shows UpgradeCard with the FOMO lock effect.
 */

import { useAuth } from "@/hooks/use-auth"
import { UpgradeCard } from "./upgrade-card"
import type { Entitlement } from "@/lib/config/auth"

interface EntitlementGateProps {
  entitlement: Entitlement
  serviceName: string
  description?: string
  children: React.ReactNode
}

export function EntitlementGate({ entitlement, serviceName, description, children }: EntitlementGateProps) {
  const { hasEntitlement, isAdmin, isInternal } = useAuth()

  // Admin and internal users see everything
  if (isAdmin() || isInternal()) return <>{children}</>

  // Check entitlement
  if (hasEntitlement(entitlement)) return <>{children}</>

  // Show upgrade card
  return (
    <div className="p-8">
      <UpgradeCard
        serviceName={serviceName}
        description={description ?? `Your current subscription doesn't include access to ${serviceName}. Contact us to upgrade and unlock this capability.`}
      />
    </div>
  )
}
