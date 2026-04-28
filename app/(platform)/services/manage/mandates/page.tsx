"use client";

import { DataTable } from "@/components/shared/data-table";
import { ExportDropdown } from "@/components/shared/export-dropdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api/fetch";
import { FALLBACK_MANDATES, type Mandate } from "@/lib/mocks/fixtures/manage-data";
import { isMockDataMode } from "@/lib/runtime/data-mode";
import { formatNumber } from "@/lib/utils/formatters";
import { useQuery } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, ChevronDown, ChevronRight, ClipboardCheck, FileText, RefreshCw, Target } from "lucide-react";
import * as React from "react";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const STATUS_STYLES: Record<Mandate["status"], string> = {
  active: "bg-emerald-500/20 text-emerald-400",
  breached: "bg-red-500/20 text-red-400",
  "under-review": "bg-amber-500/20 text-amber-400",
};

function driftColor(drift: number): string {
  const abs = Math.abs(drift);
  if (abs > 3) return "text-red-400";
  if (abs > 1.5) return "text-amber-400";
  return "text-muted-foreground";
}

/* ------------------------------------------------------------------ */
/*  Column definitions                                                 */
/* ------------------------------------------------------------------ */

function mandateColumns(
  expandedId: string | null,
  setExpandedId: React.Dispatch<React.SetStateAction<string | null>>,
): ColumnDef<Mandate, unknown>[] {
  return [
    {
      id: "expand",
      header: "",
      enableSorting: false,
      cell: ({ row }) => {
        const m = row.original;
        const isExpanded = expandedId === m.id;
        return (
          <button
            type="button"
            className="p-0 bg-transparent border-none cursor-pointer"
            onClick={() => setExpandedId(isExpanded ? null : m.id)}
          >
            {isExpanded ? (
              <ChevronDown className="size-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="size-4 text-muted-foreground" />
            )}
          </button>
        );
      },
      meta: { className: "w-8" },
    },
    {
      accessorKey: "client",
      header: "Client",
      cell: ({ getValue }) => <span className="font-medium">{getValue<string>()}</span>,
    },
    {
      accessorKey: "strategy",
      header: "Strategy",
    },
    {
      accessorKey: "assetClass",
      header: "Asset Class",
    },
    {
      accessorKey: "allocationTarget",
      header: "Target %",
      cell: ({ getValue }) => <span className="text-right font-mono block">{formatNumber(getValue<number>(), 1)}</span>,
    },
    {
      accessorKey: "currentAllocation",
      header: "Current %",
      cell: ({ getValue }) => <span className="text-right font-mono block">{formatNumber(getValue<number>(), 1)}</span>,
    },
    {
      accessorKey: "drift",
      header: "Drift",
      cell: ({ getValue }) => {
        const drift = getValue<number>();
        return (
          <span className={`text-right font-mono block ${driftColor(drift)}`}>
            {drift > 0 ? "+" : ""}
            {formatNumber(drift, 1)}
          </span>
        );
      },
    },
    {
      accessorKey: "maxDrawdownLimit",
      header: "Max DD Limit",
      cell: ({ getValue }) => <span className="text-right font-mono block">{getValue<number>()}%</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => {
        const status = getValue<Mandate["status"]>();
        return <Badge className={STATUS_STYLES[status]}>{status === "under-review" ? "under review" : status}</Badge>;
      },
    },
    {
      accessorKey: "lastReviewed",
      header: "Last Reviewed",
      cell: ({ getValue }) => <span className="text-muted-foreground">{getValue<string>()}</span>,
    },
  ];
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ManageMandatesPage() {
  const { user, token } = useAuth();
  const mockDataMode = isMockDataMode();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["mandates", user?.id],
    queryFn: () => apiFetch("/api/config/mandates", token),
    enabled: !!user,
  });

  const mandates: Mandate[] = React.useMemo(() => {
    const apiRows = (data as Record<string, unknown>)?.data as Mandate[] | undefined;
    if (Array.isArray(apiRows) && apiRows.length > 0) return apiRows;
    return mockDataMode ? FALLBACK_MANDATES : [];
  }, [data, mockDataMode]);

  // Filters
  const [clientFilter, setClientFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [assetClassFilter, setAssetClassFilter] = React.useState("all");

  // Expandable row
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const clients = React.useMemo(() => [...new Set(mandates.map((m) => m.client))], [mandates]);
  const assetClasses = React.useMemo(() => [...new Set(mandates.map((m) => m.assetClass))], [mandates]);

  const filtered = React.useMemo(() => {
    return mandates.filter((m) => {
      if (clientFilter !== "all" && m.client !== clientFilter) return false;
      if (statusFilter !== "all" && m.status !== statusFilter) return false;
      if (assetClassFilter !== "all" && m.assetClass !== assetClassFilter) return false;
      return true;
    });
  }, [mandates, clientFilter, statusFilter, assetClassFilter]);

  const expandedMandate = React.useMemo(
    () => filtered.find((m) => m.id === expandedId) ?? null,
    [filtered, expandedId],
  );

  // Summary counts
  const totalCount = mandates.length;
  const activeCount = mandates.filter((m) => m.status === "active").length;
  const breachedCount = mandates.filter((m) => m.status === "breached").length;
  const reviewCount = mandates.filter((m) => m.status === "under-review").length;

  /* Loading state */
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="pt-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  /* Error state */
  if (isError) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
              <AlertTriangle className="size-10 text-destructive" />
              <div>
                <p className="font-semibold">Failed to load mandates</p>
                <p className="text-sm text-muted-foreground mt-1">An error occurred while fetching mandate data.</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="mr-2 size-4" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-sky-500/10 p-2.5">
                <FileText className="size-5 text-sky-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Mandates</p>
                <p className="text-2xl font-bold font-mono">{totalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-500/10 p-2.5">
                <Target className="size-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active</p>
                <p className="text-2xl font-bold font-mono">{activeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-500/10 p-2.5">
                <AlertTriangle className="size-5 text-red-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Breached</p>
                <p className="text-2xl font-bold font-mono">{breachedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-500/10 p-2.5">
                <ClipboardCheck className="size-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Under Review</p>
                <p className="text-2xl font-bold font-mono">{reviewCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={clientFilter} onValueChange={setClientFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Client" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {clients.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="breached">Breached</SelectItem>
            <SelectItem value="under-review">Under Review</SelectItem>
          </SelectContent>
        </Select>

        <Select value={assetClassFilter} onValueChange={setAssetClassFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Asset Class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Asset Classes</SelectItem>
            {assetClasses.map((ac) => (
              <SelectItem key={ac} value={ac}>
                {ac}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <ExportDropdown
          data={filtered}
          columns={[
            { key: "id", header: "ID" },
            { key: "client", header: "Client" },
            { key: "strategy", header: "Strategy" },
            { key: "assetClass", header: "Asset Class" },
            {
              key: "allocationTarget",
              header: "Target %",
              format: (v: unknown) => formatNumber(Number(v), 1),
            },
            {
              key: "currentAllocation",
              header: "Current %",
              format: (v: unknown) => formatNumber(Number(v), 1),
            },
            {
              key: "drift",
              header: "Drift",
              format: (v: unknown) => (Number(v) > 0 ? "+" : "") + formatNumber(Number(v), 1),
            },
            {
              key: "maxDrawdownLimit",
              header: "Max DD Limit",
              format: (v: unknown) => `${Number(v)}%`,
            },
            { key: "status", header: "Status" },
            { key: "lastReviewed", header: "Last Reviewed" },
          ]}
          filename="mandates"
        />
      </div>

      {/* Mandates table */}
      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={mandateColumns(expandedId, setExpandedId)}
            data={filtered}
            enableSorting
            enableColumnVisibility={false}
            emptyMessage="No mandates match the current filters."
          />
        </CardContent>
      </Card>

      {/* Expanded detail panel */}
      {expandedMandate && (
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Allocation limits */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Allocation Limits
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {Object.entries(expandedMandate.detail.allocationLimits).map(([cls, range]) => (
                    <div key={cls} className="flex items-center justify-between text-sm">
                      <span>{cls}</span>
                      <span className="font-mono text-muted-foreground">
                        {range.min}%-{range.max}%
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Position limits */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Position Limits
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span>Max Single Position</span>
                    <span className="font-mono">{expandedMandate.detail.positionLimits.maxSinglePosition}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Max Sector Exposure</span>
                    <span className="font-mono">{expandedMandate.detail.positionLimits.maxSectorExposure}%</span>
                  </div>
                </CardContent>
              </Card>

              {/* Drawdown thresholds */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Drawdown Thresholds
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span>Soft Limit</span>
                    <span className="font-mono text-amber-400">{expandedMandate.detail.drawdownThresholds.soft}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Hard Limit</span>
                    <span className="font-mono text-red-400">{expandedMandate.detail.drawdownThresholds.hard}%</span>
                  </div>
                </CardContent>
              </Card>

              {/* Fee structure */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Fee Structure
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span>Management Fee</span>
                    <span className="font-mono">{expandedMandate.detail.feeStructure.managementFee}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Performance Fee</span>
                    <span className="font-mono">{expandedMandate.detail.feeStructure.performanceFee}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Hurdle Rate</span>
                    <span className="font-mono">{expandedMandate.detail.feeStructure.hurdleRate}%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
