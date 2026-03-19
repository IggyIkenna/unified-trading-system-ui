"use client"

/**
 * Ops Layout
 * 
 * Shell for internal-only admin/ops pages.
 * Auth required + role="internal" required.
 */

import * as React from "react"
import { useRouter } from "next/navigation"
import { RequireAuth } from "@/components/shell/require-auth"
import { UnifiedShell } from "@/components/shell/unified-shell"
import { useAuth } from "@/hooks/use-auth"
import { AlertTriangle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

function OpsAccessGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }
  
  // Check if user is internal (has "*" entitlements or role is internal)
  const isInternal = user?.role === "Internal Trader" || 
                     user?.role === "internal-trader" ||
                     user?.services?.includes("whitelabel")
  
  if (!isInternal) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="size-5 text-destructive" />
            </div>
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>
              This area is restricted to Odum internal users only.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => router.push("/trading")}>
              Go to Trading
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return <>{children}</>
}

export default function OpsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = useAuth()
  
  const orgName = "Odum Internal"
  const userName = user?.email?.split("@")[0] || "Admin"
  const userRole = "internal-ops"
  
  return (
    <RequireAuth loginHref="/login">
      <OpsAccessGate>
        <UnifiedShell
          orgName={orgName}
          userName={userName}
          userRole={userRole}
        >
          {children}
        </UnifiedShell>
      </OpsAccessGate>
    </RequireAuth>
  )
}
