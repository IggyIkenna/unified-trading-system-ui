import { vi } from "vitest";
import type { OrderRecord } from "@/components/widgets/orders/orders-data-context";

/**
 * Minimal OrderRecord factory. Widget-level tests only need the columns
 * actually rendered (order_id, instrument, side, type, price, mark_price,
 * quantity, filled, status, venue, strategy_name, edge_bps, instant_pnl,
 * created_at). Shard dimensions (client_name, category, strategy_family,
 * account_id, chain) are optional.
 */
export function buildMockOrder(overrides: Partial<OrderRecord> = {}): OrderRecord {
  return {
    order_id: "ORD-1001",
    instrument: "BTC-USD",
    side: "BUY",
    type: "LIMIT",
    price: 65000,
    mark_price: 65050,
    quantity: 0.5,
    filled: 0,
    status: "OPEN",
    venue: "BINANCE",
    strategy_id: "basis-trade-01",
    strategy_name: "Basis Trade 01",
    edge_bps: 2.5,
    instant_pnl: 0,
    created_at: "2026-04-24T10:00:00Z",
    ...overrides,
  };
}

/**
 * A small, status-diverse default set used by most tests so summary
 * counts are non-zero.
 */
function defaultOrders(): OrderRecord[] {
  return [
    buildMockOrder({ order_id: "ORD-OPEN-1", status: "OPEN", venue: "BINANCE", side: "BUY" }),
    buildMockOrder({
      order_id: "ORD-OPEN-2",
      status: "OPEN",
      venue: "COINBASE",
      side: "SELL",
      instrument: "ETH-USD",
      price: 3400,
      mark_price: 3405,
    }),
    buildMockOrder({
      order_id: "ORD-FILLED-1",
      status: "FILLED",
      venue: "BINANCE",
      side: "BUY",
      filled: 0.5,
    }),
    buildMockOrder({
      order_id: "ORD-PARTIAL-1",
      status: "PARTIALLY_FILLED",
      venue: "BINANCE",
      side: "SELL",
      filled: 0.25,
    }),
    buildMockOrder({ order_id: "ORD-REJECTED-1", status: "REJECTED", venue: "OKX" }),
    buildMockOrder({ order_id: "ORD-FAILED-1", status: "FAILED", venue: "OKX" }),
  ];
}

export interface MockOrdersDataOverrides {
  orders?: OrderRecord[];
  filteredOrders?: OrderRecord[];
  isLoading?: boolean;
  error?: Error | null;
  summary?: Partial<{
    total: number;
    open: number;
    filled: number;
    partial: number;
    rejected: number;
    failed: number;
  }>;
  cancelOrder?: ReturnType<typeof vi.fn>;
  openAmendDialog?: ReturnType<typeof vi.fn>;
  submitAmend?: ReturnType<typeof vi.fn>;
  refetch?: ReturnType<typeof vi.fn>;
  searchQuery?: string;
  setSearchQuery?: ReturnType<typeof vi.fn>;
  venueFilter?: string;
  setVenueFilter?: ReturnType<typeof vi.fn>;
  statusFilter?: string;
  setStatusFilter?: ReturnType<typeof vi.fn>;
  strategyFilter?: string;
  setStrategyFilter?: ReturnType<typeof vi.fn>;
  sideFilter?: "all" | "BUY" | "SELL";
  setSideFilter?: ReturnType<typeof vi.fn>;
  instrumentTypeFilters?: string[];
  toggleInstrumentTypeFilter?: ReturnType<typeof vi.fn>;
  resetFilters?: ReturnType<typeof vi.fn>;
  uniqueVenues?: string[];
  uniqueStatuses?: string[];
  uniqueStrategies?: [string, string][];
}

/**
 * Returns a factory shaped like useOrdersData(). Fields not referenced by
 * the widgets under test are still provided so destructuring doesn't
 * crash in render.
 */
export function buildMockOrdersData(overrides: MockOrdersDataOverrides = {}) {
  const orders = overrides.orders ?? defaultOrders();
  const filteredOrders = overrides.filteredOrders ?? orders;
  const summaryBase = {
    total: filteredOrders.length,
    open: filteredOrders.filter((o) => o.status.toUpperCase().includes("OPEN")).length,
    filled: filteredOrders.filter((o) => o.status.toUpperCase().includes("FILLED")).length,
    partial: filteredOrders.filter((o) => o.status.toUpperCase().includes("PARTIAL")).length,
    rejected: filteredOrders.filter((o) => o.status.toUpperCase().includes("REJECTED")).length,
    failed: filteredOrders.filter((o) => o.status.toUpperCase().includes("FAILED")).length,
  };
  return {
    orders,
    filteredOrders,
    isLoading: overrides.isLoading ?? false,
    error: overrides.error ?? null,
    refetch: overrides.refetch ?? vi.fn(),

    cancelOrder: overrides.cancelOrder ?? vi.fn(),
    isCancelling: false,
    openAmendDialog: overrides.openAmendDialog ?? vi.fn(),
    submitAmend: overrides.submitAmend ?? vi.fn(),
    isAmending: false,

    summary: { ...summaryBase, ...(overrides.summary ?? {}) },

    searchQuery: overrides.searchQuery ?? "",
    setSearchQuery: overrides.setSearchQuery ?? vi.fn(),
    venueFilter: overrides.venueFilter ?? "all",
    setVenueFilter: overrides.setVenueFilter ?? vi.fn(),
    statusFilter: overrides.statusFilter ?? "all",
    setStatusFilter: overrides.setStatusFilter ?? vi.fn(),
    strategyFilter: overrides.strategyFilter ?? "all",
    setStrategyFilter: overrides.setStrategyFilter ?? vi.fn(),
    sideFilter: overrides.sideFilter ?? "all",
    setSideFilter: overrides.setSideFilter ?? vi.fn(),
    instrumentTypeFilters: overrides.instrumentTypeFilters ?? [],
    setInstrumentTypeFilters: vi.fn(),
    toggleInstrumentTypeFilter: overrides.toggleInstrumentTypeFilter ?? vi.fn(),
    resetFilters: overrides.resetFilters ?? vi.fn(),

    uniqueVenues: overrides.uniqueVenues ?? ["BINANCE", "COINBASE", "OKX"],
    uniqueStatuses: overrides.uniqueStatuses ?? ["OPEN", "FILLED", "PARTIALLY_FILLED", "REJECTED", "FAILED"],
    uniqueStrategies: overrides.uniqueStrategies ?? [["basis-trade-01", "Basis Trade 01"]],

    filterDefs: [],
    filterValues: {},
    handleFilterChange: vi.fn(),

    assetClassOptions: ["Spot", "Perp", "Futures", "Options", "DeFi", "Prediction"],
    classifyInstrument: (_instrument: string) => "Spot" as const,

    amendTarget: null,
    setAmendTarget: vi.fn(),
  };
}
