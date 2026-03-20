"use client"

import Link from "next/link"
import { ArrowRight, Check, Database, Brain, FlaskConical, Zap, BarChart3, Shield, FileText, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

/*
 * Engagement models — describes the user journey through our services
 * without internal jargon. Each tier adds depth:
 *
 * Data Access: you get the data
 * Research & Backtesting: you train models, build signals, test strategies
 * Execution as a Service: we run your strategies live
 * Full Platform: end-to-end, we manage everything
 */

const ENGAGEMENT_TIERS = [
  {
    id: "data",
    name: "Data Access",
    tagline: "See every market, every venue, every asset class.",
    description: "Access our unified data layer — covering 128 venues across crypto, traditional finance, DeFi, sports betting, and prediction markets. One schema, one API, all the data you need. Pricing scales with the venues, instrument types, and depth of history you need. Platform-only access is the cheapest tier — downloading data for offline use is available as an add-on. Because your data lives on the same infrastructure as our research and execution platform, upgrading to model training, backtesting, or live execution is instant — no data migration, no egress.",
    icon: Database,
    pricing: "From £250/mo",
    color: "border-blue-500/30",
    journey: [
      "Browse the full instrument catalogue",
      "Stream real-time market data across all venues",
      "Pricing by venue count, instrument types, and history depth",
      "Platform access included — data download available as add-on",
      "Monitor data freshness and coverage in real time",
      "Seamless upgrade path — same data feeds your models, backtests, and live strategies",
    ],
    services: ["Data Catalogue", "Market Data API", "Historical Access", "Data Download (add-on)"],
    bestFor: "Quant teams and data scientists who build their own models and execution. When you're ready to train models, backtest, or go live — the data is already there, instantly available on the same platform",
    cta: "Start with Data",
  },
  {
    id: "research",
    name: "Research & Backtesting",
    tagline: "Train models. Build signals. Test strategies. Find what works.",
    description: "Go beyond raw data. Train machine learning models on our infrastructure, configure trading signals, backtest strategies across historical data, and iterate until you find the right approach — all without writing infrastructure code.",
    icon: Brain,
    pricing: "Contact us",
    color: "border-purple-500/30",
    popular: true,
    journey: [
      "Train ML models (direction prediction, volatility, regime detection)",
      "Configure signal-to-trade optimisation parameters",
      "Find the right algorithm for each strategy and market",
      "Backtest across 6+ years of historical data",
      "Compare strategy variants side-by-side",
      "Promote winning strategies to paper trading",
    ],
    services: ["ML Model Training", "Signal Configuration", "Strategy Backtesting", "Paper Trading"],
    bestFor: "Quant funds building systematic strategies who want infrastructure handled",
    cta: "Start Researching",
  },
  {
    id: "execution",
    name: "Execution as a Service",
    tagline: "Your strategies, our execution. Live across 128 venues.",
    description: "Bring your tested strategies to market. We handle the execution infrastructure — multi-venue routing, smart order routing, position management, risk limits, and real-time monitoring. You focus on the alpha.",
    icon: Zap,
    pricing: "Contact us",
    color: "border-orange-500/30",
    journey: [
      "Deploy strategies from backtest to live in minutes",
      "Execute across CeFi, DeFi, TradFi, and Sports venues simultaneously",
      "Monitor positions, P&L, and risk in real time",
      "Set risk limits and circuit breakers per strategy",
      "Track execution quality (slippage, fill rates, latency)",
      "Receive alerts on limit breaches and anomalies",
    ],
    services: ["Live Execution", "Position Monitoring", "Risk Management", "Execution Analytics"],
    bestFor: "Funds with proven strategies who need institutional-grade execution",
    cta: "Start Executing",
  },
  {
    id: "full",
    name: "Full Platform",
    tagline: "End-to-end. From data to returns. We run it all.",
    description: "The complete package. We provide the data, train the models, run the strategies, manage the risk, generate the reports, and handle the compliance. You allocate capital and review performance.",
    icon: Shield,
    pricing: "Contact us",
    color: "border-emerald-500/30",
    journey: [
      "Allocate capital across strategy portfolios",
      "Review daily P&L and performance attribution",
      "Access detailed risk reports and stress test results",
      "Track settlements and fee transparency",
      "Full regulatory compliance (FCA authorised, MiFID II)",
      "Dedicated account management and quarterly reviews",
    ],
    services: ["Everything above", "Investment Management", "Compliance & Reporting", "Dedicated Support"],
    bestFor: "Allocators, family offices, and institutions seeking managed alpha",
    cta: "Schedule Consultation",
  },
]

const JOURNEY_STEPS = [
  { step: "1", label: "Access Data", description: "Connect to 128 venues across all asset classes, real-time and historical", icon: Database, color: "text-blue-400" },
  { step: "2", label: "Train Models", description: "ML model training — predict direction, volatility, regime, momentum", icon: Brain, color: "text-purple-400" },
  { step: "3", label: "Build Signals", description: "Configure signal-to-trade parameters, find the right algorithm", icon: FlaskConical, color: "text-violet-400" },
  { step: "4", label: "Test Strategies", description: "Backtest across years of data, compare variants, validate edge", icon: BarChart3, color: "text-cyan-400" },
  { step: "5", label: "Execute Live", description: "Deploy to production, multi-venue execution, real-time monitoring", icon: Zap, color: "text-orange-400" },
  { step: "6", label: "Monitor & Report", description: "P&L attribution, risk oversight, settlement, compliance", icon: FileText, color: "text-emerald-400" },
]

const COMPARISON = [
  { feature: "Market Data (128 venues)", data: true, research: true, execution: true, full: true },
  { feature: "Historical Data (6+ years)", data: true, research: true, execution: true, full: true },
  { feature: "API Access", data: true, research: true, execution: true, full: true },
  { feature: "ML Model Training", data: false, research: true, execution: true, full: true },
  { feature: "Signal Configuration", data: false, research: true, execution: true, full: true },
  { feature: "Strategy Backtesting", data: false, research: true, execution: true, full: true },
  { feature: "Paper Trading", data: false, research: true, execution: true, full: true },
  { feature: "Live Execution", data: false, research: false, execution: true, full: true },
  { feature: "Position Monitoring", data: false, research: false, execution: true, full: true },
  { feature: "Risk Management", data: false, research: false, execution: true, full: true },
  { feature: "Execution Analytics", data: false, research: false, execution: true, full: true },
  { feature: "Investment Management", data: false, research: false, execution: false, full: true },
  { feature: "Compliance & Reporting", data: false, research: false, execution: false, full: true },
  { feature: "Dedicated Account Manager", data: false, research: false, execution: false, full: true },
]

export default function EngagementModelsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-primary/5 to-background">
        <div className="container px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="outline" className="mb-4">How We Work With You</Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              From Data to Returns
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Start with data access. Add research and backtesting. Scale to live execution.
              Or let us manage everything. You choose the depth.
            </p>
          </div>
        </div>
      </section>

      {/* Journey Steps */}
      <section className="py-12 border-b border-border">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {JOURNEY_STEPS.map((step) => {
              const Icon = step.icon
              return (
                <div key={step.step} className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <div className="flex size-10 items-center justify-center rounded-full bg-card border border-border">
                      <Icon className={`size-5 ${step.color}`} />
                    </div>
                  </div>
                  <p className="text-sm font-semibold">{step.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-tight">{step.description}</p>
                </div>
              )
            })}
          </div>
          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              Each tier includes everything before it. Start anywhere, expand when ready.
            </p>
          </div>
        </div>
      </section>

      {/* Tier Cards */}
      <section className="py-16">
        <div className="container px-4 md:px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {ENGAGEMENT_TIERS.map((tier) => {
              const Icon = tier.icon
              return (
                <Card key={tier.id} className={`relative flex flex-col ${tier.color}`}>
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="size-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{tier.name}</CardTitle>
                      </div>
                    </div>
                    <CardDescription className="text-sm font-medium text-foreground/80">
                      {tier.tagline}
                    </CardDescription>
                    <p className="text-xs text-muted-foreground mt-2">{tier.description}</p>
                    <div className="pt-3">
                      <span className="text-xl font-bold">{tier.pricing}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <div className="mb-4">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                        What you can do
                      </p>
                      <ul className="space-y-1.5">
                        {tier.journey.map((item) => (
                          <li key={item} className="flex items-start gap-2 text-xs">
                            <Check className="size-3 text-primary mt-0.5 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-auto pt-4 border-t border-border/50">
                      <p className="text-[10px] text-muted-foreground mb-3">
                        <strong>Best for:</strong> {tier.bestFor}
                      </p>
                      <Button className="w-full" size="sm" variant={tier.popular ? "default" : "outline"} asChild>
                        <Link href="/contact">
                          {tier.cta}
                          <ArrowRight className="ml-2 size-3" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">What&apos;s Included</h2>
            <p className="text-muted-foreground">Each tier builds on the previous — start small, scale up</p>
          </div>

          <div className="max-w-5xl mx-auto overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Capability</th>
                  <th className="text-center py-3 px-4 font-medium">
                    <Database className="size-4 mx-auto mb-1 text-blue-400" />
                    Data
                  </th>
                  <th className="text-center py-3 px-4 font-medium">
                    <Brain className="size-4 mx-auto mb-1 text-purple-400" />
                    Research
                  </th>
                  <th className="text-center py-3 px-4 font-medium">
                    <Zap className="size-4 mx-auto mb-1 text-orange-400" />
                    Execution
                  </th>
                  <th className="text-center py-3 px-4 font-medium">
                    <Shield className="size-4 mx-auto mb-1 text-emerald-400" />
                    Full
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row) => (
                  <tr key={row.feature} className="border-b border-border/50">
                    <td className="py-2.5 px-4 text-xs">{row.feature}</td>
                    {(["data", "research", "execution", "full"] as const).map((tier) => (
                      <td key={tier} className="py-2.5 px-4 text-center">
                        {row[tier] ? (
                          <Check className="size-4 text-primary mx-auto" />
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container px-4 md:px-6">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="py-12 text-center">
              <h2 className="text-3xl font-bold mb-4">Not sure where to start?</h2>
              <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
                Most clients start with Data Access, add Research within 3 months, and
                move to Execution within 6. We&apos;ll help you find the right path.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/contact">Talk to Our Team</Link>
                </Button>
                <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground/20 hover:bg-primary-foreground/10" asChild>
                  <Link href="/login">Try the Demo</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
