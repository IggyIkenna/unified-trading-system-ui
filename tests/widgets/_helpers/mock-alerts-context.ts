import { vi } from "vitest";

/**
 * Minimal Alert shape for widget-harness tests. Mirrors the fields
 * alerts-table-widget + alerts-kill-switch-widget actually read from
 * AlertsDataContext; keeping the surface narrow avoids churn when
 * unrelated context fields change.
 */
export interface MockAlert {
  id: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  status: "active" | "acknowledged" | "resolved" | "muted";
  title: string;
  description: string;
  source: string;
  entity: string;
  entityType: "strategy" | "venue" | "service" | "position";
  timestamp: string;
  value?: string;
  threshold?: string;
  recommendedAction?: string;
}

export function buildMockAlert(overrides: Partial<MockAlert> = {}): MockAlert {
  return {
    id: "alert-mock-1",
    severity: "high",
    status: "active",
    title: "Funding Spike",
    description: "Funding rate exceeded threshold on Binance ETH-PERP.",
    source: "market-data",
    entity: "BASIS_TRADE",
    entityType: "strategy",
    timestamp: "2026-04-24T00:00:00Z",
    value: "0.15%",
    threshold: "0.10%",
    ...overrides,
  };
}

export interface MockAlertsDataOverrides {
  alerts?: MockAlert[];
  filteredAlerts?: MockAlert[];
  isLoading?: boolean;
  isError?: boolean;
  isBatchMode?: boolean;
  activeCount?: number;
  criticalCount?: number;
  highCount?: number;
  acknowledgeAlert?: ReturnType<typeof vi.fn>;
  escalateAlert?: ReturnType<typeof vi.fn>;
  resolveAlert?: ReturnType<typeof vi.fn>;
  acknowledgePending?: boolean;
  escalatePending?: boolean;
  resolvePending?: boolean;
  searchQuery?: string;
  statusFilter?: string;
  severityFilter?: string;
  sourceFilter?: string;
}

/**
 * Shared factory for the AlertsDataContext surface consumed by
 * alerts-kill-switch, alerts-kpi-strip, and alerts-table widgets.
 * Reset between tests via `Object.assign(mockData, buildMockAlertsData())`.
 */
export function buildMockAlertsData(overrides: MockAlertsDataOverrides = {}) {
  const defaultAlert = buildMockAlert();
  const alerts = overrides.alerts ?? [defaultAlert];
  const filteredAlerts = overrides.filteredAlerts ?? alerts;

  const activeCount = overrides.activeCount ?? alerts.filter((a) => a.status === "active").length;
  const criticalCount =
    overrides.criticalCount ?? alerts.filter((a) => a.severity === "critical" && a.status === "active").length;
  const highCount = overrides.highCount ?? alerts.filter((a) => a.severity === "high" && a.status === "active").length;

  return {
    alerts,
    filteredAlerts,
    alertsResponse: { data: alerts },
    isLoading: overrides.isLoading ?? false,
    isError: overrides.isError ?? false,
    refetch: vi.fn(),

    searchQuery: overrides.searchQuery ?? "",
    setSearchQuery: vi.fn(),
    statusFilter: overrides.statusFilter ?? "all",
    setStatusFilter: vi.fn(),
    severityFilter: overrides.severityFilter ?? "all",
    setSeverityFilter: vi.fn(),
    sourceFilter: overrides.sourceFilter ?? "all",
    setSourceFilter: vi.fn(),
    resetFilters: vi.fn(),

    alertFilterDefs: [],
    alertFilterValues: {},
    handleFilterChange: vi.fn(),
    handleFilterReset: vi.fn(),

    activeCount,
    criticalCount,
    highCount,

    acknowledgeAlert: overrides.acknowledgeAlert ?? vi.fn(),
    escalateAlert: overrides.escalateAlert ?? vi.fn(),
    resolveAlert: overrides.resolveAlert ?? vi.fn(),
    acknowledgePending: overrides.acknowledgePending ?? false,
    escalatePending: overrides.escalatePending ?? false,
    resolvePending: overrides.resolvePending ?? false,

    isBatchMode: overrides.isBatchMode ?? false,
  };
}
