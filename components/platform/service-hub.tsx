"use client"

import * as React from "react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { SERVICE_REGISTRY, getVisibleServices } from "@/lib/config/services"
import type { ServiceDefinition } from "@/lib/config/services"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Database, LineChart, TrendingUp, Wallet, Zap, Shield, Bell,
  FlaskConical, FileText, Brain, Settings, Activity, Cloud,
  ClipboardCheck, Users, Lock, ArrowRight, Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Database, LineChart, TrendingUp, Wallet, Zap, Shield, Bell,
  FlaskConical, FileText, Brain, Settings, Activity, Cloud,
  ClipboardCheck, Users,
}

const CATEGORY_COLORS: Record<string, string> = {
  data: "border-blue-500/30 hover:border-blue-500/60",
  trading: "border-orange-500/30 hover:border-orange-500/60",
  analytics: "border-purple-500/30 hover:border-purple-500/60",
  ml: "border-cyan-500/30 hover:border-cyan-500/60",
  ops: "border-red-500/30 hover:border-red-500/60",
}

const CATEGORY_LABELS: Record<string, string> = {
  data: "Data",
  trading: "Trading & Execution",
  analytics: "Research & Analytics",
  ml: "Machine Learning",
  ops: "Operations",
}

// Mock quick stats per service
const SERVICE_STATS: Record<string, string> = {
  "data-catalogue": "Full instrument catalogue",
  markets: "Live across all venues",
  trading: "12 active strategies",
  positions: "$4.8M notional",
  execution: "1,842 fills today",
  risk: "78% margin utilization",
  alerts: "3 active alerts",
  "strategy-platform": "5 backtests running",
  reports: "2 pending settlements",
  ml: "6 models deployed",
  admin: "4 orgs, 12 users",
  ops: "10 services healthy",
  deployment: "1 deployment running",
  compliance: "All checks passing",
  manage: "3 client orgs",
}

interface ServiceCardProps {
  service: ServiceDefinition
  state: "available" | "locked"
  onUpgradeClick: (service: ServiceDefinition) => void
}

function ServiceCard({ service, state, onUpgradeClick }: ServiceCardProps) {
  const Icon = ICON_MAP[service.icon] || Database
  const stat = SERVICE_STATS[service.key]

  if (state === "locked") {
    return (
      <button
        onClick={() => onUpgradeClick(service)}
        className={cn(
          "relative w-full text-left rounded-xl border border-border/50 bg-card/30 p-5 transition-all hover:bg-card/50",
          "opacity-60 hover:opacity-80"
        )}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-muted/50">
            <Icon className="size-5 text-muted-foreground" />
          </div>
          <Lock className="size-4 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-sm text-muted-foreground">{service.label}</h3>
        <p className="text-xs text-muted-foreground/60 mt-1 line-clamp-2">{service.description}</p>
        <div className="mt-3">
          <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400">
            Upgrade to access
          </Badge>
        </div>
      </button>
    )
  }

  return (
    <Link
      href={`/service/${service.key}`}
      className={cn(
        "block rounded-xl border bg-card p-5 transition-all hover:bg-accent/50",
        CATEGORY_COLORS[service.category]
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="size-5 text-primary" />
        </div>
        {service.internalOnly && (
          <Badge variant="outline" className="text-[10px] border-red-500/30 text-red-400">
            Internal
          </Badge>
        )}
      </div>
      <h3 className="font-semibold text-sm">{service.label}</h3>
      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{service.description}</p>
      {stat && (
        <div className="mt-3 text-xs font-medium text-primary/80">{stat}</div>
      )}
    </Link>
  )
}

function UpgradeModal({
  service,
  open,
  onClose,
}: {
  service: ServiceDefinition | null
  open: boolean
  onClose: () => void
}) {
  if (!service) return null
  const Icon = ICON_MAP[service.icon] || Database

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="size-5 text-primary" />
            </div>
            <div>
              <DialogTitle>{service.label}</DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                {service.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg border border-border p-4 space-y-2">
            <h4 className="text-sm font-medium">What you get:</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li className="flex items-center gap-2">
                <Sparkles className="size-3 text-primary" /> Full access to {service.label.toLowerCase()}
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="size-3 text-primary" /> Org-scoped data and analytics
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="size-3 text-primary" /> API access for programmatic integration
              </li>
            </ul>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={onClose}>
              Contact Sales
              <ArrowRight className="ml-2 size-4" />
            </Button>
            <Button variant="outline" onClick={onClose}>
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function ServiceHub() {
  const { user, hasEntitlement, isInternal } = useAuth()
  const [upgradeService, setUpgradeService] = React.useState<ServiceDefinition | null>(null)

  if (!user) return null

  const visibleServices = getVisibleServices([...user.entitlements], user.role)
  const allServices = SERVICE_REGISTRY.filter((s) => {
    if (s.internalOnly && !isInternal()) return false
    return true
  })

  // Group by category
  const categories = [...new Set(allServices.map((s) => s.category))]

  return (
    <>
      <div className="space-y-8">
        {categories.map((cat) => {
          const catServices = allServices.filter((s) => s.category === cat)
          if (catServices.length === 0) return null

          return (
            <div key={cat}>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                {CATEGORY_LABELS[cat] || cat}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {catServices.map((service) => {
                  const isAvailable = visibleServices.some((v) => v.key === service.key)
                  return (
                    <ServiceCard
                      key={service.key}
                      service={service}
                      state={isAvailable ? "available" : "locked"}
                      onUpgradeClick={setUpgradeService}
                    />
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <UpgradeModal
        service={upgradeService}
        open={!!upgradeService}
        onClose={() => setUpgradeService(null)}
      />
    </>
  )
}
