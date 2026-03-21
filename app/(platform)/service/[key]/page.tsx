"use client"

import * as React from "react"
import { useParams, notFound } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { SERVICE_REGISTRY } from "@/lib/config/services"
import type { ServiceDefinition } from "@/lib/config/services"
import { SUBSCRIPTION_TIERS } from "@/lib/config/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Database, LineChart, TrendingUp, Wallet, Zap, Shield, Bell,
  FlaskConical, FileText, Brain, Settings, Activity, Cloud,
  ClipboardCheck, Users, ArrowRight, Lock, CheckCircle2, Crown,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Database, LineChart, TrendingUp, Wallet, Zap, Shield, Bell,
  FlaskConical, FileText, Brain, Settings, Activity, Cloud,
  ClipboardCheck, Users,
}

// Service-specific sub-pages that users can access
const SERVICE_SECTIONS: Record<string, Array<{
  label: string; href: string; description: string; requiresEntitlement?: string
}>> = {
  "data-catalogue": [
    { label: "Data Status", href: "/data", description: "Pipeline status, venue coverage, freshness monitoring" },
    { label: "Market Data", href: "/trading/markets", description: "OHLCV candles, order book snapshots, trade streams" },
    { label: "Service Health", href: "/service/observe/health", description: "Pipeline freshness and SLA monitoring" },
  ],
  markets: [
    { label: "Market Overview", href: "/markets", description: "Real-time prices and market movers" },
    { label: "P&L Attribution", href: "/markets/pnl", description: "Factor-level P&L breakdown" },
  ],
  trading: [
    { label: "Trading Terminal", href: "/trading", description: "Order entry, candlesticks, order book" },
    { label: "Positions", href: "/trading/positions", description: "Live positions across all venues" },
    { label: "P&L Overview", href: "/markets", description: "Real-time P&L and attribution" },
  ],
  positions: [
    { label: "Position Monitor", href: "/trading/positions", description: "Real-time positions with protocol details" },
    { label: "Risk Dashboard", href: "/trading/risk", description: "Exposure, VaR, Greeks, stress scenarios" },
  ],
  execution: [
    { label: "Execution Overview", href: "/execution/overview", description: "Order flow, fills, execution quality" },
    { label: "Algo Performance", href: "/execution/algos", description: "TWAP, VWAP, IS, Sniper algorithm metrics" },
    { label: "Venue Connectivity", href: "/execution/venues", description: "Venue status, latency, fill rates" },
    { label: "TCA", href: "/execution/tca", description: "Transaction cost analysis and slippage" },
  ],
  risk: [
    { label: "Risk Limits", href: "/trading/risk", description: "Limit monitoring, utilization, breach alerts" },
    { label: "Alerts", href: "/trading/alerts", description: "Active alerts, acknowledgment, history" },
  ],
  alerts: [
    { label: "Alert Dashboard", href: "/trading/alerts", description: "All alerts by severity and status" },
  ],
  "research-backtesting": [
    { label: "Strategy Research", href: "/research/strategy/overview", description: "Strategy design, configuration, backtest results, candidate pipeline" },
    { label: "ML Models & Training", href: "/research/ml", description: "Model training, experiments, feature engineering, model registry" },
    { label: "Execution Research", href: "/research/execution/algos", description: "Algo backtesting, venue benchmarking, TCA analysis" },
    { label: "Backtests", href: "/research/strategy/backtests", description: "Run, compare, and evaluate backtests across all strategies" },
    { label: "Candidate Pipeline", href: "/research/strategy/candidates", description: "Promote from backtest → paper → live" },
    { label: "Heatmaps", href: "/research/strategy/heatmap", description: "Parameter sensitivity and correlation analysis" },
  ],
  "live-trading-platform": [
    { label: "Trading Dashboard", href: "/trading", description: "Live P&L, order entry, charts, order book" },
    { label: "Positions", href: "/trading/positions", description: "Real-time positions, balances, margin across all venues" },
    { label: "Risk", href: "/trading/risk", description: "Exposure, VaR, Greeks, risk limits, circuit breakers" },
    { label: "Alerts", href: "/trading/alerts", description: "Active alerts, severity filtering, acknowledgment" },
    { label: "Promotions", href: "/research/strategy/candidates", description: "Accept or reject model promotions from research pipeline" },
  ],
  reports: [
    { label: "Portfolio Reports", href: "/reports", description: "P&L, performance, risk-adjusted returns" },
    { label: "Settlements", href: "/reports", description: "Settlement tracking and reconciliation" },
    { label: "Invoices", href: "/reports", description: "Invoice generation and payment status" },
    { label: "Executive View", href: "/reports/executive", description: "C-level portfolio summary" },
  ],
  ml: [
    { label: "ML Overview", href: "/research/ml", description: "Model families, training status, features" },
    { label: "Experiments", href: "/research/ml/experiments", description: "Train, compare, and evaluate models" },
    { label: "Model Registry", href: "/research/ml/registry", description: "Version management, deploy, champion/challenger" },
    { label: "Feature Lab", href: "/quant", description: "Feature engineering and signal analysis" },
  ],
  admin: [
    { label: "Admin Dashboard", href: "/admin", description: "System overview, org management" },
    { label: "User Management", href: "/service/manage/users", description: "Invite, roles, permissions" },
    { label: "Client Management", href: "/service/manage/clients", description: "Org subscriptions, API keys" },
    { label: "Fee Management", href: "/service/manage/fees", description: "Fee schedules and simulation" },
  ],
  ops: [
    { label: "Operations", href: "/ops", description: "Batch jobs, service health, event stream" },
    { label: "System Health", href: "/service/observe/health", description: "Service status and feature freshness" },
  ],
  deployment: [
    { label: "DevOps Dashboard", href: "/devops", description: "Deployments, builds, rollbacks" },
  ],
  compliance: [
    { label: "Compliance", href: "/service/manage/compliance", description: "FCA registration, regulatory info" },
  ],
  manage: [
    { label: "User Management", href: "/service/manage/users", description: "Users, roles, invitations" },
    { label: "Client Management", href: "/service/manage/clients", description: "Organizations, subscriptions" },
    { label: "Fee Management", href: "/service/manage/fees", description: "Fee schedules, simulation" },
    { label: "Mandate Management", href: "/service/manage/mandates", description: "Investment mandates, guidelines" },
  ],
}

export default function ServiceSubscriptionPage() {
  const params = useParams()
  const key = params.key as string
  const { user, hasEntitlement, isInternal } = useAuth()

  const service = SERVICE_REGISTRY.find((s) => s.key === key)
  if (!service) return notFound()
  if (!user) return null

  const Icon = ICON_MAP[service.icon] || Database
  const sections = SERVICE_SECTIONS[key] || []
  const isAdmin = isInternal()

  // Check if user has access to this service
  const hasAccess = isAdmin || (service.requiredEntitlements as readonly string[]).some((e) =>
    user.entitlements.includes(e as never)
  )

  // Find matching subscription tier
  const userTier = SUBSCRIPTION_TIERS.find((t) =>
    (service.requiredEntitlements as readonly string[]).some((e) =>
      (t as Record<string, unknown>).key === e || user.entitlements.includes(e as never)
    )
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Service header */}
      <div className="border-b border-border">
        <div className="container px-6 py-8">
          <div className="flex items-start gap-4">
            <div className="flex size-14 items-center justify-center rounded-xl bg-primary/10">
              <Icon className="size-7 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{service.label}</h1>
                {isAdmin && (
                  <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">
                    <Crown className="size-3 mr-1" /> Full Access
                  </Badge>
                )}
                {!isAdmin && hasAccess && (
                  <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400">
                    <CheckCircle2 className="size-3 mr-1" /> Subscribed
                  </Badge>
                )}
                {!isAdmin && !hasAccess && (
                  <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400">
                    <Lock className="size-3 mr-1" /> Not Subscribed
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
              {service.internalOnly && (
                <p className="text-xs text-red-400/80 mt-1">Internal operations — not visible to clients</p>
              )}
            </div>
            <Link href="/service/overview">
              <Button variant="outline" size="sm">Back to Hub</Button>
            </Link>
          </div>

          {/* Subscription info for clients */}
          {!isAdmin && hasAccess && (
            <div className="mt-6 flex items-center gap-4 rounded-lg border border-border/50 bg-card/50 p-4">
              <Sparkles className="size-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  Your subscription: <span className="text-primary">{user.org.name}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Access tier includes {service.label.toLowerCase()} with org-scoped data.
                  {" "}
                  <Link href="/service/overview" className="text-primary hover:underline">Manage subscription</Link>
                </p>
              </div>
            </div>
          )}

          {/* Locked state for clients without access */}
          {!isAdmin && !hasAccess && (
            <div className="mt-6 rounded-lg border border-amber-500/20 bg-amber-500/5 p-6">
              <div className="flex items-start gap-4">
                <Lock className="size-6 text-amber-400 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-amber-200">Service Not Included in Your Subscription</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {service.label} requires an upgraded subscription. Contact your account manager
                    or request an upgrade to access these features.
                  </p>
                  <div className="mt-4 flex gap-3">
                    <Button size="sm">Contact Sales</Button>
                    <Button size="sm" variant="outline">Request Access</Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Service sections — what you can access */}
      {(hasAccess || isAdmin) && (
        <div className="container px-6 py-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Available Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sections.map((section) => (
              <Link
                key={section.href + section.label}
                href={section.href}
                className="block rounded-xl border border-border bg-card p-5 transition-all hover:bg-accent/50 hover:border-primary/30"
              >
                <h3 className="font-semibold text-sm">{section.label}</h3>
                <p className="text-xs text-muted-foreground mt-1">{section.description}</p>
                <div className="mt-3 flex items-center text-xs text-primary">
                  Open <ArrowRight className="size-3 ml-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
