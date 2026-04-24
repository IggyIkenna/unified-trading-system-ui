import { vi } from "vitest";

/**
 * Shared factory for the OverviewDataContext surface consumed by overview widgets
 * (kpi-strip, pnl-chart, scope-summary, strategy-table, pnl-attribution,
 * alerts-preview, recent-fills, health-grid).
 *
 * Real context type (components/widgets/overview/overview-data-context.tsx)
 * is large; we build a structurally-compatible subset so tests don't churn on
 * unrelated additions. Consumers cast-via-structural-typing at vi.mock time.
 */

export interface MockOverviewAlert {
  id: string;
  message: string;
  severity: "critical" | "high" | "medium" | "low";
  timestamp: string;
  source: string;
}

export interface MockServiceHealth {
  name: string;
  freshness: number;
  sla: number;
  status: "live" | "warning" | "critical" | "idle";
}

export interface MockPnlComponent {
  name: string;
  pnl: number;
  exposure?: string;
}

export interface MockOrder {
  order_id: string;
  instrument: string;
  side: "BUY" | "SELL";
  status: "FILLED" | "PARTIAL" | "OPEN" | "CANCELLED";
}

export interface MockStrategy {
  id: string;
  name: string;
  pnl: number;
  sharpe: number;
  maxDrawdown: number;
  exposure: number;
  nav: number;
  assetClass: string;
  status: "live" | "paused" | "warning";
  archetype: string;
}

export interface MockTimeSeriesPoint {
  timestamp: string;
  value: number;
}

export interface MockOverviewDataOverrides {
  organizations?: Array<{ id: string; name: string }>;
  clients?: Array<{ id: string; name: string }>;
  mockAlerts?: MockOverviewAlert[];
  ordersData?: MockOrder[] | { orders: MockOrder[] } | null;
  allMockServices?: MockServiceHealth[];
  pnlComponents?: MockPnlComponent[];
  strategyPerformance?: MockStrategy[];
  filteredSortedStrategies?: MockStrategy[];
  liveTimeSeries?: { pnl: MockTimeSeriesPoint[]; nav: MockTimeSeriesPoint[]; exposure: MockTimeSeriesPoint[] };
  batchTimeSeries?: { pnl: MockTimeSeriesPoint[]; nav: MockTimeSeriesPoint[]; exposure: MockTimeSeriesPoint[] };
  realtimePnlPoints?: MockTimeSeriesPoint[];
  realtimePnl?: Record<string, number>;
  totalPnl?: number;
  totalExposure?: number;
  totalNav?: number;
  liveStrategies?: number;
  warningStrategies?: number;
  criticalAlerts?: number;
  highAlerts?: number;
  coreLoading?: boolean;
  alertsLoading?: boolean;
  ordersLoading?: boolean;
  perfLoading?: boolean;
  timeseriesLoading?: boolean;
  liveBatchLoading?: boolean;
  error?: unknown;
}

export function buildMockOverviewAlert(overrides: Partial<MockOverviewAlert> = {}): MockOverviewAlert {
  return {
    id: "alert-1",
    message: "Funding spike on BINANCE ETH-PERP",
    severity: "high",
    timestamp: "2026-04-24T00:00:00Z",
    source: "market-data",
    ...overrides,
  };
}

export function buildMockServiceHealth(overrides: Partial<MockServiceHealth> = {}): MockServiceHealth {
  return {
    name: "market-data",
    freshness: 2,
    sla: 5,
    status: "live",
    ...overrides,
  };
}

export function buildMockOrder(overrides: Partial<MockOrder> = {}): MockOrder {
  return {
    order_id: "ord-1",
    instrument: "ETH-PERP",
    side: "BUY",
    status: "FILLED",
    ...overrides,
  };
}

export function buildMockStrategy(overrides: Partial<MockStrategy> = {}): MockStrategy {
  return {
    id: "strat-1",
    name: "ETH Basis",
    pnl: 1000,
    sharpe: 2.1,
    maxDrawdown: -0.05,
    exposure: 50_000,
    nav: 250_000,
    assetClass: "DeFi",
    status: "live",
    archetype: "BASIS_TRADE",
    ...overrides,
  };
}

export function buildMockTimeSeries(count = 5, start = 100): MockTimeSeriesPoint[] {
  return Array.from({ length: count }, (_, i) => ({
    timestamp: new Date(2026, 3, 24, i).toISOString(),
    value: start + i * 10,
  }));
}

/**
 * Returns a minimal OverviewData-shaped object. The real context type has
 * heavy Zustand + union types; we widen at the vi.mock boundary via
 * `as never` so the test file doesn't import 30+ types just to mock.
 */
export function buildMockOverviewData(overrides: MockOverviewDataOverrides = {}) {
  const strategies = overrides.strategyPerformance ?? [
    buildMockStrategy(),
    buildMockStrategy({
      id: "strat-2",
      name: "BTC Basis",
      pnl: -200,
      sharpe: 1.4,
      exposure: 20_000,
      nav: 100_000,
      assetClass: "CeFi",
      archetype: "ARBITRAGE",
      status: "warning",
    }),
    buildMockStrategy({
      id: "strat-3",
      name: "SOL Yield",
      pnl: 450,
      sharpe: 1.8,
      exposure: 15_000,
      nav: 75_000,
      assetClass: "DeFi",
      archetype: "YIELD",
      status: "paused",
    }),
  ];
  const alerts = overrides.mockAlerts ?? [
    buildMockOverviewAlert(),
    buildMockOverviewAlert({ id: "alert-2", severity: "critical", message: "Kill switch tripped on AAVE lending" }),
  ];
  const services = overrides.allMockServices ?? [
    buildMockServiceHealth(),
    buildMockServiceHealth({ name: "pricing-service", freshness: 8, sla: 5, status: "warning" }),
  ];
  const pnlComponents = overrides.pnlComponents ?? [
    { name: "Funding", pnl: 500 },
    { name: "Carry", pnl: 300 },
    { name: "Basis", pnl: 200 },
  ];
  const orders = overrides.ordersData ?? [buildMockOrder(), buildMockOrder({ order_id: "ord-2", side: "SELL" })];

  return {
    organizations: overrides.organizations ?? [{ id: "org-1", name: "Odum" }],
    clients: overrides.clients ?? [{ id: "client-1", name: "Internal Trader" }],
    aggregatedPnL: { realized: 0, unrealized: 0, total: 0 },
    liveTimeSeries: overrides.liveTimeSeries ?? {
      pnl: buildMockTimeSeries(),
      nav: buildMockTimeSeries(5, 1000),
      exposure: buildMockTimeSeries(5, 500),
    },
    batchTimeSeries: overrides.batchTimeSeries ?? {
      pnl: buildMockTimeSeries(5, 90),
      nav: buildMockTimeSeries(5, 990),
      exposure: buildMockTimeSeries(5, 490),
    },
    realtimePnlPoints: overrides.realtimePnlPoints ?? [],
    strategyPerformance: strategies,
    filteredSortedStrategies: overrides.filteredSortedStrategies ?? strategies,
    realtimePnl: overrides.realtimePnl ?? {},
    mockAlerts: alerts,
    ordersData: orders,
    allMockServices: services,
    pnlComponents,
    totalPnl: overrides.totalPnl ?? 1250,
    totalExposure: overrides.totalExposure ?? 85_000,
    totalNav: overrides.totalNav ?? 425_000,
    liveStrategies: overrides.liveStrategies ?? 1,
    warningStrategies: overrides.warningStrategies ?? 1,
    criticalAlerts: overrides.criticalAlerts ?? 1,
    highAlerts: overrides.highAlerts ?? 1,
    coreLoading: overrides.coreLoading ?? false,
    alertsLoading: overrides.alertsLoading ?? false,
    ordersLoading: overrides.ordersLoading ?? false,
    perfLoading: overrides.perfLoading ?? false,
    timeseriesLoading: overrides.timeseriesLoading ?? false,
    liveBatchLoading: overrides.liveBatchLoading ?? false,
    error: overrides.error ?? null,
    formatCurrency: (v: number) => `$${v.toLocaleString()}`,
    formatDollar: (v: number) => `$${v.toLocaleString()}`,
  };
}

/**
 * Minimal useGlobalScope() return shape — only the fields overview widgets
 * read. Use in vi.mock('@/lib/stores/global-scope-store', ...).
 */
export function buildMockGlobalScope(
  overrides: Partial<{
    organizationIds: string[];
    clientIds: string[];
    strategyIds: string[];
    mode: "live" | "batch";
    asOfDatetime: string | undefined;
  }> = {},
) {
  return {
    scope: {
      organizationIds: overrides.organizationIds ?? [],
      clientIds: overrides.clientIds ?? [],
      strategyIds: overrides.strategyIds ?? [],
      strategyFamilyIds: [],
      strategyFamily: undefined,
      strategyArchetype: undefined,
      underlyingIds: [],
      mode: overrides.mode ?? ("live" as const),
      asOfDatetime: overrides.asOfDatetime ?? "2026-04-24T00:00:00Z",
    },
    setOrganizationIds: vi.fn(),
    setClientIds: vi.fn(),
    setStrategyIds: vi.fn(),
    setStrategyFamilyIds: vi.fn(),
    setStrategyFamily: vi.fn(),
    setStrategyArchetype: vi.fn(),
    setUnderlyingIds: vi.fn(),
    setMode: vi.fn(),
    setAsOfDatetime: vi.fn(),
    clearAll: vi.fn(),
    reset: vi.fn(),
  };
}
