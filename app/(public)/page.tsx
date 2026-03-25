"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  LineChart,
  Layers,
  Zap,
  Shield,
  ArrowRight,
  Globe,
  Lock,
  Brain,
  BarChart3,
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

// Service offerings based on Odum Research's product suite
const services = [
  {
    id: "data",
    name: "Data Provision",
    description:
      "Institutional data API covering TradFi, Crypto, DeFi, and Sports - normalised to a single schema.",
    icon: Database,
    color: "text-sky-400",
    bgColor: "bg-sky-400/10",
    borderColor: "border-sky-400/30",
    lifecycle: ["Acquire"],
    metrics: [
      { label: "Venues", value: String(PLATFORM_STATS.totalVenues) },
      { label: "Asset Classes", value: String(PLATFORM_STATS.assetClassCount) },
      { label: "Setup", value: "Minutes" },
    ],
    features: [
      "Raw Tick Data",
      "Processed OHLCV",
      "Liquidation Data",
      "ML Signal Feed",
      "Sports Probability API",
    ],
    pricing: "From £250/mo",
    href: "/services/data",
  },
  {
    id: "backtesting",
    name: "Backtesting as a Service",
    description:
      "Cross-asset backtesting spanning Sports, DeFi, Options, Crypto Perps, and TradFi Futures in one environment.",
    icon: LineChart,
    color: "text-violet-400",
    bgColor: "bg-violet-400/10",
    borderColor: "border-violet-400/30",
    lifecycle: ["Acquire", "Build"],
    metrics: [
      { label: "Asset Classes", value: "5" },
      { label: "Strategy Types", value: "17+" },
      { label: "Setup", value: "Minutes" },
    ],
    features: [
      "No-Code Web UI + Full API",
      "Autonomous Agent Interface",
      "Cross-Asset Simulation",
      "Full Trade Records",
      "GPU-Accelerated Sweeps",
    ],
    pricing: "Contact us",
    href: "/services/backtesting",
  },
  {
    id: "live-trading-platform",
    name: "Live Trading Platform",
    description:
      "Live analytics, P&L attribution, risk monitoring, and T+1 backtest-vs-live diff tracking. Same code runs backtest and live.",
    icon: Layers,
    color: "text-amber-400",
    bgColor: "bg-amber-400/10",
    borderColor: "border-amber-400/30",
    lifecycle: ["Build", "Promote", "Run", "Execute", "Observe"],
    metrics: [
      { label: "Strategies", value: "17+" },
      { label: "Deployment", value: "Turnkey" },
      { label: "Setup", value: "Hours" },
    ],
    features: [
      "Full Platform Access",
      "Strategy Source Code",
      "Deployment Support",
      "Ongoing Updates",
      "T+1 Diff Monitoring",
    ],
    pricing: "Contact us",
    href: "/services/platform",
  },
  {
    id: "execution",
    name: "Execution as a Service",
    description:
      "Institutional execution algorithms - TWAP, VWAP, SOR, Almgren-Chriss - charged on alpha generated.",
    icon: Zap,
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/10",
    borderColor: "border-emerald-400/30",
    lifecycle: ["Promote", "Run", "Execute", "Observe"],
    metrics: [
      { label: "Algo Types", value: "8+" },
      { label: "Venues", value: String(PLATFORM_STATS.totalVenues) },
      { label: "Setup", value: "Minutes" },
    ],
    features: [
      "TWAP/VWAP Algos",
      "Smart Order Routing",
      "DeFi MEV Protection",
      "Best Execution Reports",
      "Smart Execution Alpha",
    ],
    pricing: "Contact us",
    href: "/services/execution",
  },
  {
    id: "investment",
    name: "Investment Management",
    description:
      "FCA-authorised investment management for Professional clients. Co-invest at same terms as house.",
    icon: Briefcase,
    color: "text-rose-400",
    bgColor: "bg-rose-400/10",
    borderColor: "border-rose-400/30",
    lifecycle: ["Manage", "Report"],
    metrics: [
      { label: "Regulation", value: "FCA" },
      { label: "Structures", value: "SMA / Fund" },
      { label: "Setup", value: "Hours" },
    ],
    features: [
      "Separately Managed Accounts",
      "Fund Access",
      "Cross-Asset Mandates",
      "Full Transparency",
      "Monthly Reporting",
    ],
    pricing: "Contact us",
    href: "/services/investment",
  },
  {
    id: "regulatory",
    name: "Regulatory Umbrella",
    description:
      "FCA Appointed Representative services for institutional algo trading firms. Operate legally in weeks.",
    icon: Shield,
    color: "text-slate-400",
    bgColor: "bg-slate-400/10",
    borderColor: "border-slate-400/30",
    lifecycle: ["Manage", "Report"],
    metrics: [
      { label: "FCA Ref", value: "975797" },
      { label: "Activities", value: "6" },
      { label: "Setup", value: "Fast-Track" },
    ],
    features: [
      "FCA AR Coverage",
      "Compliance Supervision",
      "MiFID II Reporting",
      "MLRO Services",
      "Best Execution Monitoring",
    ],
    pricing: "Contact us",
    href: "/services/regulatory",
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
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <Link href="/services/data" className="flex items-center gap-1.5 hover:text-sky-400 transition-colors">
                <Database className="size-3.5 text-sky-400" /> Data
              </Link>
              <span className="text-border">|</span>
              <Link href="/services/backtesting" className="flex items-center gap-1.5 hover:text-violet-400 transition-colors">
                <Brain className="size-3.5 text-violet-400" /> Research
              </Link>
              <span className="text-border">|</span>
              <Link href="/services/platform" className="flex items-center gap-1.5 hover:text-amber-400 transition-colors">
                <Layers className="size-3.5 text-amber-400" /> Trading
              </Link>
              <span className="text-border">|</span>
              <Link href="/services/execution" className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors">
                <Zap className="size-3.5 text-emerald-400" /> Execution
              </Link>
              <span className="text-border">|</span>
              <Link href="/services/investment" className="flex items-center gap-1.5 hover:text-rose-400 transition-colors">
                <BarChart3 className="size-3.5 text-rose-400" /> Reporting
              </Link>
              <span className="text-border">|</span>
              <Link href="/services/regulatory" className="flex items-center gap-1.5 hover:text-slate-400 transition-colors">
                <Shield className="size-3.5 text-slate-400" /> Regulatory
              </Link>
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
                <div className="text-2xl font-bold text-primary">6</div>
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
                "Kraken",
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
                "Kraken",
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
      <section id="services" className="container px-4 py-16 md:px-6 md:py-24 border-t border-border">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Services
          </h2>
          <p className="mt-4 text-muted-foreground">
            From market data to FCA-authorised investment management.
            Every service comes with a no-code interface and full API access.
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
                    <CardTitle className="mt-3 text-base">{service.name}</CardTitle>
                    <CardDescription className="line-clamp-2 text-sm">
                      {service.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <span className={cn("text-sm font-medium inline-flex items-center gap-1", service.color)}>
                      Learn more <ArrowRight className="size-3.5" />
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
