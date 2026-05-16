"use client";

import { PnLAttributionPanel } from "@/components/trading/pnl-attribution-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/shared/spinner";
import type { ServiceHealth } from "@/components/trading/health-status-grid";
import { StatusDot } from "@/components/shared/status-badge";
import type { WidgetComponentProps } from "../widget-registry";
import type { Alert, AlertSeverity } from "../alerts/alerts-data-context";
import { useAlertsData } from "../alerts/alerts-data-context";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, AlertTriangle, Bell, Info, RefreshCw, XCircle } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useOverviewDataSafe } from "./overview-data-context";

function formatFreshness(seconds: number): string {
  if (seconds <= 0) return "--";
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h`;
}

function getHealthStatus(freshness: number, sla: number): "live" | "warning" | "critical" | "idle" {
  if (freshness <= 0) return "idle";
  if (freshness <= sla) return "live";
  if (freshness <= sla * 2) return "warning";
  return "critical";
}

function getHealthOrder(freshness: number, sla: number): number {
  const status = getHealthStatus(freshness, sla);
  return status === "live" ? 2 : status === "warning" ? 1 : status === "critical" ? 0 : 3;
}

const ALERT_SEVERITY_RANK: Record<AlertSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

const ALERT_SEVERITY_META: Record<
  AlertSeverity,
  { label: string; chipClass: string; iconClass: string; Icon: typeof XCircle }
> = {
  critical: {
    label: "CRIT",
    chipClass: "text-rose-400 border-rose-400/40 bg-rose-400/10",
    iconClass: "text-rose-400",
    Icon: XCircle,
  },
  high: {
    label: "HIGH",
    chipClass: "text-amber-400 border-amber-400/40 bg-amber-400/10",
    iconClass: "text-amber-400",
    Icon: AlertTriangle,
  },
  medium: {
    label: "MED",
    chipClass: "text-sky-400 border-sky-400/40 bg-sky-400/10",
    iconClass: "text-sky-400",
    Icon: AlertCircle,
  },
  low: {
    label: "LOW",
    chipClass: "text-zinc-400 border-zinc-400/40 bg-zinc-400/10",
    iconClass: "text-zinc-400",
    Icon: Bell,
  },
  info: {
    label: "INFO",
    chipClass: "text-emerald-400 border-emerald-400/40 bg-emerald-400/10",
    iconClass: "text-emerald-400",
    Icon: Info,
  },
};

function alertTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function PnLAttributionWidget(_props: WidgetComponentProps) {
  const ctx = useOverviewDataSafe();
  if (!ctx)
    return (
      <div className="flex h-full items-center justify-center p-3 text-xs text-muted-foreground">
        Navigate to Overview tab
      </div>
    );
  const { pnlComponents, totalPnl, coreLoading } = ctx;
  return (
    <div className="p-3">
      <div className="flex justify-end mb-2">
        <Link href="/services/workspace?surface=terminal&tm=explain">
          <Button variant="ghost" size="sm" className="h-7 text-xs">
            View All
          </Button>
        </Link>
      </div>
      {coreLoading ? (
        <div className="flex items-center justify-center py-6 text-muted-foreground">
          <Spinner className="size-4 mr-2" />
        </div>
      ) : pnlComponents.length === 0 ? (
        <div className="flex items-center justify-center py-6 text-muted-foreground text-xs">
          No P&amp;L attribution data
        </div>
      ) : (
        <PnLAttributionPanel components={pnlComponents} totalPnl={totalPnl} />
      )}
    </div>
  );
}

export function AlertsPreviewWidget(_props: WidgetComponentProps) {
  const { filteredAlerts, isLoading } = useAlertsData();

  const activeAlerts = React.useMemo(() => filteredAlerts.filter((a) => a.status === "active"), [filteredAlerts]);

  const severityCounts = React.useMemo(() => {
    const counts: Record<AlertSeverity, number> = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    for (const a of activeAlerts) counts[a.severity] += 1;
    return counts;
  }, [activeAlerts]);

  const recentAlerts = React.useMemo(() => {
    return [...activeAlerts]
      .sort((a, b) => {
        const r = ALERT_SEVERITY_RANK[a.severity] - ALERT_SEVERITY_RANK[b.severity];
        if (r !== 0) return r;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      })
      .slice(0, 3);
  }, [activeAlerts]);

  const hasCounts = activeAlerts.length > 0;

  return (
    <div className="flex h-full flex-col p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Bell className="size-3.5" />
          <span>{hasCounts ? `${activeAlerts.length} active` : "All clear"}</span>
        </div>
        <Link href="/services/workspace?surface=terminal&tm=command">
          <Button variant="ghost" size="sm" className="h-7 text-xs">
            View All
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-6 text-muted-foreground">
          <Spinner className="size-4 mr-2" />
        </div>
      ) : !hasCounts ? (
        <div className="flex items-center justify-center py-6 text-muted-foreground text-xs">No active alerts</div>
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {(Object.keys(ALERT_SEVERITY_META) as AlertSeverity[])
              .filter((sev) => severityCounts[sev] > 0)
              .map((sev) => {
                const meta = ALERT_SEVERITY_META[sev];
                return (
                  <Badge
                    key={sev}
                    variant="outline"
                    className={cn("text-nano px-1.5 py-0 h-5 font-mono gap-1", meta.chipClass)}
                  >
                    <span>{meta.label}</span>
                    <span className="font-semibold">{severityCounts[sev]}</span>
                  </Badge>
                );
              })}
          </div>

          <div className="flex-1 min-h-0 space-y-1.5 overflow-y-auto">
            {recentAlerts.map((a: Alert) => {
              const meta = ALERT_SEVERITY_META[a.severity];
              const Icon = meta.Icon;
              return (
                <Link
                  key={a.id}
                  href="/services/workspace?surface=terminal&tm=command"
                  className="block rounded-md border border-border/40 hover:border-border hover:bg-muted/30 transition-colors px-2 py-1.5"
                >
                  <div className="flex items-start gap-2">
                    <Icon className={cn("size-3.5 mt-0.5 shrink-0", meta.iconClass)} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{a.title}</div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-nano text-muted-foreground">
                        <span className="font-mono truncate">{a.source}</span>
                        <span>·</span>
                        <span suppressHydrationWarning>{alertTimeAgo(a.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export function RecentFillsWidget(_props: WidgetComponentProps) {
  const ctx = useOverviewDataSafe();
  if (!ctx)
    return (
      <div className="flex h-full items-center justify-center p-3 text-xs text-muted-foreground">
        Navigate to Overview tab
      </div>
    );
  const { ordersData, ordersLoading } = ctx;
  const orders = Array.isArray(ordersData)
    ? (ordersData as Array<Record<string, unknown>>)
    : (((ordersData as Record<string, unknown> | null)?.orders ?? []) as Array<Record<string, unknown>>);

  return (
    <div className="p-3">
      <div className="flex justify-end mb-2">
        <Link href="/services/workspace?surface=terminal&tm=command">
          <Button variant="ghost" size="sm" className="h-7 text-xs">
            View All
          </Button>
        </Link>
      </div>
      {ordersLoading ? (
        <div className="flex items-center justify-center py-6 text-muted-foreground">
          <Spinner className="size-4 mr-2" />
        </div>
      ) : orders.length === 0 ? (
        <div className="flex items-center justify-center py-6 text-muted-foreground text-xs">No recent fills</div>
      ) : (
        <div className="space-y-1.5">
          {orders.slice(0, 5).map((o, i) => (
            <div
              key={String(o.order_id ?? i)}
              className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0 text-xs"
            >
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-nano px-1 py-0 h-4 font-mono",
                    String(o.side) === "BUY"
                      ? "text-emerald-400 border-emerald-400/30"
                      : "text-rose-400 border-rose-400/30",
                  )}
                >
                  {String(o.side)}
                </Badge>
                <span className="font-mono font-medium">{String(o.instrument ?? "")}</span>
              </div>
              <span className={cn("font-mono", String(o.status) === "FILLED" ? "text-emerald-400" : "text-amber-400")}>
                {String(o.status ?? "")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function HealthGridWidget(_props: WidgetComponentProps) {
  const ctx = useOverviewDataSafe();
  const queryClient = useQueryClient();
  const [sortKey, setSortKey] = React.useState<string | null>("status");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc" | null>("asc");

  const allMockServices = React.useMemo(() => ctx?.allMockServices ?? [], [ctx?.allMockServices]);
  const coreLoading = ctx?.coreLoading ?? false;

  const handleRefresh = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["service-health"] });
  }, [queryClient]);

  const handleSort = React.useCallback(
    (key: string) => {
      if (sortKey === key) {
        setSortDir((prev) => (prev === "asc" ? "desc" : prev === "desc" ? null : "asc"));
        if (sortDir === "desc") setSortKey(null);
      } else {
        setSortKey(key);
        setSortDir("asc");
      }
    },
    [sortKey, sortDir],
  );

  const sortedServices = React.useMemo(() => {
    let sorted = [...allMockServices];

    if (sortKey && sortDir) {
      sorted.sort((a, b) => {
        let av: string | number = "";
        let bv: string | number = "";

        if (sortKey === "name") {
          av = a.name;
          bv = b.name;
        } else if (sortKey === "freshness") {
          av = a.freshness;
          bv = b.freshness;
        } else if (sortKey === "sla") {
          av = a.sla;
          bv = b.sla;
        } else if (sortKey === "status") {
          av = getHealthOrder(a.freshness, a.sla);
          bv = getHealthOrder(b.freshness, b.sla);
        }

        const aNum = Number(av);
        const bNum = Number(bv);
        const result = !isNaN(aNum) && !isNaN(bNum) ? aNum - bNum : String(av).localeCompare(String(bv));
        return sortDir === "desc" ? -result : result;
      });
    } else {
      sorted.sort((a, b) => {
        const aOrder = getHealthOrder(a.freshness, a.sla);
        const bOrder = getHealthOrder(b.freshness, b.sla);
        return aOrder - bOrder;
      });
    }

    return sorted;
  }, [allMockServices, sortKey, sortDir]);

  const columns = [
    {
      key: "name",
      label: "Service",
      accessor: (row: ServiceHealth) => row.name,
      sortable: true,
      minWidth: 160,
    },
    {
      key: "freshness",
      label: "Freshness",
      accessor: (row: ServiceHealth) => formatFreshness(row.freshness),
      sortable: true,
      align: "right" as const,
      minWidth: 80,
    },
    {
      key: "sla",
      label: "SLA",
      accessor: (row: ServiceHealth) => formatFreshness(row.sla),
      sortable: true,
      align: "right" as const,
      minWidth: 70,
    },
    {
      key: "status",
      label: "Status",
      accessor: (row: ServiceHealth) => {
        const status = getHealthStatus(row.freshness, row.sla);
        const label =
          status === "live" ? "ok" : status === "warning" ? "lag" : status === "critical" ? "STALE" : "idle";
        return (
          <div className="flex items-center justify-center gap-1.5">
            <StatusDot status={status} />
            <span className="text-xs">{label}</span>
          </div>
        );
      },
      sortable: true,
      align: "center" as const,
      minWidth: 90,
    },
  ];

  const getRowClass = (row: ServiceHealth) => {
    const status = getHealthStatus(row.freshness, row.sla);
    if (status === "warning") return "bg-[var(--status-warning)]/5";
    if (status === "critical") return "bg-[var(--status-error)]/5";
    return undefined;
  };

  if (!ctx)
    return (
      <div className="flex h-full items-center justify-center p-3 text-xs text-muted-foreground">
        Navigate to Overview tab
      </div>
    );

  return (
    <div className="flex h-full flex-col p-3">
      <div className="flex justify-end gap-1 mb-2">
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5" onClick={handleRefresh}>
          <RefreshCw className="size-3.5" />
          Refresh
        </Button>
        <Link href="/services/workspace?surface=terminal&tm=ops">
          <Button variant="ghost" size="sm" className="h-7 text-xs">
            View All
          </Button>
        </Link>
      </div>
      {coreLoading ? (
        <div className="flex items-center justify-center py-6 text-muted-foreground">
          <Spinner className="size-4 mr-2" />
        </div>
      ) : allMockServices.length === 0 ? (
        <div className="flex items-center justify-center py-6 text-muted-foreground text-xs">No services reported</div>
      ) : (
        <HealthDataTable
          columns={columns}
          data={sortedServices}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
          getRowClassName={getRowClass}
        />
      )}
    </div>
  );
}

interface HealthDataTableProps {
  columns: Array<{
    key: string;
    label: string;
    accessor: (row: ServiceHealth) => React.ReactNode;
    sortable: boolean;
    align?: "left" | "center" | "right";
    minWidth?: number;
  }>;
  data: ServiceHealth[];
  sortKey: string | null;
  sortDir: "asc" | "desc" | null;
  onSort: (key: string) => void;
  getRowClassName?: (row: ServiceHealth) => string | undefined;
}

function HealthDataTable({ columns, data, sortKey, sortDir, onSort, getRowClassName }: HealthDataTableProps) {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto border border-border rounded-lg">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-muted/50 border-b border-border/50">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-2 py-1.5 text-xs font-medium text-muted-foreground whitespace-nowrap",
                  col.sortable && "cursor-pointer select-none hover:text-foreground",
                  col.align === "right" && "text-right",
                  col.align === "center" && "text-center",
                )}
                style={col.minWidth ? { minWidth: col.minWidth } : undefined}
                onClick={() => {
                  if (col.sortable) onSort(col.key);
                }}
              >
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  {col.sortable && sortKey === col.key && sortDir === "asc" && (
                    <svg className="size-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  )}
                  {col.sortable && sortKey === col.key && sortDir === "desc" && (
                    <svg className="size-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={row.name}
              className={cn("border-b border-border/30 hover:bg-muted/20 transition-colors", getRowClassName?.(row))}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    "px-2 py-1.5 text-xs",
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center",
                  )}
                >
                  {col.accessor(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
