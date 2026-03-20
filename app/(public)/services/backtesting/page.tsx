"use client"

import * as React from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  ArrowRight,
  Cpu,
  Play,
  CheckCircle2,
  Zap,
} from "lucide-react"

// This page explains the service and then redirects to the Quant/ML view
export default function BacktestingServicePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="container px-4 py-12 md:px-6">
        <div className="mx-auto max-w-4xl">
          {/* Hero */}
          <div className="mb-12 text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-violet-400/10">
              <LineChart className="size-8 text-violet-400" />
            </div>
            <h1 className="text-3xl font-bold">Backtesting as a Service</h1>
            <p className="mt-2 text-lg text-muted-foreground">
              The world&apos;s only backtesting platform covering Sports, DeFi, Options, Crypto Perps, and TradFi Futures
            </p>
          </div>

          {/* Features */}
          <div className="grid gap-4 md:grid-cols-3 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <Cpu className="size-8 text-violet-400 mb-2" />
                <CardTitle className="text-base">Multi-Asset Engine</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Simulate strategies across 5 asset classes with realistic fills, slippage, and costs
                </CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <Zap className="size-8 text-amber-400 mb-2" />
                <CardTitle className="text-base">GPU-Accelerated</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Run 1000+ parameter combinations in parallel with cloud GPU infrastructure
                </CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <Play className="size-8 text-emerald-400 mb-2" />
                <CardTitle className="text-base">No-Code Interface</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Natural language agent interface or visual strategy builder - no coding required
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          {/* Pricing Tiers */}
          <div className="grid gap-4 md:grid-cols-3 mb-8">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Starter</CardTitle>
                <div className="text-2xl font-bold">£8,000<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-emerald-400" />
                  100 backtest hours/mo
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-emerald-400" />
                  2 asset classes
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-emerald-400" />
                  Basic reporting
                </div>
              </CardContent>
            </Card>
            <Card className="border-primary">
              <CardHeader>
                <Badge className="w-fit mb-2">Popular</Badge>
                <CardTitle>Professional</CardTitle>
                <div className="text-2xl font-bold">£15,000<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-emerald-400" />
                  500 backtest hours/mo
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-emerald-400" />
                  All 5 asset classes
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-emerald-400" />
                  Advanced analytics
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-emerald-400" />
                  API access
                </div>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Enterprise</CardTitle>
                <div className="text-2xl font-bold">Custom</div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-emerald-400" />
                  Unlimited hours
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-emerald-400" />
                  Dedicated GPUs
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-emerald-400" />
                  Custom integrations
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-emerald-400" />
                  SLA support
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CTA */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Ready to start backtesting? Access our Quant/ML platform with your subscription.
            </p>
            <Button size="lg" asChild>
              <Link href="/quant?service=backtesting">
                Launch Backtesting Platform
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
                Preview what your backtesting workflow looks like inside the platform.
              </p>
            </div>

            {/* Strategy Config Preview */}
            <Card className="mb-6 border-violet-500/20">
              <CardHeader>
                <CardTitle className="text-base">Strategy Configuration</CardTitle>
                <CardDescription>Define parameters, asset classes, and execution rules</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-3">
                  {[
                    { label: "Strategy", value: "Mean Reversion — BTC Perps" },
                    { label: "Asset Class", value: "Crypto CeFi" },
                    { label: "Lookback", value: "6 months" },
                    { label: "Venues", value: "Binance, OKX, Bybit" },
                    { label: "Slippage Model", value: "Empirical (tick-level)" },
                    { label: "GPU Workers", value: "4x A100" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg border border-border/50 bg-muted/30 px-3 py-2">
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</div>
                      <div className="text-sm font-medium mt-0.5">{item.value}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Backtest Results Table Preview */}
            <Card className="border-violet-500/20">
              <CardHeader>
                <CardTitle className="text-base">Backtest Results</CardTitle>
                <CardDescription>Compare parameter sweeps side by side</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs text-muted-foreground">
                        <th className="pb-2 pr-4">Run</th>
                        <th className="pb-2 pr-4">Sharpe</th>
                        <th className="pb-2 pr-4">Return</th>
                        <th className="pb-2 pr-4">Max DD</th>
                        <th className="pb-2 pr-4">Win Rate</th>
                        <th className="pb-2">Trades</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono">
                      {[
                        { run: "MR-001", sharpe: "2.41", ret: "+38.7%", dd: "-4.2%", wr: "62%", trades: "1,847" },
                        { run: "MR-002", sharpe: "1.98", ret: "+29.1%", dd: "-6.8%", wr: "58%", trades: "2,103" },
                        { run: "MR-003", sharpe: "2.87", ret: "+44.3%", dd: "-3.1%", wr: "65%", trades: "1,592" },
                        { run: "MR-004", sharpe: "1.54", ret: "+18.6%", dd: "-9.4%", wr: "53%", trades: "2,890" },
                      ].map((row) => (
                        <tr key={row.run} className="border-b border-border/50">
                          <td className="py-2 pr-4 font-medium">{row.run}</td>
                          <td className="py-2 pr-4 text-sky-400">{row.sharpe}</td>
                          <td className="py-2 pr-4 text-emerald-400">{row.ret}</td>
                          <td className="py-2 pr-4 text-rose-400">{row.dd}</td>
                          <td className="py-2 pr-4">{row.wr}</td>
                          <td className="py-2">{row.trades}</td>
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

      {/* CTAs */}
      <section className="border-t border-border">
        <div className="container px-4 py-16 md:px-6">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-8 text-center max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold mb-2">Ready to get started?</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Book a live demo to see the platform, or create your account to start exploring.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button size="lg" asChild>
                <Link href="/contact?service=backtesting&action=demo">
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
  )
}
