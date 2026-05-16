import { PNL_FACTORS } from "@/lib/reference-data";
import type { ClientRecord, OrgRecord, PnLComponent, StrategyRecord } from "@/lib/types/pnl";

function makeSeededRand(seed: number) {
  let s = seed % 233280;
  if (s <= 0) s = 12345;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function hashSeed(parts: string[]): number {
  let h = 0;
  for (const p of parts) {
    for (let i = 0; i < p.length; i++) {
      h = (h << 5) - h + p.charCodeAt(i);
      h |= 0;
    }
  }
  return Math.abs(h) + 1;
}

// ---------------------------------------------------------------------------
// Per-point base values per factor (hourly increments for "today").
// WTD/MTD timeframes scale these up proportionally.
// All positive factors accumulate upward; negative factors accumulate downward.
// This ensures the time series chart is balanced and readable.
// ---------------------------------------------------------------------------
const FACTOR_INCREMENTS = {
  // Positive factors — intraday hourly P&L contributions
  Funding: { base: 2800, variance: 1200 }, // largest driver ~67k/day
  Carry: { base: 2000, variance: 900 }, // ~48k/day
  Basis: { base: 1100, variance: 500 }, // ~26k/day
  Delta: { base: 550, variance: 350 }, // variable, ~13k/day
  Gamma: { base: 220, variance: 180 }, // ~5k/day
  Rebates: { base: 130, variance: 80 }, // ~3k/day

  // Negative factors — costs that accumulate downward
  Vega: { base: -180, variance: -120 }, // ~-4k/day
  Theta: { base: -300, variance: -150 }, // ~-7k/day
  Slippage: { base: -480, variance: -200 }, // ~-11k/day
  Fees: { base: -220, variance: -100 }, // ~-5k/day
} as const;

export function generateTimeSeriesData(
  baseMultiplier: number = 1,
  isBatch: boolean = false,
  dateRange: string = "today",
): { data: Array<Record<string, number | string>>; netPnL: number } {
  const points = dateRange === "today" ? 24 : dateRange === "wtd" ? 7 : dateRange === "mtd" ? 30 : 12;

  const labelFormat =
    dateRange === "today"
      ? (i: number) => `${String(i).padStart(2, "0")}:00`
      : dateRange === "wtd"
        ? (i: number) => ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i % 7]
        : (i: number) => `Day ${i + 1}`;

  // Scale hourly increments to the chosen timeframe so end-of-period totals are consistent
  const timeframeScale =
    dateRange === "today"
      ? 1
      : dateRange === "wtd"
        ? 8 // 8 trading hours/day × 7 days
        : dateRange === "mtd"
          ? 8
          : 8;

  let seed = Math.floor(baseMultiplier * 1000) + (dateRange === "wtd" ? 700 : dateRange === "mtd" ? 1400 : 0);

  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  const batchAdjust = isBatch ? 0.94 : 1;

  // Accumulators for each factor
  let funding = 0,
    carry = 0,
    basis = 0,
    delta = 0,
    gamma = 0,
    rebates = 0;
  let vega = 0,
    theta = 0,
    slippage = 0,
    fees = 0;

  const data: Array<Record<string, number | string>> = [];

  for (let i = 0; i < points; i++) {
    // Slight upward drift in positive factors as the day progresses (typical trading pattern)
    const progressDrift = 1 + (i / points) * 0.3;

    funding +=
      (FACTOR_INCREMENTS.Funding.base + rand() * Math.abs(FACTOR_INCREMENTS.Funding.variance)) *
      baseMultiplier *
      timeframeScale *
      progressDrift;
    carry +=
      (FACTOR_INCREMENTS.Carry.base + rand() * Math.abs(FACTOR_INCREMENTS.Carry.variance)) *
      baseMultiplier *
      timeframeScale *
      progressDrift;
    basis +=
      (FACTOR_INCREMENTS.Basis.base + rand() * Math.abs(FACTOR_INCREMENTS.Basis.variance)) *
      baseMultiplier *
      timeframeScale *
      progressDrift;
    // Delta can be volatile (market direction changes)
    const deltaSign = rand() > 0.25 ? 1 : -1;
    delta +=
      deltaSign *
      (FACTOR_INCREMENTS.Delta.base + rand() * Math.abs(FACTOR_INCREMENTS.Delta.variance)) *
      baseMultiplier *
      timeframeScale;
    gamma +=
      (FACTOR_INCREMENTS.Gamma.base + rand() * Math.abs(FACTOR_INCREMENTS.Gamma.variance)) *
      baseMultiplier *
      timeframeScale;
    rebates +=
      (FACTOR_INCREMENTS.Rebates.base + rand() * Math.abs(FACTOR_INCREMENTS.Rebates.variance)) *
      baseMultiplier *
      timeframeScale;

    // Negative factors — costs accumulate steadily downward
    vega +=
      (FACTOR_INCREMENTS.Vega.base - rand() * Math.abs(FACTOR_INCREMENTS.Vega.variance)) *
      baseMultiplier *
      timeframeScale;
    theta +=
      (FACTOR_INCREMENTS.Theta.base - rand() * Math.abs(FACTOR_INCREMENTS.Theta.variance)) *
      baseMultiplier *
      timeframeScale;
    slippage +=
      (FACTOR_INCREMENTS.Slippage.base - rand() * Math.abs(FACTOR_INCREMENTS.Slippage.variance)) *
      baseMultiplier *
      timeframeScale;
    fees +=
      (FACTOR_INCREMENTS.Fees.base - rand() * Math.abs(FACTOR_INCREMENTS.Fees.variance)) *
      baseMultiplier *
      timeframeScale;

    data.push({
      time: labelFormat(i),
      Funding: Math.round(funding * batchAdjust),
      Carry: Math.round(carry * batchAdjust),
      Basis: Math.round(basis * batchAdjust),
      Delta: Math.round(delta * batchAdjust),
      Gamma: Math.round(gamma * batchAdjust),
      Rebates: Math.round(rebates * batchAdjust),
      Vega: Math.round(vega * batchAdjust),
      Theta: Math.round(theta * batchAdjust),
      Slippage: Math.round(slippage * batchAdjust),
      Fees: Math.round(fees * batchAdjust),
    });
  }

  const last = data[data.length - 1];
  const netPnL = Object.entries(last)
    .filter(([key]) => key !== "time")
    .reduce((sum, [, val]) => sum + (val as number), 0);

  return { data, netPnL };
}

export function generatePnLComponents(
  orgIds: readonly string[],
  clientIds: readonly string[],
  strategyIds: readonly string[],
  isBatch: boolean,
): PnLComponent[] {
  let multiplier = 1;
  if (orgIds.length > 0) multiplier *= 0.6 + orgIds.length * 0.2;
  if (clientIds.length > 0) multiplier *= 0.5 + clientIds.length * 0.25;
  if (strategyIds.length > 0) multiplier *= 0.3 + strategyIds.length * 0.15;

  const batchAdjust = isBatch ? 0.92 : 1;

  return [
    { name: PNL_FACTORS[0].label, value: Math.round(412000 * multiplier * batchAdjust), percentage: 39.6 },
    { name: PNL_FACTORS[1].label, value: Math.round(355000 * multiplier * batchAdjust), percentage: 34.1 },
    { name: PNL_FACTORS[2].label, value: Math.round(188000 * multiplier * batchAdjust), percentage: 18.1 },
    { name: PNL_FACTORS[3].label, value: Math.round(61000 * multiplier * batchAdjust), percentage: 5.9 },
    { name: PNL_FACTORS[4].label, value: Math.round(24000 * multiplier * batchAdjust), percentage: 2.3 },
    {
      name: PNL_FACTORS[5].label,
      value: Math.round(-8000 * multiplier * batchAdjust),
      percentage: -0.8,
      isNegative: true,
    },
    {
      name: PNL_FACTORS[6].label,
      value: Math.round(-12000 * multiplier * batchAdjust),
      percentage: -1.2,
      isNegative: true,
    },
    {
      name: PNL_FACTORS[7].label,
      value: Math.round(-61000 * multiplier * batchAdjust),
      percentage: -5.9,
      isNegative: true,
    },
    {
      name: PNL_FACTORS[8].label,
      value: Math.round(-44000 * multiplier * batchAdjust),
      percentage: -4.2,
      isNegative: true,
    },
    { name: PNL_FACTORS[9].label, value: Math.round(18000 * multiplier * batchAdjust), percentage: 1.7 },
  ];
}

export function generateStrategyBreakdown(
  factorName: string,
  totalValue: number,
  isBatch: boolean,
  allStrategies: StrategyRecord[],
  allClients: ClientRecord[],
) {
  const rand = makeSeededRand(hashSeed([factorName, String(totalValue)]));
  const strategies = allStrategies.slice(0, 6);
  const parts: number[] = [];
  let remaining = totalValue;

  strategies.forEach((_, i) => {
    if (i === strategies.length - 1) {
      parts.push(remaining);
    } else {
      const portion = remaining * (0.2 + rand() * 0.3);
      parts.push(portion);
      remaining -= portion;
    }
  });

  const batchAdjust = isBatch ? 0.94 : 1;

  return strategies
    .map((s, i) => ({
      id: s.id,
      name: s.name,
      client: allClients.find((c) => c.id === s.clientId)?.name ?? "Unknown",
      value: Math.round(parts[i] * batchAdjust),
      percentage: (parts[i] / totalValue) * 100,
    }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
}

export function generateFactorTimeSeries(
  factorName: string,
  baseValue: number,
  dateRange: string,
  isBatch: boolean,
  allStrategies: StrategyRecord[],
) {
  const rand = makeSeededRand(hashSeed([factorName, dateRange, String(baseValue)]));
  const points = dateRange === "today" ? 24 : dateRange === "wtd" ? 7 : dateRange === "mtd" ? 30 : 12;

  const labelFormat =
    dateRange === "today"
      ? (i: number) => `${String(i).padStart(2, "0")}:00`
      : dateRange === "wtd"
        ? (i: number) => ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i % 7]
        : (i: number) => `Day ${i + 1}`;

  const strategies = allStrategies.slice(0, 5);
  const data: Array<Record<string, string | number>> = [];
  const strategyAccumulators = strategies.map(() => 0);

  for (let i = 0; i < points; i++) {
    const progress = (i + 1) / points;
    const driftFactor = 1 + progress * 0.4;
    const batchAdjust = isBatch ? 0.94 : 1;
    const point: Record<string, string | number> = { time: labelFormat(i) };

    strategies.forEach((s, idx) => {
      const strategyShare = 0.15 + idx * 0.05;
      const increment = (baseValue / points) * strategyShare * driftFactor * (0.8 + rand() * 0.4) * batchAdjust;
      strategyAccumulators[idx] += increment;
      point[s.name] = Math.round(strategyAccumulators[idx]);
    });

    data.push(point);
  }

  return { data, strategies: strategies.map((s) => s.name) };
}

// ---------------------------------------------------------------------------
// Client PnL generator — falls back to rich static mock when API is empty
// ---------------------------------------------------------------------------

const FALLBACK_CLIENT_PNL = [
  { id: "cl-alpha", name: "Nexus Capital", org: "Nexus Group", strategies: 4, basePnL: 487200 },
  { id: "cl-beta", name: "Orion Trading", org: "Orion Partners", strategies: 3, basePnL: 342100 },
  { id: "cl-gamma", name: "Meridian Fund", org: "Nexus Group", strategies: 5, basePnL: 298750 },
  { id: "cl-delta", name: "Apex Strategies", org: "Apex Holdings", strategies: 2, basePnL: 189400 },
  { id: "cl-epsilon", name: "Stellar Arbitrage", org: "Stellar Group", strategies: 3, basePnL: 156300 },
];

export function generateClientPnL(
  orgIds: readonly string[],
  clientIds: readonly string[],
  isBatch: boolean,
  allOrgs: OrgRecord[],
  allClients: ClientRecord[],
  allStrategies: StrategyRecord[],
) {
  const batchAdjust = isBatch ? 0.94 : 1;

  // Use API data if available, otherwise fall back to rich static mock
  const useApiData = allClients.length > 0;

  if (!useApiData) {
    return FALLBACK_CLIENT_PNL.filter((c) => {
      if (clientIds.length > 0 && !clientIds.includes(c.id)) return false;
      return true;
    }).map((c) => {
      const rand = makeSeededRand(hashSeed([c.id, "pnl-fallback"]));
      return {
        id: c.id,
        name: c.name,
        org: c.org,
        pnl: Math.round(c.basePnL * batchAdjust * (0.92 + rand() * 0.16)),
        strategies: c.strategies,
        change: +(4 + rand() * 12).toFixed(2),
      };
    });
  }

  return allClients
    .map((c) => {
      const org = allOrgs.find((o) => o.id === c.orgId);
      const strategies = allStrategies.filter((s) => s.clientId === c.id);

      if (orgIds.length > 0 && !orgIds.includes(c.orgId)) return null;
      if (clientIds.length > 0 && !clientIds.includes(c.id)) return null;

      const rand = makeSeededRand(hashSeed([c.id, "pnl"]));
      const basePnL = strategies.length * 85000 + rand() * 50000;

      return {
        id: c.id,
        name: c.name,
        org: org?.name ?? "Unknown",
        pnl: Math.round(basePnL * batchAdjust),
        strategies: strategies.length,
        change: +(5 + rand() * 10).toFixed(2),
      };
    })
    .filter(Boolean)
    .slice(0, 5) as Array<{ id: string; name: string; org: string; pnl: number; strategies: number; change: number }>;
}
