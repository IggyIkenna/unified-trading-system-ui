"use client"

import * as React from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Cpu,
  Play,
  Clock,
  CheckCircle2,
  Zap,
} from "lucide-react"

// This page explains the service and then redirects to the Quant/ML view
export default function BacktestingServicePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary">
                <Sparkles className="size-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold">Odum Research</span>
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm font-medium">Backtesting as a Service</span>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 size-4" />
              Back
            </Link>
          </Button>
        </div>
      </header>

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
                <div className="text-2xl font-bold">$199<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
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
                <div className="text-2xl font-bold">$499<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
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
    </div>
  )
}
