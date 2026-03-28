// Auto-extracted presentation data
// Venue list for scrolling display - color-coded by asset class
export const VENUE_LIST = [
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
];

// Slide data
export const slides = [
  // Slide 1: Cover
  {
    id: 1,
    type: "cover",
    title: "Unified Trading Infrastructure",
    subtitle:
      "The same infrastructure we use to run our own capital - available to institutional clients at any entry point.",
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
    subtitle:
      "Clients enter at the lifecycle stage that fits their operating model. Execution workflows integrate with existing research pipelines.",
    entries: [
      {
        name: "Data",
        stages: ["Acquire"],
        alpha: false,
        desc: "Normalised feeds across all asset classes",
      },
      {
        name: "Research",
        stages: ["Acquire", "Build"],
        alpha: true,
        desc: "Data plus backtesting and simulation",
      },
      {
        name: "Execution",
        stages: ["Promote", "Run", "Observe"],
        alpha: false,
        desc: "Integrate existing signals into our execution stack",
      },
      {
        name: "Full Platform",
        stages: ["Acquire", "Build", "Promote", "Run", "Observe"],
        alpha: true,
        desc: "End-to-end infrastructure access",
      },
      {
        name: "Managed",
        stages: ["Manage", "Report"],
        alpha: false,
        desc: "Discretionary capital management",
      },
    ],
    note: "Flexible integration for firms that retain their own research stack.",
  },
  // Slide 3: Lifecycle
  {
    id: 3,
    type: "lifecycle-new",
    title: "Platform Lifecycle",
    subtitle:
      "From data ingestion through execution to regulatory reporting - the same lifecycle governs internal operations and client access.",
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
      {
        name: "Data",
        desc: "Feeds, normalisation, entitlements",
        color: "sky",
        emphasis: [0, 1, 4],
      },
      {
        name: "ML",
        desc: "Features, models, signals, inference",
        color: "violet",
        emphasis: [1, 2, 3, 4],
      },
      {
        name: "Strategy",
        desc: "Research, simulation, decision logic",
        color: "amber",
        emphasis: [1, 2, 3, 4],
      },
      {
        name: "Execution",
        desc: "Algos, routing, transaction cost",
        color: "emerald",
        emphasis: [2, 3, 4],
      },
      {
        name: "Capital",
        desc: "Mandates, allocations, oversight",
        color: "rose",
        emphasis: [3, 4, 5, 6],
      },
      {
        name: "Compliance",
        desc: "Audit trail, regulatory controls",
        color: "slate",
        emphasis: [2, 3, 4, 6],
      },
    ],
  },
  // Slide 5: Commercial Packaging
  {
    id: 5,
    type: "packaging",
    title: "Commercial Packaging",
    subtitle: "Each service maps to specific lifecycle stages. Clients can start at any point and expand over time.",
    services: [
      {
        name: "Data Provision",
        stages: ["Acquire"],
        model: "Subscription",
        desc: "Normalised market data across 5 asset classes",
      },
      {
        name: "Backtesting as a Service",
        stages: ["Acquire", "Build"],
        model: "Compute credits",
        desc: "Research infrastructure and simulation",
      },
      {
        name: "Trading Terminal",
        stages: ["Run", "Observe"],
        model: "Platform subscription",
        desc: "Live trading, monitoring, execution, and control",
      },
      {
        name: "Regulatory Umbrella",
        stages: ["Manage", "Report"],
        model: "Retainer",
        desc: "FCA Appointed Representative services",
      },
      {
        name: "Investment Management",
        stages: ["Manage", "Report"],
        model: "Performance-aligned",
        desc: "Discretionary capital management",
      },
      {
        name: "Platform Licence",
        stages: ["Acquire", "Build", "Promote", "Run", "Observe"],
        model: "Enterprise",
        desc: "Full infrastructure access",
      },
    ],
    note: "Contact us for pricing. Terms vary by service and volume.",
  },
  // Slide 6: Why One Platform
  {
    id: 6,
    type: "doctrine",
    title: "Why One Platform",
    subtitle:
      "The alternative is disconnected tools - separate data vendors, separate backtesting, separate execution, separate compliance. Each boundary creates friction, reconciliation overhead, and operational risk.",
    points: [
      {
        problem: "Disconnected data sources",
        solution: "One normalised schema across all 5 asset classes",
      },
      {
        problem: "Multiple backtesting tools",
        solution: "Single simulation engine, unified strategy framework",
      },
      {
        problem: "Fragmented execution",
        solution: "Unified algo layer across 128 venues",
      },
      {
        problem: "Separate compliance stacks",
        solution: "Integrated audit trail and regulatory reporting",
      },
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
      {
        icon: "TrendingUp",
        name: "TradFi",
        sub: "CME, ICE, NYMEX, IBKR",
        count: "12 venues",
        color: "cyan",
        detail: "Futures, options, equities",
      },
      {
        icon: "Database",
        name: "Crypto CeFi",
        sub: "Binance, OKX, Deribit, Bybit",
        count: "18 venues",
        color: "green",
        detail: "Spot, perps, options",
      },
      {
        icon: "Layers",
        name: "DeFi",
        sub: "Uniswap, Aave, Hyperliquid",
        count: "8 venues",
        color: "violet",
        detail: "LP, lending, on-chain perps",
      },
      {
        icon: "Globe",
        name: "Sports",
        sub: "Betfair, Pinnacle +90 more",
        count: "90 venues",
        color: "amber",
        detail: "Football, NFL, NBA, Tennis",
      },
      {
        icon: "LineChart",
        name: "Predictions",
        sub: "Polymarket, Kalshi",
        count: "4 venues",
        color: "rose",
        detail: "Political, crypto, macro",
      },
    ],
    instrumentCount: "1.5M+",
    instrumentNote: "instruments registered in our database (including historical/expired)",
    differentiator:
      "Normalised data schema across all asset classes. Enables cross-market arbitrage: BTC across CeFi/DeFi, BTC prediction markets vs CeFi derivatives (Polymarket vs Binance/Deribit), S&P data for crypto predictions, sports odds vs prediction markets. ML signals translate across domains.",
  },
  {
    id: 9,
    type: "demo",
    title: "Platform Demo",
    subtitle:
      "A preview of the trading infrastructure. Full interactive walkthrough available during this presentation.",
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
      {
        name: "Data Provision",
        model: "From £250/mo",
        status: "live",
        note: "we use the data",
      },
      {
        name: "Backtesting as a Service",
        model: "From £8,000/mo",
        status: "live",
        note: "we use the backtest",
      },
      {
        name: "Trading Terminal",
        model: "Platform subscription + advanced execution bolt-on",
        status: "live",
        note: "execution included in terminal, advanced algos as add-on",
      },
      {
        name: "Regulatory Umbrella (AR)",
        model: "GBP 10k setup + GBP 4k/mo",
        status: "active",
        note: "first client onboarded",
      },
      {
        name: "Investment Management",
        model: "0% management + 35% performance",
        status: "live",
        note: "+34.2% since Feb 2026",
      },
      {
        name: "Strategy / Platform Licence",
        model: "From $100k per strategy",
        status: "ready",
        note: "",
      },
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
    callout:
      "A competitor building this from scratch would need 15–20 people. We run the same system with a fraction of that headcount — automating the majority of workflows with human approval gates at critical decisions.",
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
      {
        text: "UTS platform operational",
        detail: "full lifecycle management across 5 asset classes",
      },
      {
        text: "Investment management live",
        detail: "clients at high watermark, +34.2% since Feb 2026",
      },
      {
        text: "First regulatory client onboarded",
        detail: "FCA Appointed Representative",
      },
      { text: "First services client delivery", detail: "in days, not months" },
    ],
    inProgress: [
      {
        text: "Client funding development",
        detail: "options on India Exchange (Delta One + Arbitrage)",
      },
      {
        text: "Building track record",
        detail: "for initial strategies across all asset classes",
      },
      {
        text: "Expanding AR services",
        detail: "in talks about further regulatory coverage",
      },
      {
        text: "MOU for execution services",
        detail: "institutional counterparty",
      },
    ],
    checkpoint:
      "This is a checkpoint. We're aligning on how to best diversify revenue streams, targeting the most commercially viable products and markets. The toolkit is built - now we're pointing it in the right direction.",
  },
  {
    id: 14,
    type: "ask",
    title: "Next Steps",
    subtitle:
      "The infrastructure is built, the regulation is in place, and the stack is live across all five asset classes. The purpose of this meeting is to sense-check the path forward — which products to lead with, which markets to prioritise, and where the advisory board can accelerate that.",
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
];
