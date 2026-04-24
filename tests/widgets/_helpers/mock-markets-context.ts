import { vi } from "vitest";
import type { LatencyMetric, OrderFlowEntry } from "@/lib/types/markets";

/**
 * Minimal LatencyMetric suitable for widget harness tests.
 * Real fixture shape is richer; widgets only read the fields below.
 */
export function buildMockLatencyMetric(overrides: Partial<LatencyMetric> = {}): LatencyMetric {
  return {
    service: "Execution Service",
    serviceId: "execution-service",
    p50: 2.1,
    p95: 8.4,
    p99: 15.2,
    status: "healthy",
    lifecycle: [
      { stage: "Order Validation", p50: 0.3, p95: 0.8, p99: 1.2 },
      { stage: "Risk Check", p50: 0.5, p95: 1.5, p99: 2.8 },
      { stage: "Route Selection", p50: 0.4, p95: 1.2, p99: 2.1 },
    ],
    batch: { p50: 2.0, p95: 8.1, p99: 14.8 },
    timeSeries: [
      { time: "0:00", p50: 2.1, p95: 8.4, p99: 15.2 },
      { time: "1:00", p50: 2.2, p95: 8.5, p99: 15.4 },
    ],
    ...overrides,
  };
}

export function buildMockOrderFlowEntry(overrides: Partial<OrderFlowEntry> = {}): OrderFlowEntry {
  return {
    id: "ofid-1",
    exchangeTime: "2026-04-24T12:00:00.000Z",
    localTime: "2026-04-24T12:00:00.000Z",
    delayMs: 5,
    type: "trade",
    side: "buy",
    price: 63450,
    size: 0.5,
    venue: "Uniswap V3",
    isOwn: false,
    ...overrides,
  };
}

export interface MockMarketsDataOverrides {
  viewMode?: "cross-section" | "time-series";
  dataMode?: "live" | "batch";
  dateRange?: string;
  orderFlowView?: "orders" | "book" | "own";
  assetClass?: "crypto" | "tradfi" | "defi";
  orderFlowRange?: "1d" | "1w" | "1m";
  bookDepth?: number;
  latencyMetrics?: LatencyMetric[];
  selectedLatencyService?: string | null;
  latencyViewMode?: "cross-section" | "time-series";
  latencyDataMode?: "live" | "batch" | "compare";
  orderFlowData?: OrderFlowEntry[];
  isLoading?: boolean;
  isError?: boolean;
}

/**
 * Returns the fields all markets widgets read from useMarketsData().
 * Use with vi.mock('@/components/widgets/markets/markets-data-context', ...).
 *
 * Minimal surface — tests don't break when unrelated MarketsDataContextValue
 * fields are added.
 */
export function buildMockMarketsData(overrides: MockMarketsDataOverrides = {}) {
  const latencyMetrics = overrides.latencyMetrics ?? [buildMockLatencyMetric()];
  return {
    viewMode: overrides.viewMode ?? "cross-section",
    setViewMode: vi.fn(),
    dataMode: overrides.dataMode ?? "live",
    setDataMode: vi.fn(),
    dateRange: overrides.dateRange ?? "today",
    setDateRange: vi.fn(),
    orderFlowView: overrides.orderFlowView ?? "orders",
    setOrderFlowView: vi.fn(),
    assetClass: overrides.assetClass ?? "crypto",
    setAssetClass: vi.fn(),
    orderFlowRange: overrides.orderFlowRange ?? "1d",
    setOrderFlowRange: vi.fn(),
    bookDepth: overrides.bookDepth ?? 5,
    setBookDepth: vi.fn(),
    orderFlowData: overrides.orderFlowData ?? [buildMockOrderFlowEntry()],
    liveBookUpdates: [],
    ownOrders: [],
    reconRuns: [],
    latencyMetrics,
    selectedLatencyService: overrides.selectedLatencyService ?? null,
    setSelectedLatencyService: vi.fn(),
    latencyViewMode: overrides.latencyViewMode ?? "cross-section",
    setLatencyViewMode: vi.fn(),
    latencyDataMode: overrides.latencyDataMode ?? "live",
    setLatencyDataMode: vi.fn(),
    isLoading: overrides.isLoading ?? false,
    isError: overrides.isError ?? false,
    refetch: vi.fn(),
  };
}
