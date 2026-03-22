"use client"

import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Database,
  Cloud,
  Lock,
  Users,
  Building2,
  Eye,
  ArrowRight,
  CheckCircle2,
  Layers,
  Globe,
  Zap,
} from "lucide-react"
import { DATA_CATEGORY_LABELS } from "@/lib/data-service-types"
import type { DataCategory } from "@/lib/data-service-types"
import { VENUE_DISPLAY, ADMIN_SUMMARY } from "@/lib/data-service-mock-data"

// Category colours consistent with rest of platform
const CATEGORY_COLORS: Record<DataCategory, { text: string; bg: string; border: string }> = {
  cefi:              { text: "text-sky-400", bg: "bg-sky-400/10", border: "border-sky-400/30" },
  tradfi:            { text: "text-violet-400", bg: "bg-violet-400/10", border: "border-violet-400/30" },
  defi:              { text: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/30" },
  onchain_perps:     { text: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/30" },
  prediction_market: { text: "text-rose-400", bg: "bg-rose-400/10", border: "border-rose-400/30" },
}

// Deterministic mock freshness data for the demo heatmap (avoids hydration mismatch)
// Uses a seeded pattern instead of Math.random()
function generateMockHeatmap(weeks: number = 8): { date: string; status: "complete" | "partial" | "missing" }[] {
  const days: { date: string; status: "complete" | "partial" | "missing" }[] = []
  // Use fixed base date to ensure consistency between server and client
  const baseDate = new Date("2026-03-19")
  // Deterministic pattern: most complete, occasional partial/missing based on day index
  const pattern = [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0]
  for (let i = weeks * 7 - 1; i >= 0; i--) {
    const d = new Date(baseDate)
    d.setDate(d.getDate() - i)
    const patternVal = pattern[i % pattern.length]
    days.push({
      date: d.toISOString().split("T")[0],
      status: patternVal === 0 ? "complete" : patternVal === 1 ? "partial" : "missing",
    })
  }
  return days
}

// Access tier definitions
const ACCESS_TIERS = [
  {
    id: "demo",
    name: "Demo",
    icon: Eye,
    description: "Preview the platform with mock data. No sign-up required.",
    color: "text-sky-400",
    bgColor: "bg-sky-400/10",
    borderColor: "border-sky-400/30",
    features: [
      "Browse full instrument catalogue",
      "View mock freshness heatmaps",
      "Explore pricing models",
      "See sample subscriptions",
    ],
    cta: "Try Demo",
    href: "/services/data?tab=demo",
    badge: "No Auth",
  },
  {
    id: "client",
    name: "Organisation Portal",
    icon: Building2,
    description: "Your data subscriptions, query history, and real-time availability.",
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/10",
    borderColor: "border-emerald-400/30",
    features: [
      "View your active subscriptions",
      "Query historical + live data",
      "Track usage and costs",
      "Manage API keys and cloud",
    ],
    cta: "Sign In",
    href: "/services/data/overview",
    badge: "Auth Required",
  },
  {
    id: "admin",
    name: "Internal Platform",
    icon: Layers,
    description: "Aggregated view of all client subscriptions and pipeline health.",
    color: "text-amber-400",
    bgColor: "bg-amber-400/10",
    borderColor: "border-amber-400/30",
    features: [
      "All organisation subscriptions",
      "Pipeline freshness monitoring",
      "Client query log and billing",
      "Catalogue management",
    ],
    cta: "Internal Access",
    href: "/admin/data",
    badge: "Odum Only",
  },
]

export function DataServicesShowcase() {
  const heatmapData = React.useMemo(() => generateMockHeatmap(8), [])
  const categories = Object.keys(DATA_CATEGORY_LABELS) as DataCategory[]

  return (
    <section className="relative border-t border-border bg-gradient-to-b from-card/50 to-background">
      <div className="container px-4 py-16 md:px-6 md:py-24">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center mb-12">
          <Badge variant="secondary" className="mb-3">
            <Database className="mr-1 size-3" />
            Data Provision Service
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Institutional Market Data
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            128 venues across 5 asset classes, normalised to a single schema.
            Query in our cloud or export to yours.
          </p>
        </div>

        {/* Key metrics row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6 max-w-4xl mx-auto mb-12">
          <div className="text-center p-4 rounded-lg border border-border bg-card/50">
            <div className="text-2xl md:text-3xl font-bold text-sky-400">128</div>
            <div className="text-xs text-muted-foreground mt-1">Venues</div>
          </div>
          <div className="text-center p-4 rounded-lg border border-border bg-card/50">
            <div className="text-2xl md:text-3xl font-bold text-violet-400">5</div>
            <div className="text-xs text-muted-foreground mt-1">Asset Classes</div>
          </div>
          <div className="text-center p-4 rounded-lg border border-border bg-card/50">
            <div className="text-2xl md:text-3xl font-bold text-emerald-400">6+</div>
            <div className="text-xs text-muted-foreground mt-1">Years History</div>
          </div>
          <div className="text-center p-4 rounded-lg border border-border bg-card/50">
            <div className="text-2xl md:text-3xl font-bold text-amber-400">18+</div>
            <div className="text-xs text-muted-foreground mt-1">Data Types</div>
          </div>
          <div className="text-center p-4 rounded-lg border border-border bg-card/50 col-span-2 md:col-span-1">
            <div className="text-2xl md:text-3xl font-bold text-rose-400">97%</div>
            <div className="text-xs text-muted-foreground mt-1">Avg Freshness</div>
          </div>
        </div>

        {/* Category breakdown */}
        <div className="mb-12">
          <h3 className="text-sm font-semibold text-center text-muted-foreground mb-4">Asset Class Coverage</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 max-w-4xl mx-auto">
            {categories.map((cat) => {
              const color = CATEGORY_COLORS[cat]
              const count = ADMIN_SUMMARY.categoryCounts[cat]
              return (
                <div 
                  key={cat}
                  className={cn(
                    "p-3 rounded-lg border transition-colors hover:border-opacity-50",
                    color.bg,
                    color.border
                  )}
                >
                  <div className={cn("text-xs font-semibold", color.text)}>
                    {DATA_CATEGORY_LABELS[cat]}
                  </div>
                  <div className="mt-1 text-lg font-bold">
                    {count?.toLocaleString() || "—"}
                  </div>
                  <div className="text-[10px] text-muted-foreground">instruments</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Live freshness preview (demo) */}
        <div className="mb-16">
          <Card className="max-w-4xl mx-auto overflow-hidden border-sky-400/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-sky-400 border-sky-400/30">
                    Live Preview
                  </Badge>
                  <span className="text-sm text-muted-foreground">Data Freshness Heatmap</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Cloud className="size-3 text-blue-400" />
                  GCP
                  <span className="text-border">|</span>
                  <Cloud className="size-3 text-orange-400" />
                  AWS
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Mini heatmap */}
              <div className="flex gap-[2px] flex-wrap mb-4">
                {heatmapData.map((day, i) => (
                  <div
                    key={i}
                    className={cn(
                      "size-3 rounded-sm",
                      day.status === "complete" ? "bg-emerald-500/80" :
                      day.status === "partial" ? "bg-yellow-500/70" : "bg-red-500/30"
                    )}
                    title={`${day.date}: ${day.status}`}
                  />
                ))}
              </div>
              
              {/* Legend + sample venues */}
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="size-2.5 rounded-sm bg-emerald-500/80" />
                    Complete
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="size-2.5 rounded-sm bg-yellow-500/70" />
                    Partial
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="size-2.5 rounded-sm bg-red-500/30" />
                    Missing
                  </span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {["binance", "deribit", "databento", "uniswap_v3", "hyperliquid"].map(venue => (
                    <Badge key={venue} variant="secondary" className="text-[10px]">
                      {VENUE_DISPLAY[venue]?.label || venue}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Three access tiers */}
        <div className="mb-12">
          <h3 className="text-xl font-bold text-center mb-2">Three Ways to Access</h3>
          <p className="text-sm text-muted-foreground text-center mb-8 max-w-lg mx-auto">
            Same platform, different permission levels. Demo for preview, Portal for clients, Internal for Odum team.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {ACCESS_TIERS.map((tier) => {
              const Icon = tier.icon
              return (
                <Card 
                  key={tier.id}
                  className={cn(
                    "relative overflow-hidden transition-all hover:shadow-lg",
                    `hover:${tier.borderColor}`
                  )}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className={cn("flex size-11 items-center justify-center rounded-lg", tier.bgColor)}>
                        <Icon className={cn("size-5", tier.color)} />
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {tier.badge}
                      </Badge>
                    </div>
                    <CardTitle className="mt-3 text-lg">{tier.name}</CardTitle>
                    <CardDescription className="text-sm">{tier.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-6">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className={cn("size-3.5 shrink-0", tier.color)} />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button className="w-full" variant="outline" asChild>
                      <Link href={tier.href}>
                        {tier.cta}
                        <ArrowRight className="ml-2 size-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Pricing preview */}
        <div className="max-w-4xl mx-auto">
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Two Access Models</CardTitle>
                <Badge variant="secondary" className="text-xs">
                  <Globe className="mr-1 size-3" />
                  Cloud Agnostic
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {/* In-System */}
                <div className="p-4 rounded-lg border border-emerald-400/30 bg-emerald-400/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="size-4 text-emerald-400" />
                    <span className="font-semibold text-emerald-400">In-System</span>
                    <Badge variant="secondary" className="text-[10px] bg-emerald-400/10 text-emerald-400">Recommended</Badge>
                  </div>
                  <div className="text-2xl font-bold">$0.50<span className="text-sm font-normal text-muted-foreground">/GB</span></div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Query via our API. Data stays in Odum cloud. Best value.
                  </p>
                </div>
                
                {/* Download */}
                <div className="p-4 rounded-lg border border-amber-400/30 bg-amber-400/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Cloud className="size-4 text-amber-400" />
                    <span className="font-semibold text-amber-400">Download / Egress</span>
                  </div>
                  <div className="text-2xl font-bold">$2.50<span className="text-sm font-normal text-muted-foreground">/GB</span></div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Export to your S3/GCS bucket. You own the copy.
                  </p>
                </div>
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  Plans from <span className="text-foreground font-semibold">£250/mo</span> (Starter) to <span className="text-foreground font-semibold">Enterprise</span> (custom)
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/services/data?tab=pricing">
                    View Pricing
                    <ArrowRight className="ml-1 size-3" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Final CTA */}
        <div className="mt-12 text-center">
          <Button size="lg" asChild>
            <Link href="/services/data">
              Explore Data Service
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
          <p className="mt-4 text-xs text-muted-foreground">
            <Link href="/contact" className="text-primary hover:underline">Book a demo</Link> to discuss your specific data requirements.
          </p>
        </div>
      </div>
    </section>
  )
}
