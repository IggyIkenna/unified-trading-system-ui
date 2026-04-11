export const navHistory = [
  { date: "Jan", nav: 22.1, benchmark: 21.5 },
  { date: "Feb", nav: 22.8, benchmark: 21.8 },
  { date: "Mar", nav: 23.2, benchmark: 22.0 },
  { date: "Apr", nav: 22.9, benchmark: 22.2 },
  { date: "May", nav: 23.8, benchmark: 22.5 },
  { date: "Jun", nav: 24.5, benchmark: 22.8 },
];

export const availableStrategies = [
  {
    id: "arbitrage",
    name: "Crypto Arbitrage",
    aum: 4.2,
    pnl: 312,
    pnlPct: 7.4,
    sharpe: 2.8,
    allocation: 35,
    color: "#4ade80",
  },
  {
    id: "market-making",
    name: "DeFi Market Making",
    aum: 3.1,
    pnl: 198,
    pnlPct: 6.4,
    sharpe: 2.2,
    allocation: 25,
    color: "#60a5fa",
  },
  {
    id: "directional",
    name: "Momentum Long/Short",
    aum: 2.5,
    pnl: 145,
    pnlPct: 5.8,
    sharpe: 1.9,
    allocation: 20,
    color: "#f472b6",
  },
  {
    id: "yield",
    name: "DeFi Yield",
    aum: 1.9,
    pnl: 87,
    pnlPct: 4.6,
    sharpe: 3.1,
    allocation: 15,
    color: "#fbbf24",
  },
  {
    id: "sports",
    name: "Sports Arbitrage",
    aum: 0.6,
    pnl: 42,
    pnlPct: 7.0,
    sharpe: 2.4,
    allocation: 5,
    color: "#94a3b8",
  },
];

export const monthlyPnL = [
  { month: "Jan", pnl: 420, target: 400 },
  { month: "Feb", pnl: 380, target: 400 },
  { month: "Mar", pnl: 510, target: 400 },
  { month: "Apr", pnl: 290, target: 400 },
  { month: "May", pnl: 480, target: 400 },
  { month: "Jun", pnl: 620, target: 400 },
];

export const clientSummary = [
  { name: "Odum Capital", aum: 12.5, pnl: 842, pnlPct: 6.7, status: "active" },
  { name: "Meridian Fund", aum: 8.2, pnl: 512, pnlPct: 6.2, status: "active" },
  { name: "Apex Partners", aum: 5.1, pnl: 198, pnlPct: 3.9, status: "active" },
  {
    name: "Nova Ventures",
    aum: 3.8,
    pnl: -42,
    pnlPct: -1.1,
    status: "warning",
  },
];

export const nlDemoQuestions = [
  "What was the Sharpe of my DeFi basis strategy in Q4 excluding periods when funding rate was below 3%?",
  "Show me the top 3 performing strategies by risk-adjusted return since inception",
  "What is the current drawdown vs max drawdown for each strategy?",
];

export const nlDemoResponse = {
  question: "What was the Sharpe of my DeFi basis strategy in Q4 excluding periods when funding rate was below 3%?",
  answer: `**Analysis: DeFi Basis Strategy Q4 Performance (Funding Rate > 3%)**

The DeFi Basis strategy achieved a **Sharpe ratio of 2.84** during Q4 2025 when filtering for periods where the funding rate exceeded 3%.

**Key Findings:**
- Total trading days in Q4: 92
- Days with funding rate > 3%: 67 (72.8%)
- Annualised return during filtered period: 24.3%
- Annualised volatility: 8.6%
- Maximum drawdown during period: 3.2%

**Comparison:**
- Full Q4 Sharpe (unfiltered): 2.21
- Filtered Sharpe improvement: +28.5%

This confirms that the strategy performs significantly better in high-funding-rate environments, suggesting potential for dynamic position sizing based on funding rate levels.`,
  chartData: [
    { month: "Oct", sharpe: 2.6, funding: 4.2 },
    { month: "Nov", sharpe: 3.1, funding: 5.1 },
    { month: "Dec", sharpe: 2.8, funding: 3.8 },
  ],
};

export type NlDemoResponse = typeof nlDemoResponse;

export const recentDocuments = [
  { name: "Q2 2024 Investor Letter", date: "Jun 30, 2024", type: "PDF" },
  { name: "Monthly Performance Report - June", date: "Jul 5, 2024", type: "PDF" },
  { name: "Risk Committee Presentation", date: "Jun 15, 2024", type: "PPTX" },
  { name: "Strategy Allocation Memo", date: "Jun 1, 2024", type: "PDF" },
];
