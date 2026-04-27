// DART Trading Infrastructure: data for the platform product deck.
// Marketing label: DART Trading Infrastructure (single engagement route on the public site).
// "DART" is retained as the legal/contract / service-category label per SERVICE_LABELS SSOT.
// Client-provided / Odum-provided / hybrid signals are capabilities WITHIN this single
// route: not separate top-level products.
// Last restructured: April 2026: reframed around three-route marketing model,
// named-competitor landscape, IP-protection boundary, and how-to-start.

export const slides = [
  // ══════════════════════════════════════════════════════════════
  // ACT I: HOW WE GOT HERE (one slide for platform buyers)
  // ══════════════════════════════════════════════════════════════

  // ── Slide 1: Cover ────────────────────────────────────────
  {
    id: 1,
    type: "cover",
    title: "DART Trading Infrastructure — Without The Build",
    subtitle:
      "DART: the same operating system we use for our own capital, available to you. One engagement route with a signal-capability spectrum: client-provided signals (you keep IP upstream), Odum-provided signals, or hybrid. Materially faster to start than the 18–24 months of a build-it-yourself cycle, where appropriate and subject to scope review.",
    tagline: "DART Trading Infrastructure Deck",
    stats: [
      { value: "5", label: "Asset Classes" },
      { value: "12,000+", label: "Instruments" },
      { value: "80+", label: "Venues" },
      { value: "$7.5M", label: "Our Own Capital" },
      { value: "Case-by-case", label: "Onboarding Timing" },
    ],
  },

  // ── Slide 2: Why This Is Hard To Buy ──────────────────────
  {
    id: 2,
    type: "doctrine",
    title: "Why This Is Hard To Buy",
    subtitle:
      "To replicate what DART provides, you would need to integrate 80+ venues across 5 asset classes, 28 DeFi protocols on 11 chains, 65+ sports data sources: each with different schemas, settlement logic, and connectivity. Most firms give up at the third asset class.",
    points: [
      {
        problem:
          "Backtest and live trading live in separate environments. Strategies look good in research and die in production.",
        solution:
          "Same code path, same data, same features, same risk controls. Promotion is a configuration change, not a rewrite.",
      },
      {
        problem: "Venue integration is a treadmill: schemas drift, endpoints change, rate limits surprise you.",
        solution: "One normalised schema across 80+ venues. Adding a venue benefits every strategy automatically.",
      },
      {
        problem: "Compliance and reporting are bolted on at the end, costing 6–12 months of rework to pass audit.",
        solution: "Compliance is a first-class layer: the same one we built for our own FCA-authorised operations.",
      },
      {
        problem:
          "Cross-asset is genuinely hard: crypto, TradFi, DeFi, sports, prediction each have incompatible assumptions.",
        solution:
          "One canonical ontology for instruments, venues, timeframes, strategy archetypes. Cross-domain questions become comparable.",
      },
    ],
    differentiators: [
      "Three years of compounding architectural decisions",
      "Team personally traded across TradFi, crypto, and sports before Odum",
      "Platform runs $7.5M of our own capital: this is not a prototype",
    ],
    conclusion: "You can build it. Or you can start materially faster, subject to scope review.",
  },

  // ══════════════════════════════════════════════════════════════
  // ACT II: THE MARKET PROBLEM
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
        gap: "TradFi data at $24K-$30K/user/year. Data only. No crypto depth, no DeFi, no sports, no prediction. No research environment, no execution, no managed money, no compliance wrapper.",
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
        gap: "Execution, OTC, lending: crypto-only. No research stack, no DeFi programmability, no cross-asset unification, no research-to-live path.",
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
        gap: "The reference architecture for cross-domain quant. Not a product. Even they do not unify crypto + DeFi + sports + prediction + TradFi in one stack: combinatory scope sits outside their mandate.",
        color: "emerald",
      },
    ],
    callout:
      "Odum is what you get when you take the institutional discipline of a top-tier quant firm and apply it to the full cross-domain spread: and then package it for external clients under a live FCA permission.",
  },

  // ══════════════════════════════════════════════════════════════
  // ACT III: THE DART SOLUTION
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

  // ── Slide 5: DART: Two Modes, One System ─────────────────
  {
    id: 5,
    type: "packaging",
    title: "DART Trading Infrastructure: One Route, Signal-Capability Spectrum",
    subtitle:
      "DART is a single engagement route with capability options depending on where your strategy IP sits: client-provided signals (IP upstream of Odum), Odum-provided signals, or hybrid. All capabilities run on the same infrastructure. Commercial terms scale with scope and are scoped per engagement.",
    services: [
      {
        name: "Client-Provided Signals (capability)",
        stages: ["Execution", "Governance"],
        model: "Fixed Tier-B access + per-signal or P&L share",
        desc: "You keep strategy IP upstream at your endpoint. DART receives structured instructions via the published schema and runs the pipe: execution, monitoring, reconciliation, reporting. We see the orders, not the reasoning. (Legal/contract label: DART Signals-In.)",
      },
      {
        name: "Odum-Provided / Hybrid Signals (capability)",
        stages: ["Instruments & Data", "Research", "Decision", "Execution", "Governance"],
        model: "Fixed access + metered research compute + IP-tier exclusivity",
        desc: "Research and promote on Odum infrastructure, or combine Odum-provided signals with your own. Feature engineering, ML pipelines, simulation, promotion, execution, reporting: all on the same stack. Bespoke strategy builds are a development fee plus retainer or performance share, available by separate agreement.",
      },
      {
        name: "Data + Research (entry)",
        stages: ["Instruments & Data", "Research"],
        model: "Subscription + compute credits",
        desc: "Start narrow. Normalised feeds across 5 asset classes plus a backtesting environment. Execute wherever you want, expand into the broader DART signal capabilities over time.",
      },
    ],
    note: "Every capability runs on the same underlying infrastructure. Expanding is adding access, not migrating systems.",
  },

  // ── Slide 6: What The Platform Covers ─────────────────────
  {
    id: 6,
    type: "breadth-matrix",
    title: "What The Platform Covers",
    subtitle:
      "Every cell runs on shared infrastructure. New venues benefit every strategy; new strategies benefit every client.",
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
    subtitle:
      "35 strategies across 5 asset classes. Bespoke builds combine any of these or create new ones within DART Trading Infrastructure (Odum-provided signal capability), available by separate agreement.",
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
        cells: ["", "", "ML directional (equities, futures, FX), momentum", "", "Deribit, CME options market making"],
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
        cells: ["", "", "", "Cross-venue prediction arbitrage (Polymarket, Kalshi vs bookmakers)", ""],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // ACT IV: PROOF
  // ══════════════════════════════════════════════════════════════

  // ── Slide 8: Your Alpha Stays Yours ───────────────────────
  {
    id: 8,
    type: "doctrine",
    title: "Your Alpha Stays Yours",
    subtitle:
      "DART is engineered so we cannot see your strategy logic when you run client-provided signals. When Odum-provided / hybrid signals are used, separation is contractual and technical. Here is the boundary by layer.",
    points: [
      {
        problem: "Client-provided signals capability: can you see my strategy logic?",
        solution:
          "No. You send structured instructions: instrument, side, size, constraints. Signal generation stays upstream at your endpoint. We see the orders, not the reasoning behind them.",
      },
      {
        problem: "Odum-provided / hybrid signal capability: can you see the code I develop?",
        solution:
          "Yes: you are building on our infrastructure. We partition your tenant, we do not trade the same strategy, and we will not front-run you. Contractual non-compete on bespoke territory.",
      },
      {
        problem: "Data only: can you see what I do with the feeds?",
        solution: "No. You get normalised feeds. We never see the strategies you build on top.",
      },
      {
        problem: "What if I leave?",
        solution:
          "With client-provided signals: your strategy was never with us. With Odum-provided / hybrid: bespoke logic is yours to take. Switching cost is operational familiarity, not contractual lock-in.",
      },
    ],
    differentiators: [
      "Tenant-level partitioning: no cross-tenant data access",
      "HMAC-signed payload envelopes on client-provided signal flows",
      "Written non-compete on bespoke strategy territory",
    ],
    conclusion:
      "The infrastructure is shared. The alpha is not. That is the design, enforced at the contract and the code.",
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
        solution: "Same risk controls carry through from research to live: nothing to rebuild.",
      },
      {
        problem: "Months of engineering to promote a strategy.",
        solution: "A configuration change. Not a rewrite.",
      },
    ],
    differentiators: [
      "Validation history, data history, operational familiarity accumulate: not reset",
      "A strategy that passes backtest behaves the same way in production",
      "Shard-level failure isolation: one venue outage does not cascade to others",
    ],
    conclusion: "Promotion is a configuration change. That continuity is what makes the platform difficult to leave.",
  },

  // ── Slide 10: Why Not Build / AI-Build It Yourself ────────
  {
    id: 10,
    type: "operations",
    title: "Why Not Build: Or AI-Build: It Yourself",
    columns: [
      {
        title: "If You Build",
        items: [
          "Integrate 80+ venues with different schemas",
          "Build a normalised contracts-first schema layer",
          "Build backtesting that actually matches production",
          "Build execution, monitoring, risk, compliance tooling",
          "18-24 months before you can trade: then operate it",
        ],
      },
      {
        title: "If You Use DART",
        items: [
          "Venues already integrated and normalised",
          "Backtest to live on shared infrastructure",
          "Execution algorithms across all connected venues",
          "Monitoring, risk, reporting, compliance included",
          "Materially faster to start than a build-it-yourself cycle, subject to scope review: then scale",
        ],
      },
      {
        title: "What AI Cannot Replace",
        items: [
          "Decades of desk experience: personally traded each asset class",
          "Knowing what a good fill looks like across venue microstructures",
          "Reconciling positions across chains when a bridge fails",
          "Debugging a drawdown under pressure at 3am",
          "Operational experience compounds over years: not prompt-engineered",
        ],
      },
    ],
    callout:
      "We use AI heavily in development and operations: and believe anyone should. But the system works because there are experienced humans making the critical decisions. AI accelerates the build. Experience is what makes it work.",
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
      {
        text: "Our own capital: $7.5M AUM",
        detail:
          "30%+ annualised on crypto mean reversion (1-year track record). Bitcoin fund of funds (5-year track record).",
      },
      {
        text: "First DART client: Elysium DeFi",
        detail: "$125K signed, growing to $250K+ annual. Three strategies at 5-20% yield.",
      },
      {
        text: "First Regulated Operating Models client",
        detail:
          "Combines a regulated-operating-model engagement with DART Trading Infrastructure (client-provided signals capability) for perp-funding arb. Live. (Legal/contract label: Regulatory Umbrella + DART Signals-In.)",
      },
      { text: "FCA authorised", detail: "Ref 975797, January 2023. Dealing, arranging, advising, managing." },
    ],
    inProgress: [
      { text: "Expanding strategy coverage", detail: "ML, options, sports strategies coming through." },
      {
        text: "DART Trading Infrastructure — Odum-provided signal counterparties",
        detail: "Two contracted, live Sept 2026 at ~$5K/mo combined. (Legal/contract label: Odum Signals.)",
      },
      { text: "Additional regulatory clients", detail: "Three in active conversation, scope fit on the 4-axis model." },
    ],
    launchReady: [
      { text: "Full platform across 5 asset classes", detail: "Production-grade, 22 microservices, 24,500+ tests." },
      {
        text: "35 strategies, 5 families",
        detail: "Available for DART Trading Infrastructure bespoke deployment by separate agreement.",
      },
      { text: "9 execution algorithms", detail: "TWAP, VWAP, smart routing, Arrival-Price, IS, plus venue-specific." },
      {
        text: "Client reporting & compliance",
        detail: "Executive dashboard, IBOR, reconciliation, best-execution evidence.",
      },
    ],
    checkpoint: "The platform you would be using is the same one running real capital and serving real clients today.",
  },

  // ══════════════════════════════════════════════════════════════
  // ACT V: FORWARD
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
        solution:
          "From $10K/month on an annual contract, scoped to the layers and asset classes you need. Includes ongoing platform updates, support, and compliance tooling.",
      },
      {
        problem: "How does that compare to building in-house?",
        solution:
          "An in-house team to build and operate equivalent infrastructure is 5-10 engineers at $150K-$250K each, plus 12-18 months before you can trade. DART is materially faster to start, subject to scope review, at a fraction of the cost.",
      },
      {
        problem: "What about bespoke strategy builds?",
        solution:
          "Development fee plus ongoing retainer or performance share, scoped to complexity. We build the strategies; you operate them. Non-compete on bespoke territory.",
      },
      {
        problem: "Can I start small and expand?",
        solution:
          "Yes. Start with data or research access and expand to execution, full platform, or bespoke builds. Same infrastructure throughout: expanding is adding access, not migrating.",
      },
    ],
    differentiators: [
      "12-month annual contracts: first conversation is always about scope",
      "Looking at live data shortly after signing, subject to scope review",
      "First platform client already live and growing",
    ],
    conclusion: "No off-the-shelf pricing because no two engagements are the same.",
  },

  // ══════════════════════════════════════════════════════════════
  // ACT VI: CLOSE
  // ══════════════════════════════════════════════════════════════

  // ── Slide 13: How To Start ────────────────────────────────
  {
    id: 13,
    type: "ask",
    title: "How To Start",
    subtitle:
      "Builder route through DART Trading Infrastructure. The funnel matches the public flow: light questionnaire, briefings, fit call, depth Strategy Evaluation, tailored Strategy Review, walkthrough, Commercial Tailoring, signup. /start-your-review is the prospect entry; /contact is the advisor / partnership introduction.",
    asks: [
      {
        title: "Step 1. Read the DART briefing",
        items: [
          "Submit the light questionnaire at /questionnaire to unlock the briefings hub on this device, or use the shared access code odum-briefings-2026",
          "Read /briefings/dart-trading-infrastructure (Signals-In, Full pipeline, Odum-provided signals; backtest-vs-live T+1 differentiator)",
          "Forward to engineering / trading colleagues; the same access code works for them",
        ],
      },
      {
        title: "Step 2. Initial fit call",
        items: [
          "15-minute Calendly via /contact (or /start-your-review for prospect-style enquiries)",
          "Confirm asset classes, current infrastructure, gaps (data, research, execution, monitoring)",
          "Decide which DART shape fits: Signals-In (your alpha, our execution), Full (research-to-execution on one stack), or Odum-provided signals (selected counterparty)",
        ],
      },
      {
        title: "Step 3. Strategy Evaluation + Review",
        items: [
          "Submit the Path B builder wizard at /strategy-evaluation (eight-step DDQ: methodology, performance evidence, venue / instrument scope, regulatory wrapper sub-checkbox)",
          "Upload backtests, audit trails, mandate or compliance docs at your own pace",
          "We issue a per-prospect Strategy Review by magic link (tailored pre-demo prep). Builder emphasis covers proposed DART shape, briefing excerpts, workflows in scope, curated examples filtered against your seed, route-specific risks",
        ],
      },
      {
        title: "Step 4. Walkthrough, tailoring, onboard",
        items: [
          "Operator-led platform walkthrough: research, trading, execution, observe, reports modules scoped to your evaluation answers (demo / UAT mode)",
          "Commercial Tailoring: venue packs, chain packs, instrument-type packs, contract scope, twelve-month minimum",
          "Signup, scoped venue API key issuance, paper-trading promotion ladder, live-tiny, live-allocated",
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
    subtitle:
      "Click any card to open the live platform in demo mode. Representative fills, positions, and P&L against a demo persona; never real client capital.",
    previewLink: "/dashboard",
    sections: [
      {
        name: "DART Trading Infrastructure (public)",
        desc: "DART overview: one route, signal-capability spectrum",
        link: "/platform",
      },
      {
        name: "Light Questionnaire",
        desc: "Two-minute intake. Submit unlocks the briefings hub on this device and emails the access code",
        link: "/questionnaire",
      },
      {
        name: "DART Briefing",
        desc: "Capability-by-capability walk-through (access code: odum-briefings-2026)",
        link: "/briefings/dart-trading-infrastructure",
      },
      {
        name: "Strategy Evaluation",
        desc: "Path B builder wizard (eight-step DDQ). The depth gate before we issue a tailored Strategy Review",
        link: "/strategy-evaluation",
      },
      { name: "Dashboard (demo)", desc: "Positions, returns, risk, alerts (demo persona)", link: "/dashboard" },
      {
        name: "Instruments & Coverage",
        desc: "12,000+ instruments across 5 asset classes",
        link: "/services/data/instruments",
      },
      {
        name: "Strategy Research",
        desc: "Backtests, comparison, ML analysis",
        link: "/services/research/strategy/overview",
      },
      { name: "Trading & Positions", desc: "Live positions, orders, attribution", link: "/services/trading/positions" },
      { name: "Executive Reporting", desc: "IBOR, reconciliation, performance", link: "/services/reports/executive" },
    ],
    note: "Platform links require sign-in (investor@odum-research.com / OdumIR2026!). Public-site links open in a new tab; no sign-in required. Strategy Review is a per-prospect magic-link surface (admin-issued after the depth Strategy Evaluation) and is not in this list.",
  },
];
