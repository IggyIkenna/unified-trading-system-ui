"use client";

// /services/data — Public marketing page for Data Provision service
// Three sections: Hero → Tabs (Catalogue | Pricing | Demo) → Social proof
// Uses orgMode="demo" for the catalogue preview — no auth required
// This page is the sales entry point. All CTAs lead to /signup or /login

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Database,
  ArrowLeft,
  Sparkles,
  Globe,
  Zap,
  Download,
  CheckCircle2,
  ArrowRight,
  Cloud,
  Clock,
  Lock,
  FlaskConical,
} from "lucide-react";
import { ShardCatalogue } from "@/components/data/shard-catalogue";
import { FreshnessHeatmap } from "@/components/data/freshness-heatmap";
import { DATA_PLANS } from "@/lib/data-service-types";
import {
  ADMIN_SUMMARY,
  MOCK_SHARD_AVAILABILITY,
  DEMO_ORG,
  MOCK_SUBSCRIPTIONS,
} from "@/lib/data-service-mock-data";

const HERO_METRICS = [
  { label: "Venues", value: "128" },
  { label: "Asset Classes", value: "5" },
  { label: "Years History", value: "6+" },
  { label: "Data Types", value: "18+" },
];

export default function DataServicePublicPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative border-b border-border overflow-hidden">
        {/* Sky-tinted grid background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-950/40 via-background to-background" />
        <div className="container relative px-4 py-20 md:px-6 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <Badge
              variant="outline"
              className="mb-4 border-sky-500/30 text-sky-400 text-xs"
            >
              <Database className="mr-1.5 size-3" />
              Data Provision
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              Institutional market data.{" "}
              <span className="text-sky-400">One schema.</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Normalised tick, OHLCV, orderbook, DeFi, and sports data from 128
              venues — queried in-system or exported to your cloud.
              Cloud-agnostic. Paywall-free for what you subscribe to.
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
              {HERO_METRICS.map((m) => (
                <div
                  key={m.label}
                  className="rounded-lg border border-border bg-card/60 px-4 py-3"
                >
                  <div className="text-2xl font-bold font-mono text-sky-400">
                    {m.value}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {m.label}
                  </div>
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
                Browse all available instruments by asset class, venue, and data
                type. Subscribe to unlock date-range queries.
              </p>
            </div>
            {/* Browsable but date pickers are locked */}
            <ShardCatalogue orgMode="demo" activeSubscriptions={[]} />
            <div className="mt-6 flex items-center gap-3 rounded-lg border border-sky-500/30 bg-sky-500/5 p-4">
              <Lock className="size-5 text-sky-400 shrink-0" />
              <div className="flex-1 text-sm">
                <span className="font-medium">Sign in to query.</span>{" "}
                <span className="text-muted-foreground">
                  Select a date range and data types, then query in-system or
                  download to your cloud.
                </span>
              </div>
              <Button size="sm" asChild>
                <Link href="/signup">
                  Get Access <ArrowRight className="ml-1.5 size-3" />
                </Link>
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
                      $0.50
                      <span className="text-base font-normal text-muted-foreground">
                        /GB
                      </span>
                    </div>
                    <ul className="space-y-2 text-sm">
                      {[
                        "REST + WebSocket API access",
                        "GCP or AWS storage preference",
                        "No data movement — no egress fee",
                        "Sub-100ms query latency",
                        "Use within backtesting and strategy services",
                      ].map((f) => (
                        <li key={f} className="flex items-center gap-2">
                          <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Badge className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30">
                      Recommended
                    </Badge>
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
                      $2.50
                      <span className="text-base font-normal text-muted-foreground">
                        /GB
                      </span>
                    </div>
                    <ul className="space-y-2 text-sm">
                      {[
                        "Direct export to your S3/GCS bucket",
                        "Link your AWS account or GCP project",
                        "Cross-cloud transfer: +$0.08/GB",
                        "One-time historical bulk exports",
                        "You control the retention",
                      ].map((f) => (
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
                <h3 className="text-lg font-semibold mb-4">
                  Subscription Plans
                </h3>
                <div className="grid md:grid-cols-4 gap-4">
                  {DATA_PLANS.map((plan) => (
                    <Card
                      key={plan.tier}
                      className={cn(
                        plan.tier === "institutional" &&
                          "border-sky-500/50 ring-1 ring-sky-500/20",
                      )}
                    >
                      <CardHeader className="pb-3">
                        {plan.tier === "institutional" && (
                          <Badge
                            variant="outline"
                            className="w-fit mb-2 border-sky-500/30 text-sky-400 text-[10px]"
                          >
                            Most Popular
                          </Badge>
                        )}
                        <CardTitle className="text-base">{plan.name}</CardTitle>
                        <CardDescription>
                          {plan.tier === "enterprise" ? (
                            <span className="text-xl font-bold text-foreground">
                              Custom
                            </span>
                          ) : (
                            <span className="text-xl font-bold text-foreground">
                              ${plan.monthlyPrice.toLocaleString()}
                              <span className="text-xs font-normal text-muted-foreground">
                                /mo
                              </span>
                            </span>
                          )}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="text-xs text-muted-foreground">
                          {plan.queryLimitGb < 0
                            ? "Unlimited"
                            : `${plan.queryLimitGb} GB`}
                          /mo · {plan.historyYears}yr history
                        </div>
                        <ul className="space-y-1.5">
                          {plan.features.map((f) => (
                            <li
                              key={f}
                              className="flex items-center gap-2 text-xs"
                            >
                              <CheckCircle2 className="size-3 text-sky-400 shrink-0" />
                              {f}
                            </li>
                          ))}
                        </ul>
                        <Button
                          size="sm"
                          className="w-full mt-3"
                          variant={
                            plan.tier === "institutional"
                              ? "default"
                              : "outline"
                          }
                          asChild
                        >
                          <Link
                            href={
                              plan.tier === "enterprise"
                                ? "/contact"
                                : "/signup"
                            }
                          >
                            {plan.tier === "enterprise"
                              ? "Talk to us"
                              : "Get started"}
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
            <div className="space-y-8">
              <div className="text-center max-w-2xl mx-auto">
                <h2 className="text-xl font-semibold mb-2">
                  See the Platform in Action
                </h2>
                <p className="text-sm text-muted-foreground">
                  Here&apos;s what you get when you subscribe. Real-time data
                  freshness tracking, venue-level coverage monitoring, and
                  instant access to historical data across every asset class.
                </p>
              </div>

              {/* What the platform looks like — preview cards */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Data Freshness Monitoring
                </h3>
                <div className="space-y-4">
                  {MOCK_SHARD_AVAILABILITY.map((shard) => (
                    <Card
                      key={`${shard.venue}-${shard.dataType}`}
                      className="border-sky-500/20"
                    >
                      <CardContent className="pt-5">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <span className="text-base font-semibold capitalize">
                              {shard.venue}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {shard.folder}
                            </Badge>
                            {shard.gcpCompletionPct > 0 && (
                              <Badge
                                variant="outline"
                                className="text-xs text-blue-400 border-blue-400/30"
                              >
                                GCP
                              </Badge>
                            )}
                            {shard.awsCompletionPct > 0 && (
                              <Badge
                                variant="outline"
                                className="text-xs text-orange-400 border-orange-400/30"
                              >
                                AWS
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-muted-foreground">
                              {shard.datesChecked} days
                            </span>
                            <span className="text-muted-foreground">
                              {shard.datesMissing} gaps
                            </span>
                            <span
                              className={cn(
                                "font-mono font-bold",
                                shard.completionPct >= 96
                                  ? "text-emerald-400"
                                  : shard.completionPct >= 90
                                    ? "text-yellow-400"
                                    : "text-red-400",
                              )}
                            >
                              {shard.completionPct}%
                            </span>
                          </div>
                        </div>
                        <FreshnessHeatmap
                          dateMap={shard.byDate ?? {}}
                          label={`${shard.dataType}`}
                          cloud={shard.gcpCompletionPct > 0 ? "gcp" : "aws"}
                          weeksToShow={13}
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Subscription Management
                </h3>
                <Card className="border-sky-500/20">
                  <CardContent className="pt-5">
                    <p className="text-xs text-muted-foreground mb-4">
                      Once subscribed, your portal shows active data feeds,
                      coverage status, and access controls per venue.
                    </p>
                    <div className="space-y-2">
                      {[
                        {
                          label: "CeFi Perpetuals — All Venues",
                          categories: ["cefi"],
                          venues: "Binance, OKX, Bybit, Deribit",
                          mode: "in_system",
                          status: "active",
                        },
                        {
                          label: "TradFi Futures — CME + Databento",
                          categories: ["tradfi"],
                          venues: "CME, CBOT, NYMEX",
                          mode: "in_system",
                          status: "active",
                        },
                        {
                          label: "DeFi Pool State — Uniswap V3",
                          categories: ["defi"],
                          venues: "Uniswap V3",
                          mode: "download",
                          status: "active",
                        },
                        {
                          label: "Sports Odds — Premier League",
                          categories: ["sports"],
                          venues: "Betfair, Pinnacle",
                          mode: "in_system",
                          status: "pending",
                        },
                      ].map((sub) => (
                        <div
                          key={sub.label}
                          className="flex items-center justify-between rounded-lg border border-border/50 bg-card px-4 py-3"
                        >
                          <div>
                            <div className="text-sm font-medium">
                              {sub.label}
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">
                              {sub.venues}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {sub.categories.map((c) => (
                              <Badge
                                key={c}
                                variant="secondary"
                                className="text-[10px]"
                              >
                                {c}
                              </Badge>
                            ))}
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px]",
                                sub.mode === "in_system"
                                  ? "border-emerald-500/30 text-emerald-400"
                                  : "border-amber-500/30 text-amber-400",
                              )}
                            >
                              {sub.mode === "in_system"
                                ? "In-System"
                                : "Download"}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px]",
                                sub.status === "active"
                                  ? "border-emerald-500/30 text-emerald-400"
                                  : "border-yellow-500/30 text-yellow-400",
                              )}
                            >
                              {sub.status === "active"
                                ? "● Active"
                                : "◌ Pending"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* CTAs */}
              <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-8 text-center">
                <h3 className="text-lg font-semibold mb-2">
                  Ready to explore the data?
                </h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-lg mx-auto">
                  Book a live demo to see real data freshness, query
                  instruments, and explore pricing for your specific venue and
                  instrument requirements.
                </p>
                <div className="flex justify-center gap-3">
                  <Button size="lg" asChild>
                    <Link href="/contact?service=data&action=demo">
                      Book a Live Demo
                      <ArrowRight className="ml-2 size-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/contact">Contact Sales</Link>
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
