"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ChevronLeft, 
  ChevronRight, 
  Database, 
  LineChart, 
  Zap, 
  Shield, 
  Briefcase, 
  Layers,
  Check,
  Circle,
  ArrowRight,
  TrendingUp,
  Bot,
  GitBranch,
  Users,
  Globe,
  Play,
  Pause,
  Maximize2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { ArbitrageGalaxy } from "@/components/marketing/arbitrage-galaxy"

// Venue list for scrolling display - color-coded by asset class
const VENUE_LIST = [
  // TradFi - cyan
  { name: "IBKR", color: "cyan" },
  { name: "CME", color: "cyan" },
  { name: "NYSE", color: "cyan" },
  { name: "NASDAQ", color: "cyan" },
  { name: "ICE", color: "cyan" },
  { name: "CBOE", color: "cyan" },
  { name: "NYMEX", color: "cyan" },
  // CeFi - green
  { name: "Binance", color: "green" },
  { name: "OKX", color: "green" },
  { name: "Bybit", color: "green" },
  { name: "Deribit", color: "green" },
  { name: "Coinbase", color: "green" },
  { name: "Kraken", color: "green" },
  { name: "Hyperliquid", color: "green" },
  // DeFi - violet
  { name: "Uniswap V2", color: "violet" },
  { name: "Uniswap V3", color: "violet" },
  { name: "Uniswap V4", color: "violet" },
  { name: "Aave V3", color: "violet" },
  { name: "Morpho", color: "violet" },
  { name: "Curve", color: "violet" },
  { name: "Lido", color: "violet" },
  { name: "EtherFi", color: "violet" },
  // Sports - amber
  { name: "Betfair", color: "amber" },
  { name: "Pinnacle", color: "amber" },
  { name: "DraftKings", color: "amber" },
  { name: "FanDuel", color: "amber" },
  { name: "Bet365", color: "amber" },
  { name: "BetMGM", color: "amber" },
  { name: "Caesars", color: "amber" },
  // Predictions - rose
  { name: "Polymarket", color: "rose" },
  { name: "Kalshi", color: "rose" },
  { name: "Smarkets", color: "rose" },
]

// Slide data
const slides = [
  // Slide 1: Cover
  {
    id: 1,
    type: "cover",
    title: "Unified Trading Infrastructure",
    subtitle: "The same infrastructure we use to run our own capital - available to institutional clients at any entry point.",
    tagline: "FCA Authorised",
    stats: [
      { value: "128", label: "Live Venues" },
      { value: "5", label: "Asset Classes" },
      { value: "1.5M+", label: "Instruments" },
      { value: "24/7", label: "Operations" },
    ],
  },
  // Slide 2: Entry Points
  {
    id: 2,
    type: "entrypoints",
    title: "One Platform, Multiple Entry Points",
    subtitle: "Clients enter at the lifecycle stage that fits their operating model. Execution workflows integrate with existing research pipelines.",
    entries: [
      { name: "Data", stages: ["Acquire"], alpha: false, desc: "Normalised feeds across all asset classes" },
      { name: "Research", stages: ["Acquire", "Build"], alpha: true, desc: "Data plus backtesting and simulation" },
      { name: "Execution", stages: ["Promote", "Run", "Observe"], alpha: false, desc: "Integrate existing signals into our execution stack" },
      { name: "Full Platform", stages: ["Acquire", "Build", "Promote", "Run", "Observe"], alpha: true, desc: "End-to-end infrastructure access" },
      { name: "Managed", stages: ["Manage", "Report"], alpha: false, desc: "Discretionary capital management" },
    ],
    note: "Flexible integration for firms that retain their own research stack.",
  },
  // Slide 3: Lifecycle
  {
    id: 3,
    type: "lifecycle-new",
    title: "Platform Lifecycle",
    subtitle: "From data ingestion through execution to regulatory reporting - the same lifecycle governs internal operations and client access.",
    stages: [
      { name: "Acquire", desc: "Ingest, normalise, validate" },
      { name: "Build", desc: "Research, train, simulate" },
      { name: "Promote", desc: "Review, approve, deploy" },
      { name: "Run", desc: "Execute, route, fill" },
      { name: "Observe", desc: "Monitor, alert, reconcile" },
      { name: "Manage", desc: "Allocate, govern, control" },
      { name: "Report", desc: "Attribute, audit, disclose" },
    ],
  },
  // Slide 4: Operational Lanes (renamed from Domain Lanes)
  {
    id: 4,
    type: "lanes-visual",
    title: "Trading Operations Across the Lifecycle",
    subtitle: "Six operational lanes flow through the lifecycle with varying intensity at each stage.",
    stages: ["Acquire", "Build", "Promote", "Run", "Observe", "Manage", "Report"],
    lanes: [
      { name: "Data", desc: "Feeds, normalisation, entitlements", color: "sky", emphasis: [0, 1, 4] },
      { name: "ML", desc: "Features, models, signals, inference", color: "violet", emphasis: [1, 2, 3, 4] },
      { name: "Strategy", desc: "Research, simulation, decision logic", color: "amber", emphasis: [1, 2, 3, 4] },
      { name: "Execution", desc: "Algos, routing, transaction cost", color: "emerald", emphasis: [2, 3, 4] },
      { name: "Capital", desc: "Mandates, allocations, oversight", color: "rose", emphasis: [3, 4, 5, 6] },
      { name: "Compliance", desc: "Audit trail, regulatory controls", color: "slate", emphasis: [2, 3, 4, 6] },
    ],
  },
  // Slide 5: Commercial Packaging
  {
    id: 5,
    type: "packaging",
    title: "Commercial Packaging",
    subtitle: "Each service maps to specific lifecycle stages. Clients can start at any point and expand over time.",
    services: [
      { name: "Data Provision", stages: ["Acquire"], model: "Subscription", desc: "Normalised market data across 5 asset classes" },
      { name: "Backtesting as a Service", stages: ["Acquire", "Build"], model: "Compute credits", desc: "Research infrastructure and simulation" },
      { name: "Execution as a Service", stages: ["Promote", "Run", "Observe"], model: "Performance-based", desc: "Bring strategies, use our execution layer" },
      { name: "Regulatory Umbrella", stages: ["Manage", "Report"], model: "Retainer", desc: "FCA Appointed Representative services" },
      { name: "Investment Management", stages: ["Manage", "Report"], model: "Performance-aligned", desc: "Discretionary capital management" },
      { name: "Platform Licence", stages: ["Acquire", "Build", "Promote", "Run", "Observe"], model: "Enterprise", desc: "Full infrastructure access" },
    ],
    note: "Contact us for pricing. Terms vary by service and volume.",
  },
  // Slide 6: Why One Platform
  {
    id: 6,
    type: "doctrine",
    title: "Why One Platform",
    subtitle: "The alternative is disconnected tools - separate data vendors, separate backtesting, separate execution, separate compliance. Each boundary creates friction, reconciliation overhead, and operational risk.",
    points: [
      { problem: "Disconnected data sources", solution: "One normalised schema across all 5 asset classes" },
      { problem: "Multiple backtesting tools", solution: "Single simulation engine, unified strategy framework" },
      { problem: "Fragmented execution", solution: "Unified algo layer across 128 venues" },
      { problem: "Separate compliance stacks", solution: "Integrated audit trail and regulatory reporting" },
    ],
    conclusion: "Clients enter at any stage - but they're entering the same system we run our own capital through.",
    differentiators: [
      "Cross-asset backtesting: Sports, DeFi, Options, Crypto Perps, TradFi Futures in one environment",
      "Execution-only access preserves client alpha IP",
      "Same infrastructure serves internal operations and external clients",
    ],
  },
  {
    id: 8,
    type: "coverage",
    title: "Unmatched Market Coverage",
    subtitle: "Trading 24/7/365 across all global markets",
    markets: [
      { icon: "TrendingUp", name: "TradFi", sub: "CME, ICE, NYMEX, IBKR", count: "12 venues", color: "cyan", detail: "Futures, options, equities" },
      { icon: "Database", name: "Crypto CeFi", sub: "Binance, OKX, Deribit, Bybit", count: "18 venues", color: "green", detail: "Spot, perps, options" },
      { icon: "Layers", name: "DeFi", sub: "Uniswap, Aave, Hyperliquid", count: "8 venues", color: "violet", detail: "LP, lending, on-chain perps" },
      { icon: "Globe", name: "Sports", sub: "Betfair, Pinnacle +90 more", count: "90 venues", color: "amber", detail: "Football, NFL, NBA, Tennis" },
      { icon: "LineChart", name: "Predictions", sub: "Polymarket, Kalshi", count: "4 venues", color: "rose", detail: "Political, crypto, macro" },
    ],
    instrumentCount: "1.5M+",
    instrumentNote: "instruments registered in our database (including historical/expired)",
    differentiator: "Normalised data schema across all asset classes. Enables cross-market arbitrage: BTC across CeFi/DeFi, BTC prediction markets vs CeFi derivatives (Polymarket vs Binance/Deribit), S&P data for crypto predictions, sports odds vs prediction markets. ML signals translate across domains.",
  },
  {
    id: 9,
    type: "demo",
    title: "Platform Demo",
    subtitle: "A preview of the trading infrastructure. Full interactive walkthrough available during this presentation.",
    previewLink: "/demo/preview",
    sections: [
      { name: "Strategy Heatmap", desc: "Cross-asset performance matrix" },
      { name: "Backtest Results", desc: "Historical simulation outputs" },
      { name: "Live Trading", desc: "Real-time positions and P&L" },
      { name: "Data Coverage", desc: "Venue and instrument breadth" },
    ],
    note: "This preview shows representative views. The live demo will use actual production data.",
  },
  {
    id: 10,
    type: "revenue",
    title: "Revenue Streams",
    services: [
      { name: "Data Provision", model: "From £250/mo", status: "live", note: "we use the data" },
      { name: "Backtesting as a Service", model: "From £8,000/mo", status: "live", note: "we use the backtest" },
      { name: "Execution as a Service", model: "30% of alpha · 20% at $10M+ volume", status: "live", note: "we use the execution" },
      { name: "Regulatory Umbrella (AR)", model: "GBP 10k setup + GBP 4k/mo", status: "active", note: "first client onboarded" },
      { name: "Investment Management", model: "0% management + 35% performance", status: "live", note: "+34.2% since Feb 2026" },
      { name: "Strategy / Platform Licence", model: "From $100k per strategy", status: "ready", note: "" },
    ],
    disclosure: "Investment Management note: +34.2% since Feb 2026 on client accounts on Binance and OKX.",
  },
  {
    id: 11,
    type: "flywheel",
    title: "Land & Expand Flywheel",
    subtitle: "Clients enter at one service, naturally expand to others. Each step increases contract value 3-10x.",
    funnel: [
      { name: "Data", sub: "entry point", active: true },
      { name: "Backtesting", sub: "test strategies", active: false },
      { name: "Execution", sub: "go live", active: false },
      { name: "Full Platform", sub: "white label", active: false },
      { name: "Investment Mgmt", sub: "we run it", active: true },
    ],
    examples: [
      "Data subscriber sees signal quality -> subscribes to BaaS",
      "BaaS client validates edge -> wants live execution",
      "Execution client scales -> needs regulatory coverage",
      "AR client grows AUM -> becomes investment management client",
    ],
  },
  {
    id: 12,
    type: "operations",
    title: "AI-Powered Efficiency",
    columns: [
      {
        title: "Autonomous Agents",
        items: [
          "P&L monitoring - real-time anomaly detection",
          "Trade quality - benchmark vs fill, flag issues",
          "Bad-trade detection - auto-escalate to human review",
          "PR review agents - detect bugs, open fix PRs",
        ],
      },
      {
        title: "Rapid Development",
        items: [
          "Strategy from concept to live in ~2 weeks",
          "New venue integration in a day",
          "Quality gates codified - lint, tests, typecheck",
          "26 microservices, 20+ internal libraries",
        ],
      },
      {
        title: "Scalable Operations",
        items: [
          "Same system serves internal + external clients",
          "Headcount scales sub-linearly with revenue",
          "Agent-assisted client onboarding",
          "Full git audit trail + GitHub issue tracking",
        ],
      },
    ],
    callout: "A competitor building this from scratch would need 15–20 people. We run the same system with a fraction of that headcount — automating the majority of workflows with human approval gates at critical decisions.",
    metrics: [
      { value: "26", label: "Microservices" },
      { value: "246–1,056", label: "Tests per service" },
      { value: "<1 day", label: "New venue integration" },
      { value: "~2 weeks", label: "Concept to live deployment" },
    ],
  },
  {
    id: 13,
    type: "traction",
    title: "Where We Are Today",
    achieved: [
      { text: "UTS platform operational", detail: "full lifecycle management across 5 asset classes" },
      { text: "Investment management live", detail: "clients at high watermark, +34.2% since Feb 2026" },
      { text: "First regulatory client onboarded", detail: "FCA Appointed Representative" },
      { text: "First services client delivery", detail: "in days, not months" },
    ],
    inProgress: [
      { text: "Client funding development", detail: "options on India Exchange (Delta One + Arbitrage)" },
      { text: "Building track record", detail: "for initial strategies across all asset classes" },
      { text: "Expanding AR services", detail: "in talks about further regulatory coverage" },
      { text: "MOU for execution services", detail: "institutional counterparty" },
    ],
    checkpoint: "This is a checkpoint. We're aligning on how to best diversify revenue streams, targeting the most commercially viable products and markets. The toolkit is built - now we're pointing it in the right direction.",
  },
  {
    id: 14,
    type: "ask",
    title: "Next Steps",
    subtitle: "The infrastructure is built, the regulation is in place, and the stack is live across all five asset classes. The purpose of this meeting is to sense-check the path forward — which products to lead with, which markets to prioritise, and where the advisory board can accelerate that.",
    asks: [
      {
        title: "Product Prioritisation",
        items: [
          "Which of the six revenue lines should we lead with?",
          "Where is the clearest near-term commercial opportunity?",
          "Which products are ready to scale vs. which need more runway?",
        ],
      },
      {
        title: "Strategic Partnerships",
        items: [
          "Technology partnerships for venue integration and licensing",
          "Distribution into institutional research desks and quant firms",
          "AR umbrella expansion for firms entering UK regulation",
        ],
      },
      {
        title: "Advisory Input",
        items: [
          "Help identifying which markets, products, and geographies to prioritise",
          "Guidance on what's most commercially viable — we don't have to launch everything",
          "Introductions to relevant distribution partners or anchor clients",
        ],
      },
    ],
    contact: "ikenna@odum-research.com",
  },
]

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  TrendingUp,
  Database,
  Layers,
  Globe,
  LineChart,
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    live: "bg-emerald-400/10 text-emerald-400 border-emerald-400/30",
    active: "bg-cyan-400/10 text-cyan-400 border-cyan-400/30",
    ready: "bg-amber-400/10 text-amber-400 border-amber-400/30",
  }
  return (
    <span className={cn("px-2 py-0.5 text-xs font-semibold rounded border", styles[status as keyof typeof styles])}>
      {status.toUpperCase()}
    </span>
  )
}

function MarketNode({ market }: { market: { icon: string; name: string; sub: string; color: string; count?: string; detail?: string } }) {
  const Icon = iconMap[market.icon] || Globe
  const colorStyles = {
    cyan: "border-cyan-400/40 bg-cyan-400/5",
    green: "border-emerald-400/30 bg-emerald-400/5",
    violet: "border-violet-400/30 bg-violet-400/5",
    amber: "border-amber-400/30 bg-amber-400/5",
    rose: "border-rose-400/30 bg-rose-400/5",
  }
  const textColorStyles = {
    cyan: "text-cyan-400",
    green: "text-emerald-400",
    violet: "text-violet-400",
    amber: "text-amber-400",
    rose: "text-rose-400",
  }
  return (
    <div className={cn("rounded-xl border p-4 text-center", colorStyles[market.color as keyof typeof colorStyles])}>
      <Icon className="size-6 mx-auto mb-2 text-foreground" />
      <div className="font-semibold text-sm">{market.name}</div>
      {market.count && (
        <div className={cn("text-lg font-bold mt-1", textColorStyles[market.color as keyof typeof textColorStyles])}>{market.count}</div>
      )}
      <div className="text-xs text-muted-foreground mt-1">{market.sub}</div>
      {market.detail && (
        <div className="text-[10px] text-muted-foreground/70 mt-1">{market.detail}</div>
      )}
    </div>
  )
}

export default function PresentationPage() {
  const [currentSlide, setCurrentSlide] = React.useState(0)
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [isAutoPlay, setIsAutoPlay] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const nextSlide = () => setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1))
  const prevSlide = () => setCurrentSlide((prev) => Math.max(prev - 1, 0))

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") nextSlide()
      if (e.key === "ArrowLeft") prevSlide()
      if (e.key === "Escape") setIsFullscreen(false)
      if (e.key === "f") toggleFullscreen()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  React.useEffect(() => {
    if (isAutoPlay) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length)
      }, 8000)
      return () => clearInterval(interval)
    }
  }, [isAutoPlay])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // Each slide has a different shape based on `type`. Cast to a permissive record
  // to allow type-specific property access in render branches.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const slide = slides[currentSlide] as Record<string, any>

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-background flex flex-col"
    >
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-card/50">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <img 
              src="/images/odum-logo.png" 
              alt="Odum Research" 
              className="size-7"
            />
            <span className="font-bold text-lg tracking-tight">
              ODUM<span className="text-primary">.</span>
            </span>
          </Link>
          <Badge variant="outline" className="text-xs">
            <Shield className="size-3 mr-1" />
            FCA 975797
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setIsAutoPlay(!isAutoPlay)}>
            {isAutoPlay ? <Pause className="size-4" /> : <Play className="size-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
            <Maximize2 className="size-4" />
          </Button>
          <span className="text-sm text-muted-foreground font-mono">
            {currentSlide + 1} / {slides.length}
          </span>
        </div>
      </header>

      {/* Slide Content */}
      <main className="flex-1 flex items-center justify-center p-8 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-6xl"
          >
            {/* Cover Slide */}
            {slide.type === "cover" && (
              <div className="text-center">
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-5xl md:text-6xl font-black tracking-tight leading-tight bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent pb-2"
                >
                  {slide.title}
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-6 text-xl text-muted-foreground max-w-3xl mx-auto"
                >
                  {slide.subtitle}
                </motion.p>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-4 h-1 w-20 mx-auto bg-gradient-to-r from-primary to-violet-500 rounded"
                />
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mt-4 text-sm text-primary font-medium uppercase tracking-widest"
                >
                  {slide.tagline} | FCA Authorised | Ref 975797
                </motion.p>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-12 grid grid-cols-5 gap-6"
                >
                  {slide.stats?.map((stat: { value: string; label: string }, i: number) => (
                    <div key={i} className="text-center">
                      <div className="text-4xl font-bold text-primary">{stat.value}</div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{stat.label}</div>
                    </div>
                  ))}
                </motion.div>
              </div>
            )}

            {/* Doctrine Slide - Why One Platform */}
            {slide.type === "doctrine" && (
              <div>
                <h2 className="text-3xl font-bold text-primary border-b border-border pb-2 mb-2">{slide.title}</h2>
                <p className="text-muted-foreground mb-6 max-w-3xl">{slide.subtitle}</p>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {slide.points?.map((point: { problem: string; solution: string }, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * i }}
                      className="flex gap-4 p-4 rounded-lg border border-border bg-card"
                    >
                      <div className="flex-1">
                        <div className="text-xs text-destructive uppercase tracking-wider mb-1">Problem</div>
                        <div className="text-sm text-muted-foreground">{point.problem}</div>
                      </div>
                      <ArrowRight className="size-4 text-primary mt-2 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-xs text-primary uppercase tracking-wider mb-1">Solution</div>
                        <div className="text-sm font-medium">{point.solution}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                {slide.differentiators && (
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {(slide.differentiators as string[]).map((diff: string, i: number) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + 0.1 * i }}
                        className="p-3 rounded-lg border border-border bg-card/50 text-xs text-muted-foreground flex items-start gap-2"
                      >
                        <Check className="size-3 text-emerald-400 flex-shrink-0 mt-0.5" />
                        {diff}
                      </motion.div>
                    ))}
                  </div>
                )}
                <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 text-center">
                  <p className="text-sm font-medium text-primary">{slide.conclusion}</p>
                </div>
              </div>
            )}

            {/* Entry Points Slide */}
            {slide.type === "entrypoints" && (
              <div>
                <h2 className="text-3xl font-bold text-primary border-b border-border pb-2 mb-2">{slide.title}</h2>
                <p className="text-muted-foreground mb-8">{slide.subtitle}</p>
                <div className="grid grid-cols-5 gap-3">
                  {slide.entries?.map((entry: { name: string; stages: string[]; alpha: boolean; desc: string }, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * i }}
                      className="p-4 rounded-lg border border-border bg-card"
                    >
                      <div className="font-semibold text-sm mb-2">{entry.name}</div>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {entry.stages.map((s: string) => (
                          <span key={s} className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{s}</span>
                        ))}
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">{entry.desc}</div>
                      {!entry.alpha && (
                        <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                          <Shield className="size-3" />
                          Connects at execution boundary
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-6 text-center">{slide.note}</p>
              </div>
            )}

            {/* Lifecycle Stages Slide */}
            {slide.type === "lifecycle-new" && (
              <div>
                <h2 className="text-3xl font-bold text-primary border-b border-border pb-2 mb-2">{slide.title}</h2>
                <p className="text-muted-foreground mb-10">{slide.subtitle}</p>
                <div className="flex items-center gap-2">
                  {slide.stages?.map((stage: { name: string; desc: string }, i: number) => (
                    <React.Fragment key={i}>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 * i }}
                        className="flex-1 py-6 px-3 rounded-lg border border-primary/30 bg-primary/5 text-center"
                      >
                        <div className="text-2xl font-bold text-primary mb-1">{i + 1}</div>
                        <div className="font-semibold text-sm mb-1">{stage.name}</div>
                        <div className="text-[10px] text-muted-foreground">{stage.desc}</div>
                      </motion.div>
                      {i < (slide.stages?.length || 0) - 1 && (
                        <ArrowRight className="size-4 text-primary/50 flex-shrink-0" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

            {/* Domain Lanes Slide (legacy) */}
            {slide.type === "lanes" && (
              <div>
                <h2 className="text-3xl font-bold text-primary border-b border-border pb-2 mb-2">{slide.title}</h2>
                <p className="text-muted-foreground mb-8">{slide.subtitle}</p>
                <div className="space-y-3">
                  {slide.lanes?.map((lane: { name: string; desc: string; color: string }, i: number) => {
                    const colorClasses: Record<string, string> = {
                      sky: "border-sky-400/30 bg-sky-400/5 text-sky-400",
                      violet: "border-violet-400/30 bg-violet-400/5 text-violet-400",
                      amber: "border-amber-400/30 bg-amber-400/5 text-amber-400",
                      emerald: "border-emerald-400/30 bg-emerald-400/5 text-emerald-400",
                      rose: "border-rose-400/30 bg-rose-400/5 text-rose-400",
                      slate: "border-slate-400/30 bg-slate-400/5 text-slate-400",
                    }
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * i }}
                        className={cn("flex items-center gap-4 p-3 rounded-lg border", colorClasses[lane.color])}
                      >
                        <div className="w-24 font-semibold text-sm">{lane.name}</div>
                        <div className="flex-1 h-1.5 rounded-full bg-current opacity-20" />
                        <div className="text-xs text-muted-foreground w-64 text-right">{lane.desc}</div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Lanes Visual Slide - with stage nodes */}
            {slide.type === "lanes-visual" && (
              <div>
                <h2 className="text-3xl font-bold text-primary border-b border-border pb-2 mb-2">{slide.title}</h2>
                <p className="text-muted-foreground mb-6">{slide.subtitle}</p>
                
                {/* Stage headers */}
                <div className="grid grid-cols-8 gap-2 mb-4">
                  <div /> {/* Lane label column */}
                  {(slide.stages as string[] || []).map((stage: string) => (
                    <div key={stage} className="text-center">
                      <span className="text-[10px] text-muted-foreground font-medium">{stage}</span>
                    </div>
                  ))}
                </div>
                
                {/* Lane rows with stage nodes */}
                <div className="space-y-3">
                  {(slide.lanes as Array<{ name: string; desc: string; color: string; emphasis: number[] }> || []).map((lane, i) => {
                    const colorMap: Record<string, { node: string; nodeDim: string; glow: string }> = {
                      sky: { node: "bg-sky-400", nodeDim: "bg-sky-400/30", glow: "shadow-[0_0_8px_rgba(56,189,248,0.5)]" },
                      violet: { node: "bg-violet-400", nodeDim: "bg-violet-400/30", glow: "shadow-[0_0_8px_rgba(167,139,250,0.5)]" },
                      amber: { node: "bg-amber-400", nodeDim: "bg-amber-400/30", glow: "shadow-[0_0_8px_rgba(251,191,36,0.5)]" },
                      emerald: { node: "bg-emerald-400", nodeDim: "bg-emerald-400/30", glow: "shadow-[0_0_8px_rgba(52,211,153,0.5)]" },
                      rose: { node: "bg-rose-400", nodeDim: "bg-rose-400/30", glow: "shadow-[0_0_8px_rgba(251,113,133,0.5)]" },
                      slate: { node: "bg-slate-400", nodeDim: "bg-slate-400/30", glow: "shadow-[0_0_8px_rgba(148,163,184,0.5)]" },
                    }
                    const textColorMap: Record<string, string> = {
                      sky: "text-sky-400",
                      violet: "text-violet-400",
                      amber: "text-amber-400",
                      emerald: "text-emerald-400",
                      rose: "text-rose-400",
                      slate: "text-slate-400",
                    }
                    const colors = colorMap[lane.color] || colorMap.slate
                    
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.08 * i }}
                        className="grid grid-cols-8 gap-2 items-center"
                      >
                        <div className="flex flex-col">
                          <span className={cn("text-xs font-semibold", textColorMap[lane.color])}>{lane.name}</span>
                          <span className="text-[9px] text-muted-foreground">{lane.desc}</span>
                        </div>
                        {[0, 1, 2, 3, 4, 5, 6].map((stageIdx) => {
                          const isEmphasized = lane.emphasis.includes(stageIdx)
                          return (
                            <div key={stageIdx} className="flex items-center justify-center">
                              <div className={cn(
                                "rounded-full transition-all",
                                isEmphasized ? cn("size-3", colors.node, colors.glow) : cn("size-1.5", colors.nodeDim)
                              )} />
                            </div>
                          )
                        })}
                      </motion.div>
                    )
                  })}
                </div>
                
                {/* Legend */}
                <div className="flex justify-center gap-8 mt-6 text-[10px] text-muted-foreground border-t border-border/50 pt-4">
                  <div className="flex items-center gap-2">
                    <div className="size-3 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
                    <span>Primary</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="size-1.5 rounded-full bg-emerald-400/30" />
                    <span>Supporting</span>
                  </div>
                </div>
              </div>
            )}

            {/* Commercial Packaging Slide */}
            {slide.type === "packaging" && (
              <div>
                <h2 className="text-3xl font-bold text-primary border-b border-border pb-2 mb-2">{slide.title}</h2>
                <p className="text-muted-foreground mb-6">{slide.subtitle}</p>
                <div className="grid grid-cols-3 gap-4">
                  {(slide.services as Array<{ name: string; stages: string[]; model: string; desc: string }> || []).map((service, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * i }}
                      className="p-4 rounded-lg border border-border bg-card"
                    >
                      <div className="font-semibold text-sm mb-2">{service.name}</div>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {service.stages.map((s: string) => (
                          <span key={s} className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{s}</span>
                        ))}
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">{service.desc}</div>
                      <div className="text-xs font-medium text-primary">{service.model}</div>
                    </motion.div>
                  ))}
                </div>
                {slide.note && (
                  <p className="text-xs text-muted-foreground mt-6 text-center">{slide.note}</p>
                )}
              </div>
            )}

            {/* Problem Slide */}
            {slide.type === "problem" && (
              <div>
                <h2 className="text-3xl font-bold text-primary border-b border-border pb-2 mb-2">{slide.title}</h2>
                <p className="text-muted-foreground mb-6">{slide.subtitle}</p>
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {slide.costs?.map((cost: { label?: string; value?: string; icon?: string; asset?: string; vendor?: string; cost?: string; period?: string }, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * i }}
                      className="p-4 rounded-lg border border-destructive/30 bg-destructive/5 text-center"
                    >
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{cost.asset}</div>
                      <div className="font-semibold text-sm mb-1">{cost.vendor}</div>
                      <div className="text-xl font-bold text-destructive">{cost.cost}</div>
                      <div className="text-xs text-muted-foreground">{cost.period}</div>
                    </motion.div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-4 rounded-lg border border-border bg-card">
                    <h3 className="text-sm font-semibold text-destructive uppercase tracking-wider mb-3">The Pain</h3>
                    <ul className="space-y-2">
                      {slide.pain?.map((item: string, i: number) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-destructive">✕</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg border border-primary/30 bg-primary/5">
                    <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Our Solution</h3>
                    <p className="text-lg font-semibold text-primary">{slide.solution}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Competitive Moat Slide */}
            {slide.type === "moat" && (
              <div>
                <h2 className="text-3xl font-bold text-primary border-b border-border pb-2 mb-2">{slide.title}</h2>
                <p className="text-muted-foreground mb-6">{slide.subtitle}</p>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {slide.gaps?.map((gap: { title: string; desc: string; color?: string; competitor?: string; users?: string; gap?: string }, i: number) => {
                    const colors = {
                      cyan: "border-cyan-400/30 bg-cyan-400/5",
                      violet: "border-violet-400/30 bg-violet-400/5",
                      amber: "border-amber-400/30 bg-amber-400/5",
                      emerald: "border-emerald-400/30 bg-emerald-400/5",
                    }
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * i }}
                        className={cn("p-4 rounded-lg border", colors[gap.color as keyof typeof colors])}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">{gap.competitor}</span>
                          <Badge variant="outline" className="text-xs">{gap.users}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{gap.gap}</p>
                      </motion.div>
                    )
                  })}
                </div>
                <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 text-center">
                  <p className="text-sm font-medium text-primary">{slide.callout}</p>
                </div>
              </div>
            )}

            {/* Coverage Slide - Animated Arbitrage Galaxy */}
            {slide.type === "coverage" && (
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-3xl font-bold text-primary border-b border-border pb-2 mb-1">{slide.title}</h2>
                    <p className="text-sm text-muted-foreground">Trading 24/7/365 — same instruments, multiple venues, continuous arbitrage</p>
                  </div>
                  <div className="flex gap-6 flex-shrink-0">
                    {[{v:"128",l:"Venues",c:"text-cyan-400"},{v:"1.5M+",l:"Instruments",c:"text-emerald-400"},{v:"5",l:"Asset Classes",c:"text-violet-400"},{v:"24/7",l:"Trading",c:"text-amber-400"}].map(s=>(
                      <div key={s.l} className="flex flex-col items-center">
                        <div className={`text-2xl font-bold tabular-nums ${s.c}`}>{s.v}</div>
                        <div className="text-[10px] text-muted-foreground text-center">{s.l}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Animated arbitrage galaxy */}
                <div className="mx-auto w-full max-w-lg">
                  <ArbitrageGalaxy />
                </div>

                {/* Scrolling venue list */}
                <div className="relative mt-4 overflow-hidden h-8">
                  <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent z-10" />
                  <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent z-10" />
                  <motion.div
                    className="flex gap-4 whitespace-nowrap"
                    animate={{ x: [0, -1200] }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                  >
                    {[...VENUE_LIST, ...VENUE_LIST].map((venue, i) => {
                      const colors: Record<string, string> = {
                        cyan: "text-cyan-400 border-cyan-400/30",
                        green: "text-emerald-400 border-emerald-400/30",
                        violet: "text-violet-400 border-violet-400/30",
                        amber: "text-amber-400 border-amber-400/30",
                        rose: "text-rose-400 border-rose-400/30",
                      }
                      return (
                        <span
                          key={`${venue.name}-${i}`}
                          className={cn("text-xs px-2 py-1 rounded border bg-background/50", colors[venue.color])}
                        >
                          {venue.name}
                        </span>
                      )
                    })}
                  </motion.div>
                </div>

                <div className="mt-3 p-3 bg-primary/5 border-l-4 border-primary rounded-r-lg">
                  <p className="text-xs text-muted-foreground">{slide.differentiator}</p>
                </div>
              </div>
            )}

            {/* Demo Slide */}
            {slide.type === "demo" && (
              <div>
                <h2 className="text-3xl font-bold text-primary border-b border-border pb-2 mb-2">{slide.title}</h2>
                <p className="text-muted-foreground mb-8 max-w-3xl">{slide.subtitle}</p>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  {slide.sections?.map((section: { name: string; desc: string }, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * i }}
                      className="p-6 rounded-lg border border-border bg-card"
                    >
                      <div className="text-sm font-semibold text-primary mb-1">{section.name}</div>
                      <div className="text-xs text-muted-foreground">{section.desc}</div>
                    </motion.div>
                  ))}
                </div>
                {slide.previewLink && (
                  <div className="flex justify-center mb-6">
                    <Button size="lg" asChild>
                      <Link href={slide.previewLink}>
                        Launch Interactive Preview
                        <ArrowRight className="ml-2 size-4" />
                      </Link>
                    </Button>
                  </div>
                )}
                {slide.note && (
                  <div className="p-4 rounded-lg border border-border/50 bg-muted/30 text-center">
                    <p className="text-xs text-muted-foreground italic">{slide.note}</p>
                  </div>
                )}
              </div>
            )}

            {/* Lifecycle Slide */}
            {slide.type === "lifecycle" && (
              <div>
                <h2 className="text-3xl font-bold text-primary border-b border-border pb-2 mb-8">{slide.title}</h2>
                <div className="flex items-center gap-2 mb-8">
                  {slide.steps?.map((step: string, i: number) => (
                    <React.Fragment key={i}>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 * i }}
                        className={cn(
                          "flex-1 py-4 px-3 rounded-lg border text-center font-semibold text-sm",
                          slide.highlight?.includes(i)
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-card"
                        )}
                      >
                        {step}
                      </motion.div>
                      {i < (slide.steps?.length || 0) - 1 && (
                        <ArrowRight className="size-5 text-primary/50 flex-shrink-0" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
                <div className="rounded-xl border border-border overflow-hidden bg-card">
                  <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 border-b border-border">
                    <div className="flex gap-1.5">
                      <div className="size-3 rounded-full bg-red-400" />
                      <div className="size-3 rounded-full bg-amber-400" />
                      <div className="size-3 rounded-full bg-emerald-400" />
                    </div>
                    <div className="flex-1 bg-background rounded px-3 py-1 text-xs font-mono text-muted-foreground">
                      https://app.odum-research.co.uk/strategies
                    </div>
                  </div>
                  <div className="p-8 text-center space-y-6">
                    <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl mx-auto">{slide.demo}</p>
                    <div className="flex items-center justify-center gap-4">
                      <Link href="/login?redirect=/dashboard" target="_blank">
                        <Button variant="outline" size="lg" className="gap-2">
                          <Play className="size-4" />
                          Trader View
                        </Button>
                      </Link>
                      <Link href="/login?redirect=/executive" target="_blank">
                        <Button size="lg" className="gap-2">
                          <Play className="size-4" />
                          Executive View
                        </Button>
                      </Link>
                    </div>
                    <p className="text-xs text-muted-foreground italic mt-4">
                      Live demo will be shown during the presentation
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Revenue Slide */}
            {slide.type === "revenue" && (
              <div>
                <h2 className="text-3xl font-bold text-primary border-b border-border pb-2 mb-6">{slide.title}</h2>
                <div className="overflow-hidden rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-card">
                        <th className="text-left p-3 text-primary font-semibold border-b border-primary">Service</th>
                        <th className="text-left p-3 text-primary font-semibold border-b border-primary">Model</th>
                        <th className="text-left p-3 text-primary font-semibold border-b border-primary">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {slide.services?.map((service: { name: string; model: string; status: string; note?: string }, i: number) => (
                        <motion.tr
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * i }}
                          className="border-b border-border hover:bg-muted/50"
                        >
                          <td className="p-3 font-semibold">{service.name}</td>
                          <td className="p-3 text-muted-foreground">{service.model}</td>
                          <td className="p-3">
                            <StatusBadge status={service.status} />
                            {service.note && <span className="ml-2 text-xs text-muted-foreground">- {service.note}</span>}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 p-4 bg-gradient-to-r from-primary/5 to-violet-500/5 border-l-4 border-primary rounded-r-lg">
                  <p className="text-sm text-muted-foreground">{slide.disclosure}</p>
                </div>
              </div>
            )}

            {/* Flywheel Slide */}
            {slide.type === "flywheel" && (
              <div>
                <h2 className="text-3xl font-bold text-primary border-b border-border pb-2 mb-4">{slide.title}</h2>
                <p className="text-muted-foreground mb-6">{slide.subtitle}</p>
                <div className="flex items-center gap-2 mb-4">
                  {slide.funnel?.map((step: { name: string; sub: string; active?: boolean }, i: number) => (
                    <React.Fragment key={i}>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 * i }}
                        className={cn(
                          "flex-1 py-4 px-3 rounded-lg border text-center",
                          step.active ? "border-primary bg-primary/10" : "border-border bg-card"
                        )}
                      >
                        <div className={cn("font-semibold text-sm", step.active && "text-primary")}>{step.name}</div>
                        <div className="text-xs text-muted-foreground">{step.sub}</div>
                      </motion.div>
                      {i < (slide.funnel?.length || 0) - 1 && (
                        <ArrowRight className="size-5 text-primary/50 flex-shrink-0" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
                <div className="text-center text-xs text-muted-foreground mb-6">
                  Regulatory coverage spans all stages
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 rounded-lg border border-primary/30 bg-primary/5 text-center">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Data clients become backtesting clients.<br />
                      Backtesting clients want execution.<br />
                      Execution clients want the full platform.
                    </p>
                    <p className="mt-4 text-primary font-medium">Every entry point is a gateway to deeper engagement.</p>
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-card">
                    <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Cross-Sell Examples</h3>
                    <ul className="space-y-2">
                      {slide.examples?.map((ex: string, i: number) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <ArrowRight className="size-4 text-primary flex-shrink-0 mt-0.5" />
                          {ex}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Operations Slide */}
            {slide.type === "operations" && (
              <div>
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-3xl font-bold text-primary border-b border-border pb-2">{slide.title}</h2>
                  <div className="flex gap-4 flex-shrink-0">
                    {slide.metrics?.map((m: { value: string; label: string }, i: number) => (
                      <div key={i} className="text-center">
                        <div className="text-xl font-bold text-primary">{m.value}</div>
                        <div className="text-[10px] text-muted-foreground">{m.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {slide.columns?.map((col: { title: string; items: string[] }, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * i }}
                      className="p-4 rounded-lg border border-border bg-card"
                    >
                      <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">{col.title}</h3>
                      <ul className="space-y-2">
                        {col.items.map((item: string, j: number) => (
                          <li key={j} className="text-xs text-muted-foreground flex items-start gap-2">
                            <ArrowRight className="size-3 text-primary flex-shrink-0 mt-0.5" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  ))}
                </div>
                <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 text-center">
                  <p className="text-sm text-muted-foreground">
                    {slide.callout?.split("15–20 people").map((part: string, i: number) => 
                      i === 0 ? part : <React.Fragment key={i}><span className="text-primary font-semibold">15–20 people</span>{part}</React.Fragment>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Traction Slide */}
            {slide.type === "traction" && (
              <div>
                <h2 className="text-3xl font-bold text-primary border-b border-border pb-2 mb-6">{slide.title}</h2>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-4">Achieved</h3>
                    <div className="space-y-3">
                      {slide.achieved?.map((item: { text: string; detail: string }, i: number) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * i }}
                          className="flex items-start gap-3 p-3 border-b border-border"
                        >
                          <Check className="size-5 text-emerald-400 flex-shrink-0" />
                          <div>
                            <div className="font-semibold text-sm">{item.text}</div>
                            <div className="text-xs text-muted-foreground">{item.detail}</div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-4">In Progress</h3>
                    <div className="space-y-3">
                      {slide.inProgress?.map((item: { text: string; detail: string }, i: number) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * i }}
                          className="flex items-start gap-3 p-3 border-b border-border"
                        >
                          <Circle className="size-5 text-amber-400 flex-shrink-0" />
                          <div>
                            <div className="font-semibold text-sm">{item.text}</div>
                            <div className="text-xs text-muted-foreground">{item.detail}</div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-6 p-4 rounded-lg border border-primary/30 bg-primary/5 text-center">
                  <p className="text-sm text-muted-foreground">
                    This is a <span className="text-primary font-medium">checkpoint</span>. {slide.checkpoint?.split("checkpoint.")[1]}
                  </p>
                </div>
              </div>
            )}

            {/* Ask Slide */}
            {slide.type === "ask" && (
              <div className="text-center">
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-5xl font-black tracking-tight bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent"
                >
                  {slide.title}
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto"
                >
                  {slide.subtitle}
                </motion.p>
                <div className="mt-2 h-1 w-20 mx-auto bg-gradient-to-r from-primary to-violet-500 rounded" />
                <div className="grid grid-cols-3 gap-6 mt-10">
                  {slide.asks?.map((ask: { title: string; items: string[] }, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + 0.1 * i }}
                      className="p-6 rounded-lg border border-primary/30 bg-primary/5 text-left"
                    >
                      <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-4">{ask.title}</h3>
                      <ul className="space-y-2">
                        {ask.items.map((item: string, j: number) => (
                          <li key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                            <ArrowRight className="size-4 text-primary flex-shrink-0 mt-0.5" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  ))}
                </div>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mt-10 text-sm text-muted-foreground"
                >
                  Odum Research Ltd | FCA 975797 | {slide.contact} | odum-research.com
                </motion.p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Navigation */}
      <footer className="flex items-center justify-between px-6 py-4 border-t border-border bg-card/50">
        <Button variant="ghost" size="sm" onClick={prevSlide} disabled={currentSlide === 0}>
          <ChevronLeft className="size-4 mr-1" />
          Previous
        </Button>
        <div className="flex gap-1">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={cn(
                "size-2 rounded-full transition-all",
                currentSlide === i ? "bg-primary w-6" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
            />
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={nextSlide} disabled={currentSlide === slides.length - 1}>
          Next
          <ChevronRight className="size-4 ml-1" />
        </Button>
      </footer>
    </div>
  )
}
