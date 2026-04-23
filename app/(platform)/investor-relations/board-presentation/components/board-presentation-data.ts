// Board Presentation \u2014 data for 15-slide strategic advisor deck.
// Last restructured: April 2026 \u2014 reframed around four commercial paths,
// named-competitor landscape, founder narrative, and structured context-to-ask progression.

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


// Slide data \u2014 arc: (I) how we got here  (II) the market problem
// (III) the Odum solution  (IV) proof  (V) forward  (VI) close.
export const slides = [
  // ══════════════════════════════════════════════════════════════
  // ACT I \u2014 HOW WE GOT HERE
  // ══════════════════════════════════════════════════════════════

  // ── Slide 1: Cover ────────────────────────────────────────
  {
    id: 1,
    type: "cover",
    title: "Unified Cross-Asset Trading System Across the Full Trading Lifecycle",
    subtitle:
      "Four commercial paths, five asset groups, one code path. Built by traders who ran desks at leading prop-trading firms. Running our own capital at $7.5M through the same infrastructure we sell.",
    tagline: "Strategic Advisor Deck",
    stats: [
      { value: "5", label: "Asset Classes" },
      { value: "12,000+", label: "Live Instruments" },
      { value: "$7.5M", label: "Under Management" },
      { value: "4", label: "Commercial Paths" },
      { value: "Jan '23", label: "FCA Authorised" },
      { value: "15", label: "Clients Acquired" },
    ],
  },

  // ── Slide 2: The Founder Story (one slide) ────────────────
  {
    id: 2,
    type: "doctrine",
    title: "How Odum Came To Be",
    subtitle:
      "In 2021 we were running high-frequency cross-exchange arbitrage in crypto. The edges compressed. The only way to stay competitive was to iterate on strategy faster than the market iterated on us. That shaped Odum.",
    points: [
      {
        problem:
          "Needed a top-down view across the full universe \u2014 crypto, TradFi, DeFi, sports, predictions \u2014 to decide where to spend research time.",
        solution:
          "Built one canonical ontology for instruments, venues, timeframes, and strategy archetypes. Every domain normalised to the same schema.",
      },
      {
        problem:
          "Went looking for the stack instead of the strategy. Bloomberg, Tardis, QuantConnect, Hummingbot \u2014 each solved ~15% of the pipeline.",
        solution:
          "Realised the stack we needed did not exist. Even Citadel, Jane Street, Two Sigma do not unify crypto + DeFi + sports + prediction + TradFi \u2014 and they do not sell it.",
      },
      {
        problem:
          "On most platforms, backtest-to-live is a rewrite. Strategies that look good in research die on contact with production — or pass clean-history replay but fail the moment market structure breaks.",
        solution:
          "One code path from simulation to live — promotion is a config change, not a rewrite. Simulation injects synthetic stress: execution delays, order failures, gap moves, data outages, forced liquidations. Risk is tested against adversarial conditions, not just favourable history.",
      },
      {
        problem:
          "Regulatory infrastructure is expensive, slow, and bolted on. An 18–24 month FCA cycle for anyone who wants to operate.",
        solution:
          "FCA 975797 since January 2023. Same platform now hosts clients under our permissions \u2014 operational in weeks, not years.",
      },
    ],
    differentiators: [
      "Team ran trading desks at leading proprietary firms before Odum",
      "Same infrastructure runs internal capital and external clients",
      "Platform is already commercial \u2014 first paying DART and Regulatory Umbrella clients live",
    ],
    conclusion:
      "Odum is what we could not find in 2021 — built properly, with the architectural discipline of a top-tier firm applied to the full cross-domain spread.",
  },


  // ── Slide 3: Four Commercial Paths, One System ────────────
  {
    id: 3,
    type: "packaging",
    title: "Four Commercial Paths, One Underlying System",
    subtitle:
      "Each path exists because buyers arrive with a different constraint. The split follows who controls the IP boundary, the infrastructure boundary, and the regulatory boundary.",
    services: [
      {
        name: "Investment Management",
        stages: ["Decision", "Execution", "Governance"],
        model: "Performance fee above high-water mark (no management fee)",
        desc: "The buyer wants returns, not tools. They allocate capital; we manage it at identical terms to the firm's own capital. No infrastructure to learn or operate. Full investor portal with attribution.",
      },
      {
        name: "DART \u2014 Signals-In",
        stages: ["Execution", "Governance"],
        model: "Fixed access + per-signal or P&L share",
        desc: "The buyer has strategy IP they will not expose. They send structured trade instructions \u2014 instrument, side, size \u2014 via the DART schema. Odum runs execution, reporting, and compliance. Signal logic never crosses the boundary. Structural separation, not just contractual.",
      },
      {
        name: "DART \u2014 Full Pipeline",
        stages: [
          "Instruments & Data",
          "Research",
          "Decision",
          "Execution",
          "Governance",
        ],
        model: "Fixed access + metered research compute + IP tiers",
        desc: "The buyer wants to research, build, and run strategies on institutional infrastructure without constructing it themselves. They build on Odum's platform; promotion to live is a config change, not a rewrite.",
      },
      {
        name: "Odum Signals",
        stages: ["Research"],
        model: "Monthly licence + per-signal or P&L share",
        desc: "Signal flow is inverted relative to DART Signals-In. Odum generates the signal; the counterparty executes on their own stack. The buyer gets alpha without building any infrastructure. HMAC-signed payloads delivered to authenticated counterparty endpoints.",
      },
      {
        name: "Regulatory Umbrella",
        stages: ["Governance"],
        model: "Onboarding fee + monthly retainer",
        desc: "Some buyers need FCA cover, not trading infrastructure. They operate regulated activity \u2014 dealing, arranging, advising, managing \u2014 under Odum's permission 975797. Scope-matched to their activity. Weeks to onboard, not an 18-month authorisation cycle.",
      },
    ],
    note: "The split follows the IP and capital boundary: who generates the signal, who executes it, who holds the FCA permission. One system underneath \u2014 the commercial path is determined by where the client sits relative to those boundaries.",
  },

  // ══════════════════════════════════════════════════════════════
  // ACT II \u2014 THE MARKET PROBLEM
  // ══════════════════════════════════════════════════════════════

  // ── Slide 4: The Landscape Today ──────────────────────────
  {
    id: 4,
    type: "moat",
    title: "The Landscape Today",
    subtitle:
      "Every vendor in the trading infrastructure space covers a slice. Nobody covers the lifecycle across asset classes with an institutional discipline and sells it to you.",
    gaps: [
      {
        competitor: "Bloomberg / Refinitiv",
        users: "TradFi only",
        gap: "$24K–$30K/user/year. Deep TradFi data and terminal \u2014 but no crypto spot depth, no DeFi on-chain, no sports, no prediction. Data only. No research, no execution, no managed money.",
        color: "cyan",
      },
      {
        competitor: "QuantConnect",
        users: "Retail → hedge fund quant",
        gap: "Free to $8/mo cloud research; Enterprise custom. Backtest across TradFi + crypto. Execution against select venues only. No alternative asset classes, no managed capital, no regulatory shell, no cross-domain unification.",
        color: "violet",
      },
      {
        competitor: "Deltix (EPAM) — QuantOffice + CryptoCortex",
        users: "Institutional quant + sell-side",
        gap: "~$100K–$500K/yr enterprise licence. Serious research-to-execution stack across TradFi + crypto (TimeBase, QuantOffice, TradeHub, CryptoCortex). 15 years of product, strong institutional quant tooling. Separate research and execution environments, not one code path from backtest to live. No DeFi programmability, no sports, no prediction. Licensed software, not a regulated operating layer that hosts clients under an FCA permission.",
        color: "emerald",
      },
      {
        competitor: "Talos",
        users: "Institutional digital-asset lifecycle",
        gap: "$105M raised; custom institutional pricing. Strong institutional crypto execution and operations lifecycle. Crypto-only. No TradFi, no DeFi on-chain programmability, no sports, no prediction. Execution-layer product, not a cross-domain research + execution + reporting operating system with managed capital.",
        color: "emerald",
      },
      {
        competitor: "Hummingbot / 3Commas / Cryptohopper",
        users: "Crypto retail / prosumer",
        gap: "Free–$99/mo retail. Open-source market-making bots and strategy templates. Crypto-only. No TradFi, no DeFi programmability, no research pipeline, no compliance, no reporting fit for institutional capital.",
        color: "amber",
      },
      {
        competitor: "FalconX / Galaxy / Wintermute / Haiku",
        users: "Crypto execution & DeFi routing",
        gap: "Commission-based OTC; Haiku $1M pre-seed (DeFi intent-solver, 20+ chains, 45+ protocols). All crypto-only. No research stack, no TradFi, no cross-asset unification, no research-to-live infrastructure. Haiku routes DeFi trades optimally but has no compliance layer, no fund structure, no managed capital.",
        color: "emerald",
      },
      {
        competitor: "FlexTrade / Eze / Aladdin",
        users: "TradFi institutional OMS/EMS",
        gap: "~$100K–$500K/yr enterprise OMS/EMS. Venue connectivity for equities / futures / FX. No crypto, no DeFi, no sports, no prediction. No built-in research environment, no managed-capital layer.",
        color: "cyan",
      },
      {
        competitor: "Interactive Brokers",
        users: "Retail + institutional broker",
        gap: "$0.005/share equities; IBKR Lite commission-free. Broad TradFi coverage and thin crypto. No research platform, no backtest-to-live, no DeFi, no sports, no prediction, no FCA-cover-as-a-service.",
        color: "violet",
      },
      {
        competitor: "Tardis / Kaiko / Amberdata",
        users: "Crypto data providers",
        gap: "$500–$5K+/mo data feeds. High-quality crypto tick and L2 data. Data only. No TradFi parity, no DeFi protocol coverage, no sports, no prediction. Does not touch execution, research, or compliance.",
        color: "amber",
      },
      {
        competitor: "Citadel / Jane Street / Two Sigma",
        users: "Internal only",
        gap: "Internal \u2014 not for sale. The reference architecture for cross-domain quant. Even they do not unify crypto + DeFi + sports + prediction + TradFi in one stack at scale \u2014 the combinatory surface is outside their mandate.",
        color: "emerald",
      },
      {
        competitor: "Unbiased Alpha",
        users: "Institutional quant signal infra",
        gap: "$70\u2013$200/hr Upwork; AuraStream API. Two-person firm serving $1B+ hedge funds: 65 jobs logged, ~3,000 hours billed. Pure signals and analytics layer \u2014 no execution, no compliance, no fund structure. Demonstrates institutional capital pays for quant infrastructure from a small specialist operation. Odum delivers the full stack at institutional discipline.",
        color: "rose",
      },
    ],
    callout:
      "Every vendor solves ~15% of the pipeline in one domain. Nobody unifies the full lifecycle across five asset classes under an operated regulated wrapper \u2014 which is what capital actually needs.",
  },

  // ── Slide 5: Why The Gap Persists ─────────────────────────
  {
    id: 5,
    type: "doctrine",
    title: "Why The Gap Persists",
    subtitle:
      "The gap exists because the skill combination required to close it is rare. Three forces keep vendors locked into slices.",
    points: [
      {
        problem:
          "Specialisation. TradFi vendors built in the 1990s for equities and futures \u2014 crypto/DeFi/sports would require a ground-up rebuild, which they will not do.",
        solution:
          "Odum started in 2021 doing high-frequency trading — and learned first-hand why iterating fast enough was impossible without a unified foundation. Since 2024 we have been building the cross-domain ontology on that experience. Every schema is canonical across five asset classes.",
      },
      {
        problem:
          "Operator distance. Vendors who never ran a book sell tools. They do not know what a good fill looks like across venue microstructures at 3am.",
        solution:
          "Team personally traded options, delta one, high-frequency, and medium-frequency across TradFi, crypto, and sports \u2014 before Odum existed.",
      },
      {
        problem:
          "Regulatory cost. Retrofitting compliance onto an existing product is expensive, so most stay outside the perimeter and leave operators to solve it.",
        solution:
          "FCA 975797 since January 2023. Compliance infrastructure is the same one we use for our own capital and the one we sell.",
      },
      {
        problem:
          "Cross-domain thinking + institutional discipline + operator credibility is a rare combinatory skill set. The combination is what makes the problem interesting.",
        solution:
          "Odum exists precisely because the combination is rare. The platform is the artefact of over four years of compounding decisions — trying it the old way first, strategy-first, and then building the unified stack on the back of having traded most asset classes across our collective history.",
      },
    ],
    differentiators: [
      "Contracts-first \u2014 one source of truth for every data schema",
      "Config-hashed versioning \u2014 identical promotion from backtest to live",
      "Shard-level failure isolation \u2014 one venue outage does not cascade",
    ],
    conclusion:
      "The moat is not any single feature. It is the combination of cross-domain scope, institutional architectural discipline, and operator credibility \u2014 under a live FCA permission.",
  },

  // ══════════════════════════════════════════════════════════════
  // ACT III \u2014 THE ODUM SOLUTION
  // ══════════════════════════════════════════════════════════════

  // ── Slide 6: One System, Five Connected Layers ────────────
  {
    id: 6,
    type: "lifecycle-new",
    title: "One System, Five Connected Layers",
    subtitle:
      "From instrument discovery through execution to regulatory reporting. The same layers govern internal operations and client access \u2014 the only seam between research and live is whether a fill comes from a matching engine or a real venue.",
    stages: [
      { name: "Instruments & Data", desc: "Discover, normalise, validate" },
      { name: "Research & Modelling", desc: "Features, ML, simulate" },
      { name: "Decision & Strategy", desc: "Signals, sizing, risk" },
      { name: "Execution & Control", desc: "Route, fill, monitor" },
      { name: "Governance & Reporting", desc: "Audit, comply, report" },
    ],
  },

  // ── Slide 7: Breadth Without Fragmentation ────────────────
  {
    id: 7,
    type: "breadth-matrix",
    title: "Breadth Without Fragmentation",
    subtitle:
      "Every cell is served by the same underlying system. Adding a venue benefits every strategy. Adding a strategy benefits every client.",
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
          "Cross-domain routing, unified wallet & treasury API",
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

  // ══════════════════════════════════════════════════════════════
  // ACT IV \u2014 PROOF
  // ══════════════════════════════════════════════════════════════

  // ── Slide 8: IP Protection (DART Signals-In) ──────────────
  {
    id: 8,
    type: "doctrine",
    title: "Your Alpha Stays Yours",
    subtitle:
      "DART Signals-In is engineered so we cannot see your strategy logic. The boundary is structural, not policy. Here is what it looks like by layer.",
    points: [
      {
        problem: "Will you see my signals on DART Signals-In?",
        solution:
          "No. We receive structured instructions \u2014 instrument, side, size, constraints. Signal generation stays upstream at your endpoint. We see the orders, not the reasoning behind them.",
      },
      {
        problem: "Will you see my strategy on DART Full?",
        solution:
          "Yes \u2014 you are researching and promoting on our infrastructure, so the code is on the platform. But we do not trade the same strategy; we partition your tenant and we will never front-run you. Contractual and technical separation.",
      },
      {
        problem: "Can Odum copy my edge through Signals-In?",
        solution:
          "The signal feed does not carry alpha \u2014 it carries instructions. To recover the underlying edge you would have to reverse-engineer it from fill history, which is the same problem any execution venue has. Odum has its own alpha; we are not optimising for yours.",
      },
      {
        problem: "What if I leave?",
        solution:
          "On Signals-In your strategy was never with us. On Full, the bespoke logic is yours to take. The switching cost is operational familiarity, not contractual lock-in.",
      },
    ],
    differentiators: [
      "Tenant-level partitioning \u2014 no cross-tenant data access",
      "Signed payload envelopes \u2014 counterparty-scoped entitlements",
      "Explicit non-compete on bespoke strategy territory",
    ],
    conclusion:
      "The infrastructure is shared. The alpha is not. That is the design, enforced at the contract and the code.",
  },

  // ── Slide 9: Strategy Families ────────────────────────────
  {
    id: 9,
    type: "strategies",
    title: "Strategy Families \u2014 Risk, Return, Capacity",
    subtitle: "Same infrastructure, configurable risk appetite.",
    families: [
      {
        name: "Stable Yield (DeFi)",
        returns: "3–12%",
        drawdown: "<1%",
        capacity: "$50M–$100M+",
        character: "Aave lending, stablecoin yield, multi-chain",
        risk: "low",
      },
      {
        name: "Relative Value",
        returns: "10–30%",
        drawdown: "5%",
        capacity: "$5M–$20M",
        character: "Basis trades, funding capture, cross-venue",
        risk: "low",
      },
      {
        name: "Leveraged Yield (DeFi)",
        returns: "20–50%",
        drawdown: "15%",
        capacity: "$5M / pool",
        character: "Recursive staking, liquidity provision",
        risk: "medium",
      },
      {
        name: "Crypto Long/Short",
        returns: "30%+",
        drawdown: "5–10%",
        capacity: "$2M / pair",
        character: "ML long/short, mean reversion, arb",
        risk: "medium",
      },
      {
        name: "TradFi Quant",
        returns: "12–18%",
        drawdown: "8–10%",
        capacity: "$5M / name",
        character: "ML directional, options, volatility",
        risk: "medium",
      },
      {
        name: "Sports",
        returns: "50%+",
        drawdown: "20%",
        capacity: "$100K–$1M",
        character: "ML prediction, cross-bookmaker arbitrage",
        risk: "high",
      },
    ],
    callout:
      "$100K to $100M+ depending on the strategy. Infrastructure is identical \u2014 only the configuration changes.",
  },

  // ── Slide 10: What Is Real Today ──────────────────────────
  {
    id: 10,
    type: "traction",
    title: "What Is Real Today",
    achieved: [
      {
        text: "Crypto mean reversion \u2014 $4M AUM",
        detail: "30%+ annualised, 1-year track record, $3.3M at high watermark. Binance + OKX.",
      },
      {
        text: "Bitcoin fund of funds \u2014 $3.5M+ AUM",
        detail: "5-year track record. Running under Odum reporting and compliance.",
      },
      {
        text: "Platform live \u2014 first paying DART client",
        detail: "Elysium DeFi: $125K signed, growing to $250K+ annual. Three strategies at 5–20% yield.",
      },
      {
        text: "First Regulatory Umbrella client onboarded",
        detail: "Desmond \u2014 Reg Umbrella + DART Signals-In (perp-funding arb).",
      },
      {
        text: "FCA authorised January 2023 \u2014 Ref 975797",
        detail: "Dealing, arranging, advising, managing \u2014 scoped to Professional / ECP.",
      },
    ],
    inProgress: [
      {
        text: "3 Regulatory Umbrella prospects in conversation",
        detail: "Scope fit on 4-axis model, expected close inside H2 2026.",
      },
      {
        text: "2 Odum Signals counterparties contracted",
        detail: "Sept 2026 go-live, hybrid pricing model, ~$5K/mo combined starting point.",
      },
      {
        text: "CME S&P co-invest (Sept 2026)",
        detail: "$500K client + $50K Odum skin \u2014 asymmetric 70/10 terms.",
      },
      {
        text: "India Options (Oct 2026)",
        detail: "$100K onboarding + $5–10M IM allocation (NSE delta trading).",
      },
    ],
    launchReady: [
      {
        text: "22 microservices, 24,500+ tests",
        detail: "All passing. Production-grade. Shard-level failure isolation across venues.",
      },
      {
        text: "35 strategies, 5 families",
        detail: "30 code-complete. Ready for bespoke DART Full builds.",
      },
      {
        text: "9 execution algorithms",
        detail: "TWAP, VWAP, smart routing, Arrival-Price, IS, plus venue-specific.",
      },
      {
        text: "Backtest = live",
        detail: "Config change promotes from research to production. No rewrite.",
      },
      {
        text: "12,000+ live instruments across 5 asset classes",
        detail: "28 DeFi protocols on 11 chains. 102 sports leagues. 40K+ fixtures/yr.",
      },
    ],
    checkpoint:
      "Every service line now has live commercial traction. The remaining constraint is commercial focus and sequencing, not core engineering.",
  },


  // ── Slide 11: Why We Know The Demand Is Real ─────────────
  {
    id: 11,
    type: "demand",
    title: "Why We Know The Demand Is Real",
    subtitle:
      "Five direct demand signals from the market \u2014 not projections or surveys. Each is a real conversation or signed contract, each mapping to a different part of the system.",
    signals: [
      {
        label: "DeFi Client \u2014 Signed",
        detail: "Elysium: $125K signed, growing to $250K+ annual. Three live DeFi strategies at 5\u201320% yield. First paying DART client.",
        color: "emerald",
      },
      {
        label: "India Options Inquiry",
        detail: "$100K onboarding + $5\u201310M IM allocation (NSE delta-neutral trading). Counterparty seeking a signal aggregation and execution framework \u2014 Odum fits the entire stack.",
        color: "violet",
      },
      {
        label: "US Equities Scanner",
        detail: "Professional asked: how to build a scanner for all US equities and run daily factor screens. Looking for exactly what DART Full Pipeline provides \u2014 data, research, and execution under one roof.",
        color: "cyan",
      },
      {
        label: "Sports Prediction \u2014 Institutional",
        detail: "Individual with a sports prediction system asked how to turn it into institutional-grade fund infrastructure. Exact use case for DART Full Pipeline + Regulatory Umbrella.",
        color: "amber",
      },
      {
        label: "Unbiased Alpha \u2014 Competitor Demand Signal",
        detail: "Two-person quant firm billing $70\u2013$200/hr on Upwork: 65 jobs, ~3,000 hours logged. Proves institutional capital pays for quant signal infrastructure from small specialist operations. Odum delivers the full stack with execution, compliance, and fund structure.",
        color: "rose",
      },
    ],
    marketSizes: [
      { name: "Bloomberg Terminal", scale: "~325K subscribers · ~$6B/yr revenue" },
      { name: "QuantConnect", scale: "~200K users · $25M raised · cloud quant research" },
      { name: "Talos (institutional crypto)", scale: "$105M raised · $1.5B valuation · crypto ops lifecycle" },
      { name: "Deltix / EPAM", scale: "$100K\u2013$500K/yr enterprise licences · 15-year institutional quant stack" },
      { name: "FlexTrade / Aladdin", scale: "$100K\u2013$500K/yr OMS/EMS · TradFi institutional standard" },
    ],
    callout:
      "The market does not lack buyers. It lacks one provider spanning the full lifecycle across five asset classes under a live FCA permission \u2014 that is the gap Odum closes.",
  },

  // ══════════════════════════════════════════════════════════════
  // ACT V \u2014 FORWARD
  // ══════════════════════════════════════════════════════════════

  // ── Slide 12: Why One Sale Leads To Others ────────────────
  {
    id: 12,
    type: "flywheel",
    title: "Why One Sale Leads To Others",
    subtitle:
      "The relationship deepens naturally because every step uses the same system. A client enters at the path that fits and expands into the others over time.",
    funnel: [
      { name: "Data", sub: "entry point", active: true },
      { name: "Research", sub: "validate ideas", active: false },
      { name: "Live Trading", sub: "same code, live capital", active: false },
      { name: "Full Platform", sub: "complete operating layer", active: false },
      { name: "Managed / Regulated", sub: "Odum runs capital or compliance", active: true },
    ],
    examples: [
      "Data subscriber discovers signal quality → starts backtesting",
      "Backtester validates edge → promotes to live (config change)",
      "Signals-In client scales → needs regulatory cover for counterparty onboarding",
      "Platform user wants managed capital → becomes IM co-invest client",
      "Umbrella client sees the research stack → wants DART Full for their next mandate",
    ],
  },

  // ── Slide 13: 2026 Cashflow Shape ─────────────────────────
  {
    id: 13,
    type: "trajectory",
    title: "2026 Cashflow Shape \u2014 Self-Funded",
    subtitle:
      "Starts April at £240k. Minimum £198k (April). October flip to £333k. December £413k. No bridge capital required \u2014 the business self-funds through the $7.5M → $25M AUM transition.",
    milestones: [
      { date: "Apr", value: "£240k", detail: "Opening position. ~£34k steady-state burn.", active: true },
      { date: "May", value: "£219k", detail: "Elysium onboarding + Desmond Reg Umbrella close. First DART revenue lands." },
      { date: "Jun", value: "£238k", detail: "BTC ML IM go-live (10 × $500k). Sports ML IM live (2 clients)." },
      { date: "Jul", value: "£260k", detail: "IM performance fees accrue. Elysium upsell (MEV + Solana + recursive staking)." },
      { date: "Aug", value: "£277k", detail: "BTC ML perf fees compounding. Desmond DART baseline steady at £22k/mo." },
      { date: "Sep", value: "£280k", detail: "CME S&P co-invest live. Odum Signals to 2 counterparties at ~$5k/mo combined." },
      { date: "Oct", value: "£372k", detail: "India Options $100k onboarding. £92k single-month step-up. $5–10M IM to follow." },
      { date: "Nov", value: "£392k", detail: "CME ramp. BTC ML, Sports ML, Elysium, Desmond, Signals all compounding." },
      { date: "Dec", value: "£413k", detail: "~£636k annual revenue, ~£92k net profit. Self-funded entry into 2027.", active: true },
    ],
    callout:
      "October 2026 is the key inflection: India Options onboarding delivers a £92k single-month step-up. Target for end-2027: 4–6 Odum Signals counterparties and $25M+ AUM.",
  },

  // ══════════════════════════════════════════════════════════════
  // ACT VI \u2014 CLOSE
  // ══════════════════════════════════════════════════════════════

  // ── Slide 14: What Fits Your Network ──────────────────────
  {
    id: 14,
    type: "ask",
    title: "What Fits Your Network",
    subtitle:
      "Everything shown is shippable today. The question is which path resonates with the people you work with \u2014 and what they would need to see to move.",
    asks: [
      {
        title: "Investment Management",
        items: [
          "Who allocates to alternatives \u2014 crypto, DeFi yield, quant, sports?",
          "Next step: mandate discussion + reporting pack review",
          "What matters most \u2014 track record depth, fee structure, minimum ticket?",
        ],
      },
      {
        title: "DART (Platform)",
        items: [
          "Who needs trading infrastructure but will not build it?",
          "Next step: scoping call \u2014 Signals-In vs Full Pipeline fit",
          "What would land \u2014 data-only entry, full demo, or a specific asset class?",
        ],
      },
      {
        title: "Odum Signals",
        items: [
          "Who runs execution in-house and wants alpha without building research?",
          "Next step: payload schema review + counterparty onboarding",
          "What would land \u2014 signal latency, cadence, or coverage specifics?",
        ],
      },
      {
        title: "Regulatory Umbrella",
        items: [
          "Who is entering UK regulation or needs FCA cover quickly?",
          "Next step: eligibility assessment on the 4-axis model",
          "What matters most \u2014 onboarding speed, permissions scope, or pricing?",
        ],
      },
    ],
    contact: "ikenna@odum-research.com",
  },

  // ── Slide 15: Live Demo ──────────────────────────────────
  {
    id: 15,
    type: "demo",
    title: "See It Live",
    subtitle:
      "Click any card to open the live platform in demo mode. Representative fills, positions, and P&L against a demo persona \u2014 never real client capital.",
    previewLink: "/dashboard",
    sections: [
      { name: "Homepage", desc: "Four commercial paths, one regulated operating system", link: "/" },
      { name: "Our Story", desc: "Long-form founder narrative \u2014 why this exists", link: "/our-story" },
      { name: "Briefings Hub", desc: "Six path-specific briefings (code: odum-briefings-2026)", link: "/briefings" },
      { name: "Platform Dashboard", desc: "Live demo \u2014 positions, returns, risk, alerts", link: "/dashboard" },
      { name: "Trading & Positions", desc: "Demo persona \u2014 live positions and attribution", link: "/services/trading/positions" },
      { name: "Strategy Research", desc: "Backtests, comparison, ML analysis", link: "/services/research/strategy/overview" },
      { name: "Executive Reporting", desc: "IBOR, reconciliation, performance", link: "/services/reports/executive" },
      { name: "Risk & Scenarios", desc: "Scenario analysis, stress testing", link: "/services/observe/scenarios" },
    ],
    note: "Platform links require sign-in (investor@odum-research.com / OdumIR2026!). Public-site links open in a new tab; no sign-in required.",
  },
];
