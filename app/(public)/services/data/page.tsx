"use client"

// /services/data — Public marketing page for Data Provision service
// Three sections: Hero → Tabs (Catalogue | Pricing | Demo) → Social proof
// Uses orgMode="demo" for the catalogue preview — no auth required
// This page is the sales entry point. All CTAs lead to /signup or /portal/login

import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Database, ArrowLeft, Sparkles, Globe, Zap, Download,
  CheckCircle2, ArrowRight, Cloud, Clock, Lock, FlaskConical,
} from "lucide-react"
import { ShardCatalogue } from "@/components/data/shard-catalogue"
import { FreshnessHeatmap } from "@/components/data/freshness-heatmap"
import { DATA_PLANS } from "@/lib/data-service-types"
import { ADMIN_SUMMARY, MOCK_SHARD_AVAILABILITY, DEMO_ORG, MOCK_SUBSCRIPTIONS } from "@/lib/data-service-mock-data"

const HERO_METRICS = [
  { label: "Venues", value: "128" },
  { label: "Asset Classes", value: "5" },
  { label: "Years History", value: "6+" },
  { label: "Data Types", value: "18+" },
]

export default function DataServicePublicPage() {
  return (
    <div className="min-h-screen bg-background">

      {/* Hero */}
      <section className="relative border-b border-border overflow-hidden">
        {/* Sky-tinted grid background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-950/40 via-background to-background" />
        <div className="container relative px-4 py-20 md:px-6 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="outline" className="mb-4 border-sky-500/30 text-sky-400 text-xs">
              <Database className="mr-1.5 size-3" />
              Data Provision
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              Institutional market data.{" "}
              <span className="text-sky-400">One schema.</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Normalised tick, OHLCV, orderbook, DeFi, and sports data from 128 venues —
              queried in-system or exported to your cloud. Cloud-agnostic. Paywall-free for
              what you subscribe to.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" asChild>
                <Link href="/signup">
                  Get Started
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">Book a Demo</Link>
              </Button>
            </div>
            {/* Metric strip */}
            <div className="mt-12 grid grid-cols-4 gap-4">
              {HERO_METRICS.map(m => (
                <div key={m.label} className="rounded-lg border border-border bg-card/60 px-4 py-3">
                  <div className="text-2xl font-bold font-mono text-sky-400">{m.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main tabs */}
      <section className="container px-4 py-12 md:px-6">
        <Tabs defaultValue="catalogue">
          <TabsList className="mb-8">
            <TabsTrigger value="catalogue">
              <Database className="mr-2 size-4" />
              Data Catalogue
            </TabsTrigger>
            <TabsTrigger value="pricing">
              <Zap className="mr-2 size-4" />
              Pricing
            </TabsTrigger>
            <TabsTrigger value="demo">
              <FlaskConical className="mr-2 size-4" />
              Live Demo
            </TabsTrigger>
          </TabsList>

          {/* ─── Catalogue tab ──────────────────────────────────────────────── */}
          <TabsContent value="catalogue">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">Instrument Registry</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Browse all available instruments by asset class, venue, and data type.
                Subscribe to unlock date-range queries.
              </p>
            </div>
            {/* Browsable but date pickers are locked */}
            <ShardCatalogue orgMode="demo" activeSubscriptions={[]} />
            <div className="mt-6 flex items-center gap-3 rounded-lg border border-sky-500/30 bg-sky-500/5 p-4">
              <Lock className="size-5 text-sky-400 shrink-0" />
              <div className="flex-1 text-sm">
                <span className="font-medium">Sign in to query.</span>{" "}
                <span className="text-muted-foreground">
                  Select a date range and data types, then query in-system or download to your cloud.
                </span>
              </div>
              <Button size="sm" asChild>
                <Link href="/signup">Get Access <ArrowRight className="ml-1.5 size-3" /></Link>
              </Button>
            </div>
          </TabsContent>

          {/* ─── Pricing tab ────────────────────────────────────────────────── */}
          <TabsContent value="pricing">
            <div className="space-y-8">
              {/* Two access models */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="border-emerald-500/30 bg-emerald-500/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-emerald-400">
                      <Zap className="size-5" />
                      In-System Query
                    </CardTitle>
                    <CardDescription>
                      Data stays in our cloud. Query via API. No egress cost.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-3xl font-bold font-mono text-emerald-400">
                      $0.50<span className="text-base font-normal text-muted-foreground">/GB</span>
                    </div>
                    <ul className="space-y-2 text-sm">
                      {["REST + WebSocket API access", "GCP or AWS storage preference", "No data movement — no egress fee", "Sub-100ms query latency", "Use within backtesting and strategy services"].map(f => (
                        <li key={f} className="flex items-center gap-2">
                          <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Badge className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30">Recommended</Badge>
                  </CardContent>
                </Card>

                <Card className="border-amber-500/30 bg-amber-500/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-400">
                      <Download className="size-5" />
                      Download / Egress
                    </CardTitle>
                    <CardDescription>
                      Export to your own S3 or GCS bucket. You own the copy.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-3xl font-bold font-mono text-amber-400">
                      $2.50<span className="text-base font-normal text-muted-foreground">/GB</span>
                    </div>
                    <ul className="space-y-2 text-sm">
                      {["Direct export to your S3/GCS bucket", "Link your AWS account or GCP project", "Cross-cloud transfer: +$0.08/GB", "One-time historical bulk exports", "You control the retention"].map(f => (
                        <li key={f} className="flex items-center gap-2">
                          <CheckCircle2 className="size-4 text-amber-500 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <div className="text-xs text-muted-foreground">
                      <Globe className="inline size-3 mr-1" />
                      Cloud-agnostic — you decide where your data lives
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Plan tiers */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Subscription Plans</h3>
                <div className="grid md:grid-cols-4 gap-4">
                  {DATA_PLANS.map(plan => (
                    <Card key={plan.tier} className={cn(plan.tier === "institutional" && "border-sky-500/50 ring-1 ring-sky-500/20")}>
                      <CardHeader className="pb-3">
                        {plan.tier === "institutional" && (
                          <Badge variant="outline" className="w-fit mb-2 border-sky-500/30 text-sky-400 text-[10px]">
                            Most Popular
                          </Badge>
                        )}
                        <CardTitle className="text-base">{plan.name}</CardTitle>
                        <CardDescription>
                          {plan.tier === "enterprise" ? (
                            <span className="text-xl font-bold text-foreground">Custom</span>
                          ) : (
                            <span className="text-xl font-bold text-foreground">
                              ${plan.monthlyPrice.toLocaleString()}<span className="text-xs font-normal text-muted-foreground">/mo</span>
                            </span>
                          )}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="text-xs text-muted-foreground">
                          {plan.queryLimitGb < 0 ? "Unlimited" : `${plan.queryLimitGb} GB`}/mo · {plan.historyYears}yr history
                        </div>
                        <ul className="space-y-1.5">
                          {plan.features.map(f => (
                            <li key={f} className="flex items-center gap-2 text-xs">
                              <CheckCircle2 className="size-3 text-sky-400 shrink-0" />
                              {f}
                            </li>
                          ))}
                        </ul>
                        <Button
                          size="sm"
                          className="w-full mt-3"
                          variant={plan.tier === "institutional" ? "default" : "outline"}
                          asChild
                        >
                          <Link href={plan.tier === "enterprise" ? "/contact" : "/signup"}>
                            {plan.tier === "enterprise" ? "Talk to us" : "Get started"}
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ─── Demo tab ───────────────────────────────────────────────────── */}
          <TabsContent value="demo">
            <div className="space-y-6">
              {/* Demo banner */}
              <div className="flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 px-4 py-2.5 text-sm text-amber-400">
                <FlaskConical className="size-4 shrink-0" />
                Demo Mode — all data is illustrative. Sign in to see real freshness and query real data.
                <Button size="sm" variant="outline" className="ml-auto border-amber-500/30 text-amber-400 hover:bg-amber-500/10" asChild>
                  <Link href="/portal/login">Sign in</Link>
                </Button>
              </div>

              {/* Mock freshness heatmaps */}
              <div className="grid md:grid-cols-2 gap-4">
                {MOCK_SHARD_AVAILABILITY.slice(0, 4).map(shard => (
                  <Card key={`${shard.venue}-${shard.dataType}`}>
                    <CardContent className="pt-4">
                      <FreshnessHeatmap
                        dateMap={shard.byDate ?? {}}
                        label={`${shard.venue} · ${shard.dataType}`}
                        cloud={shard.gcpCompletionPct > 0 ? "gcp" : "aws"}
                        weeksToShow={13}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Demo subscriptions preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Sample Active Subscriptions</CardTitle>
                  <CardDescription>This is what your portal looks like when you sign in.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {MOCK_SUBSCRIPTIONS.slice(0, 2).map(sub => (
                      <div key={sub.id} className="flex items-center justify-between rounded-md bg-accent/30 px-3 py-2 text-sm">
                        <span className="font-medium">{sub.label}</span>
                        <div className="flex items-center gap-2">
                          {sub.shardFilters.categories.map(c => (
                            <Badge key={c} variant="secondary" className="text-[10px]">{c}</Badge>
                          ))}
                          <Badge variant="outline" className={cn("text-[10px]",
                            sub.accessMode === "in_system"
                              ? "border-emerald-500/30 text-emerald-500"
                              : "border-amber-500/30 text-amber-500"
                          )}>
                            {sub.accessMode === "in_system" ? "In-System" : "Download"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="text-center">
                <Button size="lg" asChild>
                  <Link href="/signup">
                    Create your account
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  )
}
