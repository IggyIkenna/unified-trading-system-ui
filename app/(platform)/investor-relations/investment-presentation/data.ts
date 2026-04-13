// Investment Management Presentation — slide data

export const slides = [
  {
    id: 1,
    type: "cover",
    title: "Investment Management",
    subtitle:
      "Allocate to strategies we already run with our own capital. Co-invest at identical terms \u2014 same infrastructure, same risk controls, same reporting.",
    tagline: "FCA Authorised",
    stats: [
      { value: "$7.5M", label: "Under Management" },
      { value: "30%+", label: "Annualised (Crypto)" },
      { value: "0%", label: "Management Fee" },
      { value: "20-40%", label: "Performance Fee" },
    ],
  },
  {
    id: 2,
    type: "doctrine",
    title: "The Proposition",
    subtitle:
      "Co-invest alongside us at identical terms. Same infrastructure, same strategies, same risk controls. You invest alongside us \u2014 if it is good enough for our money, it should be good enough for yours.",
    points: [
      {
        problem: "How do I know the strategies work?",
        solution:
          "We run $7.5M of our own capital through them. 30%+ annualised on crypto mean reversion.",
      },
      {
        problem: "How do I get transparency?",
        solution:
          "Full investor portal \u2014 10-factor returns waterfall, trade history, compliance reports, settlement tracking.",
      },
      {
        problem: "How are fees aligned?",
        solution:
          "0% management fee. 20\u201340% performance fee above high watermark. We only earn when you earn.",
      },
      {
        problem: "Can I bring my own thesis?",
        solution:
          "Yes \u2014 we backtest, build, and deploy to your specification with managed execution and custom risk parameters.",
      },
    ],
    differentiators: [
      "$7.5M of our own capital through the same strategies \u2014 alignment is structural, not promised",
      "0% management fee, 20\u201340% performance above high watermark \u2014 we only earn when you earn",
      "10-factor returns waterfall, full trade audit trail, monthly reporting \u2014 transparency is the default, not an add-on",
    ],
    conclusion:
      "Co-invest at identical terms as company principals.",
  },
  {
    id: 3,
    type: "traction",
    title: "Live Performance",
    achieved: [
      {
        text: "Crypto mean reversion",
        detail: "$4M under management, 30%+ annualised, 1 year track record. $3.3M at high watermark. Binance and OKX.",
      },
      {
        text: "Bitcoin fund of funds",
        detail: "$3.5M+ under management, 8%+ annualised, 5 year track record.",
      },
      {
        text: "Total under management",
        detail: "$7.5M across two mandates, running through 22 microservices with 24,500+ automated tests.",
      },
    ],
    inProgress: [
      {
        text: "Decentralised finance yield strategies",
        detail: "3 strategies yielding 5\u201320% for first platform client",
      },
      {
        text: "Machine learning directional",
        detail: "Traditional finance \u2014 testing on own capital May, available June 2026",
      },
      {
        text: "Additional strategy families",
        detail: "Options, volatility, sports \u2014 coming through over next 12 months",
      },
    ],
    checkpoint:
      "Every new strategy is tested on our own capital first. Nothing reaches a client that we have not validated with our own money.",
  },
  {
    id: 4,
    type: "strategies",
    title: "Strategy Families \u2014 Risk, Return & Capacity",
    subtitle:
      "Same infrastructure, configurable risk appetite. Lower-yielding strategies carry lower fees.",
    families: [
      {
        name: "Decentralised \u2014 Stable Yield",
        returns: "3\u201312% annual",
        drawdown: "<1%",
        capacity: "$50M\u2013$100M+",
        character: "Lending, stablecoin yield",
        risk: "low",
      },
      {
        name: "Decentralised \u2014 Basis Trades",
        returns: "10\u201330% annual",
        drawdown: "5%",
        capacity: "$5M\u2013$20M",
        character: "Delta-neutral, funding capture",
        risk: "low",
      },
      {
        name: "Decentralised \u2014 Recursive",
        returns: "20\u201350% annual",
        drawdown: "15%",
        capacity: "$5M/pool",
        character: "Recursive staking, liquidity provision",
        risk: "medium",
      },
      {
        name: "Crypto Long/Short ML",
        returns: "30%+",
        drawdown: "5\u201310%",
        capacity: "$2M/pair",
        character: "Machine learning long/short, mean reversion, arbitrage",
        risk: "medium",
      },
      {
        name: "Traditional Finance Quant",
        returns: "12\u201318%",
        drawdown: "8\u201310%",
        capacity: "$5M/name",
        character: "Machine learning directional, options, volatility",
        risk: "medium",
      },
      {
        name: "Sports",
        returns: "50%+",
        drawdown: "20%",
        capacity: "$100K\u2013$1M",
        character: "Machine learning prediction, arbitrage",
        risk: "high",
      },
    ],
    callout:
      "We deploy from $100K to $100M+ depending on the strategy. The infrastructure is the same \u2014 only the configuration changes.",
  },
  {
    id: 5,
    type: "operations",
    title: "Your Investor Portal",
    columns: [
      {
        title: "Portfolio Overview",
        items: [
          "NAV, month-to-date returns, maximum drawdown, Sharpe ratio",
          "Allocation breakdown by strategy and asset class",
          "10-factor returns waterfall \u2014 funding, carry, basis, delta, gamma, vega, theta, slippage, fees, rebates",
        ],
      },
      {
        title: "Trade & Settlement",
        items: [
          "Filterable trade and order records by instrument, venue, strategy",
          "Full audit trail with slippage analysis",
          "Real-time settlement status \u2014 confirming, settled, pending, failed",
          "Account balances, transfers, fee breakdowns",
        ],
      },
      {
        title: "Reports & Compliance",
        items: [
          "On-demand or scheduled reports \u2014 performance, regulatory, executive",
          "Export to spreadsheet",
          "Live versus batch reconciliation with break detection",
          "Best execution documentation",
        ],
      },
    ],
    callout:
      "Institutional-grade reporting \u2014 the same tools tracking our own $7.5M. You see exactly what we see.",
    metrics: [
      { value: "10", label: "Attribution Factors" },
      { value: "0%", label: "Management Fee" },
      { value: "$100K", label: "Minimum Investment" },
      { value: "30 Days", label: "Redemption Notice" },
    ],
  },
  {
    id: 6,
    type: "faq",
    title: "Common Questions",
    subtitle: "",
    questions: [
      {
        q: "What is the fee structure?",
        a: "0% management fee. 20\u201340% performance fee above high watermark, strategy-dependent. Lower-yielding strategies carry lower fees. We only earn when you earn.",
      },
      {
        q: "What are the investor requirements?",
        a: "Professional Client or Eligible Counterparty status. Completed suitability assessment, know-your-client documentation, and signed subscription agreement. Minimum investment $100,000.",
      },
      {
        q: "Can I bring my own investment thesis?",
        a: "Yes. We backtest, build, and deploy the strategy with managed execution, custom risk parameters, and allocation constraints. Your thesis, our engineering and operational capability.",
      },
      {
        q: "Why should I trust you with my capital?",
        a: "Our $7.5M runs through the same strategies you would invest in \u2014 co-investment at identical terms. 0% management fee means we only earn on performance above the high watermark. Full transparency through the investor portal \u2014 10-factor attribution, trade-level audit trail, monthly reporting. Every new strategy is validated on our own capital before reaching a client.",
      },
    ],
  },
  {
    id: 7,
    type: "ask",
    title: "Get Started",
    subtitle:
      "Start with a mandate discussion. Review our reporting and track record before committing capital.",
    asks: [
      {
        title: "Mandate Discussion",
        items: [
          "Risk appetite, asset class preferences, allocation size",
          "Managed discretionary or bring-your-own-thesis",
          "Review our reporting pack \u2014 returns attribution, drawdown analysis, fee modelling",
        ],
      },
      {
        title: "Suitability & Documentation",
        items: [
          "Professional client or eligible counterparty assessment",
          "Know-your-client documentation and subscription agreement",
        ],
      },
      {
        title: "Capital Deployed",
        items: [
          "Allocation live through the same infrastructure as our own capital",
          "Investor portal access from day one",
          "Monthly reporting and full audit trail",
        ],
      },
    ],
    contact: "ikenna@odum-research.com",
  },
  {
    id: 8,
    type: "demo",
    title: "See It Live",
    subtitle: "Walk through the investor portal and reporting tools.",
    sections: [
      {
        name: "Dashboard",
        desc: "Platform overview \u2014 positions, returns, risk, alerts",
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
    note: "All views use the same infrastructure we use for our own capital.",
  },
];
