"use client"

import * as React from "react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { ServiceHub } from "@/components/platform/service-hub"
import { ActivityFeed } from "@/components/platform/activity-feed"
import { QuickActions } from "@/components/platform/quick-actions"
import { HealthBar } from "@/components/platform/health-bar"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Calendar, Clock } from "lucide-react"

export default function OverviewPage() {
  const { user, isInternal } = useAuth()

  if (!user) return null

  const now = new Date()
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening"

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar: greeting + health */}
      <div className="border-b border-border">
        <div className="container px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              {greeting}, {user.displayName.split(" ")[0]}
              <Sparkles className="size-4 text-primary" />
            </h1>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="size-3" />
                {now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                {now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
              </span>
              <Badge variant="outline" className={
                user.role === "admin" ? "border-red-500/30 text-red-400 text-[10px]" :
                user.role === "internal" ? "border-emerald-500/30 text-emerald-400 text-[10px]" :
                "border-blue-500/30 text-blue-400 text-[10px]"
              }>
                {user.role} · {user.org.name}
              </Badge>
            </div>
          </div>
          <HealthBar />
        </div>
      </div>

      <div className="container px-6 py-6 space-y-8">
        {/* Subscription banner — external clients only */}
        {!isInternal() && user && (
          <div className="flex items-center justify-between rounded-lg border border-blue-500/20 bg-blue-500/5 px-5 py-3">
            <div className="flex items-center gap-3">
              <Sparkles className="size-4 text-blue-400" />
              <div>
                <span className="text-sm font-semibold">{user.org.name}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  — {user.entitlements.length > 4 ? "Full Suite" :
                     user.entitlements.length > 2 ? "Professional" :
                     user.entitlements.includes("data-basic" as never) ? "Data Basic" : "Custom"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/services/data-catalogue">
                <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-accent">
                  Manage Subscription
                </Badge>
              </Link>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Quick Actions
          </h2>
          <QuickActions />
        </section>

        {/* Service Grid */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Services
            </h2>
            {!isInternal() && (
              <span className="text-[10px] text-muted-foreground">
                Locked services can be unlocked by upgrading your subscription
              </span>
            )}
          </div>
          <ServiceHub />
        </section>

        {/* Activity Feed */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Recent Activity
          </h2>
          <div className="rounded-xl border border-border bg-card">
            <ActivityFeed maxItems={8} />
          </div>
        </section>
      </div>
    </div>
  )
}
