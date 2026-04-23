// Trading Platform as a Service \u2014 data for 14-slide DART product deck.
// Last restructured: April 2026 \u2014 reframed around DART two-mode split,
// named-competitor landscape, IP-protection boundary, and how-to-start.

export const slides = [
  // ══════════════════════════════════════════════════════════════
  // ACT I \u2014 HOW WE GOT HERE (one slide for platform buyers)
  // ══════════════════════════════════════════════════════════════

  // ── Slide 1: Cover ────────────────────────────────────────
  {
    id: 1,
    type: "cover",
    title: "Trading Infrastructure Without The Build",
    subtitle:
      "DART \u2014 the same operating system we use for our own capital, available to you. Two modes: Signals-In keeps your strategy IP upstream; Full Pipeline gives you research and promote on Odum infrastructure. Live in weeks, not the 18–24 months of a build-it-yourself cycle.",
    tagline: "DART Product Deck",
    stats: [
      { value: "5", label: "Asset Classes" },
      { value: "12,000+", label: "Instruments" },
      { value: "80+", label: "Venues" },
      { value: "$7.5M", label: "Our Own Capital" },
      { value: "Weeks", label: "To Go Live" },
    ],
  },

  // ── Slide 2: Why This Is Hard To Buy ──────────────────────
  {
    id: 2,
    type: "doctrine",
    title: "Why This Is Hard To Buy",
    subtitle:
      "To replicate what DART provides, you would need to integrate 80+ venues across 5 asset classes, 28 DeFi protocols on 11 chains, 65+ sports data sources \u2014 each with different schemas, settlement logic, and connectivity. Most firms give up at the third asset class.",
    points: [
      {
        problem: "Backtest and live trading live in separate environments. Strategies look good in research and die in production.",
        solution: "Same code path, same data, same features, same risk controls. Promotion is a configuration change, not a rewrite.",
      },
      {
        problem: "Venue integration is a treadmill \u2014 schemas drift, endpoints change, rate limits surprise you.",
        solution: "One normalised schema across 80+ venues. Adding a venue benefits every strategy automatically.",
      },
      {
        problem: "Compliance and reporting are bolted on at the end, costing 6–12 months of rework to pass audit.",
        solution: "Compliance is a first-class layer \u2014 the same one we built for our own FCA-authorised operations.",
      },
      {
        problem: "Cross-asset is genuinely hard \u2014 crypto, TradFi, DeFi, sports, prediction each have incompatible assumptions.",
        solution: "One canonical ontology for instruments, venues, timeframes, strategy archetypes. Cross-domain questions become comparable.",
      },
    ],
    differentiators: [
      "Three years of compounding architectural decisions",
      "Team personally traded across TradFi, crypto, and sports before Odum",
      "Platform runs $7.5M of our own capital \u2014 this is not a prototype",
    ],
    conclusion: "You can build it. Or you can start trading in weeks.",
  },

  // ══════════════════════════════════════════════════════════════
  // ACT II \u2014 THE MARKET PROBLEM
  // ══════════════════════════════════════════════════════════════

  // ── Slide 3: What Other Vendors Give You ──────────────────
  {
    id: 3,
    type: "moat",
    title: "What Other Vendors Give You",
    subtitle:
      "If you have tried to buy this before, you have looked at some of the below. Each solves ~15% of the pipeline in one domain. None stitch it together end-to-end.",
    gaps: [
      {
        competitor: "Bloomberg / Refinitiv",
        users: "TradFi desks",
        gap: "World-class TradFi data at $24K\u2013$30K/user/year. Data only. No crypto depth, no DeFi, no sports, no prediction. No research environment, no execution, no managed money, no compliance wrapper.",
        color: "cyan",
      },
      {
        competitor: "QuantConnect",
        users: "Retail → quant funds",
        gap: "Cloud backtest engine with TradFi + crypto coverage. Execution against select venues only. No alternative asset classes, no managed-capital layer, no FCA cover, no cross-domain unification.",
        color: "violet",
      },
      {
        competitor: "Deltix (EPAM) — QuantOffice + CryptoCortex",
        users: "Institutional quant + sell-side",
        gap: "Serious research-to-execution stack (TimeBase, QuantOffice, TradeHub, CryptoCortex) across TradFi + crypto. 15 years of product. Separate research and execution environments — not one code path from backtest to live. No DeFi programmability, no sports, no prediction. Licensed software, not a regulated operating layer.",
        color: "emerald",
      },
      {
        competitor: "Talos",
        users: "Institutional digital-asset",
        gap: "Strong institutional crypto execution + operations lifecycle. Crypto-only. No TradFi, no DeFi on-chain programmability, no sports, no prediction. Execution-layer specialist, not a cross-domain research + execution + reporting operating system.",
        color: "emerald",
      },
      {
        competitor: "Hummingbot / 3Commas / Cryptohopper",
        users: "Crypto retail/prosumer",
        gap: "Open-source market-making bots and strategy templates. Crypto-only. No TradFi, no DeFi programmability, no research pipeline, no institutional reporting, no regulation.",
        color: "amber",
      },
      {
        competitor: "Tardis / Kaiko / Amberdata",
        users: "Crypto data",
        gap: "High-quality crypto tick and L2. Data only. No TradFi parity, no sports, no prediction. Does not touch research, execution, compliance, or reporting.",
        color: "amber",
      },
      {
        competitor: "FlexTrade / Eze / Aladdin Execution",
        users: "TradFi institutional OMS/EMS",
        gap: "Mature venue connectivity for equities / futures / FX. Built-in research is thin. No crypto, no DeFi, no sports, no prediction. No managed-capital or regulatory-cover layer.",
        color: "cyan",
      },
      {
        competitor: "FalconX / Galaxy / Wintermute OTC",
        users: "Crypto prime brokers",
        gap: "Execution, OTC, lending \u2014 crypto-only. No research stack, no DeFi programmability, no cross-asset unification, no research-to-live path.",
        color: "emerald",
      },
      {
        competitor: "Interactive Brokers",
        users: "Retail + institutional broker",
        gap: "Broad TradFi coverage and thin crypto. Reliable executor. No research platform, no backtest-to-live, no DeFi, no sports, no prediction, no cover-as-a-service.",
        color: "violet",
      },
      {
        competitor: "Citadel / Jane Street / Two Sigma (internal)",
        users: "Not for sale",
        gap: "The reference architecture for cross-domain quant. Not a product. Even they do not unify crypto + DeFi + sports + prediction + TradFi in one stack \u2014 combinatory scope sits outside their mandate.",
        color: "emerald",
      },
    ],
    callout:
      "Odum is what you get when you take the institutional discipline of a top-tier quant firm and apply it to the full cross-domain spread \u2014 and then package it for external clients under a live FCA permission.",
  },

  // ══════════════════════════════════════════════════════════════
  // ACT III \u2014 THE DART SOLUTION
  // ══════════════════════════════════════════════════════════════

  // ── Slide 4: One Platform, Your Scope ─────────────────────
  {
    id: 4,
    type: "lifecycle-new",
    title: "One Platform, Your Scope",
    subtitle:
      "The same system that runs our $7.5M and our paying clients. Enter at any layer; expand over time. The only seam between research and live is whether a fill comes from a matching engine or a real venue.",
    stages: [
      { name: "Instruments & Data", desc: "Discover, normalise, validate" },
      { name: "Research & Modelling", desc: "Features, ML, simulate" },
      { name: "Decision & Strategy", desc: "Signals, sizing, risk" },
      { name: "Execution & Control", desc: "Route, fill, monitor" },
      { name: "Governance & Reporting", desc: "Audit, comply, report" },
    ],
  },

  // ── Slide 5: DART \u2014 Two Modes, One System ─────────────────
  {
    id: 5,
    type: "packaging",
    title: "DART \u2014 Two Modes, One System",
    subtitle:
      "DART splits into two engagement modes depending on whether your strategy IP sits upstream of Odum or is developed on the platform. Both run on the same infrastructure. Commercial terms scale with scope.",
    services: [
      {
        name: "DART Signals-In",
        stages: ["Execution", "Governance"],
        model: "Fixed Tier-B access + per-signal or P&L share",
        desc: "You keep strategy IP upstream at your endpoint. DART receives structured instructions via the published schema and runs the pipe \u2014 execution, monitoring, reconciliation, reporting. We see the orders, not the reasoning.",
      },
      {
        name: "DART Full Pipeline",
        stages: ["Instruments & Data", "Research", "Decision", "Execution", "Governance"],
        model: "Fixed access + metered research compute + IP-tier exclusivity",
        desc: "Research and promote on Odum infrastructure. Feature engineering, ML pipelines, simulation, promotion, execution, reporting \u2014 all on the same stack. Bespoke strategy builds are a development fee plus retainer or performance share.",
      },
      {
        name: "Data + Research (entry)",
        stages: ["Instruments & Data", "Research"],
        model: "Subscription + compute credits",
        desc: "Start narrow. Normalised feeds across 5 asset classes plus a backtesting environment. Execute wherever you want, expand into DART Signals-In or Full over time.",
      },
    ],
    note: "Every mode uses the same underlying infrastructure. Expanding is adding access, not migrating systems.",
  },

  // ── Slide 6: What The Platform Covers ─────────────────────
  {
    id: 6,
    type: "breadth-matrix",
    title: "What The Platform Covers",
    subtitle: "Every cell runs on shared infrastructure. New venues benefit every strategy; new strategies benefit every client.",
    columns: ["Instruments", "Data", "Research", "Execution", "Monitoring"],
    rows: [
      {
        asset: "Traditional Finance",
        color: "cyan",
        cells: [
          "CME, ICE, CBOE, NASDAQ, NYSE",
          "Tick, orderbook, candles",
          "Futures, options, equities",
          "TWAP, VWAP, smart routing, Arrival-Price, IS",
          "Returns, risk, reconciliation",
        ],
      },
      {
        asset: "Centralised Crypto",
        color: "green",
        cells: [
          "Binance, OKX, Bybit, Deribit +4",
          "Tick, L2, liquidations, funding",
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
          "Uniswap, Aave, Morpho, Curve, Lido",
          "On-chain position tracking",
        ],
      },
      {
        asset: "Sports",
        color: "amber",
        cells: [
          "102 leagues, 40K+ fixtures/yr",
          "Odds from 65+ sources",
          "ML prediction pipeline",
          "Cross-bookmaker routing",
          "Settlement reconciliation",
        ],
      },
      {
        asset: "Prediction Markets",
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

  // ── Slide 7: Strategies Available ─────────────────────────
  {
    id: 7,
    type: "breadth-matrix",
    title: "Strategies Available On The Platform",
    subtitle: "35 strategies across 5 asset classes. Bespoke builds combine any of these or create new ones under a DART Full engagement.",
    columns: ["Yield / Lending", "Basis / Carry", "Directional / Momentum", "Arbitrage", "Market Making"],
    rows: [
      {
        asset: "Decentralised Finance",
        color: "violet",
        cells: [
          "Aave, Ethena benchmark, multi-chain, Kamino (Solana), Bitcoin lending",
          "Ethereum basis, staked basis, recursive staked, Drift (Solana), Bitcoin basis, L2 basis",
          "",
          "Cross-chain yield arb, cross-chain rebalancing",
          "Uniswap V3 concentrated LP, Raydium/Orca concentrated LP",
        ],
      },
      {
        asset: "Centralised Crypto",
        color: "green",
        cells: [
          "",
          "",
          "Momentum, mean reversion",
          "Cross-exchange arb, statistical arb",
          "Binance, Deribit market making",
        ],
      },
      {
        asset: "Traditional Finance",
        color: "cyan",
        cells: [
          "",
          "",
          "ML directional (equities, futures, FX), momentum",
          "",
          "Deribit, CME options market making",
        ],
      },
      {
        asset: "Sports",
        color: "amber",
        cells: [
          "",
          "",
          "ML prediction, halftime ML",
          "Cross-bookmaker arbitrage, value betting",
          "Betfair, Smarkets exchange market making",
        ],
      },
      {
        asset: "Prediction Markets",
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

  // ══════════════════════════════════════════════════════════════
  // ACT IV \u2014 PROOF
  // ══════════════════════════════════════════════════════════════

  // ── Slide 8: Your Alpha Stays Yours ───────────────────────
  {
    id: 8,
    type: "doctrine",
    title: "Your Alpha Stays Yours",
    subtitle:
      "DART is engineered so we cannot see your strategy logic on Signals-In. On Full, separation is contractual and technical. Here is the boundary by layer.",
    points: [
      {
        problem: "Signals-In \u2014 can you see my strategy logic?",
        solution: "No. You send structured instructions \u2014 instrument, side, size, constraints. Signal generation stays upstream at your endpoint. We see the orders, not the reasoning behind them.",
      },
      {
        problem: "Full Pipeline \u2014 can you see the code I develop?",
        solution: "Yes \u2014 you are building on our infrastructure. We partition your tenant, we do not trade the same strategy, and we will not front-run you. Contractual non-compete on bespoke territory.",
      },
      {
        problem: "Data only \u2014 can you see what I do with the feeds?",
        solution: "No. You get normalised feeds. We never see the strategies you build on top.",
      },
      {
        problem: "What if I leave?",
        solution: "Signals-In: your strategy was never with us. Full: bespoke logic is yours to take. Switching cost is operational familiarity, not contractual lock-in.",
      },
    ],
    differentiators: [
      "Tenant-level partitioning \u2014 no cross-tenant data access",
      "HMAC-signed payload envelopes on Signals-In",
      "Written non-compete on bespoke strategy territory",
    ],
    conclusion: "The infrastructure is shared. The alpha is not. That is the design, enforced at the contract and the code.",
  },

  // ── Slide 9: The Research-To-Live Gap That Does Not Exist Here ──
  {
    id: 9,
    type: "doctrine",
    title: "The Research-To-Live Gap That Does Not Exist Here",
    subtitle:
      "On most platforms, backtest and live are separate. On DART, they are one. This is the single most important thing about the platform.",
    points: [
      {
        problem: "Backtest environment uses different data feeds from production.",
        solution: "Same data pipeline serves both. A historical replay calls the same code path as a live stream.",
      },
      {
        problem: "Feature calculations diverge between research and production.",
        solution: "Same feature calculations, same outputs. No translation layer.",
      },
      {
        problem: "Risk controls are reimplemented for live.",
        solution: "Same risk controls carry through from research to live \u2014 nothing to rebuild.",
      },
      {
        problem: "Months of engineering to promote a strategy.",
        solution: "A configuration change. Not a rewrite.",
      },
    ],
    differentiators: [
      "Validation history, data history, operational familiarity accumulate \u2014 not reset",
      "A strategy that passes backtest behaves the same way in production",
      "Shard-level failure isolation \u2014 one venue outage does not cascade to others",
    ],
    conclusion: "Promotion is a configuration change. That continuity is what makes the platform difficult to leave.",
  },

  // ── Slide 10: Why Not Build / AI-Build It Yourself ────────
  {
    id: 10,
    type: "operations",
    title: "Why Not Build \u2014 Or AI-Build \u2014 It Yourself",
    columns: [
      {
        title: "If You Build",
        items: [
          "Integrate 80+ venues with different schemas",
          "Build a normalised contracts-first schema layer",
          "Build backtesting that actually matches production",
          "Build execution, monitoring, risk, compliance tooling",
          "18\u201324 months before you can trade \u2014 then operate it",
        ],
      },
      {
        title: "If You Use DART",
        items: [
          "Venues already integrated and normalised",
          "Backtest to live on shared infrastructure",
          "Execution algorithms across all connected venues",
          "Monitoring, risk, reporting, compliance included",
          "Live in weeks \u2014 then scale",
        ],
      },
      {
        title: "What AI Cannot Replace",
        items: [
          "Decades of desk experience \u2014 personally traded each asset class",
          "Knowing what a good fill looks like across venue microstructures",
          "Reconciling positions across chains when a bridge fails",
          "Debugging a drawdown under pressure at 3am",
          "Operational experience compounds over years \u2014 not prompt-engineered",
        ],
      },
    ],
    callout:
      "We use AI heavily in development and operations \u2014 and believe anyone should. But the system works because there are experienced humans making the critical decisions. AI accelerates the build. Experience is what makes it work.",
    metrics: [
      { value: "3", label: "Years Building" },
      { value: "80+", label: "Venues Integrated" },
      { value: "22", label: "Microservices" },
      { value: "24,500+", label: "Automated Tests" },
    ],
  },

  // ── Slide 11: Proof Points ────────────────────────────────
  {
    id: 11,
    type: "traction",
    title: "Proof Points",
    achieved: [
      { text: "Our own capital \u2014 $7.5M AUM", detail: "30%+ annualised on crypto mean reversion (1-year track record). Bitcoin fund of funds (5-year track record)." },
      { text: "First DART client \u2014 Elysium DeFi", detail: "$125K signed, growing to $250K+ annual. Three strategies at 5\u201320% yield." },
      { text: "First Regulatory Umbrella client \u2014 Desmond", detail: "Reg Umbrella + DART Signals-In (perp-funding arb). Live." },
      { text: "FCA authorised", detail: "Ref 975797, January 2023. Dealing, arranging, advising, managing." },
    ],
    inProgress: [
      { text: "Expanding strategy coverage", detail: "ML, options, sports strategies coming through." },
      { text: "Odum Signals counterparties", detail: "Two contracted, live Sept 2026 at ~$5K/mo combined." },
      { text: "Additional regulatory clients", detail: "Three in active conversation, scope fit on the 4-axis model." },
    ],
    launchReady: [
      { text: "Full platform across 5 asset classes", detail: "Production-grade, 22 microservices, 24,500+ tests." },
      { text: "35 strategies, 5 families", detail: "Available for DART Full bespoke deployment." },
      { text: "9 execution algorithms", detail: "TWAP, VWAP, smart routing, Arrival-Price, IS, plus venue-specific." },
      { text: "Client reporting & compliance", detail: "Executive dashboard, IBOR, reconciliation, best-execution evidence." },
    ],
    checkpoint: "The platform you would be using is the same one running real capital and serving real clients today.",
  },

  // ══════════════════════════════════════════════════════════════
  // ACT V \u2014 FORWARD
  // ══════════════════════════════════════════════════════════════

  // ── Slide 12: Commercial Model ────────────────────────────
  {
    id: 12,
    type: "doctrine",
    title: "Commercial Model",
    subtitle: "Annual contracts, scoped to what you need. Every engagement is bespoke. Starting points below.",
    points: [
      {
        problem: "How is it priced?",
        solution: "From $10K/month on an annual contract, scoped to the layers and asset classes you need. Includes ongoing platform updates, support, and compliance tooling.",
      },
      {
        problem: "How does that compare to building in-house?",
        solution: "An in-house team to build and operate equivalent infrastructure is 5\u201310 engineers at $150K\u2013$250K each, plus 12\u201318 months before you can trade. DART gets you live in weeks at a fraction of the cost.",
      },
      {
        problem: "What about bespoke strategy builds?",
        solution: "Development fee plus ongoing retainer or performance share, scoped to complexity. We build the strategies; you operate them. Non-compete on bespoke territory.",
      },
      {
        problem: "Can I start small and expand?",
        solution: "Yes. Start with data or research access and expand to execution, full platform, or bespoke builds. Same infrastructure throughout \u2014 expanding is adding access, not migrating.",
      },
    ],
    differentiators: [
      "12-month annual contracts \u2014 first conversation is always about scope",
      "Looking at live data within days of signing",
      "First platform client already live and growing",
    ],
    conclusion: "No off-the-shelf pricing because no two engagements are the same.",
  },

  // ══════════════════════════════════════════════════════════════
  // ACT VI \u2014 CLOSE
  // ══════════════════════════════════════════════════════════════

  // ── Slide 13: How To Start ────────────────────────────────
  {
    id: 13,
    type: "ask",
    title: "How To Start",
    subtitle: "The next step is a scoping conversation \u2014 asset classes, current setup, gaps, whether Signals-In or Full fits your operating model.",
    asks: [
      {
        title: "Scoping Conversation",
        items: [
          "Which asset classes are you focused on?",
          "What does your current infrastructure look like?",
          "Where are the gaps \u2014 data, research, execution, monitoring?",
          "Signals-In (keep IP upstream) or Full Pipeline (build on Odum)?",
        ],
      },
      {
        title: "Trial Period",
        items: [
          "Set up a trial on data and research layers",
          "See the normalisation quality, coverage, and backtesting environment",
          "Evaluate before committing to anything broader",
          "No commitment to explore",
        ],
      },
      {
        title: "Timeline",
        items: [
          "Data access: days",
          "Research environment: days",
          "Execution integration: weeks",
          "Full platform or bespoke: scoped per engagement",
        ],
      },
    ],
    contact: "ikenna@odum-research.com",
  },

  // ── Slide 14: See It Live ─────────────────────────────────
  {
    id: 14,
    type: "demo",
    title: "See It Live",
    subtitle: "Click any card to open the live platform in demo mode. Representative fills, positions, and P&L against a demo persona \u2014 never real client capital.",
    previewLink: "/dashboard",
    sections: [
      { name: "Platform (public)", desc: "DART overview \u2014 how the two modes fit together", link: "/platform" },
      { name: "DART \u2014 Start Here", desc: "Briefing that routes to the right path (code: odum-briefings-2026)", link: "/briefings/platform" },
      { name: "DART Signals-In briefing", desc: "Keep IP upstream \u2014 send instructions, we run the pipe", link: "/briefings/dart-signals-in" },
      { name: "DART Full briefing", desc: "Research + promote on Odum infrastructure", link: "/briefings/dart-full" },
      { name: "Dashboard (demo)", desc: "Positions, returns, risk, alerts \u2014 demo persona", link: "/dashboard" },
      { name: "Instruments & Coverage", desc: "12,000+ instruments across 5 asset classes", link: "/services/data/instruments" },
      { name: "Strategy Research", desc: "Backtests, comparison, ML analysis", link: "/services/research/strategy/overview" },
      { name: "Trading & Positions", desc: "Live positions, orders, attribution", link: "/services/trading/positions" },
      { name: "Executive Reporting", desc: "IBOR, reconciliation, performance", link: "/services/reports/executive" },
    ],
    note: "Platform links require sign-in (investor@odum-research.com / OdumIR2026!). Public-site links open in a new tab; no sign-in required.",
  },
];
