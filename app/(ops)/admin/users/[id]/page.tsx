"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Edit, UserMinus, RefreshCw } from "lucide-react"
import { useProvisionedUser, useUserWorkflows, useReprovisionUser } from "@/hooks/api/use-user-management"
import type { ProvisioningStatus } from "@/lib/types/user-management"

function statusVariant(s: ProvisioningStatus) {
  if (s === "provisioned") return "default" as const
  if (s === "failed") return "destructive" as const
  if (s === "pending") return "secondary" as const
  return "outline" as const
}

export default function UserDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { data, isLoading } = useProvisionedUser(params.id)
  const workflows = useUserWorkflows(params.id)
  const reprovision = useReprovisionUser()

  if (isLoading) return <div className="p-6 text-muted-foreground">Loading...</div>
  const user = data?.user
  if (!user) return <div className="p-6">User not found.</div>

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/admin/users")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{user.name}</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Link href={`/admin/users/${params.id}/modify`}>
            <Button variant="outline"><Edit className="h-4 w-4 mr-2" /> Modify</Button>
          </Link>
          <Link href={`/admin/users/${params.id}/offboard`}>
            <Button variant="destructive"><UserMinus className="h-4 w-4 mr-2" /> Offboard</Button>
          </Link>
          <Button
            variant="outline"
            onClick={() => reprovision.mutate(params.id)}
            disabled={reprovision.isPending}
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Reprovision
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><span className="text-muted-foreground">Role:</span> <Badge variant="outline">{user.role}</Badge></div>
            <div><span className="text-muted-foreground">Status:</span> <Badge variant={user.status === "active" ? "default" : "secondary"}>{user.status}</Badge></div>
            <div><span className="text-muted-foreground">GitHub:</span> {user.github_handle || "—"}</div>
            <div><span className="text-muted-foreground">Products:</span> {user.product_slugs.join(", ") || "—"}</div>
            <div><span className="text-muted-foreground">Template:</span> {user.access_template?.name || "None"}</div>
            <div><span className="text-muted-foreground">Provisioned:</span> {user.provisioned_at}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Services</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(Object.entries(user.services) as [string, ProvisioningStatus][]).map(([svc, status]) => (
              <div key={svc} className="flex items-center justify-between">
                <span className="capitalize text-sm">{svc}</span>
                <Badge variant={statusVariant(status)}>{status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Workflow History</CardTitle></CardHeader>
        <CardContent>
          {workflows.data?.runs.length === 0 && (
            <p className="text-muted-foreground text-sm">No workflow runs.</p>
          )}
          {workflows.data?.runs.map((run) => (
            <div key={run.id} className="flex items-center justify-between py-2 border-b last:border-0">
              <div className="text-sm">
                <span className="font-medium">{run.run_type}</span>
                <span className="text-muted-foreground ml-2">{run.workflow_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{run.status}</Badge>
                <span className="text-xs text-muted-foreground">{run.created_at}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
