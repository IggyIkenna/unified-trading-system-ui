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
  Briefcase,
  ArrowRight,
  Shield,
  TrendingUp,
  FileText,
  CheckCircle2,
  PieChart,
  BarChart3,
} from "lucide-react";

export default function InvestmentServicePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="container px-4 py-12 md:px-6">
        <div className="mx-auto max-w-4xl">
          {/* Hero */}
          <div className="mb-12 text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-rose-400/10">
              <Briefcase className="size-8 text-rose-400" />
            </div>
            <Badge variant="outline" className="mb-4">
              FCA Authorised
            </Badge>
            <h1 className="text-3xl font-bold">Investment Management</h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Deep dive into your portfolio performance. Every trade, every
              order, every position — broken down by strategy, asset, and venue
              with clear visuals.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              FCA-authorised discretionary management. Co-invest at the same
              terms as our own capital. Full transparency through your investor
              portal.
            </p>
          </div>

          {/* Key Features */}
          <div className="grid gap-4 md:grid-cols-3 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <Shield className="size-8 text-rose-400 mb-2" />
                <CardTitle className="text-base">FCA Regulated</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Full FCA authorisation (FRN 975797) with segregated client
                  accounts and investor protections
                </CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <PieChart className="size-8 text-amber-400 mb-2" />
                <CardTitle className="text-base">SMA or Fund Access</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Invest via Separately Managed Account (SMA) with custom
                  parameters, or access fund structure through our affiliate
                </CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <TrendingUp className="size-8 text-emerald-400 mb-2" />
                <CardTitle className="text-base">Same Terms</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Co-invest alongside Odum principals at identical fee terms and
                  execution quality
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          {/* Performance Preview */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Sample Strategy Performance</CardTitle>
              <CardDescription>
                Live performance since February 2026
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 text-center mb-6">
                <div>
                  <div className="text-2xl font-bold text-emerald-400">
                    +34.2%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Since Feb 2026
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold">2.8</div>
                  <div className="text-xs text-muted-foreground">
                    Sharpe Ratio
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-rose-400">-3.8%</div>
                  <div className="text-xs text-muted-foreground">
                    Max Drawdown
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold">0.08</div>
                  <div className="text-xs text-muted-foreground">
                    Correlation to SPX
                  </div>
                </div>
              </div>
              {/* Time Series Chart */}
              <div className="h-[200px] w-full bg-muted/30 rounded-lg p-4">
                <svg viewBox="0 0 400 150" className="w-full h-full">
                  {/* Grid lines */}
                  <line
                    x1="40"
                    y1="20"
                    x2="40"
                    y2="130"
                    stroke="var(--border)"
                    strokeWidth="1"
                  />
                  <line
                    x1="40"
                    y1="130"
                    x2="390"
                    y2="130"
                    stroke="var(--border)"
                    strokeWidth="1"
                  />
                  <line
                    x1="40"
                    y1="75"
                    x2="390"
                    y2="75"
                    stroke="var(--border)"
                    strokeWidth="1"
                    strokeDasharray="4"
                    opacity="0.5"
                  />
                  <line
                    x1="40"
                    y1="20"
                    x2="390"
                    y2="20"
                    stroke="var(--border)"
                    strokeWidth="1"
                    strokeDasharray="4"
                    opacity="0.5"
                  />

                  {/* Y-axis labels */}
                  <text
                    x="35"
                    y="25"
                    fontSize="10"
                    fill="var(--muted-foreground)"
                    textAnchor="end"
                  >
                    40%
                  </text>
                  <text
                    x="35"
                    y="77"
                    fontSize="10"
                    fill="var(--muted-foreground)"
                    textAnchor="end"
                  >
                    20%
                  </text>
                  <text
                    x="35"
                    y="133"
                    fontSize="10"
                    fill="var(--muted-foreground)"
                    textAnchor="end"
                  >
                    0%
                  </text>

                  {/* X-axis labels */}
                  <text
                    x="40"
                    y="145"
                    fontSize="10"
                    fill="var(--muted-foreground)"
                  >
                    Feb
                  </text>
                  <text
                    x="215"
                    y="145"
                    fontSize="10"
                    fill="var(--muted-foreground)"
                    textAnchor="middle"
                  >
                    Mar
                  </text>
                  <text
                    x="390"
                    y="145"
                    fontSize="10"
                    fill="var(--muted-foreground)"
                    textAnchor="end"
                  >
                    Today
                  </text>

                  {/* Performance line - Feb to Mar showing growth to 34.2% */}
                  <path
                    d="M 40 130 Q 80 125, 120 115 T 180 95 T 240 70 T 300 55 T 360 40 L 390 36"
                    fill="none"
                    stroke="#4ade80"
                    strokeWidth="2"
                  />
                  <path
                    d="M 40 130 Q 80 125, 120 115 T 180 95 T 240 70 T 300 55 T 360 40 L 390 36 L 390 130 L 40 130 Z"
                    fill="url(#greenGradient)"
                    opacity="0.2"
                  />

                  {/* Gradient definition */}
                  <defs>
                    <linearGradient
                      id="greenGradient"
                      x1="0%"
                      y1="0%"
                      x2="0%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#4ade80" />
                      <stop offset="100%" stopColor="#4ade80" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Current value marker */}
                  <circle cx="390" cy="36" r="4" fill="#4ade80" />
                  <text
                    x="375"
                    y="28"
                    fontSize="11"
                    fill="#4ade80"
                    fontWeight="bold"
                  >
                    +34.2%
                  </text>
                </svg>
              </div>
            </CardContent>
          </Card>

          {/* Fee Structure */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Fee Structure</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <span>Management Fee</span>
                <span className="font-mono font-medium">0%</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <div>
                  <span>Performance Fee</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    (varies by strategy)
                  </span>
                </div>
                <span className="font-mono font-medium">20-40% (HWM)</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <span>Minimum Investment</span>
                <span className="font-mono font-medium">$100,000</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Redemption Notice</span>
                <span className="font-mono font-medium">30 days</span>
              </div>
            </CardContent>
          </Card>

          {/* Requirements */}
          <div className="bg-muted/50 rounded-lg p-6 mb-8">
            <h3 className="font-medium mb-4 flex items-center gap-2">
              <FileText className="size-5" />
              Investor Requirements
            </h3>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="size-4 text-emerald-400" />
                Professional Client or Eligible Counterparty
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="size-4 text-emerald-400" />
                Completed investor suitability assessment
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="size-4 text-emerald-400" />
                KYC/AML documentation
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="size-4 text-emerald-400" />
                Signed subscription agreement
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              View your portfolio performance, NAV, and monthly reports in the
              Executive dashboard.
            </p>
            <Button size="lg" asChild>
              <Link href="/signup?service=investment">
                Get Started
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
                Preview the investor portal with portfolio overview, P&amp;L
                attribution, and settlement tracking.
              </p>
              <Button className="mt-4" asChild>
                <Link href="/contact?service=investment&action=demo">
                  Book a Live Demo <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </div>

            {/* Portfolio Overview Preview */}
            <Card className="mb-6 border-rose-500/20">
              <CardHeader>
                <CardTitle className="text-base">Portfolio Overview</CardTitle>
                <CardDescription>
                  Real-time NAV, allocation, and performance tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4 text-center mb-4">
                  <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                    <div className="text-xl font-bold font-mono text-emerald-400">
                      $2.4M
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Net Asset Value
                    </div>
                  </div>
                  <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                    <div className="text-xl font-bold font-mono text-emerald-400">
                      +12.8%
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      MTD Return
                    </div>
                  </div>
                  <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                    <div className="text-xl font-bold font-mono text-rose-400">
                      -2.1%
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Max Drawdown
                    </div>
                  </div>
                  <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                    <div className="text-xl font-bold font-mono">2.6</div>
                    <div className="text-[10px] text-muted-foreground">
                      Sharpe Ratio
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    {
                      strategy: "Crypto Momentum",
                      alloc: "35%",
                      pnl: "+$84,200",
                      attr: "+3.5%",
                    },
                    {
                      strategy: "TradFi Carry",
                      alloc: "25%",
                      pnl: "+$52,100",
                      attr: "+2.2%",
                    },
                    {
                      strategy: "DeFi Yield",
                      alloc: "20%",
                      pnl: "+$41,800",
                      attr: "+1.7%",
                    },
                    {
                      strategy: "Sports Arb",
                      alloc: "20%",
                      pnl: "+$38,400",
                      attr: "+1.6%",
                    },
                  ].map((row) => (
                    <div
                      key={row.strategy}
                      className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-sm"
                    >
                      <span className="font-medium">{row.strategy}</span>
                      <div className="flex items-center gap-4 font-mono text-xs">
                        <span className="text-muted-foreground">
                          {row.alloc}
                        </span>
                        <span className="text-emerald-400">{row.pnl}</span>
                        <span className="text-emerald-400">{row.attr}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Settlement Preview */}
            <Card className="border-rose-500/20">
              <CardHeader>
                <CardTitle className="text-base">
                  Settlement &amp; Reporting
                </CardTitle>
                <CardDescription>
                  Monthly statements, fee calculations, and audit trail
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    {
                      period: "Mar 2026",
                      nav: "$2,416,500",
                      perf: "+8.2%",
                      fee: "$19,332",
                      status: "Pending",
                    },
                    {
                      period: "Feb 2026",
                      nav: "$2,232,800",
                      perf: "+12.4%",
                      fee: "$27,687",
                      status: "Settled",
                    },
                    {
                      period: "Jan 2026",
                      nav: "$1,986,200",
                      perf: "+6.1%",
                      fee: "$12,118",
                      status: "Settled",
                    },
                  ].map((row) => (
                    <div
                      key={row.period}
                      className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-sm"
                    >
                      <span className="font-medium">{row.period}</span>
                      <div className="flex items-center gap-4 font-mono text-xs">
                        <span>{row.nav}</span>
                        <span className="text-emerald-400">{row.perf}</span>
                        <span className="text-muted-foreground">{row.fee}</span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${row.status === "Settled" ? "border-emerald-500/30 text-emerald-400" : "border-amber-500/30 text-amber-400"}`}
                        >
                          {row.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
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
              Choose your level of involvement. All options are FCA-regulated.
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="border-muted">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Why Managed Only</CardTitle>
                  <CardDescription className="text-xs">
                    FCA-regulated discretionary management
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-1.5">
                  <p>
                    Investment management is a regulated activity. All
                    portfolios are managed by our FCA-authorised team with full
                    audit trail, best execution monitoring, and regulatory
                    reporting built in.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-rose-500/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Managed</CardTitle>
                  <CardDescription className="text-xs">
                    Full discretionary management
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-1.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />{" "}
                    Fully discretionary portfolio management
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />{" "}
                    Co-invest at same terms as house principals
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />{" "}
                    SMA or fund structure via affiliate
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />{" "}
                    Monthly NAV reporting and performance attribution
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">BYO Thesis</CardTitle>
                  <CardDescription className="text-xs">
                    Your investment thesis, we build and execute
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-1.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />{" "}
                    Bring your investment thesis or strategy ideas
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />{" "}
                    We backtest, build, and deploy the strategy
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />{" "}
                    Managed execution on our infrastructure
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />{" "}
                    Custom risk parameters and allocation constraints
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
                <Link href="/contact?service=investment&action=demo">
                  Book a Live Demo
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">Contact Sales</Link>
              </Button>
              <Button size="lg" variant="ghost" asChild>
                <Link href="/signup?service=investment">Create Account</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
