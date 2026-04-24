import { vi } from "vitest";
import type {
  LendingArbRow,
  AtRiskPosition,
  LPPosition,
  CommodityRegimeData,
} from "@/components/widgets/strategies/strategies-data-context";

// ---------------------------------------------------------------------------
// Mock type definitions
// ---------------------------------------------------------------------------

export interface MockStrategy {
  id: string;
  name: string;
  description: string;
  archetype: string;
  assetClass: string;
  status: string;
  venues: string[];
  version: string;
  strategyType: string;
  instructionTypes: string[];
  sparklineData: number[];
  performance: {
    sharpe: number;
    returnPct: number;
    maxDrawdown: number;
    pnlMTD: number;
  };
  dataArchitecture: {
    executionMode: "same_candle_exit" | "hold_until_flip" | "event_driven_continuous";
  };
  clientId: string;
  aum: number;
  pnl: number;
  mtdReturn: number;
  maxDrawdown: number;
}

export interface MockStrategiesDataOverrides {
  strategies?: MockStrategy[];
  filteredStrategies?: MockStrategy[];
  groupedStrategies?: Record<string, MockStrategy[]>;
  isLoading?: boolean;
  error?: string | null;
  searchQuery?: string;
  setSearchQuery?: ReturnType<typeof vi.fn>;
  selectedAssetClasses?: string[];
  toggleAssetClass?: ReturnType<typeof vi.fn>;
  selectedArchetypes?: string[];
  toggleArchetype?: ReturnType<typeof vi.fn>;
  selectedStatuses?: string[];
  toggleStatus?: ReturnType<typeof vi.fn>;
  hasFilters?: boolean;
  clearFilters?: ReturnType<typeof vi.fn>;
  totalAUM?: number;
  totalPnL?: number;
  totalMTDPnL?: number;
  activeCount?: number;
  lendingArbData?: LendingArbRow[];
  liquidationPositions?: AtRiskPosition[];
  cascadeZoneUsd?: number;
  liquidated24hUsd?: number;
  lpPositions?: LPPosition[];
  commodityRegime?: CommodityRegimeData;
  isLive?: boolean;
  mode?: string;
}

// ---------------------------------------------------------------------------
// Factory helpers for individual item types
// ---------------------------------------------------------------------------

export function buildMockStrategy(overrides: Partial<MockStrategy> = {}): MockStrategy {
  return {
    id: "YIELD_ROTATION_LENDING@aave-multichain-usdc-prod",
    name: "Yield Rotation — Lending",
    description: "Cross-protocol lending yield rotation across Aave V3 pools.",
    archetype: "yield-rotation",
    assetClass: "DeFi",
    status: "live",
    venues: ["AAVEV3-ETHEREUM", "MORPHO-ETHEREUM"],
    version: "v1.2.0",
    strategyType: "Automated",
    instructionTypes: ["LEND", "BORROW"],
    sparklineData: [100, 102, 101, 105, 108, 107, 110],
    performance: {
      sharpe: 1.82,
      returnPct: 12.5,
      maxDrawdown: 3.1,
      pnlMTD: 45_200,
    },
    dataArchitecture: {
      executionMode: "hold_until_flip",
    },
    clientId: "internal-trader",
    aum: 1_500_000,
    pnl: 112_000,
    mtdReturn: 3.2,
    maxDrawdown: 3.1,
    ...overrides,
  };
}

export function buildMockLendingArbRow(overrides: Partial<LendingArbRow> = {}): LendingArbRow {
  return {
    protocol: "Aave V3",
    token: "USDC",
    supplyApy: 4.2,
    borrowApy: 3.1,
    spreadBps: 110,
    utilization: 82.4,
    ...overrides,
  };
}

export function buildMockAtRiskPosition(overrides: Partial<AtRiskPosition> = {}): AtRiskPosition {
  return {
    protocol: "Aave V3",
    collateral: "WETH",
    collateralUsd: 2_450_000,
    debt: "USDC",
    debtUsd: 1_850_000,
    healthFactor: 1.18,
    liquidationPrice: 2720,
    distancePct: 3.2,
    ...overrides,
  };
}

export function buildMockLPPosition(overrides: Partial<LPPosition> = {}): LPPosition {
  return {
    pool: "ETH-USDC",
    rangeLow: 2800,
    rangeHigh: 3200,
    inRange: true,
    tvl: 1_250_000,
    fees24h: 3420,
    ilPct: -0.42,
    lastRebalance: "2h ago",
    ...overrides,
  };
}

export function buildMockCommodityRegime(overrides: Partial<CommodityRegimeData> = {}): CommodityRegimeData {
  return {
    currentRegime: "Trending",
    factors: [
      { name: "Price Momentum", score: 0.88, signal: "BULLISH", weight: 25 },
      { name: "COT Positioning", score: 0.45, signal: "BULLISH", weight: 25 },
      { name: "Storage Levels", score: -0.31, signal: "BEARISH", weight: 20 },
    ],
    positions: [
      {
        commodity: "WTI Crude",
        direction: "LONG",
        entry: 72.4,
        current: 78.2,
        pnl: 58_000,
        regimeAtEntry: "Trending",
      },
      {
        commodity: "Natural Gas",
        direction: "SHORT",
        entry: 3.85,
        current: 3.42,
        pnl: 34_200,
        regimeAtEntry: "Mean-Reverting",
      },
    ],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Main factory — builds the full useStrategiesData() mock surface
// ---------------------------------------------------------------------------

export function buildMockStrategiesData(overrides: MockStrategiesDataOverrides = {}) {
  const strategy = buildMockStrategy();
  const strategies = overrides.strategies ?? [strategy];
  const filteredStrategies = overrides.filteredStrategies ?? strategies;
  const groupedStrategies =
    overrides.groupedStrategies ??
    filteredStrategies.reduce<Record<string, MockStrategy[]>>((acc, s) => {
      if (!acc[s.assetClass]) acc[s.assetClass] = [];
      acc[s.assetClass].push(s);
      return acc;
    }, {});

  return {
    strategies,
    filteredStrategies,
    groupedStrategies,
    isLoading: overrides.isLoading ?? false,
    error: overrides.error ?? null,

    searchQuery: overrides.searchQuery ?? "",
    setSearchQuery: overrides.setSearchQuery ?? vi.fn(),
    selectedAssetClasses: overrides.selectedAssetClasses ?? [],
    toggleAssetClass: overrides.toggleAssetClass ?? vi.fn(),
    selectedArchetypes: overrides.selectedArchetypes ?? [],
    toggleArchetype: overrides.toggleArchetype ?? vi.fn(),
    selectedStatuses: overrides.selectedStatuses ?? [],
    toggleStatus: overrides.toggleStatus ?? vi.fn(),
    hasFilters: overrides.hasFilters ?? false,
    clearFilters: overrides.clearFilters ?? vi.fn(),

    totalAUM: overrides.totalAUM ?? 1_500_000,
    totalPnL: overrides.totalPnL ?? 112_000,
    totalMTDPnL: overrides.totalMTDPnL ?? 45_200,
    activeCount: overrides.activeCount ?? 1,

    lendingArbData: overrides.lendingArbData ?? [
      buildMockLendingArbRow(),
      buildMockLendingArbRow({
        protocol: "Morpho Blue",
        token: "WETH",
        supplyApy: 2.8,
        borrowApy: 2.5,
        spreadBps: 30,
        utilization: 65.7,
      }),
    ],
    liquidationPositions: overrides.liquidationPositions ?? [
      buildMockAtRiskPosition(),
      buildMockAtRiskPosition({
        protocol: "Morpho Blue",
        collateral: "wstETH",
        collateralUsd: 5_100_000,
        debt: "USDC",
        debtUsd: 3_200_000,
        healthFactor: 1.42,
        liquidationPrice: 2580,
        distancePct: 8.1,
      }),
    ],
    cascadeZoneUsd: overrides.cascadeZoneUsd ?? 2_800_000,
    liquidated24hUsd: overrides.liquidated24hUsd ?? 1_200_000,
    lpPositions: overrides.lpPositions ?? [
      buildMockLPPosition(),
      buildMockLPPosition({
        pool: "SOL-USDC",
        rangeLow: 110,
        rangeHigh: 130,
        inRange: false,
        tvl: 820_000,
        fees24h: 1240,
        ilPct: -1.85,
        lastRebalance: "1d ago",
      }),
    ],
    commodityRegime: overrides.commodityRegime ?? buildMockCommodityRegime(),

    isLive: overrides.isLive ?? false,
    mode: overrides.mode ?? "paper",
  };
}
