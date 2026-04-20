"use client";

import { useStrategyPerformance } from "@/hooks/api/use-strategies";
import { useExecutionMode } from "@/lib/execution-mode-context";
import { getStrategiesForScope, type SeedStrategy } from "@/lib/mocks/fixtures/mock-data-index";
import { useGlobalScope } from "@/lib/stores/global-scope-store";
import { getClientIdsForOrgs, getStrategyIdsForScope } from "@/lib/stores/scope-helpers";
import {
  STRATEGIES as DEFAULT_STRATEGIES,
  getTotalAUM,
  getTotalMTDPnL,
  getTotalPnL,
  type Strategy,
} from "@/lib/mocks/fixtures/strategy-instances";
import * as React from "react";

// ---------------------------------------------------------------------------
// Strategy dashboard data types (lending arb, liquidation, active LP)
// ---------------------------------------------------------------------------

export interface LendingArbRow {
  protocol: string;
  token: string;
  supplyApy: number;
  borrowApy: number;
  spreadBps: number;
  utilization: number;
}

export interface AtRiskPosition {
  protocol: string;
  collateral: string;
  collateralUsd: number;
  debt: string;
  debtUsd: number;
  healthFactor: number;
  liquidationPrice: number;
  distancePct: number;
}

export interface LPPosition {
  pool: string;
  rangeLow: number;
  rangeHigh: number;
  inRange: boolean;
  tvl: number;
  fees24h: number;
  ilPct: number;
  lastRebalance: string;
}

export interface StrategiesData {
  strategies: Strategy[];
  filteredStrategies: Strategy[];
  groupedStrategies: Record<string, Strategy[]>;
  isLoading: boolean;

  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedAssetClasses: string[];
  toggleAssetClass: (ac: string) => void;
  selectedArchetypes: string[];
  toggleArchetype: (arch: string) => void;
  selectedStatuses: string[];
  toggleStatus: (status: string) => void;
  hasFilters: boolean;
  clearFilters: () => void;

  totalAUM: number;
  totalPnL: number;
  totalMTDPnL: number;
  activeCount: number;

  lendingArbData: LendingArbRow[];
  liquidationPositions: AtRiskPosition[];
  /** Sum of debt in USD for positions at highest cascade risk (HF ≤ 1.2). */
  cascadeZoneUsd: number;
  /** Mock 24h rolling total of liquidations in USD (replace with backend feed when wired). */
  liquidated24hUsd: number;
  lpPositions: LPPosition[];
  commodityRegime: CommodityRegimeData;

  isLive: boolean;
  mode: string;
}

// ---------------------------------------------------------------------------
// Mock data for strategy dashboards (§ 0.3 — moved from widget files)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Commodity regime types & data (moved from commodity-regime-widget per § 0.3)
// ---------------------------------------------------------------------------

export type CommodityRegime = "Trending" | "Mean-Reverting" | "Transitioning";
export type CommoditySignal = "BULLISH" | "BEARISH" | "NEUTRAL";

export interface FactorScore {
  name: string;
  score: number;
  signal: CommoditySignal;
  weight: number;
}

export interface CommodityPosition {
  commodity: string;
  direction: "LONG" | "SHORT";
  entry: number;
  current: number;
  pnl: number;
  regimeAtEntry: CommodityRegime;
}

export interface CommodityRegimeData {
  currentRegime: CommodityRegime;
  factors: FactorScore[];
  positions: CommodityPosition[];
}

const MOCK_COMMODITY_REGIME: CommodityRegimeData = {
  currentRegime: "Trending",
  factors: [
    { name: "Rig Count", score: 0.72, signal: "BULLISH", weight: 20 },
    { name: "COT Positioning", score: 0.45, signal: "BULLISH", weight: 25 },
    { name: "Storage Levels", score: -0.31, signal: "BEARISH", weight: 20 },
    { name: "Price Momentum", score: 0.88, signal: "BULLISH", weight: 25 },
    { name: "Weather Impact", score: 0.12, signal: "NEUTRAL", weight: 10 },
  ],
  positions: [
    { commodity: "WTI Crude", direction: "LONG", entry: 72.4, current: 78.2, pnl: 58_000, regimeAtEntry: "Trending" },
    {
      commodity: "Natural Gas",
      direction: "SHORT",
      entry: 3.85,
      current: 3.42,
      pnl: 34_200,
      regimeAtEntry: "Mean-Reverting",
    },
    { commodity: "Gold", direction: "LONG", entry: 2320, current: 2385, pnl: 42_500, regimeAtEntry: "Trending" },
    {
      commodity: "Copper",
      direction: "LONG",
      entry: 4.15,
      current: 4.02,
      pnl: -18_400,
      regimeAtEntry: "Transitioning",
    },
    { commodity: "Soybeans", direction: "SHORT", entry: 1245, current: 1198, pnl: 22_100, regimeAtEntry: "Trending" },
  ],
};

const MOCK_LENDING_ARB: LendingArbRow[] = [
  { protocol: "Aave V3", token: "USDC", supplyApy: 4.2, borrowApy: 3.1, spreadBps: 110, utilization: 82.4 },
  { protocol: "Aave V3", token: "WETH", supplyApy: 2.1, borrowApy: 1.8, spreadBps: 30, utilization: 71.2 },
  { protocol: "Aave V3", token: "DAI", supplyApy: 3.9, borrowApy: 3.4, spreadBps: 50, utilization: 78.1 },
  { protocol: "Aave V3", token: "USDT", supplyApy: 4.5, borrowApy: 3.3, spreadBps: 120, utilization: 85.6 },
  { protocol: "Morpho Blue", token: "USDC", supplyApy: 5.1, borrowApy: 4.0, spreadBps: 110, utilization: 88.3 },
  { protocol: "Morpho Blue", token: "WETH", supplyApy: 2.8, borrowApy: 2.5, spreadBps: 30, utilization: 65.7 },
  { protocol: "Morpho Blue", token: "DAI", supplyApy: 4.7, borrowApy: 3.6, spreadBps: 110, utilization: 80.2 },
  { protocol: "Morpho Blue", token: "USDT", supplyApy: 5.3, borrowApy: 4.1, spreadBps: 120, utilization: 87.9 },
  { protocol: "Compound V3", token: "USDC", supplyApy: 3.8, borrowApy: 3.5, spreadBps: 30, utilization: 79.5 },
  { protocol: "Compound V3", token: "WETH", supplyApy: 1.9, borrowApy: 1.5, spreadBps: 40, utilization: 68.3 },
  { protocol: "Compound V3", token: "DAI", supplyApy: 3.5, borrowApy: 3.0, spreadBps: 50, utilization: 74.8 },
  { protocol: "Compound V3", token: "USDT", supplyApy: 4.0, borrowApy: 3.2, spreadBps: 80, utilization: 81.2 },
  { protocol: "Kamino", token: "USDC", supplyApy: 6.2, borrowApy: 4.8, spreadBps: 140, utilization: 91.0 },
  { protocol: "Kamino", token: "WETH", supplyApy: 3.1, borrowApy: 2.3, spreadBps: 80, utilization: 72.4 },
  { protocol: "Kamino", token: "DAI", supplyApy: 5.5, borrowApy: 4.2, spreadBps: 130, utilization: 86.1 },
  { protocol: "Kamino", token: "USDT", supplyApy: 6.8, borrowApy: 5.0, spreadBps: 180, utilization: 93.2 },
];

const MOCK_LIQUIDATION_POSITIONS: AtRiskPosition[] = [
  {
    protocol: "Aave V3",
    collateral: "WETH",
    collateralUsd: 2_450_000,
    debt: "USDC",
    debtUsd: 1_850_000,
    healthFactor: 1.18,
    liquidationPrice: 2720,
    distancePct: 3.2,
  },
  {
    protocol: "Morpho Blue",
    collateral: "wstETH",
    collateralUsd: 5_100_000,
    debt: "USDC",
    debtUsd: 3_200_000,
    healthFactor: 1.42,
    liquidationPrice: 2580,
    distancePct: 8.1,
  },
  {
    protocol: "Compound V3",
    collateral: "WETH",
    collateralUsd: 1_200_000,
    debt: "USDC",
    debtUsd: 950_000,
    healthFactor: 1.08,
    liquidationPrice: 2780,
    distancePct: 1.1,
  },
  {
    protocol: "Aave V3",
    collateral: "WBTC",
    collateralUsd: 8_300_000,
    debt: "USDT",
    debtUsd: 4_100_000,
    healthFactor: 1.95,
    liquidationPrice: 58200,
    distancePct: 12.8,
  },
  {
    protocol: "Kamino",
    collateral: "SOL",
    collateralUsd: 3_800_000,
    debt: "USDC",
    debtUsd: 2_900_000,
    healthFactor: 1.25,
    liquidationPrice: 112,
    distancePct: 4.5,
  },
  {
    protocol: "Morpho Blue",
    collateral: "WETH",
    collateralUsd: 6_200_000,
    debt: "DAI",
    debtUsd: 4_800_000,
    healthFactor: 1.12,
    liquidationPrice: 2740,
    distancePct: 2.5,
  },
  {
    protocol: "Aave V3",
    collateral: "WETH",
    collateralUsd: 950_000,
    debt: "USDT",
    debtUsd: 830_000,
    healthFactor: 1.02,
    liquidationPrice: 2800,
    distancePct: 0.4,
  },
  {
    protocol: "Compound V3",
    collateral: "WBTC",
    collateralUsd: 4_500_000,
    debt: "USDC",
    debtUsd: 2_100_000,
    healthFactor: 2.15,
    liquidationPrice: 52100,
    distancePct: 21.9,
  },
];

const MOCK_LP_POSITIONS: LPPosition[] = [
  {
    pool: "ETH-USDC",
    rangeLow: 2800,
    rangeHigh: 3200,
    inRange: true,
    tvl: 1_250_000,
    fees24h: 3420,
    ilPct: -0.42,
    lastRebalance: "2h ago",
  },
  {
    pool: "BTC-USDC",
    rangeLow: 62000,
    rangeHigh: 68000,
    inRange: true,
    tvl: 3_100_000,
    fees24h: 8150,
    ilPct: -0.18,
    lastRebalance: "6h ago",
  },
  {
    pool: "SOL-USDC",
    rangeLow: 110,
    rangeHigh: 130,
    inRange: false,
    tvl: 820_000,
    fees24h: 1240,
    ilPct: -1.85,
    lastRebalance: "1d ago",
  },
  {
    pool: "ARB-ETH",
    rangeLow: 0.00032,
    rangeHigh: 0.00042,
    inRange: true,
    tvl: 450_000,
    fees24h: 890,
    ilPct: -0.31,
    lastRebalance: "4h ago",
  },
  {
    pool: "ETH-USDT",
    rangeLow: 2750,
    rangeHigh: 3100,
    inRange: false,
    tvl: 2_400_000,
    fees24h: 5680,
    ilPct: -2.1,
    lastRebalance: "2d ago",
  },
  {
    pool: "MATIC-USDC",
    rangeLow: 0.45,
    rangeHigh: 0.65,
    inRange: true,
    tvl: 310_000,
    fees24h: 520,
    ilPct: -0.55,
    lastRebalance: "8h ago",
  },
];

const StrategiesDataContext = React.createContext<StrategiesData | null>(null);

export function StrategiesDataProvider({ children }: { children: React.ReactNode }) {
  const { mode, isLive } = useExecutionMode();
  const { data: perfData, isLoading } = useStrategyPerformance();
  const { scope: globalScope } = useGlobalScope();

  const rawPayload =
    (perfData as Record<string, unknown> | undefined)?.data ??
    (perfData as Record<string, unknown> | undefined)?.strategies;
  const perfRaw: unknown[] = Array.isArray(rawPayload) ? rawPayload : [];
  const allStrategies: Strategy[] = React.useMemo(() => {
    if (perfRaw.length > 0) return perfRaw as Strategy[];
    // Merge registry strategies with seed data for richer org/client info
    const seedStrats = getStrategiesForScope(
      globalScope.organizationIds,
      globalScope.clientIds,
      globalScope.strategyIds,
    );
    if (
      seedStrats.length > 0 &&
      (globalScope.organizationIds.length > 0 || globalScope.clientIds.length > 0 || globalScope.strategyIds.length > 0)
    ) {
      // When scope filters are active, use seed data which has org/client/strategy relationships
      return seedStrats.map((s: SeedStrategy) => {
        const existing = DEFAULT_STRATEGIES.find((d) => d.id === s.id);
        if (existing) return { ...existing, clientId: s.clientId };
        return {
          id: s.id,
          name: s.name,
          description: `${s.archetype} strategy`,
          archetype: s.archetype,
          assetClass:
            s.archetype.includes("defi") || s.archetype.includes("yield")
              ? "DeFi"
              : s.archetype.includes("sport")
                ? "Sports"
                : "Crypto",
          status: s.status,
          venues: [],
          sharpe: s.sharpe,
          mtdReturn: s.mtdReturn,
          aum: s.aum,
          clientId: s.clientId,
          pnl: 0,
          maxDrawdown: 0,
        } as unknown as Strategy;
      });
    }
    return DEFAULT_STRATEGIES;
  }, [perfRaw, globalScope.organizationIds, globalScope.clientIds, globalScope.strategyIds]);

  // Apply global scope filtering: org -> client -> strategy cascade
  const scopeStrategyIds = React.useMemo(
    () =>
      getStrategyIdsForScope({
        organizationIds: globalScope.organizationIds,
        clientIds: globalScope.clientIds,
        strategyIds: globalScope.strategyIds,
      }),
    [globalScope.organizationIds, globalScope.clientIds, globalScope.strategyIds],
  );
  const scopeClientIds = React.useMemo(() => {
    if (globalScope.clientIds.length > 0) return globalScope.clientIds;
    if (globalScope.organizationIds.length > 0) return getClientIdsForOrgs(globalScope.organizationIds);
    return [];
  }, [globalScope.organizationIds, globalScope.clientIds]);

  const strategies: Strategy[] = React.useMemo(() => {
    let result = allStrategies;
    if (scopeStrategyIds.length > 0) {
      result = result.filter((s) => scopeStrategyIds.includes(s.id));
    } else if (scopeClientIds.length > 0) {
      result = result.filter((s) => scopeClientIds.includes(s.clientId));
    }
    return result;
  }, [allStrategies, scopeStrategyIds, scopeClientIds]);

  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedAssetClasses, setSelectedAssetClasses] = React.useState<string[]>([]);
  const [selectedArchetypes, setSelectedArchetypes] = React.useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = React.useState<string[]>([]);

  const filteredStrategies = React.useMemo(() => {
    let result = strategies;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query) ||
          s.venues.some((v) => v.toLowerCase().includes(query)),
      );
    }

    if (selectedAssetClasses.length > 0) {
      result = result.filter((s) => selectedAssetClasses.includes(s.assetClass));
    }

    if (selectedArchetypes.length > 0) {
      result = result.filter((s) => selectedArchetypes.includes(s.archetype));
    }

    if (selectedStatuses.length > 0) {
      result = result.filter((s) => selectedStatuses.includes(s.status));
    }

    return result;
  }, [strategies, searchQuery, selectedAssetClasses, selectedArchetypes, selectedStatuses]);

  const groupedStrategies = React.useMemo(() => {
    const groups: Record<string, Strategy[]> = {};
    filteredStrategies.forEach((s) => {
      if (!groups[s.assetClass]) groups[s.assetClass] = [];
      groups[s.assetClass].push(s);
    });
    return groups;
  }, [filteredStrategies]);

  const hasFilters = selectedAssetClasses.length > 0 || selectedArchetypes.length > 0 || selectedStatuses.length > 0;

  const clearFilters = React.useCallback(() => {
    setSelectedAssetClasses([]);
    setSelectedArchetypes([]);
    setSelectedStatuses([]);
  }, []);

  const toggleAssetClass = React.useCallback((ac: string) => {
    setSelectedAssetClasses((prev) => (prev.includes(ac) ? prev.filter((x) => x !== ac) : [...prev, ac]));
  }, []);

  const toggleArchetype = React.useCallback((arch: string) => {
    setSelectedArchetypes((prev) => (prev.includes(arch) ? prev.filter((x) => x !== arch) : [...prev, arch]));
  }, []);

  const toggleStatus = React.useCallback((status: string) => {
    setSelectedStatuses((prev) => (prev.includes(status) ? prev.filter((x) => x !== status) : [...prev, status]));
  }, []);

  const totalAUM = React.useMemo(() => getTotalAUM(strategies), [strategies]);
  const totalPnL = React.useMemo(() => getTotalPnL(strategies), [strategies]);
  const totalMTDPnL = React.useMemo(() => getTotalMTDPnL(strategies), [strategies]);
  const activeCount = React.useMemo(() => strategies.filter((s) => s.status === "live").length, [strategies]);

  const cascadeZoneUsd = React.useMemo(
    () => MOCK_LIQUIDATION_POSITIONS.filter((p) => p.healthFactor <= 1.2).reduce((sum, p) => sum + p.debtUsd, 0),
    [],
  );
  const liquidated24hUsd = React.useMemo(
    () => MOCK_LIQUIDATION_POSITIONS.reduce((sum, p) => sum + p.debtUsd * 0.18, 0),
    [],
  );

  const value = React.useMemo(
    () => ({
      strategies,
      filteredStrategies,
      groupedStrategies,
      isLoading,
      searchQuery,
      setSearchQuery,
      selectedAssetClasses,
      toggleAssetClass,
      selectedArchetypes,
      toggleArchetype,
      selectedStatuses,
      toggleStatus,
      hasFilters,
      clearFilters,
      totalAUM,
      totalPnL,
      totalMTDPnL,
      activeCount,
      lendingArbData: MOCK_LENDING_ARB,
      liquidationPositions: MOCK_LIQUIDATION_POSITIONS,
      cascadeZoneUsd,
      liquidated24hUsd,
      lpPositions: MOCK_LP_POSITIONS,
      commodityRegime: MOCK_COMMODITY_REGIME,
      isLive,
      mode,
    }),
    [
      strategies,
      filteredStrategies,
      groupedStrategies,
      isLoading,
      searchQuery,
      selectedAssetClasses,
      selectedArchetypes,
      selectedStatuses,
      hasFilters,
      clearFilters,
      toggleAssetClass,
      toggleArchetype,
      toggleStatus,
      totalAUM,
      totalPnL,
      totalMTDPnL,
      activeCount,
      cascadeZoneUsd,
      liquidated24hUsd,
      isLive,
      mode,
    ],
  );

  return <StrategiesDataContext.Provider value={value}>{children}</StrategiesDataContext.Provider>;
}

export function useStrategiesData(): StrategiesData {
  const ctx = React.useContext(StrategiesDataContext);
  if (!ctx) throw new Error("useStrategiesData must be used within StrategiesDataProvider");
  return ctx;
}
