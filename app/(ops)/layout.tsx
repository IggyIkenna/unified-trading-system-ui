"use client"

import { RequireAuth } from "@/components/shell/require-auth"
import { UnifiedShell } from "@/components/shell/unified-shell"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import * as React from "react"

/**
 * Ops shell — internal-only admin/operations pages.
 * Requires auth + role = "internal" or "admin". Clients get 403.
 */
export default function OpsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RequireAuth>
      <OpsShellInner>{children}</OpsShellInner>
    </RequireAuth>
  )
}

function OpsShellInner({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const router = useRouter()

  const isAuthorized =
    user?.role === "internal" ||
    user?.role === "admin" ||
    user?.role === "Internal Trader"

  React.useEffect(() => {
    if (user && !isAuthorized) {
      router.replace("/trading")
    }
  }, [user, isAuthorized, router])

  if (!user || !isAuthorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">
            This area is restricted to internal users.
          </p>
        </div>
      </div>
    )
  }

  return (
    <UnifiedShell
      orgName="Odum Internal"
      userName={user.email?.split("@")[0] ?? "Admin"}
      userRole={user.role ?? "admin"}
    >
      {children}
    </UnifiedShell>
  )
}
