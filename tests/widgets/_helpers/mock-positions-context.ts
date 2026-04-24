import { vi } from "vitest";

/**
 * Minimal PositionRecord for widget harness tests. Real shape is richer
 * (see components/widgets/positions/positions-data-context.tsx) — keep this
 * surface lean so tests don't break when unrelated fields are added.
 */
export interface MockPositionRecord {
  id: string;
  strategy_id: string;
  strategy_name: string;
  instrument: string;
  side: "LONG" | "SHORT";
  quantity: number;
  entry_price: number;
  current_price: number;
  net_pnl: number;
  net_pnl_pct: number;
  today_pnl: number;
  today_pnl_pct: number;
  unrealized_pnl?: number;
  venue: string;
  margin: number;
  leverage: number;
  updated_at: string;
  notional_usd?: number;
  net_delta?: number;
  health_factor?: number;
  client_name?: string;
  category?: string;
  strategy_family?: string;
  chain?: string;
}

export interface MockPositionsSummary {
  totalPositions: number;
  totalNotional: number;
  unrealizedPnL: number;
  totalMargin: number;
  longExposure: number;
  shortExposure: number;
}

export function buildMockPositionRecord(overrides: Partial<MockPositionRecord> = {}): MockPositionRecord {
  return {
    id: "pos-1",
    strategy_id: "DEFI_ETH_BASIS_HUF_1H",
    strategy_name: "ETH Basis Trade",
    instrument: "ETH-PERP",
    side: "LONG",
    quantity: 10,
    entry_price: 2500,
    current_price: 2600,
    net_pnl: 1000,
    net_pnl_pct: 4,
    today_pnl: 100,
    today_pnl_pct: 0.4,
    unrealized_pnl: 1000,
    venue: "BINANCE",
    margin: 2500,
    leverage: 10,
    updated_at: "2026-04-24T00:00:00.000Z",
    ...overrides,
  };
}

export function buildMockPositionsSummary(overrides: Partial<MockPositionsSummary> = {}): MockPositionsSummary {
  return {
    totalPositions: 2,
    totalNotional: 50_000,
    unrealizedPnL: 1_500,
    totalMargin: 5_000,
    longExposure: 30_000,
    shortExposure: 20_000,
    ...overrides,
  };
}

export interface MockPositionsDataOverrides {
  positions?: MockPositionRecord[];
  filteredPositions?: MockPositionRecord[];
  summary?: MockPositionsSummary;
  isLoading?: boolean;
  positionsError?: Error | null;
  isLive?: boolean;
  searchQuery?: string;
  venueFilter?: string;
  sideFilter?: "all" | "LONG" | "SHORT";
  strategyFilter?: string;
  instrumentTypeFilters?: string[];
  uniqueVenues?: string[];
  uniqueStrategies?: [string, string][];
}

/**
 * Returns a factory for the fields positions-kpi-widget and
 * positions-table-widget read from usePositionsData(). Use with
 * vi.mock('./positions-data-context', ...).
 */
export function buildMockPositionsData(overrides: MockPositionsDataOverrides = {}) {
  const positions = overrides.positions ?? [
    buildMockPositionRecord(),
    buildMockPositionRecord({
      id: "pos-2",
      strategy_id: "CEFI_BTC_BASIS_SCE_1H",
      strategy_name: "BTC Basis",
      instrument: "BTC-PERP",
      side: "SHORT",
      quantity: 2,
      entry_price: 60_000,
      current_price: 59_500,
      net_pnl: 500,
      net_pnl_pct: 0.83,
      today_pnl: 50,
      today_pnl_pct: 0.08,
      venue: "DERIBIT",
      margin: 2_500,
    }),
  ];
  const filteredPositions = overrides.filteredPositions ?? positions;
  const summary = overrides.summary ?? buildMockPositionsSummary();
  const uniqueVenues = overrides.uniqueVenues ?? [...new Set(positions.map((p) => p.venue))].sort();
  const uniqueStrategies =
    overrides.uniqueStrategies ??
    ([...new Map(positions.map((p) => [p.strategy_id, p.strategy_name])).entries()] as [string, string][]);

  return {
    positions,
    filteredPositions,
    summary,
    isLoading: overrides.isLoading ?? false,
    positionsError: overrides.positionsError ?? null,
    refetchPositions: vi.fn(),
    isLive: overrides.isLive ?? false,
    searchQuery: overrides.searchQuery ?? "",
    setSearchQuery: vi.fn(),
    venueFilter: overrides.venueFilter ?? "all",
    setVenueFilter: vi.fn(),
    sideFilter: overrides.sideFilter ?? ("all" as "all" | "LONG" | "SHORT"),
    setSideFilter: vi.fn(),
    strategyFilter: overrides.strategyFilter ?? "all",
    setStrategyFilter: vi.fn(),
    instrumentTypeFilters: overrides.instrumentTypeFilters ?? [],
    setInstrumentTypeFilters: vi.fn(),
    toggleInstrumentTypeFilter: vi.fn(),
    resetFilters: vi.fn(),
    uniqueVenues,
    uniqueStrategies,
    filterDefs: [],
    filterValues: {},
    handleFilterChange: vi.fn(),
    assetClassOptions: ["Spot", "Perp", "Futures", "Options", "DeFi", "Prediction"] as string[],
    classifyInstrument: vi.fn((_instr: string) => "Perp" as const),
    getInstrumentRoute: vi.fn((_instr: string, _type: string) => "/services/trading/terminal"),
    refreshPositions: vi.fn(),
  };
}
