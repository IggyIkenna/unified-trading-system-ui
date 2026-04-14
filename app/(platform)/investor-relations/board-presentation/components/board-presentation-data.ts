// Board Presentation — data for 11-slide strategic advisor deck
// Last updated: April 2026

// Venue list for scrolling display - color-coded by asset class
export const VENUE_LIST = [
  // Traditional Finance - cyan
  { name: "CME Group", color: "cyan" },
  { name: "ICE", color: "cyan" },
  { name: "CBOE", color: "cyan" },
  { name: "NASDAQ", color: "cyan" },
  { name: "NYSE", color: "cyan" },
  // Centralised Crypto - green
  { name: "Binance", color: "green" },
  { name: "OKX", color: "green" },
  { name: "Bybit", color: "green" },
  { name: "Deribit", color: "green" },
  { name: "Coinbase", color: "green" },
  { name: "Hyperliquid", color: "green" },
  { name: "Aster", color: "green" },
  { name: "Upbit", color: "green" },
  // Decentralised Finance - violet
  { name: "Uniswap V3", color: "violet" },
  { name: "Uniswap V4", color: "violet" },
  { name: "Aave V3", color: "violet" },
  { name: "Morpho", color: "violet" },
  { name: "Curve", color: "violet" },
  { name: "Balancer", color: "violet" },
  { name: "Lido", color: "violet" },
  { name: "EtherFi", color: "violet" },
  { name: "Ethena", color: "violet" },
  { name: "PancakeSwap", color: "violet" },
  { name: "SushiSwap", color: "violet" },
  { name: "GMX", color: "violet" },
  { name: "Aerodrome", color: "violet" },
  { name: "Velodrome", color: "violet" },
  { name: "Raydium", color: "violet" },
  { name: "Orca", color: "violet" },
  // Sports - amber
  { name: "Betfair", color: "amber" },
  { name: "Pinnacle", color: "amber" },
  { name: "Smarkets", color: "amber" },
  { name: "DraftKings", color: "amber" },
  { name: "FanDuel", color: "amber" },
  { name: "Bet365", color: "amber" },
  // Predictions - rose
  { name: "Polymarket", color: "rose" },
  { name: "Kalshi", color: "rose" },
];

// Slide data
export const slides = [
  // ── Slide 1: Cover ────────────────────────────────────────
  {
    id: 1,
    type: "cover",
    title: "One Unified Trading System",
    subtitle:
      "A single operating layer for multi-asset trading, execution, and oversight. Built for our own capital. Structured for institutional clients.",
    tagline: "FCA Authorised",
    stats: [
      { value: "5", label: "Asset Classes" },
      { value: "12,000+", label: "Live Instruments" },
      { value: "22", label: "Microservices" },
      { value: "$7.5M", label: "Under Management" },
    ],
  },

  // ── Slide 2: The Problem ──────────────────────────────────
  {
    id: 2,
    type: "doctrine",
    title: "The Market Is Still Stitched Together",
    subtitle:
      "To replicate what we have, a firm would need to integrate 80+ venues across 5 asset classes, 28 decentralised finance protocols on 11 blockchains, and 65+ sports data sources \u2014 each with different schemas, settlement logic, and connectivity. Most firms stitch together fragments. We built the unified layer.",
    points: [
      {
        problem: "80+ venues, 5 asset classes, dozens of schemas",
        solution: "One codebase, one language, one normalised schema",
      },
      {
        problem: "Strategies break when promoted to live",
        solution:
          "One configuration structure \u2014 config change to promote, not a rewrite",
      },
      {
        problem: "Execution fragmented across venues and chains",
        solution: "One deployment infrastructure, one algo layer across all venues",
      },
      {
        problem: "Monitoring and compliance bolted on after the fact",
        solution:
          "One web-based interface for trading, reporting, and controls",
      },
    ],
    differentiators: [
      "Cross-asset backtesting: decentralised finance, traditional finance, crypto, sports, prediction markets \u2014 one environment",
      "Backtest to live with no rewrite \u2014 same data, same features, same risk controls",
      "Same infrastructure for internal capital and external clients",
    ],
    conclusion: "The alternative is stitching together 80+ integrations. We built one system.",
  },

  // ── Slide 3: The Solution ─────────────────────────────────
  {
    id: 3,
    type: "lifecycle-new",
    title: "One System, Five Connected Layers",
    subtitle:
      "From instrument discovery through execution to regulatory reporting \u2014 the same layers govern internal operations and client access.",
    stages: [
      { name: "Instruments & Data", desc: "Discover, normalise, validate" },
      { name: "Research & Modelling", desc: "Features, ML, simulate" },
      { name: "Decision & Strategy", desc: "Signals, sizing, risk" },
      { name: "Execution & Control", desc: "Route, fill, monitor" },
      { name: "Governance & Reporting", desc: "Audit, comply, report" },
    ],
  },

  // ── Slide 4: Why This Is Hard to Replicate ────────────────
  {
    id: 4,
    type: "operations",
    title: "Why This Is Hard to Replicate",
    columns: [
      {
        title: "One Shared Instrument Layer",
        items: [
          "12,000+ live instruments across 5 asset classes",
          "28 decentralised finance protocols across 11 blockchains",
          "40,000+ sports fixtures processed annually",
          "One canonical schema across all domains",
        ],
      },
      {
        title: "Proven Commercially",
        items: [
          "$7.5M of our own capital through the same system \u2014 alignment is structural",
          "First platform client at $125K, growing to $250K+ \u2014 commercial traction, not just capability",
          "1 regulatory coverage client live, 3 in pipeline \u2014 repeatable onboarding",
          "Every service has paying clients \u2014 not a prototype",
        ],
      },
      {
        title: "One Operating Layer",
        items: [
          "Data, research, execution, monitoring, governance \u2014 not bolted together",
          "New venue integration benefits every strategy automatically",
          "New strategy benefits every client automatically",
          "AI-assisted operations with human approval gates",
        ],
      },
    ],
    callout:
      "Rebuilding this from scratch would be a significant multi-year, multi-team effort. We operate it with a small team \u2014 AI-assisted workflows handle routine operations, with human approval gates at critical decisions.",
    metrics: [
      { value: "5", label: "Asset Classes" },
      { value: "24,500+", label: "Automated Tests" },
      { value: "22", label: "Microservices" },
      { value: "$7.5M", label: "Under Management" },
    ],
  },

  // ── Slide 5: Breadth Without Fragmentation ────────────────
  {
    id: 5,
    type: "breadth-matrix",
    title: "Breadth Without Fragmentation",
    subtitle: "Every cell is served by the same underlying system.",
    columns: [
      "Instruments",
      "Data",
      "Research",
      "Execution",
      "Monitoring",
    ],
    rows: [
      {
        asset: "Traditional Finance",
        color: "cyan",
        cells: [
          "CME Group, ICE, CBOE, NASDAQ, NYSE",
          "Tick, orderbook, candles",
          "Futures, options, equities",
          "Time-weighted, volume-weighted, smart routing, optimal execution",
          "Returns, risk, reconciliation",
        ],
      },
      {
        asset: "Centralised Crypto",
        color: "green",
        cells: [
          "Binance, OKX, Bybit, Deribit +4",
          "Tick, orderbook, liquidations, funding",
          "Spot, perpetuals, options surface",
          "Same algo suite + venue routing",
          "Same monitoring layer",
        ],
      },
      {
        asset: "Decentralised Finance",
        color: "violet",
        cells: [
          "28 protocols, 11 chains",
          "Lending rates, pool data, gas fees",
          "Yield simulation, flash loans",
          "Uniswap, Aave, Morpho, Curve, Lido, and more",
          "On-chain position tracking",
        ],
      },
      {
        asset: "Sports",
        color: "amber",
        cells: [
          "102 leagues, 40K+ fixtures/yr",
          "Odds from 65+ sources",
          "Machine learning prediction pipeline",
          "Cross-bookmaker routing",
          "Settlement reconciliation",
        ],
      },
      {
        asset: "Predictions",
        color: "rose",
        cells: [
          "Polymarket, Kalshi +3",
          "Binary / multi-outcome pricing",
          "Cross-market arbitrage detection",
          "Prediction market execution",
          "Event resolution tracking",
        ],
      },
    ],
  },

  // ── Slide 6: Strategy Families ────────────────────────────
  {
    id: 6,
    type: "strategies",
    title: "Strategy Families \u2014 Risk, Return & Capacity",
    subtitle: "Same infrastructure, configurable risk appetite.",
    families: [
      {
        name: "Decentralised \u2014 Stable Yield",
        returns: "3-12% annual",
        drawdown: "<1%",
        capacity: "$50M-$100M+",
        character: "Lending, stablecoin yield",
        risk: "low",
      },
      {
        name: "Decentralised \u2014 Basis Trades",
        returns: "10-30% annual",
        drawdown: "5%",
        capacity: "$5M-$20M",
        character: "Delta-neutral, funding capture",
        risk: "low",
      },
      {
        name: "Decentralised \u2014 Recursive",
        returns: "20-50% annual",
        drawdown: "15%",
        capacity: "$5M/pool",
        character: "Recursive staking, liquidity provision",
        risk: "medium",
      },
      {
        name: "Crypto Long/Short ML",
        returns: "30%+",
        drawdown: "5-10%",
        capacity: "$2M/pair",
        character: "Machine learning long/short, mean reversion, arbitrage",
        risk: "medium",
      },
      {
        name: "Traditional Finance Quant",
        returns: "12-18%",
        drawdown: "8-10%",
        capacity: "$5M/name",
        character: "Machine learning directional, options, volatility",
        risk: "medium",
      },
      {
        name: "Sports",
        returns: "50%+",
        drawdown: "20%",
        capacity: "$100K-$1M",
        character: "Machine learning prediction, arbitrage",
        risk: "high",
      },
    ],
    callout:
      "We deploy from $100K to $100M+ depending on the strategy. The infrastructure is the same \u2014 only the configuration changes.",
  },

  // ── Slide 7: What Is Live Today ───────────────────────────
  {
    id: 7,
    type: "traction",
    title: "What Is Real Today",
    achieved: [
      {
        text: "Crypto mean reversion",
        detail: "$4M under management, ~30%+ annualised, 1 year track record, $3.3M at high watermark",
      },
      {
        text: "Bitcoin fund of funds",
        detail: "$3.5M+ under management, 5 year track record",
      },
      {
        text: "First regulatory coverage client onboarded",
        detail: "FCA ref 975797",
      },
      {
        text: "First trading platform sold \u2014 $125K contract revenue (75% received)",
        detail: "Decentralised finance client \u2014 3 strategies (5-20% annual), growing to $250K+ annual revenue",
      },
      {
        text: "Platform operational",
        detail: "22 microservices, 24,500+ tests, all passing",
      },
    ],
    inProgress: [
      {
        text: "3 additional regulatory coverage prospects",
        detail: "in conversation, evaluating coverage",
      },
      {
        text: "Memorandum of understanding for execution services",
        detail: "institutional counterparty",
      },
      {
        text: "Client funding development",
        detail: "India Exchange \u2014 delta one + arbitrage",
      },
    ],
    launchReady: [
      {
        text: "Broader platform deployments",
        detail: "First sale complete, ready for additional clients across all 5 asset classes",
      },
      {
        text: "Data provision",
        detail: "Normalised feeds across all domains",
      },
      {
        text: "Backtest to live",
        detail: "Same code path, config change to promote",
      },
      {
        text: "35 strategies, 5 families",
        detail: "30 code-complete, covering full spectrum",
      },
      {
        text: "9 execution algorithms",
        detail: "Time-weighted, volume-weighted, smart routing, optimal execution + more",
      },
    ],
    checkpoint:
      "Across all three services, the remaining constraint is commercial focus and sequencing rather than core engineering build-out.",
  },

  // ── Slide 8: Three Services ───────────────────────────────
  {
    id: 8,
    type: "packaging",
    title: "Three Commercial Wrappers, One System",
    subtitle:
      "Clients start where it fits. The system underneath is the same.",
    services: [
      {
        name: "Trading Platform as a Service",
        stages: [
          "Instruments & Data",
          "Research",
          "Decision",
          "Execution",
          "Governance",
        ],
        model: "Subscription \u2014 scoped to client need",
        desc: "Access the trading stack without building it. Enter at data, research, or execution \u2014 expand over time. Live in weeks, not years.",
      },
      {
        name: "Investment Management",
        stages: ["Decision", "Execution", "Governance"],
        model: "20-40% performance (strategy-dependent)",
        desc: "Allocate to strategies we already run with our own capital. Co-invest at identical terms. 0% management fee \u2014 performance only.",
      },
      {
        name: "Regulatory Umbrella",
        stages: ["Governance"],
        model: "Onboarding fee + monthly retainer",
        desc: "Operate under FCA coverage without waiting for direct authorisation. Full permissions scope. Operational in weeks. 1 live, 3 in pipeline.",
      },
    ],
    note: "Three distinct buyer outcomes \u2014 capability, exposure, or regulatory coverage \u2014 all on one shared system. A platform client buys infrastructure. An IM client buys returns. A regulatory client buys speed to market. Each deepens naturally into the others.",
  },

  // ── Slide 9: The Flywheel ─────────────────────────────────
  {
    id: 9,
    type: "flywheel",
    title: "Why One Sale Leads to Others",
    subtitle:
      "The relationship deepens naturally because every step uses the same system.",
    funnel: [
      { name: "Data", sub: "entry point", active: true },
      { name: "Research", sub: "validate ideas", active: false },
      { name: "Live Trading", sub: "same code, live capital", active: false },
      { name: "Full Platform", sub: "complete operating layer", active: false },
      { name: "Managed", sub: "we run or regulate it", active: true },
    ],
    examples: [
      "Data subscriber discovers signal quality \u2192 starts backtesting",
      "Backtester validates edge \u2192 promotes to live (config change)",
      "Live trader scales \u2192 needs regulatory coverage",
      "Platform user wants managed capital \u2192 becomes investment management client",
    ],
  },

  // ── Slide 10: The Ask ─────────────────────────────────────
  {
    id: 10,
    type: "ask",
    title: "What Fits Your Network",
    subtitle:
      "Everything we\u2019ve shown is shippable. The question is which service resonates with the people you work with \u2014 and what they\u2019d need to see to move.",
    asks: [
      {
        title: "Investment Management",
        items: [
          "Who allocates to alternative strategies \u2014 crypto, DeFi yield, quant?",
          "Next step: mandate discussion and reporting pack review",
          "What matters most \u2014 track record depth, fee structure, minimum ticket?",
        ],
      },
      {
        title: "Trading Platform as a Service",
        items: [
          "Who needs trading infrastructure but doesn\u2019t want to build it?",
          "Next step: scoping call and limited trial on data + research layers",
          "What would land \u2014 data-only entry, full demo, or specific asset class?",
        ],
      },
      {
        title: "Regulatory Umbrella",
        items: [
          "Who is entering UK regulation or needs FCA coverage quickly?",
          "Next step: eligibility assessment \u2014 we scope fit before any commitment",
          "What matters most \u2014 onboarding speed, permissions scope, or pricing?",
        ],
      },
    ],
    contact: "ikenna@odum-research.com",
  },

  // ── Slide 11: FAQ ──────────────────────────────────────────
  {
    id: 11,
    type: "faq",
    title: "Questions We Get Asked",
    subtitle: "Standardised answers to the most common questions from advisors and prospects.",
    questions: [
      {
        q: "Why can\u2019t someone just build this with AI?",
        a: "AI is a force multiplier, but it multiplies the judgement of the person directing it. Our team has personally traded options, delta one, high frequency, and medium frequency across traditional finance, crypto, and sports. If you have a significant drawdown, you need to be able to switch off the AI and debug the system yourself. That requires experience that transcends the tooling. We use AI heavily \u2014 but the critical decisions are made by experienced humans.",
      },
      {
        q: "Why would someone share their alpha with you?",
        a: "They don\u2019t have to. The platform is modular. You can use just data, just execution, just research, or just reporting \u2014 without us ever seeing your signals. Even on the full platform, we make bespoke deals. We don\u2019t trade the same strategy you\u2019re running. We don\u2019t need to \u2014 we have our own.",
      },
      {
        q: "How do you handle conflicts between your own trading and client strategies?",
        a: "We partition. Internal alpha stays internal \u2014 we don\u2019t share signal logic, feature weights, or parameters. Client strategies are bespoke and separate. We will never front-run a client or build strategies that overlap with theirs. We have enough strategy families to allocate some to investment management and still build for clients without conflict.",
      },
      {
        q: "Why should I trust you with my infrastructure?",
        a: "We built this for ourselves first. It runs our own capital \u2014 $7.5M across two mandates. We have clients for every service we offer. Nothing we deploy for a client goes through without the same vetting we apply to our own money. If we wouldn\u2019t trust it with our capital, it doesn\u2019t ship.",
      },
      {
        q: "What happens if a client wants to leave?",
        a: "They can. If we built a bespoke strategy for you, the logic is yours. The switching cost is operational \u2014 the accumulated validation, data history, and familiarity with the platform \u2014 not contractual lock-in.",
      },
    ],
  },

  // ── Slide 12: Live Demo ───────────────────────────────────
  {
    id: 12,
    type: "demo",
    title: "Platform Demo",
    subtitle:
      "A walkthrough of the live system. Click any section to navigate directly.",
    previewLink: "/dashboard",
    sections: [
      {
        name: "Dashboard",
        desc: "Platform overview \u2014 positions, returns, risk, alerts",
        link: "/dashboard",
        image: "/screenshots/dashboard.png",
      },
      {
        name: "Trading & Positions",
        desc: "Live positions, orders, returns attribution",
        link: "/services/trading/positions",
        image: "/screenshots/positions.png",
      },
      {
        name: "Instruments & Coverage",
        desc: "12,000+ instruments across all asset classes",
        link: "/services/data/instruments",
        image: "/screenshots/instruments.png",
      },
      {
        name: "Strategy Research",
        desc: "Backtests, strategy comparison, machine learning analysis",
        link: "/services/research/strategy/overview",
        image: "/screenshots/strategy-overview.png",
      },
      {
        name: "Client Reporting",
        desc: "Executive dashboard, investment book of records, reconciliation",
        link: "/services/reports/executive",
        image: "/screenshots/executive.png",
      },
      {
        name: "Risk & Scenarios",
        desc: "Scenario analysis, stress testing, historical replay",
        link: "/services/observe/scenarios",
        image: "/screenshots/scenarios.png",
      },
    ],
    note: "All views use the same underlying system. Demo data is representative of production output.",
  },
];
