"use client"

import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Database,
  LineChart,
  Layers,
  Zap,
  Briefcase,
  Shield,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Globe,
  Lock,
  BarChart3,
} from "lucide-react"

// Service offerings based on Odum Research's product suite
const services = [
  {
    id: "data",
    name: "Data Provision",
    description: "The only institutional data API covering TradFi, Crypto CeFi, DeFi, and Sports in one normalised schema.",
    icon: Database,
    color: "text-sky-400",
    bgColor: "bg-sky-400/10",
    borderColor: "border-sky-400/30",
    metrics: [
      { label: "Venues", value: "100+" },
      { label: "Asset Classes", value: "5" },
      { label: "Data Types", value: "18+" },
    ],
    features: ["Raw Data API", "Normalised Schema Feed", "ML Signal Feed", "Sports Probability API"],
    pricing: "From £250/mo",
    pricingType: "subscription",
    href: "/portal/data",
  },
  {
    id: "backtesting",
    name: "Backtesting as a Service",
    description: "The world's only backtesting platform covering Sports, DeFi, Options, Crypto Perps, and TradFi Futures.",
    icon: LineChart,
    color: "text-violet-400",
    bgColor: "bg-violet-400/10",
    borderColor: "border-violet-400/30",
    metrics: [
      { label: "Asset Classes", value: "5" },
      { label: "Strategy Types", value: "17+" },
      { label: "Interface", value: "NL Agent" },
    ],
    features: ["No-Code Web UI", "Autonomous Agent Interface", "Cross-Asset Simulation", "Full Trade Records"],
    pricing: "From £8,000/mo",
    pricingType: "subscription",
    href: "/portal/backtesting",
  },
  {
    id: "whitelabel",
    name: "Strategy White-Labelling",
    description: "License our proven strategies to run on your infrastructure. Full source, full control, our alpha.",
    icon: Layers,
    color: "text-amber-400",
    bgColor: "bg-amber-400/10",
    borderColor: "border-amber-400/30",
    metrics: [
      { label: "Strategies", value: "17+" },
      { label: "Asset Classes", value: "5" },
      { label: "Sharpe Range", value: "1.2-3.8" },
    ],
    features: ["Full Platform Access", "Strategy Source Code", "Deployment Support", "Ongoing Updates"],
    pricing: "From £15,000/mo",
    pricingType: "license",
    href: "/portal/whitelabel",
  },
  {
    id: "execution",
    name: "Execution as a Service",
    description: "Institutional execution algorithms — TWAP, VWAP, SOR, Almgren-Chriss — charged on alpha generated.",
    icon: Zap,
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/10",
    borderColor: "border-emerald-400/30",
    metrics: [
      { label: "Algo Types", value: "8+" },
      { label: "Venues", value: "100+" },
      { label: "Compliance", value: "MiFID II" },
    ],
    features: ["TWAP/VWAP Algos", "Smart Order Routing", "DeFi MEV Protection", "Best Execution Reports"],
    pricing: "From £15,000/mo + performance",
    pricingType: "performance",
    href: "/portal/execution",
  },
  {
    id: "investment",
    name: "Investment Management",
    description: "FCA-authorised investment management for Professional clients. Co-invest at same terms as house.",
    icon: Briefcase,
    color: "text-rose-400",
    bgColor: "bg-rose-400/10",
    borderColor: "border-rose-400/30",
    metrics: [
      { label: "Regulation", value: "FCA" },
      { label: "Fee Structure", value: "2/20" },
      { label: "Min Investment", value: "$100k" },
    ],
    features: ["Sub-Fund Structure", "DeFi Yield Strategies", "Cross-Asset Mandates", "Monthly Reporting"],
    pricing: "2/20 or custom",
    pricingType: "aum",
    href: "/portal/investment",
  },
  {
    id: "regulatory",
    name: "Regulatory Umbrella",
    description: "FCA Appointed Representative services for institutional algo trading firms. Operate legally in weeks.",
    icon: Shield,
    color: "text-slate-400",
    bgColor: "bg-slate-400/10",
    borderColor: "border-slate-400/30",
    metrics: [
      { label: "FCA Ref", value: "975797" },
      { label: "Activities", value: "4" },
      { label: "Setup Time", value: "Weeks" },
    ],
    features: ["FCA AR Coverage", "Compliance Supervision", "MiFID II Reporting", "MLRO Services"],
    pricing: "Included with Full Platform",
    pricingType: "subscription",
    href: "/portal/regulatory",
  },
]

export default function ClientPortalLanding() {
  const [hoveredService, setHoveredService] = React.useState<string | null>(null)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="size-5 text-primary-foreground" />
            </div>
            <div>
              <span className="text-lg font-semibold">Odum Research</span>
              <Badge variant="outline" className="ml-2 text-xs">FCA 975797</Badge>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/portal" className="text-sm font-medium text-foreground">Services</Link>
            <Link href="/engagement" className="text-sm text-muted-foreground hover:text-foreground">Engagement</Link>
            <Link href="/portal/docs" className="text-sm text-muted-foreground hover:text-foreground">Documentation</Link>
            <Link href="/portal/contact" className="text-sm text-muted-foreground hover:text-foreground">Contact</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/portal/login">Sign In</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/portal/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-violet-500/5" />
        <div className="container relative px-4 py-20 md:px-6 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4">
              <Globe className="mr-1 size-3" />
              100+ Venues · 5 Asset Classes · One Platform
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              Institutional Trading Infrastructure
            </h1>
            <p className="mt-6 text-lg text-muted-foreground md:text-xl">
              Data, backtesting, execution, and investment management across TradFi, Crypto, DeFi, and Sports.
              FCA-authorised. Built for professionals.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/portal/signup">
                  Get Started
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/portal/demo">Book a Demo</Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="size-4 text-emerald-500" />
                <span>SOC 2 Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="size-4 text-emerald-500" />
                <span>Contact us for access</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="container px-4 py-16 md:px-6 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">Choose Your Service</h2>
          <p className="mt-4 text-muted-foreground">
            Select the services that match your needs. Mix and match, or get the full platform with Strategy White-Labelling.
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

      {/* Cross-sell Banner */}
      <section className="border-y border-border bg-muted/50">
        <div className="container px-4 py-12 md:px-6">
          <div className="mx-auto max-w-4xl text-center">
            <h3 className="text-2xl font-bold">Already an Odum Internal User?</h3>
            <p className="mt-2 text-muted-foreground">
              Access the full Unified Trading Platform with all internal tools.
            </p>
            <Button className="mt-6" variant="outline" asChild>
              <Link href="/">
                Go to Internal Platform
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background">
        <div className="container px-4 py-12 md:px-6">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <Sparkles className="size-5" />
              <span className="font-semibold">Odum Research Ltd</span>
              <Badge variant="outline" className="text-xs">FCA 975797</Badge>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/portal/privacy" className="hover:text-foreground">Privacy</Link>
              <Link href="/portal/terms" className="hover:text-foreground">Terms</Link>
              <Link href="/portal/compliance" className="hover:text-foreground">Compliance</Link>
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
