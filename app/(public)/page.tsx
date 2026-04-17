"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  Layers,
  Shield,
  ArrowRight,
  Globe,
  Lock,
  Brain,
} from "lucide-react";
import { ArbitrageGalaxy } from "@/components/marketing/arbitrage-galaxy";
import { PLATFORM_STATS } from "@/lib/config/platform-stats";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Briefcase, CheckCircle2 } from "lucide-react";

// Five services — execution is folded into Trading Terminal + Research
const services = [
  {
    id: "data",
    name: "Data",
    description:
      "Unified market data across venues and asset classes. Access it in-platform, in your cloud, or as managed delivery.",
    icon: Database,
    color: "text-sky-400",
    bgColor: "bg-sky-400/10",
    borderColor: "border-sky-400/30",
    bullets: [
      "One schema across markets",
      "Use in-platform or your cloud",
      "Track coverage and downloads live",
    ],
    href: "/services/data",
  },
  {
    id: "research",
    name: "Research & Build",
    description:
      "Build and test models, signals, and execution logic in one pipeline. Promote proven research straight into live trading.",
    icon: Brain,
    color: "text-violet-400",
    bgColor: "bg-violet-400/10",
    borderColor: "border-violet-400/30",
    bullets: [
      "Build models, signals, and algos",
      "Run large-scale parallel experiments",
      "Promote research straight to live",
    ],
    href: "/services/backtesting",
  },
  {
    id: "trading",
    name: "Trading Terminal",
    description:
      "Run, monitor, and control trading in one live environment. See the whole portfolio or drill into the details that matter.",
    icon: Layers,
    color: "text-amber-400",
    bgColor: "bg-amber-400/10",
    borderColor: "border-amber-400/30",
    bullets: [
      "Trade and monitor in one place",
      "Drill from global view to detail",
      "Alerts, analytics, and live control",
    ],
    href: "/services/platform",
  },
  {
    id: "regulatory",
    name: "Regulatory Umbrella",
    description:
      "Operate under a regulated framework without building everything yourself. Move faster with the controls and support already in place.",
    icon: Shield,
    color: "text-slate-400",
    bgColor: "bg-slate-400/10",
    borderColor: "border-slate-400/30",
    bullets: [
      "Launch under a regulated framework",
      "Reduce setup and compliance burden",
      "Move faster with operational support",
    ],
    href: "/services/regulatory",
  },
  {
    id: "investment",
    name: "Investment Management",
    description:
      "Access Odum-managed strategies through a regulated structure. Get reporting, oversight, and a clear allocation process.",
    icon: Briefcase,
    color: "text-rose-400",
    bgColor: "bg-rose-400/10",
    borderColor: "border-rose-400/30",
    bullets: [
      "Access managed strategies directly",
      "Regulated structure and reporting",
      "Clear allocation and oversight process",
    ],
    href: "/services/investment",
  },
];

export default function ServicesLandingPage() {
  const [hoveredService, setHoveredService] = React.useState<string | null>(
    null,
  );

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
              The same infrastructure we use to run our own capital - available
              to institutional clients at any entry point.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-3 text-sm">
              {[
                { href: "/services/data", icon: Database, label: "Data", color: "sky", hint: "Unified market data across venues and asset classes." },
                { href: "/services/backtesting", icon: Brain, label: "Research", color: "violet", hint: "Build models, signals, and algos. Promote to live." },
                { href: "/services/platform", icon: Layers, label: "Trading", color: "amber", hint: "Run, monitor, and control all your trading in one place." },
                { href: "/services/regulatory", icon: Shield, label: "Regulatory", color: "slate", hint: "Launch under a regulated framework. Operational in weeks." },
                { href: "/services/investment", icon: Briefcase, label: "Investment", color: "rose", hint: "Access managed strategies with regulated reporting." },
              ].map((svc, i) => (
                <React.Fragment key={svc.label}>
                  {i > 0 && <span className="text-border hidden sm:inline">|</span>}
                  <Link href={svc.href} className="group relative">
                    <span className={`flex items-center gap-1.5 text-muted-foreground group-hover:text-${svc.color}-400 transition-colors cursor-pointer`}>
                      <svc.icon className={`size-3.5 text-${svc.color}-400`} />
                      {svc.label}
                      <ArrowRight className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </span>
                    <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-56 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-50">
                      {svc.hint}
                      <span className={`block mt-1 text-${svc.color}-400 font-medium`}>
                        Click for details →
                      </span>
                    </span>
                  </Link>
                </React.Fragment>
              ))}
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
                <div className="text-xs text-muted-foreground">
                  Asset Classes
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {PLATFORM_STATS.totalVenues}
                </div>
                <div className="text-xs text-muted-foreground">Venues</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">24/7</div>
                <div className="text-xs text-muted-foreground">Trading</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {PLATFORM_STATS.dataVolumeTB} TB
                </div>
                <div className="text-xs text-muted-foreground">Market Data</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">5</div>
                <div className="text-xs text-muted-foreground">
                  Service Lines
                </div>
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

      {/* Market Galaxy Visualization */}
      <section className="relative border-b border-border bg-gradient-to-b from-background to-card/30">
        <div className="container px-4 py-12 md:px-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold tracking-tight">
              One Platform. One Unified Approach.
            </h2>
            <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
              {PLATFORM_STATS.assetClassCount} asset classes.{" "}
              {PLATFORM_STATS.totalVenues} venues. 20+ strategies. Trading
              24/7/365.
            </p>
            <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">
              Your backtests and your live strategies run the exact same code.
              If it worked in testing, it works in production — and every
              morning you can compare yesterday&apos;s live trades against what
              the backtest would have done. All your data comes through one
              clean feed, no matter the source. Stocks, crypto, DeFi, sports —
              we handle the messy parts so you just see numbers.
            </p>
          </div>
          <div className="flex justify-center" suppressHydrationWarning>
            <div className="w-full max-w-4xl">
              <ArbitrageGalaxy />
            </div>
          </div>

          {/* Scrolling venue showcase */}
          <div className="relative mt-8 overflow-hidden py-4">
            <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />
            <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />
            <div className="flex animate-scroll-venues gap-6 whitespace-nowrap">
              {/* TradFi - cyan */}
              {["IBKR", "CME", "NYSE", "NASDAQ", "ICE", "CBOE", "NYMEX"].map(
                (v) => (
                  <span
                    key={v}
                    className="text-sm px-3 py-1.5 rounded-full border border-cyan-400/30 text-cyan-400 bg-cyan-400/5"
                  >
                    {v}
                  </span>
                ),
              )}
              {/* CeFi - green */}
              {[
                "Binance",
                "OKX",
                "Bybit",
                "Deribit",
                "Coinbase",

                "Hyperliquid",
              ].map((v) => (
                <span
                  key={v}
                  className="text-sm px-3 py-1.5 rounded-full border border-emerald-400/30 text-emerald-400 bg-emerald-400/5"
                >
                  {v}
                </span>
              ))}
              {/* DeFi - violet */}
              {[
                "Uniswap V3",
                "Aave V3",
                "Morpho",
                "Curve",
                "Lido",
                "EtherFi",
              ].map((v) => (
                <span
                  key={v}
                  className="text-sm px-3 py-1.5 rounded-full border border-violet-400/30 text-violet-400 bg-violet-400/5"
                >
                  {v}
                </span>
              ))}
              {/* Sports - amber */}
              {["Betfair", "Pinnacle", "DraftKings", "FanDuel", "Bet365"].map(
                (v) => (
                  <span
                    key={v}
                    className="text-sm px-3 py-1.5 rounded-full border border-amber-400/30 text-amber-400 bg-amber-400/5"
                  >
                    {v}
                  </span>
                ),
              )}
              {/* Predictions - rose */}
              {["Polymarket", "Kalshi", "Smarkets"].map((v) => (
                <span
                  key={v}
                  className="text-sm px-3 py-1.5 rounded-full border border-rose-400/30 text-rose-400 bg-rose-400/5"
                >
                  {v}
                </span>
              ))}
              {/* Duplicate for seamless loop */}
              {["IBKR", "CME", "NYSE", "NASDAQ", "ICE", "CBOE", "NYMEX"].map(
                (v) => (
                  <span
                    key={`${v}-2`}
                    className="text-sm px-3 py-1.5 rounded-full border border-cyan-400/30 text-cyan-400 bg-cyan-400/5"
                  >
                    {v}
                  </span>
                ),
              )}
              {[
                "Binance",
                "OKX",
                "Bybit",
                "Deribit",
                "Coinbase",

                "Hyperliquid",
              ].map((v) => (
                <span
                  key={`${v}-2`}
                  className="text-sm px-3 py-1.5 rounded-full border border-emerald-400/30 text-emerald-400 bg-emerald-400/5"
                >
                  {v}
                </span>
              ))}
            </div>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-2">
            <span className="text-cyan-400">TradFi</span> ·{" "}
            <span className="text-emerald-400">CeFi</span> ·{" "}
            <span className="text-violet-400">DeFi</span> ·{" "}
            <span className="text-amber-400">Sports</span> ·{" "}
            <span className="text-rose-400">Predictions</span>
          </p>
        </div>
      </section>

      {/* Services */}
      <section
        id="services"
        className="container px-4 py-16 md:px-6 md:py-24 border-t border-border"
      >
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">Services</h2>
          <p className="mt-4 text-muted-foreground">
            From market data to FCA-authorised investment management. Every
            service comes with a no-code interface and full API access.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const Icon = service.icon;
            const isHovered = hoveredService === service.id;

            return (
              <Link key={service.id} href={service.href}>
                <Card
                  className={cn(
                    "relative overflow-hidden transition-all duration-200 h-full",
                    isHovered && service.borderColor,
                    isHovered && "shadow-lg",
                  )}
                  onMouseEnter={() => setHoveredService(service.id)}
                  onMouseLeave={() => setHoveredService(null)}
                >
                  <CardHeader>
                    <div
                      className={cn(
                        "flex size-10 items-center justify-center rounded-lg",
                        service.bgColor,
                      )}
                    >
                      <Icon className={cn("size-5", service.color)} />
                    </div>
                    <CardTitle className="mt-3 text-base">
                      {service.name}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {service.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-1.5">
                    {service.bullets.map((b: string) => (
                      <div key={b} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className={cn("size-3 shrink-0", service.color)} />
                        {b}
                      </div>
                    ))}
                    <span className={cn("text-xs font-medium inline-flex items-center gap-1 pt-2", service.color)}>
                      Learn more <ArrowRight className="size-3" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Not sure where to start?{" "}
            <Link href="/contact" className="text-primary hover:underline">
              Talk to us
            </Link>{" "}
            — we&apos;ll help you find the right fit.
          </p>
        </div>
      </section>

      {/* Footer handled by (public)/layout.tsx */}
    </div>
  );
}
