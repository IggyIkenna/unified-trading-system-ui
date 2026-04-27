// Odum-Managed Strategies Presentation: data for 10-slide allocator deck.
// Marketing label: Odum-Managed Strategies. Legal/contract label: Investment Management
// (retained where the legal-context badge is appropriate, e.g. signup wizard, contracts).
// Last restructured: April 2026: reframed for allocators / family offices,
// with named-competitor landscape and proof-of-same-infrastructure.

export const slides = [
  // ── Slide 1: Cover ────────────────────────────────────────
  {
    id: 1,
    type: "cover",
    title: "Odum-Managed Strategies",
    subtitle:
      "FCA-authorised discretionary management (Investment Management permission, FCA 975797). The same infrastructure that runs $7.5M of our own capital, available to you. Co-invest at identical terms as the firm principals.",
    tagline: "Allocator Deck",
    stats: [
      { value: "$7.5M", label: "Under Management" },
      { value: "30%+", label: "Annualised (Crypto)" },
      { value: "0%", label: "Management Fee" },
      { value: "20-40%", label: "Performance Fee" },
      { value: "FCA 975797", label: "Regulated" },
    ],
  },

  // ── Slide 2: The Proposition ──────────────────────────────
  {
    id: 2,
    type: "doctrine",
    title: "The Proposition",
    subtitle:
      "Co-invest alongside us at identical terms. Same infrastructure, same strategies, same risk controls. If it is good enough for our money, it should be good enough for yours.",
    points: [
      {
        problem: "How do I know the strategies work?",
        solution:
          "We run $7.5M of our own capital through them. 30%+ annualised on crypto mean reversion, 1-year track record, $3.3M at high watermark. 5-year track record on Bitcoin fund of funds.",
      },
      {
        problem: "How do I get transparency?",
        solution:
          "Full investor portal: 10-factor returns waterfall, trade history, compliance reports, settlement tracking. Same tools we use internally.",
      },
      {
        problem: "How are fees aligned?",
        solution:
          "0% management fee. 20-40% performance fee above high watermark, strategy-dependent. Lower-yielding strategies carry lower fees. We earn when you earn.",
      },
      {
        problem: "Can I bring my own thesis?",
        solution:
          "Yes. Backtest, build, and deploy to your specification with managed execution, custom risk parameters, and allocation constraints. Your thesis, our engineering and compliance.",
      },
    ],
    differentiators: [
      "Same infrastructure runs our own capital",
      "Live clients across every engagement route: Odum-Managed Strategies, DART Trading Infrastructure, Regulated Operating Models",
      "Nothing ships that we would not trust with our own money",
    ],
    conclusion: "Co-invest at identical terms as the firm principals.",
  },

  // ── Slide 3: The Allocator Landscape ──────────────────────
  {
    id: 3,
    type: "moat",
    title: "The Allocator Landscape",
    subtitle:
      "If you are looking for an alternatives allocation, you have seen these. Each specialises. None unifies managed exposure across crypto + TradFi + DeFi + sports + prediction.",
    gaps: [
      {
        competitor: "BlackRock / Fidelity Alt Funds",
        users: "Pension / institutional",
        gap: "Brand comfort, long history. Exposure is traditional alternatives: private equity, private credit, some crypto ETFs. No cross-domain alpha, no transparency into strategy logic, fee stack is high.",
        color: "cyan",
      },
      {
        competitor: "Galaxy Digital / Coinshares",
        users: "Crypto-native allocators",
        gap: "Crypto exposure and some funds. No TradFi integration, no DeFi yield strategies at institutional rigor, no sports, no prediction. Crypto thesis only.",
        color: "violet",
      },
      {
        competitor: "Pantera / Polychain / Paradigm",
        users: "Venture / token funds",
        gap: "Venture-stage crypto exposure. Lock-up heavy, no liquid alpha strategies, no managed-account transparency, not daily-NAV.",
        color: "amber",
      },
      {
        competitor: "Millennium / Citadel (external)",
        users: "Institutional LPs only",
        gap: "Top-tier systematic funds. $10B+ minimums, multi-year lockups, closed to new capital most of the time. Not a mandate-first conversation.",
        color: "emerald",
      },
      {
        competitor: "Managed accounts at IBKR / prime brokers",
        users: "Family offices",
        gap: "You bring the manager; they bring the custody. No managed alpha, no cross-domain strategy research, no FCA-authorised wrapper. Execution and reporting only.",
        color: "cyan",
      },
      {
        competitor: "Starlizard / Stratagem (sports)",
        users: "Sports sharps (private)",
        gap: "Sports alpha specialists. Private, closed to outside capital in most cases, no cross-asset diversification.",
        color: "rose",
      },
    ],
    callout:
      "Odum is the first mandate you have seen that unifies crypto, TradFi quant, DeFi yield, sports ML, and prediction arbitrage inside one FCA-authorised wrapper: with the firm co-investing alongside on identical terms.",
  },

  // ── Slide 4: Live Performance ─────────────────────────────
  {
    id: 4,
    type: "traction",
    title: "Live Performance",
    achieved: [
      {
        text: "Crypto mean reversion",
        detail: "$4M AUM. 30%+ annualised, 1-year track record. $3.3M at high watermark. Binance + OKX.",
      },
      {
        text: "Bitcoin fund of funds",
        detail: "$3.5M+ AUM. 8%+ annualised, 5-year track record.",
      },
      {
        text: "Total under management",
        detail: "$7.5M across two mandates, running through 22 microservices with 24,500+ automated tests.",
      },
    ],
    inProgress: [
      {
        text: "DeFi yield strategies",
        detail: "Three strategies at 5-20% yield: live for first DART client, opening to IM clients June 2026.",
      },
      {
        text: "Machine learning directional",
        detail: "TradFi ML. Testing on own capital May, available to IM clients June 2026 (10 × $500K targeted).",
      },
      {
        text: "CME S&P co-invest",
        detail: "Sept 2026 go-live. $500K client + $50K Odum skin, asymmetric 70/10 terms.",
      },
      {
        text: "India Options",
        detail: "Oct 2026 launch. $100K onboarding + $5-10M IM allocation (NSE delta).",
      },
    ],
    checkpoint:
      "Every new strategy tested on our own capital first. Nothing reaches a client that we have not validated with our own money.",
  },

  // ── Slide 5: Strategy Families ────────────────────────────
  {
    id: 5,
    type: "strategies",
    title: "Strategy Families: Risk, Return, Capacity",
    subtitle:
      "Same infrastructure, configurable risk appetite. Lower-yielding strategies carry lower performance fees.",
    families: [
      {
        name: "DeFi: Stable Yield",
        returns: "3-12%",
        drawdown: "<1%",
        capacity: "$50M-$100M+",
        character: "Aave lending, stablecoin yield, multi-chain",
        risk: "low",
      },
      {
        name: "DeFi: Basis Trades",
        returns: "10-30%",
        drawdown: "5%",
        capacity: "$5M-$20M",
        character: "Delta-neutral, funding capture",
        risk: "low",
      },
      {
        name: "DeFi: Leveraged",
        returns: "20-50%",
        drawdown: "15%",
        capacity: "$5M / pool",
        character: "Recursive staking, concentrated liquidity",
        risk: "medium",
      },
      {
        name: "Crypto Trading",
        returns: "30%+ observed",
        drawdown: "5-10%",
        capacity: "$2M / pair",
        character: "Momentum, mean reversion, cross-exchange arb",
        risk: "medium",
      },
      {
        name: "TradFi Quant",
        returns: "12-18%",
        drawdown: "8-10%",
        capacity: "$5M / name",
        character: "ML directional, options, volatility",
        risk: "medium",
      },
      {
        name: "Sports",
        returns: "50%+ observed",
        drawdown: "20%",
        capacity: "$100K-$1M",
        character: "ML prediction, cross-bookmaker arb",
        risk: "high",
      },
    ],
    callout:
      "Bespoke mandates combine any of these. Allocation terms: single-strategy SMA, pooled multi-strategy, or custom bring-your-own-thesis: are scoped per client.",
  },

  // ── Slide 6: Your Investor Portal ─────────────────────────
  {
    id: 6,
    type: "operations",
    title: "Your Investor Portal",
    columns: [
      {
        title: "Portfolio Overview",
        items: [
          "NAV, month-to-date returns, maximum drawdown, Sharpe",
          "Allocation breakdown by strategy and asset class",
          "10-factor returns waterfall: funding, carry, basis, delta, gamma, vega, theta, slippage, fees, rebates",
        ],
      },
      {
        title: "Trade & Settlement",
        items: [
          "Filterable trade and order records by instrument, venue, strategy",
          "Full audit trail with slippage analysis",
          "Real-time settlement status: confirming, settled, pending, failed",
          "Account balances, transfers, fee breakdowns",
        ],
      },
      {
        title: "Reports & Compliance",
        items: [
          "On-demand or scheduled reports: performance, regulatory, executive",
          "Spreadsheet export",
          "Live-vs-batch reconciliation with break detection",
          "Best-execution documentation",
        ],
      },
    ],
    callout: "The same reporting tools we use for our own capital. Not a stripped-down version.",
    metrics: [
      { value: "10", label: "Attribution Factors" },
      { value: "0%", label: "Management Fee" },
      { value: "$100K", label: "Minimum Investment" },
      { value: "30 Days", label: "Redemption Notice" },
    ],
  },

  // ── Slide 7: Common Questions ─────────────────────────────
  {
    id: 7,
    type: "faq",
    title: "Common Questions",
    subtitle: "",
    questions: [
      {
        q: "What is the fee structure?",
        a: "0% management fee. 20-40% performance fee above high watermark, strategy-dependent. Lower-yielding strategies carry lower fees. We only earn when you earn.",
      },
      {
        q: "What are the investor requirements?",
        a: "Professional Client or Eligible Counterparty status. Completed suitability assessment, know-your-client documentation, signed subscription agreement. Minimum investment $100,000.",
      },
      {
        q: "Can I bring my own thesis?",
        a: "Yes. We backtest, build, and deploy the strategy with managed execution, custom risk parameters, and allocation constraints. Your thesis, our engineering and operational capability.",
      },
      {
        q: "Why should I trust you with my capital?",
        a: "We built this for ourselves first. $7.5M of our own capital runs through the same infrastructure. Live clients across every service. Nothing ships that we would not trust with our own money. Contractual non-compete on bespoke strategy territory.",
      },
      {
        q: "How does this compare to BlackRock alts, Galaxy, Pantera?",
        a: "They specialise by asset class or vintage. Odum spans crypto, TradFi quant, DeFi yield, sports, and prediction inside one FCA wrapper, with the firm co-investing on identical terms. Different mandate shape.",
      },
    ],
  },

  // ── Slide 8: Get Started ──────────────────────────────────
  {
    id: 8,
    type: "ask",
    title: "Get Started",
    subtitle:
      "Allocator route through Odum-Managed Strategies. Same infrastructure Odum runs internally, full transparency on positions and reporting.",
    asks: [
      {
        title: "Step 1. Read the IM briefing",
        items: [
          "Submit the light questionnaire at /questionnaire to unlock the briefings hub on this device, or use the shared access code odum-briefings-2026",
          "Read /briefings/investment-management (mandate shapes, structure, reporting, fees)",
          "Forward to colleagues; the same access code works for them",
        ],
      },
      {
        title: "Step 2. Initial fit call",
        items: [
          "15-minute Calendly via /contact",
          "Confirm allocator fit, capital scale, mandate preference (SMA route vs Pooled Fund route)",
          "Decide whether the depth Strategy Evaluation is the right next step",
        ],
      },
      {
        title: "Step 3. Strategy Evaluation + Review",
        items: [
          "Submit the Path A allocator wizard at /strategy-evaluation (profile, constraints, structure preference)",
          "We issue a per-prospect Strategy Review by magic link to your inbox (tailored pre-demo prep, not a final proposal)",
          "Allocator emphasis covers proposed structure, mandate fit, reporting walkthrough, missing information, and risks to discuss",
        ],
      },
      {
        title: "Step 4. Walkthrough, tailoring, onboard",
        items: [
          "Operator-led platform walkthrough scoped to your mandate (demo / UAT mode, illustrative data)",
          "Commercial Tailoring: final mandate shape, fee structure, share class or SMA mechanics, KYC / AML, subscription docs",
          "Signup, portal access live, first allocation, monthly reporting begins",
        ],
      },
    ],
    contact: "ikenna@odum-research.com",
  },

  // ── Slide 9: Explore The Public Site ──────────────────────
  {
    id: 9,
    type: "demo",
    title: "Explore The Public Site",
    subtitle:
      "Forward these to allocators and family offices before a first call. Access code for the briefings hub is odum-briefings-2026.",
    sections: [
      {
        name: "Odum-Managed Strategies",
        desc: "Public landing: proposition, strategies, fees",
        link: "/investment-management",
      },
      {
        name: "Light Questionnaire",
        desc: "Allocator-style intake (~2 min). Unlocks the briefings hub on submit and emails the access code",
        link: "/questionnaire",
      },
      {
        name: "IM Briefing",
        desc: "In depth: mandate shapes, structure, reporting, fees",
        link: "/briefings/investment-management",
      },
      {
        name: "Strategy Evaluation",
        desc: "Path A allocator wizard. The depth gate before we issue a tailored Strategy Review",
        link: "/strategy-evaluation",
      },
      { name: "Who We Are", desc: "Firm identity, scope, and who we serve", link: "/who-we-are" },
      { name: "Our Story", desc: "Long-form founder narrative", link: "/our-story" },
      { name: "FAQ", desc: "Common objections covering IP, track record, fees, redemptions", link: "/faq" },
      { name: "Contact", desc: "Calendly for scheduling, prefilled form for typed intent", link: "/contact" },
    ],
    note: "Public-site links open in a new tab. The briefings hub is gated by the questionnaire submit or the shared access code. Strategy Review is a per-prospect magic-link surface (admin-issued after the depth Strategy Evaluation) and is not in this list.",
  },

  // ── Slide 10: See It Live ─────────────────────────────────
  {
    id: 10,
    type: "demo",
    title: "See It Live: Investor Portal",
    subtitle: "Click any card to walk through the live investor portal and reporting tools in demo mode.",
    sections: [
      {
        name: "Dashboard",
        desc: "Platform overview: positions, returns, risk, alerts",
        link: "/dashboard",
      },
      {
        name: "Returns Attribution",
        desc: "10-factor waterfall, strategy-level drill-down",
        link: "/services/trading/pnl",
      },
      {
        name: "Client Reporting",
        desc: "Executive dashboard, investment book of records",
        link: "/services/reports/executive",
      },
      {
        name: "Risk & Scenarios",
        desc: "Scenario analysis, stress testing, historical replay",
        link: "/services/observe/scenarios",
      },
    ],
    note: "Platform links require sign-in (investor@odum-research.com / OdumIR2026!). Demo persona only; never real client capital.",
  },
];
