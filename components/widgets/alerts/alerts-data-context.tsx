"use client";

import * as React from "react";
import type { FilterDefinition } from "@/components/platform/filter-bar";

export type AlertFilterBarValues = Record<string, string | string[] | Date | { start: Date; end: Date } | undefined>;
import { useAcknowledgeAlert, useAlerts, useEscalateAlert, useResolveAlert } from "@/hooks/api/use-alerts";
import { getAlertsForScope } from "@/lib/mocks/fixtures/mock-data-index";
import { useGlobalScope } from "@/lib/stores/global-scope-store";
import { getStrategyIdsForScope } from "@/lib/stores/scope-helpers";
import { toast } from "sonner";

export type AlertSeverity = "critical" | "high" | "medium" | "low" | "info";
export type AlertStatus = "active" | "acknowledged" | "resolved" | "muted";

export interface Alert {
  id: string;
  severity: AlertSeverity;
  status: AlertStatus;
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

  const allAlerts: Alert[] = React.useMemo(() => {
    const raw = alertsData as Record<string, unknown> | undefined;
    const fromData = raw?.data as Alert[] | undefined;
    const fromAlerts = raw?.alerts as Alert[] | undefined;
    const apiResult = fromData ?? fromAlerts ?? [];
    if (apiResult.length > 0) return apiResult;

    // Fall back to seed data
    const seed = getAlertsForScope(scope.organizationIds, scope.clientIds, scope.strategyIds);
    return seed.map((s) => ({
      id: s.id,
      severity: s.severity as AlertSeverity,
      status: (s.acknowledged ? "acknowledged" : "active") as AlertStatus,
      title: s.message.split(" — ")[0] || s.message,
      description: s.message,
      source: s.source,
      entity: s.strategyId,
      entityType: "strategy" as const,
      timestamp: s.timestamp,
    }));
  }, [alertsData, scope.organizationIds, scope.clientIds, scope.strategyIds]);

  const acknowledgeMutation = useAcknowledgeAlert();
  const escalateMutation = useEscalateAlert();
  const resolveMutation = useResolveAlert();

  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [severityFilter, setSeverityFilter] = React.useState<string>("all");
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
  }, [allAlerts, statusFilter, severityFilter, searchQuery, scopeStrategyIds]);

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
    ],
    [],
  );

  const alertFilterValues = React.useMemo(
    (): AlertFilterBarValues => ({
      search: searchQuery || undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      severity: severityFilter !== "all" ? severityFilter : undefined,
    }),
    [searchQuery, statusFilter, severityFilter],
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
    }
  }, []);

  const handleFilterReset = React.useCallback(() => {
    setSearchQuery("");
    setStatusFilter("all");
    setSeverityFilter("all");
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
