"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Zap,
  ArrowRight,
  Shield,
  TrendingUp,
  CheckCircle2,
  Activity,
  Globe,
  Clock,
} from "lucide-react"

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
            <Badge variant="outline" className="mb-4">MiFID II Compliant</Badge>
            <h1 className="text-3xl font-bold">Execution as a Service</h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Institutional execution algorithms - TWAP, VWAP, SOR, Almgren-Chriss - charged on alpha generated.
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
                  TWAP and scheduled execution with customisable time slices and participation rates
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
                  VWAP with historical volume profiles and real-time adaptation to market conditions
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
                  Multi-venue SOR with latency-optimised routing across 33 connected venues
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          {/* Algorithm List */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Available Algorithms</CardTitle>
              <CardDescription>All algorithms support TradFi, Crypto CeFi, and DeFi venues</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { name: "TWAP", desc: "Time-weighted average price execution" },
                { name: "VWAP", desc: "Volume-weighted average price tracking" },
                { name: "POV", desc: "Percentage of volume participation" },
                { name: "IS", desc: "Implementation shortfall minimisation" },
                { name: "Almgren-Chriss", desc: "Optimal execution with market impact" },
                { name: "Iceberg", desc: "Hidden liquidity with visible slices" },
                { name: "SOR", desc: "Smart order routing across venues" },
                { name: "DeFi MEV", desc: "MEV-protected DeFi execution" },
                { name: "Arb", desc: "Cross-venue arbitrage capture" },
              ].map((algo) => (
                <div key={algo.name} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <CheckCircle2 className="size-5 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-medium font-mono">{algo.name}</div>
                    <div className="text-sm text-muted-foreground">{algo.desc}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Alpha-Based Pricing</CardTitle>
              <CardDescription>You only pay when we generate alpha</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Standard</div>
                  <div className="text-3xl font-bold text-emerald-400">30%</div>
                  <div className="text-sm text-muted-foreground">of Alpha Generated</div>
                  <div className="text-xs text-muted-foreground mt-2">No base fee. Pay only on positive alpha.</div>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 border border-emerald-400/30">
                  <Badge className="mb-2">High Volume</Badge>
                  <div className="text-3xl font-bold text-emerald-400">20%</div>
                  <div className="text-sm text-muted-foreground">of Alpha Generated</div>
                  <div className="text-xs text-muted-foreground mt-2">$1M+ monthly volume qualifies.</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Alpha is measured as slippage reduction vs. arrival price benchmark. 
                Negative alpha = no charge.
              </p>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Monitor your execution performance, alpha tracking, and order flow in the Trader dashboard.
            </p>
            <Button size="lg" asChild>
              <Link href="/overview?service=execution">
                View Execution Dashboard
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
