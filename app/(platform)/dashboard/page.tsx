"use client"

import * as React from "react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { SERVICE_REGISTRY, getVisibleServices } from "@/lib/config/services"
import { lifecycleStages, type LifecycleStage } from "@/lib/lifecycle-mapping"
import { PLATFORM_STATS } from "@/lib/config/platform-stats"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Database,
  FlaskConical,
  ArrowUpCircle,
  TrendingUp,
  Zap,
  Eye,
  Users,
  FileText,
  Settings,
  ChevronRight,
} from "lucide-react"

const ICON_MAP: Record<string, React.ElementType> = {
  Database,
  FlaskConical,
  ArrowUpCircle,
  TrendingUp,
  Zap,
  Eye,
  Users,
  FileText,
  Settings,
}

const STAGE_ORDER: LifecycleStage[] = [
  "acquire", "build", "promote", "run", "execute", "observe", "manage", "report",
]

export default function DashboardPage() {
  const { user } = useAuth()

  const visibleServices = React.useMemo(() => {
    if (!user) return []
    const entitlements = user.entitlements as readonly string[]
    return getVisibleServices(entitlements, user.role)
  }, [user])

  // Group services by lifecycle stage
  const servicesByStage = React.useMemo(() => {
    const grouped: Partial<Record<LifecycleStage, typeof visibleServices>> = {}
    for (const svc of visibleServices) {
      const stage = svc.lifecycleStage
      if (!grouped[stage]) grouped[stage] = []
      grouped[stage]!.push(svc)
    }
    return grouped
  }, [visibleServices])

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back, {user.displayName.split(" ")[0]}
          </h1>
          <p className="text-sm text-muted-foreground">
            {user.org.name} &middot; {user.role === "admin" ? "Full access" : `${visibleServices.length} services available`}
          </p>
        </div>

        {/* Platform summary */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Venues" value={String(PLATFORM_STATS.totalVenues)} />
          <StatCard label="Asset Classes" value={String(PLATFORM_STATS.assetClassCount)} />
          <StatCard label="Services" value={String(visibleServices.length)} />
          <StatCard label="Instrument Types" value={`${PLATFORM_STATS.instrumentTypeCount}+`} />
        </div>

        {/* Lifecycle pipeline */}
        <div className="space-y-1">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Platform Services
          </h2>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
            {STAGE_ORDER.map((stage, i) => (
              <React.Fragment key={stage}>
                {i > 0 && <ChevronRight className="size-2.5 flex-shrink-0" />}
                <span className={servicesByStage[stage] ? lifecycleStages[stage].color : "opacity-30"}>
                  {lifecycleStages[stage].label}
                </span>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Service cards grouped by lifecycle stage */}
        <div className="space-y-6">
          {STAGE_ORDER.filter(stage => servicesByStage[stage]).map(stage => {
            const stageInfo = lifecycleStages[stage]
            const services = servicesByStage[stage]!

            return (
              <div key={stage} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium uppercase tracking-wider ${stageInfo.color}`}>
                    {stageInfo.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {stageInfo.description}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {services.map(svc => {
                    const Icon = ICON_MAP[svc.icon] ?? Database
                    return (
                      <Link key={svc.key} href={svc.href}>
                        <Card className="group hover:border-white/20 transition-colors cursor-pointer h-full">
                          <CardContent className="p-4 flex gap-3">
                            <div className={`flex-shrink-0 mt-0.5 ${stageInfo.color}`}>
                              <Icon className="size-5" />
                            </div>
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium group-hover:text-white transition-colors">
                                  {svc.label}
                                </span>
                                {svc.internalOnly && (
                                  <Badge variant="outline" className="text-[9px] px-1 py-0">
                                    Internal
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {svc.description}
                              </p>
                            </div>
                            <ChevronRight className="size-4 text-muted-foreground/30 group-hover:text-muted-foreground flex-shrink-0 mt-0.5 ml-auto transition-colors" />
                          </CardContent>
                        </Card>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </CardContent>
    </Card>
  )
}
