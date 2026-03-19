"use client"

import * as React from "react"
import { use } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  TrendingUp,
  Cloud,
  Cpu,
  BarChart3,
  Shield,
  Settings,
  Command,
} from "lucide-react"

type Role = {
  id: string
  name: string
  description: string
  icon: React.ElementType
  color: string
  href: string
  features: string[]
}

// Mock org data
const orgData: Record<string, { name: string; type: string; color: string }> = {
  "odum-internal": { name: "Odum Research (Internal)", type: "Principal", color: "text-emerald-400" },
  "alpha-capital": { name: "Alpha Capital Partners", type: "White-Label", color: "text-sky-400" },
  "meridian-quant": { name: "Meridian Quantitative", type: "White-Label", color: "text-violet-400" },
  "nexus-trading": { name: "Nexus Trading Group", type: "White-Label", color: "text-amber-400" },
  "vertex-asset": { name: "Vertex Asset Management", type: "Sub-Fund", color: "text-rose-400" },
  "demo-org": { name: "Demo Organisation", type: "Demo", color: "text-slate-400" },
}

const roles: Role[] = [
  {
    id: "trader",
    name: "Trader",
    description: "Real-time positions, strategies, execution, and risk monitoring",
    icon: TrendingUp,
    color: "text-emerald-400",
    href: "/trader",
    features: ["Portfolio Overview", "Strategy Management", "Order Execution", "Risk Dashboard"],
  },
  {
    id: "devops",
    name: "DevOps",
    description: "Infrastructure, deployments, builds, and system health",
    icon: Cloud,
    color: "text-sky-400",
    href: "/devops",
    features: ["Service Health", "Deployment Center", "Build Status", "Resource Monitoring"],
  },
  {
    id: "quant",
    name: "Quant / ML",
    description: "Data, features, models, training, and backtesting",
    icon: Cpu,
    color: "text-violet-400",
    href: "/quant",
    features: ["Feature Catalog", "Model Registry", "Training Jobs", "Backtest Results"],
  },
  {
    id: "executive",
    name: "Executive",
    description: "High-level performance, risk, and business metrics",
    icon: BarChart3,
    color: "text-amber-400",
    href: "/executive",
    features: ["Portfolio Performance", "Risk Summary", "Strategy Attribution", "System Health"],
  },
  {
    id: "risk",
    name: "Risk",
    description: "Exposure monitoring, limits, and reconciliation",
    icon: Shield,
    color: "text-rose-400",
    href: "/risk",
    features: ["Exposure Dashboard", "Limit Management", "Breach Alerts", "Reconciliation"],
  },
  {
    id: "admin",
    name: "Admin",
    description: "Users, configuration, and audit management",
    icon: Settings,
    color: "text-slate-400",
    href: "/admin",
    features: ["User Management", "Config Editor", "Audit Trail", "Access Control"],
  },
]

export default function PlatformOrgPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = use(params)
  const orgInfo = orgData[org] || { name: "Unknown Organisation", type: "Unknown", color: "text-slate-400" }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Command className="size-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold">Unified Trading Platform</h1>
                <Badge variant="outline" className={cn("text-xs", orgInfo.color)}>
                  {orgInfo.type}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{orgInfo.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              href="/services/platform" 
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Switch Organisation
            </Link>
            <span className="px-3 py-1 text-xs font-medium rounded-full border border-primary/30 text-primary">
              LIVE
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Title */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Select Your Role</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Each role provides a tailored dashboard experience. Traders see dense, real-time
            data. Executives see clean, high-level summaries. DevOps sees infrastructure status.
          </p>
        </div>

        {/* Role Cards Grid */}
        <div className="grid grid-cols-3 gap-6 mb-12">
          {roles.map((role) => {
            const Icon = role.icon
            return (
              <Link
                key={role.id}
                href={`${role.href}?org=${org}`}
                className="group block p-6 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-accent/50 transition-all duration-200"
              >
                {/* Icon + Title */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn("size-10 rounded-lg bg-secondary flex items-center justify-center", role.color)}>
                    <Icon className="size-5" />
                  </div>
                  <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">
                    {role.name}
                  </h3>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground mb-4">
                  {role.description}
                </p>

                {/* Feature Tags */}
                <div className="flex flex-wrap gap-2">
                  {role.features.slice(0, 4).map((feature) => (
                    <span
                      key={feature}
                      className="px-2 py-1 text-xs rounded-md bg-secondary text-secondary-foreground"
                    >
                      {feature}
                    </span>
                  ))}
                  {role.features.length > 4 && (
                    <span className="px-2 py-1 text-xs rounded-md bg-secondary text-muted-foreground">
                      +{role.features.length - 4} more
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>

        {/* Footer Note */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            You are viewing the platform for <span className={cn("font-medium", orgInfo.color)}>{orgInfo.name}</span>
          </p>
          <div className="flex items-center justify-center gap-4">
            <span className="text-xs text-muted-foreground">Design Philosophy:</span>
            <span className="px-3 py-1 text-xs rounded-full border border-border">Dense for Workers</span>
            <span className="px-3 py-1 text-xs rounded-full border border-border">Clean for Executives</span>
            <span className="px-3 py-1 text-xs rounded-full border border-border">Action-Oriented</span>
          </div>
        </div>
      </main>
    </div>
  )
}
