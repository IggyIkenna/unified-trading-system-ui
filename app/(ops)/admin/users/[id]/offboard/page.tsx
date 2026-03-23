"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, AlertTriangle } from "lucide-react"
import { useProvisionedUser, useOffboardUser } from "@/hooks/api/use-user-management"

export default function OffboardUserPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { data } = useProvisionedUser(params.id)
  const offboard = useOffboardUser()
  const user = data?.user

  if (!user) return <div className="p-6 text-muted-foreground">Loading...</div>

  const handleOffboard = () => {
    offboard.mutate(
      { id: params.id, actions: {} },
      { onSuccess: () => router.push("/admin/users") }
    )
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/admin/users/${params.id}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Offboard — {user.name}</h1>
      </div>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" /> Confirm Offboarding
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This will revoke access across all provisioned services for <strong>{user.name}</strong> ({user.email}).
          </p>
          <div className="flex gap-2">
            {Object.entries(user.services).map(([svc, status]) => (
              <Badge key={svc} variant={status === "provisioned" ? "default" : "outline"}>
                {svc}
              </Badge>
            ))}
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="destructive" onClick={handleOffboard} disabled={offboard.isPending}>
              {offboard.isPending ? "Offboarding..." : "Confirm Offboard"}
            </Button>
            <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
          </div>
          {offboard.isSuccess && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-green-600">Offboarding complete.</p>
              {offboard.data?.revocation_steps?.map((step) => (
                <div key={step.service} className="flex items-center justify-between text-sm">
                  <span>{step.label}</span>
                  <Badge variant={step.status === "success" ? "default" : "destructive"}>{step.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
