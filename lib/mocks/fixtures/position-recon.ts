/**
 * Mock data for Position Reconciliation page (Observe > Position Recon).
 * Represents target vs actual position drift across strategies.
 */

// ── Strategy Allocation Data ────────────────────────────────────────────────

export interface StrategyAllocation {
  strategyId: string;
  strategyName: string;
  shareClass: "ETH" | "BTC" | "USDT";
  targetEquity: number;
  actualEquity: number;
  targetDelta: number;
  actualDelta: number;
  driftPct: number;
  severity: "normal" | "warning" | "critical";
}

export const MOCK_STRATEGY_ALLOCATIONS: StrategyAllocation[] = [
  {
    strategyId: "DEFI_ETH_BASIS_HUF_1H",
    strategyName: "ETH Basis Trade",
    shareClass: "ETH",
    targetEquity: 125000,
    actualEquity: 122500,
    targetDelta: 0.0,
    actualDelta: -0.35,
    driftPct: 2.0,
    severity: "warning",
  },
  {
    strategyId: "CEFI_BTC_MM_EVT_TICK",
    strategyName: "BTC Market Making",
    shareClass: "BTC",
    targetEquity: 100000,
    actualEquity: 99200,
    targetDelta: 0.0,
    actualDelta: 0.12,
    driftPct: 0.8,
    severity: "normal",
  },
  {
    strategyId: "CEFI_ETH_OPT_MM_EVT_TICK",
    strategyName: "ETH Options MM",
    shareClass: "ETH",
    targetEquity: 80000,
    actualEquity: 76400,
    targetDelta: -0.15,
    actualDelta: -0.42,
    driftPct: 4.5,
    severity: "warning",
  },
  {
    strategyId: "DEFI_ETH_YIELD_ARB_HUF_4H",
    strategyName: "ETH Yield Arb",
    shareClass: "USDT",
    targetEquity: 95000,
    actualEquity: 88350,
    targetDelta: 0.0,
    actualDelta: -1.2,
    driftPct: 7.0,
    severity: "critical",
  },
  {
    strategyId: "CEFI_BTC_TREND_HUF_1H",
    strategyName: "BTC Trend Follow",
    shareClass: "BTC",
    targetEquity: 75000,
    actualEquity: 74250,
    targetDelta: 0.5,
    actualDelta: 0.48,
    driftPct: 1.0,
    severity: "normal",
  },
];

// ── KPI Summary ─────────────────────────────────────────────────────────────

export const MOCK_RECON_KPIS = {
  totalEquity: 502800,
  totalTarget: 475000,
  allocatedPct: 94.5,
  unallocatedPct: 5.5,
  worstDriftPct: 7.0,
  activeAlerts: 3,
};

// ── Drift Time Series ───────────────────────────────────────────────────────

export interface DriftTimePoint {
  time: string;
  ethBasis: number;
  btcMM: number;
  ethOptMM: number;
  ethYieldArb: number;
  btcTrend: number;
}

export const MOCK_DRIFT_TIME_SERIES: DriftTimePoint[] = [
  { time: "09:00", ethBasis: 0.5, btcMM: 0.3, ethOptMM: 1.2, ethYieldArb: 2.1, btcTrend: 0.4 },
  { time: "10:00", ethBasis: 0.8, btcMM: 0.4, ethOptMM: 1.8, ethYieldArb: 3.0, btcTrend: 0.6 },
  { time: "11:00", ethBasis: 1.2, btcMM: 0.5, ethOptMM: 2.5, ethYieldArb: 4.2, btcTrend: 0.7 },
  { time: "12:00", ethBasis: 1.5, btcMM: 0.6, ethOptMM: 3.1, ethYieldArb: 5.0, btcTrend: 0.8 },
  { time: "13:00", ethBasis: 1.8, btcMM: 0.7, ethOptMM: 3.8, ethYieldArb: 5.8, btcTrend: 0.9 },
  { time: "14:00", ethBasis: 1.9, btcMM: 0.8, ethOptMM: 4.2, ethYieldArb: 6.5, btcTrend: 1.0 },
  { time: "15:00", ethBasis: 2.0, btcMM: 0.8, ethOptMM: 4.5, ethYieldArb: 7.0, btcTrend: 1.0 },
];

// ── Cost Preview Mock ───────────────────────────────────────────────────────

export interface CostPreview {
  slippageDollars: number;
  slippageBps: number;
  gasDollars: number;
  exchangeFeeDollars: number;
  bridgeFeeDollars: number;
  totalDollars: number;
  totalBps: number;
  durationMinutes: number;
  durationLabel: string;
  impactBps: number;
  confidence: "High" | "Medium" | "Low";
}

export function getMockCostPreview(reductionPct: number, totalExposure: number): CostPreview {
  const notional = totalExposure * (reductionPct / 100);
  const slippageBps = 12 + Math.round(reductionPct / 10);
  const slippageDollars = Math.round(notional * slippageBps / 10000);
  const gasDollars = reductionPct > 50 ? 145 : 95;
  const exchangeFeeDollars = Math.round(notional * 4 / 10000);
  const bridgeFeeDollars = reductionPct > 75 ? 35 : 0;
  const totalDollars = slippageDollars + gasDollars + exchangeFeeDollars + bridgeFeeDollars;
  const totalBps = Math.round(totalDollars / notional * 10000);
  const durationMinutes = reductionPct > 75 ? 25 : reductionPct > 50 ? 18 : 12;
  const impactBps = Math.round(slippageBps * 0.65);

  return {
    slippageDollars,
    slippageBps,
    gasDollars,
    exchangeFeeDollars,
    bridgeFeeDollars,
    totalDollars,
    totalBps,
    durationMinutes,
    durationLabel: `~${durationMinutes} min (TWAP)`,
    impactBps,
    confidence: reductionPct > 75 ? "Medium" : "High",
  };
}

export function getMockFastUnwindCost(totalExposure: number): CostPreview {
  const slippageBps = 55;
  const slippageDollars = Math.round(totalExposure * slippageBps / 10000);
  const gasDollars = 210;
  const exchangeFeeDollars = Math.round(totalExposure * 5 / 10000);
  const bridgeFeeDollars = 45;
  const totalDollars = slippageDollars + gasDollars + exchangeFeeDollars + bridgeFeeDollars;
  const totalBps = Math.round(totalDollars / totalExposure * 10000);

  return {
    slippageDollars,
    slippageBps,
    gasDollars,
    exchangeFeeDollars,
    bridgeFeeDollars,
    totalDollars,
    totalBps,
    durationMinutes: 1,
    durationLabel: "<1 min (Market)",
    impactBps: 45,
    confidence: "Low",
  };
}

export function getMockSlowUnwindCost(totalExposure: number): CostPreview {
  const slippageBps = 15;
  const slippageDollars = Math.round(totalExposure * slippageBps / 10000);
  const gasDollars = 120;
  const exchangeFeeDollars = Math.round(totalExposure * 4 / 10000);
  const bridgeFeeDollars = 0;
  const totalDollars = slippageDollars + gasDollars + exchangeFeeDollars + bridgeFeeDollars;
  const totalBps = Math.round(totalDollars / totalExposure * 10000);

  return {
    slippageDollars,
    slippageBps,
    gasDollars,
    exchangeFeeDollars,
    bridgeFeeDollars,
    totalDollars,
    totalBps,
    durationMinutes: 25,
    durationLabel: "~25 min (TWAP)",
    impactBps: 8,
    confidence: "High",
  };
}
