"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  TrendingUp,
  Cloud,
  FlaskConical,
  Briefcase,
  Shield,
  ScrollText,
  ArrowRight,
  Command,
} from "lucide-react"
type UserRole = "trader" | "quant" | "risk" | "executive" | "ops" | "compliance"

interface RoleSelectionProps {
  onSelectRole: (role: UserRole) => void
}

const roleCards: {
  role: UserRole
  label: string
  icon: React.ElementType
  color: string
  bgColor: string
  description: string
  features: string[]
}[] = [
  {
    role: "trader",
    label: "Trader",
    icon: TrendingUp,
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/10",
    description: "Real-time command center for active trading with positions, strategies, and execution monitoring",
    features: ["Live Positions", "Strategy Performance", "Order Execution", "P&L Attribution", "Alerts"],
  },
  {
    role: "risk",
    label: "Risk Manager",
    icon: Shield,
    color: "text-rose-400",
    bgColor: "bg-rose-400/10",
    description: "Deep risk analysis with Greeks, VaR, stress testing, and what-if scenarios",
    features: ["Portfolio Greeks", "VaR Analysis", "Stress Tests", "What-If Scenarios", "Limit Monitoring"],
  },
  {
    role: "devops",
    label: "DevOps",
    icon: Cloud,
    color: "text-sky-400",
    bgColor: "bg-sky-400/10",
    description: "Infrastructure management with deployments, rollbacks, and service health monitoring",
    features: ["Service Health", "Deployments", "Rollback", "Cloud Selection", "Job Monitoring"],
  },
  {
    role: "quant",
    label: "Quant / Research",
    icon: FlaskConical,
    color: "text-violet-400",
    bgColor: "bg-violet-400/10",
    description: "Backtesting, ML training, config grid generation, and execution alpha analysis",
    features: ["Backtest Engine", "Config Grid", "ML Training", "Execution Alpha", "Feature Engineering"],
  },
  {
    role: "executive",
    label: "Executive / CFO",
    icon: Briefcase,
    color: "text-amber-400",
    bgColor: "bg-amber-400/10",
    description: "High-level performance dashboards, investor updates, and report generation",
    features: ["Performance Summary", "Investor Updates", "P&L Reports", "CSV Export", "Client Reports"],
  },
  {
    role: "audit",
    label: "Audit / Compliance",
    icon: ScrollText,
    color: "text-slate-400",
    bgColor: "bg-slate-400/10",
    description: "Complete historical record of all system events, trades, orders, and changes",
    features: ["Event Log", "Trade History", "Order Audit", "Login Records", "Change Tracking"],
  },
]

export function RoleSelectionPage({ onSelectRole }: RoleSelectionProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Command className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Trading Platform</h1>
              <p className="text-xs text-muted-foreground">Role-Based Dashboard System</p>
            </div>
          </div>
          <Badge variant="outline" className="border-warning/50 bg-warning/10 text-warning">
            STAGING
          </Badge>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3 text-balance">Select Your Dashboard</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-balance">
              Each role provides a tailored experience. Traders see dense, real-time data. 
              Risk managers see Greeks and stress tests. Executives see clean summaries.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {roleCards.map((item) => {
              const Icon = item.icon
              return (
                <Card 
                  key={item.role} 
                  className="group cursor-pointer transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
                  onClick={() => onSelectRole(item.role)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${item.bgColor}`}>
                          <Icon className={`h-5 w-5 ${item.color}`} />
                        </div>
                        <CardTitle className="text-base">{item.label}</CardTitle>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <CardDescription className="mt-2 text-xs leading-relaxed">
                      {item.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-1.5">
                      {item.features.slice(0, 4).map((feature) => (
                        <Badge key={feature} variant="secondary" className="text-[10px] font-normal">
                          {feature}
                        </Badge>
                      ))}
                      {item.features.length > 4 && (
                        <Badge variant="secondary" className="text-[10px] font-normal">
                          +{item.features.length - 4} more
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              All dashboards share the same underlying data. Choose based on your workflow focus.
            </p>
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <Badge variant="outline" className="font-normal">Dense for Workers</Badge>
              <Badge variant="outline" className="font-normal">Clean for Executives</Badge>
              <Badge variant="outline" className="font-normal">Deep for Risk/Research</Badge>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4">
        <div className="max-w-6xl mx-auto px-6 text-center text-xs text-muted-foreground">
          Trading Platform - Role-Based Dashboard System
        </div>
      </footer>
    </div>
  )
}
