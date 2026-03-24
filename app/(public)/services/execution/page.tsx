"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Zap,
  ArrowRight,
  Shield,
  TrendingUp,
  CheckCircle2,
  Activity,
  Globe,
  Clock,
} from "lucide-react";

export default function ExecutionServicePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="container px-4 py-12 md:px-6">
        <div className="mx-auto max-w-4xl">
          {/* Hero */}
          <div className="mb-12 text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-emerald-400/10">
              <Zap className="size-8 text-emerald-400" />
            </div>
            <Badge variant="outline" className="mb-4">
              MiFID II Compliant
            </Badge>
            <h1 className="text-3xl font-bold">Execution as a Service</h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Institutional execution algorithms - TWAP, VWAP, SOR,
              Almgren-Chriss - charged on alpha generated.
            </p>
          </div>

          {/* Algo Types */}
          <div className="grid gap-4 md:grid-cols-3 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <Clock className="size-8 text-sky-400 mb-2" />
                <CardTitle className="text-base">Time-Weighted</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  TWAP and scheduled execution with customisable time slices and
                  participation rates
                </CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <Activity className="size-8 text-violet-400 mb-2" />
                <CardTitle className="text-base">Volume-Weighted</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  VWAP with historical volume profiles and real-time adaptation
                  to market conditions
                </CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <Globe className="size-8 text-amber-400 mb-2" />
                <CardTitle className="text-base">Smart Order Routing</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Multi-venue SOR with latency-optimised routing across 33
                  connected venues
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          {/* Algorithm List */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Available Algorithms</CardTitle>
              <CardDescription>
                All algorithms support TradFi, Crypto CeFi, and DeFi venues
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { name: "TWAP", desc: "Time-weighted average price execution" },
                {
                  name: "VWAP",
                  desc: "Volume-weighted average price tracking",
                },
                { name: "POV", desc: "Percentage of volume participation" },
                { name: "IS", desc: "Implementation shortfall minimisation" },
                {
                  name: "Almgren-Chriss",
                  desc: "Optimal execution with market impact",
                },
                {
                  name: "Iceberg",
                  desc: "Hidden liquidity with visible slices",
                },
                { name: "SOR", desc: "Smart order routing across venues" },
                { name: "DeFi MEV", desc: "MEV-protected DeFi execution" },
                { name: "Arb", desc: "Cross-venue arbitrage capture" },
              ].map((algo) => (
                <div
                  key={algo.name}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <CheckCircle2 className="size-5 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-medium font-mono">{algo.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {algo.desc}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Smart Execution Alpha */}
          <section className="mt-8">
            <Card className="border-emerald-500/50 bg-gradient-to-r from-emerald-500/5 to-emerald-500/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <CardContent className="pt-6 relative">
                <div className="flex items-start gap-4">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-500/10">
                    <Zap className="size-6 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold">
                        Smart Execution Alpha
                      </h3>
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                        Alpha-Aligned Pricing
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      A custom-optimised execution algorithm tailored to your
                      specific instrument, market structure, and liquidity
                      profile. We believe in it so much that our pricing is
                      aligned with your alpha -- we only earn when your
                      execution beats the benchmark.
                    </p>
                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                      <div className="rounded-lg border border-border/50 bg-card p-3">
                        <p className="text-xs font-semibold text-emerald-400">
                          Custom-Built
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Tailored to your instrument and market dynamics
                        </p>
                      </div>
                      <div className="rounded-lg border border-border/50 bg-card p-3">
                        <p className="text-xs font-semibold text-emerald-400">
                          Alpha-Aligned
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          We only earn when you beat the execution benchmark
                        </p>
                      </div>
                      <div className="rounded-lg border border-border/50 bg-card p-3">
                        <p className="text-xs font-semibold text-emerald-400">
                          IP-Protected
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Implementation details are proprietary and
                          confidential
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                      asChild
                    >
                      <Link href="/contact?service=execution&action=smart-alpha">
                        Discuss with Our Execution Team{" "}
                        <ArrowRight className="ml-1 size-3" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Pricing */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Alpha-Based Pricing</CardTitle>
              <CardDescription>
                You only pay when we generate alpha
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                    Standard
                  </div>
                  <div className="text-3xl font-bold text-emerald-400">30%</div>
                  <div className="text-sm text-muted-foreground">
                    of Alpha Generated
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    No base fee. Pay only on positive alpha.
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 border border-emerald-400/30">
                  <Badge className="mb-2">High Volume</Badge>
                  <div className="text-3xl font-bold text-emerald-400">20%</div>
                  <div className="text-sm text-muted-foreground">
                    of Alpha Generated
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    $1M+ monthly volume qualifies.
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Alpha is measured as slippage reduction vs. arrival price
                benchmark. Negative alpha = no charge.
              </p>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Monitor your execution performance, alpha tracking, and order flow
              in the Trader dashboard.
            </p>
            <Button size="lg" asChild>
              <Link href="/services/execution/overview">
                View Execution Dashboard
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </main>

      {/* See It In Action */}
      <section className="border-t border-border">
        <div className="container px-4 py-16 md:px-6">
          <div className="mx-auto max-w-4xl">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold">See It In Action</h2>
              <p className="mt-2 text-muted-foreground">
                Preview execution analytics, venue connectivity, and algo
                performance inside the platform.
              </p>
              <Button className="mt-4" asChild>
                <Link href="/contact?service=execution&action=demo">
                  Book a Live Demo <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </div>

            {/* Venue Connectivity Preview */}
            <Card className="mb-6 border-emerald-500/20">
              <CardHeader>
                <CardTitle className="text-base">Venue Connectivity</CardTitle>
                <CardDescription>
                  Real-time connection status across all 33 venues
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 md:grid-cols-3">
                  {[
                    {
                      venue: "Binance",
                      latency: "2.1ms",
                      status: "Connected",
                      fills: "99.7%",
                    },
                    {
                      venue: "OKX",
                      latency: "3.4ms",
                      status: "Connected",
                      fills: "99.2%",
                    },
                    {
                      venue: "CME",
                      latency: "1.8ms",
                      status: "Connected",
                      fills: "99.9%",
                    },
                    {
                      venue: "Uniswap V3",
                      latency: "12.3ms",
                      status: "Connected",
                      fills: "98.1%",
                    },
                    {
                      venue: "Bybit",
                      latency: "2.8ms",
                      status: "Connected",
                      fills: "99.4%",
                    },
                    {
                      venue: "Deribit",
                      latency: "4.1ms",
                      status: "Connected",
                      fills: "99.6%",
                    },
                  ].map((v) => (
                    <div
                      key={v.venue}
                      className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 px-3 py-2"
                    >
                      <div>
                        <div className="text-sm font-medium">{v.venue}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {v.latency} avg
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant="outline"
                          className="text-[10px] border-emerald-500/30 text-emerald-400"
                        >
                          {v.status}
                        </Badge>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {v.fills} fill rate
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Algo Performance Preview */}
            <Card className="border-emerald-500/20">
              <CardHeader>
                <CardTitle className="text-base">
                  Algorithm Performance
                </CardTitle>
                <CardDescription>
                  Alpha generation and slippage reduction by algo type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs text-muted-foreground">
                        <th className="pb-2 pr-4">Algorithm</th>
                        <th className="pb-2 pr-4">Orders</th>
                        <th className="pb-2 pr-4">Avg Alpha</th>
                        <th className="pb-2 pr-4">Slippage</th>
                        <th className="pb-2">Fill Rate</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono">
                      {[
                        {
                          algo: "TWAP",
                          orders: "4,218",
                          alpha: "+1.8bps",
                          slip: "0.3bps",
                          fill: "99.8%",
                        },
                        {
                          algo: "VWAP",
                          orders: "3,102",
                          alpha: "+2.4bps",
                          slip: "0.5bps",
                          fill: "99.6%",
                        },
                        {
                          algo: "SOR",
                          orders: "6,847",
                          alpha: "+3.1bps",
                          slip: "0.2bps",
                          fill: "99.9%",
                        },
                        {
                          algo: "IS",
                          orders: "1,956",
                          alpha: "+4.7bps",
                          slip: "0.8bps",
                          fill: "99.1%",
                        },
                      ].map((row) => (
                        <tr
                          key={row.algo}
                          className="border-b border-border/50"
                        >
                          <td className="py-2 pr-4 font-medium">{row.algo}</td>
                          <td className="py-2 pr-4">{row.orders}</td>
                          <td className="py-2 pr-4 text-emerald-400">
                            {row.alpha}
                          </td>
                          <td className="py-2 pr-4 text-amber-400">
                            {row.slip}
                          </td>
                          <td className="py-2">{row.fill}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Control Levels */}
      <section className="py-12 border-t border-border">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-4xl">
            <h3 className="text-lg font-semibold mb-2">How You Can Use This</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Choose your level of control. Mix and match as needed.
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Self-Service</CardTitle>
                  <CardDescription className="text-xs">
                    Choose algos, configure params
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-1.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />{" "}
                    Select from standard algo library (TWAP, VWAP, SOR, IS)
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />{" "}
                    Configure participation rates and time slices
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />{" "}
                    Real-time alpha and slippage monitoring
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />{" "}
                    API access for programmatic order submission
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Managed</CardTitle>
                  <CardDescription className="text-xs">
                    We optimise algo selection for you
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-1.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />{" "}
                    Odum execution team selects optimal algo per order
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />{" "}
                    Dynamic parameter tuning based on market conditions
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />{" "}
                    Venue routing optimisation across 33 venues
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />{" "}
                    Monthly TCA reports and execution quality review
                  </div>
                </CardContent>
              </Card>
              <Card className="border-emerald-500/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Smart Alpha</CardTitle>
                  <CardDescription className="text-xs">
                    Custom algo, alpha-aligned pricing
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-1.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />{" "}
                    Custom-built algo for your instrument and market
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />{" "}
                    Alpha-aligned pricing -- we earn only when you beat
                    benchmark
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />{" "}
                    Proprietary and confidential implementation
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />{" "}
                    Dedicated execution team engagement
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTAs */}
      <section className="border-t border-border">
        <div className="container px-4 py-16 md:px-6">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-8 text-center max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold mb-2">
              Ready to get started?
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Book a live demo to see the platform, or create your account to
              start exploring.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button size="lg" asChild>
                <Link href="/contact?service=execution&action=demo">
                  Book a Live Demo
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">Contact Sales</Link>
              </Button>
              <Button size="lg" variant="ghost" asChild>
                <Link href="/signup">Create Account</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
