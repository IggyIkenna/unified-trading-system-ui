// Plan & Longevity Presentation \u2014 data for 13-slide capital-trajectory deck.
// Last restructured: April 2026 \u2014 reframed around the $7.5M → $100M path,
// strategy availability timelines, and why this compounds rather than scales.

export const slides = [
  // ── Slide 1: Cover ────────────────────────────────────────
  {
    id: 1,
    type: "cover",
    title: "The Path To $100M",
    subtitle:
      "Strategy availability, service readiness, and capital growth \u2014 the plan for the next 30 months. Not a plan from zero. A plan from $7.5M with demonstrated performance, live commercial traction across every service, and an FCA permission that has been authorised since January 2023.",
    tagline: "Capital Trajectory Deck",
    stats: [
      { value: "$7.5M", label: "Today" },
      { value: "$10M+", label: "End 2026" },
      { value: "$25M+", label: "End 2027" },
      { value: "$100M", label: "End 2028" },
    ],
  },

  // ── Slide 2: Why Breadth Exists ───────────────────────────
  {
    id: 2,
    type: "doctrine",
    title: "Why Breadth Exists",
    subtitle:
      "We cannot build and scale every strategy ourselves. We do not have the manpower, the capital, or the distribution network. The breadth exists to power four revenue lines that feed each other.",
    points: [
      {
        problem: "We cannot trade everything ourselves \u2014 too many strategies, not enough capital.",
        solution: "Breadth powers Investment Management \u2014 we pick the strategies we can run at scale, trade our own capital, and partition away our alpha. Co-investors join on identical terms.",
      },
      {
        problem: "Clients want infrastructure, not just returns \u2014 but building it themselves is 18\u201324 months.",
        solution: "Same breadth powers DART \u2014 Signals-In for clients who keep IP upstream, Full Pipeline for clients who want research and promote on Odum.",
      },
      {
        problem: "Research has value beyond our own trading \u2014 we produce more signal than we can deploy.",
        solution: "Odum Signals \u2014 signal feeds to institutional counterparties who execute on their own infrastructure. Monetises research without sharing methodology.",
      },
      {
        problem: "Regulated activity is a gate \u2014 firms stall 12\u201324 months waiting for direct FCA authorisation.",
        solution: "Regulatory Umbrella \u2014 Odum's permissions cover client activity. Compliance infrastructure is the same one we operate ourselves.",
      },
    ],
    differentiators: [
      "All four revenue lines run on one codebase \u2014 adding breadth compounds across all of them",
      "Client strategies built on Odum stay with the client \u2014 contractual non-compete on bespoke territory",
      "Nothing ships that we would not trust with our own money",
    ],
    conclusion: "Investment management grows through track record. DART grows through platform deployments. Odum Signals monetises research without sharing methodology. Regulatory Umbrella unblocks the first three. All four compound on the same infrastructure.",
  },

  // ── Slide 3: From $7.5M To $100M ──────────────────────────
  {
    id: 3,
    type: "trajectory",
    title: "From $7.5M To $100M",
    subtitle: "Capital follows demonstrated performance. Each stage is unlocked by track record, not by raise velocity.",
    milestones: [
      {
        date: "Now",
        value: "$7.5M",
        detail: "Crypto mean reversion (30%+, 1-yr TR) + BTC FoF (5-yr TR). First DART + Regulatory Umbrella clients live.",
        active: true,
      },
      {
        date: "End 2026",
        value: "$10M+",
        detail: "Elysium DeFi DART live. BTC ML IM (10 × $500K). CME S&P co-invest (Sept, $500K + $50K Odum skin). India Options (Oct, $100K onboarding + $5\u201310M IM). 2 Odum Signals counterparties.",
      },
      {
        date: "End 2027",
        value: "$25M+",
        detail: "CME S&P scaled to $5M. India Options $5\u201310M live. 4 DART clients, 6 Regulatory Umbrella clients, 4 Odum Signals counterparties. Institutional allocator conversations on 18-month TRs.",
      },
      {
        date: "End 2028",
        value: "$100M",
        detail: "9 DART clients, 11 Regulatory Umbrella clients, 6+ Odum Signals counterparties. BTC ML + sports ML + CME + India + DeFi strategies at full scale across IM and DART.",
      },
    ],
    callout: "The unlock at each stage is track record. Every month of live trading compounds the evidence — and with four revenue lines funding operations, we are not racing against a runway clock.",
  },

  // ── Slide 4: When Each Strategy Becomes Available ─────────
  {
    id: 4,
    type: "timeline-matrix",
    title: "When Each Strategy Becomes Available",
    subtitle: "From internal testing through investment management to client deployment. Green = live. Amber = testing. Blue = available for client deployment.",
    periods: ["Now", "May 2026", "Jun 2026", "Q3 2026", "Q4 2026", "Q2 2027"],
    strategies: [
      {
        name: "Crypto mean reversion",
        statuses: ["live", "live", "live", "live", "live", "live"],
      },
      {
        name: "Bitcoin fund of funds",
        statuses: ["live", "live", "live", "live", "live", "live"],
      },
      {
        name: "DeFi yield (stable + basis)",
        statuses: ["testing", "live", "live", "live", "live", "live"],
      },
      {
        name: "ML directional (TradFi)",
        statuses: ["", "testing", "live", "live", "live", "live"],
      },
      {
        name: "Sports prediction ML",
        statuses: ["", "testing", "available", "available", "available", "available"],
      },
      {
        name: "India Options (NSE delta)",
        statuses: ["", "", "", "testing", "live", "live"],
      },
      {
        name: "CME S&P ML directional",
        statuses: ["", "", "testing", "live", "live", "live"],
      },
      {
        name: "Perp-funding arb (DART Signals-In)",
        statuses: ["", "testing", "live", "live", "live", "live"],
      },
      {
        name: "High-frequency / market making",
        statuses: ["", "", "", "", "testing", "live"],
      },
    ],
  },

  // ── Slide 5: Service Readiness Matrix ─────────────────────
  {
    id: 5,
    type: "breadth-matrix",
    title: "What Is Available When, By Service",
    subtitle:
      "Data and research are always first. Internal testing next. Investment management after track record forms. DART / bespoke builds anchored to commercial conversations.",
    columns: ["Internal Testing", "Investment Management", "DART / Bespoke", "Data & Research"],
    rows: [
      {
        asset: "Crypto mean reversion",
        color: "green",
        cells: ["Done", "Live now", "Available now", "Available now"],
      },
      {
        asset: "Bitcoin fund of funds",
        color: "green",
        cells: ["Done", "Live now", "N/A (fund)", "Available now"],
      },
      {
        asset: "DeFi yield",
        color: "violet",
        cells: ["Now", "May 2026", "May 2026 (Elysium live)", "Available now"],
      },
      {
        asset: "ML directional (TradFi)",
        color: "cyan",
        cells: ["May 2026", "Jun 2026", "Jun 2026", "Available now"],
      },
      {
        asset: "Sports prediction",
        color: "amber",
        cells: ["May 2026", "Jun 2026", "Q3 2026", "Available now"],
      },
      {
        asset: "Options / volatility",
        color: "cyan",
        cells: ["Q3 2026", "Q4 2026", "Q4 2026", "Q3 2026"],
      },
      {
        asset: "HFT / market making",
        color: "green",
        cells: ["Q4 2026", "Q2 2027", "Q2 2027", "Q4 2026"],
      },
    ],
  },

  // ── Slide 6: What We Keep, What We Share ──────────────────
  {
    id: 6,
    type: "doctrine",
    title: "What We Keep, What We Share",
    subtitle: "We partition strategies into two categories. The infrastructure is shared. The alpha is not.",
    points: [
      {
        problem: "Internal alpha \u2014 strategies we run for our own IM and co-invest.",
        solution: "Proprietary. Signal logic, feature weights, parameters never shared. Never licensed. Client-facing teams do not see the source.",
      },
      {
        problem: "Bespoke client strategies \u2014 DART Full engagements where a client builds or contracts a build.",
        solution: "Built on shared infrastructure, to the client's requirements. We do not trade the same strategy ourselves. Contractual non-compete on bespoke territory. If they leave, bespoke logic goes with them.",
      },
      {
        problem: "DART Signals-In clients \u2014 strategy IP stays upstream at the client.",
        solution: "Odum never sees the signal logic. We receive structured instructions and execute. Technical boundary enforced by the DART schema.",
      },
      {
        problem: "Odum Signals counterparties \u2014 we generate, they execute elsewhere.",
        solution: "Counterparty receives structured payloads via HMAC-signed envelopes. They never see the underlying model; we never see their execution venue.",
      },
    ],
    differentiators: [
      "Enough strategy families to allocate some internally and still build for clients without conflict",
      "Bespoke commercial terms per engagement \u2014 profit shares, retainers, licences",
      "Client strategies stay with the client \u2014 tenant-level partitioning + written non-compete",
    ],
    conclusion: "The infrastructure is shared. The alpha is not.",
  },

  // ── Slide 7: You Do Not Have To Give Us Anything ──────────
  {
    id: 7,
    type: "packaging",
    title: "You Do Not Have To Give Us Anything",
    subtitle: "The platform is modular. Engage at the level you are comfortable with. Expand as trust compounds.",
    services: [
      {
        name: "Just Data",
        stages: ["Instruments & Data"],
        model: "Subscription",
        desc: "Normalised feeds across five asset classes. We never see your signals.",
      },
      {
        name: "Just Research",
        stages: ["Research"],
        model: "Compute credits",
        desc: "Use our backtesting environment. Take your results and execute elsewhere.",
      },
      {
        name: "Just Execution",
        stages: ["Execution"],
        model: "Per-trade or subscription",
        desc: "Plug your own signals into our execution layer. We route and fill. We do not see the logic behind your orders.",
      },
      {
        name: "Just Reporting",
        stages: ["Governance"],
        model: "Subscription",
        desc: "Client reporting and compliance tools. Your strategy stays entirely yours.",
      },
      {
        name: "Full Platform (DART Full)",
        stages: ["Instruments & Data", "Research", "Decision", "Execution", "Governance"],
        model: "Bespoke + non-compete",
        desc: "Research and promote on Odum infrastructure. Even then, we do not trade your strategy. Bespoke commercial terms.",
      },
    ],
    note: "Modular engagement, bespoke commercial terms. We are not asking anyone to hand over their edge.",
  },

  // ── Slide 8: Why Can't Someone Just Do This With AI? ──────
  {
    id: 8,
    type: "operations",
    title: "Why Can't Someone Just Do This With AI?",
    columns: [
      {
        title: "Decades Of Trading Experience",
        items: [
          "Team ran trading desks at leading proprietary firms \u2014 making money before Odum",
          "Personally traded options, delta one, HFT, medium-frequency across five asset classes",
          "AI multiplies the judgement of the person directing it",
          "If you do not know what a good fill looks like, AI will not tell you",
        ],
      },
      {
        title: "Accountability Under Pressure",
        items: [
          "Significant drawdown + system built entirely by AI = you cannot debug it",
          "You want to switch off AI and solve things yourself",
          "Requires a team that understands the code, the strategies, and the markets",
          "Not just the prompts",
        ],
      },
      {
        title: "Building vs Operating",
        items: [
          "AI helps build software quickly \u2014 we use it heavily",
          "Operating live trading across five asset classes is a different problem",
          "Venue outages, chain-bridge failures, regulatory reporting, 3am debugging",
          "Operational experience compounds over years \u2014 cannot be prompt-engineered",
        ],
      },
    ],
    callout:
      "We use AI heavily in development and operations \u2014 and believe anyone should. But the system works because experienced humans, with decades at leading trading firms, make the critical decisions.",
    metrics: [
      { value: "5", label: "Asset Classes Traded" },
      { value: "3", label: "Years Operating" },
      { value: "22", label: "Microservices" },
      { value: "24,500+", label: "Automated Tests" },
    ],
  },

  // ── Slide 9: The Next 30 Months ───────────────────────────
  {
    id: 9,
    type: "traction",
    title: "The Next 30 Months",
    achieved: [
      { text: "End Q2 2026 (2 months out)", detail: "" },
      {
        text: "Elysium DeFi go-live (DART Signals-In)",
        detail: "$125K onboarding, $75K upsell path (MEV + Solana + recursive staking).",
      },
      {
        text: "BTC ML directional on own capital",
        detail: "First IM clients June ($500K each, 10-client target).",
      },
      {
        text: "Sports ML live",
        detail: "2 IM clients at $50\u2013100K (capacity-bound).",
      },
      {
        text: "Regulatory Umbrella: Seed + Desmond live",
        detail: "Desmond combines Reg Umbrella with DART Signals-In (perp-funding arb).",
      },
      { text: "AUM: $8\u201310M", detail: "" },
    ],
    inProgress: [
      { text: "End 2026 (8 months out)", detail: "" },
      {
        text: "CME S&P co-invest live (Sept)",
        detail: "$500K client + $50K Odum skin \u2014 asymmetric 70/10, ramping to $5M year-1.",
      },
      {
        text: "India Options live (Oct)",
        detail: "$100K onboarding + $5\u201310M IM allocation (NSE delta).",
      },
      {
        text: "Odum Signals \u2014 2 institutional counterparties",
        detail: "Sept 2026 go-live, ~$5K/mo combined via hybrid pricing.",
      },
      {
        text: "6+ months TR on new strategy families",
        detail: "BTC ML + sports ML + DeFi basis.",
      },
      {
        text: "Annual revenue ~£636K, December cash ~£408K",
        detail: "Revenue-funded \u2014 no bridge capital needed. The £3M raised in 2021 built the stack; the next phase grows from four live revenue lines.",
      },
    ],
    launchReady: [
      { text: "End 2027 → 2028 (20\u201330 months)", detail: "" },
      {
        text: "AUM above $25M (2027)",
        detail: "Institutional allocator threshold.",
      },
      { text: "$100M target (2028)", detail: "18+ month TRs across strategy families." },
      {
        text: "4 DART clients, 6 Regulatory Umbrella clients",
        detail: "Odum Signals to institutional counterparties.",
      },
      {
        text: "9 DART clients, 11 Regulatory Umbrella clients (2028)",
        detail: "Full service portfolio scaled across all four revenue lines.",
      },
    ],
    checkpoint:
      "The path is: demonstrate performance, compound track record, open institutional channels. The system is built. The question is execution and time.",
  },

  // ── Slide 10: Why This Plan Is Realistic ──────────────────
  {
    id: 10,
    type: "doctrine",
    title: "Why This Plan Is Realistic",
    subtitle:
      "This is not a plan from zero. It is a plan from $7.5M with demonstrated performance and four live revenue lines.",
    points: [
      {
        problem: "Starting from zero?",
        solution: "No. $7.5M live, 30%+ returns with 1-year TR (mean reversion) and 5-years (BTC FoF). First DART and Regulatory Umbrella clients onboarded.",
      },
      {
        problem: "Track record takes forever?",
        solution: "Every additional month and every additional strategy makes the next raise easier. We are not starting the clock \u2014 we are compounding an existing one.",
      },
      {
        problem: "Scaling costs scale linearly?",
        solution: "The same 22 microservices that run $7.5M can run $100M. Infrastructure costs scale sub-linearly.",
      },
      {
        problem: "Dependent on IM fees alone?",
        solution: "Four revenue lines: IM performance fees, DART platform revenue, Odum Signals licences, Regulatory Umbrella retainers. Each grows on its own driver.",
      },
      {
        problem: "Needs bridge capital to get there?",
        solution: "No. October 2026 flip to £372K cash. December 2026 £413K. The £3M raised in 2021 funded the infrastructure build. The $7.5M → $25M transition is funded by four live revenue lines — no further external capital is being sought.",
      },
    ],
    conclusion: "The path to $100M is: demonstrate performance, compound track record, open institutional channels. The system is built. The commercial model is proven. The scale lever is track record time.",
  },

  // ── Slide 11: Explore The Public Site ─────────────────────
  {
    id: 11,
    type: "demo",
    title: "Explore The Public Site",
    subtitle:
      "The trajectory narrative \u2014 in context. Forward these to advisors, LPs, and prospects who want the story before the numbers. Access code for the briefings hub is odum-briefings-2026.",
    sections: [
      { name: "Homepage", desc: "Four commercial paths, one regulated operating system", link: "/" },
      { name: "Our Story", desc: "Long-form founder narrative \u2014 why this exists, how we got here", link: "/our-story" },
      { name: "Timeline", desc: "Dated milestones from 2011 desks to FCA to the unified stack", link: "/story" },
      { name: "IM Briefing", desc: "How IM feeds the trajectory \u2014 strategy families, fees, portal", link: "/briefings/investment-management" },
      { name: "DART Briefing", desc: "Platform revenue that funds the business while track records compound", link: "/briefings/platform" },
      { name: "FAQ", desc: "Common objections front-run", link: "/faq" },
    ],
    note: "Public-site links open in a new tab. Briefings hub is gated by the shared access code.",
  },

  // ── Slide 12: See It Live ─────────────────────────────────
  {
    id: 12,
    type: "demo",
    title: "See It Live",
    subtitle: "Walk through any part of the system in demo mode \u2014 representative positions and P&L against a demo persona, never real client capital.",
    sections: [
      {
        name: "Dashboard",
        desc: "Platform overview \u2014 positions, returns, risk, alerts",
        link: "/dashboard",
      },
      {
        name: "Strategy Research",
        desc: "Backtests, comparison, ML analysis",
        link: "/services/research/strategy/overview",
      },
      {
        name: "Instruments & Coverage",
        desc: "12,000+ instruments across all asset classes",
        link: "/services/data/instruments",
      },
      {
        name: "Trading & Positions",
        desc: "Live positions, orders, returns attribution",
        link: "/services/trading/positions",
      },
      {
        name: "Executive Reporting",
        desc: "IBOR, reconciliation, performance",
        link: "/services/reports/executive",
      },
    ],
    note: "Platform links require sign-in (investor@odum-research.com / OdumIR2026!). Same infrastructure running our own capital.",
  },
];
