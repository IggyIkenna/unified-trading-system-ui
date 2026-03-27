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

export function generateTimeSeriesData(
  baseMultiplier: number = 1,
  isBatch: boolean = false,
  dateRange: string = "today",
): { data: Array<Record<string, number | string>>; netPnL: number } {
  const points = dateRange === "today" ? 24 : dateRange === "wtd" ? 7 : dateRange === "mtd" ? 30 : 12;
  const labelFormat =
    dateRange === "today"
      ? (i: number) => `${i}:00`
      : dateRange === "wtd"
        ? (i: number) => ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i % 7]
        : (i: number) => `Day ${i + 1}`;

  const timeframeScale = dateRange === "today" ? 1 : dateRange === "wtd" ? 3.5 : dateRange === "mtd" ? 12 : 1;

  let seed = Math.floor(baseMultiplier * 1000) + (dateRange === "wtd" ? 500 : dateRange === "mtd" ? 1000 : 0);
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  const data: Array<Record<string, number | string>> = [];
  let fundingCumulative = 0;
  let carryCumulative = 0;
  let basisCumulative = 0;

  for (let i = 0; i < points; i++) {
    const progress = (i + 1) / points;
    const driftFactor = 1 + progress * 0.5;

    const fundingBase = (40000 + rand() * 20000) * baseMultiplier * timeframeScale;
    const carryBase = (30000 + rand() * 15000) * baseMultiplier * timeframeScale;
    const basisBase = (15000 + rand() * 10000) * baseMultiplier * timeframeScale;

    fundingCumulative += fundingBase * driftFactor * (0.9 + rand() * 0.2);
    carryCumulative += carryBase * driftFactor * (0.9 + rand() * 0.2);
    basisCumulative += basisBase * driftFactor * (0.9 + rand() * 0.2);

    const delta = (5000 + rand() * 8000) * baseMultiplier * timeframeScale * (0.8 + progress * 0.4);
    const gamma = (2000 + rand() * 5000) * baseMultiplier * timeframeScale * (0.8 + progress * 0.4);
    const rebates = (2000 + rand() * 2000) * baseMultiplier * timeframeScale * (0.9 + progress * 0.2);

    const vega = (-1000 - rand() * 2000) * baseMultiplier * timeframeScale * (0.9 + progress * 0.2);
    const theta = (-1500 - rand() * 2500) * baseMultiplier * timeframeScale * (0.9 + progress * 0.2);
    const slippage = (-4000 - rand() * 3000) * baseMultiplier * timeframeScale * (0.9 + progress * 0.15);
    const fees = (-2500 - rand() * 2000) * baseMultiplier * timeframeScale * (0.9 + progress * 0.15);

    const batchAdjust = isBatch ? 0.92 + rand() * 0.08 : 1;

    data.push({
      time: labelFormat(i),
      Funding: Math.round((fundingCumulative / (i + 1)) * batchAdjust),
      Carry: Math.round((carryCumulative / (i + 1)) * batchAdjust),
      Basis: Math.round((basisCumulative / (i + 1)) * batchAdjust),
      Delta: Math.round(delta * batchAdjust),
      Gamma: Math.round(gamma * batchAdjust),
      Vega: Math.round(vega * batchAdjust),
      Theta: Math.round(theta * batchAdjust),
      Slippage: Math.round(slippage * batchAdjust),
      Fees: Math.round(fees * batchAdjust),
      Rebates: Math.round(rebates * batchAdjust),
    });
  }

  const lastPoint = data[data.length - 1];
  const netPnL = Object.entries(lastPoint)
    .filter(([key]) => key !== "time")
    .reduce((sum, [, val]) => sum + (val as number), 0);

  return { data, netPnL };
}

export function generatePnLComponents(
  orgIds: string[],
  clientIds: string[],
  strategyIds: string[],
  isBatch: boolean,
): PnLComponent[] {
  let multiplier = 1;
  if (orgIds.length > 0) multiplier *= 0.6 + orgIds.length * 0.2;
  if (clientIds.length > 0) multiplier *= 0.5 + clientIds.length * 0.25;
  if (strategyIds.length > 0) multiplier *= 0.3 + strategyIds.length * 0.15;

  const batchAdjust = isBatch ? 0.92 : 1;

  return [
    {
      name: PNL_FACTORS[0].label,
      value: Math.round(412000 * multiplier * batchAdjust),
      percentage: 39.6,
    },
    {
      name: PNL_FACTORS[1].label,
      value: Math.round(355000 * multiplier * batchAdjust),
      percentage: 34.1,
    },
    {
      name: PNL_FACTORS[2].label,
      value: Math.round(188000 * multiplier * batchAdjust),
      percentage: 18.1,
    },
    {
      name: PNL_FACTORS[3].label,
      value: Math.round(61000 * multiplier * batchAdjust),
      percentage: 5.9,
    },
    {
      name: PNL_FACTORS[4].label,
      value: Math.round(24000 * multiplier * batchAdjust),
      percentage: 2.3,
    },
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
    {
      name: PNL_FACTORS[9].label,
      value: Math.round(18000 * multiplier * batchAdjust),
      percentage: 1.7,
    },
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
      client: allClients.find((c) => c.id === s.clientId)?.name || "Unknown",
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
      ? (i: number) => `${i}:00`
      : dateRange === "wtd"
        ? (i: number) => ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i % 7]
        : (i: number) => `Day ${i + 1}`;

  const strategies = allStrategies.slice(0, 5);
  const data: Array<Record<string, string | number>> = [];
  const strategyTotals = strategies.map(() => 0);

  for (let i = 0; i < points; i++) {
    const progress = (i + 1) / points;
    const driftFactor = 1 + progress * 0.4;
    const batchAdjust = isBatch ? 0.94 : 1;

    const point: Record<string, string | number> = { time: labelFormat(i) };

    strategies.forEach((s, idx) => {
      const strategyShare = 0.15 + idx * 0.05;
      const value = (baseValue / points) * strategyShare * driftFactor * (0.8 + rand() * 0.4) * batchAdjust;
      strategyTotals[idx] += value;
      point[s.name] = Math.round(strategyTotals[idx] / (i + 1));
    });

    data.push(point);
  }

  return { data, strategies: strategies.map((s) => s.name) };
}

export function generateClientPnL(
  orgIds: string[],
  clientIds: string[],
  isBatch: boolean,
  allOrgs: OrgRecord[],
  allClients: ClientRecord[],
  allStrategies: StrategyRecord[],
) {
  const clientRows = allClients
    .map((c) => {
      const org = allOrgs.find((o) => o.id === c.orgId);
      const strategies = allStrategies.filter((s) => s.clientId === c.id);

      if (orgIds.length > 0 && !orgIds.includes(c.orgId)) return null;
      if (clientIds.length > 0 && !clientIds.includes(c.id)) return null;

      const rand = makeSeededRand(hashSeed([c.id, "pnl"]));
      const basePnL = strategies.length * 85000 + rand() * 50000;
      const batchAdjust = isBatch ? 0.94 : 1;

      return {
        id: c.id,
        name: c.name,
        org: org?.name || "Unknown",
        pnl: Math.round(basePnL * batchAdjust),
        strategies: strategies.length,
        change: 5 + rand() * 10,
      };
    })
    .filter(Boolean) as Array<{
    id: string;
    name: string;
    org: string;
    pnl: number;
    strategies: number;
    change: number;
  }>;

  return clientRows.slice(0, 5);
}
