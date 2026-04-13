// Plan & Longevity Presentation — slide data

export const slides = [
  {
    id: 1,
    type: "cover",
    title: "The Path to $100M",
    subtitle:
      "Strategy availability, service readiness, and capital growth \u2014 the plan for the next 30 months.",
    tagline: "FCA Authorised",
    stats: [
      { value: "$7.5M", label: "Today" },
      { value: "$10M+", label: "End 2026" },
      { value: "$25M+", label: "End 2027" },
      { value: "$100M", label: "End 2028" },
    ],
  },
  {
    id: 2,
    type: "doctrine",
    title: "Why Breadth Exists",
    subtitle:
      "We cannot build and scale every strategy ourselves. We do not have the manpower, the capital, or the distribution network. The breadth exists to power three things.",
    points: [
      {
        problem: "We cannot trade everything ourselves",
        solution:
          "Breadth powers investment management \u2014 we pick strategies, trade our capital, and partition away our alpha",
      },
      {
        problem: "Clients want infrastructure, not just returns",
        solution:
          "Same breadth powers bespoke white-label \u2014 clients get access to the infrastructure we trade on",
      },
      {
        problem: "Track record takes time to build",
        solution:
          "Platform revenue (bespoke builds) funds the business while track records compound",
      },
      {
        problem: "Our research has value beyond our own trading",
        solution:
          "Signal leasing \u2014 we send strategy signals to institutional counterparties without sharing any methodology or intellectual property",
      },
      {
        problem: "Scaling requires distribution we do not have yet",
        solution:
          "Advisory network and partnerships provide distribution into institutional channels",
      },
    ],
    differentiators: [
      "We built this for ourselves first \u2014 good enough for our capital, good enough for yours",
      "We will never front-run a client or build strategies that overlap with theirs",
      "Nothing goes through that we would not trust with our own money",
    ],
    conclusion:
      "The investment management side grows through track record. The platform side grows through client deployments. Signal leasing monetises our research without sharing methodology. All three run on the same foundation.",
  },
  {
    id: 3,
    type: "trajectory",
    title: "From $7.5M to $100M",
    subtitle:
      "Capital follows demonstrated performance. Each stage is unlocked by track record.",
    milestones: [
      {
        date: "Now",
        value: "$7.5M",
        detail:
          "Crypto mean reversion (30%+ annualised, 1 year track record) + Bitcoin fund of funds (5 year track record)",
        active: true,
      },
      {
        date: "End 2026",
        value: "$10M+",
        detail:
          "2 platform clients, 3 regulatory coverage clients, signal leasing to 2 institutional counterparties (in active conversations)",
      },
      {
        date: "End 2027",
        value: "$25M+",
        detail:
          "4 platform clients, 6 regulatory coverage clients, signal leasing expanded, institutional allocators engaged",
      },
      {
        date: "End 2028",
        value: "$100M",
        detail:
          "9 platform clients, 11 regulatory coverage clients, signal leasing revenue stream established",
      },
    ],
    callout:
      "The unlock at each stage is track record. Every month of live trading compounds our ability to raise.",
  },
  {
    id: 4,
    type: "timeline-matrix",
    title: "When Each Strategy Becomes Available",
    subtitle:
      "From internal testing through investment management to client deployment.",
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
        name: "Decentralised finance yield",
        statuses: ["testing", "live", "live", "live", "live", "live"],
      },
      {
        name: "Machine learning directional",
        statuses: ["", "testing", "live", "live", "live", "live"],
      },
      {
        name: "Sports prediction",
        statuses: ["", "testing", "available", "available", "available", "available"],
      },
      {
        name: "Options / volatility",
        statuses: ["", "", "", "testing", "live", "live"],
      },
      {
        name: "High frequency / market making",
        statuses: ["", "", "", "", "testing", "live"],
      },
    ],
  },
  {
    id: 5,
    type: "breadth-matrix",
    title: "What Is Available When, by Service",
    subtitle:
      "Data and research are always first. Internal testing next. Then investment management. Then bespoke builds.",
    columns: [
      "Internal Testing",
      "Investment Management",
      "Platform / Bespoke",
      "Data & Research",
    ],
    rows: [
      {
        asset: "Crypto mean reversion",
        color: "green",
        cells: ["Done", "Live now", "Available now", "Available now"],
      },
      {
        asset: "Bitcoin fund of funds",
        color: "green",
        cells: ["Done", "Live now", "N/A (fund structure)", "Available now"],
      },
      {
        asset: "Decentralised finance yield",
        color: "violet",
        cells: [
          "Now",
          "May 2026",
          "May 2026 (first client)",
          "Available now",
        ],
      },
      {
        asset: "Machine learning directional",
        color: "cyan",
        cells: ["May 2026", "June 2026", "June 2026", "Available now"],
      },
      {
        asset: "Sports prediction",
        color: "amber",
        cells: ["May 2026", "June 2026", "Q3 2026", "Available now"],
      },
      {
        asset: "Options / volatility",
        color: "cyan",
        cells: ["Q3 2026", "Q4 2026", "Q4 2026", "Q3 2026"],
      },
      {
        asset: "High frequency / market making",
        color: "green",
        cells: ["Q4 2026", "Q2 2027", "Q2 2027", "Q4 2026"],
      },
    ],
  },
  {
    id: 6,
    type: "doctrine",
    title: "What We Keep, What We Share",
    subtitle:
      "We partition strategies into two categories. The infrastructure is shared. The alpha is not.",
    points: [
      {
        problem: "Internal alpha",
        solution:
          "Strategies we run for our own investment management. Proprietary. Signal logic, feature weights, parameters never shared.",
      },
      {
        problem: "Bespoke client strategies",
        solution:
          "Built on the same infrastructure, but to the client\u2019s requirements. We do not trade the client\u2019s strategy ourselves.",
      },
    ],
    differentiators: [
      "Enough strategy families to allocate some internally and still build for clients without conflict",
      "Bespoke commercial terms \u2014 profit shares, retainers, subscriptions tailored to the engagement",
      "Client strategies stay with the client \u2014 if they leave, they can take the logic",
    ],
    conclusion: "The infrastructure is shared. The alpha is not.",
  },
  {
    id: 7,
    type: "packaging",
    title: "You Do Not Have to Give Us Anything",
    subtitle:
      "The platform is modular. Engage at whatever level you are comfortable with.",
    services: [
      {
        name: "Just Data",
        stages: ["Instruments & Data"],
        model: "Subscription",
        desc: "Normalised feeds across all five asset classes. We never see your signals.",
      },
      {
        name: "Just Execution",
        stages: ["Execution"],
        model: "Per-trade or subscription",
        desc: "Plug your own signals into our execution layer. We route and fill. We do not see the logic behind your orders.",
      },
      {
        name: "Just Research",
        stages: ["Research"],
        model: "Compute credits",
        desc: "Use our backtesting environment. Take your results and execute elsewhere if you want.",
      },
      {
        name: "Just Reporting",
        stages: ["Governance"],
        model: "Subscription",
        desc: "Client reporting and compliance tools. Your strategy stays entirely yours.",
      },
      {
        name: "Full Platform",
        stages: [
          "Instruments & Data",
          "Research",
          "Decision",
          "Execution",
          "Governance",
        ],
        model: "Bespoke",
        desc: "Run everything on our infrastructure. Even then, we do not trade your strategy. Commercial terms are bespoke.",
      },
    ],
    note: "The engagement is modular and the commercial terms are bespoke. We are not asking anyone to hand over their edge.",
  },
  {
    id: 8,
    type: "operations",
    title: "Why Can\u2019t Someone Just Do This With AI?",
    columns: [
      {
        title: "Decades of Trading Experience",
        items: [
          "Team with decades of experience at large trading institutions \u2014 making money before Odum existed",
          "Personally traded options, delta one, high frequency, medium frequency across all five asset classes",
          "AI multiplies the judgement of the person directing it",
          "If you do not know what a good fill looks like, AI will not tell you",
        ],
      },
      {
        title: "Accountability Under Pressure",
        items: [
          "Significant drawdown + system built entirely by AI = you cannot debug it",
          "You want to be able to switch off AI and solve things yourself",
          "Requires a team that understands the code, the strategies, and the markets",
          "Not just the prompts",
        ],
      },
      {
        title: "Building vs Operating",
        items: [
          "AI can help build software quickly",
          "Operating live trading across five asset classes is different",
          "Venue outages, position reconciliation across chains, regulatory reporting",
          "Operational experience compounds over years \u2014 you cannot prompt-engineer it",
        ],
      },
    ],
    callout:
      "We use AI heavily in development and operations \u2014 and believe anyone should. But the system works because there are experienced humans, with decades at large trading institutions, making the critical decisions.",
    metrics: [
      { value: "5", label: "Asset Classes Traded" },
      { value: "3", label: "Years Operating" },
      { value: "22", label: "Microservices" },
      { value: "24,500+", label: "Automated Tests" },
    ],
  },
  {
    id: 9,
    type: "traction",
    title: "The Next 30 Months",
    achieved: [
      { text: "End of Q2 2026", detail: "(2 months)" },
      {
        text: "Decentralised finance platform client live",
        detail: "$125K contract revenue (75% received), growing to $250K+ annual revenue",
      },
      {
        text: "Machine learning strategies on own capital",
        detail: "Traditional finance + sports",
      },
      {
        text: "Regulatory coverage pipeline converting",
        detail: "3 prospects",
      },
      { text: "Capital under management: $8\u201310M", detail: "" },
    ],
    inProgress: [
      { text: "End of 2026", detail: "(8 months)" },
      {
        text: "Capital north of $10M",
        detail: "Multiple strategy families live",
      },
      {
        text: "Options and execution available",
        detail: "Full algo suite refined",
      },
      {
        text: "6+ months track record on new strategy families",
        detail: "On 4 strategy families",
      },
      { text: "2 platform clients live, 3 regulatory coverage clients", detail: "" },
    ],
    launchReady: [
      { text: "End of 2027 \u2192 2028", detail: "(20\u201330 months)" },
      {
        text: "Capital above $25M (2027)",
        detail: "Institutional allocator threshold",
      },
      { text: "$100M target (2028)", detail: "18+ month track records" },
      {
        text: "4 platform clients, 6 regulatory coverage clients",
        detail: "Signal leasing to institutional counterparties",
      },
      {
        text: "9 platform clients, 11 regulatory coverage clients (2028)",
        detail: "Full service portfolio scaled across all three revenue lines",
      },
    ],
    checkpoint:
      "The path is: demonstrate performance, compound track record, open institutional channels. The system is built. The question is execution and time.",
  },
  {
    id: 10,
    type: "doctrine",
    title: "Why This Plan Is Realistic",
    subtitle:
      "This is not a plan from zero. It is a plan from seven and a half million with demonstrated performance.",
    points: [
      {
        problem: "Starting from zero?",
        solution:
          "No \u2014 $7.5M live, 30%+ returns with 1 year track record (mean reversion) and 5 years (Bitcoin fund of funds), first platform sold, first regulatory coverage client onboarded",
      },
      {
        problem: "Track record takes forever?",
        solution:
          "We already have a 1 year track record on mean reversion and 5 years on Bitcoin fund of funds. Every additional month and every additional strategy makes the next capital raise easier",
      },
      {
        problem: "Scaling costs scale linearly?",
        solution:
          "The same 22 microservices that run $7.5M can run $100M. Infrastructure costs scale sub-linearly",
      },
      {
        problem: "Dependent on investment management fees alone?",
        solution:
          "Platform revenue ($125K contract, growing to $250K+ annual) funds the business while track records compound",
      },
    ],
    conclusion:
      "The path to a hundred million is: demonstrate performance, compound track record, open institutional channels.",
  },
  {
    id: 11,
    type: "demo",
    title: "See It Live",
    subtitle: "Walk through any part of the system.",
    sections: [
      {
        name: "Dashboard",
        desc: "Platform overview \u2014 positions, returns, risk, alerts",
        link: "/dashboard",
      },
      {
        name: "Strategy Research",
        desc: "Backtests, strategy comparison, machine learning analysis",
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
    ],
    note: "All views use the same infrastructure we use for our own capital.",
  },
];
