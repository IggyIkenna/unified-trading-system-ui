"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Layers,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Shield,
  Activity,
  BarChart3,
  Eye,
  Zap,
  GitCompareArrows,
} from "lucide-react";

const HERO_METRICS = [
  { label: "P&L Factors", value: "10" },
  { label: "Connected Venues", value: "33" },
  { label: "Risk Dimensions", value: "6" },
  { label: "Latency", value: "<50ms" },
];

const CATALOGUE_ITEMS = [
  {
    icon: TrendingUp,
    title: "Live P&L Attribution",
    description:
      "Real-time P&L decomposed by factor: funding, carry, basis, delta, gamma, vega, theta, slippage, fees, and rebates.",
  },
  {
    icon: Eye,
    title: "Position Monitoring",
    description:
      "Cross-venue position grid with live mark-to-market, notional exposure, and margin utilisation across all connected venues.",
  },
  {
    icon: Shield,
    title: "Risk Analytics",
    description:
      "Exposure heatmaps, VaR (parametric + historical), Greeks, position limits, and circuit breaker status in a single view.",
  },
  {
    icon: GitCompareArrows,
    title: "T+1 Backtest-vs-Live Diff",
    description:
      "Same-code execution in backtest and live. T+1 diff monitoring flags divergence in fills, slippage, and signal timing.",
  },
  {
    icon: Zap,
    title: "Model Acceptance",
    description:
      "Accept promoted models from the batch pipeline. Light-touch approval: review champion/challenger metrics, then deploy to live.",
  },
  {
    icon: Activity,
    title: "Recent Fills & Trade History",
    description:
      "Full order audit trail with fill prices, venue, algo used, slippage vs. arrival, and MiFID II best-execution fields.",
  },
];

export default function PlatformServicePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative border-b border-border overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-950/40 via-background to-background" />
        <div className="container relative px-4 py-20 md:px-6 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <Badge
              variant="outline"
              className="mb-4 border-amber-500/30 text-amber-400 text-xs"
            >
              <Layers className="mr-1.5 size-3" />
              Live Trading Platform
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              Live analytics.{" "}
              <span className="text-amber-400">Real-time control.</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              P&amp;L attribution by factor, position monitoring across all venues,
              risk analytics, and same-code backtest-vs-live diff tracking —
              everything you need to operate a live systematic trading book.
            </p>
            <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">
              Full web dashboards for monitoring and control, with API access for custom integrations.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" asChild>
                <Link href="/contact?service=platform&action=demo">
                  Book a Live Demo
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">Contact Sales</Link>
              </Button>
            </div>
            <div className="mt-12 grid grid-cols-4 gap-4">
              {HERO_METRICS.map((m) => (
                <div
                  key={m.label}
                  className="rounded-lg border border-border bg-card/60 px-4 py-3"
                >
                  <div className="text-2xl font-bold font-mono text-amber-400">
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

      {/* Block 1: Catalogue */}
      <section className="container px-4 py-16 md:px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-2">
            What the Live Trading Platform Includes
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
            Six core capabilities for operating a live systematic trading book.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {CATALOGUE_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-amber-400/10">
                        <Icon className="size-5 text-amber-400" />
                      </div>
                      <CardTitle className="text-base">{item.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{item.description}</CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Block 2: Demo Preview */}
      <section className="border-t border-border">
        <div className="container px-4 py-16 md:px-6">
          <div className="mx-auto max-w-4xl">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold">See It In Action</h2>
              <p className="mt-2 text-muted-foreground">
                Preview the trading dashboard, P&L waterfall, and position grid.
              </p>
              <Button className="mt-4" asChild>
                <Link href="/contact?service=platform&action=demo">
                  Book a Live Demo <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </div>

            {/* P&L Waterfall Preview */}
            <Card className="mb-6 border-amber-500/20">
              <CardHeader>
                <CardTitle className="text-base">
                  P&L Attribution Waterfall
                </CardTitle>
                <CardDescription>
                  Today&apos;s P&L decomposed by factor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 md:grid-cols-5">
                  {[
                    {
                      factor: "Delta",
                      value: "+$18,420",
                      color: "text-emerald-400",
                    },
                    {
                      factor: "Funding",
                      value: "+$4,210",
                      color: "text-emerald-400",
                    },
                    {
                      factor: "Carry",
                      value: "+$2,890",
                      color: "text-emerald-400",
                    },
                    {
                      factor: "Fees",
                      value: "-$3,140",
                      color: "text-rose-400",
                    },
                    {
                      factor: "Slippage",
                      value: "-$1,280",
                      color: "text-rose-400",
                    },
                  ].map((f) => (
                    <div
                      key={f.factor}
                      className="rounded-lg border border-border/50 bg-muted/30 p-3 text-center"
                    >
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        {f.factor}
                      </div>
                      <div
                        className={`text-sm font-bold font-mono mt-1 ${f.color}`}
                      >
                        {f.value}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
                  <span className="text-sm font-medium">Net P&L</span>
                  <span className="text-lg font-bold font-mono text-emerald-400">
                    +$21,100
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Position Grid + Risk Summary */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-amber-500/20">
                <CardHeader>
                  <CardTitle className="text-base">Position Grid</CardTitle>
                  <CardDescription>
                    Live positions across venues
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[
                      {
                        instrument: "BTC-PERP",
                        venue: "Binance",
                        size: "+2.5",
                        pnl: "+$8,420",
                        color: "text-emerald-400",
                      },
                      {
                        instrument: "ETH-PERP",
                        venue: "OKX",
                        size: "-1.8",
                        pnl: "-$1,240",
                        color: "text-rose-400",
                      },
                      {
                        instrument: "ES H6",
                        venue: "CME",
                        size: "+4",
                        pnl: "+$6,100",
                        color: "text-emerald-400",
                      },
                      {
                        instrument: "AAVE/USDC",
                        venue: "Uniswap",
                        size: "+850",
                        pnl: "+$2,180",
                        color: "text-emerald-400",
                      },
                    ].map((p) => (
                      <div
                        key={`${p.instrument}-${p.venue}`}
                        className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 px-3 py-2"
                      >
                        <div>
                          <div className="text-sm font-medium font-mono">
                            {p.instrument}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {p.venue}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">
                            {p.size}
                          </div>
                          <div
                            className={`text-sm font-mono font-medium ${p.color}`}
                          >
                            {p.pnl}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-amber-500/20">
                <CardHeader>
                  <CardTitle className="text-base">Risk Summary</CardTitle>
                  <CardDescription>Real-time risk metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[
                      { label: "Gross Exposure", value: "$4.2M" },
                      { label: "Net Exposure", value: "$1.8M" },
                      { label: "VaR (95%, 1d)", value: "$42,100" },
                      { label: "Portfolio Delta", value: "0.34" },
                      { label: "Margin Utilisation", value: "62%" },
                      { label: "Circuit Breakers", value: "0 / 12 triggered" },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 px-3 py-2"
                      >
                        <span className="text-sm text-muted-foreground">
                          {item.label}
                        </span>
                        <span className="text-sm font-medium font-mono">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Block 3: Control Matrix */}
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
                    Full dashboards and API — no code required
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-1.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />{" "}
                    Monitor P&amp;L, positions, and risk from the web dashboard
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />{" "}
                    Deploy and configure strategies without writing code
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />{" "}
                    Self-managed risk limits and circuit breakers
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />{" "}
                    Full API access for programmatic integrations
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Managed</CardTitle>
                  <CardDescription className="text-xs">
                    We operate the platform for you
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-1.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />{" "}
                    Odum team monitors and manages live trading
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />{" "}
                    24/7 operational support
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />{" "}
                    Proactive risk intervention
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />{" "}
                    Monthly performance reviews
                  </div>
                </CardContent>
              </Card>
              <Card className="border-muted">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    Why Integrated
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Built-in controls and connectivity
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-1.5">
                  <p>
                    Real-time risk controls, venue connectivity, and regulatory
                    compliance require integrated infrastructure. This ensures
                    every trade is auditable, every position is monitored, and
                    circuit breakers work instantly.
                  </p>
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
                <Link href="/contact?service=platform&action=demo">
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
