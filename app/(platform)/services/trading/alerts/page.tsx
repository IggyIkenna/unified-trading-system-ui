"use client";

import {
  FilterBar,
  type FilterDefinition,
} from "@/components/platform/filter-bar";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useAcknowledgeAlert,
  useAlerts,
  useEscalateAlert,
  useResolveAlert,
} from "@/hooks/api/use-alerts";
import { useGlobalScope } from "@/lib/stores/global-scope-store";
import { cn } from "@/lib/utils";
import {
  exportTableToCsv,
  exportTableToXlsx,
  type ExportColumn,
} from "@/lib/utils/export";
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
  Pause,
  Power,
  RefreshCw,
  Search,
  Square,
  XCircle,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

type AlertSeverity = "critical" | "high" | "medium" | "low" | "info";
type AlertStatus = "active" | "acknowledged" | "resolved" | "muted";

interface Alert {
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

/** Wraps a button with a tooltip when disabled (batch mode). */
function BatchGuardButton({
  isBatch,
  children,
}: {
  isBatch: boolean;
  children: React.ReactNode;
}) {
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

const ALERT_EXPORT_COLUMNS: ExportColumn[] = [
  { key: "severity", header: "Severity" },
  { key: "status", header: "Status" },
  { key: "title", header: "Title" },
  { key: "source", header: "Source" },
  { key: "entity", header: "Entity" },
  { key: "value", header: "Value", format: "number" },
  { key: "threshold", header: "Threshold", format: "number" },
  { key: "timestamp", header: "Timestamp" },
];

export default function AlertsPage() {
  const { data: alertsData, isLoading, isError, refetch } = useAlerts();
  const allAlerts: Alert[] =
    ((alertsData as unknown as Record<string, unknown>)?.data as Alert[]) ??
    ((alertsData as unknown as Record<string, unknown>)?.alerts as Alert[]) ??
    [];

  const { scope } = useGlobalScope();
  const isBatchMode = scope.mode === "batch";

  const acknowledgeMutation = useAcknowledgeAlert();
  const escalateMutation = useEscalateAlert();
  const resolveMutation = useResolveAlert();

  const [filter, setFilter] = React.useState<string>("all");
  const [severityFilter, setSeverityFilter] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  const filteredAlerts = React.useMemo(() => {
    return allAlerts.filter((alert) => {
      // Global scope filter
      if (
        scope.strategyIds.length > 0 &&
        alert.entity &&
        !scope.strategyIds.includes(alert.entity)
      )
        return false;
      if (filter !== "all" && alert.status !== filter) return false;
      if (severityFilter !== "all" && alert.severity !== severityFilter)
        return false;
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
  }, [allAlerts, filter, severityFilter, searchQuery, scope.strategyIds]);

  // FilterBar definitions
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
    () => ({
      search: searchQuery || undefined,
      status: filter !== "all" ? filter : undefined,
      severity: severityFilter !== "all" ? severityFilter : undefined,
    }),
    [searchQuery, filter, severityFilter],
  );

  const handleFilterChange = React.useCallback(
    (key: string, value: unknown) => {
      switch (key) {
        case "search":
          setSearchQuery((value as string) || "");
          break;
        case "status":
          setFilter((value as string) || "all");
          break;
        case "severity":
          setSeverityFilter((value as string) || "all");
          break;
      }
    },
    [],
  );

  const handleFilterReset = React.useCallback(() => {
    setSearchQuery("");
    setFilter("all");
    setSeverityFilter("all");
  }, []);

  const handleAcknowledge = React.useCallback(
    (alert: Alert) => {
      acknowledgeMutation.mutate(alert.id, {
        onSuccess: () => toast.success("Alert acknowledged"),
        onError: () => toast.error("Failed to acknowledge alert"),
      });
    },
    [acknowledgeMutation],
  );

  const handleEscalate = React.useCallback(
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

  const handleResolve = React.useCallback(
    (alert: Alert) => {
      resolveMutation.mutate(alert.id, {
        onSuccess: () => toast.success("Alert resolved"),
        onError: () => toast.error("Failed to resolve alert"),
      });
    },
    [resolveMutation],
  );

  const alertColumns: ColumnDef<Alert, unknown>[] = [
    {
      accessorKey: "severity",
      header: "Severity",
      cell: ({ row }) => {
        const alert = row.original;
        return (
          <Badge
            variant="outline"
            className={cn("gap-1", getSeverityColor(alert.severity))}
          >
            {getSeverityIcon(alert.severity)}
            <span className="hidden sm:inline">
              {alert.severity.charAt(0).toUpperCase() +
                alert.severity.slice(1)}
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
            <span className="text-xs text-muted-foreground">
              {alert.description}
            </span>
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
            <span className="text-primary hover:underline cursor-pointer">
              {alert.entity}
            </span>
            <span className="text-xs text-muted-foreground capitalize">
              {alert.entityType}
            </span>
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
            <span className="text-xs text-muted-foreground font-mono">
              / {alert.threshold}
            </span>
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
          <Badge
            variant="outline"
            className={cn("capitalize", getStatusColor(alert.status))}
          >
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
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.timestamp}
        </span>
      ),
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
                    disabled={isBatchMode || acknowledgeMutation.isPending}
                    aria-label="Acknowledge alert"
                    onClick={() => handleAcknowledge(alert)}
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
                    disabled={
                      isBatchMode ||
                      escalateMutation.isPending ||
                      alert.severity === "critical"
                    }
                    onClick={() => handleEscalate(alert)}
                  >
                    <ArrowUpCircle className="size-3" />
                    <span className="hidden lg:inline">Escalate</span>
                  </Button>
                </BatchGuardButton>
              </>
            )}
            {(alert.status === "active" ||
              alert.status === "acknowledged") && (
                <BatchGuardButton isBatch={isBatchMode}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-xs"
                    disabled={isBatchMode || resolveMutation.isPending}
                    onClick={() => handleResolve(alert)}
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
                      <div className="text-xs text-muted-foreground mb-1">
                        Severity
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "gap-1",
                          getSeverityColor(alert.severity),
                        )}
                      >
                        {getSeverityIcon(alert.severity)}
                        {alert.severity.charAt(0).toUpperCase() +
                          alert.severity.slice(1)}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        Status
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "capitalize",
                          getStatusColor(alert.status),
                        )}
                      >
                        {alert.status}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        Entity
                      </div>
                      <div className="text-sm font-medium">
                        {alert.entity}
                      </div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {alert.entityType}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        Source
                      </div>
                      <div className="text-sm font-medium">
                        {alert.source}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        Time
                      </div>
                      <div className="text-sm font-mono">
                        {alert.timestamp}
                      </div>
                    </div>
                    {alert.value && alert.threshold && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">
                          Value / Threshold
                        </div>
                        <div className="text-sm font-mono">
                          {alert.value} / {alert.threshold}
                        </div>
                      </div>
                    )}
                  </div>
                  {alert.recommendedAction && (
                    <Card className="bg-muted/30">
                      <CardContent className="p-4">
                        <div className="text-xs text-muted-foreground mb-1">
                          Recommended Action
                        </div>
                        <div className="text-sm">
                          {alert.recommendedAction}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {/* Detail sheet action buttons */}
                  {(alert.status === "active" ||
                    alert.status === "acknowledged") && (
                      <div className="flex gap-2 pt-2">
                        {alert.status === "active" && (
                          <>
                            <BatchGuardButton isBatch={isBatchMode}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5"
                                disabled={
                                  isBatchMode || acknowledgeMutation.isPending
                                }
                                aria-label="Acknowledge alert"
                                onClick={() => handleAcknowledge(alert)}
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
                                disabled={
                                  isBatchMode ||
                                  escalateMutation.isPending ||
                                  alert.severity === "critical"
                                }
                                onClick={() => handleEscalate(alert)}
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
                            disabled={isBatchMode || resolveMutation.isPending}
                            onClick={() => handleResolve(alert)}
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
  ];

  const criticalCount = allAlerts.filter(
    (a) => a.severity === "critical" && a.status === "active",
  ).length;
  const highCount = allAlerts.filter(
    (a) => a.severity === "high" && a.status === "active",
  ).length;
  const activeCount = allAlerts.filter((a) => a.status === "active").length;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-[1400px] mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <Skeleton className="size-6 rounded-full" />
            <Skeleton className="h-7 w-32" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-48" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="size-12 text-[var(--status-error)] mb-4" />
        <h3 className="text-lg font-semibold">Failed to load alerts</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          Could not fetch alerts from the server. Please try again.
        </p>
        <Button variant="outline" className="gap-2" onClick={() => refetch()}>
          <RefreshCw className="size-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Bell className="size-6 text-primary" />
              Alerts & Incidents
            </h1>
            <p className="text-sm text-muted-foreground">
              Real-time alert feed with incident management
              {isBatchMode && (
                <span className="ml-2 text-[var(--status-warning)]">
                  (Batch mode — actions disabled)
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <DataFreshness
              lastUpdated={alertsData ? new Date() : null}
              isWebSocket={false}
              isBatch={isBatchMode}
            />
            {criticalCount > 0 && (
              <Badge variant="destructive" className="gap-1">
                <XCircle className="size-3" />
                {criticalCount} Critical
              </Badge>
            )}
            {highCount > 0 && (
              <Badge
                variant="outline"
                className="gap-1 text-[var(--status-error)] border-[var(--status-error)]"
              >
                <AlertCircle className="size-3" />
                {highCount} High
              </Badge>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Download className="size-3.5" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() =>
                    exportTableToCsv(
                      filteredAlerts as unknown as Record<string, unknown>[],
                      ALERT_EXPORT_COLUMNS,
                      "alerts",
                    )
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
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-1.5">
                  <Power className="size-4" />
                  Kill Switch
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[400px] sm:w-[540px]">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2 text-[var(--status-error)]">
                    <Power className="size-5" />
                    Kill Switch Panel
                  </SheetTitle>
                  <SheetDescription>
                    Emergency intervention controls. All actions require
                    confirmation.
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  {/* Scope Selector */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Scope</label>
                    <Select defaultValue="strategy">
                      <SelectTrigger>
                        <SelectValue placeholder="Select scope" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="firm">Firm (All)</SelectItem>
                        <SelectItem value="client">Client</SelectItem>
                        <SelectItem value="strategy">Strategy</SelectItem>
                        <SelectItem value="venue">Venue</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select defaultValue="btc-basis">
                      <SelectTrigger>
                        <SelectValue placeholder="Select entity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="btc-basis">BTC Basis v3</SelectItem>
                        <SelectItem value="eth-staked">
                          ETH Staked Basis
                        </SelectItem>
                        <SelectItem value="ml-directional">
                          ML Directional BTC
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Actions</label>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        className="gap-2 justify-start h-auto py-3"
                      >
                        <Pause className="size-4 text-[var(--status-warning)]" />
                        <div className="text-left">
                          <div className="font-medium">Pause Strategy</div>
                          <div className="text-xs text-muted-foreground">
                            Stop new orders
                          </div>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        className="gap-2 justify-start h-auto py-3"
                      >
                        <XCircle className="size-4 text-[var(--status-error)]" />
                        <div className="text-left">
                          <div className="font-medium">Cancel Orders</div>
                          <div className="text-xs text-muted-foreground">
                            Cancel all open
                          </div>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        className="gap-2 justify-start h-auto py-3"
                      >
                        <Square className="size-4 text-[var(--status-error)]" />
                        <div className="text-left">
                          <div className="font-medium">Flatten</div>
                          <div className="text-xs text-muted-foreground">
                            Close all positions
                          </div>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        className="gap-2 justify-start h-auto py-3"
                      >
                        <Power className="size-4 text-[var(--status-error)]" />
                        <div className="text-left">
                          <div className="font-medium">Disable Venue</div>
                          <div className="text-xs text-muted-foreground">
                            Block venue access
                          </div>
                        </div>
                      </Button>
                    </div>
                  </div>

                  {/* Rationale */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium">
                      Rationale (required)
                    </label>
                    <Input placeholder="Describe reason for intervention..." />
                  </div>

                  {/* Impact Preview */}
                  <Card className="bg-[var(--status-error)]/5 border-[var(--status-error)]/20">
                    <CardContent className="p-4">
                      <div className="text-sm font-medium text-[var(--status-error)] mb-2">
                        Impact Preview
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>Affected positions: 2</div>
                        <div>Open orders: 5</div>
                        <div>Estimated market impact: ~$2,400</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Button variant="destructive" className="w-full gap-2">
                    <Power className="size-4" />
                    Confirm Action
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Unified Filter Bar */}
        <FilterBar
          filters={alertFilterDefs}
          values={alertFilterValues}
          onChange={handleFilterChange}
          onReset={handleFilterReset}
          className="-mx-6 rounded-none"
        />

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground mb-1">
                Active Alerts
              </div>
              <div className="text-3xl font-semibold font-mono">
                {activeCount}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground mb-1">Critical</div>
              <div className="text-3xl font-semibold font-mono text-[var(--status-error)]">
                {criticalCount}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground mb-1">
                Avg Resolution
              </div>
              <div className="text-3xl font-semibold font-mono">12m</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground mb-1">Last 24h</div>
              <div className="text-3xl font-semibold font-mono">23</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search alerts..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-full md:w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="acknowledged">Acknowledged</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="muted">Muted</SelectItem>
            </SelectContent>
          </Select>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-full md:w-[140px]">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severity</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="info">Info</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Alerts Table */}
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
