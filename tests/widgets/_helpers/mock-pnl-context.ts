import { vi } from "vitest";

import type { ShareClass } from "@/lib/types/defi";
import type { ClientPnLRow, FactorDrilldown, PnLComponent } from "@/lib/types/pnl";

/**
 * Minimal factory for the shape usePnLData() returns. Keeps the surface lean
 * so tests don't break when unrelated PnLData fields are added.
 *
 * Covers the fields read by:
 *   - pnl-waterfall-widget.tsx
 *   - pnl-time-series-widget.tsx
 *   - pnl-factor-drilldown-widget.tsx
 *
 * See components/widgets/pnl/pnl-data-context.tsx for the real provider.
 */

export interface MockDeFiPnLCategory {
  name: string;
  value: number;
  color: string;
}

export interface MockPnLDataOverrides {
  pnlComponents?: PnLComponent[];
  structuralPnL?: PnLComponent[];
  residualPnL?: PnLComponent;
  netPnL?: number;
  clientPnL?: ClientPnLRow[];
  timeSeriesData?: Array<Record<string, number | string>>;
  timeSeriesNetPnL?: number;
  dataMode?: "live" | "batch";
  dateRange?: string;
  groupBy?: string;
  shareClass?: ShareClass | "all";
  selectedFactor?: string | null;
  selectedFactorData?: FactorDrilldown | null;
  selectedOrgIds?: string[];
  selectedClientIds?: string[];
  selectedStrategyIds?: string[];
  isResidualAlert?: boolean;
  residualThresholdPct?: number;
  isLoading?: boolean;
  defiPnlAttribution?: MockDeFiPnLCategory[];
  defiPnlNet?: number;
  backtestVsLive?: Array<Record<string, number | string>>;
  setDataMode?: ReturnType<typeof vi.fn>;
  setDateRange?: ReturnType<typeof vi.fn>;
  setGroupBy?: ReturnType<typeof vi.fn>;
  setShareClass?: ReturnType<typeof vi.fn>;
  setSelectedFactor?: ReturnType<typeof vi.fn>;
  setSelectedOrgIds?: ReturnType<typeof vi.fn>;
  setSelectedClientIds?: ReturnType<typeof vi.fn>;
  setSelectedStrategyIds?: ReturnType<typeof vi.fn>;
}

const DEFAULT_STRUCTURAL: PnLComponent[] = [
  { name: "Realized", value: 60000, percentage: 60, category: "structural" },
  { name: "Unrealized", value: 40000, percentage: 40, category: "structural" },
];

const DEFAULT_FACTORS: PnLComponent[] = [
  { name: "Funding", value: 35000, percentage: 34.8, isNegative: false, category: "factor" },
  { name: "Carry", value: 30000, percentage: 30.0, isNegative: false, category: "factor" },
  { name: "Basis", value: 16000, percentage: 15.9, isNegative: false, category: "factor" },
  { name: "Delta", value: 12000, percentage: 11.9, isNegative: false, category: "factor" },
  { name: "Slippage", value: -2000, percentage: -2.0, isNegative: true, category: "factor" },
  { name: "Fees", value: -800, percentage: -0.8, isNegative: true, category: "factor" },
];

const DEFAULT_RESIDUAL: PnLComponent = {
  name: "Residual",
  value: 1200,
  percentage: 1.2,
  category: "diagnostic",
};

const DEFAULT_TIME_SERIES: Array<Record<string, number | string>> = [
  { time: "10:00", Funding: 1000, Carry: 800, Basis: 600, Delta: 400, Slippage: -100, Fees: -50 },
  { time: "11:00", Funding: 2100, Carry: 1700, Basis: 1200, Delta: 800, Slippage: -200, Fees: -110 },
  { time: "12:00", Funding: 3200, Carry: 2500, Basis: 1800, Delta: 1300, Slippage: -310, Fees: -180 },
];

const DEFAULT_BACKTEST_VS_LIVE: Array<Record<string, number | string>> = [
  { day: "03-17", backtest: 1020000, live: 1018000 },
  { day: "03-18", backtest: 1035000, live: 1031000 },
  { day: "03-19", backtest: 1042000, live: 1046000 },
];

const DEFAULT_DEFI_ATTRIBUTION: MockDeFiPnLCategory[] = [
  { name: "Interest Income", value: 5860, color: "#10b981" },
  { name: "Funding Income", value: 4120, color: "#3b82f6" },
  { name: "Gas Costs", value: -345, color: "#6b7280" },
];

const DEFAULT_CLIENT_PNL: ClientPnLRow[] = [
  { id: "client-1", name: "Client One", org: "Org Alpha", pnl: 42000, strategies: 3, change: 1.2 },
  { id: "client-2", name: "Client Two", org: "Org Beta", pnl: 58000, strategies: 2, change: -0.4 },
];

/**
 * Builds a factor-drilldown payload for the selectedFactorData field —
 * used by pnl-factor-drilldown-widget when a factor is selected.
 */
export function buildMockFactorDrilldown(overrides: Partial<FactorDrilldown> = {}): FactorDrilldown {
  return {
    factor: overrides.factor ?? { name: "Funding", value: 35000, percentage: 34.8, category: "factor" },
    breakdown: overrides.breakdown ?? [
      { id: "strat-1", name: "ETH Basis", client: "Client One", value: 20000, percentage: 57.1 },
      { id: "strat-2", name: "BTC Carry", client: "Client Two", value: 15000, percentage: 42.9 },
    ],
    timeSeries: overrides.timeSeries ?? [
      { time: "10:00", "ETH Basis": 10000, "BTC Carry": 7000 },
      { time: "11:00", "ETH Basis": 15000, "BTC Carry": 11000 },
      { time: "12:00", "ETH Basis": 20000, "BTC Carry": 15000 },
    ],
    strategyNames: overrides.strategyNames ?? ["ETH Basis", "BTC Carry"],
  };
}

export function buildMockPnLData(overrides: MockPnLDataOverrides = {}) {
  const pnlComponents = overrides.pnlComponents ?? DEFAULT_FACTORS;
  const structuralPnL = overrides.structuralPnL ?? DEFAULT_STRUCTURAL;
  const residualPnL = overrides.residualPnL ?? DEFAULT_RESIDUAL;
  const netPnL = overrides.netPnL ?? pnlComponents.reduce((s, c) => s + c.value, 0);
  const defiPnlAttribution = overrides.defiPnlAttribution ?? DEFAULT_DEFI_ATTRIBUTION;

  return {
    pnlComponents,
    structuralPnL,
    residualPnL,
    netPnL,
    clientPnL: overrides.clientPnL ?? DEFAULT_CLIENT_PNL,
    timeSeriesData: overrides.timeSeriesData ?? DEFAULT_TIME_SERIES,
    timeSeriesNetPnL: overrides.timeSeriesNetPnL ?? 8900,
    dataMode: overrides.dataMode ?? ("live" as "live" | "batch"),
    setDataMode: overrides.setDataMode ?? vi.fn(),
    dateRange: overrides.dateRange ?? "today",
    setDateRange: overrides.setDateRange ?? vi.fn(),
    groupBy: overrides.groupBy ?? "all",
    setGroupBy: overrides.setGroupBy ?? vi.fn(),
    shareClass: overrides.shareClass ?? ("all" as ShareClass | "all"),
    setShareClass: overrides.setShareClass ?? vi.fn(),
    selectedFactor: overrides.selectedFactor ?? null,
    setSelectedFactor: overrides.setSelectedFactor ?? vi.fn(),
    selectedFactorData: overrides.selectedFactorData ?? null,
    selectedOrgIds: overrides.selectedOrgIds ?? [],
    setSelectedOrgIds: overrides.setSelectedOrgIds ?? vi.fn(),
    selectedClientIds: overrides.selectedClientIds ?? [],
    setSelectedClientIds: overrides.setSelectedClientIds ?? vi.fn(),
    selectedStrategyIds: overrides.selectedStrategyIds ?? [],
    setSelectedStrategyIds: overrides.setSelectedStrategyIds ?? vi.fn(),
    isResidualAlert: overrides.isResidualAlert ?? false,
    residualThresholdPct: overrides.residualThresholdPct ?? 10,
    isLoading: overrides.isLoading ?? false,
    defiPnlAttribution,
    defiPnlNet: overrides.defiPnlNet ?? defiPnlAttribution.reduce((s, c) => s + c.value, 0),
    backtestVsLive: overrides.backtestVsLive ?? DEFAULT_BACKTEST_VS_LIVE,
  };
}
