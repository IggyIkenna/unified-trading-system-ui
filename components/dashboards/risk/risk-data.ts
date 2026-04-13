// Mock data — risk dashboard
export const riskSummary = {
  overallStatus: "moderate",
  varUtilization: 72,
  exposureLimit: 85,
  activeBreaches: 2,
  pendingReviews: 5,
};

export const varMetrics = {
  current: 12400000,
  limit: 18000000,
  percentile95: 14200000,
  percentile99: 16800000,
  historicalMax: 15600000,
  // CVaR / Expected Shortfall - average loss beyond VaR threshold
  cvar95: 17800000, // Expected loss given VaR 95% is breached
  cvar99: 21200000, // Expected loss given VaR 99% is breached
  // Component VaR by instrument
  componentVaR: [
    {
      instrument: "BTC",
      var95: 5200000,
      marginalVaR: 4800000,
      contributionPct: 36.6,
    },
    {
      instrument: "ETH",
      var95: 3800000,
      marginalVaR: 3500000,
      contributionPct: 26.8,
    },
    {
      instrument: "SOL",
      var95: 1900000,
      marginalVaR: 1750000,
      contributionPct: 13.4,
    },
    {
      instrument: "Options",
      var95: 2100000,
      marginalVaR: 1950000,
      contributionPct: 14.8,
    },
    {
      instrument: "Other",
      var95: 1200000,
      marginalVaR: 1100000,
      contributionPct: 8.4,
    },
  ],
};

export const greeksData = {
  portfolio: {
    delta: 2450000,
    gamma: 125000,
    vega: 89000,
    theta: -12500,
    rho: 34000,
  },
  byAsset: [
    {
      asset: "BTC",
      delta: 1200000,
      gamma: 85000,
      vega: 45000,
      theta: -8000,
      rho: 15000,
    },
    {
      asset: "ETH",
      delta: 850000,
      gamma: 32000,
      vega: 28000,
      theta: -3200,
      rho: 12000,
    },
    {
      asset: "SOL",
      delta: 280000,
      gamma: 5500,
      vega: 12000,
      theta: -900,
      rho: 4500,
    },
    {
      asset: "AVAX",
      delta: 120000,
      gamma: 2500,
      vega: 4000,
      theta: -400,
      rho: 2500,
    },
  ],
};

export const stressScenarios = [
  {
    scenario: "BTC -20%",
    impact: -28500000,
    portfolioDrawdown: -8.2,
    probability: "Low",
    status: "pass",
  },
  {
    scenario: "ETH -30%",
    impact: -18200000,
    portfolioDrawdown: -5.4,
    probability: "Low",
    status: "pass",
  },
  {
    scenario: "Crypto Crash (-50%)",
    impact: -62000000,
    portfolioDrawdown: -18.1,
    probability: "Very Low",
    status: "warning",
  },
  {
    scenario: "Liquidity Crisis",
    impact: -35000000,
    portfolioDrawdown: -10.2,
    probability: "Low",
    status: "warning",
  },
  {
    scenario: "Rate Spike +2%",
    impact: -8500000,
    portfolioDrawdown: -2.5,
    probability: "Medium",
    status: "pass",
  },
  {
    scenario: "Correlation Spike",
    impact: -22000000,
    portfolioDrawdown: -6.4,
    probability: "Low",
    status: "pass",
  },
];

export const limitBreaches = [
  {
    id: "BR-001",
    type: "Drawdown Limit",
    strategy: "Basis Trading",
    severity: "high",
    breachValue: "5.2%",
    limitValue: "5.0%",
    time: "4 hours ago",
    status: "active",
  },
  {
    id: "BR-002",
    type: "Position Limit",
    strategy: "Alpha Momentum",
    severity: "medium",
    breachValue: "$67.2M",
    limitValue: "$60M",
    time: "6 hours ago",
    status: "action-required",
  },
  {
    id: "BR-003",
    type: "Concentration",
    strategy: "N/A",
    severity: "low",
    breachValue: "21.3%",
    limitValue: "20%",
    time: "1 day ago",
    status: "monitoring",
  },
];

export const riskLimits = [
  {
    name: "Portfolio VaR (95%)",
    current: 14200000,
    limit: 18000000,
    status: "ok",
  },
  {
    name: "CVaR / ES (95%)",
    current: 17800000,
    limit: 22000000,
    status: "ok",
    tooltip: "Expected Shortfall: avg loss when VaR is breached",
  },
  { name: "Delta Exposure", current: 2450000, limit: 5000000, status: "ok" },
  {
    name: "Single Asset Conc.",
    current: 28,
    limit: 30,
    unit: "%",
    status: "warning",
  },
  { name: "Gross Leverage", current: 1.8, limit: 3.0, unit: "x", status: "ok" },
  {
    name: "Max Drawdown",
    current: 4.2,
    limit: 5.0,
    unit: "%",
    status: "warning",
  },
  {
    name: "Margin Utilization",
    current: 82,
    limit: 85,
    unit: "%",
    status: "warning",
  },
];
