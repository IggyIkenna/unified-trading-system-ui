"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Building2, Users, DollarSign, Shield, Clock, ArrowRight,
  Plus, CreditCard, FileText, Activity,
} from "lucide-react"
import { useOrganizationsList } from "@/hooks/api/use-organizations"
import { useAuditEvents } from "@/hooks/api/use-audit"

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

const ACTION_ICONS: Record<string, string> = {
  "role.changed": "Role",
  "org.created": "Org",
  "user.invited": "Invite",
  "subscription.upgraded": "Sub",
  "fee.updated": "Fee",
  "api_key.rotated": "Key",
  "user.suspended": "User",
}

export default function AdminDashboardPage() {
  const { data: orgsData } = useOrganizationsList()
  const { data: eventsData } = useAuditEvents()

  const orgs: Array<{ id: string; name: string; type: string; status: string; memberCount: number; subscriptionTier: string; monthlyFee?: number }> = (orgsData as Record<string, unknown>)?.organizations as typeof orgs ?? []
  const events: Array<{ id: string; type: string; entity: string; actor: string; timestamp: string; details: string }> = (eventsData as Record<string, unknown>)?.events as typeof events ?? []

  const totalUsers = orgs.reduce((sum: number, o) => sum + (o.memberCount ?? 0), 0)
  const activeOrgs = orgs.filter((o) => o.status === "active").length
  const mrr = orgs.reduce((sum: number, o) => sum + (o.monthlyFee ?? 0), 0)

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border">
        <div className="container px-4 py-6 md:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Organization management, users, and system overview
              </p>
            </div>
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
              <Shield className="mr-1.5 size-3" />
              Admin
            </Badge>
          </div>
        </div>
      </div>

      <div className="container px-4 py-8 md:px-6 space-y-8">
        {/* System Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-sky-500/20 bg-sky-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-3xl font-bold font-mono text-sky-400">{totalUsers}</p>
                </div>
                <div className="rounded-lg bg-sky-500/10 p-3">
                  <Users className="size-6 text-sky-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-emerald-500/20 bg-emerald-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Orgs</p>
                  <p className="text-3xl font-bold font-mono text-emerald-400">{activeOrgs}</p>
                </div>
                <div className="rounded-lg bg-emerald-500/10 p-3">
                  <Building2 className="size-6 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">MRR</p>
                  <p className="text-3xl font-bold font-mono text-amber-400">
                    ${mrr.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg bg-amber-500/10 p-3">
                  <DollarSign className="size-6 text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <Link href="/service/manage/clients">
              <Plus className="mr-2 size-4" />
              Create Org
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/service/manage/fees">
              <CreditCard className="mr-2 size-4" />
              Manage Subscriptions
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              toast.info("Audit log opened")
              const el = document.getElementById("audit-events")
              el?.scrollIntoView({ behavior: "smooth" })
            }}
          >
            <FileText className="mr-2 size-4" />
            View Audit Log
          </Button>
        </div>

        {/* Organization Cards */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Organizations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {orgs.map((org) => (
              <Card key={org.id} className="hover:border-foreground/20 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{org.name}</CardTitle>
                    <Badge
                      variant={org.status === "active" ? "default" : "secondary"}
                      className={
                        org.status === "active"
                          ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                          : org.status === "onboarding"
                            ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                            : "bg-red-500/20 text-red-400"
                      }
                    >
                      {org.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    {org.type === "internal" ? "Internal Team" : "Client Organization"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Members</p>
                      <p className="font-mono font-medium">{org.memberCount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Tier</p>
                      <p className="font-medium capitalize">{org.subscriptionTier}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="w-full" asChild>
                    <Link href="/service/manage/clients">
                      Manage
                      <ArrowRight className="ml-2 size-3" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Audit Events */}
        <div id="audit-events">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Admin Events</h2>
            <Badge variant="outline" className="text-xs">
              <Activity className="mr-1 size-3" />
              {events.length} events
            </Badge>
          </div>
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-1">
                {events.slice(0, 10).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 rounded-md px-3 py-2.5 hover:bg-accent/30 transition-colors"
                  >
                    <Badge variant="secondary" className="text-[10px] min-w-[3.5rem] justify-center">
                      {ACTION_ICONS[event.type] ?? event.type.split(".")[0]}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">
                        <span className="font-medium">{event.actor}</span>
                        {" "}
                        <span className="text-muted-foreground">{event.details}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                      <Clock className="size-3" />
                      {formatRelativeTime(event.timestamp)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
