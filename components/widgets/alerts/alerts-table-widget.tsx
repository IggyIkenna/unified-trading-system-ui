"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataFreshness } from "@/components/ui/data-freshness";
import { DataTable } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { ALERT_EXPORT_COLUMNS } from "@/lib/config/services/alerts.config";
import { cn } from "@/lib/utils";
import { exportTableToCsv, exportTableToXlsx } from "@/lib/utils/export";
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
  Download,
  RefreshCw,
  XCircle,
} from "lucide-react";
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
      return "text-[var(--status-error)] bg-[var(--status-error)]/10 border-[var(--status-error)]";
    case "high":
      return "text-[var(--status-error)] bg-[var(--status-error)]/10 border-[var(--status-error)]";
    case "medium":
      return "text-[var(--status-warning)] bg-[var(--status-warning)]/10 border-[var(--status-warning)]";
    case "low":
      return "text-[var(--status-live)] bg-[var(--status-live)]/10 border-[var(--status-live)]";
    default:
      return "text-muted-foreground bg-muted/10 border-muted-foreground";
  }
}

function getStatusColor(status: AlertStatus) {
  switch (status) {
    case "active":
      return "text-[var(--status-error)]";
    case "acknowledged":
      return "text-[var(--status-warning)]";
    case "resolved":
      return "text-[var(--status-live)]";
    case "muted":
      return "text-muted-foreground";
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
  } = useAlertsData();

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
          return (
            <div className="flex flex-col">
              <span className="text-primary hover:underline cursor-pointer">{alert.entity}</span>
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

  if (isLoading) {
    return (
      <div className="space-y-3 p-2">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-24" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4">
        <AlertCircle className="size-10 text-[var(--status-error)] mb-3" />
        <h3 className="text-sm font-semibold">Failed to load alerts</h3>
        <p className="text-xs text-muted-foreground mt-1 mb-3">
          Could not fetch alerts from the server. Please try again.
        </p>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => refetch()}>
          <RefreshCw className="size-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 h-full min-h-0 p-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between shrink-0">
        <div className="flex flex-wrap items-center gap-2">
          <DataFreshness lastUpdated={alertsResponse ? new Date() : null} isWebSocket={false} isBatch={isBatchMode} />
          {criticalCount > 0 && (
            <Badge variant="destructive" className="gap-1 text-xs">
              <XCircle className="size-3" />
              {criticalCount} Critical
            </Badge>
          )}
          {highCount > 0 && (
            <Badge variant="outline" className="gap-1 text-xs text-[var(--status-error)] border-[var(--status-error)]">
              <AlertCircle className="size-3" />
              {highCount} High
            </Badge>
          )}
          {isBatchMode && (
            <span className="text-[10px] text-[var(--status-warning)]">Batch mode — row actions disabled</span>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
              <Download className="size-3.5" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onClick={() =>
                exportTableToCsv(filteredAlerts as unknown as Record<string, unknown>[], ALERT_EXPORT_COLUMNS, "alerts")
              }
            >
              CSV
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                exportTableToXlsx(
                  filteredAlerts as unknown as Record<string, unknown>[],
                  ALERT_EXPORT_COLUMNS,
                  "alerts",
                )
              }
            >
              Excel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex-1 min-h-0">
        <DataTable
          columns={alertColumns}
          data={filteredAlerts}
          emptyMessage="No active alerts — all systems operating normally"
          enableSorting
          enableColumnVisibility={false}
        />
      </div>
    </div>
  );
}
