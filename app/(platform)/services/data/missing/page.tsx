"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table";
import { WidgetScroll } from "@/components/shared/widget-scroll";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils/formatters";
import type { ColumnDef } from "@tanstack/react-table";
import { Download, RefreshCw, Search } from "lucide-react";
import * as React from "react";
import { MOCK_GAPS, type DataGap } from "@/lib/mocks/fixtures/data-pages";

const gapColumns: ColumnDef<DataGap>[] = [
  {
    id: "severity",
    header: "Severity",
    cell: ({ row }) => {
      const g = row.original;
      return (
        <Badge
          variant="outline"
          className={cn(
            "text-[9px]",
            g.severity === "critical"
              ? "text-rose-400 border-rose-400/30"
              : g.severity === "warning"
                ? "text-amber-400 border-amber-400/30"
                : "text-sky-400 border-sky-400/30",
          )}
        >
          {g.severity.toUpperCase()}
        </Badge>
      );
    },
  },
  {
    accessorKey: "instrument",
    header: "Instrument",
    cell: ({ row }) => <span className="font-mono font-medium text-xs">{row.original.instrument}</span>,
  },
  {
    accessorKey: "venue",
    header: "Venue",
    cell: ({ row }) => <span className="text-muted-foreground text-xs">{row.original.venue}</span>,
  },
  {
    accessorKey: "dataType",
    header: "Data Type",
    cell: ({ row }) => <span className="text-xs">{row.original.dataType}</span>,
  },
  {
    id: "category",
    header: "Category",
    cell: ({ row }) => {
      const g = row.original;
      return (
        <span
          className={cn(
            "text-[10px]",
            g.category === "raw" ? "text-sky-400" : g.category === "processed" ? "text-violet-400" : "text-amber-400",
          )}
        >
          {g.category}
        </span>
      );
    },
  },
  {
    accessorKey: "gapStart",
    header: "Gap Start",
    cell: ({ row }) => <span className="font-mono text-muted-foreground text-xs">{row.original.gapStart}</span>,
  },
  {
    accessorKey: "gapEnd",
    header: "Gap End",
    cell: ({ row }) => <span className="font-mono text-muted-foreground text-xs">{row.original.gapEnd}</span>,
  },
  {
    accessorKey: "durationHours",
    header: () => <span className="block w-full text-right">Duration</span>,
    cell: ({ row }) => (
      <span className="block text-right font-mono text-xs">{formatNumber(row.original.durationHours, 2)}h</span>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const g = row.original;
      return (
        <Badge
          variant="outline"
          className={cn(
            "text-[9px]",
            g.status === "open"
              ? "text-rose-400 border-rose-400/30"
              : g.status === "backfilling"
                ? "text-sky-400 border-sky-400/30"
                : "text-emerald-400 border-emerald-400/30",
          )}
        >
          {g.status}
        </Badge>
      );
    },
  },
  {
    id: "action",
    header: "Action",
    cell: ({ row }) =>
      row.original.status === "open" ? (
        <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] gap-1">
          <Download className="size-3" /> Backfill
        </Button>
      ) : null,
  },
];

export default function MissingDataPage() {
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [severityFilter, setSeverityFilter] = React.useState("all");
  const [categoryFilter, setCategoryFilter] = React.useState("all");
  const [searchQuery, setSearchQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    let result = MOCK_GAPS;
    if (statusFilter !== "all") result = result.filter((g) => g.status === statusFilter);
    if (severityFilter !== "all") result = result.filter((g) => g.severity === severityFilter);
    if (categoryFilter !== "all") result = result.filter((g) => g.category === categoryFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (g) =>
          g.instrument.toLowerCase().includes(q) ||
          g.venue.toLowerCase().includes(q) ||
          g.dataType.toLowerCase().includes(q),
      );
    }
    return result;
  }, [statusFilter, severityFilter, categoryFilter, searchQuery]);

  const openCount = MOCK_GAPS.filter((g) => g.status === "open").length;
  const backfillingCount = MOCK_GAPS.filter((g) => g.status === "backfilling").length;
  const criticalCount = MOCK_GAPS.filter((g) => g.severity === "critical" && g.status === "open").length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Missing Data & Gap Detection</h2>
          <p className="text-sm text-muted-foreground">
            Real-time tracking across raw, processed, and derived data pipelines
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5">
          <RefreshCw className="size-3.5" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-semibold text-rose-400">{criticalCount}</p>
            <p className="text-xs text-muted-foreground">Critical Open</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-semibold text-amber-400">{openCount}</p>
            <p className="text-xs text-muted-foreground">Total Open</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-semibold text-sky-400">{backfillingCount}</p>
            <p className="text-xs text-muted-foreground">Backfilling</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-semibold">{MOCK_GAPS.length}</p>
            <p className="text-xs text-muted-foreground">Total Gaps (24h)</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Tabs value={categoryFilter} onValueChange={setCategoryFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="raw">Raw</TabsTrigger>
            <TabsTrigger value="processed">Processed</TabsTrigger>
            <TabsTrigger value="derived">Derived</TabsTrigger>
          </TabsList>
        </Tabs>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-8 px-2 text-xs rounded-md border border-border bg-background"
        >
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="backfilling">Backfilling</option>
          <option value="resolved">Resolved</option>
        </select>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="h-8 px-2 text-xs rounded-md border border-border bg-background"
        >
          <option value="all">All Severity</option>
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>
        <div className="relative ml-auto">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 w-40 pl-8 pr-3 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0 pt-4 px-4 pb-4">
          <WidgetScroll axes="horizontal" scrollbarSize="thin">
            <DataTable
              columns={gapColumns}
              data={filtered}
              enableColumnVisibility={false}
              emptyMessage="No gaps match the current filters."
            />
          </WidgetScroll>
        </CardContent>
      </Card>
    </div>
  );
}
