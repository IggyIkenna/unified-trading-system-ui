// Trading Platform as a Service Presentation — slide data

export const slides = [
  {
    id: 1,
    type: "cover",
    title: "Trading Infrastructure Without the Build",
    subtitle:
      "Access the trading stack without building it. Five asset classes, one normalised schema, live in weeks \u2014 not the 18\u201324 months it takes to build from scratch.",
    tagline: "FCA Authorised",
    stats: [
      { value: "5", label: "Asset Classes" },
      { value: "12,000+", label: "Live Instruments" },
      { value: "$7.5M", label: "Our Own Capital" },
      { value: "Weeks", label: "To Go Live" },
    ],
  },
  {
    id: 2,
    type: "doctrine",
    title: "Building This Is Harder Than It Looks",
    subtitle:
      "To replicate what our platform provides, you would need to integrate 80+ venues across 5 asset classes, 28 decentralised finance protocols on 11 blockchains, and 65+ sports data sources \u2014 each with different schemas, settlement logic, and connectivity.",
    points: [
      {
        problem: "80+ venue integrations, each with different schemas",
        solution: "One codebase, one language, one normalised schema \u2014 already built and tested",
      },
      {
        problem: "Backtests that do not match production",
        solution: "Same code path from backtest to live \u2014 configuration change, not rewrite",
      },
      {
        problem: "Execution fragmented across venues, chains, and asset classes",
        solution: "One deployment infrastructure, one execution layer across all venues",
      },
      {
        problem: "18\u201324 months before you can trade",
        solution: "Live on our platform in weeks, not years",
      },
    ],
    differentiators: [
      "First platform client already live at $125K \u2014 operational, not theoretical",
      "12,000+ instruments normalised across 80+ venues \u2014 breadth you would need years to replicate",
      "Expanding is adding access, not migrating systems \u2014 switching cost is low by design",
    ],
    conclusion: "You can build it yourself. Or you can start trading in weeks.",
  },
  {
    id: 3,
    type: "lifecycle-new",
    title: "One Platform, Your Scope",
    subtitle:
      "Enter at any layer. Expand over time. Every layer runs on shared infrastructure \u2014 expanding is adding access, not migrating systems.",
    stages: [
      { name: "Instruments & Data", desc: "Discover, normalise, validate" },
      { name: "Research & Modelling", desc: "Features, ML, simulate" },
      { name: "Decision & Strategy", desc: "Signals, sizing, risk" },
      { name: "Execution & Control", desc: "Route, fill, monitor" },
      { name: "Governance & Reporting", desc: "Audit, comply, report" },
    ],
  },
  {
    id: 4,
    type: "packaging",
    title: "One Service, Flexible Scope",
    subtitle: "Every engagement is bespoke. You choose which capabilities you need \u2014 we scope the platform accordingly.",
    services: [
      {
        name: "Data Only",
        stages: ["Instruments & Data"],
        model: "Subscription",
        desc: "Normalised feeds across all five asset classes. 12,000+ instruments. We never see your signals.",
      },
      {
        name: "Data + Research",
        stages: ["Instruments & Data", "Research"],
        model: "Subscription + compute",
        desc: "Backtesting and simulation. Feature engineering, machine learning pipelines. Execute wherever you want.",
      },
      {
        name: "Data + Research + Execution",
        stages: ["Instruments & Data", "Research", "Execution"],
        model: "Subscription + per-trade",
        desc: "Backtest to live is a configuration change. Same data, same features, same risk controls. Plus execution algorithms across all venues.",
      },
      {
        name: "Full Platform",
        stages: ["Instruments & Data", "Research", "Decision", "Execution", "Governance"],
        model: "Enterprise subscription",
        desc: "The complete trading operating layer. Your strategies, your risk parameters, your commercial terms.",
      },
      {
        name: "Bespoke Strategy Build",
        stages: ["Instruments & Data", "Research", "Decision", "Execution", "Governance"],
        model: "$100K\u2013$250K development + retainer",
        desc: "We build specific strategies to your requirements. You operate them. Commercial terms bespoke per engagement.",
      },
    ],
    note: "This is one service with flexible scope \u2014 not five separate products. Every engagement uses the same underlying infrastructure. Expanding is adding capabilities, not migrating systems.",
  },
  // ── Slide 5: How You Plug In ──────────────────────────────
  {
    id: 5,
    type: "operations",
    title: "How You Plug In",
    columns: [
      {
        title: "You Have Signals \u2014 We Execute",
        items: [
          "You have built your own research and generate your own signals",
          "Send them to us via API \u2014 we execute across 80+ venues",
          "Advanced execution algorithms: time-weighted, volume-weighted, smart order routing, optimal execution",
          "Best execution reporting included \u2014 slippage, fill quality, venue analysis",
          "Alpha-based fees on execution outperformance",
          "You never touch our research layer \u2014 your intellectual property stays yours",
        ],
      },
      {
        title: "You Build Strategies on Our Infrastructure",
        items: [
          "Use our data, feature library, and backtesting environment to develop strategies",
          "When ready, promote to live \u2014 same code, same data, same risk controls",
          "No rewrite between backtest and production \u2014 that is the core value",
          "Use our frontend or build your own \u2014 the backend API is the same either way",
          "Rigorous testing: 24,500+ automated tests, quality gates on every change",
          "The benefit: backtest-to-live cohesion that would take 18 months to build yourself",
        ],
      },
      {
        title: "We Build Strategies for You",
        items: [
          "Tell us what you want: decentralised finance yield, crypto long/short, sports prediction",
          "We build it, test it on our own capital first, then deploy it for you",
          "You operate it through our frontend or your own \u2014 API-first architecture",
          "Bespoke commercial terms: development fee plus retainer or performance share",
          "Built by a team with decades of institutional trading experience",
          "Nothing ships that we would not trust with our own money",
        ],
      },
    ],
    callout:
      "The frontend can be ours or yours \u2014 the platform is API-first. You can use the full web interface, connect via API with your own tools, or combine both. The backend infrastructure is the same regardless.",
    metrics: [
      { value: "API", label: "First Architecture" },
      { value: "80+", label: "Venues Connected" },
      { value: "24,500+", label: "Automated Tests" },
      { value: "Same", label: "Backtest = Live" },
    ],
  },
  // ── Slide 6: See Each Scenario Live ────────────────────────
  {
    id: 6,
    type: "demo",
    title: "See Each Scenario Live",
    subtitle: "Click any scenario to see the relevant part of the platform.",
    sections: [
      {
        name: "Scenario 1: Execution",
        desc: "You send signals \u2014 see how we execute across venues, with fill quality and slippage analysis",
        link: "/services/trading/positions",
        image: "/screenshots/dashboard.png",
      },
      {
        name: "Scenario 2: Research & Backtest",
        desc: "Build strategies on our infrastructure \u2014 feature library, backtesting, promote to live",
        link: "/services/research/strategy/overview",
        image: "/screenshots/strategy-overview.png",
      },
      {
        name: "Scenario 3: Bespoke Build",
        desc: "See the instruments and data coverage available for bespoke strategy development",
        link: "/services/data/instruments",
        image: "/screenshots/instruments.png",
      },
      {
        name: "Returns Attribution",
        desc: "10-factor waterfall \u2014 see exactly where returns come from across all scenarios",
        link: "/services/trading/pnl",
      },
      {
        name: "Risk & Scenarios",
        desc: "Stress testing, historical replay, scenario analysis \u2014 shared across all engagement types",
        link: "/services/observe/scenarios",
      },
      {
        name: "Executive Reporting",
        desc: "Client reporting portal included with every engagement \u2014 compliance, settlement, audit trail",
        link: "/services/reports/executive",
        image: "/screenshots/executive.png",
      },
    ],
    note: "All views run on the same infrastructure. What you see in the demo is the same system running our own capital.",
  },
  {
    id: 7,
    type: "breadth-matrix",
    title: "What the Platform Covers",
    subtitle: "Every cell runs on shared infrastructure.",
    columns: ["Instruments", "Data", "Research", "Execution", "Monitoring"],
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
  // ── Slide 6: Strategy Catalog ──────────────────────────────
  {
    id: 8,
    type: "breadth-matrix",
    title: "Strategies Available on the Platform",
    subtitle: "35 strategies across 5 asset classes. Bespoke builds can combine any of these or create new ones.",
    columns: ["Yield / Lending", "Basis / Carry", "Directional / Momentum", "Arbitrage", "Market Making"],
    rows: [
      {
        asset: "Decentralised Finance",
        color: "violet",
        cells: [
          "Aave lending, Ethena benchmark, multi-chain lending, Solana lending (Kamino), Bitcoin lending",
          "Ethereum basis, staked basis, recursive staked basis, Solana basis (Drift), Bitcoin basis, L2 basis",
          "",
          "Cross-chain yield arbitrage, cross-chain rebalancing",
          "Uniswap V3 concentrated LP, Solana concentrated LP (Raydium/Orca)",
        ],
      },
      {
        asset: "Centralised Crypto",
        color: "green",
        cells: [
          "",
          "",
          "Momentum, mean reversion",
          "Cross-exchange arbitrage, statistical arbitrage",
          "Exchange market making (Binance, Deribit)",
        ],
      },
      {
        asset: "Traditional Finance",
        color: "cyan",
        cells: [
          "",
          "",
          "Machine learning directional (equities, futures, FX), momentum",
          "",
          "Options market making (Deribit, CME)",
        ],
      },
      {
        asset: "Sports",
        color: "amber",
        cells: [
          "",
          "",
          "Machine learning prediction, halftime machine learning",
          "Cross-bookmaker arbitrage, value betting",
          "Exchange market making (Betfair, Smarkets)",
        ],
      },
      {
        asset: "Predictions",
        color: "rose",
        cells: [
          "",
          "",
          "",
          "Cross-venue prediction arbitrage (Polymarket, Kalshi vs bookmakers)",
          "",
        ],
      },
    ],
  },
  {
    id: 9,
    type: "doctrine",
    title: "The Gap That Does Not Exist Here",
    subtitle:
      "On most platforms, backtesting and live trading are separate environments. On ours, they are the same.",
    points: [
      {
        problem: "Backtest environment uses different data feeds",
        solution: "Same data pipeline serves both backtest and live",
      },
      {
        problem: "Feature calculations diverge between research and production",
        solution: "Same feature calculations, same code, same outputs",
      },
      {
        problem: "Risk controls have to be reimplemented for live",
        solution: "Same risk controls carry through \u2014 nothing to rebuild",
      },
      {
        problem: "Months of engineering to promote a strategy",
        solution: "Configuration change. Not a rewrite.",
      },
    ],
    differentiators: [
      "When you validate something in research, you know it will behave the same way in production",
      "No translation layer, no rewrite, no months of engineering",
      "Your validation history, data history, and operational familiarity accumulate over time",
    ],
    conclusion:
      "The research-to-production handoff is a configuration change. That is the single most important thing about this platform.",
  },
  {
    id: 10,
    type: "doctrine",
    title: "Your Alpha Stays Yours",
    subtitle: "We do not need your edge. We have our own.",
    points: [
      {
        problem: "Data only \u2014 do you see my signals?",
        solution: "No. You get normalised feeds. We never see what you do with them.",
      },
      {
        problem: "Execution \u2014 do you see my strategy logic?",
        solution: "No. We route and fill. We do not know the logic behind your orders.",
      },
      {
        problem: "Full platform \u2014 could you copy my strategy?",
        solution:
          "We do not trade the same strategy you are running. We will never front-run you. Commercial terms are bespoke.",
      },
      {
        problem: "What if I leave?",
        solution:
          "If we built a bespoke strategy for you, the logic is yours. The switching cost is operational familiarity, not contractual lock-in.",
      },
    ],
    differentiators: [
      "Modular access \u2014 use data, research, or execution independently without exposing your edge",
      "No contractual lock-in \u2014 bespoke strategy logic is yours; switching cost is operational familiarity, not a contract",
      "22 microservices, 24,500+ automated tests \u2014 institutional-grade reliability before your first trade",
    ],
    conclusion: "The infrastructure is shared. The alpha is not. That is the design.",
  },
  {
    id: 11,
    type: "operations",
    title: "Why Not Build It Yourself?",
    columns: [
      {
        title: "If You Build",
        items: [
          "Integrate 80+ venues, each with different schemas",
          "Build normalised schema layer from scratch",
          "Build backtesting that actually matches production",
          "Build execution, monitoring, risk, compliance tools",
          "18\u201324 months before you can trade",
        ],
      },
      {
        title: "If You Use Our Platform",
        items: [
          "Venues already integrated and normalised",
          "Backtest to live on shared infrastructure",
          "Execution algorithms across all connected venues",
          "Monitoring, risk, reporting, and compliance included",
          "Live in weeks, not years",
        ],
      },
      {
        title: "What AI Cannot Replace",
        items: [
          "Decades of experience at large trading institutions \u2014 making money before Odum existed",
          "Knowing what a good fill looks like across venue microstructures",
          "Reconciling positions across chains when a bridge fails",
          "Debugging a drawdown under pressure at 3am",
          "Operational experience that compounds over years \u2014 you cannot prompt-engineer it",
        ],
      },
    ],
    callout:
      "We use AI heavily \u2014 and believe anyone should. But the system works because there are experienced humans, with decades at large trading institutions, making the critical decisions. AI accelerates the build. Experience is what makes it work.",
    metrics: [
      { value: "3", label: "Years Building" },
      { value: "80+", label: "Venues Integrated" },
      { value: "22", label: "Microservices" },
      { value: "24,500+", label: "Automated Tests" },
    ],
  },
  {
    id: 12,
    type: "traction",
    title: "Proof Points",
    achieved: [
      { text: "Our own capital", detail: "$7.5M under management, 30%+ annualised on crypto strategy (1 year track record), Bitcoin fund of funds (5 year track record)" },
      {
        text: "First platform client",
        detail: "$125K contract revenue (75% received), decentralised finance fund \u2014 3 strategies, 5\u201320% yields",
      },
      { text: "Growing revenue", detail: "Expected to reach $250K+ annual revenue with ongoing retainer" },
      { text: "FCA authorised", detail: "Ref 975797, one regulatory coverage client live" },
    ],
    inProgress: [
      { text: "Expanding strategy coverage", detail: "Machine learning, options, and sports strategies coming through" },
      { text: "Execution services", detail: "Memorandum of understanding with institutional counterparty" },
      { text: "Additional regulatory clients", detail: "3 in active conversation" },
    ],
    launchReady: [
      { text: "Full platform across 5 asset classes", detail: "Production-grade, 22 microservices, 24,500+ tests" },
      { text: "35 strategies, 5 families", detail: "Available for bespoke deployment" },
      {
        text: "9 execution algorithms",
        detail: "Time-weighted, volume-weighted, smart routing, optimal execution",
      },
      { text: "Client reporting and compliance", detail: "Executive dashboard, investment book of records" },
    ],
    checkpoint:
      "The platform you would be using is the same one running real capital and serving real clients today.",
  },
  {
    id: 13,
    type: "doctrine",
    title: "Commercial Terms",
    subtitle: "Annual contracts, scoped to what you need. Every engagement is bespoke.",
    points: [
      {
        problem: "How is it priced?",
        solution: "From $10K/month on an annual contract, scoped to the layers and asset classes you need. Includes ongoing platform updates, support, and compliance tooling.",
      },
      {
        problem: "How does that compare to building in-house?",
        solution: "An in-house team to build and operate equivalent infrastructure would be 5\u201310 engineers at $150K\u2013$250K each, plus 12\u201318 months before you can trade. Our platform gets you live in weeks at a fraction of the cost.",
      },
      {
        problem: "What about bespoke strategy builds?",
        solution: "Development fee plus an ongoing retainer or performance share, scoped to complexity. We build the strategies, you operate them. Terms are negotiated per engagement.",
      },
      {
        problem: "Can I start small and expand?",
        solution: "Yes. Start with data access or research and expand to execution, full platform, or bespoke builds over time. Same infrastructure throughout \u2014 expanding is adding access, not migrating.",
      },
    ],
    differentiators: [
      "12-month annual contracts \u2014 scoped to the layers and asset classes you actually need",
      "Data access within days of signing \u2014 research environment immediately after",
      "No minimum commitment to explore \u2014 trial the data and research layers first, expand when ready",
    ],
    conclusion: "We do not do off-the-shelf pricing because no two engagements are the same.",
  },
  {
    id: 14,
    type: "ask",
    title: "How to Start",
    subtitle:
      "Start with a scoping call to map your infrastructure gaps. Follow with a hands-on trial before committing to anything broader.",
    asks: [
      {
        title: "Scoping Call",
        items: [
          "Which asset classes and venues matter to you?",
          "What does your current infrastructure cover \u2014 and where are the gaps?",
          "Platform access or bespoke strategy development?",
          "We scope the engagement to exactly what you need",
        ],
      },
      {
        title: "Limited Trial",
        items: [
          "Hands-on trial on data and research layers \u2014 no commitment required",
          "See normalisation quality, coverage depth, and backtesting environment",
          "Evaluate the platform with your own use cases before expanding",
        ],
      },
      {
        title: "Go Live",
        items: [
          "Data access: days",
          "Research environment: days",
          "Execution integration: weeks",
          "Full platform or bespoke build: scoped per engagement",
        ],
      },
    ],
    contact: "ikenna@odum-research.com",
  },
  {
    id: 15,
    type: "demo",
    title: "See It Live",
    subtitle: "Click any section to navigate directly.",
    sections: [
      { name: "Dashboard", desc: "Platform overview \u2014 positions, returns, risk, alerts", link: "/dashboard" },
      {
        name: "Instruments & Coverage",
        desc: "12,000+ instruments across all asset classes",
        link: "/services/data/instruments",
      },
      {
        name: "Strategy Research",
        desc: "Backtests, strategy comparison, machine learning analysis",
        link: "/services/research/strategy/overview",
      },
      { name: "Trading & Positions", desc: "Live positions, orders, returns attribution", link: "/services/trading/positions" },
      {
        name: "Client Reporting",
        desc: "Executive dashboard, investment book of records",
        link: "/services/reports/executive",
      },
      { name: "Risk & Scenarios", desc: "Scenario analysis, stress testing, historical replay", link: "/services/observe/scenarios" },
    ],
    note: "All views use the same infrastructure we use for our own capital. Demo data is representative of production output.",
  },
];
