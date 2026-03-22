"use client"

import Link from "next/link"
import { ArrowRight, Check, Database, Brain, FlaskConical, Zap, BarChart3, Shield, FileText, TrendingUp, Sparkles, Briefcase, Scale } from "lucide-react"
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
    serviceUrl: "/services/data",
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
    tagline: "Train models. Build signals. Pick your algo. Test everything.",
    description: "Three layers in one subscription: train ML models to generate trading signals, configure strategy rules to act on those signals, and select execution algorithms to route orders. Simple algos (TWAP, VWAP) are included; advanced algos (IS, SOR, custom) are available as a bolt-on. Backtest the full pipeline across historical data before going live.",
    icon: Brain,
    pricing: "Contact us",
    color: "border-purple-500/30",
    serviceUrl: "/services/backtesting",
    popular: true,
    journey: [
      "Train ML models (direction, volatility, regime, momentum)",
      "Configure signal-to-trade rules and optimisation parameters",
      "Select execution algorithm — simple algos included, advanced as bolt-on",
      "Backtest the full pipeline: model → signal → strategy → execution",
      "Compare variants side-by-side across 6+ years of data",
      "Promote winning strategies to paper trading, then live",
    ],
    services: ["ML Model Training", "Signal Configuration", "Algo Selection", "Strategy Backtesting", "Paper Trading"],
    bestFor: "Quant funds building systematic strategies who want the full ML → signal → algo → execution pipeline handled",
    cta: "Start Researching",
  },
  {
    id: "execution",
    name: "Execution as a Service",
    tagline: "Your strategies, our execution. Same code, backtest to live.",
    description: "Deploy strategies built in our research environment or bring your own via API — you choose the control level. The same decision-making code and microservice interactions run in both backtesting and live, so every backtest result is directly comparable to live performance. Monitor yesterday's trading for T+1 diffs between simulation and reality.",
    icon: Zap,
    pricing: "Contact us",
    color: "border-orange-500/30",
    serviceUrl: "/services/execution",
    journey: [
      "Deploy from our research pipeline or bring your own strategy via API",
      "Same code runs backtest and live — zero divergence by design",
      "Execute across CeFi, DeFi, TradFi, and Sports venues simultaneously",
      "Monitor T+1 diffs: compare yesterday's live trading to backtest expectations",
      "Set risk limits and circuit breakers per strategy",
      "Track execution quality (slippage, fill rates, latency)",
    ],
    services: ["Live Execution", "T+1 Diff Monitoring", "Position Monitoring", "Risk Management", "Execution Analytics"],
    bestFor: "Funds who want institutional-grade execution with provable alignment between backtest and live performance",
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
    serviceUrl: "/services/investment",
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
  {
    id: "investment",
    name: "Investment Management",
    tagline: "FCA-authorised. Co-invest at the same terms as house.",
    description: "Professional-client investment management under FCA authorisation. Separately managed accounts or fund structures across crypto, traditional finance, DeFi, and sports. You allocate capital — we manage the full lifecycle from strategy selection through execution to regulatory reporting. Co-investment means our capital sits alongside yours, same terms, same strategies.",
    icon: Briefcase,
    pricing: "Contact us",
    color: "border-rose-500/30",
    serviceUrl: "/services/investment",
    journey: [
      "Separately managed accounts or fund access",
      "Cross-asset mandates — crypto, TradFi, DeFi, sports",
      "Co-investment: our capital alongside yours, same terms",
      "Full transparency — see every trade, every position, every fee",
      "Monthly performance reporting and attribution",
      "FCA-authorised, MiFID II compliant",
    ],
    services: ["Separately Managed Accounts", "Fund Access", "Cross-Asset Mandates", "Monthly Reporting", "Full Transparency"],
    bestFor: "Allocators, family offices, and professional investors seeking managed alpha with full regulatory protection and co-investment alignment",
    cta: "Schedule Consultation",
  },
  {
    id: "regulatory",
    name: "Regulatory Umbrella",
    tagline: "FCA Appointed Representative services. Operate legally in weeks.",
    description: "Become an FCA Appointed Representative under our principal firm. We provide the regulatory permissions, compliance supervision, and reporting infrastructure — you focus on trading. Ideal for institutional algo trading firms that need FCA coverage without the 12-month authorisation process.",
    icon: Scale,
    pricing: "Contact us",
    color: "border-slate-500/30",
    serviceUrl: "/services/regulatory",
    journey: [
      "FCA Appointed Representative status — fast-track onboarding",
      "Compliance supervision and ongoing monitoring",
      "MiFID II transaction and best execution reporting",
      "MLRO services and financial crime oversight",
      "Regulatory change management — we track rule changes for you",
      "Operate under 4 regulated activities",
    ],
    services: ["FCA AR Coverage", "Compliance Supervision", "MiFID II Reporting", "MLRO Services", "Best Execution Monitoring"],
    bestFor: "Algo trading firms and quant shops that need FCA permissions without building their own compliance function",
    cta: "Get in Touch",
  },
  {
    id: "custom",
    name: "Custom Solution",
    tagline: "Flexible infrastructure, tailored to your needs.",
    description: "Our platform is built to be modular. If the standard tiers don't fit your requirements, we'll work with you to design a bespoke solution — whether that's a unique combination of services, custom data sources, specific execution venues, or a hybrid of managed and self-service. Especially relevant for early-stage partnerships and institutional clients with specific operational needs.",
    icon: Sparkles,
    pricing: "Let's talk",
    color: "border-primary/30",
    serviceUrl: "/services/platform",
    journey: [
      "Mix and match any combination of platform services",
      "Custom data sources, venues, or instrument types",
      "Hybrid self-service and managed operation",
      "Bespoke pricing aligned to your usage and scale",
      "Dedicated onboarding and integration support",
      "Flexible terms for early-stage partnerships",
    ],
    services: ["Bespoke Configuration", "Custom Integration", "Flexible Pricing", "Dedicated Support"],
    bestFor: "Institutions with specific operational requirements, or anyone whose needs don't fit neatly into a standard tier",
    cta: "Get in Touch",
  },
]

const JOURNEY_STEPS = [
  { step: "1", label: "Access Data", description: "Connect to 128 venues across all asset classes, real-time and historical", icon: Database, color: "text-blue-400" },
  { step: "2", label: "Train Models", description: "ML model training — predict direction, volatility, regime, momentum", icon: Brain, color: "text-purple-400" },
  { step: "3", label: "Build Signals & Algos", description: "Configure signal-to-trade rules and select execution algorithms — simple algos included, complex ones as a bolt-on", icon: FlaskConical, color: "text-violet-400" },
  { step: "4", label: "Test Strategies", description: "Backtest across years of data, compare variants, validate edge before going live", icon: BarChart3, color: "text-cyan-400" },
  { step: "5", label: "Execute Live", description: "Deploy from research or via API — same code runs backtest and live, so you can monitor T+1 diffs between simulation and reality", icon: Zap, color: "text-orange-400" },
  { step: "6", label: "Monitor & Report", description: "P&L attribution, risk oversight, settlement, compliance", icon: FileText, color: "text-emerald-400" },
]

// Capability × Control Level matrix — each capability is independent, pick what you need
const CAPABILITY_MATRIX = [
  {
    capability: "Market Data",
    icon: Database,
    color: "text-sky-400",
    selfService: "API + web UI access to 128 venues",
    managed: "We curate feeds for your asset classes",
    byoOption: "Bring your own data sources via API",
  },
  {
    capability: "ML Training",
    icon: Brain,
    color: "text-purple-400",
    selfService: "Train models on our GPU infrastructure",
    managed: "We train and optimise models for you",
    byoOption: "Bring your own models, use our inference",
  },
  {
    capability: "Signal Config",
    icon: FlaskConical,
    color: "text-violet-400",
    selfService: "Configure signal-to-trade rules in our builder",
    managed: "Pre-built signals from our strategy library",
    byoOption: "Bring your own signals via API",
  },
  {
    capability: "Execution Algos",
    icon: Zap,
    color: "text-orange-400",
    selfService: "Select from TWAP, VWAP, IS, SOR, Sniper",
    managed: "We optimise algo selection per strategy",
    byoOption: "Bring your own algos, use our routing",
  },
  {
    capability: "Risk Management",
    icon: Shield,
    color: "text-red-400",
    selfService: "Set limits, circuit breakers, kill switches",
    managed: "We manage risk limits on your behalf",
    byoOption: "Your risk rules enforced by our engine",
  },
  {
    capability: "Reporting",
    icon: FileText,
    color: "text-emerald-400",
    selfService: "Generate P&L, settlement, compliance reports",
    managed: "We deliver monthly reports to your inbox",
    byoOption: "Your report templates, our data pipeline",
  },
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                      <div className="flex gap-2">
                        {tier.serviceUrl && (
                          <Button className="flex-1" size="sm" variant="ghost" asChild>
                            <Link href={tier.serviceUrl}>
                              Learn More
                            </Link>
                          </Button>
                        )}
                        <Button className="flex-1" size="sm" variant={tier.popular ? "default" : "outline"} asChild>
                          <Link href={`/contact?service=${tier.id}&action=demo`}>
                            {tier.cta}
                            <ArrowRight className="ml-2 size-3" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Capability × Control Level Matrix */}
      <section className="py-16 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Pick What You Need</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Every capability is independent. You don&apos;t have to buy a &ldquo;tier&rdquo; — pick the
              capabilities you need and choose your level of control for each. Mix self-service,
              managed, and bring-your-own however you like.
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            {/* Column headers */}
            <div className="grid grid-cols-4 gap-4 mb-4 px-2">
              <div />
              <div className="text-center">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Self-Service</div>
                <div className="text-[10px] text-muted-foreground/60 mt-0.5">You drive, our infrastructure</div>
              </div>
              <div className="text-center">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Managed by Us</div>
                <div className="text-[10px] text-muted-foreground/60 mt-0.5">We handle it for you</div>
              </div>
              <div className="text-center">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bring Your Own</div>
                <div className="text-[10px] text-muted-foreground/60 mt-0.5">Your tools, our platform</div>
              </div>
            </div>

            {/* Capability rows */}
            <div className="space-y-3">
              {CAPABILITY_MATRIX.map((cap) => {
                const Icon = cap.icon
                return (
                  <div key={cap.capability} className="grid grid-cols-4 gap-4 items-stretch">
                    <div className="flex items-center gap-2 px-2">
                      <Icon className={`size-4 ${cap.color} shrink-0`} />
                      <span className="text-sm font-semibold">{cap.capability}</span>
                    </div>
                    <div className="rounded-lg border border-border/50 bg-card p-3">
                      <p className="text-xs text-muted-foreground">{cap.selfService}</p>
                    </div>
                    <div className="rounded-lg border border-border/50 bg-card p-3">
                      <p className="text-xs text-muted-foreground">{cap.managed}</p>
                    </div>
                    <div className="rounded-lg border border-border/50 bg-card p-3">
                      <p className="text-xs text-muted-foreground">{cap.byoOption}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            <p className="text-center text-xs text-muted-foreground mt-8">
              Pricing is based on what you pick — not which &ldquo;tier&rdquo; you&apos;re on. <Link href="/contact" className="text-primary hover:underline">Contact us</Link> to build your configuration.
            </p>
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
