"use client"

import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Database,
  LineChart,
  Layers,
  Zap,
  Shield,
  ArrowRight,
  Globe,
  Lock,
} from "lucide-react"
import { ArbitrageGalaxy } from "@/components/marketing/arbitrage-galaxy"
import { PlatformArchitectureGrid } from "@/components/marketing/platform-architecture-grid"
import { OperatingModelStages } from "@/components/marketing/operating-model-stages"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Briefcase, CheckCircle2 } from "lucide-react"

// Service offerings based on Odum Research's product suite
const services = [
  {
    id: "data",
    name: "Data Provision",
    description: "Institutional data API covering TradFi, Crypto, DeFi, and Sports - normalised to a single schema.",
    icon: Database,
    color: "text-sky-400",
    bgColor: "bg-sky-400/10",
    borderColor: "border-sky-400/30",
    lifecycle: ["Acquire"],
    metrics: [
      { label: "Venues", value: "33" },
      { label: "Asset Classes", value: "5" },
      { label: "Data Types", value: "18+" },
    ],
    features: ["Raw Data API", "Normalised Schema Feed", "ML Signal Feed", "Sports Probability API"],
    pricing: "From £250/mo",
    href: "/services/data",
  },
  {
    id: "backtesting",
    name: "Backtesting as a Service",
    description: "Cross-asset backtesting spanning Sports, DeFi, Options, Crypto Perps, and TradFi Futures in one environment.",
    icon: LineChart,
    color: "text-violet-400",
    bgColor: "bg-violet-400/10",
    borderColor: "border-violet-400/30",
    lifecycle: ["Acquire", "Build"],
    metrics: [
      { label: "Asset Classes", value: "5" },
      { label: "Strategy Types", value: "17+" },
      { label: "Interface", value: "NL Agent" },
    ],
    features: ["No-Code Web UI", "Autonomous Agent Interface", "Cross-Asset Simulation", "Full Trade Records"],
    pricing: "Contact us",
    href: "/services/backtesting",
  },
  {
    id: "whitelabel",
    name: "Strategy as a Service",
    description: "Get the full Unified Trading Platform white-labelled for your organisation. Our strategies, your brand.",
    icon: Layers,
    color: "text-amber-400",
    bgColor: "bg-amber-400/10",
    borderColor: "border-amber-400/30",
    lifecycle: ["Build", "Promote", "Run", "Observe"],
    metrics: [
      { label: "Strategies", value: "17+" },
      { label: "Asset Classes", value: "5" },
      { label: "Deployment", value: "Turnkey" },
    ],
    features: ["Full Platform Access", "Strategy Source Code", "Deployment Support", "Ongoing Updates"],
    pricing: "Contact us",
    href: "/services/platform",
  },
  {
    id: "execution",
    name: "Execution as a Service",
    description: "Institutional execution algorithms - TWAP, VWAP, SOR, Almgren-Chriss - charged on alpha generated.",
    icon: Zap,
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/10",
    borderColor: "border-emerald-400/30",
    lifecycle: ["Promote", "Run", "Observe"],
    metrics: [
      { label: "Algo Types", value: "8+" },
      { label: "Venues", value: "100+" },
      { label: "Compliance", value: "MiFID II" },
    ],
    features: ["TWAP/VWAP Algos", "Smart Order Routing", "DeFi MEV Protection", "Best Execution Reports"],
    pricing: "Contact us",
    href: "/services/execution",
  },
  {
    id: "investment",
    name: "Investment Management",
    description: "FCA-authorised investment management for Professional clients. Co-invest at same terms as house.",
    icon: Briefcase,
    color: "text-rose-400",
    bgColor: "bg-rose-400/10",
    borderColor: "border-rose-400/30",
    lifecycle: ["Manage", "Report"],
    metrics: [
      { label: "Regulation", value: "FCA" },
      { label: "Structures", value: "SMA / Fund" },
      { label: "Reporting", value: "Monthly" },
    ],
    features: ["Separately Managed Accounts", "Fund Access", "Cross-Asset Mandates", "Full Transparency"],
    pricing: "Contact us",
    href: "/services/investment",
  },
  {
    id: "regulatory",
    name: "Regulatory Umbrella",
    description: "FCA Appointed Representative services for institutional algo trading firms. Operate legally in weeks.",
    icon: Shield,
    color: "text-slate-400",
    bgColor: "bg-slate-400/10",
    borderColor: "border-slate-400/30",
    lifecycle: ["Manage", "Report"],
    metrics: [
      { label: "FCA Ref", value: "975797" },
      { label: "Activities", value: "4" },
      { label: "Setup Time", value: "Days" },
    ],
    features: ["FCA AR Coverage", "Compliance Supervision", "MiFID II Reporting", "MLRO Services"],
    pricing: "Contact us",
    href: "/services/regulatory",
  },
]

export default function ServicesLandingPage() {
  const [hoveredService, setHoveredService] = React.useState<string | null>(null)

  return (
    <div className="min-h-screen bg-background">

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-violet-500/5" />
        <div className="container relative px-4 py-20 md:px-6 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4">
              <Globe className="mr-1 size-3" />
              TradFi - Crypto - DeFi - Sports - Prediction Markets
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
              Unified Trading Infrastructure
            </h1>
            <p className="mt-6 text-lg text-muted-foreground md:text-xl">
              The same infrastructure we use to run our own capital - available to institutional clients at any entry point.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Database className="size-3.5 text-sky-400" /> Data</span>
              <span className="text-border">|</span>
              <span className="flex items-center gap-1.5"><LineChart className="size-3.5 text-violet-400" /> Strategy</span>
              <span className="text-border">|</span>
              <span className="flex items-center gap-1.5"><Layers className="size-3.5 text-amber-400" /> Analytics</span>
              <span className="text-border">|</span>
              <span className="flex items-center gap-1.5"><Zap className="size-3.5 text-emerald-400" /> Execution</span>
              <span className="text-border">|</span>
              <span className="flex items-center gap-1.5"><Shield className="size-3.5 text-rose-400" /> Regulatory</span>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/signup">
                  Get Started
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/demo">Book a Demo</Link>
              </Button>
            </div>

            {/* Key Stats */}
            <div className="mt-10 grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">5</div>
                <div className="text-xs text-muted-foreground">Asset Classes</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">128</div>
                <div className="text-xs text-muted-foreground">Venues</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">24/7</div>
                <div className="text-xs text-muted-foreground">Trading</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">6+</div>
                <div className="text-xs text-muted-foreground">Years Data</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">6</div>
                <div className="text-xs text-muted-foreground">Service Lines</div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="size-4 text-emerald-500" />
                <span>FCA Authorised (975797)</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="size-4 text-emerald-500" />
                <span>Institutional Security</span>
              </div>
              <div className="flex items-center gap-2">
                <Layers className="size-4 text-emerald-500" />
                <span>No-Code to Full-Code</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Lifecycle Section */}
      <section className="relative border-b border-border bg-card/30">
        <div className="container px-4 py-16 md:px-6">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <Badge variant="secondary" className="mb-3">Operating Model</Badge>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">One Lifecycle. End to End.</h2>
            <p className="mt-3 text-muted-foreground">
              From data ingestion through execution to regulatory reporting - the same lifecycle governs internal operations and client access.
            </p>
          </div>

          {/* Interactive lifecycle stages with hover detail panels */}
          <OperatingModelStages />
        </div>
      </section>

      {/* Domain Lanes Section - Parallel Rails Over Lifecycle Spine */}
      <section className="relative border-b border-border">
        <div className="container px-4 py-16 md:px-6">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <Badge variant="secondary" className="mb-3">Platform Architecture</Badge>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">How Data, Signals, Execution, and Capital Flow Together</h2>
            <p className="mt-3 text-muted-foreground">
              Each lane flows through the lifecycle with varying intensity at each stage.
            </p>
          </div>

          {/* Interactive architecture grid with hover tooltips */}
          <PlatformArchitectureGrid />

          <p className="text-center text-xs text-muted-foreground mt-8 max-w-lg mx-auto">
            The same underlying platform powers both internal operations and client access.
          </p>
        </div>
      </section>

      {/* Market Galaxy Visualization */}
      <section className="relative border-b border-border bg-gradient-to-b from-background to-card/30">
        <div className="container px-4 py-12 md:px-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold tracking-tight">One Platform. One Unified Approach.</h2>
            <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
              5 asset classes. 128 venues. 20+ strategies. Trading 24/7/365.
            </p>
            <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">
              All normalised to a single schema for cross-market execution and arbitrage.
            </p>
          </div>
          <div className="flex justify-center" suppressHydrationWarning>
            <div className="w-full max-w-2xl">
              <ArbitrageGalaxy />
            </div>
          </div>

          {/* Scrolling venue showcase */}
          <div className="relative mt-8 overflow-hidden py-4">
            <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />
            <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />
            <div className="flex animate-scroll-venues gap-6 whitespace-nowrap">
              {/* TradFi - cyan */}
              {["IBKR", "CME", "NYSE", "NASDAQ", "ICE", "CBOE", "NYMEX"].map(v => (
                <span key={v} className="text-sm px-3 py-1.5 rounded-full border border-cyan-400/30 text-cyan-400 bg-cyan-400/5">{v}</span>
              ))}
              {/* CeFi - green */}
              {["Binance", "OKX", "Bybit", "Deribit", "Coinbase", "Kraken", "Hyperliquid"].map(v => (
                <span key={v} className="text-sm px-3 py-1.5 rounded-full border border-emerald-400/30 text-emerald-400 bg-emerald-400/5">{v}</span>
              ))}
              {/* DeFi - violet */}
              {["Uniswap V3", "Aave V3", "Morpho", "Curve", "Lido", "EtherFi"].map(v => (
                <span key={v} className="text-sm px-3 py-1.5 rounded-full border border-violet-400/30 text-violet-400 bg-violet-400/5">{v}</span>
              ))}
              {/* Sports - amber */}
              {["Betfair", "Pinnacle", "DraftKings", "FanDuel", "Bet365"].map(v => (
                <span key={v} className="text-sm px-3 py-1.5 rounded-full border border-amber-400/30 text-amber-400 bg-amber-400/5">{v}</span>
              ))}
              {/* Predictions - rose */}
              {["Polymarket", "Kalshi", "Smarkets"].map(v => (
                <span key={v} className="text-sm px-3 py-1.5 rounded-full border border-rose-400/30 text-rose-400 bg-rose-400/5">{v}</span>
              ))}
              {/* Duplicate for seamless loop */}
              {["IBKR", "CME", "NYSE", "NASDAQ", "ICE", "CBOE", "NYMEX"].map(v => (
                <span key={`${v}-2`} className="text-sm px-3 py-1.5 rounded-full border border-cyan-400/30 text-cyan-400 bg-cyan-400/5">{v}</span>
              ))}
              {["Binance", "OKX", "Bybit", "Deribit", "Coinbase", "Kraken", "Hyperliquid"].map(v => (
                <span key={`${v}-2`} className="text-sm px-3 py-1.5 rounded-full border border-emerald-400/30 text-emerald-400 bg-emerald-400/5">{v}</span>
              ))}
            </div>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-2">
            <span className="text-cyan-400">TradFi</span> · <span className="text-emerald-400">CeFi</span> · <span className="text-violet-400">DeFi</span> · <span className="text-amber-400">Sports</span> · <span className="text-rose-400">Predictions</span>
          </p>
        </div>
      </section>

      {/* Entry Points Section */}
      <section className="container px-4 py-16 md:px-6">
        <div className="mx-auto max-w-3xl text-center mb-12">
          <Badge variant="secondary" className="mb-3">Client Access</Badge>
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Enter At Any Stage</h2>
          <p className="mt-3 text-muted-foreground">
            Clients enter at the lifecycle stage that fits their operating model. Execution workflows integrate with existing research pipelines.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-5xl mx-auto">
          {[
            { name: "Data", stages: ["Acquire"], desc: "Normalised feeds across all asset classes" },
            { name: "Research", stages: ["Acquire", "Build"], desc: "Data plus backtesting and simulation" },
            { name: "Execution", stages: ["Promote", "Run", "Observe"], desc: "Integrate existing signals into our execution stack", execBoundary: true },
            { name: "Full Platform", stages: ["Acquire", "Build", "Promote", "Run", "Observe"], desc: "End-to-end infrastructure access" },
            { name: "Managed", stages: ["Manage", "Report"], desc: "Discretionary capital management", execBoundary: true },
          ].map((entry) => (
            <div key={entry.name} className="flex flex-col p-4 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors">
              <div className="font-semibold text-sm mb-2">{entry.name}</div>
              <div className="flex flex-wrap gap-1 mb-3">
                {entry.stages.map(s => (
                  <span key={s} className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{s}</span>
                ))}
              </div>
              <div className="text-xs text-muted-foreground flex-1">{entry.desc}</div>
              {entry.execBoundary && (
                <div className="mt-3 text-[10px] text-emerald-500 flex items-center gap-1">
                  <Lock className="size-3" />
                  Connects at execution boundary
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          <Link href="/engagement" className="text-primary hover:underline">View engagement models</Link> or <Link href="/contact" className="text-primary hover:underline">contact us</Link> to discuss your requirements.
        </p>
      </section>

      {/* Commercial Offerings */}
      <section className="container px-4 py-16 md:px-6 md:py-24 border-t border-border">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="mb-3">Services</Badge>
          <h2 className="text-3xl font-bold tracking-tight">Commercial Offerings</h2>
          <p className="mt-4 text-muted-foreground">
            From data feeds to FCA-authorised investment management. Each maps to specific lifecycle stages.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const Icon = service.icon
            const isHovered = hoveredService === service.id

            return (
              <Card
                key={service.id}
                className={cn(
                  "relative overflow-hidden transition-all duration-200",
                  isHovered && service.borderColor,
                  isHovered && "shadow-lg"
                )}
                onMouseEnter={() => setHoveredService(service.id)}
                onMouseLeave={() => setHoveredService(null)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={cn("flex size-12 items-center justify-center rounded-lg", service.bgColor)}>
                      <Icon className={cn("size-6", service.color)} />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {service.pricing}
                    </Badge>
                  </div>
                  <CardTitle className="mt-4">{service.name}</CardTitle>
                  <CardDescription className="line-clamp-2">{service.description}</CardDescription>
                  {/* Lifecycle stage indicators */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {service.lifecycle.map((stage: string) => (
                      <span key={stage} className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {stage}
                      </span>
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Metrics */}
                  <div className="flex gap-4 border-y border-border py-3">
                    {service.metrics.map((metric) => (
                      <div key={metric.label} className="flex-1">
                        <div className={cn("text-lg font-bold", service.color)}>{metric.value}</div>
                        <div className="text-xs text-muted-foreground">{metric.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Features */}
                  <ul className="mt-4 space-y-2">
                    {service.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className={cn("size-4", service.color)} />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Button className="mt-6 w-full" variant={isHovered ? "default" : "outline"} asChild>
                    <Link href={service.href}>
                      Explore {service.name}
                      <ArrowRight className="ml-2 size-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background">
        <div className="container px-4 py-12 md:px-6">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <img src="/images/odum-logo.png" alt="Odum Research" className="size-5" />
              <span className="font-semibold">Odum Research Ltd</span>
              <Badge variant="outline" className="text-xs">FCA 975797</Badge>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground">Terms</Link>
              <Link href="/compliance" className="hover:text-foreground">Compliance</Link>
            </div>
            <div className="text-sm text-muted-foreground">
              Professional & Eligible Counterparty clients only
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
