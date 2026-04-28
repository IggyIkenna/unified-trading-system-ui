"use client";

import * as React from "react";
import type { FilterDefinition } from "@/components/shared/filter-bar";

export type AlertFilterBarValues = Record<string, string | string[] | Date | { start: Date; end: Date } | undefined>;
import { useAcknowledgeAlert, useAlerts, useEscalateAlert, useResolveAlert } from "@/hooks/api/use-alerts";
import { getAlertsForScope } from "@/lib/mocks/fixtures/mock-data-index";
import type { AlertType } from "@/lib/config/services/alerts.config";
export type { AlertType };
import { useGlobalScope } from "@/lib/stores/global-scope-store";
import { getStrategyIdsForScope } from "@/lib/stores/scope-helpers";
import { toast } from "sonner";
import { getFilledDefiOrders } from "@/lib/api/mock-trade-ledger";

export type AlertSeverity = "critical" | "high" | "medium" | "low" | "info";
export type AlertStatus = "active" | "acknowledged" | "resolved" | "muted";

/** Prefixes that identify autonomous recovery events in the alert stream. */
const RECOVERY_SOURCE_PREFIXES = [
  "KILL_SWITCH_",
  "CIRCUIT_BREAKER_",
  "POSITION_DRIFT_",
  "DUAL_FAILURE_",
  "TRANSFER_",
  "AUTO_DELEVERAGE_",
];

export interface Alert {
  id: string;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  description: string;
  source: string;
  entity: string;
  alertType: AlertType;
  timestamp: string;
  value?: string;
  threshold?: string;
  recommendedAction?: string;
}

export interface AlertsDataContextValue {
  alerts: Alert[];
  filteredAlerts: Alert[];
  alertsResponse: unknown;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;

  searchQuery: string;
  setSearchQuery: (q: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  severityFilter: string;
  setSeverityFilter: (s: string) => void;
  sourceFilter: string;
  setSourceFilter: (s: string) => void;
  resetFilters: () => void;

  alertFilterDefs: FilterDefinition[];
  alertFilterValues: AlertFilterBarValues;
  handleFilterChange: (key: string, value: unknown) => void;
  handleFilterReset: () => void;

  activeCount: number;
  criticalCount: number;
  highCount: number;

  acknowledgeAlert: (id: string) => void;
  escalateAlert: (alert: Alert) => void;
  resolveAlert: (id: string) => void;
  acknowledgePending: boolean;
  escalatePending: boolean;
  resolvePending: boolean;

  isBatchMode: boolean;
}

const AlertsDataContext = React.createContext<AlertsDataContextValue | null>(null);

export function AlertsDataProvider({ children }: { children: React.ReactNode }) {
  const { data: alertsData, isLoading, isError, refetch } = useAlerts();
  const { scope } = useGlobalScope();
  const isBatchMode = scope.mode === "batch";
  const [ledgerVersion, setLedgerVersion] = React.useState(0);

  // Listen for ledger changes to generate reactive DeFi alerts
  React.useEffect(() => {
    const refresh = () => setLedgerVersion((v) => v + 1);
    window.addEventListener("mock-order-filled", refresh);
    window.addEventListener("mock-ledger-reset", refresh);
    return () => {
      window.removeEventListener("mock-order-filled", refresh);
      window.removeEventListener("mock-ledger-reset", refresh);
    };
  }, []);

  // Generate reactive DeFi alerts from trade ledger state
  const defiAlerts: Alert[] = React.useMemo(() => {
    const filledDefi = getFilledDefiOrders();
    const alerts: Alert[] = [];

    // Check for recursive strategies (HF alert)
    const hasRecursive = filledDefi.some(
      (o) => o.strategy_id === "RECURSIVE_STAKED_BASIS" || o.instrument_id.toUpperCase().includes("DEBT_TOKEN"),
    );
    if (hasRecursive) {
      alerts.push({
        id: "defi-alert-hf-monitor",
        severity: "medium",
        status: "active",
        title: "Health Factor Monitoring Active",
        description: "Recursive position active. Health Factor = 1.42 (target: 1.50). Alert if HF < 1.25.",
        source: "risk-engine",
        entity: "RECURSIVE_STAKED_BASIS",
        alertType: "HEALTH_FACTOR_CRITICAL",
        timestamp: new Date().toISOString(),
        value: "1.42",
        threshold: "1.25",
      });
    }

    // Check for basis trades (funding rate alert)
    const hasBasis = filledDefi.some(
      (o) => o.strategy_id === "BASIS_TRADE" || (o.instrument_id.toUpperCase().includes("PERP") && o.side === "sell"),
    );
    if (hasBasis) {
      alerts.push({
        id: "defi-alert-funding-positive",
        severity: "info",
        status: "active",
        title: "Funding Rate Positive",
        description: "Basis trade collecting funding: BTC 0.012%/8h, ETH 0.008%/8h. All venues positive.",
        source: "market-data",
        entity: "BASIS_TRADE",
        alertType: "FUNDING_RATE_FLIP",
        timestamp: new Date().toISOString(),
        value: "0.012%/8h",
      });
    }

    // Check for large positions (treasury alert)
    if (filledDefi.length > 5) {
      alerts.push({
        id: "defi-alert-treasury-high",
        severity: "low",
        status: "active",
        title: "Treasury Allocation Above Target",
        description: "Treasury at 35% of AUM (target: 20%). Consider rebalancing to increase yield generation.",
        source: "treasury-monitor",
        entity: "PORTFOLIO",
        alertType: "EXPOSURE_BREACH",
        timestamp: new Date().toISOString(),
        value: "35%",
        threshold: "20%",
        recommendedAction: "Trigger rebalance from DeFi → Wallet Summary widget.",
      });
    }

    return alerts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ledgerVersion]);

  const allAlerts: Alert[] = React.useMemo(() => {
    const raw = alertsData as Record<string, unknown> | undefined;
    const fromData = raw?.data as Alert[] | undefined;
    const fromAlerts = raw?.alerts as Alert[] | undefined;
    const apiResult = fromData ?? fromAlerts ?? [];
    if (apiResult.length > 0) return [...apiResult, ...defiAlerts];

    // Fall back to seed data + reactive DeFi alerts
    const seed = getAlertsForScope(scope.organizationIds, scope.clientIds, scope.strategyIds);
    const seedAlerts = seed.map((s) => ({
      id: s.id,
      severity: s.severity as AlertSeverity,
      status: (s.acknowledged ? "acknowledged" : "active") as AlertStatus,
      title: s.message.split(": ")[0] || s.message,
      description: s.message,
      source: s.source,
      entity: s.strategyId,
      alertType: (s.alertType ?? "GENERIC") as AlertType,
      timestamp: s.timestamp,
    }));
    return [...seedAlerts, ...defiAlerts];
  }, [alertsData, scope.organizationIds, scope.clientIds, scope.strategyIds, defiAlerts]);

  const acknowledgeMutation = useAcknowledgeAlert();
  const escalateMutation = useEscalateAlert();
  const resolveMutation = useResolveAlert();

  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [severityFilter, setSeverityFilter] = React.useState<string>("all");
  const [sourceFilter, setSourceFilter] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  const scopeStrategyIds = React.useMemo(
    () =>
      getStrategyIdsForScope({
        organizationIds: scope.organizationIds,
        clientIds: scope.clientIds,
        strategyIds: scope.strategyIds,
      }),
    [scope.organizationIds, scope.clientIds, scope.strategyIds],
  );

  const filteredAlerts = React.useMemo(() => {
    return allAlerts.filter((alert) => {
      if (scopeStrategyIds.length > 0 && alert.entity && !scopeStrategyIds.includes(alert.entity)) return false;
      if (statusFilter !== "all" && alert.status !== statusFilter) return false;
      if (severityFilter !== "all" && alert.severity !== severityFilter) return false;
      if (sourceFilter === "recovery") {
        const src = alert.source.toUpperCase();
        const title = alert.title.toUpperCase();
        const isRecovery = RECOVERY_SOURCE_PREFIXES.some((p) => src.includes(p) || title.includes(p));
        if (!isRecovery) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          alert.title.toLowerCase().includes(q) ||
          alert.description.toLowerCase().includes(q) ||
          alert.entity.toLowerCase().includes(q) ||
          alert.source.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allAlerts, statusFilter, severityFilter, sourceFilter, searchQuery, scopeStrategyIds]);

  const alertFilterDefs: FilterDefinition[] = React.useMemo(
    () => [
      {
        key: "search",
        label: "Search",
        type: "search" as const,
        placeholder: "Search alerts...",
      },
      {
        key: "status",
        label: "Status",
        type: "select" as const,
        options: [
          { value: "active", label: "Active" },
          { value: "acknowledged", label: "Acknowledged" },
          { value: "resolved", label: "Resolved" },
          { value: "muted", label: "Muted" },
        ],
      },
      {
        key: "severity",
        label: "Severity",
        type: "select" as const,
        options: [
          { value: "critical", label: "Critical" },
          { value: "high", label: "High" },
          { value: "medium", label: "Medium" },
          { value: "low", label: "Low" },
          { value: "info", label: "Info" },
        ],
      },
      {
        key: "source",
        label: "Source",
        type: "select" as const,
        options: [{ value: "recovery", label: "Recovery Events" }],
      },
    ],
    [],
  );

  const alertFilterValues = React.useMemo(
    (): AlertFilterBarValues => ({
      search: searchQuery || undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      severity: severityFilter !== "all" ? severityFilter : undefined,
      source: sourceFilter !== "all" ? sourceFilter : undefined,
    }),
    [searchQuery, statusFilter, severityFilter, sourceFilter],
  );

  const handleFilterChange = React.useCallback((key: string, value: unknown) => {
    switch (key) {
      case "search":
        setSearchQuery((value as string) || "");
        break;
      case "status":
        setStatusFilter((value as string) || "all");
        break;
      case "severity":
        setSeverityFilter((value as string) || "all");
        break;
      case "source":
        setSourceFilter((value as string) || "all");
        break;
    }
  }, []);

  const handleFilterReset = React.useCallback(() => {
    setSearchQuery("");
    setStatusFilter("all");
    setSeverityFilter("all");
    setSourceFilter("all");
  }, []);

  const resetFilters = handleFilterReset;

  const acknowledgeAlert = React.useCallback(
    (id: string) => {
      acknowledgeMutation.mutate(id, {
        onSuccess: () => toast.success("Alert acknowledged"),
        onError: () => toast.error("Failed to acknowledge alert"),
      });
    },
    [acknowledgeMutation],
  );

  const escalateAlert = React.useCallback(
    (alert: Alert) => {
      escalateMutation.mutate(alert.id, {
        onSuccess: () => {
          const nextSeverity =
            alert.severity === "low"
              ? "medium"
              : alert.severity === "medium"
                ? "high"
                : alert.severity === "high"
                  ? "critical"
                  : "critical";
          toast.success(`Alert escalated to ${nextSeverity}`);
        },
        onError: () => toast.error("Failed to escalate alert"),
      });
    },
    [escalateMutation],
  );

  const resolveAlert = React.useCallback(
    (id: string) => {
      resolveMutation.mutate(id, {
        onSuccess: () => toast.success("Alert resolved"),
        onError: () => toast.error("Failed to resolve alert"),
      });
    },
    [resolveMutation],
  );

  const criticalCount = allAlerts.filter((a) => a.severity === "critical" && a.status === "active").length;
  const highCount = allAlerts.filter((a) => a.severity === "high" && a.status === "active").length;
  const activeCount = allAlerts.filter((a) => a.status === "active").length;

  const value: AlertsDataContextValue = React.useMemo(
    () => ({
      alerts: allAlerts,
      filteredAlerts,
      alertsResponse: alertsData,
      isLoading,
      isError,
      refetch,
      searchQuery,
      setSearchQuery,
      statusFilter,
      setStatusFilter,
      severityFilter,
      setSeverityFilter,
      sourceFilter,
      setSourceFilter,
      resetFilters,
      alertFilterDefs,
      alertFilterValues,
      handleFilterChange,
      handleFilterReset,
      activeCount,
      criticalCount,
      highCount,
      acknowledgeAlert,
      escalateAlert,
      resolveAlert,
      acknowledgePending: acknowledgeMutation.isPending,
      escalatePending: escalateMutation.isPending,
      resolvePending: resolveMutation.isPending,
      isBatchMode,
    }),
    [
      allAlerts,
      filteredAlerts,
      alertsData,
      isLoading,
      isError,
      refetch,
      searchQuery,
      statusFilter,
      severityFilter,
      sourceFilter,
      resetFilters,
      alertFilterDefs,
      alertFilterValues,
      handleFilterChange,
      handleFilterReset,
      activeCount,
      criticalCount,
      highCount,
      acknowledgeAlert,
      escalateAlert,
      resolveAlert,
      acknowledgeMutation.isPending,
      escalateMutation.isPending,
      resolveMutation.isPending,
      isBatchMode,
    ],
  );

  return <AlertsDataContext.Provider value={value}>{children}</AlertsDataContext.Provider>;
}

export function useAlertsData(): AlertsDataContextValue {
  const ctx = React.useContext(AlertsDataContext);
  if (!ctx) throw new Error("useAlertsData must be used within AlertsDataProvider");
  return ctx;
}
