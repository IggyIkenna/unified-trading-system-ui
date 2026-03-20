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
                <CardTitle className="text-base">No-Code + Full API</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  No-code web interface for visual strategy building, or full backend API for programmatic integration with your own tools. Your choice.
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          {/* What's Included */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-2">What Research & Backtesting Covers</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Three layers working together: train ML models to generate signals, configure strategies
              to act on those signals, and define execution rules for how orders hit the market.
              Your subscription tier determines the depth of each layer.
            </p>
          </div>

          {/* Subscription Tiers */}
          <div className="grid gap-4 md:grid-cols-3 mb-8">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Starter</CardTitle>
                <div className="text-lg font-bold text-primary">Contact Sales</div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">ML & Features</div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-4 text-emerald-400" /> Pre-built feature sets</div>
                  <div className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-4 text-emerald-400" /> 2 model families (direction, volatility)</div>
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-3">Strategy & Signals</div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-4 text-emerald-400" /> Standard signal templates</div>
                  <div className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-4 text-emerald-400" /> 2 asset classes</div>
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-3">Execution & Algos</div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-4 text-emerald-400" /> Default algos (TWAP, VWAP)</div>
                  <div className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-4 text-emerald-400" /> 100 backtest hours/mo</div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-primary">
              <CardHeader>
                <Badge className="w-fit mb-2">Popular</Badge>
                <CardTitle>Professional</CardTitle>
                <div className="text-lg font-bold text-primary">Contact Sales</div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">ML & Features</div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-4 text-emerald-400" /> Custom feature engineering</div>
                  <div className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-4 text-emerald-400" /> All model families + custom training</div>
                  <div className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-4 text-emerald-400" /> Champion/challenger model testing</div>
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-3">Strategy & Signals</div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-4 text-emerald-400" /> Full signal configuration</div>
                  <div className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-4 text-emerald-400" /> All 5 asset classes</div>
                  <div className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-4 text-emerald-400" /> Cross-asset strategies</div>
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-3">Execution & Algos</div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-4 text-emerald-400" /> Advanced algos (IS, SOR, Sniper)</div>
                  <div className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-4 text-emerald-400" /> 500 backtest hours/mo + API access</div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Enterprise</CardTitle>
                <div className="text-lg font-bold text-primary">Contact Sales</div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">ML & Features</div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-4 text-emerald-400" /> Dedicated GPU training clusters</div>
                  <div className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-4 text-emerald-400" /> Custom model architectures</div>
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-3">Strategy & Signals</div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-4 text-emerald-400" /> Unlimited strategies + bespoke signals</div>
                  <div className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-4 text-emerald-400" /> Custom venue/instrument combinations</div>
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-3">Execution & Algos</div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-4 text-emerald-400" /> Custom algo development + backtested deployment</div>
                  <div className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-4 text-emerald-400" /> Unlimited hours + SLA support</div>
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

      {/* Control Levels */}
      <section className="py-12 border-t border-border">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-4xl">
            <h3 className="text-lg font-semibold mb-2">How You Can Use This</h3>
            <p className="text-sm text-muted-foreground mb-6">Choose your level of control. Mix and match as needed.</p>
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Self-Service</CardTitle>
                  <CardDescription className="text-xs">Our tools, your research</CardDescription>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-1.5">
                  <div className="flex items-center gap-2"><CheckCircle2 className="size-3 text-emerald-400 shrink-0" /> Web interface for visual strategy building</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="size-3 text-emerald-400 shrink-0" /> Full API access for programmatic backtesting</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="size-3 text-emerald-400 shrink-0" /> GPU-accelerated parameter sweeps</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="size-3 text-emerald-400 shrink-0" /> Pre-built feature sets and model families</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Managed</CardTitle>
                  <CardDescription className="text-xs">We research for you</CardDescription>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-1.5">
                  <div className="flex items-center gap-2"><CheckCircle2 className="size-3 text-emerald-400 shrink-0" /> Odum quant team designs and tests strategies</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="size-3 text-emerald-400 shrink-0" /> Custom model training and feature engineering</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="size-3 text-emerald-400 shrink-0" /> Regular strategy review and optimisation</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="size-3 text-emerald-400 shrink-0" /> Champion/challenger testing before live deployment</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">BYO</CardTitle>
                  <CardDescription className="text-xs">Your models and signals, our infrastructure</CardDescription>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-1.5">
                  <div className="flex items-center gap-2"><CheckCircle2 className="size-3 text-emerald-400 shrink-0" /> Bring your own models, signals, and logic</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="size-3 text-emerald-400 shrink-0" /> Run on our data and compute infrastructure</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="size-3 text-emerald-400 shrink-0" /> Same backtesting engine and realistic fills</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="size-3 text-emerald-400 shrink-0" /> Seamless promotion to live trading</div>
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
