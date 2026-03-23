"use client"

import * as React from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Users, UserPlus, Search, ChevronRight } from "lucide-react"
import { useProvisionedUsers } from "@/hooks/api/use-user-management"
import type { ProvisionedPerson, ProvisioningStatus } from "@/lib/types/user-management"

function statusVariant(s: ProvisioningStatus) {
  if (s === "provisioned") return "default" as const
  if (s === "failed") return "destructive" as const
  if (s === "pending") return "secondary" as const
  return "outline" as const
}

export default function AdminUsersPage() {
  const { data, isLoading } = useProvisionedUsers()
  const [search, setSearch] = React.useState("")

  const users = React.useMemo(() => {
    const all = data?.users ?? []
    if (!search) return all
    const q = search.toLowerCase()
    return all.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    )
  }, [data, search])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" /> User Management
          </h1>
          <p className="text-muted-foreground">Manage user lifecycle — onboard, modify, offboard</p>
        </div>
        <Link href="/admin/users/onboard">
          <Button><UserPlus className="h-4 w-4 mr-2" /> Onboard User</Button>
        </Link>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading users...</div>
      ) : (
        <div className="grid gap-3">
          {users.map((user) => (
            <UserRow key={user.firebase_uid} user={user} />
          ))}
          {users.length === 0 && (
            <p className="text-muted-foreground text-center py-8">No users found.</p>
          )}
        </div>
      )}
    </div>
  )
}

function UserRow({ user }: { user: ProvisionedPerson }) {
  const serviceEntries = Object.entries(user.services) as [string, ProvisioningStatus][]
  return (
    <Link href={`/admin/users/${user.firebase_uid}`}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
        <CardContent className="flex items-center justify-between py-4">
          <div className="space-y-1">
            <div className="font-medium">{user.name}</div>
            <div className="text-sm text-muted-foreground">{user.email}</div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={user.status === "active" ? "default" : "secondary"}>
              {user.status}
            </Badge>
            <Badge variant="outline">{user.role}</Badge>
            <div className="flex gap-1">
              {serviceEntries.map(([svc, status]) => (
                <Badge key={svc} variant={statusVariant(status)} className="text-xs">
                  {svc.slice(0, 3)}
                </Badge>
              ))}
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
