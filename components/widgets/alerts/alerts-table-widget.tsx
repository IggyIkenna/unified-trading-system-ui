"use client";

import { TableWidget } from "@/components/shared/table-widget";
import type { TableActionsConfig, TableFilterConfig } from "@/components/shared/table-widget";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { ALERT_EXPORT_COLUMNS } from "@/lib/config/services/alerts.config";
import { cn } from "@/lib/utils";
import { type ColumnDef } from "@tanstack/react-table";
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpCircle,
  Bell,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import type { Alert, AlertSeverity, AlertStatus } from "./alerts-data-context";
import { useAlertsData } from "./alerts-data-context";

function getSeverityIcon(severity: AlertSeverity) {
  switch (severity) {
    case "critical":
      return <XCircle className="size-4" />;
    case "high":
      return <AlertCircle className="size-4" />;
    case "medium":
      return <AlertTriangle className="size-4" />;
    default:
      return <Bell className="size-4" />;
  }
}

function getSeverityColor(severity: AlertSeverity) {
  switch (severity) {
    case "critical":
      return "text-status-critical bg-status-critical/10 border-status-critical";
    case "high":
      return "text-status-critical bg-status-critical/10 border-status-critical";
    case "medium":
      return "text-status-warning bg-status-warning/10 border-status-warning";
    case "low":
      return "text-status-live bg-status-live/10 border-status-live";
    default:
      return "text-muted-foreground bg-muted/10 border-muted-foreground";
  }
}

function getStatusColor(status: AlertStatus) {
  switch (status) {
    case "active":
      return "text-status-critical";
    case "acknowledged":
      return "text-status-warning";
    case "resolved":
      return "text-status-live";
    default:
      return "text-muted-foreground";
  }
}

function BatchGuardButton({ isBatch, children }: { isBatch: boolean; children: React.ReactNode }) {
  if (!isBatch) return <>{children}</>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0} className="inline-flex">
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent>Switch to live mode to take action</TooltipContent>
    </Tooltip>
  );
}

export function AlertsTableWidget(_props: WidgetComponentProps) {
  const {
    filteredAlerts,
    isLoading,
    isError,
    refetch,
    alertsResponse,
    criticalCount,
    highCount,
    isBatchMode,
    acknowledgeAlert,
    escalateAlert,
    resolveAlert,
    acknowledgePending,
    escalatePending,
    resolvePending,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    severityFilter,
    setSeverityFilter,
    sourceFilter,
    setSourceFilter,
    resetFilters,
  } = useAlertsData();

  const activeFilterCount = [
    searchQuery,
    statusFilter !== "all" ? statusFilter : "",
    severityFilter !== "all" ? severityFilter : "",
    sourceFilter !== "all" ? sourceFilter : "",
  ].filter(Boolean).length;

  const alertColumns: ColumnDef<Alert, unknown>[] = React.useMemo(
    () => [
      {
        accessorKey: "severity",
        header: "Severity",
        cell: ({ row }) => {
          const alert = row.original;
          return (
            <Badge variant="outline" className={cn("gap-1", getSeverityColor(alert.severity))}>
              {getSeverityIcon(alert.severity)}
              <span className="hidden sm:inline">
                {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
              </span>
            </Badge>
          );
        },
      },
      {
        accessorKey: "title",
        header: "Alert",
        cell: ({ row }) => {
          const alert = row.original;
          return (
            <div className="flex flex-col">
              <span className="font-medium">{alert.title}</span>
              <span className="text-xs text-muted-foreground">{alert.description}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "entity",
        header: "Entity",
        cell: ({ row }) => {
          const alert = row.original;
          const isStrategy = alert.entityType === "strategy" && alert.entity;
          return (
            <div className="flex flex-col">
              {isStrategy ? (
                <Link
                  href={`/services/trading/strategies/${encodeURIComponent(alert.entity)}`}
                  className="text-primary hover:underline"
                >
                  {alert.entity}
                </Link>
              ) : (
                <span className="text-foreground">{alert.entity}</span>
              )}
              <span className="text-xs text-muted-foreground capitalize">{alert.entityType}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "value",
        header: "Value / Threshold",
        cell: ({ row }) => {
          const alert = row.original;
          return alert.value && alert.threshold ? (
            <div className="flex flex-col">
              <span className="font-mono font-medium">{alert.value}</span>
              <span className="text-xs text-muted-foreground font-mono">/ {alert.threshold}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const alert = row.original;
          return (
            <Badge variant="outline" className={cn("capitalize", getStatusColor(alert.status))}>
              {alert.status === "active" && <Clock className="size-3 mr-1" />}
              {alert.status === "resolved" && <Check className="size-3 mr-1" />}
              {alert.status}
            </Badge>
          );
        },
      },
      {
        accessorKey: "timestamp",
        header: "Time",
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.timestamp}</span>,
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => {
          const alert = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              {alert.status === "active" && (
                <>
                  <BatchGuardButton isBatch={isBatchMode}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-xs"
                      disabled={isBatchMode || acknowledgePending}
                      aria-label="Acknowledge alert"
                      onClick={() => acknowledgeAlert(alert.id)}
                    >
                      <Check className="size-3" />
                      <span className="hidden lg:inline">Ack</span>
                    </Button>
                  </BatchGuardButton>
                  <BatchGuardButton isBatch={isBatchMode}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-xs"
                      disabled={isBatchMode || escalatePending || alert.severity === "critical"}
                      onClick={() => escalateAlert(alert)}
                    >
                      <ArrowUpCircle className="size-3" />
                      <span className="hidden lg:inline">Escalate</span>
                    </Button>
                  </BatchGuardButton>
                </>
              )}
              {(alert.status === "active" || alert.status === "acknowledged") && (
                <BatchGuardButton isBatch={isBatchMode}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-xs"
                    disabled={isBatchMode || resolvePending}
                    onClick={() => resolveAlert(alert.id)}
                  >
                    <CheckCircle2 className="size-3" />
                    <span className="hidden lg:inline">Resolve</span>
                  </Button>
                </BatchGuardButton>
              )}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1">
                    <ChevronRight className="size-3" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[400px] sm:w-[540px]">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      {getSeverityIcon(alert.severity)}
                      {alert.title}
                    </SheetTitle>
                    <SheetDescription>{alert.description}</SheetDescription>
                  </SheetHeader>
                  <div className="mt-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Severity</div>
                        <Badge variant="outline" className={cn("gap-1", getSeverityColor(alert.severity))}>
                          {getSeverityIcon(alert.severity)}
                          {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                        </Badge>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Status</div>
                        <Badge variant="outline" className={cn("capitalize", getStatusColor(alert.status))}>
                          {alert.status}
                        </Badge>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Entity</div>
                        <div className="text-sm font-medium">{alert.entity}</div>
                        <div className="text-xs text-muted-foreground capitalize">{alert.entityType}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Source</div>
                        <div className="text-sm font-medium">{alert.source}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Time</div>
                        <div className="text-sm font-mono">{alert.timestamp}</div>
                      </div>
                      {alert.value && alert.threshold && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Value / Threshold</div>
                          <div className="text-sm font-mono">
                            {alert.value} / {alert.threshold}
                          </div>
                        </div>
                      )}
                    </div>
                    {alert.recommendedAction && (
                      <Card className="bg-muted/30">
                        <CardContent className="p-4">
                          <div className="text-xs text-muted-foreground mb-1">Recommended Action</div>
                          <div className="text-sm">{alert.recommendedAction}</div>
                        </CardContent>
                      </Card>
                    )}
                    {(alert.status === "active" || alert.status === "acknowledged") && (
                      <div className="flex gap-2 pt-2 flex-wrap">
                        {alert.status === "active" && (
                          <>
                            <BatchGuardButton isBatch={isBatchMode}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5"
                                disabled={isBatchMode || acknowledgePending}
                                aria-label="Acknowledge alert"
                                onClick={() => acknowledgeAlert(alert.id)}
                              >
                                <Check className="size-4" />
                                Acknowledge
                              </Button>
                            </BatchGuardButton>
                            <BatchGuardButton isBatch={isBatchMode}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5"
                                disabled={isBatchMode || escalatePending || alert.severity === "critical"}
                                onClick={() => escalateAlert(alert)}
                              >
                                <ArrowUpCircle className="size-4" />
                                Escalate
                              </Button>
                            </BatchGuardButton>
                          </>
                        )}
                        <BatchGuardButton isBatch={isBatchMode}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            disabled={isBatchMode || resolvePending}
                            onClick={() => resolveAlert(alert.id)}
                          >
                            <CheckCircle2 className="size-4" />
                            Resolve
                          </Button>
                        </BatchGuardButton>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          );
        },
      },
    ],
    [isBatchMode, acknowledgePending, escalatePending, resolvePending, acknowledgeAlert, escalateAlert, resolveAlert],
  );

  // Context-specific badges shown in the right-side actions area
  const alertBadges = (
    <div className="flex items-center gap-1.5 shrink-0">
      {criticalCount > 0 && (
        <Badge variant="destructive" className="gap-1 text-xs">
          <XCircle className="size-3" />
          {criticalCount} Critical
        </Badge>
      )}
      {highCount > 0 && (
        <Badge variant="outline" className="gap-1 text-xs text-status-critical border-status-critical">
          <AlertCircle className="size-3" />
          {highCount} High
        </Badge>
      )}
      {isBatchMode && <span className="text-micro text-status-warning shrink-0">Batch — actions disabled</span>}
    </div>
  );

  const filterConfig: TableFilterConfig = {
    search: {
      query: searchQuery,
      onChange: setSearchQuery,
      placeholder: "Search alerts…",
    },
    selectFilters: [
      {
        value: statusFilter,
        onChange: setStatusFilter,
        placeholder: "Status",
        allLabel: "All Statuses",
        width: "w-32",
        options: [
          { value: "active", label: "Active" },
          { value: "acknowledged", label: "Acknowledged" },
          { value: "resolved", label: "Resolved" },
          { value: "muted", label: "Muted" },
        ],
      },
      {
        value: severityFilter,
        onChange: setSeverityFilter,
        placeholder: "Severity",
        allLabel: "All Severities",
        width: "w-28",
        options: [
          { value: "critical", label: "Critical" },
          { value: "high", label: "High" },
          { value: "medium", label: "Medium" },
          { value: "low", label: "Low" },
          { value: "info", label: "Info" },
        ],
      },
      {
        value: sourceFilter,
        onChange: setSourceFilter,
        placeholder: "Source",
        allLabel: "All Sources",
        width: "w-36",
        options: [{ value: "recovery", label: "Recovery Events" }],
      },
    ],
    activeFilterCount,
    onReset: resetFilters,
  };

  const actionsConfig: TableActionsConfig = {
    onRefresh: refetch,
    extraActions: alertBadges,
    dataFreshness: {
      lastUpdated: alertsResponse ? new Date() : new Date(0),
      isWebSocket: false,
      isBatch: isBatchMode,
    },
    export: {
      data: filteredAlerts as unknown as Record<string, unknown>[],
      columns: ALERT_EXPORT_COLUMNS,
      filename: "alerts",
    },
  };

  return (
    <TableWidget
      data-testid="alerts-table-widget"
      columns={alertColumns}
      data={filteredAlerts}
      filterConfig={filterConfig}
      actions={actionsConfig}
      isLoading={isLoading}
      error={isError ? "Failed to load alerts" : null}
      onRetry={refetch}
      emptyMessage="No active alerts — all systems operating normally"
      enableSorting
      enableColumnVisibility={false}
    />
  );
}
