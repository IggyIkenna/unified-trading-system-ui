"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils/formatters";
import type { ColumnDef } from "@tanstack/react-table";
import { Download, RefreshCw, Search } from "lucide-react";
import * as React from "react";

interface DataGap {
  id: string;
  instrument: string;
  venue: string;
  dataType: string;
  gapStart: string;
  gapEnd: string;
  durationHours: number;
  severity: "critical" | "warning" | "info";
  status: "open" | "backfilling" | "resolved";
  category: "raw" | "processed" | "derived";
}

const MOCK_GAPS: DataGap[] = [
  {
    id: "g1",
    instrument: "BTC-PERP",
    venue: "Binance",
    dataType: "Market Ticks",
    gapStart: "2026-03-22 08:00",
    gapEnd: "2026-03-22 08:45",
    durationHours: 0.75,
    severity: "critical",
    status: "open",
    category: "raw",
  },
  {
    id: "g2",
    instrument: "ETH-USDT",
    venue: "OKX",
    dataType: "1h Candles",
    gapStart: "2026-03-21 14:00",
    gapEnd: "2026-03-21 16:00",
    durationHours: 2,
    severity: "warning",
    status: "backfilling",
    category: "processed",
  },
  {
    id: "g3",
    instrument: "SOL-USDT",
    venue: "Hyperliquid",
    dataType: "Order Book",
    gapStart: "2026-03-22 03:00",
    gapEnd: "2026-03-22 03:30",
    durationHours: 0.5,
    severity: "warning",
    status: "open",
    category: "raw",
  },
  {
    id: "g4",
    instrument: "BTC-USDT",
    venue: "Deribit",
    dataType: "Funding Rates",
    gapStart: "2026-03-20 00:00",
    gapEnd: "2026-03-20 08:00",
    durationHours: 8,
    severity: "critical",
    status: "resolved",
    category: "raw",
  },
  {
    id: "g5",
    instrument: "ETH-PERP",
    venue: "Binance",
    dataType: "ML Signals",
    gapStart: "2026-03-22 09:00",
    gapEnd: "—",
    durationHours: 3,
    severity: "critical",
    status: "open",
    category: "derived",
  },
  {
    id: "g6",
    instrument: "AVAX-USDT",
    venue: "Bybit",
    dataType: "5m Candles",
    gapStart: "2026-03-21 22:00",
    gapEnd: "2026-03-22 02:00",
    durationHours: 4,
    severity: "warning",
    status: "resolved",
    category: "processed",
  },
  {
    id: "g7",
    instrument: "BNB-USDT",
    venue: "Binance",
    dataType: "Features",
    gapStart: "2026-03-22 07:30",
    gapEnd: "2026-03-22 08:00",
    durationHours: 0.5,
    severity: "info",
    status: "backfilling",
    category: "derived",
  },
  {
    id: "g8",
    instrument: "DOT-USDT",
    venue: "OKX",
    dataType: "Trades",
    gapStart: "2026-03-21 18:00",
    gapEnd: "2026-03-21 19:30",
    durationHours: 1.5,
    severity: "warning",
    status: "resolved",
    category: "raw",
  },
  {
    id: "g9",
    instrument: "LINK-USDT",
    venue: "Binance",
    dataType: "Strategy Signals",
    gapStart: "2026-03-22 06:00",
    gapEnd: "—",
    durationHours: 6,
    severity: "critical",
    status: "open",
    category: "derived",
  },
  {
    id: "g10",
    instrument: "XRP-USDT",
    venue: "Bybit",
    dataType: "Risk Metrics",
    gapStart: "2026-03-22 10:00",
    gapEnd: "—",
    durationHours: 2,
    severity: "warning",
    status: "open",
    category: "derived",
  },
  {
    id: "g11",
    instrument: "DOGE-USDT",
    venue: "OKX",
    dataType: "P&L Attribution",
    gapStart: "2026-03-21 23:00",
    gapEnd: "2026-03-22 01:00",
    durationHours: 2,
    severity: "info",
    status: "resolved",
    category: "derived",
  },
  {
    id: "g12",
    instrument: "ADA-USDT",
    venue: "Binance",
    dataType: "Execution Data",
    gapStart: "2026-03-22 04:00",
    gapEnd: "2026-03-22 05:00",
    durationHours: 1,
    severity: "info",
    status: "backfilling",
    category: "derived",
  },
];

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

      <div className="grid grid-cols-4 gap-4">
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
          <DataTable
            columns={gapColumns}
            data={filtered}
            enableColumnVisibility={false}
            emptyMessage="No gaps match the current filters."
          />
        </CardContent>
      </Card>
    </div>
  );
}
